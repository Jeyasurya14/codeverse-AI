import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_TOKENS, STORAGE_KEYS } from '../constants/theme';
import { getTokenUsage, syncTokenUsage, getAuthTokens } from '../services/api';
import { useAuth } from './AuthContext';

type TokenContextType = {
  freeUsed: number;
  purchasedTotal: number;
  purchasedUsed: number;
  freeRemaining: number;
  totalAvailable: number;
  consumeTokens: (count: number) => boolean;
  addPurchasedTokens: (count: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [freeUsed, setFreeUsed] = useState(0);
  const [purchasedTotal, setPurchasedTotal] = useState(0);
  const [purchasedUsed, setPurchasedUsed] = useState(0);

  const load = async () => {
    try {
      // If user is logged in, sync from backend first
      if (user) {
        try {
          // Check if we have an auth token before making the request
          const tokens = getAuthTokens();
          if (!tokens?.accessToken) {
            // No auth token, skip backend and use local storage
            throw new Error('No authentication token');
          }
          
          const backendUsage = await getTokenUsage();
          setFreeUsed(backendUsage.freeUsed);
          setPurchasedTotal(backendUsage.purchasedTotal);
          setPurchasedUsed(backendUsage.purchasedUsed);
          
          // Update local storage to match backend
          await AsyncStorage.setItem(
            STORAGE_KEYS.TOKENS_USED,
            JSON.stringify({ free: backendUsage.freeUsed, purchased: backendUsage.purchasedUsed })
          );
          await AsyncStorage.setItem(STORAGE_KEYS.TOKENS_PURCHASED, String(backendUsage.purchasedTotal));
          return;
        } catch (e) {
          // Only warn if it's not an expected error (missing auth, 404 when not authenticated)
          const errorMsg = e instanceof Error ? e.message : String(e);
          const isExpectedError = 
            errorMsg.includes('No authentication') ||
            errorMsg.includes('Authentication required') ||
            errorMsg.includes('Invalid token') ||
            errorMsg.includes('Invalid or expired token') ||
            errorMsg.includes('Not found') ||
            errorMsg.includes('404') ||
            errorMsg.includes('UNAUTHORIZED') ||
            errorMsg.includes('INVALID_TOKEN');
          
          // Don't log expected token errors - they're handled elsewhere
          if (!isExpectedError) {
            __DEV__ && console.warn('Failed to load token usage from backend, using local storage', e);
          }
        }
      }
      
      // Fallback to local storage if not logged in or backend fails
      const [used, purchased] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKENS_USED),
        AsyncStorage.getItem(STORAGE_KEYS.TOKENS_PURCHASED),
      ]);
      if (used) {
        const parsed = JSON.parse(used);
        setFreeUsed(parsed.free ?? 0);
        setPurchasedUsed(parsed.purchased ?? 0);
      }
      if (purchased) setPurchasedTotal(parseInt(purchased, 10));
    } catch (e) {
      __DEV__ && console.warn('Token load failed', e);
    }
  };

  // Sync to backend when values change (if user is logged in)
  const syncToBackend = async (free: number, purchased: number, purchasedUsedValue: number) => {
    if (user) {
      try {
        await syncTokenUsage(free, purchased, purchasedUsedValue);
      } catch (e) {
        __DEV__ && console.warn('Failed to sync token usage to backend', e);
      }
    }
  };

  useEffect(() => {
    load();
  }, [user]); // Reload when user changes

  const freeRemaining = Math.max(0, AI_TOKENS.FREE_LIMIT - freeUsed);
  const purchasedRemaining = Math.max(0, purchasedTotal - purchasedUsed);
  const totalAvailable = freeRemaining + purchasedRemaining;

  const consumeTokens = (count: number): boolean => {
    if (count > totalAvailable) return false;
    let remaining = count;
    let newFreeUsed = freeUsed;
    let newPurchasedUsed = purchasedUsed;

    if (freeRemaining > 0 && remaining > 0) {
      const useFromFree = Math.min(freeRemaining, remaining);
      newFreeUsed = freeUsed + useFromFree;
      remaining -= useFromFree;
    }
    if (remaining > 0 && purchasedRemaining > 0) {
      const useFromPurchased = Math.min(purchasedRemaining, remaining);
      newPurchasedUsed = purchasedUsed + useFromPurchased;
    }

    setFreeUsed(newFreeUsed);
    setPurchasedUsed(newPurchasedUsed);
    AsyncStorage.setItem(
      STORAGE_KEYS.TOKENS_USED,
      JSON.stringify({ free: newFreeUsed, purchased: newPurchasedUsed })
    ).catch(() => {});
    
    // Sync to backend
    syncToBackend(newFreeUsed, purchasedTotal, newPurchasedUsed);
    
    return true;
  };

  const addPurchasedTokens = async (count: number) => {
    const newTotal = purchasedTotal + count;
    setPurchasedTotal(newTotal);
    await AsyncStorage.setItem(STORAGE_KEYS.TOKENS_PURCHASED, String(newTotal));
    
    // Sync to backend
    await syncToBackend(freeUsed, newTotal, purchasedUsed);
  };

  return (
    <TokenContext.Provider
      value={{
        freeUsed,
        purchasedTotal,
        purchasedUsed,
        freeRemaining,
        totalAvailable,
        consumeTokens,
        addPurchasedTokens,
        refresh: load,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  const ctx = useContext(TokenContext);
  if (ctx === undefined) throw new Error('useTokens must be used within TokenProvider');
  return ctx;
}
