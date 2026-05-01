import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.family;

export default function RoleSelectScreen({ navigation }) {
  const { selectUserType } = useApp();

  // We keep this temporarily if needed elsewhere, though buttons use navigation directly now.
  const handleSelect = (type) => {
    selectUserType(type);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🛡️</Text>
          <Text style={styles.logoTitle}>GuardianBuddy</Text>
          <Text style={styles.logoSub}>Güvenli Gelecek, Mutlu Çocuk</Text>
        </View>

        {/* Aile Kartı */}
        <TouchableOpacity style={[styles.card, styles.familyCard]} onPress={() => navigation.navigate(ROUTES.FAMILY_LOGIN)} activeOpacity={0.85}>
          <View style={styles.cardIcon}>
            <Text style={{ fontSize: 54 }}>👨‍👩‍👧</Text>
          </View>
          <Text style={styles.cardTitle}>Aile Girişi</Text>
          <Text style={styles.cardDesc}>
            Güvenli alan belirle, günlük görevler oluştur, çocuğunun konumunu takip et.
          </Text>
          <View style={styles.cardBtn}>
            <Text style={styles.cardBtnText}>Aile Olarak Giriş</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Çocuk Kartı */}
        <TouchableOpacity style={[styles.card, styles.childCard]} onPress={() => navigation.navigate(ROUTES.CHILD_LOGIN)} activeOpacity={0.85}>
          <View style={styles.cardIcon}>
            <Text style={{ fontSize: 54 }}>🦁</Text>
          </View>
          <Text style={[styles.cardTitle, { color: '#fff' }]}>Çocuk Girişi</Text>
          <Text style={[styles.cardDesc, { color: '#E9D5FF' }]}>
            Görevlerini tamamla, puan kazan ve yardım gerektiğinde aileni ara!
          </Text>
          <View style={[styles.cardBtn, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={styles.cardBtnText}>Çocuk Olarak Giriş</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  container: { padding: SPACING.xl, paddingBottom: 32 },
  logo: { alignItems: 'center', marginVertical: SPACING.xxl },
  logoEmoji: { fontSize: 64 },
  logoTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.heavy, color: C.text, marginTop: SPACING.sm },
  logoSub: { fontSize: FONTS.sizes.md, color: C.textSecondary, marginTop: 4 },
  card: {
    borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg,
    alignItems: 'center', ...SHADOWS.md,
  },
  familyCard: { backgroundColor: C.surface, borderWidth: 2, borderColor: C.border },
  childCard: { backgroundColor: COLORS.child.primary },
  cardIcon: { marginBottom: SPACING.md },
  cardTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: C.text, marginBottom: SPACING.sm },
  cardDesc: { fontSize: FONTS.sizes.sm, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  cardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: C.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  cardBtnText: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
  version: { textAlign: 'center', color: C.textSecondary, fontSize: FONTS.sizes.xs, marginTop: SPACING.xl },
});
