import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { authenticateUser, createToken } from '../auth';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../auth';
import { GoogleCalendarConnection } from '../entities/GoogleCalendarConnection';
import { User } from '../entities/User';
import { LandingService } from '../entities/LandingService';
import { createGoogleOAuthClient, decryptToken, encryptToken, getGoogleAuthorizationUrl } from '../google';

type GoogleReview = { author: string; text: string; rating: number; url?: string | null };

function parseReviews(value?: string | null): GoogleReview[] {
  if (!value) return [];
  try {
    const reviews = JSON.parse(value) as unknown;
    return Array.isArray(reviews) ? reviews as GoogleReview[] : [];
  } catch {
    return [];
  }
}

export function createAuthRouter(dataSource: DataSource): Router {
  const router = Router();
  const connectionRepository = dataSource.getRepository(GoogleCalendarConnection);
  const landingServiceRepository = dataSource.getRepository(LandingService);

  async function profileResponse(user: User) {
    const services = await landingServiceRepository.find({ where: { ownerId: user.id }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return { username: user.username, publicBrandName: user.publicBrandName, publicSlug: user.publicSlug || user.username, brandLogo: user.brandLogo, publicDescription: user.publicDescription, publicBookingEnabled: user.publicBookingEnabled, landingTitle: user.landingTitle, landingAbout: user.landingAbout, heroTitle: user.heroTitle, heroDescription: user.heroDescription, heroImage: user.heroImage, aboutTitle: user.aboutTitle, aboutDescription: user.aboutDescription, googleReviews: parseReviews(user.googleReviews), landingServices: services.map(({ id, name, description, image, sortOrder }) => ({ id, name, description, image, sortOrder })) };
  }

  router.post('/login', async (request, response) => {
    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      response.status(400).json({ message: 'username and password are required' });
      return;
    }

    const user = await authenticateUser(dataSource, username, password);
    if (!user) {
      response.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    response.json({
      token: createToken(user),
      user: { id: user.id, username: user.username, role: user.role },
    });
  });

  router.put('/password', requireAuth, async (request, response) => {
    const { currentPassword, newPassword } = request.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      response.status(400).json({ message: 'currentPassword and a new password of at least 6 characters are required' });
      return;
    }

    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: response.locals.user.id });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      response.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await userRepository.save(user);
    response.status(204).send();
  });

  router.get('/profile', requireAuth, async (_request, response) => {
    const user = await dataSource.getRepository(User).findOneBy({ id: response.locals.user.id });
    if (!user) return response.status(404).json({ message: 'User not found' });
    response.json(await profileResponse(user));
  });

  router.put('/profile', requireAuth, async (request, response) => {
    const { aboutDescription, aboutTitle, brandLogo, googleReviews, heroDescription, heroImage, heroTitle, landingAbout, landingServices, landingTitle, publicBrandName, publicDescription, publicBookingEnabled, publicSlug } = request.body as { aboutDescription?: string | null; aboutTitle?: string | null; brandLogo?: string | null; googleReviews?: GoogleReview[]; heroDescription?: string | null; heroImage?: string | null; heroTitle?: string | null; landingAbout?: string | null; landingServices?: Array<{ name?: string; description?: string; image?: string | null }>; landingTitle?: string | null; publicBrandName?: string | null; publicDescription?: string | null; publicBookingEnabled?: boolean; publicSlug?: string | null };
    if (publicDescription !== undefined && publicDescription !== null && typeof publicDescription !== 'string') {
      return response.status(400).json({ message: 'publicDescription must be text' });
    }
    if (publicBookingEnabled !== undefined && typeof publicBookingEnabled !== 'boolean') {
      return response.status(400).json({ message: 'publicBookingEnabled must be boolean' });
    }
    if (landingTitle !== undefined && landingTitle !== null && typeof landingTitle !== 'string') {
      return response.status(400).json({ message: 'landingTitle must be text' });
    }
    if (landingAbout !== undefined && landingAbout !== null && typeof landingAbout !== 'string') {
      return response.status(400).json({ message: 'landingAbout must be text' });
    }
    if (heroTitle !== undefined && heroTitle !== null && typeof heroTitle !== 'string') return response.status(400).json({ message: 'heroTitle must be text' });
    if (heroDescription !== undefined && heroDescription !== null && typeof heroDescription !== 'string') return response.status(400).json({ message: 'heroDescription must be text' });
    if (heroImage !== undefined && heroImage !== null && typeof heroImage !== 'string') return response.status(400).json({ message: 'heroImage must be text' });
    if (brandLogo !== undefined && brandLogo !== null && typeof brandLogo !== 'string') return response.status(400).json({ message: 'brandLogo must be text' });
    if (publicBrandName !== undefined && publicBrandName !== null && typeof publicBrandName !== 'string') return response.status(400).json({ message: 'publicBrandName must be text' });
    if (publicSlug !== undefined && publicSlug !== null && (typeof publicSlug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publicSlug.trim()))) return response.status(400).json({ message: 'publicSlug must contain only lowercase letters, numbers, and hyphens' });
    if (aboutTitle !== undefined && aboutTitle !== null && typeof aboutTitle !== 'string') return response.status(400).json({ message: 'aboutTitle must be text' });
    if (aboutDescription !== undefined && aboutDescription !== null && typeof aboutDescription !== 'string') return response.status(400).json({ message: 'aboutDescription must be text' });
    if (googleReviews !== undefined && (!Array.isArray(googleReviews) || googleReviews.length > 20 || googleReviews.some((review) => !review || typeof review.author !== 'string' || !review.author.trim() || typeof review.text !== 'string' || !review.text.trim() || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 || (review.url !== undefined && review.url !== null && (typeof review.url !== 'string' || !/^https?:\/\//i.test(review.url.trim())))))) return response.status(400).json({ message: 'googleReviews must contain valid author, text, rating, and optional URL values' });
    if (landingServices !== undefined && (!Array.isArray(landingServices) || landingServices.some((service) => !service?.name?.trim() || !service.description?.trim() || (service.image !== undefined && service.image !== null && typeof service.image !== 'string')))) return response.status(400).json({ message: 'landingServices must contain name and description' });
    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: response.locals.user.id });
    if (!user) return response.status(404).json({ message: 'User not found' });
    const normalizedSlug = publicSlug !== undefined ? publicSlug?.trim() || user.username : user.publicSlug || user.username;
    if (normalizedSlug === 'admin') return response.status(409).json({ message: 'That public URL is reserved' });
    const slugOwner = await userRepository.findOneBy({ publicSlug: normalizedSlug });
    const usernameOwner = await userRepository.findOneBy({ username: normalizedSlug });
    if ((slugOwner && slugOwner.id !== user.id) || (usernameOwner && usernameOwner.id !== user.id)) return response.status(409).json({ message: 'That public URL is already in use' });
    user.publicBrandName = publicBrandName !== undefined ? publicBrandName?.trim() || null : user.publicBrandName;
    user.publicSlug = normalizedSlug;
    user.brandLogo = brandLogo !== undefined ? brandLogo?.trim() || null : user.brandLogo;
    if (publicDescription !== undefined) user.publicDescription = publicDescription?.trim() || null;
    if (publicBookingEnabled !== undefined) user.publicBookingEnabled = publicBookingEnabled;
    if (landingTitle !== undefined) user.landingTitle = landingTitle?.trim() || null;
    if (landingAbout !== undefined) user.landingAbout = landingAbout?.trim() || null;
    if (heroTitle !== undefined) user.heroTitle = heroTitle?.trim() || null;
    if (heroDescription !== undefined) user.heroDescription = heroDescription?.trim() || null;
    if (heroImage !== undefined) user.heroImage = heroImage?.trim() || null;
    if (aboutTitle !== undefined) user.aboutTitle = aboutTitle?.trim() || null;
    if (aboutDescription !== undefined) user.aboutDescription = aboutDescription?.trim() || null;
    if (googleReviews !== undefined) user.googleReviews = JSON.stringify(googleReviews.map((review) => ({ author: review.author.trim(), text: review.text.trim(), rating: review.rating, url: review.url?.trim() || null })));
    await userRepository.save(user);
    if (landingServices !== undefined) {
      await landingServiceRepository.delete({ ownerId: user.id });
      await landingServiceRepository.save(landingServices.map((service, index) => landingServiceRepository.create({
        ownerId: user.id,
        name: service.name!.trim(),
        description: service.description!.trim(),
        image: service.image?.trim() || null,
        sortOrder: index,
      })));
    }
    response.json(await profileResponse(user));
  });

  router.get('/google', requireAuth, (request, response) => {
    const state = jwt.sign({ userId: response.locals.user.id, purpose: 'google-calendar' }, process.env.JWT_SECRET ?? 'development-secret-change-me', { expiresIn: '10m' });
    try {
      response.json({ url: getGoogleAuthorizationUrl(state) });
    } catch (error) {
      response.status(503).json({ message: error instanceof Error ? error.message : 'Google Calendar is not configured' });
    }
  });

  router.get('/google/callback', async (request, response) => {
    try {
      const state = jwt.verify(String(request.query.state), process.env.JWT_SECRET ?? 'development-secret-change-me') as { userId?: number; purpose?: string };
      if (state.purpose !== 'google-calendar' || !state.userId) throw new Error('Invalid OAuth state');
      const client = createGoogleOAuthClient();
      const { tokens } = await client.getToken(String(request.query.code));
      if (!tokens.access_token || !tokens.refresh_token) throw new Error('Google did not return the required tokens');
      client.setCredentials(tokens);
      const profile = await googleProfileEmail(client);
      await connectionRepository.upsert({ ownerId: state.userId, googleEmail: profile, calendarId: 'primary', accessTokenEncrypted: encryptToken(tokens.access_token), refreshTokenEncrypted: encryptToken(tokens.refresh_token), tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null }, ['ownerId']);
      response.send('<h1>Google Calendar conectado</h1><p>Ya puedes cerrar esta ventana y volver a Eldavo.</p>');
    } catch (error) {
      response.status(400).send(`<h1>No se pudo conectar Google Calendar</h1><p>${escapeHtml(error instanceof Error ? error.message : 'Error desconocido')}</p>`);
    }
  });

  router.get('/google/status', requireAuth, async (_request, response) => {
    const connection = await connectionRepository.findOneBy({ ownerId: response.locals.user.id });
    response.json(connection ? { connected: true, email: connection.googleEmail, calendarId: connection.calendarId } : { connected: false });
  });

  router.delete('/google', requireAuth, async (_request, response) => {
    await connectionRepository.delete({ ownerId: response.locals.user.id });
    response.status(204).send();
  });

  return router;
}

async function googleProfileEmail(client: ReturnType<typeof createGoogleOAuthClient>): Promise<string | null> {
  try {
    const profile = await import('googleapis').then(({ google }) => google.oauth2({ version: 'v2', auth: client }).userinfo.get());
    return profile.data.email ?? null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] as string));
}