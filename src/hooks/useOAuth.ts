import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { exchangeOAuthCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

/** Use Expo proxy only in Expo Go; in standalone/Play Store builds use direct deep link (codeverse-ai://) to avoid "Something went wrong" on auth.expo.io. */
function getRedirectUri(): string {
  const envUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (envUri) return envUri;
  const isExpoGo = Constants.appOwnership === 'expo';
  const uri = AuthSession.makeRedirectUri({ useProxy: isExpoGo });
  if (__DEV__) {
    console.log('[OAuth] Redirect URI (add to Google & GitHub):', uri);
  }
  return uri;
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
  const redirectUri = getRedirectUri();
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
    try {
      await WebBrowser.warmUpAsync();
    } catch {
      // ignore warm-up failure
    }
    const result = await promptAsync();
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
  }, [promptAsync, request, redirectUri, signIn]);

  return { runGoogleSignIn, ready: !!request && !!discovery };
}

export function useGithubAuth() {
  useMaybeCompleteAuthSession();
  const { signIn } = useAuth();
  const redirectUri = getRedirectUri();

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
    const result = await promptAsync();
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
