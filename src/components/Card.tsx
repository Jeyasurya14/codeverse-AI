import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Optional left accent bar color */
  accentColor?: string;
  noPadding?: boolean;
  /** Elevated card with stronger shadow */
  elevated?: boolean;
  /** Interactive card with hover effect */
  interactive?: boolean;
};

export function Card({ 
  children, 
  style, 
  accentColor, 
  noPadding, 
  elevated = false,
  interactive = false,
}: CardProps) {
  const { colors } = useTheme();

  const themedStyles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
      ...SHADOWS.card,
    },
    cardElevated: {
      ...SHADOWS.cardElevated,
      borderColor: colors.borderHover,
    },
    cardInteractive: {
      borderColor: colors.borderLight,
    },
  }), [colors]);

  return (
    <View 
      style={[
        themedStyles.card, 
        elevated && themedStyles.cardElevated,
        interactive && themedStyles.cardInteractive,
        style
      ]}
    >
      {accentColor ? (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={[styles.inner, noPadding && styles.innerNoPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 1,
  },
  inner: {
    padding: SPACING.md,
  },
  innerNoPadding: {
    padding: 0,
  },
});
