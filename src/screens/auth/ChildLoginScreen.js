import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

export default function ChildLoginScreen({ navigation }) {
  const { linkChildDevice, updateChildProfile } = useApp();
  const [step, setStep] = useState(1); // 1: Code, 2: Profile
  const [pairingCode, setPairingCode] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [loading, setLoading] = useState(false);

  const avatars = ['🦁', '🦄', '🐱', '🐰', '🐼', '🦊', '🐨', '🦋', '🦅', '🐺'];

  React.useEffect(() => {
    const checkLinked = async () => {
      const linkedId = await AsyncStorage.getItem('linkedFamilyId');
      const savedProfileStr = await AsyncStorage.getItem('childProfile');
      const childLoggedOut = await AsyncStorage.getItem('childLoggedOut');
      console.log('[ChildLoginScreen] linkedId:', linkedId, '| childLoggedOut:', childLoggedOut, '| profile:', savedProfileStr);

      if (childLoggedOut) {
        await AsyncStorage.removeItem('childLoggedOut');
        // If device is already paired AND profile exists, restore directly — no re-setup needed
        if (linkedId && savedProfileStr) {
          const profile = JSON.parse(savedProfileStr);
          if (profile?.name) {
            console.log('[ChildLoginScreen] restoring after logout for:', profile.name);
            await updateChildProfile(profile.name, profile.age || '', profile.avatar || '🦁');
            return;
          }
        }
        if (linkedId) setStep(2);
        return;
      }

      if (linkedId && savedProfileStr) {
        const profile = JSON.parse(savedProfileStr);
        if (profile?.name) {
          console.log('[ChildLoginScreen] auto-restoring session for:', profile.name);
          await updateChildProfile(profile.name, profile.age || '', profile.avatar || '🦁');
          return;
        }
      }
      if (linkedId) setStep(2);
    };
    checkLinked();
  }, []);

  const handleConnect = async () => {
    if (pairingCode.trim().length !== 6) {
      Alert.alert('Geçersiz Kod', 'Lütfen 6 haneli eşleştirme kodunu girin.');
      return;
    }
    setLoading(true);
    try {
      await linkChildDevice(pairingCode.trim().toUpperCase());
      // If a profile already exists for this device, restore it — don't force re-setup
      const savedProfileStr = await AsyncStorage.getItem('childProfile');
      if (savedProfileStr) {
        const profile = JSON.parse(savedProfileStr);
        if (profile?.name) {
          await updateChildProfile(profile.name, profile.age || '', profile.avatar || '🦁');
          return;
        }
      }
      setStep(2); // No profile yet, show setup
    } catch (error) {
      Alert.alert('Bağlantı Başarısız', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen adını gir.');
      return;
    }
    setLoading(true);
    try {
      await updateChildProfile(name, age, avatar);
      // Navigation is usually handled by AppContext state change (userType becoming 'child')
      // but if there's an explicit navigation requirement, it could go here.
    } catch (error) {
      Alert.alert('Hata', 'Profil kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.icon}>✨</Text>
            <Text style={styles.title}>Profilini Oluştur</Text>
            <Text style={styles.subtitle}>Seni tanıyalım kahraman!</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Adın</Text>
            <TextInput
              style={styles.input}
              placeholder="Adını Yaz"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Yaşın (Opsiyonel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Kaç yaşındasın?"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <Text style={styles.label}>Avatarını Seç</Text>
            <View style={styles.avatarGrid}>
               {avatars.map(a => (
                 <TouchableOpacity 
                   key={a} 
                   style={[styles.avatarChoice, avatar === a && styles.avatarChoiceSelected]} 
                   onPress={() => setAvatar(a)}
                 >
                   <Text style={{ fontSize: 32 }}>{a}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>BAŞLA!</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔗</Text>
          <Text style={styles.title}>Cihazı Eşleştir</Text>
          <Text style={styles.subtitle}>Ailenizin verdiği 6 haneli kodu girin.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="6 Haneli Kod"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={6}
            autoCapitalize="characters"
            value={pairingCode}
            onChangeText={setPairingCode}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleConnect}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>AİLEYE BAĞLAN</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.child.primary },
  container: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  header: { marginBottom: SPACING.xl, alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: SPACING.md },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.heavy, color: '#fff', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  form: { width: '100%', backgroundColor: COLORS.surface, padding: SPACING.xl, borderRadius: RADIUS.xl },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  codeInput: {
    padding: SPACING.lg,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
  },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 15, justifyContent: 'center' },
  avatarChoice: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: 'transparent' },
  avatarChoiceSelected: { borderColor: COLORS.child.primary, backgroundColor: '#EFF6FF' },
  button: {
    backgroundColor: COLORS.child.secondary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  backButton: { marginTop: SPACING.xl, alignItems: 'center' },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
});
