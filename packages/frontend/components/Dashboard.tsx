import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { faBars, faChartColumn, faClipboardList, faFileExport, faGaugeHigh, faRightFromBracket, faUserPlus, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, exportDatabase, getClients, getOrders, Order, Session } from '../src/api';
import { colors, styles } from '../src/theme';
import { OrderList } from './OrderList';
import { ClientFormModal } from './ClientFormModal';
import { OrderFormModal } from './OrderFormModal';
import { Statistics } from './Statistics';

type DashboardProps = { session: Session; onLogout: () => void; onOpenClients: () => void; onOpenOrders: () => void; onSelectClient: (client: Client) => void; onSelectOrder: (order: Order) => void };

export function Dashboard({ session, onLogout, onOpenClients, onOpenOrders, onSelectClient, onSelectOrder }: DashboardProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOrderVisible, setCreateOrderVisible] = useState(false);
  const [createClientVisible, setCreateClientVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const ordersOffset = useRef(0);
  const statisticsOffset = useRef(0);

  const navigateTo = (offset: number) => {
    setMenuOpen(false);
    requestAnimationFrame(() => scrollViewRef.current?.scrollTo({ animated: true, y: offset }));
  };

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const handleOrderCreated = (order: Order) => {
    setOrders((currentOrders) => [...currentOrders, order]);
    setCreateOrderVisible(false);
  };

  const handleClientCreated = (client: Client) => {
    setClients((currentClients) => [...currentClients, client]);
    setCreateClientVisible(false);
  };

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

  useEffect(() => {
    Promise.all([getClients(session.token), getOrders(session.token)])
      .then(([loadedClients, loadedOrders]) => { setClients(loadedClients); setOrders(loadedOrders); })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los datos'))
      .finally(() => setLoading(false));
  }, [session.token]);

  return (
    <View style={styles.screen}>
      <View style={styles.dashboardTopBar}>
        <Pressable
          accessibilityLabel="Abrir navegación"
          onPress={openMenu}
          style={({ pressed }) => [styles.menuButton, pressed && styles.listItemPressed]}
        >
          <FontAwesomeIcon color={styles.menuIcon.color} icon={faBars} size={20} />
        </Pressable>
        <Text style={styles.appName}>Eldavo</Text>
      </View>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Panel principal</Text>
            <Text style={styles.title}>Hola, {session.user.username}.</Text>
            <Text style={styles.subtitle}>Resumen de tu actividad reciente.</Text>
          </View>
        </View>
        <View style={styles.dashboardActions}>
          <Pressable accessibilityLabel="Nuevo pedido" onPress={() => setCreateOrderVisible(true)} style={({ pressed }) => [styles.dashboardAction, pressed && styles.buttonPressed]}>
            <FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faClipboardList} size={22} />
            <Text style={styles.dashboardActionText}>Nuevo pedido</Text>
          </Pressable>
          <Pressable accessibilityLabel="Nuevo cliente" onPress={() => setCreateClientVisible(true)} style={({ pressed }) => [styles.dashboardAction, pressed && styles.buttonPressed]}>
            <FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faUserPlus} size={22} />
            <Text style={styles.dashboardActionText}>Nuevo cliente</Text>
          </Pressable>
        </View>
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? <>
          <View onLayout={({ nativeEvent }) => { ordersOffset.current = nativeEvent.layout.y; }}>
            <OrderList onSelectOrder={onSelectOrder} orders={nearestOrders} pendingOnly totalCount={pendingOrders.length} />
            {pendingOrders.length > nearestOrders.length ? <Pressable onPress={onOpenOrders} style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>Ver todos los pedidos</Text>
            </Pressable> : null}
          </View>
          <View onLayout={({ nativeEvent }) => { statisticsOffset.current = nativeEvent.layout.y; }}>
            <Statistics clients={clients} onSelectClient={onSelectClient} orders={orders} />
          </View>
        </> : null}
      </ScrollView>
      <Modal animationType="none" onRequestClose={closeMenu} transparent visible={menuOpen}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.eyebrow}>Navegación</Text>
                <Text style={styles.drawerTitle}>Eldavo</Text>
              </View>
              <Pressable accessibilityLabel="Cerrar navegación" onPress={closeMenu} style={styles.iconButton}>
                <FontAwesomeIcon color={styles.menuIcon.color} icon={faXmark} size={20} />
              </Pressable>
            </View>
            <View style={styles.drawerMenu}>
              <Pressable onPress={() => navigateTo(0)} style={styles.navItem}>
                <FontAwesomeIcon color={colors.accent} icon={faGaugeHigh} size={16} />
                <Text style={styles.navItemText}>Panel principal</Text>
              </Pressable>
              <Pressable onPress={onOpenClients} style={styles.navItem}>
                <FontAwesomeIcon color={colors.textMuted} icon={faUsers} size={16} />
                <Text style={styles.navItemText}>Clientes</Text>
              </Pressable>
              <Pressable onPress={onOpenOrders} style={styles.navItem}>
                <FontAwesomeIcon color={colors.textMuted} icon={faClipboardList} size={16} />
                <Text style={styles.navItemText}>Pedidos</Text>
              </Pressable>
              <Pressable onPress={() => navigateTo(statisticsOffset.current)} style={styles.navItem}>
                <FontAwesomeIcon color={colors.textMuted} icon={faChartColumn} size={16} />
                <Text style={styles.navItemText}>Estadísticas</Text>
              </Pressable>
              <Pressable onPress={exportCsv} style={styles.navItem}>
                <FontAwesomeIcon color={colors.textMuted} icon={faFileExport} size={16} />
                <Text style={styles.navItemText}>Exportar CSV</Text>
              </Pressable>
            </View>
            <View style={styles.drawerFooter}>
              <Pressable onPress={onLogout} style={styles.drawerLogoutButton}>
                <FontAwesomeIcon color={colors.danger} icon={faRightFromBracket} size={16} />
                <Text style={styles.drawerLogoutText}>Salir</Text>
              </Pressable>
            </View>
          </View>
          <Pressable accessibilityLabel="Cerrar menú" onPress={closeMenu} style={styles.drawerBackdrop} />
        </View>
      </Modal>
      <ClientFormModal onCancel={() => setCreateClientVisible(false)} onCreated={handleClientCreated} token={session.token} visible={createClientVisible} />
      <OrderFormModal clients={clients} onCancel={() => setCreateOrderVisible(false)} onCreated={handleOrderCreated} token={session.token} visible={createOrderVisible} />
    </View>
  );
}
