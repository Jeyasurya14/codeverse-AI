import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
};

export function ListRow({ title, subtitle, onPress, right, accentColor, style }: ListRowProps) {
  const content = (
    <>
      {accentColor ? (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Text style={styles.chevron}>→</Text> : null)}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accent: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: SPACING.md,
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
  },
});
