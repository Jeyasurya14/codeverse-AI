import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { TokenProvider } from './src/context/TokenContext';
import { ProgressProvider } from './src/context/ProgressContext';
import { BookmarksProvider } from './src/context/BookmarksContext';
import { useLoadFonts } from './src/context/FontContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthDeepLinkHandler } from './src/components/AuthDeepLinkHandler';
import { COLORS } from './src/constants/theme';

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
  
  useEffect(() => {
    async function prepare() {
      try {
        // Hide splash screen immediately to show our branded loading screen
        await SplashScreen.hideAsync();
        
        // Wait for fonts to load
        if (fontsLoaded) {
          // Small delay to show branded loading screen (optional - remove if you want instant)
          await new Promise(resolve => setTimeout(resolve, 800));
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
        // Still hide splash even on error
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

  if (!fontsLoaded || !appIsReady) {
    return (
      <View style={styles.loading}>
        <View style={styles.logoContainer}>
          <Image
            source={require('./assets/codeverse-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Learn programming with AI</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </View>
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  loader: {
    marginTop: 32,
  },
  tagline: {
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '400',
    color: COLORS.textMuted,
    marginTop: 8,
    letterSpacing: 0.3,
  },
});
