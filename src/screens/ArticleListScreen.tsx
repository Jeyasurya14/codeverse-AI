import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_ARTICLES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { Card } from '../components/Card';
import { Article } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleList'>;

export function ArticleListScreen({ navigation, route }: Props) {
  const { languageId, languageName } = route.params;
  const articles: Article[] = MOCK_ARTICLES[languageId] ?? [];
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, [languageId]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>{languageName}</Text>
          <Text style={styles.subtitle}>Articles · Basics to advance</Text>
        </View>
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ArticleDetail', { article: item, languageName })
              }
              activeOpacity={0.7}
              style={styles.cardWrap}
            >
              <Card accentColor={COLORS.primary}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{item.level}</Text>
                </View>
                <Text style={styles.articleTitle}>{item.title}</Text>
                <Text style={styles.meta}>{item.readTimeMinutes} min read</Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  back: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.primary,
  },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
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
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  cardWrap: { marginBottom: SPACING.md },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
    marginBottom: SPACING.sm,
  },
  levelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  articleTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  meta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
