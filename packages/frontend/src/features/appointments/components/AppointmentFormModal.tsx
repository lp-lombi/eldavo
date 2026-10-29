import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Appointment, Client, createAppointment } from '../../../services';
import { colors, styles } from '../../../shared';
import { clientFormModalStyles as modalStyles } from '../../clients/ClientFormModal.styles';
import { AppointmentDateTimePicker } from './AppointmentDateTimePicker';

type AppointmentFormModalProps = { clients: Client[]; onCancel: () => void; onCreated: (appointment: Appointment) => void; token: string; visible: boolean };

function initialDate(offsetHours: number): string {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00`;
}

function addHour(value: string): string {
  const date = new Date(value);
  date.setHours(date.getHours() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function AppointmentFormModal({ clients, onCancel, onCreated, token, visible }: AppointmentFormModalProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState(initialDate(1));
  const [endsAt, setEndsAt] = useState(initialDate(2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (visible) { const start = initialDate(1); setTitle(''); setClientId(''); setClientSearch(''); setDescription(''); setStartsAt(start); setEndsAt(addHour(start)); setError(''); } }, [visible]);
  useEffect(() => { if (visible) setEndsAt(addHour(startsAt)); }, [startsAt, visible]);

  const filteredClients = clients.filter((client) => client.name.toLocaleLowerCase().includes(clientSearch.trim().toLocaleLowerCase()));
  async function submit() {
    if (!title.trim() || !startsAt || !endsAt) { setError('Completa el título y las fechas'); return; }
    setSaving(true); setError('');
    try { onCreated(await createAppointment(token, { title: title.trim(), clientId: clientId ? Number(clientId) : null, description: description.trim(), startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() })); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el turno'); }
    finally { setSaving(false); }
  }

  return <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}><View style={modalStyles.overlay}><View style={[modalStyles.dialog, styles.appointmentDialog]}><ScrollView keyboardShouldPersistTaps="handled"><View style={modalStyles.header}><Text style={modalStyles.title}>Nuevo turno</Text><Pressable accessibilityLabel="Cerrar formulario" onPress={onCancel} style={modalStyles.closeButton}><FontAwesomeIcon color={colors.textMuted} icon={faXmark} size={20} /></Pressable></View><Text style={styles.label}>Título</Text><TextInput autoFocus onChangeText={setTitle} placeholder="Ej. Reunión con cliente" placeholderTextColor={colors.textMuted} style={styles.input} value={title} /><Text style={styles.label}>Cliente (opcional)</Text><TextInput autoCapitalize="none" onChangeText={setClientSearch} placeholder="Buscar por nombre" placeholderTextColor={colors.textMuted} style={styles.input} value={clientSearch} /><ScrollView nestedScrollEnabled style={styles.appointmentClientList}>{filteredClients.map((client) => <Pressable key={client.id} onPress={() => setClientId(String(client.id))} style={[styles.appointmentClientOption, clientId === String(client.id) && styles.appointmentClientOptionSelected]}><Text style={clientId === String(client.id) ? styles.appointmentClientOptionTextSelected : styles.appointmentClientOptionText}>{client.name}</Text></Pressable>)}</ScrollView><Text style={styles.appointmentSelectedClient}>{clientId ? clients.find((client) => String(client.id) === clientId)?.name : 'Ningún cliente seleccionado'}</Text><AppointmentDateTimePicker label="Inicio" onChange={setStartsAt} value={startsAt} /><AppointmentDateTimePicker label="Fin" onChange={setEndsAt} value={endsAt} /><Text style={styles.label}>Notas</Text><TextInput multiline onChangeText={setDescription} placeholder="Detalles del turno" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={description} />{error ? <Text style={styles.error}>{error}</Text> : null}<View style={[modalStyles.actions, styles.buttonRow]}><Pressable disabled={saving} onPress={onCancel} style={[styles.secondaryButton, styles.buttonRowItem]}><Text style={styles.secondaryText}>Cancelar</Text></Pressable><Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.button, styles.buttonRowItem, pressed && styles.buttonPressed]}><Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Crear turno'}</Text></Pressable></View></ScrollView></View></View></Modal>;
}
