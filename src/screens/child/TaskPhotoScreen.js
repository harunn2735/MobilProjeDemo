import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRoutines } from '../../context/RoutineContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const C = COLORS.child;

export default function TaskPhotoScreen({ route, navigation }) {
  const { routine } = route.params;
  const { submitTaskPhoto } = useApp();
  const { setPendingPhoto } = useRoutines();
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera izni gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      width: 800,
      height: 800,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri için izin gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      width: 800,
      height: 800,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const handleSubmit = async () => {
    if (!imageUri || !imageBase64) {
      Alert.alert('Fotoğraf Seç', 'Lütfen önce bir fotoğraf çek veya seç.');
      return;
    }
    setUploading(true);
    try {
      const submissionId = await submitTaskPhoto(
        routine.id,
        routine.title,
        routine.emoji,
        routine.points,
        imageBase64,
      );
      await setPendingPhoto(routine.id, submissionId);
      Alert.alert('Gönderildi!', 'Fotoğrafın ailenin onayına gönderildi. Onaylanınca puanın eklenecek!', [
        { text: 'Harika!', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error('[TaskPhoto] submit error:', e);
      Alert.alert('Hata', 'Fotoğraf gönderilemedi: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Görevi Kanıtla</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Görev Bilgisi */}
        <View style={styles.taskCard}>
          <Text style={styles.taskEmoji}>{routine.emoji || '📋'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{routine.title}</Text>
            <Text style={styles.taskPts}>⭐ {routine.points} puan kazanacaksın</Text>
          </View>
        </View>

        <Text style={styles.instruction}>
          Görevi tamamladığını kanıtlamak için bir fotoğraf çek. Aileni onaylamasını bekle!
        </Text>

        {/* Fotoğraf Alanı */}
        {imageUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <TouchableOpacity style={styles.changeBtn} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={32} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={64} color={C.primary + '60'} />
            <Text style={styles.placeholderTxt}>Fotoğraf seçilmedi</Text>
          </View>
        )}

        {/* Butonlar */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.pickBtn, { backgroundColor: '#1E293B' }]} onPress={pickFromCamera}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.pickBtnTxt}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickBtn, { backgroundColor: '#475569' }]} onPress={pickFromGallery}>
            <Ionicons name="images" size={22} color="#fff" />
            <Text style={styles.pickBtnTxt}>Galeri</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !imageUri && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!imageUri || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitTxt}>Onaya Gönder</Text>
            </>
          )}
        </TouchableOpacity>

        {uploading && (
          <Text style={styles.uploadingTxt}>Fotoğraf yükleniyor, lütfen bekle...</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: '#fff' },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg,
    gap: SPACING.md, ...SHADOWS.md,
  },
  taskEmoji: { fontSize: 42 },
  taskTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: '#1E293B' },
  taskPts: { fontSize: FONTS.sizes.sm, color: '#F59E0B', marginTop: 2 },
  instruction: {
    fontSize: FONTS.sizes.md, color: '#64748B', textAlign: 'center',
    lineHeight: 22, marginBottom: SPACING.xl,
  },
  previewWrap: { position: 'relative', marginBottom: SPACING.lg, alignItems: 'center' },
  preview: { width: '100%', height: 260, borderRadius: RADIUS.xl },
  changeBtn: { position: 'absolute', top: -12, right: -8 },
  placeholder: {
    height: 200, backgroundColor: '#F1F5F9', borderRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg, gap: SPACING.sm,
    borderWidth: 2, borderColor: C.primary + '30', borderStyle: 'dashed',
  },
  placeholderTxt: { fontSize: FONTS.sizes.md, color: C.primary + '80' },
  btnRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  pickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.lg,
  },
  pickBtnTxt: { color: '#fff', fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: C.primary, paddingVertical: 16, borderRadius: RADIUS.full,
  },
  submitBtnDisabled: { backgroundColor: C.primary + '50' },
  submitTxt: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  uploadingTxt: { textAlign: 'center', color: '#64748B', marginTop: SPACING.md, fontSize: FONTS.sizes.sm },
});
