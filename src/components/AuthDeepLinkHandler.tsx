import { useEffect } from 'react';
import { Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
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
  const { signIn, completeOnboarding } = useAuth();

  useEffect(() => {
    if (!BASE_URL) return;

    const handleUrl = async (url: string | null) => {
      // Skip if URL is just the base Expo URL without path/query (not our auth callback)
      if (url && !url.includes('?') && !url.includes('/auth') && !url.includes('codeverse-ai')) {
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] Skipping base URL (no query/path):', url);
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:23',message:'Skipping base URL',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return;
      }
      // #region agent log
      console.log('[DEBUG AuthDeepLinkHandler] Received URL:', url);
      fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:22',message:'handleUrl called',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!url) return;
      
      let code: string | null = null;
      let provider: 'google' | 'github' | null = null;
      
      // Check for path-based format: exp://.../auth/google/CODE or exp://.../auth/github/CODE (Android-safe, avoids query param stripping)
      const pathMatch = url.match(/\/auth\/(google|github)\/([^/?&#]+)/);
      if (pathMatch) {
        provider = pathMatch[1] as 'google' | 'github';
        code = decodeURIComponent(pathMatch[2]);
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] Found path-based format:', { provider, codeLength: code?.length });
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:38',message:'Path-based format detected',data:{provider,codeLength:code?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // Fallback to query param format: exp://.../auth?code=...&provider=... (for standalone builds)
        const q = url.indexOf('?');
        if (q === -1) {
          // #region agent log
          console.log('[DEBUG AuthDeepLinkHandler] URL has no query params and no path format');
          fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:45',message:'URL has no query params and no path format',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return;
        }
        let query = url.slice(q + 1);
        const h = query.indexOf('#');
        if (h !== -1) query = query.slice(0, h);
        const params = Object.fromEntries(new URLSearchParams(query));
        code = params.code || null;
        provider = params.provider === 'github' ? 'github' : params.provider === 'google' ? 'google' : null;
      }
      // Check if URL contains auth path (works for both exp://.../auth and codeverse-ai://auth)
      const hasAuthPath = url.includes('/auth') || url.includes('auth?') || url.includes('auth&') || url.includes('codeverse-ai');
      // #region agent log
      console.log('[DEBUG AuthDeepLinkHandler] Parsed params:', { code: !!code, provider, hasAuthPath, url });
      fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:55',message:'Parsed URL params',data:{hasCode:!!code,provider,hasAuthPath,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!code || !provider || !hasAuthPath) {
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] URL validation failed');
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:33',message:'URL validation failed',data:{hasCode:!!code,hasProvider:!!provider,hasAuth:url.includes('auth'),hasCodeverse:url.includes('codeverse-ai')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return;
      }

      try {
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] Checking PENDING_OAUTH from AsyncStorage');
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:35',message:'Checking PENDING_OAUTH',data:{provider},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OAUTH);
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OAUTH);
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] PENDING_OAUTH result:', { hasData: !!raw });
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:37',message:'PENDING_OAUTH retrieved',data:{hasData:!!raw},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (!raw) {
          // #region agent log
          console.log('[DEBUG AuthDeepLinkHandler] No PENDING_OAUTH data found');
          fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:38',message:'No PENDING_OAUTH data',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return;
        }
        const pending = JSON.parse(raw) as { provider: string; codeVerifier?: string; state?: string };
        if (pending.provider !== provider) {
          // #region agent log
          console.log('[DEBUG AuthDeepLinkHandler] Provider mismatch:', { pending: pending.provider, received: provider });
          fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:39',message:'Provider mismatch',data:{pending:pending.provider,received:provider},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return;
        }

        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] Starting code exchange');
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:42',message:'Starting code exchange',data:{codeLength:code.length,hasCodeVerifier:!!pending.codeVerifier},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const redirectUri = `${BASE_URL.replace(/\/$/, '')}/auth/callback/${provider}`;
        const { user, accessToken } = await exchangeOAuthCode(
          provider,
          code,
          redirectUri,
          pending.codeVerifier
        );
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] Code exchange completed');
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:47',message:'Code exchange completed',data:{userId:user?.id,hasToken:!!accessToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const appUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider,
        };
        await signIn(appUser, accessToken);
        await completeOnboarding();
        try {
          await WebBrowser.dismissBrowser();
        } catch {
          // dismissBrowser not available on all platforms (e.g. Android)
        }
      } catch (e) {
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] Error in handleUrl:', e);
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:62',message:'Error in handleUrl',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // User can retry sign-in
      }
    };

    // #region agent log
    console.log('[DEBUG AuthDeepLinkHandler] Setting up Linking listeners');
    fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:67',message:'Setting up Linking listeners',data:{hasBaseUrl:!!BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Check initial URL (when app opens from deep link) - but only process if it has auth params
    Linking.getInitialURL().then((url) => {
      // #region agent log
      console.log('[DEBUG AuthDeepLinkHandler] getInitialURL result:', url);
      fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:70',message:'getInitialURL result',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Only process if URL has query params (base URL without params is not our auth callback)
      if (url && url.includes('?')) {
        handleUrl(url);
      }
    });
    
    // Listen for URL events (when app is already running and receives deep link)
    // This is the PRIMARY way we receive deep links when user taps "Open app" button
    const sub = Linking.addEventListener('url', ({ url }) => {
      // #region agent log
      console.log('[DEBUG AuthDeepLinkHandler] Linking event received:', url);
      fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:76',message:'Linking event received',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      handleUrl(url);
    });
    
    // Also check when app comes to foreground (in case deep link was missed)
    // Workaround: If we have PENDING_OAUTH and app comes to foreground, try to get code from URL or check if browser has it
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] AppState active, checking URL again');
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:85',message:'AppState active',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Check if we have pending OAuth (user just came back from browser)
        AsyncStorage.getItem(STORAGE_KEYS.PENDING_OAUTH).then((raw) => {
          if (raw) {
            // #region agent log
            console.log('[DEBUG AuthDeepLinkHandler] AppState active + PENDING_OAUTH exists, checking all possible URLs');
            fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:92',message:'PENDING_OAUTH exists on AppState active',data:{hasPending:!!raw},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            // Try getInitialURL again (might have updated)
            Linking.getInitialURL().then((url) => {
              // #region agent log
              console.log('[DEBUG AuthDeepLinkHandler] getInitialURL on AppState active:', url);
              fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:95',message:'getInitialURL on AppState active',data:{url,hasQuery:url?.includes('?')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              if (url && (url.includes('?') || url.includes('/auth'))) {
                handleUrl(url);
              }
            });
          }
        });
      }
    });
    
    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, [signIn, completeOnboarding]);

  return null;
}
