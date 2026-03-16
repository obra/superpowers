---
title: Stimulus - Adding Markers to a Wavesurfer Element
date: 2024-07-02
categories:
- Stimulus
tags:
- 3rd party libs
- values
- callbacks
- events
- integration
description: Use Stimulus value callbacks to interact with a wavesurfer element and
  add markers.
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Controller Structure](#controller-structure)
  - [HTML Markup](#html-markup)
- [Key Concepts](#key-concepts)
  - [Managing Play State with Stimulus Values](#managing-play-state-with-stimulus-values)
  - [Adding Markers via Value Callbacks](#adding-markers-via-value-callbacks)
  - [Updating UI via Third-Party Library Events](#updating-ui-via-third-party-library-events)
  - [State Management Considerations](#state-management-considerations)
- [Pattern Card: Third-Party Library Integration (Wavesurfer)](#pattern-card-third-party-library-integration-wavesurfer)


## Overview

Integrating Wavesurfer audio visualization library with Stimulus using its internal event system and Stimulus values. This demonstrates how to manage state in Stimulus controllers when wrapping third-party libraries.

## Implementation

### Controller Structure

The `PeaksController` uses Stimulus targets and values to manage the Wavesurfer instance:

```js
import { Controller } from '@hotwired/stimulus';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

const listItemTemplate =
  '<li class="border-2 border-black rounded-lg p-2">BODY</li>';

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
      console.log(region);
      // TODO format time and add
      this.listTarget.insertAdjacentHTML(
        'beforeend',
        listItemTemplate.replace('BODY', region.content.innerText)
      );
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

  markersValueChanged(markers, previousMarkers) {
    const addedMarkers = markers.filter(
      (marker) =>
        !new Set(previousMarkers.map((prevMarker) => prevMarker.time)).has(
          marker.time
        )
    );

    addedMarkers?.forEach((m) => this.#handleAddition(m));
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

  #handleAddition(value) {
    this.regions?.addRegion({
      start: value.time,
      content: value.description,
      color: 'rgba(255, 0, 0, 0.5)',
      drag: false,
      resize: false,
    });
  }
}
```

### HTML Markup

```html
<div data-controller="peaks" class="">
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

### Managing Play State with Stimulus Values

Wavesurfer emits `play`, `pause`, and `finish` events. Listen to these events in `connect()` and update the `playingValue` accordingly. The `playingValueChanged` callback updates the button label reactively.

### Adding Markers via Value Callbacks

When adding a marker, update the `markersValue` array by spreading the existing array and appending a new marker object. The `markersValueChanged` callback receives both the current and previous marker arrays, allowing you to filter out only the newly added markers by comparing timestamps (or IDs in production).

The callback filters added markers by checking if their timestamp exists in the previous markers set, then calls `#handleAddition` for each new marker to add a region to the Wavesurfer instance.

### Updating UI via Third-Party Library Events

Use the Regions plugin's `region-created` event to update the markers list in the DOM. This leverages the third-party library's event system rather than manually syncing state.

### State Management Considerations

There are two approaches to managing state with third-party libraries:
1. Use the library's native events to update Stimulus values (as shown here)
2. Use Stimulus values to drive the library's behavior

The choice depends on whether the Stimulus controller is primarily a wrapper around a specific library (exploit native mechanics) or if the library should be exchangeable (drive from Stimulus values).


## Pattern Card: Third-Party Library Integration (Wavesurfer)

**When to use**: Wrap audio/video libraries that manage their own state.

**GOOD - Stimulus values as source of truth**:

```html
<div data-controller="waveform"
     data-waveform-markers-value="[]"
     data-waveform-url-value="/audio.mp3">
  <div data-waveform-target="container"></div>
  <button data-action="click->waveform#addMarker">Add Marker</button>
</div>
```

```javascript
import { Controller } from '@hotwired/stimulus';
import WaveSurfer from 'wavesurfer.js';

export default class extends Controller {
  static targets = ['container'];
  static values = { url: String, markers: Array };

  connect() {
    this.wavesurfer = WaveSurfer.create({
      container: this.containerTarget,
      url: this.urlValue
    });
  }

  disconnect() {
    this.wavesurfer.destroy();
  }

  addMarker() {
    const time = this.wavesurfer.getCurrentTime();
    this.markersValue = [...this.markersValue, { time }];
  }

  markersValueChanged() {
    // Sync markers to wavesurfer
    this.wavesurfer.clearMarkers();
    this.markersValue.forEach(m => this.wavesurfer.addMarker(m));
  }
}
```

**Key insight**: Use Stimulus value changed callbacks to keep third-party library state in sync.
