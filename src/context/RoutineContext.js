import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import * as Notifications from 'expo-notifications';

const RoutineContext = createContext(null);

export const useRoutines = () => {
  const ctx = useContext(RoutineContext);
  if (!ctx) throw new Error('useRoutines must be used inside RoutineProvider');
  return ctx;
};

const DEFAULT_ROUTINES = [
  { id: '1', title: 'Sabah Kahvaltısı', emoji: '🥣', points: 2, period: 'morning', completed: false, duration: 30 },
  { id: '2', title: 'Dişlerimi Fırçala', emoji: '🦷', points: 2, period: 'morning', completed: false, duration: 10 },
  { id: '3', title: 'Ödev Yap', emoji: '📚', points: 5, period: 'afternoon', completed: false, duration: 60 },
  { id: '4', title: 'Yürüyüş', emoji: '🚶', points: 3, period: 'afternoon', completed: false, duration: 30 },
  { id: '5', title: 'Akşam Yemeği', emoji: '🍽️', points: 2, period: 'evening', completed: false, duration: 30 },
];

export const RoutineProvider = ({ children }) => {
  const [routines, setRoutines] = useState([]);
  const [lastReset, setLastReset] = useState('');
  // We can't use useApp here because it would cause a circular dependency 
  // if AppProvider uses RoutineContext. But AppProvider DOES NOT use RoutineContext.
  // Wait, let's check App.js again.
  
  useEffect(() => {
    loadRoutines();
  }, []);

  // Sync Logic - watching linkedFamilyId in AsyncStorage or passed from parent
  useEffect(() => {
    let unsubscribe;
    const initSync = async () => {
      const familyId = await AsyncStorage.getItem('linkedFamilyId');
      if (familyId) {
        unsubscribe = onSnapshot(doc(db, 'families', familyId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.routines) {
              setRoutines(data.routines);
              AsyncStorage.setItem('routines', JSON.stringify(data.routines));
            }
          }
        });
      }
    };
    
    initSync();
    // Also periodically check if familyId appeared (for new logins)
    const interval = setInterval(initSync, 5000); 

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const sendReminder = async (routine) => {
    const familyId = await AsyncStorage.getItem('linkedFamilyId') || await AsyncStorage.getItem('lastFamilyId');
    if (!familyId) return;

    const reminder = {
      routineId: routine.id,
      title: routine.title,
      duration: routine.duration || 0,
      startTime: new Date().toISOString(),
      sentAt: new Date().toISOString()
    };

    await updateDoc(doc(db, 'families', familyId), { activeReminder: reminder });
  };

  const urgentIntervalRef = useRef(null);
  const urgentTaskRef = useRef(null);

  // OTOMATİK ACİL GÖREV HATIRLATMA — doğrudan yerel bildirim
  useEffect(() => {
    const urgentIncomplete = routines.find(r => r.isUrgent && !r.completed);

    if (!urgentIncomplete) {
      if (urgentIntervalRef.current) {
        clearInterval(urgentIntervalRef.current);
        urgentIntervalRef.current = null;
      }
      urgentTaskRef.current = null;
      return;
    }

    // Zaten bu görev için hatırlatıcı başlattıysak, hiçbir şey yapma (interval devam etsin)
    if (urgentTaskRef.current === urgentIncomplete.id) return;

    // Yeni acil görev bulundu, eski intervali temizle ve yenisini başlat
    if (urgentIntervalRef.current) clearInterval(urgentIntervalRef.current);
    urgentTaskRef.current = urgentIncomplete.id;

    let isMounted = true;

    const startUrgentReminder = async () => {
      const userType = await AsyncStorage.getItem('userType');
      if (userType !== 'child') return; // Sadece çocukta çalışmalı

      if (!isMounted) return;

      const fireLocalNotif = async () => {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🚨 Acil Görev!',
              body: `"${urgentIncomplete.title}" görevini unutma! Hemen tamamla!`,
              sound: true,
            },
            trigger: null, // Hemen gönder
          });
        } catch (_) {}
      };

      // İlk bildirim hemen
      fireLocalNotif();

      // Firestore güncellemeyi sildik, çünkü sonsuz döngü (infinite loop) ve her saniye bildirim atmasına sebep oluyordu!

      // Her 2 dakikada bir tekrar
      urgentIntervalRef.current = setInterval(() => {
        fireLocalNotif();
      }, 2 * 60 * 1000);
    };

    startUrgentReminder();

    return () => {
      isMounted = false;
      if (urgentIntervalRef.current) clearInterval(urgentIntervalRef.current);
    };
  }, [routines]);

  const loadRoutines = async () => {
    try {
      const savedRoutines = await AsyncStorage.getItem('routines');
      const savedReset = await AsyncStorage.getItem('lastReset');
      const today = new Date().toDateString();

      if (!savedRoutines) {
        setRoutines(DEFAULT_ROUTINES);
        await AsyncStorage.setItem('routines', JSON.stringify(DEFAULT_ROUTINES));
      } else {
        let parsed = JSON.parse(savedRoutines);
        if (savedReset !== today) {
          parsed = parsed.map(r => ({ ...r, completed: false }));
          await AsyncStorage.setItem('routines', JSON.stringify(parsed));
          await AsyncStorage.setItem('lastReset', today);
          setLastReset(today);
        } else {
          setLastReset(savedReset || '');
        }
        setRoutines(parsed);
      }
    } catch (e) {
      console.log('Rutin yüklenemedi:', e);
      setRoutines(DEFAULT_ROUTINES);
    }
  };

  const saveRoutines = async (updated) => {
    setRoutines(updated);
    await AsyncStorage.setItem('routines', JSON.stringify(updated));
    
    // Sync to Firestore
    const familyId = await AsyncStorage.getItem('linkedFamilyId') || await AsyncStorage.getItem('lastFamilyId');
    if (familyId) {
      await updateDoc(doc(db, 'families', familyId), { routines: updated });
    }
  };

  const addRoutine = async (routine) => {
    const newRoutine = { ...routine, id: Date.now().toString(), completed: false };
    await saveRoutines([...routines, newRoutine]);
  };

  const updateRoutine = async (id, data) => {
    await saveRoutines(routines.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const deleteRoutine = async (id) => {
    await saveRoutines(routines.filter(r => r.id !== id));
  };

  const completeRoutine = async (id) => {
    const updated = routines.map(r => r.id === id ? { ...r, completed: true } : r);
    await saveRoutines(updated);
    
    // Clear active reminder if this routine was the one being reminded
    const familyId = await AsyncStorage.getItem('linkedFamilyId') || await AsyncStorage.getItem('lastFamilyId');
    if (familyId) {
       const familySnap = await getDoc(doc(db, 'families', familyId));
       if (familySnap.exists() && familySnap.data().activeReminder?.routineId === id) {
          await updateDoc(doc(db, 'families', familyId), { activeReminder: null });
       }
    }
    
    return routines.find(r => r.id === id)?.points || 1;
  };

  const resetDaily = async () => {
    const reset = routines.map(r => ({ ...r, completed: false }));
    await saveRoutines(reset);
    const today = new Date().toDateString();
    await AsyncStorage.setItem('lastReset', today);
    setLastReset(today);
  };

  const todayCompleted = routines.filter(r => r.completed).length;
  const todayTotal = routines.length;

  return (
    <RoutineContext.Provider value={{
      routines, addRoutine, updateRoutine, deleteRoutine,
      completeRoutine, resetDaily, sendReminder,
      todayCompleted, todayTotal,
    }}>
      {children}
    </RoutineContext.Provider>
  );
};
