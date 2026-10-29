import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import heroImage from '../../../assets/esmeralda.jpg';
import { LandingService, PublicAvailabilitySlot } from '../../../services';
import { colors, styles } from '../../../shared';
import { usePublicBooking } from '../hooks/usePublicBooking';

type Props = { username: string };
const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatSlot(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', hour12: false, minute: '2-digit' }).format(new Date(value));
}

function formatBookingDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date(`${value}T12:00:00`));
}

export function PublicBookingScreen({ username }: Props) {
  const { profile, slots, loadingSlots, error, setError, loadSlots, submit: submitBooking } = usePublicBooking(username);
  const { height: viewportHeight } = useWindowDimensions();
  const [sent, setSent] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(null);
  const [selectedService, setSelectedService] = useState('Obtener turno');
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingSectionY, setBookingSectionY] = useState<number | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroEntrance = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const bookingPagerRef = useRef<ScrollView>(null);
  const aboutServicesRef = useRef<ScrollView>(null);
  const aboutServicePhysicalIndexRef = useRef(0);
  const aboutServicesHoveredRef = useRef(false);
  const [aboutServiceIndex, setAboutServiceIndex] = useState(0);
  const { width: viewportWidth } = useWindowDimensions();
  const jumpToBooking = () => {
    if (bookingSectionY === null) return;
    scrollRef.current?.scrollTo({ y: bookingSectionY, animated: true });
  };
  const bookingStepWidth = Math.min(Math.max(viewportWidth - 52, 280), 1180);
  const aboutServiceStep = 418;
  const aboutServiceCopies = 7;
  const landingServices: LandingService[] = profile?.landingServices || [];

  function goToBookingStep(step: number) {
    const nextStep = Math.max(0, Math.min(step, 3));
    bookingPagerRef.current?.scrollTo({ x: nextStep * bookingStepWidth, animated: true });
    setBookingStep(nextStep);
  }

  useEffect(() => {
    void loadSlots(selectedDate).then(() => setSelectedSlot(null));
  }, [selectedDate, loadSlots]);

  useEffect(() => {
    if (!profile) return;
    heroEntrance.setValue(0);
    const animation = Animated.timing(heroEntrance, { toValue: 1, duration: 850, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [heroEntrance, profile?.username]);

  useEffect(() => {
    if (!profile) return;
    const configuredServices = profile.landingServices || [];
    const firstServiceName = configuredServices[0]?.name || 'Obtener turno';
    if (!configuredServices.some((service) => service.name === selectedService)) {
      setSelectedService(firstServiceName);
    }
  }, [profile, selectedService]);

  useEffect(() => {
    const initialIndex = landingServices.length * Math.floor(aboutServiceCopies / 2);
    aboutServicePhysicalIndexRef.current = initialIndex;
    setAboutServiceIndex(0);
    aboutServicesRef.current?.scrollTo({ x: initialIndex * aboutServiceStep, animated: false });
  }, [profile?.username, landingServices.length]);

  useEffect(() => {
    if (landingServices.length < 2) return;
    const timer = setInterval(() => {
      if (aboutServicesHoveredRef.current) return;
      const nextPhysicalIndex = aboutServicePhysicalIndexRef.current + 1;
      aboutServicePhysicalIndexRef.current = nextPhysicalIndex;
      setAboutServiceIndex(nextPhysicalIndex % landingServices.length);
      aboutServicesRef.current?.scrollTo({ x: nextPhysicalIndex * aboutServiceStep, animated: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [landingServices.length]);

  function selectAboutService(index: number) {
    const physicalIndex = landingServices.length * Math.floor(aboutServiceCopies / 2) + index;
    aboutServicePhysicalIndexRef.current = physicalIndex;
    setAboutServiceIndex(index);
    aboutServicesRef.current?.scrollTo({ x: physicalIndex * aboutServiceStep, animated: true });
  }

  function handleAboutServiceScrollEnd(offsetX: number) {
    if (!landingServices.length) return;
    const physicalIndex = Math.round(offsetX / aboutServiceStep);
    const serviceIndex = ((physicalIndex % landingServices.length) + landingServices.length) % landingServices.length;
    const normalizedPhysicalIndex = landingServices.length * Math.floor(aboutServiceCopies / 2) + serviceIndex;
    aboutServicePhysicalIndexRef.current = normalizedPhysicalIndex;
    setAboutServiceIndex(serviceIndex);
    if (normalizedPhysicalIndex !== physicalIndex) {
      aboutServicesRef.current?.scrollTo({ x: normalizedPhysicalIndex * aboutServiceStep, animated: false });
    }
  }

  async function submit() {
    if (!name.trim() || !email.trim()) {
      setError('Completá tu nombre y email');
      return;
    }
    if (!selectedSlot) {
      setError('Seleccioná un horario disponible');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const booking = await submitBooking({
        name,
        email,
        phone,
        notes,
        startsAt: selectedSlot.startsAt,
        endsAt: selectedSlot.endsAt,
      });
      setBookingId(booking.id);
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la solicitud');
    } finally {
      setSaving(false);
    }
  }

  if (error && !profile) {
    return <View style={styles.screen}><Text style={styles.error}>{error}</Text></View>;
  }

  if (!profile) {
    return <ActivityIndicator color={colors.accent} style={styles.loading} />;
  }

  if (sent) {
    return (
      <View style={styles.publicReceiptPage}>
        <View style={styles.publicContainer}><Text style={styles.publicLogo}>{profile.username}</Text></View>
        <View style={styles.publicReceipt}>
          <Text style={styles.publicReceiptIcon}>✓</Text>
          <Text style={styles.eyebrow}>Solicitud recibida</Text>
          <Text style={styles.publicReceiptTitle}>Gracias, {name}</Text>
          <Text style={styles.publicSectionText}>Tu solicitud fue enviada correctamente. {profile.username} deberá confirmarla para que el turno quede reservado.</Text>
          <View style={styles.publicReceiptCard}>
            <Text style={styles.publicReceiptLabel}>Número de turno</Text>
            <Text style={styles.publicReceiptNumber}>#{bookingId ?? '—'}</Text>
            <View style={styles.publicReceiptDivider} />
            <Text style={styles.publicReceiptLabel}>Servicio</Text>
            <Text style={styles.publicReceiptValue}>{selectedService}</Text>
            <Text style={styles.publicReceiptLabel}>Fecha</Text>
            <Text style={styles.publicReceiptValue}>{formatBookingDate(selectedDate)}</Text>
            <Text style={styles.publicReceiptLabel}>Horario</Text>
            <Text style={styles.publicReceiptValue}>{selectedSlot ? `${formatSlot(selectedSlot.startsAt)} - ${formatSlot(selectedSlot.endsAt)}` : '—'}</Text>
            <Text style={styles.publicReceiptLabel}>Email de contacto</Text>
            <Text style={styles.publicReceiptValue}>{email}</Text>
          </View>
          <Text style={styles.publicReceiptNote}>Conservá este número para consultar tu solicitud.</Text>
        </View>
      </View>
    );
  }

  const calendarDays = Array.from({ length: 14 }, (_, index) => addDays(new Date(), index));

  const heroTitle = profile.heroTitle || profile.landingTitle || 'Un espacio para vos';
  const heroDescription = profile.heroDescription || 'Atención personalizada, sin vueltas.';
  const aboutTitle = profile.aboutTitle || 'Un momento para cuidarte';
  const aboutDescription = profile.aboutDescription || profile.landingAbout || profile.description || 'Te acompañamos con una atención cercana, simple y pensada para vos.';
  const bookingServices: LandingService[] = landingServices.length
    ? landingServices
    : [{ name: 'Obtener turno', description: 'Elegí un día y horario disponible para reservar.' }];
  const sectionHeight = Math.max(viewportHeight - 72, 0);
  const appear = (inputRange: [number, number]) => ({
    opacity: scrollY.interpolate({ inputRange, outputRange: [0.2, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: scrollY.interpolate({ inputRange, outputRange: [40, 0], extrapolate: 'clamp' }) }],
  });
  const bookingAppear = bookingSectionY === null
    ? undefined
    : appear([Math.max(0, bookingSectionY - viewportHeight), Math.max(1, bookingSectionY - viewportHeight * 0.35)]);

  return (
    <View style={styles.publicLanding}>
      <View style={styles.publicHeader}>
        <View style={styles.publicContainer}><Text style={styles.publicLogo}>{profile.username}</Text><Pressable onPress={jumpToBooking}><Text style={styles.publicHeaderLink}>Reservar turno</Text></Pressable></View>
      </View>
      <Animated.ScrollView
        contentContainerStyle={styles.publicScrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        ref={scrollRef}
        scrollEventThrottle={16}
      >
        <AnimatedImageBackground imageStyle={styles.publicHeroImage} resizeMode="cover" source={heroImage} style={[styles.publicHero, { height: Math.max(viewportHeight - 72, 0) }, { opacity: heroEntrance }]}>
          <View style={styles.publicHeroOverlay} />
          <View style={styles.publicContainer}><View style={styles.publicHeroCopy}><Text style={styles.publicHeroEyebrow}>Bienvenido/a</Text><Text style={styles.publicHeroTitle}>{heroTitle}</Text><Text style={styles.publicHeroSubtitle}>{heroDescription}</Text><Pressable onPress={jumpToBooking} style={styles.publicHeroButton}><Text style={styles.publicHeroButtonText}>Solicitar turno</Text></Pressable></View></View>
        </AnimatedImageBackground>
      <Animated.View style={[styles.publicLandingBand, { minHeight: sectionHeight }, appear([0, 340])]}><View style={styles.publicContentContainer}><Text style={styles.eyebrow}>Sobre nosotros</Text><Text style={styles.publicSectionTitle}>{aboutTitle}</Text><Text style={styles.publicSectionText}>{aboutDescription}</Text>{landingServices.length ? <><ScrollView horizontal onMouseEnter={() => { aboutServicesHoveredRef.current = true; }} onMouseLeave={() => { aboutServicesHoveredRef.current = false; }} onMomentumScrollEnd={(event) => handleAboutServiceScrollEnd(event.nativeEvent.contentOffset.x)} ref={aboutServicesRef} showsHorizontalScrollIndicator={false} style={styles.publicAboutServices}>{Array.from({ length: aboutServiceCopies }, (_, copyIndex) => landingServices.map((service, serviceIndex) => ({ service, index: copyIndex * landingServices.length + serviceIndex }))).flat().map(({ service, index }) => <View key={`${index}-${service.id ?? service.name}`} style={styles.publicAboutService}>{service.image ? <ImageBackground imageStyle={styles.publicAboutServiceImage} source={{ uri: service.image }} style={styles.publicAboutServiceImageContainer} /> : <View style={styles.publicAboutServiceImageContainer} />}<View style={styles.publicAboutServiceCopy}><Text style={styles.publicAboutServiceTitle}>{service.name}</Text><Text style={styles.publicAboutServiceDescription}>{service.description}</Text></View></View>)}</ScrollView><View style={styles.publicAboutServiceDots}>{landingServices.map((service, index) => <Pressable accessibilityLabel={`Ir al servicio ${service.name}`} key={service.id ?? service.name} onPress={() => selectAboutService(index)} style={[styles.publicAboutServiceDot, index === aboutServiceIndex && styles.publicAboutServiceDotActive]} />)}</View></> : null}</View></Animated.View>
      <Animated.View onLayout={(event) => setBookingSectionY(event.nativeEvent.layout.y)} style={[styles.publicLandingBandSurface, { height: sectionHeight }, bookingAppear]}>
        <View style={styles.publicContentContainer}>
        <View style={styles.publicBookingHeading}><View><Text style={styles.eyebrow}>Turnos</Text><Text style={styles.publicSectionTitle}>Elegí el momento ideal</Text></View><Text style={styles.publicBookingProgressText}>Paso {bookingStep + 1} de 4</Text></View>
        <Text style={styles.publicSectionText}>Seleccioná un día y horario disponible. Te vamos a confirmar la solicitud a la brevedad.</Text>
        <View style={styles.publicBookingProgress}><View style={styles.publicBookingProgressDots}>{[0, 1, 2, 3].map((step) => <View key={step} style={[styles.publicBookingProgressDot, step === bookingStep && styles.publicBookingProgressDotActive]} />)}</View></View>
        <ScrollView
          style={styles.publicBookingPager}
          contentContainerStyle={styles.publicBookingPagerContent}
          horizontal
          onMomentumScrollEnd={(event) => setBookingStep(Math.round(event.nativeEvent.contentOffset.x / bookingStepWidth))}
          pagingEnabled
          ref={bookingPagerRef}
          showsHorizontalScrollIndicator={false}
          snapToInterval={bookingStepWidth}
        >
          <ScrollView nestedScrollEnabled style={[styles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={styles.publicBookingStepContent}>
            <Text style={styles.publicStepNumber}>01</Text>
            <Text style={styles.publicStepTitle}>¿Qué servicio necesitás?</Text>
            <Text style={styles.publicSectionText}>Elegí una opción para continuar.</Text>
            <View style={styles.publicServiceList}>{bookingServices.map((service) => <Pressable key={service.id ?? service.name} onPress={() => setSelectedService(service.name)} style={[styles.publicService, selectedService === service.name && styles.publicServiceSelected]}><Text style={selectedService === service.name ? styles.publicServiceTitleSelected : styles.publicServiceTitle}>{service.name}</Text><Text style={selectedService === service.name ? styles.publicServiceDescriptionSelected : styles.publicServiceDescription}>{service.description}</Text></Pressable>)}</View>
            <Pressable onPress={() => goToBookingStep(1)} style={styles.button}><Text style={styles.buttonText}>Ver disponibilidad</Text></Pressable>
          </ScrollView>
          <ScrollView nestedScrollEnabled style={[styles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={styles.publicBookingStepContent}>
            <Text style={styles.publicStepNumber}>02</Text>
            <Text style={styles.publicStepTitle}>Elegí disponibilidad</Text>
            <Text style={styles.label}>Fecha</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.publicCalendarDays}>{calendarDays.map((day) => {
              const key = dateKey(day);
              return <Pressable key={key} onPress={() => setSelectedDate(key)} style={[styles.publicCalendarDay, key === selectedDate && styles.publicCalendarDaySelected]}><Text style={key === selectedDate ? styles.publicCalendarDaySelectedText : styles.publicCalendarDayText}>{String(day.getDate()).padStart(2, '0')}/{String(day.getMonth() + 1).padStart(2, '0')}</Text><Text style={key === selectedDate ? styles.publicCalendarDaySelectedWeekday : styles.publicCalendarDayWeekday}>{new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(day).replace('.', '').slice(0, 3)}</Text></Pressable>;
            })}</ScrollView>
            <Text style={styles.label}>Horario</Text>
            {loadingSlots ? <ActivityIndicator color={colors.accent} /> : slots.length ? <View style={styles.publicSlotGrid}>{slots.map((slot) => <Pressable key={slot.startsAt} onPress={() => setSelectedSlot(slot)} style={[styles.publicSlot, selectedSlot?.startsAt === slot.startsAt && styles.publicSlotSelected]}><Text style={selectedSlot?.startsAt === slot.startsAt ? styles.publicSlotSelectedText : styles.publicSlotText}>{formatSlot(slot.startsAt)}</Text></Pressable>)}</View> : <Text style={styles.empty}>No hay horarios disponibles para esta fecha.</Text>}
            <View style={styles.publicStepActions}><Pressable onPress={() => goToBookingStep(0)} style={styles.publicStepActionSecondary}><Text style={styles.secondaryText}>Atrás</Text></Pressable><Pressable disabled={!selectedSlot} onPress={() => goToBookingStep(2)} style={[styles.publicStepAction, styles.publicStepActionPrimary, !selectedSlot && styles.buttonDisabled]}><Text style={styles.buttonText}>Continuar</Text></Pressable></View>
          </ScrollView>
          <ScrollView nestedScrollEnabled style={[styles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={styles.publicBookingStepContent}>
            <Text style={styles.publicStepNumber}>03</Text>
            <Text style={styles.publicStepTitle}>Tus datos de contacto</Text>
            <Text style={styles.publicSectionText}>{selectedService} · {selectedSlot ? formatSlot(selectedSlot.startsAt) : 'Elegí un horario'}</Text>
            <TextInput onChangeText={setName} placeholder="Nombre" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
            <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} style={styles.input} value={email} />
            <TextInput keyboardType="phone-pad" onChangeText={setPhone} placeholder="Teléfono" placeholderTextColor={colors.textMuted} style={styles.input} value={phone} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.publicStepActions}><Pressable onPress={() => goToBookingStep(1)} style={styles.publicStepActionSecondary}><Text style={styles.secondaryText}>Atrás</Text></Pressable><Pressable onPress={() => goToBookingStep(3)} style={[styles.publicStepAction, styles.publicStepActionPrimary]}><Text style={styles.buttonText}>Continuar</Text></Pressable></View>
          </ScrollView>
          <ScrollView nestedScrollEnabled style={[styles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={styles.publicBookingStepContent}>
            <Text style={styles.publicStepNumber}>04</Text>
            <Text style={styles.publicStepTitle}>¿Querés agregar algo?</Text>
            <Text style={styles.publicSectionText}>Este campo es opcional. Podés contarnos cualquier detalle antes de enviar la solicitud.</Text>
            <TextInput multiline numberOfLines={4} onChangeText={setNotes} placeholder="Notas opcionales" placeholderTextColor={colors.textMuted} style={[styles.input, styles.textArea]} value={notes} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.publicStepActions}><Pressable onPress={() => goToBookingStep(2)} style={styles.publicStepActionSecondary}><Text style={styles.secondaryText}>Atrás</Text></Pressable><Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.publicStepAction, styles.publicStepActionPrimary, pressed && styles.buttonPressed]}>{saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Enviar solicitud</Text>}</Pressable></View>
          </ScrollView>
        </ScrollView>
        </View>
      </Animated.View>
      <View style={styles.publicFooter}>
        <View style={styles.publicFooterContainer}>
          <View style={styles.publicFooterBrand}><Text style={styles.publicFooterLogo}>eldavo</Text><Text style={styles.publicFooterDescription}>Una forma simple de organizar tus turnos.</Text></View>
          <View style={styles.publicFooterLinks}><Text style={styles.publicFooterLink}>Sobre nosotros</Text><Text style={styles.publicFooterLink}>Privacidad</Text><Text style={styles.publicFooterLink}>Términos y condiciones</Text></View>
          <Text style={styles.publicFooterCopyright}>© {new Date().getFullYear()} Eldavo</Text>
        </View>
      </View>
      </Animated.ScrollView>
    </View>
  );
}
