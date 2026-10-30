import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { faArrowLeft, faEnvelope, faFloppyDisk, faPen, faRotate, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Appointment, deleteAppointment, sendAppointmentConfirmationEmail, syncAppointment, updateAppointment } from '../../../services';
import { colors, styles } from '../../../shared';
import { ConfirmationModal } from '../../clients/ConfirmationModal';

type Props = { appointment: Appointment; onBack: () => void; onUpdated: (appointment: Appointment) => void; token: string };

export function AppointmentDetailsScreen({ appointment, onBack, onUpdated, token }: Props) {
  const [title, setTitle] = useState(appointment.title);
  const [description, setDescription] = useState(appointment.description || '');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);

  useEffect(() => {
    setTitle(appointment.title);
    setDescription(appointment.description || '');
  }, [appointment.description, appointment.id, appointment.title]);

  const save = async () => {
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    setBusy(true); setError('');
    try { onUpdated(await updateAppointment(token, appointment.id, { title, description })); setEditing(false); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el turno'); }
    finally { setBusy(false); }
  };
  const changeStatus = async (status: Appointment['status']) => {
    setBusy(true); setError('');
    try { onUpdated(await updateAppointment(token, appointment.id, { status })); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el estado'); }
    finally { setBusy(false); }
  };
  const sync = async () => {
    setBusy(true); setError('');
    try { onUpdated(await syncAppointment(token, appointment.id)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo sincronizar el turno'); }
    finally { setBusy(false); }
  };
  const resendEmail = async () => {
    setBusy(true); setError('');
    try { await sendAppointmentConfirmationEmail(token, appointment.id); Alert.alert('Correo enviado', 'La confirmación fue enviada al email del cliente.'); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar el correo'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setDeleteConfirmationVisible(false);
    setBusy(true); setError('');
    try { await deleteAppointment(token, appointment.id); onBack(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar el turno'); setBusy(false); }
  };
  const isExpired = appointment.status === 'scheduled' && new Date(appointment.endsAt).getTime() < Date.now();
  const statusLabel = appointment.status === 'cancelled' ? 'Cancelado' : appointment.status === 'completed' ? 'Finalizado' : isExpired ? 'Vencido' : 'Programado';

  const client = appointment.client;
  const statusOptions: Array<[Appointment['status'], string]> = [['scheduled', 'Programado'], ['completed', 'Finalizado'], ['cancelled', 'Cancelado']];

  return <ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={onBack} style={styles.backButton}><View style={styles.buttonContent}><FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} /><Text style={styles.backText}>Volver</Text></View></Pressable>
    <View style={styles.detailHeader}><Text style={styles.eyebrow}>Detalle del turno</Text><View style={styles.appointmentHeaderRow}><Text style={[styles.title, styles.appointmentHeaderTitle]}>{appointment.title}</Text><Text style={[styles.appointmentStatusBadge, appointment.status === 'cancelled' ? styles.appointmentCancelledBadge : appointment.status === 'completed' ? styles.appointmentCompletedBadge : isExpired ? styles.appointmentExpiredBadge : styles.appointmentScheduledBadge]}>{statusLabel}</Text></View></View>
    <View style={styles.detailRow}><View style={styles.detailRowInfoFull}><Text style={styles.label}>Fecha y horario</Text><Text style={styles.detailValue}>{new Date(appointment.startsAt).toLocaleString('es-AR')} - {new Date(appointment.endsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text></View></View>
    <View style={styles.appointmentContactCard}>
      <Text style={styles.label}>Cliente asociado</Text>
      {client ? <><Text style={styles.appointmentContactName}>{client.name}</Text><Text style={styles.appointmentContactLine}>{client.email || 'Email no informado'}</Text><Text style={styles.appointmentContactLine}>{client.phone || 'Teléfono no informado'}</Text><Text style={styles.appointmentContactLine}>{client.address || 'Dirección no informada'}</Text></> : <Text style={styles.appointmentUnassigned}>Este turno no está asociado a un cliente.</Text>}
    </View>
    <View style={styles.detailRow}><View style={styles.detailRowInfoFull}><Text style={styles.label}>Título</Text>{editing ? <TextInput onChangeText={setTitle} style={[styles.input, styles.detailInput]} value={title} /> : <Text style={styles.detailValue}>{appointment.title}</Text>}</View></View>
    <View style={styles.orderObservationsBlock}><Text style={styles.label}>Observaciones</Text>{editing ? <TextInput multiline onChangeText={setDescription} placeholder="Sin observaciones" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailInput, styles.detailTextarea]} textAlignVertical="top" value={description} /> : <Text style={styles.orderObservations}>{appointment.description || 'Sin observaciones'}</Text>}</View>
    <View style={styles.detailRow}><View style={styles.detailRowInfoFull}><Text style={styles.label}>Google Calendar</Text><Text style={styles.detailValue}>{appointment.syncStatus === 'synced' ? 'Sincronizado' : appointment.syncStatus === 'failed' ? appointment.syncError || 'Error de sincronización' : 'Sincronización con Google Calendar pendiente'}</Text></View></View>
    <View style={styles.appointmentStatusSection}><Text style={styles.label}>Estado del turno</Text><Text style={styles.appointmentStatusDescription}>Seleccioná un estado para actualizar este turno.</Text><View style={styles.appointmentStatusOptions}>{statusOptions.map(([status, label]) => <Pressable disabled={busy} key={status} onPress={() => void changeStatus(status)} style={[styles.appointmentStatusOption, appointment.status === status && styles.appointmentStatusOptionActive]}><Text style={appointment.status === status ? styles.appointmentStatusOptionTextActive : styles.appointmentStatusOptionText}>{label}</Text></Pressable>)}</View></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.appointmentDetailsActions}>
      <Pressable disabled={busy} onPress={() => editing ? void save() : setEditing(true)} style={styles.appointmentDetailAction}><FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={editing ? faFloppyDisk : faPen} size={16} /><Text style={styles.appointmentDetailActionText}>{editing ? 'Guardar cambios' : 'Editar turno'}</Text></Pressable>
      <Pressable disabled={busy} onPress={() => void resendEmail()} style={styles.appointmentDetailAction}><FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faEnvelope} size={16} /><Text style={styles.appointmentDetailActionText}>Reenviar email</Text></Pressable>
      <Pressable disabled={busy} onPress={() => void sync()} style={styles.appointmentDetailAction}><FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faRotate} size={16} /><Text style={styles.appointmentDetailActionText}>Sincronizar</Text></Pressable>
    </View>
    <Pressable disabled={busy} onPress={() => setDeleteConfirmationVisible(true)} style={styles.deleteButton}><FontAwesomeIcon color={styles.deleteText.color} icon={faTrash} size={16} /><Text style={styles.deleteText}>Eliminar turno</Text></Pressable>
    <ConfirmationModal message="Esta acción no se puede deshacer." onCancel={() => setDeleteConfirmationVisible(false)} onConfirm={() => void remove()} title="¿Eliminar este turno?" visible={deleteConfirmationVisible} />
  </ScrollView>;
}
