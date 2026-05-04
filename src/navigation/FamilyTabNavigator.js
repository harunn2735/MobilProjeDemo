import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../constants/routes';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';

import FamilyDashboard from '../screens/family/FamilyDashboard';
import GeofenceMapScreen from '../screens/family/GeofenceMapScreen';
import RoutineManagerScreen from '../screens/family/RoutineManagerScreen';
import AlertHistoryScreen from '../screens/family/AlertHistoryScreen';

const Tab = createBottomTabNavigator();
const C = COLORS.family;

const BadgeIcon = ({ name, focused, color, count }) => (
  <View>
    <Ionicons name={name} size={22} color={color} />
    {count > 0 && (
      <View style={{
        position: 'absolute', top: -4, right: -8,
        backgroundColor: '#EF4444', borderRadius: 8,
        minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
      }}>
        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{count > 9 ? '9+' : count}</Text>
      </View>
    )}
  </View>
);

const FamilyTabNavigator = () => {
  const { pendingSubmissionsCount, pendingRewardRequestsCount } = useApp();
  const totalPending = pendingSubmissionsCount + pendingRewardRequestsCount;

  return (
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
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            [ROUTES.FAMILY_DASHBOARD]: focused ? 'home' : 'home-outline',
            [ROUTES.GEOFENCE_MAP]: focused ? 'map' : 'map-outline',
            [ROUTES.ROUTINE_MANAGER]: focused ? 'list' : 'list-outline',
            [ROUTES.ALERT_HISTORY]: focused ? 'notifications' : 'notifications-outline',
          };
          const iconName = icons[route.name] || 'ellipse';
          const count = route.name === ROUTES.FAMILY_DASHBOARD ? totalPending : 0;
          return <BadgeIcon name={iconName} focused={focused} color={color} count={count} />;
        },
      })}
    >
      <Tab.Screen name={ROUTES.FAMILY_DASHBOARD} component={FamilyDashboard} options={{ tabBarLabel: 'Ana Sayfa' }} />
      <Tab.Screen name={ROUTES.GEOFENCE_MAP} component={GeofenceMapScreen} options={{ tabBarLabel: 'Güvenli Alan' }} />
      <Tab.Screen name={ROUTES.ROUTINE_MANAGER} component={RoutineManagerScreen} options={{ tabBarLabel: 'Rutinler' }} />
      <Tab.Screen name={ROUTES.ALERT_HISTORY} component={AlertHistoryScreen} options={{ tabBarLabel: 'Uyarılar' }} />
    </Tab.Navigator>
  );
};

export default FamilyTabNavigator;
