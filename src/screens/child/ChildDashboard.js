import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { useRoutines } from '../../context/RoutineContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

const C = COLORS.child;

export default function ChildDashboard() {
  const { childProfile, points, badges, familyData, updateAvatar, streak, logout } = useApp();
  const { routines, todayCompleted, todayTotal } = useRoutines();
  const navigation = useNavigation();
  const progress = todayTotal > 0 ? todayCompleted / todayTotal : 0;
  const next = routines.find(r => !r.completed);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Günaydın! ☀️';
    if (h < 18) return 'İyi günler! 🌤️';
    return 'İyi akşamlar! 🌙';
  };

  const renderStatusCard = () => {
    const loc = familyData?.childLocation;
    const isOutside = loc?.geofenceStatus === 'outside';

    if (isOutside) {
      return (
        <View style={[styles.statusCard, { backgroundColor: COLORS.family.danger }]}>
          <Text style={styles.statusEmoji}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Bölge Dışındasın!</Text>
            <Text style={styles.statusDesc}>Lütfen güvenli alana geri dön.</Text>
          </View>
          <Ionicons name="warning" size={24} color="#fff" />
        </View>
      );
    }

    return (
      <View style={[styles.statusCard, { backgroundColor: '#10B981' }]}>
        <Text style={styles.statusEmoji}>✅</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>Güvendesin</Text>
          <Text style={styles.statusDesc}>Her şey harika görünüyor!</Text>
        </View>
        <Ionicons name="shield-checkmark" size={24} color="#fff" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Animated Hero Background */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.heroInner}>
             <Text style={styles.heroEmoji}>{childProfile?.avatar || '🦁'}</Text>

             <Text style={styles.heroGreeting}>{getGreeting()}</Text>
             <Text style={styles.heroName}>{childProfile?.name || 'Kahraman'}</Text>

             {streak >= 3 && (
               <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={16} color="#F97316" />
                  <Text style={styles.streakTxt}>{streak} GÜN</Text>
               </View>
             )}

             {/* Avatar Seçimi */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPicker}>
                 {['🦁', '🦄', '🐱', '🐰', '🐼', '🦊', '🐨', '🦋', '🦅', '🐺'].map(emoji => (
                    <TouchableOpacity 
                      key={emoji} 
                      style={[styles.avatarBtn, childProfile?.avatar === emoji && { backgroundColor: 'rgba(255,255,255,0.4)' }]}
                      onPress={() => updateAvatar(emoji)}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </TouchableOpacity>
                 ))}
              </ScrollView>
          </View>
        </View>

        {/* Canlı Durum / Misyon Kartı */}
        <View style={{ marginTop: -SPACING.xl }}>
          {renderStatusCard()}
        </View>

        {/* Aksiyon Butonları (Geri Getirilenler) */}
        <View style={styles.actionGrid}>
           <TouchableOpacity 
             style={[styles.actionBox, { backgroundColor: '#8B5CF6' }]} 
             onPress={() => navigation.navigate(ROUTES.ROUTINE_TRACK)}
           >
              <Ionicons name="list" size={32} color="#fff" />
              <Text style={styles.actionBoxTxt}>Görevlerim</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.actionBox, { backgroundColor: '#3B82F6' }]} onPress={() => navigation.navigate(ROUTES.SAFE_NAVIGATION)}>
              <Ionicons name="map" size={32} color="#fff" />
              <Text style={styles.actionBoxTxt}>Güvenli Yerler</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.actionBox, { backgroundColor: '#EF4444' }]} 
             onPress={() => {
                const phone = childProfile?.familyPhone || '112';
                Linking.openURL(`tel:${phone}`);
             }}
           >
              <Ionicons name="call" size={32} color="#fff" />
              <Text style={styles.actionBoxTxt}>Acil Yardım</Text>
           </TouchableOpacity>
        </View>

        {/* Oyun Alanı Pulsing Card */}
        <TouchableOpacity 
          style={styles.gameCard} 
          onPress={() => navigation.navigate(ROUTES.GAME_ZONE)}
          activeOpacity={0.9}
        >
          <View style={styles.gameIconBox}>
             <Text style={{ fontSize: 32 }}>🎮</Text>
          </View>
          <View style={{ flex: 1 }}>
             <Text style={styles.gameTitle}>Oyun Alanı</Text>
             <Text style={styles.gameSub}>Yıldızları yakala, bonus puan kazan!</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>

        {/* İlerleme */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Bugünkü Görevler</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressTxt}>{todayCompleted} / {todayTotal} görev tamamlandı 🎉</Text>
        </View>

        {/* Sıradaki Görev + Aktif Hatırlatıcı */}
        {familyData?.activeReminder ? (
          <TouchableOpacity 
            style={[styles.nextCard, { borderColor: C.danger, borderWidth: 3 }]}
            onPress={() => navigation.navigate(ROUTES.ROUTINE_TRACK)}
          >
             <View style={styles.alertIconBox}>
                <Text style={{ fontSize: 32 }}>⏰</Text>
             </View>
             <View style={{ flex: 1 }}>
               <Text style={[styles.nextLabel, { color: C.danger, fontWeight: '800' }]}>HAREKETE GEÇ! 🚀</Text>
               <Text style={styles.nextTitle}>{familyData.activeReminder.title}</Text>
               <Text style={styles.reminderDesc}>
                 {familyData.activeReminder.duration > 0 ? 
                   `${familyData.activeReminder.duration} dakika içinde yapmalısın!` : 
                   'Bu görevi şimdi yapmalısın!'}
               </Text>
             </View>
             <Ionicons name="play-circle" size={40} color={C.danger} />
          </TouchableOpacity>
        ) : next ? (
          <TouchableOpacity style={styles.nextCard} onPress={() => navigation.navigate(ROUTES.ROUTINE_TRACK)} activeOpacity={0.85}>
            <Text style={{ fontSize: 40 }}>{next.emoji}</Text>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.nextLabel}>Sıradaki Görev</Text>
              <Text style={styles.nextTitle}>{next.title}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={C.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.allDoneCard}>
             <Text style={{ fontSize: 48 }}>🌟</Text>
             <Text style={styles.allDoneTitle}>Tüm Görevler Bitti!</Text>
             <Text style={styles.allDoneSub}>Bugün harikaydın kahraman!</Text>
          </View>
        )}

        {/* Rozetler */}
        {badges.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Kazandığın Rozetler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
              {badges.map(b => (
                <View key={b.id} style={styles.badgeLarge}>
                  <Text style={{ fontSize: 32 }}>{b.emoji}</Text>
                  <Text style={styles.badgeLargeTxt}>{b.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  hero: {
    backgroundColor: C.primary,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    paddingTop: 60, paddingBottom: 60,
    alignItems: 'center',
    ...SHADOWS.lg
  },
  logoutBtn: {
    position: 'absolute', top: 52, right: 20,
    padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroInner: { alignItems: 'center', width: '100%' },
  heroEmoji: { fontSize: 84, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 10 },
  moodBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, gap: 6, marginTop: -8 
  },
  moodDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80' },
  moodTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  
  heroGreeting: { fontSize: 16, color: '#E9D5FF', marginTop: 14, fontWeight: '700' },
  heroName: { fontSize: 42, fontWeight: '900', color: '#fff', marginTop: 2, marginBottom: 12 },
  
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FB923C', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 10, gap: 8, ...SHADOWS.md, marginBottom: 10 },
  streakTxt: { color: '#fff', fontWeight: '900', fontSize: 18 },

  missionCard: { marginHorizontal: SPACING.lg, borderRadius: 32, padding: SPACING.xl, ...SHADOWS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  missionPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  missionTag: { color: '#EF4444', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  missionTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 20 },
  missionGoalRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.08)', padding: SPACING.md, borderRadius: RADIUS.xl, marginBottom: 24 },
  missionGoalName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  missionGoalAddr: { color: '#A78BFA', fontSize: 13, fontWeight: '600', marginTop: 2 },
  navBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#3B82F6', paddingVertical: 18, borderRadius: 20, ...SHADOWS.md },
  navBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },

  statusCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.md, ...SHADOWS.md },
  statusEmoji: { fontSize: 32 },
  statusTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  statusDesc: { color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '600' },

  actionGrid: { flexDirection: 'row', margin: SPACING.lg, gap: SPACING.md },
  actionBox: { flex: 1, height: 100, borderRadius: 24, padding: SPACING.md, justifyContent: 'center', alignItems: 'center', gap: 8, ...SHADOWS.md },
  actionBoxTxt: { color: '#fff', fontWeight: '900', fontSize: 13, textAlign: 'center' },

  gameCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C3AED', 
    margin: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.lg, 
    gap: SPACING.md, ...SHADOWS.lg, borderWidth: 1, borderColor: '#8B5CF6' 
  },
  gameIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.lg, padding: 10 },
  gameTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  gameSub: { color: '#E9D5FF', fontSize: 13, fontWeight: '600' },

  card: { backgroundColor: '#fff', margin: SPACING.lg, marginBottom: 0, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.md },
  cardTitle: { fontSize: 18, fontWeight: '900', color: C.text, marginBottom: 12 },
  progressBar: { height: 16, backgroundColor: '#F3E8FF', borderRadius: RADIUS.full, overflow: 'hidden', marginVertical: 8 },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: RADIUS.full },
  progressTxt: { fontSize: 13, color: C.textSecondary, fontWeight: '600' },

  nextCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: SPACING.lg, marginBottom: 0, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.md, gap: SPACING.md },
  nextLabel: { fontSize: 12, color: C.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  nextTitle: { fontSize: 20, fontWeight: '900', color: C.text, marginTop: 2 },
  reminderDesc: { fontSize: 14, color: C.danger, fontWeight: '700', marginTop: 4 },
  alertIconBox: { backgroundColor: '#FEE2E2', borderRadius: RADIUS.lg, padding: 12 },

  allDoneCard: { alignItems: 'center', backgroundColor: '#fff', margin: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.xxl, ...SHADOWS.md },
  allDoneTitle: { fontSize: 22, fontWeight: '900', color: '#10B981', marginTop: 12 },
  allDoneSub: { fontSize: 14, color: C.textSecondary, marginTop: 4 },

  badgeLarge: { alignItems: 'center', backgroundColor: '#FAF5FF', borderRadius: RADIUS.xl, padding: SPACING.md, width: 100, borderWidth: 1, borderColor: '#E9D5FF' },
  badgeLargeTxt: { fontSize: 10, fontWeight: '800', color: C.text, marginTop: 8, textAlign: 'center' },
  avatarPicker: { flexDirection: 'row', marginTop: 15, gap: 10 },
  avatarBtn: { backgroundColor: 'rgba(255,255,255,0.15)', width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
});
