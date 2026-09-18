import { Pressable, Text, View } from 'react-native';
import { Order } from '../src/api';
import { styles } from '../src/theme';
import { OrderCard } from './OrderCard';

type OrderListProps = { orders: Order[]; onSelectOrder?: (order: Order) => void; title?: string };

export function OrderList({ orders, onSelectOrder, title = 'Pedidos' }: OrderListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>{title} ({orders.length})</Text>
      </View>
      {orders.length ? orders.map((order) => (
    <OrderCard key={order.id} onPress={onSelectOrder} order={order} />
      )) : <Text style={styles.empty}>No hay pedidos que coincidan.</Text>}
    </View>
  );
}
