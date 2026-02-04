import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { ArticleContent } from '../components/ArticleContent';
import { MOCK_ARTICLES } from '../data/mockContent';
import { useProgress } from '../context/ProgressContext';
import { useBookmarks } from '../context/BookmarksContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, LINE_HEIGHTS } from '../constants/theme';
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

  useEffect(() => {
    setLastRead({
      languageId: article.languageId,
      articleId: article.id,
      languageName,
      articleTitle: article.title,
    });
    markArticleRead(article.languageId, article.id);
  }, [article.id, article.languageId, article.title, languageName, setLastRead, markArticleRead]);

  const nextArticle = useMemo(
    () => getNextArticle(article.languageId, article.order),
    [article.languageId, article.order]
  );
  const isLastInTrack = !nextArticle;
  const isLevelUp =
    nextArticle &&
    nextArticle.level !== article.level &&
    (nextArticle.level === 'intermediate' || nextArticle.level === 'advanced');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrap} activeOpacity={0.7}>
            <Text style={styles.back}>← Back to {languageName}</Text>
          </TouchableOpacity>
          <Card accentColor={COLORS.primary} style={styles.header}>
            <View style={styles.badges}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{article.level}</Text>
              </View>
              <View style={styles.readTimeWrap}>
                <Text style={styles.readTimeIcon}>⏱</Text>
                <Text style={styles.readTime}>{article.readTimeMinutes} min read</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleBookmark(bookmarkItem)}
                style={styles.bookmarkBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={bookmarked ? COLORS.secondary : COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{article.title}</Text>
          </Card>
          <View style={styles.body}>
            <ArticleContent content={article.content} />
          </View>

          <View style={styles.nextSection}>
            <Text style={styles.nextSectionTitle}>Move to the next level</Text>
            {nextArticle ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.push('ArticleDetail', { article: nextArticle, languageName })
                }
                style={styles.nextCardWrap}
              >
                <Card accentColor={COLORS.secondary} style={styles.nextCard}>
                  {isLevelUp ? (
                    <View style={styles.levelUpBadge}>
                      <Ionicons name="trending-up" size={14} color={COLORS.secondaryDark} />
                      <Text style={styles.levelUpText}>Next level: {nextArticle.level}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.nextCardLabel}>Up next</Text>
                  <Text style={styles.nextCardTitle}>{nextArticle.title}</Text>
                  <Text style={styles.nextCardMeta}>
                    {nextArticle.readTimeMinutes} min read · {nextArticle.level}
                  </Text>
                  <View style={styles.nextCardCta}>
                    <Text style={styles.nextCardCtaText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ) : (
              <Card style={styles.completeCard}>
                <View style={styles.completeIconWrap}>
                  <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                </View>
                <Text style={styles.completeTitle}>You've completed this track!</Text>
                <Text style={styles.completeText}>
                  You've finished all {languageName} articles. Try another language for breadth, or revisit advanced topics to deepen your understanding.
                </Text>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => navigation.navigate('Main', { screen: 'Programming' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.completeButtonText}>Browse other languages</Text>
                  <Ionicons name="book-outline" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </Card>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  backWrap: { marginBottom: SPACING.lg },
  back: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  header: { marginBottom: SPACING.xl },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookmarkBtn: {
    marginLeft: 'auto',
    padding: SPACING.xs,
    flexShrink: 0,
  },
  levelBadge: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    flexShrink: 0,
  },
  levelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  readTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  readTimeIcon: {
    fontSize: 12,
  },
  readTime: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.reading,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.title * LINE_HEIGHTS.tight,
    letterSpacing: -0.5,
  },
  body: {
    paddingTop: SPACING.sm,
  },
  nextSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  nextCardWrap: {
    marginBottom: SPACING.sm,
  },
  nextCard: {
    paddingVertical: SPACING.md,
  },
  levelUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  levelUpText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.secondaryDark,
    textTransform: 'capitalize',
  },
  nextCardLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextCardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  nextCardMeta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.reading,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  nextCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextCardCtaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  completeCard: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  completeIconWrap: {
    marginBottom: SPACING.md,
  },
  completeTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  completeText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.reading,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  completeButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
});
