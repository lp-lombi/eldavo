import { Pressable, Text, View } from 'react-native';
import { faCalendarCheck, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { AppointmentRequest } from '../../../services';
import { colors, styles } from '../../../shared';

type PendingAppointmentRequestsProps = {
  requests: AppointmentRequest[];
  onConfirm: (request: AppointmentRequest) => void;
  onReject: (request: AppointmentRequest) => void;
};

export function PendingAppointmentRequests({ requests, onConfirm, onReject }: PendingAppointmentRequestsProps) {
  if (!requests.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
      {requests.map((request) => (
        <View key={request.id} style={styles.appointmentRequestCard}>
          <View style={styles.appointmentRequestHeader}>
            <View style={styles.appointmentRequestIcon}>
              <FontAwesomeIcon color={colors.accent} icon={faCalendarCheck} size={16} />
            </View>
            <View style={styles.appointmentRequestCopy}>
              <Text style={styles.appointmentRequestTitle}>{request.requesterName}</Text>
              <Text style={styles.appointmentRequestDate}>{new Date(request.startsAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
            </View>
          </View>
          {request.notes ? <Text style={styles.appointmentRequestNotes}>{request.notes}</Text> : null}
          <View style={styles.appointmentRequestActions}>
            <Pressable onPress={() => onConfirm(request)} style={[styles.appointmentRequestAction, styles.appointmentRequestConfirm]}>
              <FontAwesomeIcon color={colors.background} icon={faCheck} size={14} />
              <Text style={styles.appointmentRequestConfirmText}>Confirmar turno</Text>
            </Pressable>
            <Pressable onPress={() => onReject(request)} style={[styles.appointmentRequestAction, styles.appointmentRequestReject]}>
              <FontAwesomeIcon color={colors.danger} icon={faXmark} size={14} />
              <Text style={styles.appointmentRequestRejectText}>Rechazar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
