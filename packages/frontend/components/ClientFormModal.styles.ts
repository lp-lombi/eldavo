import { StyleSheet } from 'react-native';
import { colors, spacing } from '../src/theme';

export const clientFormModalStyles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.65)', flex: 1, justifyContent: 'center', padding: spacing.lg },
  dialog: { alignSelf: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 8, borderWidth: 1, maxWidth: 520, padding: spacing.lg, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  closeButton: { padding: spacing.xs },
  closeText: { color: colors.textMuted, fontSize: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm },
  actionButton: { flex: 1, marginTop: 0 },
  pickerContainer: { position: 'relative', zIndex: 10 },
  pickerContainerOpen: { height: 238, marginBottom: -180 },
  picker: { borderColor: colors.border, borderRadius: 8, borderWidth: 1, marginBottom: spacing.md, padding: 15 },
  pickerText: { color: colors.text, fontSize: 16 },
  pickerPlaceholder: { color: colors.textMuted, fontSize: 16 },
  pickerOptions: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, elevation: 8, height: 180, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 58, zIndex: 20 },
  pickerOption: { borderBottomColor: colors.border, borderBottomWidth: 1, padding: spacing.sm },
});