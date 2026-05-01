import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // Adjust the import level if needed
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

export default function ChildPermissionScreen({ navigation }) {
  const { userType, geofence, save } = useApp();
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    setLoading(true);
    try {
      // 1. Request Foreground Location
      let { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        Alert.alert('İzin Reddedildi', 'Konum izni olmadan bu uygulamayı kullanamazsınız.');
        setLoading(false);
        return;
      }

      // 2. Request Background Location
      let bgStatus = 'denied';
      try {
        const bgRes = await Location.requestBackgroundPermissionsAsync();
        bgStatus = bgRes.status;
      } catch (bgErr) {
        console.log('[Background Location] Error or not supported in Expo Go:', bgErr.message);
        // Expo Go often fails here, we proceed with foreground for now
      }
      
      // 3. Request Contacts Permission
      let contactStatus = 'denied';
      try {
        const contactRes = await Contacts.requestPermissionsAsync();
        contactStatus = contactRes.status;
      } catch (contactErr) {
        console.log('[Contacts] Error:', contactErr.message);
      }

      const permissionsData = {
        foregroundLocationGranted: fgStatus === 'granted',
        backgroundLocationGranted: bgStatus === 'granted',
        contactsGranted: contactStatus === 'granted',
        timestamp: new Date().toISOString()
      };

      // Since the AppContext might not be ready with the specific user ID yet if we just paired,
      // we'll push this data to a local storage flag to be synced, or if you have a childId in context, push it to firestore.
      // For now, we'll mark setup as complete locally.
      await save('permissionsGranted', permissionsData);

      Alert.alert('Harika!', 'Kurulum tamamlandı.', [
        { text: 'Devam Et', onPress: () => {
            // Once permissions are granted, simply redirect to ChildTabs. 
            // In App.js/RootNavigator, if we see them, they will naturally be routed correctly.
            navigation.replace(ROUTES.CHILD_TABS);
        }}
      ]);

    } catch (error) {
       console.error(error);
       Alert.alert('Hata', 'İzinler alınırken beklenmedik bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>İzinler Gerekli</Text>
        <Text style={styles.subtitle}>
          Ailenizin sizi güvende tutabilmesi için konumunuza ve acil durumlar için rehberinize erişmemiz gerekiyor.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>• Arka planda konum takibi</Text>
          <Text style={styles.infoText}>• Güvenli alan kontrolleri</Text>
          <Text style={styles.infoText}>• Acil durum rehber senkronizasyonu</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={requestPermissions} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>İzinleri Onayla</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.child.primary },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  icon: { fontSize: 80, marginBottom: SPACING.lg },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.heavy, color: '#fff', marginBottom: SPACING.md },
  subtitle: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, marginHorizontal: SPACING.md },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    width: '100%'
  },
  infoText: { color: '#fff', fontSize: FONTS.sizes.md, marginBottom: SPACING.sm },
  button: {
    backgroundColor: COLORS.child.secondary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
});
