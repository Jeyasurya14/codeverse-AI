import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { useProgress } from '../context/ProgressContext';
import { MOCK_ARTICLES } from '../data/mockContent';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { Card } from '../components/Card';
import { ListRow } from '../components/ListRow';

const QUICK_LINKS = [
  { id: '1', label: 'Programming', route: 'Programming', accent: COLORS.primary },
  { id: '2', label: 'AI Mentor', route: 'AIMentor', accent: COLORS.secondary },
  { id: '3', label: 'Dashboard', route: 'Dashboard', accent: COLORS.primary },
  { id: '4', label: 'Interview Prep', route: 'AIMentor', accent: COLORS.secondary },
];

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { totalAvailable, freeRemaining } = useTokens();
  const { lastRead } = useProgress();

  const continueArticle = lastRead
    ? (MOCK_ARTICLES[lastRead.languageId] ?? []).find((a) => a.id === lastRead.articleId)
    : null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{user?.name ?? 'Developer'}</Text>
          </View>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenValue}>{totalAvailable}</Text>
            <Text style={styles.tokenLabel}>AI tokens</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {continueArticle ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('ArticleDetail', {
                  article: continueArticle,
                  languageName: lastRead!.languageName,
                })
              }
              style={styles.continueWrap}
            >
              <Card accentColor={COLORS.primary} style={styles.hero}>
                <View style={styles.continueRow}>
                  <View style={styles.continueIconWrap}>
                    <Ionicons name="book" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.continueText}>
                    <Text style={styles.continueLabel}>Continue learning</Text>
                    <Text style={styles.heroTitle}>{lastRead!.languageName}</Text>
                    <Text style={styles.heroSub}>{continueArticle.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          ) : (
            <Card accentColor={COLORS.primary} style={styles.hero}>
              <Text style={styles.heroTitle}>Continue Learning</Text>
              <Text style={styles.heroSub}>
                Pick a language and master it from basics to advance
              </Text>
            </Card>
          )}

          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.grid}>
            {QUICK_LINKS.map((item) => (
              <ListRow
                key={item.id}
                title={item.label}
                accentColor={item.accent}
                onPress={() => navigation.navigate(item.route)}
                style={styles.listRow}
              />
            ))}
          </View>

          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Free AI tokens</Text>
            <Text style={styles.infoValue}>{freeRemaining} / 300 remaining</Text>
            <Text style={styles.infoHint}>
              Use for AI Mentor and interview prep. Recharge when needed.
            </Text>
          </Card>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  tokenBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tokenValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  tokenLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  hero: { marginBottom: SPACING.xl },
  continueWrap: { marginBottom: SPACING.xl },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  continueIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { flex: 1 },
  continueLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  grid: { gap: SPACING.sm, marginBottom: SPACING.xl },
  listRow: { marginBottom: 0 },
  infoCard: {},
  infoTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  infoHint: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
});
