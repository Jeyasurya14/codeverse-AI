import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { registerEmail, loginEmail, requestMagicLink } from '../services/api';
import type { AuthTokens } from '../types';

export function useEmailAuth() {
  const { signIn } = useAuth();
  const { refresh: refreshTokens } = useTokens();
  const [isLoading, setIsLoading] = useState(false);

  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const result = await registerEmail(email, password, name);
      await signIn(result.user, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      }, false);
      
      // Sync token usage from backend response
      if (result.tokenUsage) {
        await refreshTokens();
      }
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false, mfaCode?: string) => {
    setIsLoading(true);
    try {
      const result = await loginEmail(email, password, rememberMe, mfaCode);
      
      // Check if MFA is required
      if (result.requiresMfa) {
        setIsLoading(false);
        return { success: false, requiresMfa: true };
      }
      
      // Sign in immediately (optimized - doesn't block)
      signIn(result.user, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      }, rememberMe).catch((e) => {
        if (__DEV__) console.warn('Sign in storage error', e);
      });
      
      // Sync token usage in background (non-blocking)
      if (result.tokenUsage) {
        refreshTokens().catch((e) => {
          if (__DEV__) console.warn('Token refresh error', e);
        });
      }
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      // Don't show alert for MFA requirement
      if (!message.includes('MFA')) {
        Alert.alert('Login Failed', message);
      }
      return { success: false, error: message };
    }
  };

  const sendMagicLink = async (email: string, redirectUrl?: string) => {
    setIsLoading(true);
    try {
      await requestMagicLink(email, redirectUrl);
      Alert.alert(
        'Magic Link Sent',
        'Check your email for a sign-in link. It will expire in 15 minutes.',
        [{ text: 'OK' }]
      );
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send magic link. Please try again.';
      Alert.alert('Error', message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    login,
    sendMagicLink,
    isLoading,
  };
}
