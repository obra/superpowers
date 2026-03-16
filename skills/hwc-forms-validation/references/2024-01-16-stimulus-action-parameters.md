---
title: Stimulus - Action Parameters
date: '2024-01-16'
tags:
- Stimulus
- Action Parameters
- Parameters
- DOM Manipulation
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML/ERB Template](#htmlerb-template)
  - [Stimulus Controller](#stimulus-controller)
  - [Server-Side Persistence](#server-side-persistence)
- [Pattern Card: Action Parameters](#pattern-card-action-parameters)


## Overview

Stimulus action parameters provide an officially sanctioned way to pass contextual information to Stimulus actions declaratively through DOM data attributes, eliminating the need for manual wiring of data attributes.

## Implementation

Action parameters are passed to Stimulus actions using the `data-{controller}-{param}-param` naming convention. The action receives these parameters through the event's `params` attribute.

### HTML/ERB Template

Each element that triggers an action can specify parameters using data attributes. The parameter name follows the pattern `data-{controller-name}-{parameter-name}-param`:

```erb
<div class="grid">
  <div class="bin">
    <h3>Inbox</h3>
    <% tickets.each do |ticket| %>
      <div class="card" 
           data-controller="ticket"
           data-ticket-id-value="<%= ticket.id %>">
        <div class="card-header">
          <%= ticket.title %>
        </div>
        <div class="card-body">
          <%= ticket.description %>
        </div>
        <div class="card-footer">
          <div class="dropdown">
            <button class="dropdown-toggle">Assign To</button>
            <div class="dropdown-menu">
              <%= link_to "Infrastructure", "#", 
                  class: "dropdown-item",
                  data: { 
                    action: "click->ticket#assign",
                    ticket_team_param: "infrastructure"
                  } %>
              <%= link_to "Devops", "#", 
                  class: "dropdown-item",
                  data: { 
                    action: "click->ticket#assign",
                    ticket_team_param: "devops"
                  } %>
              <%= link_to "Mobile", "#", 
                  class: "dropdown-item",
                  data: { 
                    action: "click->ticket#assign",
                    ticket_team_param: "mobile"
                  } %>
              <%= link_to "QA", "#", 
                  class: "dropdown-item",
                  data: { 
                    action: "click->ticket#assign",
                    ticket_team_param: "qa"
                  } %>
            </div>
          </div>
        </div>
      </div>
    <% end %>
  </div>
  <div id="infrastructure" class="bin">
    <h3>Infrastructure</h3>
  </div>
  <div id="devops" class="bin">
    <h3>Devops</h3>
  </div>
  <div id="mobile" class="bin">
    <h3>Mobile</h3>
  </div>
  <div id="qa" class="bin">
    <h3>QA</h3>
  </div>
</div>
```

### Stimulus Controller

The action method receives parameters through the event object. Parameters are available in the `params` property and can be destructured directly:

```js
import { Controller } from '@hotwired/stimulus';
import { patch } from '@rails/request.js';

export default class extends Controller {
  static values = { id: Number };

  async assign({ params: { team } }) {
    const targetBin = document.getElementById(team);
    
    try {
      const response = await patch(`/tickets/${this.idValue}`, {
        body: JSON.stringify({ ticket: { team: team } }),
        contentType: 'application/json'
      });

      if (response.ok) {
        targetBin.appendChild(this.element);
      } else {
        console.error('Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  }
}
```

Each event sent to a Stimulus action has an optional `params` attribute containing the parameters as a JavaScript object. The destructuring shorthand `{ params: { team } }` extracts the `team` parameter directly from the event.

### Server-Side Persistence

#### Rails Controller

The Rails controller handles the PATCH request to update the ticket's team assignment:

```ruby
class TicketsController < ApplicationController
  def update
    @ticket = Ticket.find(params[:id])
    
    if @ticket.update(ticket_params)
      render json: { status: 'success', ticket: @ticket }
    else
      render json: { status: 'error', errors: @ticket.errors }, status: :unprocessable_entity
    end
  end

  private

  def ticket_params
    params.require(:ticket).permit(:team)
  end
end
```

#### Routes

Add the update route for tickets:

```ruby
Rails.application.routes.draw do
  resources :tickets, only: [:update]
end
```

The Stimulus controller uses `@rails/request.js` to send a PATCH request with the ticket ID and team parameter. The DOM manipulation only occurs after a successful server response, ensuring the UI stays in sync with the database state.

## Pattern Card: Action Parameters

**When to use**: Pass data to actions declaratively from HTML.

**GOOD - Data attributes for parameters**:

```html
<div data-controller="modal">
  <button data-action="click->modal#open"
          data-modal-id-param="settings"
          data-modal-size-param="large">
    Settings
  </button>
  
  <button data-action="click->modal#open"
          data-modal-id-param="help"
          data-modal-size-param="small">
    Help
  </button>
</div>
```

```javascript
export default class extends Controller {
  open({ params: { id, size } }) {
    const modal = document.querySelector(`#${id}-modal`);
    modal.classList.add(`modal--${size}`);
    modal.showModal();
  }
}
```

**BAD - Reading data attributes manually**:

```javascript
open(event) {
  // Don't manually read data attributes
  const id = event.target.dataset.modalIdParam; // Use params instead!
}
```
