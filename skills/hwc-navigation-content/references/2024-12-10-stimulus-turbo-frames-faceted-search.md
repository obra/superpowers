---
title: Faceted Search with Stimulus and Turbo Frames
date: '2024-12-10'
tags:
- search
- turbo-frames
- stimulus
- faceted-search
- forms
free: false
ready: true
description: Use Stimulus and Turbo Frames to implement faceted search with multiple filter criteria
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML Structure](#html-structure)
  - [Stimulus Controller](#stimulus-controller)
  - [Rails Controller](#rails-controller)
  - [Rails View Template](#rails-view-template)
- [Key Concepts](#key-concepts)
- [Pattern Card: Faceted Search](#pattern-card-faceted-search)


## Overview

Faceted search allows users to filter results using multiple criteria simultaneously. This implementation uses a Stimulus controller to collect form data and update a Turbo Frame's source URL with query parameters.

## Implementation

### HTML Structure

The search form contains multiple input fields that trigger the Stimulus controller's `perform` action on input:

```html
<body>
  <h1>Books</h1>

  <search
    role="search"
    data-controller="faceted-search"
    data-faceted-search-base-url-value="/results"
  >
    <form data-faceted-search-target="form">
      <label>
        Search for authors and titles
        <input
          type="search"
          id="query"
          name="query"
          data-action="input->faceted-search#perform"
        />
      </label>

      <label>
        Published before
        <input
          type="number"
          id="published_before"
          name="published_before"
          data-action="input->faceted-search#perform"
        />
      </label>

      <label>
        Rating better than
        <input
          type="number"
          step="0.1"
          value="4"
          id="rating_above"
          name="rating_above"
          data-action="input->faceted-search#perform"
        />
      </label>
    </form>

    <section>
      <h3>Results:</h3>
      <turbo-frame
        data-faceted-search-target="frame"
        id="results"
        src="/results"
      >
        Loading ...
      </turbo-frame>
    </section>
  </search>
</body>
```

### Stimulus Controller

The controller collects form data and updates the Turbo Frame's source URL:

```js
import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="faceted-search"
export default class extends Controller {
  static values = { baseUrl: String };
  static targets = ['frame', 'form'];

  perform() {
    // FormData wraps form inputs and converts them to a query string
    // URLSearchParams constructor accepts FormData objects
    this.searchParams = new URLSearchParams(
      new FormData(this.formTarget)
    ).toString();

    this.frameTarget.src = `${this.baseUrlValue}?${this.searchParams}`;
  }
}
```

### Rails Controller

The server-side controller handles the search request and filters results:

```ruby
class BooksController < ApplicationController
  def index
    @books = Book.all
    
    @books = @books.where(
      "author ILIKE ? OR title ILIKE ?",
      "%#{params[:query]}%",
      "%#{params[:query]}%"
    ) if params[:query].present?
    
    @books = @books.where("year < ?", params[:published_before]) if params[:published_before].present?
    @books = @books.where("rating > ?", params[:rating_above]) if params[:rating_above].present?
  end

  def results
    @books = Book.all
    
    @books = @books.where(
      "author ILIKE ? OR title ILIKE ?",
      "%#{params[:query]}%",
      "%#{params[:query]}%"
    ) if params[:query].present?
    
    @books = @books.where("year < ?", params[:published_before]) if params[:published_before].present?
    @books = @books.where("rating > ?", params[:rating_above]) if params[:rating_above].present?
  end
end
```

### Rails View Template

The results view renders within the Turbo Frame:

```erb
<%= turbo_frame_tag "results" do %>
  <span>Found <%= @books.count %> books that match your criteria</span>
  <ul>
    <% @books.each do |book| %>
      <li><%= book.author %>, "<%= book.title %>" (<%= book.year %>)</li>
    <% end %>
  </ul>
<% end %>
```

## Key Concepts

**FormData**: Wraps form elements to programmatically construct form field data. Any form in the DOM can be used to create a FormData object.

**URLSearchParams**: Provides an interface to access and construct query strings. The constructor accepts FormData objects and includes a `toString()` method to generate a valid query string.

**Solution approach**:
1. Create a FormData object from the controller's `formTarget`
2. Wrap it in a URLSearchParams object
3. Call `toString()` and use it to construct the `frameTarget`'s `src` attribute

When the Turbo Frame's `src` attribute is updated, Turbo automatically fetches the new URL and updates the frame content with the filtered results.


## Pattern Card: Faceted Search

**When to use**: Filter results by multiple criteria with URL state.

**GOOD - Stimulus controller collecting form data into frame src**:

```html
<form data-controller="faceted-search" data-turbo-frame="results">
  <input type="text" name="q" data-action="input->faceted-search#search">
  <select name="category" data-action="change->faceted-search#search">
    <option value="">All</option>
    <option value="books">Books</option>
  </select>
</form>

<turbo-frame id="results" src="/results"></turbo-frame>
```

```javascript
export default class extends Controller {
  search() {
    const params = new URLSearchParams(new FormData(this.element));
    const frame = document.querySelector('turbo-frame#results');
    frame.src = `/results?${params}`;
  }
}
```
