import { useEffect, useState } from 'react';
import { Client, Order } from '../../../services';
import { loadOrdersData } from '../services/orderService';

export function useOrders(token: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadOrdersData(token)
      .then(({ clients: loadedClients, orders: loadedOrders }) => {
        if (cancelled) return;
        setClients(loadedClients);
        setOrders(loadedOrders);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los pedidos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { clients, orders, loading, error };
}
