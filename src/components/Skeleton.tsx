import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

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

  return (
    <Animated.View
      style={[
        styles.skeleton,
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

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.backgroundElevated,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  return (
    <View style={cardStyles.card}>
      <Skeleton width={36} height={36} style={cardStyles.icon} />
      <Skeleton width={32} height={20} style={cardStyles.value} />
      <Skeleton width={56} height={12} style={cardStyles.label} />
    </View>
  );
}
