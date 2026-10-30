import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, ErrorText, Field, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';

// La sesión de recuperación la crea la raíz al recibir el enlace (ver _layout.tsx).
// Aquí solo comprobamos que exista antes de pedir la nueva contraseña.
export default function ResetPasswordScreen() {
  const { expired } = useLocalSearchParams<{ expired?: string }>();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    expired ? 'El enlace venció o ya se usó. Pide uno nuevo.' : null,
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (expired) return;
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, [expired]);

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
