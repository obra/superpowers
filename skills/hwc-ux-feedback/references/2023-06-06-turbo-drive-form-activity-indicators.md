---
title: Turbo Drive - Form Activity Indicators
date: 2023-06-06
categories:
- Turbo Drive
tags:
- Forms
- "turbo:before-render"
- "turbo:submit-end"
- "turbo:submit-start"
- Activity Indicators
- User Feedback
description: Provide user feedback for slow running form submits.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
- [Code Example](#code-example)
- [Key Points](#key-points)
- [Pattern Card: Form Activity Indicators](#pattern-card-form-activity-indicators)


## Overview

Turbo Drive emits several events during form submission that can be used to display activity indicators and manage form state. The key events are `turbo:submit-start`, `turbo:submit-end`, and `turbo:before-render`.

## Implementation

Use `turbo:submit-start` to show a "Saving..." indicator and disable all form inputs to prevent race conditions. This event fires before the actual request takes place.

Use `turbo:submit-end` to update the indicator to "Saved." This event fires after the form submission completes.

Use `turbo:before-render` with render pausing to add delays if needed to make the indicator perceivable.

## Code Example

```js
document.addEventListener('turbo:load', () => {
  // begin fake templating engine
  const params = new URL(location.href).searchParams;

  document.querySelector('[name=amount]').value = params.get('amount');
  document.querySelector('[name=date_of_birth]').value =
    params.get('date_of_birth');
  // end fake templating engine

  document.querySelectorAll('input').forEach((input) => {
    // ! debounce this
    input.addEventListener('input', () => {
      document.querySelector('form').requestSubmit();
    });
  });
});

document.addEventListener('turbo:submit-start', () => {
  document.querySelector('#hint').innerText = 'Saving...';
  document.querySelectorAll('input').forEach((input) => {
    input.disabled = true;
  });
});

document.addEventListener('turbo:submit-end', () => {
  document.querySelector('#hint').innerText = 'Saved.';
});

document.addEventListener('turbo:before-render', (event) => {
  event.preventDefault();

  setTimeout(() => {
    event.detail.resume();
  }, 1000);
});
```

```html
<body>
  <form action="/" method="PATCH">
    <label for="data_of_birth">Date of Birth</label
    ><input type="date" name="date_of_birth" />
    <label for="amount">Amount Ordered</label
    ><input type="number" name="amount" />
    <div id="hint"></div>
  </form>
</body>
```

## Key Points

1. `turbo:submit-start` fires before the request and is the appropriate place to disable inputs and show a "Saving..." indicator to prevent race conditions.

2. `turbo:submit-end` fires after the form submission completes and is where to update the indicator to "Saved."

3. `turbo:before-render` can be used with `event.preventDefault()` and `event.detail.resume()` to add delays if needed to make status transitions perceivable.


## Pattern Card: Form Activity Indicators

**When to use**: Forms that take time to process (file uploads, complex operations).

**GOOD - Using turbo:submit-start and turbo:submit-end**:

```javascript
document.addEventListener('turbo:submit-start', (e) => {
  const form = e.target;
  form.querySelector('[type="submit"]').disabled = true;
  form.classList.add('submitting');
});

document.addEventListener('turbo:submit-end', (e) => {
  const form = e.target;
  form.querySelector('[type="submit"]').disabled = false;
  form.classList.remove('submitting');
});
```

```css
form.submitting [type="submit"] {
  opacity: 0.5;
  cursor: wait;
}
```
