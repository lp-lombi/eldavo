import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, getClients } from '../src/api';
import { colors, styles } from '../src/theme';
import { ClientFormModal } from './ClientFormModal';
import { ClientList } from './ClientList';

type ClientsScreenProps = { onBack: () => void; onSelectClient: (client: Client) => void; token: string };

export function ClientsScreen({ onBack, onSelectClient, token }: ClientsScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createVisible, setCreateVisible] = useState(false);

  useEffect(() => {
    getClients(token)
      .then(setClients)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los clientes'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreated = (client: Client) => {
    setClients((currentClients) => [...currentClients, client]);
    setCreateVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.buttonContent}>
            <FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} />
            <Text style={styles.backText}>Volver</Text>
          </View>
        </Pressable>
        <View style={styles.detailHeader}>
          <Text style={styles.eyebrow}>Gestión</Text>
          <Text style={styles.title}>Clientes</Text>
        </View>
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? <ClientList clients={clients} onAdd={() => setCreateVisible(true)} onSelect={onSelectClient} /> : null}
      </ScrollView>
      <ClientFormModal onCancel={() => setCreateVisible(false)} onCreated={handleCreated} token={token} visible={createVisible} />
    </View>
  );
}