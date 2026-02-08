import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

export function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { requestForgotPassword, isLoading } = useEmailAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    const result = await requestForgotPassword(trimmed);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset link.');
    }
  }, [email, requestForgotPassword]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.backgroundAuth },
        safe: { flex: 1 },
        keyboardView: { flex: 1 },
        scrollContent: {
          flexGrow: 1,
          justifyContent: 'center',
          paddingVertical: SPACING.xl,
          paddingHorizontal: SPACING.lg,
        },
        content: { alignItems: 'center' as const },
        backBtn: {
          position: 'absolute' as const,
          top: 0,
          left: SPACING.lg,
          zIndex: 1,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.glass,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },
        logoSection: { alignItems: 'center' as const, marginBottom: SPACING.xl },
        logoGlow: {
          padding: SPACING.sm,
          borderRadius: 100,
          backgroundColor: colors.primaryMuted,
        },
        logoImage: { width: 96, height: 96 },
        title: {
          fontSize: FONT_SIZES.title,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginTop: SPACING.md,
          textAlign: 'center' as const,
        },
        subtitle: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.regular,
          color: colors.textMuted,
          textAlign: 'center' as const,
          marginTop: SPACING.xs,
          lineHeight: 22,
        },
        glassCard: {
          width: '100%' as const,
          backgroundColor: colors.glass,
          borderRadius: BORDER_RADIUS.xl + 4,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          padding: SPACING.lg,
          gap: SPACING.md,
          marginTop: SPACING.lg,
        },
        successCard: {
          borderColor: colors.success + '60',
          backgroundColor: colors.successMuted,
        },
        successIcon: {
          alignSelf: 'center' as const,
          marginBottom: SPACING.xs,
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
          backgroundColor: colors.backgroundElevated,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: 1.5,
          borderColor: focusedInput ? colors.primary : colors.glassBorder,
          paddingHorizontal: SPACING.md,
          height: 56,
        },
        inputIcon: { marginRight: SPACING.sm },
        input: {
          flex: 1,
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.regular,
          color: colors.textPrimary,
          paddingVertical: 0,
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
        backLink: {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          gap: SPACING.xs,
          paddingVertical: SPACING.sm,
          marginTop: SPACING.md,
        },
        backLinkText: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONTS.medium,
          color: colors.textMuted,
        },
      }),
    [colors, focusedInput]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientCosmic}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
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
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation?.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.logoSection}>
                <View style={styles.logoGlow}>
                  <Image
                    source={require('../../assets/codeverse-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  {success
                    ? "Check your email. We've sent a reset link that expires in 1 hour."
                    : "Enter your email and we'll send you a link to reset your password."}
                </Text>
              </View>

              <View style={[styles.glassCard, success && styles.successCard]}>
                {success ? (
                  <>
                    <View style={styles.successIcon}>
                      <Ionicons name="mail-open" size={48} color={colors.success} />
                    </View>
                    <Text
                      style={[
                        styles.subtitle,
                        { color: colors.textSecondary, marginTop: 0 },
                      ]}
                    >
                      If an account exists for {email.trim()}, you'll receive an email with
                      instructions. The link opens in this app on mobile.
                    </Text>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => navigation?.navigate('Login')}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#2563EB']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.buttonText}>Back to Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {error && (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={focusedInput ? colors.primary : colors.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={(v) => {
                          setEmail(v);
                          setError(null);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                        editable={!isLoading}
                        onFocus={() => setFocusedInput(true)}
                        onBlur={() => setFocusedInput(false)}
                        returnKeyType="send"
                        onSubmitEditing={handleSubmit}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#2563EB']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                            <Ionicons name="paper-plane" size={18} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  onPress={() => navigation?.goBack()}
                  style={styles.backLink}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={18} color={colors.textMuted} />
                  <Text style={styles.backLinkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
