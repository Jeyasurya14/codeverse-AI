import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_LANGUAGES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { Card } from '../components/Card';
import { ProgrammingLanguage } from '../types';

type CategoryType = 'language' | 'framework' | 'aiml';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  language: 'Programming Languages',
  framework: 'Frameworks',
  aiml: 'AI & Machine Learning',
};

const CATEGORY_CONFIG: Record<CategoryType, { icon: keyof typeof Ionicons.glyphMap; accent: string }> = {
  language: { icon: 'code-slash', accent: COLORS.primary },
  framework: { icon: 'layers', accent: COLORS.secondary },
  aiml: { icon: 'sparkles', accent: COLORS.warning },
};

export function ProgrammingScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const handleLanguagePress = useCallback((lang: ProgrammingLanguage) => {
    navigation.navigate('ArticleList', {
      languageId: lang.id,
      languageName: lang.name,
    });
  }, [navigation]);

  // Group languages by category
  const languagesByCategory = useMemo(() => {
    const grouped: Record<CategoryType, ProgrammingLanguage[]> = {
      language: [],
      framework: [],
      aiml: [],
    };
    MOCK_LANGUAGES.forEach((lang) => {
      if (grouped[lang.category]) {
        grouped[lang.category].push(lang);
      }
    });
    return grouped;
  }, []);

  const renderCategorySection = (category: CategoryType, items: ProgrammingLanguage[], isFirst: boolean) => {
    if (items.length === 0) return null;
    const config = CATEGORY_CONFIG[category];

    return (
      <View key={category} style={[styles.categorySection, isFirst && styles.categorySectionFirst]}>
        <View style={[styles.categoryHeader, isFirst && styles.categoryHeaderFirst]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: config.accent + '18' }]}>
            <Ionicons name={config.icon} size={22} color={config.accent} />
          </View>
          <View style={styles.categoryTextBlock}>
            <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
            <Text style={styles.categorySubtitle}>
              {items.length} {items.length === 1 ? 'topic' : 'topics'}
            </Text>
          </View>
        </View>
        <View style={styles.languagesGrid}>
          {items.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={styles.langCard}
              onPress={() => handleLanguagePress(lang)}
              activeOpacity={0.8}
            >
              <Card style={styles.langCardInner} interactive noPadding>
                <View style={styles.langRow}>
                  <View style={[styles.logoContainer, { backgroundColor: config.accent + '18' }]}>
                    <Text style={[styles.langIconFallback, { color: config.accent }]}>
                      {lang.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.langInfo}>
                    <Text style={styles.langName} numberOfLines={1}>{lang.name}</Text>
                    <Text style={styles.langDesc} numberOfLines={1}>{lang.description}</Text>
                    <Text style={styles.langMeta}>{lang.topicCount} articles</Text>
                  </View>
                  <View style={styles.chevronWrap}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Programming</Text>
          <Text style={styles.subtitle}>Learn from basics to advance</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {renderCategorySection('language', languagesByCategory.language, true)}
          {renderCategorySection('framework', languagesByCategory.framework, false)}
          {renderCategorySection('aiml', languagesByCategory.aiml, false)}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categorySectionFirst: {
    marginTop: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  categoryHeaderFirst: {
    marginTop: 0,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryTextBlock: { flex: 1, minWidth: 0 },
  categoryLabel: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
  languagesGrid: {
    gap: SPACING.sm,
  },
  langCard: { marginBottom: 0 },
  langCardInner: { marginBottom: 0 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  langIconFallback: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  langInfo: { flex: 1, minWidth: 0 },
  langName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  langDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  langMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  chevronWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
