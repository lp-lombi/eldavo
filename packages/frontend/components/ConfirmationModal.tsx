import { Modal, Pressable, Text, View } from 'react-native';
import { confirmationModalStyles as styles } from './ConfirmationModal.styles';

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationModal({ visible, title, message, onCancel, onConfirm }: ConfirmationModalProps) {
  return (
    <Modal onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.actionButton, styles.cancelButton]}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.actionButton, styles.confirmButton]}>
              <Text style={styles.confirmText}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}