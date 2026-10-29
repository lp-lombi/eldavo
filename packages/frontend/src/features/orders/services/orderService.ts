import { Client, getClients, getOrders, Order } from '../../../services';

export async function loadOrdersData(token: string): Promise<{ clients: Client[]; orders: Order[] }> {
  const [clients, orders] = await Promise.all([
    getClients(token),
    getOrders(token),
  ]);

  return { clients, orders };
}
