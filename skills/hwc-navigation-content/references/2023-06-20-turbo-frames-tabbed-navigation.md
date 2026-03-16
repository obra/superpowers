---
title: Turbo Frames - Tabbed Navigation
date: 2023-06-20
categories:
- Turbo Frames
tags:
- Navigation
- Tabs
- "turbo:frame-load"
- "data-turbo-action"
- Browser History
- Events
description: Drive tabbed navigation using Turbo Frames with active state management and browser history support.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Active Tab Styling with turbo:frame-load](#active-tab-styling-with-turboframe-load)
- [HTML Structure](#html-structure)
- [Browser History Support](#browser-history-support)
- [Implementation Notes](#implementation-notes)
- [Pattern Card: Tabbed Navigation](#pattern-card-tabbed-navigation)


## Overview
Turbo Frames are well-suited for tabbed navigation. Two common challenges are:
1. Updating the active tab styling without Turbo Streams
2. Adding browser history support for back/forward navigation

Since you cannot exchange two turbo frames from one response, you need to use JavaScript to update the active tab state.

## Active Tab Styling with turbo:frame-load

Use the `turbo:frame-load` event to update active tab styling. The event fires when frame content is loaded, and `event.target` is the Turbo Frame element. The frame's `src` attribute contains the URL being loaded, which can be compared to navigation link hrefs.

Note: Using `turbo:click` to adjust active tab styling doesn't work reliably because the frame load happens asynchronously. 

```js
document.addEventListener('turbo:frame-load', (event) => {
  document
    .querySelector('nav')
    .querySelectorAll('a')
    .forEach((navLink) => {
      // event.target is the loaded Turbo Frame
      if (navLink.href === event.target.src) {
        navLink.classList.remove(
          'border-transparent',
          'text-gray-500',
          'hover:border-gray-300',
          'hover:text-gray-700'
        );
        navLink.classList.add('border-indigo-500', 'text-indigo-600');
      } else {
        navLink.classList.remove('border-indigo-500', 'text-indigo-600');
        navLink.classList.add(
          'border-transparent',
          'text-gray-500',
          'hover:border-gray-300',
          'hover:text-gray-700'
        );
      }
    });
});
```

## HTML Structure

Navigation links use `data-turbo-frame="content"` to target the frame and `data-turbo-action="advance"` for browser history support:

```html
<nav aria-label="Tabs">
  <a
    href="/index.html"
    data-turbo-frame="content"
    data-turbo-action="advance"
    aria-current="page"
  >Map</a>
  <a
    href="/images.html"
    data-turbo-frame="content"
    data-turbo-action="advance"
  >Images</a>
  <a
    href="/facts.html"
    data-turbo-frame="content"
    data-turbo-action="advance"
  >Facts</a>
</nav>

<turbo-frame id="content">
  <!-- Tab content -->
</turbo-frame>
```

## Browser History Support

Add `data-turbo-action="advance"` to all tab navigation links. This promotes frame navigation to page visits in the browser history, creating entries with restoration identifiers. The frame still swaps content, but the URL and history are properly managed.

This is not the same as Turbo Drive navigation. If a `<turbo-frame>` element is missing, Turbo fires a `turbo:frame-missing` event rather than navigating the full page.

## Implementation Notes

- Do not use `turbo:click` to adjust active tab styling; it fires before the frame loads
- Do not implement `pushState` manually; it interferes with Turbo's restoration identifier system
- Use `data-turbo-action="advance"` for built-in history support
- Consider wrapping the solution in a Stimulus controller for portability


## Pattern Card: Tabbed Navigation

**When to use**: Switch between content sections without full page reloads, with browser history support.

**GOOD - Turbo Frame tabs with history and active state**:

```html
<nav aria-label="Tabs">
  <a href="/map" data-turbo-frame="content" data-turbo-action="advance">Map</a>
  <a href="/images" data-turbo-frame="content" data-turbo-action="advance">Images</a>
  <a href="/facts" data-turbo-frame="content" data-turbo-action="advance">Facts</a>
</nav>

<turbo-frame id="content">
  <!-- Tab content rendered here -->
</turbo-frame>
```

```javascript
// Update active tab styling on frame load
document.addEventListener('turbo:frame-load', (event) => {
  document.querySelectorAll('nav a').forEach((link) => {
    const isActive = link.href === event.target.src;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : null);
  });
});
```

**BAD - Using turbo:click for active state**:

```javascript
// Don't use turbo:click - it fires before the frame loads
document.addEventListener('turbo:click', (e) => {
  // Frame hasn't loaded yet! Active state may be wrong if load fails
  e.target.classList.add('active');
});
```
