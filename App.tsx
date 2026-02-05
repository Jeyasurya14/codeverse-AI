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
  Easing,
  interpolate
} from 'react-native-reanimated';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { TokenProvider } from './src/context/TokenContext';
import { ProgressProvider } from './src/context/ProgressContext';
import { BookmarksProvider } from './src/context/BookmarksContext';
import { useLoadFonts } from './src/context/FontContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthDeepLinkHandler } from './src/components/AuthDeepLinkHandler';
import { COLORS, SPACING, FONTS, FONT_SIZES } from './src/constants/theme';

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

  // Show splash immediately, even before fonts load - prevents white screen
  if (!fontsLoaded || !appIsReady) {
    return <SplashScreenComponent />;
  }

  return (
    <View style={styles.appWrapper}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <AuthProvider>
            <AuthDeepLinkHandler />
            <TokenProvider>
              <ProgressProvider>
                <BookmarksProvider>
                  <StatusBar style="light" />
                  <RootNavigator />
                </BookmarksProvider>
              </ProgressProvider>
            </TokenProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </View>
  );
}

// Custom animated loading spinner component
function AnimatedLoader() {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });
  
  return (
    <Animated.View style={[styles.loaderContainer, animatedStyle]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderGradient}
      />
    </Animated.View>
  );
}

// Splash screen component with animations
function SplashScreenComponent() {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const taglineOpacity = useSharedValue(0);
  const brandNameOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Logo animation: fade in + scale
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    
    // Brand name animation: fade in after logo
    setTimeout(() => {
      brandNameOpacity.value = withTiming(1, { duration: 400 });
    }, 300);
    
    // Tagline animation: fade in after brand name
    setTimeout(() => {
      taglineOpacity.value = withTiming(1, { duration: 400 });
    }, 600);
  }, []);
  
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });
  
  const brandNameAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: brandNameOpacity.value,
    };
  });
  
  const taglineAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: taglineOpacity.value,
    };
  });
  
  return (
    <LinearGradient
      colors={[COLORS.background, '#0A0F1C', COLORS.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('./assets/codeverse-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View style={brandNameAnimatedStyle}>
          <Text style={styles.brandName}>CodeVerse</Text>
        </Animated.View>
        
        <Animated.View style={taglineAnimatedStyle}>
          <Text style={styles.tagline}>Learn programming with AI</Text>
        </Animated.View>
        
        <View style={styles.loaderWrapper}>
          <AnimatedLoader />
        </View>
      </View>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 240,
    maxHeight: 240,
  },
  brandName: {
    fontSize: FONT_SIZES.hero + 4,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  loaderWrapper: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  loaderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
});
