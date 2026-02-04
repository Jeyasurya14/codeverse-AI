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
  completedArticleIds: string[];
  markArticleRead: (languageId: string, articleId: string) => Promise<void>;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [lastRead, setLastReadState] = useState<LastReadArticle | null>(null);
  const [completedArticleIds, setCompletedArticleIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [lastRaw, completedRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LAST_READ_ARTICLE),
          AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_ARTICLES),
        ]);
        if (lastRaw) setLastReadState(JSON.parse(lastRaw));
        if (completedRaw) setCompletedArticleIds(JSON.parse(completedRaw));
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

  const markArticleRead = useCallback(async (_languageId: string, articleId: string) => {
    setCompletedArticleIds((prev) => {
      if (prev.includes(articleId)) return prev;
      const next = [...prev, articleId];
      AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_ARTICLES, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ProgressContext.Provider value={{ lastRead, setLastRead, clearLastRead, completedArticleIds, markArticleRead }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (ctx === undefined) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
