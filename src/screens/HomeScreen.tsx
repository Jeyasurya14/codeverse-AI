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
  const { lastRead } = useProgress();
  const { bookmarks } = useBookmarks();
  const [conversationCount, setConversationCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

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
                  entering={FadeInDown.delay(index * 80).springify().damping(15)}
                  style={styles.statCard}
                >
                  <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Animated.View>
              ))
            )}
          </View>

          {/* Hero Section - Continue Learning */}
          {continueArticle ? (
            <Animated.View entering={FadeInDown.delay(150).springify().damping(15)}>
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
                    <Ionicons name="book" size={24} color={COLORS.primary} />
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
            <Animated.View entering={FadeInDown.delay(150).springify().damping(15)}>
            <Card accentColor={COLORS.primary} style={styles.hero}>
              <View style={styles.heroContent}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="rocket" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.heroTitle}>Start Learning</Text>
                <Text style={styles.heroSub}>
                  Explore structured learning paths and master programming from fundamentals to advanced topics
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

          {/* Quick Access */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Text style={styles.sectionSubtitle}>Jump to what you need</Text>
          </View>
          <View style={styles.quickAccessGrid}>
            {QUICK_LINKS.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(250 + index * 60).springify().damping(15)}
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
                  <View style={[styles.quickAccessIcon, { backgroundColor: item.accent + '15' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.accent} />
                  </View>
                  <View style={styles.quickAccessText}>
                    <Text style={styles.quickAccessTitle}>{item.label}</Text>
                    <Text style={styles.quickAccessDesc}>{item.description}</Text>
                  </View>
                  <View style={[styles.quickAccessArrow, { backgroundColor: item.accent + '10' }]}>
                    <Ionicons name="chevron-forward" size={16} color={item.accent} />
                  </View>
                </View>
              </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Token Info Card */}
          <Card style={styles.infoCard} elevated>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardTitleWrap}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="flash" size={18} color={COLORS.warning} />
                </View>
                <View>
                  <Text style={styles.infoTitle}>AI Tokens</Text>
                  <Text style={styles.infoSubtitle}>Track your usage</Text>
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
                    }
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
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.warningMuted,
    borderWidth: 1,
    borderColor: COLORS.warning + '25',
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
    minHeight: 100,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
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
  hero: { 
    marginBottom: SPACING.xl,
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
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontSize: FONT_SIZES.hero,
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
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
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
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickAccessText: {
    flex: 1,
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
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  infoCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flex: 1,
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
