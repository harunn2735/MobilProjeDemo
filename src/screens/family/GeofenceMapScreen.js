import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Circle, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.family;

export default function GeofenceMapScreen() {
  const { geofence, saveGeofence, safePoints, addSafePoint, liveChildLocation, childProfile } = useApp();
  const mapRef = useRef(null);
  const [showFamily, setShowFamily] = useState(true);
  const [center, setCenter] = useState(
    geofence ? { latitude: geofence.latitude, longitude: geofence.longitude } : null
  );
  const [radius, setRadius] = useState(geofence?.radius || 300);
  const [mode, setMode] = useState('geofence'); // 'geofence' | 'safepoint'
  const [addressControl, setAddressControl] = useState({ address: '', name: '', phone: '', loading: false });

  const [region, setRegion] = useState({
    latitude: geofence?.latitude || 41.0082,
    longitude: geofence?.longitude || 28.9784,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    getLocation();
    // Odaklanma: Eğer çocuk konumu varsa ona git
    if (liveChildLocation) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: liveChildLocation.latitude,
          longitude: liveChildLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 1000);
      }, 500);
    }
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setRegion({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    if (!center) setCenter(coords);
  };

  const handleAddSafePointByAddress = async () => {
    if (!addressControl.address || !addressControl.name) {
      Alert.alert('Eksik Bilgi', 'Lütfen en azından adres ve isim alanlarını doldurun.');
      return;
    }
    setAddressControl(prev => ({ ...prev, loading: true }));
    try {
      const results = await Location.geocodeAsync(addressControl.address);
      if (results.length > 0) {
        const coords = results[0];
        addSafePoint({
          name: addressControl.name,
          phone: addressControl.phone,
          address: addressControl.address,
          emoji: '📍',
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setAddressControl({ address: '', name: '', phone: '', loading: false });
        mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        Alert.alert('✅ Başarılı', 'Güvenli nokta adres üzerinden eklendi.');
      } else {
        Alert.alert('Hata', 'Adres bulunamadı. Lütfen daha detaylı yazın.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Adres sorgulama başarısız oldu.');
    } finally {
      setAddressControl(prev => ({ ...prev, loading: false }));
    }
  };

  const [lockCenter, setLockCenter] = useState(true);

  const onMapPress = (e) => {
    if (mode === 'geofence' && !lockCenter) {
      setCenter(e.nativeEvent.coordinate);
    }
  };

  const handleSave = async () => {
    if (!center) {
      Alert.alert('Uyarı', 'Haritaya dokunarak merkez noktayı belirleyin.');
      return;
    }
    await saveGeofence({ latitude: center.latitude, longitude: center.longitude, radius });
    setLockCenter(true);
    Alert.alert('✅ Kaydedildi', `Güvenli alan ${radius}m yarıçapıyla kaydedildi.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Status Indicators */}
        <View style={styles.statusRow}>
          <View style={[styles.statusItem, { backgroundColor: liveChildLocation?.geofenceStatus === 'outside' ? '#FEE2E2' : '#DCFCE7' }]}>
            <Text style={[styles.statusItemTxt, { color: liveChildLocation?.geofenceStatus === 'outside' ? '#EF4444' : '#10B981' }]}>
              {liveChildLocation?.geofenceStatus === 'outside' ? '🚨 Alan Dışında' : '🛡️ Alan İçinde'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="battery-charging" size={16} color="#64748B" />
            <Text style={styles.statusItemTxt}>%{liveChildLocation?.batteryLevel || 0}</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Akıllı Takip</Text>
          <View style={styles.modeRow}>
            {['geofence', 'safepoint'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeBtnTxt, mode === m && { color: '#fff' }]}>
                  {m === 'geofence' ? 'Alan' : 'Adres Ekle'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={region}
            onPress={onMapPress}
            showsUserLocation={showFamily}
          >
            {center && (
              <>
                <Marker coordinate={center} pinColor={lockCenter ? '#94A3B8' : C.primary} title="Merkez" draggable={!lockCenter} onDragEnd={(e) => setCenter(e.nativeEvent.coordinate)} />
                <Circle center={center} radius={radius} fillColor={lockCenter ? "rgba(148,163,184,0.1)" : "rgba(37,99,235,0.12)"} strokeColor={lockCenter ? "#94A3B8" : C.primary} strokeWidth={2} />
              </>
            )}
            
            {safePoints.map(pt => (
              <Marker key={pt.id} coordinate={{ latitude: pt.latitude, longitude: pt.longitude }} title={pt.name} description={pt.phone}>
                <View style={styles.safeMarker}><Text style={{ fontSize: 24 }}>{pt.emoji || '📍'}</Text></View>
              </Marker>
            ))}

            {liveChildLocation && (
               <Marker 
                 coordinate={{ latitude: liveChildLocation.latitude, longitude: liveChildLocation.longitude }}
                 title={childProfile?.name || 'Çocuk'}
                 zIndex={999}
               >
                 <View style={styles.childMarker}>
                    <View style={[styles.childMarkerInner, { borderColor: liveChildLocation.geofenceStatus === 'outside' ? '#EF4444' : (liveChildLocation.status === 'moving' ? C.primary : '#94A3B8') }]}>
                        <Text style={{ fontSize: 24 }}>{childProfile?.avatar || '🦁'}</Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: liveChildLocation.geofenceStatus === 'outside' ? '#EF4444' : (liveChildLocation.status === 'moving' ? C.primary : '#64748B') }]}>
                       <Text style={styles.statusText}>
                         {liveChildLocation.geofenceStatus === 'outside' ? '🚨 DIŞARIDA' : (liveChildLocation.status === 'moving' ? '🏃 Hareketli' : '📍 Duruyor')}
                       </Text>
                    </View>
                 </View>
               </Marker>
            )}
          </MapView>

          <TouchableOpacity 
            style={[styles.floatingToggle, { backgroundColor: showFamily ? C.primary : '#fff' }]}
            onPress={() => setShowFamily(!showFamily)}
          >
            <Ionicons name={showFamily ? 'eye' : 'eye-off'} size={24} color={showFamily ? '#fff' : C.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.bottomScroll} 
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.bottom, { minHeight: 180 }]}>
            {mode === 'geofence' ? (
              <View key="geofence-view">
                <View style={styles.zoneHeader}>
                   <Text style={styles.label}>🏠 Güvenli Bölge Ayarı</Text>
                   <TouchableOpacity onPress={() => setLockCenter(!lockCenter)} style={[styles.lockBtn, !lockCenter && styles.lockBtnActive]}>
                     <Ionicons name={lockCenter ? "lock-closed" : "lock-open"} size={14} color={lockCenter ? "#64748B" : "#fff"} />
                     <Text style={[styles.lockBtnTxt, !lockCenter && { color: "#fff" }]}>{lockCenter ? "Konumu Değiştir" : "Konumu Seç..."}</Text>
                   </TouchableOpacity>
                </View>
                <View style={styles.sliderRow}>
                  {[
                    { r: 100, l: 'Bina' },
                    { r: 300, l: 'Mahalle' },
                    { r: 1000, l: 'Geniş' },
                    { r: 3000, l: 'Şehir' }
                  ].map(item => (
                    <TouchableOpacity key={item.r} style={[styles.rBtn, radius === item.r && styles.rBtnActive]} onPress={() => setRadius(item.r)}>
                       <Text style={[styles.rBtnLabel, radius === item.r && { color: 'rgba(255,255,255,0.7)' }]}>{item.l}</Text>
                       <Text style={[styles.rBtnTxt, radius === item.r && { color: '#fff' }]}>{item.r >= 1000 ? `${item.r/1000}km` : `${item.r}m`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.saveBtn, lockCenter && { opacity: 0.5 }]} onPress={handleSave} disabled={lockCenter}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.saveBtnTxt}>Değişiklikleri Onayla</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View key="safepoint-view">
                 <Text style={styles.label}>🏠 Yeni Güvenli Adres Tanımla</Text>
                 <TextInput 
                    style={styles.addressInput}
                    placeholder="Tam Adres (Mahalle, Sokak, Kapı No...)"
                    value={addressControl.address}
                    onChangeText={t => setAddressControl(p => ({ ...p, address: t }))}
                 />
                 <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TextInput 
                       style={[styles.addressInput, { flex: 1 }]}
                       placeholder="İsim (Örn: Anneanne)"
                       value={addressControl.name}
                       onChangeText={t => setAddressControl(p => ({ ...p, name: t }))}
                    />
                    <TextInput 
                       style={[styles.addressInput, { flex: 1 }]}
                       placeholder="Telefon No"
                       keyboardType="phone-pad"
                       value={addressControl.phone}
                       onChangeText={t => setAddressControl(p => ({ ...p, phone: t }))}
                    />
                 </View>
                 <TouchableOpacity 
                    style={[styles.saveBtn, { marginTop: 12, opacity: addressControl.loading ? 0.6 : 1 }]} 
                    onPress={handleAddSafePointByAddress}
                    disabled={addressControl.loading}
                 >
                   <Text style={styles.saveBtnTxt}>{addressControl.loading ? 'Sorgulanıyor...' : 'Adresi Güvenli Nokta Yap'}</Text>
                 </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  statusRow: { 
    flexDirection: 'row', gap: 10, paddingHorizontal: SPACING.lg, paddingVertical: 8, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
  },
  statusItem: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, backgroundColor: '#F8FAFC' 
  },
  statusItemTxt: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  alertBanner: { backgroundColor: '#EF4444', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  alertText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: C.surface, ...SHADOWS.sm,
  },
  title: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: C.text },
  modeRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: RADIUS.full, padding: 3 },
  modeBtn: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  modeBtnActive: { backgroundColor: C.primary },
  modeBtnTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: C.textSecondary },
  bottom: { backgroundColor: C.surface, padding: SPACING.lg, paddingBottom: SPACING.xl, ...SHADOWS.lg },
  label: { fontSize: FONTS.sizes.md, color: C.text, marginBottom: SPACING.sm },
  subLabel: { fontSize: FONTS.sizes.xs, color: C.textSecondary, marginTop: 4 },
  addressInput: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg, gap: 8 },
  rBtn: { 
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC'
  },
  rBtnActive: { backgroundColor: C.primary, borderColor: C.primary, ...SHADOWS.md },
  rBtnLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginBottom: 2 },
  rBtnTxt: { fontSize: 14, fontWeight: '700', color: '#475569' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: C.primary, borderRadius: RADIUS.xl, paddingVertical: SPACING.lg, ...SHADOWS.md
  },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  safeMarker: { backgroundColor: '#fff', borderRadius: RADIUS.full, padding: 4, ...SHADOWS.sm },
  childMarker: { alignItems: 'center', justifyContent: 'center' },
  childMarkerInner: {
    backgroundColor: '#fff', borderRadius: RADIUS.full, padding: 4,
    borderWidth: 3, ...SHADOWS.md, position: 'relative'
  },
  batteryBadge: {
    position: 'absolute', right: -10, top: -10,
    backgroundColor: '#10B981', borderRadius: RADIUS.sm,
    paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1, borderColor: '#fff'
  },
  batteryText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statusTag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full,
    marginTop: 4, ...SHADOWS.sm
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  floatingToggle: {
    position: 'absolute', right: SPACING.lg, top: SPACING.lg,
    width: 48, height: 48, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg
  },
  zoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  zoneBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  zoneBadgeText: { color: C.primary, fontSize: 10, fontWeight: '700' },
  lockBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderSize: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' 
  },
  lockBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  lockBtnTxt: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  bottomScroll: { maxHeight: 300, backgroundColor: C.surface },
});
