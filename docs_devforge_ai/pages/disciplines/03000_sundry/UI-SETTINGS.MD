# UI Settings

## Overview

The UI Settings system provides comprehensive customization and management of the application's user interface. It handles everything from basic display settings to complex component behaviors, allowing for company-specific UI customization.

## Core Components

### 1. Settings Manager (`client/src/common/js/ui/00200-ui-display-settings.js`)

```javascript
// Core settings management functionality
- Settings initialization (from localStorage or defaults)
- Configuration loading (from 00200-ui-display-mappings.js)
- State management (visibility of sections/links)
- Settings persistence (to localStorage)
```

### 2. UI Component Configuration

```javascript
// Configuration for various UI elements, managed by the Settings Manager
// - Layout management
// - Theme management (see 0750_IMAGE_THEME_SETTINGS.md)
// - Visibility rules (for accordion sections, links)
// - Responsive behavior
// - Button configuration and management
// - Language configuration and management (i18n integration)
```

## UI Switching Mechanism

The UI switching functionality uses a dual ID system to manage visibility states and update the DOM:

### ID System

1. **Button IDs** (DOM/UI Layer)
   - Format: `accordion-button-XXXX` (e.g., `accordion-button-0100`)
   - Used for:
     - DOM element identification
     - Event handling
     - URL structure matching
   - Example: `accordion-button-0100` for Home section

2. **Option IDs** (Settings Layer)
   - Format: Simple numeric IDs (e.g., `1`, `2`, `501`)
   - Used for:
     - Settings storage
     - Database records
     - Visibility state management
   - Example: Option ID `1` maps to button ID `accordion-button-0100`

### Settings Management

- Settings are stored in a Map structure keyed by option ID
- Each setting contains:

  ```javascript
  {
    option_id: "1",           // Numeric ID for settings
    is_visible: true,         // Visibility state
    title: "Home",           // Section title
    parent_id: null          // Optional parent reference
  }
  ```

### Visibility Control

- Sections use data-section-id attributes with option IDs
- DOM elements are queried using these attributes
- Changes are applied through CSS classes
- State is preserved in settings storage

### Dynamic Updates

1. When a setting is updated:

   ```javascript
   // Update setting by option ID
   await settingsManager.updateSetting("1", true);
   
   // Find DOM elements by data attribute
   const elements = document.querySelectorAll('[data-section-id="1"]');
   
   // Apply visibility
   elements.forEach(el => {
     el.classList.toggle("d-none", !isVisible);
   });
   ```

2. Parent-Child Relationships:
   - Parent sections store option IDs of children
   - Child visibility depends on parent state
   - Visibility checks traverse up the section tree

   ```javascript
   function isParentVisible(element) {
     let parent = element.closest(".accordion-section");
     while (parent) {
       const optionId = parent.getAttribute("data-section-id");
       const setting = settings.get(optionId);
       if (setting && !setting.is_visible) return false;
       parent = parent.parentElement.closest(".accordion-section");
     }
     return true;
   }
   ```

### Implementation Example

```javascript
async function updateSetting(sectionId, isVisible) {
  // Update the setting
  const setting = settings.get(sectionId.toString());
  if (setting) {
    setting.is_visible = isVisible;
    // Update children recursively
    updateChildrenVisibility(sectionId, isVisible);
    // Apply to DOM
    await applySettingToDOM(sectionId);
  }
}
```

## Database Structure

### UI Display Settings

