import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
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
      {focused && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
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
          ...(Platform.OS === 'android' && { elevation: 8, shadowColor: '#000' }),
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: SPACING.xs,
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

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
