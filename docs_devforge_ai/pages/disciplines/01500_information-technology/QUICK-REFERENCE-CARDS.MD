# Quick Reference Cards

## 📖 Related Documentation

**For comprehensive details, refer to:**
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - **Complete accordion system documentation**
- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - **Complete page architecture patterns and standards**

---

## 🎯 Accordion Implementation - 30 Second Guide

```javascript
// 1. Import components
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";

// 2. Wrap in provider
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
)}

// 3. Structure source: server/src/routes/accordion-sections-routes.js
// 4. API endpoint: GET /api/accordion-sections?organization_name=...
```

**⚠️ CRITICAL:** Structure is template-based, NOT database-driven!

---

## 🎯 New Page Creation - 60 Second Guide

```bash
# 1. Create directory structure
mkdir client/src/pages/{prefix}/components/css/

# 2. Create main files
touch client/src/pages/{prefix}/{prefix}-index.js
touch client/src/pages/{prefix}/components/{prefix}-page.js
touch client/src/pages/{prefix}/css/{prefix}-style.css

# 3. Add route to App.js
<Route path="/{page-url}" element={<PageComponent />} />

# 4. Register in UI display mappings
```

**⚠️ CRITICAL:** File naming must match import paths exactly!

---

## 🎯 Navigation Positioning - Visual Guide

### Complex Pages (00435-style)
```css
/* ✅ CORRECT - Bottom navigation */
.state-navigation {
  position: fixed;
  left: 50%;
  bottom: 10px; /* BOTTOM! */
  transform: translateX(-50%);
}
```

### Simple Pages
```css
/* ✅ CORRECT - Top navigation */
.nav-tabs {
  position: sticky;
  top: 0; /* TOP is OK for simple pages */
}
```

**⚠️ DO NOT** use `position: sticky; top: 0;` for complex pages!

---

## 🎯 Import Path Cheat Sheet

```javascript
// ✅ CORRECT imports
import DevSettings from './02050-developer-settings-page'; // Match filename
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";

// ❌ WRONG imports
import DevSettings from './DevSettings'; // File doesn't exist!
import { AccordionComponent } from "accordion/component"; // Wrong path!
```

---

## 🎯 Settings Manager Pattern

```javascript
const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);

useEffect(() => {
  const initSettings = async () => {
    try {
      if (!settingsManager) {
        setIsSettingsInitialized(true);
        return;
      }
      await settingsManager.initialize();
      await settingsManager.applySettings();
      setIsSettingsInitialized(true);
    } catch (err) {
      console.error("Settings error:", err);
      setIsSettingsInitialized(true); // Always set to true
    }
  };
  initSettings();
}, []);

// Always check before rendering
{isSettingsInitialized && (
  // Your content here
)}
```

---

## 🎯 Common Issues Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| Accordion not showing | Import path correct? | Use exact path: `@modules/accordion/00200-accordion-component.js` |
| Wrong template | Organization mapping | Check `ORGANIZATION_TEMPLATES` in accordion-sections-routes.js |
| Import failure | File naming | Ensure import matches actual filename |
| Navigation broken | Page type | Complex = bottom, Simple = top |
| Settings not working | Initialization | Check `isSettingsInitialized` state |

---

## 🎯 Sub-Section Routing Pattern

```javascript
// Directory structure:
pages/{main}/components/SubSection/
├── index.jsx                 // Router
├── {main}-sub-page.js        // Main component  
├── NestedComponent.jsx       // Additional components
└── SubSection.css           // Styles

// Router (index.jsx):
<Routes>
  <Route path="/" element={<MainSubComponent />} />
  <Route path="/nested" element={<NestedComponent />} />
</Routes>

// App.js - Add direct route:
<Route path="/main/nested" element={<NestedComponent />} />
```

**⚠️ CRITICAL:** Register direct routes in App.js for deep linking!

---

## 🎯 Decision Trees

### Page Type Selection
```
Complex functionality with AI agents?
├── YES → Use 00435-style (bottom navigation)
└── NO → Use simple page (top/tab navigation)

Multiple states/modes?
├── YES → Three-state navigation
└── NO → Tab-based navigation

Background theming needed?
├── YES → Dynamic background system
└── NO → Static or no background
```

### Navigation Positioning
```
Page type?
├── Complex (00435-style) → position: fixed; bottom: 10px;
└── Simple → position: sticky; top: 0; OR tabs
```

---

## 🎯 Emergency Fixes

### Accordion Not Loading
1. Check API: `/api/accordion-sections?organization_name=...`
2. Verify import: `@modules/accordion/00200-accordion-component.js`
3. Fallback available: `client/public/templates/master-template.json`

### Import Errors
1. Check file exists with exact name
2. Verify path is relative to importing file
3. Use `.js` extension for modules, omit for local files

### Navigation Issues
1. Complex pages: Move navigation to bottom
2. Simple pages: Use tabs or top navigation
3. Check CSS positioning values

### Settings Manager
1. Always initialize in useEffect
2. Always set `isSettingsInitialized` to true in catch block
3. Check initialization before rendering content
