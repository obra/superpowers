# Settings Page Implementation (1300_00165)

This document provides detailed implementation documentation for the settings page.

## Table of Contents

1. [File Structure](#file-structure)
2. [Components](#components)
3. [Common Functionality](#common-functionality)
4. [Features](#features)
5. [RTL Support](#rtl-support)
6. [Z-Index Hierarchy](#z-index-hierarchy)

## File Structure

The settings page is now fully integrated into the Single-Page Application (SPA) architecture.

```
client/src/pages/00165-ui-settings/
├── components/                       # React components
│   ├── 00165-LanguageSettings.js     # Language settings component
│   ├── 00165-ThemeSettings.js        # Theme settings component
│   └── 00165-UISettingsPage.js       # Main settings page component
├── styles/                          # Component styles
│   ├── 00165-language-settings.css   # Language settings styles
│   └── 00165-theme-settings.css      # Theme settings styles
└── locales/                         # i18n translations
    ├── en/                          # English translations
    │   └── 00165-settings.json       # Settings translations
    └── ar/                          # Arabic translations
        └── 00165-settings.json       # RTL settings translations

client/src/common/css/
└── components/
    └── 00165-ui-settings/           # Common settings styles
```

## Components

1. **Language Settings Component**

```javascript
// 0165-LanguageSettings.js
const LanguageSettings = () => {
  const { t } = useTranslation('00165-settings');
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('userLanguage') || 'en');

  // Language options with native names
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic (العربية)' },
    { code: 'de', name: 'German (Deutsch)' },
    // ... other languages
  ];

  // Handle language change with RTL support
  const saveLanguage = async (lang) => {
    const rtlLanguages = ['ar'];
    const isRTL = rtlLanguages.includes(lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    // ... language change logic
  };

  return (
    <div className="page-background">
      <div className="content-wrapper">
        {/* Language selection grid */}
      </div>
    </div>
  );
};
```

2. **Theme Settings Component**

```javascript
// 0165-ThemeSettings.js
const ThemeSettings = () => {
  const { t } = useTranslation('00165-settings');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('userTheme') || 'Default');

  // Theme management logic
  const loadThemes = async () => {
    // ... theme loading logic
  };

  return (
    <div className="page-background">
      <div className="content-wrapper">
        {/* Theme selection grid */}
      </div>
    </div>
  );
};
```

## Common Functionality

Common functionality for settings is handled by shared React components and hooks, integrated into the main SPA.

## Features

1. **UI Settings**

- Theme customization
- Language preferences
- Display settings
- Accessibility options

## RTL Support

RTL support is handled by global CSS styles and React's ability to manage directionality.

## Z-Index Hierarchy

The z-index hierarchy is managed by global CSS styles and component-specific overrides where necessary.

## Development

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```
