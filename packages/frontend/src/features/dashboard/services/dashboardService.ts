import {
  Appointment,
  AppointmentRequest,
  Client,
  getAppointmentRequests,
  getAppointments,
  getClients,
  getOrders,
  getTags,
  Order,
  Tag,
} from '../../../services';

export async function loadDashboardData(token: string): Promise<{
  clients: Client[];
  orders: Order[];
  tags: Tag[];
  appointments: Appointment[];
  appointmentRequests: AppointmentRequest[];
}> {
  const [clients, orders, tags, appointments, appointmentRequests] = await Promise.all([
    getClients(token),
    getOrders(token),
    getTags(token),
    getAppointments(token),
    getAppointmentRequests(token),
  ]);

  return { clients, orders, tags, appointments, appointmentRequests };
}
