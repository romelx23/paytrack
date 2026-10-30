import AsyncStorage from '@react-native-async-storage/async-storage';

// Recuerda si el usuario ya vio el onboarding. Si el almacenamiento falla, se vuelve a mostrar: es seguro.
const KEY = 'paytrack.onboarded';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Sin almacenamiento solo volverá a aparecer el onboarding.
  }
}
