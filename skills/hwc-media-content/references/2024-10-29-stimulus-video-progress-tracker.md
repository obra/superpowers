---
title: Stimulus - Video Progress Tracker with LocalStorage
date: '2024-10-29'
tags:
- localstorage
- stimulus
- video
- progress-tracking
description: Store ephemeral user state like video playback progress in localStorage
free: false
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
- [Code Example](#code-example)
- [Key Points](#key-points)
- [Pattern Card: Video Progress Tracking](#pattern-card-video-progress-tracking)


## Overview

Client-side `localStorage` provides a simpler alternative to server-side sessions for storing ephemeral user state like video playback progress. This avoids server-side complexity of serialization and rehydration.

## Implementation

A Stimulus controller can track video playback progress using `localStorage`. The controller needs:

- A `videoId` value to uniquely identify each video
- A `recordProgress` action to store the current playback time
- A `#seekToProgress` method to restore playback position on connect

The video element's `currentTime` property provides the playback position as a floating point number in seconds. The `timeupdate` event fires during playback and can trigger the storage action.

## Code Example

```html
<video
  width="100%"
  class="rounded-lg"
  src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  type="video/mp4"
  controls
  data-controller="video-progress"
  data-action="timeupdate->video-progress#recordProgress"
  data-video-progress-video-id-value="1"
></video>
```

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { videoId: Number };

  connect() {
    this.#seekToProgress();
  }

  recordProgress() {
    localStorage.setItem(
      `video-${this.videoIdValue}-progress`,
      this.element.currentTime
    );
  }

  #seekToProgress() {
    this.element.currentTime = localStorage.getItem(
      `video-${this.videoIdValue}-progress`
    );
  }
}
```

## Key Points

- Use `localStorage.setItem()` and `localStorage.getItem()` to persist and retrieve progress
- The `videoIdValue` property provides a unique identifier for each video
- The `timeupdate` event fires during playback and triggers `recordProgress`
- Consider debouncing `recordProgress` to reduce storage writes (e.g., every 100ms)
- The `#seekToProgress` method restores the saved position by setting `element.currentTime` on connect


## Pattern Card: Video Progress Tracking

**When to use**: Resume video playback from where the user left off.

**GOOD - localStorage persistence with Stimulus**:

```html
<video data-controller="video-progress"
       data-video-progress-key-value="video-123"
       data-action="timeupdate->video-progress#save 
                    loadedmetadata->video-progress#restore">
  <source src="/video.mp4" type="video/mp4">
</video>
```

```javascript
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { key: String };

  save() {
    localStorage.setItem(this.keyValue, this.element.currentTime);
  }

  restore() {
    const time = localStorage.getItem(this.keyValue);
    if (time) {
      this.element.currentTime = parseFloat(time);
    }
  }
}
```
