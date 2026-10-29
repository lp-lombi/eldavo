import { Platform } from 'react-native';

export type User = { id: number; username: string; role: string };
export type Tag = { id: number; name: string; color: string };
export type Client = { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null; facebookUrl?: string | null; tags?: Tag[] };
export type OrderStockItem = { id: number; stockItemId: number; quantity: number; stockItem?: StockItem };
export type Order = { id: number; createdAt: string; clientId: number; title: string; value: number; completionDate?: string | null; observations?: string | null; status: 'pending' | 'resolved'; client?: { name: string }; stockItems?: OrderStockItem[] };
export type Note = { id: number; text: string; createdAt: string };
export type Session = { token: string; user: User };
export type StockItem = { id: number; name: string; quantity: number; unit: string; minimumQuantity?: number | null };
export type Appointment = { id: number; ownerId: number; clientId?: number | null; client?: { name: string } | null; title: string; description?: string | null; startsAt: string; endsAt: string; status: 'scheduled' | 'completed' | 'cancelled'; syncStatus: 'not_connected' | 'pending' | 'synced' | 'failed'; syncError?: string | null; googleEventId?: string | null; createdAt: string };
export type AppointmentRequest = { id: number; ownerId: number; requesterName: string; requesterEmail: string; requesterPhone?: string | null; notes?: string | null; startsAt: string; endsAt: string; status: 'pending' | 'confirmed' | 'rejected'; createdAt: string };
export type LandingService = { id?: number; name: string; description: string; image?: string | null; sortOrder?: number };
export type PublicProfile = { username: string; description?: string | null; landingTitle?: string | null; landingAbout?: string | null; heroTitle?: string | null; heroDescription?: string | null; aboutTitle?: string | null; aboutDescription?: string | null; landingServices?: LandingService[] };
export type PublicAvailabilitySlot = { startsAt: string; endsAt: string; available: boolean };
export type OwnPublicProfile = { username: string; publicDescription?: string | null; publicBookingEnabled: boolean; landingTitle?: string | null; landingAbout?: string | null; heroTitle?: string | null; heroDescription?: string | null; aboutTitle?: string | null; aboutDescription?: string | null; landingServices?: LandingService[] };


const publicApiUrl = 'http://200.89.178.188:3005';
const isProductionAndroid = Platform.OS === 'android' && process.env.NODE_ENV === 'production';
const isProductionWeb = Platform.OS === 'web' && process.env.NODE_ENV === 'production';
const localApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3005' : 'http://localhost:3005';
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const apiUrl = isProductionAndroid ? publicApiUrl : isProductionWeb ? configuredApiUrl || '' : configuredApiUrl || localApiUrl;

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'No se pudo completar la solicitud');
  return body as T;
}

export function login(username: string, password: string): Promise<Session> {
  return request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
  return request<void>('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }, token);
}
export function getOwnPublicProfile(token: string): Promise<OwnPublicProfile> { return request<OwnPublicProfile>('/auth/profile', {}, token); }
export function updateOwnPublicProfile(token: string, changes: { publicDescription: string; publicBookingEnabled: boolean; landingTitle: string; landingAbout: string; heroTitle: string; heroDescription: string; aboutTitle: string; aboutDescription: string; landingServices: LandingService[] }): Promise<OwnPublicProfile> {
  return request<OwnPublicProfile>('/auth/profile', { method: 'PUT', body: JSON.stringify(changes) }, token);
}
export function getPublicProfile(username: string): Promise<PublicProfile> { return request<PublicProfile>(`/public-booking/${encodeURIComponent(username)}`); }
export function getPublicAvailability(username: string, date: string): Promise<PublicAvailabilitySlot[]> {
  return request<PublicAvailabilitySlot[]>(`/public-booking/${encodeURIComponent(username)}/availability?date=${encodeURIComponent(date)}`);
}
export function createPublicBookingRequest(username: string, requestData: { name: string; email: string; phone?: string; notes?: string; startsAt: string; endsAt: string }): Promise<{ id: number; message: string }> {
  return request<{ id: number; message: string }>(`/public-booking/${encodeURIComponent(username)}/requests`, { method: 'POST', body: JSON.stringify(requestData) });
}

export function getGoogleAuthorizationUrl(token: string): Promise<{ url: string }> {
  return request<{ url: string }>('/auth/google', {}, token);
}

export function getGoogleCalendarStatus(token: string): Promise<{ connected: boolean; email?: string | null; calendarId?: string }> {
  return request<{ connected: boolean; email?: string | null; calendarId?: string }>('/auth/google/status', {}, token);
}

export function disconnectGoogleCalendar(token: string): Promise<void> {
  return request<void>('/auth/google', { method: 'DELETE' }, token);
}

export function getUsers(token: string): Promise<User[]> { return request<User[]>('/admin/users', {}, token); }
export function createUser(token: string, username: string, password: string): Promise<User> {
  return request<User>('/admin/users', { method: 'POST', body: JSON.stringify({ username, password }) }, token);
}

export function getClients(token: string): Promise<Client[]> {
  return request<Client[]>('/clients', {}, token);
}
export function getTags(token: string): Promise<Tag[]> { return request<Tag[]>('/tags', {}, token); }
export function createTag(token: string, name: string, color: string): Promise<Tag> { return request<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name, color }) }, token); }
export function updateTag(token: string, tagId: number, name: string, color: string): Promise<Tag> { return request<Tag>(`/tags/${tagId}`, { method: 'PUT', body: JSON.stringify({ name, color }) }, token); }
export function deleteTag(token: string, tagId: number): Promise<void> { return request<void>(`/tags/${tagId}`, { method: 'DELETE' }, token); }
export function createClient(token: string, client: Omit<Client, 'id' | 'tags'> & { tagIds?: number[] }): Promise<Client> {
  return request<Client>('/clients', { method: 'POST', body: JSON.stringify(client) }, token);
}

