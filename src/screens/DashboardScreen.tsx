import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarksContext';
import { useProgress } from '../context/ProgressContext';
import { MOCK_ARTICLES } from '../data/mockContent';
import { EmptyState } from '../components/EmptyState';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';
import { getConversations } from '../services/api';

export function DashboardScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { bookmarks } = useBookmarks();
  const { completedArticleIds } = useProgress();
  const [conversationCount, setConversationCount] = useState(0);

  const bookmarkedArticles = useMemo(
    () =>
      bookmarks
        .map((b) => {
          const article = (MOCK_ARTICLES[b.languageId] ?? []).find((a) => a.id === b.articleId);
          return article ? { ...b, article } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [bookmarks]
  );

  const completedCount = completedArticleIds.length;
  const level = Math.max(1, Math.floor(completedCount / 5) + 1);
  const xp = completedCount * 100;
  const certs = Math.floor(completedCount / 15);
  // Streak: derive from activity (completed articles). Without date storage, use progress-based streak.
  const streakDays = completedCount === 0 ? 0 : Math.min(30, Math.max(1, Math.floor(completedCount / 2)));
  const levelTitle = level <= 2 ? 'Beginner' : level <= 5 ? 'Learner' : level <= 8 ? 'Developer' : level <= 12 ? 'Code Master' : 'Architect';

  const skillRadarValues = useMemo(() => {
    const langIds = Object.keys(MOCK_ARTICLES);
    const totals: Record<string, number> = {};
    let maxTotal = 0;
    langIds.forEach((id) => {
      const articles = MOCK_ARTICLES[id] ?? [];
      const completed = articles.filter((a) => completedArticleIds.includes(a.id)).length;
      totals[id] = articles.length > 0 ? (completed / articles.length) * 100 : 0;
      if (articles.length > 0) maxTotal = Math.max(maxTotal, completed);
    });
    const js = totals['1'] ?? 0;
    const py = totals['2'] ?? 0;
    const cssUi = (totals['4'] ?? 0) * 0.5 + (totals['3'] ?? 0) * 0.5;
    return { js, py, cssUi };
  }, [completedArticleIds]);

  const achievements = useMemo(() => {
    const n = completedCount;
    return [
      { id: 'fast', label: 'FAST LEARNER', icon: 'medal', unlocked: n >= 1, color: COLORS.secondary },
      { id: 'code', label: 'CODE MASTER', icon: 'code-slash', unlocked: n >= 10, color: COLORS.primary },
      { id: 'algo', label: 'ALGORITHM HERO', icon: 'star', unlocked: n >= 25, color: COLORS.textMuted },
    ];
  }, [completedCount]);

  const subscriptionPlan = user?.subscriptionPlan ?? 'free';
  const planDisplayLabel = subscriptionPlan === 'pro' ? 'Pro' : subscriptionPlan === 'free' ? 'Free' : 'Other';
  const isPro = subscriptionPlan === 'pro';

  useEffect(() => {
    if (user) loadConversationCount();
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) loadConversationCount();
    });
    return unsubscribe;
  }, [user, navigation]);

  const loadConversationCount = async () => {
    try {
      const { getAuthTokens } = await import('../services/api');
      const tokens = getAuthTokens();
      if (tokens?.accessToken) {
        const result = await getConversations();
        setConversationCount(result.conversations?.length || 0);
      }
    } catch {
      setConversationCount(0);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Codeverse</Text>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.topBarBtn} onPress={() => {}}>
              <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarBtn} onPress={() => {}}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</Text>
                </View>
              </View>
              {isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
            {user?.email ? (
              <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
            ) : null}
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>LEVEL {level}</Text>
              </View>
              <Text style={styles.profileTitle}>{levelTitle} · {planDisplayLabel}</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Ionicons name="flame" size={22} color={COLORS.secondary} />
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</Text>
            </View>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Ionicons name="flash" size={22} color={COLORS.primary} />
              <Text style={styles.statLabel}>XP</Text>
              <Text style={styles.statValue}>{xp.toLocaleString()}</Text>
            </View>
            <View style={styles.statCol}>
              <Ionicons name="shield-checkmark" size={22} color={COLORS.secondary} />
              <Text style={styles.statLabel}>Certs</Text>
              <Text style={styles.statValue}>{certs}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bar-chart" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Skill Radar</Text>
            </View>
            <View style={styles.radarCard}>
              <View style={styles.radarPlaceholder}>
                <View style={styles.radarAxis}>
                  <Text style={styles.radarAxisLabel}>JAVASCRIPT</Text>
                  <View style={[styles.radarFill, { height: `${skillRadarValues.js}%`, alignSelf: 'center' }]} />
                </View>
                <View style={styles.radarAxis}>
                  <Text style={styles.radarAxisLabel}>CSS/UI</Text>
                  <View style={[styles.radarFill, { height: `${skillRadarValues.cssUi}%` }]} />
                </View>
                <View style={styles.radarAxis}>
                  <Text style={styles.radarAxisLabel}>PYTHON</Text>
                  <View style={[styles.radarFill, { height: `${skillRadarValues.py}%` }]} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trophy" size={18} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Achievements</Text>
              <TouchableOpacity onPress={() => {}}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
              {achievements.map((a) => (
                <View key={a.id} style={styles.achievementCard}>
                  <View style={[styles.achievementIconWrap, { borderColor: a.unlocked ? a.color : COLORS.textMuted }]}>
                    <Ionicons name={a.icon as any} size={28} color={a.unlocked ? a.color : COLORS.textMuted} />
                  </View>
                  <Text style={styles.achievementLabel}>{a.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bookmark" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Saved Articles</Text>
            </View>
            {!bookmarkedArticles.length ? (
              <EmptyState
                icon="bookmark-outline"
                title="No bookmarks yet"
                subtitle="Save articles to read later"
                actionLabel="Browse Articles"
                onAction={() => navigation.navigate('Programming')}
              />
            ) : (
              bookmarkedArticles.slice(0, 5).map(({ article, languageName, articleTitle }) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.savedCard}
                  onPress={() => navigation.navigate('ArticleDetail', { article, languageName })}
                  activeOpacity={0.85}
                >
                  <View style={styles.savedThumb} />
                  <View style={styles.savedBody}>
                    <Text style={styles.savedTitle} numberOfLines={1}>{articleTitle}</Text>
                    <Text style={styles.savedMeta}>AI Guided • {article.readTimeMinutes} min read</Text>
                  </View>
                  <TouchableOpacity style={styles.savedMore} onPress={() => {}}>
                    <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.planRow}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.planRowLabel}>Plan</Text>
              <View style={[styles.planChip, isPro && styles.planChipPro]}>
                <Text style={[styles.planChipText, isPro && styles.planChipTextPro]}>{planDisplayLabel}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('RechargeTokens')} activeOpacity={0.7}>
              <Ionicons name="flash" size={22} color={COLORS.primary} />
              <Text style={styles.settingsRowText}>Recharge tokens</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsRow} onPress={() => {}} activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
              <Text style={styles.settingsRowText}>Profile Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsRow} onPress={() => {}} activeOpacity={0.7}>
              <Ionicons name="shield-outline" size={22} color={COLORS.textPrimary} />
              <Text style={styles.settingsRowText}>Security & Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingsRow, styles.signOutRow]} onPress={signOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={styles.signOutText}>Log Out</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarBtn: { padding: SPACING.xs },
  topBarTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarWrap: { position: 'relative' },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  proBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  proBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.background,
  },
  profileName: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  profileEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  levelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  levelBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  profileTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statColBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  section: { marginBottom: SPACING.xl },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  viewAll: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  radarCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    minHeight: 140,
  },
  radarPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  radarAxis: {
    alignItems: 'center',
    width: 80,
  },
  radarAxisLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  radarFill: {
    width: 24,
    minHeight: 4,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs,
  },
  achievementsScroll: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  achievementCard: {
    alignItems: 'center',
    width: 88,
  },
  achievementIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  achievementLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  savedThumb: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundElevated,
    marginRight: SPACING.md,
  },
  savedBody: { flex: 1, minWidth: 0 },
  savedTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  savedMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  savedMore: { padding: SPACING.xs },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  planRowLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    flex: 1,
  },
  planChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundElevated,
  },
  planChipPro: {
    backgroundColor: COLORS.secondary,
  },
  planChipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
  },
  planChipTextPro: {
    color: COLORS.background,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  settingsRowText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  signOutRow: {
    backgroundColor: COLORS.error + '18',
    borderColor: COLORS.error + '40',
  },
  signOutText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
});
