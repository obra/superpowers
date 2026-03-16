---
title: Optimistic UI with Turbo 8 Morphs
date: 2024-03-26
categories:
- Turbo Drive
tags:
- Morphing
- Optimistic UI
- refresh
- Turbo Streams
- Turbo Drive
description: Provide Optimistic UI updates using inline Turbo Stream Actions, and reconcile using Turbo 8 Morphs
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML Structure](#html-structure)
  - [Rails Controller](#rails-controller)
  - [JavaScript Event Listener](#javascript-event-listener)
  - [Reconciliation with Turbo 8 Morphs](#reconciliation-with-turbo-8-morphs)
- [Important Notes](#important-notes)
- [Pattern Card: Optimistic UI with Turbo 8 Morphs](#pattern-card-optimistic-ui-with-turbo-8-morphs)


## Overview

Server-side rendering with Turbo reduces complexity but introduces latency. Network round-trips plus server processing time can exceed 100ms, making interactions feel sluggish. Optimistic UI updates the interface immediately based on expected outcomes, then reconciles with server state using Turbo 8 morphs.

## Implementation

### HTML Structure

Include a `<template>` tag within the form containing a Turbo Stream action with the optimistic state:

```html
<form
  method="post"
  action="/favorites"
  class="relative text-lg font-semibold text-white"
  data-optimistic-form
>
  <template
    class="optimistic-template"
    id="optimistic-template"
  >
    <turbo-stream
      action="replace"
      target="favorite-form-button"
    >
      <template>
        <button
          type="submit"
          id="favorite-form-button"
          disabled
        >
          <%= render partial: "heart_icon", locals: { filled: !@favorite } %>
        </button>
      </template>
    </turbo-stream>
  </template>
  <button type="submit" id="favorite-form-button">
    <%= render partial: "heart_icon", locals: { filled: @favorite } %>
  </button>
  <%= hidden_field_tag :authenticity_token, form_authenticity_token %>
</form>
```

### Rails Controller

```ruby
class FavoritesController < ApplicationController
  def index
    @favorite = current_user.favorited?(params[:item_id])
  end

  def create
    sleep(2) # Simulate latency
    
    @favorite = current_user.toggle_favorite(params[:item_id])
    
    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.refresh
      end
    end
  end
end
```

The controller toggles the favorite state and broadcasts a refresh. Turbo 8 morphs will automatically update both the button and the optimistic template content to match the server state.

### JavaScript Event Listener

Listen for `turbo:submit-start` to clone and execute the optimistic template:

```js
document
  .querySelectorAll('form[data-optimistic-form]')
  .forEach((formElement) => {
    formElement.addEventListener('turbo:submit-start', (e) => {
      const template = e.target.querySelector('template.optimistic-template');
      const templateClone = template.content.cloneNode(true);

      document.body.appendChild(templateClone);
    });
  });
```

When the form submission starts, the template is cloned and appended to the body. Turbo automatically executes the Turbo Stream action, updating the UI immediately.

### Reconciliation with Turbo 8 Morphs

If the server action fails or needs to reconcile state, broadcast a `refresh` action. Turbo 8 morphs will reconcile the DOM to match server state. Use `broadcast_refreshes` in Rails:

```ruby
# In your model or job
Turbo::StreamsChannel.broadcast_refresh_to("favorites")
```

## Important Notes

- The optimistic template should contain the inverse state (if currently favorited, show unfavorited state).
- Provide user feedback (flash messages) when reconciliation occurs or errors happen.
- Turbo 8 morphs will automatically update the optimistic template content during refresh, preparing it for the next optimistic update.


## Pattern Card: Optimistic UI with Turbo 8 Morphs

**When to use**: Immediate feedback for actions like favorites, likes, or toggles where latency would feel sluggish.

**GOOD - Template-based optimistic updates**:

```html
<form method="post" action="/favorites" data-optimistic-form>
  <template class="optimistic-template">
    <turbo-stream action="replace" target="favorite-btn">
      <template>
        <button id="favorite-btn" disabled>
          <!-- Inverse state (optimistic) -->
          <svg class="heart-filled">...</svg>
        </button>
      </template>
    </turbo-stream>
  </template>
  
  <button type="submit" id="favorite-btn">
    <svg class="heart-empty">...</svg>
  </button>
</form>
```

```javascript
document.querySelectorAll('form[data-optimistic-form]').forEach((form) => {
  form.addEventListener('turbo:submit-start', (e) => {
    const template = e.target.querySelector('template.optimistic-template');
    document.body.appendChild(template.content.cloneNode(true));
  });
});
```

**Rails controller with morph reconciliation**:

```ruby
def create
  @favorite = current_user.toggle_favorite(params[:item_id])
  
  respond_to do |format|
    format.turbo_stream { render turbo_stream: turbo_stream.refresh }
  end
end
```

**BAD - Client-side state without reconciliation**:

```javascript
// Don't manage state purely client-side
button.addEventListener('click', () => {
  button.classList.toggle('favorited'); // No server reconciliation!
});
```
