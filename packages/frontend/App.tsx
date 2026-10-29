import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, SafeAreaView, StatusBar as NativeStatusBar } from 'react-native';
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
import { PublicBookingScreen } from './src/features/public/screens/PublicBookingScreen';
import { Client, Order, Session } from './src/services';
import { colors, styles } from './src/shared';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [adminPath, setAdminPath] = useState(Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname === '/admin');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [clientsScreenOpen, setClientsScreenOpen] = useState(false);
  const [ordersScreenOpen, setOrdersScreenOpen] = useState(false);
  const [inventoryScreenOpen, setInventoryScreenOpen] = useState(false);
  const [orderCreateScreenOpen, setOrderCreateScreenOpen] = useState(false);
  const [orderCreateClient, setOrderCreateClient] = useState<Client | undefined>();
  const [settingsScreenOpen, setSettingsScreenOpen] = useState(false);
  const [calendarConnectionVisible, setCalendarConnectionVisible] = useState(false);
  const publicUsername = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname.startsWith('/') && !['/', '/admin'].includes(window.location.pathname) ? window.location.pathname.slice(1) : '';

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    document.documentElement.style.backgroundColor = colors.background;
    document.documentElement.style.setProperty('overscroll-behavior-y', 'none');
    document.body.style.backgroundColor = colors.background;
    document.body.style.setProperty('overscroll-behavior-y', 'none');
    document.getElementById('root')?.style.setProperty('background-color', colors.background);
  }, []);

  const logout = () => {
    setSession(null);
    setSelectedClient(null);
    setSelectedOrder(null);
    setClientsScreenOpen(false);
    setOrdersScreenOpen(false);
    setInventoryScreenOpen(false);
    setOrderCreateScreenOpen(false);
    setOrderCreateClient(undefined);
    setSettingsScreenOpen(false);
    setCalendarConnectionVisible(false);
  };

  const updateSelectedOrder = (order: Order) => setSelectedOrder(order);

  const openOrderCreate = (client?: Client) => { setOrderCreateClient(client); setOrderCreateScreenOpen(true); };
  const closeOrderCreate = () => { setOrderCreateScreenOpen(false); setOrderCreateClient(undefined); };
  const openAdmin = () => { if (Platform.OS === 'web') window.history.pushState({}, '', '/admin'); setAdminPath(true); };
  const openSettings = () => { setAdminPath(false); setSettingsScreenOpen(true); };
  const openCalendarSettings = () => setCalendarConnectionVisible(true);
  const closeAdmin = () => { if (Platform.OS === 'web') window.history.pushState({}, '', '/'); setAdminPath(false); setSettingsScreenOpen(true); };
  const isAdminPath = Platform.OS === 'web' && adminPath;
  const openClientLogin = () => { if (Platform.OS === 'web') window.history.pushState({}, '', '/'); setAdminPath(false); setSession(null); };
  return <SafeAreaView style={[styles.safeArea, Platform.OS === 'android' && { paddingTop: NativeStatusBar.currentHeight ?? 0 }]}><StatusBar backgroundColor={colors.background} style="light" />{publicUsername ? <PublicBookingScreen username={publicUsername} /> : session ? isAdminPath && session.user.role === 'admin' ? <AdminScreen onBack={closeAdmin} session={session} /> : settingsScreenOpen ? <SettingsScreen onBack={() => setSettingsScreenOpen(false)} onOpenAdmin={openAdmin} onOpenCalendar={openCalendarSettings} session={session} /> : orderCreateScreenOpen ? <OrderCreateScreen initialClient={orderCreateClient} onBack={closeOrderCreate} onCreated={closeOrderCreate} token={session.token} /> : selectedOrder ? <OrderDetails onBack={() => setSelectedOrder(null)} onUpdated={updateSelectedOrder} order={selectedOrder} token={session.token} /> : selectedClient ? <ClientDetails client={selectedClient} onBack={() => setSelectedClient(null)} onOpenOrderCreate={openOrderCreate} onSelectOrder={setSelectedOrder} token={session.token} /> : clientsScreenOpen ? <ClientsScreen onBack={() => setClientsScreenOpen(false)} onSelectClient={setSelectedClient} token={session.token} /> : ordersScreenOpen ? <OrdersScreen onBack={() => setOrdersScreenOpen(false)} onOpenOrderCreate={() => openOrderCreate()} onSelectOrder={setSelectedOrder} token={session.token} /> : inventoryScreenOpen ? <InventoryScreen onBack={() => setInventoryScreenOpen(false)} token={session.token} /> : <Dashboard onLogout={logout} onOpenSettings={openSettings} onOpenClients={() => setClientsScreenOpen(true)} onOpenOrders={() => setOrdersScreenOpen(true)} onOpenInventory={() => setInventoryScreenOpen(true)} onOpenOrderCreate={() => openOrderCreate()} onSelectClient={setSelectedClient} onSelectOrder={setSelectedOrder} session={session} /> : <LoginScreen isAdmin={isAdminPath} onLogin={setSession} onOpenAdmin={openAdmin} onOpenClient={openClientLogin} />} {session ? <GoogleCalendarConnection onClose={() => setCalendarConnectionVisible(false)} token={session.token} visible={calendarConnectionVisible} /> : null}</SafeAreaView>;
}