export async function exportDatabase(token: string): Promise<string> {
  const response = await fetch(`${apiUrl}/export.csv`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('No se pudo exportar la base de datos');
  return response.text();
}

export function updateClient(token: string, clientId: number, client: Omit<Client, 'id' | 'tags'> & { tagIds?: number[] }): Promise<Client> {
  return request<Client>(`/clients/${clientId}`, { method: 'PUT', body: JSON.stringify(client) }, token);
}

export function deleteClient(token: string, clientId: number): Promise<void> {
  return request<void>(`/clients/${clientId}`, { method: 'DELETE' }, token);
}

export function getOrders(token: string): Promise<Order[]> {
  return request<Order[]>('/orders', {}, token);
}

export function getAppointments(token: string): Promise<Appointment[]> { return request<Appointment[]>('/appointments', {}, token); }
export function getAppointmentRequests(token: string): Promise<AppointmentRequest[]> { return request<AppointmentRequest[]>('/appointment-requests', {}, token); }
export function confirmAppointmentRequest(token: string, requestId: number): Promise<Appointment> { return request<Appointment>(`/appointment-requests/${requestId}/confirm`, { method: 'POST' }, token); }
export function rejectAppointmentRequest(token: string, requestId: number): Promise<void> { return request<void>(`/appointment-requests/${requestId}/reject`, { method: 'POST' }, token); }
export function createAppointment(token: string, appointment: { clientId?: number | null; title: string; description?: string; startsAt: string; endsAt: string }): Promise<Appointment> {
  return request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(appointment) }, token);
}
export function deleteAppointment(token: string, appointmentId: number): Promise<void> { return request<void>(`/appointments/${appointmentId}`, { method: 'DELETE' }, token); }

export function createOrder(token: string, order: { clientId: number; title?: string; value: number; completionDate?: string; observations?: string; stockItems?: { stockItemId: number; quantity: number }[] }): Promise<Order> {
  return request<Order>('/orders', { method: 'POST', body: JSON.stringify(order) }, token);
}

export function updateOrder(token: string, orderId: number, changes: { title?: string; value?: number; completionDate?: string | null; observations?: string; status?: Order['status']; stockItems?: { stockItemId: number; quantity: number }[] }): Promise<Order> {
  return request<Order>(`/orders/${orderId}`, { method: 'PUT', body: JSON.stringify(changes) }, token);
}

export function deleteOrder(token: string, orderId: number): Promise<void> {
  return request<void>(`/orders/${orderId}`, { method: 'DELETE' }, token);
}

export function getClientOrders(token: string, clientId: number): Promise<Order[]> {
  return request<Order[]>(`/orders?clientId=${clientId}`, {}, token);
}

export function getClientNotes(token: string, clientId: number): Promise<Note[]> {
  return request<Note[]>(`/clients/${clientId}/notes`, {}, token);
}

export function createClientNote(token: string, clientId: number, text: string): Promise<Note> {
  return request<Note>(`/clients/${clientId}/notes`, { method: 'POST', body: JSON.stringify({ text }) }, token);
}

export function deleteClientNote(token: string, clientId: number, noteId: number): Promise<void> {
  return request<void>(`/clients/${clientId}/notes/${noteId}`, { method: 'DELETE' }, token);
}

export function getStock(token: string): Promise<StockItem[]> { return request<StockItem[]>('/stock', {}, token); }
export function createStockItem(token: string, item: Omit<StockItem, 'id'>): Promise<StockItem> { return request<StockItem>('/stock', { method: 'POST', body: JSON.stringify(item) }, token); }
export function updateStockItem(token: string, item: StockItem): Promise<StockItem> { return request<StockItem>(`/stock/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }, token); }
export function deleteStockItem(token: string, itemId: number): Promise<void> { return request<void>(`/stock/${itemId}`, { method: 'DELETE' }, token); }
