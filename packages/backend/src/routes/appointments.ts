import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/Appointment';
import { Client } from '../entities/Client';
import { GoogleCalendarConnection } from '../entities/GoogleCalendarConnection';
import { deleteAppointmentFromGoogle, syncAppointmentToGoogle } from '../google';

const statuses: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled'];

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createAppointmentRouter(dataSource: DataSource): Router {
  const router = Router();
  const repository = dataSource.getRepository(Appointment);
  const clientRepository = dataSource.getRepository(Client);
  const connectionRepository = dataSource.getRepository(GoogleCalendarConnection);

  async function synchronize(appointment: Appointment): Promise<Appointment> {
    appointment.lastSyncAttemptAt = new Date();
    const connection = await connectionRepository.findOneBy({ ownerId: appointment.ownerId });
    if (!connection) {
      appointment.syncStatus = 'not_connected';
      appointment.syncError = null;
      return repository.save(appointment);
    }
    appointment.syncStatus = 'pending';
    await repository.save(appointment);
    try {
      appointment.googleEventId = await syncAppointmentToGoogle(connection, appointment);
      appointment.syncStatus = 'synced';
      appointment.syncError = null;
    } catch (error) {
      appointment.syncStatus = 'failed';
      appointment.syncError = error instanceof Error ? error.message : 'Google Calendar synchronization failed';
    }
    return repository.save(appointment);
  }

  router.get('/', async (request, response) => {
    const from = parseDate(request.query.from);
    const to = parseDate(request.query.to);
    const appointments = await repository.find({
      where: { ownerId: response.locals.user.id },
      relations: { client: true },
      order: { startsAt: 'ASC' },
    });
    response.json(appointments.filter((appointment) => (!from || appointment.endsAt >= from) && (!to || appointment.startsAt <= to)));
  });

  router.post('/', async (request, response) => {
    const { clientId, description, endsAt, startsAt, title } = request.body as { clientId?: number | null; description?: string; endsAt?: string; startsAt?: string; title?: string };
    const parsedStart = parseDate(startsAt);
    const parsedEnd = parseDate(endsAt);
    if (!title?.trim() || !parsedStart || !parsedEnd) return response.status(400).json({ message: 'title, startsAt, and endsAt are required' });
    if (parsedEnd <= parsedStart) return response.status(400).json({ message: 'endsAt must be after startsAt' });
    let client: Client | null = null;
    if (clientId) {
      client = await clientRepository.findOneBy({ id: clientId, ownerId: response.locals.user.id });
      if (!client) return response.status(404).json({ message: 'Client not found' });
    }
    const appointment = await repository.save(repository.create({ ownerId: response.locals.user.id, client, clientId: client?.id ?? null, title: title.trim(), description: description?.trim() || null, startsAt: parsedStart, endsAt: parsedEnd, status: 'scheduled', syncStatus: 'pending' }));
    await synchronize(appointment);
    response.status(201).json(await repository.findOne({ where: { id: appointment.id }, relations: { client: true } }));
  });

  router.patch('/:id', async (request, response) => {
    const appointment = await repository.findOneBy({ id: Number(request.params.id), ownerId: response.locals.user.id });
    if (!appointment) return response.status(404).json({ message: 'Appointment not found' });
    const { description, endsAt, startsAt, status, title } = request.body as { description?: string; endsAt?: string; startsAt?: string; status?: AppointmentStatus; title?: string };
    const nextStart = startsAt === undefined ? appointment.startsAt : parseDate(startsAt);
    const nextEnd = endsAt === undefined ? appointment.endsAt : parseDate(endsAt);
    if (!nextStart || !nextEnd || nextEnd <= nextStart) return response.status(400).json({ message: 'The appointment dates are invalid' });
    if (status !== undefined && !statuses.includes(status)) return response.status(400).json({ message: 'Invalid appointment status' });
    if (title !== undefined && !title.trim()) return response.status(400).json({ message: 'title cannot be empty' });
    appointment.startsAt = nextStart;
    appointment.endsAt = nextEnd;
    if (title !== undefined) appointment.title = title.trim();
    if (description !== undefined) appointment.description = description.trim() || null;
    if (status !== undefined) appointment.status = status;
    await repository.save(appointment);
    await synchronize(appointment);
    response.json(await repository.findOne({ where: { id: appointment.id }, relations: { client: true } }));
  });

  router.delete('/:id', async (request, response) => {
    const appointment = await repository.findOneBy({ id: Number(request.params.id), ownerId: response.locals.user.id });
    if (!appointment) return response.status(404).json({ message: 'Appointment not found' });
    const connection = await connectionRepository.findOneBy({ ownerId: appointment.ownerId });
    if (connection && appointment.googleEventId) {
      try {
        await deleteAppointmentFromGoogle(connection, appointment);
      } catch (error) {
        appointment.syncStatus = 'failed';
        appointment.syncError = error instanceof Error ? error.message : 'Google Calendar deletion failed';
        await repository.save(appointment);
        return response.status(502).json({ message: 'The appointment was not deleted because Google Calendar could not be updated', syncError: appointment.syncError });
      }
    }
    await repository.remove(appointment);
    response.status(204).send();
  });

  return router;
}