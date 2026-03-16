---
title: Turbo Frames - Modals with Validation
date: 2024-05-21
categories:
- Turbo Frames
tags:
- dialog
- modal
- validation
- "turbo:submit-end"
- turbo-frames
- forms
description: Handle modal dialogs with Turbo Frames and minimal additional JavaScript
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [Handling Successful Submissions](#handling-successful-submissions)
- [Rails Controller Implementation](#rails-controller-implementation)
- [Pattern Card: Modal Forms with Validation](#pattern-card-modal-forms-with-validation)


## Overview

Handle modal dialogs with Turbo Frames and validation. The `<dialog>` element provides standardized modal functionality. When using forms inside dialogs with Turbo, wrap the form in a Turbo Frame to capture validation errors, and use `turbo:submit-end` to handle successful submissions.

## Problem

Without a Turbo Frame, validation errors in a modal form are not displayed. The dialog closes without showing errors when validation fails. Additionally, when validation succeeds, the dialog doesn't close because Turbo Frame updates only swap the frame content, not the entire page.

## Solution

Wrap the form inside the `<dialog>` element with a `<turbo-frame>` tag:

```html
<body>
  <dialog id="favDialog">
    <turbo-frame id="favAnimalForm">
      <form action="/update" method="post">
        <p class="errors"><%= @errors %></p>
        <p>
          <label for="favAnimal">Favorite animal:</label>
          <select id="favAnimal" name="favAnimal">
            <option></option>
            <option>Brine shrimp</option>
            <option>Red panda</option>
            <option>Spider monkey</option>
          </select>
        </p>
        <div>
          <button type="submit">Confirm</button>
        </div>
      </form>
    </turbo-frame>
  </dialog>

  <div>
    <button id="updateDetails">Update favorite animal</button>
  </div>

  <main>
    Favorite animal: <span id="favAnimalDisplay"><%= @favorite_animal %></span>
  </main>
</body>
```

When both the current page and the form response contain a Turbo Frame with the same DOM ID, Turbo swaps only the frame contents. This allows validation errors to be displayed within the modal.

However, on successful submission, the dialog doesn't close because the redirected page contains the same Turbo Frame ID, so only the frame content changes, not the entire page.

## Handling Successful Submissions

Turbo doesn't allow overriding the frame target (the `Turbo-Frame` header) in responses. Two workarounds:

1. Close the modal and update the underlying view using a Turbo Stream action
2. After successful form submission, perform a client-side redirect using `Turbo.visit`

The `Turbo.visit` approach is preferred because:
- Fewer moving parts to handle
- `Turbo.visit` handles browser history automatically
- Using `Turbo.visit(url, {action: "replace"})` overwrites the original form redirect visit

Use the `turbo:submit-end` event to handle successful submissions:

```js
document.addEventListener('turbo:load', () => {
  const updateButton = document.getElementById('updateDetails');
  const dialog = document.getElementById('favDialog');
  dialog.returnValue = 'favAnimal';

  updateButton.addEventListener('click', () => {
    dialog.showModal();
  });

  dialog.addEventListener('turbo:submit-end', async (e) => {
    const { ok, url } = e.detail.fetchResponse.response;

    const html = await e.detail.fetchResponse.responseHTML;
    if (ok) {
      Turbo.visit(url, { action: 'replace' });
    }
  });
});
```

## Rails Controller Implementation

The server should respond with:
- 303 redirect to the redirect location if valid
- 422 status with error messages in the response if invalid

```ruby
class AnimalsController < ApplicationController
  def show
    @favorite_animal = session[:favorite_animal] || ''
    @errors = ''
  end

  def update
    if params[:favAnimal].present?
      session[:favorite_animal] = params[:favAnimal]
      redirect_to root_path, status: :see_other
    else
      @favorite_animal = session[:favorite_animal] || ''
      @errors = 'Please select a new favorite animal:'
      render :show, status: :unprocessable_entity
    end
  end
end
```


## Pattern Card: Modal Forms with Validation

**When to use**: Forms inside `<dialog>` elements that need to show validation errors and close on success.

**GOOD - Turbo Frame inside dialog with turbo:submit-end handler**:

```html
<dialog id="editDialog">
  <turbo-frame id="edit-form">
    <form action="/items" method="post">
      <p class="errors"><%= @errors if @errors.present? %></p>
      <input type="text" name="name" required>
      <button type="submit">Save</button>
    </form>
  </turbo-frame>
</dialog>

<button onclick="document.getElementById('editDialog').showModal()">
  Edit Item
</button>
```

```javascript
const dialog = document.getElementById('editDialog');

dialog.addEventListener('turbo:submit-end', async (e) => {
  const { ok, url } = e.detail.fetchResponse.response;
  
  if (ok) {
    // Success: close dialog and navigate
    dialog.close();
    Turbo.visit(url, { action: 'replace' });
  }
  // Validation errors: Turbo Frame swaps in error messages automatically
});
```

```ruby
# Rails controller
def create
  @item = Item.new(item_params)
  
  if @item.save
    redirect_to items_path, status: :see_other
  else
    @errors = @item.errors.full_messages.join(', ')
    render :new, status: :unprocessable_entity
  end
end
```

**BAD - No Turbo Frame (errors not displayed)**:

```html
<!-- Without a Turbo Frame, validation errors cause a full page swap -->
<dialog id="editDialog">
  <form action="/items" method="post">
    <!-- Errors won't show in modal! -->
  </form>
</dialog>
```
