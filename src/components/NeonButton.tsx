import React, { useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';

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
  const { colors } = useTheme();
  const isOutline = variant === 'outline';
  const isGradientBorder = variant === 'gradientBorder';

  const gradientColors: Record<Exclude<Variant, 'gradientBorder'>, [string, string]> = useMemo(() => ({
    primary: [colors.primary, colors.primaryDark],
    secondary: [colors.secondary, colors.secondaryDark],
    outline: [colors.backgroundCard, colors.backgroundCard],
  }), [colors]);

  const radius = pill ? 28 : BORDER_RADIUS.lg;

  const themedStyles = useMemo(() => StyleSheet.create({
    gradientBorderInner: {
      backgroundColor: colors.backgroundAuth,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 52,
      width: '100%',
    },
    gradientBorderText: { color: colors.textPrimary },
    outlineBorder: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    text: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.medium,
      color: colors.textPrimary,
    },
    outlineText: { color: colors.primary },
  }), [colors]);

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
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientBorderOuter, { borderRadius: radius, padding: BORDER_WIDTH }]}
        >
          <View style={[themedStyles.gradientBorderInner, { borderRadius: radius - BORDER_WIDTH }, (disabled || loading) && styles.disabled]}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[themedStyles.text, themedStyles.gradientBorderText, textStyle]}>{title}</Text>
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
      style={[styles.wrapper, { borderRadius: radius }, style]}
      {...a11y}
    >
      <LinearGradient
        colors={gradientColors[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { borderRadius: radius },
          isOutline && themedStyles.outlineBorder,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isOutline ? colors.primary : colors.textPrimary} />
        ) : (
          <Text
            style={[
              themedStyles.text,
              isOutline && themedStyles.outlineText,
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
    ...SHADOWS.button,
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
  disabled: {
    opacity: 0.6,
  },
});
