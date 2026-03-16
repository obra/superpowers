---
title: Turbo Drive - Cache Lifecycle
date: 2023-05-23
categories:
- Turbo Drive
tags:
- Caching
- "turbo:before-cache"
- turbo-drive
- lifecycle
- dom-manipulation
description: Tweak Turbo Drive's cache lifecycle to improve user experience when navigating.
free: true
ready: true
---

## Turbo Drive Caching

Turbo Drive caches content to be restored when navigating by browser history (back and forward buttons). When Turbo caches a page, it discards all attached event listeners and associated data from the DOM.

This can cause issues when third-party JavaScript libraries or plugins inject HTML elements on `turbo:load` but don't have proper teardown methods. When a cached page is restored, stale content may be displayed.

## Using turbo:before-cache Event

The `turbo:before-cache` event fires before a page is written to the cache. You can use this event to modify the DOM before caching to prevent stale content from being restored.

Example: A third-party script injects time-sensitive content on `turbo:load`:

```js
function Greeter() {
  this.init = function (selector) {
    const date = new Date();
    let timeOfDay;
    if (date.getHours() < 12) {
      timeOfDay = 'morning';
    } else if (date.getHours() < 18) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    const weatherEmojis = ['🌤️', '🌥️', '⛅️', '🌦️', '🌧️', '🌨️', '⛈️', '🌩️'];
    const randomWeather =
      weatherEmojis[Math.floor(Math.random() * weatherEmojis.length)];

    document
      .querySelector(selector)
      .insertAdjacentHTML(
        'beforeend',
        `<div class="greeting">Good ${timeOfDay}, it's ${date.toLocaleString()}, and the weather is ${randomWeather}</div>`
      );
  };
}

document.addEventListener('turbo:load', function () {
  new Greeter().init('#widget-container');
});

document.addEventListener('turbo:before-cache', function (event) {
  document.querySelector('#widget-container').innerHTML =
    '<svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
});
```

The solution replaces the widget container's innerHTML with a loading spinner before the page is cached, preventing stale content from being shown when the cached page is restored.

## Additional Considerations

This technique also prevents issues with content-heavy elements such as images or media that might not have optimal HTTP Cache headers set. Without cleanup, such assets could be loaded twice: once when presenting the restored cache snapshot, and again after the requested page loads.

When using `turbo:before-cache`, ensure you only modify the specific DOM elements that need cleanup to avoid inadvertently altering unrelated parts of the page.


## Pattern Card: Cache Lifecycle Management

**When to use**: Clean up UI state before Turbo caches the page.

**GOOD - Reset state before caching**:

```javascript
document.addEventListener('turbo:before-cache', () => {
  // Close dropdowns
  document.querySelectorAll('[data-expanded]').forEach(el => {
    el.removeAttribute('data-expanded');
  });
  
  // Clear temporary messages
  document.querySelectorAll('.flash').forEach(el => el.remove());
  
  // Reset form state
  document.querySelectorAll('form').forEach(form => form.reset());
});
```

**BAD - Leaving transient UI state in cache**:

```javascript
// Don't leave modals open, dropdowns expanded, etc.
// They'll show briefly on back navigation!
```
