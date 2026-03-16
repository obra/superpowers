---
title: Stimulus - Auto-Sorting
date: '2023-12-05'
categories:
- Stimulus
tags:
- MutationObserver
- Turbo Streams
- WebSocket
- Auto-sorting
description: Use a MutationObserver to sort websocket messages that arrived out of order.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [Implementation Details](#implementation-details)
- [Key Points](#key-points)
- [Pattern Card: MutationObserver for Auto-Sorting](#pattern-card-mutationobserver-for-auto-sorting)


## Overview

When Turbo Stream messages arrive out of order via WebSocket (common in multi-process or multi-server environments), a Stimulus controller can use a MutationObserver to automatically sort them by timestamp.

## Problem

Messages broadcast via Turbo Streams may arrive out of order when processed by multiple server processes. Each message includes a timestamp indicating when it arrived at the server, which can be used for sorting.

Example Turbo Stream message structure:

```js
document.body.insertAdjacentHTML(
  'beforeend',
  `<turbo-stream action="append" target="messages"><template><li class="flex gap-x-4 py-5" data-timestamp="${timestamp}">    
    <!-- message content -->
  </li></template></turbo-stream>`
);
```

## Solution

A Stimulus controller uses a MutationObserver to detect new children and automatically sort them by timestamp. The observer must be disconnected during DOM manipulation to prevent infinite loops.

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  connect() {
    this.observer = new MutationObserver(this.#sortChildren.bind(this));
    this.observer.observe(this.element, { childList: true, subtree: true });
  }

  disconnect() {
    this.observer.disconnect();
  }

  #sortChildren(_mutationList, observer) {
    observer.disconnect();
    const { children } = this;

    this.element.innerHTML = '';

    children
      .sort(
        (a, b) => parseInt(a.dataset.timestamp) - parseInt(b.dataset.timestamp)
      )
      .forEach((child) => {
        this.element.append(child);
      });

    observer.observe(this.element, { childList: true, subtree: true });
  }

  get children() {
    return Array.from(this.element.children);
  }
}
```

HTML usage:

```html
<ul
  role="list"
  id="messages"
  data-controller="sort"
></ul>
```

## Implementation Details

1. **Observer Setup**: The MutationObserver watches for `childList` and `subtree` changes on the controller element.

2. **Sorting Process**:
   - Disconnect the observer to prevent infinite loops
   - Retrieve all children (the new element is already in the DOM)
   - Clear the element's innerHTML
   - Sort children by `data-timestamp` attribute
   - Re-append sorted children

3. **Infinite Loop Prevention**: The observer must be disconnected before clearing and re-appending elements, then reconnected afterward. Without this, the observer would trigger on its own DOM mutations, causing recursive calls.

## Key Points

- Messages arrive via Turbo Stream `append` actions
- Each message element must have a `data-timestamp` attribute
- The MutationObserver detects when new children are added
- Observer must be disconnected during sorting to avoid infinite loops 


## Pattern Card: MutationObserver for Auto-Sorting

**When to use**: React to DOM changes from WebSocket/Turbo Stream messages.

**GOOD - Sort items by timestamp when added out of order**:

```javascript
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  connect() {
    this.observer = new MutationObserver((mutations) => {
      this.sort();
    });
    
    this.observer.observe(this.element, { childList: true });
  }

  disconnect() {
    this.observer.disconnect();
  }

  sort() {
    const items = [...this.element.children];
    items.sort((a, b) => {
      return new Date(a.dataset.timestamp) - new Date(b.dataset.timestamp);
    });
    items.forEach(item => this.element.appendChild(item));
  }
}
```
