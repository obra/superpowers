# Internationalization (i18n)

This document outlines the internationalization (i18n) system used in Construct.AI.

## Translation Key Methodology

### Key Structure

Translation keys follow a strict hierarchical structure:

1. **Section Keys**
   - Format: `section_[name]_[context]`
   - Example: `section_finance_main`
   - Context is required for sections that appear in multiple places:
     - `_main` for top-level sections (e.g., `section_finance_main`)
     - `_dir` for director subsections (e.g., `section_finance_dir`)
     - No context suffix for unique sections (e.g., `section_home`)

2. **Link Keys**
   - Format: `link_[parent]_[name]`
   - Example: `link_directors_finance`
   - Parent prefix required for subsection links
   - No parent prefix for top-level links

3. **Common Elements**
   - Format: `[type].[category].[name]`
   - Example: `modals.common.close`
   - Used for shared UI elements

### Handling Duplicate Sections

Some sections appear in multiple contexts (e.g., "Finance" as both a main section and under Directors). To handle this:

1. **Identify Duplicate Sections**

   ```javascript
   const duplicateSections = [
     'construction',
     'contracts',
     'finance',
     'logistics',
     'procurement'
   ];
   ```

2. **Use Context Suffixes**

   ```json
   {
     "section_finance_main": "Finance",
     "section_finance_dir": "Finance"
   }
   ```

3. **Link Differentiation**

   ```json
   {
     "link_finance": "Finance",           // Main section link
     "link_directors_finance": "Finance"  // Directors subsection link
   }
   ```

## Supported Languages

The application supports the following languages:

1. English (en) - Default language
2. Arabic (ar) - With RTL support
3. Portuguese (pt)
4. Spanish (es)
5. French (fr)
6. Zulu (zu)
7. Xhosa (xh)
8. Swahili (sw)
9. German (de)

## File Structure

Translation files are organized by language and feature:

```
client/public/locales/
├── en/                 # English translations
│   ├── login.json            # Authentication translations
│   ├── user_management.json  # User management translations
│   ├── ui_settings.json      # Common UI translations
│   ├── password_reset.json   # Password reset translations
│   ├── accordion.json        # Accordion menu translations
│   └── 2700-safety.json     # Safety discipline translations
├── ar/                 # Arabic translations
├── pt/                 # Portuguese translations
├── es/                 # Spanish translations
├── fr/                 # French translations
├── zu/                 # Zulu translations
├── xh/                 # Xhosa translations
├── sw/                 # Swahili translations
└── de/                 # German translations
```

## Translation File Format

Translation files use a structured JSON format:

```json
{
  "section": {
    "subsection": {
      "key": "Translation text",
      "key_with_params": "Text with {{param}}"
    }
  }
}
```

Example (2700-safety.json):

```json
{
  "title": "Safety",
  "navigation": {
    "specialists": "Specialists",
    "upsert": "Upsert",
    "workspace": "Workspace"
  },
  "buttons": {
    "specialists": {
      "minutes": "Minutes of meeting",
      "method": "Method statements",
      "risk": "Risk assessments"
    },
    "upsert": {
      "files": "Upsert Files",
      "text": "Upsert Plain Text"
    },
    "workspace": {
      "custom": "To be customized"
    }
  },
  "modals": {
    "common": {
      "close": "Close",
      "submit": "Submit",
      "select": "Select a {{item}}",
      "save": "Save changes",
      "cancel": "Cancel"
    },
    "minutes": {
      "title": "Minutes - compile",
      "form": {
        "category": {
          "label": "Category",
          "options": {
            "safety": "Safety"
          }
        },
        "company": {
          "label": "Company name",
          "placeholder": "Select a company"
        },
        "meetingTitle": {
          "label": "Meeting title"
        },
        "meetingNotes": {
          "label": "Meeting transcript"
        }
      }
    },
    "method": {
      "title": "Method Statements",
      "description": "Create and manage method statements",
      "form": {
        "methodStatement": {
          "label": "Type of Method Statement",
          "placeholder": "Select a method statement type"
        },
        "identifier": {
          "label": "Method Statement Identifier",
          "placeholder": "Select an identifier"
        }
      }
    },
    "risk": {
      "title": "Risk Assessments",
      "description": "Conduct and document risk assessments",
      "form": {
        "riskAssessment": {
          "label": "Hazard Identification",
          "placeholder": "Select a hazard type",
          "options": {
            "construction": "Construction Site",
            "equipment": "Equipment",
            "plant": "Plant",
            "tasks": "Tasks"
          }
        }
      }
    },
    "upsert": {
      "files": {
        "title": "Upsert Files",
        "form": {
          "file": {
            "label": "Select File",
            "placeholder": "Choose a file to upload"
          }
        }
      },
      "text": {
        "title": "Upsert Text",
        "form": {
          "text": {
            "label": "Enter Text",
            "placeholder": "Type or paste your text here"
          }
        }
      }
    }
  },
  "messages": {
    "success": {
      "save": "Successfully saved",
      "upload": "Successfully uploaded",
      "delete": "Successfully deleted"
    },
    "errors": {
      "save": "Failed to save",
      "upload": "Failed to upload",
      "delete": "Failed to delete",
      "generic": "An error occurred. Please try again."
    }
  },
  "tooltips": {
    "upload": "Upload new files",
    "edit": "Edit document",
    "delete": "Delete document",
    "download": "Download document"
  },
  "status": {
    "loading": "Loading...",
    "processing": "Processing...",
    "completed": "Completed",
    "failed": "Failed"
  }
}
```

