import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { exchangeOAuthCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GITHUB_DISCOVERY = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
};

export function useGoogleAuth() {
  const { signIn } = useAuth();
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    discovery
  );

  const runGoogleSignIn = useCallback(async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error('Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID.');
    }
    if (!request) throw new Error('Auth is still loading.');
    const result = await promptAsync();
    if (result.type !== 'success' || !result.params.code) {
      if (result.type === 'dismiss' || result.type === 'cancel') return;
      throw new Error('Google sign-in was cancelled or failed.');
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
  const { signIn } = useAuth();
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

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
      throw new Error('GitHub sign-in was cancelled or failed.');
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
