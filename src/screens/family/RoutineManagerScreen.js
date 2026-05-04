import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRoutines } from '../../context/RoutineContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useApp } from '../../context/AppContext';

const C = COLORS.family;
const PERIOD_LABELS = { morning: '🌅 Sabah', afternoon: '☀️ Öğle', evening: '🌙 Akşam', anytime: '⏰ Her Zaman' };

export default function RoutineManagerScreen() {
  const { routines, deleteRoutine, todayCompleted, todayTotal, resetDaily, sendReminder } = useRoutines();
  const navigation = useNavigation();
  const { pendingSubmissionsCount, pendingRewardRequestsCount } = useApp();

  const handleDelete = (id, title) => {
    Alert.alert('Görevi Sil', `"${title}" görevini silmek istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteRoutine(id) },
    ]);
  };

  const handleReset = () => {
    Alert.alert('Günü Sıfırla', 'Tüm görevler tamamlanmamış sayılacak. Devam et?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sıfırla', onPress: resetDaily },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.completed && styles.cardDone]}>
      <Text style={styles.cardEmoji}>{item.emoji || '📋'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, item.completed && styles.cardTitleDone]}>{item.title}</Text>
        <Text style={styles.cardSub}>
          {PERIOD_LABELS[item.period] || ''} · {'⭐'.repeat(item.points || 1)}
          {item.duration > 0 ? ` · ⏱️ ${Math.floor(item.duration / 60) > 0 ? `${Math.floor(item.duration / 60)}sa ` : ''}${item.duration % 60}dk` : ''}
        </Text>
      </View>
      <View style={styles.cardActions}>
        {item.completed ? (
          <Ionicons name="checkmark-circle" size={22} color={C.accent} style={{ marginRight: 6 }} />
        ) : (
          <TouchableOpacity onPress={() => sendReminder(item)} style={styles.actionBtn}>
            <Ionicons name="notifications-outline" size={22} color={C.accent} style={{ marginRight: 4 }} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.ADD_ROUTINE, { routine: item })} style={styles.actionBtn}>
          <Ionicons name="pencil" size={18} color={C.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={18} color={C.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📋 Rutinler</Text>
          <Text style={styles.progress}>{todayCompleted}/{todayTotal} tamamlandı</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate(ROUTES.PHOTO_APPROVAL)}>
            <Ionicons name="camera-outline" size={20} color="#0EA5E9" />
            {pendingSubmissionsCount > 0 && (
              <View style={[styles.btnBadge, { backgroundColor: '#0EA5E9' }]}>
                <Text style={styles.btnBadgeTxt}>{pendingSubmissionsCount > 9 ? '9+' : pendingSubmissionsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate(ROUTES.REWARDS_MANAGER)}>
            <Ionicons name="gift-outline" size={20} color="#EC4899" />
            {pendingRewardRequestsCount > 0 && (
              <View style={[styles.btnBadge, { backgroundColor: '#EC4899' }]}>
                <Text style={styles.btnBadgeTxt}>{pendingRewardRequestsCount > 9 ? '9+' : pendingRewardRequestsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate(ROUTES.ADD_ROUTINE)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {routines.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>📝</Text>
          <Text style={styles.emptyTitle}>Henüz görev yok</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate(ROUTES.ADD_ROUTINE)}>
            <Text style={styles.emptyBtnTxt}>İlk görevi ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: SPACING.lg }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text },
  progress: { fontSize: FONTS.sizes.sm, color: C.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: C.primary, borderRadius: RADIUS.full, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { backgroundColor: C.border, borderRadius: RADIUS.full, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  cardDone: { opacity: 0.65 },
  cardEmoji: { fontSize: 32, marginRight: SPACING.md },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: C.text },
  cardTitleDone: { textDecorationLine: 'line-through', color: C.textSecondary },
  cardSub: { fontSize: FONTS.sizes.sm, color: C.textSecondary, marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 6 },
  iconBtn: { backgroundColor: C.border, borderRadius: RADIUS.full, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  btnBadge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  btnBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text },
  emptyBtn: { backgroundColor: C.primary, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  emptyBtnTxt: { color: '#fff', fontWeight: FONTS.weights.bold },
});
