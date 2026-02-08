import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { registerEmail, loginEmail, requestPasswordReset, resetPassword } from '../services/api';
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
      
      // Sync token usage in background (non-blocking)
      if (result.tokenUsage) {
        refreshTokens().catch(() => {});
      }
      
      return { success: true };
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      
      // Provide user-friendly messages for common errors
      if (message.includes('timed out') || message.includes('timeout')) {
        message = 'Registration is taking longer than expected. Please check your internet connection and try again.';
      } else if (message.includes('Network') || message.includes('network')) {
        message = 'Unable to connect. Please check your internet connection and try again.';
      } else if (message.includes('multiple attempts')) {
        message = 'Server is busy. Please wait a moment and try again.';
      }
      
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
      let message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      
      // Provide user-friendly messages for common errors
      if (message.includes('timed out') || message.includes('timeout')) {
        message = 'Login is taking longer than expected. Please check your internet connection and try again.';
      } else if (message.includes('Network') || message.includes('network')) {
        message = 'Unable to connect. Please check your internet connection and try again.';
      } else if (message.includes('multiple attempts')) {
        message = 'Server is busy. Please wait a moment and try again.';
      }
      
      return { success: false, error: message };
    }
  };

  const requestForgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset link. Please try again.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const performResetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    login,
    requestForgotPassword,
    performResetPassword,
    isLoading,
  };
}
