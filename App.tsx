import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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

export default function App() {
  const fontsLoaded = useLoadFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
});
