import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { User, AuthTokens } from '../types';
import { STORAGE_KEYS } from '../constants/theme';
import { setAuthTokens, getAuthTokens, refreshToken, logout as apiLogout } from '../services/api';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (user: User, tokens: AuthTokens, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  isOnboardingDone: boolean;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh token before expiration
  useEffect(() => {
    const checkAndRefresh = async () => {
      const tokens = getAuthTokens();
      if (!tokens?.refreshToken || !tokens.expiresAt) return;

      const expiresAt = new Date(tokens.expiresAt).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const refreshBeforeMs = 2 * 60 * 1000; // Refresh 2 minutes before expiry

      if (timeUntilExpiry > 0 && timeUntilExpiry < refreshBeforeMs) {
        try {
          const result = await refreshToken(tokens.refreshToken);
          const newTokens: AuthTokens = {
            ...tokens,
            accessToken: result.accessToken,
          };
          setAuthTokens(newTokens);
          await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(newTokens));
        } catch (e) {
          if (__DEV__) console.warn('Token refresh failed', e);
          // Refresh failed, but don't logout yet - let API calls handle it
        }
      }
    };

    // Check on mount and when app becomes active
    checkAndRefresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkAndRefresh();
      }
    });

    // Set up periodic check (every 5 minutes)
    refreshIntervalRef.current = setInterval(checkAndRefresh, 5 * 60 * 1000);

    return () => {
      sub.remove();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [userJson, tokenJson, onboarding] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE),
        ]);
        
        // If we have both user and tokens, restore session
        if (userJson && tokenJson) {
          try {
            const user = JSON.parse(userJson);
            const tokens = JSON.parse(tokenJson) as AuthTokens;
            
            // Check if tokens are valid (not expired)
            if (tokens.expiresAt) {
              const expiresAt = new Date(tokens.expiresAt).getTime();
              const now = Date.now();
              const timeUntilExpiry = expiresAt - now;
              
              // If token is expired or expiring soon, try to refresh
              if (timeUntilExpiry < 5 * 60 * 1000 && tokens.refreshToken) {
                try {
                  const result = await refreshToken(tokens.refreshToken);
                  const newTokens: AuthTokens = {
                    ...tokens,
                    accessToken: result.accessToken,
                    // Keep existing expiresAt or calculate new one (15 min from now)
                    expiresAt: result.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                  };
                  setAuthTokens(newTokens);
                  // Don't await - do in parallel with setting user
                  AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(newTokens)).catch(() => {});
                  setUser(user);
                } catch (refreshError) {
                  // Refresh failed - tokens are invalid, clear them
                  if (__DEV__) console.warn('Token refresh failed on restore', refreshError);
                  await AsyncStorage.multiRemove([
                    STORAGE_KEYS.USER,
                    STORAGE_KEYS.AUTH_TOKEN,
                    STORAGE_KEYS.REMEMBER_ME,
                  ]);
                }
              } else if (timeUntilExpiry > 0) {
                // Tokens are still valid, restore user session immediately
                setAuthTokens(tokens);
                setUser(user);
              } else {
                // Tokens expired and no refresh token, clear them
                await AsyncStorage.multiRemove([
                  STORAGE_KEYS.USER,
                  STORAGE_KEYS.AUTH_TOKEN,
                  STORAGE_KEYS.REMEMBER_ME,
                ]);
              }
            } else {
              // No expiration info, assume valid and restore
              setAuthTokens(tokens);
              setUser(user);
            }
          } catch (parseError) {
            // Legacy format: just accessToken string
            if (tokenJson && !tokenJson.startsWith('{')) {
              const legacyToken = tokenJson;
              const user = JSON.parse(userJson);
              setAuthTokens({ accessToken: legacyToken });
              await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify({ accessToken: legacyToken }));
              setUser(user);
            } else {
              if (__DEV__) console.warn('Failed to parse stored auth data', parseError);
            }
          }
        } else if (tokenJson) {
          // Only tokens, no user - set tokens but don't set user
          try {
            const tokens = JSON.parse(tokenJson) as AuthTokens;
            setAuthTokens(tokens);
          } catch {
            // Legacy format
            setAuthTokens({ accessToken: tokenJson });
          }
        }
        
        if (onboarding === 'true') setIsOnboardingDone(true);
      } catch (e) {
        if (__DEV__) console.warn('Auth restore failed', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (u: User, tokens: AuthTokens, rememberMe = false) => {
    // Optimize: Set state immediately for instant UI update
    setUser(u);
    setAuthTokens(tokens);
    
    // Optimize: Parallelize AsyncStorage operations
    const storageOps: Promise<void>[] = [
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u)),
      AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokens)),
    ];
    
    if (rememberMe) {
      storageOps.push(AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true'));
    } else {
      storageOps.push(AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME));
    }
    
    // Automatically complete onboarding so user goes directly to home page
    storageOps.push(completeOnboarding());
    
    // Wait for all storage operations in parallel
    await Promise.all(storageOps);
  };

  const signOut = async () => {
    const tokens = getAuthTokens();
    if (tokens?.refreshToken) {
      try {
        await apiLogout(tokens.refreshToken);
      } catch (e) {
        // Ignore logout errors
      }
    }
    setUser(null);
    setAuthTokens(null);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.TOKENS_USED,
      STORAGE_KEYS.TOKENS_PURCHASED,
      STORAGE_KEYS.REMEMBER_ME,
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
