import { Router } from 'express';
import { DataSource } from 'typeorm';
import { AppointmentRequest } from '../entities/AppointmentRequest';
import { Appointment } from '../entities/Appointment';
import { User } from '../entities/User';
import { LandingService } from '../entities/LandingService';
import { Repository } from 'typeorm';

function parseReviews(value?: string | null): Array<{ author: string; text: string; rating: number; url?: string | null }> {
  if (!value) return [];
  try {
    const reviews = JSON.parse(value) as unknown;
    return Array.isArray(reviews) ? reviews : [];
  } catch {
    return [];
  }
}

async function findPublicUser(users: Repository<User>, identifier: string) {
  return users.findOne({ where: [{ username: identifier }, { publicSlug: identifier }] });
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createPublicBookingRouter(dataSource: DataSource): Router {
  const router = Router();
  const users = dataSource.getRepository(User);
  const landingServices = dataSource.getRepository(LandingService);
  const requests = dataSource.getRepository(AppointmentRequest);
  const appointments = dataSource.getRepository(Appointment);

  router.get('/:username/availability', async (request, response) => {
    const user = await findPublicUser(users, request.params.username);
    if (!user || !user.publicBookingEnabled) return response.status(404).json({ message: 'Public booking is not available' });
    const date = typeof request.query.date === 'string' ? request.query.date : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return response.status(400).json({ message: 'date must use YYYY-MM-DD format' });
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);
    const bookedAppointments = await appointments.find({
      where: { ownerId: user.id, status: 'scheduled' },
    });
    const slots = Array.from({ length: 9 }, (_, index) => {
      const start = new Date(dayStart);
      start.setHours(9 + index, 0, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      const available = start > new Date() && !bookedAppointments.some((appointment) => appointment.startsAt < end && appointment.endsAt > start);
      return { startsAt: start.toISOString(), endsAt: end.toISOString(), available };
    }).filter((slot) => slot.startsAt >= dayStart.toISOString() && slot.startsAt <= dayEnd.toISOString());
    response.json(slots);
  });

  router.get('/:username', async (request, response) => {
    const user = await findPublicUser(users, request.params.username);
    if (!user || !user.publicBookingEnabled) return response.status(404).json({ message: 'Public booking is not available' });
    const services = await landingServices.find({ where: { ownerId: user.id }, order: { sortOrder: 'ASC', id: 'ASC' } });
    response.json({ username: user.username, publicBrandName: user.publicBrandName, publicSlug: user.publicSlug || user.username, brandLogo: user.brandLogo, description: user.publicDescription, landingTitle: user.landingTitle, landingAbout: user.landingAbout, heroTitle: user.heroTitle, heroDescription: user.heroDescription, heroImage: user.heroImage, aboutTitle: user.aboutTitle, aboutDescription: user.aboutDescription, googleReviews: parseReviews(user.googleReviews), landingServices: services.map(({ id, name, description, image, sortOrder }) => ({ id, name, description, image, sortOrder })) });
  });

  router.post('/:username/requests', async (request, response) => {
    const user = await findPublicUser(users, request.params.username);
    if (!user || !user.publicBookingEnabled) return response.status(404).json({ message: 'Public booking is not available' });
    const { name, email, phone, notes, startsAt, endsAt } = request.body as { name?: string; email?: string; phone?: string; notes?: string; startsAt?: string; endsAt?: string };
    const parsedStart = parseDate(startsAt);
    const parsedEnd = parseDate(endsAt);
    if (!name?.trim() || !email?.trim() || !parsedStart || !parsedEnd) return response.status(400).json({ message: 'name, email, startsAt, and endsAt are required' });
    if (parsedEnd <= parsedStart) return response.status(400).json({ message: 'endsAt must be after startsAt' });
    if (parsedEnd.getTime() - parsedStart.getTime() !== 60 * 60 * 1000 || parsedStart.getMinutes() !== 0 || parsedStart.getSeconds() !== 0) {
      return response.status(400).json({ message: 'Public booking requests must use one-hour slots' });
    }
    const appointmentRequest = await requests.save(requests.create({
      ownerId: user.id,
      requesterName: name.trim(),
      requesterEmail: email.trim(),
      requesterPhone: phone?.trim() || null,
      notes: notes?.trim() || null,
      startsAt: parsedStart,
      endsAt: parsedEnd,
      status: 'pending',
    }));
    response.status(201).json({ id: appointmentRequest.id, message: 'Request received' });
  });

  return router;
}
