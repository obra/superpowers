---
title: Turbo Streams - Custom Stream Actions - LocalStorage
date: '2024-01-30'
categories:
- Turbo Streams
tags:
- Custom Stream Actions
- LocalStorage
- State Management
- Turbo Streams
ready: true
description: Store ephemeral state changes locally using localStorage and custom Turbo
  Stream Actions.
free: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Custom Stream Action](#custom-stream-action)
  - [Invoking the Action](#invoking-the-action)
  - [Restoring State on Page Load](#restoring-state-on-page-load)
  - [Preventing UI Flicker](#preventing-ui-flicker)
- [Complete Example](#complete-example)
- [Key Points](#key-points)
- [Pattern Card: LocalStorage with Custom Stream Actions](#pattern-card-localstorage-with-custom-stream-actions)


## Overview

Use custom Turbo Stream actions with localStorage to persist ephemeral state across page reloads. This technique stores the current video ID in localStorage and restores it on page load.

## Implementation

### Custom Stream Action

Create a custom Turbo Stream action that stores data in localStorage:

```js
import '@hotwired/turbo';
import { StreamActions } from '@hotwired/turbo';

// <turbo-stream action="rememberCurrentVideo" target="#playlist-dom-id" currentYoutubeId="a youtube id"></turbo-stream>
StreamActions.rememberCurrentVideo = function () {
  localStorage.setItem(
    'currentYoutubeId',
    this.getAttribute('currentyoutubeid')
  );
};
```

The action reads the `currentyoutubeid` attribute from the `<turbo-stream>` tag and stores it in localStorage.

### Invoking the Action

Invoke the action after the video changes by appending a cloned `<turbo-stream>` element to the DOM:

```js
// Execute after video has changed
document.addEventListener('videochanged', (event) => {
  const youtubeId = event.detail.youtubeId;

  // ... other actions from earlier challenges (commented out for brevity)
  // StreamActions.exchangeVideo, managePlaylistControls, etc.

  // Execute localStorage action
  const rememberCurrentVideoActionClone = document
    .querySelector('#remember-current-video-action-template')
    .content.cloneNode(true);

  rememberCurrentVideoActionClone.firstElementChild.setAttribute(
    'currentyoutubeid',
    youtubeId
  );

  document.body.appendChild(rememberCurrentVideoActionClone);
});
```

This emulates what would typically be done by a server-side Turbo Stream response.

### Restoring State on Page Load

Restore the stored video on page load using a `DOMContentLoaded` event listener:

```js
document.addEventListener('DOMContentLoaded', (event) => {
  const currentYoutubeId = localStorage.getItem('currentYoutubeId');

  if (currentYoutubeId) {
    const videoChangeEvent = new CustomEvent('videochange', {
      detail: {
        youtubeId: currentYoutubeId,
      },
      bubbles: true,
    });

    event.target.dispatchEvent(videoChangeEvent);
  } else {
    document.querySelector('#playlist-container').classList.remove('hidden');
  }
});
```

The listener fetches the stored YouTube ID from localStorage and dispatches a `videochange` event to trigger the video change.

### Preventing UI Flicker

To prevent flicker (showing the first video before jumping to the stored one), hide the playlist container initially and show it after the video change completes:

```js
document.addEventListener('videochange', (event) => {
  const youtubeId = event.detail.youtubeId;

  // ... execute video change actions

  // Show container after video change
  document.querySelector('#playlist-container').classList.remove('hidden');
});
```

Set the container to `hidden` initially in your HTML/CSS, and remove the class once the `videochange` event completes.

## Complete Example

```js
import '@hotwired/turbo';
import { StreamActions } from '@hotwired/turbo';

Turbo.start();

// Custom Stream Action for localStorage
StreamActions.rememberCurrentVideo = function () {
  localStorage.setItem(
    'currentYoutubeId',
    this.getAttribute('currentyoutubeid')
  );
};

// Restore video on page load
document.addEventListener('DOMContentLoaded', (event) => {
  const currentYoutubeId = localStorage.getItem('currentYoutubeId');

  if (currentYoutubeId) {
    const videoChangeEvent = new CustomEvent('videochange', {
      detail: {
        youtubeId: currentYoutubeId,
      },
      bubbles: true,
    });

    event.target.dispatchEvent(videoChangeEvent);
  } else {
    document.querySelector('#playlist-container').classList.remove('hidden');
  }
});

// Store video ID after change
document.addEventListener('videochanged', (event) => {
  const youtubeId = event.detail.youtubeId;

  // ... other actions from earlier challenges (commented out)
  // StreamActions.exchangeVideo, managePlaylistControls, managePlayingIndicator

  // Execute localStorage action
  const rememberCurrentVideoActionClone = document
    .querySelector('#remember-current-video-action-template')
    .content.cloneNode(true);

  rememberCurrentVideoActionClone.firstElementChild.setAttribute(
    'currentyoutubeid',
    youtubeId
  );

  document.body.appendChild(rememberCurrentVideoActionClone);
});

// Show container after video change to prevent flicker
document.addEventListener('videochange', (event) => {
  // ... execute video change actions

  document.querySelector('#playlist-container').classList.remove('hidden');
});
```

## Key Points

- Custom Turbo Stream actions can interact with browser APIs like localStorage
- Actions read attributes from the `<turbo-stream>` element using `this.getAttribute()`
- Invoke actions by cloning template elements and appending them to the DOM
- Use `DOMContentLoaded` to restore state on page load
- Hide UI elements initially to prevent flicker when restoring state


## Pattern Card: LocalStorage with Custom Stream Actions

**When to use**: Persist ephemeral client state that should survive page reloads.

**GOOD - Custom action to sync localStorage**:

```javascript
import { StreamActions } from "@hotwired/turbo"

StreamActions.setLocalStorage = function() {
  const key = this.getAttribute('key');
  const value = this.getAttribute('value');
  localStorage.setItem(key, value);
};

StreamActions.removeLocalStorage = function() {
  const key = this.getAttribute('key');
  localStorage.removeItem(key);
};
```

```erb
<%= turbo_stream.action "setLocalStorage", key: "current_video", value: @video.id %>
```
