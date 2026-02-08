import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_LANGUAGES, MOCK_ARTICLES } from '../data/mockContent';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import { ProgrammingLanguage } from '../types';
import { LangIcon } from '../components/LangIcon';
import { getLocalLogo } from '../data/langLogos';

const TAB_BAR_HEIGHT = 64;

const LEVEL_KEY: Record<string, string> = {
  beginner: 'learn.beginnerFriendly',
  intermediate: 'learn.intermediate',
  advanced: 'learn.advanced',
};

function PopularLangRow({
  lang,
  articleCount,
  progressPercent,
  levelLabel,
  onPress,
  styles,
}: {
  lang: ProgrammingLanguage;
  articleCount: number;
  progressPercent: number;
  levelLabel: string;
  onPress: () => void;
  styles: Record<string, object>;
}) {
  const hasProgress = progressPercent > 0;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const accent = lang.category === 'aiml' ? colors.warning : lang.category === 'framework' ? colors.secondary : colors.primary;

  return (
    <TouchableOpacity style={styles.popularRow} onPress={onPress} activeOpacity={0.85}>
      <LangIcon
        iconUri={lang.icon}
        iconSource={getLocalLogo(lang.slug)}
        name={lang.name}
        size={40}
        accentColor={accent}
        style={styles.popularIcon}
      />
      <View style={styles.popularBody}>
        <View style={styles.popularTitleRow}>
          <Text style={styles.popularName} numberOfLines={1}>{lang.name}</Text>
        </View>
        <Text style={styles.popularMeta}>{articleCount} {t('learn.articles')} • {levelLabel}</Text>
      </View>
      {hasProgress ? (
        <View style={styles.popularProgressWrap}>
          <Text style={styles.popularPercent}>{progressPercent}%</Text>
          <View style={styles.popularProgressBar}>
            <View style={[styles.popularProgressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.popularAddBtn} onPress={onPress}>
          <Ionicons name="add" size={20} color={colors.background} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export function ProgrammingScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const { completedArticleIds, completedArticles, lastRead } = useProgress();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const handleLanguagePress = useCallback((lang: ProgrammingLanguage) => {
    navigation.navigate('ArticleList', { languageId: lang.id, languageName: lang.name });
  }, [navigation]);

  const langIds = useMemo(() => Object.keys(MOCK_ARTICLES), []);
  const popularList = useMemo(() => {
    return MOCK_LANGUAGES.filter((l) => langIds.includes(l.id)).map((lang) => {
      const articles = MOCK_ARTICLES[lang.id] ?? [];
      const completed = articles.filter((a) => completedArticleIds.includes(a.id)).length;
      const total = articles.length;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const firstLevel = articles[0]?.level ?? 'beginner';
      const levelLabel = t(LEVEL_KEY[firstLevel] ?? 'learn.beginnerFriendly');
      return { lang, articleCount: total, completedCount: completed, progressPercent, levelLabel };
    });
  }, [langIds, completedArticleIds, t]);

  const aiRecommendation = useMemo(() => {
    if (!lastRead) return null;
    const found = popularList.find((p) => p.lang.id === lastRead.languageId);
    return found ?? null;
  }, [lastRead, popularList]);

  const recentlyViewed = useMemo(() => {
    const items: Array<{ type: 'lastRead'; data: typeof lastRead } | { type: 'completed'; data: { articleId: string; completedAt: string; languageId?: string; languageName?: string; articleTitle?: string } }> = [];
    if (lastRead) {
      items.push({ type: 'lastRead', data: lastRead });
    }
    const sorted = [...completedArticles].sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1));
    for (const c of sorted.slice(0, 5)) {
      if (lastRead && c.articleId === lastRead.articleId) continue;
      const lang = MOCK_LANGUAGES.find((l) => (MOCK_ARTICLES[l.id] ?? []).some((a) => a.id === c.articleId));
      const article = lang ? (MOCK_ARTICLES[lang.id] ?? []).find((a) => a.id === c.articleId) : null;
      items.push({
        type: 'completed',
        data: {
          articleId: c.articleId,
          completedAt: c.completedAt,
          languageId: lang?.id,
          languageName: lang?.name,
          articleTitle: article?.title,
        },
      });
    }
    return items;
  }, [lastRead, completedArticles]);

  const courseBlogs = useMemo(() => {
    return MOCK_LANGUAGES.filter((l) => (MOCK_ARTICLES[l.id] ?? []).length > 0)
      .slice(0, 12)
      .flatMap((lang) => {
        const articles = MOCK_ARTICLES[lang.id] ?? [];
        const first = articles[0];
        return first ? [{ lang, article: first }] : [];
      });
  }, []);

  const totalCompleted = completedArticleIds.length;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    headerIconBtn: { padding: SPACING.xs },
    headerTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      gap: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, SPACING.sm) + SPACING.lg,
    },
    section: { marginBottom: SPACING.xl },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.md,
    },
    sectionLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.bold,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    sectionViewAll: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
    aiCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      position: 'relative',
      ...SHADOWS.card,
    },
    aiCardLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.md,
    },
    aiCardIcon: { flexShrink: 0 },
    aiCardText: { flex: 1, minWidth: 0 },
    aiCardTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    aiCardMeta: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: 2,
    },
    aiCardDesc: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    aiCardEngagement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.sm,
    },
    aiCardCircles: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    aiCardCircle1: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#0D9488',
      borderWidth: 2,
      borderColor: colors.backgroundCard,
    },
    aiCardCircle2: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 2,
      borderColor: colors.backgroundCard,
      marginLeft: -8,
    },
    aiCardCount: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.textMuted,
    },
    aiCardResume: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      backgroundColor: colors.secondary,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      marginTop: SPACING.md,
      alignSelf: 'flex-start',
    },
    aiCardResumeText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      color: colors.background,
    },
    popularRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    popularIcon: {
      marginRight: SPACING.md,
      flexShrink: 0,
    },
    popularBody: { flex: 1, minWidth: 0 },
    popularTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    popularName: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    popularMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: 2,
    },
    popularProgressWrap: {
      alignItems: 'flex-end',
      minWidth: 72,
    },
    popularPercent: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.primary,
      marginBottom: 2,
    },
    popularProgressBar: {
      width: 64,
      height: 4,
      backgroundColor: colors.backgroundElevated,
      borderRadius: BORDER_RADIUS.full,
      overflow: 'hidden',
    },
    popularProgressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.full,
    },
    popularAddBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weeklyCard: {
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      marginTop: SPACING.md,
      position: 'relative',
      overflow: 'hidden',
      ...SHADOWS.card,
    },
    weeklyLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.bold,
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.5,
      marginBottom: SPACING.xs,
    },
    weeklyTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    weeklyDesc: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textSecondary,
    },
    weeklyLightning: {
      position: 'absolute',
      right: SPACING.lg,
      top: '50%',
      marginTop: -16,
      opacity: 0.3,
    },
    blogScroll: { marginHorizontal: -SPACING.lg },
    blogScrollContent: { paddingLeft: SPACING.lg, paddingRight: SPACING.lg },
    blogCard: {
      width: Math.min(220, Math.max(140, (screenWidth - SPACING.lg * 2 - SPACING.md * 3) / 2.1)),
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      marginRight: SPACING.md,
    },
    blogIconWrap: {
      width: 48,
      height: 48,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.backgroundElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.sm,
    },
    blogIcon: {},
    blogTitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.semiBold,
      color: colors.textPrimary,
    },
    blogMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: 2,
    },
    coursesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
    },
    courseCard: {
      width: '47%',
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
    },
    courseIconWrap: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.backgroundElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.sm,
    },
    courseIcon: {},
    courseName: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
    courseMeta: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: 2,
    },
    courseProgressBar: {
      height: 4,
      backgroundColor: colors.backgroundElevated,
      borderRadius: BORDER_RADIUS.full,
      overflow: 'hidden',
      marginTop: SPACING.sm,
    },
    courseProgressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.full,
    },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    recentIconWrap: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.backgroundElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md,
    },
    recentIcon: {},
    recentBody: { flex: 1, minWidth: 0 },
    recentTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.textPrimary,
    },
    recentSub: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: 2,
    },
    recentEmpty: {
      padding: SPACING.xl,
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentEmptyText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: SPACING.sm,
    },
  }), [colors, insets.bottom, screenWidth]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
              <Ionicons name="grid" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('learn.explore')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
              <Ionicons name="search" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAvatar} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="person" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('learn.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            editable={false}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Popular Technologies */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t('learn.popularTechnologies')}</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.sectionViewAll}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            {popularList.slice(0, 15).map((item) => (
              <PopularLangRow
                key={item.lang.id}
                lang={item.lang}
                articleCount={item.articleCount}
                progressPercent={item.progressPercent}
                levelLabel={item.levelLabel}
                onPress={() => handleLanguagePress(item.lang)}
                styles={styles}
              />
            ))}
          </View>

          {/* Course Blogs */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t('learn.courseBlogs')}</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.sectionViewAll}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.blogScroll}
              contentContainerStyle={styles.blogScrollContent}
            >
              {courseBlogs.map(({ lang, article }) => (
                <TouchableOpacity
                  key={`${lang.id}-${article.id}`}
                  style={styles.blogCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    navigation.navigate('ArticleDetail', { article, languageName: lang.name });
                  }}
                >
                  <View style={styles.blogIconWrap}>
                    <LangIcon
                      iconUri={lang.icon}
                      iconSource={getLocalLogo(lang.slug)}
                      name={lang.name}
                      size={36}
                      accentColor={colors.primary}
                      style={styles.blogIcon}
                    />
                  </View>
                  <Text style={styles.blogTitle} numberOfLines={2}>{article.title}</Text>
                  <Text style={styles.blogMeta}>{lang.name} • {article.readTimeMinutes} min</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Popular Courses */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Popular Courses</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.sectionViewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.coursesGrid}>
              {popularList.slice(0, 12).map((item) => (
                <TouchableOpacity
                  key={item.lang.id}
                  style={styles.courseCard}
                  activeOpacity={0.85}
                  onPress={() => handleLanguagePress(item.lang)}
                >
                  <View style={styles.courseIconWrap}>
                    <LangIcon
                      iconUri={item.lang.icon}
                      iconSource={getLocalLogo(item.lang.slug)}
                      name={item.lang.name}
                      size={32}
                      accentColor={colors.primary}
                      style={styles.courseIcon}
                    />
                  </View>
                  <Text style={styles.courseName} numberOfLines={1}>{item.lang.name}</Text>
                  <Text style={styles.courseMeta}>{item.articleCount} articles</Text>
                  <View style={styles.courseProgressBar}>
                    <View style={[styles.courseProgressFill, { width: `${item.progressPercent}%` }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recently viewed */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recently viewed</Text>
              {recentlyViewed.length > 0 && (
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.sectionViewAll}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map((item, idx) => {
                if (item.type === 'lastRead' && item.data) {
                  const lr = item.data;
                  const lang = MOCK_LANGUAGES.find((l) => l.id === lr.languageId);
                  const articles = MOCK_ARTICLES[lr.languageId] ?? [];
                  const art = articles.find((a) => a.id === lr.articleId);
                  if (!art) return null;
                  return (
                    <TouchableOpacity
                      key={`lastRead-${idx}`}
                      style={styles.recentRow}
                      onPress={() => navigation.navigate('ArticleDetail', { article: art, languageName: lr.languageName })}
                      activeOpacity={0.85}
                    >
                      <View style={styles.recentIconWrap}>
                        {lang && (
                          <LangIcon
                            iconUri={lang.icon}
                            iconSource={getLocalLogo(lang.slug)}
                            name={lang.name}
                            size={28}
                            accentColor={colors.primary}
                            style={styles.recentIcon}
                          />
                        )}
                      </View>
                      <View style={styles.recentBody}>
                        <Text style={styles.recentTitle} numberOfLines={1}>{lr.articleTitle}</Text>
                        <Text style={styles.recentSub}>{lr.languageName}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                }
                const cd = item.data as { articleId: string; languageId?: string; languageName?: string; articleTitle?: string };
                const lang = MOCK_LANGUAGES.find((l) => l.id === cd.languageId);
                const articles = lang ? (MOCK_ARTICLES[cd.languageId!] ?? []) : [];
                const art = articles.find((a) => a.id === cd.articleId);
                if (!art || !cd.languageName) return null;
                return (
                  <TouchableOpacity
                    key={`completed-${cd.articleId}-${idx}`}
                    style={styles.recentRow}
                    onPress={() => navigation.navigate('ArticleDetail', { article: art, languageName: cd.languageName! })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.recentIconWrap}>
                      {lang && (
                        <LangIcon
                          iconUri={lang.icon}
                          iconSource={getLocalLogo(lang.slug)}
                          name={lang.name}
                          size={28}
                          accentColor={colors.textMuted}
                          style={styles.recentIcon}
                        />
                      )}
                    </View>
                    <View style={styles.recentBody}>
                      <Text style={styles.recentTitle} numberOfLines={1}>{cd.articleTitle ?? art.title}</Text>
                      <Text style={styles.recentSub}>{cd.languageName}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.recentEmpty}>
                <Ionicons name="eye-outline" size={32} color={colors.textMuted} />
                <Text style={styles.recentEmptyText}>No recently viewed content</Text>
              </View>
            )}
          </View>

          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyLabel}>YOUR PROGRESS</Text>
            <Text style={styles.weeklyTitle}>{totalCompleted} articles completed</Text>
            <Text style={styles.weeklyDesc}>
              Keep exploring from the sections above.
            </Text>
            <View style={styles.weeklyLightning}>
              <Ionicons name="book" size={24} color={colors.textPrimary} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
