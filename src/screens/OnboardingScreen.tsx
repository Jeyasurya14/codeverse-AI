import React, { useState, useRef, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NeonButton } from '../components/NeonButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Structured Learning',
    description: 'Master programming from basics to advanced with clear, article-style content—like W3Schools & GeeksforGeeks, all in one app.',
    icon: 'library-outline',
    gradient: ['#6366F1', '#8B5CF6'],
  },
  {
    id: '2',
    title: 'AI Mentor',
    description: 'Get help while learning and prepare for interviews. Ask questions, get explanations, and practice with AI—powered by advanced models.',
    icon: 'chatbubble-ellipses-outline',
    gradient: ['#06B6D4', '#3B82F6'],
  },
  {
    id: '3',
    title: 'Token System',
    description: 'Start with 300 free AI tokens. Use them for mentoring and interview prep. Recharge with affordable packs when you need more.',
    icon: 'flash-outline',
    gradient: ['#8B5CF6', '#3B82F6'],
  },
  {
    id: '4',
    title: 'Your Learning Hub',
    description: 'Track progress, bookmark articles, and manage your learning path. Customize language, appearance, and account preferences.',
    icon: 'settings-outline',
    gradient: ['#EC4899', '#F59E0B'],
  },
];

export function OnboardingScreen() {
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        backArrow: {
          fontSize: 24,
          fontFamily: FONTS.medium,
          color: colors.textPrimary,
        },
        progressBar: {
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
        },
        progressBarActive: {
          backgroundColor: colors.primary,
        },
        title: {
          fontSize: 26,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginBottom: SPACING.md,
          textAlign: 'center' as const,
          letterSpacing: -0.4,
          lineHeight: 32,
        },
        desc: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.regular,
          color: colors.textSecondary,
          textAlign: 'center' as const,
          lineHeight: 26,
          paddingHorizontal: SPACING.lg,
        },
      }),
    [colors]
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const onGetStarted = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const goBack = () => {
    if (index > 0) {
      listRef.current?.scrollToIndex({ index: index - 1, animated: true });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[
          colors.background,
          colors.backgroundElevated || colors.backgroundCard,
          colors.background,
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backTouch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            {index > 0 ? (
              <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
            ) : (
              <View style={styles.backPlaceholder} />
            )}
          </TouchableOpacity>

          <View style={styles.progressBars}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  themedStyles.progressBar,
                  styles.progressBarItem,
                  i <= index && themedStyles.progressBarActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Slides */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index: slideIndex }) => (
            <OnboardingSlideItem
              slide={item}
              isActive={slideIndex === index}
              themedStyles={themedStyles}
            />
          )}
        />

        {/* Footer */}
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

function OnboardingSlideItem({
  slide,
  isActive,
  themedStyles,
}: {
  slide: Slide;
  isActive: boolean;
  themedStyles: { title: object; desc: object };
}) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1, { damping: 16, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 400 });
    } else {
      scale.value = 0.92;
      opacity.value = 0;
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.iconWrapper}>
          <LinearGradient
            colors={slide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name={slide.icon} size={52} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(200).springify()}
          style={themedStyles.title}
        >
          {slide.title}
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(300)}
          style={themedStyles.desc}
        >
          {slide.description}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backTouch: {
    marginRight: SPACING.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backPlaceholder: {
    width: 26,
    height: 26,
  },
  progressBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressBarItem: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    marginBottom: SPACING.xl,
  },
  iconGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  btn: {
    width: '100%',
  },
});
