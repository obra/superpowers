---
title: Turbo Drive - Use ULIDs for Optimistic UI
date: 2024-08-13
categories:
- Turbo Drive
tags:
- Optimistic UI
- "turbo:submit-start"
- ULID
- Turbo Streams
- Form Submission
ready: true
description: Render deterministic optimistic UI elements using client-side ULIDs
---

## Overview

ULIDs (Universally Unique Lexicographically Sortable Identifiers) enable generating valid IDs client-side before form submission. The first 48 bits represent the current timestamp, making them sortable like regular integers and collision-free.

## Implementation

Use the `turbo:submit-start` event to generate a ULID and append it to the form data before submission. The form should include a Turbo Stream template for optimistic rendering.

### HTML Structure

```html
<form method="post" action="/" data-optimistic-form>
  <template data-optimistic-template>
    <turbo-stream action="append" target="todos">
      <template>
        <li id="todo-${id}">${title} (ulid: ${id})</li>
      </template>
    </turbo-stream>
  </template>

  <input
    type="text"
    name="todo[title]"
    placeholder="What needs to be done?"
    autocomplete="off"
  />
  <input type="submit" name="submit" value="Add" />
</form>
<ul id="todos">
  ${todos}
</ul>
```

### JavaScript Implementation

```js
import '@hotwired/turbo';
import 'controllers';
import { fill } from '@domchristie/composite';
import { ulid } from 'ulid';

Turbo.start();

document.addEventListener('turbo:load', () => {
  document
    .querySelectorAll('form[data-optimistic-form]')
    .forEach((formElement) => {
      formElement.addEventListener('turbo:submit-start', (e) => {
        const formBody = e.detail.formSubmission.fetchRequest.fetchOptions.body;

        const id = ulid();

        // body is a URLSearchParam instance
        formBody.append('todo[id]', id);

        const title = formBody.get('todo[title]');

        const template = e.target.querySelector(
          'template[data-optimistic-template]'
        );

        document.body.insertAdjacentHTML(
          'beforeend',
          fill(template, { id, title })
        );
      });
    });
});
```

## Key Points

1. **Accessing Form Body**: The form body is available via `e.detail.formSubmission.fetchRequest.fetchOptions.body` in the `turbo:submit-start` event handler.

2. **ULID Generation**: Generate a ULID client-side using the `ulid` library and append it to the form body before submission.

3. **Optimistic Rendering**: Use a `<template>` tag with `data-optimistic-template` containing a Turbo Stream action. Render it client-side using template filling and insert it into the document. Turbo will execute the stream action automatically.

4. **Server Response**: The server should accept the ULID from the form data and use it when creating the record, ensuring the optimistic UI matches the server response.
