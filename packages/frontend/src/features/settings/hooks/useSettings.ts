import { useEffect, useState } from 'react';
import { GoogleReview, LandingService, OwnPublicProfile } from '../../../services';
import { loadOwnProfile, saveOwnProfile, updatePassword } from '../services/settingsService';

export function useSettings(token: string) {
  const [profile, setProfile] = useState<OwnPublicProfile | null>(null);
  const [publicDescription, setPublicDescription] = useState('');
  const [publicBrandName, setPublicBrandName] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [publicBookingEnabled, setPublicBookingEnabled] = useState(true);
  const [landingTitle, setLandingTitle] = useState('');
  const [landingAbout, setLandingAbout] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutDescription, setAboutDescription] = useState('');
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [landingServices, setLandingServices] = useState<LandingService[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadOwnProfile(token)
      .then((loadedProfile) => {
        if (cancelled) return;
        setProfile(loadedProfile);
        setPublicDescription(loadedProfile.publicDescription || '');
        setPublicBrandName(loadedProfile.publicBrandName || '');
        setPublicSlug(loadedProfile.publicSlug || loadedProfile.username);
        setBrandLogo(loadedProfile.brandLogo || null);
        setPublicBookingEnabled(loadedProfile.publicBookingEnabled);
        setLandingTitle(loadedProfile.landingTitle || '');
        setLandingAbout(loadedProfile.landingAbout || '');
        setHeroTitle(loadedProfile.heroTitle || loadedProfile.landingTitle || '');
        setHeroDescription(loadedProfile.heroDescription || '');
        setHeroImage(loadedProfile.heroImage || null);
        setAboutTitle(loadedProfile.aboutTitle || '');
        setAboutDescription(loadedProfile.aboutDescription || loadedProfile.landingAbout || '');
        setGoogleReviews(loadedProfile.googleReviews || []);
        setLandingServices(loadedProfile.landingServices || []);
      })
      .catch(() => { if (!cancelled) setError('No se pudo cargar la configuración pública'); });
    return () => { cancelled = true; };
  }, [token]);

  const saveProfile = async (services = landingServices) => {
    setProfileSaving(true);
    setError('');
    try {
      const updated = await saveOwnProfile(token, publicBrandName, publicSlug, brandLogo, publicDescription, publicBookingEnabled, landingTitle, landingAbout, heroTitle, heroDescription, heroImage, aboutTitle, aboutDescription, googleReviews, services);
      setProfile(updated);
      setPublicBrandName(updated.publicBrandName || '');
      setPublicSlug(updated.publicSlug || updated.username);
      setBrandLogo(updated.brandLogo || null);
      setHeroImage(updated.heroImage || null);
      setMessage('Configuración pública actualizada');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar');
    } finally {
      setProfileSaving(false);
    }
  };

  const changeUserPassword = async (currentPassword: string, newPassword: string, confirmation: string) => {
    setMessage('');
    setError('');
    if (newPassword !== confirmation) return setError('Las nuevas contraseñas no coinciden');
    if (newPassword.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres');
    setSaving(true);
    try {
      await updatePassword(token, currentPassword, newPassword);
      setMessage('Contraseña actualizada correctamente');
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar la contraseña');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { profile, setProfile, publicDescription, setPublicDescription, publicBrandName, setPublicBrandName, publicSlug, setPublicSlug, brandLogo, setBrandLogo, publicBookingEnabled, setPublicBookingEnabled, landingTitle, setLandingTitle, landingAbout, setLandingAbout, heroTitle, setHeroTitle, heroDescription, setHeroDescription, heroImage, setHeroImage, aboutTitle, setAboutTitle, aboutDescription, setAboutDescription, googleReviews, setGoogleReviews, landingServices, setLandingServices, error, message, saving, profileSaving, saveProfile, changeUserPassword, setError, setMessage };
}
