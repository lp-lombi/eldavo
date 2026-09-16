import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { login, Session } from '../src/api';
import { colors, styles } from '../src/theme';

type LoginScreenProps = { onLogin: (session: Session) => void };

export function LoginScreen({ onLogin }: LoginScreenProps) {
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
      <Text style={styles.eyebrow}>Acceso</Text>
      <Text style={styles.title}>Gestión de clientes</Text>
      <Text style={styles.subtitle}>Inicia sesión para consultar clientes y pedidos.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Usuario</Text>
        <TextInput autoCapitalize="none" onChangeText={setUsername} style={styles.input} value={username} />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput onChangeText={setPassword} secureTextEntry style={styles.input} value={password} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={loading} onPress={handleLogin} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          {loading ? <ActivityIndicator color={colors.background} /> : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Entrar</Text>
              <FontAwesomeIcon color={styles.buttonText.color} icon={faArrowRight} size={15} />
            </View>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
