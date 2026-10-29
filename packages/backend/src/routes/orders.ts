import { Router } from 'express';
import { DataSource, EntityManager } from 'typeorm';
import { Client } from '../entities/Client';
import { Order } from '../entities/Order';
import { OrderStockItem } from '../entities/OrderStockItem';
import { StockItem } from '../entities/StockItem';
import { StockMovement } from '../entities/StockMovement';

type StockLineInput = { stockItemId: number; quantity: number };

function parseStockLines(lines?: StockLineInput[]): StockLineInput[] {
  if (!lines) return [];
  if (!Array.isArray(lines) || lines.some((line) => !Number.isInteger(line.stockItemId) || typeof line.quantity !== 'number' || !Number.isFinite(line.quantity) || line.quantity <= 0)) throw new Error('stockItems must contain positive quantities');
  const quantities = new Map<number, number>();
  lines.forEach((line) => quantities.set(line.stockItemId, (quantities.get(line.stockItemId) || 0) + line.quantity));
  return [...quantities.entries()].map(([stockItemId, quantity]) => ({ stockItemId, quantity }));
}

async function findOrder(manager: EntityManager, id: number, ownerId: number) {
  return manager.getRepository(Order).findOne({ where: { id, client: { ownerId } }, relations: { client: true, stockItems: { stockItem: true } } });
}

async function syncStock(manager: EntityManager, order: Order, ownerId: number, oldStatus: Order['status'], newStatus: Order['status'], oldLines: OrderStockItem[], newLines: StockLineInput[]) {
  const oldQuantities = new Map(oldLines.map((line) => [line.stockItemId, oldStatus === 'resolved' ? Number(line.quantity) : 0]));
  const newQuantities = new Map(newLines.map((line) => [line.stockItemId, newStatus === 'resolved' ? line.quantity : 0]));
  const stockIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);
  const stockRepository = manager.getRepository(StockItem);
  const movementRepository = manager.getRepository(StockMovement);
  for (const stockItemId of stockIds) {
    const difference = (newQuantities.get(stockItemId) || 0) - (oldQuantities.get(stockItemId) || 0);
    if (!difference) continue;
    const stockItem = await stockRepository.findOneBy({ id: stockItemId, ownerId });
    if (!stockItem) throw new Error(`Stock item ${stockItemId} not found`);
    if (difference > 0 && Number(stockItem.quantity) < difference) throw new Error(`Insufficient stock for ${stockItem.name}`);
    stockItem.quantity = Number(stockItem.quantity) - difference;
    await stockRepository.save(stockItem);
    await movementRepository.save(movementRepository.create({ order, orderId: order.id, stockItem, stockItemId, type: difference > 0 ? 'exit' : 'reversal', quantity: Math.abs(difference) }));
  }
}

