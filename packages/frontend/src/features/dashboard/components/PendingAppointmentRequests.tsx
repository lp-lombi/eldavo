import { Pressable, Text, View } from 'react-native';
import { AppointmentRequest } from '../../../services';
import { styles } from '../../../shared';

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
        <View key={request.id} style={styles.card}>
          <Text style={styles.cardTitle}>{request.requesterName}</Text>
          <Text style={styles.cardMeta}>{new Date(request.startsAt).toLocaleString('es-AR')} - {new Date(request.endsAt).toLocaleString('es-AR')}</Text>
          {request.notes ? <Text style={styles.cardMeta}>{request.notes}</Text> : null}
          <View style={styles.requestActions}>
            <Pressable onPress={() => onConfirm(request)} style={styles.button}>
              <Text style={styles.buttonText}>Confirmar</Text>
            </Pressable>
            <Pressable onPress={() => onReject(request)} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Rechazar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
