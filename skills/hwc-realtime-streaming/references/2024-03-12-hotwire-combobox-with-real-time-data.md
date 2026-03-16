---
title: Hotwire Combobox with Real Time Data
date: 2024-03-12
categories:
- Turbo Streams
- Stimulus
tags:
- turbo-streams
- stimulus
- websockets
- combobox
- outlets
- real-time
description: Update combobox options using Websockets and Stimulus outlets
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Basic WebSocket Approach](#basic-websocket-approach)
  - [Stimulus Controller with Outlets](#stimulus-controller-with-outlets)
- [Key Points](#key-points)
- [Pattern Card: WebSocket Broadcasts with ActionCable](#pattern-card-websocket-broadcasts-with-actioncable)


## Overview

Hotwire Combobox supports async mode where options are loaded via Turbo Stream actions. This pattern extends the combobox to receive real-time updates through WebSockets, updating options dynamically as data changes.

## Implementation

### Basic WebSocket Approach

A basic implementation connects to a WebSocket endpoint and updates combobox options directly:

```js
const ws = new WebSocket('wss://example.com/ws');

ws.addEventListener('error', console.error);

ws.addEventListener('message', (event) => {
  const topic = JSON.parse(event.data).topic;
  const state = JSON.parse(event.data).payload.value;

  document
    .querySelectorAll('#items-box .hw-combobox__option')
    .forEach((option) => {
      if (topic.startsWith(option.dataset.value)) {
        let html = option.innerHTML;
        option.innerHTML = html.replace(/\(.*\)/, `(${state})`);
      }
    });
});
```

### Stimulus Controller with Outlets

Refactor into a reusable Stimulus controller architecture using outlets for decoupling.

**External WebSocket Controller** (`external_websocket_controller.js`):

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { url: String };
  static outlets = ['receiver'];

  connect() {
    this.websocket = new WebSocket(this.urlValue);
    this.websocket.addEventListener('error', console.error);
    this.websocket.addEventListener('message', this.handleMessage);
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  handleMessage = (event) => {
    const data = JSON.parse(event.data);
    const topic = data.topic;
    const state = data.payload.value;

    this.receiverOutlets
      .filter((outlet) => topic.startsWith(outlet.element.dataset.value))
      .forEach((outlet) => {
        outlet.changeLabel(state);
      });
  };
}
```

**Receiver Controller** (`receiver_controller.js`):

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  changeLabel(state) {
    let html = this.element.innerHTML;
    this.element.innerHTML = html.replace(/\(.*\)/, `(${state})`);
  }
}
```

**HTML Markup**:

```html
<fieldset
  id="items-box"
  class="hw-combobox"
  data-controller="hw-combobox external-websocket"
  data-hw-combobox-async-src-value="/itemsProxy"
  data-external-websocket-url-value="wss://example.com/ws"
  data-external-websocket-receiver-outlet=".hw-combobox__option"
>
  <input
    type="hidden"
    name="item"
    data-hw-combobox-target="hiddenField"
    autocomplete="off"
  />
  <input
    role="combobox"
    class="hw-combobox__input"
    type="text"
    data-action="focus->hw-combobox#open input->hw-combobox#filter keydown->hw-combobox#navigate"
    data-hw-combobox-target="combobox"
    autocomplete="off"
  />
  <ul
    role="listbox"
    class="hw-combobox__listbox"
    data-hw-combobox-target="listbox"
  ></ul>
</fieldset>
```

**Turbo Stream Response** (Rails controller):

Each combobox option must have the `receiver` controller attached:

```ruby
# app/controllers/items_controller.rb
def index
  @items = Item.all
end
```

```erb
<!-- app/views/items/index.turbo_stream.erb -->
<%= turbo_stream.append "items-box" do %>
  <% @items.each do |item| %>
    <li
      class="hw-combobox__option"
      data-controller="receiver"
      data-value="<%= item.topic %>"
      data-filterable-as="<%= item.name %>"
    >
      <%= item.name %> (<%= item.state %>)
    </li>
  <% end %>
<% end %>
```

## Key Points

- Use Stimulus outlets to decouple WebSocket message handling from DOM manipulation
- The `receiver` controller encapsulates the logic for updating individual option labels
- The `external-websocket` controller handles connection management and message routing
- Each combobox option must have `data-controller="receiver"` and `data-value` attributes set in the Turbo Stream response
- Turbo Stream responses populate the initial combobox options, while WebSocket messages update them in real-time


## Pattern Card: WebSocket Broadcasts with ActionCable

**When to use**: Push server updates to multiple connected clients in real-time.

**GOOD - Model broadcasts**:

```ruby
# app/models/message.rb
class Message < ApplicationRecord
  broadcasts_to :chat_room
end

# Or manually broadcast:
Turbo::StreamsChannel.broadcast_append_to(
  "chat_room_#{room.id}",
  target: "messages",
  partial: "messages/message",
  locals: { message: message }
)
```

```erb
<%# Subscribe to the stream %>
<%= turbo_stream_from @chat_room %>

<div id="messages">
  <%= render @messages %>
</div>
```

**GOOD - Broadcast refresh for morphing**:

```ruby
# Trigger a page refresh on all subscribers
Turbo::StreamsChannel.broadcast_refresh_to("dashboard")
```
