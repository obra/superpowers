# Commercial Page (00200) Documentation (Migrated to Webpack/React)

## Overview

The Commercial page provides functionality related to commercial aspects of the project, such as tendering, cost control, and variations. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing. It utilizes the common `AccordionComponent` for navigation.

## Background Image

The Commercial page uses a background image defined via the `.page-background` CSS class. The image is located at:
`client/public/assets/default/00200.png`

This image is loaded with reduced opacity (15%) to provide a subtle visual context while maintaining readability of the content. See [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation) for the standard implementation pattern.

## File Structure (Post-Migration)

```
client/src/pages/00200-commercial/
└── components/                       # React components specific to this page
    └── 00200-commercial-page.js       # Main page React component

client/src/common/css/pages/00200-commercial/
└── 00200-pages-style.css              # Page-specific styles
```

## UI Layout

The Commercial page utilizes a consistent layout structure with fixed-position elements overlaying a background image. The layout is managed by React components and CSS.

## Features

### Tendering

- Manage tender documents (via modal)
- Track tender submissions (via modal)

### Cost Control

- Monitor project costs (via modal)
- Manage budgets (via modal)

### Variations

- Record and track project variations (via modal)

## State Management

State is primarily managed within the `CommercialPageComponent` (`client/src/pages/00200-commercial/components/00200-commercial-page.js`) using React hooks (`useState`, `useEffect`). This includes:

- `currentState`: Tracks the active view (e.g., 'agents', 'upsert', 'workspace').
- `isSettingsInitialized`: Tracks whether the `settingsManager` has loaded data for the accordion.
- State for managing modals.

## Modal System

The page utilizes a centralized React-based modal system for actions related to commercial activities.

## Development

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Related Documentation

- [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation)
- [Accordion Management](./0950_ACCORDION_MANAGEMENT.md)
- [UI Settings](./0700_UI_SETTINGS.md)

## Migration Notes

The Commercial page has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Implement detailed tendering workflow.
2. Integrate with financial systems for real-time cost tracking.
3. Develop variation approval process.
