import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../constants/theme';

type ErrorBoundaryFallbackProps = {
  onRetry: () => void;
};

export function ErrorBoundaryFallback({ onRetry }: ErrorBoundaryFallbackProps) {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xl,
    },
    title: {
      fontSize: FONT_SIZES.title,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      borderRadius: 12,
    },
    buttonText: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.medium,
      color: colors.textPrimary,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        We hit an unexpected error. Please try again.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}
