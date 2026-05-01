import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRoutines } from '../../context/RoutineContext';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.family;
const EMOJIS = ['📚', '🦷', '🥣', '🚶', '🍽️', '🛁', '🧹', '🎮', '🎨', '🏃', '💊', '📝', '🌳', '🛏️', '📖'];
const PERIODS = [
  { key: 'morning', label: '🌅 Sabah' },
  { key: 'afternoon', label: '☀️ Öğle' },
  { key: 'evening', label: '🌙 Akşam' },
  { key: 'anytime', label: '⏰ Her Zaman' },
];

export default function AddRoutineScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const existing = route.params?.routine;
  const { addRoutine, updateRoutine } = useRoutines();
  const { safePoints } = useApp();

  const [title, setTitle] = useState(existing?.title || '');
  const [emoji, setEmoji] = useState(existing?.emoji || '📚');
  const [period, setPeriod] = useState(existing?.period || 'afternoon');
  const [points, setPoints] = useState(existing?.points || 3);
  const [isUrgent, setIsUrgent] = useState(existing?.isUrgent || false);
  
  const initialTotalMin = existing?.duration || 0;
  const [hasDuration, setHasDuration] = useState(initialTotalMin > 0);
  const [hours, setHours] = useState(Math.floor(initialTotalMin / 60).toString());
  const [minutes, setMinutes] = useState((initialTotalMin % 60).toString());

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Uyarı', 'Görev başlığı boş olamaz!');
      return;
    }
    
    const totalMin = hasDuration ? (parseInt(hours || 0) * 60 + parseInt(minutes || 0)) : 0;

    const routineData = { 
      title: title.trim(), 
      emoji, 
      period, 
      points, 
      duration: totalMin,
      isUrgent
    };

    if (existing) {
      await updateRoutine(existing.id, routineData);
      Alert.alert('✅ Güncellendi', 'Görev güncellendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } else {
      await addRoutine(routineData);
      Alert.alert('✅ Eklendi', 'Yeni görev eklendi!', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Önizleme */}
        <View style={styles.preview}>
          <Text style={{ fontSize: 52 }}>{emoji}</Text>
          <Text style={styles.previewTitle}>{title || 'Görev Başlığı'}</Text>
          <Text style={styles.previewSub}>
            {'⭐'.repeat(points)} 
            {hasDuration && (parseInt(hours || 0) > 0 || parseInt(minutes || 0) > 0) ? 
              ` · ⏱️ ${parseInt(hours || 0) > 0 ? `${hours}sa ` : ''}${minutes}dk` : ''}
            {isUrgent ? ' · 🚨 ACİL' : ''}
          </Text>
        </View>

        {/* Başlık */}
        <Text style={styles.label}>Görev Başlığı</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Örn: Dişlerimi fırçala"
          placeholderTextColor={C.textSecondary}
          maxLength={40}
        />

        {/* Emoji */}
        <Text style={styles.label}>Emoji Seç</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
              onPress={() => setEmoji(e)}
            >
              <Text style={{ fontSize: 26 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zaman */}
        <Text style={styles.label}>Zaman Dilimi</Text>
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodTxt, period === p.key && { color: '#fff' }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Puan */}
        <Text style={styles.label}>Puan (1-5)</Text>
        <View style={styles.pointsRow}>
          {[1, 2, 3, 4, 5].map(p => (
            <TouchableOpacity key={p} onPress={() => setPoints(p)} style={[styles.pointBtn]}>
              <Text style={{ fontSize: 22 }}>{p <= points ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Acil Görev */}
        <View style={styles.durationHeader}>
          <Text style={styles.label}>Acil Görev? (2 dk'da bir bildirim)</Text>
          <TouchableOpacity 
            onPress={() => setIsUrgent(!isUrgent)}
            style={[styles.toggle, isUrgent && styles.toggleUrgent]}
          >
            <View style={[styles.toggleDot, isUrgent && styles.toggleDotActive]} />
          </TouchableOpacity>
        </View>

        {/* Süre Ayarı */}
        <View style={styles.durationHeader}>
          <Text style={styles.label}>Süre Sınırı Koy (Opsiyonel)</Text>
          <TouchableOpacity 
            onPress={() => setHasDuration(!hasDuration)}
            style={[styles.toggle, hasDuration && styles.toggleActive]}
          >
            <View style={[styles.toggleDot, hasDuration && styles.toggleDotActive]} />
          </TouchableOpacity>
        </View>

        {hasDuration && (
          <View style={styles.durationRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.miniLabel}>Saat</Text>
              <TextInput
                style={styles.input}
                value={hours}
                onChangeText={setHours}
                keyboardType="numeric"
                placeholder="0"
                maxLength={2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Dakika</Text>
              <TextInput
                style={styles.input}
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="numeric"
                placeholder="30"
                maxLength={2}
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnTxt}>{existing ? 'Görevi Güncelle' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: C.text },
  form: { padding: SPACING.lg, paddingBottom: 40 },
  preview: {
    backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.xl, ...SHADOWS.sm,
  },
  previewTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text, marginTop: SPACING.sm },
  previewSub: { fontSize: FONTS.sizes.lg, marginTop: 4 },
  label: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: C.text, marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: {
    backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    fontSize: FONTS.sizes.md, color: C.text, borderWidth: 1, borderColor: C.border,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  emojiBtn: { width: 48, height: 48, borderRadius: RADIUS.md, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: C.primary, backgroundColor: C.primary + '18' },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  periodBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  periodBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  periodTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: C.textSecondary },
  pointsRow: { flexDirection: 'row', gap: SPACING.md },
  pointBtn: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  pointBtnActive: {},
  saveBtn: {
    backgroundColor: C.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2,
    alignItems: 'center', marginTop: SPACING.xl,
  },
  saveBtnTxt: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  durationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  toggle: { width: 52, height: 28, borderRadius: 14, backgroundColor: C.border, padding: 2 },
  toggleActive: { backgroundColor: C.accent },
  toggleUrgent: { backgroundColor: C.danger },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleDotActive: { marginLeft: 24 },
  durationRow: { flexDirection: 'row', marginTop: SPACING.sm, marginBottom: SPACING.lg },
  miniLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 4 },
  pointSelectRow: { marginTop: 8, marginBottom: 20 },
  pointSelectBtn: { 
    width: 90, height: 90, backgroundColor: '#fff', borderRadius: RADIUS.lg, 
    marginRight: 10, alignItems: 'center', justifyContent: 'center', 
    borderWidth: 2, borderColor: '#F1F5F9', ...SHADOWS.sm 
  },
  pointSelectBtnActive: { borderColor: C.primary, backgroundColor: C.primary + '10' },
  pointSelectTxt: { fontSize: 11, fontWeight: '700', color: C.text, marginTop: 4, paddingHorizontal: 4 },
});
