---
title: Turbo Frames - Inline Edit
date: 2024-02-27
categories:
- Turbo Frames
tags:
- Inline Editing
- "turbo:frame-render"
- Form Submission
- State Management
- Cookies
- PATCH
- autofocus
- focusout
description: Implement inline editing with Turbo Frames, form submission, and state persistence using cookies
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Form Structure](#form-structure)
  - [Event Handling](#event-handling)
  - [State Persistence](#state-persistence)
- [Pattern Card: Inline Editing](#pattern-card-inline-editing)


## Overview

Inline editing with Turbo Frames allows users to edit content directly in place. The pattern uses Turbo Frames to swap between a display view (link) and an edit view (form), with state persistence via cookies.

## Implementation

### Form Structure

The form is wrapped in a Turbo Frame and uses a PATCH method to submit updates:

```html
<turbo-frame id="plain-edit">
  <form action="/title" method="patch">
    <input
      autofocus="autofocus"
      type="text"
      value="{{title}}"
      name="post[title]"
      id="post_title"
    />
  </form>
</turbo-frame>
```

The `autofocus` attribute automatically focuses the input when the form is rendered.

### Event Handling

Because the input element only appears after the Turbo Frame is re-rendered, event listeners must be attached using the `turbo:frame-render` event:

```js
document.addEventListener('turbo:frame-render', () => {
  document.querySelector('#post_title')?.addEventListener('focusout', (e) => {
    e.target.closest('form').requestSubmit();
  });

  document.querySelector('#post_title')?.select();
});
```

This implementation:
- Selects all text when the form is activated using the `select()` method
- Submits the form on focusout (when clicking outside the input) using `requestSubmit()`

### State Persistence

To maintain editing state across page refreshes, use cookies:
- Set `editState` cookie to `true` when activating edit mode
- Set `editState` cookie to `false` when deactivating
- On page load, check the cookie value and redirect to the form route if `editState` is `true`

In Rails, use `ActionDispatch::Cookies` for cookie management.


## Pattern Card: Inline Editing

**When to use**: Edit content in place without navigating to a separate edit page.

**GOOD - Turbo Frame swap between display and edit views**:

```html
<!-- Display view -->
<turbo-frame id="title-editor">
  <a href="/posts/1/edit_title">
    <%= @post.title %>
  </a>
</turbo-frame>

<!-- Edit view (returned by /posts/1/edit_title) -->
<turbo-frame id="title-editor">
  <form action="/posts/1/title" method="patch">
    <input type="text" name="post[title]" value="<%= @post.title %>" 
           autofocus id="post_title">
  </form>
</turbo-frame>
```

```javascript
// Auto-submit on blur and select text on focus
document.addEventListener('turbo:frame-render', () => {
  const input = document.querySelector('#post_title');
  if (!input) return;
  
  input.select(); // Select all text for easy replacement
  
  input.addEventListener('focusout', (e) => {
    e.target.closest('form').requestSubmit();
  });
});
```

**BAD - Inline editing without proper focus management**:

```javascript
// Don't forget to handle focus and selection
document.addEventListener('turbo:frame-render', () => {
  // Missing: text selection, auto-submit on blur
});
```