```sql
-- Reference: setup_ui_display.sql
CREATE TABLE ui_display_settings (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    page_id VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Button Settings

```sql
-- Reference: setup_ui_button_settings.sql
CREATE TABLE ui_button_settings (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    button_id VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Details

### 1. Settings Initialization

```javascript
// client/src/common/js/ui/00200-ui-display-settings.js
async initialize() {
  // Loads settings from localStorage or initializes with defaults
  await this.loadSettings();
  this.initialized = true;
}
```

### 2. Component Configuration & Application

```javascript
// Settings are applied by React components consuming the settings manager.
// The AccordionComponent, for example, calls settingsManager.getAccordionSections()
// to render sections based on their visibility settings.
// Other UI elements would similarly read their configurations from the settings manager.
```
### 1. Settings Initialization

```javascript
// client/src/common/js/ui/00200-ui-display-settings.js
async initialize() {
  // Loads settings from localStorage or initializes with defaults
  await this.loadSettings();
  this.initialized = true;
}
```

### 2. Component Management

```javascript
// 0165-ui-builder.js
class UIComponentBuilder {
  constructor(settings) {
    this.settings = settings;
    this.components = new Map();
  }

  async buildComponent(type, config) {
    const component = await this.createComponent(type, config);
    this.registerComponent(component);
    return component;
  }
}
```

### 3. Display Configuration

```javascript
// Reference: setup_ui_display_update.sql
const displayConfig = {
  layout: {
    sidebar: {
      visible: true,
      width: "250px",
      collapsible: true,
    },
    header: {
      visible: true,
      height: "60px",
      fixed: true,
    },
    content: {
      padding: "20px",
      maxWidth: "1200px",
    },
  },
};
```

## UI Customization

### 1. Theme Management

```javascript
// Theme configuration (Orange Theme)
const themeSettings = {
  colors: {
    primary: "#F08C00",      // Medium Orange
    secondary: "#6c757d",    // Standard Grey (for secondary actions)
    success: "#28a745",      // Standard Green
    danger: "#dc3545",       // Standard Red
    warning: "#FFC107",      // Standard Yellow/Light Orange
    info: "#FFDAB9",         // Peach/Light Orange
    light: "#f8f9fa",        // Very Light Grey / Off-white
    dark: "#343a40",         // Dark Grey / Near Black
    text_primary: "#212529", // Near Black for general text
    text_on_dark: "#ffffff", // White text on dark/colored backgrounds
    background: "#ffffff",   // White background
  },
  typography: {
    fontFamily: "Arial, sans-serif", // Keep font, adjust if needed by theme
    fontSize: "16px",
    lineHeight: 1.5,
  },
};
```

### 2. Layout Configuration

```javascript
// Layout settings
const layoutSettings = {
  grid: {
    columns: 12,
    gutter: "20px",
    margin: "0 auto",
  },
  breakpoints: {
    sm: "576px",
    md: "768px",
    lg: "992px",
    xl: "1200px",
  },
};
```

## Component Settings

### 1. Button Configuration

```javascript
// Button styles are primarily defined in CSS, with colors sourced from theme settings.
// Example (conceptual, actual implementation is in CSS and themeSettings):
// .button-primary {
//   background-color: var(--primary-color);
//   color: var(--text-on-dark-color);
// }
```

### 2. Toast Notifications

```javascript
// Toast notification configuration (conceptual, actual implementation may vary)
const toastConfig = {
  position: "top-right",
  duration: 3000,
  animation: true,
  styles: {
    success: { backgroundColor: "#28a745" },
    error: { backgroundColor: "#dc3545" },
    warning: { backgroundColor: "#ffc107" },
    info: { backgroundColor: "#17a2b8" },
  },
};
```

### 3. Language Settings

```javascript
// Language configuration (conceptual, actual implementation is likely via i18n library)
const languageConfig = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'ar'],
  rtlLanguages: ['ar'],
  fallbackLanguage: 'en',
  translations: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/add/{{lng}}/{{ns}}',
  },
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'navigator'],
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
  },
};
```

## Event Handling

### 1. UI Events

```javascript
class UIEventHandler {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }
}
```

### 2. State Management

```javascript
class UIStateManager {
  constructor(initialState) {
    this.state = initialState;
    this.subscribers = new Set();
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}
```

## Best Practices

### 1. Settings Management

- Use default fallbacks
- Validate configurations
- Cache settings appropriately
- Handle updates efficiently

### 2. Performance

- Lazy load components
- Optimize render cycles
- Minimize reflows
- Cache computed styles

### 3. Responsiveness

- Use flexible layouts
- Implement breakpoints
- Handle device variations
- Test across platforms

### 4. Accessibility

- Maintain ARIA attributes
- Support keyboard navigation
- Provide alternative text
- Ensure color contrast

### 5. Internationalization

- Support RTL/LTR layouts
- Use language-specific fonts
- Handle text expansion/contraction
- Implement locale-specific formatting

## Troubleshooting

### 1. Common Issues

- Settings not applying
- Component rendering issues
- Style conflicts
- Event handling problems
- Language switching issues

### 2. Resolution Steps

- Verify settings loaded
- Check component lifecycle
- Inspect style inheritance
- Debug event propagation
- Validate language resources

## Maintenance

### 1. Regular Tasks

- Update default settings
- Review component usage
- Optimize performance
- Update documentation
- Maintain language files

### 2. Monitoring

- Track UI performance
- Monitor error rates
- Collect usage metrics
- Analyze user feedback
- Track language preferences

## Related Documentation

- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Database Schema](0300_DATABASE_SCHEMA.md)
- [Company Management](0600_COMPANY_MANAGEMENT.md)
- [Path Management](0950_PATH_MANAGEMENT.md)
- [Client JS Architecture](0800_CLIENT_JS.md)
- [Internationalization](0800_INTERNATIONALIZATION.md)
