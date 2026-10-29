import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { faArrowLeft, faCalendarCheck, faCheck, faKey, faPen, faTrash, faUserGear, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { LandingService, Session } from '../../../services';
import { colors, styles } from '../../../shared';
import { useSettings } from '../hooks/useSettings';

type SettingsScreenProps = { onBack: () => void; onOpenAdmin: () => void; onOpenCalendar: () => void; session: Session };

export function SettingsScreen({ onBack, onOpenAdmin, onOpenCalendar, session }: SettingsScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [editingServices, setEditingServices] = useState<number[]>([]);
  const [serviceDrafts, setServiceDrafts] = useState<Record<number, LandingService>>({});
  const { profile, setProfile, publicDescription, setPublicDescription, publicBookingEnabled, setPublicBookingEnabled, heroTitle, setHeroTitle, heroDescription, setHeroDescription, aboutTitle, setAboutTitle, aboutDescription, setAboutDescription, landingServices, setLandingServices, error, message, saving, profileSaving, saveProfile, changeUserPassword, setError } = useSettings(session.token);
  const openPublicProfile = () => { if (!profile) return; const url = Platform.OS === 'web' ? `${window.location.origin}/${profile.username}` : `https://eldavo.app/${profile.username}`; void Linking.openURL(url); };
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
      <Pressable disabled={!profile} onPress={openPublicProfile}><Text style={[styles.viewMoreText, styles.publicProfileLink]}>{profile ? `${Platform.OS === 'web' ? window.location.origin : 'https://eldavo.app'}/${profile.username}` : 'cargando...'}</Text></Pressable>
      <Text style={styles.label}>Descripción pública</Text>
      <TextInput multiline onChangeText={setPublicDescription} placeholder="Contales qué tipo de turnos ofrecés" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={publicDescription} />
      <Text style={styles.sectionTitle}>Landing pública</Text>
      <Text style={styles.label}>Título del hero</Text>
      <TextInput onChangeText={setHeroTitle} placeholder="Un espacio para vos" placeholderTextColor={colors.textMuted} style={styles.input} value={heroTitle} />
      <Text style={styles.label}>Descripción del hero</Text>
      <TextInput multiline onChangeText={setHeroDescription} placeholder="Atención personalizada, sin vueltas." placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={heroDescription} />
      <Text style={styles.label}>Título de sobre nosotros</Text>
      <TextInput onChangeText={setAboutTitle} placeholder="Un momento para cuidarte" placeholderTextColor={colors.textMuted} style={styles.input} value={aboutTitle} />
      <Text style={styles.label}>Descripción de sobre nosotros</Text>
      <TextInput multiline onChangeText={setAboutDescription} placeholder="Contá quién sos y cómo trabajás" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={aboutDescription} />
      <Text style={styles.sectionTitle}>Servicios</Text>
      <Text style={styles.settingsOptionDescription}>Agregá los servicios que querés mostrar debajo de tu presentación. La imagen se puede sumar más adelante.</Text>
      {landingServices.map((service, index) => <View key={service.id ?? `new-${index}`} style={styles.landingServiceCard}>
        {editingServices.includes(index) ? <><Text style={styles.label}>Nombre</Text>
          <TextInput onChangeText={(value) => updateService(index, { name: value })} placeholder="Consulta inicial" placeholderTextColor={colors.textMuted} style={styles.input} value={serviceDrafts[index]?.name ?? ''} />
          <Text style={styles.label}>Descripción</Text>
          <TextInput multiline onChangeText={(value) => updateService(index, { description: value })} placeholder="Descripción breve" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailTextarea]} value={serviceDrafts[index]?.description ?? ''} />
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