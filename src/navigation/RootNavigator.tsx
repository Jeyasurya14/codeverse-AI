import React, { useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import { COLORS, FONTS, SPACING, FONT_SIZES, STORAGE_KEYS } from '../constants/theme';

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
import { OnboardingSlidesScreen } from '../screens/OnboardingSlidesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProgrammingScreen } from '../screens/ProgrammingScreen';
import { ArticleListScreen } from '../screens/ArticleListScreen';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { AIMentorScreen } from '../screens/AIMentorScreen';
import { RechargeTokensScreen } from '../screens/RechargeTokensScreen';

export type RootStackParamList = {
  OnboardingSlides: undefined;
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
            </>
          ) : (
            <>
              <Stack.Screen name="OnboardingSlides" component={OnboardingSlidesScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )
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

// Root loading screen component matching App.tsx design
function RootLoadingScreen() {
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
  
  return (
    <LinearGradient
      colors={[COLORS.background, '#0A0F1C', COLORS.background]}
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
