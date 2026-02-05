import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { Card } from '../components/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, AI_TOKENS, FONTS, PAYMENT_COMING_SOON, SHADOWS } from '../constants/theme';

export function RechargeTokensScreen({ navigation }: any) {
  const { user } = useAuth();
  const { addPurchasedTokens, totalAvailable } = useTokens();
  const plan = user?.subscriptionPlan ?? 'free';
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'free' ? 'Free' : 'Other';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  const handlePurchase = async (tokens: number) => {
    if (PAYMENT_COMING_SOON) {
      setShowComingSoonModal(true);
      return;
    }
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
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>Plan: {planLabel}</Text>
          </View>
          <Text style={styles.subtitle}>
            Use tokens for AI Mentor & interview prep. You have {totalAvailable} available. Prices in Indian Rupees (₹).
          </Text>
        </View>
        {PAYMENT_COMING_SOON ? (
          <View style={styles.comingSoonBanner}>
            <Text style={styles.comingSoonTitle}>Payment coming soon</Text>
            <Text style={styles.comingSoonText}>
              We're setting up secure payments. Recharge will be available in the next update—thanks for your patience.
            </Text>
          </View>
        ) : null}
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
              style={[styles.cardWrap, loading && styles.cardDisabled, PAYMENT_COMING_SOON && styles.cardComingSoon]}
            >
              <Card
                accentColor={pack.popular ? COLORS.secondary : COLORS.primary}
                style={pack.popular ? styles.cardPopular : undefined}
              >
                {PAYMENT_COMING_SOON && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Coming soon</Text>
                  </View>
                )}
                {pack.popular && !PAYMENT_COMING_SOON && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most popular</Text>
                  </View>
                )}
                <Text style={styles.packLabel}>{pack.label}</Text>
                <Text style={styles.packTokens}>{pack.tokens.toLocaleString()} tokens</Text>
                <Text style={styles.packPrice}>₹{pack.priceInINR}</Text>
                <Text style={styles.packPerToken}>
                  ₹{Math.round((pack.priceInINR / pack.tokens) * 100)}/100 tokens
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

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowComingSoonModal(false)}
        >
          <Animated.View 
            entering={FadeInDown.springify().damping(15)}
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <LinearGradient
              colors={[COLORS.backgroundCard, COLORS.backgroundElevated]}
              style={styles.modalGradient}
            >
              {/* Icon */}
              <Animated.View 
                entering={FadeIn.delay(100)}
                style={styles.modalIconContainer}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIconGradient}
                >
                  <Ionicons name="time-outline" size={32} color={COLORS.textPrimary} />
                </LinearGradient>
              </Animated.View>

              {/* Title */}
              <Text style={styles.modalTitle}>Coming Soon</Text>

              {/* Message */}
              <Text style={styles.modalMessage}>
                Payment is being set up. We'll enable recharges in a few days—please check back after the next update.
              </Text>

              {/* Button */}
              <TouchableOpacity
                onPress={() => setShowComingSoonModal(false)}
                activeOpacity={0.8}
                style={styles.modalButton}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Got it</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </Modal>
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
  comingSoonBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primaryMuted,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  comingSoonTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  comingSoonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  cardComingSoon: { opacity: 0.92 },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.textMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
    marginBottom: SPACING.sm,
  },
  comingSoonBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.background,
  },
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
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  planBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.backgroundOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.cardElevated,
  },
  modalGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: SPACING.lg,
  },
  modalIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
  modalTitle: {
    fontSize: FONT_SIZES.hero,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  modalButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  modalButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
});
