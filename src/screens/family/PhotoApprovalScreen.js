import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Modal, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.family;

const STATUS_LABEL = {
  pending: { label: 'Bekliyor', color: '#F59E0B', bg: '#FFFBEB', icon: 'time-outline' },
  approved: { label: 'Onaylandı', color: '#10B981', bg: '#F0FDF4', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Reddedildi', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline' },
};

export default function PhotoApprovalScreen({ navigation }) {
  const { taskSubmissions, approveSubmission, rejectSubmission, pendingSubmissionsCount } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all'

  const filtered = filter === 'pending'
    ? taskSubmissions.filter(s => s.status === 'pending')
    : taskSubmissions;

  const handleApprove = async (submission) => {
    setLoading(true);
    try {
      await approveSubmission(submission.id, submission.routineId, submission.routinePoints);
      setSelectedPhoto(null);
      Alert.alert('Onaylandı! ✅', `"${submission.routineTitle}" görevi onaylandı ve ${submission.routinePoints} puan eklendi.`);
    } catch (e) {
      Alert.alert('Hata', 'Onaylama başarısız: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (submission) => {
    Alert.alert(
      'Reddet',
      `"${submission.routineTitle}" fotoğrafını reddedeceksin. Çocuk tekrar çekebilecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet', style: 'destructive', onPress: async () => {
            setLoading(true);
            try {
              await rejectSubmission(submission.id, submission.routineId);
              setSelectedPhoto(null);
            } catch (e) {
              Alert.alert('Hata', e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const st = STATUS_LABEL[item.status] || STATUS_LABEL.pending;
    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelectedPhoto(item)} activeOpacity={0.85}>
        <Image source={{ uri: item.photoUrl }} style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle}>{item.routineEmoji} {item.routineTitle}</Text>
          <Text style={styles.taskPts}>⭐ {item.routinePoints} puan</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={12} color={st.color} />
            <Text style={[styles.statusTxt, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        {item.status === 'pending' && (
          <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
        )}
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>
          📸 Fotoğraf Onayları
          {pendingSubmissionsCount > 0 ? ` (${pendingSubmissionsCount})` : ''}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'pending' && styles.tabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.tabTxt, filter === 'pending' && styles.tabTxtActive]}>
            Bekleyenler {pendingSubmissionsCount > 0 ? `(${pendingSubmissionsCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabTxt, filter === 'all' && styles.tabTxtActive]}>Tümü</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>📭</Text>
            <Text style={styles.emptyTxt}>
              {filter === 'pending' ? 'Bekleyen onay yok' : 'Henüz fotoğraf gönderilmedi'}
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedPhoto} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            {selectedPhoto && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedPhoto.routineEmoji} {selectedPhoto.routineTitle}</Text>
                  <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                    <Ionicons name="close" size={26} color={C.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalPts}>⭐ {selectedPhoto.routinePoints} puan kazanacak</Text>

                <Image source={{ uri: selectedPhoto.photoUrl }} style={styles.fullPhoto} resizeMode="contain" />

                <Text style={styles.modalTime}>
                  {new Date(selectedPhoto.submittedAt).toLocaleString('tr-TR')}
                </Text>

                {selectedPhoto.status === 'pending' ? (
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.rejectBtn]}
                      onPress={() => handleReject(selectedPhoto)}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Ionicons name="close" size={20} color="#fff" />
                          <Text style={styles.modalBtnTxt}>Reddet</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.approveBtn]}
                      onPress={() => handleApprove(selectedPhoto)}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Ionicons name="checkmark" size={20} color="#fff" />
                          <Text style={styles.modalBtnTxt}>Onayla</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.statusBadgeLarge, {
                    backgroundColor: STATUS_LABEL[selectedPhoto.status]?.bg,
                  }]}>
                    <Text style={{ color: STATUS_LABEL[selectedPhoto.status]?.color, fontWeight: '700' }}>
                      {STATUS_LABEL[selectedPhoto.status]?.label}
                    </Text>
                  </View>
                )}
              </>
            )}
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
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md,
    gap: SPACING.md, ...SHADOWS.sm,
  },
  thumb: { width: 72, height: 72, borderRadius: RADIUS.lg, backgroundColor: '#F1F5F9' },
  taskTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: C.text },
  taskPts: { fontSize: FONTS.sizes.xs, color: '#F59E0B', marginBottom: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start',
  },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyTxt: { fontSize: FONTS.sizes.md, color: C.textSecondary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.xl, paddingBottom: 36, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: C.text, flex: 1 },
  modalPts: { fontSize: FONTS.sizes.sm, color: '#F59E0B', marginBottom: SPACING.md },
  fullPhoto: { width: '100%', height: 300, borderRadius: RADIUS.xl, backgroundColor: '#F1F5F9', marginBottom: SPACING.md },
  modalTime: { fontSize: FONTS.sizes.xs, color: C.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
  modalBtnRow: { flexDirection: 'row', gap: SPACING.md },
  modalBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: RADIUS.full,
  },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  modalBtnTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
  statusBadgeLarge: { padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
});
