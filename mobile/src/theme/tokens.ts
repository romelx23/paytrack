import { useColorScheme } from 'react-native';

// Paleta de la referencia: fondo casi negro, verde menta como acento y colores de apoyo
// vivos para tarjetas. Se usa el mismo tema en modo claro y oscuro para mantener la identidad.
export const palette = {
  ink: '#0B0C10',
  mint: '#7CF59B',
  blue: '#3D5AFE',
  coral: '#FF6B6B',
  lime: '#D4FF5B',
  lavender: '#A78BFA',
  yellow: '#FFD60A',
  white: '#FFFFFF',
};

export const theme = {
  bg: palette.ink,
  surface: '#16171E',
  fg: palette.white,
  muted: '#8B8FA3',
  line: '#262835',
  softMint: '#1B3A26',
  softCoral: '#4A2224',
  softYellow: '#4A3D0C',
  inverse: palette.mint,
  inverseFg: palette.ink,
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

// Se mantiene el hook para no tocar las pantallas, pero ya no cambia según el sistema.
export function useTheme() {
  useColorScheme();
  return theme;
}
