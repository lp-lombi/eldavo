import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { faBars, faBoxesStacked, faCalendarCheck, faChartColumn, faClipboardList, faFileExport, faGaugeHigh, faRightFromBracket, faUserPlus, faUsers, faXmark, faSliders } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Appointment, AppointmentRequest, Client, confirmAppointmentRequest, exportDatabase, Order, rejectAppointmentRequest, Session } from '../../../services';
import { colors, styles } from '../../../shared';
import { useDashboardData } from '../hooks/useDashboardData';
import { OrderList } from '../../orders/components/OrderList';
import { ClientFormModal } from '../../clients/components/ClientFormModal';
import { Statistics } from '../components/Statistics';
import { AppointmentCard } from '../components/AppointmentCard';
import { AppointmentDetailsModal } from '../components/AppointmentDetailsModal';
import { AppointmentFormModal } from '../../appointments/components/AppointmentFormModal';
import { PendingAppointmentRequests } from '../components/PendingAppointmentRequests';

type DashboardProps = { session: Session; onLogout: () => void; onOpenSettings: () => void; onOpenClients: () => void; onOpenOrders: () => void; onOpenInventory: () => void; onOpenOrderCreate: () => void; onSelectClient: (client: Client) => void; onSelectOrder: (order: Order) => void };

