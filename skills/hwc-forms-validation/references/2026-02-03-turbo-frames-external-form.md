---
title: Turbo Frames - Using External Forms
date: 2026-02-03
categories:
- Turbo Frames
tags:
- Form Submission
- forms
- form attribute
- turbo-frame
- external form controls
description: Refer to external forms from within a Turbo Frame
free: false
ready: true
---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Implementation](#implementation)
- [HTML Structure](#html-structure)
- [Form Control Inside Turbo Frame](#form-control-inside-turbo-frame)
- [Rails Controller](#rails-controller)
- [Rails View (results.html.erb)](#rails-view-resultshtmlerb)
- [Key Points](#key-points)
- [Pattern Card: External Form Controls](#pattern-card-external-form-controls)

## Problem

When a form exists outside a `<turbo-frame>`, form controls (like `<select>`, `<input>`) rendered inside the frame cannot submit to that external form by default. Form controls are only associated with their nearest ancestor `<form>` element.

## Solution

Use the `form` attribute on form-associated HTML elements to associate them with a form outside their DOM hierarchy.

By default, form controls are associated with their nearest ancestor `<form>` element. The `form` attribute enables overriding this default behavior.

## Implementation

### HTML Structure

The external form outside the frame:

```html
<form id="search-form" data-controller="faceted-search">
  <input type="text" name="query">
  <input type="number" name="published_before">
  <input type="number" name="rating_above">
</form>

<turbo-frame id="results" src="/results"></turbo-frame>
```

### Form Control Inside Turbo Frame

Add the `form` attribute referencing the external form's `id`:

```html
<turbo-frame id="results">
  <span>Found 5 books that match your criteria</span>

  <select name="sort" form="search-form" data-action="input->faceted-search#perform">
    <option value="name_asc">Name A-Z</option>
    <option value="name_desc">Name Z-A</option>
    <option value="title_asc">Title A-Z</option>
    <option value="title_desc">Title Z-A</option>
  </select>

  <ul>
    <!-- results -->
  </ul>
</turbo-frame>
```

### Rails Controller

```ruby
class BooksController < ApplicationController
  def results
    @books = Book.all

    if params[:query].present?
      @books = @books.where("author ILIKE :q OR title ILIKE :q", q: "%#{params[:query]}%")
    end

    if params[:published_before].present?
      @books = @books.where("year < ?", params[:published_before])
    end

    if params[:rating_above].present?
      @books = @books.where("rating > ?", params[:rating_above])
    end

    @books = case params[:sort]
    when "name_asc"
      @books.order("author ASC")
    when "name_desc"
      @books.order("author DESC")
    when "title_asc"
      @books.order("title ASC")
    when "title_desc"
      @books.order("title DESC")
    else
      @books.order("author ASC")
    end

    render :results
  end
end
```

### Rails View (results.html.erb)

```erb
<turbo-frame id="results">
  <span>Found <%= @books.count %> books that match your criteria</span>

  <%= select_tag :sort, 
    options_for_select([
      ["Name A-Z", "name_asc"],
      ["Name Z-A", "name_desc"],
      ["Title A-Z", "title_asc"],
      ["Title Z-A", "title_desc"]
    ], params[:sort]),
    form: "search-form",
    data: { action: "input->faceted-search#perform" }
  %>

  <ul>
    <% @books.each do |book| %>
      <li><%= book.author %>, "<%= book.title %>" (<%= book.year %>)</li>
    <% end %>
  </ul>
</turbo-frame>
```

## Key Points

- The `form` attribute accepts the `id` of the target form
- Works with any form-associated element: `<input>`, `<select>`, `<textarea>`, `<button>`
- The form control behaves as if it were a child of the referenced form
- Enables reusable Turbo Frame components with sorting/filtering across different contexts
- No JavaScript required beyond existing Stimulus controllers


## Pattern Card: External Form Controls

**When to use**: Form controls rendered inside a Turbo Frame need to submit to a form outside the frame (e.g., sorting/filtering controls in results).

**GOOD - Using the form attribute**:

```html
<form id="search-form" data-controller="faceted-search">
  <input type="text" name="query">
  <input type="number" name="published_before">
</form>

<turbo-frame id="results" src="/results">
  <!-- This select submits to search-form even though it's in a frame -->
  <select name="sort" form="search-form" 
          data-action="input->faceted-search#perform">
    <option value="name_asc">Name A-Z</option>
    <option value="name_desc">Name Z-A</option>
  </select>
  
  <ul><!-- results --></ul>
</turbo-frame>
```

```erb
<%# Rails view helper %>
<%= select_tag :sort, 
    options_for_select([["Name A-Z", "name_asc"], ["Name Z-A", "name_desc"]], params[:sort]),
    form: "search-form",
    data: { action: "input->faceted-search#perform" } %>
```

**BAD - Duplicating form controls**:

```html
<!-- Don't duplicate controls in multiple places -->
<form id="search-form">
  <select name="sort">...</select>
</form>

<turbo-frame id="results">
  <select name="sort">...</select> <!-- Duplicate! Out of sync! -->
</turbo-frame>
```
