import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { faChevronDown, faChevronUp, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Order } from '../src/api';
import { colors, styles } from '../src/theme';
import { OrderCard } from './OrderCard';

type OrderListProps = { orders: Order[]; onAdd: () => void; onSelectOrder?: (order: Order) => void };

export function OrderList({ orders, onAdd, onSelectOrder }: OrderListProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const resolvedOrders = orders.filter((order) => order.status === 'resolved');

  const renderOrders = (sectionOrders: Order[]) => sectionOrders.length ? sectionOrders.map((order) => (
    <OrderCard key={order.id} onPress={onSelectOrder} order={order} />
  )) : <Text style={styles.empty}>No hay pedidos en esta sección.</Text>;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Pressable accessibilityRole="button" onPress={() => setCollapsed((current) => !current)} style={styles.sectionToggle}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Pedidos ({orders.length})</Text>
          <FontAwesomeIcon color={colors.textMuted} icon={collapsed ? faChevronDown : faChevronUp} size={14} />
        </Pressable>
        <Pressable accessibilityLabel="Agregar pedido" onPress={onAdd} style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}>
          <FontAwesomeIcon color={styles.addButtonText.color} icon={faPlus} size={16} />
        </Pressable>
      </View>
      {!collapsed ? <>
        <Text style={styles.orderGroupTitle}>Pendientes ({pendingOrders.length})</Text>
        {renderOrders(pendingOrders)}
        <Text style={styles.orderGroupTitle}>Cerrados ({resolvedOrders.length})</Text>
        {renderOrders(resolvedOrders)}
      </> : null}
    </View>
  );
}
