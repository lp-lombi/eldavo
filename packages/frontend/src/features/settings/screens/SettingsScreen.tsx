import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { faArrowLeft, faCalendarCheck, faCheck, faImage, faKey, faPen, faTrash, faUserGear, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { GoogleReview, LandingService, PublicContact, Session } from '../../../services';
import { colors, styles } from '../../../shared';
import { useSettings } from '../hooks/useSettings';

type SettingsScreenProps = { onBack: () => void; onOpenAdmin: () => void; onOpenCalendar: () => void; session: Session };
type ImageUploadFieldProps = { value?: string | null; label: string; aspect?: [number, number]; onChange: (value: string | null) => void; onError: (message: string) => void };

const maxImageDataLength = 8_000_000;

async function imageUriToDataUri(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No se pudo leer la imagen'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(blob);
  });
}

function ImageUploadField({ value, label, aspect = [16, 9], onChange, onError }: ImageUploadFieldProps) {
  const [loading, setLoading] = useState(false);

  const selectImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.8 });
      if (result.canceled) return;
      const dataUri = await imageUriToDataUri(result.assets[0].uri);
      if (dataUri.length > maxImageDataLength) {
        onError('La imagen es demasiado pesada. Elegí una imagen de hasta 6 MB.');
        return;
      }
      onChange(dataUri);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo cargar la imagen');
    } finally {
      setLoading(false);
    }
  };

  return <View style={styles.imageUploadField}>
    <Text style={styles.label}>{label}</Text>
    {value ? <Image accessibilityLabel={label} source={{ uri: value }} style={styles.imageUploadPreview} /> : null}
    <View style={styles.imageUploadActions}>
      <Pressable disabled={loading} onPress={() => void selectImage()} style={styles.smallSecondaryAction}>
        <FontAwesomeIcon color={colors.accent} icon={faImage} size={13} /><Text style={styles.smallSecondaryActionText}>{loading ? 'Cargando...' : value ? 'Cambiar imagen' : 'Elegir imagen'}</Text>
      </Pressable>
      {value ? <Pressable disabled={loading} onPress={() => onChange(null)} style={styles.smallSecondaryAction}><FontAwesomeIcon color={colors.danger} icon={faXmark} size={13} /><Text style={styles.deleteServiceText}>Quitar</Text></Pressable> : null}
    </View>
  </View>;
}

