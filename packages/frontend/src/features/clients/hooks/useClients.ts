import { useEffect, useState } from 'react';
import { Client, Order, Tag } from '../../../services';
import { loadClientsData } from '../services/clientService';

export function useClients(token: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadClientsData(token)
      .then(({ clients: loadedClients, orders: loadedOrders, tags: loadedTags }) => {
        if (cancelled) return;
        setClients(loadedClients);
        setOrders(loadedOrders);
        setTags(loadedTags);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los clientes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { clients, orders, tags, setClients, setOrders, setTags, loading, error };
}
