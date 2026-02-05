import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

// Support both exp:// (Expo Go) and codeverse-ai:// (standalone) deep links
const isExpoGo = Constants.appOwnership === 'expo';
const linking = {
  prefixes: isExpoGo ? ['exp://', 'codeverse-ai://'] : ['codeverse-ai://'],
  config: {
    screens: {
      RechargeTokens: 'recharge',
    },
  },
};
import type { Article } from '../types';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProgrammingScreen } from '../screens/ProgrammingScreen';
import { ArticleListScreen } from '../screens/ArticleListScreen';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { AIMentorScreen } from '../screens/AIMentorScreen';
import { RechargeTokensScreen } from '../screens/RechargeTokensScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: undefined;
  ArticleList: { languageId: string; languageName: string };
  ArticleDetail: { article: Article; languageName: string };
  RechargeTokens: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Programming: { active: 'book', inactive: 'book-outline' },
  AIMentor: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Dashboard: { active: 'person', inactive: 'person-outline' },
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons = TAB_ICONS[name];
  const iconName = icons ? (focused ? icons.active : icons.inactive) : 'ellipse';
  return (
    <View style={styles.tabIconWrap}>
      <Ionicons name={iconName} size={22} color={color} />
      {focused && (
        <View style={styles.tabIndicatorContainer}>
          <View style={[styles.tabIndicatorDot, { backgroundColor: color }]} />
          <View style={[styles.tabIndicatorLine, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundCard,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: SPACING.sm,
          paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
          height: Platform.OS === 'ios' ? 84 : 64,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 11,
          marginTop: 4,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: SPACING.xs,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused, color }) => <TabIcon name="Home" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="Programming"
        component={ProgrammingScreen}
        options={{ tabBarLabel: 'Learn', tabBarIcon: ({ focused, color }) => <TabIcon name="Programming" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="AIMentor"
        component={AIMentorScreen}
        options={{ tabBarLabel: 'AI Mentor', tabBarIcon: ({ focused, color }) => <TabIcon name="AIMentor" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused, color }) => <TabIcon name="Dashboard" focused={focused} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading, isOnboardingDone } = useAuth();
  const navigationRef = useRef<any>(null);
  const prevUserRef = useRef<User | null>(null);
  const prevOnboardingRef = useRef<boolean>(false);

  // Reset navigation when user logs in and onboarding is complete
  useEffect(() => {
    const userChanged = prevUserRef.current === null && user !== null;
    const onboardingCompleted = !prevOnboardingRef.current && isOnboardingDone;
    
    if (userChanged && isOnboardingDone && navigationRef.current) {
      // User just logged in and onboarding is done - ensure we're on Main screen
      try {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } catch (e) {
        if (__DEV__) console.log('Navigation reset:', e);
      }
    }
    
    prevUserRef.current = user;
    prevOnboardingRef.current = isOnboardingDone;
  }, [user, isOnboardingDone]);

  if (isLoading) {
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
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !isOnboardingDone ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ArticleList" component={ArticleListScreen} />
            <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
            <Stack.Screen name="RechargeTokens" component={RechargeTokensScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
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
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandCode: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  brandVerse: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  loader: {
    marginTop: 24,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  tabIndicatorContainer: {
    position: 'absolute',
    bottom: -SPACING.sm - 2,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tabIndicatorLine: {
    width: 30,
    height: 2,
    borderRadius: 1,
  },
});
