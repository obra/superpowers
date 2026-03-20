# 1600 DEMO FILE FOR SECTORS

This document describes how the project controls page (20095-project-controls) was set up for demo purposes.

## Routing

The project controls page is routed using the `DynamicSectorPageLoader` component in `client/src/App.js`.

*   A route is added to the `App.js` file to handle the project controls page:

```javascript
<Route
  path="project-controls"
  element={
    <MemoizedDynamicLoaderWithOrgId
      pageName="20095-project-controls"
      activeOrganizationId={activeOrganizationId}
    />
  }
/>
```

*   The `DynamicSectorPageLoader` component dynamically loads the page component based on the `pageName` prop.
*   The `pageComponents` object in `App.js` maps the `pageName` to the actual component file:

```javascript
"20095-project-controls": lazy(
  () =>
    import("./pages/20095-project-controls/components/20095-project-controls-page.js")
),
```

## Background Image

The background image for the project controls page is set in `client/src/pages/20095-project-controls/components/20095-project-controls-page.js` using the `getThemedImagePath` function:

```javascript
const backgroundImagePath = getThemedImagePath('20095.png');
```

The `backgroundImagePath` is then used as the `backgroundImage` style for the main `div` element. The image file `20095.png` should be placed in the `client/public/assets/default` directory.

## CSS

The styling for the project controls page is defined in `client/src/common/css/pages/20095-project-controls/20095-pages-style.css`. This file contains CSS rules specific to the project controls page, such as the navigation container and button styles.

## Component File

The main component file is `client/src/pages/20095-project-controls/components/20095-project-controls-page.js`. This file imports the necessary modules, defines the component's state and effects, and renders the page content.
