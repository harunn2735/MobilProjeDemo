import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRoutines } from '../../context/RoutineContext';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

const C = COLORS.child;
const CARD_COLORS = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#EF4444'];

export default function RoutineTrackScreen() {
  const { routines } = useRoutines();
  const { taskSubmissions } = useApp();
  const navigation = useNavigation();

  // Find the latest submission for each routine
  const getSubmission = (routineId) =>
    taskSubmissions
      .filter(s => s.routineId === routineId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];

  const handleTakePhoto = (item) => {
    navigation.navigate(ROUTES.TASK_PHOTO, { routine: item });
  };

  const renderItem = ({ item, index }) => {
    const color = CARD_COLORS[index % CARD_COLORS.length];
    const submission = getSubmission(item.id);
    const isPending = item.pendingPhoto && submission?.status === 'pending';
    const isRejected = submission?.status === 'rejected' && !item.completed;
    const isDone = item.completed;

    return (
      <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }, isDone && styles.cardDone]}>
        <View style={[styles.emojiWrap, { backgroundColor: color + '20' }]}>
          <Text style={{ fontSize: 34 }}>{item.emoji || '📋'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>{item.title}</Text>
          <Text style={styles.cardPts}>{'⭐'.repeat(Math.min(item.points || 1, 5))} {item.points} puan</Text>

          {/* State badge */}
          {isPending && (
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={12} color="#F59E0B" />
              <Text style={[styles.statusTxt, { color: '#F59E0B' }]}>Onay Bekleniyor</Text>
            </View>
          )}
          {isRejected && (
            <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle-outline" size={12} color="#EF4444" />
              <Text style={[styles.statusTxt, { color: '#EF4444' }]}>Reddedildi — Tekrar Çek</Text>
            </View>
          )}
        </View>

        {/* Right side action */}
        {isDone ? (
          <View style={[styles.checkCircle, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark" size={24} color="#fff" />
          </View>
        ) : isPending ? (
          <View style={[styles.checkCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.photoBtn, { backgroundColor: color }]}
            onPress={() => handleTakePhoto(item)}
          >
            <Ionicons name="camera" size={18} color="#fff" />
            <Text style={styles.photoBtnTxt}>
              {isRejected ? 'Tekrar' : 'Kanıtla'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const done = routines.filter(r => r.completed).length;
  const pending = routines.filter(r => r.pendingPhoto && !r.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={styles.header}>
        <Text style={styles.title}>✅ Görevlerim</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{done}/{routines.length}</Text>
        </View>
      </View>

      {pending > 0 && (
        <View style={styles.pendingBanner}>
          <Ionicons name="time-outline" size={16} color="#92400E" />
          <Text style={styles.pendingBannerTxt}>
            {pending} görev onay bekliyor — aileni beklemeye devam et! ⏳
          </Text>
        </View>
      )}

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
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
  },
  badgeTxt: { color: '#fff', fontWeight: FONTS.weights.bold },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  pendingBannerTxt: { fontSize: FONTS.sizes.sm, color: '#92400E', fontWeight: '600', flex: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.md,
  },
  cardDone: { opacity: 0.65 },
  emojiWrap: {
    width: 58, height: 58, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: C.text },
  cardTitleDone: { textDecorationLine: 'line-through', color: C.textSecondary },
  cardPts: { fontSize: FONTS.sizes.sm, color: C.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: 4,
  },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  checkCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.lg,
  },
  photoBtnTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACING.md },
  emptyTxt: { fontSize: FONTS.sizes.lg, color: C.textSecondary },
});
