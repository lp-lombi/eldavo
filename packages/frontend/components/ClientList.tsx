import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { faChevronDown, faChevronRight, faChevronUp, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client } from '../src/api';
import { colors, styles } from '../src/theme';

type ClientListProps = { clients: Client[]; onAdd: () => void; onSelect: (client: Client) => void };

export function ClientList({ clients, onAdd, onSelect }: ClientListProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Pressable accessibilityRole="button" onPress={() => setCollapsed((current) => !current)} style={styles.sectionToggle}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Clientes ({clients.length})</Text>
          <FontAwesomeIcon color={colors.textMuted} icon={collapsed ? faChevronDown : faChevronUp} size={14} />
        </Pressable>
        <Pressable accessibilityLabel="Agregar cliente" onPress={onAdd} style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}>
          <FontAwesomeIcon color={styles.addButtonText.color} icon={faPlus} size={16} />
        </Pressable>
      </View>
      {!collapsed && (clients.length ? clients.map((client) => (
        <Pressable key={client.id} onPress={() => onSelect(client)} style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}>
          <View style={styles.cardRow}>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardTitle}>{client.name}</Text>
              <Text style={styles.cardMeta}>{ client.phone || client.email || 'Sin datos de contacto'}</Text>
            </View>
            <FontAwesomeIcon color={styles.cardMeta.color} icon={faChevronRight} size={14} />
          </View>
        </Pressable>
      )) : <Text style={styles.empty}>Todavía no hay clientes.</Text>)}
    </View>
  );
}
