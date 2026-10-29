import { useEffect, useState } from 'react';
import { Appointment, AppointmentRequest, Client, Order, Tag } from '../../../services';
import { loadDashboardData } from '../services/dashboardService';

export function useDashboardData(token: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadDashboardData(token)
      .then(({ clients: loadedClients, orders: loadedOrders, tags: loadedTags, appointments: loadedAppointments, appointmentRequests: loadedRequests }) => {
        if (cancelled) return;
        setClients(loadedClients);
        setOrders(loadedOrders);
        setTags(loadedTags);
        setAppointments(loadedAppointments);
        setAppointmentRequests(loadedRequests);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los datos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return {
    clients,
    orders,
    tags,
    appointments,
    appointmentRequests,
    setClients,
    setOrders,
    setTags,
    setAppointments,
    setAppointmentRequests,
    loading,
    error,
  };
}
