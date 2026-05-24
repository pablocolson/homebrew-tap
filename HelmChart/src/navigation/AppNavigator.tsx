import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ChartScreen from '../screens/ChartScreen';
import WaypointsScreen from '../screens/WaypointsScreen';
import BoatsScreen from '../screens/BoatsScreen';
import TracksScreen from '../screens/TracksScreen';
import OfflineScreen from '../screens/OfflineScreen';
import { colors, fontSize } from '../utils/theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Carte', component: ChartScreen, icon: 'map' },
  { name: 'Waypoints', component: WaypointsScreen, icon: 'location' },
  { name: 'Traces', component: TracksScreen, icon: 'trail-sign' },
  { name: 'Bateaux', component: BoatsScreen, icon: 'boat' },
  { name: 'Hors ligne', component: OfflineScreen, icon: 'cloud-download' },
] as const;

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 25,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: fontSize.xs,
            fontWeight: '600',
          },
        }}
      >
        {TABS.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={tab.icon as any} size={size} color={color} />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
