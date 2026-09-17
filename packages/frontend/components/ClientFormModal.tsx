import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, createClient } from '../src/api';
import { colors, styles } from '../src/theme';
import { clientFormModalStyles as modalStyles } from './ClientFormModal.styles';

type ClientFormModalProps = { visible: boolean; token: string; onCancel: () => void; onCreated: (client: Client) => void };

export function ClientFormModal({ visible, token, onCancel, onCreated }: ClientFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setError('');
    }
  }, [visible]);

  const submit = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const client = await createClient(token, { name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim() });
      onCreated(client);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.dialog}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Nuevo cliente</Text>
            <Pressable accessibilityLabel="Cerrar formulario" onPress={onCancel} style={modalStyles.closeButton}>
              <FontAwesomeIcon color={colors.textMuted} icon={faXmark} size={20} />
            </Pressable>
          </View>
          <Text style={styles.label}>Nombre</Text>
          <TextInput autoFocus onChangeText={setName} placeholder="Nombre del cliente" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
          <Text style={styles.label}>Teléfono</Text>
          <TextInput keyboardType="phone-pad" onChangeText={setPhone} placeholder="Teléfono" placeholderTextColor={colors.textMuted} style={styles.input} value={phone} />
          <Text style={styles.label}>Email</Text>
          <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} style={styles.input} value={email} />
          <Text style={styles.label}>Dirección</Text>
          <TextInput onChangeText={setAddress} placeholder="Dirección" placeholderTextColor={colors.textMuted} style={styles.input} value={address} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={modalStyles.actions}>
            <Pressable disabled={saving} onPress={onCancel} style={[styles.secondaryButton, modalStyles.actionButton]}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.button, modalStyles.actionButton, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Crear cliente'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}