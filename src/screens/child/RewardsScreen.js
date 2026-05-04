import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.child;

const ALL_BADGES = [
  { id: 'first', name: 'İlk Adım', emoji: '🌱', desc: '5 puan kazan', required: 5 },
  { id: 'great', name: 'Harika', emoji: '⭐', desc: '20 puan kazan', required: 20 },
  { id: 'champion', name: 'Şampiyon', emoji: '🏆', desc: '50 puan kazan', required: 50 },
  { id: 'legend', name: 'Efsane', emoji: '💎', desc: '100 puan kazan', required: 100 },
  { id: 'helper', name: 'Yardımsever', emoji: '🤝', desc: 'Tüm görevleri tamamla', required: 999 },
  { id: 'star', name: 'Süper Yıldız', emoji: '🌟', desc: '200 puan kazan', required: 200 },
];

const TIERS = [
  { name: 'Tohum', emoji: '🌱', min: 0, max: 19, color: '#10B981' },
  { name: 'Yıldız', emoji: '⭐', min: 20, max: 49, color: '#F59E0B' },
  { name: 'Şampiyon', emoji: '🏆', min: 50, max: 99, color: '#6366F1' },
  { name: 'Efsane', emoji: '💎', min: 100, max: Infinity, color: '#EC4899' },
];

