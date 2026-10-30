import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ca, type Dict } from './locales/ca';
import { es } from './locales/es';

export type Lang = 'ca' | 'es';
export type Key = keyof Dict;
type Params = Record<string, string | number>;

const DICTS: Record<Lang, Dict> = { ca, es };
export const LOCALES: Record<Lang, string> = { ca: 'ca-ES', es: 'es-ES' };

const STORAGE_KEY = 'cotransport.lang';

function readStored(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ca' || v === 'es') return v;
  } catch {
    // almacenamiento no disponible (modo privado, etc.)
  }
  return 'ca';
}

// El català és l'idioma per defecte; l'elecció de l'usuari es recorda al navegador.
let current: Lang = readStored();

export const getLang = (): Lang => current;
export const getLocale = (): string => LOCALES[current];

export function hasKey(k: string): k is Key {
  return k in ca;
}

/** Traducció fora de components React (format de dates, errors…). */
export function tr(key: Key, params?: Params): string {
  let s: string = DICTS[current][key] ?? ca[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Plural: busca `<base>.one` o `<base>.other` i hi passa {n}. */
export function trn(base: string, n: number, params?: Params): string {
  return tr(`${base}.${n === 1 ? 'one' : 'other'}` as Key, { n, ...params });
}

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof tr;
  tn: typeof trn;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  const value = useMemo<I18nState>(
    () => ({
      lang,
      setLang: (l) => {
        current = l; // abans de renderitzar, perquè tr() ja llegeixi el nou idioma
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          // ignorat
        }
        setLangState(l);
      },
      t: tr,
      tn: trn,
    }),
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT fora de I18nProvider');
  return ctx;
}
