import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/theme';

export type BookmarkItem = {
  languageId: string;
  articleId: string;
  languageName: string;
  articleTitle: string;
};

type BookmarksContextType = {
  bookmarks: BookmarkItem[];
  isBookmarked: (articleId: string) => boolean;
  addBookmark: (item: BookmarkItem) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  toggleBookmark: (item: BookmarkItem) => Promise<void>;
};

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
        if (raw) setBookmarks(JSON.parse(raw));
      } catch (e) {
        __DEV__ && console.warn('Bookmarks load failed', e);
      }
    })();
  }, []);

  const persist = useCallback(async (next: BookmarkItem[]) => {
    setBookmarks(next);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next));
  }, []);

  const isBookmarked = useCallback(
    (articleId: string) => bookmarks.some((b) => b.articleId === articleId),
    [bookmarks]
  );

  const addBookmark = useCallback(
    async (item: BookmarkItem) => {
      if (bookmarks.some((b) => b.articleId === item.articleId)) return;
      await persist([...bookmarks, item]);
    },
    [bookmarks, persist]
  );

  const removeBookmark = useCallback(
    async (articleId: string) => {
      await persist(bookmarks.filter((b) => b.articleId !== articleId));
    },
    [bookmarks, persist]
  );

  const toggleBookmark = useCallback(
    async (item: BookmarkItem) => {
      if (bookmarks.some((b) => b.articleId === item.articleId)) {
        await removeBookmark(item.articleId);
      } else {
        await addBookmark(item);
      }
    },
    [bookmarks, addBookmark, removeBookmark]
  );

  return (
    <BookmarksContext.Provider
      value={{ bookmarks, isBookmarked, addBookmark, removeBookmark, toggleBookmark }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (ctx === undefined) throw new Error('useBookmarks must be used within BookmarksProvider');
  return ctx;
}
