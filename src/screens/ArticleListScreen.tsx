import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_ARTICLES, MOCK_LANGUAGES } from '../data/mockContent';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';
import { Article } from '../types';
import { useProgress } from '../context/ProgressContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LangIcon } from '../components/LangIcon';
import { getLocalLogo } from '../data/langLogos';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleList'>;

export function ArticleListScreen({ navigation, route }: Props) {
  const { languageId, languageName } = route.params;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const articles: Article[] = MOCK_ARTICLES[languageId] ?? [];
  const { completedArticleIds } = useProgress();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, [languageId]);

  const completedCount = articles.filter((a) => completedArticleIds.includes(a.id)).length;
  const totalCount = articles.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => a.order - b.order),
    [articles]
  );

  const activeArticleIndex = sortedArticles.findIndex(
    (a) => !completedArticleIds.includes(a.id)
  );
  const lessonsToMilestone =
    activeArticleIndex >= 0 && activeArticleIndex < sortedArticles.length - 1 ? 1 : 0;

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

  const handleModulePress = (article: Article, status: string) => {
    if (status === 'locked') {
      Alert.alert(
        'Locked',
        'Complete the previous lesson first to unlock this one.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('ArticleDetail', { article, languageName });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        headerTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          letterSpacing: -0.4,
        },
        headerRightBtn: {
          padding: SPACING.xs,
        },
        scroll: { flex: 1 },
        scrollContent: {
          paddingHorizontal: SPACING.lg,
          paddingBottom: insets.bottom + SPACING.xxl,
        },
        hero: {
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden',
          marginTop: SPACING.md,
          marginBottom: SPACING.xl,
          ...SHADOWS.card,
        },
        heroGradient: {
          padding: SPACING.xl,
        },
        heroIconWrap: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.md,
        },
        heroLabel: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.semiBold,
          color: 'rgba(255,255,255,0.9)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: SPACING.xs,
        },
        heroTitle: {
          fontSize: FONT_SIZES.xxl,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginBottom: SPACING.md,
        },
        progressRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          marginBottom: SPACING.sm,
        },
        progressBar: {
          flex: 1,
          height: 8,
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: 4,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 4,
        },
        progressPill: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          paddingHorizontal: SPACING.md,
          paddingVertical: 6,
          borderRadius: BORDER_RADIUS.full,
          minWidth: 52,
          alignItems: 'center',
        },
        progressPillText: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.bold,
          color: colors.primary,
        },
        motivationalText: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.regular,
          color: 'rgba(255,255,255,0.9)',
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.md,
        },
        sectionTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
        },
        modulesContainer: {
          marginBottom: SPACING.lg,
        },
        moduleWrapper: {
          position: 'relative',
          marginBottom: SPACING.lg,
        },
        timelineLine: {
          position: 'absolute',
          left: 15,
          top: 28,
          width: 2,
          height: '100%',
          zIndex: 0,
        },
        timelineLineCompleted: {
          backgroundColor: colors.primary,
        },
        timelineLineMuted: {
          backgroundColor: colors.border,
        },
        aiBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          borderRadius: BORDER_RADIUS.md,
          marginBottom: SPACING.sm,
          marginLeft: SPACING.xl + 10,
          gap: SPACING.xs,
        },
        aiBannerText: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.bold,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        statusIndicator: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.background,
          zIndex: 2,
        },
        statusIndicatorCompleted: {
          backgroundColor: colors.primary,
        },
        statusIndicatorActive: {
          backgroundColor: colors.primary,
        },
        statusIndicatorLocked: {
          backgroundColor: colors.backgroundCard,
          borderColor: colors.border,
        },
        moduleCard: {
          marginLeft: SPACING.xl + 10,
          backgroundColor: colors.backgroundCard,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.border,
          ...SHADOWS.card,
        },
        moduleCardActive: {
          borderColor: colors.primary,
          borderWidth: 2,
        },
        moduleCardLocked: {
          borderStyle: 'dashed',
          opacity: 0.7,
        },
        moduleHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.sm,
        },
        lessonPill: {
          backgroundColor: colors.backgroundElevated,
          paddingHorizontal: SPACING.sm,
          paddingVertical: 4,
          borderRadius: BORDER_RADIUS.sm,
        },
        lessonPillActive: {
          backgroundColor: colors.primaryMuted,
        },
        lessonPillText: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.semiBold,
          color: colors.textMuted,
        },
        lessonPillActiveText: {
          color: colors.primary,
        },
        levelTag: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.medium,
          color: colors.textMuted,
          textTransform: 'capitalize',
        },
        moduleTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginBottom: SPACING.xs,
        },
        moduleMeta: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.regular,
          color: colors.textMuted,
          marginBottom: SPACING.md,
        },
        continueBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.lg,
          borderRadius: BORDER_RADIUS.md,
          gap: SPACING.xs,
        },
        continueBtnText: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.bold,
          color: '#fff',
        },
        viewBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          borderWidth: 1,
          borderColor: colors.border,
          alignSelf: 'flex-start',
        },
        viewBtnText: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.medium,
          color: colors.textPrimary,
        },
        reviewBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.md,
          alignSelf: 'flex-start',
        },
        reviewBtnText: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.medium,
          color: colors.primary,
        },
      }),
    [colors, insets.bottom]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={styles.backText}>{languageName}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('articleList.yourPath').replace('{name}', languageName)}</Text>
          <TouchableOpacity
            style={styles.headerRightBtn}
            onPress={() =>
              Alert.alert(t('articleList.options'), t('articleList.whatWouldYouLike'), [
                { text: t('articleList.rechargeTokens'), onPress: () => navigation.navigate('RechargeTokens') },
                { text: t('common.cancel'), style: 'cancel' },
              ])
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroIconWrap}>
                <LangIcon
                  iconUri={trackLang?.icon}
                  iconSource={trackLang ? getLocalLogo(trackLang.slug) : null}
                  name={languageName}
                  size={40}
                  accentColor="#fff"
                />
              </View>
              <Text style={styles.heroLabel}>CURRENT TRACK</Text>
              <Text style={styles.heroTitle}>{languageName}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <View style={styles.progressPill}>
                  <Text style={styles.progressPillText}>{progressPercent}%</Text>
                </View>
              </View>
              <Text style={styles.motivationalText}>
                {lessonsToMilestone > 0
                  ? `Keep going! ${lessonsToMilestone} lesson${lessonsToMilestone !== 1 ? 's' : ''} to next milestone.`
                  : `${completedCount} of ${totalCount} lessons completed`}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lessons</Text>
          </View>

          <View style={styles.modulesContainer}>
            {sortedArticles.map((article, index) => {
              const status = getArticleStatus(article, index);
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              const isLocked = status === 'locked';
              const isRecommended = isActive && index === activeArticleIndex;
              const isCompletedOrActive = isCompleted || isActive;

              return (
                <View key={article.id} style={styles.moduleWrapper}>
                  {index < sortedArticles.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isCompletedOrActive ? styles.timelineLineCompleted : styles.timelineLineMuted,
                      ]}
                    />
                  )}

                  {isRecommended && (
                    <View style={styles.aiBanner}>
                      <Ionicons name="sparkles" size={16} color="#fff" />
                      <Text style={styles.aiBannerText}>RECOMMENDED NEXT</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.statusIndicator,
                      isCompleted && styles.statusIndicatorCompleted,
                      isActive && styles.statusIndicatorActive,
                      isLocked && styles.statusIndicatorLocked,
                    ]}
                  >
                    {isCompleted && <Ionicons name="checkmark" size={18} color="#fff" />}
                    {isActive && <Ionicons name="play" size={16} color="#fff" />}
                    {isLocked && <Ionicons name="lock-closed" size={16} color={colors.textMuted} />}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleModulePress(article, status)}
                    style={[
                      styles.moduleCard,
                      isActive && styles.moduleCardActive,
                      isLocked && styles.moduleCardLocked,
                    ]}
                  >
                    <View style={styles.moduleHeader}>
                      <View
                        style={[
                          styles.lessonPill,
                          isActive && styles.lessonPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.lessonPillText,
                            isActive && styles.lessonPillActiveText,
                          ]}
                        >
                          Lesson {index + 1}
                        </Text>
                      </View>
                      <Text style={styles.levelTag}>
                        {article.level} · {article.readTimeMinutes} min
                      </Text>
                    </View>
                    <Text style={styles.moduleTitle}>{article.title}</Text>
                    <Text style={styles.moduleMeta}>
                      {article.level === 'beginner' &&
                        'Master the fundamentals and build a solid foundation.'}
                      {article.level === 'intermediate' &&
                        'Take your skills to the next level with advanced concepts.'}
                      {article.level === 'advanced' &&
                        'Expert-level techniques and best practices.'}
                    </Text>
                    {isActive && (
                      <View style={styles.continueBtn}>
                        <Text style={styles.continueBtnText}>
                          {completedCount > 0 ? 'Continue' : 'Start'}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color="#fff" />
                      </View>
                    )}
                    {isCompleted && (
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => handleModulePress(article, status)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Text style={styles.reviewBtnText}>Review</Text>
                        <Ionicons name="refresh" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {isLocked && (
                      <View style={styles.viewBtn}>
                        <Text style={styles.viewBtnText}>Complete previous lesson</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
