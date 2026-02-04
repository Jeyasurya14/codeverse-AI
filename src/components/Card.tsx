import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../constants/theme';

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
  return (
    <View 
      style={[
        styles.card, 
        elevated && styles.cardElevated,
        interactive && styles.cardInteractive,
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
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardElevated: {
    ...SHADOWS.cardElevated,
    borderColor: COLORS.borderHover,
  },
  cardInteractive: {
    borderColor: COLORS.borderLight,
  },
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
