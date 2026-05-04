import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, StatusBar, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.family;
const EMOJIS = ['🎁', '🍦', '🎮', '🎬', '🚀', '🧸', '📚', '🎨', '🏅', '🌟', '🍕', '⚽'];

export default function RewardsManagerScreen({ navigation }) {
  const { rewards, addReward, removeReward, rewardRequests, approveRewardRequest, rejectRewardRequest, points, pendingRewardRequestsCount } = useApp();
  const [tab, setTab] = useState('rewards'); // 'rewards' | 'requests'
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pointCost, setPointCost] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [saving, setSaving] = useState(false);

  const handleAddReward = async () => {
    if (!title.trim() || !pointCost.trim()) {
      Alert.alert('Eksik Bilgi', 'Ödül adı ve puan miktarı gerekli.');
      return;
    }
    const cost = parseInt(pointCost, 10);
    if (isNaN(cost) || cost < 1) {
      Alert.alert('Geçersiz Puan', 'Lütfen geçerli bir puan girin.');
      return;
    }
    setSaving(true);
    try {
      await addReward({ title: title.trim(), pointCost: cost, emoji });
      setTitle(''); setPointCost(''); setEmoji('🎁');
      setShowAddModal(false);
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (reward) => {
    Alert.alert('Ödülü Sil', `"${reward.title}" ödülünü silmek istiyor musun?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => removeReward(reward.id) },
    ]);
  };

  const handleApprove = async (req) => {
    if (points < req.pointCost) {
      Alert.alert('Yeterli Puan Yok', `Bu ödül için ${req.pointCost} puan gerekli, mevcut: ${points}`);
      return;
    }
    await approveRewardRequest(req.id);
    Alert.alert('Onaylandı! 🎉', `"${req.rewardTitle}" talebi onaylandı ve ${req.pointCost} puan düşüldü.`);
  };

  const handleReject = (req) => {
    Alert.alert('Reddet', `"${req.rewardTitle}" talebini reddet?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Reddet', style: 'destructive', onPress: () => rejectRewardRequest(req.id) },
    ]);
  };

  const pendingRequests = rewardRequests.filter(r => r.status === 'pending');
  const allRequests = rewardRequests;

  const renderReward = ({ item }) => (
    <View style={styles.rewardCard}>
      <Text style={styles.rewardEmoji}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rewardTitle}>{item.title}</Text>
        <Text style={styles.rewardCost}>⭐ {item.pointCost} puan</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemove(item)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }) => {
    const statusColors = {
      pending: { bg: '#FFFBEB', txt: '#92400E', label: '⏳ Bekliyor' },
      approved: { bg: '#F0FDF4', txt: '#065F46', label: '✅ Onaylandı' },
      rejected: { bg: '#FEF2F2', txt: '#991B1B', label: '❌ Reddedildi' },
    };
    const s = statusColors[item.status] || statusColors.pending;
    return (
      <View style={[styles.requestCard, { borderLeftColor: item.status === 'pending' ? '#F59E0B' : item.status === 'approved' ? '#10B981' : '#EF4444' }]}>
        <Text style={{ fontSize: 32 }}>{item.rewardEmoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.requestTitle}>{item.rewardTitle}</Text>
          <Text style={styles.requestCost}>⭐ {item.pointCost} puan</Text>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusPillTxt, { color: s.txt }]}>{s.label}</Text>
          </View>
        </View>
        {item.status === 'pending' && (
          <View style={styles.actionBtns}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => handleApprove(item)}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleReject(item)}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎁 Ödül Sistemi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'rewards' && styles.tabActive]} onPress={() => setTab('rewards')}>
          <Text style={[styles.tabTxt, tab === 'rewards' && styles.tabTxtActive]}>Ödüller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'requests' && styles.tabActive]} onPress={() => setTab('requests')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.tabTxt, tab === 'requests' && styles.tabTxtActive]}>Talepler</Text>
            {pendingRewardRequestsCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotTxt}>{pendingRewardRequestsCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {tab === 'rewards' ? (
        <>
          <FlatList
            data={rewards}
            keyExtractor={item => item.id}
            renderItem={renderReward}
            contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 56 }}>🎁</Text>
                <Text style={styles.emptyTxt}>Henüz ödül eklenmedi</Text>
                <Text style={styles.emptyHint}>Çocuğun için ödüller tanımla!</Text>
              </View>
            }
          />
          <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={allRequests}
          keyExtractor={item => item.id}
          renderItem={renderRequest}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>📭</Text>
              <Text style={styles.emptyTxt}>Henüz talep yok</Text>
            </View>
          }
        />
      )}

      {/* Add Reward Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Ödül Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={26} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Emoji Seç</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, emoji === e && styles.emojiBtnSelected]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={{ fontSize: 28 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Ödül Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Dondurma, Oyun zamanı..."
              value={title}
              onChangeText={setTitle}
              maxLength={40}
            />

            <Text style={styles.inputLabel}>Puan Maliyeti</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 10"
              keyboardType="numeric"
              value={pointCost}
              onChangeText={setPointCost}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddReward} disabled={saving}>
              <Text style={styles.saveBtnTxt}>{saving ? 'Kaydediliyor...' : 'Ödül Ekle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: C.text },
  tabs: { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: C.primary },
  tabTxt: { fontSize: FONTS.sizes.sm, color: C.textSecondary, fontWeight: '600' },
  tabTxtActive: { color: C.primary },
  badgeDot: {
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeDotTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rewardCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md,
    gap: SPACING.md, ...SHADOWS.sm,
  },
  rewardEmoji: { fontSize: 40 },
  rewardTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: C.text },
  rewardCost: { fontSize: FONTS.sizes.sm, color: '#F59E0B' },
  deleteBtn: { padding: SPACING.sm },
  requestCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md,
    gap: SPACING.md, ...SHADOWS.sm, borderLeftWidth: 4,
  },
  requestTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: C.text },
  requestCost: { fontSize: FONTS.sizes.sm, color: '#F59E0B', marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  actionBtns: { flexDirection: 'column', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: C.primary, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.sm },
  emptyTxt: { fontSize: FONTS.sizes.lg, color: C.textSecondary },
  emptyHint: { fontSize: FONTS.sizes.sm, color: C.textSecondary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.xl, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: C.textSecondary, marginBottom: 6, marginTop: SPACING.sm },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginRight: 8, backgroundColor: '#F8FAFC',
  },
  emojiBtnSelected: { backgroundColor: C.primary + '20', borderWidth: 2, borderColor: C.primary },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: FONTS.sizes.md, color: C.text, marginBottom: SPACING.sm,
  },
  saveBtn: {
    backgroundColor: C.primary, paddingVertical: 14, borderRadius: RADIUS.full,
    alignItems: 'center', marginTop: SPACING.md,
  },
  saveBtnTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
});
