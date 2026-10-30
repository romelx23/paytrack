import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSession } from '../lib/session';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { session, loading } = useSession();
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
