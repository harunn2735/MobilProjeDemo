import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import Constants from 'expo-constants';
import { authInstance, db } from '../../firebaseConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const LOCATION_TASK_NAME = 'background-location-task';
const FETCH_TASK_NAME = 'background-fetch-task';

// Yardımcı Fonksiyon: Konumlar arası mesafe (metre)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Yardımcı Fonksiyon: Adres formatla (Türkçe standartlarına uygun)
const formatAddress = (item, coords) => {
  if (!item) return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  
  // Mahalle bilgisi
  let mahalle = item.district || "";
  if (mahalle && !mahalle.toLowerCase().includes("mah")) mahalle += " Mah.";

  // Sokak bilgisi
  let sokak = item.street || "";
  if (sokak && !sokak.toLowerCase().includes("sk") && !sokak.toLowerCase().includes("cd")) {
    sokak += " Sk.";
  }

  // Kapı no (Name genellikle bunu tutar)
  const no = (item.name && item.name !== item.street && !isNaN(parseInt(item.name))) ? `No: ${item.name}` : "";

  // İlçe ve İl
  const ilce = item.subregion || "";
  const il = item.city || "";

  const mainParts = [mahalle, sokak, no].filter(p => p && p !== "null").join(", ");
  const regionParts = [ilce, il].filter(p => p && p !== "null").join("/");

  const result = [mainParts, regionParts].filter(Boolean).join(", ");
  return result || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
};

// Yardımcı Fonksiyon: Expo Push API ile bildirim gönder
const sendPushNotification = async (expoPushToken, title, body) => {
  if (!expoPushToken) return;
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.error('Push send error:', e);
  }
};

