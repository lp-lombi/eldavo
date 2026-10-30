import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../../../services';

const sessionStorageKey = '@eldavo/session';

export async function loadStoredSession(): Promise<Session | null> {
  const storedSession = await AsyncStorage.getItem(sessionStorageKey);
  if (!storedSession) return null;

  try {
    const session = JSON.parse(storedSession) as Partial<Session>;
    if (typeof session.token !== 'string' || !session.user || typeof session.user.id !== 'number' || typeof session.user.username !== 'string' || typeof session.user.role !== 'string') {
      await clearStoredSession();
      return null;
    }
    return session as Session;
  } catch (error) {
    await clearStoredSession();
    throw error;
  }
}

export function saveStoredSession(session: Session): Promise<void> {
  return AsyncStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function clearStoredSession(): Promise<void> {
  return AsyncStorage.removeItem(sessionStorageKey);
}
