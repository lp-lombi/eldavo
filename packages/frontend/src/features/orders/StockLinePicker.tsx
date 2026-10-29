import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { getStock, StockItem } from '../../services';
import { colors, styles } from '../../shared';

type StockLinePickerProps = {
  value: { stockItemId: number; quantity: number }[];
  token: string;
  onChange: (value: { stockItemId: number; quantity: number }[]) => void;
};

export function StockLinePicker({ value, token, onChange }: StockLinePickerProps) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    getStock(token)
      .then(setItems)
      .catch(() => setItems([]));
  }, [token]);

  const addItem = () => {
    if (selectedId === null) return;
    const parsedQuantity = Number(quantity) || 1;
    const exists = value.some((entry) => entry.stockItemId === selectedId);
    const nextValue = exists
      ? value.map((entry) => (entry.stockItemId === selectedId ? { ...entry, quantity: parsedQuantity } : entry))
      : [...value, { stockItemId: selectedId, quantity: parsedQuantity }];
    onChange(nextValue);
  };

  return (
    <View style={styles.section}>
      {items.length ? (
        <>
          <Text style={styles.label}>Artículo</Text>
          {items.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => setSelectedId(item.id)}
              style={[styles.tagFilterButton, { backgroundColor: selectedId === item.id ? colors.accent : colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.tagFilterButtonText, selectedId === item.id && { color: colors.background }]}>{item.name}</Text>
            </Pressable>
          ))}
          <TextInput
            keyboardType="number-pad"
            onChangeText={setQuantity}
            placeholder="Cantidad"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={quantity}
          />
          <Pressable onPress={addItem} style={styles.button}>
            <Text style={styles.buttonText}>Agregar</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.empty}>No hay productos cargados.</Text>
      )}
    </View>
  );
}
