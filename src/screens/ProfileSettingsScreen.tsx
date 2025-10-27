import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Alert, TextInput, ScrollView, Linking } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, app, storage } from '../config/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useConfig } from '../context/ConfigContext';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';

export default function ProfileSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { config, setNickname, setLightMode, save } = useConfig();
  const { t } = useTranslation();
  const user = auth?.currentUser || null;
  const displayName = user?.displayName || 'Juan Pérez';
  const initial = (displayName?.[0] || 'U').toUpperCase();
  const initialPhotoURL = user?.photoURL || null;

  const [editingNick, setEditingNick] = useState(false);
  const [photo, setPhoto] = useState<string | null>(initialPhotoURL);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Concede acceso a tu galería para cambiar la foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo seleccionar la imagen');
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    if (!app || !auth?.currentUser || !storage) {
      Alert.alert('Configuración', 'Firebase no está configurado correctamente.');
      return;
    }
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `profile/${auth.currentUser.uid}.${ext}`;
      const r = ref(storage, path);
      await uploadBytes(r, blob);
      const url = await getDownloadURL(r);
      await updateProfile(auth.currentUser, { photoURL: url });
      setPhoto(url);
      Alert.alert('Foto actualizada', 'Tu foto de perfil se actualizó correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo subir la foto');
    }
  };

  const onSave = async () => {
    await save();
    Alert.alert(t('Common.save'), 'Los cambios se han guardado.');
  };

  const contactSupport = () => {
    const subject = encodeURIComponent('Soporte WorkNote');
    const body = encodeURIComponent('Hola equipo de soporte, necesito ayuda con...');
    Linking.openURL(`mailto:soporte@worknote.app?subject=${subject}&body=${body}`);
  };

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => auth && signOut(auth) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar + Nickname */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>            
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 40, color: colors.text }}>{initial}</Text>
            )}
            <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}
              onPress={pickImage}
            >
              <MaterialCommunityIcons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.nicknameRow}>
            {editingNick ? (
              <TextInput
                value={config.nickname}
                onChangeText={setNickname}
                style={[styles.nicknameInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Nuevo Apodo"
                placeholderTextColor={colors.mutedText}
              />
            ) : (
              <Text style={[styles.nicknameText, { color: colors.text }]}>{config.nickname}</Text>
            )}
            <TouchableOpacity onPress={() => setEditingNick(v => !v)} style={{ marginLeft: 8 }}>
              <MaterialCommunityIcons name="pencil" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.mutedText }}>{displayName}</Text>
        </View>

        {/* General */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>General</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('NotificationsSettings')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>                
                <MaterialCommunityIcons name="bell-outline" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Notificaciones</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('PrivacySettings')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>                
                <MaterialCommunityIcons name="shield-lock" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Privacidad y Seguridad</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>                
                <MaterialCommunityIcons name="weather-sunny" size={18} color={colors.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Modo</Text>
                <Text style={{ color: colors.mutedText }}>{config.lightMode ? 'Claro' : 'Oscuro'}</Text>
              </View>
            </View>
            <Switch value={config.lightMode} onValueChange={setLightMode} />
          </View>
        </View>

        {/* Soporte */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Soporte</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
          <TouchableOpacity style={styles.row} onPress={contactSupport} accessibilityLabel={t('Profile.contactSupport')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>                
                <MaterialCommunityIcons name="lifebuoy" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{t('Profile.contactSupport')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Terms')} accessibilityLabel={t('Profile.terms')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>                
                <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{t('Profile.terms')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('PrivacyPolicy')} accessibilityLabel={t('Profile.policy')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>                
                <MaterialCommunityIcons name="shield-check" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{t('Profile.policy')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={[styles.logoutCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={confirmLogout}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>              
              <MaterialCommunityIcons name="exit-to-app" size={18} color={colors.error || '#E53E3E'} />
            </View>
            <Text style={{ color: colors.error || '#E53E3E', fontWeight: '600' }}>Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>

        {/* Guardar cambios */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={onSave} accessibilityLabel={t('Common.save')}>
          <Text style={styles.saveText}>{t('Common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 1 },
  avatarImg: { width: 120, height: 120, borderRadius: 60 },
  cameraBtn: { position: 'absolute', right: -2, bottom: -2, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  nicknameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  nicknameText: { fontSize: 18, fontWeight: '700' },
  nicknameInput: { fontSize: 18, fontWeight: '700', borderBottomWidth: 1, paddingVertical: 4, minWidth: 180 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 12, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  separator: { height: 1, marginHorizontal: 12, opacity: 0.4 },
  logoutCard: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginTop: 16 },
  saveBtn: { marginTop: 16, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  saveText: { color: '#fff', fontWeight: '700' },
});