export function Dashboard({ session, onLogout, onOpenSettings, onOpenClients, onOpenOrders, onOpenInventory, onOpenOrderCreate, onSelectClient, onSelectOrder }: DashboardProps) {
  const { clients, orders, tags, appointments, appointmentRequests, setClients, setAppointments, setAppointmentRequests, loading, error } = useDashboardData(session.token);
  const [createClientVisible, setCreateClientVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createAppointmentVisible, setCreateAppointmentVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const ordersOffset = useRef(0);
  const statisticsOffset = useRef(0);

  const navigateTo = (offset: number) => {
    setMenuOpen(false);
    requestAnimationFrame(() => scrollViewRef.current?.scrollTo({ animated: true, y: offset }));
  };

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const handleClientCreated = (client: Client) => {
    setClients((currentClients) => [...currentClients, client]);
    setCreateClientVisible(false);
  };

  const handleAppointmentCreated = (appointment: Appointment) => {
    setAppointments((current) => [...current, appointment].sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()));
    setCreateAppointmentVisible(false);
    if (appointment.syncStatus === 'failed') Alert.alert('Turno guardado, pero no sincronizado', appointment.syncError || 'No se pudo agregar el turno a Google Calendar.');
    if (appointment.syncStatus === 'not_connected') Alert.alert('Turno guardado', 'Conecta Google Calendar desde Configuración para sincronizar tus turnos.');
  };
  const handleAppointmentDeleted = (appointmentId: number) => setAppointments((current) => current.filter((appointment) => appointment.id !== appointmentId));
  async function confirmRequest(request: AppointmentRequest) {
    try {
      const appointment = await confirmAppointmentRequest(session.token, request.id);
      setAppointmentRequests((current) => current.filter((item) => item.id !== request.id));
      setAppointments((current) => [...current, appointment].sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()));
    } catch (requestError) { Alert.alert('No se pudo confirmar', requestError instanceof Error ? requestError.message : 'El turno ya no está disponible'); }
  }
  async function rejectRequest(request: AppointmentRequest) {
    try { await rejectAppointmentRequest(session.token, request.id); setAppointmentRequests((current) => current.filter((item) => item.id !== request.id)); }
    catch (requestError) { Alert.alert('No se pudo rechazar', requestError instanceof Error ? requestError.message : 'No se pudo rechazar la solicitud'); }
  }

  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const nearestOrders = pendingOrders.filter((order) => order.completionDate)
    .sort((first, second) => new Date(first.completionDate as string).getTime() - new Date(second.completionDate as string).getTime())
    .slice(0, 3);

  const exportCsv = async () => {
    closeMenu();
    try {
      const csv = await exportDatabase(session.token);
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'eldavo-export.csv';
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}eldavo-export.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar datos de Eldavo' });
    } catch (exportError) {
      Alert.alert('Error al exportar', exportError instanceof Error ? exportError.message : 'No se pudo exportar la base de datos');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.dashboardTopBar}>
        <Pressable
          accessibilityLabel="Abrir navegación"
          onPress={openMenu}
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.listItemPressed,
          ]}
        >
          <FontAwesomeIcon
            color={styles.menuIcon.color}
            icon={faBars}
            size={20}
          />
        </Pressable>
        <Text style={styles.appName}>Eldavo</Text>
      </View>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <View style={styles.dashboardActionsSection}>
          <View style={styles.dashboardActions}>
            <Pressable
              accessibilityLabel="Nuevo pedido"
              onPress={onOpenOrderCreate}
              style={({ pressed }) => [
                styles.dashboardAction,
                pressed && styles.buttonPressed,
              ]}
            >
              <FontAwesomeIcon
                color={styles.dashboardActionIcon.color}
                icon={faClipboardList}
                size={22}
              />
              <Text style={styles.dashboardActionText}>Nuevo pedido</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Nuevo cliente"
              onPress={() => setCreateClientVisible(true)}
              style={({ pressed }) => [
                styles.dashboardAction,
                pressed && styles.buttonPressed,
              ]}
            >
              <FontAwesomeIcon
                color={styles.dashboardActionIcon.color}
                icon={faUserPlus}
                size={22}
              />
              <Text style={styles.dashboardActionText}>Nuevo cliente</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Nuevo turno"
              onPress={() => setCreateAppointmentVisible(true)}
              style={({ pressed }) => [
                styles.dashboardAction,
                pressed && styles.buttonPressed,
              ]}
            >
              <FontAwesomeIcon
                color={styles.dashboardActionIcon.color}
                icon={faCalendarCheck}
                size={22}
              />
              <Text style={styles.dashboardActionText}>Nuevo turno</Text>
            </Pressable>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loading} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? (
          <>
            <View
              onLayout={({ nativeEvent }) => {
                ordersOffset.current = nativeEvent.layout.y;
              }}
              style={styles.dashboardOrdersSection}
            >
              <OrderList
                onSelectOrder={onSelectOrder}
                orders={nearestOrders}
                title="Pedidos pendientes"
              />
              {pendingOrders.length > nearestOrders.length ? (
                <Pressable onPress={onOpenOrders} style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>Ver todos los pedidos</Text>
                </Pressable>
              ) : null}
            </View>
            <PendingAppointmentRequests requests={appointmentRequests} onConfirm={(request) => void confirmRequest(request)} onReject={(request) => void rejectRequest(request)} />
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Próximos turnos ({appointments.length})
                </Text>
                <Pressable onPress={() => setCreateAppointmentVisible(true)}>
                  <Text style={styles.viewMoreText}>Nuevo</Text>
                </Pressable>
              </View>
              {appointments.slice(0, 5).map((appointment) => (
                <AppointmentCard
                  appointment={appointment}
                  key={appointment.id}
                  onPress={setSelectedAppointment}
                />
              ))}
              {!appointments.length ? (
                <Text style={styles.empty}>No hay turnos programados.</Text>
              ) : null}
            </View>
            <View
              onLayout={({ nativeEvent }) => {
                statisticsOffset.current = nativeEvent.layout.y;
              }}
            >
              <Statistics
                clients={clients}
                onOpenClients={onOpenClients}
                onOpenOrders={onOpenOrders}
                onSelectClient={onSelectClient}
                orders={orders}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
      <Modal
        animationType="none"
        onRequestClose={closeMenu}
        transparent
        visible={menuOpen}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.eyebrow}>Navegación</Text>
                <Text style={styles.drawerTitle}>Eldavo</Text>
              </View>
              <Pressable
                accessibilityLabel="Cerrar navegación"
                onPress={closeMenu}
                style={styles.iconButton}
              >
                <FontAwesomeIcon
                  color={styles.menuIcon.color}
                  icon={faXmark}
                  size={20}
                />
              </Pressable>
            </View>
            <View style={styles.drawerMenu}>
              <Pressable onPress={() => navigateTo(0)} style={styles.navItem}>
                <FontAwesomeIcon
                  color={colors.accent}
                  icon={faGaugeHigh}
                  size={16}
                />
                <Text style={styles.navItemText}>Panel principal</Text>
              </Pressable>
              <Pressable onPress={onOpenClients} style={styles.navItem}>
                <FontAwesomeIcon
                  color={colors.textMuted}
                  icon={faUsers}
                  size={16}
                />
                <Text style={styles.navItemText}>Clientes</Text>
              </Pressable>
              <Pressable onPress={onOpenOrders} style={styles.navItem}>
                <FontAwesomeIcon
                  color={colors.textMuted}
                  icon={faClipboardList}
                  size={16}
                />
                <Text style={styles.navItemText}>Pedidos</Text>
              </Pressable>
              <Pressable onPress={onOpenInventory} style={styles.navItem}>
                <FontAwesomeIcon
                  color={colors.textMuted}
                  icon={faBoxesStacked}
                  size={16}
                />
                <Text style={styles.navItemText}>Inventario</Text>
              </Pressable>
              <Pressable
                onPress={() => navigateTo(statisticsOffset.current)}
                style={styles.navItem}
              >
                <FontAwesomeIcon
                  color={colors.textMuted}
                  icon={faChartColumn}
                  size={16}
                />
                <Text style={styles.navItemText}>Estadísticas</Text>
              </Pressable>
              <Pressable onPress={exportCsv} style={styles.navItem}>
                <FontAwesomeIcon
                  color={colors.textMuted}
                  icon={faFileExport}
                  size={16}
                />
                <Text style={styles.navItemText}>Exportar CSV</Text>
              </Pressable>
              <View style={styles.drawerSectionDivider} />
              <Pressable
                onPress={() => {
                  closeMenu();
                  onOpenSettings();
                }}
                style={styles.navItem}
              >
                <FontAwesomeIcon
                  color={colors.textMuted}
                  icon={faSliders}
                  size={16}
                />
                <Text style={styles.navItemText}>Configuración</Text>
              </Pressable>
            </View>
            <View style={styles.drawerFooter}>
              <Pressable onPress={onLogout} style={styles.drawerLogoutButton}>
                <FontAwesomeIcon
                  color={colors.danger}
                  icon={faRightFromBracket}
                  size={16}
                />
                <Text style={styles.drawerLogoutText}>Salir</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Cerrar menú"
            onPress={closeMenu}
            style={styles.drawerBackdrop}
          />
        </View>
      </Modal>
      <ClientFormModal
        onCancel={() => setCreateClientVisible(false)}
        onCreated={handleClientCreated}
        tags={tags}
        token={session.token}
        visible={createClientVisible}
      />
      <AppointmentFormModal
        clients={clients}
        onCancel={() => setCreateAppointmentVisible(false)}
        onCreated={handleAppointmentCreated}
        token={session.token}
        visible={createAppointmentVisible}
      />
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onDeleted={handleAppointmentDeleted}
        token={session.token}
      />
    </View>
  );
}
