import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, Order } from '../src/api';
import { colors, styles } from '../src/theme';

type StatisticsProps = { clients: Client[]; onSelectClient: (client: Client) => void; orders: Order[] };

function daysSince(date: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
}

export function Statistics({ clients, onSelectClient, orders }: StatisticsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const ordersByClient = clients.map((client) => ({
    client,
    count: orders.filter((order) => order.clientId === client.id).length,
  })).sort((first, second) => second.count - first.count).filter((entry) => entry.count > 0).slice(0, 5);

  const inactiveClients = clients.map((client) => {
    const clientOrders = orders.filter((order) => order.clientId === client.id);
    const lastOrder = clientOrders.reduce<string | null>((latest, order) => {
      if (!latest || new Date(order.createdAt).getTime() > new Date(latest).getTime()) return order.createdAt;
      return latest;
    }, null);
    return { client, days: lastOrder ? daysSince(lastOrder) : null, lastOrder };
  }).filter((entry) => entry.lastOrder !== null).sort((first, second) => (second.days ?? 0) - (first.days ?? 0)).slice(0, 5);

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = monthKey(date);
    return { count: orders.filter((order) => monthKey(new Date(order.createdAt)) === key).length, label: monthLabel(date) };
  });
  const maximumMonthCount = Math.max(1, ...months.map((month) => month.count));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Pressable accessibilityRole="button" onPress={() => setCollapsed((current) => !current)} style={styles.sectionToggle}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Estadísticas</Text>
          <FontAwesomeIcon color={colors.textMuted} icon={collapsed ? faChevronDown : faChevronUp} size={14} />
        </Pressable>
      </View>
      {!collapsed ? <>
      <View style={styles.statisticsSummary}>
        <View style={styles.statisticsMetric}>
          <Text style={styles.statisticsMetricValue}>{clients.length}</Text>
          <Text style={styles.statisticsMetricLabel}>Clientes</Text>
        </View>
        <View style={styles.statisticsMetric}>
          <Text style={styles.statisticsMetricValue}>{orders.length}</Text>
          <Text style={styles.statisticsMetricLabel}>Pedidos</Text>
        </View>
        <View style={styles.statisticsMetric}>
          <Text style={styles.statisticsMetricValue}>{orders.filter((order) => order.status === 'pending').length}</Text>
          <Text style={styles.statisticsMetricLabel}>Pendientes</Text>
        </View>
      </View>
      <View style={styles.statisticsBlock}>
        <Text style={styles.sectionTitle}>Clientes con más pedidos</Text>
        {ordersByClient.length ? ordersByClient.map(({ client, count }) => (
          <Pressable accessibilityRole="button" key={client.id} onPress={() => onSelectClient(client)} style={({ pressed }) => [styles.statisticsRow, pressed && styles.listItemPressed]}>
            <Text style={styles.statisticsRowLabel}>{client.name}</Text>
            <Text style={styles.statisticsRowValue}>{count} {count === 1 ? 'pedido' : 'pedidos'}</Text>
          </Pressable>
        )) : <Text style={styles.empty}>Todavía no hay pedidos.</Text>}
      </View>
      <View style={styles.statisticsBlock}>
        <Text style={styles.sectionTitle}>Más tiempo sin órdenes</Text>
        {inactiveClients.length ? inactiveClients.map(({ client, days, lastOrder }) => (
          <Pressable accessibilityRole="button" key={client.id} onPress={() => onSelectClient(client)} style={({ pressed }) => [styles.statisticsRow, pressed && styles.listItemPressed]}>
            <Text style={styles.statisticsRowLabel}>{client.name}</Text>
            <Text style={styles.statisticsRowValue}>{lastOrder ? `Hace ${days} ${days === 1 ? 'día' : 'días'}` : 'Nunca'}</Text>
          </Pressable>
        )) : <Text style={styles.empty}>Todavía no hay clientes.</Text>}
      </View>
      <View style={styles.statisticsBlock}>
        <Text style={styles.sectionTitle}>Pedidos en el tiempo</Text>
        {months.map((month) => (
          <View key={month.label} style={styles.statisticsChartRow}>
            <Text style={styles.statisticsChartLabel}>{month.label}</Text>
            <View style={styles.statisticsBarTrack}>
              <View style={[styles.statisticsBar, { width: `${(month.count / maximumMonthCount) * 100}%` }]} />
            </View>
            <Text style={styles.statisticsChartValue}>{month.count}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.statisticsCaption}>La evolución usa la fecha de creación de cada pedido.</Text>
      </> : null}
    </View>
  );
}