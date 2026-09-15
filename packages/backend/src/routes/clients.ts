import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Client } from '../entities/Client';

export function createClientRouter(dataSource: DataSource): Router {
  const router = Router();
  const repository = dataSource.getRepository(Client);

  router.get('/', async (_request, response) => {
    response.json(await repository.find({ order: { id: 'ASC' } }));
  });

  router.get('/:id', async (request, response) => {
    const client = await repository.findOneBy({ id: Number(request.params.id) });
    if (!client) {
      response.status(404).json({ message: 'Client not found' });
      return;
    }
    response.json(client);
  });

  router.post('/', async (request, response) => {
    const { name, email, phone, address } = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
    };

    if (!name?.trim()) {
      response.status(400).json({ message: 'name is required' });
      return;
    }

    const client = await repository.save(repository.create({
      name: name.trim(),
      email,
      phone,
      address,
    }));
    response.status(201).json(client);
  });

  return router;
}