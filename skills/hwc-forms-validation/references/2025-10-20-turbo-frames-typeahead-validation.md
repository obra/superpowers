---
title: Turbo Frames - Typeahead Validation
date: 2025-10-20
tags:
- Turbo Frames
- turbo:frame-render
- turbo:submit-start
- Form Validation
- Typeahead
- Focus Management
free: false
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Rails Controller](#rails-controller)
  - [Rails View Template](#rails-view-template)
  - [Main View](#main-view)
  - [JavaScript Implementation](#javascript-implementation)
- [How It Works](#how-it-works)
- [Alternative: Using Idiomorph](#alternative-using-idiomorph)
- [Notes](#notes)


## Overview

Typeahead validation validates user input in real time using Turbo Frames form submission. The challenge is preserving input focus and caret position during frame updates to maintain a smooth user experience.

## Implementation

### Rails Controller

```ruby
class SubdomainsController < ApplicationController
  def edit
    @subdomain = params[:subdomain] || ""
    @invalid = taken_subdomains.include?(@subdomain)
    @helper = @invalid ? "This subdomain is already taken" : "Available"
  end

  def update
    @subdomain = params[:subdomain]
    @invalid = taken_subdomains.include?(@subdomain)
    @helper = @invalid ? "This subdomain is already taken" : "Available"

    # Only mutate state if this is not a validation-only request
    # Validation-only requests are sent during typeahead input
    unless validation_only?
      # Process valid subdomain (e.g., save to database)
      # Only reached if subdomain is valid
    end

    if @invalid
      render :edit, status: :unprocessable_entity
    else
      if validation_only?
        # For validation-only requests, just render the form
        render :edit, status: :ok
      else
        # Process valid subdomain
        redirect_to root_path, notice: "Subdomain updated"
      end
    end
  end

  private

  def validation_only?
    # Check for a preflight header to determine if this is validation-only
    request.headers['X-Validation-Only'] == 'true'
  end

  def taken_subdomains
    %w[admin www api support]
  end
end
```

### Rails View Template

```erb
<turbo-frame id="subdomain-frame">
  <%= form_with url: subdomain_path, method: :patch, local: false do |f| %>
    <%= f.text_field :subdomain,
          id: "subdomain",
          value: @subdomain,
          autocomplete: "off",
          "aria-invalid": @invalid,
          "aria-describedby": "subdomain-helper" %>
    <small id="subdomain-helper"><%= @helper %></small>
  <% end %>
</turbo-frame>
```

### Main View

```erb
<div class="container">
  <turbo-frame id="subdomain-frame" src="<%= edit_subdomain_path %>"></turbo-frame>
</div>
```

### JavaScript Implementation

The solution captures the active element and caret position before form submission, then restores them after the frame renders:

```javascript
import '@hotwired/turbo';

let activeElementId = '';
let selectionStart = 0;
let selectionEnd = 0;

document.addEventListener('turbo:frame-load', (e) => {
  const input = e.target.querySelector('#subdomain');
  if (input) {
    input.addEventListener('input', (e) => {
      e.target.closest('form').requestSubmit();
    });
  }
});

document.addEventListener('turbo:submit-start', (e) => {
  const input = document.activeElement;
  
  if (input && input.tagName === 'INPUT') {
    activeElementId = input.id;
    selectionStart = input.selectionStart ?? 0;
    selectionEnd = input.selectionEnd ?? selectionStart;
    
    // Mark this as a validation-only request to prevent state mutation
    e.detail.formSubmission.fetchRequest.headers['X-Validation-Only'] = 'true';
  }
});

document.addEventListener('turbo:frame-render', (e) => {
  if (activeElementId) {
    const input = document.querySelector(`#${activeElementId}`);
    if (input) {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    }
  }
});
```

## How It Works

1. **Capture State**: On `turbo:submit-start`, store the active element's ID and selection range in variables. Use an ID rather than an element reference since the DOM will be replaced.

2. **Restore State**: On `turbo:frame-render`, find the element by ID in the new DOM, focus it, and restore the selection range using `setSelectionRange()`.

## Alternative: Using Idiomorph

DOM morphing libraries like Idiomorph can achieve similar results by preserving element state during updates:

```javascript
import { Idiomorph } from 'idiomorph';

document.addEventListener('turbo:before-frame-render', (e) => {
  e.detail.render = (currentElement, newElement) => {
    Idiomorph.morph(currentElement, newElement);
  };
});
```

Idiomorph internally handles focus and selection preservation similar to the manual approach above.

## Notes

- Debounce the input event handler in production to reduce server requests
- Store state in Stimulus controller values instead of global variables for better organization
- Element IDs are required for reliable element identification after DOM replacement

