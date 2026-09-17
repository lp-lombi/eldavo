import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, SafeAreaView, StatusBar as NativeStatusBar } from 'react-native';
import { ClientDetails } from './components/ClientDetails';
import { ClientsScreen } from './components/ClientsScreen';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { OrderDetails } from './components/OrderDetails';
import { OrdersScreen } from './components/OrdersScreen';
import { Client, Order, Session } from './src/api';
import { colors, styles } from './src/theme';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [clientsScreenOpen, setClientsScreenOpen] = useState(false);
  const [ordersScreenOpen, setOrdersScreenOpen] = useState(false);

  const logout = () => {
    setSession(null);
    setSelectedClient(null);
    setSelectedOrder(null);
    setClientsScreenOpen(false);
    setOrdersScreenOpen(false);
  };

  const updateSelectedOrder = (order: Order) => setSelectedOrder(order);

  return <SafeAreaView style={[styles.safeArea, Platform.OS === 'android' && { paddingTop: NativeStatusBar.currentHeight ?? 0 }]}><StatusBar backgroundColor={colors.background} style="light" />{session ? selectedOrder ? <OrderDetails onBack={() => setSelectedOrder(null)} onUpdated={updateSelectedOrder} order={selectedOrder} token={session.token} /> : selectedClient ? <ClientDetails client={selectedClient} onBack={() => setSelectedClient(null)} onSelectOrder={setSelectedOrder} token={session.token} /> : clientsScreenOpen ? <ClientsScreen onBack={() => setClientsScreenOpen(false)} onSelectClient={setSelectedClient} token={session.token} /> : ordersScreenOpen ? <OrdersScreen onBack={() => setOrdersScreenOpen(false)} onSelectOrder={setSelectedOrder} token={session.token} /> : <Dashboard onLogout={logout} onOpenClients={() => setClientsScreenOpen(true)} onOpenOrders={() => setOrdersScreenOpen(true)} onSelectClient={setSelectedClient} onSelectOrder={setSelectedOrder} session={session} /> : <LoginScreen onLogin={setSession} />}</SafeAreaView>;
}
