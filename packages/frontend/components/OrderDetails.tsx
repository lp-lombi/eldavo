import { Pressable, ScrollView, Text, View } from 'react-native';
import { faArrowLeft, faCircleCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Order, updateOrder } from '../src/api';
import { styles } from '../src/theme';

type OrderDetailsProps = { order: Order; onBack: () => void; onUpdated: (order: Order) => void; token: string };

export function OrderDetails({ order, onBack, onUpdated, token }: OrderDetailsProps) {
  const toggleStatus = async () => {
    onUpdated(await updateOrder(token, order.id, { status: order.status === 'pending' ? 'resolved' : 'pending' }));
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <View style={styles.buttonContent}>
          <FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} />
          <Text style={styles.backText}>Volver a pedidos</Text>
        </View>
      </Pressable>
      <View style={styles.detailHeader}>
        <Text style={styles.eyebrow}>Detalle del pedido</Text>
        <Text style={styles.title}>{order.title || `Pedido #${order.id}`}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Cliente</Text>
        <Text style={styles.detailValue}>{order.client?.name || 'Sin cliente'}</Text>
        <Text style={styles.label}>Importe</Text>
        <Text style={styles.detailValue}>${order.value.toLocaleString('es-AR')}</Text>
        <Text style={styles.label}>Fecha de entrega</Text>
        <Text style={styles.detailValue}>{order.completionDate ? new Date(order.completionDate).toLocaleDateString('es-AR') : 'Sin fecha de entrega'}</Text>
        <Text style={styles.label}>Estado</Text>
        <Text style={styles.detailValue}>{order.status === 'pending' ? 'Pendiente' : 'Resuelto'}</Text>
        <Text style={styles.label}>Observaciones</Text>
        <Text style={styles.detailValue}>{order.observations || 'Sin observaciones'}</Text>
      </View>
      <Pressable onPress={toggleStatus} style={styles.orderStatusButton}>
        <FontAwesomeIcon color={styles.orderStatusText.color} icon={order.status === 'pending' ? faCircleCheck : faRotateLeft} size={14} />
        <Text style={styles.orderStatusText}>{order.status === 'pending' ? 'Marcar resuelto' : 'Reabrir pedido'}</Text>
      </Pressable>
    </ScrollView>
  );
}