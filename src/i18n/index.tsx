import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { ru } from './ru';

type Lang = 'en' | 'ru';

const dicts: Record<Lang, Dict> = { en, ru };

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: en,
});

function detectLang(): Lang {
  const saved = localStorage.getItem('rsb-lang');
  if (saved === 'en' || saved === 'ru') return saved;
  const nav = navigator.language;
  if (nav.startsWith('ru')) return 'ru';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('rsb-lang', l);
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: dicts[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
