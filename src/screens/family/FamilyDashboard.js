import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRoutines } from '../../context/RoutineContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../constants/routes';

const C = COLORS.family;

export default function FamilyDashboard() {
  const { childProfile, geofence, safePoints, alerts, points, logout, familyData, liveChildLocation, sendPeriodicUpdate } = useApp();
  const { todayCompleted, todayTotal } = useRoutines();
  const navigation = useNavigation();
  const progress = todayTotal > 0 ? todayCompleted / todayTotal : 0;

  const stats = [
    { label: 'Güvenli Nokta', value: safePoints.length, icon: 'location', color: C.accent },
    { label: 'Bugün Tamamlanan', value: `${todayCompleted}/${todayTotal}`, icon: 'checkmark-circle', color: C.primary },
    { label: 'Toplam Puan', value: points, icon: 'star', color: '#F59E0B' },
    { label: 'Uyarı', value: alerts.length, icon: 'notifications', color: C.danger },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba 👋</Text>
            <Text style={styles.childName}>{childProfile?.name || 'Çocuk'} ile Birlikte</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Pairing Code Banner */}
        {familyData?.pairingCode && (
          <View style={styles.pairingBanner}>
            <Ionicons name="key" size={24} color="#fff" />
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.pairingTitle}>Cihaz Eşleştirme Kodu</Text>
              <Text style={styles.pairingDesc}>Çocuğunuzun uygulamasından bu kodu girerek bağlanabilirsiniz.</Text>
            </View>
            <Text style={styles.pairingCodeTxt}>{familyData.pairingCode}</Text>
          </View>
        )}

        {/* Canlı Durum Özeti */}
        <View style={styles.liveCard}>
          <View style={styles.liveHeader}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveTitle}>Canlı Durum</Text>
            </View>
            <TouchableOpacity onPress={sendPeriodicUpdate} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color={C.accent} />
              <Text style={styles.refreshTxt}>Yenile</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.liveContent}>
            <View style={styles.liveMain}>
              <Ionicons name="location" size={24} color={C.accent} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.liveLocLabel}>Şu an burada:</Text>
                <Text style={styles.liveLocValue} numberOfLines={1}>
                  {liveChildLocation?.address || 'Konum bekleniyor...'}
                </Text>
              </View>
            </View>
            <View style={styles.liveStats}>
               <View style={styles.liveStatItem}>
                 <Ionicons 
                    name={liveChildLocation?.batteryLevel > 20 ? "battery-charging" : "battery-dead"} 
                    size={18} 
                    color={liveChildLocation?.batteryLevel > 20 ? C.accent : C.danger} 
                  />
                 <Text style={styles.liveStatTxt}>%{liveChildLocation?.batteryLevel || 0}</Text>
               </View>
               <View style={styles.liveSeparator} />
               <View style={styles.liveStatItem}>
                 <Ionicons name="time-outline" size={18} color={C.textSecondary} />
                 <Text style={styles.liveStatTxt}>
                   {liveChildLocation?.timestamp ? new Date(liveChildLocation.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                 </Text>
               </View>
            </View>
          </View>
        </View>

        {/* Geofence Durum */}
        <View style={[styles.statusCard, { borderColor: geofence ? C.accent : C.warning }]}>
          <Ionicons
            name={geofence ? 'shield-checkmark' : 'warning'}
            size={36}
            color={geofence ? C.accent : C.warning}
          />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.statusTitle}>
              {geofence ? '✅ Güvenli Alan Aktif' : '⚠️ Güvenli Alan Tanımlanmadı'}
            </Text>
            <Text style={styles.statusDesc}>
              {geofence
                ? `Yarıçap: ${geofence.radius}m`
                : 'Lütfen haritadan güvenli alan belirleyin'}
            </Text>
          </View>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={[styles.statCard, { borderTopColor: stat.color, borderTopWidth: 3 }]}>
              <Ionicons name={stat.icon} size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Günlük İlerleme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Günlük İlerleme</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{todayCompleted} / {todayTotal} görev tamamlandı</Text>
        </View>

        {/* Hızlı Erişim */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'Güvenli Alan', icon: 'map', route: 'GeofenceMap', color: C.primary },
              { label: 'Rutin Ekle', icon: 'add-circle', route: 'AddRoutine', color: C.accent },
              { label: 'Güvenli Noktalar', icon: 'location', route: 'SafePoints', color: '#8B5CF6' },
              { label: 'Uyarı Geçmişi', icon: 'notifications', route: 'AlertHistory', color: C.danger },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickCard}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingTop: SPACING.xl,
  },
  greeting: { fontSize: FONTS.sizes.sm, color: C.textSecondary },
  childName: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text },
  logoutBtn: { padding: SPACING.sm },
  pairingBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary,
    margin: SPACING.lg, marginTop: 0, padding: SPACING.lg, borderRadius: RADIUS.lg, ...SHADOWS.md
  },
  pairingTitle: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
  pairingDesc: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs, marginTop: 2 },
  pairingCodeTxt: { color: '#fff', fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.heavy, letterSpacing: 2 },
  
  liveCard: {
    backgroundColor: C.surface, margin: SPACING.lg, marginTop: 0,
    borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.md,
    borderWidth: 1, borderColor: C.border,
  },
  liveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginRight: 8 },
  liveTitle: { fontSize: 13, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  refreshTxt: { fontSize: 11, fontWeight: '700', color: C.accent },
  liveContent: { gap: 12 },
  liveMain: { flexDirection: 'row', alignItems: 'center' },
  liveLocLabel: { fontSize: 11, color: C.textSecondary },
  liveLocValue: { fontSize: 15, fontWeight: '700', color: C.text, marginTop: 2 },
  liveStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.background, padding: 10, borderRadius: RADIUS.lg },
  liveStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  liveStatTxt: { fontSize: 13, fontWeight: '600', color: C.text },
  liveSeparator: { width: 1, height: 20, backgroundColor: C.border },

  statusCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, margin: SPACING.lg, marginTop: 0,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1.5, ...SHADOWS.sm,
  },
  statusTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: C.text },
  statusDesc: { fontSize: FONTS.sizes.sm, color: C.textSecondary, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: C.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm,
  },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text, marginTop: 4 },
  statLabel: { fontSize: FONTS.sizes.xs, color: C.textSecondary, marginTop: 2, textAlign: 'center' },
  section: { padding: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: C.text, marginBottom: SPACING.md },
  progressBar: { height: 12, backgroundColor: C.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: RADIUS.full },
  progressText: { fontSize: FONTS.sizes.sm, color: C.textSecondary, marginTop: SPACING.sm },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickCard: {
    flex: 1, minWidth: '45%', backgroundColor: C.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm,
  },
  quickIcon: { width: 52, height: 52, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  quickLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: C.text, textAlign: 'center' },
});
