import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Session } from '../../../services';
import { colors, styles } from '../../../shared';
import { useLogin } from '../hooks/useLogin';

type LoginScreenProps = { isAdmin?: boolean; onLogin: (session: Session) => void; onOpenAdmin?: () => void; onOpenClient?: () => void };

export function LoginScreen({ isAdmin = false, onLogin, onOpenAdmin, onOpenClient }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, submit } = useLogin(onLogin);
  const handleLogin = () => { void submit(username.trim(), password); };

  return (
    <ScrollView contentContainerStyle={[styles.content, styles.loginContent]} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>{isAdmin ? 'Administración' : 'Acceso de clientes'}</Text>
      <Text style={styles.title}>{isAdmin ? 'Gestionar usuarios' : 'Gestión de clientes'}</Text>
      <Text style={styles.subtitle}>{isAdmin ? 'Inicia sesión para crear y administrar los accesos de tu equipo.' : 'Inicia sesión para consultar tus clientes, pedidos e inventario.'}</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Usuario</Text>
        <TextInput autoCapitalize="none" autoComplete="username" autoCorrect={false} onChangeText={setUsername} onSubmitEditing={handleLogin} returnKeyType="next" style={styles.input} textContentType="username" value={username} />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput autoComplete="current-password" onChangeText={setPassword} onSubmitEditing={handleLogin} returnKeyType="done" secureTextEntry style={styles.input} textContentType="password" value={password} />
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
