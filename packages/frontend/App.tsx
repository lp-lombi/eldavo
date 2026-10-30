import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar as NativeStatusBar, Text, View } from 'react-native';
import { ClientDetails } from './src/features/clients/components/ClientDetails';
import { AdminScreen } from './src/features/admin/screens/AdminScreen';
import { ClientsScreen } from './src/features/clients/screens/ClientsScreen';
import { Dashboard } from './src/features/dashboard/screens/Dashboard';
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { OrderDetails } from './src/features/orders/components/OrderDetails';
import { OrdersScreen } from './src/features/orders/screens/OrdersScreen';
import { InventoryScreen } from './src/features/inventory/screens/InventoryScreen';
import { OrderCreateScreen } from './src/features/orders/screens/OrderCreateScreen';
import { SettingsScreen } from './src/features/settings/screens/SettingsScreen';
import { GoogleCalendarConnection } from './src/features/settings/components/GoogleCalendarConnection';
import { ConstructionScreen } from './src/features/public/screens/ConstructionScreen';
import { PublicBookingScreen } from './src/features/public/screens/PublicBookingScreen';
import { AppointmentDetailsScreen } from './src/features/appointments/screens/AppointmentDetailsScreen';
import { clearStoredSession, loadStoredSession, saveStoredSession } from './src/features/auth/services/sessionStorage';
import { Appointment, Client, getAppointment, getClient, getOrders, Order, Session } from './src/services';
import { colors, styles } from './src/shared';

type WebRoute = 'home' | 'login' | 'panel' | 'config' | 'admin' | 'orders' | 'order' | 'clients' | 'client' | 'appointments' | 'appointment' | 'public' | 'unknown';
type RouteState = { route: WebRoute; publicUsername?: string; resourceId?: number };

