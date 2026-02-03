import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'gradientBorder';

type NeonButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  /** Heavier rounding for auth screens (pill style) */
  pill?: boolean;
};

const gradientColors: Record<Exclude<Variant, 'gradientBorder'>, [string, string]> = {
  primary: [COLORS.primary, COLORS.primaryDark],
  secondary: [COLORS.secondary, COLORS.secondaryDark],
  outline: [COLORS.backgroundCard, COLORS.backgroundCard],
};

const BORDER_WIDTH = 2;

export function NeonButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  textStyle,
  pill = false,
}: NeonButtonProps) {
  const isOutline = variant === 'outline';
  const isGradientBorder = variant === 'gradientBorder';

  const radius = pill ? 28 : BORDER_RADIUS.lg;

  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: title,
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  if (isGradientBorder) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[styles.wrapper, { borderRadius: radius }, style]}
        {...a11y}
      >
        <LinearGradient
          colors={COLORS.gradientAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientBorderOuter, { borderRadius: radius, padding: BORDER_WIDTH }]}
        >
          <View style={[styles.gradientBorderInner, { borderRadius: radius - BORDER_WIDTH }, (disabled || loading) && styles.disabled]}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={[styles.text, styles.gradientBorderText, textStyle]}>{title}</Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.wrapper,
        variant === 'primary' && styles.wrapperPrimaryGlow,
        { borderRadius: radius },
        style,
      ]}
      {...a11y}
    >
      <LinearGradient
        colors={gradientColors[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { borderRadius: radius },
          isOutline && styles.outlineBorder,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isOutline ? COLORS.primary : COLORS.textPrimary} />
        ) : (
          <Text
            style={[
              styles.text,
              isOutline && styles.outlineText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    shadowColor: COLORS.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  wrapperPrimaryGlow: {
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  gradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  gradientBorderOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBorderInner: {
    backgroundColor: COLORS.backgroundAuth,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    width: '100%',
  },
  gradientBorderText: {
    color: COLORS.textPrimary,
  },
  outlineBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  outlineText: {
    color: COLORS.primary,
  },
});
