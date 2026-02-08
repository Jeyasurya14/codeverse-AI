import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { NeonButton } from '../components/NeonButton';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, STORAGE_KEYS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'email' | 'mfa'>('email');
  const [loading, setLoading] = useState<'email' | 'mfa' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showLongLoading, setShowLongLoading] = useState(false);

  const { login, isLoading: emailLoading } = useEmailAuth();

  // Progressive loading feedback: show "Almost there..." after 800ms
  useEffect(() => {
    if (!loading && !emailLoading) {
      setShowLongLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLongLoading(true), 800);
    return () => clearTimeout(timer);
  }, [loading, emailLoading]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundAuth },
    safe: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center' as const, paddingVertical: SPACING.xl },
    content: { alignItems: 'center' as const, paddingHorizontal: SPACING.lg },
    decorCircle1: {
      position: 'absolute' as const,
      top: -100,
      right: -100,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: colors.primaryMuted,
    },
    decorCircle2: {
      position: 'absolute' as const,
      bottom: -50,
      left: -100,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: colors.secondaryMuted,
    },
    logoSection: { alignItems: 'center' as const, marginBottom: SPACING.xl },
    logoGlow: {
      padding: SPACING.sm,
      borderRadius: 100,
      backgroundColor: colors.primaryMuted,
    },
    logoImage: { width: 120, height: 120 },
    welcomeText: {
      fontSize: FONT_SIZES.title,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      marginTop: SPACING.md,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      textAlign: 'center' as const,
      marginTop: SPACING.xs,
    },
    glassCard: {
      width: '100%' as const,
      backgroundColor: colors.glass,
      borderRadius: BORDER_RADIUS.xl + 4,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    errorBanner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING.sm,
      backgroundColor: colors.errorMuted,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.error + '80',
    },
    errorText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.error,
    },
    inputContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.glass,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1.5,
      borderColor: colors.glassBorder,
      paddingHorizontal: SPACING.md,
      height: 56,
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    inputIcon: { marginRight: SPACING.sm },
    input: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    eyeButton: { padding: SPACING.xs },
    optionsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    checkboxRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING.sm,
    },
    forgotText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.glassBorder,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textSecondary,
    },
    primaryButton: {
      borderRadius: BORDER_RADIUS.lg,
      overflow: 'hidden' as const,
      marginTop: SPACING.sm,
    },
    buttonGradient: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: SPACING.sm,
      paddingVertical: SPACING.md + 2,
      paddingHorizontal: SPACING.xl,
    },
    buttonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      color: '#fff',
      letterSpacing: 0.3,
    },
    modeHeader: { alignItems: 'center' as const, marginBottom: SPACING.md },
    modeIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: SPACING.sm,
    },
    magicTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      textAlign: 'center' as const,
    },
    magicDesc: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      textAlign: 'center' as const,
      marginTop: SPACING.xs,
    },
    mfaInputContainer: { justifyContent: 'center' as const },
    mfaInput: {
      flex: 1,
      fontSize: FONT_SIZES.hero,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      letterSpacing: 8,
      paddingVertical: 0,
    },
    backButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: SPACING.xs,
      paddingVertical: SPACING.sm,
    },
    backButtonText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: colors.textMuted,
    },
    signUpContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: SPACING.xl,
    },
    signUpText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
    },
    signUpLink: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      color: colors.primary,
    },
    footer: {
      marginTop: SPACING.lg,
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      textAlign: 'center' as const,
      opacity: 0.7,
    },
  }), [colors]);
  
  // Animations (faster)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const passwordRef = useRef<TextInput>(null);
  const mfaRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load remember me preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME).then((value) => {
      if (value === 'true') {
        setRememberMe(true);
      }
    }).catch(() => {});
  }, []);

  const handleEmailLogin = useCallback(async () => {
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
      setTimeout(() => mfaRef.current?.focus(), 100);
    } else if (!result.success) {
      setError(result.error || 'Login failed.');
    }
    setLoading(null);
  }, [email, password, rememberMe, mfaCode, login]);

  const handleMfaLogin = useCallback(async () => {
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
  }, [email, password, rememberMe, mfaCode, login]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientCosmic}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      
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
            <Animated.View 
              style={[
                styles.content, 
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoGlow}>
                  <Image
                    source={require('../../assets/codeverse-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>
                <Text style={styles.subtitle}>
                  Continue your coding journey
                </Text>
              </View>

              {/* Glass Card */}
              <View style={styles.glassCard}>
                {mode === 'email' && (
                  <>
                    {error && (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}
                    
                    {/* Email Input */}
                    <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? colors.primary : colors.textMuted} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder={t('auth.emailPlaceholder')}
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={(v) => { setEmail(v); setError(null); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                      />
                    </View>
                    
                    {/* Password Input */}
                    <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? colors.primary : colors.textMuted} />
                      </View>
                      <TextInput
                        ref={passwordRef}
                        style={styles.input}
                        placeholder={t('auth.passwordPlaceholder')}
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={(v) => { setPassword(v); setError(null); }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        returnKeyType="done"
                        onSubmitEditing={handleEmailLogin}
                      />
                      <TouchableOpacity 
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-outline" : "eye-off-outline"} 
                          size={20} 
                          color={colors.textMuted} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Remember Me & Forgot Password */}
                    <View style={styles.optionsRow}>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setRememberMe(!rememberMe)}
                      >
                        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                          {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Remember me</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => navigation?.navigate('ForgotPassword')}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Sign In Button */}
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleEmailLogin}
                      disabled={loading === 'email' || emailLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {(loading === 'email' || emailLoading) ? (
                          <>
                            <Text style={styles.buttonText}>Signing in...</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                          </>
                        ) : (
                          <>
                            <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    {showLongLoading && (loading === 'email' || emailLoading) && (
                      <Text style={[styles.subtitle, { marginTop: SPACING.sm, fontSize: FONT_SIZES.sm }]}>Almost there...</Text>
                    )}
                  </>
                )}

                {mode === 'mfa' && (
                  <>
                    <View style={styles.modeHeader}>
                      <View style={styles.modeIconWrap}>
                        <Ionicons name="shield-checkmark" size={32} color={colors.success} />
                      </View>
                      <Text style={styles.magicTitle}>Two-Factor Auth</Text>
                      <Text style={styles.magicDesc}>Enter the 6-digit code from your authenticator</Text>
                    </View>
                    
                    {error && (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}
                    
                    <View style={[styles.inputContainer, styles.mfaInputContainer]}>
                      <TextInput
                        ref={mfaRef}
                        style={styles.mfaInput}
                        placeholder="000000"
                        placeholderTextColor={colors.textMuted}
                        value={mfaCode}
                        onChangeText={(v) => { setMfaCode(v); setError(null); }}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                        textAlign="center"
                        returnKeyType="done"
                        onSubmitEditing={handleMfaLogin}
                      />
                    </View>
                    
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleMfaLogin}
                      disabled={loading === 'mfa' || emailLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669', '#047857']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {(loading === 'mfa' || emailLoading) ? (
                          <>
                            <Text style={styles.buttonText}>Verifying...</Text>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          </>
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={styles.buttonText}>Verify & Sign In</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    {showLongLoading && (loading === 'mfa' || emailLoading) && (
                      <Text style={[styles.subtitle, { marginTop: SPACING.sm, fontSize: FONT_SIZES.sm }]}>Almost there...</Text>
                    )}
                    
                    <TouchableOpacity 
                      onPress={() => { setMode('email'); setMfaCode(''); setRequiresMfa(false); }}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={18} color={colors.textMuted} />
                      <Text style={styles.backButtonText}>Back to login</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                  <Text style={styles.signUpLink}>Sign up free</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footer}>
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
