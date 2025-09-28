import { Tabs } from 'expo-router';
import { Activity, BarChart3, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00ff41',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#333',
          paddingBottom: 5,
          height: 85,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}