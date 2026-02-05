import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_ARTICLES, MOCK_LANGUAGES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';
import { Article } from '../types';
import { useProgress } from '../context/ProgressContext';
import { LangIcon } from '../components/LangIcon';
import { getLocalLogo } from '../data/langLogos';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleList'>;

export function ArticleListScreen({ navigation, route }: Props) {
  const { languageId, languageName } = route.params;
  const articles: Article[] = MOCK_ARTICLES[languageId] ?? [];
  const { completedArticleIds } = useProgress();
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, [languageId]);

  // UI-only calculations for display (no data modification)
  const completedCount = articles.filter(a => completedArticleIds.includes(a.id)).length;
  const totalCount = articles.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Sort articles for display (original data unchanged)
  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => a.order - b.order);
  }, [articles]);
  
  // Find active article index for UI display
  const activeArticleIndex = sortedArticles.findIndex(a => !completedArticleIds.includes(a.id));
  const lessonsToMilestone = activeArticleIndex >= 0 && activeArticleIndex < sortedArticles.length - 1 ? 1 : 0;

  // Get article status
  const getArticleStatus = (article: Article, index: number) => {
    const isCompleted = completedArticleIds.includes(article.id);
    const isActive = !isCompleted && index === activeArticleIndex;
    const isLocked = !isCompleted && index > activeArticleIndex;
    
    if (isCompleted) return 'completed';
    if (isActive) return 'active';
    return 'locked';
  };

  const trackLang = useMemo(
    () => MOCK_LANGUAGES.find((l) => l.id === languageId),
    [languageId]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Path</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => Alert.alert('Your Path', 'Options', [
              { text: 'Recharge tokens', onPress: () => navigation.navigate('RechargeTokens') },
              { text: 'Cancel', style: 'cancel' },
            ])}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Current Track Section */}
          <View style={styles.currentTrackCard}>
            <View style={styles.trackImageContainer}>
              <View style={styles.trackImagePlaceholder}>
                <LangIcon
                  iconUri={trackLang?.icon}
                  iconSource={trackLang ? getLocalLogo(trackLang.slug) : null}
                  name={languageName}
                  size={48}
                  accentColor={COLORS.primary}
                />
              </View>
            </View>
            <Text style={styles.currentTrackLabel}>CURRENT TRACK</Text>
            <Text style={styles.trackTitle}>{languageName}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.progressTag}>
                <Text style={styles.progressText}>{progressPercent}%</Text>
              </View>
            </View>
            {lessonsToMilestone > 0 && (
              <Text style={styles.motivationalText}>
                Keep going! You're {lessonsToMilestone} lesson{lessonsToMilestone !== 1 ? 's' : ''} away from your next milestone.
              </Text>
            )}
          </View>

          {/* Modules Timeline */}
          <View style={styles.modulesContainer}>
            {sortedArticles.map((article, index) => {
              const status = getArticleStatus(article, index);
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              const isLocked = status === 'locked';
              const isRecommended = isActive && index === activeArticleIndex;

              return (
                <View key={article.id} style={styles.moduleWrapper}>
                  {/* Timeline Line */}
                  {index < sortedArticles.length - 1 && (
                    <View style={[
                      styles.timelineLine,
                      isCompleted && styles.timelineLineCompleted,
                      isActive && styles.timelineLineActive,
                    ]} />
                  )}

                  {/* AI Suggestion Banner */}
                  {isRecommended && (
                    <View style={styles.aiBanner}>
                      <Ionicons name="sparkles" size={16} color={COLORS.background} />
                      <Text style={styles.aiBannerText}>AI SUGGESTION: RECOMMENDED NEXT</Text>
                    </View>
                  )}

                  {/* Status Indicator */}
                  <View style={styles.statusIndicatorContainer}>
                    <View style={[
                      styles.statusIndicator,
                      isCompleted && styles.statusIndicatorCompleted,
                      isActive && styles.statusIndicatorActive,
                      isLocked && styles.statusIndicatorLocked,
                    ]}>
                      {isCompleted && <Ionicons name="checkmark" size={16} color={COLORS.background} />}
                      {isActive && <Ionicons name="play" size={16} color={COLORS.background} />}
                      {isLocked && <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />}
                    </View>
                  </View>

                  {/* Module Card */}
                  <View style={[
                    styles.moduleCard,
                    isActive && styles.moduleCardActive,
                    isLocked && styles.moduleCardLocked,
                  ]}>
                    <View style={styles.moduleHeader}>
                      <Text style={[
                        styles.moduleNumber,
                        isActive && styles.moduleNumberActive,
                        isLocked && styles.moduleNumberLocked,
                      ]}>
                        Module {index + 1}
                      </Text>
                      <Text style={[
                        styles.moduleStatusTag,
                        isCompleted && styles.moduleStatusTagCompleted,
                        isActive && styles.moduleStatusTagActive,
                        isLocked && styles.moduleStatusTagLocked,
                      ]}>
                        {status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.moduleTitle}>{article.title}</Text>
                    <Text style={styles.moduleDescription}>
                      {article.level === 'beginner' && 'Master the fundamentals and build a solid foundation.'}
                      {article.level === 'intermediate' && 'Take your skills to the next level with advanced concepts.'}
                      {article.level === 'advanced' && 'Expert-level techniques and best practices.'}
                    </Text>
                    {isActive && (
                      <TouchableOpacity
                        style={styles.resumeButton}
                        onPress={() => navigation.navigate('ArticleDetail', { article, languageName })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.resumeButtonText}>Resume Lesson</Text>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.background} />
                      </TouchableOpacity>
                    )}
                    {!isActive && !isLocked && (
                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => navigation.navigate('ArticleDetail', { article, languageName })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewButtonText}>View Article</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xxl },
  
  // Current Track Section
  currentTrackCard: {
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  trackImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.primaryMuted,
  },
  trackImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryMuted,
  },
  currentTrackLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  trackTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.background,
  },
  motivationalText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },

  // Modules Timeline
  modulesContainer: {
    paddingHorizontal: SPACING.lg,
  },
  moduleWrapper: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    width: 2,
    height: '100%',
    backgroundColor: COLORS.border,
    zIndex: 0,
  },
  timelineLineCompleted: {
    backgroundColor: COLORS.primary,
  },
  timelineLineActive: {
    backgroundColor: COLORS.primary,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xl + 8,
    gap: SPACING.xs,
  },
  aiBannerText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusIndicatorContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  statusIndicatorCompleted: {
    backgroundColor: COLORS.primary,
  },
  statusIndicatorActive: {
    backgroundColor: COLORS.primary,
  },
  statusIndicatorLocked: {
    backgroundColor: COLORS.backgroundCard,
    borderColor: COLORS.border,
  },
  moduleCard: {
    marginLeft: SPACING.xl + 8,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  moduleCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  moduleCardLocked: {
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  moduleNumber: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  moduleNumberActive: {
    color: COLORS.primary,
  },
  moduleNumberLocked: {
    color: COLORS.textMuted,
  },
  moduleStatusTag: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moduleStatusTagCompleted: {
    color: COLORS.textMuted,
  },
  moduleStatusTagActive: {
    color: COLORS.primary,
  },
  moduleStatusTagLocked: {
    color: COLORS.textMuted,
  },
  moduleTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  moduleDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  resumeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.background,
  },
  viewButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  viewButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
});
