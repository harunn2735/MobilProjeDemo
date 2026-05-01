import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { points, badges } = useApp();
  const tier = TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const nextPts = nextTier ? nextTier.min : null;
  const tierProgress = nextTier ? (points - tier.min) / (nextTier.min - tier.min) : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ Ödüllerim</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Puan Kartı */}
        <View style={[styles.pointCard, { backgroundColor: tier.color }]}>
          <Text style={{ fontSize: 64 }}>{tier.emoji}</Text>
          <Text style={styles.pointNum}>{points}</Text>
          <Text style={styles.pointLabel}>Toplam Puan</Text>
          <View style={styles.tierBadge}><Text style={styles.tierTxt}>{tier.name} Seviyesi</Text></View>
          {nextTier && (
            <View style={{ width: '80%', marginTop: SPACING.md }}>
              <View style={styles.tierBar}>
                <View style={[styles.tierFill, { width: `${tierProgress * 100}%` }]} />
              </View>
              <Text style={styles.tierHint}>{nextTier.min - points} puan daha → {nextTier.emoji} {nextTier.name}</Text>
            </View>
          )}
        </View>

        {/* Rozetler */}
        <Text style={styles.sectionTitle}>🏅 Rozetler</Text>
        <View style={styles.badgeGrid}>
          {ALL_BADGES.map(badge => {
            const earned = badges.find(b => b.id === badge.id);
            return (
              <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeLocked]}>
                <Text style={{ fontSize: 36, opacity: earned ? 1 : 0.3 }}>{badge.emoji}</Text>
                <Text style={[styles.badgeName, !earned && { color: '#CBD5E1' }]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, !earned && { color: '#CBD5E1' }]}>{badge.desc}</Text>
                {earned && <Text style={styles.badgeEarned}>✅ Kazanıldı</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { backgroundColor: C.primary, padding: SPACING.lg, paddingTop: SPACING.xl },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: '#fff' },
  pointCard: {
    margin: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.xxl,
    alignItems: 'center', ...SHADOWS.lg,
  },
  pointNum: { fontSize: 64, fontWeight: FONTS.weights.heavy, color: '#fff', marginTop: SPACING.sm },
  pointLabel: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.md },
  tierBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 6 },
  tierTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
  tierBar: { height: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: RADIUS.full, overflow: 'hidden' },
  tierFill: { height: '100%', backgroundColor: '#fff', borderRadius: RADIUS.full },
  tierHint: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text, padding: SPACING.lg, paddingBottom: SPACING.sm },
  badgeGrid: { 
    flexDirection: 'column', 
    paddingHorizontal: SPACING.lg, 
    gap: SPACING.md, 
    paddingBottom: 32 
  },
  badgeCard: {
    flexDirection: 'row', // ✅ YATAY LAYOUT
    width: '100%',
    backgroundColor: '#fff', 
    borderRadius: RADIUS.xl,
    padding: SPACING.md, 
    alignItems: 'center', 
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  badgeLocked: { backgroundColor: '#F1F5F9' },
  badgeName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: C.text, textAlign: 'center' },
  badgeDesc: { fontSize: FONTS.sizes.xs, color: C.textSecondary, textAlign: 'center' },
  badgeEarned: { fontSize: FONTS.sizes.xs, color: '#10B981', fontWeight: FONTS.weights.semibold },
});
