import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts, palette, useTheme } from '../theme/tokens';
import type { ChargeStatus } from '../lib/types';

// Color de texto que hereda cada tarjeta, para que el contenido se lea en cualquier tono.
const TextToneContext = createContext<string | null>(null);

// Texto por defecto: toma el color de la tarjeta donde está, o el del tema si no hay tarjeta.
export function Txt({ style, ...props }: TextProps) {
  const t = useTheme();
  const tone = useContext(TextToneContext);
  return <Text {...props} style={[{ color: tone ?? t.fg, fontFamily: fonts.body }, style]} />;
}

export function Screen({
  eyebrow,
  title,
  children,
  scroll = true,
  headerRight,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  scroll?: boolean;
  headerRight?: ReactNode;
}) {
  const t = useTheme();
  const header = (
    <View style={styles.headerRow}>
      <View style={[styles.header, { flex: 1, minWidth: 0 }]}>
        {eyebrow ? <Txt style={[styles.eyebrow, { color: t.muted }]}>{eyebrow}</Txt> : null}
        <Txt style={styles.title}>{title}</Txt>
      </View>
      {headerRight}
    </View>
  );
  return (
    <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top']}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1 }]}>
            {header}
            {children}
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

export function Card({ children, tone = 'surface' }: { children: ReactNode; tone?: 'surface' | 'dark' | 'coral' | 'mint' }) {
  const t = useTheme();
  const colors = {
    surface: { bg: t.surface, fg: t.fg, border: t.line },
    dark: { bg: t.inverse, fg: t.inverseFg, border: 'transparent' },
    coral: { bg: palette.coral, fg: palette.ink, border: 'transparent' },
    mint: { bg: palette.mint, fg: palette.ink, border: 'transparent' },
  }[tone];
  return (
    <TextToneContext.Provider value={colors.fg}>
      <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>{children}</View>
    </TextToneContext.Provider>
  );
}

export function Pill({ status }: { status: ChargeStatus }) {
  const map = {
    overdue: { label: 'Vencido', bg: palette.coral },
    pending: { label: 'Pendiente', bg: palette.yellow },
    paid: { label: 'Cobrado', bg: palette.mint },
  }[status];
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Text style={styles.pillText}>{map.label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const t = useTheme();
  const isPrimary = variant === 'primary';
  const fg = isPrimary ? t.inverseFg : t.fg;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? t.inverse : 'transparent',
          borderColor: isPrimary ? 'transparent' : t.line,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[styles.input, { backgroundColor: t.surface, borderColor: t.line, color: t.fg }, props.style]}
    />
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

// Pista debajo de un campo: gris por defecto, coral si es un problema, y verde cuando está bien.
export function Hint({ message, tone = 'muted' }: { message?: string | null; tone?: 'muted' | 'error' | 'ok' }) {
  const t = useTheme();
  if (!message) return null;
  const color = { muted: t.muted, error: palette.coral, ok: '#0E6B52' }[tone];
  return <Text style={[styles.hint, { color }]}>{message}</Text>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  const t = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: t.surface, borderColor: t.line }]}>
      <View style={styles.emptyShape} />
      <Txt style={styles.emptyTitle}>{title}</Txt>
      <Txt style={[styles.emptyBody, { color: t.muted }]}>{body}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingTop: 8 },
  header: { gap: 2 },
  eyebrow: { fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: fonts.bodyMedium },
  title: { fontSize: 36, lineHeight: 40, letterSpacing: -1, fontFamily: fonts.display },
  card: { borderRadius: 28, borderWidth: 1, padding: 20, gap: 6, overflow: 'hidden' },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  pillText: { fontSize: 12, fontFamily: fonts.bodyBold, color: palette.ink },
  button: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: { fontSize: 15, fontFamily: fonts.bodyBold },
  input: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: fonts.body },
  error: { color: palette.coral, fontSize: 14 },
  hint: { fontSize: 13, marginTop: -4, marginLeft: 4 },
  empty: { borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  emptyShape: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderBottomRightRadius: 56,
    backgroundColor: palette.lavender,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontFamily: fonts.bodyBold, textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', fontFamily: fonts.body },
});
