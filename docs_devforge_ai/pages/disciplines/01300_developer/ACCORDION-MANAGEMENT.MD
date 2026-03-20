# Accordion Management

**IMPORTANT NOTE:** The core accordion component files (`client/src/modules/accordion/00200-accordion-component.js` and `client/src/modules/accordion/00200-accordion-manager.js`) are now fully functional and stable. Customizations should be achieved through the settings manager or by extending the component's functionality, rather than modifying the core source code. Please refer to the configuration sections below for guidance.

---

This document outlines the structure, configuration, and modification process for the accordion navigation menu. The accordion has been fully migrated to a React-based component system.

## Directory Structure

```
client/src/modules/accordion/
├── 00200-accordion-manager.js     # Core accordion functionality
├── 00200-accordion-component.js   # React component wrapper
├── context/                      # React context
│   └── 00200-accordion-context.js # Shared state management
├── hooks/                        # React hooks
│   ├── 00200-accordion-state.js  # State management hook
│   └── 00200-accordion-cache.js  # Caching logic hook
```

## Component Implementation

### React Component Structure

The accordion is implemented as a React component with proper state management:

```javascript
// 00200-accordion-component.js
import React, { useEffect } from 'react';
import { useAccordionState } from '@modules/accordion/hooks/00200-accordion-state.js';
import { useAccordionCache } from '@modules/accordion/hooks/00200-accordion-cache.js';

export const AccordionComponent = ({ settingsManager }) => {
  const {
    activeSection,
    isLoading,
    toggleSection,
    setComponentLoaded
  } = useAccordionState();

  // Component implementation...
};
```

### State Management

The accordion uses React context for state management:

```javascript
// 00200-accordion-context.js
import React, { createContext, useReducer } from 'react';

export const AccordionContext = createContext();

const initialState = {
  activeSection: null,
  isLoading: true,
  componentsLoaded: {
    background: false,
    i18n: false,
    settings: false,
    accordion: false
  }
};

// Context implementation...
```

### Link Management

The accordion handles links in both main sections and subsections. Links are processed by the `UIDisplaySettingsManager` to extract titles, capitalize them, and sort them alphabetically (with the primary link remaining at the top).

**Dynamic Page Integration**: In addition to static mappings, the accordion now dynamically fetches and integrates pages from the `public.pages` database table, filtering them based on the active sector and organization.

```javascript
// Example section with links (as defined in 00200-ui-display-mappings.js)
// Note: These static mappings are augmented by pages fetched from the database.
{
  id: 'accordion-button-00800',
  title: 'Design',
  links: ['00800-design.html', '00800-design-overview.html'], // Example raw links
  subsections: {
    'accordion-button-00825': {
      title: 'Architectural',
      links: ['00825-architectural.html', '00825-architectural-plans.html'] // Example raw links
    }
  }
}

// How links are processed by UIDisplaySettingsManager.processLinks():
// - Extracts page name from URL (e.g., "00800-design.html" -> "00800-design")
// - Formats title (e.g., "00800-design" -> "Design", "00165-ui-settings" -> "Pages")
// - Capitalizes the first letter of the title
// - Sorts links alphabetically by title, keeping the first link (primary) at the top.
// Resulting structure for a link:
// {
//   url: '00800-design.html',
//   title: 'Design',
//   type: 'document', // or 'chat'
//   visible: true
// }
```

Links are managed using CSS transitions based on the parent content area's state:

- Links are contained within a `.links-container` div inside the `.accordion-content` div of a section or subsection.
- The visibility of the `.links-container` (and thus the links) is controlled by CSS rules targeting the `[aria-hidden="false"]` attribute on the parent `.accordion-content` div (for both main sections and subsections).
- When a section or subsection button is clicked, JavaScript toggles the `aria-expanded` attribute on the button and the `aria-hidden` attribute on the corresponding `.accordion-content` div.
- CSS transitions on `max-height`, `opacity`, and `padding` for the `.accordion-content` element handle the smooth expansion/collapse.
- CSS rules make the `.links-container` visible (`opacity: 1`, `display: block`) when `[aria-hidden="false"]` is present on the parent `.accordion-content`.

