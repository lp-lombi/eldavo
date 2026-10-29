import { createStockItem, deleteStockItem, getStock, StockItem, updateStockItem } from '../../../services';

export const loadStock = (token: string) => getStock(token);

export function saveStockItem(token: string, editing: StockItem | null, item: Omit<StockItem, 'id'>) {
  return editing ? updateStockItem(token, { ...item, id: editing.id }) : createStockItem(token, item);
}

export const removeStockItem = (token: string, itemId: number) => deleteStockItem(token, itemId);
