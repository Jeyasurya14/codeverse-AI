import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/theme';
import en from '../locales/en.json';
import es from '../locales/es.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';

export type LanguageCode = 'en' | 'es' | 'hi' | 'ta' | 'fr' | 'de';

export const LANGUAGES: { code: LanguageCode; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

const LOCALES: Record<LanguageCode, Record<string, string>> = {
  en: en as Record<string, string>,
  es: es as Record<string, string>,
  hi: hi as Record<string, string>,
  ta: ta as Record<string, string>,
  fr: fr as Record<string, string>,
  de: de as Record<string, string>,
};

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE)
      .then((stored) => {
        const code = (stored as LanguageCode) ?? 'en';
        const valid = LANGUAGES.some((l) => l.code === code);
        if (valid) {
          setLanguageState(code);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const setLanguage = async (code: LanguageCode) => {
    setLanguageState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, code);
    } catch (e) {
      if (__DEV__) console.warn('Failed to persist language:', e);
    }
  };

  const t = useMemo(
    () => (key: string) => {
      const locale = LOCALES[language] ?? LOCALES.en;
      return locale[key] ?? LOCALES.en[key] ?? key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
