import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import * as Haptics from 'expo-haptics';

type EmptyStateProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  iconColor?: string;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
  iconColor,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const resolvedIconColor = iconColor ?? colors.textMuted;

  const themedStyles = useMemo(() => StyleSheet.create({
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.backgroundElevated,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      textAlign: 'center' as const,
      marginBottom: SPACING.sm,
    },
    subtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      textAlign: 'center' as const,
      marginBottom: SPACING.lg,
      lineHeight: 20,
    },
    button: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING.xs,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    buttonText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
  }), [colors]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAction?.();
  };

  return (
    <View style={[styles.container, style]} accessibilityRole="summary">
      <View style={themedStyles.iconWrap}>
        <Ionicons name={icon} size={48} color={resolvedIconColor} />
      </View>
      <Text style={themedStyles.title}>{title}</Text>
      {subtitle ? (
        <Text style={themedStyles.subtitle}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={themedStyles.button}
          onPress={handlePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={themedStyles.buttonText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
});
