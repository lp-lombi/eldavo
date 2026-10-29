import { Pressable, Text, View } from 'react-native';
import { Appointment } from '../../../services';
import { colors, styles } from '../../../shared';

type AppointmentCardProps = { appointment: Appointment; onPress: (appointment: Appointment) => void };

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const startsAt = new Date(appointment.startsAt);
  const endsAt = new Date(appointment.endsAt);

  return (
    <Pressable onPress={() => onPress(appointment)} style={({ pressed }) => [styles.card, pressed && styles.listItemPressed]}>
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{appointment.title}</Text>
        <Text style={[styles.appointmentStatusText, appointment.status === 'cancelled' && styles.cancelledAppointmentText]}>{appointment.status === 'cancelled' ? 'Cancelado' : 'Programado'}</Text>
      </View>
      <Text style={styles.cardMeta}>{appointment.client?.name || 'Cliente sin asignar'}</Text>
      <Text style={styles.cardMeta}>{startsAt.toLocaleString('es-AR')} - {endsAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
      {appointment.syncStatus !== 'synced' ? <Text style={styles.syncErrorText}>{appointment.syncStatus === 'failed' ? appointment.syncError || 'No se sincronizó' : 'Sincronización pendiente'}</Text> : null}
      <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{appointment.description || 'Sin notas'}</Text>
    </Pressable>
  );
}
