import { useEffect, useState } from 'react';
import { User } from '../../../services';
import { addUser, loadUsers } from '../services/adminService';

export function useAdminUsers(token: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadUsers(token)
      .then((loadedUsers) => { if (!cancelled) setUsers(loadedUsers); })
      .catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los usuarios'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const create = async (username: string, password: string) => {
    setError('');
    setSaving(true);
    try {
      const user = await addUser(token, username, password);
      setUsers((current) => [...current, user].sort((first, second) => first.username.localeCompare(second.username)));
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el usuario');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { users, loading, saving, error, create };
}