## Implementation

### HTML Elements

Add translations to HTML elements using the `data-i18n` attribute:

```html
<!-- Simple translation -->
<h1 data-i18n="title">Safety</h1>

<!-- Translation with HTML attributes -->
<input type="text" data-i18n="[placeholder]form.email.placeholder">

<!-- Translation with multiple attributes -->
<input type="text" 
       data-i18n="[placeholder]form.email.placeholder;[title]form.email.title">
```

### Dynamic Content

For dynamically generated content:

```javascript
// Using i18next directly
const message = i18next.t('messages.success.save');

// Using jQuery plugin
$element.i18n();
```

### Initialization and Loading States

Each page must properly initialize i18n and track its loading state:

```javascript
// Track loading state
const componentsLoaded = {
  i18n: false,
  // ... other components
};

// Initialize i18n with required namespaces
await initializeI18n({
  ns: ['login', 'accordion'],  // Required namespaces
  defaultNS: 'login',         // Default namespace
  keySeparator: '.',
});

// Mark i18n as loaded
componentsLoaded.i18n = true;
checkAllComponentsLoaded();

// Update translations
$('body').localize();
```

### RTL Support

RTL support is implemented through CSS classes:

```css
/* Base RTL class */
body.rtl {
  direction: rtl;
}

/* RTL-specific adjustments */
body.rtl .form-group {
  text-align: right;
}

body.rtl .modal-header {
  flex-direction: row-reverse;
}
```

## Modal System Integration

The modal system uses a registry-based approach for translations:

```javascript
// Modal class with translation support
class ModalClass extends BaseModal {
  constructor(id) {
    super(id);
    this.translations = {
      title: `modals.${this.type}.title`,
      description: `modals.${this.type}.description`,
      buttons: {
        submit: `modals.${this.type}.buttons.submit`,
        cancel: `modals.${this.type}.buttons.cancel`
      }
    };
  }

  getTemplate() {
    return `
      <div class="modal-header">
        <h5 data-i18n="${this.translations.title}"></h5>
      </div>
      <div class="modal-body">
        <p data-i18n="${this.translations.description}"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-i18n="${this.translations.buttons.cancel}"></button>
        <button type="button" class="btn btn-primary" data-i18n="${this.translations.buttons.submit}"></button>
      </div>
    `;
  }
}

// Modal registry handles translation updates
class ModalRegistry {
  updateTranslations() {
    this.registeredModals.forEach(modal => {
      modal.element.localize();
    });
  }
}
```

### Chatbot Integration

Chatbot configurations are translated through the chatbot config system:

```javascript
// Get translated chatbot config
const chatbotConfig = getChatbotConfig('safety', 'specialists');

const config = {
  welcomeMessage: chatbotConfig.welcomeMessage,  // From translations
  placeholder: chatbotConfig.placeholder,        // From translations
  theme: {
    chatWindow: {
      // ... other config
    }
  }
};
```

