---
title: Turbo Frames - Loading Spinner
date: 2026-01-20
categories:
- Turbo Frames
tags:
- Lazy Loading
- busy attribute
- MutationObserver
- stimulus-use
- CSS
- template
- UX
description: Display a loading spinner while a Turbo Frame is `busy` fetching content asynchronously
free: false
ready: true
---

## Table of Contents

- [Problem](#problem)
- [Starting Point](#starting-point)
- [Solution 1: JavaScript with MutationObserver](#solution-1-javascript-with-mutationobserver)
- [HTML](#html)
- [Stimulus Controller](#stimulus-controller)
- [Solution 2: CSS Only](#solution-2-css-only)
- [Pattern Card: Loading Spinner for Turbo Frames](#pattern-card-loading-spinner-for-turbo-frames)

## Problem

Asynchronously loading content via Turbo Frames doesn't advertise its `busy` status, causing the frame to become unresponsive without user feedback.

## Starting Point

Basic page with navigation and lazy-loading Turbo Frame:

```html
<ul>
  <li><a href="/page1" data-turbo-frame="async-loader">Load Page 1</a></li>
  <li><a href="/page2" data-turbo-frame="async-loader">Load Page 2</a></li>
</ul>

<turbo-frame id="async-loader" src="/page1">
</turbo-frame>
```

The navigation links target the `async-loader` Turbo Frame via `data-turbo-frame` attribute, updating the frame's `src` attribute.

Response pages contain matching Turbo Frames:

```html
<!-- page1.html -->
<turbo-frame id="async-loader"><span>Page 1 took 1 sec to load<span></turbo-frame>
<!-- page2.html -->
<turbo-frame id="async-loader">Page 2 took 2 sec to load</turbo-frame>
```

## Solution 1: JavaScript with MutationObserver

Use a Stimulus controller with `useMutation` from stimulus-use to observe the `busy` attribute and inject a loading spinner from a `<template>` element.

### HTML

```html
<turbo-frame id="async-loader" src="/page1" data-controller="frame-spinner">
  <template data-frame-spinner-target="placeholder">
    ↻ Spinner, <em>can be any</em> <strong>HTML</strong>
  </template>
</turbo-frame>
```

### Stimulus Controller

```js
import { Controller } from '@hotwired/stimulus';
import { useMutation } from 'stimulus-use';

export default class extends Controller {
  static targets = ['placeholder'];

  connect() {
    useMutation(this, { attributes: true });

    this.templateNode = this.placeholderTarget.content.cloneNode(true);

    if (this.element.hasAttribute('busy')) {
      this.#renderPlaceholder();
    }
  }

  mutate(entries) {
    entries = entries.filter((e) => e.attributeName === 'busy');

    entries.forEach((entry) => {
      if (entry.target === this.element) {
        this.#renderPlaceholder();
      }
    });
  }

  #renderPlaceholder() {
    if (this.element.hasChildNodes()) {
      this.element.firstChild.replaceWith(this.#clonePlaceholderNode(true));
    } else {
      this.element.appendChild(this.#clonePlaceholderNode(true));
    }
  }

  #clonePlaceholderNode(deep) {
    return this.templateNode.cloneNode(deep);
  }
}
```

The controller:
- Initializes `useMutation` to observe attribute changes on the Turbo Frame
- Clones the template content in `connect()` for reuse
- Filters mutation entries to only process `busy` attribute changes
- Replaces frame content with cloned template when `busy` attribute appears
- Handles both element children and text-only content

## Solution 2: CSS Only

For text-only loading indicators, use CSS pseudo-elements targeting the `busy` attribute:

```css
turbo-frame {
  &[busy] {
    /* for plain text nodes */
    font-size: 0;

    /* for DOM nodes */
    * {
      display: none;
    }

    &::after {
      font-size: 1rem;
      color: black;
      content: 'Loading...';
    }
  }
}
```

This approach:
- Hides existing content (sets child nodes to `display: none` or font-size to 0 for text nodes)
- Inserts an `::after` pseudo-element with loading text via the `content` property
- Limited to text/CSS content values (no arbitrary HTML)


## Pattern Card: Loading Spinner for Turbo Frames

**When to use**: Turbo Frames loading content asynchronously (lazy loading or user-triggered navigation).

**GOOD - Using MutationObserver to detect busy attribute**:

```html
<turbo-frame id="content" src="/page1" data-controller="frame-spinner">
  <template data-frame-spinner-target="placeholder">
    <div class="spinner">Loading...</div>
  </template>
</turbo-frame>
```

```javascript
import { Controller } from '@hotwired/stimulus';
import { useMutation } from 'stimulus-use';

export default class extends Controller {
  static targets = ['placeholder'];

  connect() {
    useMutation(this, { attributes: true });
    this.templateNode = this.placeholderTarget.content.cloneNode(true);

    if (this.element.hasAttribute('busy')) {
      this.#renderPlaceholder();
    }
  }

  mutate(entries) {
    entries.filter(e => e.attributeName === 'busy').forEach(() => {
      this.#renderPlaceholder();
    });
  }

  #renderPlaceholder() {
    if (this.element.hasChildNodes()) {
      this.element.firstChild.replaceWith(this.templateNode.cloneNode(true));
    } else {
      this.element.appendChild(this.templateNode.cloneNode(true));
    }
  }
}
```

**BAD - Hardcoded timeouts**:

```javascript
// Don't guess when to show/hide spinner
loadFrame() {
  this.showSpinner();
  setTimeout(() => this.hideSpinner(), 2000); // Brittle!
}
```

**CSS-only alternative** (for simple text indicators):

```css
turbo-frame[busy] {
  font-size: 0;
  * { display: none; }
  &::after {
    font-size: 1rem;
    content: 'Loading...';
  }
}
```
