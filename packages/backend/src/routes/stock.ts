import { Router } from 'express';
import { DataSource } from 'typeorm';
import { StockItem } from '../entities/StockItem';

export function createStockRouter(dataSource: DataSource): Router {
  const router = Router();
  const repository = dataSource.getRepository(StockItem);

  router.get('/', async (_request, response) => {
    response.json(await repository.find({ where: { ownerId: response.locals.user.id }, order: { name: 'ASC' } }));
  });

  router.post('/', async (request, response) => {
    const { minimumQuantity, name, quantity, unit } = request.body as { minimumQuantity?: number | null; name?: string; quantity?: number; unit?: string };
    if (!name?.trim() || !unit?.trim() || typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) {
      response.status(400).json({ message: 'name, unit, and a non-negative quantity are required' });
      return;
    }
    if (minimumQuantity !== undefined && minimumQuantity !== null && (typeof minimumQuantity !== 'number' || !Number.isFinite(minimumQuantity) || minimumQuantity < 0)) {
      response.status(400).json({ message: 'minimumQuantity must be a non-negative number' });
      return;
    }
    response.status(201).json(await repository.save(repository.create({ name: name.trim(), quantity, unit: unit.trim(), minimumQuantity: minimumQuantity ?? null, ownerId: response.locals.user.id })));
  });

  router.put('/:id', async (request, response) => {
    const item = await repository.findOneBy({ id: Number(request.params.id), ownerId: response.locals.user.id });
    if (!item) {
      response.status(404).json({ message: 'Stock item not found' });
      return;
    }
    const { minimumQuantity, name, quantity, unit } = request.body as { minimumQuantity?: number | null; name?: string; quantity?: number; unit?: string };
    if (!name?.trim() || !unit?.trim() || typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) {
      response.status(400).json({ message: 'name, unit, and a non-negative quantity are required' });
      return;
    }
    if (minimumQuantity !== undefined && minimumQuantity !== null && (typeof minimumQuantity !== 'number' || !Number.isFinite(minimumQuantity) || minimumQuantity < 0)) {
      response.status(400).json({ message: 'minimumQuantity must be a non-negative number' });
      return;
    }
    item.name = name.trim();
    item.quantity = quantity;
    item.unit = unit.trim();
    item.minimumQuantity = minimumQuantity ?? null;
    response.json(await repository.save(item));
  });

  router.delete('/:id', async (request, response) => {
    const item = await repository.findOneBy({ id: Number(request.params.id), ownerId: response.locals.user.id });
    if (!item) {
      response.status(404).json({ message: 'Stock item not found' });
      return;
    }
    await repository.remove(item);
    response.status(204).send();
  });

  return router;
}