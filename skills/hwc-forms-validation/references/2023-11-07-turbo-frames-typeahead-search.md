---
title: Turbo Frames - Typeahead Search
date: 2023-11-07
categories:
- Turbo Frames
tags:
- Rendering
- "turbo:before-frame-render"
- Typeahead
- Search
- Event Handling
- Frame Lifecycle
description: Update filter results using eager loading Turbo Frames.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Filtering and Updating the Results Frame](#filtering-and-updating-the-results-frame)
  - [Highlighting the Query in the Results](#highlighting-the-query-in-the-results)
- [Important Notes](#important-notes)
- [Code Example](#code-example)
- [Pattern Card: Typeahead Search](#pattern-card-typeahead-search)


## Overview
Turbo Frames enable view decomposition, making it easy to update parts of a view reactively to user input. Typeahead search is a common use case where a Turbo Frame displays filtered results based on user input.

## Implementation

### Filtering and Updating the Results Frame
Listen for the `keyup` event on the query input and update the Turbo Frame's `src` attribute with the input value as a query parameter. Use `encodeURIComponent()` to ensure URL-safe characters.

In production, add client-side debouncing to the `keyup` event and perform input sanitization on the backend.

### Highlighting the Query in the Results
Listen for the `turbo:before-frame-render` event to pause rendering. Access the new frame's HTML via `event.detail.newFrame.innerHTML`. Use a regular expression with a capture group to wrap every occurrence of the query string with `<em>` tags, then call `event.detail.resume()` to continue rendering.

## Important Notes
- When setting the Turbo Frame's `src` attribute, use only URL-safe characters (use `encodeURIComponent()`)
- Use Turbo Frame render pause/resuming to modify content before it's rendered

## Code Example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Hotwire Starter</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="styles.css" />

    <script type="importmap" data-turbo-track="reload">
      {
        "imports": {
          "@hotwired/turbo": "https://ga.jspm.io/npm:@hotwired/turbo@7.3.0/dist/turbo.es2017-esm.js",
          "@hotwired/stimulus": "https://ga.jspm.io/npm:@hotwired/stimulus@3.2.1/dist/stimulus.js",
          "app": "/app.js",
          "controllers": "/controllers/index.js",
          "controllers/application": "/controllers/application.js",
          "controllers/": "/controllers/"
        }
      }
    </script>

    <script
      async
      src="https://ga.jspm.io/npm:es-module-shims@1.5.1/dist/es-module-shims.js"
      crossorigin="anonymous"
      data-turbo-track="reload"
    ></script>

    <script type="module">
      import 'app';
    </script>
  </head>
  <body>
    <h1>Books</h1>

    <search role="search">
      <label>
        Filter your query
        <input type="search" id="query" />
      </label>

      <section>
        <h3>Results:</h3>
        <turbo-frame id="results" src="/results"> Loading ... </turbo-frame>
      </section>
    </search>
  </body>
</html>
```

```js
document.querySelector('#query').addEventListener('keyup', (event) => {
  document.querySelector('#results').src = `/results?query=${encodeURIComponent(
    event.target.value
  )}`;
});

document.addEventListener('turbo:before-frame-render', (event) => {
  event.preventDefault();

  const newHTML = event.detail.newFrame.innerHTML;

  const query = document.querySelector('#query').value;
  if (!!query) {
    event.detail.newFrame.innerHTML = newHTML.replace(
      new RegExp(`(${query})`, 'ig'),
      '<em>$1</em>'
    );
  }

  event.detail.resume();
});
```


## Pattern Card: Typeahead Search

**When to use**: Filter results as user types in a search field.

**GOOD - Debounced form submission with Turbo Frame**:

```html
<form action="/search" data-controller="debounce" data-turbo-frame="results">
  <input type="search" name="q" 
         data-action="input->debounce#perform"
         data-debounce-wait-value="300">
</form>

<turbo-frame id="results">
  <!-- Search results rendered here -->
</turbo-frame>
```

```javascript
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { wait: { type: Number, default: 300 } };
  
  perform() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.element.requestSubmit();
    }, this.waitValue);
  }
}
```

**BAD - No debouncing (fires on every keystroke)**:

```html
<!-- Don't submit on every input event -->
<form data-action="input->form#submit">
  <input type="search" name="q"> <!-- Too many requests! -->
</form>
```
