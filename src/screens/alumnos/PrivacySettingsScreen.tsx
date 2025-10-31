import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfig } from '../../context/ConfigContext';
import { useTranslation } from 'react-i18next';

export default function PrivacySettingsScreen() {
  const { colors } = useTheme() as any;
  const { t } = useTranslation();
  const { config, setPrivacy, setShareActivity, setAnalytics, setExcludeFromSearch, save } = useConfig();

  const onSave = async () => {
    await save();
    Alert.alert(t('Common.save'), t('Privacy.title') + ' actualizadas');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('Privacy.title')}</Text>

        {/* Cuenta privada */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>          
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>{t('Privacy.privateAccount')}</Text>
            <Switch value={config.privacy} onValueChange={setPrivacy} />
          </View>
          <Text style={[styles.hint, { color: colors.mutedText }]}>Al activar cuenta privada, se limitan las interacciones y visibilidad.</Text>
        </View>

        {/* Compartir actividad */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>          
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>{t('Privacy.shareActivity')}</Text>
            <Switch value={config.shareActivity} onValueChange={setShareActivity} />
          </View>
          <Text style={[styles.hint, { color: colors.mutedText }]}>Afecta la visibilidad de tu progreso y evaluaciones.</Text>
        </View>

        {/* Datos y diagnósticos */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>          
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>{t('Privacy.analytics')}</Text>
            <Switch value={config.analytics} onValueChange={setAnalytics} />
          </View>
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>{t('Privacy.excludeFromSearch')}</Text>
            <Switch value={config.excludeFromSearch} onValueChange={setExcludeFromSearch} />
          </View>
          <Text style={[styles.hint, { color: colors.mutedText }]}>Controla la recopilación y la indexación de tu cuenta.</Text>
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={onSave} accessibilityLabel={t('Common.save')}>
          <Text style={styles.saveText}>{t('Common.save')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  hint: { marginTop: 8, fontSize: 12 },
  saveBtn: { marginTop: 16, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  saveText: { color: '#fff', fontWeight: '700' },
});