## Adding New Languages

To add a new language:

1. Create language directory:

   ```bash
   mkdir client/public/locales/[language-code]
   ```

2. Create translation files:

   ```bash
   touch client/public/locales/[language-code]/login.json
   touch client/public/locales/[language-code]/user_management.json
   # ... etc
   ```

3. Add language to i18n configuration:

   ```javascript
   // 0200-i18n-config.js
   const supportedLngs = [
     'en', 'ar', 'pt', 'es', 'fr', 'zu', 'xh', 'sw', 'de',
     '[language-code]'  // Add new language
   ];
   ```

4. Add RTL support if needed:

   ```javascript
   const rtlLanguages = ['ar', /* add RTL language code if needed */];
   ```

## Translation Management

### Key Naming Conventions

- Use lowercase letters and underscores
- Group related translations under common parents
- Use descriptive, hierarchical keys
- Include context in key names when necessary

Example:

```json
{
  "form": {
    "submit": {
      "save": "Save",
      "save_and_continue": "Save and Continue"
    }
  }
}
```

### Translation Parameters

Use double curly braces for parameters:

```json
{
  "welcome": "Welcome, {{name}}!",
  "items": "{{count}} items selected"
}
```

Usage:

```javascript
i18next.t('welcome', { name: 'John' });
i18next.t('items', { count: 5 });
```

### Pluralization

Use plural forms when needed:

```json
{
  "item": {
    "one": "{{count}} item",
    "other": "{{count}} items"
  }
}
```

## Testing and Validation

### Development Mode Testing

Test basic functionality in development mode:

```bash
cd client/public && python3 -m http.server 3000
```

### Production Mode Testing

Test with production flag to ensure proper behavior:

```javascript
// Add production flag to URL
http://localhost:3000/pages/2700-safety/2700-safety.html?mode=production
```

Verify in production mode:

1. All translations load correctly
2. RTL layout works properly in Arabic mode
3. No missing translation keys
4. No console errors
5. Proper fallback to default language

### Translation Coverage

- Ensure all user-facing strings are translated
- Check for missing translations using i18next's debug mode
- Validate translation files for proper JSON syntax
- Test RTL layout in Arabic language mode

### Testing Procedure

1. Enable debug mode:

   ```javascript
   i18next.init({
     debug: true,
     // ... other options
   });
   ```

2. Check browser console for missing translations

3. Test language switching:

   ```javascript
   await i18next.changeLanguage('ar');
   $('body').localize();
   ```

4. Verify RTL layout in Arabic mode:

   ```javascript
   document.body.classList.add('rtl');
   ```

## Best Practices

1. Always use translation keys instead of hardcoded strings

2. Keep translation files modular and organized by feature

3. Use meaningful, hierarchical key names

4. Include context in translation files when necessary

5. Test translations in all supported languages

6. Maintain consistent capitalization and formatting

7. Use parameters for dynamic content

8. Document special cases or cultural considerations

9. Regular validation of translation files

10. Keep a backup of translation files

11. Track loading states for translations and components

12. Initialize i18n with required namespaces for each page

## Common Issues and Solutions

### Missing Translations

Problem: Translation key not found

```
key "section.missing_key" not found
```

Solution: Add missing translation or check key spelling

### RTL Layout Issues

Problem: Layout breaks in RTL mode

Solution: Add appropriate RTL CSS rules:

```css
body.rtl .element {
  margin-right: auto;
  margin-left: initial;
}
```

### Character Encoding

Problem: Special characters display incorrectly

Solution: Ensure UTF-8 encoding:

```html
<meta charset="UTF-8">
```

### Loading State Issues

Problem: Components initialize before translations are ready

Solution: Track loading states and wait for i18n:

```javascript
const componentsLoaded = {
  i18n: false,
  // ... other components
};

// Initialize i18n first
await initializeI18n(options);
componentsLoaded.i18n = true;

// Then initialize other components
await initializeComponents();
componentsLoaded.components = true;

// Check if everything is loaded
checkAllComponentsLoaded();
```

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [Unicode CLDR](http://cldr.unicode.org/) - Language data reference
