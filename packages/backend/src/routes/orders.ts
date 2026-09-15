import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Client } from '../entities/Client';
import { Order } from '../entities/Order';

export function createOrderRouter(dataSource: DataSource): Router {
  const router = Router();
  const orderRepository = dataSource.getRepository(Order);
  const clientRepository = dataSource.getRepository(Client);

  router.get('/', async (_request, response) => {
    response.json(await orderRepository.find({
      relations: { client: true },
      order: { id: 'ASC' },
    }));
  });

  router.post('/', async (request, response) => {
    const { completionDate, clientId, value } = request.body as {
      completionDate?: string;
      clientId?: number;
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
      completionDate: parsedCompletionDate,
    }));
    response.status(201).json(await orderRepository.findOneOrFail({
      where: { id: order.id },
      relations: { client: true },
    }));
  });

  return router;
}