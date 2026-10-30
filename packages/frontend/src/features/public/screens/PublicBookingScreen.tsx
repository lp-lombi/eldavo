import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, ImageBackground, Linking, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import heroImage from '../../../assets/esmeralda.jpg';
import { LandingService, PublicAvailabilitySlot } from '../../../services';
import { colors, styles } from '../../../shared';
import { usePublicBooking } from '../hooks/usePublicBooking';
import { publicStyles } from './PublicBookingScreen.styles';

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
  const [aboutSectionY, setAboutSectionY] = useState<number | null>(null);
  const [reviewsSectionY, setReviewsSectionY] = useState<number | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroEntrance = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const bookingPagerRef = useRef<ScrollView>(null);
  const aboutServicesRef = useRef<ScrollView>(null);
  const aboutServicePhysicalIndexRef = useRef(0);
  const aboutServicesHoveredRef = useRef(false);
  const aboutServicePendingOffsetRef = useRef<number | null>(null);
  const aboutServiceAdjustingRef = useRef(false);
  const [aboutServiceIndex, setAboutServiceIndex] = useState(0);
  const [aboutCarouselItems, setAboutCarouselItems] = useState<LandingService[]>([]);
  const { width: viewportWidth } = useWindowDimensions();
  const jumpToBooking = () => {
    if (bookingSectionY === null) return;
    scrollRef.current?.scrollTo({ y: bookingSectionY, animated: true });
  };
  const jumpToAbout = () => {
    if (aboutSectionY === null) return;
    scrollRef.current?.scrollTo({ y: aboutSectionY, animated: true });
  };
  const jumpToReviews = () => {
    if (reviewsSectionY === null) return;
    scrollRef.current?.scrollTo({ y: reviewsSectionY, animated: true });
  };
  const bookingStepWidth = Math.min(Math.max(viewportWidth, 280), 1180);
  const aboutServiceStep = 298;
  const landingServices: LandingService[] = profile?.landingServices || [];
  const googleReviews = profile?.googleReviews || [];

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
    const initialItems = [...landingServices, ...landingServices, ...landingServices];
    const initialIndex = landingServices.length;
    setAboutCarouselItems(initialItems);
    aboutServicePhysicalIndexRef.current = initialIndex;
    setAboutServiceIndex(0);
    aboutServicesRef.current?.scrollTo({ x: initialIndex * aboutServiceStep, animated: false });
  }, [profile?.username, landingServices]);

  useEffect(() => {
    if (aboutServicePendingOffsetRef.current === null) {
      aboutServiceAdjustingRef.current = false;
      return;
    }
    const pendingOffset = aboutServicePendingOffsetRef.current;
    aboutServicePendingOffsetRef.current = null;
    aboutServicesRef.current?.scrollTo({ x: pendingOffset * aboutServiceStep, animated: false });
    aboutServiceAdjustingRef.current = false;
  }, [aboutCarouselItems]);

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
    const physicalIndex = landingServices.length + index;
    aboutServicePhysicalIndexRef.current = physicalIndex;
    setAboutServiceIndex(index);
    aboutServicesRef.current?.scrollTo({ x: physicalIndex * aboutServiceStep, animated: true });
  }

  function handleAboutServiceScrollEnd(offsetX: number) {
    if (!landingServices.length || !aboutCarouselItems.length) return;
    const physicalIndex = Math.round(offsetX / aboutServiceStep);
    const serviceIndex = ((physicalIndex % landingServices.length) + landingServices.length) % landingServices.length;
    const copyLength = landingServices.length;
    let normalizedPhysicalIndex = physicalIndex;
    if (physicalIndex >= aboutCarouselItems.length - 1) {
      normalizedPhysicalIndex = physicalIndex - copyLength;
      aboutServicePendingOffsetRef.current = normalizedPhysicalIndex;
      setAboutCarouselItems((items) => [...items.slice(copyLength), ...landingServices]);
    } else if (physicalIndex <= 0) {
      normalizedPhysicalIndex = physicalIndex + copyLength;
      aboutServicePendingOffsetRef.current = normalizedPhysicalIndex;
      setAboutCarouselItems((items) => [...landingServices, ...items.slice(0, -copyLength)]);
    }
    aboutServicePhysicalIndexRef.current = normalizedPhysicalIndex;
    setAboutServiceIndex(serviceIndex);
    if (normalizedPhysicalIndex !== physicalIndex) return;
  }

  function handleAboutServiceScroll(offsetX: number, contentWidth: number, viewportWidth: number) {
    if (aboutServiceAdjustingRef.current || !landingServices.length || !aboutCarouselItems.length) return;
    const edgeDistance = aboutServiceStep;
    const copyLength = landingServices.length;
    const physicalIndex = Math.round(offsetX / aboutServiceStep);
    const maxOffset = Math.max(contentWidth - viewportWidth, 0);
    const nearRightEdge = maxOffset > edgeDistance && offsetX >= maxOffset - edgeDistance;
    const nearLeftEdge = maxOffset > edgeDistance && offsetX <= edgeDistance;
    if (!nearRightEdge && !nearLeftEdge) {
      setAboutServiceIndex(((physicalIndex % copyLength) + copyLength) % copyLength);
      return;
    }

    aboutServiceAdjustingRef.current = true;
    const normalizedPhysicalIndex = nearRightEdge
      ? physicalIndex - copyLength
      : physicalIndex + copyLength;
    const serviceIndex = ((physicalIndex % copyLength) + copyLength) % copyLength;
    aboutServicePhysicalIndexRef.current = normalizedPhysicalIndex;
    setAboutServiceIndex(serviceIndex);
    aboutServicePendingOffsetRef.current = normalizedPhysicalIndex;
    setAboutCarouselItems((items) => nearRightEdge
      ? [...items.slice(copyLength), ...landingServices]
      : [...landingServices, ...items.slice(0, -copyLength)]);
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
    const publicUrl = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/${profile.publicSlug || username}`
      : `https://eldavo.app/${profile.publicSlug || username}`;
    const openPublicWebsite = () => { void Linking.openURL(publicUrl); };

    return (
      <View style={publicStyles.publicReceiptPage}>
        <View style={publicStyles.publicHeader}>
          <View style={publicStyles.publicContainer}>
            <Pressable accessibilityLabel="Volver a la web pública" onPress={openPublicWebsite} style={publicStyles.publicBrand}>
              {profile.brandLogo ? <Image accessibilityLabel="Logo de la marca" source={{ uri: profile.brandLogo }} style={publicStyles.publicBrandLogo} /> : null}
              <Text style={publicStyles.publicLogo}>{profile.publicBrandName || profile.username}</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={publicStyles.publicReceiptScrollContent} showsVerticalScrollIndicator={false}>
        <View style={publicStyles.publicReceipt}>
          <Text style={publicStyles.publicReceiptIcon}>✓</Text>
          <Text style={styles.eyebrow}>Solicitud recibida</Text>
          <Text style={publicStyles.publicReceiptTitle}>Gracias, {name}</Text>
          <Text style={publicStyles.publicSectionText}>Tu solicitud fue enviada correctamente. {profile.username} deberá confirmarla para que el turno quede reservado.</Text>
          <View style={publicStyles.publicReceiptCard}>
            <Text style={publicStyles.publicReceiptLabel}>Número de turno</Text>
            <Text style={publicStyles.publicReceiptNumber}>#{bookingId ?? '—'}</Text>
            <View style={publicStyles.publicReceiptDivider} />
            <Text style={publicStyles.publicReceiptLabel}>Servicio</Text>
            <Text style={publicStyles.publicReceiptValue}>{selectedService}</Text>
            <Text style={publicStyles.publicReceiptLabel}>Fecha</Text>
            <Text style={publicStyles.publicReceiptValue}>{formatBookingDate(selectedDate)}</Text>
            <Text style={publicStyles.publicReceiptLabel}>Horario</Text>
            <Text style={publicStyles.publicReceiptValue}>{selectedSlot ? `${formatSlot(selectedSlot.startsAt)} - ${formatSlot(selectedSlot.endsAt)}` : '—'}</Text>
            <Text style={publicStyles.publicReceiptLabel}>Email de contacto</Text>
            <Text style={publicStyles.publicReceiptValue}>{email}</Text>
          </View>
          <Text style={publicStyles.publicReceiptNote}>Conservá este número para consultar tu solicitud.</Text>
        </View>
        </ScrollView>
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
    opacity: scrollY.interpolate({ inputRange, outputRange: [0.1, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: scrollY.interpolate({ inputRange, outputRange: [64, 0], extrapolate: 'clamp' }) }],
  });
  const bookingAppear = bookingSectionY === null
    ? undefined
    : appear([Math.max(0, bookingSectionY - viewportHeight * 0.78), Math.max(1, bookingSectionY - viewportHeight * 0.08)]);

  return (
    <View style={publicStyles.publicLanding}>
      <View style={publicStyles.publicHeader}>
        <View style={publicStyles.publicContainer}><View style={publicStyles.publicBrand}>{profile.brandLogo ? <Image accessibilityLabel="Logo de la marca" source={{ uri: profile.brandLogo }} style={publicStyles.publicBrandLogo} /> : null}<Text style={publicStyles.publicLogo}>{profile.publicBrandName || profile.username}</Text></View>{viewportWidth > 700 ? <View style={publicStyles.publicHeaderActions}><Pressable onPress={jumpToAbout}><Text style={publicStyles.publicHeaderLink}>Sobre nosotros</Text></Pressable>{googleReviews.length ? <Pressable onPress={jumpToReviews}><Text style={publicStyles.publicHeaderLink}>Reseñas</Text></Pressable> : null}<Pressable onPress={jumpToBooking}><Text style={publicStyles.publicHeaderLink}>Reservar turno</Text></Pressable></View> : null}</View>
      </View>
      <Animated.ScrollView
        contentContainerStyle={publicStyles.publicScrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        ref={scrollRef}
        scrollEventThrottle={16}
      >
        <AnimatedImageBackground imageStyle={publicStyles.publicHeroImage} resizeMode="cover" source={profile.heroImage ? { uri: profile.heroImage } : heroImage} style={[publicStyles.publicHero, { height: Math.max(viewportHeight - 72, 0) }, { opacity: heroEntrance }]}>
          <View style={publicStyles.publicHeroOverlay} />
          <View style={publicStyles.publicContainer}><View style={publicStyles.publicHeroCopy}><Text style={publicStyles.publicHeroEyebrow}>Bienvenido/a</Text><Text style={publicStyles.publicHeroTitle}>{heroTitle}</Text><Text style={publicStyles.publicHeroSubtitle}>{heroDescription}</Text><Pressable onPress={jumpToBooking} style={publicStyles.publicHeroButton}><Text style={publicStyles.publicHeroButtonText}>Solicitar turno</Text></Pressable></View></View>
        </AnimatedImageBackground>
      <Animated.View onLayout={(event) => setAboutSectionY(event.nativeEvent.layout.y)} style={[publicStyles.publicLandingBand, { minHeight: sectionHeight }, appear([120, Math.max(121, viewportHeight * 0.75)])]}><View style={publicStyles.publicContentContainer}><Text style={styles.eyebrow}>Sobre nosotros</Text><Text style={publicStyles.publicSectionTitle}>{aboutTitle}</Text><Text style={publicStyles.publicSectionText}>{aboutDescription}</Text>{landingServices.length ? <><ScrollView contentContainerStyle={publicStyles.publicAboutServicesContent} horizontal onMouseEnter={() => { aboutServicesHoveredRef.current = true; }} onMouseLeave={() => { aboutServicesHoveredRef.current = false; }} onScroll={(event) => handleAboutServiceScroll(event.nativeEvent.contentOffset.x, event.nativeEvent.contentSize.width, event.nativeEvent.layoutMeasurement.width)} onMomentumScrollEnd={(event) => handleAboutServiceScrollEnd(event.nativeEvent.contentOffset.x)} ref={aboutServicesRef} scrollEventThrottle={16} showsHorizontalScrollIndicator={false} style={publicStyles.publicAboutServices}>{aboutCarouselItems.map((service, index) => <View key={`${index}-${service.id ?? service.name}`} style={publicStyles.publicAboutService}>{service.image ? <ImageBackground imageStyle={publicStyles.publicAboutServiceImage} source={{ uri: service.image }} style={publicStyles.publicAboutServiceImageContainer} /> : <View style={publicStyles.publicAboutServiceImageContainer} />}<View style={publicStyles.publicAboutServiceCopy}><Text style={publicStyles.publicAboutServiceTitle}>{service.name}</Text><Text style={publicStyles.publicAboutServiceDescription}>{service.description}</Text></View></View>)}</ScrollView><View style={publicStyles.publicAboutServiceDots}>{landingServices.map((service, index) => <Pressable accessibilityLabel={`Ir al servicio ${service.name}`} key={service.id ?? service.name} onPress={() => selectAboutService(index)} style={[publicStyles.publicAboutServiceDot, index === aboutServiceIndex && publicStyles.publicAboutServiceDotActive]} />)}</View></> : null}</View></Animated.View>
      {googleReviews.length ? <Animated.View onLayout={(event) => setReviewsSectionY(event.nativeEvent.layout.y)} style={[publicStyles.publicReviewsSection, { minHeight: sectionHeight }, appear([Math.max(0, viewportHeight * 0.75), Math.max(1, viewportHeight * 1.35)])]}><View style={publicStyles.publicContentContainer}><Text style={styles.eyebrow}>Reseñas</Text><Text style={publicStyles.publicReviewsTitle}>Lo que dicen nuestros clientes</Text><View style={publicStyles.publicReviewsGrid}>{googleReviews.map((review, index) => <View key={`${review.author}-${index}`} style={publicStyles.publicReviewCard}><Text style={publicStyles.publicReviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text><Text style={publicStyles.publicReviewText}>{review.text}</Text><Text style={publicStyles.publicReviewAuthor}>{review.author}</Text>{review.url ? <Pressable onPress={() => void Linking.openURL(review.url || '')} style={publicStyles.publicReviewLink}><FontAwesomeIcon color="#4285f4" icon={faGoogle} size={14} /><Text style={publicStyles.publicReviewLinkText}>Ver reseña en Google Maps</Text></Pressable> : null}</View>)}</View></View></Animated.View> : null}
      <Animated.View onLayout={(event) => setBookingSectionY(event.nativeEvent.layout.y)} style={[publicStyles.publicLandingBandSurface, { minHeight: sectionHeight }, bookingAppear]}>
        <View style={publicStyles.publicContentContainer}>
        <View style={publicStyles.publicBookingHeading}><View><Text style={styles.eyebrow}>Turnos</Text><Text style={publicStyles.publicSectionTitle}>Elegí el momento ideal</Text></View><Text style={publicStyles.publicBookingProgressText}>Paso {bookingStep + 1} de 4</Text></View>
        <Text style={publicStyles.publicSectionText}>Seleccioná un día y horario disponible. Te vamos a confirmar la solicitud a la brevedad.</Text>
        <View style={publicStyles.publicBookingProgress}><View style={publicStyles.publicBookingProgressDots}>{[0, 1, 2, 3].map((step) => <View key={step} style={[publicStyles.publicBookingProgressDot, step === bookingStep && publicStyles.publicBookingProgressDotActive]} />)}</View></View>
        <ScrollView
          style={[publicStyles.publicBookingPager, { height: Math.max(sectionHeight, 620) }]}
          contentContainerStyle={publicStyles.publicBookingPagerContent}
          horizontal
          onMomentumScrollEnd={(event) => setBookingStep(Math.round(event.nativeEvent.contentOffset.x / bookingStepWidth))}
          pagingEnabled
          ref={bookingPagerRef}
          showsHorizontalScrollIndicator={false}
          snapToInterval={bookingStepWidth}
        >
          <ScrollView nestedScrollEnabled style={[publicStyles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={publicStyles.publicBookingStepContent}>
            <Text style={publicStyles.publicStepNumber}>01</Text>
            <Text style={publicStyles.publicStepTitle}>¿Qué servicio necesitás?</Text>
            <Text style={publicStyles.publicSectionText}>Elegí una opción para continuar.</Text>
            <View style={publicStyles.publicServiceList}>{bookingServices.map((service) => <Pressable key={service.id ?? service.name} onPress={() => { setSelectedService(service.name); goToBookingStep(1); }} style={[publicStyles.publicService, selectedService === service.name && publicStyles.publicServiceSelected]}><Text style={selectedService === service.name ? publicStyles.publicServiceTitleSelected : publicStyles.publicServiceTitle}>{service.name}</Text><Text style={selectedService === service.name ? publicStyles.publicServiceDescriptionSelected : publicStyles.publicServiceDescription}>{service.description}</Text></Pressable>)}</View>
          </ScrollView>
          <ScrollView nestedScrollEnabled style={[publicStyles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={publicStyles.publicBookingStepContent}>
            <Text style={publicStyles.publicStepNumber}>02</Text>
            <Text style={publicStyles.publicStepTitle}>Elegí disponibilidad</Text>
            <Text style={styles.label}>Fecha</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={publicStyles.publicCalendarDays}>{calendarDays.map((day) => {
              const key = dateKey(day);
              return <Pressable key={key} onPress={() => setSelectedDate(key)} style={[publicStyles.publicCalendarDay, key === selectedDate && publicStyles.publicCalendarDaySelected]}><Text style={key === selectedDate ? publicStyles.publicCalendarDaySelectedText : publicStyles.publicCalendarDayText}>{String(day.getDate()).padStart(2, '0')}/{String(day.getMonth() + 1).padStart(2, '0')}</Text><Text style={key === selectedDate ? publicStyles.publicCalendarDaySelectedWeekday : publicStyles.publicCalendarDayWeekday}>{new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(day).replace('.', '').slice(0, 3)}</Text></Pressable>;
            })}</ScrollView>
            <Text style={styles.label}>Horario</Text>
            {loadingSlots ? <ActivityIndicator color={colors.accent} /> : slots.length ? <View style={publicStyles.publicSlotGrid}>{slots.map((slot) => <Pressable key={slot.startsAt} onPress={() => setSelectedSlot(slot)} style={[publicStyles.publicSlot, selectedSlot?.startsAt === slot.startsAt && publicStyles.publicSlotSelected]}><Text style={selectedSlot?.startsAt === slot.startsAt ? publicStyles.publicSlotSelectedText : publicStyles.publicSlotText}>{formatSlot(slot.startsAt)}</Text></Pressable>)}</View> : <Text style={styles.empty}>No hay horarios disponibles para esta fecha.</Text>}
            <View style={publicStyles.publicStepActions}><Pressable onPress={() => goToBookingStep(0)} style={publicStyles.publicStepActionSecondary}><Text style={styles.secondaryText}>Atrás</Text></Pressable><Pressable disabled={!selectedSlot} onPress={() => goToBookingStep(2)} style={[publicStyles.publicStepAction, publicStyles.publicStepActionPrimary, !selectedSlot && styles.buttonDisabled]}><Text style={styles.buttonText}>Continuar</Text></Pressable></View>
          </ScrollView>
          <ScrollView nestedScrollEnabled style={[publicStyles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={publicStyles.publicBookingStepContent}>
            <Text style={publicStyles.publicStepNumber}>03</Text>
            <Text style={publicStyles.publicStepTitle}>Tus datos de contacto</Text>
            <Text style={publicStyles.publicSectionText}>{selectedService} · {selectedSlot ? formatSlot(selectedSlot.startsAt) : 'Elegí un horario'}</Text>
            <TextInput onChangeText={setName} placeholder="Nombre" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
            <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} style={styles.input} value={email} />
            <TextInput keyboardType="phone-pad" onChangeText={setPhone} placeholder="Teléfono" placeholderTextColor={colors.textMuted} style={styles.input} value={phone} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={publicStyles.publicStepActions}><Pressable onPress={() => goToBookingStep(1)} style={publicStyles.publicStepActionSecondary}><Text style={styles.secondaryText}>Atrás</Text></Pressable><Pressable onPress={() => goToBookingStep(3)} style={[publicStyles.publicStepAction, publicStyles.publicStepActionPrimary]}><Text style={styles.buttonText}>Continuar</Text></Pressable></View>
          </ScrollView>
          <ScrollView nestedScrollEnabled style={[publicStyles.publicBookingStep, { width: bookingStepWidth }]} contentContainerStyle={publicStyles.publicBookingStepContent}>
            <Text style={publicStyles.publicStepNumber}>04</Text>
            <Text style={publicStyles.publicStepTitle}>¿Querés agregar algo?</Text>
            <Text style={publicStyles.publicSectionText}>Este campo es opcional. Podés contarnos cualquier detalle antes de enviar la solicitud.</Text>
            <TextInput multiline numberOfLines={4} onChangeText={setNotes} placeholder="Notas opcionales" placeholderTextColor={colors.textMuted} style={[styles.input, styles.textArea]} value={notes} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={publicStyles.publicStepActions}><Pressable onPress={() => goToBookingStep(2)} style={publicStyles.publicStepActionSecondary}><Text style={styles.secondaryText}>Atrás</Text></Pressable><Pressable disabled={saving} onPress={submit} style={({ pressed }) => [publicStyles.publicStepAction, publicStyles.publicStepActionPrimary, pressed && styles.buttonPressed]}>{saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Enviar solicitud</Text>}</Pressable></View>
          </ScrollView>
        </ScrollView>
        </View>
      </Animated.View>
      <View style={publicStyles.publicFooter}>
        <View style={publicStyles.publicFooterContainer}>
          <View style={publicStyles.publicFooterBrand}><Text style={publicStyles.publicFooterLogo}>eldavo</Text><Text style={publicStyles.publicFooterDescription}>Una forma simple de organizar tus turnos.</Text></View>
          <View style={publicStyles.publicFooterLinks}><Text style={publicStyles.publicFooterLink}>Sobre nosotros</Text><Text style={publicStyles.publicFooterLink}>Privacidad</Text><Text style={publicStyles.publicFooterLink}>Términos y condiciones</Text></View>
          <Text style={publicStyles.publicFooterCopyright}>© {new Date().getFullYear()} Eldavo</Text>
        </View>
      </View>
      </Animated.ScrollView>
    </View>
  );
}
