import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, getClients, getOrders, Order } from '../src/api';
import { colors, styles } from '../src/theme';
import { OrderFormModal } from './OrderFormModal';
import { OrderList } from './OrderList';

type OrdersScreenProps = { onBack: () => void; onSelectOrder: (order: Order) => void; token: string };

export function OrdersScreen({ onBack, onSelectOrder, token }: OrdersScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createVisible, setCreateVisible] = useState(false);

  useEffect(() => {
    Promise.all([getClients(token), getOrders(token)])
      .then(([loadedClients, loadedOrders]) => { setClients(loadedClients); setOrders(loadedOrders); })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los pedidos'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreated = (order: Order) => {
    setOrders((currentOrders) => [...currentOrders, order]);
    setCreateVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.buttonContent}>
            <FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} />
            <Text style={styles.backText}>Volver</Text>
          </View>
        </Pressable>
        <View style={styles.detailHeader}>
          <Text style={styles.eyebrow}>Gestión</Text>
          <Text style={styles.title}>Pedidos</Text>
        </View>
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? <OrderList onAdd={() => setCreateVisible(true)} onSelectOrder={onSelectOrder} orders={orders} /> : null}
      </ScrollView>
      <OrderFormModal clients={clients} onCancel={() => setCreateVisible(false)} onCreated={handleCreated} token={token} visible={createVisible} />
    </View>
  );
}