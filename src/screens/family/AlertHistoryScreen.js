import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.family;

const EVENT_CONFIG = {
  security: {
    icon: 'shield-checkmark',
    color: COLORS.family.danger,
    bg: COLORS.family.danger + '15',
    label: 'Güvenlik',
    description: 'Bölge ihlalleri ve acil durum uyarıları.'
  },
  location: {
    icon: 'location',
    color: COLORS.family.accent,
    bg: COLORS.family.accent + '15',
    label: 'Konum',
    description: 'Rutun konum güncellemeleri ve varış bilgileri.'
  },
  device: {
    icon: 'battery-charging',
    color: '#FF9800',
    bg: '#FF980015',
    label: 'Cihaz',
    description: 'Batarya durumu ve bağlantı bildirimleri.'
  }
};

export default function AlertHistoryScreen() {
  const { alerts } = useApp();

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Bugün, ${timeStr}`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ', ' + timeStr;
  };

  const renderHeader = () => (
    <View style={styles.infoSection}>
      <Text style={styles.infoTitle}>📢 Uyarı Türleri</Text>
      <View style={styles.infoGrid}>
        {Object.entries(EVENT_CONFIG).map(([key, config]) => (
          <View key={key} style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={16} color={config.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: config.color }]}>{config.label}</Text>
              <Text style={styles.infoDesc}>{config.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const config = EVENT_CONFIG[item.type] || EVENT_CONFIG.location;
    const isLast = index === alerts.length - 1;

    return (
      <View style={styles.timelineItem}>
        {/* Left Side: Timeline Line and Dot */}
        <View style={styles.timelineLeft}>
          {!isLast && <View style={styles.line} />}
          <View style={[styles.dot, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={14} color="white" />
          </View>
        </View>

        {/* Right Side: Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: config.bg }]}>
              <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
            </View>
            <Text style={styles.time}>{formatDate(item.timestamp)}</Text>
          </View>
          
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDetail}>{item.detail}</Text>
          
          {item.location?.address && (
            <View style={styles.locContainer}>
              <Ionicons name="map-outline" size={12} color={C.textSecondary} />
              <Text style={styles.locText} numberOfLines={1}>{item.location.address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Aktivite Günlüğü</Text>
          <Text style={styles.subtitle}>Çocuğunuzun gün içindeki özeti</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar-outline" size={24} color={C.primary} />
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ padding: SPACING.lg }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="list-outline" size={60} color={C.border} />
            </View>
            <Text style={styles.emptyTitle}>Henüz bir kayıt yok</Text>
            <Text style={styles.emptyDesc}>Çocuğunuzun önemli aktiviteleri burada listelenecek.</Text>
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
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  headerIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: C.primary + '10', alignItems: 'center', justifyContent: 'center' },
  
  timelineItem: { flexDirection: 'row', marginBottom: SPACING.sm },
  timelineLeft: { width: 40, alignItems: 'center' },
  line: { position: 'absolute', top: 30, bottom: -10, width: 2, backgroundColor: C.border, borderRadius: 1 },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4, zIndex: 2, ...SHADOWS.sm },
  
  cardContainer: {
    flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, marginLeft: 4,
    borderWidth: 1, borderColor: C.border, ...SHADOWS.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  time: { fontSize: 11, color: C.textSecondary },
  
  itemTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  itemDetail: { fontSize: 14, color: C.textSecondary, marginTop: 4, lineHeight: 20 },
  
  locContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: C.background, padding: 6, borderRadius: 8 },
  locText: { fontSize: 11, color: C.textSecondary, marginLeft: 4, flex: 1 },

  infoSection: { backgroundColor: C.surface, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, ...SHADOWS.xs },
  infoTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 },
  infoGrid: { gap: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 13, fontWeight: '700' },
  infoDesc: { fontSize: 11, color: C.textSecondary, marginTop: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, marginTop: 40 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg, ...SHADOWS.sm },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
});
