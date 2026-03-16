---
title: Turbo Drive - Conditional InstantClick
date: '2024-02-13'
categories:
- Turbo Drive
tags:
- InstantClick
- Turbo Drive
- Strategy Pattern
- Event Handling
- Prefetching
description: Conditionally opt out of Turbo Drive InstantClick using the Strategy pattern
free: true
ready: true
---

## Overview

Turbo 8 introduces InstantClick behavior, which is enabled by default on all navigations. While this speeds up navigation, it can cause stress on app servers. You can opt out globally or per-element using `data-turbo-prefetch="false"`, but this requires declaring it on each link individually or managing opt-out on parent elements.

For implicit opt-out scenarios such as sub-routes (e.g., `/admin` namespace) or links that trigger interactions, you can use the `turbo:before-prefetch` event to conditionally prevent prefetching.

## Basic Implementation

Listen for the `turbo:before-prefetch` event and prevent its default action when conditions are met:

```html
<body>
  <ul>
    <li><a href="/authors/author.html">Author (not prefetched)</a></li>
    <li><a href="/posts/post.html">Post (prefetched)</a></li>
  </ul>

  <a href="/index.html" data-turbo-command="click->Post#like">Like</a>
</body>
```

Simple conditional check:

```js
document.addEventListener('turbo:before-prefetch', (event) => {
  if (
    event.target.href.match(/.*authors\//) ||
    'turboCommand' in event.target.dataset
  ) {
    event.preventDefault();
  }
});
```

## Strategy Pattern Implementation

For extensibility with multiple conditions, use the Strategy pattern:

```js
class PrefetchCondition {
  constructor() {
    this.conditionStrategies = [];
  }

  addStrategy(strategy) {
    this.conditionStrategies.push(strategy);
  }

  shouldPreventDefault(event) {
    return this.conditionStrategies.some((strategy) => strategy(event));
  }
}

// Define strategies
const matchAuthorsStrategy = (event) =>
  event.target.href && event.target.href.match(/.*authors\//);
const turboCommandStrategy = (event) => 'turboCommand' in event.target.dataset;

const prefetchCondition = new PrefetchCondition();
prefetchCondition.addStrategy(matchAuthorsStrategy);
prefetchCondition.addStrategy(turboCommandStrategy);

document.addEventListener('turbo:before-prefetch', (event) => {
  if (prefetchCondition.shouldPreventDefault(event)) {
    event.preventDefault();
  }
});
```

The `PrefetchCondition` class maintains an array of strategy functions. The `shouldPreventDefault` method uses `Array.some` to check if any strategy matches the event. Strategies can be added dynamically, making the pattern extensible for multiple conditions.
