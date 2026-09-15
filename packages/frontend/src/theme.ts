import { StyleSheet } from 'react-native';

export const colors = {
  background: '#101214',
  surface: '#181b1f',
  surfaceRaised: '#20252a',
  border: '#2d3339',
  text: '#f4f6f8',
  textMuted: '#9da5ad',
  accent: '#8ee6b1',
  accentPressed: '#6dcc93',
  danger: '#ff8d8d',
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 26,
  xl: 38,
};

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg },
  loginContent: { flexGrow: 1, justifyContent: 'center' },
  eyebrow: { color: colors.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: spacing.sm },
  form: { marginTop: spacing.xl },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginBottom: spacing.xs, textTransform: 'uppercase' },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, color: colors.text, fontSize: 16, marginBottom: spacing.md, padding: 15 },
  button: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 8, padding: 16 },
  buttonPressed: { backgroundColor: colors.accentPressed },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 14, marginBottom: spacing.md },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  headerCopy: { flex: 1, paddingRight: spacing.md },
  logoutButton: { borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 10 },
  logoutText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, marginBottom: spacing.sm, padding: spacing.md },
  cardRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '700' },
  cardMeta: { color: colors.textMuted, fontSize: 14, marginTop: 5 },
  cardValue: { color: colors.accent, fontSize: 16, fontWeight: '800', marginLeft: spacing.sm },
  empty: { color: colors.textMuted, fontSize: 14, paddingVertical: spacing.sm },
  loading: { marginTop: spacing.xl },
});
