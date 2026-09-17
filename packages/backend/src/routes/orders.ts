import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Client } from '../entities/Client';
import { Order } from '../entities/Order';

export function createOrderRouter(dataSource: DataSource): Router {
  const router = Router();
  const orderRepository = dataSource.getRepository(Order);
  const clientRepository = dataSource.getRepository(Client);

  router.get('/', async (_request, response) => {
    const clientId = Number(_request.query.clientId);
    response.json(await orderRepository.find({
      where: Number.isInteger(clientId) && clientId > 0 ? { clientId } : undefined,
      relations: { client: true },
      order: { id: 'ASC' },
    }));
  });

  router.post('/', async (request, response) => {
    const { completionDate, clientId, observations, status, title, value } = request.body as {
      completionDate?: string;
      clientId?: number;
      observations?: string;
      status?: 'pending' | 'resolved';
      title?: string;
      value?: number;
    };

    if (!clientId || typeof value !== 'number' || !Number.isFinite(value)) {
      response.status(400).json({ message: 'clientId and a numeric value are required' });
      return;
    }

    const client = await clientRepository.findOneBy({ id: clientId });
    if (!client) {
      response.status(404).json({ message: 'Client not found' });
      return;
    }

    let parsedCompletionDate: Date | undefined;
    if (completionDate !== undefined) {
      parsedCompletionDate = new Date(completionDate);
      if (Number.isNaN(parsedCompletionDate.getTime())) {
        response.status(400).json({ message: 'completionDate must be a valid date' });
        return;
      }
    }

    const order = await orderRepository.save(orderRepository.create({
      client,
      clientId,
      value,
      title: title?.trim() || 'Pedido',
      completionDate: parsedCompletionDate,
      observations: observations?.trim() || null,
      status: status === 'resolved' ? 'resolved' : 'pending',
    }));
    response.status(201).json(await orderRepository.findOneOrFail({
      where: { id: order.id },
      relations: { client: true },
    }));
  });

  router.put('/:id', async (request, response) => {
    const order = await orderRepository.findOneBy({ id: Number(request.params.id) });
    if (!order) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    const { completionDate, observations, status, title, value } = request.body as { completionDate?: string | null; observations?: string; status?: 'pending' | 'resolved'; title?: string; value?: number };
    if (status !== undefined && status !== 'pending' && status !== 'resolved') {
      response.status(400).json({ message: 'status must be pending or resolved' });
      return;
    }
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
      response.status(400).json({ message: 'value must be a finite number' });
      return;
    }

    let parsedCompletionDate: Date | null | undefined;
    if (completionDate !== undefined) {
      if (completionDate === null || completionDate.trim() === '') {
        parsedCompletionDate = null;
      } else {
        parsedCompletionDate = new Date(completionDate);
        if (Number.isNaN(parsedCompletionDate.getTime())) {
          response.status(400).json({ message: 'completionDate must be a valid date' });
          return;
        }
      }
    }

    if (observations !== undefined) order.observations = observations.trim() || null;
    if (status !== undefined) order.status = status;
    if (title !== undefined) order.title = title.trim() || 'Pedido';
    if (value !== undefined) order.value = value;
    if (parsedCompletionDate !== undefined) order.completionDate = parsedCompletionDate;
    await orderRepository.save(order);
    response.json(await orderRepository.findOneOrFail({ where: { id: order.id }, relations: { client: true } }));
  });

  router.delete('/:id', async (request, response) => {
    const order = await orderRepository.findOneBy({ id: Number(request.params.id) });
    if (!order) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    await orderRepository.remove(order);
    response.status(204).send();
  });

  return router;
}