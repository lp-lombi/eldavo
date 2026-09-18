import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { faArrowLeft, faCircleCheck, faFloppyDisk, faPen, faRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { deleteOrder, Order, updateOrder } from '../src/api';
import { colors, styles } from '../src/theme';
import { ConfirmationModal } from './ConfirmationModal';
import { DeliveryDatePicker } from './DeliveryDatePicker';

type OrderDetailsProps = { order: Order; onBack: () => void; onUpdated: (order: Order) => void; token: string };

function formatDateInput(date?: string | null): string {
  return date ? new Date(date).toISOString().slice(0, 10) : '';
}

export function OrderDetails({ order, onBack, onUpdated, token }: OrderDetailsProps) {
  const [value, setValue] = useState(String(order.value));
  const [completionDate, setCompletionDate] = useState(formatDateInput(order.completionDate));
  const [observations, setObservations] = useState(order.observations || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);

  useEffect(() => {
    setValue(String(order.value));
    setCompletionDate(formatDateInput(order.completionDate));
    setObservations(order.observations || '');
  }, [order.completionDate, order.id, order.observations, order.value]);

  const toggleStatus = async () => {
    try {
      onUpdated(await updateOrder(token, order.id, { status: order.status === 'pending' ? 'resolved' : 'pending' }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el estado');
    }
  };

  const saveChanges = async () => {
    const parsedValue = Number(value.replace(',', '.'));
    if (!value.trim() || !Number.isFinite(parsedValue)) {
      setError('El importe debe ser un número válido');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const updatedOrder = await updateOrder(token, order.id, { completionDate: completionDate.trim() || null, value: parsedValue, observations });
      onUpdated(updatedOrder);
      setEditing(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el pedido');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setValue(String(order.value));
    setCompletionDate(formatDateInput(order.completionDate));
    setObservations(order.observations || '');
    setError('');
    setEditing(false);
  };

  const removeOrder = async () => {
    setDeleteConfirmationVisible(false);
    setError('');
    setDeleting(true);
    try {
      await deleteOrder(token, order.id);
      onBack();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar el pedido');
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <View style={styles.buttonContent}>
          <FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} />
          <Text style={styles.backText}>Volver</Text>
        </View>
      </Pressable>
      <View style={styles.detailHeader}>
        <Text style={styles.eyebrow}>Detalle del pedido</Text>
        <View style={styles.nameRow}>
          <Text style={styles.title}>{order.title || `Pedido #${order.id}`}</Text>
          {!editing ? <Pressable accessibilityLabel="Editar pedido" onPress={() => { setError(''); setEditing(true); }} style={styles.editIconButton}>
            <FontAwesomeIcon color={colors.accent} icon={faPen} size={17} />
          </Pressable> : null}
        </View>
      </View>
      <View>
        <View style={styles.detailRow}>
          <View style={styles.detailRowInfoFull}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.detailValue}>{order.client?.name || 'Sin cliente'}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailRowInfoFull}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.detailValue}>{order.status === 'pending' ? 'Pendiente' : 'Resuelto'}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailRowInfoFull}>
            <Text style={styles.label}>Fecha de creación</Text>
            <Text style={styles.detailValue}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : 'Sin fecha de creación'}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailRowInfoFull}>
            <Text style={styles.label}>Importe</Text>
            {editing ? <TextInput keyboardType="decimal-pad" onChangeText={setValue} style={[styles.input, styles.detailInput]} value={value} /> : <Text style={styles.detailValue}>${order.value.toLocaleString('es-AR')}</Text>}
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailRowInfoFull}>
            <Text style={styles.label}>Fecha de entrega</Text>
            {editing ? <DeliveryDatePicker onChange={setCompletionDate} value={completionDate} /> : <Text style={styles.detailValue}>{order.completionDate ? new Date(order.completionDate).toLocaleDateString('es-AR') : 'Sin fecha de entrega'}</Text>}
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailRowInfoFull}>
            <Text style={styles.label}>Observaciones</Text>
            {editing ? <TextInput multiline onChangeText={setObservations} placeholder="Sin observaciones" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailInput, styles.detailTextarea]} textAlignVertical="top" value={observations} /> : <Text style={styles.detailValue}>{order.observations || 'Sin observaciones'}</Text>}
          </View>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {editing ? <>
        <Pressable disabled={saving || deleting} onPress={saveChanges} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <View style={styles.buttonContent}>
            <FontAwesomeIcon color={styles.buttonText.color} icon={faFloppyDisk} size={16} />
            <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
          </View>
        </Pressable>
        <Pressable disabled={saving || deleting} onPress={cancelEditing} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Cancelar</Text>
        </Pressable>
        <Pressable disabled={saving || deleting} onPress={() => setDeleteConfirmationVisible(true)} style={styles.deleteButton}>
          <View style={styles.buttonContent}>
            <FontAwesomeIcon color={styles.deleteText.color} icon={faTrash} size={16} />
            <Text style={styles.deleteText}>{deleting ? 'Eliminando...' : 'Eliminar pedido'}</Text>
          </View>
        </Pressable>
      </> : null}
      <Pressable onPress={toggleStatus} style={styles.orderStatusButton}>
        <FontAwesomeIcon color={styles.orderStatusText.color} icon={order.status === 'pending' ? faCircleCheck : faRotateLeft} size={14} />
        <Text style={styles.orderStatusText}>{order.status === 'pending' ? 'Marcar resuelto' : 'Reabrir pedido'}</Text>
      </Pressable>
      <ConfirmationModal
        message={`¿Querés eliminar ${order.title || `el pedido #${order.id}`}?`}
        onCancel={() => setDeleteConfirmationVisible(false)}
        onConfirm={removeOrder}
        title="Eliminar pedido"
        visible={deleteConfirmationVisible}
      />
    </ScrollView>
  );
}