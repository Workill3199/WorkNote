import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfig } from '../context/ConfigContext';
import { useTranslation } from 'react-i18next';
import { scheduleTestNotification, useNotificationHandler } from '../utils/notifications';
import NeonButton from '../components/NeonButton';

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { config, setNotifications, setNotificationFrequency, setNotificationChannel, setQuietHours, save } = useConfig();
  useNotificationHandler();

  const onSave = async () => {
    await save();
    Alert.alert(t('Common.save'), t('Notifications.title') + ' actualizadas');
  };

  const onTest = async () => {
    const now = new Date();
    const hour = now.getHours();
    const quietActive = config.quietHours && (hour >= 22 || hour < 7);
    if (quietActive) {
      Alert.alert(t('Common.quietActive'));
      return;
    }
    try {
      await scheduleTestNotification(t('Notifications.title'), 'Test');
      Alert.alert('OK', t('Notifications.test'));
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  const FrequencyButton = ({ label, value }: { label: string; value: 'instant' | 'daily' | 'weekly' }) => {
    const active = config.notificationFrequency === value;
    return (
      <TouchableOpacity
        style={[styles.segmentBtn, { borderColor: colors.border, backgroundColor: active ? colors.primary : colors.card }]}
        onPress={() => setNotificationFrequency(value)}
      >
        <Text style={[styles.segmentText, { color: active ? '#fff' : colors.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const ChannelRow = ({ label, keyName }: { label: string; keyName: keyof typeof config.notificationChannels }) => (
    <View style={styles.row}>
      <Text style={{ color: colors.text }}>{label}</Text>
      <Switch value={config.notificationChannels[keyName]} onValueChange={(v) => setNotificationChannel(keyName, v)} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('Notifications.title')}</Text>

        {/* Activación general */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>          
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Activar notificaciones generales</Text>
            <Switch value={config.notifications} onValueChange={setNotifications} />
          </View>
          <Text style={[styles.hint, { color: colors.mutedText }]}>Incluye recordatorios y avisos del sistema.</Text>
        </View>

        {/* Frecuencia */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Notifications.frequency')}</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>          
          <View style={styles.segmentRow}>
            <FrequencyButton label={t('Notifications.instant')} value="instant" />
            <FrequencyButton label={t('Notifications.daily')} value="daily" />
            <FrequencyButton label={t('Notifications.weekly')} value="weekly" />
          </View>
          <Text style={[styles.hint, { color: colors.mutedText }]}>Cómo y cuándo se entregan las notificaciones.</Text>
        </View>

        {/* Canales */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Notifications.channels')}</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>          
          <ChannelRow label={t('Notifications.courses')} keyName="cursos" />
          <ChannelRow label={t('Notifications.workshops')} keyName="talleres" />
          <ChannelRow label={t('Notifications.students')} keyName="estudiantes" />
          <ChannelRow label={t('Notifications.activities')} keyName="actividades" />
          <ChannelRow label={t('Notifications.notices')} keyName="avisos" />
        </View>

        {/* Silencio nocturno */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Notifications.quietHours')}</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>          
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>No molestar (22:00–7:00)</Text>
            <Switch value={config.quietHours} onValueChange={setQuietHours} />
          </View>
          <Text style={[styles.hint, { color: colors.mutedText }]}>Evita notificaciones en horario nocturno predefinido.</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>

          <NeonButton title={t('Common.save')} onPress={onSave} colors={colors} style={{ flex: 1 }} textStyle={styles.saveText} />
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.card, flex: 1, borderWidth: 1, borderColor: colors.border }]} onPress={onTest} accessibilityLabel={t('Notifications.test')}>
            <Text style={[styles.saveText, { color: colors.text }]}>{t('Notifications.test')}</Text>
          </TouchableOpacity>
        </View>
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
  segmentRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  segmentBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontWeight: '700' },
  saveBtn: { marginTop: 16, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  saveText: { color: '#fff', fontWeight: '700' },
});