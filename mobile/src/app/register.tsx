import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ErrorText, Field, Hint, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';
import { PASSWORD_MAX, PASSWORD_MIN, confirmProblem, isValidEmail, passwordProblem } from '../lib/validation';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const emailOk = isValidEmail(email);
  const passwordError = passwordProblem(password);
  const confirmError = confirmProblem(password, confirm);
  const valid = emailOk && password.length >= PASSWORD_MIN && !passwordError && password === confirm;

  async function signUp() {
    setError(null);
    setInfo(null);
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
          ? 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.'
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
          <Hint
            message={email.length === 0 ? 'Escribe tu correo, por ejemplo nombre@dominio.com' : emailOk ? 'Correo válido' : 'Falta el @ o el dominio, por ejemplo nombre@dominio.com'}
            tone={email.length === 0 ? 'muted' : emailOk ? 'ok' : 'error'}
          />

          <Field
            placeholder={`Contraseña (${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres)`}
            secureTextEntry
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            value={password}
            onChangeText={setPassword}
          />
          <Hint
            message={
              password.length === 0
                ? `${PASSWORD_MIN} caracteres como mínimo`
                : passwordError ?? `${password.length} de ${PASSWORD_MAX} caracteres · contraseña válida`
            }
            tone={password.length === 0 ? 'muted' : passwordError ? 'error' : 'ok'}
          />

          <Field
            placeholder="Repite la contraseña"
            secureTextEntry
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            value={confirm}
            onChangeText={setConfirm}
          />
          <Hint
            message={confirm.length === 0 ? null : confirmError ?? 'Las contraseñas coinciden'}
            tone={confirmError ? 'error' : 'ok'}
          />

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
  form: { gap: 10, marginTop: 24 },
  info: { fontSize: 14, lineHeight: 20 },
});
