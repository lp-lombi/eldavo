import { Platform } from 'react-native';

export type User = { id: number; username: string; role: string };
export type Client = { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null };
export type Order = { id: number; title: string; value: number; completionDate?: string; observations?: string | null; status: 'pending' | 'resolved'; client?: { name: string } };
export type Note = { id: number; text: string; createdAt: string };
export type Session = { token: string; user: User };


const defaultApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || defaultApiUrl;

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

export function getClients(token: string): Promise<Client[]> {
  return request<Client[]>('/clients', {}, token);
}

export async function exportDatabase(token: string): Promise<string> {
  const response = await fetch(`${apiUrl}/export.csv`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('No se pudo exportar la base de datos');
  return response.text();
}

export function updateClient(token: string, clientId: number, client: Omit<Client, 'id'>): Promise<Client> {
  return request<Client>(`/clients/${clientId}`, { method: 'PUT', body: JSON.stringify(client) }, token);
}

export function deleteClient(token: string, clientId: number): Promise<void> {
  return request<void>(`/clients/${clientId}`, { method: 'DELETE' }, token);
}

export function getOrders(token: string): Promise<Order[]> {
  return request<Order[]>('/orders', {}, token);
}

export function updateOrder(token: string, orderId: number, changes: { title?: string; observations?: string; status?: Order['status'] }): Promise<Order> {
  return request<Order>(`/orders/${orderId}`, { method: 'PUT', body: JSON.stringify(changes) }, token);
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
