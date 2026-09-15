import { Platform } from 'react-native';

export type User = { id: number; username: string; role: string };
export type Client = { id: number; name: string; email?: string; phone?: string };
export type Order = { id: number; value: number; completionDate?: string; client?: { name: string } };

type LoginResponse = { token: string; user: User };

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

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function getClients(token: string): Promise<Client[]> {
  return request<Client[]>('/clients', {}, token);
}

export function getOrders(token: string): Promise<Order[]> {
  return request<Order[]>('/orders', {}, token);
}
