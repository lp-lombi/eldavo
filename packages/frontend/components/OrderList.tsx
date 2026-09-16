import { Text, View } from 'react-native';
import { Order } from '../src/api';
import { styles } from '../src/theme';
import { OrderCard } from './OrderCard';

type OrderListProps = { orders: Order[]; onSelectOrder?: (order: Order) => void };

export function OrderList({ orders, onSelectOrder }: OrderListProps) {
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const resolvedOrders = orders.filter((order) => order.status === 'resolved');

  const renderOrders = (sectionOrders: Order[]) => sectionOrders.length ? sectionOrders.map((order) => (
    <OrderCard key={order.id} onPress={onSelectOrder} order={order} />
  )) : <Text style={styles.empty}>No hay pedidos en esta sección.</Text>;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pedidos ({orders.length})</Text>
      <Text style={styles.orderGroupTitle}>Pendientes ({pendingOrders.length})</Text>
      {renderOrders(pendingOrders)}
      <Text style={styles.orderGroupTitle}>Cerrados ({resolvedOrders.length})</Text>
      {renderOrders(resolvedOrders)}
    </View>
  );
}
