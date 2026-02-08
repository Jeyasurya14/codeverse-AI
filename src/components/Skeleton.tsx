import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { BORDER_RADIUS } from '../constants/theme';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  /** If true, adds a subtle pulse animation */
  animated?: boolean;
};

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.sm,
  style,
  animated = true,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 800 }),
        -1,
        true
      );
    }
  }, [animated, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const skeletonStyles = useMemo(() => StyleSheet.create({
    skeleton: {
      backgroundColor: colors.backgroundElevated,
    },
  }), [colors]);

  return (
    <Animated.View
      style={[
        skeletonStyles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animated && animatedStyle,
        style,
      ]}
    />
  );
}

/** Preset: stat card skeleton (icon + value + label) - requires SkeletonStatCardWrapper for theme */
const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  value: {
    marginBottom: 4,
    borderRadius: BORDER_RADIUS.xs,
  },
  label: {
    borderRadius: BORDER_RADIUS.xs,
  },
});

/** Preset: stat card skeleton (icon + value + label) */
export function SkeletonStatCard() {
  const { colors } = useTheme();
  const themedCardStyles = useMemo(() => ({
    ...cardStyles.card,
    backgroundColor: colors.backgroundCard,
    borderColor: colors.borderLight,
  }), [colors]);

  return (
    <View style={themedCardStyles}>
      <Skeleton width={36} height={36} style={cardStyles.icon} />
      <Skeleton width={32} height={20} style={cardStyles.value} />
      <Skeleton width={56} height={12} style={cardStyles.label} />
    </View>
  );
}
