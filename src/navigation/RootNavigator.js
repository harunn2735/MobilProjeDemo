import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../constants/routes';

import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import FamilyLoginScreen from '../screens/auth/FamilyLoginScreen';
import FamilyRegisterScreen from '../screens/auth/FamilyRegisterScreen';
import ChildLoginScreen from '../screens/auth/ChildLoginScreen';
import ChildPermissionScreen from '../screens/auth/ChildPermissionScreen';
import FamilyTabNavigator from './FamilyTabNavigator';
import ChildTabNavigator from './ChildTabNavigator';

import SafePointsManagerScreen from '../screens/family/SafePointsManagerScreen';
import AddRoutineScreen from '../screens/family/AddRoutineScreen';
import RoutineManagerScreen from '../screens/family/RoutineManagerScreen';
import AlertHistoryScreen from '../screens/family/AlertHistoryScreen';
import GameZoneScreen from '../screens/child/GameZoneScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { userType, isLoading } = useApp();

  console.log('[RootNavigator] Current userType:', userType);

  if (isLoading) {
    // Optionally return a loading spinner here while verifying AsyncStorage and Firebase
    return null; 
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        {!userType ? (
          // Unauthenticated Flow
          <Stack.Group>
            <Stack.Screen name={ROUTES.ROLE_SELECT} component={RoleSelectScreen} />
            <Stack.Screen name={ROUTES.FAMILY_LOGIN} component={FamilyLoginScreen} />
            <Stack.Screen name={ROUTES.FAMILY_REGISTER} component={FamilyRegisterScreen} />
            <Stack.Screen name={ROUTES.CHILD_LOGIN} component={ChildLoginScreen} />
          </Stack.Group>
        ) : userType === 'family' ? (
          // Family Flow
          <Stack.Group screenOptions={{ headerShown: true, headerBackTitle: 'Geri', headerTintColor: '#1E293B' }}>
            <Stack.Screen name="FamilyTabs" component={FamilyTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="SafePoints" component={SafePointsManagerScreen} options={{ title: 'Güvenli Noktalar' }} />
            <Stack.Screen name="AddRoutine" component={AddRoutineScreen} options={{ title: 'Rutin Düzenle' }} />
            <Stack.Screen name="RoutineManager" component={RoutineManagerScreen} options={{ title: 'Rutinlerim' }} />
            <Stack.Screen name="AlertHistory" component={AlertHistoryScreen} options={{ title: 'Uyarı Geçmişi' }} />
          </Stack.Group>
        ) : (
          // Child Flow
          <Stack.Group>
            <Stack.Screen name={ROUTES.CHILD_PERMISSION} component={ChildPermissionScreen} />
            <Stack.Screen name={ROUTES.CHILD_TABS} component={ChildTabNavigator} />
            <Stack.Screen name={ROUTES.GAME_ZONE} component={GameZoneScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
