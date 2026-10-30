import { useColorScheme } from 'react-native';

// Paleta tomada del prototipo. Cualquier color de la app sale de aquí.
export const palette = {
  midnight: '#14122B',
  cream: '#F6F1E7',
  mint: '#7FE0C1',
  coral: '#FF6B5B',
  lavender: '#B9A6FF',
  yellow: '#FFD84D',
};

export const light = {
  bg: palette.cream,
  surface: '#FFFFFF',
  fg: palette.midnight,
  muted: '#6B6880',
  line: '#E4DDCF',
  softMint: '#CFF5E7',
  softCoral: '#FFD9D3',
  softYellow: '#FFF0B3',
  inverse: palette.midnight,
  inverseFg: palette.cream,
};

export const dark: typeof light = {
  bg: '#0E0D1C',
  surface: '#1A1930',
  fg: palette.cream,
  muted: '#9C98B5',
  line: '#2C2A47',
  softMint: '#1E3B33',
  softCoral: '#4A2622',
  softYellow: '#4A3F14',
  inverse: palette.cream,
  inverseFg: palette.midnight,
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
