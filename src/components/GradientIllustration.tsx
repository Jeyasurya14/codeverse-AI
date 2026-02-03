import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

/**
 * Reference-style gradient illustration: card + overlapping shape, grid, sparkles, radiant lines.
 * Used on Login and Onboarding (no content change, style only).
 */
export function GradientIllustration() {
  return (
    <View
      style={styles.container}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      {/* Main card with gradient */}
      <LinearGradient
        colors={COLORS.gradientAccent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Grid inside card (4x4) */}
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={styles.gridRow}>
              {[0, 1, 2, 3].map((col) => (
                <View key={col} style={styles.gridCell} />
              ))}
            </View>
          ))}
        </View>
        {/* Checkmark-like accent in one cell */}
        <View style={styles.checkCell}>
          <View style={styles.checkCircle} />
        </View>
      </LinearGradient>
      {/* Overlapping circle (phone/device shape) */}
      <LinearGradient
        colors={COLORS.gradientAccent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.overlapCircle}
      />
      {/* Sparkles */}
      <View style={[styles.sparkle, styles.sparkle1]} />
      <View style={[styles.sparkle, styles.sparkle2]} />
      {/* Radiant lines */}
      <View style={styles.radiantContainer}>
        <View style={[styles.radiantLine, styles.radiantLine1]} />
        <View style={[styles.radiantLine, styles.radiantLine2]} />
        <View style={[styles.radiantLine, styles.radiantLine3]} />
      </View>
    </View>
  );
}

const CARD_WIDTH = 200;
const CARD_HEIGHT = 160;
const OVERLAP_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH + OVERLAP_SIZE * 0.5,
    height: CARD_HEIGHT + OVERLAP_SIZE * 0.4,
    marginBottom: SPACING.xl,
  },
  card: {
    position: 'absolute',
    left: 0,
    top: OVERLAP_SIZE * 0.3,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    padding: SPACING.sm,
  },
  grid: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    maxHeight: 32,
  },
  gridCell: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  checkCell: {
    position: 'absolute',
    left: '50%',
    top: '35%',
    marginLeft: -18,
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.textPrimary,
  },
  overlapCircle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: OVERLAP_SIZE,
    height: OVERLAP_SIZE,
    borderRadius: OVERLAP_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: COLORS.secondary,
    transform: [{ rotate: '45deg' }],
    shadowColor: COLORS.glowYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  sparkle1: {
    left: CARD_WIDTH * 0.1,
    top: CARD_HEIGHT + OVERLAP_SIZE * 0.2,
  },
  sparkle2: {
    left: CARD_WIDTH * 0.25,
    top: CARD_HEIGHT + OVERLAP_SIZE * 0.35,
  },
  radiantContainer: {
    position: 'absolute',
    right: -8,
    top: OVERLAP_SIZE * 0.5,
  },
  radiantLine: {
    position: 'absolute',
    width: 3,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.glowBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  radiantLine1: { transform: [{ rotate: '-20deg' }], top: 0 },
  radiantLine2: { transform: [{ rotate: '-10deg' }], top: 8 },
  radiantLine3: { transform: [{ rotate: '0deg' }], top: 16 },
});
