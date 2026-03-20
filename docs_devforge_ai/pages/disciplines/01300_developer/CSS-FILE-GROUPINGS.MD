# CSS File Groupings Overview

This document explains the organization and purpose of CSS files in `/client/src/common/css`.

## Base Styles (`/base`)

The `/base` directory contains foundational styles that apply globally across the application. These include:

- **Base styles**: Variables, resets, typography, links, forms, focus styles
- **Utility classes**: Common layout and text utilities
- **Accessibility**: Screen reader-only classes
- **Print styles**: Print-specific overrides
- **Background container**: Setup for background images/colors

### Files:
- `0200-all-base.css`: Contains all base styles inline
- `00200-all-base.css`: Similar to `0200-all-base.css` but imports layout-related styles from other files

### Redundancy:
The files `0200-all-base.css` and `00200-all-base.css` appear to be redundant as they both serve the same purpose of providing base styles. The only difference is in how they organize the code:

- `0200-all-base.css` contains all styles inline
- `00200-all-base.css` imports layout-related styles from other files

Consider consolidating these files to avoid duplication and maintenance overhead.

## Utilities (`/utilities`)

Contains reusable utility classes for layout, spacing, and other common patterns.

## Pages (`/pages`)

Page-specific styles organized by feature/module.

## Recommendations:
1. Consolidate `0200-all-base.css` and `00200-all-base.css` into a single base styles file
2. Maintain clear separation between base, utility, and page-specific styles
3. Consider using CSS-in-JS or CSS modules for better component scoping
