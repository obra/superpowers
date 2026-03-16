---
title: Turbo Frames - Pagination
date: 2023-07-04
categories:
- Turbo Frames
tags:
- Navigation
- Pagination
- "turbo:frame-load"
- "turbo:before-fetch-request"
- Browser History
- Query Parameters
- Turbo.navigator
description: Use the Turbo Frame lifecycle to manage fetch requests and the browser history.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
- [Solution](#solution)
- [Code Examples](#code-examples)
  - [JavaScript Implementation](#javascript-implementation)
  - [HTML Structure](#html-structure)
  - [Page Content with Pagination](#page-content-with-pagination)
- [Key Points](#key-points)
- [Pattern Card: Pagination with Browser History](#pattern-card-pagination-with-browser-history)


## Overview

Pagination with Turbo Frames is a special case of tabbed navigation. Turbo Frames provide a performant way to switch between "windows" of a dataset. The pagination itself is kept inside the frame, allowing server-side rendering of the active page state.

## Implementation

Pagination uses the query parameter `page` and integrates with browser history (back and forward buttons work). Two challenges must be addressed:

1. Client-side routing: A click on a pagination link sets the frame's `src` to `/?page=B`, which serves `index.html`. In the `turbo:before-fetch-request` event, modify the URL to load the actual `pageA|B|C.html` locations.

2. Browser history: With `data-turbo-action="advance"`, `pageA|B|C.html` entries are added to history. This is problematic because reloading serves only the bare Turbo Frame without layout. On `turbo:frame-load`, replace the history entry with the correct `?page=A|B|C` query string.

## Solution

The solution requires three parts:

1. On page load, read the `page` query parameter and set the Turbo Frame's `src` accordingly.
2. In `turbo:before-fetch-request`, intercept the request and rewrite the URL pathname to the correct page file.
3. In `turbo:frame-load`, replace the browser history entry using `Turbo.navigator.history.replace()` to maintain the query parameter format.


## Code Examples

### JavaScript Implementation

```js
document.addEventListener('DOMContentLoaded', (event) => {
  const letter = new URL(location.href).searchParams.get('page');
  if (letter) {
    document.querySelector('turbo-frame').src = `page${letter}.html`;
  }
});

document.addEventListener('turbo:before-fetch-request', (event) => {
  event.preventDefault();
  const letter = new URL(event.detail.url).searchParams.get('page');
  if (letter) {
    event.detail.url.pathname = `/page${letter}.html`;
    event.detail.url.search = '';
  }
  event.detail.resume();
});

document.addEventListener('turbo:frame-load', (event) => {
  const url = new URL(event.target.src);
  const matches = url.pathname.match(/page([A-Z])/);

  url.pathname = '';
  url.search = `page=${matches[1]}`;

  Turbo.navigator.history.replace(
    url,
    Turbo.navigator.history.restorationIdentifier
  );
});
```

### HTML Structure

```html
<body>
  <turbo-frame id="paginated-content" src="/pageA.html">
    Loading ...
  </turbo-frame>
</body>
```

### Page Content with Pagination

```html
<turbo-frame id="paginated-content">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Title</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <!-- Table rows here -->
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">
          <nav>
            <a href="/?page=A" data-turbo-action="advance" aria-current="page">A</a>
            <a href="/?page=B" data-turbo-action="advance">B</a>
            <a href="/?page=C" data-turbo-action="advance">C</a>
          </nav>
        </td>
      </tr>
    </tfoot>
  </table>
</turbo-frame>
```

## Key Points

1. **URL Rewriting**: The `turbo:before-fetch-request` event intercepts pagination link clicks and rewrites the URL from `/?page=B` to `/pageB.html` to load the correct Turbo Frame content.

2. **History Management**: Using `data-turbo-action="advance"` promotes frame navigation to a full page visit, creating a browser history entry. However, this entry contains the bare Turbo Frame URL (`pageA|B|C.html`), which is problematic for page reloads.

3. **History Replacement**: The `turbo:frame-load` event handler uses `Turbo.navigator.history.replace()` to replace the history entry with the query parameter format (`?page=A|B|C`), ensuring the page is reloadable and maintains the correct URL structure.

4. **API Note**: `Turbo.navigator.history` is exposed on the global `Turbo` object but is not part of the official public API. Use with caution in production.


## Pattern Card: Pagination with Browser History

**When to use**: Navigate through pages of data with working back/forward buttons.

**GOOD - Frame pagination with URL rewriting**:

```html
<turbo-frame id="paginated-content">
  <table>
    <!-- Data rows -->
  </table>
  <nav>
    <a href="/?page=1" data-turbo-action="advance">1</a>
    <a href="/?page=2" data-turbo-action="advance">2</a>
    <a href="/?page=3" data-turbo-action="advance">3</a>
  </nav>
</turbo-frame>
```

```javascript
// On page load, set frame src from query param
document.addEventListener('DOMContentLoaded', () => {
  const page = new URL(location.href).searchParams.get('page');
  if (page) {
    document.querySelector('turbo-frame').src = `/pages/${page}`;
  }
});

// Rewrite URL before fetch
document.addEventListener('turbo:before-fetch-request', (event) => {
  const page = new URL(event.detail.url).searchParams.get('page');
  if (page) {
    event.preventDefault();
    event.detail.url.pathname = `/pages/${page}`;
    event.detail.url.search = '';
    event.detail.resume();
  }
});

// Replace history entry with clean URL
document.addEventListener('turbo:frame-load', (event) => {
  const match = event.target.src.match(/pages\/(\d+)/);
  if (match) {
    const url = new URL(location.href);
    url.search = `page=${match[1]}`;
    Turbo.navigator.history.replace(url);
  }
});
```

**BAD - Manual pushState (breaks Turbo's restoration)**:

```javascript
// Don't implement pushState manually
paginationLink.addEventListener('click', () => {
  history.pushState({}, '', `/?page=${page}`); // Breaks Turbo!
});
```
