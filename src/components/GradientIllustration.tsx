import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

/**
 * Minimal illustration: card + overlapping shape. Used on Login and Onboarding.
 */
export function GradientIllustration() {
  return (
    <View
      style={styles.container}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.card}>
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={styles.gridRow}>
              {[0, 1, 2, 3].map((col) => (
                <View key={col} style={styles.gridCell} />
              ))}
            </View>
          ))}
        </View>
        <View style={styles.checkCell}>
          <View style={styles.checkCircle} />
        </View>
      </View>
      <View style={styles.overlapCircle} />
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
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    padding: SPACING.sm,
    backgroundColor: COLORS.primary,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
  },
});
