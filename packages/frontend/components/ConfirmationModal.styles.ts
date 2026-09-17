import { StyleSheet } from 'react-native';
import { colors, spacing } from '../src/theme';

export const confirmationModalStyles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', flex: 1, justifyContent: 'center', padding: spacing.lg },
  dialog: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 8, borderWidth: 1, maxWidth: 440, padding: spacing.lg, width: '100%' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  message: { color: colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: spacing.sm },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg },
  actionButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 54, justifyContent: 'center', minWidth: 120, paddingHorizontal: spacing.md },
  cancelButton: { borderColor: colors.border },
  cancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '800' },
  confirmButton: { borderColor: colors.danger },
  confirmText: { color: colors.danger, fontSize: 16, fontWeight: '800' },
});