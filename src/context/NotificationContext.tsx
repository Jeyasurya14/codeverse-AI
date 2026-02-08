/**
 * Notification context - schedules engaging local notifications based on user interests.
 * Run: npx expo install expo-notifications
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // expo-notifications not installed
}
import { STORAGE_KEYS } from '../constants/theme';
import {
  getNotificationPrefs,
  setNotificationPrefs as setPrefs,
  getEngagingMessage,
  type NotificationPrefs,
} from '../services/notificationService';
import type { LastReadArticle } from './ProgressContext';
import { getStreakFromCompletedArticles } from '../utils/progressUtils';
import type { CompletedArticle } from './ProgressContext';

// Configure how notifications appear when app is in foreground
if (Notifications) {
  Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
  });
}

export type ScheduledNotification = {
  identifier: string;
  content: { title: string | null; body: string | null };
  trigger: unknown;
};

type NotificationContextType = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  reminderHour: number;
  setReminderHour: (hour: number) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleEngagingNotification: (params: ScheduleParams) => Promise<void>;
  getScheduledNotifications: () => Promise<ScheduledNotification[]>;
};

type ScheduleParams = {
  lastRead: LastReadArticle | null;
  completedArticles: CompletedArticle[];
  hasRecentActivity: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const [reminderHour, setReminderHourState] = useState(19);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    getNotificationPrefs().then((prefs) => {
      setEnabledState(prefs.enabled);
      setReminderHourState(prefs.reminderHour);
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !Notifications) return false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') {
        setPermissionGranted(true);
        return true;
      }
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      return status === 'granted';
    } catch {
      return false;
    }
  }, []);

  const setEnabled = useCallback(async (value: boolean) => {
    setEnabledState(value);
    await setPrefs({ enabled: value });
  }, []);

  const setReminderHour = useCallback(async (hour: number) => {
    setReminderHourState(hour);
    await setPrefs({ reminderHour: hour });
  }, []);

  const scheduleEngagingNotification = useCallback(
    async (params: ScheduleParams) => {
      if (!enabled || Platform.OS === 'web' || !Notifications) return;
      try {
        const granted = await requestPermission();
        if (!granted) return;

        await Notifications.cancelAllScheduledNotificationsAsync();

        const streakDays = getStreakFromCompletedArticles(params.completedArticles);
        const completedCount = params.completedArticles.length;

        const body = getEngagingMessage({
          lastRead: params.lastRead,
          completedCount,
          streakDays,
          hasRecentActivity: params.hasRecentActivity,
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('engagement', {
            name: 'Engaging reminders',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
          });
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'CodeVerse',
            body,
            data: { screen: 'Home' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: reminderHour,
            minute: 0,
            channelId: Platform.OS === 'android' ? 'engagement' : undefined,
          },
        });
      } catch (e) {
        if (__DEV__) console.warn('Notification schedule failed:', e);
      }
    },
    [enabled, reminderHour, requestPermission]
  );

  const getScheduledNotifications = useCallback(async (): Promise<ScheduledNotification[]> => {
    if (Platform.OS === 'web' || !Notifications) return [];
    try {
      const list = await Notifications.getAllScheduledNotificationsAsync();
      return list.map((n) => ({
        identifier: n.identifier,
        content: { title: n.content.title ?? null, body: n.content.body ?? null },
        trigger: n.trigger,
      }));
    } catch {
      return [];
    }
  }, []);

  const value: NotificationContextType = {
    enabled,
    setEnabled,
    reminderHour,
    setReminderHour,
    requestPermission,
    scheduleEngagingNotification,
    getScheduledNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (ctx === undefined) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
