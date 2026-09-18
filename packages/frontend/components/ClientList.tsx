import { Pressable, Text, View } from 'react-native';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Client } from '../src/api';
import { colors, styles } from '../src/theme';
import { getTagTextColor } from '../src/tagColors';

type ClientListProps = { clients: Client[]; onSelect: (client: Client) => void };

export function ClientList({ clients, onSelect }: ClientListProps) {
  return (
    <View style={styles.section}>
      {clients.length ? clients.map((client) => (
        <Pressable key={client.id} onPress={() => onSelect(client)} style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}>
          <View style={styles.cardRow}>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardTitle}>{client.name}</Text>
              <Text style={styles.cardMeta}>{ client.phone || client.facebookUrl || 'Sin datos de contacto'}</Text>
              {client.tags?.length ? <View style={styles.clientTagRow}>{client.tags.map((tag) => <Text key={tag.id} style={[styles.clientTagText, { backgroundColor: tag.color, borderColor: tag.color, color: getTagTextColor(tag.color) }]}>{tag.name}</Text>)}</View> : null}
            </View>
            <FontAwesomeIcon color={styles.cardMeta.color} icon={faChevronRight} size={14} />
          </View>
        </Pressable>
      )) : <Text style={styles.empty}>Todavía no hay clientes.</Text>}
    </View>
  );
}
