# 1300_00435 Color System Specifications

## Palette Evolution
| Category       | Previous (v1.2)      | Current (v2.1)       | Delta         |
|----------------|----------------------|----------------------|---------------|
| Primary Accent | `#2C3E50` (RGB 44,62,80) | `#3B82F6` (RGB 59,130,246) | +24% saturation |
| Success State  | `#27AE60`            | `#22C55E`            | 10% brighter  |
| Error State    | `#E74C3C`            | `#EF4444`            | 15% more visible |
| Warning        | `#F1C40F`            | `#EAB308`            | Better contrast |

## CSS Custom Property Hierarchy
```css
:root {
  --brand-blue-50: #eff6ff;  /* Base */
  --brand-blue-600: #2563eb; /* Primary accent */
  --primary-accent: var(--brand-blue-600);
  --interactive-hover: color-mix(in srgb, var(--primary-accent) 90%, white);
  --interactive-active: color-mix(in srgb, var(--primary-accent) 80%, black);
}
```

## WCAG Compliance
| Combination                  | Contrast Ratio | Compliance |
|------------------------------|----------------|------------|
| Primary Text on White        | 4.5:1          | AA         |
| Button Text on Primary       | 7.2:1          | AAA        |
| Error Text on Light Gray     | 5.1:1          | AA         |
| Disabled Text on Background  | 3.9:1          | Fail       |

## Theme Toggle Implementation
```typescript
// client/src/common/js/utils/themeManager.ts
const toggleTheme = (prefersDark: boolean) => {
  document.documentElement.style.setProperty(
    '--primary-accent',
    prefersDark ? '#1D4ED8' : '#3B82F6'
  );
  document.documentElement.classList.toggle('dark', prefersDark);
};

// Preference cascade: System > User Setting > Default
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', (e) => toggleTheme(e.matches));
```

## Implementation Checklist
| Requirement              | Status | Owner       | PR Link          |
|--------------------------|--------|-------------|------------------|
| Accessibility Audit      | ✅     | QA Team     | [#435-col1](...)|
| Dark Mode Support        | 🟡     | Frontend    | [#435-col3](...)|
| Variable Migration       | ❌     | Unassigned  |                  |