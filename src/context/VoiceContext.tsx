import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { extractArticleText, chunkForTTS } from '../utils/articleVoice';
import { STORAGE_KEYS } from '../constants/theme';

export type VoiceLanguageCode = 'en' | 'ta' | 'thunglish' | 'hi';

const VOICE_LOCALES: Record<VoiceLanguageCode, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  thunglish: 'ta-IN',
  hi: 'hi-IN',
};

export type VoiceRate = 0.5 | 1.0 | 1.25 | 1.5;

type VoiceContextType = {
  isPlaying: boolean;
  isPaused: boolean;
  currentChunkIndex: number;
  totalChunks: number;
  language: VoiceLanguageCode;
  rate: VoiceRate;
  articleId: string | null;
  error: string | null;
  play: (articleId: string, content: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setLanguage: (code: VoiceLanguageCode) => Promise<void>;
  setRate: (r: VoiceRate) => Promise<void>;
  clearError: () => void;
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [language, setLanguageState] = useState<VoiceLanguageCode>('en');
  const [rate, setRateState] = useState<VoiceRate>(1.0);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chunksRef = useRef<string[]>([]);
  const articleIdRef = useRef<string | null>(null);
  const localeRef = useRef<string>('en-US');
  const rateRef = useRef<number>(1.0);

  useEffect(() => {
    localeRef.current = VOICE_LOCALES[language];
  }, [language]);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.VOICE_LANGUAGE)
      .then((stored) => {
        if (stored && (stored === 'en' || stored === 'ta' || stored === 'thunglish' || stored === 'hi')) {
          setLanguageState(stored as VoiceLanguageCode);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.VOICE_RATE)
      .then((stored) => {
        const v = parseFloat(stored ?? '1');
        if ([0.5, 1, 1.25, 1.5].includes(v)) setRateState(v as VoiceRate);
      })
      .catch(() => {});
  }, []);

  const speakChunk = useCallback((index: number) => {
    const chunks = chunksRef.current;
    if (index >= chunks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      setTotalChunks(0);
      chunksRef.current = [];
      articleIdRef.current = null;
      setArticleId(null);
      return;
    }
    const chunk = chunks[index];
    const locale = localeRef.current;
    const r = rateRef.current;
    setCurrentChunkIndex(index);

    Speech.speak(chunk, {
      language: locale,
      rate: r,
      pitch: 1.0,
      volume: 1.0,
      onDone: () => {
        if (index + 1 < chunks.length) {
          speakChunk(index + 1);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentChunkIndex(0);
          setTotalChunks(0);
          chunksRef.current = [];
          articleIdRef.current = null;
          setArticleId(null);
        }
      },
      onError: (e: { message?: string }) => {
        setError(e?.message ?? 'Speech error');
        setIsPlaying(false);
      },
    });
  }, []);

  const play = useCallback((aid: string, content: string) => {
    setError(null);
    Speech.stop();

    const plain = extractArticleText(content);
    const chunks = chunkForTTS(plain);
    if (chunks.length === 0) {
      setError('No content to read');
      return;
    }

    chunksRef.current = chunks;
    articleIdRef.current = aid;
    setArticleId(aid);
    setTotalChunks(chunks.length);
    setCurrentChunkIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
    speakChunk(0);
  }, [speakChunk]);

  const pause = useCallback(async () => {
    if (Platform.OS === 'android') {
      await Speech.stop();
      setIsPaused(true);
      setIsPlaying(false);
    } else {
      await Speech.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (Platform.OS === 'android') {
      const idx = currentChunkIndex;
      const chunks = chunksRef.current;
      if (chunks.length === 0 || idx >= chunks.length) return;
      setIsPaused(false);
      setIsPlaying(true);
      speakChunk(idx);
    } else {
      Speech.resume();
      setIsPaused(false);
    }
  }, [currentChunkIndex, speakChunk]);

  const stop = useCallback(async () => {
    await Speech.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
    setTotalChunks(0);
    chunksRef.current = [];
    articleIdRef.current = null;
    setArticleId(null);
  }, []);

  const setLanguage = useCallback(async (code: VoiceLanguageCode) => {
    setLanguageState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VOICE_LANGUAGE, code);
    } catch (e) {
      if (__DEV__) console.warn('Failed to persist voice language:', e);
    }
  }, []);

  const setRate = useCallback(async (r: VoiceRate) => {
    setRateState(r);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VOICE_RATE, String(r));
    } catch (e) {
      if (__DEV__) console.warn('Failed to persist voice rate:', e);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      isPlaying,
      isPaused,
      currentChunkIndex,
      totalChunks,
      language,
      rate,
      articleId,
      error,
      play,
      pause,
      resume,
      stop,
      setLanguage,
      setRate,
      clearError,
    }),
    [
      isPlaying,
      isPaused,
      currentChunkIndex,
      totalChunks,
      language,
      rate,
      articleId,
      error,
      play,
      pause,
      resume,
      stop,
      setLanguage,
      setRate,
      clearError,
    ]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (ctx === undefined) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}
