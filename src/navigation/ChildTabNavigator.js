import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../constants/theme';

import ChildDashboard from '../screens/child/ChildDashboard';
import RoutineTrackScreen from '../screens/child/RoutineTrackScreen';
import RewardsScreen from '../screens/child/RewardsScreen';
import SafeNavigationScreen from '../screens/child/SafeNavigationScreen';

const Tab = createBottomTabNavigator();
const C = COLORS.child;

const ChildTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: C.primary,
      tabBarInactiveTintColor: '#A78BFA',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: C.border,
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 10,
        paddingTop: 6,
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      tabBarIcon: ({ focused, color, size }) => {
        const icons = {
          [ROUTES.CHILD_DASHBOARD]: focused ? 'home' : 'home-outline',
          [ROUTES.ROUTINE_TRACK]: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
          [ROUTES.REWARDS]: focused ? 'star' : 'star-outline',
          [ROUTES.SAFE_NAVIGATION]: focused ? 'shield' : 'shield-outline',
        };
        return <Ionicons name={icons[route.name] || 'ellipse'} size={24} color={color} />;
      },
    })}
  >
    <Tab.Screen name={ROUTES.CHILD_DASHBOARD} component={ChildDashboard} options={{ tabBarLabel: 'Ana Sayfa' }} />
    <Tab.Screen name={ROUTES.ROUTINE_TRACK} component={RoutineTrackScreen} options={{ tabBarLabel: 'Görevlerim' }} />
    <Tab.Screen name={ROUTES.REWARDS} component={RewardsScreen} options={{ tabBarLabel: 'Ödüllerim' }} />
    <Tab.Screen name={ROUTES.SAFE_NAVIGATION} component={SafeNavigationScreen} options={{ tabBarLabel: '🆘 Yardım' }} />
  </Tab.Navigator>
);

export default ChildTabNavigator;
