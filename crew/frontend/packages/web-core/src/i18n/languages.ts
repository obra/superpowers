/**
 * Centralized language configuration for the i18n system.
 * This eliminates duplicate language names in translation files and provides
 * a single source of truth for supported languages.
 */

export const UI_TO_I18N = {
  EN: 'en',
  FR: 'fr',
  JA: 'ja',
  ES: 'es',
  KO: 'ko',
  ZH_HANS: 'zh-Hans',
  ZH_HANT: 'zh-Hant',
} as const;

const SUPPORTED_UI_LANGUAGES = [
  'BROWSER',
  'EN',
  'FR',
  'JA',
  'ES',
  'KO',
  'ZH_HANS',
  'ZH_HANT',
] as const;
export const SUPPORTED_I18N_CODES = Object.values(UI_TO_I18N);

const FALLBACK_ENDONYMS = {
  en: 'English',
  fr: 'Français',
  ja: '日本語',
  es: 'Español',
  ko: '한국어',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
} as const;

/**
 * Convert UiLanguage enum value to i18next language code
 */
export function uiLanguageToI18nCode(uiLang: string): string | undefined {
  return uiLang === 'BROWSER'
    ? undefined
    : UI_TO_I18N[uiLang as keyof typeof UI_TO_I18N];
}

/**
 * Get the native name (endonym) of a language using Intl.DisplayNames
 */
function getEndonym(langCode: string): string {
  try {
    return (
      new Intl.DisplayNames([langCode], { type: 'language' }).of(langCode) ||
      FALLBACK_ENDONYMS[langCode as keyof typeof FALLBACK_ENDONYMS] ||
      langCode
    );
  } catch {
    return (
      FALLBACK_ENDONYMS[langCode as keyof typeof FALLBACK_ENDONYMS] || langCode
    );
  }
}

/**
 * Get language options for dropdown with proper display names
 */
export function getLanguageOptions(browserDefaultLabel: string) {
  return SUPPORTED_UI_LANGUAGES.map((ui) => ({
    value: ui,
    label:
      ui === 'BROWSER'
        ? browserDefaultLabel
        : getEndonym(UI_TO_I18N[ui as keyof typeof UI_TO_I18N]),
  }));
}
