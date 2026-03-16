---
title: Turbo Streams - Custom Stream Actions
date: 2023-08-15
categories:
- Turbo Streams
tags:
- turbo-streams
- custom-actions
- animations
- rails
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Custom Action Implementation](#custom-action-implementation)
  - [Basic Custom Action](#basic-custom-action)
  - [Sequential Animations with Async/Await](#sequential-animations-with-asyncawait)
  - [Client-Side Stream Execution](#client-side-stream-execution)
- [Rails Integration](#rails-integration)
- [Pattern Card: Custom Stream Actions](#pattern-card-custom-stream-actions)


## Overview

Turbo Streams provide 7 default actions (append, prepend, replace, update, remove, before, after) that handle most reactivity needs. When these become verbose or insufficient, Turbo allows implementing custom stream actions to orchestrate complex UI behaviors and animations.

## Custom Action Implementation

Custom stream actions are defined on the `StreamActions` object. Within a custom action function, `this` refers to the `<turbo-stream>` element, allowing access to attributes like `target` and `targets`.

### Basic Custom Action

```js
// <turbo-stream action="showDialog" target="#a-dom-id"></turbo-stream>
StreamActions.showDialog = function () {
  document.querySelector(this.getAttribute('target')).show();
};
```

### Sequential Animations with Async/Await

Custom actions can use async/await to orchestrate sequential animations:

```js
// <turbo-stream action="startAnimationCascade" targets="some valid CSS selector"></turbo-stream>
StreamActions.startAnimationCascade = async function () {
  const elements = document.querySelectorAll(this.getAttribute('targets'));

  for (const element of elements) {
    element.setAttribute('play', '');

    await delay(250);
  }
};
```

Note: Sequential animations can also be accomplished using recursive `setTimeouts` as an alternative to promises.

### Client-Side Stream Execution

Custom stream actions can be triggered client-side by inserting `<turbo-stream>` elements into the DOM. Turbo will automatically parse and execute them:

```js
document.querySelector('#open-button').addEventListener('click', (event) => {
  const showActionClone = document
    .querySelector('#show-action-template')
    .content.cloneNode(true);
  document.body.appendChild(showActionClone);
});
```

Using templates to store stream tags:

```html
<template id="show-action-template">
  <turbo-stream action="showDialog" target="#dialog"></turbo-stream>
</template>
```

## Rails Integration

In Rails applications using Turbo Stream ERB templates, custom actions can be rendered directly from server responses:

```erb
<!-- app/views/items/show.turbo_stream.erb -->
<%= turbo_stream.action "showDialog", target: "#dialog" %>

<%= turbo_stream.action "startAnimationCascade", targets: "#toolbar sl-animation" %>
```

Custom actions can be combined with standard Turbo Stream actions in the same response:

```erb
<%= turbo_stream.append "items", partial: "item", locals: { item: @item } %>
<%= turbo_stream.action "highlightNewItem", target: "#item_#{@item.id}" %>
```

Define custom actions in your JavaScript application pack or Stimulus controllers:

```js
// app/javascript/application.js
import { StreamActions } from "@hotwired/turbo"

StreamActions.showDialog = function () {
  const target = this.getAttribute('target')
  document.querySelector(target)?.show()
}

StreamActions.highlightNewItem = function () {
  const element = document.querySelector(this.getAttribute('target'))
  element?.classList.add('highlight')
  setTimeout(() => element?.classList.remove('highlight'), 2000)
}
```

Custom actions are particularly useful for orchestrating complex UI animations and behaviors that would otherwise require multiple standard stream actions or client-side JavaScript coordination.


## Pattern Card: Custom Stream Actions

**When to use**: Complex UI behaviors that aren't covered by the 7 default actions (append, prepend, replace, update, remove, before, after).

**GOOD - Define custom action on StreamActions**:

```javascript
import { StreamActions } from "@hotwired/turbo"

// Show a dialog
StreamActions.showDialog = function() {
  const target = this.getAttribute('target');
  document.querySelector(target)?.showModal();
};

// Highlight an element temporarily
StreamActions.highlight = function() {
  const element = document.querySelector(this.getAttribute('target'));
  element?.classList.add('highlight');
  setTimeout(() => element?.classList.remove('highlight'), 2000);
};

// Sequential animation cascade
StreamActions.animateCascade = async function() {
  const elements = document.querySelectorAll(this.getAttribute('targets'));
  for (const element of elements) {
    element.classList.add('animate');
    await new Promise(r => setTimeout(r, 250));
  }
};
```

**Rails ERB usage**:

```erb
<%# app/views/items/create.turbo_stream.erb %>
<%= turbo_stream.append "items", partial: "item", locals: { item: @item } %>
<%= turbo_stream.action "highlight", target: "#item_#{@item.id}" %>
<%= turbo_stream.action "showDialog", target: "#success-dialog" %>
```

**BAD - Inline JavaScript in stream responses**:

```erb
<%# Don't embed scripts in streams %>
<script>document.querySelector('#dialog').showModal()</script>
```
