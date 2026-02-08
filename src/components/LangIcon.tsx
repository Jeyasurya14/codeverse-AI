import React, { useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS } from '../constants/theme';
import type { LogoSource } from '../data/langLogos';

type LangIconProps = {
  /** Remote logo URL (used when iconSource is not set) */
  iconUri?: string | null;
  /** Local logo: PNG image source or SVG component. Preferred over iconUri. */
  iconSource?: LogoSource | null;
  name: string;
  size?: number;
  accentColor?: string;
  style?: ViewStyle;
};

function isSvgComponent(source: LogoSource): source is React.ComponentType<{ width?: number; height?: number }> {
  return typeof source === 'function';
}

export function LangIcon({ iconUri, iconSource, name, size = 40, accentColor, style }: LangIconProps) {
  const { colors } = useTheme();
  const resolvedAccentColor = accentColor ?? colors.primary;
  const [error, setError] = useState(false);
  const hasLocal = iconSource != null;
  const hasRemote = iconUri && !error;
  const showContent = hasLocal || hasRemote;

  const themedStyles = useMemo(() => StyleSheet.create({
    wrap: {
      overflow: 'hidden' as const,
      backgroundColor: colors.backgroundElevated,
    },
    letter: {
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
    },
  }), [colors]);

  if (showContent && hasLocal && isSvgComponent(iconSource)) {
    const Svg = iconSource;
    return (
      <View style={[themedStyles.wrap, { width: size, height: size, borderRadius: size / 4 }, style]}>
        <Svg width={size} height={size} />
      </View>
    );
  }

  const imageSource = showContent && hasLocal ? (iconSource as any) : showContent ? { uri: iconUri! } : null;

  return (
    <View style={[themedStyles.wrap, { width: size, height: size, borderRadius: size / 4 }, style]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.img, { width: size, height: size, borderRadius: size / 4 }]}
          resizeMode="contain"
          onError={() => setError(true)}
        />
      ) : (
        <View style={[styles.fallback, { backgroundColor: resolvedAccentColor, width: size, height: size, borderRadius: size / 4 }]}>
          <Text style={[themedStyles.letter, { fontSize: size * 0.4 }]} numberOfLines={1}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    backgroundColor: 'transparent',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
