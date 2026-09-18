import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { faArrowLeft, faTag, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client, getClients, getOrders, getTags, Order, Tag } from '../src/api';
import { colors, styles } from '../src/theme';
import { getTagTextColor } from '../src/tagColors';
import { ClientFormModal } from './ClientFormModal';
import { ClientList } from './ClientList';
import { TagManager } from './TagManager';

type ClientsScreenProps = { onBack: () => void; onSelectClient: (client: Client) => void; token: string };

export function ClientsScreen({ onBack, onSelectClient, token }: ClientsScreenProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [pendingFilter, setPendingFilter] = useState<'all' | 'pending' | 'without'>('all');
  const [tagFilters, setTagFilters] = useState<number[]>([]);
  const [tagsVisible, setTagsVisible] = useState(false);

  useEffect(() => {
    Promise.all([getClients(token), getOrders(token), getTags(token)])
      .then(([loadedClients, loadedOrders, loadedTags]) => { setClients(loadedClients); setOrders(loadedOrders); setTags(loadedTags); })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los clientes'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreated = (client: Client) => {
    setClients((currentClients) => [...currentClients, client]);
    setCreateVisible(false);
  };

  const handleTagsChanged = (updatedTags: Tag[]) => {
    setTags(updatedTags);
    setClients((currentClients) => currentClients.map((client) => ({
      ...client,
      tags: client.tags?.filter((tag) => updatedTags.some((updatedTag) => updatedTag.id === tag.id)).map((tag) => updatedTags.find((updatedTag) => updatedTag.id === tag.id) || tag),
    })));
  };

  const pendingClientIds = new Set(orders.filter((order) => order.status === 'pending').map((order) => order.clientId));
  const filteredClients = clients.filter((client) => {
    const matchesName = client.name.toLocaleLowerCase().includes(nameFilter.trim().toLocaleLowerCase());
    const hasPendingOrders = pendingClientIds.has(client.id);
    const matchesPendingFilter = pendingFilter === 'all' || (pendingFilter === 'pending' ? hasPendingOrders : !hasPendingOrders);
    return matchesName && matchesPendingFilter && tagFilters.every((tagId) => client.tags?.some((tag) => tag.id === tagId));
  });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.buttonContent}>
            <FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} />
            <Text style={styles.backText}>Volver</Text>
          </View>
        </Pressable>
        <View style={styles.detailHeader}>
          <Text style={styles.eyebrow}>Clientes</Text>
        </View>
        <View style={styles.dashboardActionsSection}>
          <View style={styles.dashboardActions}>
            <Pressable accessibilityLabel="Nuevo cliente" onPress={() => setCreateVisible(true)} style={({ pressed }) => [styles.dashboardAction, pressed && styles.buttonPressed]}>
              <FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faUserPlus} size={22} />
              <Text style={styles.dashboardActionText}>Nuevo cliente</Text>
            </Pressable>
            <Pressable accessibilityLabel="Administrar etiquetas" onPress={() => setTagsVisible(true)} style={({ pressed }) => [styles.dashboardAction, pressed && styles.buttonPressed]}>
              <FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faTag} size={22} />
              <Text style={styles.dashboardActionText}>Administrar etiquetas</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.clientFilters}>
          <Text style={styles.label}>Filtrar</Text>
          <TextInput autoCapitalize="none" onChangeText={setNameFilter} placeholder="Por nombre" placeholderTextColor={colors.textMuted} style={styles.clientFilterInput} value={nameFilter} />
          <View style={styles.clientFilterToggle}>
            {([['all', 'Todos'], ['pending', 'Con pendientes'], ['without', 'Sin pendientes']] as const).map(([filter, label]) => (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: pendingFilter === filter }} key={filter} onPress={() => setPendingFilter(filter)} style={[styles.clientFilterButton, pendingFilter === filter && styles.clientFilterButtonActive]}>
                <Text style={[styles.clientFilterButtonText, pendingFilter === filter && styles.clientFilterButtonTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.tagFilterRow}>
            {tags.map((tag) => {
              const selected = tagFilters.includes(tag.id);
              return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={tag.id} onPress={() => setTagFilters(selected ? tagFilters.filter((id) => id !== tag.id) : [...tagFilters, tag.id])} style={[styles.tagFilterButton, { backgroundColor: selected ? tag.color : colors.surface, borderColor: tag.color }]}>
                <Text style={[styles.tagFilterButtonText, selected && { color: getTagTextColor(tag.color) }]}>{tag.name}</Text>
              </Pressable>;
            })}
          </View>
        </View>
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? <ClientList clients={filteredClients} onSelect={onSelectClient} /> : null}
      </ScrollView>
      <ClientFormModal onCancel={() => setCreateVisible(false)} onCreated={handleCreated} tags={tags} token={token} visible={createVisible} />
      <TagManager onCancel={() => setTagsVisible(false)} onChanged={handleTagsChanged} tags={tags} token={token} visible={tagsVisible} />
    </View>
  );
}