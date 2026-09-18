import { Pressable, Text, View } from 'react-native';
import { Tag } from '../src/api';
import { getTagTextColor } from '../src/tagColors';
import { colors, styles } from '../src/theme';

type TagPickerProps = { tags: Tag[]; selectedIds: number[]; onChange: (ids: number[]) => void };

export function TagPicker({ tags, selectedIds, onChange }: TagPickerProps) {
  return <View style={styles.tagPicker}>
    {tags.length ? tags.map((tag) => {
      const selected = selectedIds.includes(tag.id);
      return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={tag.id} onPress={() => onChange(selected ? selectedIds.filter((id) => id !== tag.id) : [...selectedIds, tag.id])} style={[styles.tagChip, { borderColor: tag.color }, selected && { backgroundColor: tag.color }]}>
        <Text style={[styles.tagChipText, selected && { color: getTagTextColor(tag.color) }]}>{tag.name}</Text>
      </Pressable>;
    }) : <Text style={{ color: colors.textMuted }}>No hay etiquetas creadas.</Text>}
  </View>;
}