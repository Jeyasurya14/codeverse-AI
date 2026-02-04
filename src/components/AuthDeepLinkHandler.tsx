import React, { useEffect } from 'react';
import { Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { exchangeOAuthCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { STORAGE_KEYS } from '../constants/theme';
import type { User, AuthTokens } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || '';

/**
 * Handles auth callback when the app is opened from the backend OAuth redirect.
 * Supports codeverse-ai://auth?code=... and exp://.../auth?code=... (Expo Go).
 */
export function AuthDeepLinkHandler() {
  const { signIn, completeOnboarding } = useAuth();
  const processingRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!BASE_URL) return;

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
      
      // Parse URL params
      const q = url.indexOf('?');
      if (q === -1) {
        // Check for path-based format: exp://.../auth/google/CODE or exp://.../auth/github/CODE
        const pathMatch = url.match(/\/auth\/(google|github)\/([^/?&#]+)/);
        if (pathMatch) {
          const provider = pathMatch[1] as 'google' | 'github';
          const code = decodeURIComponent(pathMatch[2]);
          await handleOAuthCode(provider, code, url);
        }
        return;
      }

      let query = url.slice(q + 1);
      const h = query.indexOf('#');
      if (h !== -1) query = query.slice(0, h);
      const params = Object.fromEntries(new URLSearchParams(query));

      // Check for magic link tokens (email auth)
      if (params.accessToken && params.refreshToken && params.provider === 'email') {
        await handleMagicLinkTokens(params.accessToken, params.refreshToken, params.expiresAt);
        return;
      }

      // Check for OAuth code (path-based format)
      const pathMatch = url.match(/\/auth\/(google|github)\/([^/?&#]+)/);
      if (pathMatch) {
        const provider = pathMatch[1] as 'google' | 'github';
        const code = decodeURIComponent(pathMatch[2]);
        await handleOAuthCode(provider, code, url);
        return;
      }

      // Check for OAuth code (query param format)
      const code = params.code || null;
      const provider = params.provider === 'github' ? 'github' : params.provider === 'google' ? 'google' : null;
      const hasAuthPath = url.includes('/auth') || url.includes('auth?') || url.includes('auth&') || url.includes('codeverse-ai');
      
      if (code && provider && hasAuthPath) {
        await handleOAuthCode(provider, code, url);
      }
    };

    const handleMagicLinkTokens = async (accessToken: string, refreshToken: string, expiresAt?: string) => {
      try {
        // Magic link tokens are already validated by backend, just sign in
        // We need to fetch user info or get it from token
        // For now, we'll decode the JWT to get user info (basic approach)
        // In production, you might want to call an API endpoint to get user info
        const tokens: AuthTokens = {
          accessToken,
          refreshToken,
          expiresAt,
        };
        
        // Extract user info from token (basic JWT decode without verification for now)
        // Note: In production, you should verify the token or call an API endpoint
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const appUser: User = {
            id: payload.sub,
            email: payload.email || '',
            name: payload.email?.split('@')[0] || 'User',
            provider: 'email',
          };
          await signIn(appUser, tokens);
          // Onboarding is now completed automatically in signIn
          
          // Force close browser
          try {
            await WebBrowser.dismissBrowser();
          } catch (e) {
            if (__DEV__) console.log('WebBrowser.dismissBrowser failed:', e);
          }
          
          // Clear processing flag
          if (url) processingRef.current.delete(url);
        } catch (e) {
          console.error('Failed to decode token:', e);
        }
      } catch (e) {
        console.error('Magic link token handling failed:', e);
      }
    };

    const handleOAuthCode = async (provider: 'google' | 'github', code: string, url: string) => {

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
        const { user, accessToken, refreshToken, expiresAt } = await exchangeOAuthCode(
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
        await signIn(appUser, {
          accessToken,
          refreshToken,
          expiresAt,
        });
        // Onboarding is now completed automatically in signIn
        
        // Force close browser immediately - critical for seamless experience
        try {
          await WebBrowser.dismissBrowser();
        } catch (e) {
          if (__DEV__) console.log('WebBrowser.dismissBrowser failed:', e);
        }
        
        // Clear processing flag so navigation can proceed
        processingRef.current.delete(url);
        
        // Navigation will automatically update via RootNavigator when user state changes
      } catch (e) {
        // #region agent log
        console.log('[DEBUG AuthDeepLinkHandler] Error in handleOAuthCode:', e);
        fetch('http://127.0.0.1:7242/ingest/12a7e347-3367-4c6b-a5bb-ebd7ad79ae28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDeepLinkHandler.tsx:62',message:'Error in handleOAuthCode',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
