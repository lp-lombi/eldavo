import { Text, TextInput, View } from 'react-native';
import { colors, styles } from '../../../shared';

type AppointmentDateTimePickerProps = { label: string; value: string; onChange: (value: string) => void };

export function AppointmentDateTimePicker({ label, value, onChange }: AppointmentDateTimePickerProps) {
  return (
    <View style={styles.appointmentDateTimeField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        onChangeText={onChange}
        placeholder="YYYY-MM-DDTHH:mm"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}
