import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { faListCheck, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, Order } from '../src/api';
import { styles } from '../src/theme';

type StatisticsProps = { clients: Client[]; onOpenClients: () => void; onOpenOrders: () => void; onSelectClient: (client: Client) => void; orders: Order[] };

function daysSince(date: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
}

function weekStart(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

function weekKey(date: Date): string {
  const start = weekStart(date);
  return `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function Statistics({ clients, onOpenClients, onOpenOrders, onSelectClient, orders }: StatisticsProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
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
    return { amount: orders.filter((order) => monthKey(new Date(order.createdAt)) === key).reduce((total, order) => total + order.value, 0), label: monthLabel(date) };
  });
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const date = weekStart(new Date());
    date.setDate(date.getDate() - (5 - index) * 7);
    const key = weekKey(date);
    return { amount: orders.filter((order) => weekKey(new Date(order.createdAt)) === key).reduce((total, order) => total + order.value, 0), label: weekLabel(date) };
  });
  const periods = period === 'month' ? months : weeks;
  const maximumAmount = Math.max(1, ...periods.map((entry) => entry.amount));
  const formatAmount = (amount: number) => `$${amount.toLocaleString('es-AR')}`;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Estadísticas</Text>
      </View>
      <View style={styles.statisticsSummary}>
        <Pressable accessibilityRole="button" onPress={onOpenClients} style={({ pressed }) => [styles.statisticsMetric, pressed && styles.buttonPressed]}>
          <FontAwesomeIcon color={styles.statisticsMetricIcon.color} icon={faUsers} size={20} />
          <Text style={styles.statisticsMetricValue}>{clients.length}</Text>
          <Text style={styles.statisticsMetricLabel}>Clientes</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenOrders} style={({ pressed }) => [styles.statisticsMetric, pressed && styles.buttonPressed]}>
          <FontAwesomeIcon color={styles.statisticsMetricIcon.color} icon={faListCheck} size={20} />
          <Text style={styles.statisticsMetricValue}>{orders.length}</Text>
          <Text style={styles.statisticsMetricLabel}>Pedidos</Text>
        </Pressable>
      </View>
      <View style={styles.statisticsBlock}>
        <View style={styles.statisticsPeriodHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Ingresos por {period === 'month' ? 'mes' : 'semana'}</Text>
          <View style={styles.statisticsPeriodToggle}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: period === 'week' }} onPress={() => setPeriod('week')} style={[styles.statisticsPeriodButton, period === 'week' && styles.statisticsPeriodButtonActive]}>
              <Text style={[styles.statisticsPeriodButtonText, period === 'week' && styles.statisticsPeriodButtonTextActive]}>Semana</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: period === 'month' }} onPress={() => setPeriod('month')} style={[styles.statisticsPeriodButton, period === 'month' && styles.statisticsPeriodButtonActive]}>
              <Text style={[styles.statisticsPeriodButtonText, period === 'month' && styles.statisticsPeriodButtonTextActive]}>Mes</Text>
            </Pressable>
          </View>
        </View>
        {periods.map((entry) => (
          <View key={entry.label} style={styles.statisticsChartRow}>
            <Text numberOfLines={1} style={styles.statisticsChartLabel}>{entry.label}</Text>
            <View style={styles.statisticsBarTrack}>
              <View style={[styles.statisticsBar, { width: `${(entry.amount / maximumAmount) * 100}%` }]} />
              <Text numberOfLines={1} style={styles.statisticsChartValue}>{formatAmount(entry.amount)}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.statisticsCaption}>Los ingresos usan el importe y la fecha de creación de cada pedido.</Text>
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
    </View>
  );
}