import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NeonButton } from '../components/NeonButton';
import { GradientIllustration } from '../components/GradientIllustration';
import { useGoogleAuth, useGithubAuth } from '../hooks/useOAuth';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

export function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { runGoogleSignIn, ready: googleReady } = useGoogleAuth();
  const { runGithubSignIn, ready: githubReady } = useGithubAuth();

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading('google');
    try {
      await runGoogleSignIn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading('github');
    try {
      await runGithubSignIn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <LinearGradient
              colors={COLORS.gradientAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Text style={styles.logoText}>CV</Text>
            </LinearGradient>
            <Text style={styles.title}>CodeVerse</Text>
            <View style={styles.subtitleWrap}>
              <Text style={styles.subtitle}>
                Learn programming from basics to advance{'\n'}with articles & AI mentor
              </Text>
              <View style={styles.gradientUnderline} />
            </View>
          </View>

          <View style={styles.illustration}>
            <GradientIllustration />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.buttons}>
            <NeonButton
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              loading={loading === 'google'}
              disabled={!googleReady}
              pill
              style={styles.btn}
            />
            <NeonButton
              title="Continue with GitHub"
              onPress={handleGithubSignIn}
              variant="gradientBorder"
              loading={loading === 'github'}
              disabled={!githubReady}
              pill
              style={styles.btn}
            />
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundAuth },
  safe: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  content: { alignItems: 'center' },
  logoSection: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
  },
  logoText: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: FONT_SIZES.hero,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitleWrap: { alignItems: 'center' },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  gradientUnderline: {
    height: 2,
    width: '70%',
    marginTop: SPACING.sm,
    borderRadius: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
  },
  illustration: { marginVertical: SPACING.xl },
  errorBanner: {
    width: '100%',
    backgroundColor: COLORS.error + '20',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    textAlign: 'center',
  },
  buttons: { width: '100%', gap: SPACING.md, marginTop: SPACING.lg },
  btn: { width: '100%' },
  footer: {
    marginTop: SPACING.xl,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
