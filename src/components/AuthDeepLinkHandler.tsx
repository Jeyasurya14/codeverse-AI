import React, { useEffect } from 'react';
import { Linking, AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import type { User, AuthTokens } from '../types';

/**
 * Handles auth deep links for magic link authentication.
 * Supports codeverse-ai://auth?accessToken=...&refreshToken=...&provider=email
 */
export function AuthDeepLinkHandler() {
  const { signIn, completeOnboarding } = useAuth();
  const processingRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      // Prevent processing the same URL multiple times
      if (!url || processingRef.current.has(url)) {
        return;
      }
      processingRef.current.add(url);
      
      // Clean up after 5 seconds
      setTimeout(() => {
        processingRef.current.delete(url);
      }, 5000);
      
      if (!url) return;
      
      // Only handle magic link tokens (email auth)
      const q = url.indexOf('?');
      if (q === -1) return;

      let query = url.slice(q + 1);
      const h = query.indexOf('#');
      if (h !== -1) query = query.slice(0, h);
      const params = Object.fromEntries(new URLSearchParams(query));

      // Handle magic link tokens
      if (params.accessToken && params.refreshToken && params.provider === 'email') {
        await handleMagicLinkTokens(params.accessToken, params.refreshToken, params.expiresAt);
      }
    };

    const handleMagicLinkTokens = async (accessToken: string, refreshToken: string, expiresAt?: string) => {
      try {
        const tokens: AuthTokens = {
          accessToken,
          refreshToken,
          expiresAt,
        };
        
        // Extract user info from JWT token
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const appUser: User = {
            id: payload.sub,
            email: payload.email || '',
            name: payload.email?.split('@')[0] || 'User',
            provider: 'email',
            mfaEnabled: payload.mfaEnabled || false,
            emailVerified: payload.emailVerified || false,
          };
          await signIn(appUser, tokens);
          
          // Close browser
          try {
            await WebBrowser.dismissBrowser();
          } catch (e) {
            if (__DEV__) console.log('WebBrowser.dismissBrowser failed:', e);
          }
        } catch (e) {
          if (__DEV__) console.error('Failed to decode token:', e);
        }
      } catch (e) {
        if (__DEV__) console.error('Magic link token handling failed:', e);
      }
    };

    // Check initial URL (when app opens from deep link)
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('?')) {
        handleUrl(url);
      }
    });
    
    // Listen for URL events (when app is already running and receives deep link)
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });
    
    // Check when app comes to foreground (in case deep link was missed)
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        Linking.getInitialURL().then((url) => {
          if (url && url.includes('?')) {
            handleUrl(url);
          }
        });
      }
    });
    
    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, [signIn]);

  return null;
}
