import { useCallback, useEffect, useState } from 'react';
import { PublicAvailabilitySlot, PublicProfile } from '../../../services';
import { loadPublicAvailability, loadPublicProfile, submitPublicBooking } from '../services/publicBookingService';

export function usePublicBooking(username: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadPublicProfile(username)
      .then((loadedProfile) => { if (!cancelled) setProfile(loadedProfile); })
      .catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'No se encontró este perfil'); });
    return () => { cancelled = true; };
  }, [username]);

  const loadSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    try {
      const loadedSlots = await loadPublicAvailability(username, date);
      setSlots(loadedSlots.filter((slot) => slot.available));
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la disponibilidad');
      return false;
    } finally {
      setLoadingSlots(false);
    }
  }, [username]);

  const submit = useCallback((data: Parameters<typeof submitPublicBooking>[1]) => submitPublicBooking(username, data), [username]);

  return { profile, slots, loadingSlots, error, setError, loadSlots, submit };
}
