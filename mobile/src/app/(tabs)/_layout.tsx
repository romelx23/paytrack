import { Tabs } from 'expo-router';
import { useTheme } from '../../theme/tokens';

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.fg,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="cobros" options={{ title: 'Cobros' }} />
      <Tabs.Screen name="departamentos" options={{ title: 'Deptos' }} />
      <Tabs.Screen name="actividad" options={{ title: 'Actividad' }} />
    </Tabs>
  );
}
