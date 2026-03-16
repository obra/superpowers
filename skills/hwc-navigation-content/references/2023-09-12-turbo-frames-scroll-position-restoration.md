---
title: Turbo Frames - Scroll Position Restoration
date: 2023-09-12
categories:
- Turbo Frames
tags:
- Navigation
- Scroll Position
- sessionStorage
- Stimulus
- "turbo:before-cache"
- "turbo:before-render"
- "turbo:render"
- History Navigation
description: Preserve and restore scroll position from sessionStorage.
free: true
ready: true
---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Stimulus Controller Implementation](#stimulus-controller-implementation)
- [Pattern Card: Scroll Position Restoration](#pattern-card-scroll-position-restoration)

## Problem

When navigating with Turbo Frames and using browser back/forward navigation, the scroll position resets to the top of the page instead of restoring the previous scroll position. This occurs because Turbo Drive's scroll position restoration doesn't always work correctly with Turbo Frame navigation.

## Solution

Use `turbo:before-cache` to preserve scroll position and `turbo:before-render` or `turbo:render` to restore it. Store the scroll position in `sessionStorage` using the current URL as the key.

Use `sessionStorage` instead of `localStorage` because it resets when the browser tab is closed, which is more suitable for scroll position restoration.

The `preserveScroll` function stores `document.documentElement.scrollTop` in sessionStorage using `location.href` as the key (which includes the complete URL with query string).

The `restoreScroll` function retrieves the stored scroll position and applies it to `document.documentElement.scrollTop`.

```js
document.addEventListener('turbo:before-fetch-request', (event) => {
  event.preventDefault();
  const number = new URL(event.detail.url).searchParams.get('page');
  if (number) {
    event.detail.url.pathname = `/page${number}.html`;
    event.detail.url.search = '';
  }
  event.detail.resume();
});

document.addEventListener('turbo:before-frame-render', (event) => {
  console.log();
});

document.addEventListener('turbo:frame-render', (event) => {});

document.addEventListener('turbo:frame-load', (event) => {
  const url = new URL(event.target.src);
  const matches = url.pathname.match(/page([0-9])/);

  url.pathname = '';
  url.search = `page=${matches[1]}`;

  Turbo.navigator.history.replace(
    url,
    Turbo.navigator.history.restorationIdentifier
  );
});

document.addEventListener('turbo:before-cache', preserveScroll);
document.addEventListener('turbo:before-render', restoreScroll);
document.addEventListener('turbo:render', restoreScroll);

function preserveScroll() {
  sessionStorage.setItem(
    `scroll-position-${location.href}`,
    document.documentElement.scrollTop
  );
}

function restoreScroll(event) {
  document.documentElement.scrollTop = sessionStorage.getItem(
    `scroll-position-${location.href}`
  );
}
```

## Stimulus Controller Implementation

A Stimulus controller can encapsulate this functionality for better organization and reusability. The controller connects to the document element and sets up Turbo event listeners in the `connect` method, then cleans them up in `disconnect`:

```js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.boundPreserveScroll = this.preserveScroll.bind(this)
    this.boundRestoreScroll = this.restoreScroll.bind(this)
    
    document.addEventListener('turbo:before-cache', this.boundPreserveScroll)
    document.addEventListener('turbo:before-render', this.boundRestoreScroll)
    document.addEventListener('turbo:render', this.boundRestoreScroll)
  }

  disconnect() {
    document.removeEventListener('turbo:before-cache', this.boundPreserveScroll)
    document.removeEventListener('turbo:before-render', this.boundRestoreScroll)
    document.removeEventListener('turbo:render', this.boundRestoreScroll)
  }

  preserveScroll() {
    sessionStorage.setItem(
      `scroll-position-${location.href}`,
      document.documentElement.scrollTop
    )
  }

  restoreScroll() {
    document.documentElement.scrollTop = sessionStorage.getItem(
      `scroll-position-${location.href}`
    )
  }
}
```

Attach the controller to the document element in your HTML: `<html data-controller="scroll-restoration">`.


## Pattern Card: Scroll Position Restoration

**When to use**: Preserve scroll position when navigating back to a page.

**GOOD - Store scroll position in sessionStorage**:

```javascript
document.addEventListener('turbo:before-cache', () => {
  const scrollable = document.querySelector('.scrollable-content');
  sessionStorage.setItem('scrollPosition', scrollable.scrollTop);
});

document.addEventListener('turbo:render', () => {
  const position = sessionStorage.getItem('scrollPosition');
  if (position) {
    document.querySelector('.scrollable-content').scrollTop = position;
  }
});
```
