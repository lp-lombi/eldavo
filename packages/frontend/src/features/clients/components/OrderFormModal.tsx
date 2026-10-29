import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { createOrder, Client, Order } from '../../../services';
import { colors, styles } from '../../../shared';

type OrderFormModalProps = {
  clients: Client[];
  initialClient?: Client;
  token: string;
  visible: boolean;
  onCancel: () => void;
  onCreated: (order: Order) => void;
};

export function OrderFormModal({ clients, initialClient, token, visible, onCancel, onCreated }: OrderFormModalProps) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('1');
  const [completionDate, setCompletionDate] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedClient = initialClient ?? clients[0] ?? null;

  useEffect(() => {
    if (visible) {
      setTitle('');
      setValue('1');
      setCompletionDate('');
      setObservations('');
      setError('');
    }
  }, [visible]);

  const submit = async () => {
    if (!selectedClient) {
      setError('Seleccioná un cliente');
      return;
    }

    const parsedValue = Number(value.replace(/\s/g, '').replace(/\$/, '').replace(',', '.'));
    if (!Number.isFinite(parsedValue)) {
      setError('El importe debe ser válido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const createdOrder = await createOrder(token, {
        clientId: selectedClient.id,
        completionDate: completionDate || undefined,
        observations: observations.trim() || undefined,
        title: title.trim() || `Pedido #${selectedClient.id}`,
        value: parsedValue,
      });
      onCreated(createdOrder);
      onCancel();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.tagManagerOverlay}>
        <View style={styles.tagManagerDialog}>
          <ScrollView>
            <Text style={styles.sectionTitle}>Nuevo pedido</Text>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.detailValue}>{selectedClient ? selectedClient.name : 'Sin cliente'}</Text>
            <Text style={styles.label}>Título</Text>
            <TextInput onChangeText={setTitle} placeholder="Pedido" placeholderTextColor={colors.textMuted} style={styles.input} value={title} />
            <Text style={styles.label}>Importe</Text>
            <TextInput keyboardType="decimal-pad" onChangeText={setValue} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.input} value={value} />
            <Text style={styles.label}>Fecha de entrega</Text>
            <TextInput onChangeText={setCompletionDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} style={styles.input} value={completionDate} />
            <Text style={styles.label}>Observaciones</Text>
            <TextInput multiline onChangeText={setObservations} placeholder="Sin observaciones" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={observations} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable onPress={onCancel} style={[styles.secondaryButton, styles.buttonRowItem]}>
                <Text style={styles.secondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.button, styles.buttonRowItem, pressed && styles.buttonPressed]}>
                <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Crear pedido'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
