import { Pressable, Text, View } from 'react-native';
import { Order } from '../src/api';
import { styles } from '../src/theme';

type OrderCardProps = { order: Order; onPress?: (order: Order) => void };

export function OrderCard({ order, onPress }: OrderCardProps) {
  return (
    <Pressable disabled={!onPress} onPress={() => onPress?.(order)} style={({ pressed }) => [styles.card, order.status === 'pending' ? styles.pendingOrderCard : styles.resolvedOrderCard, onPress && pressed && styles.listItemPressed]}>
      <View style={styles.cardRow}>
        <Text style={[styles.cardTitle, order.status === 'pending' ? styles.pendingOrderText : styles.resolvedOrderText]}>{order.title || `Pedido #${order.id}`}</Text>
        <Text style={[styles.cardValue, order.status === 'pending' ? styles.pendingOrderText : styles.resolvedOrderText]}>${order.value.toLocaleString('es-AR')}</Text>
      </View>
      <Text style={styles.cardMeta}>{order.client?.name || `Pedido #${order.id}`}</Text>
      <Text style={styles.cardMeta}>{order.completionDate ? new Date(order.completionDate).toLocaleDateString('es-AR') : 'Sin fecha de entrega'}</Text>
      {order.observations ? <Text style={styles.orderObservations}>{order.observations}</Text> : null}
    </Pressable>
  );
}
