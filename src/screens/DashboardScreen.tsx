import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { useBookmarks } from '../context/BookmarksContext';
import { MOCK_ARTICLES } from '../data/mockContent';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, AI_TOKENS } from '../constants/theme';
import { getConversations } from '../services/api';

export function DashboardScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { freeUsed, freeRemaining, purchasedTotal, purchasedUsed, totalAvailable } = useTokens();
  const { bookmarks } = useBookmarks();
  const [conversationCount, setConversationCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const bookmarkedArticles = bookmarks
    .map((b) => {
      const article = (MOCK_ARTICLES[b.languageId] ?? []).find((a) => a.id === b.articleId);
      return article ? { ...b, article } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Load conversation count on mount and when screen is focused
  useEffect(() => {
    if (user) {
      loadConversationCount();
    }
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        loadConversationCount();
      }
    });
    
    return unsubscribe;
  }, [user, navigation]);

  const loadConversationCount = async () => {
    setLoadingConversations(true);
    try {
      const { getAuthTokens } = await import('../services/api');
      const tokens = getAuthTokens();
      if (tokens?.accessToken) {
        const result = await getConversations();
        setConversationCount(result.conversations?.length || 0);
      }
    } catch (e) {
      // Silently fail - expected if not authenticated
      setConversationCount(0);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Calculate token usage percentage (safe division)
  const freeUsagePercent = AI_TOKENS.FREE_LIMIT > 0 
    ? Math.min(100, (freeUsed / AI_TOKENS.FREE_LIMIT) * 100)
    : 0;
  const purchasedRemaining = Math.max(0, purchasedTotal - purchasedUsed);
  
  // Quick stats
  const stats = [
    {
      label: 'AI Conversations',
      value: loadingConversations ? '...' : (conversationCount || 0).toString(),
      icon: 'chatbubbles',
      color: COLORS.primary,
      onPress: () => {
        try {
          navigation.navigate('AIMentor');
        } catch (e) {
          if (__DEV__) console.warn('Navigation error:', e);
        }
      },
    },
    {
      label: 'Bookmarks',
      value: (bookmarks?.length || 0).toString(),
      icon: 'bookmark',
      color: COLORS.secondary,
      onPress: () => {
        try {
          navigation.navigate('Programming');
        } catch (e) {
          if (__DEV__) console.warn('Navigation error:', e);
        }
      },
    },
    {
      label: 'AI Tokens',
      value: (totalAvailable || 0).toString(),
      icon: 'flash',
      color: COLORS.warning,
      onPress: () => {
        try {
          navigation.navigate('RechargeTokens');
        } catch (e) {
          if (__DEV__) console.warn('Navigation error:', e);
        }
      },
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.title}>{user?.name ?? 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              try {
                navigation.navigate('RechargeTokens');
              } catch (e) {
                if (__DEV__) console.warn('Navigation error:', e);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                onPress={stat.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Profile Card */}
          <Card style={styles.card} elevated>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardTitleIcon}>
                  <Ionicons name="person-circle" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>Profile</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name} numberOfLines={1}>
                  {user?.name ?? 'User'}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {user?.email ?? ''}
                </Text>
                <View style={styles.providerBadge}>
                  <Ionicons 
                    name={user?.provider === 'email' ? 'mail' : 'logo-google'} 
                    size={12} 
                    color={COLORS.textMuted} 
                  />
                  <Text style={styles.provider}>
                    {user?.provider === 'email' ? 'Email' : 'Google'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* AI Tokens Card */}
          <Card style={styles.card} elevated>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardTitleIcon, { backgroundColor: COLORS.warningMuted }]}>
                  <Ionicons name="flash" size={16} color={COLORS.warning} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>AI Tokens</Text>
                  <Text style={styles.cardSubtitle}>Track your usage</Text>
                </View>
              </View>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>{totalAvailable}</Text>
              </View>
            </View>
            
            {/* Free Tokens Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Free Tokens</Text>
                <Text style={styles.progressValue}>
                  {freeRemaining} / {AI_TOKENS.FREE_LIMIT} remaining
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
              <Text style={styles.progressSubtext}>
                {freeUsed} tokens used
              </Text>
            </View>

            {/* Purchased Tokens */}
            {purchasedTotal > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Purchased Tokens</Text>
                  <Text style={styles.progressValue}>
                    {purchasedRemaining} / {purchasedTotal} remaining
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${Math.min(100, Math.max(0, (purchasedRemaining / purchasedTotal) * 100))}%`,
                        backgroundColor: COLORS.secondary,
                      }
                    ]} 
                  />
                </View>
              </View>
            )}

            <NeonButton
              title="Recharge Tokens"
              onPress={() => {
                try {
                  navigation.navigate('RechargeTokens');
                } catch (e) {
                  if (__DEV__) console.warn('Navigation error:', e);
                }
              }}
              variant="outline"
              style={styles.rechargeBtn}
            />
          </Card>

          {/* Bookmarks Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Bookmarks</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{bookmarks?.length || 0}</Text>
              </View>
            </View>
            {!bookmarkedArticles || bookmarkedArticles.length === 0 ? (
              <EmptyState
                icon="bookmark-outline"
                title="No bookmarks yet"
                subtitle="Save articles you want to read later by tapping the bookmark icon"
                actionLabel="Browse Articles"
                onAction={() => {
                  try {
                    navigation.navigate('Programming');
                  } catch (e) {
                    if (__DEV__) console.warn('Navigation error:', e);
                  }
                }}
              />
            ) : (
              <>
                {bookmarkedArticles?.slice(0, 5).map(({ article, languageName, articleTitle }) => (
                  <TouchableOpacity
                    key={article.id}
                    style={styles.bookmarkRow}
                    onPress={() => {
                      try {
                        navigation.navigate('ArticleDetail', { article, languageName });
                      } catch (e) {
                        if (__DEV__) console.warn('Navigation error:', e);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.bookmarkIconWrap}>
                      <Ionicons name="bookmark" size={16} color={COLORS.secondary} />
                    </View>
                    <View style={styles.bookmarkText}>
                      <Text style={styles.bookmarkTitle} numberOfLines={1}>{articleTitle}</Text>
                      <Text style={styles.bookmarkMeta}>{languageName}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
                {bookmarkedArticles.length > 5 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => {
                    try {
                      navigation.navigate('Programming');
                    } catch (e) {
                      if (__DEV__) console.warn('Navigation error:', e);
                    }
                  }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewAllText}>
                      View all {bookmarkedArticles.length} bookmarks
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card>

          {/* Quick Actions */}
          <Card style={styles.card} elevated>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardTitleIcon, { backgroundColor: COLORS.primaryMuted }]}>
                  <Ionicons name="flash" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>Quick Actions</Text>
              </View>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  try {
                    navigation.navigate('AIMentor');
                  } catch (e) {
                    if (__DEV__) console.warn('Navigation error:', e);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="sparkles" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.quickActionLabel}>AI Mentor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                    onPress={() => {
                      try {
                        navigation.navigate('Programming');
                      } catch (e) {
                        if (__DEV__) console.warn('Navigation error:', e);
                      }
                    }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                  <Ionicons name="code-slash" size={24} color={COLORS.secondary} />
                </View>
                <Text style={styles.quickActionLabel}>Learn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  try {
                    navigation.navigate('RechargeTokens');
                  } catch (e) {
                    if (__DEV__) console.warn('Navigation error:', e);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="flash" size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.quickActionLabel}>Recharge</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <NeonButton 
            title="Sign Out" 
            onPress={signOut} 
            variant="outline" 
            style={styles.signOut} 
          />
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
    paddingVertical: SPACING.md 
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.lg },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs / 2,
  },
  tokenBadge: {
    backgroundColor: COLORS.warningMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.warning + '25',
    minWidth: 48,
    alignItems: 'center',
  },
  tokenBadgeText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.warning,
    letterSpacing: -0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 110,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  profileInfo: { flex: 1 },
  name: { 
    fontSize: FONT_SIZES.lg, 
    fontFamily: FONTS.primary, 
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  email: { 
    fontSize: FONT_SIZES.sm, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
  provider: { 
    fontSize: FONT_SIZES.xs, 
    fontFamily: FONTS.regular, 
    color: COLORS.textMuted,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressSubtext: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  rechargeBtn: { marginTop: SPACING.sm },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateButton: {
    marginTop: SPACING.sm,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  bookmarkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkText: { flex: 1 },
  bookmarkTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  bookmarkMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary,
    color: COLORS.primary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 100,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  signOut: { marginTop: SPACING.lg },
});
