import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ErrorText, Field, Screen, Txt } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function sendLink() {
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'paytrack://reset-password',
    });
    setLoading(false);
    if (authError) {
      setError('No pudimos enviar el correo. Intenta de nuevo en un momento.');
      return;
    }
    // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
    setSent(true);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen eyebrow="Acceso" title="Recuperar contraseña" scroll={false}>
        <View style={styles.form}>
          {sent ? (
            <Txt style={styles.info}>
              Si el correo está registrado, te enviamos un enlace para cambiar la contraseña. Ábrelo desde este teléfono.
            </Txt>
          ) : (
            <>
              <Field
                placeholder="Correo de tu cuenta"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <ErrorText message={error} />
              <Button label="Enviar enlace" onPress={sendLink} loading={loading} disabled={!email.trim()} />
            </>
          )}
          <Button label="Volver a iniciar sesión" variant="ghost" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, marginTop: 24 },
  info: { fontSize: 14, lineHeight: 20 },
});
