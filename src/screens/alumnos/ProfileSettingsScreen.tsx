import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Alert, TextInput, ScrollView, Linking, Platform, Animated } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, app, storage } from '../../config/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useConfig } from '../../context/ConfigContext';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

export default function ProfileSettingsScreen() {
  const { colors } = useTheme() as any;
  const navigation = useNavigation<any>();
  const { config, setNickname, setLightMode, save } = useConfig();
  const { t } = useTranslation();
  const user = auth?.currentUser || null;
  const displayName = user?.displayName || 'Juan Pérez';
  const initial = (displayName?.[0] || 'U').toUpperCase();
  const initialPhotoURL = user?.photoURL || null;

  const [editingNick, setEditingNick] = useState(false);
  const [photo, setPhoto] = useState<string | null>(initialPhotoURL);
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!photo) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [photo]);
  // Normalizar photoURL antiguos con formato REST `o?name=` y reemplazarlos por `getDownloadURL`
  useEffect(() => {
    if (!storage || !auth?.currentUser) return;
    const current = photo || initialPhotoURL || '';
    const looksLikeRestNameParam = /\/o\?name=/.test(current);
    if (looksLikeRestNameParam) {
      (async () => {
        try {
          const uidPrefix = `${auth!.currentUser!.uid}.`;
          const dirRef = ref(storage!, 'profile');
          const { items } = await listAll(dirRef);
          const found = items.find(it => it.name.startsWith(uidPrefix));
          if (found) {
            const fixedUrl = await getDownloadURL(found);
            await updateProfile(auth!.currentUser!, { photoURL: fixedUrl });
            setPhoto(fixedUrl);
          }
        } catch (err) {
          console.warn('No se pudo normalizar photoURL:', (err as any)?.message || err);
        }
      })();
    }
  // Ejecutar una vez al montar con los valores iniciales
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Usar el apodo efectivo: si el config.nickname es el valor por defecto, mostrar el displayName
  const effectiveNickname = (config.nickname && config.nickname !== 'Nuevo Apodo') ? config.nickname : displayName;

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
      // Derivar extensión desde el MIME del blob (robusto para URIs blob: en web)
      let ext = 'jpg';
      const mime = (blob as any)?.type as string | undefined;
      if (mime && mime.startsWith('image/')) {
        const candidate = mime.split('/')[1];
        if (candidate) ext = candidate === 'jpeg' ? 'jpg' : candidate;
      }
      const path = `profile/${auth.currentUser.uid}.${ext}`;
      const r = ref(storage, path);
      await uploadBytes(r, blob, { contentType: mime || 'image/jpeg' });
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

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      // Enviar al login inmediatamente
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cerrar sesión');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header estilo "perfil" */}
      <View style={[
        styles.headerBar,
        { backgroundColor: colors.card, borderColor: colors.border },
        Platform.OS === 'web' ? ({ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(20,25,35,0.95)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any) : {}
      ]}>        
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()} accessibilityLabel="Volver">
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configuración de Perfil</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar + Nickname */}
        <View style={styles.avatarSection}>
          <View style={[
            styles.avatarWrap,
            {
              backgroundColor: colors.card,
              borderColor: Platform.OS === 'web' ? 'rgba(110,120,255,0.2)' : colors.primary,
              shadowColor: colors.primary,
            },
          ]}>            
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImg} />
            ) : (
              <>
                <LinearGradient
                  colors={[colors.primary, colors.accent] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <Text style={{ fontSize: 40, color: (colors as any).primaryForeground || '#fff' }}>{initial}</Text>
                </LinearGradient>
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    borderWidth: 3,
                    borderColor: colors.primary,
                    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] }),
                    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
                  }}
                />
              </>
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
              />
            ) : (
              <Text style={[styles.nicknameText, { color: colors.text }]}>{effectiveNickname}</Text>
            )}
            <TouchableOpacity
              onPress={() => setEditingNick(v => {
                // Al iniciar edición, precargar el apodo efectivo si el actual es el valor por defecto
                if (!v && (config.nickname === 'Nuevo Apodo')) {
                  setNickname(effectiveNickname);
                }
                return !v;
              })}
              style={{ marginLeft: 8 }}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
          {effectiveNickname !== displayName && (
            <Text style={{ color: colors.mutedText }}>{displayName}</Text>
          )}
        </View>

        {/* Información de Cuenta */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>INFORMACIÓN DE CUENTA</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
          <TouchableOpacity style={styles.row} onPress={() => setEditingNick(true)}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="account-edit" size={18} color={colors.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Editar Perfil</Text>
                <Text style={{ color: colors.text }}>Nombre, bio, foto</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="email-outline" size={18} color={colors.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Email</Text>
                <Text style={{ color: colors.text }}>{user?.email || '—'}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="phone-outline" size={18} color={colors.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Teléfono</Text>
                <Text style={{ color: colors.text }}>—</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Preferencias */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>PREFERENCIAS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('NotificationsSettings')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="bell-outline" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Notificaciones</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="weather-sunny" size={18} color={colors.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Modo Oscuro</Text>
                <Text style={{ color: colors.text }}>{config.lightMode ? 'Claro' : 'Oscuro'}</Text>
              </View>
            </View>
            <Switch value={config.lightMode} onValueChange={setLightMode} />
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="translate" size={18} color={colors.text} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Idioma</Text>
                <Text style={{ color: colors.mutedText }}>Español</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="human-greeting" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Accesibilidad</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Seguridad */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SEGURIDAD</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('PrivacySettings')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="shield-lock" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Privacidad y Seguridad</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Soporte */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SOPORTE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
          <TouchableOpacity style={styles.row} onPress={contactSupport} accessibilityLabel={t('Profile.contactSupport')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="lifebuoy" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Centro de Ayuda</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Terms')} accessibilityLabel={t('Profile.terms')}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>                
                <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.text} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Términos y Condiciones</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
        {/* Pie de página versión */}
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ color: colors.mutedText, fontSize: 12 }}>Versión 2.4.1</Text>
        </View>

        {/* Cerrar sesión separado al final */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 24 }] }>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#FDE6E6' }]}>                
                <MaterialCommunityIcons name="exit-to-app" size={18} color={colors.error || '#E53E3E'} />
              </View>
              <Text style={{ color: colors.error || '#E53E3E', fontWeight: '600' }}>Cerrar Sesión</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerBar: { position: 'relative', top: 0, zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 4, elevation: 6, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  avatarImg: { width: 120, height: 120, borderRadius: 60 },
  avatarGradient: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { position: 'absolute', right: -2, bottom: -2, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  nicknameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  nicknameText: { fontSize: 20, fontWeight: '700', textTransform: 'uppercase' },
  nicknameInput: { fontSize: 20, fontWeight: '700', borderBottomWidth: 1, paddingVertical: 4, minWidth: 200 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 12, letterSpacing: 0.75, paddingHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: 24, paddingVertical: 4, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  separator: { height: 1, marginHorizontal: 16, opacity: 0.4 },
  logoutCard: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginTop: 16 },
  saveBtn: { marginTop: 16, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  saveText: { color: '#fff', fontWeight: '700' },
});
