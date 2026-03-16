---
title: Stimulus - Removing Markers from a Wavesurfer Element
date: 2024-07-30
categories:
- Stimulus
tags:
- 3rd party libs
- values
- callbacks
- events
- integration
description: Use Stimulus value callbacks to interact with a wavesurfer element and remove markers.
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Action Handler](#action-handler)
  - [Value Callback](#value-callback)
  - [Wavesurfer Integration](#wavesurfer-integration)
  - [Event Handling](#event-handling)
- [Complete Controller](#complete-controller)
- [HTML Template](#html-template)
- [Key Concepts](#key-concepts)


## Overview

This demonstrates how to remove markers from a Wavesurfer.js element using Stimulus value callbacks and action parameters. The implementation uses Stimulus values as the source of truth while interfacing with a third-party library that manages its own state.

## Implementation

### Action Handler

The `removeMarker` action uses an action parameter containing the timestamp to filter the marker from the `markersValue` array:

```js
removeMarker({ params: { time } }) {
  this.markersValue = this.markersValue.filter(
    (marker) => marker.time !== time
  );
}
```

### Value Callback

The `markersValueChanged` callback detects removed markers by comparing the current and previous arrays, then calls `#handleRemoval` for each:

```js
async markersValueChanged(markers, previousMarkers) {
  // huge gotcha: on first load, this callback is called _before_ connect()
  if (!this.regions) {
    await new Promise(requestAnimationFrame);
  }

  const addedMarkers = markers.filter(
    (marker) =>
      !new Set(previousMarkers.map((prevMarker) => prevMarker.time)).has(
        marker.time
      )
  );

  const removedMarkers = previousMarkers?.filter(
    (prevMarker) =>
      !new Set(markers.map((marker) => marker.time)).has(prevMarker.time)
  );

  addedMarkers?.forEach((m) => this.#handleAddition(m));
  removedMarkers?.forEach((m) => this.#handleRemoval(m));
}
```

This approach makes state management idempotent, allowing the markers value to be changed by out-of-band actions like Turbo refreshes over WebSockets.

### Wavesurfer Integration

The `#handleRemoval` method acts as an adapter to Wavesurfer, finding the region by timestamp and removing it:

```js
#handleRemoval(value) {
  const regionToRemove = this.regions?.regions.find(
    (region) => region.start === value.time
  );

  regionToRemove.remove();
}
```

### Event Handling

Listen for the `region-removed` event to remove the corresponding list item from the DOM:

```js
this.regions.on('region-removed', (region) => {
  this.listTarget.querySelector(`[data-id="${region.id}"]`).remove();
});
```

## Complete Controller

```js
import { Controller } from '@hotwired/stimulus';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

const listItemTemplate = `<li class="border-2 border-black rounded-lg p-2 flex justify-between" data-id="ID">BODY
    <button data-action="peaks#removeMarker" data-peaks-time-param="TIME" class="rounded bg-gray-800 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-gray-600">
      Remove
    </button>
  </li>`;

export default class extends Controller {
  static targets = [
    'audio',
    'container',
    'playButton',
    'markerDescription',
    'list',
  ];
  static values = {
    markers: { type: Array, default: [] },
    playing: { type: Boolean, default: false },
  };

  connect() {
    this.wavesurfer = WaveSurfer.create({
      container: this.containerTarget,
      waveColor: '#4F4A85',
      progressColor: '#383351',
      media: this.audioTarget,
      minPxPerSec: 256,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      hideScrollbar: true,
    });

    this.regions = this.wavesurfer.registerPlugin(RegionsPlugin.create());

    this.wavesurfer.on('play', () => {
      this.playingValue = true;
    });

    this.wavesurfer.on('pause', () => {
      this.playingValue = false;
    });

    this.wavesurfer.on('finish', () => {
      this.playingValue = false;
    });

    this.regions.on('region-created', (region) => {
      this.listTarget.insertAdjacentHTML(
        'beforeend',
        listItemTemplate
          .replace('ID', region.id)
          .replace('BODY', region.content.innerText)
          .replace('TIME', region.start)
      );
    });

    this.regions.on('region-removed', (region) => {
      this.listTarget.querySelector(`[data-id="${region.id}"]`).remove();
    });
  }

  disconnect() {
    this.wavesurfer.destroy();
    this.regions.destroy();
  }

  playPause() {
    this.wavesurfer.playPause();
  }

  playingValueChanged() {
    this.playButtonTarget.innerHTML = this.playingValue ? 'Pause' : 'Play';
  }

  async markersValueChanged(markers, previousMarkers) {
    // huge gotcha: on first load, this callback is called _before_ connect()
    if (!this.regions) {
      await new Promise(requestAnimationFrame);
    }

    const addedMarkers = markers.filter(
      (marker) =>
        !new Set(previousMarkers.map((prevMarker) => prevMarker.time)).has(
          marker.time
        )
    );

    const removedMarkers = previousMarkers?.filter(
      (prevMarker) =>
        !new Set(markers.map((marker) => marker.time)).has(prevMarker.time)
    );

    addedMarkers?.forEach((m) => this.#handleAddition(m));
    removedMarkers?.forEach((m) => this.#handleRemoval(m));
  }

  addMarkerAtCurrentTime() {
    this.markersValue = [
      ...this.markersValue,
      {
        time: this.wavesurfer.getCurrentTime(),
        description: this.markerDescriptionTarget.value,
      },
    ];

    this.markerDescriptionTarget.value = '';
  }

  removeMarker({ params: { time } }) {
    this.markersValue = this.markersValue.filter(
      (marker) => marker.time !== time
    );
  }

  #handleAddition(value) {
    this.regions?.addRegion({
      start: value.time,
      content: value.description,
      color: 'rgba(255, 0, 0, 0.5)',
      drag: false,
      resize: false,
    });
  }

  #handleRemoval(value) {
    const regionToRemove = this.regions?.regions.find(
      (region) => region.start === value.time
    );

    regionToRemove.remove();
  }
}
```

## HTML Template

```html
<div data-controller="peaks">
  <div
    data-peaks-target="container"
    class="w-64 h-36 border-2 border-black rounded-lg p-2"
  ></div>
  <audio data-peaks-target="audio">
    <source src="/assets/sound_logo.ogg" type="audio/ogg; codecs=vorbis" />
    <source src="/assets/sound_logo.mp3" type="audio/mpeg" />
  </audio>

  <div class="mb-3">
    <button
      data-action="peaks#playPause"
      data-peaks-target="playButton"
      type="button"
      class="rounded bg-gray-800 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-gray-600"
    >
      Play
    </button>
  </div>
  <div>
    <input
      name="description"
      type="text"
      class="text-sm rounded ring-1 ring-inset ring-black placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
      data-peaks-target="markerDescription"
    />
    <button
      data-action="peaks#addMarkerAtCurrentTime"
      type="button"
      class="rounded bg-gray-800 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-gray-600"
    >
      Add Marker
    </button>
  </div>
  <h3 class="mt-6 text-xl font-semibold">Markers</h3>
  <ul class="space-y-2 mt-3" data-peaks-target="list"></ul>
</div>
```

## Key Concepts

- **Action Parameters**: Use `data-peaks-time-param` to pass the timestamp to the `removeMarker` action
- **Value Callbacks**: The `markersValueChanged` callback is called before `connect()`, requiring a guard check
- **State Management**: Stimulus values serve as the source of truth, making the system idempotent and compatible with Turbo updates
- **Event Handling**: Listen to Wavesurfer's `region-removed` event to sync DOM updates
- **Third-Party Integration**: The controller acts as a conductor, acknowledging that Wavesurfer manages its own state and emits events, allowing graceful error handling
