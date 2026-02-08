import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showLongLoading, setShowLongLoading] = useState(false);
  const { register, isLoading } = useEmailAuth();

  // Progressive loading feedback: show "Setting up your account..." after 800ms
  useEffect(() => {
    if (!isLoading) {
      setShowLongLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLongLoading(true), 800);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Password strength indicator (uses theme colors)
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: colors.textMuted };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { strength: strength / 5, label: 'Weak', color: colors.error };
    if (strength <= 3) return { strength: strength / 5, label: 'Fair', color: colors.warning };
    if (strength <= 4) return { strength: strength / 5, label: 'Good', color: colors.primary };
    return { strength: 1, label: 'Strong', color: colors.success };
  };

  const passwordStrength = getPasswordStrength();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundAuth },
    safe: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center' as const, paddingVertical: SPACING.xl },
    content: { alignItems: 'center' as const, paddingHorizontal: SPACING.lg },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.glass,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
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
      backgroundColor: colors.successMuted,
    },
    logoSection: { alignItems: 'center' as const, marginBottom: SPACING.xl },
    logoGlow: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.successMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
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
    strengthContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING.sm,
      marginTop: -SPACING.xs,
    },
    strengthBar: {
      flex: 1,
      height: 4,
      backgroundColor: colors.glassBorder,
      borderRadius: 2,
      overflow: 'hidden' as const,
    },
    strengthFill: { height: '100%' as const, borderRadius: 2 },
    strengthLabel: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.medium },
    requirements: {
      backgroundColor: colors.glass,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      gap: SPACING.xs,
    },
    requirementsTitle: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: colors.textMuted,
      marginBottom: SPACING.xs,
    },
    requirementRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING.sm,
    },
    requirementText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
    },
    requirementMet: { color: colors.success },
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
    signInContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: SPACING.xl,
    },
    signInText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
    },
    signInLink: {
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
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

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

  const validateForm = useCallback(() => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Please create a password');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password needs uppercase, lowercase, and a number');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  }, [name, email, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
    setError(null);
    if (!validateForm()) return;

    const result = await register(email.trim(), password, name.trim());
    if (!result.success) {
      setError(result.error || 'Registration failed');
    }
  }, [email, password, name, validateForm, register]);

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
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backBtn}
                  onPress={() => navigation?.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoGlow}>
                  <Ionicons name="rocket" size={48} color={colors.primary} />
                </View>
                <Text style={styles.welcomeText}>{t('auth.createAccount')}</Text>
                <Text style={styles.subtitle}>
                  Start your coding journey today
                </Text>
              </View>

              {/* Glass Card */}
              <View style={styles.glassCard}>
                {error && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                {/* Name Input */}
                <View style={[styles.inputContainer, focusedInput === 'name' && styles.inputFocused]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person-outline" size={20} color={focusedInput === 'name' ? colors.primary : colors.textMuted} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={(v) => { setName(v); setError(null); }}
                    autoCapitalize="words"
                    autoComplete="name"
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
                
                {/* Email Input */}
                <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? colors.primary : colors.textMuted} />
                  </View>
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="Email address"
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
                    placeholder="Create password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(null); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
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

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      <View 
                        style={[
                          styles.strengthFill, 
                          { 
                            width: `${passwordStrength.strength * 100}%`,
                            backgroundColor: passwordStrength.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                )}
                
                {/* Confirm Password Input */}
                <View style={[styles.inputContainer, focusedInput === 'confirm' && styles.inputFocused]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'confirm' ? colors.primary : colors.textMuted} />
                  </View>
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    onFocus={() => setFocusedInput('confirm')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={colors.textMuted} 
                    />
                  </TouchableOpacity>
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                </View>
                
                {/* Password Requirements */}
                <View style={styles.requirements}>
                  <Text style={styles.requirementsTitle}>Password must contain:</Text>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                      size={14} 
                      color={password.length >= 8 ? colors.success : colors.textMuted} 
                    />
                    <Text style={[styles.requirementText, password.length >= 8 && styles.requirementMet]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
                      size={14} 
                      color={/[A-Z]/.test(password) ? colors.success : colors.textMuted} 
                    />
                    <Text style={[styles.requirementText, /[A-Z]/.test(password) && styles.requirementMet]}>
                      One uppercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={/[a-z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
                      size={14} 
                      color={/[a-z]/.test(password) ? colors.success : colors.textMuted} 
                    />
                    <Text style={[styles.requirementText, /[a-z]/.test(password) && styles.requirementMet]}>
                      One lowercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <Ionicons 
                      name={/\d/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
                      size={14} 
                      color={/\d/.test(password) ? colors.success : colors.textMuted} 
                    />
                    <Text style={[styles.requirementText, /\d/.test(password) && styles.requirementMet]}>
                      One number
                    </Text>
                  </View>
                </View>
                
                {/* Register Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669', '#047857']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <Text style={styles.buttonText}>Creating account...</Text>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                {showLongLoading && isLoading && (
                  <Text style={[styles.subtitle, { marginTop: SPACING.sm, fontSize: FONT_SIZES.sm }]}>Setting up your account...</Text>
                )}
              </View>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
                  <Text style={styles.signInLink}>Sign in</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footer}>
                By creating an account, you agree to our Terms & Privacy Policy
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
