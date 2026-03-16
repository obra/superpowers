---
title: Turbo Frames - Lifecycle of a Lazy Loaded Frame
date: 2023-09-26
categories:
- Turbo Frames
- Stimulus
tags:
- Lazy Loading
- "turbo:frame-load"
- Events
- Lifecycle
- Stimulus Controllers
- Value Callbacks
- Event Delegation
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Example: Tracking Loaded Frames in Navigation](#example-tracking-loaded-frames-in-navigation)
- [Implementation](#implementation)
  - [Markup](#markup)
  - [Stimulus Controller](#stimulus-controller)
- [Key Concepts](#key-concepts)
- [Pattern Card: Lazy Loading Frames](#pattern-card-lazy-loading-frames)


## Overview

Turbo Frames can be lazily loaded using the `loading="lazy"` attribute, which triggers loading via IntersectionObserver. The `turbo:frame-load` event fires when a lazy-loaded frame finishes loading, allowing you to trigger custom interactions using Stimulus.

## Example: Tracking Loaded Frames in Navigation

This example demonstrates how to mark navigation items in a table of contents as "seen" when their corresponding lazy-loaded frames finish loading, providing visual feedback to users about which sections have been loaded.

## Implementation

### Markup

Each navigation item listens for the `turbo:frame-load` event on the document level using Stimulus action syntax. The frame ID is stored as a value to identify which frame corresponds to each navigation item:

```html
<li
  data-controller="user-interaction"
  data-user-interaction-frame-value="introduction"
  data-action="turbo:frame-load@document->user-interaction#markAsSeen"
>
  <div data-user-interaction-target="wrapper">
    <a href="#introduction">Introduction</a>
  </div>
</li>
```

Lazy-loaded frames use the `loading="lazy"` attribute:

```html
<turbo-frame
  id="introduction"
  src="_1_introduction.html"
  loading="lazy"
>
  <!-- Loading placeholder content -->
</turbo-frame>
```

The action syntax `turbo:frame-load@document->user-interaction#markAsSeen` tells Stimulus to listen for the `turbo:frame-load` event on the document level and trigger the `markAsSeen` action when it fires.

### Stimulus Controller

The controller filters events by checking if the loaded frame's ID matches the controller's frame value. The `seen` value is toggled, and a value changed callback handles the presentation logic:

```js
const check =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>';

export default class extends Controller {
  static targets = ['wrapper'];
  static values = {
    seen: Boolean,
    frame: String,
  };

  markAsSeen(event) {
    if (event.target.id !== this.frameValue) return;

    this.seenValue = true;
  }

  seenValueChanged() {
    if (this.seenValue) {
      this.wrapperTarget.insertAdjacentHTML('beforeEnd', check);
    }
  }
}
```

## Key Concepts

- The `turbo:frame-load` event's target is the frame element that finished loading
- Event delegation on `document` allows listening to frame loads from any frame
- Filtering by frame ID ensures each controller only responds to its corresponding frame
- Value changed callbacks decouple business logic from presentation logic, allowing the `seen` value to be modified by the controller, server rendering, or other JavaScript


## Pattern Card: Lazy Loading Frames

**When to use**: Defer loading content until it's scrolled into view.

**GOOD - Lazy frame with loading indicator**:

```html
<turbo-frame id="comments" src="/comments" loading="lazy">
  <div class="placeholder">Loading comments...</div>
</turbo-frame>
```

**Track when lazy frames load**:

```html
<li data-controller="section"
    data-section-frame-value="introduction"
    data-action="turbo:frame-load@document->section#markLoaded">
  <a href="#introduction">Introduction</a>
</li>

<turbo-frame id="introduction" src="/intro" loading="lazy">
  Loading...
</turbo-frame>
```

```javascript
export default class extends Controller {
  static values = { frame: String, loaded: Boolean };

  markLoaded(event) {
    if (event.target.id === this.frameValue) {
      this.loadedValue = true;
    }
  }

  loadedValueChanged() {
    if (this.loadedValue) {
      this.element.classList.add('loaded');
    }
  }
}
```
