import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform, Linking } from 'react-native';
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
 * - When BASE_URL is set: use backend callback for both Expo Go and standalone (more reliable than proxy).
 * - Otherwise: use Expo proxy (https://auth.expo.io/...) for Expo Go.
 */
function getRedirectUri(provider?: 'google' | 'github'): string {
  if (BASE_URL && provider) {
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
      console.log('[OAuth] Redirect URI (from env / proxy):', normalized);
    }
    return normalized;
  }
  const uri = AuthSession.makeRedirectUri();
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
    const base = AuthSession.makeRedirectUri();
    return base.replace(/\/?$/, '/auth');
  }
  return 'codeverse-ai://auth';
}

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
  const linkingListenerRef = useRef<{ remove: () => void } | null>(null);
  
  // Cleanup Linking listener on unmount
  useEffect(() => {
    return () => {
      if (linkingListenerRef.current) {
        linkingListenerRef.current.remove();
        linkingListenerRef.current = null;
      }
    };
  }, []);

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
    // #region agent log
    console.log('[DEBUG] runGoogleSignIn started', { isExpoGo, hasBaseUrl: !!BASE_URL, redirectUri });
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:102',message:'runGoogleSignIn started',data:{isExpoGo,BASE_URL:!!BASE_URL,redirectUri},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error('Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID.');
    }
    if (!request) throw new Error('Auth is still loading.');

    if (BASE_URL) {
      try {
        if (!discovery) throw new Error('Google discovery document not loaded');
        let authUrl = await request.makeAuthUrlAsync(discovery);
        const redirectBack = getRedirectBackUrl();
        const stateWithRedirect = `${request.state}.${encodeURIComponent(redirectBack)}`;
        const url = new URL(authUrl);
        url.searchParams.set('state', stateWithRedirect);
        authUrl = url.toString();
        if (__DEV__) {
          console.log('[OAuth] redirect_uri sent to Google:', url.searchParams.get('redirect_uri') ?? '');
        }
        const pendingData = {
          provider: 'google',
          codeVerifier: request.codeVerifier,
          state: request.state,
        };
        // #region agent log
        console.log('[DEBUG] Storing PENDING_OAUTH:', { provider: pendingData.provider, hasCodeVerifier: !!pendingData.codeVerifier });
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:143',message:'Storing PENDING_OAUTH',data:{provider:pendingData.provider,hasCodeVerifier:!!pendingData.codeVerifier},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OAUTH, JSON.stringify(pendingData));
        // #region agent log
        console.log('[DEBUG] Opening browser with authUrl, redirectBack will be:', redirectBack);
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:150',message:'Opening browser',data:{redirectBack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        await WebBrowser.openBrowserAsync(authUrl);
      } catch (e) {
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OAUTH);
        throw e instanceof Error ? e : new Error('Could not open sign-in.');
      }
      return;
    }

    // #region agent log
    console.log('[DEBUG] maybeCompleteAuthSession called before promptAsync');
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:132',message:'maybeCompleteAuthSession called before promptAsync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    WebBrowser.maybeCompleteAuthSession();
    try {
      await WebBrowser.warmUpAsync();
    } catch {
      // ignore
    }
    // #region agent log
    console.log('[DEBUG] Calling promptAsync with redirectUri:', redirectUri);
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:138',message:'promptAsync called',data:{redirectUri},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Set up Linking listener as fallback to catch redirect manually
    let manualRedirectUrl: string | null = null;
    const linkingListener = Linking.addEventListener('url', (event) => {
      if (event.url.includes('auth.expo.io') || event.url.includes(redirectUri) || event.url.includes('code=')) {
        // #region agent log
        console.log('[DEBUG] Linking listener caught redirect URL:', event.url);
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:165',message:'Linking listener caught redirect',data:{url:event.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        manualRedirectUrl = event.url;
        WebBrowser.maybeCompleteAuthSession();
      }
    });
    linkingListenerRef.current = linkingListener;
    
    const promptPromise = promptAsync({
      preferEphemeralSession: false,
      ...(Platform.OS === 'android' && { createTask: false }),
    });
    
    // Call maybeCompleteAuthSession periodically while waiting (helps with proxy handoff timing)
    const completionInterval = setInterval(() => {
      WebBrowser.maybeCompleteAuthSession();
    }, 1000);
    
    let result;
    try {
      result = await promptPromise;
    } finally {
      clearInterval(completionInterval);
      linkingListener.remove();
      linkingListenerRef.current = null;
      // Critical: call one more time immediately after promptAsync resolves/returns
      WebBrowser.maybeCompleteAuthSession();
    }
    
    // #region agent log
    const hasCode = result.type === 'success' && 'params' in result && !!result.params?.code;
    console.log('[DEBUG] promptAsync result:', { type: result.type, hasCode, error: result.type === 'error' ? (result as any).error : null, manualRedirectUrl });
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:142',message:'promptAsync result received',data:{type:result.type,hasCode,error:result.type==='error'?(result as any).error:null,manualRedirectUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // If promptAsync failed but we caught the redirect manually, try to extract code from URL
    if ((result.type !== 'success' || !('params' in result) || !result.params?.code) && manualRedirectUrl) {
      // #region agent log
      console.log('[DEBUG] Attempting to extract code from manual redirect URL');
      fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:190',message:'Extracting code from manual redirect',data:{url:manualRedirectUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        const url = new URL(manualRedirectUrl);
        const code = url.searchParams.get('code');
        if (code) {
          // #region agent log
          console.log('[DEBUG] Extracted code from manual redirect, proceeding with exchange');
          fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:195',message:'Code extracted from manual redirect',data:{codeLength:code.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
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
          return;
        }
      } catch (e) {
        // #region agent log
        console.log('[DEBUG] Failed to extract code from manual redirect:', e);
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:207',message:'Failed to extract code from manual redirect',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
    }
    
    if (result.type !== 'success' || !('params' in result) || !result.params.code) {
      if (result.type === 'dismiss' || result.type === 'cancel') return;
      if (result.type === 'error' && 'error' in result && (result as any).error?.message) {
        throw new Error((result as any).error.message);
      }
      throw new Error('Google sign-in was cancelled or failed. Please try again.');
    }
    const code = result.params.code;
    const codeVerifier = request.codeVerifier;
    // #region agent log
    console.log('[DEBUG] Starting code exchange', { codeLength: code?.length, hasCodeVerifier: !!codeVerifier });
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:149',message:'Starting code exchange',data:{codeLength:code?.length,hasCodeVerifier:!!codeVerifier},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const { user, accessToken } = await exchangeOAuthCode('google', code, redirectUri, codeVerifier);
    // #region agent log
    console.log('[DEBUG] Code exchange completed', { userId: user?.id, hasToken: !!accessToken });
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:151',message:'Code exchange completed',data:{userId:user?.id,hasToken:!!accessToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const appUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: 'google',
    };
    // #region agent log
    console.log('[DEBUG] Calling signIn', { userId: appUser.id });
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:159',message:'Calling signIn',data:{userId:appUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    await signIn(appUser, accessToken);
    // #region agent log
    console.log('[DEBUG] signIn completed');
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useOAuth.ts:160',message:'signIn completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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

    if (BASE_URL) {
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
