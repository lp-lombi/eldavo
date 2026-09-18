import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { faPen, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { createTag, deleteTag, Tag, updateTag } from '../src/api';
import { colors, styles } from '../src/theme';

type TagManagerProps = { tags: Tag[]; token: string; visible: boolean; onCancel: () => void; onChanged: (tags: Tag[]) => void };

export function TagManager({ tags, token, visible, onCancel, onChanged }: TagManagerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8ee6b1');
  const [editingId, setEditingId] = useState<number | null>(null);
  const save = async () => {
    if (!name.trim()) return;
    const tag = editingId ? await updateTag(token, editingId, name, color) : await createTag(token, name, color);
    onChanged(editingId ? tags.map((item) => item.id === tag.id ? tag : item) : [...tags, tag]);
    setName(''); setColor('#8ee6b1'); setEditingId(null);
  };
  const remove = async (tag: Tag) => { await deleteTag(token, tag.id); onChanged(tags.filter((item) => item.id !== tag.id)); };
  return <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}><View style={styles.tagManagerOverlay}><View style={styles.tagManagerDialog}>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Etiquetas</Text><Pressable onPress={onCancel} style={styles.iconButton}><FontAwesomeIcon color={colors.textMuted} icon={faXmark} size={20} /></Pressable></View>
    <View style={styles.tagManagerForm}><TextInput onChangeText={setName} placeholder="Nombre de etiqueta" placeholderTextColor={colors.textMuted} style={[styles.input, styles.tagManagerInput]} value={name} /><TextInput autoCapitalize="none" onChangeText={setColor} placeholder="#8ee6b1" placeholderTextColor={colors.textMuted} style={[styles.input, styles.tagManagerColorInput]} value={color} /><Pressable accessibilityLabel={editingId ? 'Guardar etiqueta' : 'Agregar etiqueta'} onPress={save} style={styles.addButton}><FontAwesomeIcon color={styles.addButtonText.color} icon={editingId ? faPen : faPlus} size={16} /></Pressable></View>
    {tags.map((tag) => <View key={tag.id} style={styles.tagManagerRow}><View style={styles.tagManagerName}><View style={[styles.tagColorSwatch, { backgroundColor: tag.color }]} /><Text style={styles.detailValue}>{tag.name}</Text></View><View style={styles.tagManagerActions}><Pressable onPress={() => { setEditingId(tag.id); setName(tag.name); setColor(tag.color); }} style={styles.iconButton}><FontAwesomeIcon color={colors.accent} icon={faPen} size={15} /></Pressable><Pressable onPress={() => remove(tag)} style={styles.iconButton}><FontAwesomeIcon color={colors.danger} icon={faTrash} size={15} /></Pressable></View></View>)}
  </View></View></Modal>;
}