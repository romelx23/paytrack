import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { markOnboardingSeen } from '../lib/onboarding';
import { fonts, palette } from '../theme/tokens';

const { width } = Dimensions.get('window');

// Tres pantallas que explican la app antes del inicio de sesión. Cada una tiene su propio color.
const slides = [
  {
    key: 'cobra',
    title: 'Cobra sin perseguir a nadie',
    body: 'Registra lo que te deben, con monto, concepto y fecha de vencimiento.',
    color: palette.blue,
    accent: palette.yellow,
    shape: 'circle' as const,
  },
  {
    key: 'clientes',
    title: 'Todos tus clientes en un lugar',
    body: 'Guarda nombre, correo y teléfono. Ve de un vistazo quién está al día.',
    color: palette.coral,
    accent: palette.lime,
    shape: 'arch' as const,
  },
  {
    key: 'control',
    title: 'Sabes cuánto recaudas',
    body: 'Totales por cobrar, vencidos y cobrados este mes, siempre al día.',
    color: palette.lavender,
    accent: palette.mint,
    shape: 'blob' as const,
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const last = index === slides.length - 1;

  const onViewable = useCallback(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }, []);

  async function finish() {
    await markOnboardingSeen();
    router.replace('/');
  }

  function next() {
    if (last) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <LinearGradient colors={[item.color, palette.blueSoft]} style={[styles.slide, { width }]}>
            <View style={[styles.shape, item.shape === 'circle' && styles.circle, item.shape === 'arch' && styles.arch, item.shape === 'blob' && styles.blob, { backgroundColor: item.accent }]} />
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </LinearGradient>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable onPress={next} accessibilityRole="button" style={styles.cta}>
          <Text style={styles.ctaText}>{last ? 'Empezar' : 'Siguiente'}</Text>
        </Pressable>
        {!last ? (
          <Pressable onPress={finish} accessibilityRole="button">
            <Text style={styles.skip}>Omitir</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.blue },
  slide: { flex: 1, paddingTop: 120, paddingHorizontal: 28, justifyContent: 'space-between', paddingBottom: 220 },
  shape: { position: 'absolute' },
  circle: { width: 280, height: 280, borderRadius: 140, top: 40, right: -60 },
  arch: { width: 260, height: 260, borderTopLeftRadius: 130, borderTopRightRadius: 130, top: 60, left: -40 },
  blob: { width: 240, height: 240, borderRadius: 120, borderTopLeftRadius: 40, top: 70, right: 10, opacity: 0.95 },
  copy: { gap: 14, marginTop: 260 },
  title: { fontSize: 38, lineHeight: 42, fontFamily: fonts.display, color: palette.white, letterSpacing: -1 },
  body: { fontSize: 17, lineHeight: 24, fontFamily: fonts.body, color: palette.white, opacity: 0.92 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 28, paddingBottom: 48, gap: 14, backgroundColor: palette.white, borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.line },
  dotActive: { width: 26, backgroundColor: palette.blue },
  cta: { backgroundColor: palette.ink, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: fonts.bodyBold, color: palette.white },
  skip: { textAlign: 'center', fontSize: 14, fontFamily: fonts.bodyMedium, color: palette.ink, opacity: 0.6 },
});
