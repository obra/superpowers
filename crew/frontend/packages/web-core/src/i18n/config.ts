import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { SUPPORTED_I18N_CODES, uiLanguageToI18nCode } from './languages';

// Import translation files
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enProjects from './locales/en/projects.json';
import enTasks from './locales/en/tasks.json';
import enOrganization from './locales/en/organization.json';
import frCommon from './locales/fr/common.json';
import frSettings from './locales/fr/settings.json';
import frProjects from './locales/fr/projects.json';
import frTasks from './locales/fr/tasks.json';
import frOrganization from './locales/fr/organization.json';
import jaCommon from './locales/ja/common.json';
import jaSettings from './locales/ja/settings.json';
import jaProjects from './locales/ja/projects.json';
import jaTasks from './locales/ja/tasks.json';
import jaOrganization from './locales/ja/organization.json';
import esCommon from './locales/es/common.json';
import esSettings from './locales/es/settings.json';
import esProjects from './locales/es/projects.json';
import esTasks from './locales/es/tasks.json';
import esOrganization from './locales/es/organization.json';
import koCommon from './locales/ko/common.json';
import koSettings from './locales/ko/settings.json';
import koProjects from './locales/ko/projects.json';
import koTasks from './locales/ko/tasks.json';
import koOrganization from './locales/ko/organization.json';
import zhHansCommon from './locales/zh-Hans/common.json';
import zhHansSettings from './locales/zh-Hans/settings.json';
import zhHansProjects from './locales/zh-Hans/projects.json';
import zhHansTasks from './locales/zh-Hans/tasks.json';
import zhHansOrganization from './locales/zh-Hans/organization.json';
import zhHantCommon from './locales/zh-Hant/common.json';
import zhHantSettings from './locales/zh-Hant/settings.json';
import zhHantProjects from './locales/zh-Hant/projects.json';
import zhHantTasks from './locales/zh-Hant/tasks.json';
import zhHantOrganization from './locales/zh-Hant/organization.json';

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    projects: enProjects,
    tasks: enTasks,
    organization: enOrganization,
  },
  fr: {
    common: frCommon,
    settings: frSettings,
    projects: frProjects,
    tasks: frTasks,
    organization: frOrganization,
  },
  ja: {
    common: jaCommon,
    settings: jaSettings,
    projects: jaProjects,
    tasks: jaTasks,
    organization: jaOrganization,
  },
  es: {
    common: esCommon,
    settings: esSettings,
    projects: esProjects,
    tasks: esTasks,
    organization: esOrganization,
  },
  ko: {
    common: koCommon,
    settings: koSettings,
    projects: koProjects,
    tasks: koTasks,
    organization: koOrganization,
  },
  'zh-Hans': {
    common: zhHansCommon,
    settings: zhHansSettings,
    projects: zhHansProjects,
    tasks: zhHansTasks,
    organization: zhHansOrganization,
  },
  'zh-Hant': {
    common: zhHantCommon,
    settings: zhHantSettings,
    projects: zhHantProjects,
    tasks: zhHantTasks,
    organization: zhHantOrganization,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: {
      'zh-TW': ['zh-Hant'],
      'zh-HK': ['zh-Hant'],
      'zh-MO': ['zh-Hant'],
      zh: ['zh-Hans'], // Map generic Chinese to Simplified Chinese
      default: ['en'],
    },
    defaultNS: 'common',
    debug: import.meta.env.DEV,
    // Include 'zh' + Traditional Chinese locales for browser detection
    supportedLngs: [...SUPPORTED_I18N_CODES, 'zh', 'zh-TW', 'zh-HK', 'zh-MO'],
    nonExplicitSupportedLngs: true, // Accept zh -> zh-Hans mapping
    load: 'currentOnly', // Load exact language code

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Avoid suspense for now to simplify initial setup
    },

    detection: {
      order: ['navigator', 'htmlTag'],
      caches: [], // Disable localStorage cache - we'll handle this via config
    },
  });

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('i18n initialized:', i18n.isInitialized);
  console.log('i18n language:', i18n.language);
  console.log('i18n namespaces:', i18n.options.ns);
  console.log('Common bundle loaded:', i18n.hasResourceBundle('en', 'common'));
}

// Function to update language from config
export const updateLanguageFromConfig = (configLanguage: string) => {
  if (configLanguage === 'BROWSER') {
    // Use browser detection
    const detected = i18n.services.languageDetector?.detect();
    const detectedLang = Array.isArray(detected) ? detected[0] : detected;
    i18n.changeLanguage(detectedLang || 'en');
  } else {
    // Use explicit language selection with proper mapping
    const langCode = uiLanguageToI18nCode(configLanguage);
    if (langCode) {
      i18n.changeLanguage(langCode);
    } else {
      console.warn(
        `Unknown UI language: ${configLanguage}, falling back to 'en'`
      );
      i18n.changeLanguage('en');
    }
  }
};

export default i18n;
