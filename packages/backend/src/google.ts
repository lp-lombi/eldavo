import crypto from 'node:crypto';
import { google } from 'googleapis';
import { Appointment } from './entities/Appointment';
import { GoogleCalendarConnection } from './entities/GoogleCalendarConnection';

const googleScopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
];

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(requiredEnvironment('GOOGLE_CLIENT_ID'), requiredEnvironment('GOOGLE_CLIENT_SECRET'), requiredEnvironment('GOOGLE_REDIRECT_URI'));
}

export function getGoogleAuthorizationUrl(state: string): string {
  return createGoogleOAuthClient().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: googleScopes, state });
}

export function encryptToken(token: string): string {
  const key = Buffer.from(requiredEnvironment('GOOGLE_TOKEN_ENCRYPTION_KEY'), 'hex');
  if (key.length !== 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes in hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptToken(value: string): string {
  const key = Buffer.from(requiredEnvironment('GOOGLE_TOKEN_ENCRYPTION_KEY'), 'hex');
  const [ivHex, tagHex, encryptedHex] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}

export async function syncAppointmentToGoogle(connection: GoogleCalendarConnection, appointment: Appointment): Promise<string> {
  const client = createGoogleOAuthClient();
  client.setCredentials({ access_token: decryptToken(connection.accessTokenEncrypted), refresh_token: decryptToken(connection.refreshTokenEncrypted) });
  const calendar = google.calendar({ version: 'v3', auth: client });
  const event = {
    summary: appointment.title,
    description: appointment.description ?? undefined,
    start: { dateTime: appointment.startsAt.toISOString() },
    end: { dateTime: appointment.endsAt.toISOString() },
    status: appointment.status === 'cancelled' ? 'cancelled' : 'confirmed',
  } as const;
  if (appointment.googleEventId) {
    const result = await calendar.events.update({ calendarId: connection.calendarId, eventId: appointment.googleEventId, requestBody: event });
    return result.data.id ?? appointment.googleEventId;
  }
  const result = await calendar.events.insert({ calendarId: connection.calendarId, requestBody: event });
  if (!result.data.id) throw new Error('Google did not return an event id');
  return result.data.id;
}

export async function deleteAppointmentFromGoogle(connection: GoogleCalendarConnection, appointment: Appointment): Promise<void> {
  if (!appointment.googleEventId) return;
  const client = createGoogleOAuthClient();
  client.setCredentials({ access_token: decryptToken(connection.accessTokenEncrypted), refresh_token: decryptToken(connection.refreshTokenEncrypted) });
  await google.calendar({ version: 'v3', auth: client }).events.delete({ calendarId: connection.calendarId, eventId: appointment.googleEventId });
}

export function isGoogleInvalidGrant(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { message?: unknown; response?: { data?: { error?: unknown } } };
  return candidate.response?.data?.error === 'invalid_grant' || (typeof candidate.message === 'string' && candidate.message.includes('invalid_grant'));
}

export { googleScopes };