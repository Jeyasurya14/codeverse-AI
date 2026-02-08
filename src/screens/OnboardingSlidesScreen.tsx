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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, STORAGE_KEYS } from '../constants/theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  accentIcon?: string;
}

function getSlides(primaryColor: string): Slide[] {
  return [
    {
      id: '1',
      title: 'Learn by Doing',
      description: 'Master programming languages step by step with structured lessons, articles, and hands-on paths—like your favorite learning sites, all in one app.',
      icon: 'book-outline',
      gradient: ['#6366F1', '#8B5CF6'],
    },
    {
      id: '2',
      title: 'AI Mentor at Your Side',
      description: 'Get instant help while learning. Ask questions, prepare for interviews, and practice with AI—powered by advanced models.',
      icon: 'chatbubble-ellipses-outline',
      gradient: ['#06B6D4', '#3B82F6'],
    },
    {
      id: '3',
      title: 'Track Your Growth',
      description: 'Monitor progress, bookmark articles, and see your achievements as you level up. Streaks keep you motivated.',
      icon: 'trending-up-outline',
      gradient: ['#8B5CF6', primaryColor],
    },
    {
      id: '4',
      title: 'Start Your Journey',
      description: 'Join thousands of learners mastering programming with CodeVerse. Your coding adventure starts now.',
      icon: 'rocket-outline',
      gradient: ['#EC4899', '#F59E0B'],
    },
  ];
}

export function OnboardingSlidesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const SLIDES = useMemo(() => getSlides(colors.primary), [colors.primary]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const markOnboardingShown = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SLIDES_SHOWN, 'true');
    } catch (e) {
      if (__DEV__) console.warn('Failed to save onboarding slides status', e);
    }
  };

  const onNext = async () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      await markOnboardingShown();
      navigation.replace('Login');
    }
  };

  const onSkip = async () => {
    await markOnboardingShown();
    navigation.replace('Login');
  };

  const goBack = () => {
    if (index > 0) {
      listRef.current?.scrollToIndex({ index: index - 1, animated: true });
    }
  };

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        skipText: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.semiBold,
          color: colors.textMuted,
        },
        progressDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.border,
        },
        progressDotActive: {
          width: 28,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        title: {
          fontSize: 28,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          textAlign: 'center' as const,
          marginBottom: SPACING.md,
          letterSpacing: -0.5,
          lineHeight: 34,
        },
        description: {
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
          {index > 0 ? (
            <TouchableOpacity
              onPress={goBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          <TouchableOpacity onPress={onSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={themedStyles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                themedStyles.progressDot,
                i === index && themedStyles.progressDotActive,
              ]}
            />
          ))}
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
            <SlideItem
              slide={item}
              isActive={slideIndex === index}
              index={slideIndex}
              themedStyles={themedStyles}
            />
          )}
        />

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onNext}
            style={styles.ctaTouch}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={SLIDES[index].gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>
                {index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons
                name={index === SLIDES.length - 1 ? 'arrow-forward' : 'chevron-forward'}
                size={22}
                color="#FFFFFF"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideItem({
  slide,
  isActive,
  themedStyles,
}: {
  slide: Slide;
  isActive: boolean;
  index: number;
  themedStyles: {
    title: object;
    description: object;
  };
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 400 });
    } else {
      scale.value = 0.9;
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
        <Animated.View entering={FadeIn.delay(150)} style={styles.iconWrapper}>
          <LinearGradient
            colors={slide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name={slide.icon} size={56} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(250).springify()}
          style={themedStyles.title}
        >
          {slide.title}
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(350)}
          style={themedStyles.description}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 8,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.lg,
  },
  ctaTouch: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xxl,
  },
  ctaText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
