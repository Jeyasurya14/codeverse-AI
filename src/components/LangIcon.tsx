import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
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

export function LangIcon({ iconUri, iconSource, name, size = 40, accentColor = COLORS.primary, style }: LangIconProps) {
  const [error, setError] = useState(false);
  const hasLocal = iconSource != null;
  const hasRemote = iconUri && !error;
  const showContent = hasLocal || hasRemote;

  if (showContent && hasLocal && isSvgComponent(iconSource)) {
    const Svg = iconSource;
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 4 }, style]}>
        <Svg width={size} height={size} />
      </View>
    );
  }

  const imageSource = showContent && hasLocal ? (iconSource as any) : showContent ? { uri: iconUri! } : null;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 4 }, style]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.img, { width: size, height: size, borderRadius: size / 4 }]}
          resizeMode="contain"
          onError={() => setError(true)}
        />
      ) : (
        <View style={[styles.fallback, { backgroundColor: accentColor, width: size, height: size, borderRadius: size / 4 }]}>
          <Text style={[styles.letter, { fontSize: size * 0.4 }]} numberOfLines={1}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundElevated,
  },
  img: {
    backgroundColor: 'transparent',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
});
