# 0750 Image Theme Settings

This document describes the implementation of the dynamic image theming feature. This allows the application to use different sets of images for page backgrounds and potentially other UI elements based on the sector associated with the current page.

## Overview

The system uses the 5-digit prefix of a page name to identify the sector. This sector ID is then used to dynamically load images from a corresponding theme folder within `client/public/assets/`. This ensures that pages within the same sector share a consistent visual theme.

## Components Involved

1. **Settings UI (`client/src/pages/00165-ui-settings/components/00165-ThemeSettings.js`)**:
    - Located under the "Information Technology" -> "Dev settings" accordion menu item.
    - This component is primarily for *developer* use to view available themes. The primary method for image theming is now sector-based, not user selection via this UI.
    - Fetches the list of available theme folders from the backend API.
    - Displays the themes. (Saving to `localStorage` is no longer the primary mechanism for theming).

2. **API Endpoint (`server/src/routes/image-theme-settings.js`)**:
    - Provides the `GET /api/list-image-theme-folders` endpoint.
    - Reads the directory contents of `client/public/assets/`.
    - Filters out non-directory entries and specific excluded folders (`chatbot`, `icons`, `user`).
    - Returns a JSON array of valid theme folder names (e.g., `["civils", "commercial", "default", "industrial", ...]`).

3. **Theme Helper (`client/src/common/js/ui/0210-image-theme-helper.js`)**:
    - `getCurrentImageTheme()`: (Still exists but less relevant for primary theming). Retrieves the currently selected theme name from `localStorage`, defaulting to `'default'`.
    - `getThemedImagePath(imageName, sectorId)`: Constructs the full, dynamic path to an image based on the provided `sectorId` and the requested image filename (e.g., `/assets/00835/1234.png`). It falls back to the 'default' theme if a sector-specific theme is not found.

4. **Image Usage (e.g., `client/src/pages/.../xxxx-background.js`)**:
    - Components that display background images now receive the `pageName` as a prop.
    - They extract the 5-digit `sectorId` from the `pageName`.
    - They import `getThemedImagePath` from the helper module.
    - They call `getThemedImagePath('xxxx.png', sectorId)` to get the correct image URL at runtime, which is then used in `<img>` tags or CSS `background-image` styles.

## How it Works

1. A page component receives the `pageName` as a prop (e.g., '00835-chemical-engineering').
2. The component extracts the 5-digit `sectorId` from the `pageName` (e.g., '00835').
3. The component calls `getThemedImagePath('image.png', sectorId)`, passing the desired image filename and the extracted `sectorId`.
4. `getThemedImagePath` constructs the image path using the `sectorId` (e.g., `/assets/00835/image.png`).
5. If a theme folder matching the `sectorId` exists in `client/public/assets/`, the image is loaded from that folder.
6. If a sector-specific theme folder does not exist, `getThemedImagePath` falls back to loading the image from the `client/public/assets/default/` folder.
7. The browser requests and displays the image from the constructed path.

**Note:** The Settings UI component under "Information Technology" -> "Dev settings" still exists but is primarily for viewing available themes, not for selecting the primary theme used by pages.
