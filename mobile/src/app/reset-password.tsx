import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Button, ErrorText, Field, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';

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

export default function ResetPasswordScreen() {
  const url = Linking.useURL();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Al abrir el enlace, convertimos los tokens en una sesión de recuperación.
  useEffect(() => {
    if (!url) return;
    const tokens = readTokens(url);
    if (!tokens) return;
    supabase.auth
      .setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) setError('El enlace venció o ya se usó. Pide uno nuevo.');
        else setReady(true);
      });
  }, [url]);

  const valid = password.length >= 8 && password === confirm;

  async function updatePassword() {
    setError(null);
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError('No pudimos cambiar la contraseña. Intenta de nuevo.');
      return;
    }
    setDone(true);
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen eyebrow="Acceso" title="Nueva contraseña" scroll={false}>
        <View style={styles.form}>
          {!ready && !error ? (
            <Txt style={styles.info}>Abre el enlace que te llegó por correo desde este teléfono.</Txt>
          ) : null}
          {ready && !done ? (
            <>
              <Field placeholder="Nueva contraseña (mínimo 8)" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} />
              <Field placeholder="Repite la contraseña" secureTextEntry autoComplete="new-password" value={confirm} onChangeText={setConfirm} />
              <Button label="Guardar contraseña" onPress={updatePassword} loading={loading} disabled={!valid} />
            </>
          ) : null}
          <ErrorText message={error} />
          <Button label="Ir a iniciar sesión" variant="ghost" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, marginTop: 24 },
  info: { fontSize: 14, lineHeight: 20 },
});