export function createOrderRouter(dataSource: DataSource): Router {
  const router = Router();
  const clientRepository = dataSource.getRepository(Client);

  router.get('/', async (request, response) => {
    const clientId = Number(request.query.clientId);
    const ownerId = response.locals.user.id;
    const where = Number.isInteger(clientId) && clientId > 0 ? { clientId, client: { ownerId } } : { client: { ownerId } };
    response.json(await dataSource.getRepository(Order).find({ where, relations: { client: true, stockItems: { stockItem: true } }, order: { id: 'ASC' } }));
  });

  router.post('/', async (request, response) => {
    const { completionDate, clientId, observations, status, stockItems, title, value } = request.body as { completionDate?: string; clientId?: number; observations?: string; status?: 'pending' | 'resolved'; stockItems?: StockLineInput[]; title?: string; value?: number };
    if (!clientId || typeof value !== 'number' || !Number.isFinite(value)) return response.status(400).json({ message: 'clientId and a numeric value are required' });
    const ownerId = response.locals.user.id;
    const client = await clientRepository.findOneBy({ id: clientId, ownerId });
    if (!client) return response.status(404).json({ message: 'Client not found' });
    let lines: StockLineInput[];
    try { lines = parseStockLines(stockItems); } catch (error) { return response.status(400).json({ message: error instanceof Error ? error.message : 'Invalid stock items' }); }
    const parsedCompletionDate = completionDate ? new Date(completionDate) : undefined;
    if (parsedCompletionDate && Number.isNaN(parsedCompletionDate.getTime())) return response.status(400).json({ message: 'completionDate must be a valid date' });
    try {
      const saved = await dataSource.transaction(async (manager) => {
        const orderRepository = manager.getRepository(Order);
        const order = await orderRepository.save(orderRepository.create({ client, clientId, value, title: title?.trim() || 'Pedido', completionDate: parsedCompletionDate, observations: observations?.trim() || null, status: status === 'resolved' ? 'resolved' : 'pending' }));
        const lineRepository = manager.getRepository(OrderStockItem);
        await lineRepository.save(lines.map((line) => lineRepository.create({ order, orderId: order.id, stockItemId: line.stockItemId, quantity: line.quantity })));
        await syncStock(manager, order, ownerId, 'pending', order.status, [], lines);
        return findOrder(manager, order.id, ownerId);
      });
      response.status(201).json(saved);
    } catch (error) { response.status(400).json({ message: error instanceof Error ? error.message : 'Could not create order' }); }
  });

  router.put('/:id', async (request, response) => {
    const id = Number(request.params.id);
    const { completionDate, observations, status, stockItems, title, value } = request.body as { completionDate?: string | null; observations?: string; status?: 'pending' | 'resolved'; stockItems?: StockLineInput[]; title?: string; value?: number };
    if (status !== undefined && status !== 'pending' && status !== 'resolved') return response.status(400).json({ message: 'status must be pending or resolved' });
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) return response.status(400).json({ message: 'value must be a finite number' });
    try {
      const updated = await dataSource.transaction(async (manager) => {
        const order = await findOrder(manager, id, response.locals.user.id);
        if (!order) throw new Error('Order not found');
        const oldStatus = order.status;
        const oldLines = await manager.getRepository(OrderStockItem).findBy({ orderId: id });
        const lines = stockItems === undefined ? oldLines.map((line) => ({ stockItemId: line.stockItemId, quantity: Number(line.quantity) })) : parseStockLines(stockItems);
        const nextStatus = status || oldStatus;
        if (completionDate !== undefined) order.completionDate = completionDate ? new Date(completionDate) : null;
        if (order.completionDate && Number.isNaN(order.completionDate.getTime())) throw new Error('completionDate must be a valid date');
        if (observations !== undefined) order.observations = observations.trim() || null;
        if (title !== undefined) order.title = title.trim() || 'Pedido';
        if (value !== undefined) order.value = value;
        order.status = nextStatus;
        await manager.getRepository(Order).save(order);
        const lineRepository = manager.getRepository(OrderStockItem);
        await lineRepository.delete({ orderId: id });
        await lineRepository.save(lines.map((line) => lineRepository.create({ order, orderId: id, stockItemId: line.stockItemId, quantity: line.quantity })));
        await syncStock(manager, order, response.locals.user.id, oldStatus, nextStatus, oldLines, lines);
        return findOrder(manager, id, response.locals.user.id);
      });
      response.json(updated);
    } catch (error) { response.status(error instanceof Error && error.message === 'Order not found' ? 404 : 400).json({ message: error instanceof Error ? error.message : 'Could not update order' }); }
  });

  router.delete('/:id', async (request, response) => {
    try {
      await dataSource.transaction(async (manager) => {
        const order = await findOrder(manager, Number(request.params.id), response.locals.user.id);
        if (!order) throw new Error('Order not found');
        const lines = await manager.getRepository(OrderStockItem).findBy({ orderId: order.id });
        await syncStock(manager, order, response.locals.user.id, order.status, 'pending', lines, []);
        await manager.getRepository(Order).remove(order);
      });
      response.status(204).send();
    } catch (error) { response.status(error instanceof Error && error.message === 'Order not found' ? 404 : 400).json({ message: error instanceof Error ? error.message : 'Could not delete order' }); }
  });
  return router;
}