### Visibility Management (CSS)

The visibility of accordion content and links is primarily controlled by CSS:

```css
/* Hides content when collapsed */
.accordion-content {
  max-height: 0;
  overflow: hidden; 
  opacity: 0;
  visibility: hidden;
  transition: max-height 0.4s ease, padding 0.3s ease, opacity 0.3s ease;
}

/* Shows main section content when expanded (using aria-hidden) */
.accordion-content[aria-hidden="false"] {
  max-height: 1000px; 
  padding: 10px 0;
  visibility: visible;
  opacity: 1;
}

/* Shows subsection content when expanded (using aria-hidden) */
.accordion-subsection .accordion-content[aria-hidden="false"] {
  padding: 5px 0 5px 15px; /* Keep specific padding */
  max-height: 1000px; /* Set max-height for expansion */
  opacity: 1;
  visibility: visible;
}

/* Shows links container only when subsection content is expanded (using aria-hidden) */
.accordion-subsection .accordion-content[aria-hidden="false"] .links-container {
  opacity: 1;
  visibility: visible;
  display: block; /* Ensure it takes up space */
}
```

## Integration with Settings Manager

The accordion integrates with the existing settings manager to handle section configuration:

```javascript
// Example usage in HomePage component
import settingsManager from "@common/js/ui/00100-ui-display-settings.js";

const HomePage = () => {
  return (
    <AccordionProvider>
      <AccordionComponent settingsManager={settingsManager} />
    </AccordionProvider>
  );
};
```

## Section Configuration

### ID System

The accordion uses a dual ID system for sections:

1. **Button IDs**: Used for DOM elements and event handling
   - Format: `accordion-button-XXXXX` (e.g., `accordion-button-00100`)
   - Used in HTML attributes and event listeners
   - Matches the section's URL structure

2. **Option IDs**: Used for settings storage and visibility state
   - Simple numeric IDs (e.g., `1`, `2`, `501`)
   - Used in settings manager and database
   - Mapped to button IDs through section mappings

### Section Definition

Sections are defined in the UI Display Settings (`client/src/common/js/config/00200-ui-display-mappings.js`):

```javascript
// Example section configuration from 00200-ui-display-mappings.js
export const sectionMappings = {
  'accordion-settings': {
    title: 'Settings',
    optionId: 165,
    order: 2900,
    links: [],
    subsections: {
      'accordion-ui-settings': {
        title: 'UI Settings',
        optionId: 166,
        order: 166,
        links: ['0165-settings/partials/00165-01-ui-settings.html']
      },
      'accordion-vector-store': {
        title: 'Vector Store',
        optionId: 167,
        order: 167,
        links: ['0165-settings/partials/00165-02-vector-store.html']
      },
      'accordion-modal-templates': {
        title: 'Modal Templates',
        optionId: 168,
        order: 168,
        links: ['0165-settings/partials/00165-03-modal-management.html']
      }
    },
    sector: "global", // Example: Global section
    allowedOrganizations: ["Simandou", "PropAI", "Template - EPCM", "Templates - All"]
  },
  'accordion-information-technology': {
    title: 'Information Technology',
    optionId: 1500,
    order: 1500,
    links: [
      '02050-information-technology.html',
      '0200-all-documents.html',
      '03010-email-management.html'
    ],
    subsections: {
      'accordion-development-tools': {
        title: 'Development Tools',
        optionId: 1501,
        order: 1501,
        links: [
          '02050-information-technology/sector-management/02050-sector-management.html'
        ]
      }
    },
    sector: "epcm", // Example: EPCM specific section
    allowedOrganizations: ["Template - EPCM", "Templates - All"]
  },
  // ... other sections
};
```

### DOM Structure

The DOM elements use data attributes to connect with settings:

