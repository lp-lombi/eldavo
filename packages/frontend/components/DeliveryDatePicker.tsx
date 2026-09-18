import { Platform, TextInput, View } from 'react-native';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { colors, styles } from '../src/theme';

type DeliveryDatePickerProps = { value: string; onChange: (value: string) => void };

export function DeliveryDatePicker({ value, onChange }: DeliveryDatePickerProps) {
  if (Platform.OS === 'web') {
    return <View style={styles.datePickerWebWrapper}>
      <input aria-label="Seleccionar fecha de entrega" onChange={(event) => onChange(event.currentTarget.value)} style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, boxSizing: 'border-box', color: colors.text, fontSize: 16, height: 51, padding: 15, width: '100%' }} type="date" value={value} />
    </View>;
  }

  return <View style={styles.datePickerButton}>
    <TextInput accessibilityLabel="Seleccionar fecha de entrega" keyboardType="numbers-and-punctuation" onChangeText={onChange} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={styles.datePickerNativeInput} value={value} />
    <FontAwesomeIcon color={colors.accent} icon={faCalendarDays} size={18} />
  </View>;
}