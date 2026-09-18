import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Client } from '../entities/Client';
import { Order } from '../entities/Order';
import { Note } from '../entities/Note';
import { Tag } from '../entities/Tag';

function normalizePhone(phone?: string): string | null {
  const value = phone?.trim();
  if (!value) return null;
  return value.startsWith('+') ? value : `+549${value}`;
}

export function createClientRouter(dataSource: DataSource): Router {
  const router = Router();
  const repository = dataSource.getRepository(Client);
  const orderRepository = dataSource.getRepository(Order);
  const noteRepository = dataSource.getRepository(Note);
  const tagRepository = dataSource.getRepository(Tag);

  router.get('/', async (_request, response) => {
    response.json(await repository.find({ order: { id: 'ASC' }, relations: { tags: true } }));
  });

  router.get('/:id', async (request, response) => {
    const client = await repository.findOne({ where: { id: Number(request.params.id) }, relations: { tags: true } });
    if (!client) {
      response.status(404).json({ message: 'Client not found' });
      return;
    }
    response.json(client);
  });

  router.get('/:id/notes', async (request, response) => {
    const client = await repository.findOneBy({ id: Number(request.params.id) });
    if (!client) {
      response.status(404).json({ message: 'Client not found' });
      return;
    }
    response.json(await noteRepository.find({ where: { clientId: client.id }, order: { createdAt: 'DESC' } }));
  });

  router.post('/:id/notes', async (request, response) => {
    const clientId = Number(request.params.id);
    const client = await repository.findOneBy({ id: clientId });
    const text = (request.body as { text?: string }).text;
    if (!client) {
      response.status(404).json({ message: 'Client not found' });
      return;
    }
    if (!text?.trim()) {
      response.status(400).json({ message: 'text is required' });
      return;
    }
    const note = await noteRepository.save(noteRepository.create({ text: text.trim(), client, clientId }));
    response.status(201).json(note);
  });

  router.delete('/:clientId/notes/:noteId', async (request, response) => {
    const note = await noteRepository.findOneBy({ id: Number(request.params.noteId), clientId: Number(request.params.clientId) });
    if (!note) {
      response.status(404).json({ message: 'Note not found' });
      return;
    }
    await noteRepository.remove(note);
    response.status(204).send();
  });

  router.post('/', async (request, response) => {
    const { name, email, phone, address, facebookUrl, tagIds } = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      facebookUrl?: string;
      tagIds?: number[];
    };

    if (!name?.trim()) {
      response.status(400).json({ message: 'name is required' });
      return;
    }

    const tags = tagIds?.length ? await tagRepository.findByIds(tagIds) : [];
    const client = await repository.save(repository.create({
      name: name.trim(),
      email,
      phone: normalizePhone(phone),
      address,
      facebookUrl: facebookUrl?.trim() || null,
      tags,
    }));
    response.status(201).json(client);
  });

  router.put('/:id', async (request, response) => {
    const client = await repository.findOneBy({ id: Number(request.params.id) });
    if (!client) {
      response.status(404).json({ message: 'Client not found' });
      return;
    }

    const { name, email, phone, address, facebookUrl, tagIds } = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      facebookUrl?: string;
      tagIds?: number[];
    };

    if (!name?.trim()) {
      response.status(400).json({ message: 'name is required' });
      return;
    }

    client.name = name.trim();
    client.email = email?.trim() || null;
    client.phone = normalizePhone(phone);
    client.address = address?.trim() || null;
    client.facebookUrl = facebookUrl?.trim() || null;
    client.tags = tagIds?.length ? await tagRepository.findByIds(tagIds) : [];
    response.json(await repository.save(client));
  });

  router.delete('/:id', async (request, response) => {
    const clientId = Number(request.params.id);
    const client = await repository.findOneBy({ id: clientId });
    if (!client) {
      response.status(404).json({ message: 'Client not found' });
      return;
    }

    if (await orderRepository.countBy({ clientId })) {
      response.status(409).json({ message: 'Cannot delete a client with orders' });
      return;
    }

    await repository.remove(client);
    response.status(204).send();
  });

  return router;
}