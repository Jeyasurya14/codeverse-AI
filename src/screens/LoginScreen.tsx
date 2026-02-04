import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NeonButton } from '../components/NeonButton';
import { GradientIllustration } from '../components/GradientIllustration';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

const FRIENDLY_MESSAGES: Record<string, string> = {
  'Request timed out. Try again.': 'Connection timed out. Check your network and try again.',
  'Network error. Check your connection.': 'No connection. Check Wi‑Fi or mobile data and try again.',
  'App is not configured. Please update and restart.': 'Sign-in is not set up yet. Please try again later.',
};

function getFriendlyMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
  return FRIENDLY_MESSAGES[msg] ?? msg;
}

export function LoginScreen({ navigation }: any) {
  const [mode, setMode] = useState<'email' | 'magic' | 'mfa'>('email');
  const [loading, setLoading] = useState<'email' | 'magic' | 'mfa' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);

  const { login, sendMagicLink, isLoading: emailLoading } = useEmailAuth();

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading('email');
    const result = await login(email.trim(), password, rememberMe, mfaCode || undefined);
    if (result.requiresMfa) {
      setRequiresMfa(true);
      setMode('mfa');
    } else if (!result.success) {
      setError(result.error || 'Login failed.');
    }
    setLoading(null);
  };

  const handleMfaLogin = async () => {
    if (!mfaCode.trim()) {
      setError('Please enter MFA code.');
      return;
    }
    setError(null);
    setLoading('mfa');
    const result = await login(email.trim(), password, rememberMe, mfaCode.trim());
    if (!result.success) {
      setError(result.error || 'Invalid MFA code.');
    }
    setLoading(null);
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading('magic');
    const result = await sendMagicLink(email.trim());
    if (result.success) {
      setMode('email'); // Switch back to email view after sending
    } else {
      setError(result.error || 'Failed to send magic link.');
    }
    setLoading(null);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

              {mode === 'email' && (
                <>
                  {error ? (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                  <View style={styles.form}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={COLORS.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Remember me</Text>
                    </TouchableOpacity>
                    <NeonButton
                      title="Sign In"
                      onPress={handleEmailLogin}
                      loading={loading === 'email' || emailLoading}
                      pill
                      style={styles.btn}
                    />
                    <TouchableOpacity onPress={() => setMode('magic')}>
                      <Text style={styles.magicLinkText}>Use magic link instead</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                      <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchLink}>Sign up</Text></Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {mode === 'magic' && (
                <>
                  {error ? (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                  <View style={styles.form}>
                    <Text style={styles.magicTitle}>Passwordless Sign In</Text>
                    <Text style={styles.magicDesc}>Enter your email and we'll send you a magic link to sign in.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <NeonButton
                      title="Send Magic Link"
                      onPress={handleMagicLink}
                      loading={loading === 'magic' || emailLoading}
                      pill
                      style={styles.btn}
                    />
                    <TouchableOpacity onPress={() => setMode('email')}>
                      <Text style={styles.switchText}>Use password instead</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {mode === 'mfa' && (
                <>
                  {error ? (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                  <View style={styles.form}>
                    <Text style={styles.magicTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.magicDesc}>Enter the 6-digit code from your authenticator app.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MFA Code"
                      placeholderTextColor={COLORS.textMuted}
                      value={mfaCode}
                      onChangeText={setMfaCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                    <NeonButton
                      title="Verify & Sign In"
                      onPress={handleMfaLogin}
                      loading={loading === 'mfa' || emailLoading}
                      pill
                      style={styles.btn}
                    />
                    <TouchableOpacity onPress={() => { setMode('email'); setMfaCode(''); setRequiresMfa(false); }}>
                      <Text style={styles.switchText}>← Back to login</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <Text style={styles.footer}>
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundAuth },
  safe: {
    flex: 1,
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: SPACING.lg },
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
  errorHint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  buttons: { width: '100%', gap: SPACING.md, marginTop: SPACING.lg },
  btn: { width: '100%' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  magicLinkText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  form: {
    width: '100%',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  switchText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  switchLink: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  backText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  magicTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  magicDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  footer: {
    marginTop: SPACING.xl,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
