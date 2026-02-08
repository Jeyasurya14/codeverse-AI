import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  AI_TOKENS,
  FONTS,
  PAYMENT_COMING_SOON,
  SHADOWS,
  REGION_CURRENCY,
  type PricingRegion,
  STORAGE_KEYS,
} from '../constants/theme';
import { detectPricingRegion } from '../utils/region';

export function RechargeTokensScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { addPurchasedTokens, totalAvailable } = useTokens();
  const plan = user?.subscriptionPlan ?? 'free';
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'free' ? 'Free' : 'Other';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [region, setRegion] = useState<PricingRegion>('US');
  const [showRegionModal, setShowRegionModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.PRICING_REGION)
      .then((stored) => {
        if (stored && ['IN', 'US', 'GB', 'EU'].includes(stored)) {
          setRegion(stored as PricingRegion);
        } else {
          setRegion(detectPricingRegion());
        }
      })
      .catch(() => setRegion(detectPricingRegion()));
  }, []);

  const selectRegion = (r: PricingRegion) => {
    setRegion(r);
    setShowRegionModal(false);
    AsyncStorage.setItem(STORAGE_KEYS.PRICING_REGION, r).catch(() => {});
  };

  const currency = REGION_CURRENCY[region];
  const cardWidth = Math.min((width - SPACING.lg * 3) / 2, 180);

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
          paddingTop: SPACING.sm,
          paddingBottom: SPACING.md,
        },
        backBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          padding: SPACING.xs,
        },
        backText: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.medium, color: colors.primary },
        headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },

        hero: {
          marginHorizontal: SPACING.lg,
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden' as const,
          marginBottom: SPACING.xl,
          ...SHADOWS.cardElevated,
        },
        heroGradient: {
          padding: SPACING.xl,
        },
        heroRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        heroBadge: {
          backgroundColor: 'rgba(255,255,255,0.2)',
          paddingHorizontal: SPACING.sm,
          paddingVertical: 4,
          borderRadius: BORDER_RADIUS.full,
        },
        heroBadgeText: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: '#fff' },
        heroBalance: { alignItems: 'flex-end' as const },
        heroBalanceLabel: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.9)' },
        heroBalanceValue: { fontSize: 36, fontFamily: FONTS.bold, color: '#fff', letterSpacing: -1 },
        heroSubtext: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.xs },

        regionChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.md,
          borderRadius: BORDER_RADIUS.full,
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: colors.border,
        },
        regionChipText: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.medium, color: colors.textPrimary },
        sectionTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.md,
        },
        packsGrid: {
          flexDirection: 'row' as const,
          flexWrap: 'wrap' as const,
          paddingHorizontal: SPACING.lg,
          gap: SPACING.md,
          paddingBottom: SPACING.lg,
        },
        packCard: {
          width: cardWidth,
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden' as const,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.backgroundCard,
          ...SHADOWS.card,
        },
        packCardPopular: {
          borderColor: colors.secondary,
          borderWidth: 2,
          ...SHADOWS.cardElevated,
        },
        packCardInner: {
          padding: SPACING.md,
        },
        packPopularRibbon: {
          position: 'absolute' as const,
          top: 0,
          right: 0,
          backgroundColor: colors.secondary,
          paddingHorizontal: SPACING.sm,
          paddingVertical: 4,
          borderBottomLeftRadius: BORDER_RADIUS.md,
          zIndex: 1,
        },
        packPopularText: { fontSize: 10, fontFamily: FONTS.bold, color: colors.background },
        packIconWrap: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          marginBottom: SPACING.sm,
        },
        packLabel: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, color: colors.textPrimary },
        packTokens: {
          fontSize: FONT_SIZES.xl,
          fontFamily: FONTS.bold,
          color: colors.primary,
          marginTop: 2,
        },
        packPrice: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textSecondary,
          marginTop: SPACING.xs,
        },
        packPerToken: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.regular,
          color: colors.textMuted,
          marginTop: 2,
        },
        packCta: {
          marginTop: SPACING.md,
          paddingVertical: SPACING.sm,
          borderRadius: BORDER_RADIUS.md,
          alignItems: 'center' as const,
          backgroundColor: colors.primaryMuted,
          borderWidth: 1,
          borderColor: colors.primary + '40',
        },
        packCtaPopular: { backgroundColor: colors.secondaryMuted, borderColor: colors.secondary + '40' },
        packCtaText: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, color: colors.primary },
        packCtaTextPopular: { color: colors.secondary },

        comingSoonBanner: {
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.lg,
          backgroundColor: colors.primaryMuted,
          padding: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: 1,
          borderColor: colors.primary + '40',
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
        },
        comingSoonIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary + '30',
          alignItems: 'center',
          justifyContent: 'center',
        },
        comingSoonTitle: { fontSize: FONT_SIZES.md, fontFamily: FONTS.bold, color: colors.primary, marginBottom: 2 },
        comingSoonText: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.regular, color: colors.textSecondary, flex: 1 },

        errorBanner: {
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.md,
          backgroundColor: colors.errorMuted,
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        errorText: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.medium, color: colors.error, flex: 1 },

        footer: {
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.xxl,
          padding: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: colors.border,
        },
        footerTitle: { fontSize: FONT_SIZES.md, fontFamily: FONTS.bold, color: colors.textPrimary, marginBottom: SPACING.xs },
        footerDesc: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.regular, color: colors.textSecondary, lineHeight: 22 },

        modalOverlay: {
          flex: 1,
          backgroundColor: colors.backgroundOverlay,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          padding: SPACING.lg,
        },
        modalContent: {
          width: '100%' as const,
          maxWidth: 380,
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden' as const,
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: colors.border,
          ...SHADOWS.cardElevated,
        },
        modalInner: { padding: SPACING.xl },
        modalIconWrap: {
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          alignSelf: 'center' as const,
          marginBottom: SPACING.lg,
        },
        modalTitle: { fontSize: FONT_SIZES.title, fontFamily: FONTS.bold, color: colors.textPrimary, textAlign: 'center' as const, marginBottom: SPACING.sm },
        modalMessage: { fontSize: FONT_SIZES.md, fontFamily: FONTS.regular, color: colors.textSecondary, textAlign: 'center' as const, lineHeight: 24, marginBottom: SPACING.xl },
        modalBtn: {
          borderRadius: BORDER_RADIUS.md,
          overflow: 'hidden' as const,
        },
        modalBtnGradient: { paddingVertical: SPACING.md, alignItems: 'center' as const },
        modalBtnText: { fontSize: FONT_SIZES.md, fontFamily: FONTS.bold, color: '#fff' },
        regionOption: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          marginBottom: SPACING.sm,
          backgroundColor: colors.backgroundElevated,
          borderWidth: 1,
          borderColor: colors.border,
        },
        regionOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
        regionOptionLabel: { fontSize: FONT_SIZES.md, fontFamily: FONTS.bold, color: colors.textPrimary },
        regionOptionCurrency: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.regular, color: colors.textMuted, marginTop: 2 },
      }),
    [colors, cardWidth]
  );

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

  const regionLabel = (r: PricingRegion) => (r === 'IN' ? 'India' : r === 'US' ? 'United States' : r === 'GB' ? 'United Kingdom' : 'Eurozone');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>{t('recharge.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.regionChip} onPress={() => setShowRegionModal(true)} activeOpacity={0.7}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <Text style={styles.regionChipText}>{currency.symbol} {regionLabel(region)}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
          {/* Hero: Token Balance */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroRow}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{planLabel}</Text>
                </View>
                <View style={styles.heroBalance}>
                  <Text style={styles.heroBalanceLabel}>{t('recharge.yourBalance')}</Text>
                  <Text style={styles.heroBalanceValue}>{totalAvailable.toLocaleString()}</Text>
                  <Text style={styles.heroSubtext}>{t('recharge.aiTokens')}</Text>
                </View>
              </View>
              <Text style={[styles.heroSubtext, { marginTop: SPACING.md }]}>
                Power AI Mentor chats & interview prep. Recharge when you need more.
              </Text>
            </LinearGradient>
          </View>

          {PAYMENT_COMING_SOON && (
            <View style={styles.comingSoonBanner}>
              <View style={styles.comingSoonIcon}>
                <Ionicons name="wallet-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.comingSoonTitle}>{t('recharge.paymentComingSoon')}</Text>
                <Text style={styles.comingSoonText}>
                  Secure payments are being set up. Recharge will be available in the next update.
                </Text>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('recharge.choosePack')}</Text>

          <View style={styles.packsGrid}>
            {AI_TOKENS.RECHARGE_PACKS.map((pack) => {
              const price = region === 'IN' ? pack.prices.IN : pack.prices[region].toFixed(2);
              const per100 = region === 'IN'
                ? Math.round((pack.prices.IN / pack.tokens) * 100)
                : (pack.prices[region] / pack.tokens * 100).toFixed(2);
              const isPopular = pack.popular && !PAYMENT_COMING_SOON;

              return (
                <TouchableOpacity
                  key={pack.id}
                  onPress={() => handlePurchase(pack.tokens)}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={[styles.packCard, isPopular && styles.packCardPopular]}
                >
                  {isPopular && (
                    <View style={styles.packPopularRibbon}>
                      <Text style={styles.packPopularText}>{t('recharge.popular')}</Text>
                    </View>
                  )}
                  <View style={styles.packCardInner}>
                    <View style={styles.packIconWrap}>
                      <Ionicons
                        name={pack.id === 'unlimited' ? 'infinite' : 'sparkles'}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.packLabel}>{pack.label}</Text>
                    <Text style={styles.packTokens}>{pack.tokens.toLocaleString()}</Text>
                    <Text style={styles.packPerToken}>tokens</Text>
                    <Text style={styles.packPrice}>
                      {currency.symbol}{price}
                    </Text>
                    <Text style={styles.packPerToken}>
                      {currency.symbol}{per100}/100
                    </Text>
                    <View style={[styles.packCta, isPopular && styles.packCtaPopular]}>
                      <Text style={[styles.packCtaText, isPopular && styles.packCtaTextPopular]}>
                        {PAYMENT_COMING_SOON ? t('recharge.comingSoon') : t('recharge.getPack')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerTitle}>{t('recharge.smarterAI')}</Text>
            <Text style={styles.footerDesc}>
              We use GPT-4.1 for complex questions and 4o-mini for quick answers—so you get the best quality at the best price.
            </Text>
          </View>
        </ScrollView>

        {loading && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <View style={{ flex: 1, backgroundColor: colors.backgroundOverlay, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.packPerToken, { marginTop: SPACING.md }]}>Processing…</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Coming Soon Modal */}
      <Modal visible={showComingSoonModal} transparent animationType="fade" onRequestClose={() => setShowComingSoonModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowComingSoonModal(false)}>
          <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalInner}>
              <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalIconWrap}>
                <Ionicons name="time-outline" size={36} color="#fff" />
              </LinearGradient>
              <Text style={styles.modalTitle}>{t('recharge.comingSoon')}</Text>
              <Text style={styles.modalMessage}>
                Payment is being set up. We'll enable recharges in a few days—check back after the next update.
              </Text>
              <TouchableOpacity onPress={() => setShowComingSoonModal(false)} activeOpacity={0.8} style={styles.modalBtn}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>{t('common.done')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Region Picker Modal */}
      <Modal visible={showRegionModal} transparent animationType="fade" onRequestClose={() => setShowRegionModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRegionModal(false)}>
          <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalInner}>
              <Text style={styles.modalTitle}>{t('recharge.selectRegion')}</Text>
              <Text style={[styles.modalMessage, { marginBottom: SPACING.lg }]}>{t('recharge.regionPricesNote')}</Text>
              {(['IN', 'US', 'GB', 'EU'] as PricingRegion[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.regionOption, region === r && styles.regionOptionActive]}
                  onPress={() => selectRegion(r)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.regionOptionLabel}>{regionLabel(r)}</Text>
                    <Text style={styles.regionOptionCurrency}>{REGION_CURRENCY[r].name} ({REGION_CURRENCY[r].symbol})</Text>
                  </View>
                  {region === r && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowRegionModal(false)} activeOpacity={0.8} style={[styles.modalBtn, { marginTop: SPACING.sm }]}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>{t('common.done')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
