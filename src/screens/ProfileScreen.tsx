import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Dimensions,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import { useBookmarks } from '../context/BookmarksContext';
import { MOCK_ARTICLES, MOCK_LANGUAGES } from '../data/mockContent';
import { EmptyState } from '../components/EmptyState';
import { LangIcon } from '../components/LangIcon';
import { getLocalLogo } from '../data/langLogos';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  XP_PER_ARTICLE,
  getStreakFromCompletedArticles,
  getLast7DaysCompleted,
  getLast30DaysXP,
} from '../utils/progressUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 7500, 10500, 14000, 18000, 22500, 27500, 33000, 39000];

function getLevelFromXP(xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const levelStart = LEVEL_THRESHOLDS[level - 1];
  const levelEnd = LEVEL_THRESHOLDS[level] ?? levelStart + 5000;
  const nextLevelXP = levelEnd - levelStart;
  const currentXP = xp - levelStart;
  const progress = nextLevelXP > 0 ? Math.min(1, currentXP / nextLevelXP) : 1;
  return { level, currentXP, nextLevelXP, progress };
}

export function ProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { completedArticleIds, completedArticles } = useProgress();
  const { bookmarks } = useBookmarks();

  const completedCount = completedArticleIds.length;
  const xp = completedCount * XP_PER_ARTICLE;
  const { level, progress } = getLevelFromXP(xp);

  const streakDays = useMemo(() => getStreakFromCompletedArticles(completedArticles), [completedArticles]);
  const weeks = Math.floor(streakDays / 7);
  const remainderDays = streakDays % 7;
  const streakLabel =
    streakDays === 0
      ? '0 days'
      : weeks > 0 && remainderDays > 0
      ? `${weeks} week${weeks > 1 ? 's' : ''}, ${remainderDays} day${remainderDays > 1 ? 's' : ''}`
      : weeks > 0
      ? `${weeks} week${weeks > 1 ? 's' : ''}`
      : `${remainderDays} day${remainderDays > 1 ? 's' : ''}`;

  const streakCalendarDays = useMemo(() => getLast7DaysCompleted(completedArticles), [completedArticles]);

  const xpGraphData = useMemo(() => getLast30DaysXP(completedArticles), [completedArticles]);

  // SVG area chart path from xpGraphData
  const graphWidth = SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 4;
  const graphHeight = 80;
  const areaChartPath = useMemo(() => {
    const maxVal = Math.max(...xpGraphData, 1);
    const pts = xpGraphData.map((val, i) => {
      const x = (i / (xpGraphData.length - 1)) * graphWidth;
      const y = graphHeight - Math.max(2, (val / maxVal) * graphHeight);
      return { x, y };
    });
    let d = `M 0 ${graphHeight}`;
    pts.forEach((p) => { d += ` L ${p.x} ${p.y}`; });
    d += ` L ${graphWidth} ${graphHeight} Z`;
    return d;
  }, [xpGraphData, graphWidth]);

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

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out CodeVerse - Learn programming with articles and AI mentor!',
        title: 'CodeVerse',
      });
    } catch (e) {
      // Share cancelled or failed
    }
  };

  const handleUpdateProfile = () => {
    Alert.alert(
      'Update Profile',
      'Profile update feature coming soon. You can update your name and email from account settings.',
      [{ text: 'OK' }, { text: 'Go to Settings', onPress: () => navigation.navigate('Main', { screen: 'Settings' }) }]
    );
  };

  const handleLeaderboard = () => {
    Alert.alert(
      'Leaderboard',
      'Leaderboard feature coming soon. Compete with other learners!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{t('profile.title')}</Text>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation.navigate('Main', { screen: 'Settings' })}>
            <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile header with update option */}
          <Animated.View
            entering={FadeInDown.delay(0).springify().damping(18)}
            style={styles.profileHeader}
          >
            <View style={styles.avatarWrap}>
              <ExpoLinearGradient
                colors={['#3B82F6', '#8B5CF6', '#EC4899']}
                style={styles.avatarRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user?.name ?? 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              </ExpoLinearGradient>
            </View>
            <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
            {user?.email && (
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user.email}
              </Text>
            )}
            <TouchableOpacity
              style={styles.updateProfileBtn}
              onPress={handleUpdateProfile}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
              <Text style={styles.updateProfileText}>{t('profile.updateProfile')}</Text>
            </TouchableOpacity>

            {/* Stats pills */}
            <View style={styles.statsPillsRow}>
              <View style={[styles.statPill, { backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder }]}>
                <Text style={styles.statPillValue}>Lv{level}</Text>
                <Text style={styles.statPillLabel}>{t('profile.level')}</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder }]}>
                <Text style={styles.statPillValue}>{xp >= 1000 ? `${(xp / 1000).toFixed(1)}K` : xp}</Text>
                <Text style={styles.statPillLabel}>{t('profile.xp')}</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder }]}>
                <Text style={styles.statPillValue}>{streakDays}d</Text>
                <Text style={styles.statPillLabel}>{t('home.streak')}</Text>
              </View>
            </View>

            {/* Share & Leaderboard */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name="share-social" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.actionLabel}>{t('profile.share')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLeaderboard} activeOpacity={0.8}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name="trophy" size={22} color={COLORS.secondary} />
                </View>
                <Text style={styles.actionLabel}>{t('profile.leaderboard')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Streaks - complete weeks with rounded days */}
          <Animated.View
            entering={FadeInDown.delay(60).springify().damping(18)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="flame" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>{t('profile.streaks')}</Text>
            </View>
            <View
              style={[
                styles.streakCard,
                { backgroundColor: COLORS.backgroundCard, borderColor: COLORS.border },
                SHADOWS.card,
              ]}
            >
              <ExpoLinearGradient
                colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']}
                style={styles.streakCardBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.streakContent}>
                  <View style={[styles.streakIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                    <Ionicons name="flame" size={28} color={COLORS.secondary} />
                  </View>
                  <View style={styles.streakTextWrap}>
                    <Text style={styles.streakValue}>{streakLabel}</Text>
                    <Text style={styles.streakLabel}>{t('profile.completeWeeksStreak')}</Text>
                  </View>
                </View>
                <View style={styles.streakCalendarRow}>
                  {streakCalendarDays.map((filled, i) => (
                    <View
                      key={i}
                      style={[
                        styles.streakDot,
                        { backgroundColor: filled ? COLORS.secondary : COLORS.border },
                        filled && styles.streakDotFilled,
                      ]}
                    />
                  ))}
                </View>
              </ExpoLinearGradient>
            </View>
          </Animated.View>

          {/* Experience - 30-day graph */}
          <Animated.View
            entering={FadeInDown.delay(100).springify().damping(18)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{t('profile.experience')}</Text>
              <View style={styles.xpHeaderRight}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Level {level}</Text>
                </View>
                <Text style={styles.xpTotal}>{xp.toLocaleString()} XP</Text>
              </View>
            </View>
            <View style={styles.levelProgressWrap}>
              <View style={styles.levelProgressBg}>
                <View style={[styles.levelProgressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            <View style={[styles.graphCard, styles.graphCardElevated, { backgroundColor: COLORS.backgroundCard, borderColor: COLORS.border }]}>
              <View style={styles.graphSvgWrap}>
                <Svg width={graphWidth} height={graphHeight} style={styles.graphSvg}>
                  <Defs>
                    <SvgLinearGradient id="xpGradient" x1="0" y1="1" x2="0" y2="0">
                      <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.4" />
                      <Stop offset="1" stopColor={COLORS.primary} stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Path d={areaChartPath} fill="url(#xpGradient)" />
                </Svg>
              </View>
              <View style={styles.graphLabels}>
                <Text style={styles.graphLabel}>30 days ago</Text>
                <Text style={styles.graphLabel}>Today</Text>
              </View>
            </View>
          </Animated.View>

          {/* My Library */}
          <Animated.View
            entering={FadeInDown.delay(140).springify().damping(18)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="library" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>My Library</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Programming')}>
                <Text style={styles.viewAll}>Browse</Text>
              </TouchableOpacity>
            </View>
            {!bookmarkedArticles.length ? (
              <EmptyState
                icon="bookmark-outline"
                title="No saved articles"
                subtitle="Save articles to read later"
                actionLabel="Browse Articles"
                onAction={() => navigation.navigate('Programming')}
              />
            ) : (
              bookmarkedArticles.slice(0, 8).map(({ article, languageName, articleTitle }) => {
                const lang = MOCK_LANGUAGES.find((l) => l.id === article.languageId);
                return (
                  <Pressable
                    key={article.id}
                    style={({ pressed }) => [
                      styles.libraryCard,
                      SHADOWS.card,
                      pressed && styles.libraryCardPressed,
                    ]}
                    onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    onPress={() =>
                      navigation.navigate('ArticleDetail', { article, languageName })
                    }
                  >
                    <View style={styles.libraryThumb}>
                      <LangIcon
                        iconUri={lang?.icon}
                        iconSource={lang ? getLocalLogo(lang.slug) : null}
                        name={languageName}
                        size={36}
                        accentColor={COLORS.primary}
                        style={styles.libraryIcon}
                      />
                    </View>
                    <View style={styles.libraryBody}>
                      <Text style={styles.libraryTitle} numberOfLines={2}>
                        {articleTitle}
                      </Text>
                      <Text style={styles.libraryMeta}>
                        {languageName} • {article.readTimeMinutes} min read
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </Pressable>
                );
              })
            )}
          </Animated.View>
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
  topBarBtn: { padding: SPACING.sm },
  topBarTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xxl },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 38,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  profileName: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  updateProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  updateProfileText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  statsPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  statPillValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  statPillLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.button,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  streakCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  streakCardBg: {
    padding: SPACING.lg,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  streakIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTextWrap: { flex: 1 },
  streakValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  streakLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  streakCalendarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.15)',
  },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakDotFilled: {
    borderColor: COLORS.secondary,
  },
  xpHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryMuted,
  },
  levelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  xpTotal: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  levelProgressWrap: {
    marginBottom: SPACING.md,
  },
  levelProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.backgroundElevated,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  graphCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    minHeight: 120,
  },
  graphCardElevated: {
    ...SHADOWS.cardElevated,
  },
  graphSvgWrap: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphSvg: {},
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: 2,
  },
  graphLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
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
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  libraryCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  libraryThumb: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  libraryIcon: { backgroundColor: 'transparent' },
  libraryBody: { flex: 1, minWidth: 0 },
  libraryTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  libraryMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
