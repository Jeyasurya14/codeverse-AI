import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/theme';

export type LastReadArticle = {
  languageId: string;
  articleId: string;
  languageName: string;
  articleTitle: string;
};

type ProgressContextType = {
  lastRead: LastReadArticle | null;
  setLastRead: (article: LastReadArticle) => Promise<void>;
  clearLastRead: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [lastRead, setLastReadState] = useState<LastReadArticle | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_READ_ARTICLE);
        if (raw) setLastReadState(JSON.parse(raw));
      } catch (e) {
        __DEV__ && console.warn('Progress load failed', e);
      }
    })();
  }, []);

  const setLastRead = useCallback(async (article: LastReadArticle) => {
    setLastReadState(article);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ_ARTICLE, JSON.stringify(article));
  }, []);

  const clearLastRead = useCallback(async () => {
    setLastReadState(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_READ_ARTICLE);
  }, []);

  return (
    <ProgressContext.Provider value={{ lastRead, setLastRead, clearLastRead }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (ctx === undefined) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