// Yardımcı Fonksiyon: Aktivite Günlüğüne Kayıt Ekle
// Yardımcı Fonksiyon: Liste temizleme (ID hatalarını ve duplikeleri giderir)
const sanitizeList = (list) => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  return list
    .map(item => {
      let id = item.id;
      // Eğer ID bir nesneyse veya hatalıysa düzeltebiliriz (veya silebiliriz)
      if (typeof id === 'object' && id !== null) {
        // Obje ID'ler genellikle bir hatanın sonucudur, string'e çevirip uniq hale getiriyoruz
        id = `repair_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      } else if (!id) {
        id = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      }
      return { ...item, id: id.toString() };
    })
    .filter(item => {
      // '[object Object]' gibi hatalı string ID'leri veya duplikeleri temizle
      if (item.id === '[object Object]' || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
};

const checkStreakReset = (streak, lastUpdate) => {
  if (!lastUpdate || streak === 0) return 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastUpdate !== today && lastUpdate !== yesterday) return 0;
  return streak;
};

const addActivityLog = async (familyId, type, title, detail, location = null) => {
  try {
    const historyRef = collection(db, 'families', familyId, 'activityHistory');
    await setDoc(doc(historyRef), {
      type, // 'security' | 'device' | 'location'
      title,
      detail,
      location,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
};

const performBackgroundUpdate = async (locationInput = null) => {
  try {
    const familyId = await AsyncStorage.getItem('linkedFamilyId');
    if (!familyId) return BackgroundFetch.BackgroundFetchResult.NoData;

    let location = locationInput;
    if (!location) {
      const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      location = currentLoc;
    }

    if (!location) return BackgroundFetch.BackgroundFetchResult.Failed;

    const battery = await Battery.getBatteryLevelAsync();
    const speed = location.coords.speed || 0;
    const isMoving = speed > 0.3; // More sensitive
    const now = new Date();

    const geoStr = await AsyncStorage.getItem('geofence');
    const geofence = geoStr ? JSON.parse(geoStr) : null;
    
    let alert = null;
    let geofenceStatus = 'inside';

    if (geofence && geofence.latitude && geofence.longitude) {
      const dist = getDistance(
        location.coords.latitude, 
        location.coords.longitude, 
        geofence.latitude, 
        geofence.longitude
      );
      
      if (dist > geofence.radius) {
        alert = "⚠️ Çocuğunuz güvenli bölgenin dışına çıktı!";
        geofenceStatus = 'outside';
      }
    }

    const familyRef = doc(db, 'families', familyId);
    
    let parentPushToken = await AsyncStorage.getItem('parentPushToken');
    let childName = await AsyncStorage.getItem('childName') || 'Çocuk';

    if (!parentPushToken) {
       const familySnap = await getDoc(familyRef);
       if (familySnap.exists()) {
         const fData = familySnap.data();
         parentPushToken = fData.parentPushToken;
         childName = fData.childProfile?.name || 'Çocuk';
         if (parentPushToken) await AsyncStorage.setItem('parentPushToken', parentPushToken);
         if (childName) await AsyncStorage.setItem('childName', childName);
       }
    }

    // Reverse Geocode to get address
    let address = "Konum alınıyor...";
    try {
      const rev = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      address = formatAddress(rev ? rev[0] : null, location.coords);
    } catch (e) {
      address = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
    }

    const updateObj = {
      'childLocation.latitude': location.coords.latitude,
      'childLocation.longitude': location.coords.longitude,
      'childLocation.speed': speed,
      'childLocation.status': isMoving ? 'moving' : 'stationary',
      'childLocation.address': address,
      'childLocation.batteryLevel': battery !== -1 ? Math.round(battery * 100) : 0,
      'childLocation.timestamp': now.toISOString(),
      'childLocation.alert': alert,
      'childLocation.geofenceStatus': geofenceStatus,
      'childLocation.lastSeen': now.toISOString()
    };

    // Safe Point Proximity Check
    const safeStr = await AsyncStorage.getItem('safePoints');
    const safePoints = safeStr ? JSON.parse(safeStr) : [];
    let currentSafePoint = null;
    for (const sp of safePoints) {
      const d = getDistance(location.coords.latitude, location.coords.longitude, sp.latitude, sp.longitude);
      if (d < 60) { // 60 meters threshold
        currentSafePoint = sp;
        break;
      }
    }
    updateObj['childLocation.currentSafePoint'] = currentSafePoint;

    // Local Notifications for CHILD
    const lastGeoStatus = await AsyncStorage.getItem('lastGeoStatusChild');
    if (geofenceStatus !== lastGeoStatus) {
      if (geofenceStatus === 'outside') {
        await Notifications.scheduleNotificationAsync({
          content: { title: "⚠️ ALAN DIŞINA ÇIKTIN!", body: "Güvenli bölgenin dışındasın, lütfen dikkatli ol!", sound: true },
          trigger: null
        });
      } else if (lastGeoStatus === 'outside') {
        await Notifications.scheduleNotificationAsync({
          content: { title: "✅ GÜVENLİ BÖLGEDESİN", body: "Tekrar güvenli alana girdin, harikasın!", sound: true },
          trigger: null
        });
      }
      await AsyncStorage.setItem('lastGeoStatusChild', geofenceStatus);
    }

    const lastSafePointId = await AsyncStorage.getItem('lastSafePointIdChild');
    if (currentSafePoint && currentSafePoint.id !== lastSafePointId) {
      await AsyncStorage.setItem('lastSafePointIdChild', currentSafePoint.id);
    } else if (!currentSafePoint && lastSafePointId) {
      await AsyncStorage.removeItem('lastSafePointIdChild');
    }

    const lastAlertSent = await AsyncStorage.getItem('lastAlertSent');
    if (alert && lastAlertSent !== alert) {
      await sendPushNotification(parentPushToken, "🆘 Güvenli Alan Uyarısı", `${alert}\nKonum: ${address}`);
      await AsyncStorage.setItem('lastAlertSent', alert);
      // Log to history
      await addActivityLog(familyId, 'security', 'Güvenli Alan İhlali', alert, { latitude: location.coords.latitude, longitude: location.coords.longitude, address });
    } else if (!alert && lastAlertSent) {
      await addActivityLog(familyId, 'security', 'Güvenli Alana Giriş', 'Çocuğunuz güvenli bölgeye geri döndü.', { latitude: location.coords.latitude, longitude: location.coords.longitude, address });
      await AsyncStorage.removeItem('lastAlertSent');
    }

    // Battery Alert Log
    const batteryLevel = Math.round(battery * 100);
    const lastBatteryAlert = await AsyncStorage.getItem('lastBatteryAlert');
    if (batteryLevel <= 20 && lastBatteryAlert !== 'low') {
      await addActivityLog(familyId, 'device', 'Düşük Batarya', `Cihaz şarjı %${batteryLevel}'ye düştü.`);
      await AsyncStorage.setItem('lastBatteryAlert', 'low');
    } else if (batteryLevel > 30) {
      await AsyncStorage.removeItem('lastBatteryAlert');
    }

    const lastPeriodicStr = await AsyncStorage.getItem('lastPeriodicUpdate');
    const lastPeriodic = lastPeriodicStr ? new Date(lastPeriodicStr) : new Date(0);
    if ((now - lastPeriodic) > 270000) { // 4.5 minutes to ensure we hit the 5 min window
      const displayTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      updateObj['periodicUpdate'] = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address,
        timestamp: now.toISOString(),
        displayTime: displayTime
      };
      
      if (parentPushToken) {
        await sendPushNotification(
          parentPushToken, 
          `📍 Konum Özeti (${displayTime})`, 
          `${childName} şu an ${isMoving ? 'hareket halinde' : 'duruyor'}.\nKonum: ${address}\nBatarya: %${batteryLevel}`
        );
      }
      
      await AsyncStorage.setItem('lastPeriodicUpdate', now.toISOString());
    }

    updateObj['childLocation.lastBackgroundTaskSync'] = now.toISOString();

    await updateDoc(familyRef, updateObj);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('[Background] Task failed:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
};

// Define the background tasks
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    if (locations[0]) await performBackgroundUpdate(locations[0]);
  }
});

