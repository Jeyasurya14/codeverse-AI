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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const token = route.params?.token ?? '';
  const { colors } = useTheme();
  const { performResetPassword, isLoading } = useEmailAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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

  React.useEffect(() => {
    if (!token) {
      navigation.replace('Login');
    }
  }, [token, navigation]);

  const validate = useCallback(() => {
    if (!password) {
      setError('Please enter a new password.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password needs uppercase, lowercase, and a number.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!validate()) return;
    if (!token) return;

    const result = await performResetPassword(token, password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigation.replace('Login'), 1500);
    } else {
      setError(result.error || 'Failed to reset password.');
    }
  }, [token, password, performResetPassword, validate, navigation]);

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
        logoSection: { alignItems: 'center' as const, marginBottom: SPACING.xl },
        logoGlow: {
          padding: SPACING.sm,
          borderRadius: 100,
          backgroundColor: colors.successMuted,
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
        successIcon: { alignSelf: 'center' as const },
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
          borderColor: colors.glassBorder,
          paddingHorizontal: SPACING.md,
          height: 56,
        },
        inputFocused: { borderColor: colors.primary },
        inputIcon: { marginRight: SPACING.sm },
        input: {
          flex: 1,
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.regular,
          color: colors.textPrimary,
          paddingVertical: 0,
        },
        eyeButton: { padding: SPACING.xs },
        requirements: {
          flexDirection: 'row' as const,
          flexWrap: 'wrap' as const,
          gap: SPACING.xs,
          marginTop: -SPACING.xs,
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
      }),
    [colors]
  );

  if (!token) return null;

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
                <Text style={styles.title}>
                  {success ? 'Password Reset!' : 'Set New Password'}
                </Text>
                <Text style={styles.subtitle}>
                  {success
                    ? "Your password has been updated. Redirecting to sign in..."
                    : 'Enter your new password below.'}
                </Text>
              </View>

              <View style={[styles.glassCard, success && styles.successCard]}>
                {success ? (
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                  </View>
                ) : (
                  <>
                    {error && (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === 'password' && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={
                          focusedInput === 'password' ? colors.primary : colors.textMuted
                        }
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="New password"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={(v) => {
                          setPassword(v);
                          setError(null);
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        returnKeyType="next"
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === 'confirm' && styles.inputFocused,
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color={
                          focusedInput === 'confirm' ? colors.primary : colors.textMuted
                        }
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor={colors.textMuted}
                        value={confirmPassword}
                        onChangeText={(v) => {
                          setConfirmPassword(v);
                          setError(null);
                        }}
                        secureTextEntry={!showConfirm}
                        autoCapitalize="none"
                        editable={!isLoading}
                        onFocus={() => setFocusedInput('confirm')}
                        onBlur={() => setFocusedInput(null)}
                        returnKeyType="send"
                        onSubmitEditing={handleSubmit}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowConfirm(!showConfirm)}
                      >
                        <Ionicons
                          name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.requirements}>
                      <Text
                        style={[
                          styles.requirementText,
                          password.length >= 8 && styles.requirementMet,
                        ]}
                      >
                        • 8+ characters
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          /[A-Z]/.test(password) && styles.requirementMet,
                        ]}
                      >
                        • Uppercase
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          /[a-z]/.test(password) && styles.requirementMet,
                        ]}
                      >
                        • Lowercase
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          /\d/.test(password) && styles.requirementMet,
                        ]}
                      >
                        • Number
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Text style={styles.buttonText}>Reset Password</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
