import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
};

export function ListRow({ title, subtitle, onPress, right, accentColor, style }: ListRowProps) {
  const { colors } = useTheme();

  const themedStyles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: 56,
      paddingHorizontal: SPACING.md,
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: 2,
    },
    chevron: {
      fontSize: FONT_SIZES.md,
      color: colors.textMuted,
      fontFamily: FONTS.medium,
    },
  }), [colors]);

  const content = (
    <>
      {accentColor ? (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={styles.textWrap}>
        <Text style={themedStyles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={themedStyles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Text style={themedStyles.chevron}>→</Text> : null)}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[themedStyles.row, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[themedStyles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  accent: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: SPACING.md,
  },
  textWrap: { flex: 1, minWidth: 0 },
});
