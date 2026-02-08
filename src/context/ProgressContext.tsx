import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/theme';

export type LastReadArticle = {
  languageId: string;
  articleId: string;
  languageName: string;
  articleTitle: string;
};

export type CompletedArticle = {
  articleId: string;
  completedAt: string;
};

type ProgressContextType = {
  lastRead: LastReadArticle | null;
  setLastRead: (article: LastReadArticle) => Promise<void>;
  clearLastRead: () => Promise<void>;
  completedArticleIds: string[];
  completedArticles: CompletedArticle[];
  markArticleRead: (languageId: string, articleId: string) => Promise<void>;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

function isLegacyFormat(raw: unknown): raw is string[] {
  return Array.isArray(raw) && (raw.length === 0 || typeof raw[0] === 'string');
}

function migrateToCompletedArticles(raw: unknown): CompletedArticle[] {
  if (!raw) return [];
  if (isLegacyFormat(raw)) {
    const now = new Date().toISOString();
    return raw.map((articleId) => ({ articleId, completedAt: now }));
  }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null && 'articleId' in raw[0]) {
    return raw as CompletedArticle[];
  }
  return [];
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [lastRead, setLastReadState] = useState<LastReadArticle | null>(null);
  const [completedArticles, setCompletedArticles] = useState<CompletedArticle[]>([]);

  const completedArticleIds = useMemo(
    () => completedArticles.map((c) => c.articleId),
    [completedArticles]
  );

  useEffect(() => {
    (async () => {
      try {
        const [lastRaw, completedRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LAST_READ_ARTICLE),
          AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_ARTICLES),
        ]);
        if (lastRaw) setLastReadState(JSON.parse(lastRaw));
        if (completedRaw) {
          const parsed = JSON.parse(completedRaw);
          const migrated = migrateToCompletedArticles(parsed);
          setCompletedArticles(migrated);
          if (isLegacyFormat(parsed) && migrated.length > 0) {
            await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_ARTICLES, JSON.stringify(migrated));
          }
        }
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
    setCompletedArticles((prev) => {
      if (prev.some((c) => c.articleId === articleId)) return prev;
      const entry: CompletedArticle = { articleId, completedAt: new Date().toISOString() };
      const next = [...prev, entry];
      AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_ARTICLES, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ProgressContext.Provider
      value={{ lastRead, setLastRead, clearLastRead, completedArticleIds, completedArticles, markArticleRead }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (ctx === undefined) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
