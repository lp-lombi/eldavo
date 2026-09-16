import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { faBars, faClipboardList, faFileExport, faGaugeHigh, faRightFromBracket, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, exportDatabase, getClients, getOrders, Order, Session } from '../src/api';
import { colors, styles } from '../src/theme';
import { ClientList } from './ClientList';
import { OrderList } from './OrderList';

type DashboardProps = { session: Session; onLogout: () => void; onSelectClient: (client: Client) => void; onSelectOrder: (order: Order) => void };

export function Dashboard({ session, onLogout, onSelectClient, onSelectOrder }: DashboardProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const clientsOffset = useRef(0);
  const ordersOffset = useRef(0);
  const drawerTranslateX = useRef(new Animated.Value(-290)).current;

  useEffect(() => {
    if (menuOpen) {
      drawerTranslateX.setValue(-290);
      Animated.timing(drawerTranslateX, { duration: 220, toValue: 0, useNativeDriver: true }).start();
    }
  }, [drawerTranslateX, menuOpen]);

  const navigateTo = (offset: number) => {
    setMenuOpen(false);
    requestAnimationFrame(() => scrollViewRef.current?.scrollTo({ animated: true, y: offset }));
  };

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

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
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? <>
          <View onLayout={({ nativeEvent }) => { clientsOffset.current = nativeEvent.layout.y; }}>
            <ClientList clients={clients} onSelect={onSelectClient} />
          </View>
          <View onLayout={({ nativeEvent }) => { ordersOffset.current = nativeEvent.layout.y; }}>
            <OrderList onSelectOrder={onSelectOrder} orders={orders} />
          </View>
        </> : null}
      </ScrollView>
      <Modal animationType="none" onRequestClose={closeMenu} transparent visible={menuOpen}>
        <View style={styles.drawerOverlay}>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}>
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
              <Pressable onPress={() => navigateTo(clientsOffset.current)} style={styles.navItem}>
                <FontAwesomeIcon color={colors.textMuted} icon={faUsers} size={16} />
                <Text style={styles.navItemText}>Clientes</Text>
              </Pressable>
              <Pressable onPress={() => navigateTo(ordersOffset.current)} style={styles.navItem}>
                <FontAwesomeIcon color={colors.textMuted} icon={faClipboardList} size={16} />
                <Text style={styles.navItemText}>Pedidos</Text>
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
          </Animated.View>
          <Pressable accessibilityLabel="Cerrar menú" onPress={closeMenu} style={styles.drawerBackdrop} />
        </View>
      </Modal>
    </View>
  );
}
