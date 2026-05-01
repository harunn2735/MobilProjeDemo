import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationService = {
  requestPermissions: async () => {
    if (Platform.OS === 'android') {
      const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.log('Skipping push permissions in Expo Go on Android (SDK 53+ restriction).');
        return false;
      }
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  sendGeofenceAlert: async (isOutside, location) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isOutside ? '⚠️ Güvenli Alan İhlali!' : '✅ Güvenli Alana Döndü',
        body: isOutside
          ? 'Çocuğunuz belirlenen güvenli alanın dışına çıktı. Hemen konumunu kontrol edin!'
          : 'Çocuğunuz güvenli alana geri döndü.',
        data: { type: 'geofence', location },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Immediate
    });
  },

  sendHourlyLocationUpdate: async (location) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Saatlik Konum Güncellemesi',
        body: `Çocuğunuz hâlâ güvenli alan dışında. Konum güncellemesi alındı.`,
        data: { type: 'hourly_update', location },
        sound: false,
      },
      trigger: null,
    });
  },

  sendTaskCompletedNotification: async (taskName) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Görev Tamamlandı!',
        body: `"${taskName}" görevi başarıyla tamamlandı.`,
        data: { type: 'task_complete' },
        sound: true,
      },
      trigger: null,
    });
  },

  scheduleHourlyUpdate: async () => {
    // Cancel existing hourly updates first
    await Notifications.cancelAllScheduledNotificationsAsync();
    // Schedule repeating notification every hour
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Konum Takibi',
        body: 'Çocuğunuz güvenli alan dışında – konum kontrol ediliyor.',
        data: { type: 'hourly_trigger' },
      },
      trigger: {
        seconds: 3600, // 1 hour
        repeats: true,
      },
    });
  },

  cancelHourlyUpdates: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};

export default NotificationService;