TaskManager.defineTask(FETCH_TASK_NAME, async () => {
  return await performBackgroundUpdate();
});


const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

export const AppProvider = ({ children }) => {
  const [userType, setUserType] = useState(null); // 'family' | 'child'
  const [currentUser, setCurrentUser] = useState(null);
  const [familyData, setFamilyData] = useState(null); // To store family specific data
  const [liveChildLocation, setLiveChildLocation] = useState(null);

  const [childProfile, setChildProfile] = useState({ name: 'Çocuk', age: '', avatar: '🦁' });
  const [geofence, setGeofence] = useState(null);
  const [safePoints, setSafePoints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [lastStreakUpdate, setLastStreakUpdate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const lastGeofenceAlertRef = useRef(null);
  const lastRoutineReminderRef = useRef(null);
  const lastPeriodicNotifyRef = useRef(null);

  useEffect(() => {
    loadData();
    requestPermissions();
    const authUnsubscribe = onAuthStateChanged(authInstance, async (user) => {
      setCurrentUser(user);
      if (user) {
        setUserType('family');
        await AsyncStorage.setItem('userType', 'family');
        await AsyncStorage.setItem('linkedFamilyId', user.uid);
      } else {
        const cachedType = await AsyncStorage.getItem('userType');
        if (cachedType === 'child') {
          setUserType('child');
        } else {
          setUserType(null);
        }
      }
      setIsLoading(false);
    });
    return () => authUnsubscribe();
  }, []);

  const requestPermissions = async () => {
    try {
      // SDK 53+ restriction: push notifications don't work in Expo Go on Android
      const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
      if (Platform.OS === 'android' && isExpoGo) {
        console.log('Skipping push permissions/token in Expo Go on Android (SDK 53+ restriction).');
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Get Expo Push Token - Silently for dev/Expo Go
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        console.log('Push Token Captured:', token);

        // Save token if family
        const type = userType || await AsyncStorage.getItem('userType');
        if (type === 'family') {
          const familyId = (currentUser && currentUser.uid) || await AsyncStorage.getItem('linkedFamilyId');
          if (familyId) {
            await updateDoc(doc(db, 'families', familyId), { parentPushToken: token });
          }
        } else if (type === 'child') {
          const familyId = await AsyncStorage.getItem('linkedFamilyId');
          if (familyId) {
            await updateDoc(doc(db, 'families', familyId), { childPushToken: token });
          }
        }
      } catch (tokenErr) {
        console.log('Push Token (expected in some dev envs):', tokenErr.message);
      }
    } catch (e) {
      console.log('Permission/Token error:', e);
    }
  };

  // Sync Listener Effect
  useEffect(() => {
    let unsubscribe;
    const setupSync = async () => {
      const type = userType || await AsyncStorage.getItem('userType');
      const familyId = (type === 'family' && currentUser) 
        ? currentUser.uid 
        : await AsyncStorage.getItem('linkedFamilyId');

      console.log('[Sync] Initializing for:', { type, familyId });

      if (familyId) {
        // Main Family Doc Listener
        unsubscribe = onSnapshot(doc(db, 'families', familyId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFamilyData(data);
            
            // Sync specific parts
            if (data.childLocation) {
              setLiveChildLocation(data.childLocation);
              
              // 1. Geofence Alerts (Parent only)
              if (type === 'family' && data.childLocation.alert && data.childLocation.alert !== lastGeofenceAlertRef.current) {
                const status = data.childLocation.geofenceStatus;
                const addr = data.childLocation.address ? `\nKonum: ${data.childLocation.address}` : "";
                try {
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: status === 'outside' ? "🆘 GÜVENLİ ALAN UYARISI" : "✅ BÖLGE DURUMU",
                      body: `${data.childLocation.alert}${addr}`,
                      sound: true,
                    },
                    trigger: null,
                  });
                } catch (_) {}
                lastGeofenceAlertRef.current = data.childLocation.alert;
              }

              // 2. Periodic Location Summary (Parent only)
              const periodic = data.periodicUpdate;
              if (type === 'family' && periodic && periodic.timestamp !== lastPeriodicNotifyRef.current) {
                try {
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: `📍 Konum Özeti (${periodic.displayTime})`,
                      body: `${data.childProfile?.name || 'Çocuk'} şu an ${data.childLocation.status === 'moving' ? 'hareket halinde' : 'duruyor'}.\nKonum: ${periodic.address}`,
                      sound: true,
                    },
                    trigger: null,
                  });
                } catch (_) {}
                lastPeriodicNotifyRef.current = periodic.timestamp;
              }
            }

            // 3. Child Reminder Notifications (Child only) — OUTSIDE childLocation block
            if (type === 'child') {
              const reminder = data.activeReminder;
             if (reminder && reminder.sentAt !== lastRoutineReminderRef.current) {
                (async () => {
                  try {
                    await Notifications.scheduleNotificationAsync({
                      content: {
                        title: "🚨 ACİL GÖREV!",
                        body: `"${reminder.title}" görevini tamamlamayı unutma!`,
                        sound: true,
                      },
                      trigger: null,
                    });
                    for (let mins = 2; mins <= 20; mins += 2) {
                      await Notifications.scheduleNotificationAsync({
                        content: {
                          title: "⏳ Acele et!",
                          body: `"${reminder.title}" hâlâ tamamlanmadı!`,
                          sound: true,
                        },
                        trigger: { seconds: mins * 60 },
                      });
                    }
                  } catch (notifErr) {
                    console.log('[Reminder] Notification error:', notifErr.message);
                  }
                })();
                lastRoutineReminderRef.current = reminder.sentAt;
              } else if (!reminder && lastRoutineReminderRef.current) {
                 try { Notifications.cancelAllScheduledNotificationsAsync(); } catch (_) {}
                 lastRoutineReminderRef.current = null;
              }
            }
            if (data.geofence) {
              setGeofence(data.geofence);
              AsyncStorage.setItem('geofence', JSON.stringify(data.geofence));
            }
            if (data.safePoints) {
              const cleaned = sanitizeList(data.safePoints);
              setSafePoints(cleaned);
              AsyncStorage.setItem('safePoints', JSON.stringify(cleaned));
            }
            if (data.childProfile) {
              const VALID_AVATARS = ['🦁','🦄','🐱','🐰','🐼','🦊','🐨','🦋','🦅','🐺'];
              const rawAvatar = data.childProfile.avatar;
              const safeAvatar = (rawAvatar && VALID_AVATARS.includes(rawAvatar)) ? rawAvatar : '🦁';
              const safeProfile = { ...data.childProfile, avatar: safeAvatar };
              setChildProfile(safeProfile);
              AsyncStorage.setItem('childName', safeProfile.name || 'Çocuk');
            }
            if (data.badges) {
              const cleaned = sanitizeList(data.badges);
              setBadges(cleaned);
              AsyncStorage.setItem('badges', JSON.stringify(cleaned));
            }
            if (data.points !== undefined) setPoints(data.points);
            if (data.streak !== undefined && data.lastStreakUpdate !== undefined) {
               const currentStreak = checkStreakReset(data.streak, data.lastStreakUpdate);
               setStreak(currentStreak);
               setLastStreakUpdate(data.lastStreakUpdate);
            }
          }
        });

        // Activity History Listener (Parent only)
        if (type === 'family') {
          const historyRef = collection(db, 'families', familyId, 'activityHistory');
          onSnapshot(historyRef, (snap) => {
            const acts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
              .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 30);
            setAlerts(acts);
          });
        }

        // If child, start location and foreground sync
        if (type === 'child') {
          startLocationTracking(familyId);
          startForegroundSync(familyId);
        }
      }
    };

    setupSync();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [userType, currentUser]);

  const startLocationTracking = async (familyId) => {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (fgStatus === 'granted' && bgStatus === 'granted') {
        // 1. Location Updates (Distance based)
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!hasStarted) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000,
            distanceInterval: 5, // More sensitive
            showsBackgroundLocationIndicator: true,
            pausesLocationUpdatesAutomatically: false,
            foregroundService: {
              notificationTitle: "GuardianBuddy Takipte",
              notificationBody: "Konumunuz ailenizle paylaşılıyor.",
              notificationColor: "#FF5733",
            },
          });
        }

        // 2. Background Fetch (Time based heartbeat - fallback)
        const isFetchRegistered = await TaskManager.isTaskRegisteredAsync(FETCH_TASK_NAME);
        if (!isFetchRegistered) {
          await BackgroundFetch.registerTaskAsync(FETCH_TASK_NAME, {
            minimumInterval: 15 * 60, // 15 mins (iOS Limit)
            stopOnTerminate: false,
            startOnBoot: true,
          });
        }
      } else {
        console.log('Eksik izinler:', fgStatus, bgStatus);
      }
    } catch (e) { console.log('Konum takibi hata:', e); }
  };

  const startForegroundSync = (familyId) => {
    // Sync battery and basic info frequently, and check periodic heartbeat
    const sync = async () => {
      try {
        const now = new Date();
        const battery = await Battery.getBatteryLevelAsync();
        const battLevel = battery !== -1 ? Math.round(battery * 100) : 0;
        const status = await Battery.getBatteryStateAsync();
        const isCharging = (status === Battery.BatteryState.CHARGING || status === Battery.BatteryState.FULL);
        
        const familyRef = doc(db, 'families', familyId);
        const updateFields = {
          'childLocation.batteryLevel': battLevel,
          'childLocation.isCharging': isCharging,
          'childLocation.lastForegroundUpdate': now.toISOString()
        };

        // Heartbeat: If 5 mins passed, trigger a periodic update even in foreground
        const lastPeriodicStr = await AsyncStorage.getItem('lastPeriodicUpdate');
        const lastPeriodic = lastPeriodicStr ? new Date(lastPeriodicStr) : new Date(0);
        
        if ((now - lastPeriodic) > 300000) { // 5 minutes
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const displayTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          
          let address = "";
          try {
            const rev = await Location.reverseGeocodeAsync(loc.coords);
            address = formatAddress(rev ? rev[0] : null, loc.coords);
          } catch (e) {
            address = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
          }

          updateFields['periodicUpdate'] = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            address: address,
            timestamp: now.toISOString(),
            displayTime: displayTime
          };
          updateFields['childLocation.address'] = address;
          updateFields['childLocation.latitude'] = loc.coords.latitude;
          updateFields['childLocation.longitude'] = loc.coords.longitude;
          
          // If in foreground, we just update DB; Parent listener handles the rest
          await AsyncStorage.setItem('lastPeriodicUpdate', now.toISOString());
          console.log('[Heartbeat] Periodic update triggered');
        }

        await updateDoc(familyRef, updateFields);
        console.log('[Foreground] Sync completed');
      } catch (e) { console.log('Foreground sync error:', e); }
    };

    sync();
    const interval = setInterval(sync, 60000); // Check every minute
    return () => clearInterval(interval);
  };

  const loadData = async () => {
    try {
      const keys = ['userType', 'geofence', 'safePoints', 'alerts', 'points', 'badges', 'childProfile', 'streak', 'lastStreakUpdate'];
      const results = await AsyncStorage.multiGet(keys);
      results.forEach(([key, value]) => {
        if (!value) return;
        if (key === 'userType') setUserType(value);
        
        const parsed = (key !== 'userType') ? JSON.parse(value) : value;

        if (key === 'geofence') setGeofence(parsed);
        if (key === 'safePoints') setSafePoints(sanitizeList(parsed));
        if (key === 'alerts') setAlerts(sanitizeList(parsed));
        if (key === 'points') setPoints(parsed);
        if (key === 'badges') setBadges(sanitizeList(parsed));
        if (key === 'childProfile') setChildProfile(parsed);
        if (key === 'lastStreakUpdate') setLastStreakUpdate(parsed);
        if (key === 'streak') {
           // streak'i set etmeden önce lastStreakUpdate verisini de bulmalıyız
           const lsu = results.find(([k]) => k === 'lastStreakUpdate')?.[1];
           const streakVal = lsu ? checkStreakReset(parsed, JSON.parse(lsu)) : parsed;
           setStreak(streakVal);
        }
      });
    } catch (e) {
      console.log('Veri yüklenemedi:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const save = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.log('Kayıt hatası:', e);
    }
  };

  const saveGeofence = async (data) => {
    setGeofence(data);
    await save('geofence', data);
    if (userType === 'family' && currentUser) {
      await updateDoc(doc(db, 'families', currentUser.uid), { geofence: data });
    }
  };

  const addSafePoint = async (point) => {
    let latitude = point.latitude;
    let longitude = point.longitude;
    let address = point.address || "";

    // If only address is provided, geocode to get coords
    if (!latitude && !longitude && address) {
      try {
        const results = await Location.geocodeAsync(address);
        if (results && results.length > 0) {
          latitude = results[0].latitude;
          longitude = results[0].longitude;
        } else {
          throw new Error('Adres bulunamadı.');
        }
      } catch (e) {
        throw new Error('Adres sorgulama hatası: ' + e.message);
      }
    }

    // If only coords are provided, reverse geocode to get address
    if (!address && latitude && longitude) {
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
        address = formatAddress(rev ? rev[0] : null, { latitude, longitude });
      } catch (e) {
        address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }

    const newPoint = { ...point, latitude, longitude, address, id: Date.now().toString() };
    const updated = [...safePoints, newPoint];
    setSafePoints(updated);
    await save('safePoints', updated);
    if (userType === 'family' && currentUser) {
      await updateDoc(doc(db, 'families', currentUser.uid), { safePoints: updated });
    }
  };

  const removeSafePoint = async (id) => {
    const updated = safePoints.filter(p => p.id !== id);
    setSafePoints(updated);
    await save('safePoints', updated);
    if (userType === 'family' && currentUser) {
      await updateDoc(doc(db, 'families', currentUser.uid), { safePoints: updated });
    }
  };

  const addAlert = async (alert) => {
    const newAlert = { ...alert, id: Date.now().toString(), timestamp: new Date().toISOString() };
    const updated = [newAlert, ...alerts].slice(0, 50);
    setAlerts(updated);
    await save('alerts', updated);
  };

  const unlockBadge = async (badgeIdOrObj, name, emoji) => {
    let id = badgeIdOrObj;
    let bName = name;
    let bEmoji = emoji;

    // Handle being passed an object instead of individual args
    if (typeof badgeIdOrObj === 'object' && badgeIdOrObj !== null) {
      id = badgeIdOrObj.id;
      bName = badgeIdOrObj.name;
      bEmoji = badgeIdOrObj.emoji;
    }

    if (!id) return;
    const stringId = id.toString();

    if (badges.find(b => b.id === stringId)) return;
    const newBadge = { id: stringId, name: bName, emoji: bEmoji, unlockedAt: new Date().toISOString() };
    const updated = sanitizeList([...badges, newBadge]);
    setBadges(updated);
    await save('badges', updated);
    
    // Sync to Firestore
    const familyId = await AsyncStorage.getItem('linkedFamilyId');
    if (familyId) {
      await updateDoc(doc(db, 'families', familyId), { badges: updated });
    }

    // Notify child of new badge
    await Notifications.scheduleNotificationAsync({
      content: { title: "🏆 YENİ ROZET!", body: `Tebrikler, "${bName}" rozetini kazandın!`, sound: true },
      trigger: null
    });
  };

  const getPetEmoji = (pPoints) => {
    const lvl = Math.floor(pPoints / 50) + 1;
    if (lvl < 3) return '🥚'; // Baby
    if (lvl < 7) return '🐣'; // Child
    if (lvl < 12) return '🦁'; // Teen
    return '👑'; // Hero
  };

  const addPoints = async (amount) => {
    const newPoints = points + amount;
    setPoints(newPoints);
    await save('points', newPoints);

    // Evolve Pet logic
    const oldLevel = Math.floor(points / 50) + 1;
    const newLevel = Math.floor(newPoints / 50) + 1;
    
    if (newLevel > oldLevel) {
      await Notifications.scheduleNotificationAsync({
        content: { title: "🚀 SEVİYE ATLADIN!", body: `Tebrikler! Seviye ${newLevel} oldun ve Dostun gelişti!`, sound: true },
        trigger: null
      });
      // Update child profile with new avatar if it evolved
      const newAvatar = getPetEmoji(newPoints);
      if (newAvatar !== childProfile.avatar) {
        const updatedProfile = { ...childProfile, avatar: newAvatar };
        setChildProfile(updatedProfile);
        await save('childProfile', updatedProfile);
      }
    }

    if (userType === 'family' && currentUser) {
      await updateDoc(doc(db, 'families', currentUser.uid), { points: newPoints, 'childProfile.avatar': getPetEmoji(newPoints) });
    } else if (userType === 'child') {
      const familyId = await AsyncStorage.getItem('linkedFamilyId');
      if (familyId) {
        await updateDoc(doc(db, 'families', familyId), { points: newPoints, 'childProfile.avatar': getPetEmoji(newPoints) });
      }
    }
    return newPoints;
  };

  const updateChildProfile = async (name, age, avatar) => {
    const updatedProfile = { name, age, avatar };
    setChildProfile(updatedProfile);
    await save('childProfile', updatedProfile);

    const familyId = await AsyncStorage.getItem('linkedFamilyId');
    if (familyId) {
      await updateDoc(doc(db, 'families', familyId), { childProfile: updatedProfile });
    }
    
    // FINALLY set userType to trigger navigation to dashboard
    await AsyncStorage.setItem('userType', 'child');
    setUserType('child');
  };

  const updateAvatar = async (newAvatar) => {
    const updatedProfile = { ...childProfile, avatar: newAvatar };
    setChildProfile(updatedProfile);
    await save('childProfile', updatedProfile);

    const type = userType || await AsyncStorage.getItem('userType');
    const familyId = (type === 'family' && currentUser) 
      ? currentUser.uid 
      : await AsyncStorage.getItem('linkedFamilyId');

    if (familyId) {
      await updateDoc(doc(db, 'families', familyId), { 'childProfile.avatar': newAvatar });
    }
  };

  const updateStreak = async (isFullCompletion) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let newStreak = streak;
    
    if (isFullCompletion) {
      if (lastStreakUpdate === today) return streak;
      
      if (lastStreakUpdate === yesterday) {
        newStreak = streak + 1;
      } else {
        newStreak = 1;
      }
      
      setStreak(newStreak);
      setLastStreakUpdate(today);
      await save('streak', newStreak);
      await save('lastStreakUpdate', today);
      
      const familyId = await AsyncStorage.getItem('linkedFamilyId');
      if (familyId) {
        await updateDoc(doc(db, 'families', familyId), { streak: newStreak, lastStreakUpdate: today });
      }
    }
    return newStreak;
  };

  const loginFamily = async (email, password) => {
    const cred = await signInWithEmailAndPassword(authInstance, email, password);
    await AsyncStorage.setItem('userType', 'family');
    setUserType('family');
    return cred.user;
  };

  const registerFamily = async (email, password, name, phone) => {
    const cred = await createUserWithEmailAndPassword(authInstance, email, password);
    const userId = cred.user.uid;
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

    await setDoc(doc(db, 'families', userId), {
      parentName: name,
      email: email,
      phone: phone,
      pairingCode: pairingCode,
      createdAt: new Date().toISOString()
    });

    await AsyncStorage.setItem('userType', 'family');
    setUserType('family');
    return cred.user;
  };

  const linkChildDevice = async (code) => {
    // Search for a family with this code
    const q = query(collection(db, 'families'), where('pairingCode', '==', code));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Eşleştirme kodu bulunamadı. Lütfen kontrol edip tekrar deneyin.');
    }

    const familyDoc = querySnapshot.docs[0];
    const familyId = familyDoc.id;

    await AsyncStorage.setItem('linkedFamilyId', familyId);
    
    // DO NOT setUserType('child') here yet, wait for profile setup
    return familyId;
  };

  const sendPeriodicUpdate = async () => {
    try {
      const familyId = await AsyncStorage.getItem('linkedFamilyId');
      if (!familyId) return;
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const now = new Date();
      const displayTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const familyRef = doc(db, 'families', familyId);
      
      // Reverse Geocode
      let address = "";
      try {
        const rev = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        address = formatAddress(rev ? rev[0] : null, loc.coords);
      } catch (e) {
        address = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
      }

      const familySnap = await getDoc(familyRef);
      const parentPushToken = familySnap.exists() ? familySnap.data().parentPushToken : null;
      const childName = familySnap.exists() ? familySnap.data().childProfile?.name : 'Çocuk';

      await updateDoc(familyRef, {
        'periodicUpdate': {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address: address,
          timestamp: now.toISOString(),
          displayTime: displayTime
        },
        'childLocation.latitude': loc.coords.latitude,
        'childLocation.longitude': loc.coords.longitude,
        'childLocation.address': address,
        'childLocation.timestamp': now.toISOString(),
        'childLocation.lastManualSync': now.toISOString()
      });

      // Sync background timer to prevent double message
      await AsyncStorage.setItem('lastPeriodicUpdate', now.toISOString());

      // Log manual check-in
      await addActivityLog(familyId, 'location', 'Konum Kontrolü', 'Aile tarafından manuel konum güncellemesi istendi.', { latitude: loc.coords.latitude, longitude: loc.coords.longitude, address });

      if (parentPushToken) {
        const battery = await Battery.getBatteryLevelAsync();
        const battLevel = battery !== -1 ? Math.round(battery * 100) : 0;
        await sendPushNotification(
          parentPushToken, 
          `📍 Konum Özeti (${displayTime})`, 
          `${childName} şu an duruyor.\nKonum: ${address}\nBatarya: %${battLevel}`
        );
      }

      console.log('[Manual] Periodic update & Push sent');
    } catch (e) {
      console.log('Manual update error:', e);
    }
  };

  const logout = async () => {
    await signOut(authInstance);
    await AsyncStorage.removeItem('userType');
    await AsyncStorage.removeItem('linkedFamilyId');
    setUserType(null);
  };

  return (
    <AppContext.Provider value={{
      userType, currentUser, loginFamily, registerFamily, linkChildDevice, logout,
      familyData, liveChildLocation,
      childProfile, setChildProfile, updateChildProfile, updateAvatar,
      geofence, saveGeofence,
      save,
      safePoints, addSafePoint, removeSafePoint,
      alerts, addAlert,
      points, addPoints,
      badges, unlockBadge,
      streak, updateStreak,
      sendPeriodicUpdate,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};
