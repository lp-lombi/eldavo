import { useState } from 'react';
import { authenticate } from '../services/authService';

export function useLogin(onLogin: Parameters<typeof authenticate> extends [string, string] ? (session: Awaited<ReturnType<typeof authenticate>>) => void : never) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (username: string, password: string) => {
    setError('');
    setLoading(true);
    try {
      onLogin(await authenticate(username, password));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, submit };
}
