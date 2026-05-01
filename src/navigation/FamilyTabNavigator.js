import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../constants/theme';

import FamilyDashboard from '../screens/family/FamilyDashboard';
import GeofenceMapScreen from '../screens/family/GeofenceMapScreen';
import RoutineManagerScreen from '../screens/family/RoutineManagerScreen';
import AddRoutineScreen from '../screens/family/AddRoutineScreen';
import AlertHistoryScreen from '../screens/family/AlertHistoryScreen';
import SafePointsManagerScreen from '../screens/family/SafePointsManagerScreen';

const Tab = createBottomTabNavigator();

// Detail screens moved to RootNavigator for global accessibility

const C = COLORS.family;

const FamilyTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: C.primary,
      tabBarInactiveTintColor: C.textSecondary,
      tabBarStyle: {
        backgroundColor: C.surface,
        borderTopColor: C.border,
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ focused, color, size }) => {
        const icons = {
          [ROUTES.FAMILY_DASHBOARD]: focused ? 'home' : 'home-outline',
          [ROUTES.GEOFENCE_MAP]: focused ? 'map' : 'map-outline',
          [ROUTES.ROUTINE_MANAGER]: focused ? 'list' : 'list-outline',
          [ROUTES.ALERT_HISTORY]: focused ? 'notifications' : 'notifications-outline',
        };
        return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
      },
    })}
  >
    <Tab.Screen name={ROUTES.FAMILY_DASHBOARD} component={FamilyDashboard} options={{ tabBarLabel: 'Ana Sayfa' }} />
    <Tab.Screen name={ROUTES.GEOFENCE_MAP} component={GeofenceMapScreen} options={{ tabBarLabel: 'Güvenli Alan' }} />
    <Tab.Screen name={ROUTES.ROUTINE_MANAGER} component={RoutineManagerScreen} options={{ tabBarLabel: 'Rutinler' }} />
    <Tab.Screen name={ROUTES.ALERT_HISTORY} component={AlertHistoryScreen} options={{ tabBarLabel: 'Uyarılar' }} />
  </Tab.Navigator>
);

export default FamilyTabNavigator;
