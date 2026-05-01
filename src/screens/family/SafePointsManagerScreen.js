import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.family;
const EMOJIS = ['🏠', '🏫', '🏥', '⛪', '🏪', '👨‍👩‍👦', '👮', '📍'];

export default function SafePointsManagerScreen() {
  const { safePoints, addSafePoint, removeSafePoint } = useApp();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Uyarı', 'İsim girin!'); return; }
    if (!address.trim()) { Alert.alert('Uyarı', 'Adres girin!'); return; }
    
    setLoading(true);
    try {
      await addSafePoint({ name: name.trim(), emoji, address: address.trim() });
      setName(''); setAddress(''); setShow(false);
      Alert.alert('✅', 'Güvenli nokta başarıyla eklendi!');
    } catch (e) {
      Alert.alert('Hata', 'Adres bulunamadı veya bir hata oluştu: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, pointName) => {
    Alert.alert('Sil', `"${pointName}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => removeSafePoint(id) },
    ]);
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {/* Header handled by Stack */}

      {show && (
        <View style={styles.form}>
          <View style={styles.emojiRow}>
            {EMOJIS.map(e => (
              <TouchableOpacity key={e} style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]} onPress={() => setEmoji(e)}>
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nokta adı (Örn: Ev, Okul, Kurs...)" placeholderTextColor={C.textSecondary} />
          <TextInput 
            style={styles.input} 
            value={address} 
            onChangeText={setAddress} 
            placeholder="Açık Adres (Mahalle, Sokak, No...)" 
            placeholderTextColor={C.textSecondary}
            multiline
            numberOfLines={2}
          />
          <Text style={styles.hint}>💡 İpucu: Harita ekranında güvenli nokta modunda haritaya tıklayarak da ekleyebilirsiniz.</Text>
          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleAdd} disabled={loading}>
            <Text style={styles.saveTxt}>{loading ? 'Sorgulanıyor...' : 'Güvenli Nokta Olarak Kaydet'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {safePoints.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>📍</Text>
          <Text style={styles.emptyTxt}>Henüz güvenli nokta yok</Text>
        </View>
      ) : (
        <FlatList
          data={safePoints}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={{ fontSize: 32, marginRight: SPACING.md }}>{item.emoji || '📍'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardAddress} numberOfLines={2}>
                  {item.address || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color={C.danger} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ padding: SPACING.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text },
  addBtn: { backgroundColor: C.primary, borderRadius: RADIUS.full, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  form: { backgroundColor: C.surface, padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: C.border },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  emojiBtn: { width: 46, height: 46, borderRadius: RADIUS.md, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: C.primary, backgroundColor: C.primary + '18' },
  input: { backgroundColor: C.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.md, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: SPACING.sm },
  hint: { fontSize: FONTS.sizes.xs, color: C.textSecondary, marginBottom: SPACING.md, fontStyle: 'italic' },
  saveBtn: { backgroundColor: C.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyTxt: { fontSize: FONTS.sizes.lg, color: C.textSecondary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  cardName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: C.text },
  cardAddress: { fontSize: FONTS.sizes.xs, color: C.textSecondary, marginTop: 2, lineHeight: 16 },
});
