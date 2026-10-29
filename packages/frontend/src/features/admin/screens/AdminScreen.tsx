import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { faArrowLeft, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Session } from '../../../services';
import { colors, styles } from '../../../shared';
import { useAdminUsers } from '../hooks/useAdminUsers';

type AdminScreenProps = { session: Session; onBack: () => void };

export function AdminScreen({ session, onBack }: AdminScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { users, loading, saving, error, create } = useAdminUsers(session.token);

  async function handleCreate() {
    if (await create(username.trim(), password)) {
      setUsername('');
      setPassword('');
    }
  }

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={onBack} style={styles.backButton}><View style={styles.buttonContent}><FontAwesomeIcon color={colors.accent} icon={faArrowLeft} size={14} /><Text style={styles.backText}>Volver al panel</Text></View></Pressable>
    <Text style={styles.eyebrow}>Administración</Text>
    <Text style={styles.title}>Usuarios</Text>
    <Text style={styles.subtitle}>Crea accesos independientes para que cada usuario gestione sus propios clientes y pedidos.</Text>
    <View style={styles.form}>
      <Text style={styles.label}>Usuario</Text>
      <TextInput autoCapitalize="none" onChangeText={setUsername} style={styles.input} value={username} />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput onChangeText={setPassword} secureTextEntry style={styles.input} value={password} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={saving} onPress={handleCreate} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        {saving ? <ActivityIndicator color={colors.background} /> : <View style={styles.buttonContent}><FontAwesomeIcon color={colors.background} icon={faUserPlus} size={15} /><Text style={styles.buttonText}>Crear usuario</Text></View>}
      </Pressable>
    </View>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Usuarios registrados</Text>
      {loading ? <ActivityIndicator color={colors.accent} /> : users.map((user) => <View key={user.id} style={styles.card}><Text style={styles.cardTitle}>{user.username}</Text><Text style={styles.cardMeta}>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</Text></View>)}
    </View>
  </ScrollView>;
}