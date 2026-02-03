import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_TOKENS, STORAGE_KEYS } from '../constants/theme';

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
  const [freeUsed, setFreeUsed] = useState(0);
  const [purchasedTotal, setPurchasedTotal] = useState(0);
  const [purchasedUsed, setPurchasedUsed] = useState(0);

  const load = async () => {
    try {
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
      console.warn('Token load failed', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    return true;
  };

  const addPurchasedTokens = async (count: number) => {
    const newTotal = purchasedTotal + count;
    setPurchasedTotal(newTotal);
    await AsyncStorage.setItem(STORAGE_KEYS.TOKENS_PURCHASED, String(newTotal));
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
