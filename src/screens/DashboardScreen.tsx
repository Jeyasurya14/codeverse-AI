import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { useBookmarks } from '../context/BookmarksContext';
import { MOCK_ARTICLES } from '../data/mockContent';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

export function DashboardScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { freeUsed, freeRemaining, purchasedTotal, purchasedUsed, totalAvailable } = useTokens();
  const { bookmarks } = useBookmarks();

  const bookmarkedArticles = bookmarks
    .map((b) => {
      const article = (MOCK_ARTICLES[b.languageId] ?? []).find((a) => a.id === b.articleId);
      return article ? { ...b, article } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name ?? 'U')[0]}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{user?.name ?? 'User'}</Text>
                <Text style={styles.email}>{user?.email ?? ''}</Text>
                <Text style={styles.provider}>{user?.provider ?? 'google'}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>AI Tokens</Text>
            <View style={styles.tokenRow}>
              <Text style={styles.tokenLabel}>Free used</Text>
              <Text style={styles.tokenValue}>{freeUsed} / 300</Text>
            </View>
            <View style={styles.tokenRow}>
              <Text style={styles.tokenLabel}>Purchased</Text>
              <Text style={styles.tokenValue}>
                {purchasedTotal - purchasedUsed} / {purchasedTotal}
              </Text>
            </View>
            <Text style={styles.tokenTotal}>Total available: {totalAvailable}</Text>
            <NeonButton
              title="Recharge tokens"
              onPress={() => navigation.navigate('RechargeTokens')}
              variant="outline"
              style={styles.rechargeBtn}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Bookmarks</Text>
            {bookmarkedArticles.length === 0 ? (
              <>
                <Text style={styles.placeholder}>No bookmarks yet. Open any article and tap the bookmark icon to save it here.</Text>
                <NeonButton
                  title="Browse programming"
                  onPress={() => navigation.navigate('Programming')}
                  variant="outline"
                  style={styles.rechargeBtn}
                />
              </>
            ) : (
              <>
                {bookmarkedArticles.map(({ article, languageName, articleTitle }) => (
                  <TouchableOpacity
                    key={article.id}
                    style={styles.bookmarkRow}
                    onPress={() =>
                      navigation.navigate('ArticleDetail', { article, languageName })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.bookmarkIconWrap}>
                      <Ionicons name="bookmark" size={16} color={COLORS.secondary} />
                    </View>
                    <View style={styles.bookmarkText}>
                      <Text style={styles.bookmarkTitle} numberOfLines={1}>{articleTitle}</Text>
                      <Text style={styles.bookmarkMeta}>{languageName}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
                <NeonButton
                  title="Browse more"
                  onPress={() => navigation.navigate('Programming')}
                  variant="outline"
                  style={styles.rechargeBtn}
                />
              </>
            )}
          </Card>

          <NeonButton title="Sign out" onPress={signOut} variant="outline" style={styles.signOut} />
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.lg },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  profileInfo: { flex: 1 },
  name: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.primary, color: COLORS.textPrimary },
  email: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  provider: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  tokenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  tokenLabel: { fontSize: FONT_SIZES.md, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  tokenValue: { fontSize: FONT_SIZES.md, fontFamily: FONTS.primary, color: COLORS.textPrimary },
  tokenTotal: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rechargeBtn: { marginTop: SPACING.sm },
  placeholder: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  bookmarkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.xs,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkText: { flex: 1 },
  bookmarkTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  bookmarkMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  signOut: { marginTop: SPACING.lg },
});
