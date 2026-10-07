import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, Translations, TRANSLATIONS } from '../data/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'autoaudit_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // 1. Check URL query param (e.g. ?lang=es)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang === 'es' || urlLang === 'en') {
        return urlLang;
      }
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'es' || stored === 'en') {
        return stored;
      }
      // 3. Check browser language
      if (navigator.language && navigator.language.toLowerCase().startsWith('es')) {
        return 'es';
      }
    }

    return 'en';
  });

  // Sync to document element and localStorage
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'es' : 'en'));
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      const currentDict = TRANSLATIONS[language];
      if (currentDict && key in currentDict) {
        return currentDict[key];
      }
      // Fallback to English
      return TRANSLATIONS.en[key] || String(key);
    },
    [language]
  );

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    translations: TRANSLATIONS[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
