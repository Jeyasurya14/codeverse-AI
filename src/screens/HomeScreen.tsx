import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { useProgress } from '../context/ProgressContext';
import { useBookmarks } from '../context/BookmarksContext';
import { MOCK_ARTICLES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, AI_TOKENS } from '../constants/theme';
import { Card } from '../components/Card';
import { SkeletonStatCard } from '../components/Skeleton';
import { getConversations, getAuthTokens } from '../services/api';

const QUICK_LINKS = [
  { 
    id: '1', 
    label: 'Learn Programming', 
    route: 'Programming', 
    accent: COLORS.primary,
    icon: 'book',
    description: 'Master coding from basics',
  },
  { 
    id: '2', 
    label: 'AI Mentor', 
    route: 'AIMentor', 
    accent: COLORS.secondary,
    icon: 'sparkles',
    description: 'Get AI-powered help',
  },
  { 
    id: '3', 
    label: 'Interview Prep', 
    route: 'AIMentor', 
    accent: COLORS.warning,
    icon: 'briefcase',
    description: 'Practice coding interviews',
  },
];

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { totalAvailable, freeRemaining, freeUsed } = useTokens();
  const { lastRead, completedArticleIds } = useProgress();
  const { bookmarks } = useBookmarks();
  const [conversationCount, setConversationCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const totalArticles = Object.values(MOCK_ARTICLES).reduce((sum, arr) => sum + arr.length, 0);
  const completedCount = completedArticleIds.length;
  const learningPercent = totalArticles > 0 ? Math.min(100, (completedCount / totalArticles) * 100) : 0;

  const continueArticle = lastRead
    ? (MOCK_ARTICLES[lastRead.languageId] ?? []).find((a) => a.id === lastRead.articleId)
    : null;

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

  // Calculate token usage percentage
  const freeUsagePercent = AI_TOKENS.FREE_LIMIT > 0 
    ? Math.min(100, (freeUsed / AI_TOKENS.FREE_LIMIT) * 100)
    : 0;

  // Quick stats
  const stats = [
    {
      label: 'AI Conversations',
      value: loadingStats ? '...' : (conversationCount || 0).toString(),
      icon: 'chatbubbles',
      color: COLORS.primary,
    },
    {
      label: 'Bookmarks',
      value: (bookmarks?.length || 0).toString(),
      icon: 'bookmark',
      color: COLORS.secondary,
    },
    {
      label: 'AI Tokens',
      value: (totalAvailable || 0).toString(),
      icon: 'flash',
      color: COLORS.warning,
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name ?? 'Developer'}
            </Text>
          </View>
          <View
            style={styles.tokenBadge}
            accessibilityLabel={`${totalAvailable ?? 0} AI tokens remaining`}
            accessibilityRole="text"
          >
            <Ionicons name="flash" size={18} color={COLORS.warning} />
            <Text style={styles.tokenValue}>{totalAvailable || 0}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {loadingStats ? (
              <>
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
              </>
            ) : (
              stats.map((stat, index) => (
                <Animated.View
                  key={stat.label}
                  entering={FadeInDown.delay(index * 60).springify().damping(18)}
                  style={[styles.statCard, { borderColor: stat.color + '20' }]}
                >
                  <View style={[styles.statIconContainer, { backgroundColor: stat.color + '18' }]}>
                    <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Animated.View>
              ))
            )}
          </View>

          {/* Learning progress */}
          <Animated.View entering={FadeInDown.delay(80).springify().damping(18)}>
            <Card style={styles.learningProgressCard}>
              <View style={styles.learningProgressHeader}>
                <View style={[styles.learningProgressIconWrap, { backgroundColor: COLORS.primary + '18' }]}>
                  <Ionicons name="school" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.learningProgressText}>
                  <Text style={styles.learningProgressLabel}>Learning progress</Text>
                  <Text style={styles.learningProgressValue}>
                    {completedCount} of {totalArticles} articles completed
                  </Text>
                </View>
              </View>
              <View style={styles.learningProgressBarWrap}>
                <View style={styles.learningProgressBarBg}>
                  <View
                    style={[
                      styles.learningProgressBarFill,
                      { width: `${learningPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.learningProgressPercent}>{Math.round(learningPercent)}%</Text>
              </View>
            </Card>
          </Animated.View>

          {/* Hero Section - Continue Learning */}
          {continueArticle ? (
            <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                try {
                  navigation.navigate('ArticleDetail', {
                    article: continueArticle,
                    languageName: lastRead!.languageName,
                  });
                } catch (e) {
                  if (__DEV__) console.warn('Navigation error:', e);
                }
              }}
              style={styles.continueWrap}
            >
              <Card accentColor={COLORS.primary} style={styles.hero}>
                <View style={styles.continueRow}>
                  <View style={styles.continueIconWrap}>
                    <Ionicons name="book" size={26} color={COLORS.primary} />
                  </View>
                  <View style={styles.continueText}>
                    <Text style={styles.continueLabel}>Continue Learning</Text>
                    <Text style={styles.heroTitle} numberOfLines={1}>
                      {lastRead!.languageName}
                    </Text>
                    <Text style={styles.heroSub} numberOfLines={2}>
                      {continueArticle.title}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
            <Card accentColor={COLORS.primary} style={styles.hero}>
              <View style={styles.heroContent}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="school" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.heroTitle}>Start Learning</Text>
                <Text style={styles.heroSub}>
                  Structured paths from fundamentals to advanced
                </Text>
                <TouchableOpacity
                  style={styles.heroButton}
                  onPress={() => {
                    try {
                      navigation.navigate('Programming');
                    } catch (e) {
                      if (__DEV__) console.warn('Navigation error:', e);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.heroButtonText}>Browse Languages</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </Card>
            </Animated.View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
          </View>
          <View style={styles.quickAccessGrid}>
            {QUICK_LINKS.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(180 + index * 50).springify().damping(18)}
              >
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => {
                  try {
                    navigation.navigate(item.route);
                  } catch (e) {
                    if (__DEV__) console.warn('Navigation error:', e);
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.quickAccessContent}>
                  <View style={[styles.quickAccessIcon, { backgroundColor: item.accent + '18' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.accent} />
                  </View>
                  <View style={styles.quickAccessText}>
                    <Text style={styles.quickAccessTitle}>{item.label}</Text>
                    <Text style={styles.quickAccessDesc}>{item.description}</Text>
                  </View>
                  <View style={[styles.quickAccessArrow, { backgroundColor: COLORS.backgroundElevated }]}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <Card style={styles.infoCard} elevated>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardTitleWrap}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="flash" size={18} color={COLORS.warning} />
                </View>
                <View>
                  <Text style={styles.infoTitle}>AI Tokens</Text>
                  <Text style={styles.infoSubtitle}>Usage</Text>
                </View>
              </View>
              <View style={styles.tokenBadgeSmall}>
                <Text style={styles.tokenBadgeValue}>{totalAvailable || 0}</Text>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Free Tokens</Text>
                <Text style={styles.progressValue}>
                  {freeRemaining} / {AI_TOKENS.FREE_LIMIT}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(freeUsagePercent, 100)}%`,
                      backgroundColor: freeUsagePercent > 80 ? COLORS.error : COLORS.primary,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressSubtext}>
                  {freeUsed} used
                </Text>
                <Text style={styles.progressSubtext}>
                  {freeRemaining} available
                </Text>
              </View>
            </View>

            <View style={styles.rechargeDivider} />
            <TouchableOpacity
              style={styles.rechargeButton}
              onPress={() => {
                try {
                  navigation.navigate('RechargeTokens');
                } catch (e) {
                  if (__DEV__) console.warn('Navigation error:', e);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.rechargeButtonText}>Recharge Tokens</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
    flexShrink: 0,
  },
  tokenValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.warning,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 106,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  learningProgressCard: {
    marginBottom: SPACING.lg,
  },
  learningProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  learningProgressIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  learningProgressText: { flex: 1, minWidth: 0 },
  learningProgressLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  learningProgressValue: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  learningProgressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  learningProgressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  learningProgressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  learningProgressPercent: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary,
    color: COLORS.primary,
    minWidth: 36,
    textAlign: 'right',
  },
  hero: { 
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  continueWrap: { 
    marginBottom: SPACING.xl,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  continueIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  continueText: { 
    flex: 1,
    minWidth: 0,
  },
  continueLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 36,
  },
  heroSub: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  heroButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  quickAccessGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  quickAccessCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  quickAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  quickAccessIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickAccessText: {
    flex: 1,
    minWidth: 0,
  },
  quickAccessTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
    letterSpacing: -0.2,
  },
  quickAccessDesc: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  quickAccessArrow: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoCard: {
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  infoCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
    minWidth: 0,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
    letterSpacing: -0.3,
  },
  infoSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  tokenBadgeSmall: {
    backgroundColor: COLORS.warningMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.warning + '25',
  },
  tokenBadgeValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.warning,
    letterSpacing: -0.3,
  },
  progressSection: {
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  progressValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSubtext: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  rechargeDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  rechargeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
});
