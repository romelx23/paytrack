import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { palette, useTheme } from '../../theme/tokens';

export default function TabLayout() {
  const t = useTheme();

  // Icono que cambia de color según la pestaña esté activa o no.
  const icon = (name: keyof typeof Ionicons.glyphMap) =>
    function TabIcon({ focused }: { focused: boolean }) {
      return <Ionicons name={name} size={22} color={focused ? palette.mint : t.muted} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.mint,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="cobros" options={{ title: 'Cobros', tabBarIcon: icon('cash-outline') }} />
      <Tabs.Screen name="departamentos" options={{ title: 'Deptos', tabBarIcon: icon('business-outline') }} />
      <Tabs.Screen name="actividad" options={{ title: 'Actividad', tabBarIcon: icon('pulse-outline') }} />
    </Tabs>
  );
}
