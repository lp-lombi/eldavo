import { Pressable, Text, View } from 'react-native';
import { faCalendarCheck, faRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Appointment } from '../../../services';
import { colors, styles } from '../../../shared';

type AppointmentCardProps = { appointment: Appointment; onPress: (appointment: Appointment) => void; onSync: (appointment: Appointment) => void };

export function AppointmentCard({ appointment, onPress, onSync }: AppointmentCardProps) {
  const startsAt = new Date(appointment.startsAt);
  const endsAt = new Date(appointment.endsAt);
  const isExpired = appointment.status === 'scheduled' && endsAt.getTime() < Date.now();
  const statusLabel = appointment.status === 'cancelled' ? 'Cancelado' : appointment.status === 'completed' ? 'Finalizado' : isExpired ? 'Vencido' : 'Programado';

  return (
    <View style={styles.appointmentCard}>
      <Pressable onPress={() => onPress(appointment)} style={({ pressed }) => [pressed && styles.listItemPressed]}>
        <View style={styles.appointmentCardHeader}>
          <View style={styles.appointmentCardIcon}>
            <FontAwesomeIcon color={colors.accent} icon={faCalendarCheck} size={16} />
          </View>
          <View style={styles.appointmentCardCopy}>
            <Text style={styles.appointmentCardTitle}>{appointment.title}</Text>
            <Text style={styles.appointmentCardClient}>{appointment.client?.name || 'Cliente sin asignar'}</Text>
          </View>
          <Text style={[styles.appointmentStatusText, appointment.status === 'cancelled' && styles.cancelledAppointmentText, appointment.status === 'completed' && styles.completedAppointmentText, isExpired && styles.expiredAppointmentText]}>{statusLabel}</Text>
        </View>
        <Text style={styles.appointmentCardDate}>{startsAt.toLocaleString('es-AR', { dateStyle: 'medium' })} · {startsAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {endsAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
        {appointment.syncStatus !== 'synced' ? <View style={styles.syncStatusRow}><Text style={styles.syncErrorText}>{appointment.syncStatus === 'failed' ? appointment.syncError || 'No se sincronizó' : 'Sincronización con Google Calendar pendiente'}</Text><Pressable onPress={() => onSync(appointment)} style={styles.syncRetryButton}><FontAwesomeIcon color={colors.accent} icon={faRotate} size={12} /><Text style={styles.syncRetryText}>Sincronizar</Text></Pressable></View> : null}
        <Text style={styles.appointmentCardDescription}>{appointment.description || 'Sin notas'}</Text>
      </Pressable>
    </View>
  );
}
