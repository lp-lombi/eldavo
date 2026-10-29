import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, Text, View } from 'react-native';
import { faCalendarCheck, faLink, faUnlink, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { disconnectGoogleCalendar, getGoogleAuthorizationUrl, getGoogleCalendarStatus } from '../../../services';
import { colors, styles } from '../../../shared';

type GoogleCalendarConnectionProps = { token: string; visible: boolean; onClose: () => void };

export function GoogleCalendarConnection({ token, visible, onClose }: GoogleCalendarConnectionProps) {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getGoogleCalendarStatus(token)
      .then((status) => { setConnected(status.connected); setEmail(status.email ?? null); })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'No se pudo consultar Google Calendar'))
      .finally(() => setLoading(false));
  }, [token, visible]);

  async function connect() {
    setWorking(true);
    setError('');
    try {
      const { url } = await getGoogleAuthorizationUrl(token);
      await Linking.openURL(url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo abrir Google Calendar');
    } finally {
      setWorking(false);
    }
  }

  async function disconnect() {
    setWorking(true);
    try {
      await disconnectGoogleCalendar(token);
      setConnected(false);
      setEmail(null);
    } catch (requestError) {
      Alert.alert('Error', requestError instanceof Error ? requestError.message : 'No se pudo desconectar Google Calendar');
    } finally {
      setWorking(false);
    }
  }

  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
    <View style={styles.tagManagerOverlay}>
      <View style={styles.tagManagerDialog}>
        <View style={styles.sectionHeader}><View style={styles.headerCopy}><Text style={styles.sectionTitle}>Google Calendar</Text><Text style={styles.cardMeta}>Sincroniza tus turnos con tu calendario personal.</Text></View><Pressable accessibilityLabel="Cerrar Google Calendar" onPress={onClose} style={styles.iconButton}><FontAwesomeIcon color={colors.textMuted} icon={faXmark} size={18} /></Pressable></View>
        {loading ? <ActivityIndicator color={colors.accent} /> : connected ? <View><View style={styles.calendarConnectionStatus}><FontAwesomeIcon color={colors.accent} icon={faCalendarCheck} size={18} /><Text style={styles.cardMeta}>Conectado{email ? ` como ${email}` : ''}</Text></View><Pressable disabled={working} onPress={disconnect} style={styles.secondaryButton}><View style={styles.buttonContent}><FontAwesomeIcon color={colors.danger} icon={faUnlink} size={15} /><Text style={styles.deleteText}>Desconectar</Text></View></Pressable></View> : <Pressable disabled={working} onPress={connect} style={styles.button}>{working ? <ActivityIndicator color={colors.background} /> : <View style={styles.buttonContent}><FontAwesomeIcon color={colors.background} icon={faLink} size={15} /><Text style={styles.buttonText}>Conectar cuenta</Text></View>}</Pressable>}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  </Modal>;
}