```html
<!-- Main section -->
<div class="accordion-section" data-section-id="6">
  <button id="accordion-button-0800">Design</button>
  <!-- Subsection -->
  <div class="accordion-subsection" data-section-id="601">
    <button id="accordion-button-0825">Architectural</button>
  </div>
</div>
```

## Accordion Display Logic based on Sector and Organization

The visibility of accordion sections and their links is dynamically controlled by the currently active sector and organization. This ensures that users only see content relevant to their selected context.

**Key Update**: In addition to the static `sectionMappings`, the accordion now dynamically fetches pages from the `public.pages` database table. These database-managed pages are also filtered by the active sector and organization, ensuring comprehensive and up-to-date navigation.

| Active Sector | Active Organization | Accordion Sections Displayed | Notes |
|---|---|---|---|
| `Templates - All` | Any | All sections (Global, EPCM, Judicial, etc.) | Provides an administrative view, overriding specific sector/organization restrictions. Includes all static mappings and all pages from the `public.pages` table. |
| `Templates - All` | `Templates - All` | All sections (Global, EPCM, Judicial, etc.) | Same as above, specifically for the "All" organization. |
| `Global` | `Simandou` | Global sections + sections with `allowedOrganizations` including `Simandou` | Displays shared content and content specifically permitted for Simandou. Includes static mappings and database pages matching these criteria. |
| `EPCM` | `Template - EPCM` | Global sections + sections with `sector: "epcm"` and `allowedOrganizations` including `Template - EPCM` | Displays shared content and content specific to the EPCM sector and organization. Includes static mappings and database pages matching these criteria. |
| `Judicial` | `PropAI` | Global sections + sections with `sector: "judicial"` and `allowedOrganizations` including `PropAI` | Displays shared content and content specific to the Judicial sector and PropAI organization. Includes static mappings and database pages matching these criteria. |
| Any Specific Sector (e.g., `Contractor`) | Any Specific Organization (e.g., `MyContractorOrg`) | Global sections + sections with `sector` matching the active sector AND `allowedOrganizations` including the active organization. | This is the general rule for specific sector/organization combinations. Includes static mappings and database pages matching these criteria. |

## Event Handling

The accordion implements comprehensive event handling with ID mapping:

```javascript
// Button click handling
handleButtonClick(button) {
  const isExpanded = button.getAttribute("aria-expanded") === "true";
  const contentId = button.getAttribute("aria-controls");
  const content = this.accordionContainer.querySelector(`#${contentId}`);

  // Get section mapping for visibility state
  const buttonId = button.id;
  const mapping = this.sectionMappings[buttonId];
  const optionId = mapping?.optionId;

  // Toggle ARIA attributes for accessibility
  button.setAttribute("aria-expanded", newExpandedState);
  content.setAttribute("aria-hidden", !newExpandedState);

  // Update icon text
  const icon = button.querySelector(".icon");
  if (icon) {
    icon.textContent = newExpandedState ? "-" : "+";
  }
}
```

## Accessibility Features

The accordion implements full accessibility support:

- ARIA attributes for menu state
- Keyboard navigation
- Focus management
- Screen reader support

```javascript
// Example accessibility implementation
<button 
  id="toggle-accordion" 
  className={`control-button ${activeSection ? 'active' : ''}`}
  aria-expanded={activeSection === 'menu'}
  aria-controls="accordion-root"
>
  {/* Button content */}
