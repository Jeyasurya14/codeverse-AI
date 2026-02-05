import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
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
  
  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
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

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CV</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandCode}>Code</Text>
            <Text style={styles.brandVerse}>Verse</Text>
          </View>
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
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandCode: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  brandVerse: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  loader: {
    marginTop: 24,
  },
});
