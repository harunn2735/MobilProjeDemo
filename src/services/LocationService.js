import * as Location from 'expo-location';
import GeofenceService from './GeofenceService';
import NotificationService from './NotificationService';

let locationSubscription = null;
let hourlyIntervalId = null;
let lastGeofenceState = true; // true = inside

const LocationService = {
  requestPermissions: async () => {
    const fg = await Location.requestForegroundPermissionsAsync();
    const bg = await Location.requestBackgroundPermissionsAsync();
    return fg.status === 'granted' && bg.status === 'granted';
  },

  getCurrentLocation: async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  },

  startTracking: async ({ geofence, onLocationUpdate, onGeofenceChange }) => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;

    // Stop any existing subscription
    LocationService.stopTracking();

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // every 10 seconds
        distanceInterval: 10, // or every 10 meters
      },
      (loc) => {
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        onLocationUpdate && onLocationUpdate(coords);

        if (geofence) {
          const inside = GeofenceService.isInsideGeofence(coords, geofence);

          // Trigger alert only when state changes
          if (inside !== lastGeofenceState) {
            lastGeofenceState = inside;
            onGeofenceChange && onGeofenceChange(inside, coords);
            NotificationService.sendGeofenceAlert(!inside, coords);

            if (!inside) {
              // Start hourly updates when leaving geofence
              LocationService.startHourlyUpdates(coords);
            } else {
              // Stop hourly updates when back inside
              LocationService.stopHourlyUpdates();
            }
          }
        }
      }
    );
  },

  stopTracking: () => {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    LocationService.stopHourlyUpdates();
  },

  startHourlyUpdates: (currentLocation) => {
    LocationService.stopHourlyUpdates();
    NotificationService.scheduleHourlyUpdate();
    // Also update every hour (3600000ms) via JS interval for location callback
    hourlyIntervalId = setInterval(async () => {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        NotificationService.sendHourlyLocationUpdate(loc);
      }
    }, 3600000);
  },

  stopHourlyUpdates: () => {
    if (hourlyIntervalId) {
      clearInterval(hourlyIntervalId);
      hourlyIntervalId = null;
    }
    NotificationService.cancelHourlyUpdates();
  },
};

export default LocationService;
