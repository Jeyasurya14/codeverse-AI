import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ArticleContent } from '../components/ArticleContent';
import { ArticleVoiceBar } from '../components/ArticleVoiceBar';
import { MOCK_ARTICLES } from '../data/mockContent';
import { useProgress } from '../context/ProgressContext';
import { useBookmarks } from '../context/BookmarksContext';
import { useVoice } from '../context/VoiceContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, LINE_HEIGHTS, SHADOWS } from '../constants/theme';
import type { Article } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

function getNextArticle(languageId: string, currentOrder: number): Article | null {
  const articles = MOCK_ARTICLES[languageId] ?? [];
  const sorted = [...articles].sort((a, b) => a.order - b.order);
  const next = sorted.find((a) => a.order === currentOrder + 1);
  return next ?? null;
}

export function ArticleDetailScreen({ navigation, route }: Props) {
  const { article, languageName } = route.params;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { setLastRead, markArticleRead } = useProgress();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const bookmarkItem = useMemo(
    () => ({
      languageId: article.languageId,
      articleId: article.id,
      languageName,
      articleTitle: article.title,
    }),
    [article.languageId, article.id, article.title, languageName]
  );
  const bookmarked = isBookmarked(article.id);
  const { stop, articleId: voiceArticleId } = useVoice();

  useEffect(() => {
    setLastRead({
      languageId: article.languageId,
      articleId: article.id,
      languageName,
      articleTitle: article.title,
    });
    markArticleRead(article.languageId, article.id);
  }, [article.id, article.languageId, article.title, languageName, setLastRead, markArticleRead]);

  useEffect(() => {
    return () => {
      if (voiceArticleId === article.id) stop();
    };
  }, [article.id, voiceArticleId, stop]);

  const nextArticle = useMemo(
    () => getNextArticle(article.languageId, article.order),
    [article.languageId, article.order]
  );
  const isLastInTrack = !nextArticle;
  const isLevelUp =
    nextArticle &&
    nextArticle.level !== article.level &&
    (nextArticle.level === 'intermediate' || nextArticle.level === 'advanced');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        safe: { flex: 1 },
        scroll: { flex: 1 },
        scrollContent: {
          paddingHorizontal: SPACING.lg,
          paddingBottom: insets.bottom + SPACING.xxl,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: SPACING.md,
          marginBottom: SPACING.lg,
        },
        backBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          padding: SPACING.xs,
          marginLeft: -SPACING.xs,
        },
        backText: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.medium,
          color: colors.primary,
        },
        langBadge: {
          backgroundColor: colors.backgroundCard,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.xs,
          borderRadius: BORDER_RADIUS.full,
          borderWidth: 1,
          borderColor: colors.border,
        },
        langBadgeText: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.semiBold,
          color: colors.textMuted,
        },
        hero: {
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden',
          marginBottom: SPACING.xl,
          ...SHADOWS.card,
        },
        heroGradient: {
          padding: SPACING.xl,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: SPACING.md,
          marginBottom: SPACING.md,
        },
        metaPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          backgroundColor: 'rgba(255,255,255,0.12)',
          paddingHorizontal: SPACING.sm,
          paddingVertical: 6,
          borderRadius: BORDER_RADIUS.full,
        },
        metaPillText: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.medium,
          color: 'rgba(255,255,255,0.9)',
        },
        bookmarkBtn: {
          marginLeft: 'auto',
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          fontSize: Math.min(FONT_SIZES.title + 2, 28),
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          lineHeight: (FONT_SIZES.title + 2) * LINE_HEIGHTS.tight,
          letterSpacing: -0.5,
        },
        body: {
          paddingTop: SPACING.sm,
        },
        nextSection: {
          marginTop: SPACING.xxl,
          paddingTop: SPACING.xl,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        nextSectionTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginBottom: SPACING.md,
        },
        nextCard: {
          backgroundColor: colors.backgroundCard,
          borderRadius: BORDER_RADIUS.xl,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          ...SHADOWS.card,
        },
        nextCardInner: {
          padding: SPACING.lg,
        },
        levelUpBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: SPACING.md,
          alignSelf: 'flex-start',
          backgroundColor: colors.secondaryMuted,
          paddingHorizontal: SPACING.sm,
          paddingVertical: 4,
          borderRadius: BORDER_RADIUS.sm,
        },
        levelUpText: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.semiBold,
          color: colors.secondary,
          textTransform: 'capitalize',
        },
        nextCardLabel: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.semiBold,
          color: colors.primary,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        nextCardTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginBottom: SPACING.xs,
          lineHeight: FONT_SIZES.lg * 1.3,
        },
        nextCardMeta: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.regular,
          color: colors.textMuted,
          marginBottom: SPACING.md,
        },
        nextCardCta: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: SPACING.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        nextCardCtaText: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.semiBold,
          color: colors.primary,
        },
        completeCard: {
          backgroundColor: colors.backgroundCard,
          borderRadius: BORDER_RADIUS.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: SPACING.xl,
          alignItems: 'center',
          ...SHADOWS.card,
        },
        completeIconWrap: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.successMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.lg,
        },
        completeTitle: {
          fontSize: FONT_SIZES.xl,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginBottom: SPACING.sm,
          textAlign: 'center',
        },
        completeText: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.regular,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: SPACING.xl,
          lineHeight: FONT_SIZES.md * 1.6,
        },
        completeButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.xl,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: colors.primaryMuted,
          borderWidth: 1,
          borderColor: colors.borderFocus,
        },
        completeButtonText: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.semiBold,
          color: colors.primary,
        },
      }),
    [colors, insets.bottom]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
              <Text style={styles.backText}>{languageName}</Text>
            </TouchableOpacity>
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{article.level}</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.metaPillText}>{article.readTimeMinutes} min</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleBookmark(bookmarkItem)}
                  style={styles.bookmarkBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={bookmarked ? '#FBBF24' : 'rgba(255,255,255,0.9)'}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.title}>{article.title}</Text>
            </LinearGradient>
          </View>

          <ArticleVoiceBar articleId={article.id} content={article.content} />

          <View style={styles.body}>
            <ArticleContent content={article.content} />
          </View>

          <View style={styles.nextSection}>
            <Text style={styles.nextSectionTitle}>
              {nextArticle ? t('articleDetail.upNext') : t('articleDetail.youDidIt')}
            </Text>
            {nextArticle ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  navigation.push('ArticleDetail', { article: nextArticle, languageName })
                }
              >
                <View style={styles.nextCard}>
                  <View style={styles.nextCardInner}>
                    {isLevelUp && (
                      <View style={styles.levelUpBadge}>
                        <Ionicons name="trending-up" size={14} color={colors.secondary} />
                        <Text style={styles.levelUpText}>Next: {nextArticle.level}</Text>
                      </View>
                    )}
                    <Text style={styles.nextCardLabel}>{t('articleDetail.continueLearning')}</Text>
                    <Text style={styles.nextCardTitle}>{nextArticle.title}</Text>
                    <Text style={styles.nextCardMeta}>
                      {nextArticle.readTimeMinutes} min read · {nextArticle.level}
                    </Text>
                    <View style={styles.nextCardCta}>
                      <Text style={styles.nextCardCtaText}>{t('articleDetail.nextArticle')}</Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.completeCard}>
                <View style={styles.completeIconWrap}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                </View>
                <Text style={styles.completeTitle}>{t('articleDetail.trackComplete')}</Text>
                <Text style={styles.completeText}>
                  You've finished all {languageName} articles. Explore another track or revisit
                  advanced topics to deepen your understanding.
                </Text>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => navigation.navigate('Main', { screen: 'Programming' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.completeButtonText}>{t('articleDetail.exploreMore')}</Text>
                  <Ionicons name="compass-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
