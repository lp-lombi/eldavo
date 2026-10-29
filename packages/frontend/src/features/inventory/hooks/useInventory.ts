import { useEffect, useState } from 'react';
import { StockItem } from '../../../services';
import { loadStock } from '../services/inventoryService';

export function useInventory(token: string) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadStock(token)
      .then((loadedItems) => { if (!cancelled) setItems(loadedItems); })
      .catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el stock'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return { items, setItems, loading, error, setError };
}
