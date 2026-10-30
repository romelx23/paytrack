import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ErrorText, Field, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const valid = email.trim().length > 0 && password.length >= 8 && password === confirm;

  async function signUp() {
    setError(null);
    setInfo(null);
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: 'paytrack://' },
    });
    setLoading(false);

    if (authError) {
      setError(
        authError.message.toLowerCase().includes('already')
          ? 'Ya existe una cuenta con ese correo.'
          : 'No pudimos crear la cuenta. Revisa los datos e intenta de nuevo.',
      );
      return;
    }

    // Si la confirmación por correo está activa, no hay sesión todavía.
    // Si no lo está, el guard de la raíz nos lleva a las pestañas automáticamente.
    if (!data.session) {
      setInfo('Te enviamos un correo para confirmar tu cuenta. Ábrelo desde este teléfono y luego inicia sesión.');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen eyebrow="Encargados" title="Crear cuenta" scroll={false}>
        <View style={styles.form}>
          <Field
            placeholder="Correo"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field placeholder="Contraseña (mínimo 8)" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} />
          <Field placeholder="Repite la contraseña" secureTextEntry autoComplete="new-password" value={confirm} onChangeText={setConfirm} />
          <ErrorText message={error} />
          {info ? <Txt style={styles.info}>{info}</Txt> : null}
          <Button label="Crear cuenta" onPress={signUp} loading={loading} disabled={!valid} />
          <Button label="Ya tengo cuenta" variant="ghost" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, marginTop: 24 },
  info: { fontSize: 14, lineHeight: 20 },
});
