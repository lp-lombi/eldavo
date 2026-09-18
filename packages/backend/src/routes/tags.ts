import { Router } from 'express';
import { DataSource } from 'typeorm';
import { Tag } from '../entities/Tag';

const defaultTagColor = '#8ee6b1';

function normalizeColor(color?: string): string {
  const value = color?.trim() || defaultTagColor;
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : defaultTagColor;
}

export function createTagRouter(dataSource: DataSource): Router {
  const router = Router();
  const repository = dataSource.getRepository(Tag);

  router.get('/', async (_request, response) => response.json(await repository.find({ order: { name: 'ASC' } })));

  router.post('/', async (request, response) => {
    const { name: rawName, color } = request.body as { name?: string; color?: string };
    const name = rawName?.trim();
    if (!name) return response.status(400).json({ message: 'name is required' });
    if (await repository.findOneBy({ name })) return response.status(409).json({ message: 'Tag already exists' });
    response.status(201).json(await repository.save(repository.create({ name, color: normalizeColor(color) })));
  });

  router.put('/:id', async (request, response) => {
    const tag = await repository.findOneBy({ id: Number(request.params.id) });
    const { name: rawName, color } = request.body as { name?: string; color?: string };
    const name = rawName?.trim();
    if (!tag) return response.status(404).json({ message: 'Tag not found' });
    if (!name) return response.status(400).json({ message: 'name is required' });
    tag.name = name;
    tag.color = normalizeColor(color);
    response.json(await repository.save(tag));
  });

  router.delete('/:id', async (request, response) => {
    const tag = await repository.findOneBy({ id: Number(request.params.id) });
    if (!tag) return response.status(404).json({ message: 'Tag not found' });
    await repository.remove(tag);
    response.status(204).send();
  });

  return router;
}