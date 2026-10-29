import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { faArrowLeft, faBoxesStacked, faFloppyDisk, faPen, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { StockItem } from '../../../services';
import { colors, styles } from '../../../shared';
import { useInventory } from '../hooks/useInventory';
import { removeStockItem, saveStockItem } from '../services/inventoryService';

type InventoryScreenProps = { onBack: () => void; token: string };

export function InventoryScreen({ onBack, token }: InventoryScreenProps) {
  const { items, setItems, loading, error, setError } = useInventory(token);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  const saveItem = async (item: Omit<StockItem, 'id'>) => {
    try {
      const saved = await saveStockItem(token, editing, item);
      setItems((current) => editing ? current.map((currentItem) => currentItem.id === saved.id ? saved : currentItem) : [...current, saved]);
      setFormVisible(false);
      setEditing(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el producto');
    }
  };

  const removeItem = (item: StockItem) => Alert.alert('Eliminar producto', `¿Querés eliminar ${item.name}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => { await removeStockItem(token, item.id); setItems((current) => current.filter((currentItem) => currentItem.id !== item.id)); } },
  ]);

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton}><View style={styles.buttonContent}><FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} /><Text style={styles.backText}>Volver</Text></View></Pressable>
      <View style={styles.detailHeader}><Text style={styles.eyebrow}>Inventario</Text></View>
      <View style={styles.dashboardActionsSection}><View style={styles.dashboardActions}><Pressable accessibilityLabel="Agregar producto" onPress={() => { setEditing(null); setFormVisible(true); }} style={({ pressed }) => [styles.dashboardAction, pressed && styles.buttonPressed]}><FontAwesomeIcon color={styles.dashboardActionIcon.color} icon={faBoxesStacked} size={22} /><Text style={styles.dashboardActionText}>Agregar producto</Text></Pressable></View></View>
      {loading ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !items.length ? <Text style={styles.empty}>Todavía no hay productos en stock.</Text> : null}
      {items.map((item) => { const low = item.minimumQuantity !== null && item.minimumQuantity !== undefined && item.quantity <= item.minimumQuantity; return <View key={item.id} style={[styles.stockItem, low && styles.stockItemLow]}><View style={styles.stockItemCopy}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardMeta}>{item.quantity} {item.unit}{item.minimumQuantity !== null && item.minimumQuantity !== undefined ? ` · Mínimo ${item.minimumQuantity}` : ''}</Text>{low ? <Text style={styles.stockLowText}>Stock bajo</Text> : null}</View><View style={styles.stockItemActions}><Pressable accessibilityLabel={`Editar ${item.name}`} onPress={() => { setEditing(item); setFormVisible(true); }} style={styles.iconButton}><FontAwesomeIcon color={colors.accent} icon={faPen} size={15} /></Pressable><Pressable accessibilityLabel={`Eliminar ${item.name}`} onPress={() => removeItem(item)} style={styles.iconButton}><FontAwesomeIcon color={colors.danger} icon={faTrash} size={15} /></Pressable></View></View>; })}
    </ScrollView>
    <StockFormModal editing={editing} onCancel={() => { setFormVisible(false); setEditing(null); }} onSave={saveItem} visible={formVisible} />
  </View>;
}

function StockFormModal({ editing, onCancel, onSave, visible }: { editing: StockItem | null; onCancel: () => void; onSave: (item: Omit<StockItem, 'id'>) => void; visible: boolean }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('unidades');
  const [minimumQuantity, setMinimumQuantity] = useState('');

  useEffect(() => { if (visible) { setName(editing?.name || ''); setQuantity(editing ? String(editing.quantity) : ''); setUnit(editing?.unit || 'unidades'); setMinimumQuantity(editing?.minimumQuantity === null || editing?.minimumQuantity === undefined ? '' : String(editing.minimumQuantity)); } }, [editing, visible]);
  const submit = () => { const parsedQuantity = Number(quantity.replace(',', '.')); const parsedMinimum = minimumQuantity.trim() ? Number(minimumQuantity.replace(',', '.')) : null; if (name.trim() && unit.trim() && Number.isFinite(parsedQuantity) && parsedQuantity >= 0 && (parsedMinimum === null || (Number.isFinite(parsedMinimum) && parsedMinimum >= 0))) onSave({ name: name.trim(), quantity: parsedQuantity, unit: unit.trim(), minimumQuantity: parsedMinimum }); };
  return <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}><View style={styles.drawerOverlay}><View style={styles.stockDialog}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{editing ? 'Editar producto' : 'Nuevo producto'}</Text><Pressable onPress={onCancel} style={styles.iconButton}><FontAwesomeIcon color={colors.textMuted} icon={faXmark} size={20} /></Pressable></View><Text style={styles.label}>Nombre</Text><TextInput autoFocus onChangeText={setName} placeholder="Producto" placeholderTextColor={colors.textMuted} style={styles.input} value={name} /><Text style={styles.label}>Cantidad actual</Text><TextInput keyboardType="decimal-pad" onChangeText={setQuantity} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.input} value={quantity} /><Text style={styles.label}>Unidad</Text><TextInput onChangeText={setUnit} placeholder="unidades" placeholderTextColor={colors.textMuted} style={styles.input} value={unit} /><Text style={styles.label}>Stock mínimo (opcional)</Text><TextInput keyboardType="decimal-pad" onChangeText={setMinimumQuantity} placeholder="Sin mínimo" placeholderTextColor={colors.textMuted} style={styles.input} value={minimumQuantity} /><Pressable onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}><View style={styles.buttonContent}><FontAwesomeIcon color={styles.buttonText.color} icon={faFloppyDisk} size={16} /><Text style={styles.buttonText}>Guardar</Text></View></Pressable></View></View></Modal>;
}