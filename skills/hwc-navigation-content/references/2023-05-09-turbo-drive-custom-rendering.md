---
title: Turbo Drive - Custom Rendering
date: 2023-05-09
categories:
- Turbo Drive
tags:
- Rendering
- "turbo:before-render"
- turbo-drive
- custom-rendering
- morphdom
ready: true
description: Completely customize Turbo Drive's rendering process.
free: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
- [Example: Image Transition with Navigation Swap](#example-image-transition-with-navigation-swap)
- [Important Considerations](#important-considerations)


## Overview

Turbo Drive exposes a `render` method that can be overwritten in the `turbo:before-render` event. Using the current and new body element, you can provide a custom transition between pages.

The default Turbo Drive rendering process works as follows:

1. Check if the requested page will render (generally true, except for redirects)
2. Replace the body while preserving permanent elements
3. Activate the new body by adopting it into the DOM using `document.adoptNode(newElement)`
4. Render the new element

The Turbo guide suggests using [morphdom](https://github.com/patrick-steele-idem/morphdom) as a replacement mechanism, but any custom logic can be implemented. When implementing custom rendering, you are responsible for handling all aspects of the page transition, including edge cases like activating new script elements.

## Implementation

Custom rendering can be implemented using a Stimulus controller attached to the body element:

```html
<body data-controller="image-transition" data-action="turbo:before-render->image-transition#swap">
```

```js
export default class extends Controller {
  swap(event) {
    event.detail.render = (currentElement, newElement) => {
      // rendering logic
    }
  }
}
```

The rendering logic can be parameterized by adding Stimulus values to the controller.

## Example: Image Transition with Navigation Swap

This example demonstrates custom rendering that swaps navigation elements and animates image transitions:

```js
document.addEventListener('turbo:before-render', async (event) => {
  event.detail.render = (currentElement, newElement) => {
    if (!document.documentElement.hasAttribute('data-turbo-preview')) {
      // Adopt the new element into the DOM
      document.adoptNode(newElement);

      // Swap navigation element
      currentElement
        .querySelector('#nav')
        .replaceWith(newElement.querySelector('#nav'));

      // Image transition logic
      const oldImage = currentElement.querySelector('img');
      const newImage = newElement.querySelector('img');
      oldImage.setAttribute('style', 'opacity: 1; z-index: 10;');

      oldImage.insertAdjacentElement('afterend', newImage);

      newImage.addEventListener('load', () => {
        newImage.setAttribute(
          'style',
          'opacity: 0; z-index: 0; filter: invert(100%) blur(16px);'
        );
        gsap.to(oldImage, {
          opacity: 0,
          filter: 'invert(100%) blur(16px)',
          duration: 2,
          ease: 'power2.inOut',
        });
        gsap.to(newImage, {
          opacity: 1,
          filter: 'invert(0%) blur(0px)',
          duration: 2,
          ease: 'power2.inOut',
        });

        setTimeout(() => {
          oldImage.remove();
        }, 2000);
      });
    }
  };
});
```

The image transition process:
1. The old image is given a higher z-index so the new one can go beneath it
2. The new image is inserted into the DOM
3. The new image is initialized with z-index 0, opacity 0, and a CSS filter: `invert(100%) blur(16px)`
4. Two animations are performed: fading in the new image and fading out the old one
5. After the animation completes, the old image is removed

## Important Considerations

- Cache restoration visits must be handled. Check for `<html data-turbo-preview>` attribute or opt out of caching altogether
- When implementing custom rendering, you must handle all aspects of page transitions, including script element activation
- The `morphdom` library can be used as an alternative rendering mechanism with options like `onElUpdated` and other callbacks
