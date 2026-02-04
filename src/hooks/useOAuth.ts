import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { exchangeOAuthCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

// Removed BASE_URL dependency - we always use Expo proxy for OAuth redirects

/** Normalize redirect URI: no trailing slash so it matches Google/GitHub exactly. */
function normalizeRedirectUri(uri: string): string {
  return uri.trim().replace(/\/+$/, '');
}

let hasLoggedRedirectUri = false;

/**
 * Redirect URI for OAuth.
 * Always use Expo proxy - simpler, more reliable, no redirect pages.
 * The code is exchanged directly in the app via backend API.
 */
function getRedirectUri(provider?: 'google' | 'github'): string {
  // Always use Expo proxy - it's simpler and more reliable
  const envUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (envUri) {
    const normalized = normalizeRedirectUri(envUri);
    if (__DEV__ && !hasLoggedRedirectUri) {
      hasLoggedRedirectUri = true;
      console.log('[OAuth] Using Expo proxy redirect URI:', normalized);
      console.log('[OAuth] Make sure this is added in Google/GitHub Console');
    }
    return normalized;
  }
  
  // Use Expo's default redirect URI
  const uri = AuthSession.makeRedirectUri();
  const normalized = normalizeRedirectUri(uri);
  if (__DEV__ && !hasLoggedRedirectUri) {
    hasLoggedRedirectUri = true;
    console.log('[OAuth] Using default Expo redirect URI:', normalized);
    console.log('[OAuth] Add this exact redirect URI in Google & GitHub Console:', normalized);
  }
  return normalized;
}

// Removed getRedirectBackUrl - not needed with simplified architecture

/** When app returns from browser, complete the auth session so promptAsync() can receive the result. */
function useMaybeCompleteAuthSession() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      // #region agent log
      console.log('[DEBUG] AppState changed:', state);
      fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:72',message:'AppState changed',data:{state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (state === 'active') {
        // #region agent log
        console.log('[DEBUG] AppState active - calling maybeCompleteAuthSession');
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:74',message:'maybeCompleteAuthSession called (AppState active)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
    if (!discovery) throw new Error('Google discovery document not loaded');

    // Simplified architecture: Use promptAsync directly - handles everything in-app
    // No redirect pages, no backend callbacks, just direct OAuth flow
    WebBrowser.maybeCompleteAuthSession();
    
    const result = await promptAsync({
      preferEphemeralSession: false,
      ...(Platform.OS === 'android' && { createTask: false }),
    });
    
    // Handle result
    if (result.type !== 'success' || !('params' in result) || !result.params?.code) {
      if (result.type === 'dismiss' || result.type === 'cancel') return;
      if (result.type === 'error' && 'error' in result && (result as any).error?.message) {
        throw new Error((result as any).error.message);
      }
      throw new Error('Google sign-in was cancelled or failed. Please try again.');
    }
    
    // Exchange code for tokens via backend API
    const code = result.params.code;
    const codeVerifier = request.codeVerifier;
    const { user, accessToken, refreshToken, expiresAt } = await exchangeOAuthCode(
      'google',
      code,
      redirectUri,
      codeVerifier
    );
    
    // Sign in user
    const appUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: 'google',
    };
    
    await signIn(appUser, {
      accessToken,
      refreshToken,
      expiresAt,
    });
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

    // Simplified architecture: Always use promptAsync with Expo proxy
    // This handles everything in-app without redirect pages
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
    const { user, accessToken, refreshToken, expiresAt } = await exchangeOAuthCode('github', code, redirectUri, codeVerifier);
    const appUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: 'github',
    };
    await signIn(appUser, {
      accessToken,
      refreshToken,
      expiresAt,
    });
  }, [promptAsync, request, redirectUri, signIn]);

  return { runGithubSignIn, ready: !!request };
}
