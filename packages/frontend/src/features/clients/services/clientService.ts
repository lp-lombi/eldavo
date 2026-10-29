import { Client, getClients, getOrders, getTags, Order, Tag } from '../../../services';

export async function loadClientsData(token: string): Promise<{ clients: Client[]; orders: Order[]; tags: Tag[] }> {
  const [clients, orders, tags] = await Promise.all([
    getClients(token),
    getOrders(token),
    getTags(token),
  ]);

  return { clients, orders, tags };
}
