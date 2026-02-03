import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTokens } from '../context/TokenContext';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, AI_TOKENS, FONTS } from '../constants/theme';

export function RechargeTokensScreen({ navigation }: any) {
  const { addPurchasedTokens, totalAvailable } = useTokens();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (tokens: number) => {
    setError(null);
    setLoading(true);
    try {
      await addPurchasedTokens(tokens);
      await new Promise((r) => setTimeout(r, 400));
      navigation.goBack();
    } catch (e) {
      setError('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>Recharge AI Tokens</Text>
          <Text style={styles.subtitle}>
            Use tokens for AI Mentor & interview prep. You have {totalAvailable} available.
          </Text>
        </View>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Processing…</Text>
          </View>
        ) : null}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {AI_TOKENS.RECHARGE_PACKS.map((pack) => (
            <TouchableOpacity
              key={pack.id}
              onPress={() => handlePurchase(pack.tokens)}
              disabled={loading}
              activeOpacity={0.7}
              style={[styles.cardWrap, loading && styles.cardDisabled]}
            >
              <Card
                accentColor={pack.popular ? COLORS.secondary : COLORS.primary}
                style={pack.popular ? styles.cardPopular : undefined}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most popular</Text>
                  </View>
                )}
                <Text style={styles.packLabel}>{pack.label}</Text>
                <Text style={styles.packTokens}>{pack.tokens.toLocaleString()} tokens</Text>
                <Text style={styles.packPrice}>${pack.price}</Text>
                <Text style={styles.packPerToken}>
                  ${((pack.price / pack.tokens) * 100).toFixed(1)}/100 tokens
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
          <Card style={styles.footerCard}>
            <Text style={styles.footerTitle}>Future: Smarter AI</Text>
            <Text style={styles.footerDesc}>
              We'll use GPT-4.1 for complex questions and 4o-mini for quick answers based on usage—so you get the best quality and value.
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
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  errorBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.error + '20',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    textAlign: 'center',
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  cardDisabled: { opacity: 0.6 },
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
    marginTop: SPACING.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  cardWrap: { marginBottom: SPACING.md },
  cardPopular: { borderColor: COLORS.secondary, borderWidth: 1 },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.md,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
  },
  popularText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.background,
  },
  packLabel: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  packTokens: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  packPrice: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: SPACING.sm,
  },
  packPerToken: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  footerCard: { marginTop: SPACING.md },
  footerTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  footerDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
