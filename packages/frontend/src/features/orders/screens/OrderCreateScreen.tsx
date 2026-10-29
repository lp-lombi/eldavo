import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { faArrowLeft, faChevronDown, faClipboardList, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, createOrder, getClients, Order } from '../../../services';
import { colors, styles } from '../../../shared';
import { DeliveryDatePicker } from '../DeliveryDatePicker';
import { StockLinePicker } from '../StockLinePicker';

type OrderCreateScreenProps = { initialClient?: Client; onBack: () => void; onCreated: (order: Order) => void; token: string };

export function OrderCreateScreen({ initialClient, onBack, onCreated, token }: OrderCreateScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('1');
  const [completionDate, setCompletionDate] = useState('');
  const [observations, setObservations] = useState('');
  const [stockItems, setStockItems] = useState<{ stockItemId: number; quantity: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getClients(token).then(setClients).catch(() => setClients([])); }, [token]);
  useEffect(() => { setClientSearch(initialClient?.name || ''); setSelectedClient(initialClient || null); }, [initialClient]);
  const filteredClients = useMemo(() => clients.filter((client) => client.name.toLocaleLowerCase().includes(clientSearch.trim().toLocaleLowerCase())), [clientSearch, clients]);
  const submit = async () => {
    const normalizedValue = value.replace(/\s/g, '').replace(/^\$/, '').replace(',', '.');
    const parsedValue = Number(normalizedValue);
    if (!selectedClient) return setError('Seleccioná un cliente');
    if (!value.trim() || !Number.isFinite(parsedValue)) return setError('El importe debe ser un número válido');
    setError(''); setSaving(true);
    try { onCreated(await createOrder(token, { clientId: selectedClient.id, completionDate: completionDate.trim() || undefined, observations: observations.trim(), stockItems, title: title.trim(), value: parsedValue })); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el pedido'); }
    finally { setSaving(false); }
  };
  return <ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={onBack} style={styles.backButton}><View style={styles.buttonContent}><FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} /><Text style={styles.backText}>Volver</Text></View></Pressable>
    <View style={styles.detailHeader}><Text style={styles.eyebrow}>Nuevo pedido</Text><Text style={styles.title}>Registrar pedido</Text></View>
    <Text style={styles.label}>Cliente</Text>
    <View style={styles.orderClientPicker}><View style={styles.cardRow}><TextInput onChangeText={(text) => { setClientSearch(text); setSelectedClient(null); setPickerOpen(true); }} onFocus={() => setPickerOpen(true)} placeholder="Buscar por nombre" placeholderTextColor={colors.textMuted} style={[styles.input, styles.orderClientInput, selectedClient && styles.datePickerValue]} value={clientSearch} /><FontAwesomeIcon color={colors.textMuted} icon={faChevronDown} size={14} /></View>{pickerOpen ? <View style={styles.orderClientOptions}><ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>{filteredClients.length ? filteredClients.map((client) => <Pressable key={client.id} onPress={() => { setSelectedClient(client); setClientSearch(client.name); setPickerOpen(false); }} style={styles.orderClientOption}><Text style={styles.detailValue}>{client.name}</Text>{client.phone ? <Text style={styles.cardMeta}>{client.phone}</Text> : null}</Pressable>) : <Text style={styles.empty}>No hay clientes que coincidan.</Text>}</ScrollView></View> : null}</View>
    <Text style={styles.label}>Título</Text><TextInput onChangeText={setTitle} placeholder="Pedido" placeholderTextColor={colors.textMuted} style={styles.input} value={title} />
    <Text style={styles.label}>Importe</Text><TextInput keyboardType="decimal-pad" onChangeText={setValue} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.input} value={value} />
    <Text style={styles.label}>Fecha de entrega</Text><DeliveryDatePicker onChange={setCompletionDate} value={completionDate} />
    <Text style={styles.label}>Observaciones</Text><TextInput multiline onChangeText={setObservations} placeholder="Sin observaciones" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} textAlignVertical="top" value={observations} />
    <Text style={styles.label}>Productos que consume (opcional)</Text><StockLinePicker onChange={setStockItems} token={token} value={stockItems} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}><View style={styles.buttonContent}><FontAwesomeIcon color={styles.buttonText.color} icon={faFloppyDisk} size={16} /><Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Crear pedido'}</Text></View></Pressable>
  </ScrollView>;
}
