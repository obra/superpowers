---
title: Turbo Frames - Swiper with Autoplay and View Transitions
date: 2025-01-14
categories:
- Turbo Frames
tags:
- View Transitions
- "turbo:before-frame-render"
- "turbo:frame-load"
- Turbo Frames
- Autoplay
free: false
ready: true
description: Create an autoplaying swiper using view transitions and Turbo Frames
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML Structure](#html-structure)
  - [Server-Side Implementation](#server-side-implementation)
  - [JavaScript Implementation](#javascript-implementation)
- [Key Points](#key-points)


## Overview

Create an autoplaying image swiper embedded in a Turbo Frame using the View Transitions API. Unlike full page navigations, Turbo Frame navigations don't automatically trigger view transitions, so `document.startViewTransition` must be used manually.

## Implementation

### HTML Structure

A single Turbo Frame points to a route returning a slide containing an image:

```html
<body>
  <main>
    <turbo-frame id="swiper" src="/slide/1000"></turbo-frame>
  </main>
</body>
```

### Server-Side Implementation

The server returns a slide with a `data-next` attribute indicating the next slide ID. The slide IDs loop through an array:

```ruby
# config/routes.rb
Rails.application.routes.draw do
  get '/slide/:id', to: 'slides#show'
end

# app/controllers/slides_controller.rb
class SlidesController < ApplicationController
  SLIDE_IDS = [1000, 1001, 1002, 1011].freeze

  def show
    @current_id = params[:id].to_i
    current_index = SLIDE_IDS.index(@current_id)
    next_index = current_index == SLIDE_IDS.length - 1 ? 0 : current_index + 1
    @next_id = SLIDE_IDS[next_index]
  end
end
```

```erb
<!-- app/views/slides/show.html.erb -->
<turbo-frame id="swiper">
  <article data-next="<%= @next_id %>">
    <img
      src="https://picsum.photos/id/<%= @current_id %>/600/400"
      width="600"
      height="400"
    />
  </article>
</turbo-frame>
```

### JavaScript Implementation

The autoplay feature uses `setTimeout` triggered on `turbo:frame-load`. View transitions are enabled by intercepting `turbo:before-frame-render` and wrapping the render function with `document.startViewTransition`:

```js
import '@hotwired/turbo';
import 'controllers';

Turbo.start();

document
  .querySelector('#swiper')
  .addEventListener('turbo:frame-load', (event) => {
    setTimeout(() => {
      const nextId = event.target.querySelector('article').dataset.next;
      event.target.src = `/slide/${nextId}`;
    }, 5000);
  });

document
  .querySelector('#swiper')
  .addEventListener('turbo:before-frame-render', (event) => {
    if (document.startViewTransition) {
      const originalRender = event.detail.render;
      event.detail.render = (currentElement, newElement) => {
        document.startViewTransition(() =>
          originalRender(currentElement, newElement)
        );
      };
    }
  });
```

## Key Points

1. **Manual view transitions**: Turbo Frames don't trigger automatic view transitions because they're not full page navigations. Use `document.startViewTransition` to manually start a same-document transition.

2. **Render interception**: Store a reference to the original render method from `event.detail.render`, then override it with a function that wraps the original render call in `document.startViewTransition`.

3. **Autoplay mechanism**: Use `turbo:frame-load` to detect when a frame loads, then use `setTimeout` to automatically navigate to the next slide after a delay.

4. **Next slide reference**: The server includes a `data-next` attribute on each slide's article element, allowing the client to determine the next slide ID without additional requests.
