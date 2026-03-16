---
title: Stimulus - Progressive Image Loading with Blurhash
date: 2024-04-23
categories:
- Stimulus
tags:
- Lazy Loading
- blurhash
- Progressive Enhancement
- Performance
- Core Web Vitals
description: Improve Largest Contentful Paint using image blurhashes and Stimulus
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML Structure](#html-structure)
  - [Stimulus Controller](#stimulus-controller)
- [Key Points](#key-points)
- [Pattern Card: Progressive Image Loading (Blurhash)](#pattern-card-progressive-image-loading-blurhash)


## Overview

Blurhashes provide a way to improve Largest Contentful Paint (LCP) and prevent layout shift when lazy loading images. Using Stimulus, we can create a progressive image loading experience that displays a blurhash placeholder while the actual image loads.

## Implementation

### HTML Structure

Images are wrapped in containers with a Stimulus controller and blurhash value. Images start with `opacity-0` while canvases start with `opacity-100`:

```html
<div
  class="relative rounded-md"
  data-controller="lazy-image"
  data-lazy-image-blurhash-value="qmH{m5I9D%V@WBj@WBj[_4aeM{WAWAayayj[WCx]t7WBRjWBfQj[NIt7t7offkayaxWBR+oLazt7t7kCWBWBxZR+ofj[ofofj[ay"
>
  <img
    src="https://picsum.photos/id/13/300/200"
    data-lazy-image-target="image"
    class="opacity-0 transition-opacity duration-500 rounded-md"
  />
  <canvas
    data-lazy-image-target="canvas"
    class="absolute top-0 left-0 opacity-100 transition-opacity duration-500 rounded-md"
  ></canvas>
</div>
```

### Stimulus Controller

The controller uses the blurhash library to decode and paint the placeholder, then transitions to the loaded image:

```js
import { Controller } from '@hotwired/stimulus';
import { decode } from 'blurhash';

export default class extends Controller {
  static targets = ['image', 'canvas'];
  static values = { blurhash: String };

  connect() {
    const width = this.imageTarget.width;
    const height = this.imageTarget.height;

    this.canvasTarget.width = width;
    this.canvasTarget.height = height;

    const pixels = decode(this.blurhashValue, width, height);
    const ctx = this.canvasTarget.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    // simulate slow loading
    // should be this.imageTarget.addEventListener('load', ...)
    setTimeout(() => {
      this.canvasTarget.classList.remove('opacity-100');
      this.canvasTarget.classList.add('opacity-0');
      this.imageTarget.classList.remove('opacity-0');
      this.imageTarget.classList.add('opacity-100');
    }, 500);
  }
}
```

## Key Points

1. Canvas dimensions must match the image dimensions. Use `this.imageTarget.width` and `this.imageTarget.height` to set the canvas size.

2. The blurhash `decode` method returns a pixel array that is converted to `ImageData` and drawn on the canvas using `putImageData`.

3. In production, replace the `setTimeout` with `this.imageTarget.addEventListener('load', ...)` to trigger the transition when the image actually loads.

4. The opacity transition classes provide a smooth fade from blurhash placeholder to the loaded image.


## Pattern Card: Progressive Image Loading (Blurhash)

**When to use**: Show a blurred placeholder while high-resolution images load.

**GOOD - Decode blurhash and swap on load**:

```html
<div data-controller="blurhash"
     data-blurhash-hash-value="LEHV6nWB2yk8pyo0adR*.7kCMdnj">
  <canvas data-blurhash-target="canvas" width="32" height="32"></canvas>
  <img data-blurhash-target="image" 
       data-src="/high-res.jpg"
       data-action="load->blurhash#reveal"
       class="hidden">
</div>
```

```javascript
import { Controller } from '@hotwired/stimulus';
import { decode } from 'blurhash';

export default class extends Controller {
  static targets = ['canvas', 'image'];
  static values = { hash: String };

  connect() {
    // Decode and render blurhash to canvas
    const pixels = decode(this.hashValue, 32, 32);
    const ctx = this.canvasTarget.getContext('2d');
    const imageData = ctx.createImageData(32, 32);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    
    // Start loading actual image
    this.imageTarget.src = this.imageTarget.dataset.src;
  }

  reveal() {
    this.canvasTarget.classList.add('hidden');
    this.imageTarget.classList.remove('hidden');
  }
}
```