</button>
```

## CSS Implementation

The accordion uses modular CSS with proper transitions and animations:

```css
.menu-container {
  position: fixed;
  top: 0;
  right: -300px;
  width: 300px;
  height: 100vh;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-container.visible {
  transform: translateX(-300px);
}
```

## Best Practices

1. **Component Initialization**
   - Initialize settings manager first
   - Load sections configuration
   - Set up event listeners
   - Handle cleanup on unmount

2. **State Management**
   - Use React Context for global state
   - Implement proper state transitions
   - Handle loading states
   - Manage component lifecycle

3. **Performance**
   - Implement caching for section data
   - Use memoization for callbacks
   - Optimize re-renders
   - Handle cleanup properly

4. **Accessibility**
   - Implement ARIA attributes
   - Support keyboard navigation
   - Manage focus states
   - Provide screen reader support

## Navigation State Management (December 2025)

### Page Navigation State Reset Issue

A critical issue was resolved where accordion navigation between pages was not properly updating page titles and resetting state buttons. The accordion menu would function correctly, but when navigating between pages (Finance, Ethics, etc.), the page components would retain their previous state.

**Root Cause**: React Router was reusing component instances when navigating between similar sector pages through the `DynamicSectorPageLoader`, preventing essential `useEffect` hooks from running.

**Solution**: Enhanced the dynamic component loading system in `client/src/App.js`:

```jsx
// Force component remounting when pageName changes
return (
  <Suspense fallback={<div>Loading page...</div>}>
    <LazyComponent 
      key={pageName} // Critical: Forces React to unmount/remount components
      activeOrganizationId={activeOrganizationId} 
    />
  </Suspense>
);
```

### Page Component Integration

Page components that use the accordion must implement proper state reset:

```jsx
// Example: Finance page component
useEffect(() => {
  console.log("[FinancePageComponent] Component mounting - setting title and resetting state");
  document.title = "Finance Page";
  
  // Reset state when component mounts (ensures clean state on navigation)
  setCurrentState(null);
  setIsButtonContainerVisible(false);
  
  // Cleanup function to reset title when component unmounts
  return () => {
    console.log("[FinancePageComponent] Component unmounting");
  };
}, []); // Empty dependency array ensures this runs only on mount/unmount
```

### Accordion Integration Best Practices

1. **Component Lifecycle Management**
   - Always reset page-specific state in component mount effects
   - Use cleanup functions to prevent state leakage between pages
   - Ensure accordion state is independent of page component state

2. **State Button Management**
   - Initialize `currentState` to `null` to ensure no buttons are active on page load
   - Reset button visibility state when navigating between pages
   - Use consistent state management patterns across all pages

3. **Title Management**
   - Set document title in component mount effects
   - Use cleanup functions to reset titles when components unmount
   - Ensure titles are unique and descriptive for each page

## Common Issues and Solutions

All previously identified issues related to the accordion and navigation have been successfully resolved. The accordion is now fully functional and stable. For a detailed audit of the resolution process, please refer to [0950_ACCORDION_MANAGEMENT_AUDIT.md](./0950_ACCORDION_MANAGEMENT_AUDIT.md).

### Navigation State Reset (Resolved)

**Issue**: Page titles and state buttons not updating when navigating via accordion.
**Solution**: Added `key={pageName}` prop to force component remounting and implemented proper state reset in page components.
**Status**: ✅ Resolved (December 2025)

### Dynamic Page Loading and Filtering (Resolved)

**Issue**: Accordion did not dynamically update to show newly added pages or filter pages based on the active organization.
**Solution**:
- Introduced a `public.pages` database table to store page metadata (prefix, name, slug, sector_id, organization_id).
- Modified `UIDisplaySettingsManager` to fetch pages from this database table (`/api/pages` endpoint).
- Enhanced `UIDisplaySettingsManager.getAccordionSections()` to dynamically include and filter these database-managed pages based on the active sector and organization.
- Ensured `organizationConfig.activeOrganization` is consistently an array for reliable filtering.
- Updated `SectorManagementPage` to re-initialize sector and organization configs and re-apply UI settings after adding pages, forcing the accordion to re-render with the latest data.
**Status**: ✅ Resolved (June 2025)

### Page Title and State Button Placement (Resolved)

**Issue**: The layout of the page title and state buttons on the `00200-commercial` page was inconsistent with the `00102-administration` page. The user reports the page displayed correctly once but then reverted to an incorrect display.
**Status**: ✅ Resolved (June 2025)

### Background Image Not Appearing (Resolved)

**Issue**: Background images were not appearing on certain pages (e.g., Commercial).
**Solution**: Added crucial positioning and sizing CSS properties (`z-index`, `position`, `top`, `left`, `width`, `height`) to the `.page-background` class in `client/src/common/css/pages/00200-commercial/00200-pages-style.css` and removed a conflicting `z-index` from the `.commercial-page` class.
**Status**: ✅ Resolved (June 2025)

### Accordion Navigation Loop Issue (Resolved)

**Issue**: Navigating from page 00100 (Home) to 00102 (Administration) and attempting to navigate back to 00100 would cause the system to get into an infinite loop.
**Root Cause**: Multiple `AccordionProvider` instances were being created at the page level, leading to conflicting state management when navigating between pages.
**Solution**:
- Moved the `AccordionProvider` from individual page components to the Layout component level
- Removed duplicate `AccordionProvider` wrappers from `HomePage` and `AdministrationPage` components
- Ensured a single, shared accordion context across all pages
- Cleaned up unused `AccordionProvider` imports from page components
**Status**: ✅ Resolved (June 2025)

### Navigation Loop (Supabase Redirects) (Resolved Temporarily)

**Issue**: A navigation loop was occurring due to aggressive `window.location.replace` calls within `client/src/common/js/auth/00175-supabase-client.js`.
**Solution**: Temporarily commented out these redirect calls to allow normal React Router navigation. Further investigation is needed if these redirects are required for production.
**Status**: ✅ Resolved (Temporarily) (June 2025)

## Webpack Integration

The accordion is now fully integrated with webpack:

1. **Module Resolution**

```javascript
// webpack.config.js
resolve: {
  alias: {
    '@modules': path.resolve(__dirname, '../src/modules'),
    '@common': path.resolve(__dirname, '../src/common')
  }
}
```

2. **CSS Loading**

```javascript
// webpack.config.js
module: {
  rules: [
    {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: {
              auto: true,
              localIdentName: '[name]__[local]--[hash:base64:5]'
            }
          }
        }
      ]
    }
  ]
}
```

3. **Development Server**

```javascript
// webpack.config.js
devServer: {
  static: [
    {
      directory: path.resolve(__dirname, '../src/modules'),
      publicPath: '/modules'
    }
  ],
  hot: false,
  liveReload: true
}
```

## Migration Notes

The accordion has been fully migrated from a vanilla JavaScript implementation to a React-based system.

## Testing

1. **Component Testing**
   - Verify initialization
   - Test state transitions
   - Check accessibility features
   - Validate performance

2. **Integration Testing**
   - Test with settings manager
   - Verify section loading
   - Check state persistence
   - Validate cleanup

3. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard navigation
   - ARIA attributes
   - Focus management

## Future Improvements

1. Enhance performance monitoring
2. Add analytics integration
3. Improve error handling
4. Enhance mobile support
5. Add link analytics tracking
6. Improve link loading states

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

<environment_details>
# VSCode Visible Files
docs/0950_ACCORDION_MANAGEMENT.md

# VSCode Open Tabs
docs/0250_UTILITIES_ARCHITECTURE.md
docs/0400_SECURITY_MODEL.md
docs/0600_COMPANY_MANAGEMENT.md
docs/0800_INTERNATIONALIZATION.md
docs/0950_ACCORDION_MANAGEMENT_AUDIT.md
docs/9999_MIGRATION_TRACKER.md
docs/9999_MIGRATION_PLAN.md
docs/1000_CORE_COMPONENTS.md
docs/0100_GETTING_STARTED.md
docs/0950_ACCORDION_MANAGEMENT.md
docs/1300_0000_PAGE_IMPLEMENTATIONS.md
docs/1300_00100_HOME_PAGE.md
docs/1300_00100_LOGIN_PAGE.md
docs/1300_00102_ADMINISTRATION_PAGE.md
docs/1300_00150_USER_SIGNUP_PAGE.md
docs/1300_00165_DEBUG_PANEL_PAGE.md
docs/1300_00165_SETTINGS_PAGE.md
docs/1300_00165_UI_SETTINGS_PAGE.md
docs/1300_00170_MODAL_MANAGEMENT_PAGE.md
docs/1300_00175_AUTH_CALLBACK_PAGE.md
docs/1300_00200_COMMERCIAL_PAGE.md
docs/1300_00300_CONSTRUCTION_PAGE.md
docs/1300_00425_CONTRACTS_PRE_AWARD_PAGE.md
docs/archive/1300_00435_CONTRACTS_POST_AWARD_PAGE.md
docs/1300_00835_CHEMICAL_ENGINEERING_PAGE.md
docs/1300_00850_CIVIL_ENGINEERING_PAGE.md
docs/1300_00860_ELECTRICAL_ENGINEERING_PAGE.md
docs/1300_00870_MECHANICAL_ENGINEERING_PAGE.md
docs/1300_00872_DEVELOPER_PAGE.md
docs/1300_00875_SALES_PAGE.md
docs/1300_00877_SUNDRY_PAGE.md
docs/1300_00880_BOARD_OF_DIRECTORS_PAGE.md
docs/1300_00882_DIRECTOR_CONSTRUCTION_PAGE.md
docs/1300_00883_DIRECTOR_CONTRACTS_PAGE.md
docs/1300_00884_DIRECTOR_ENGINEERING_PAGE.md
docs/1300_00884-1_DIRECTOR_FINANCE_PAGE.md
docs/1300_00885_DIRECTOR_HSE_PAGE.md
docs/1300_00886_DIRECTOR_LOGISTICS_PAGE.md
docs/1300_00888_DIRECTOR_PROCUREMENT_PAGE.md
docs/1300_00890_DIRECTOR_PROJECTS_PAGE.md
docs/1300_00900_DOCUMENT_CONTROL_PAGE.md
docs/1300_01000_ENVIRONMENTAL_PAGE.md
docs/1300_01300_GOVERNANCE_PAGE.md
docs/1300_01400_HEALTH_PAGE.md
docs/1300_01500_HUMAN_RESOURCES_PAGE.md
docs/1300_01600_LOCAL_CONTENT_PAGE.md
docs/1300_01700_LOGISTICS_PAGE.md
docs/1300_01800_OPERATIONS_PAGE.md
docs/1300_01850_OTHER_PARTIES_PAGE.md
docs/1300_01900_PROCUREMENT_PAGE.md
docs/1300_02025_QUANTITY_SURVEYING_PAGE.md
docs/1300_02035_SCHEDULING_PAGE.md
docs/1300_02050_INFORMATION_TECHNOLOGY_PAGE.md
docs/1300_02075_INSPECTION_PAGE.md
docs/1300_02100_PUBLIC_RELATIONS_PAGE.md
docs/1300_02200_LOGISTICS_PAGE.md
docs/1300_02250_QUALITY_CONTROL_PAGE.md
docs/1300_02400_SAFETY_PAGE.md
docs/1300_02500_SECURITY_PAGE.md
docs/1300_3000_LANDSCAPING_PAGE.md
docs/1300_03010_EMAIL_MANAGEMENT.md
docs/1400_CSS_ARCHITECTURE.md
docs/0950_PATH_MANAGEMENT.md
docs/0200_SYSTEM_ARCHITECTURE.md
docs/1510_WEBPACK_CONFIGURATION_FILE.md
docs/1500_WEBPACK_ARCHITECTURE.md
docs/0000_DOCUMENTATION_GUIDE.md
client/public/pages/00100-home/0100-home.html
client/config/webpack.config.js
client/public/index.html
client/src/common/css/pages/00100-home/00100-pages-style.css
client/src/pages/00100-home/components/00100-HomePage.js
client/src/pages/00102-administration/components/00102-administration-page.js
client/src/common/css/pages/00102-administration/00102-pages-style.css
package.json
client/src/pages/00900-document-control/components/00900-document-control-page.js
client/src/common/css/pages/00900-document-control/00900-pages-style.css
client/src/pages/01700-logistics/components/01700-logistics-page.js
client/src/common/css/pages/01700-logistics/01700-pages-style.css
client/src/pages/00877-sundry/components/00877-sundry-page.js
client/src/common/css/pages/00877-sundry/00877-pages-style.css
client/src/pages/00300-construction/components/00300-construction-page.js
client/src/common/css/pages/00300-construction/00300-pages-style.css
client/src/pages/00880-board-of-directors/components/00880-board-of-directors-page.js
client/src/common/css/pages/00880-board-of-directors/00880-pages-style.css
client/src/pages/00875-sales/components/00875-sales-page.js
client/src/common/css/pages/00875-sales/00875-pages-style.css
client/src/pages/02250-quality-control/components/02250-quality-control-page.js
client/src/common/css/pages/02250-quality-control/02250-pages-style.css
client/src/pages/02400-safety/components/02400-safety-page.js
client/src/common/css/pages/02400-safety/02400-pages-style.css
client/src/pages/02035-scheduling/components/02035-scheduling-page.js
client/src/common/css/pages/02035-scheduling/02035-pages-style.css
client/src/pages/00890-director-projects/components/00890-director-projects-page.js
client/src/common/css/pages/00890-director-projects/00890-pages-style.css
client/src/pages/00884-1-director-finance/components/00884-1-director-finance-page.js
client/src/common/css/pages/00884-1-director-finance/00884-1-pages-style.css
client/src/pages/00850-civil-engineering/components/00850-civil-engineering-page.js
client/src/common/css/pages/00850-civil-engineering/00850-pages-style.css
client/src/pages/00884-director-engineering/components/00884-director-engineering-page.js
client/src/common/css/pages/00884-director-engineering/00884-pages-style.css
client/src/pages/00835-chemical-engineering/components/00835-chemical-engineering-page.js
client/src/common/css/pages/00835-chemical-engineering/00835-pages-style.css
client/src/pages/00425-contracts-pre-award/components/00425-contracts-pre-award-page.js
client/src/common/css/pages/00425-contracts-pre-award/00425-pages-style.css
client/src/pages/01400-health/components/01400-health-page.js
client/src/common/css/pages/01400-health/01400-pages-style.css
client/src/pages/00886-director-logistics/components/00886-director-logistics-page.js
client/src/common/css/pages/00886-director-logistics/00886-pages-style.css
client/src/pages/01900-procurement/components/01900-procurement-page.js
client/src/common/css/pages/01900-procurement/01900-pages-style.css
client/src/pages/02075-inspection/components/02075-inspection-page.js
client/src/common/css/pages/02075-inspection/02075-pages-style.css
client/src/pages/01100-ethics/components/01100-ethics-page.js
client/src/common/css/pages/01100-ethics/01100-pages-style.css
client/src/pages/00200-commercial/components/00200-commercial-page.js
client/src/common/css/pages/00200-commercial/00200-pages-style.css
client/src/pages/01200-finance/components/01200-finance-page.js
client/src/common/css/pages/01200-finance/01200-pages-style.css
client/src/pages/01300-governance/components/01300-governance-page.js
client/src/common/css/pages/01300-governance/01300-pages-style.css
client/src/pages/01500-human-resources/components/01500-human-resources-page.js
client/src/common/css/pages/01500-human-resources/01500-pages-style.css
client/src/pages/01850-other-parties/components/01850-other-parties-page.js
client/src/common/css/pages/01850-other-parties/01850-pages-style.css

# Current Time
10/06/2025, 8:40:20 pm (Africa/Johannesburg, UTC+2:00)

# Context Window Usage
820,893 / 1,048.576K tokens used (78%)

# Current Mode
ACT MODE
</environment_details>
