import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { useProgress } from '../context/ProgressContext';
import { useBookmarks } from '../context/BookmarksContext';
import { MOCK_ARTICLES, MOCK_LANGUAGES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, AI_TOKENS, SHADOWS } from '../constants/theme';
import { getConversations, getAuthTokens } from '../services/api';
import { LangIcon } from '../components/LangIcon';
import { getLocalLogo } from '../data/langLogos';

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
  const streakDays = completedCount === 0 ? 0 : Math.min(30, Math.max(1, Math.floor(completedCount / 2)));
  const streakTrend = streakDays === 0 ? 'Start learning' : streakDays >= 7 ? 'On fire!' : 'Keep it up';

  const continueArticle = lastRead
    ? (MOCK_ARTICLES[lastRead.languageId] ?? []).find((a) => a.id === lastRead.articleId)
    : null;

  // Recommended languages: those that have articles, with progress from completedArticleIds
  const recommendedLanguages = useMemo(() => {
    const langIds = Object.keys(MOCK_ARTICLES);
    return MOCK_LANGUAGES.filter((lang) => langIds.includes(lang.id)).slice(0, 6).map((lang) => {
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header: avatar, welcome, bell, gear */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <Ionicons name="person" size={24} color={COLORS.textMuted} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name} numberOfLines={1}>{user?.name ?? 'Developer'}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}} hitSlop={10}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Dashboard')} hitSlop={10}>
              <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages or articles..."
            placeholderTextColor={COLORS.textMuted}
            editable={false}
          />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Two stat cards: Streak | Read */}
          <View style={styles.twoStatsRow}>
            <Animated.View entering={FadeInDown.delay(60).springify().damping(18)} style={[styles.statCardBlue, styles.statCardHalf]}>
              <View style={styles.statCardTop}>
                <Ionicons name="flash" size={20} color={COLORS.textPrimary} />
                <Text style={styles.statCardLabel}>STREAK</Text>
              </View>
              <Text style={styles.statCardValue}>{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</Text>
              <Text style={styles.statCardTrend}>{streakTrend}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(100).springify().damping(18)} style={[styles.statCardGold, styles.statCardHalf]}>
              <View style={styles.statCardTop}>
                <Ionicons name="book" size={20} color={COLORS.textPrimary} />
                <Text style={styles.statCardLabel}>READ</Text>
              </View>
              <Text style={styles.statCardValue}>{completedCount} Articles</Text>
              <Text style={styles.statCardTrend}>{totalArticles > 0 ? `📈 ${Math.round(learningPercent)}% total` : '—'}</Text>
            </Animated.View>
          </View>

          {/* Continue Learning */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="play" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Continue Learning</Text>
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
                      accentColor={COLORS.primary}
                      style={styles.continueCardLogo}
                    />
                  </View>
                </View>
                <Text style={styles.continueCardTitle}>{lastRead.languageName} Track</Text>
                <Text style={styles.continueCardNext}>Next: {nextArticleInTrack?.title ?? continueArticle.title}</Text>
                <Text style={styles.continueCardProgressLabel}>COURSE PROGRESS</Text>
                <View style={styles.continueCardProgressBar}>
                  <View style={[styles.continueCardProgressFill, { width: `${continueProgressPercent}%` }]} />
                </View>
                <View style={styles.continueCardBottom}>
                  <Text style={styles.continueCardPercent}>{continueProgressPercent}%</Text>
                  <View style={styles.continuePlayBtn}>
                    <Ionicons name="play" size={24} color={COLORS.background} />
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
                    <Ionicons name="school" size={48} color={COLORS.primary} />
                  </View>
                </View>
                <Text style={styles.continueCardTitle}>Start Learning</Text>
                <Text style={styles.continueCardNext}>Browse languages and pick a track</Text>
                <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Programming')} activeOpacity={0.8}>
                  <Text style={styles.heroButtonText}>Browse Languages</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Recommended Languages */}
          <View style={styles.recommendedHeader}>
            <Text style={styles.sectionTitle}>Recommended Languages</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Programming')}>
              <Text style={styles.viewAll}>View All</Text>
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
                    accentColor={COLORS.primary}
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
                    <View style={styles.langCardActionBtn}><Ionicons name="checkmark" size={20} color={COLORS.primary} /></View>
                  ) : lang.progress === 0 ? (
                    <View style={styles.langCardActionBtn}><Ionicons name="add" size={20} color={COLORS.primary} /></View>
                  ) : (
                    <View style={styles.langCardActionBtn}><Ionicons name="chevron-forward" size={20} color={COLORS.primary} /></View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Token / Recharge card at bottom */}
          <TouchableOpacity
            style={styles.rechargeCard}
            onPress={() => navigation.navigate('RechargeTokens')}
            activeOpacity={0.8}
          >
            <View style={styles.rechargeCardLeft}>
              <Ionicons name="flash" size={20} color={COLORS.warning} />
              <View>
                <Text style={styles.rechargeCardTitle}>AI Tokens</Text>
                <Text style={styles.rechargeCardSub}>{totalAvailable ?? 0} remaining</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  greeting: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerIconBtn: { padding: SPACING.xs },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  twoStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCardHalf: { flex: 1 },
  statCardBlue: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  statCardGold: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statCardLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  statCardTrend: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.success,
    marginTop: 2,
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
    color: COLORS.textPrimary,
  },
  continueCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  continueCardImage: {
    height: 120,
    backgroundColor: COLORS.backgroundElevated,
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
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagYellowText: { fontSize: 10, fontFamily: FONTS.bold, color: COLORS.background },
  tagDark: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagDarkText: { fontSize: 10, fontFamily: FONTS.bold, color: COLORS.textPrimary },
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
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  continueCardNext: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    marginTop: 2,
  },
  continueCardProgressLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  continueCardProgressBar: {
    height: 6,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.full,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  continueCardProgressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
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
    color: COLORS.textPrimary,
  },
  continuePlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
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
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
    alignSelf: 'center',
  },
  heroButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
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
    color: COLORS.primary,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  langCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundElevated,
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
    color: COLORS.textPrimary,
  },
  langCardDesc: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  langCardTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },
  langCardTagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.background,
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
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  langCardProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  langCardProgressText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  langCardAction: {},
  langCardActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  rechargeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rechargeCardTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  rechargeCardSub: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
});
