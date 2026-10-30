import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { handleRecoveryUrl } from '../lib/recovery';
import { useSession } from '../lib/session';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { session, loading } = useSession();

  // Esta capa siempre está montada, así que recibe el enlace del correo aunque llegue
  // con la app abierta. Por eso el procesamiento vive aquí y no en la pantalla de recuperación.
  useEffect(() => {
    async function onUrl(url: string) {
      try {
        if (await handleRecoveryUrl(url)) router.replace('/reset-password');
      } catch {
        router.replace('/reset-password?expired=1');
      }
    }
    Linking.getInitialURL().then((initial) => {
      if (initial) onUrl(initial);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => onUrl(url));
    return () => subscription.remove();
  }, []);

  if (loading) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Stack.Protected muestra cada grupo solo si su guard se cumple y redirige solo. */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
        {/* El enlace del correo puede abrir la app con o sin sesión, así que esta ruta no tiene guard. */}
        <Stack.Screen name="reset-password" />
      </Stack>
    </QueryClientProvider>
  );
}
