import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeonButton } from '../components/NeonButton';
import { GradientIllustration } from '../components/GradientIllustration';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  { id: '1', title: 'Structured Learning', description: 'Master programming from basics to advanced with clear, article-style content—like W3Schools & GeeksforGeeks, all in one app.' },
  { id: '2', title: 'AI Mentor', description: 'Get help while learning and prepare for interviews. Ask questions, get explanations, and practice with AI—powered by advanced models.' },
  { id: '3', title: 'Token System', description: 'Start with 300 free AI tokens. Use them for mentoring and interview prep. Recharge with affordable packs when you need more.' },
  { id: '4', title: 'Your Dashboard', description: 'Track progress, bookmark articles, and manage your learning path. Separate views for your profile and programming content.' },
];

export function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const onGetStarted = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      completeOnboarding();
    }
  };

  const goBack = () => {
    if (index > 0) listRef.current?.scrollToIndex({ index: index - 1 });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backTouch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={index > 0 ? 'Go to previous step' : undefined}
            accessibilityElementsHidden={index === 0}
          >
            {index > 0 ? <Text style={styles.backArrow}>←</Text> : <View style={styles.backPlaceholder} />}
          </TouchableOpacity>
          <View
            style={styles.progressBars}
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}
            accessibilityValue={{ min: 1, max: SLIDES.length, now: index + 1 }}
          >
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.progressBar, i === index ? styles.progressBarActive : styles.progressBarInactive]}
              />
            ))}
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <GradientIllustration />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
          )}
        />
        <View style={styles.footer}>
          <NeonButton
            title={index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            onPress={onGetStarted}
            pill
            style={styles.btn}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundAuth },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backTouch: { marginRight: SPACING.md },
  backArrow: { fontSize: 22, fontFamily: FONTS.primary, color: COLORS.textPrimary },
  backPlaceholder: { width: 24, height: 24 },
  progressBars: { flex: 1, flexDirection: 'row', gap: 6 },
  progressBar: { height: 4, flex: 1, borderRadius: 2 },
  progressBarActive: { backgroundColor: COLORS.primary },
  progressBarInactive: { backgroundColor: COLORS.backgroundElevated },
  slide: {
    width,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  footer: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  btn: { width: '100%' },
});
