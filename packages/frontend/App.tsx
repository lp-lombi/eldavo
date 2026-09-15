import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { Client, getClients, getOrders, login, Order, User } from './src/api';
import { colors, styles } from './src/theme';

type Session = { token: string; user: User };

function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      onLogin(await login(username.trim(), password));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, styles.loginContent]} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>Eldavo / acceso</Text>
      <Text style={styles.title}>Tu operación, clara.</Text>
      <Text style={styles.subtitle}>Inicia sesión para consultar clientes y pedidos.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Usuario</Text>
        <TextInput autoCapitalize="none" onChangeText={setUsername} style={styles.input} value={username} />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput onChangeText={setPassword} secureTextEntry style={styles.input} value={password} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={loading} onPress={handleLogin} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getClients(session.token), getOrders(session.token)])
      .then(([loadedClients, loadedOrders]) => { setClients(loadedClients); setOrders(loadedOrders); })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los datos'))
      .finally(() => setLoading(false));
  }, [session.token]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Panel principal</Text>
          <Text style={styles.title}>Hola, {session.user.username}.</Text>
          <Text style={styles.subtitle}>Resumen de tu actividad reciente.</Text>
        </View>
        <Pressable onPress={onLogout} style={styles.logoutButton}><Text style={styles.logoutText}>Salir</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error ? <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clientes ({clients.length})</Text>
          {clients.length ? clients.map((client) => <View key={client.id} style={styles.card}><Text style={styles.cardTitle}>{client.name}</Text><Text style={styles.cardMeta}>{client.email || client.phone || 'Sin datos de contacto'}</Text></View>) : <Text style={styles.empty}>Todavía no hay clientes.</Text>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos ({orders.length})</Text>
          {orders.length ? orders.map((order) => <View key={order.id} style={styles.card}><View style={styles.cardRow}><Text style={styles.cardTitle}>{order.client?.name || `Pedido #${order.id}`}</Text><Text style={styles.cardValue}>${order.value.toLocaleString('es-AR')}</Text></View><Text style={styles.cardMeta}>{order.completionDate ? new Date(order.completionDate).toLocaleDateString('es-AR') : 'Sin fecha de entrega'}</Text></View>) : <Text style={styles.empty}>Todavía no hay pedidos.</Text>}
        </View>
      </> : null}
    </ScrollView>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  return <SafeAreaView style={styles.safeArea}><StatusBar style="light" />{session ? <Dashboard onLogout={() => setSession(null)} session={session} /> : <LoginScreen onLogin={setSession} />}</SafeAreaView>;
}
