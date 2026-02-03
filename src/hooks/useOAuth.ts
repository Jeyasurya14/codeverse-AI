import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { exchangeOAuthCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { STORAGE_KEYS } from '../constants/theme';
import type { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || '';

/** Normalize redirect URI: no trailing slash so it matches Google/GitHub exactly. */
function normalizeRedirectUri(uri: string): string {
  return uri.trim().replace(/\/+$/, '');
}

let hasLoggedRedirectUri = false;

/** True when running inside Expo Go (not a standalone build). */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Redirect URI for OAuth.
 * - Expo Go: use Expo proxy (https://auth.expo.io/...) so Google accepts it; add that URL in Google Console.
 * - Standalone + BASE_URL: use backend callback so we can redirect back via deep link.
 */
function getRedirectUri(provider?: 'google' | 'github'): string {
  if (!isExpoGo && BASE_URL && provider) {
    const uri = `${BASE_URL.replace(/\/$/, '')}/auth/callback/${provider}`;
    if (__DEV__ && !hasLoggedRedirectUri) {
      hasLoggedRedirectUri = true;
      console.log('[OAuth] Using backend callback – add this in Google Console:', uri);
    }
    return uri;
  }
  const envUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (envUri) {
    const normalized = normalizeRedirectUri(envUri);
    if (__DEV__ && !hasLoggedRedirectUri) {
      hasLoggedRedirectUri = true;
      console.log('[OAuth] Redirect URI (Expo Go / proxy):', normalized);
    }
    return normalized;
  }
  const uri = AuthSession.makeRedirectUri({ useProxy: true });
  const normalized = normalizeRedirectUri(uri);
  if (__DEV__ && !hasLoggedRedirectUri) {
    hasLoggedRedirectUri = true;
    console.log('[OAuth] Add this exact redirect URI in Google & GitHub Console:', normalized);
  }
  return normalized;
}

/** URL the backend will redirect to after OAuth (Expo Go: exp://.../auth, standalone: codeverse-ai://auth). */
function getRedirectBackUrl(): string {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    const base = AuthSession.makeRedirectUri({ useProxy: false });
    return base.replace(/\/?$/, '/auth');
  }
  return 'codeverse-ai://auth';
}

/** When app returns from browser, complete the auth session so promptAsync() can receive the result. */
function useMaybeCompleteAuthSession() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        WebBrowser.maybeCompleteAuthSession();
      }
    });
    return () => sub.remove();
  }, []);
}

const GITHUB_DISCOVERY = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
};

export function useGoogleAuth() {
  useMaybeCompleteAuthSession();
  const { signIn } = useAuth();
  const redirectUri = getRedirectUri('google');
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { access_type: 'offline', prompt: 'select_account' },
    },
    discovery
  );

  const runGoogleSignIn = useCallback(async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error('Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID.');
    }
    if (!request) throw new Error('Auth is still loading.');

    if (!isExpoGo && BASE_URL) {
      try {
        let authUrl = await request.makeAuthUrlAsync(discovery);
        const redirectBack = getRedirectBackUrl();
        const stateWithRedirect = `${request.state}.${encodeURIComponent(redirectBack)}`;
        const url = new URL(authUrl);
        url.searchParams.set('state', stateWithRedirect);
        authUrl = url.toString();
        if (__DEV__) {
          console.log('[OAuth] redirect_uri sent to Google:', url.searchParams.get('redirect_uri') ?? '');
        }
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OAUTH, JSON.stringify({
          provider: 'google',
          codeVerifier: request.codeVerifier,
          state: request.state,
        }));
        await WebBrowser.openBrowserAsync(authUrl);
      } catch (e) {
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OAUTH);
        throw e instanceof Error ? e : new Error('Could not open sign-in.');
      }
      return;
    }

    WebBrowser.maybeCompleteAuthSession();
    try {
      await WebBrowser.warmUpAsync();
    } catch {
      // ignore
    }
    const result = await promptAsync({
      preferEphemeralSession: false,
      ...(Platform.OS === 'android' && { createTask: false }),
    });
    if (result.type !== 'success' || !result.params.code) {
      if (result.type === 'dismiss' || result.type === 'cancel') return;
      if (result.type === 'error' && result.error?.message) {
        throw new Error(result.error.message);
      }
      throw new Error('Google sign-in was cancelled or failed. Please try again.');
    }
    const code = result.params.code;
    const codeVerifier = request.codeVerifier;
    const { user, accessToken } = await exchangeOAuthCode('google', code, redirectUri, codeVerifier);
    const appUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: 'google',
    };
    await signIn(appUser, accessToken);
  }, [promptAsync, request, redirectUri, signIn, discovery]);

  return { runGoogleSignIn, ready: !!request && !!discovery };
}

export function useGithubAuth() {
  useMaybeCompleteAuthSession();
  const { signIn } = useAuth();
  const redirectUri = getRedirectUri('github');

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ?? '',
      redirectUri,
      scopes: ['read:user', 'user:email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    GITHUB_DISCOVERY
  );

  const runGithubSignIn = useCallback(async () => {
    if (!process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID) {
      throw new Error('GitHub sign-in is not configured. Set EXPO_PUBLIC_GITHUB_CLIENT_ID.');
    }
    if (!request) throw new Error('Auth is still loading.');

    if (!isExpoGo && BASE_URL) {
      try {
        let authUrl = await request.makeAuthUrlAsync(GITHUB_DISCOVERY);
        const redirectBack = getRedirectBackUrl();
        const stateWithRedirect = `${request.state}.${encodeURIComponent(redirectBack)}`;
        const url = new URL(authUrl);
        url.searchParams.set('state', stateWithRedirect);
        authUrl = url.toString();
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OAUTH, JSON.stringify({
          provider: 'github',
          codeVerifier: request.codeVerifier,
          state: request.state,
        }));
        await WebBrowser.openBrowserAsync(authUrl);
      } catch (e) {
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OAUTH);
        throw e instanceof Error ? e : new Error('Could not open sign-in.');
      }
      return;
    }

    WebBrowser.maybeCompleteAuthSession();
    const result = await promptAsync({
      preferEphemeralSession: false,
      ...(Platform.OS === 'android' && { createTask: false }),
    });
    if (result.type !== 'success' || !result.params.code) {
      if (result.type === 'dismiss' || result.type === 'cancel') return;
      if (result.type === 'error' && (result as { error?: { message?: string } }).error?.message) {
        throw new Error((result as { error: { message: string } }).error.message);
      }
      throw new Error('GitHub sign-in was cancelled or failed. Please try again.');
    }
    const code = result.params.code;
    const codeVerifier = request.codeVerifier;
    const { user, accessToken } = await exchangeOAuthCode('github', code, redirectUri, codeVerifier);
    const appUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: 'github',
    };
    await signIn(appUser, accessToken);
  }, [promptAsync, request, redirectUri, signIn]);

  return { runGithubSignIn, ready: !!request };
}
