---
title: Turbo Streams - Inline Stream Tags
date: 2023-08-01
categories:
- Turbo Streams
tags:
- turbo-streams
- client-side
- optimistic-ui
- templates
- dom-manipulation
description: Use inline Turbo Stream tags for client-side DOM updates without server communication.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Constructing the Turbo Stream Tag](#constructing-the-turbo-stream-tag)
  - [Cloning and Inserting Template Content](#cloning-and-inserting-template-content)
- [Key Points](#key-points)
- [Pattern Card: Inline Stream Tags (Client-Side)](#pattern-card-inline-stream-tags-client-side)


## Overview

Turbo will parse and execute any `<turbo-stream>` element that is added to the DOM at any time, not just from WebSocket, SSE, or form submissions. This enables using Turbo Streams in pure client-side scenarios for optimistic UI updates and microinteractions.

## Implementation

### Constructing the Turbo Stream Tag

The `<turbo-stream>` element must:
1. Target the element it should replace using the `target` attribute
2. Be placed inside a `<template>` element to prevent immediate parsing and execution

Template elements are inert until cloned and their content is inserted into the DOM.

```html
<body>
    <div class="container">
      <sl-button id="start-button">Click to start</sl-button>
      <sl-progress-bar
        value="0"
        label="Progress"
        id="progress-bar"
      ></sl-progress-bar>
    </div>

    <template id="turbo-stream-template">
      <turbo-stream action="replace" target="progress-bar">
        <template>
          <sl-progress-bar label="Progress" id="progress-bar"></sl-progress-bar>
        </template>
      </turbo-stream>
    </template>
  </body>
```

### Cloning and Inserting Template Content

Clone the template's content, modify the inner elements, then append to the DOM. Turbo will execute the stream action and remove the element automatically.

```js
document.querySelector('#start-button').addEventListener('click', (event) => {
  let percentage = 1;

  const interval = setInterval(() => {
    if (percentage <= 100) {
      const templateClone = document
        .querySelector('#turbo-stream-template')
        .content.cloneNode(true);

      templateClone
        .querySelector('template')
        .content.querySelector('sl-progress-bar')
        .setAttribute('value', percentage);
      document.body.appendChild(templateClone);

      percentage += 1;
    } else {
      percentage = 1;
      clearInterval(interval);
    }
  }, 50);
});
```

## Key Points

- Turbo Stream elements can be used client-side by inserting them into the DOM
- Template elements prevent immediate execution until cloned
- The stream element can be appended anywhere in the document; Turbo will execute it and remove it
- This technique is useful for optimistic UI patterns and client-side microinteractions


## Pattern Card: Inline Stream Tags (Client-Side)

**When to use**: Optimistic UI updates or microinteractions without server communication.

**GOOD - Template-based client-side streams**:

```html
<template id="progress-stream">
  <turbo-stream action="replace" target="progress-bar">
    <template>
      <progress id="progress-bar" value="0" max="100"></progress>
    </template>
  </turbo-stream>
</template>

<button id="start">Start</button>
<progress id="progress-bar" value="0" max="100"></progress>
```

```javascript
document.querySelector('#start').addEventListener('click', () => {
  let value = 0;
  const interval = setInterval(() => {
    if (value >= 100) return clearInterval(interval);
    
    value += 5;
    const clone = document.querySelector('#progress-stream')
      .content.cloneNode(true);
    clone.querySelector('progress').value = value;
    document.body.appendChild(clone); // Turbo executes and removes it
  }, 100);
});
```

**Key insight**: Turbo automatically executes and removes any `<turbo-stream>` element added to the DOM.