function getRoute(pathname: string): RouteState {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { route: 'home' };
  if (path === '/login') return { route: 'login' };
  if (path === '/panel') return { route: 'panel' };
  if (path === '/panel/config') return { route: 'config' };
  if (path === '/admin') return { route: 'admin' };
  const resourceMatch = path.match(/^\/(pedidos|clientes|turnos)(?:\/(\d+))?$/);
  if (resourceMatch) {
    const route: WebRoute = resourceMatch[1] === 'pedidos' ? resourceMatch[2] ? 'order' : 'orders' : resourceMatch[1] === 'clientes' ? resourceMatch[2] ? 'client' : 'clients' : resourceMatch[2] ? 'appointment' : 'appointments';
    return { route, resourceId: resourceMatch[2] ? Number(resourceMatch[2]) : undefined };
  }
  if (/^\/[^/]+$/.test(path)) {
    try {
      return { route: 'public', publicUsername: decodeURIComponent(path.slice(1)) };
    } catch {
      return { route: 'unknown' };
    }
  }
  return { route: 'unknown' };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [routeState, setRouteState] = useState<RouteState>(() => Platform.OS === 'web' && typeof window !== 'undefined' ? getRoute(window.location.pathname) : { route: 'login' });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [clientsScreenOpen, setClientsScreenOpen] = useState(false);
  const [ordersScreenOpen, setOrdersScreenOpen] = useState(false);
  const [inventoryScreenOpen, setInventoryScreenOpen] = useState(false);
  const [orderCreateScreenOpen, setOrderCreateScreenOpen] = useState(false);
  const [orderCreateClient, setOrderCreateClient] = useState<Client | undefined>();
  const [settingsScreenOpen, setSettingsScreenOpen] = useState(false);
  const [calendarConnectionVisible, setCalendarConnectionVisible] = useState(false);
  const [routeError, setRouteError] = useState('');

  useEffect(() => {
    void loadStoredSession().then((storedSession) => {
      setSession(storedSession);
      setSessionRestored(true);
    }).catch((error) => {
      console.error('No se pudo restaurar la sesión', error);
      setSessionRestored(true);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handlePopState = () => setRouteState(getRoute(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    document.documentElement.style.backgroundColor = colors.background;
    document.documentElement.style.setProperty('overscroll-behavior-y', 'none');
    document.body.style.backgroundColor = colors.background;
    document.body.style.setProperty('overscroll-behavior-y', 'none');
    document.getElementById('root')?.style.setProperty('background-color', colors.background);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (Platform.OS !== 'web') return;
    window.history.pushState({}, '', path);
    setRouteState(getRoute(path));
  };

  const logout = () => {
    setSession(null);
    void clearStoredSession().catch((error) => console.error('No se pudo limpiar la sesión', error));
    setSelectedClient(null);
    setSelectedOrder(null);
    setSelectedAppointment(null);
    setClientsScreenOpen(false);
    setOrdersScreenOpen(false);
    setInventoryScreenOpen(false);
    setOrderCreateScreenOpen(false);
    setOrderCreateClient(undefined);
    setSettingsScreenOpen(false);
    setCalendarConnectionVisible(false);
    navigate('/login');
  };

  const updateSelectedOrder = (order: Order) => setSelectedOrder(order);
  const openOrderCreate = (client?: Client) => { setOrderCreateClient(client); setOrderCreateScreenOpen(true); };
  const closeOrderCreate = () => { setOrderCreateScreenOpen(false); setOrderCreateClient(undefined); };
  const openClients = () => Platform.OS === 'web' ? navigate('/clientes') : setClientsScreenOpen(true);
  const openOrders = () => Platform.OS === 'web' ? navigate('/pedidos') : setOrdersScreenOpen(true);
  const openAdmin = () => navigate('/admin');
  const openSettings = () => Platform.OS === 'web' ? navigate('/panel/config') : setSettingsScreenOpen(true);
  const openCalendarSettings = () => setCalendarConnectionVisible(true);
  const closeAdmin = () => navigate('/panel');
  const openClientLogin = () => { setSession(null); navigate('/login'); };
  const isAdminPath = routeState.route === 'admin';
  const publicUsername = routeState.route === 'public' ? routeState.publicUsername : undefined;
  const showConfig = routeState.route === 'config' || (Platform.OS !== 'web' && settingsScreenOpen);
  const protectedRoute = ['panel', 'config', 'admin', 'orders', 'order', 'clients', 'client', 'appointments', 'appointment'].includes(routeState.route);
  const showLogin = routeState.route === 'login' || routeState.route === 'unknown' || protectedRoute && !session || (Platform.OS !== 'web' && !session);

  useEffect(() => {
    if (!session || !routeState.resourceId || !['client', 'order', 'appointment'].includes(routeState.route)) return;
    setRouteError('');
    if (routeState.route === 'client') {
      void getClient(session.token, routeState.resourceId).then(setSelectedClient).catch((error) => setRouteError(error instanceof Error ? error.message : 'No se pudo cargar el cliente'));
    } else if (routeState.route === 'order') {
      void getOrders(session.token).then((orders) => {
        const order = orders.find((item) => item.id === routeState.resourceId);
        if (!order) throw new Error('Pedido no encontrado');
        setSelectedOrder(order);
      }).catch((error) => setRouteError(error instanceof Error ? error.message : 'No se pudo cargar el pedido'));
    } else {
      void getAppointment(session.token, routeState.resourceId).then(setSelectedAppointment).catch((error) => setRouteError(error instanceof Error ? error.message : 'No se pudo cargar el turno'));
    }
  }, [routeState.resourceId, routeState.route, session]);

  const panelContent = session && isAdminPath && session.user.role === 'admin' ? <AdminScreen onBack={closeAdmin} session={session} /> :
    session && showConfig ? <SettingsScreen onBack={() => Platform.OS === 'web' ? navigate('/panel') : setSettingsScreenOpen(false)} onOpenAdmin={openAdmin} onOpenCalendar={openCalendarSettings} session={session} /> :
      session && orderCreateScreenOpen ? <OrderCreateScreen initialClient={orderCreateClient} onBack={closeOrderCreate} onCreated={closeOrderCreate} token={session.token} /> :
        session && routeState.route === 'appointment' && selectedAppointment ? <AppointmentDetailsScreen appointment={selectedAppointment} onBack={() => { setSelectedAppointment(null); navigate('/panel'); }} onUpdated={setSelectedAppointment} token={session.token} /> :
          session && ((routeState.route === 'order' && selectedOrder) || (Platform.OS !== 'web' && selectedOrder)) ? <OrderDetails onBack={() => { setSelectedOrder(null); routeState.route === 'order' ? navigate('/pedidos') : undefined; }} onUpdated={updateSelectedOrder} order={selectedOrder as Order} token={session.token} /> :
          session && ((routeState.route === 'client' && selectedClient) || (Platform.OS !== 'web' && selectedClient)) ? <ClientDetails client={selectedClient as Client} onBack={() => { setSelectedClient(null); routeState.route === 'client' ? navigate('/clientes') : undefined; }} onOpenOrderCreate={openOrderCreate} onSelectOrder={(order) => { setSelectedOrder(order); if (Platform.OS === 'web') navigate(`/pedidos/${order.id}`); }} token={session.token} /> :
            session && (routeState.route === 'clients' || clientsScreenOpen) ? <ClientsScreen onBack={() => Platform.OS === 'web' ? navigate('/panel') : setClientsScreenOpen(false)} onSelectClient={(client) => { setSelectedClient(client); if (Platform.OS === 'web') navigate(`/clientes/${client.id}`); }} token={session.token} /> :
              session && (routeState.route === 'orders' || ordersScreenOpen) ? <OrdersScreen onBack={() => Platform.OS === 'web' ? navigate('/panel') : setOrdersScreenOpen(false)} onOpenOrderCreate={() => openOrderCreate()} onSelectOrder={(order) => { setSelectedOrder(order); if (Platform.OS === 'web') navigate(`/pedidos/${order.id}`); }} token={session.token} /> :
                session && inventoryScreenOpen ? <InventoryScreen onBack={() => setInventoryScreenOpen(false)} token={session.token} /> :
                  session ? <Dashboard onLogout={logout} onOpenSettings={openSettings} onOpenClients={openClients} onOpenOrders={openOrders} onOpenInventory={() => setInventoryScreenOpen(true)} onOpenOrderCreate={() => openOrderCreate()} onSelectClient={(client) => { setSelectedClient(client); if (Platform.OS === 'web') navigate(`/clientes/${client.id}`); }} onSelectOrder={(order) => { setSelectedOrder(order); if (Platform.OS === 'web') navigate(`/pedidos/${order.id}`); }} onSelectAppointment={(appointment) => { setSelectedAppointment(appointment); if (Platform.OS === 'web') navigate(`/turnos/${appointment.id}`); }} session={session} /> : null;

  const content = !sessionRestored ? <View style={[styles.screen, styles.loadingScreen]}><ActivityIndicator color={colors.accent} /></View> :
    publicUsername ? <PublicBookingScreen username={publicUsername} /> :
    routeState.route === 'home' ? <ConstructionScreen /> :
      showLogin ? <LoginScreen isAdmin={isAdminPath} onLogin={(newSession) => { setSession(newSession); void saveStoredSession(newSession).catch((error) => console.error('No se pudo guardar la sesión', error)); navigate('/panel'); }} onOpenAdmin={openAdmin} onOpenClient={openClientLogin} /> :
        session ? routeError ? <Text style={styles.error}>{routeError}</Text> : panelContent : <ConstructionScreen />;

  return <SafeAreaView style={[styles.safeArea, Platform.OS === 'android' && { paddingTop: NativeStatusBar.currentHeight ?? 0 }]}>
    <StatusBar backgroundColor={colors.background} style="light" />
    {content}
    {session ? <GoogleCalendarConnection onClose={() => setCalendarConnectionVisible(false)} token={session.token} visible={calendarConnectionVisible} /> : null}
  </SafeAreaView>;
}
