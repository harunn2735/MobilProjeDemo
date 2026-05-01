import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines } from '../../context/RoutineContext';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.child;
const CARD_COLORS = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#EF4444'];

const MILESTONE_BADGES = [
  { id: 'first', points: 5, name: 'İlk Adım', emoji: '🌱' },
  { id: 'great', points: 20, name: 'Harika', emoji: '⭐' },
  { id: 'champion', points: 50, name: 'Şampiyon', emoji: '🏆' },
  { id: 'legend', points: 100, name: 'Efsane', emoji: '💎' },
];

export default function RoutineTrackScreen() {
  const { routines, completeRoutine } = useRoutines();
  const { addPoints, points, unlockBadge, updateStreak } = useApp();
  const [celebration, setCelebration] = useState(null);

  const handleComplete = async (item) => {
    if (item.completed) return;
    const earnedPts = await completeRoutine(item.id);
    const newTotal = await addPoints(earnedPts);
    setCelebration({ title: item.title, emoji: item.emoji, points: earnedPts });

    // Streak Kontrolü
    const isLastOne = routines.filter(r => !r.completed).length === 1;
    if (isLastOne) {
      await updateStreak(true);
    }

    // Rozet kontrolü
    MILESTONE_BADGES.forEach(badge => {
      if (newTotal >= badge.points) unlockBadge(badge.id, badge.name, badge.emoji);
    });

    setTimeout(() => setCelebration(null), 2000);
  };

  const renderItem = ({ item, index }) => {
    const color = CARD_COLORS[index % CARD_COLORS.length];
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }, item.completed && styles.cardDone]}
        onPress={() => handleComplete(item)}
        activeOpacity={0.8}
        disabled={item.completed}
      >
        <View style={[styles.emojiWrap, { backgroundColor: color + '20' }]}>
          <Text style={{ fontSize: 34 }}>{item.emoji || '📋'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, item.completed && styles.cardTitleDone]}>{item.title}</Text>
          <Text style={styles.cardPts}>{'⭐'.repeat(item.points || 1)} {item.points} puan</Text>
        </View>
        <View style={[styles.checkCircle, item.completed && { backgroundColor: '#10B981' }]}>
          <Ionicons name={item.completed ? 'checkmark' : 'ellipse-outline'} size={24} color={item.completed ? '#fff' : '#CBD5E1'} />
        </View>
      </TouchableOpacity>
    );
  };

  const done = routines.filter(r => r.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={styles.header}>
        <Text style={styles.title}>✅ Görevlerim</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{done}/{routines.length}</Text>
        </View>
      </View>

      <FlatList
        data={routines}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>📝</Text>
            <Text style={styles.emptyTxt}>Aile henüz görev eklemedi</Text>
          </View>
        }
      />

      {/* Kutlama Modal */}
      <Modal visible={!!celebration} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={[styles.modalBox, { borderColor: C.primary, borderWidth: 3 }]}>
            <Text style={{ fontSize: 100 }}>🎉</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <Text style={{ fontSize: 40 }}>{celebration?.emoji}</Text>
              <Text style={{ fontSize: 40 }}>🌟</Text>
              <Text style={{ fontSize: 40 }}>{celebration?.emoji}</Text>
            </View>
            <Text style={styles.modalTitle}>HARİKA İŞ! 🚀</Text>
            <Text style={styles.modalSub}>{celebration?.title}</Text>
            <View style={styles.ptsBadge}>
               <Text style={styles.modalPts}>+{celebration?.points} ⭐ PUAN</Text>
            </View>
            <Text style={{ fontSize: 18, color: C.textSecondary, fontWeight: '600' }}>Süpersin, böyle devam et! 💪</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.primary, padding: SPACING.lg, paddingTop: SPACING.xl,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: '#fff' },
  badge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  badgeTxt: { color: '#fff', fontWeight: FONTS.weights.bold },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.md,
  },
  cardDone: { opacity: 0.6 },
  emojiWrap: { width: 58, height: 58, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: C.text },
  cardTitleDone: { textDecorationLine: 'line-through', color: C.textSecondary },
  cardPts: { fontSize: FONTS.sizes.sm, color: C.textSecondary, marginTop: 2 },
  checkCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACING.md },
  emptyTxt: { fontSize: FONTS.sizes.lg, color: C.textSecondary },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', ...SHADOWS.lg, gap: SPACING.sm },
  modalTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.heavy, color: C.text },
  modalSub: { fontSize: FONTS.sizes.md, color: C.textSecondary },
  modalPts: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: '#fff' },
  ptsBadge: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full, marginVertical: 10 },
});
