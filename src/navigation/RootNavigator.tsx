import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { User } from '../types';
import { FONTS, SPACING, FONT_SIZES, STORAGE_KEYS } from '../constants/theme';

// Support both exp:// (Expo Go) and codeverse-ai:// (standalone) deep links
const isExpoGo = Constants.appOwnership === 'expo';
const linking = {
  prefixes: isExpoGo ? ['exp://', 'codeverse-ai://'] : ['codeverse-ai://'],
  config: {
    screens: {
      RechargeTokens: 'recharge',
      ResetPassword: 'reset-password',
    },
  },
};
import type { Article } from '../types';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { OnboardingSlidesScreen } from '../screens/OnboardingSlidesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgrammingScreen } from '../screens/ProgrammingScreen';
import { ArticleListScreen } from '../screens/ArticleListScreen';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { AIMentorScreen } from '../screens/AIMentorScreen';
import { RechargeTokensScreen } from '../screens/RechargeTokensScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

export type RootStackParamList = {
  OnboardingSlides: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  Onboarding: undefined;
  Main: undefined;
  Profile: undefined;
  ArticleList: { languageId: string; languageName: string };
  ArticleDetail: { article: Article; languageName: string };
  RechargeTokens: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Programming: { active: 'book', inactive: 'book-outline' },
  AIMentor: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons = TAB_ICONS[name];
  const iconName = icons ? (focused ? icons.active : icons.inactive) : 'ellipse';
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapFocused]}>
      <View style={[styles.tabIconInner, focused && { backgroundColor: color + '18' }]}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>
    </View>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64;
  const bottomPadding = Math.max(insets.bottom, SPACING.sm);
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: tabBarHeight + bottomPadding,
          paddingTop: SPACING.sm,
          paddingBottom: bottomPadding,
          backgroundColor: colors.backgroundCard,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
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
        options={{ tabBarLabel: t('nav.home'), tabBarIcon: ({ focused, color }) => <TabIcon name="Home" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="Programming"
        component={ProgrammingScreen}
        options={{ tabBarLabel: t('nav.learn'), tabBarIcon: ({ focused, color }) => <TabIcon name="Programming" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="AIMentor"
        component={AIMentorScreen}
        options={{ tabBarLabel: t('nav.aiMentor'), tabBarIcon: ({ focused, color }) => <TabIcon name="AIMentor" focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('nav.settings'), tabBarIcon: ({ focused, color }) => <TabIcon name="Settings" focused={focused} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading, isOnboardingDone } = useAuth();
  const navigationRef = useRef<any>(null);
  const prevUserRef = useRef<User | null>(null);
  const prevOnboardingRef = useRef<boolean>(false);
  const [onboardingSlidesShown, setOnboardingSlidesShown] = useState<boolean | null>(null);
  const [checkingSlides, setCheckingSlides] = useState(true);

  // Check if onboarding slides have been shown
  useEffect(() => {
    const checkOnboardingSlides = async () => {
      try {
        const shown = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SLIDES_SHOWN);
        setOnboardingSlidesShown(shown === 'true');
      } catch (e) {
        if (__DEV__) console.warn('Failed to check onboarding slides status', e);
        setOnboardingSlidesShown(false);
      } finally {
        setCheckingSlides(false);
      }
    };
    
    if (!isLoading) {
      checkOnboardingSlides();
    }
  }, [isLoading]);

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

  if (isLoading || checkingSlides) {
    return <RootLoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Not logged in - show onboarding slides first (if not shown), then login
          onboardingSlidesShown ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="OnboardingSlides" component={OnboardingSlidesScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          )
        ) : !isOnboardingDone ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ArticleList" component={ArticleListScreen} />
            <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
            <Stack.Screen name="RechargeTokens" component={RechargeTokensScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Custom animated loading spinner component
function AnimatedLoader({ colors }: { colors: typeof import('../constants/theme').COLORS }) {
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
    <Animated.View style={[styles.loaderContainer, { borderColor: colors.background }, animatedStyle]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderGradient}
      />
    </Animated.View>
  );
}

// Root loading screen component matching App.tsx design
function RootLoadingScreen() {
  const { colors } = useTheme();
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
  
  const { width } = Dimensions.get('window');

  const themedStyles = useMemo(() => StyleSheet.create({
    brandName: {
      fontSize: FONT_SIZES.hero + 4,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textMuted,
      marginTop: SPACING.sm,
      letterSpacing: 0.3,
      textAlign: 'center' as const,
    },
  }), [colors]);
  
  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundElevated, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.loading}
    >
      <View style={styles.loadingContent}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../../assets/codeverse-logo.png')}
            style={[styles.logoImage, { width: width * 0.5, height: width * 0.5, maxWidth: 240, maxHeight: 240 }]}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View style={brandNameAnimatedStyle}>
          <Text style={themedStyles.brandName}>CodeVerse</Text>
        </Animated.View>
        
        <Animated.View style={taglineAnimatedStyle}>
          <Text style={themedStyles.tagline}>Learn programming with AI</Text>
        </Animated.View>
        
        <View style={styles.loaderWrapper}>
          <AnimatedLoader colors={colors} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
  loadingContent: {
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
    // Dimensions set inline for responsive sizing
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
  },
  loaderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabIconWrapFocused: {
    // Active state handled by inner background
  },
  tabIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
