import { useColorScheme } from 'react-native';

// Paleta: fondo claro con degradado verde-azul, tarjetas de colores vivos y texto oscuro.
// Inspirada en las referencias de fintech con color. Se usa el mismo tema en modo claro y oscuro.
export const palette = {
  ink: '#10231C',
  white: '#FFFFFF',
  mint: '#6EE7B7',
  lime: '#D9FF6B',
  blue: '#4F6BFF',
  coral: '#FF7A6B',
  yellow: '#FFD166',
  lavender: '#B9A7FF',
  mintSoft: '#E4FBF1',
  blueSoft: '#E6EDFF',
  line: '#D7E3DE',
};

export const theme = {
  gradient: [palette.mintSoft, palette.blueSoft] as const,
  bg: palette.mintSoft,
  surface: palette.white,
  fg: palette.ink,
  muted: '#5C6B66',
  line: '#D7E3DE',
  inverse: palette.ink,
  inverseFg: palette.white,
  accent: palette.blue,
};

// Tipografía de marca: Sora para títulos, DM Sans para texto y Space Grotesk para importes.
// Los nombres coinciden con los exports de @expo-google-fonts y se cargan en la raíz (_layout.tsx).
export const fonts = {
  display: 'Sora_800ExtraBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  num: 'SpaceGrotesk_700Bold',
} as const;

// Se mantiene el hook para no tocar las pantallas; el tema es el mismo en claro y oscuro.
export function useTheme() {
  useColorScheme();
  return theme;
}
