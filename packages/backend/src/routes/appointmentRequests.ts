import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Appointment } from '../entities/Appointment';
import { AppointmentRequest } from '../entities/AppointmentRequest';
import { Client } from '../entities/Client';
import { isGoogleInvalidGrant, syncAppointmentToGoogle } from '../google';
import { GoogleCalendarConnection } from '../entities/GoogleCalendarConnection';
import { sendAppointmentConfirmationEmail } from '../email';

function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase();
}

export function createAppointmentRequestRouter(dataSource: DataSource): Router {
  const router = Router();
  const requests = dataSource.getRepository(AppointmentRequest);
  const appointments = dataSource.getRepository(Appointment);
  const clients = dataSource.getRepository(Client);
  const connections = dataSource.getRepository(GoogleCalendarConnection);

  router.get('/', async (_request, response) => {
    response.json(await requests.find({ where: { ownerId: response.locals.user.id, status: 'pending' }, order: { startsAt: 'ASC' } }));
  });

  router.post('/:id/reject', async (request, response) => {
    const appointmentRequest = await requests.findOneBy({ id: Number(request.params.id), ownerId: response.locals.user.id });
    if (!appointmentRequest) return response.status(404).json({ message: 'Request not found' });
    if (appointmentRequest.status !== 'pending') return response.status(409).json({ message: 'Request is no longer pending' });
    appointmentRequest.status = 'rejected';
    await requests.save(appointmentRequest);
    response.status(204).send();
  });

  router.post('/:id/confirm', async (request, response) => {
    const appointmentRequest = await requests.findOneBy({ id: Number(request.params.id), ownerId: response.locals.user.id });
    if (!appointmentRequest) return response.status(404).json({ message: 'Request not found' });
    if (appointmentRequest.status !== 'pending') return response.status(409).json({ message: 'Request is no longer pending' });
    const conflict = await appointments.createQueryBuilder('appointment')
      .where('appointment.ownerId = :ownerId', { ownerId: response.locals.user.id })
      .andWhere('appointment.status = :status', { status: 'scheduled' })
      .andWhere('appointment.startsAt < :endsAt AND appointment.endsAt > :startsAt', { startsAt: appointmentRequest.startsAt, endsAt: appointmentRequest.endsAt })
      .getOne();
    if (conflict) return response.status(409).json({ message: 'The requested time is no longer available' });

    const requesterEmail = normalizeEmail(appointmentRequest.requesterEmail);
    const client = await clients.createQueryBuilder('client')
      .where('client.ownerId = :ownerId', { ownerId: response.locals.user.id })
      .andWhere('LOWER(TRIM(client.email)) = :email', { email: requesterEmail })
      .getOne() ?? await clients.save(clients.create({
        ownerId: response.locals.user.id,
        name: appointmentRequest.requesterName,
        email: requesterEmail,
        phone: appointmentRequest.requesterPhone,
      }));
    const appointment = await appointments.save(appointments.create({
      ownerId: response.locals.user.id,
      clientId: client.id,
      client,
      title: `Turno con ${appointmentRequest.requesterName}`,
      description: appointmentRequest.notes,
      startsAt: appointmentRequest.startsAt,
      endsAt: appointmentRequest.endsAt,
      status: 'scheduled',
      syncStatus: 'pending',
    }));
    const connection = await connections.findOneBy({ ownerId: appointment.ownerId });
    if (connection) {
      try {
        appointment.googleEventId = await syncAppointmentToGoogle(connection, appointment);
        appointment.syncStatus = 'synced';
      } catch (error) {
        appointment.syncStatus = 'failed';
        if (isGoogleInvalidGrant(error)) {
          await connections.delete({ ownerId: appointment.ownerId });
          appointment.syncError = 'La conexión con Google expiró. Volvé a conectar Google Calendar desde Configuración.';
        } else {
          appointment.syncError = error instanceof Error ? error.message : 'Google Calendar synchronization failed';
        }
      }
      await appointments.save(appointment);
    } else {
      appointment.syncStatus = 'not_connected';
      await appointments.save(appointment);
    }
    appointmentRequest.status = 'confirmed';
    appointmentRequest.appointmentId = appointment.id;
    await requests.save(appointmentRequest);
    let emailSent = false;
    try {
      emailSent = await sendAppointmentConfirmationEmail({ recipient: requesterEmail, requesterName: appointmentRequest.requesterName, title: appointment.title, startsAt: appointment.startsAt, endsAt: appointment.endsAt });
    } catch (error) {
      console.error('Appointment confirmation email failed', error);
    }
    response.status(201).json({ ...appointment, notification: { emailSent } });
  });

  return router;
}
