import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ErrorText, Field, Screen } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) setError('Correo o contraseña incorrectos.');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen eyebrow="PayTrack" title="Money, under control." scroll={false}>
        <View style={styles.form}>
          <Field
            placeholder="Correo"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field placeholder="Contraseña" secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} />
          <ErrorText message={error} />
          <Button label="Entrar" onPress={signIn} loading={loading} disabled={!email || !password} />
          <Button label="Olvidé mi contraseña" variant="ghost" onPress={() => router.push('/forgot-password')} />
          <Button label="Crear cuenta de encargado" variant="ghost" onPress={() => router.push('/register')} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, marginTop: 24 },
});
