import 'reflect-metadata';
import { DataSource, EntityManager } from 'typeorm';
import { Client } from './entities/Client';
import { Note } from './entities/Note';
import { Order } from './entities/Order';
import { Tag } from './entities/Tag';
import { createDataSource } from './database';

const testClientPrefix = 'Cliente de prueba';
const testTagPrefix = 'test-';
const tagDefinitions = [
  ['vip', '#f59e0b'],
  ['mayorista', '#2563eb'],
  ['recurrente', '#16a34a'],
  ['urgente', '#dc2626'],
  ['nuevo', '#9333ea'],
  ['local', '#0891b2'],
] as const;

function daysFromNow(days: number, hour: number): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function clearTestData(manager: EntityManager): Promise<void> {
  const clientRepository = manager.getRepository(Client);
  const testClients = await clientRepository
    .createQueryBuilder('client')
    .where('client.name LIKE :prefix', { prefix: `${testClientPrefix}%` })
    .getMany();
  const clientIds = testClients.map((client) => client.id);

  if (clientIds.length > 0) {
    await manager.getRepository(Order).delete(clientIds.map((clientId) => ({ clientId })));
    await manager.getRepository(Note).delete(clientIds.map((clientId) => ({ clientId })));
    await clientRepository.remove(testClients);
  }

  await manager.getRepository(Tag)
    .createQueryBuilder()
    .delete()
    .where('name LIKE :prefix', { prefix: `${testTagPrefix}%` })
    .execute();
}

async function seed(): Promise<void> {
  const dataSource = createDataSource();
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      await clearTestData(manager);

      const tagRepository = manager.getRepository(Tag);
      const tags = await tagRepository.save(tagDefinitions.map(([name, color]) => tagRepository.create({
        name: `${testTagPrefix}${name}`,
        color,
      })));

      const clientRepository = manager.getRepository(Client);
      const clients = await clientRepository.save(Array.from({ length: 80 }, (_, index) => {
        const clientNumber = index + 1;
        const clientTags = [tags[index % tags.length]];
        if (index % 4 === 0) clientTags.push(tags[1]);
        if (index % 7 === 0) clientTags.push(tags[2]);

        return clientRepository.create({
          name: `${testClientPrefix} ${String(clientNumber).padStart(3, '0')}`,
          email: `cliente${clientNumber}@testing.eldavo.local`,
          phone: `11 5555-${String(1000 + clientNumber).slice(-4)}`,
          address: `Calle de prueba ${clientNumber}, Buenos Aires`,
          facebookUrl: clientNumber % 5 === 0 ? `https://facebook.com/cliente-prueba-${clientNumber}` : null,
          tags: clientTags,
        });
      }));

      const orderRepository = manager.getRepository(Order);
      const orders = await orderRepository.save(Array.from({ length: 40 }, (_, index) => {
        const orderNumber = index + 1;
        const status = index % 3 === 0 ? 'resolved' : 'pending';
        const createdAt = daysFromNow(-((index * 11) % 180), 9 + (index % 8));
        const completionDate = daysFromNow(status === 'resolved' ? -((index * 5) % 35) : 2 + ((index * 3) % 45), 12);

        return orderRepository.create({
          client: clients[index * 2],
          clientId: clients[index * 2].id,
          createdAt,
          completionDate,
          value: 12500 + ((index * 8731) % 145000),
          title: ['Reposición de stock', 'Pedido mayorista', 'Entrega programada', 'Compra online'][index % 4],
          observations: index % 5 === 0 ? 'Cliente de prueba: verificar disponibilidad antes de entregar.' : null,
          status,
        });
      }));

      const noteRepository = manager.getRepository(Note);
      await noteRepository.save(clients.slice(0, 12).map((client, index) => noteRepository.create({
        client,
        clientId: client.id,
        text: `Nota de testing ${index + 1}: contacto realizado correctamente.`,
        createdAt: daysFromNow(-index * 6, 10),
      })));

      console.log(`Datos de prueba insertados: ${clients.length} clientes, ${orders.length} pedidos, ${tags.length} etiquetas.`);
    });
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('No se pudieron insertar los datos de prueba.', error);
  process.exitCode = 1;
});