---
title: Turbo Frames - Markdown Preview
date: '2024-10-08'
tags:
- form submission
- turbo-frames
- markdown
- preview
- data-turbo-permanent
description: Typeahead previews of markdown by simple Turbo Frame rerendering
free: false
ready: true
---

## Overview

A markdown editor with live preview can be implemented using a single Turbo Frame wrapping a form. The solution requires:
- A textarea that accepts markdown
- A preview area that shows rendered markdown as you type
- Automatic saving of changes

## Implementation

Wrap the form containing the textarea in a Turbo Frame. Below the form, include an `<article>` tag with a placeholder for rendered markdown content that will be filled by the server.

On the server side, when the form is submitted, transform the markdown into HTML markup (using a library like `marked` in JavaScript or `kramdown` in Ruby). Store the result and issue a 303 redirect response back to the same route.

## Code

```html
<body>
  <h1>Markdown Editor</h1>
  <turbo-frame id="wrapper">
    <form action="/" method="POST">
      <textarea
        name="editor"
        cols="40"
        rows="10"
        data-turbo-permanent
        id="editor"
      ></textarea>
    </form>

    <article id="preview">{content}</article>
  </turbo-frame>
</body>
```

```js
import '@hotwired/turbo';
import 'controllers';

Turbo.start();

document.querySelector('textarea#editor').addEventListener('input', (event) => {
  event.target.closest('form').requestSubmit();
});
```

## Key Points

- Listen for `input` events on the textarea and call `requestSubmit()` on the enclosing form to trigger a POST request that rerenders the Turbo Frame.
- The `data-turbo-permanent` attribute on the textarea is crucial. Turbo preserves elements with this attribute during frame updates, maintaining focus and allowing uninterrupted typing.
- Without the Turbo Frame wrapper, the entire page would reload on form submission, disrupting the editing experience.
