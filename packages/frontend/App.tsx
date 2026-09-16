import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { ClientDetails } from './components/ClientDetails';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { OrderDetails } from './components/OrderDetails';
import { Client, Order, Session } from './src/api';
import { colors, styles } from './src/theme';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const logout = () => {
    setSession(null);
    setSelectedClient(null);
    setSelectedOrder(null);
  };

  const updateSelectedOrder = (order: Order) => setSelectedOrder(order);

  return <SafeAreaView style={styles.safeArea}><StatusBar style="light" />{session ? selectedOrder ? <OrderDetails onBack={() => setSelectedOrder(null)} onUpdated={updateSelectedOrder} order={selectedOrder} token={session.token} /> : selectedClient ? <ClientDetails client={selectedClient} onBack={() => setSelectedClient(null)} onSelectOrder={setSelectedOrder} token={session.token} /> : <Dashboard onLogout={logout} onSelectClient={setSelectedClient} onSelectOrder={setSelectedOrder} session={session} /> : <LoginScreen onLogin={setSession} />}</SafeAreaView>;
}
