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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, STORAGE_KEYS } from '../constants/theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Learn Programming',
    description: 'Master programming languages step by step with interactive lessons and structured learning paths.',
    icon: 'book',
    gradient: ['#6366F1', '#8B5CF6'], // Indigo to Purple
  },
  {
    id: '2',
    title: 'AI-Powered Mentor',
    description: 'Get instant help and guidance from your AI mentor. Ask questions and receive personalized learning support.',
    icon: 'chatbubbles',
    gradient: ['#06B6D4', '#3B82F6'], // Cyan to Blue
  },
  {
    id: '3',
    title: 'Track Your Progress',
    description: 'Monitor your learning journey, bookmark articles, and see your achievements as you master new skills.',
    icon: 'trending-up',
    gradient: ['#8B5CF6', COLORS.primary],
  },
  {
    id: '4',
    title: 'Start Your Journey',
    description: 'Join thousands of learners mastering programming with CodeVerse. Your coding adventure starts here!',
    icon: 'rocket',
    gradient: ['#EC4899', '#F59E0B'], // Pink to Orange
  },
];

export function OnboardingSlidesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

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
      // Last slide - mark as shown and navigate to login
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

  return (
    <LinearGradient
      colors={[COLORS.background, '#0A0F1C', COLORS.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {index > 0 ? (
            <TouchableOpacity
              onPress={goBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === index ? styles.progressDotActive : styles.progressDotInactive,
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
            />
          )}
        />

        {/* Bottom Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onNext}
            style={styles.nextButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={SLIDES[index].gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons
                name={index === SLIDES.length - 1 ? 'arrow-forward' : 'chevron-forward'}
                size={20}
                color="#FFFFFF"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SlideItem({ slide, isActive, index }: { slide: typeof SLIDES[0]; isActive: boolean; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  React.useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withTiming(0, { duration: 500 });
    } else {
      opacity.value = 0;
      translateY.value = 30;
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        {/* Icon Container */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={slide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name={slide.icon as any} size={64} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(300)}
          style={styles.title}
        >
          {slide.title}
        </Animated.Text>

        {/* Description */}
        <Animated.Text
          entering={FadeInDown.delay(400)}
          style={styles.description}
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  skipButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.backgroundElevated,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  progressDotInactive: {
    backgroundColor: COLORS.backgroundElevated,
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
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: FONT_SIZES.hero,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: SPACING.lg,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  nextButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  nextButtonText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
