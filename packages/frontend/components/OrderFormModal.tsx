import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, createOrder, Order } from '../src/api';
import { colors, styles } from '../src/theme';
import { clientFormModalStyles as modalStyles } from './ClientFormModal.styles';
import { DeliveryDatePicker } from './DeliveryDatePicker';

type OrderFormModalProps = { clients: Client[]; initialClient?: Client; visible: boolean; token: string; onCancel: () => void; onCreated: (order: Order) => void };

export function OrderFormModal({ clients, initialClient, visible, token, onCancel, onCreated }: OrderFormModalProps) {
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setClientSearch(initialClient?.name || '');
      setSelectedClient(initialClient || null);
      setPickerOpen(false);
      setTitle('');
      setValue('');
      setCompletionDate('');
      setObservations('');
      setError('');
    }
  }, [initialClient, visible]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = clientSearch.trim().toLocaleLowerCase();
    return clients.filter((client) => client.name.toLocaleLowerCase().includes(normalizedSearch));
  }, [clientSearch, clients]);

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setPickerOpen(false);
  };

  const submit = async () => {
    const parsedValue = Number(value.replace(',', '.'));
    if (!selectedClient) {
      setError('Seleccioná un cliente');
      return;
    }
    if (!value.trim() || !Number.isFinite(parsedValue)) {
      setError('El importe debe ser un número válido');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const order = await createOrder(token, { clientId: selectedClient.id, completionDate: completionDate.trim() || undefined, observations: observations.trim(), title: title.trim(), value: parsedValue });
      onCreated(order);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.dialog}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Nuevo pedido</Text>
            <Pressable accessibilityLabel="Cerrar formulario" onPress={onCancel} style={modalStyles.closeButton}>
              <FontAwesomeIcon color={colors.textMuted} icon={faXmark} size={20} />
            </Pressable>
          </View>
          <View style={[modalStyles.pickerContainer, pickerOpen && modalStyles.pickerContainerOpen]}>
            <Text style={styles.label}>Cliente</Text>
            <View style={modalStyles.picker}>
              <View style={styles.cardRow}>
                <TextInput onChangeText={(text) => { setClientSearch(text); setSelectedClient(null); setPickerOpen(true); }} onFocus={() => setPickerOpen(true)} placeholder="Buscar por nombre" placeholderTextColor={colors.textMuted} style={[selectedClient ? modalStyles.pickerText : modalStyles.pickerPlaceholder, { flex: 1, padding: 0 }]} value={clientSearch} />
                <FontAwesomeIcon color={colors.textMuted} icon={faChevronDown} size={14} />
              </View>
            </View>
            {pickerOpen ? <View style={modalStyles.pickerOptions}>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {filteredClients.length ? filteredClients.map((client) => (
                  <Pressable key={client.id} onPress={() => selectClient(client)} style={modalStyles.pickerOption}>
                    <Text style={styles.detailValue}>{client.name}</Text>
                    {client.phone ? <Text style={styles.cardMeta}>{client.phone}</Text> : null}
                  </Pressable>
                )) : <Text style={styles.empty}>No hay clientes que coincidan.</Text>}
              </ScrollView>
            </View> : null}
          </View>
          <Text style={styles.label}>Título</Text>
          <TextInput onChangeText={setTitle} placeholder="Pedido" placeholderTextColor={colors.textMuted} style={styles.input} value={title} />
          <Text style={styles.label}>Importe</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={setValue} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.input} value={value} />
          <Text style={styles.label}>Fecha de entrega</Text>
          <DeliveryDatePicker onChange={setCompletionDate} value={completionDate} />
          <Text style={styles.label}>Observaciones</Text>
          <TextInput multiline onChangeText={setObservations} placeholder="Sin observaciones" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} textAlignVertical="top" value={observations} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={modalStyles.actions}>
            <Pressable disabled={saving} onPress={onCancel} style={[styles.secondaryButton, modalStyles.actionButton]}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.button, modalStyles.actionButton, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Crear pedido'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}