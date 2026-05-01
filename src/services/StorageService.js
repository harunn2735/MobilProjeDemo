import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  GEOFENCE: '@guardianbuddy/geofence',
  SAFE_POINTS: '@guardianbuddy/safepoints',
  ROUTINES: '@guardianbuddy/routines',
  CHILD_PROFILE: '@guardianbuddy/childprofile',
  ALERTS: '@guardianbuddy/alerts',
};

const StorageService = {
  // Geofence
  saveGeofence: async (data) => {
    await AsyncStorage.setItem(KEYS.GEOFENCE, JSON.stringify(data));
  },
  getGeofence: async () => {
    const val = await AsyncStorage.getItem(KEYS.GEOFENCE);
    return val ? JSON.parse(val) : null;
  },

  // Safe Points
  saveSafePoints: async (data) => {
    await AsyncStorage.setItem(KEYS.SAFE_POINTS, JSON.stringify(data));
  },
  getSafePoints: async () => {
    const val = await AsyncStorage.getItem(KEYS.SAFE_POINTS);
    return val ? JSON.parse(val) : [];
  },

  // Routines
  saveRoutines: async (data) => {
    await AsyncStorage.setItem(KEYS.ROUTINES, JSON.stringify(data));
  },
  getRoutines: async () => {
    const val = await AsyncStorage.getItem(KEYS.ROUTINES);
    return val ? JSON.parse(val) : [];
  },

  // Child Profile
  saveChildProfile: async (data) => {
    await AsyncStorage.setItem(KEYS.CHILD_PROFILE, JSON.stringify(data));
  },
  getChildProfile: async () => {
    const val = await AsyncStorage.getItem(KEYS.CHILD_PROFILE);
    return val ? JSON.parse(val) : null;
  },

  // Alerts
  saveAlerts: async (data) => {
    await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(data));
  },
  getAlerts: async () => {
    const val = await AsyncStorage.getItem(KEYS.ALERTS);
    return val ? JSON.parse(val) : [];
  },

  // Clear all (for testing)
  clearAll: async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};

export default StorageService;
