import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes';
import { FONTS, SPACING } from '../../constants/theme';

export default function RoleSelectScreen({ navigation }) {
  const { selectUserType } = useApp();

  return (
    <LinearGradient colors={['#0F0A1E', '#1E0A3C', '#3B0764']} style={styles.gradient}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoIconRing}>
              <Text style={styles.logoEmoji}>🛡️</Text>
            </View>
            <Text style={styles.logoTitle}>Buddy</Text>
            <Text style={styles.logoSub}>Güvenli Gelecek, Mutlu Çocuk</Text>
          </View>

          {/* Aile Kartı */}
          <TouchableOpacity
            style={styles.familyCard}
            onPress={() => navigation.navigate(ROUTES.FAMILY_LOGIN)}
            activeOpacity={0.88}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.cardEmoji}>👨‍👩‍👧</Text>
              </View>
              <View style={styles.cardArrow}>
                <Ionicons name="arrow-forward" size={20} color="#2563EB" />
              </View>
            </View>
            <Text style={styles.familyCardTitle}>Aile Girişi</Text>
            <Text style={styles.familyCardDesc}>
              Güvenli alan belirle, günlük görevler oluştur, çocuğunun konumunu takip et.
            </Text>
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.cardBtn}
            >
              <Text style={styles.cardBtnText}>Aile Olarak Giriş</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Çocuk Kartı */}
          <TouchableOpacity
            style={styles.childCardOuter}
            onPress={() => navigation.navigate(ROUTES.CHILD_LOGIN)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#6D28D9', '#7C3AED', '#A855F7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.childCard}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.cardEmoji}>🦁</Text>
                </View>
                <View style={[styles.cardArrow, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
              <Text style={styles.childCardTitle}>Çocuk Girişi</Text>
              <Text style={styles.childCardDesc}>
                Görevlerini tamamla, puan kazan ve yardım gerektiğinde aileni ara!
              </Text>
              <View style={styles.childCardBtn}>
                <Text style={styles.cardBtnText}>Çocuk Olarak Giriş</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.version}>v1.0</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 40 },

  // Logo
  logoWrap: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xxxl },
  logoIconRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  logoEmoji: { fontSize: 52 },
  logoTitle: {
    fontSize: 42, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: 1, marginBottom: SPACING.xs,
  },
  logoSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 },

  // Family Card
  familyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  iconBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 38 },
  cardArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  familyCardTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: '#1E293B', marginBottom: SPACING.xs },
  familyCardDesc: { fontSize: FONTS.sizes.sm, color: '#64748B', lineHeight: 20, marginBottom: SPACING.xl },
  cardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    borderRadius: 999, paddingVertical: 14, paddingHorizontal: SPACING.xl,
  },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },

  // Child Card
  childCardOuter: {
    borderRadius: 28, marginBottom: SPACING.xl,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
  },
  childCard: { borderRadius: 28, padding: SPACING.xl },
  childCardTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: '#FFFFFF', marginBottom: SPACING.xs },
  childCardDesc: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: SPACING.xl },
  childCardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    borderRadius: 999, paddingVertical: 14, paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },

  version: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: FONTS.sizes.xs },
});
