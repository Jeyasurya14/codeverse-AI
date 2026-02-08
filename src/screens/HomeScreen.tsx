import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { useProgress } from '../context/ProgressContext';
import { useNotification } from '../context/NotificationContext';
import { getStreakFromCompletedArticles } from '../utils/progressUtils';
import { useBookmarks } from '../context/BookmarksContext';
import { MOCK_ARTICLES, MOCK_LANGUAGES } from '../data/mockContent';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, AI_TOKENS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getConversations, getAuthTokens } from '../services/api';
import { LangIcon } from '../components/LangIcon';
import { getLocalLogo } from '../data/langLogos';

const TAB_BAR_HEIGHT = 64;

export function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { totalAvailable, freeRemaining, freeUsed } = useTokens();
  const { lastRead, completedArticleIds, completedArticles } = useProgress();
  const { scheduleEngagingNotification } = useNotification();
  const { bookmarks } = useBookmarks();
  const [conversationCount, setConversationCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const totalArticles = Object.values(MOCK_ARTICLES).reduce((sum, arr) => sum + arr.length, 0);
  const completedCount = completedArticleIds.length;
  const learningPercent = totalArticles > 0 ? Math.min(100, (completedCount / totalArticles) * 100) : 0;
  const streakDays = useMemo(
    () => getStreakFromCompletedArticles(completedArticles),
    [completedArticles]
  );
  const streakTrend = streakDays === 0 ? t('home.startLearning') : streakDays >= 7 ? t('home.onFire') : t('home.keepItUp');

  const continueArticle = lastRead
    ? (MOCK_ARTICLES[lastRead.languageId] ?? []).find((a) => a.id === lastRead.articleId)
    : null;

  // Recommended languages: those that have articles, with progress from completedArticleIds
  const recommendedLanguages = useMemo(() => {
    const langIds = Object.keys(MOCK_ARTICLES);
    return MOCK_LANGUAGES.filter((lang) => langIds.includes(lang.id)).slice(0, 12).map((lang) => {
      const articles = MOCK_ARTICLES[lang.id] ?? [];
      const completed = articles.filter((a) => completedArticleIds.includes(a.id)).length;
      const progress = articles.length > 0 ? Math.round((completed / articles.length) * 100) : 0;
      const firstLevel = articles[0]?.level ?? 'beginner';
      const tag = firstLevel === 'advanced' ? 'ADVANCED' : firstLevel === 'intermediate' ? 'INTERMEDIATE' : 'BEGINNER';
      return {
        id: lang.id,
        name: lang.name,
        description: lang.description,
        icon: lang.icon,
        slug: lang.slug,
        articleCount: articles.length,
        progress,
        tag: progress === 0 && completed === 0 ? 'NEW' : tag,
      };
    });
  }, [completedArticleIds]);

  // Continue-learning course progress (for the big card)
  const continueProgressPercent = useMemo(() => {
    if (!lastRead) return 0;
    const articles = MOCK_ARTICLES[lastRead.languageId] ?? [];
    const completed = articles.filter((a) => completedArticleIds.includes(a.id)).length;
    return articles.length > 0 ? Math.round((completed / articles.length) * 100) : 0;
  }, [lastRead, completedArticleIds]);

  // Next article in track for "Next: ..."
  const nextArticleInTrack = useMemo(() => {
    if (!lastRead || !continueArticle) return null;
    const articles = (MOCK_ARTICLES[lastRead.languageId] ?? []).sort((a, b) => a.order - b.order);
    const idx = articles.findIndex((a) => a.id === continueArticle.id);
    if (idx < 0 || idx >= articles.length - 1) return null;
    return articles[idx + 1];
  }, [lastRead, continueArticle]);

  const continueTrackLang = useMemo(
    () => (lastRead ? MOCK_LANGUAGES.find((l) => l.id === lastRead.languageId) : null),
    [lastRead]
  );

  // Schedule engaging notifications based on progress and interests
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const hasRecentActivity = completedArticles.some(
      (c) => c.completedAt && c.completedAt.slice(0, 10) === today
    );
    scheduleEngagingNotification({
      lastRead,
      completedArticles,
      hasRecentActivity,
    });
  }, [user, lastRead, completedArticles, scheduleEngagingNotification]);

  // Load conversation count
  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const tokens = getAuthTokens();
      if (tokens?.accessToken) {
        const result = await getConversations();
        setConversationCount(result.conversations?.length || 0);
      }
    } catch (e) {
      // Silently fail
      setConversationCount(0);
    } finally {
      setLoadingStats(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    avatarWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: SPACING.md,
      ...SHADOWS.card,
    },
    avatarGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: '#fff',
    },
    headerTextWrap: { flex: 1, minWidth: 0 },
    greeting: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
    },
    name: {
      fontSize: FONT_SIZES.xl,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    headerIconBtn: {
      padding: SPACING.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: BORDER_RADIUS.md,
      position: 'relative',
    },
    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
      zIndex: 1,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      gap: SPACING.sm,
    },
    searchIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
    },
    searchShortcut: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: BORDER_RADIUS.sm,
    },
    searchShortcutText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: colors.textMuted,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, SPACING.sm) + SPACING.lg,
    },
    twoStatsRow: {
      flexDirection: 'row',
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    },
    statCardHalf: {
      flex: 1,
      borderRadius: BORDER_RADIUS.xl,
      overflow: 'hidden',
      ...SHADOWS.cardElevated,
    },
    statCardGradient: {
      padding: SPACING.md,
      minHeight: 140,
      position: 'relative',
      overflow: 'hidden',
    },
    statCardDecor: {
      position: 'absolute',
      top: -20,
      right: -20,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    statIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statCardLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.bold,
      color: 'rgba(255,255,255,0.8)',
      letterSpacing: 1,
    },
    statCardValue: {
      fontSize: 36,
      fontFamily: FONTS.bold,
      color: '#fff',
      lineHeight: 40,
    },
    statCardUnit: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: 'rgba(255,255,255,0.9)',
      marginTop: -4,
    },
    statCardTrend: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: 'rgba(255,255,255,0.7)',
      marginTop: SPACING.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    continueCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: SPACING.xl,
      ...SHADOWS.card,
    },
    continueCardImage: {
      height: 120,
      backgroundColor: colors.backgroundElevated,
      position: 'relative',
    },
    continueCardTags: {
      position: 'absolute',
      top: SPACING.sm,
      left: SPACING.sm,
      flexDirection: 'row',
      gap: SPACING.xs,
      zIndex: 1,
    },
    tagYellow: {
      backgroundColor: colors.secondary,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
    },
    tagYellowText: { fontSize: 10, fontFamily: FONTS.bold, color: colors.background },
    tagDark: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
    },
    tagDarkText: { fontSize: 10, fontFamily: FONTS.bold, color: colors.textPrimary },
    continueCardImagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueCardLogo: {
      backgroundColor: 'transparent',
    },
    continueCardTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
    },
    continueCardNext: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      paddingHorizontal: SPACING.md,
      marginTop: 2,
    },
    continueCardProgressLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: colors.textMuted,
      paddingHorizontal: SPACING.md,
      marginTop: SPACING.sm,
    },
    continueCardProgressBar: {
      height: 6,
      backgroundColor: colors.backgroundElevated,
      borderRadius: BORDER_RADIUS.full,
      marginHorizontal: SPACING.md,
      marginTop: SPACING.xs,
      overflow: 'hidden',
    },
    continueCardProgressFill: {
      height: '100%',
      backgroundColor: colors.secondary,
      borderRadius: BORDER_RADIUS.full,
    },
    continueCardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    },
    continueCardPercent: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    continuePlayBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      margin: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
      alignSelf: 'center',
    },
    heroButtonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
    recommendedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    viewAll: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
    langCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    langCardIconWrap: {
      width: 48,
      height: 48,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.backgroundElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md,
      overflow: 'hidden',
    },
    langCardIcon: {},
    langCardBody: { flex: 1, minWidth: 0 },
    langCardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    langCardDesc: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: 2,
    },
    langCardTag: {
      alignSelf: 'flex-start',
      backgroundColor: colors.secondary,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
      marginTop: SPACING.xs,
    },
    langCardTagText: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: colors.background,
    },
    langCardProgressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    langCardProgressBg: {
      flex: 1,
      height: 4,
      backgroundColor: colors.backgroundElevated,
      borderRadius: BORDER_RADIUS.full,
      overflow: 'hidden',
    },
    langCardProgressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.full,
    },
    langCardProgressText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
    langCardAction: {},
    langCardActionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rechargeCard: {
      borderRadius: BORDER_RADIUS.xl,
      overflow: 'hidden',
      marginTop: SPACING.lg,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    rechargeCardGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
    },
    rechargeCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      flex: 1,
    },
    rechargeIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rechargeTextWrap: {
      flex: 1,
    },
    rechargeCardTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    rechargeProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    rechargeProgressBar: {
      flex: 1,
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 2,
      maxWidth: 80,
    },
    rechargeProgressFill: {
      height: '100%',
      backgroundColor: '#8B5CF6',
      borderRadius: 2,
    },
    rechargeCardSub: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
    },
    rechargeAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderRadius: BORDER_RADIUS.md,
    },
    rechargeActionText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
  }), [colors, insets.bottom]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header: avatar, welcome, bell, gear */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLeft}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {(user?.name ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name} numberOfLines={1}>{user?.name ?? 'Developer'}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => (navigation.getParent() as any)?.navigate('Notifications')}
              hitSlop={10}
            >
              <View style={styles.notificationDot} />
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Settings')} hitSlop={10}>
              <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <TouchableOpacity style={styles.searchWrap} activeOpacity={0.8}>
          <View style={styles.searchIconWrap}>
            <Ionicons name="search" size={18} color={colors.primary} />
          </View>
          <Text style={styles.searchPlaceholder}>Search languages, articles...</Text>
          <View style={styles.searchShortcut}>
            <Text style={styles.searchShortcutText}>⌘K</Text>
          </View>
        </TouchableOpacity>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Two stat cards: Streak | Read */}
          <View style={styles.twoStatsRow}>
            <Animated.View entering={FadeInDown.delay(60).springify().damping(18)} style={[styles.statCardHalf]}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statCardDecor} />
                <View style={styles.statCardTop}>
                  <View style={styles.statIconWrap}>
                    <Ionicons name="flame" size={18} color="#fff" />
                  </View>
                  <Text style={styles.statCardLabel}>{t('home.streak')}</Text>
                </View>
                <Text style={styles.statCardValue}>{streakDays}</Text>
                <Text style={styles.statCardUnit}>{streakDays === 1 ? t('home.day') : t('home.days')}</Text>
                <Text style={styles.statCardTrend}>{streakTrend}</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(100).springify().damping(18)} style={[styles.statCardHalf]}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statCardDecor} />
                <View style={styles.statCardTop}>
                  <View style={styles.statIconWrap}>
                    <Ionicons name="book" size={18} color="#fff" />
                  </View>
                  <Text style={styles.statCardLabel}>{t('home.articles')}</Text>
                </View>
                <Text style={styles.statCardValue}>{completedCount}</Text>
                <Text style={styles.statCardUnit}>{t('home.completed')}</Text>
                <Text style={styles.statCardTrend}>{totalArticles > 0 ? `${Math.round(learningPercent)}% of ${totalArticles}` : t('home.startLearning')}</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Continue Learning */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="play" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('home.continueLearning')}</Text>
          </View>

          {continueArticle && lastRead ? (
            <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  try {
                    navigation.navigate('ArticleDetail', { article: continueArticle, languageName: lastRead.languageName });
                  } catch (e) {
                    if (__DEV__) console.warn('Navigation error:', e);
                  }
                }}
                style={styles.continueCard}
              >
                <View style={styles.continueCardImage}>
                  <View style={styles.continueCardTags}>
                    <View style={styles.tagYellow}><Text style={styles.tagYellowText}>AI-POWERED</Text></View>
                    <View style={styles.tagDark}><Text style={styles.tagDarkText}>{(continueArticle.level ?? 'beginner').toUpperCase()}</Text></View>
                  </View>
                  <View style={styles.continueCardImagePlaceholder}>
                    <LangIcon
                      iconUri={continueTrackLang?.icon}
                      iconSource={continueTrackLang ? getLocalLogo(continueTrackLang.slug) : null}
                      name={lastRead.languageName}
                      size={72}
                      accentColor={colors.primary}
                      style={styles.continueCardLogo}
                    />
                  </View>
                </View>
                <Text style={styles.continueCardTitle}>{lastRead.languageName} Track</Text>
                <Text style={styles.continueCardNext}>{t('home.next')}: {nextArticleInTrack?.title ?? continueArticle.title}</Text>
                <Text style={styles.continueCardProgressLabel}>{t('home.courseProgress')}</Text>
                <View style={styles.continueCardProgressBar}>
                  <View style={[styles.continueCardProgressFill, { width: `${continueProgressPercent}%` }]} />
                </View>
                <View style={styles.continueCardBottom}>
                  <Text style={styles.continueCardPercent}>{continueProgressPercent}%</Text>
                  <View style={styles.continuePlayBtn}>
                    <Ionicons name="play" size={24} color={colors.background} />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  try {
                    navigation.navigate('Programming');
                  } catch (e) {
                    if (__DEV__) console.warn('Navigation error:', e);
                  }
                }}
                style={styles.continueCard}
              >
                <View style={styles.continueCardImage}>
                  <View style={styles.continueCardImagePlaceholder}>
                    <Ionicons name="school" size={48} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.continueCardTitle}>{t('home.startLearning')}</Text>
                <Text style={styles.continueCardNext}>{t('home.browseLanguages')}</Text>
                <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Programming')} activeOpacity={0.8}>
                  <Text style={styles.heroButtonText}>{t('home.browseLanguages')}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Recommended Languages */}
          <View style={styles.recommendedHeader}>
            <Text style={styles.sectionTitle}>{t('home.recommendedLanguages')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Programming')}>
              <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {recommendedLanguages.map((lang, index) => (
            <Animated.View key={lang.id} entering={FadeInDown.delay(160 + index * 50).springify().damping(18)}>
              <TouchableOpacity
                style={styles.langCard}
                activeOpacity={0.85}
                onPress={() => {
                  try {
                    navigation.navigate('ArticleList', { languageId: lang.id, languageName: lang.name });
                  } catch (e) {
                    if (__DEV__) console.warn('Navigation error:', e);
                  }
                }}
              >
                <View style={styles.langCardIconWrap}>
                  <LangIcon
                    iconUri={lang.icon}
                    iconSource={getLocalLogo(lang.slug)}
                    name={lang.name}
                    size={48}
                    accentColor={colors.primary}
                    style={styles.langCardIcon}
                  />
                </View>
                <View style={styles.langCardBody}>
                  <Text style={styles.langCardTitle}>{lang.name}</Text>
                  <Text style={styles.langCardDesc}>{lang.articleCount} articles • {lang.description}</Text>
                  <View style={styles.langCardTag}>
                    <Text style={styles.langCardTagText}>{lang.tag}</Text>
                  </View>
                  <View style={styles.langCardProgressWrap}>
                    <View style={styles.langCardProgressBg}>
                      <View style={[styles.langCardProgressFill, { width: `${lang.progress}%` }]} />
                    </View>
                    <Text style={styles.langCardProgressText}>{lang.progress}%</Text>
                  </View>
                </View>
                <View style={styles.langCardAction}>
                  {lang.progress >= 100 ? (
                    <View style={styles.langCardActionBtn}><Ionicons name="checkmark" size={20} color={colors.primary} /></View>
                  ) : lang.progress === 0 ? (
                    <View style={styles.langCardActionBtn}><Ionicons name="add" size={20} color={colors.primary} /></View>
                  ) : (
                    <View style={styles.langCardActionBtn}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Token / Recharge card at bottom */}
          <TouchableOpacity
            style={styles.rechargeCard}
            onPress={() => navigation.navigate('RechargeTokens')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.15)', 'rgba(59, 130, 246, 0.1)']}
              style={styles.rechargeCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.rechargeCardLeft}>
                <View style={styles.rechargeIconWrap}>
                  <Ionicons name="flash" size={22} color="#8B5CF6" />
                </View>
                <View style={styles.rechargeTextWrap}>
                  <Text style={styles.rechargeCardTitle}>{t('home.aiTokens')}</Text>
                  <View style={styles.rechargeProgress}>
                    <View style={styles.rechargeProgressBar}>
                      <View 
                        style={[
                          styles.rechargeProgressFill, 
                          { width: `${Math.min(100, ((totalAvailable ?? 0) / 300) * 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.rechargeCardSub}>{totalAvailable ?? 0} {t('home.tokensLeft')}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.rechargeAction}>
                <Text style={styles.rechargeActionText}>{t('home.recharge')}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
