import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_LANGUAGES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { Card } from '../components/Card';
import { ProgrammingLanguage } from '../types';

export function ProgrammingScreen({ navigation }: any) {
  const [selected, setSelected] = useState<ProgrammingLanguage | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

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
          <Text style={styles.sectionLabel}>Choose a language</Text>
          {MOCK_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[styles.langCard, selected?.id === lang.id && styles.langCardActive]}
              onPress={() => setSelected(selected?.id === lang.id ? null : lang)}
              activeOpacity={0.7}
            >
              <Card noPadding style={styles.langCardInner}>
                <View style={styles.langRow}>
                  <Text style={styles.langIcon}>{lang.icon}</Text>
                  <View style={styles.langInfo}>
                    <Text style={styles.langName}>{lang.name}</Text>
                    <Text style={styles.langDesc}>{lang.description}</Text>
                    <Text style={styles.langMeta}>{lang.topicCount} topics</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
          {selected && (
            <View style={styles.articlesSection}>
              <Text style={styles.sectionLabel}>Topics – {selected.name}</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ArticleList', {
                    languageId: selected.id,
                    languageName: selected.name,
                  })
                }
                activeOpacity={0.7}
              >
                <Card accentColor={COLORS.primary}>
                  <Text style={styles.articleTitle}>View all articles</Text>
                  <Text style={styles.articleMeta}>Basics → Advanced</Text>
                </Card>
              </TouchableOpacity>
            </View>
          )}
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
  langCard: { marginBottom: SPACING.sm },
  langCardActive: { opacity: 1 },
  langCardInner: { marginBottom: 0 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  langIcon: { fontSize: 32, marginRight: SPACING.md },
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
  articlesSection: { marginTop: SPACING.lg },
  articleTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  articleMeta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
