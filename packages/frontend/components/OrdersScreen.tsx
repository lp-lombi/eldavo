import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { faArrowLeft, faClipboardList } from '@fortawesome/free-solid-svg-icons';
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
  const [titleFilter, setTitleFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

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

  const filteredOrders = orders.filter((order) => {
    const clientName = clients.find((client) => client.id === order.clientId)?.name || order.client?.name || '';
    const matchesTitle = order.title.toLocaleLowerCase().includes(titleFilter.trim().toLocaleLowerCase());
    const matchesClient = clientName.toLocaleLowerCase().includes(clientFilter.trim().toLocaleLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesTitle && matchesClient && matchesStatus;
  });

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
          <Text style={styles.eyebrow}>Pedidos</Text>
        </View>
        <View style={styles.dashboardActionsSection}>
          <View style={styles.dashboardActions}>
            <Pressable accessibilityLabel="Nuevo pedido" onPress={() => setCreateVisible(true)} style={({ pressed }) => [styles.dashboardAction, pressed && styles.buttonPressed]}>
              <FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faClipboardList} size={22} />
              <Text style={styles.dashboardActionText}>Nuevo pedido</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.clientFilters}>
          <Text style={styles.label}>Filtrar</Text>
          <TextInput autoCapitalize="none" onChangeText={setTitleFilter} placeholder="Por título" placeholderTextColor={colors.textMuted} style={styles.clientFilterInput} value={titleFilter} />
          <TextInput autoCapitalize="none" onChangeText={setClientFilter} placeholder="Por cliente" placeholderTextColor={colors.textMuted} style={styles.clientFilterInput} value={clientFilter} />
          <View style={styles.clientFilterToggle}>
            {([['all', 'Todos'], ['pending', 'Pendientes'], ['resolved', 'Cerrados']] as const).map(([filter, label]) => (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: statusFilter === filter }} key={filter} onPress={() => setStatusFilter(filter)} style={[styles.clientFilterButton, statusFilter === filter && styles.clientFilterButtonActive]}>
                <Text style={[styles.clientFilterButtonText, statusFilter === filter && styles.clientFilterButtonTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? <OrderList onSelectOrder={onSelectOrder} orders={filteredOrders} /> : null}
      </ScrollView>
      <OrderFormModal clients={clients} onCancel={() => setCreateVisible(false)} onCreated={handleCreated} token={token} visible={createVisible} />
    </View>
  );
}