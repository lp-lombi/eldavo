import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Client } from '../entities/Client';
import { Note } from '../entities/Note';
import { Order } from '../entities/Order';

function csvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function createExportRouter(dataSource: DataSource): Router {
  const router = Router();
  const clientRepository = dataSource.getRepository(Client);
  const orderRepository = dataSource.getRepository(Order);
  const noteRepository = dataSource.getRepository(Note);

  router.get('/', async (_request, response) => {
    const [clients, orders, notes] = await Promise.all([
      clientRepository.find({ order: { id: 'ASC' } }),
      orderRepository.find({ relations: { client: true }, order: { id: 'ASC' } }),
      noteRepository.find({ relations: { client: true }, order: { id: 'ASC' } }),
    ]);

    const rows = [
      ['tipo', 'id', 'titulo', 'cliente', 'email', 'telefono', 'direccion', 'importe', 'estado', 'fecha_entrega', 'observaciones', 'nota', 'fecha_nota'],
      ...clients.map((client) => ['cliente', client.id, '', client.name, client.email, client.phone, client.address, '', '', '', '', '', '']),
      ...orders.map((order) => ['pedido', order.id, order.title, order.client?.name, '', '', '', order.value, order.status, order.completionDate?.toISOString(), order.observations, '', '']),
      ...notes.map((note) => ['nota', note.id, '', note.client?.name, '', '', '', '', '', '', '', note.text, note.createdAt.toISOString()]),
    ];

    const csv = rows.map((row) => row.map(csvValue).join(',')).join('\r\n');
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="eldavo-export.csv"');
    response.send(`\uFEFF${csv}`);
  });

  return router;
}
