/**
 * Engagement notifications based on user interests and progress.
 * Requires expo-notifications - run: npx expo install expo-notifications
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/theme';
import type { LastReadArticle } from '../context/ProgressContext';
// Engagement message templates based on user interests
const STREAK_MESSAGES = {
  atRisk: (streak: number) =>
    `Your ${streak}-day streak is at risk! Practice for 2 min to keep it going 🔥`,
  building: (streak: number) =>
    `Amazing! You're on a ${streak}-day streak. Keep the momentum! 💪`,
  start: () =>
    `Start your learning streak today. Just one article can make the difference! 🌟`,
};

const CONTINUE_LEARNING_MESSAGES = (lang: string, article?: string) => [
  `Continue where you left off: ${lang}${article ? ` - ${article}` : ''}`,
  `Your ${lang} journey awaits. Pick up the next article! 📚`,
  `Ready to level up your ${lang}? Continue your track.`,
];

const CELEBRATION_MESSAGES = (count: number) => [
  `You've completed ${count} articles! That's real progress 🎉`,
  `${count} articles done. Your coding skills are growing!`,
  `Impressive! ${count} articles completed. Keep it up!`,
];

const AI_MENTOR_MESSAGES = [
  `AI Mentor is ready. Ask about algorithms or system design 💬`,
  `Stuck on a concept? Your AI Mentor can help clarify it.`,
  `Prep for interviews with AI Mentor - practice coding questions.`,
];

const DAILY_REMINDER_MESSAGES = [
  `A little practice goes a long way. 5 min with CodeVerse? ⏱️`,
  `Your brain loves consistency. Quick coding session today?`,
  `New day, new learning. What will you master today?`,
];

export type NotificationPrefs = {
  enabled: boolean;
  /** Hour (0-23) for daily reminder */
  reminderHour: number;
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED);
    const timeRaw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_TIME);
    const enabled = raw !== 'false';
    const reminderHour = timeRaw ? parseInt(timeRaw, 10) : 19; // default 7 PM
    return { enabled, reminderHour };
  } catch {
    return { enabled: true, reminderHour: 19 };
  }
}

export async function setNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<void> {
  if (prefs.enabled !== undefined) {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ENABLED, String(prefs.enabled));
  }
  if (prefs.reminderHour !== undefined) {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_TIME, String(prefs.reminderHour));
  }
}

/** Pick an engaging message based on user progress and interests */
export function getEngagingMessage(params: {
  lastRead: LastReadArticle | null;
  completedCount: number;
  streakDays: number;
  hasRecentActivity: boolean;
}): string {
  const { lastRead, completedCount, streakDays, hasRecentActivity } = params;

  // Streak at risk (no activity today, had streak)
  if (!hasRecentActivity && streakDays > 0) {
    return STREAK_MESSAGES.atRisk(streakDays);
  }

  // Building streak
  if (streakDays >= 3) {
    return STREAK_MESSAGES.building(streakDays);
  }

  // Continue learning - user has lastRead
  if (lastRead) {
    const lang = lastRead.languageName;
    const msgs = CONTINUE_LEARNING_MESSAGES(lang, lastRead.articleTitle);
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // Celebration for milestones
  if (completedCount >= 5) {
    const msgs = CELEBRATION_MESSAGES(completedCount);
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // AI Mentor nudge
  if (Math.random() > 0.5) {
    return AI_MENTOR_MESSAGES[Math.floor(Math.random() * AI_MENTOR_MESSAGES.length)];
  }

  // Daily reminder
  return DAILY_REMINDER_MESSAGES[Math.floor(Math.random() * DAILY_REMINDER_MESSAGES.length)];
}

