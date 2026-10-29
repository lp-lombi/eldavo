import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Appointment, deleteAppointment } from '../../../services';
import { colors, styles } from '../../../shared';

type AppointmentDetailsModalProps = {
  appointment: Appointment | null;
  onClose: () => void;
  onDeleted: (appointmentId: number) => void;
  token: string;
};

export function AppointmentDetailsModal({ appointment, onClose, onDeleted, token }: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  const removeAppointment = async () => {
    try {
      await deleteAppointment(token, appointment.id);
      onDeleted(appointment.id);
      onClose();
    } catch {
      // no-op in minimal modal; caller can handle failure elsewhere
    }
  };

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={styles.tagManagerOverlay}>
        <View style={styles.tagManagerDialog}>
          <ScrollView>
            <Text style={styles.sectionTitle}>{appointment.title}</Text>
            <Text style={styles.cardMeta}>{appointment.client?.name || 'Cliente sin asignar'}</Text>
            <Text style={styles.cardMeta}>{new Date(appointment.startsAt).toLocaleString('es-AR')}</Text>
            {appointment.description ? <Text style={styles.orderObservations}>{appointment.description}</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable onPress={onClose} style={[styles.secondaryButton, styles.buttonRowItem]}>
                <Text style={styles.secondaryText}>Cerrar</Text>
              </Pressable>
              <Pressable onPress={removeAppointment} style={[styles.deleteButton, styles.buttonRowItem]}>
                <Text style={styles.deleteText}>Eliminar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
