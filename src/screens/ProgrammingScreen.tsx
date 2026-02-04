import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const CATEGORY_ICONS: Record<CategoryType, string> = {
  language: '💻',
  framework: '⚡',
  aiml: '🤖',
};

export function ProgrammingScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const handleImageError = useCallback((langId: string) => {
    setImageErrors(prev => new Set(prev).add(langId));
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

  const renderCategorySection = (category: CategoryType, items: ProgrammingLanguage[]) => {
    if (items.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconContainer}>
            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text>
          </View>
          <View>
            <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
            <Text style={styles.categorySubtitle}>{items.length} {items.length === 1 ? 'language' : 'languages'}</Text>
          </View>
        </View>
        <View style={styles.languagesGrid}>
          {items.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={styles.langCard}
              onPress={() => handleLanguagePress(lang)}
              activeOpacity={0.85}
            >
              <Card style={styles.langCardInner} interactive={true} noPadding>
                <View style={styles.langRow}>
                  {lang.icon.startsWith('http') && !imageErrors.has(lang.id) ? (
                    <View style={styles.logoContainer}>
                      <Image 
                        source={{ uri: lang.icon }} 
                        style={styles.langLogo}
                        resizeMode="contain"
                        onError={() => handleImageError(lang.id)}
                      />
                    </View>
                  ) : (
                    <View style={styles.logoContainer}>
                      <Text style={styles.langIconFallback}>
                        {lang.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.langInfo}>
                    <Text style={styles.langName}>{lang.name}</Text>
                    <Text style={styles.langDesc}>{lang.description}</Text>
                    <Text style={styles.langMeta}>{lang.topicCount} topics</Text>
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
          {renderCategorySection('language', languagesByCategory.language)}
          {renderCategorySection('framework', languagesByCategory.framework)}
          {renderCategorySection('aiml', languagesByCategory.aiml)}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  title: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: SPACING.xs / 2,
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
  langIcon: { fontSize: 32, marginRight: SPACING.md },
  logoContainer: {
    width: 40,
    height: 40,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  langLogo: { 
    width: 40, 
    height: 40, 
  },
  langIconFallback: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  langInfo: { flex: 1 },
  langName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  langDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  langMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
