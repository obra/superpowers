---
title: Turbo Drive - Swiper-like View Transitions
date: '2024-11-19'
tags:
- View Transitions
- Turbo Drive
- Render Interception
- Animations
free: false
ready: true
description: Use the View Transitions API with Turbo Drive to create swiper-like animations for image galleries
---

## Overview

Turbo 8 has built-in support for the View Transitions API. Use render interception to create directional swiper-like animations when navigating through pages.

## Implementation

### HTML Structure

Navigation links use `aria-label` attributes to indicate direction:

```html
<body>
  <main>
    <a href="/page2.html" aria-label="Next">
      <sl-icon-button name="arrow-right" label="Next"></sl-icon-button>
    </a>

    <sl-card>
      <img
        slot="image"
        src="https://picsum.photos/id/1000/600/400"
        width="600"
        height="400"
      />
      <strong>Summit</strong>
      <p>Stand on top of the world</p>
    </sl-card>
  </main>
</body>
```

### CSS View Transitions

Configure a custom view transition named `swiper` for the card element. Define animations for swiping old content out and new content in from left or right. Apply these animations to `::view-transition-old` and `::view-transition-new` based on a `data-direction` attribute on the `html` root element.

### JavaScript Implementation

Use Turbo events to detect navigation direction and apply the appropriate transition:

```js
import '@hotwired/turbo';

document.addEventListener('turbo:click', (event) => {
  window.transitionInitiator = event.target;
});

document.addEventListener('turbo:before-render', (event) => {
  event.preventDefault();

  switch (window.transitionInitiator?.ariaLabel) {
    case 'Previous':
      document.documentElement.dataset.direction = 'prev';
      break;
    case 'Next':
      document.documentElement.dataset.direction = 'next';
      break;
  }

  delete window.transitionInitiator;

  event.detail.resume();
});

document.addEventListener('turbo:load', (event) => {
  delete document.documentElement.dataset.direction;
});
```

## Key Points

1. **Register the transition initiator**: Capture the clicked element in `turbo:click` event and store it in a temporary variable.

2. **Apply direction attribute**: In `turbo:before-render`, check the `aria-label` of the stored initiator element and set `data-direction` on the `html` root element. Clean up the temporary variable before resuming rendering.

3. **Clean up after transition**: Remove the `data-direction` attribute in `turbo:load` to prevent it from being cached by Turbo, which would cause incorrect transitions on subsequent navigations.

The `turbo:before-render` event does not contain a reference to the clicked link, so storing the initiator in `turbo:click` is necessary. Cleanup is essential to prevent the direction from spilling over to subsequent navigations.

