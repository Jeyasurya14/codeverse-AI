import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { TokenProvider } from './src/context/TokenContext';
import { ProgressProvider } from './src/context/ProgressContext';
import { BookmarksProvider } from './src/context/BookmarksContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { VoiceProvider } from './src/context/VoiceContext';
import { useLoadFonts } from './src/context/FontContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthDeepLinkHandler } from './src/components/AuthDeepLinkHandler';
import { SPACING, FONTS, FONT_SIZES } from './src/constants/theme';

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.() || ((error: Error, isFatal?: boolean) => {
    if (__DEV__) {
      console.error('Unhandled error:', error);
    }
  });
  
  global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    if (__DEV__) {
      console.error('Unhandled error:', error, 'Fatal:', isFatal);
    }
    // In production, you might want to send this to an error tracking service
    originalHandler(error, isFatal);
  });
}

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const fontsLoaded = useLoadFonts();
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Keep native splash visible until custom screen is fully ready
  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (fontsLoaded) {
          // Small delay to ensure smooth transition (reduced from 800ms)
          await new Promise(resolve => setTimeout(resolve, 300));
          setAppIsReady(true);
          // Only hide native splash when custom screen is ready
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn(e);
        // Still hide splash even on error, but show custom screen
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    
    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);
  
  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (__DEV__) {
        console.error('Unhandled promise rejection:', event.reason);
      }
      // Prevent default browser behavior
      event.preventDefault?.();
    };
    
    // Add listener if available (web)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  return (
    <ThemeProvider>
      {!fontsLoaded || !appIsReady ? (
        <SplashScreenComponent />
      ) : (
        <AppContent />
      )}
    </ThemeProvider>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.appWrapper, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ErrorBoundary>
        <SafeAreaProvider>
            <AuthProvider>
              <LanguageProvider>
                <AuthDeepLinkHandler />
                <TokenProvider>
                  <ProgressProvider>
                    <BookmarksProvider>
                      <VoiceProvider>
                        <NotificationProvider>
                          <RootNavigator />
                        </NotificationProvider>
                      </VoiceProvider>
                    </BookmarksProvider>
                  </ProgressProvider>
                </TokenProvider>
              </LanguageProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </ErrorBoundary>
      </View>
  );
}

// Animated progress bar for splash
function SplashProgressBar({ colors }: { colors: { primary: string; background: string } }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 400 }),
        withDelay(100, withTiming(0.85, { duration: 800 }))
      ),
      -1,
      false
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100], Extrapolation.CLAMP)}%`,
  }));

  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.background + '40' }]}>
      <Animated.View style={[styles.progressBar, { backgroundColor: colors.primary }, barStyle]} />
    </View>
  );
}

// Splash screen component - modern cosmic design
function SplashScreenComponent() {
  const { colors, isDark } = useTheme();
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const logoGlow = useSharedValue(0.3);
  const taglineOpacity = useSharedValue(0);
  const brandNameOpacity = useSharedValue(0);
  const progressOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) });
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
    brandNameOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    progressOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
  }));

  const brandNameAnimatedStyle = useAnimatedStyle(() => ({ opacity: brandNameOpacity.value }));
  const taglineAnimatedStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const progressAnimatedStyle = useAnimatedStyle(() => ({ opacity: progressOpacity.value }));

  return (
    <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      {/* Cosmic background */}
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
      <LinearGradient
        colors={[
          colors.primary + '12',
          'transparent',
          colors.secondary + '08',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 1 }]}
      />
      {/* Subtle grid overlay */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={`h${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${i * 25}%` }]} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <View key={`v${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${i * 33}%` }]} />
        ))}
      </View>

      <View style={styles.splashContent}>
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <Animated.View style={[styles.logoGlow, { backgroundColor: colors.primary }, glowAnimatedStyle]} />
          <View style={styles.logoInner}>
            <Image
              source={require('./assets/codeverse-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.brandWrap, brandNameAnimatedStyle]}>
          <Text style={[styles.brandName, { color: colors.textPrimary }]}>CodeVerse</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineWrap, taglineAnimatedStyle]}>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Learn programming with AI
          </Text>
        </Animated.View>

        <Animated.View style={[styles.progressWrap, progressAnimatedStyle]}>
          <SplashProgressBar colors={colors} />
        </Animated.View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 80,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.25,
  },
  logoInner: {
    width: width * 0.45,
    height: width * 0.45,
    maxWidth: 200,
    maxHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandWrap: {
    marginBottom: SPACING.xs,
  },
  brandName: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    letterSpacing: -1,
  },
  taglineWrap: {
    marginBottom: SPACING.xxl,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  progressWrap: {
    position: 'absolute',
    bottom: 48,
    left: SPACING.xl,
    right: SPACING.xl,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
