import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useCurrentBuilding } from '../lib/queries';
import { useSession } from '../lib/session';
import { fonts, palette } from '../theme/tokens';

export default function SettingsScreen() {
  const { session } = useSession();
  const { building } = useCurrentBuilding();

  // Cerrar sesión pide confirmación para no salir por un toque accidental.
  function confirmSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir? Tendrás que volver a iniciar sesión.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <Screen eyebrow="Cuenta" title="Ajustes" scroll={false}>
      <View style={styles.card}>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value} numberOfLines={1}>
          {session?.user.email ?? 'Sin correo'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Negocio</Text>
        <Text style={styles.value} numberOfLines={1}>
          {building?.name ?? 'Aún no has creado tu negocio'}
        </Text>
      </View>

      <Pressable onPress={confirmSignOut} accessibilityRole="button" style={styles.signOut}>
        <Ionicons name="log-out-outline" size={20} color={palette.white} />
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.white, borderRadius: 26, padding: 18, gap: 4, marginTop: 12 },
  label: { fontSize: 13, fontFamily: fonts.bodyMedium, color: palette.ink, opacity: 0.6 },
  value: { fontSize: 17, fontFamily: fonts.bodyBold, color: palette.ink },
  signOut: {
    marginTop: 24,
    backgroundColor: palette.coral,
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: { fontSize: 16, fontFamily: fonts.bodyBold, color: palette.white },
});
