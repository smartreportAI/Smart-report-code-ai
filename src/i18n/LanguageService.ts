/**
 * LanguageService - Multi-language support for reports
 * Phase 1.4: i18n implementation
 *
 * Supported languages: en (English), hi (Hindi), cz (Czech), ar (Arabic)
 * Fallback: English for missing translations
 * RTL: Arabic
 * Fonts: Google Fonts (Noto Sans Devanagari, Noto Sans Arabic)
 */

import en from './translations/en.json';
import hi from './translations/hi.json';
import cz from './translations/cz.json';
import ar from './translations/ar.json';

export type SupportedLanguage = 'en' | 'hi' | 'cz' | 'ar';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hi', 'cz', 'ar'];
const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

const TRANSLATIONS: Record<string, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
  cz: cz as Record<string, unknown>,
  ar: ar as Record<string, unknown>
};

function loadTranslations(lang: string): Record<string, unknown> {
  return TRANSLATIONS[lang] ?? TRANSLATIONS[FALLBACK_LANGUAGE] ?? {};
}

/**
 * Get nested value from object by dot path (e.g. "report.patientName")
 */
function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolate {key} in template string
 */
function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key];
    return val != null ? String(val) : `{${key}}`;
  });
}

export class LanguageService {
  private static instance: LanguageService;

  private constructor() {}

  static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  /**
   * Translate a key (dot notation, e.g. "report.patientName")
   * Params for interpolation: { count: 10 } -> replaces {count}
   */
  t(lang: string, key: string, params?: Record<string, string | number>): string {
    const effectiveLang = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
      ? lang
      : FALLBACK_LANGUAGE;
    const dict = loadTranslations(effectiveLang);
    let value = getNested(dict as Record<string, unknown>, key);

    if (value === undefined && effectiveLang !== FALLBACK_LANGUAGE) {
      const fallbackDict = loadTranslations(FALLBACK_LANGUAGE);
      value = getNested(fallbackDict as Record<string, unknown>, key);
    }

    if (value === undefined) return key;
    const str = String(value);
    return params ? interpolate(str, params) : str;
  }

  /**
   * Check if language is RTL (Arabic)
   */
  isRTL(lang: string): boolean {
    return lang === 'ar';
  }

  /**
   * Get dir attribute for HTML (<html dir="rtl"> for Arabic)
   */
  getDir(lang: string): 'ltr' | 'rtl' {
    return this.isRTL(lang) ? 'rtl' : 'ltr';
  }

  /**
   * Get Google Fonts link for language-specific fonts
   * Hindi: Noto Sans Devanagari
   * Arabic: Noto Sans Arabic
   */
  getFontLink(lang: string): string {
    const fonts: Record<string, string> = {
      hi: 'Noto+Sans+Devanagari:wght@400;700',
      ar: 'Noto+Sans+Arabic:wght@400;700'
    };
    const font = fonts[lang];
    if (!font) return '';
    return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${font}&display=swap" rel="stylesheet">`;
  }

  /**
   * Get font-family CSS for language
   */
  getFontFamily(lang: string): string {
    const families: Record<string, string> = {
      en: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      hi: "'Noto Sans Devanagari', 'Segoe UI', sans-serif",
      cz: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      ar: "'Noto Sans Arabic', 'Segoe UI', sans-serif"
    };
    return families[lang] || families.en;
  }

  /**
   * Get status translation (Normal, Borderline, etc.)
   */
  getStatusText(lang: string, indicator: string): string {
    const keyMap: Record<string, string> = {
      normal: 'status.normal',
      oneFromNormal: 'status.borderline',
      twoFromNormal: 'status.abnormal',
      threeFromNormal: 'status.highRisk',
      finalCritical: 'status.critical'
    };
    const key = keyMap[indicator] || 'status.normal';
    return this.t(lang, key);
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }
}

export const languageService = LanguageService.getInstance();
