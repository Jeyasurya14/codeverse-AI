import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { STORAGE_KEYS } from '../constants/theme';
import { setAuthTokens } from '../services/api';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (user: User, accessToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isOnboardingDone: boolean;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [userJson, token, onboarding] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE),
        ]);
        if (userJson) setUser(JSON.parse(userJson));
        if (token) setAuthTokens({ accessToken: token });
        if (onboarding === 'true') setIsOnboardingDone(true);
      } catch (e) {
        console.warn('Auth restore failed', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (u: User, accessToken?: string) => {
    setUser(u);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
    if (accessToken) {
      setAuthTokens({ accessToken });
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    }
  };

  const signOut = async () => {
    setUser(null);
    setAuthTokens(null);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.TOKENS_USED,
      STORAGE_KEYS.TOKENS_PURCHASED,
    ]);
  };

  const completeOnboarding = async () => {
    setIsOnboardingDone(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        isOnboardingDone,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