export function SettingsScreen({ onBack, onOpenAdmin, onOpenCalendar, session }: SettingsScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [editingServices, setEditingServices] = useState<number[]>([]);
  const [serviceDrafts, setServiceDrafts] = useState<Record<number, LandingService>>({});
  const { profile, setProfile, publicDescription, setPublicDescription, publicBrandName, setPublicBrandName, publicSlug, setPublicSlug, brandLogo, setBrandLogo, publicBookingEnabled, setPublicBookingEnabled, heroTitle, setHeroTitle, heroDescription, setHeroDescription, heroImage, setHeroImage, aboutTitle, setAboutTitle, aboutDescription, setAboutDescription, googleReviews, setGoogleReviews, publicContacts, setPublicContacts, landingServices, setLandingServices, error, message, saving, profileSaving, saveProfile, changeUserPassword, setError } = useSettings(session.token);
  const openPublicProfile = () => { if (!profile) return; const url = Platform.OS === 'web' ? `${window.location.origin}/${publicSlug || profile.username}` : `https://eldavo.app/${publicSlug || profile.username}`; void Linking.openURL(url); };
  const updateService = (index: number, changes: Partial<LandingService>) => setServiceDrafts((drafts) => ({ ...drafts, [index]: { ...(drafts[index] || landingServices[index]), ...changes } }));
  const startEditingService = (index: number) => {
    setServiceDrafts((drafts) => ({ ...drafts, [index]: { ...landingServices[index] } }));
    setEditingServices((indexes) => indexes.includes(index) ? indexes : [...indexes, index]);
  };
  const addService = () => {
    const index = landingServices.length;
    setLandingServices((services) => [...services, { name: '', description: '', image: null, sortOrder: services.length }]);
    setServiceDrafts((drafts) => ({ ...drafts, [index]: { name: '', description: '', image: null, sortOrder: index } }));
    setEditingServices((indexes) => [...indexes, index]);
  };
  const cancelService = (index: number) => {
    if (!landingServices[index].id) {
      setLandingServices((services) => services.filter((_, serviceIndex) => serviceIndex !== index).map((service, sortOrder) => ({ ...service, sortOrder })));
    }
    setServiceDrafts(({ [index]: _draft, ...drafts }) => drafts);
    setEditingServices((indexes) => indexes.filter((serviceIndex) => serviceIndex !== index));
  };
  const saveService = async (index: number) => {
    const draft = serviceDrafts[index];
    if (!draft?.name.trim() || !draft.description.trim()) {
      setError('Cada servicio necesita un nombre y una descripción');
      return;
    }
    const services = landingServices.map((service, serviceIndex) => serviceIndex === index ? { ...draft, name: draft.name.trim(), description: draft.description.trim() } : service);
    setLandingServices(services);
    setEditingServices((indexes) => indexes.filter((serviceIndex) => serviceIndex !== index));
    setServiceDrafts(({ [index]: _draft, ...drafts }) => drafts);
    await saveProfile(services);
  };
  const removeService = async (index: number) => {
    const services = landingServices.filter((_, serviceIndex) => serviceIndex !== index).map((service, sortOrder) => ({ ...service, sortOrder }));
    setLandingServices(services);
    setEditingServices((indexes) => indexes.filter((serviceIndex) => serviceIndex !== index));
    await saveProfile(services);
  };
  const updateReview = (index: number, changes: Partial<GoogleReview>) => setGoogleReviews((reviews) => reviews.map((review, reviewIndex) => reviewIndex === index ? { ...review, ...changes } : review));
  const addReview = () => setGoogleReviews((reviews) => [...reviews, { author: '', text: '', rating: 5, url: null }]);
  const removeReview = (index: number) => setGoogleReviews((reviews) => reviews.filter((_, reviewIndex) => reviewIndex !== index));

  async function submitPassword() {
    if (await changeUserPassword(currentPassword, newPassword, confirmation)) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    }
  }

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={onBack} style={styles.backButton}><View style={styles.buttonContent}><FontAwesomeIcon color={colors.accent} icon={faArrowLeft} size={14} /><Text style={styles.backText}>Volver al panel</Text></View></Pressable>
    <Text style={styles.eyebrow}>Preferencias</Text>
    <Text style={styles.title}>Configuración</Text>
    <Text style={styles.subtitle}>Gestiona tus conexiones y opciones de acceso.</Text>
    <View style={styles.settingsOptions}>
      {session.user.role === 'admin' ? <Pressable onPress={onOpenAdmin} style={({ pressed }) => [styles.settingsOption, pressed && styles.listItemPressed]}>
        <View style={styles.settingsOptionIcon}><FontAwesomeIcon color={colors.accent} icon={faUserGear} size={20} /></View>
        <View style={styles.settingsOptionCopy}><Text style={styles.settingsOptionTitle}>Administración</Text><Text style={styles.settingsOptionDescription}>Gestiona los usuarios de Eldavo.</Text></View>
      </Pressable> : null}
      <Pressable onPress={onOpenCalendar} style={({ pressed }) => [styles.settingsOption, pressed && styles.listItemPressed]}>
        <View style={styles.settingsOptionIcon}><FontAwesomeIcon color={colors.accent} icon={faCalendarCheck} size={20} /></View>
        <View style={styles.settingsOptionCopy}><Text style={styles.settingsOptionTitle}>Google Calendar</Text><Text style={styles.settingsOptionDescription}>Conecta tu calendario para sincronizar tus turnos.</Text></View>
      </Pressable>
    </View>
    <View style={styles.settingsPasswordSection}>
      <Text style={styles.sectionTitle}>Mi web de turnos</Text>
      <Text style={styles.settingsOptionDescription}>Compartí este enlace para recibir solicitudes:</Text>
      <Pressable disabled={!profile} onPress={openPublicProfile}><Text style={[styles.viewMoreText, styles.publicProfileLink]}>{profile ? `${Platform.OS === 'web' ? window.location.origin : 'https://eldavo.app'}/${publicSlug || profile.username}` : 'cargando...'}</Text></Pressable>
      <Text style={styles.label}>Descripción pública</Text>
      <TextInput multiline onChangeText={setPublicDescription} placeholder="Contales qué tipo de turnos ofrecés" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={publicDescription} />
      <Text style={styles.sectionTitle}>Canales de contacto</Text>
      <Text style={styles.settingsOptionDescription}>Completá solo los canales que quieras mostrar en tu landing.</Text>
      {(['whatsapp', 'instagram', 'facebook', 'email'] as const).map((type) => <View key={type}>
        <Text style={styles.label}>{type === 'whatsapp' ? 'WhatsApp' : type === 'instagram' ? 'Instagram' : type === 'facebook' ? 'Facebook' : 'Email'}</Text>
        <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={(value) => setPublicContacts((current) => value.trim() ? [...current.filter((contact) => contact.type !== type), { type, value }] : current.filter((contact) => contact.type !== type))} placeholder={type === 'email' ? 'contacto@ejemplo.com' : type === 'whatsapp' ? '5491122334455' : `https://${type}.com/mi-marca`} placeholderTextColor={colors.textMuted} style={styles.input} value={publicContacts.find((contact) => contact.type === type)?.value || ''} />
      </View>)}
      <Text style={styles.label}>Nombre de la marca</Text>
      <TextInput onChangeText={setPublicBrandName} placeholder="Mi estudio" placeholderTextColor={colors.textMuted} style={styles.input} value={publicBrandName} />
      <Text style={styles.label}>URL pública</Text>
      <TextInput autoCapitalize="none" onChangeText={(value) => setPublicSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="mi-estudio" placeholderTextColor={colors.textMuted} style={styles.input} value={publicSlug} />
      <ImageUploadField aspect={[1, 1]} label="Logo de la marca" onChange={setBrandLogo} onError={setError} value={brandLogo} />
      <Text style={styles.sectionTitle}>Landing pública</Text>
      <Text style={styles.label}>Título del hero</Text>
      <TextInput onChangeText={setHeroTitle} placeholder="Un espacio para vos" placeholderTextColor={colors.textMuted} style={styles.input} value={heroTitle} />
      <Text style={styles.label}>Descripción del hero</Text>
      <TextInput multiline onChangeText={setHeroDescription} placeholder="Atención personalizada, sin vueltas." placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={heroDescription} />
      <ImageUploadField label="Imagen del hero" onChange={setHeroImage} onError={setError} value={heroImage} />
      <Text style={styles.label}>Título de sobre nosotros</Text>
      <TextInput onChangeText={setAboutTitle} placeholder="Un momento para cuidarte" placeholderTextColor={colors.textMuted} style={styles.input} value={aboutTitle} />
      <Text style={styles.label}>Descripción de sobre nosotros</Text>
      <TextInput multiline onChangeText={setAboutDescription} placeholder="Contá quién sos y cómo trabajás" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={aboutDescription} />
      <Text style={styles.sectionTitle}>Reseñas de Google Maps</Text>
      <Text style={styles.settingsOptionDescription}>Cargá manualmente las reseñas que quieras mostrar. El enlace a Google Maps es opcional.</Text>
      {googleReviews.map((review, index) => <View key={`review-${index}`} style={styles.reviewEditorCard}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput onChangeText={(value) => updateReview(index, { author: value })} placeholder="Nombre de la persona" placeholderTextColor={colors.textMuted} style={styles.input} value={review.author} />
        <Text style={styles.label}>Reseña</Text>
        <TextInput multiline onChangeText={(value) => updateReview(index, { text: value })} placeholder="Excelente atención..." placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={review.text} />
        <Text style={styles.label}>Calificación (1 a 5)</Text>
        <TextInput keyboardType="number-pad" onChangeText={(value) => updateReview(index, { rating: Math.max(1, Math.min(5, Number(value) || 1)) })} style={styles.input} value={String(review.rating)} />
        <Text style={styles.label}>Link de Google Maps (opcional)</Text>
        <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={(value) => updateReview(index, { url: value })} placeholder="https://maps.google.com/..." placeholderTextColor={colors.textMuted} style={styles.input} value={review.url || ''} />
        <Pressable onPress={() => removeReview(index)} style={styles.deleteServiceButton}><FontAwesomeIcon color={colors.danger} icon={faTrash} size={12} /><Text style={styles.deleteServiceText}>Borrar reseña</Text></Pressable>
      </View>)}
      <Pressable disabled={googleReviews.length >= 20} onPress={addReview} style={styles.addServiceButton}><Text style={styles.addServiceText}>+ Agregar reseña</Text></Pressable>
      <Text style={styles.sectionTitle}>Servicios</Text>
      <Text style={styles.settingsOptionDescription}>Agregá los servicios que querés mostrar debajo de tu presentación.</Text>
      {landingServices.map((service, index) => <View key={service.id ?? `new-${index}`} style={styles.landingServiceCard}>
        {editingServices.includes(index) ? <><Text style={styles.label}>Nombre</Text>
          <TextInput onChangeText={(value) => updateService(index, { name: value })} placeholder="Consulta inicial" placeholderTextColor={colors.textMuted} style={styles.input} value={serviceDrafts[index]?.name ?? ''} />
          <Text style={styles.label}>Descripción</Text>
          <TextInput multiline onChangeText={(value) => updateService(index, { description: value })} placeholder="Descripción breve" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={serviceDrafts[index]?.description ?? ''} />
          <ImageUploadField label="Imagen del servicio" onChange={(image) => updateService(index, { image })} onError={setError} value={serviceDrafts[index]?.image} />
          <View style={styles.landingServiceActions}>
            <Pressable disabled={profileSaving} onPress={() => void saveService(index)} style={styles.smallActionButton}><FontAwesomeIcon color={colors.background} icon={faCheck} size={13} /><Text style={styles.smallActionText}>Guardar</Text></Pressable>
            <Pressable onPress={() => cancelService(index)} style={styles.smallSecondaryAction}><FontAwesomeIcon color={colors.textMuted} icon={faXmark} size={13} /><Text style={styles.smallSecondaryActionText}>Cancelar</Text></Pressable>
          </View>
        </> : <><View style={styles.landingServiceHeader}><View style={styles.landingServiceCopy}><Text style={styles.landingServiceName}>{service.name}</Text><Text style={styles.landingServiceDescription}>{service.description}</Text></View>
          <Pressable accessibilityLabel="Editar servicio" onPress={() => startEditingService(index)} style={styles.iconAction}><FontAwesomeIcon color={colors.accent} icon={faPen} size={14} /></Pressable>
        </View>
          <Pressable onPress={() => void removeService(index)} style={styles.deleteServiceButton}><FontAwesomeIcon color={colors.danger} icon={faTrash} size={12} /><Text style={styles.deleteServiceText}>Borrar</Text></Pressable>
        </>}
      </View>)}
      <Pressable onPress={addService} style={styles.addServiceButton}><Text style={styles.addServiceText}>+ Agregar servicio</Text></Pressable>
      <View style={styles.buttonRow}>
        <Pressable onPress={() => setPublicBookingEnabled((enabled) => !enabled)} style={[styles.secondaryButton, styles.buttonRowItem]}><Text style={styles.secondaryText}>{publicBookingEnabled ? 'Desactivar solicitudes públicas' : 'Activar solicitudes públicas'}</Text></Pressable>
        <Pressable disabled={profileSaving} onPress={() => void saveProfile()} style={({ pressed }) => [styles.button, styles.buttonRowItem, pressed && styles.buttonPressed]}><Text style={styles.buttonText}>{profileSaving ? 'Guardando...' : 'Guardar configuración pública'}</Text></Pressable>
      </View>
    </View>
    <View style={styles.settingsPasswordSection}>
      <View style={styles.settingsPasswordHeading}><FontAwesomeIcon color={colors.accent} icon={faKey} size={18} /><Text style={styles.sectionTitle}>Cambiar contraseña</Text></View>
      <Text style={styles.settingsOptionDescription}>Actualiza la contraseña de tu propio usuario.</Text>
      <Text style={styles.label}>Contraseña actual</Text>
      <TextInput onChangeText={setCurrentPassword} secureTextEntry style={styles.input} value={currentPassword} />
      <Text style={styles.label}>Nueva contraseña</Text>
      <TextInput onChangeText={setNewPassword} secureTextEntry style={styles.input} value={newPassword} />
      <Text style={styles.label}>Repetir nueva contraseña</Text>
      <TextInput onChangeText={setConfirmation} secureTextEntry style={styles.input} value={confirmation} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <Pressable disabled={saving} onPress={submitPassword} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Guardar contraseña</Text>}
      </Pressable>
    </View>
  </ScrollView></View>;
}