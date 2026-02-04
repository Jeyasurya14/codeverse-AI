import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { registerEmail, loginEmail, requestMagicLink } from '../services/api';
import type { AuthTokens } from '../types';

export function useEmailAuth() {
  const { signIn } = useAuth();
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
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const result = await loginEmail(email, password, rememberMe);
      await signIn(result.user, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      }, rememberMe);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
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
