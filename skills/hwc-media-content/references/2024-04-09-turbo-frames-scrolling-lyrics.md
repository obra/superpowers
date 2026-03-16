---
title: Scrolling Lyrics using Turbo Frames
date: 2024-04-09
categories:
- Turbo Frames
tags:
- Lazy Loading
- View Transitions
- Turbo Frames
- Time-based Updates
- src Attribute
ready: true
free: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML Structure](#html-structure)
  - [Rails Controller](#rails-controller)
  - [JavaScript Implementation](#javascript-implementation)
  - [Optimization](#optimization)
  - [View Transitions](#view-transitions)
- [Pattern Card: Time-Sensitive Content (Scrolling Lyrics)](#pattern-card-time-sensitive-content-scrolling-lyrics)


## Overview

Turbo Frames can exchange content dynamically using their `src` attribute. This technique demonstrates updating Turbo Frame content in a time-sensitive manner, such as when a video's timecode changes.

## Implementation

### HTML Structure

The page contains a video player and a Turbo Frame for displaying lyrics:

```html
<div>
  <lite-youtube
    id="player"
    videoid="dQw4w9WgXcQ"
    playlabel="Never Gonna Give You Up"
    js-api
  ></lite-youtube>
</div>
<div id="time"></div>
<div>
  <turbo-frame id="lyrics" src="/lyrics" class="block prose mx-5">
    <h3>Waiting for Lyrics...</h3>
  </turbo-frame>
</div>
```

### Rails Controller

The server endpoint responds to `/lyrics` with lyrics for a given timecode in seconds when passed as the `t` parameter (e.g., `/lyrics?t=10`):

```ruby
class LyricsController < ApplicationController
  LYRICS = {
    18 => "<h3>We're no strangers to love</h3><h3>You know the rules and so do I (do I)</h3>",
    27 => "<h3>A full commitment's what I'm thinking of</h3><h3>You wouldn't get this from any other guy</h3>",
    35 => "<h3>I just wanna tell you how I'm feeling</h3><h3>Gotta make you understand</h3>",
    43 => '<h3>Never gonna give you up</h3><h3>Never gonna let you down</h3><h3>Never gonna run around and desert you</h3>',
    51 => '<h3>Never gonna make you cry</h3><h3>Never gonna say goodbye</h3><h3>Never gonna tell a lie and hurt you</h3>'
  }.freeze

  def show
    time = params[:t].to_i
    
    if LYRICS[time]
      render html: turbo_frame_tag("lyrics") do
        content_tag(:div, LYRICS[time].html_safe, style: "view-transition-name: fly-out")
      end
    else
      head :not_found
    end
  end
end
```

If there's a match for the timecode in the `LYRICS` hash, it responds with an appropriate Turbo Frame, else with a 404 error.

### JavaScript Implementation

Update the Turbo Frame's `src` attribute based on video timecode. For YouTube videos embedded in an iframe, listen for time updates from the YT Iframe Player API. For a regular `<video>` element, listen for the `timeupdate` event.

```js
document.addEventListener('turbo:load', async () => {
  // set initial time
  document.getElementById('time').innerHTML = formatSecondsToHHMMSS(0);

  const lyricsFrame = document.querySelector('#lyrics');
  const player = await document.querySelector('lite-youtube').getYTPlayer();
  const iframeWindow = player.getIframe().contentWindow;

  let lastTimeUpdate = 0;

  window.addEventListener('message', function (event) {
    if (event.source === iframeWindow) {
      try {
        const data = JSON.parse(event.data);

        // The "infoDelivery" event is used by YT to transmit any
        // kind of information change in the player,
        // such as the current time or a playback quality change.
        if (
          data.event === 'infoDelivery' &&
          data.info &&
          data.info.currentTime
        ) {
          const time = Math.floor(data.info.currentTime);

          if (time !== lastTimeUpdate) {
            lastTimeUpdate = time;

            document.getElementById('time').innerHTML =
              formatSecondsToHHMMSS(time);

            lyricsFrame.src = `/lyrics?t=${time}`;
          }
        }
      } catch {}
    }
  });
});

function formatSecondsToHHMMSS(seconds) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}
```

### Optimization

The `message` event is triggered more frequently than once per second, but the server only has lyrics entries at second precision. To minimize requests, compare the last updated timestamp to the current time. This ensures new lyrics are only requested once per second.

### View Transitions

To add view transitions to Turbo Frame swaps, intercept the frame rendering and invoke `startViewTransition`:

```js
document.addEventListener('turbo:before-frame-render', (event) => {
  if (document.startViewTransition) {
    const originalRender = event.detail.render;
    event.detail.render = (currentElement, newElement) => {
      document.startViewTransition(() =>
        originalRender(currentElement, newElement)
      );
    };
  }
});
```

The server response includes a `view-transition-name` CSS property on the lyrics container. This is applied to the `::view-transition-old` and `::view-transition-new` pseudo-elements:

```css
@keyframes fly-out {
  0% {
    transform: translate3d(0, 0px, 0);
  }
  100% {
    transform: translate3d(0, -100px, 0);
  }
}

::view-transition-new(fly-out) {
  animation-name: -ua-view-transition-fade-in;
  animation-duration: 800ms;
}

::view-transition-old(fly-out) {
  animation-name: -ua-view-transition-fade-out, fly-out;
  animation-duration: 500ms;
}
```


## Pattern Card: Time-Sensitive Content (Scrolling Lyrics)

**When to use**: Update content based on media playback position.

**GOOD - Turbo Frame src updates based on video timecode**:

```html
<video data-controller="lyric-sync"
       data-action="timeupdate->lyric-sync#update">
  <source src="/video.mp4" type="video/mp4">
</video>

<turbo-frame id="lyrics" data-lyric-sync-target="frame">
  <!-- Current lyrics loaded here -->
</turbo-frame>
```

```javascript
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['frame'];

  update() {
    const time = Math.floor(this.element.currentTime);
    const currentSrc = this.frameTarget.src;
    const newSrc = `/lyrics?time=${time}`;
    
    if (currentSrc !== newSrc) {
      this.frameTarget.src = newSrc;
    }
  }
}
```
