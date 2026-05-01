import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Linking, StatusBar, ScrollView, Platform, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.child;

const toRad = (v) => (v * Math.PI) / 180;
function getBearing(lat1, lon1, lat2, lon2) {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SafeNavigationScreen() {
  const { safePoints, childProfile, sendPeriodicUpdate } = useApp();
  const [updating, setUpdating] = useState(false);
  const [location, setLocation] = useState(null);
  const [selected, setSelected] = useState(null);
  const [bearing, setBearing] = useState(0);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (safePoints.length > 0 && !selected) setSelected(safePoints[0]);
  }, [safePoints]);

  useEffect(() => {
    if (location && selected) {
      setBearing(getBearing(location.latitude, location.longitude, selected.latitude, selected.longitude));
      setDistance(Math.round(getDistance(location.latitude, location.longitude, selected.latitude, selected.longitude)));
    }
  }, [location, selected]);

  const sortedSafePoints = [...safePoints].sort((a, b) => {
    if (!location) return 0;
    const distA = getDistance(location.latitude, location.longitude, a.latitude, a.longitude);
    const distB = getDistance(location.latitude, location.longitude, b.latitude, b.longitude);
    return distA - distB;
  });

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const handleOpenMaps = (pt) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${pt.latitude},${pt.longitude}`;
    const label = pt.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url);
  };

  const handleSOS = () => {
    Alert.alert('🆘 Yardım Çağır', 'Ailen aranacak. Emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: '📞 Ara!',
        onPress: () => {
          const phone = childProfile?.familyPhone || '112';
          Linking.openURL(`tel:${phone}`);
        },
      },
    ]);
  };

  const getDistanceLabel = (meters) => {
    if (meters < 100) return "🏠 Kapı Komşusu (Çok Yakın)";
    if (meters < 500) return "🚶 Yürüme Mesafesi (5 dk)";
    if (meters < 1000) return "🏃 Biraz Koşmalısın (10 dk)";
    return "🚌 Oldukça Uzak (Otobüs Gerekebilir)";
  };

  const renderSafePoint = ({ item, index }) => {
    const isClosest = index === 0;
    const dist = location ? Math.round(getDistance(location.latitude, location.longitude, item.latitude, item.longitude)) : 0;

    return (
      <View style={[styles.pointCard, isClosest && styles.closestCard]}>
        <View style={styles.pointHeader}>
          <View style={[styles.pointIcon, { backgroundColor: isClosest ? '#FEF3C7' : '#F1F5F9' }]}>
            <Text style={{ fontSize: 32 }}>{item.emoji || '🏠'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.pointName}>{item.name}</Text>
              {isClosest && <View style={styles.closestBadge}><Text style={styles.closestBadgeTxt}>EN YAKIN</Text></View>}
            </View>
            <Text style={[styles.distanceLabel, { color: isClosest ? '#D97706' : '#64748B' }]}>
              {getDistanceLabel(dist)}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {item.phone && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.callBtn]}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.actionBtnTxt}>Ara</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionBtn, styles.goBtn]}
            onPress={() => handleOpenMaps(item)}
          >
            <Ionicons name="map" size={24} color="#fff" />
            <Text style={styles.actionBtnTxt}>Beni Oraya Götür</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🛡️ Güvenli Noktalar</Text>
          <Text style={styles.subtitle}>En yakındaki güvenli yere git</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={[styles.smallBtn, { backgroundColor: updating ? '#CBD5E1' : '#3B82F6' }]} 
            onPress={async () => {
              setUpdating(true);
              await sendPeriodicUpdate();
              Alert.alert('✅ Gönderildi', 'Konumun ailene bildirildi.');
              setTimeout(() => setUpdating(false), 2000);
            }}
            disabled={updating}
          >
            <Ionicons name="location" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedSafePoints}
        keyExtractor={item => item.id}
        renderItem={renderSafePoint}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 64 }}>📍</Text>
            <Text style={styles.emptyTxt}>Henüz güvenli nokta eklenmemiş.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 20
  },
  title: { fontSize: 26, fontWeight: '900', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  sosButton: { 
    backgroundColor: '#EF4444', width: 64, height: 64, borderRadius: 32, 
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)'
  },
  sosText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  smallBtn: { 
    width: 64, height: 64, borderRadius: 32, 
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.md,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)'
  },
  pointCard: { 
    backgroundColor: '#fff', borderRadius: 28, padding: SPACING.lg, marginBottom: SPACING.lg, 
    borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.sm 
  },
  closestCard: { borderColor: '#F59E0B', borderWidth: 2.5, backgroundColor: '#FFFBEB', ...SHADOWS.md },
  pointHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  pointIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pointName: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  distanceLabel: { fontSize: 15, fontWeight: '600' },
  closestBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  closestBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 20, ...SHADOWS.sm },
  callBtn: { backgroundColor: '#10B981' },
  goBtn: { backgroundColor: '#3B82F6' },
  actionBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyTxt: { fontSize: 18, color: '#64748B', marginTop: 16, fontWeight: '600' },
});
