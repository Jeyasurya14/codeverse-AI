import { useEffect } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exchangeOAuthCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { STORAGE_KEYS } from '../constants/theme';
import type { User } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || '';

/**
 * Handles auth callback when the app is opened from the backend OAuth redirect.
 * Supports codeverse-ai://auth?code=... and exp://.../auth?code=... (Expo Go).
 */
export function AuthDeepLinkHandler() {
  const { signIn } = useAuth();

  useEffect(() => {
    if (!BASE_URL) return;

    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const q = url.indexOf('?');
      if (q === -1) return;
      let query = url.slice(q + 1);
      const h = query.indexOf('#');
      if (h !== -1) query = query.slice(0, h);
      const params = Object.fromEntries(new URLSearchParams(query));
      const code = params.code;
      const provider = params.provider === 'github' ? 'github' : params.provider === 'google' ? 'google' : null;
      if (!code || !provider || (!url.includes('auth') && !url.includes('codeverse-ai'))) return;

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OAUTH);
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OAUTH);
        if (!raw) return;
        const pending = JSON.parse(raw) as { provider: string; codeVerifier?: string; state?: string };
        if (pending.provider !== provider) return;

        const redirectUri = `${BASE_URL.replace(/\/$/, '')}/auth/callback/${provider}`;
        const { user, accessToken } = await exchangeOAuthCode(
          provider,
          code,
          redirectUri,
          pending.codeVerifier
        );
        const appUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider,
        };
        await signIn(appUser, accessToken);
      } catch {
        // User can retry sign-in
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [signIn]);

  return null;
}
