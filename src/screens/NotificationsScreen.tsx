import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

const TAB_BAR_HEIGHT = 64;

export function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const {
    enabled,
    setEnabled,
    reminderHour,
    getScheduledNotifications,
  } = useNotification();
  const [scheduled, setScheduled] = useState<{ identifier: string; content: { title: string | null; body: string | null } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const list = await getScheduledNotifications();
      setScheduled(list);
    } catch {
      setScheduled([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getScheduledNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const formatTime = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:00 ${ampm}`;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.semiBold,
      color: colors.textPrimary,
    },
    scroll: { flex: 1 },
    scrollContent: {
      padding: SPACING.md,
      paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, SPACING.sm) + SPACING.lg,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.semiBold,
      color: colors.textMuted,
      marginBottom: SPACING.sm,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
    },
    toggle: {
      width: 52,
      height: 30,
      borderRadius: 15,
      padding: 2,
      justifyContent: 'center',
    },
    toggleThumb: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.textPrimary,
    },
    sublabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: SPACING.xs,
    },
    notificationItem: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    notificationTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.semiBold,
      color: colors.textPrimary,
    },
    notificationBody: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: SPACING.xs,
    },
    empty: {
      padding: SPACING.xl,
      alignItems: 'center',
    },
    emptyIcon: { marginBottom: SPACING.sm },
    emptyText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      textAlign: 'center',
    },
    settingsLink: {
      marginTop: SPACING.md,
      padding: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingsLinkText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.primary,
      marginLeft: SPACING.sm,
    },
  }), [colors, insets.bottom]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Preferences */}
          <Text style={styles.sectionTitle}>{t('notifications.preferences')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>{t('settings.engagingReminders')}</Text>
                <Text style={styles.sublabel}>
                  {`${t('notifications.dailyReminderAt')} ${formatTime(reminderHour)}`}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, enabled ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]}
                onPress={() => setEnabled(!enabled)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: '#fff',
                      alignSelf: enabled ? 'flex-end' : 'flex-start',
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scheduled notifications */}
          <Text style={styles.sectionTitle}>{t('notifications.upcoming')}</Text>
          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : scheduled.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>
                {enabled
                  ? t('notifications.noScheduled')
                  : t('notifications.enableToSee')}
              </Text>
            </View>
          ) : (
            scheduled.map((n) => (
              <View key={n.identifier} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>{n.content.title ?? 'CodeVerse'}</Text>
                {n.content.body ? (
                  <Text style={styles.notificationBody}>{n.content.body}</Text>
                ) : null}
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => navigation.navigate('Main', { screen: 'Settings' })}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
            <Text style={styles.settingsLinkText}>{t('notifications.openSettings')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
