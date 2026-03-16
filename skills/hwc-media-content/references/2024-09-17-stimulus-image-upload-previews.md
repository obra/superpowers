---
title: Stimulus - Image Upload Previews with `URL.createObjectURL`
date: 2024-09-17
categories:
- Stimulus
tags:
- file-upload
- blob-urls
- image-previews
- file-api
free: false
ready: true
description: Create client-side previews of files using URL.createObjectURL
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML Structure](#html-structure)
  - [Stimulus Controller](#stimulus-controller)
- [Key Concepts](#key-concepts)
- [Pattern Card: Image Upload Previews](#pattern-card-image-upload-previews)


## Overview

Display image previews before upload starts using JavaScript blob URLs created with `URL.createObjectURL`. This provides immediate visual feedback when users select files.

## Implementation

### HTML Structure

The file input, preview template, and preview container are wrapped in a div with the `file-preview` Stimulus controller:

```html
<div data-controller="file-preview">
  <input
    type="file"
    name="file"
    accept="image/*"
    multiple
    data-action="change->file-preview#appendPreviews"
  />

  <template
    id="preview-template"
    data-file-preview-target="previewTemplate"
  >
    <li>
      <figure>
        <img alt="${caption}" class="thumbnail" />
        <figcaption>${caption}</figcaption>
      </figure>
    </li>
  </template>

  <ul data-file-preview-target="previews"></ul>
</div>
```

### Stimulus Controller

The controller creates blob URLs for each selected file and appends preview elements to the DOM:

```js
import { Controller } from '@hotwired/stimulus';
import { fill } from '@domchristie/composite';

export default class extends Controller {
  static targets = ['previews', 'previewTemplate'];

  appendPreviews(event) {
    for (const file of event.target.files) {
      const objectUrl = URL.createObjectURL(file);

      const html = fill(this.previewTemplateTarget, {
        caption: `${file.name} - ${file.size} bytes`,
      });

      const template = document.createElement('template');
      template.innerHTML = html;

      const image = template.content.querySelector('img');

      image.src = objectUrl;
      image.onload = () => {
        URL.revokeObjectURL(image.src);
      };

      this.previewsTarget.appendChild(template.content.cloneNode(true));
    }
  }
}
```

## Key Concepts

1. **Blob URL Creation**: `URL.createObjectURL(file)` creates a temporary URL representing the file in memory, allowing immediate preview without server upload.

2. **Template Cloning**: The preview template is cloned and filled with file metadata (name and size) using the `fill` function from `@domchristie/composite`.

3. **Memory Management**: `URL.revokeObjectURL()` is called in the image's `onload` handler to release the blob URL from memory after the image loads.

4. **Event Binding**: The `change` event on the file input triggers `appendPreviews`, which processes all selected files in the `event.target.files` collection.


## Pattern Card: Image Upload Previews

**When to use**: Show image previews immediately after file selection, before upload.

**GOOD - Blob URLs with proper cleanup**:

```html
<div data-controller="file-preview">
  <input type="file" accept="image/*" multiple
         data-action="change->file-preview#preview">
  
  <template data-file-preview-target="template">
    <li>
      <img class="thumbnail">
      <span class="filename"></span>
    </li>
  </template>
  
  <ul data-file-preview-target="list"></ul>
</div>
```

```javascript
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['template', 'list'];

  preview(event) {
    for (const file of event.target.files) {
      const url = URL.createObjectURL(file);
      const clone = this.templateTarget.content.cloneNode(true);
      
      const img = clone.querySelector('img');
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url); // Clean up!
      
      clone.querySelector('.filename').textContent = file.name;
      this.listTarget.appendChild(clone);
    }
  }
}
```

**BAD - No blob URL cleanup (memory leak)**:

```javascript
preview(event) {
  for (const file of event.target.files) {
    const url = URL.createObjectURL(file);
    img.src = url; // Memory leak! URL never revoked
  }
}
```
