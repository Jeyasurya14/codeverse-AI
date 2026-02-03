import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Optional left accent bar color */
  accentColor?: string;
  noPadding?: boolean;
};

export function Card({ children, style, accentColor, noPadding }: CardProps) {
  return (
    <View style={[styles.card, style]}>
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
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  inner: {
    padding: 16,
  },
  innerNoPadding: {
    padding: 0,
  },
});
