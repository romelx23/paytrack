import { supabase } from './supabase';

// El enlace del correo llega como paytrack://reset-password#access_token=...&refresh_token=...
// Los tokens van en el fragmento (después de #), así que los leemos a mano.
function readTokens(url: string) {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const params = Object.fromEntries(
    hash.split('&').map((pair) => {
      const [key, value = ''] = pair.split('=');
      return [decodeURIComponent(key), decodeURIComponent(value)];
    }),
  );
  return params.access_token && params.refresh_token
    ? { accessToken: params.access_token, refreshToken: params.refresh_token }
    : null;
}

// Convierte los tokens del enlace en una sesión de recuperación.
// Devuelve true si el enlace era de recuperación y se procesó.
export async function handleRecoveryUrl(url: string): Promise<boolean> {
  const tokens = readTokens(url);
  if (!tokens) return false;
  const { error } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
  if (error) throw error;
  return true;
}
