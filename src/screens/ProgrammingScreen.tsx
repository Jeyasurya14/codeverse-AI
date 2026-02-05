import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_LANGUAGES, MOCK_ARTICLES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';
import { useProgress } from '../context/ProgressContext';
import { ProgrammingLanguage } from '../types';
import { LangIcon } from '../components/LangIcon';
import { getLocalLogo } from '../data/langLogos';

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner Friendly',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function PopularLangRow({
  lang,
  articleCount,
  progressPercent,
  levelLabel,
  onPress,
}: {
  lang: ProgrammingLanguage;
  articleCount: number;
  progressPercent: number;
  levelLabel: string;
  onPress: () => void;
}) {
  const hasProgress = progressPercent > 0;
  const accent = lang.category === 'aiml' ? COLORS.warning : lang.category === 'framework' ? COLORS.secondary : COLORS.primary;

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
        <Text style={styles.popularMeta}>{articleCount} Articles • {levelLabel}</Text>
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
          <Ionicons name="add" size={20} color={COLORS.background} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export function ProgrammingScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const { completedArticleIds, lastRead } = useProgress();

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
      const levelLabel = LEVEL_LABEL[firstLevel] ?? firstLevel;
      return { lang, articleCount: total, completedCount: completed, progressPercent, levelLabel };
    });
  }, [langIds, completedArticleIds]);

  const aiRecommendation = useMemo(() => {
    if (!lastRead) return null;
    const found = popularList.find((p) => p.lang.id === lastRead.languageId);
    return found ?? null;
  }, [lastRead, popularList]);

  const totalCompleted = completedArticleIds.length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
              <Ionicons name="grid" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Languages</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
              <Ionicons name="search" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAvatar} onPress={() => navigation.navigate('Dashboard')}>
              <Ionicons name="person" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search frameworks or languages..."
            placeholderTextColor={COLORS.textMuted}
            editable={false}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {aiRecommendation && (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>AI RECOMMENDATION</Text>
              </View>
              <TouchableOpacity
                style={styles.aiCard}
                activeOpacity={0.9}
                onPress={() => handleLanguagePress(aiRecommendation.lang)}
              >
                <View style={styles.aiCardLeft}>
                  <LangIcon
                    iconUri={aiRecommendation.lang.icon}
                    iconSource={getLocalLogo(aiRecommendation.lang.slug)}
                    name={aiRecommendation.lang.name}
                    size={56}
                    accentColor="#0D9488"
                    style={styles.aiCardIcon}
                  />
                  <View style={styles.aiCardText}>
                    <Text style={styles.aiCardTitle}>{aiRecommendation.lang.name}</Text>
                    <Text style={styles.aiCardMeta}>
                      {aiRecommendation.articleCount} Articles • {aiRecommendation.levelLabel}
                    </Text>
                    <Text style={styles.aiCardDesc} numberOfLines={2}>
                      {aiRecommendation.lang.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.aiCardEngagement}>
                  <View style={styles.aiCardCircles}>
                    <View style={styles.aiCardCircle1} />
                    <View style={styles.aiCardCircle2} />
                  </View>
                  <Text style={styles.aiCardCount}>{aiRecommendation.articleCount} articles</Text>
                </View>
                <TouchableOpacity
                  style={styles.aiCardResume}
                  onPress={() => handleLanguagePress(aiRecommendation.lang)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.aiCardResumeText}>
                    {aiRecommendation.completedCount > 0 ? 'Resume' : 'Start'}
                  </Text>
                  <Ionicons name="play" size={14} color={COLORS.background} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Popular Languages</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.sectionViewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {popularList.slice(0, 8).map((item) => (
              <PopularLangRow
                key={item.lang.id}
                lang={item.lang}
                articleCount={item.articleCount}
                progressPercent={item.progressPercent}
                levelLabel={item.levelLabel}
                onPress={() => handleLanguagePress(item.lang)}
              />
            ))}
          </View>

          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyLabel}>YOUR PROGRESS</Text>
            <Text style={styles.weeklyTitle}>{totalCompleted} articles completed</Text>
            <Text style={styles.weeklyDesc}>
              Keep learning from the languages below.
            </Text>
            <View style={styles.weeklyLightning}>
              <Ionicons name="book" size={24} color={COLORS.textPrimary} />
            </View>
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerIconBtn: { padding: SPACING.xs },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  sectionViewAll: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  aiCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    position: 'relative',
    ...SHADOWS.card,
  },
  aiCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  aiCardIcon: {
    flexShrink: 0,
  },
  aiCardText: { flex: 1, minWidth: 0 },
  aiCardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  aiCardMeta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  aiCardDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
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
    borderColor: COLORS.backgroundCard,
  },
  aiCardCircle2: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundElevated,
    borderWidth: 2,
    borderColor: COLORS.backgroundCard,
    marginLeft: -8,
  },
  aiCardCount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  aiCardResume: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  aiCardResumeText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.background,
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
  },
  popularMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  popularProgressWrap: {
    alignItems: 'flex-end',
    minWidth: 72,
  },
  popularPercent: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginBottom: 2,
  },
  popularProgressBar: {
    width: 64,
    height: 4,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  popularProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  popularAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyCard: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  weeklyDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  weeklyLightning: {
    position: 'absolute',
    right: SPACING.lg,
    top: '50%',
    marginTop: -16,
    opacity: 0.3,
  },
});
