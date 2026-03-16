---
title: Turbo Streams - List Animations Using the View Transitions API
date: 2025-06-10
categories:
- Turbo Streams
tags:
- View Transitions
- turbo-streams
- turbo:before-stream-render
- view-transitions-api
- animations
free: true
ready: true
description: Create list animations using Turbo Streams and the View Transitions API
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [JavaScript](#javascript)
  - [CSS](#css)
  - [Rails Controller](#rails-controller)
  - [Rails View Template](#rails-view-template)
  - [Rails Partial](#rails-partial)
  - [Turbo Stream Template](#turbo-stream-template)
- [Important Notes](#important-notes)
- [Pattern Card: List Animations with View Transitions](#pattern-card-list-animations-with-view-transitions)


## Overview

The View Transitions API can be used with Turbo Streams to animate list items when they are appended via `<turbo-stream action="append">`. This is useful for implementing smooth animations when loading more items into a list.

## Implementation

Turbo Streams fire a `turbo:before-stream-render` event that allows customizing the render method. Override the original render method and wrap it in `document.startViewTransition` to enable view transitions.

### JavaScript

```js
document.addEventListener('turbo:before-stream-render', function (event) {
  if (
    document.startViewTransition &&
    event.detail.newStream.target === 'tickets'
  ) {
    const originalRender = event.detail.render;
    event.detail.render = (newStream) => {
      document.startViewTransition(() => originalRender(newStream));
      document
        .querySelector('#tickets')
        .lastElementChild.classList.remove('new-ticket');
    };
  }
});
```

The `turbo:before-stream-render` event provides access to override the default render mechanism. Unlike `turbo:before-render`, it provides a reference to the Turbo Stream element being executed rather than old and new DOM nodes.

Wrap the original render method in `document.startViewTransition` to trigger the view transition. The newly appended element with the `new-ticket` CSS class will automatically trigger the specified animation. Remove the class after the transition completes to make the action idempotent.

### CSS

Define a view transition animation in your stylesheet:

```css
::view-transition-new(new-ticket) {
  animation: slide-in-from-right 0.3s ease-out;
}

@keyframes slide-in-from-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Rails Controller

```ruby
class TicketsController < ApplicationController
  def index
    @tickets = Ticket.limit(10)
  end

  def load_more
    @tickets = Ticket.offset(params[:offset].to_i).limit(10)
    
    respond_to do |format|
      format.turbo_stream
    end
  end
end
```

### Rails View Template

`app/views/tickets/index.html.erb`:

```erb
<div class="grid grid-cols-1 gap-4" id="tickets">
  <%= render @tickets %>
</div>

<div class="flex justify-center">
  <%= form_with url: load_more_tickets_path, method: :post, local: true do |f| %>
    <%= f.hidden_field :offset, value: @tickets.count %>
    <%= f.submit "Load more", class: "inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500" %>
  <% end %>
</div>
```

### Rails Partial

`app/views/tickets/_ticket.html.erb`:

```erb
<div class="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white <%= 'new-ticket' if local_assigns[:new_ticket] %>">
  <div class="flex flex-1 flex-col space-y-2 p-4">
    <h3 class="text-base font-medium text-gray-900">
      <%= link_to ticket.title, ticket_path(ticket) %>
    </h3>
    <p class="text-sm text-gray-500"><%= ticket.description %></p>
  </div>
</div>
```

### Turbo Stream Template

`app/views/tickets/load_more.turbo_stream.erb`:

```erb
<%= turbo_stream.append "tickets" do %>
  <%= render partial: "ticket", collection: @tickets, locals: { new_ticket: true } %>
<% end %>
```

## Important Notes

- A `view-transition-name` must be unique across all elements on a page
- The `turbo:before-stream-render` event provides `event.detail.newStream` which contains the Turbo Stream element being executed
- Remove the animation class after the transition completes to prevent the animation from triggering on subsequent renders


## Pattern Card: List Animations with View Transitions

**When to use**: Animate items being added to lists via Turbo Streams.

**GOOD - Wrap stream render in View Transition**:

```javascript
document.addEventListener('turbo:before-stream-render', (event) => {
  if (event.target.action === 'append') {
    event.preventDefault();
    
    document.startViewTransition(() => {
      event.target.performAction();
    });
  }
});
```

```css
/* Animate new items */
@keyframes slide-in {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

::view-transition-new(list-item) {
  animation: slide-in 0.3s ease-out;
}
```