export default function RewardsScreen() {
  const { points, badges, rewards, rewardRequests, requestReward } = useApp();
  const [tab, setTab] = useState('rewards'); // 'rewards' | 'badges' | 'requests'
  const [requesting, setRequesting] = useState(null);

  const tier = TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const tierProgress = nextTier ? (points - tier.min) / (nextTier.min - tier.min) : 1;

  const handleRequest = async (reward) => {
    if (points < reward.pointCost) {
      Alert.alert('Yeterli Puan Yok', `Bu ödül için ${reward.pointCost} puan gerekli. Şu an ${points} puanın var.`);
      return;
    }
    const alreadyPending = rewardRequests.find(r => r.rewardId === reward.id && r.status === 'pending');
    if (alreadyPending) {
      Alert.alert('Zaten İstendi', 'Bu ödül için zaten bir talebiniz var, aileni onaylamasını bekle.');
      return;
    }
    setRequesting(reward.id);
    try {
      await requestReward(reward.id);
      Alert.alert('Talep Gönderildi! 🎉', `"${reward.title}" için talebiniz ailene iletildi.`);
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setRequesting(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ Ödüllerim</Text>
      </View>

      {/* Puan Kartı */}
      <View style={[styles.pointCard, { backgroundColor: tier.color }]}>
        <Text style={{ fontSize: 52 }}>{tier.emoji}</Text>
        <Text style={styles.pointNum}>{points}</Text>
        <Text style={styles.pointLabel}>Toplam Puan</Text>
        <View style={styles.tierBadge}><Text style={styles.tierTxt}>{tier.name} Seviyesi</Text></View>
        {nextTier && (
          <View style={{ width: '80%', marginTop: SPACING.sm }}>
            <View style={styles.tierBar}>
              <View style={[styles.tierFill, { width: `${tierProgress * 100}%` }]} />
            </View>
            <Text style={styles.tierHint}>{nextTier.min - points} puan daha → {nextTier.emoji} {nextTier.name}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[['rewards', '🎁 Ödüller'], ['requests', '📋 Taleplerim'], ['badges', '🏅 Rozetler']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
            <Text style={[styles.tabTxt, tab === key && styles.tabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Ödüller Tab ── */}
        {tab === 'rewards' && (
          rewards.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 52 }}>🎁</Text>
              <Text style={styles.emptyTxt}>Aile henüz ödül eklemedi</Text>
            </View>
          ) : rewards.map(reward => {
            const canAfford = points >= reward.pointCost;
            const isPending = rewardRequests.find(r => r.rewardId === reward.id && r.status === 'pending');
            return (
              <View key={reward.id} style={[styles.rewardCard, !canAfford && styles.rewardCardLocked]}>
                <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={[styles.rewardCost, canAfford ? { color: '#10B981' } : { color: '#EF4444' }]}>
                    ⭐ {reward.pointCost} puan {canAfford ? '✓' : `(${reward.pointCost - points} eksik)`}
                  </Text>
                </View>
                {isPending ? (
                  <View style={styles.pendingPill}>
                    <Ionicons name="time-outline" size={12} color="#92400E" />
                    <Text style={styles.pendingPillTxt}>Bekliyor</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.requestBtn, !canAfford && styles.requestBtnDisabled]}
                    onPress={() => handleRequest(reward)}
                    disabled={!canAfford || requesting === reward.id}
                  >
                    <Text style={styles.requestBtnTxt}>
                      {requesting === reward.id ? '...' : 'İste'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* ── Talepler Tab ── */}
        {tab === 'requests' && (
          rewardRequests.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 52 }}>📭</Text>
              <Text style={styles.emptyTxt}>Henüz talep göndermedin</Text>
            </View>
          ) : rewardRequests.map(req => {
            const statusInfo = {
              pending: { color: '#F59E0B', bg: '#FFFBEB', label: '⏳ Onay Bekleniyor' },
              approved: { color: '#10B981', bg: '#F0FDF4', label: '✅ Onaylandı' },
              rejected: { color: '#EF4444', bg: '#FEF2F2', label: '❌ Reddedildi' },
            }[req.status] || {};
            return (
              <View key={req.id} style={styles.requestCard}>
                <Text style={{ fontSize: 36 }}>{req.rewardEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardTitle}>{req.rewardTitle}</Text>
                  <Text style={styles.rewardCost}>⭐ {req.pointCost} puan</Text>
                  <View style={[styles.statusPill, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusPillTxt, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* ── Rozetler Tab ── */}
        {tab === 'badges' && ALL_BADGES.map(badge => {
          const earned = badges.find(b => b.id === badge.id);
          return (
            <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeLocked]}>
              <Text style={{ fontSize: 36, opacity: earned ? 1 : 0.3 }}>{badge.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.badgeName, !earned && { color: '#CBD5E1' }]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, !earned && { color: '#CBD5E1' }]}>{badge.desc}</Text>
              </View>
              {earned && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { backgroundColor: C.primary, padding: SPACING.lg, paddingTop: SPACING.xl },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: '#fff' },
  pointCard: {
    margin: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', ...SHADOWS.lg,
  },
  pointNum: { fontSize: 52, fontWeight: FONTS.weights.heavy, color: '#fff', marginTop: 4 },
  pointLabel: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.sm },
  tierBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 4 },
  tierTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },
  tierBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: RADIUS.full, overflow: 'hidden' },
  tierFill: { height: '100%', backgroundColor: '#fff', borderRadius: RADIUS.full },
  tierHint: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: C.primary },
  tabTxt: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },
  tabTxtActive: { color: C.primary },
  scrollContent: { padding: SPACING.lg, paddingBottom: 40 },
  rewardCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md,
    gap: SPACING.md, ...SHADOWS.sm,
  },
  rewardCardLocked: { opacity: 0.7 },
  rewardEmoji: { fontSize: 40 },
  rewardTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: C.text },
  rewardCost: { fontSize: FONTS.sizes.sm, marginTop: 2 },
  requestBtn: {
    backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  requestBtnDisabled: { backgroundColor: '#CBD5E1' },
  requestBtnTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  pendingPillTxt: { fontSize: 11, color: '#92400E', fontWeight: '700' },
  requestCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md,
    gap: SPACING.md, ...SHADOWS.sm,
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: 4 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  badgeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md,
    gap: SPACING.md, ...SHADOWS.sm,
  },
  badgeLocked: { backgroundColor: '#F1F5F9' },
  badgeName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: C.text },
  badgeDesc: { fontSize: FONTS.sizes.xs, color: C.textSecondary },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTxt: { fontSize: FONTS.sizes.md, color: C.textSecondary },
});
