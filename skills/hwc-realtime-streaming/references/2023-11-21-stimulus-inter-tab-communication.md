---
title: Stimulus - Inter-Tab Communication
date: '2023-11-21'
categories:
- Stimulus
tags:
- Stimulus
- Broadcast Channel API
- Inter-tab Communication
- JavaScript
description: "Manage inter-browser communication using Stimulus and the Broadcast Channel API"
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Stimulus Controller](#stimulus-controller)
  - [HTML Template](#html-template)
- [Key Concepts](#key-concepts)
  - [Channel Setup](#channel-setup)
  - [Sending Messages](#sending-messages)
  - [Receiving Messages](#receiving-messages)
  - [Declarative State Management](#declarative-state-management)
- [Pattern Card: Inter-Tab Communication](#pattern-card-inter-tab-communication)


## Overview

The Broadcast Channel API enables communication between browser tabs or windows on the same machine without WebSockets. It's useful for sending low-importance notifications and synchronizing state across tabs.

**Important:** The Broadcast Channel API only works for inter-tab/-window communication on the same machine.

## Implementation

### Stimulus Controller

Create separate BroadcastChannel instances for different message types. Initialize channels in `connect()` and close them in `disconnect()`.

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { task: Number };
  static targets = ['select', 'button'];

  connect() {
    this.assignmentsChannel = new BroadcastChannel('assignments');
    this.doneChannel = new BroadcastChannel('done');

    this.assignmentsChannel.onmessage = (event) => {
      if (event.data.task === this.taskValue) {
        this.selectTarget.value = event.data.assignedTo;
        this.#showToast('assigned');
      }
    };

    this.doneChannel.onmessage = (event) => {
      if (event.data.task === this.taskValue) {
        this.#setButtonToDone();
        this.#showToast('done');
      }
    };
  }

  disconnect() {
    this.assignmentsChannel.close();
    this.doneChannel.close();
  }

  assign(e) {
    this.assignmentsChannel.postMessage({
      task: this.taskValue,
      assignedTo: e.target.value,
    });
  }

  markDone(e) {
    this.#setButtonToDone();
    this.doneChannel.postMessage({
      task: this.taskValue,
    });
  }

  #setButtonToDone() {
    this.buttonTarget.disabled = true;
    this.buttonTarget.innerText = 'Done';
  }

  #showToast(type) {
    const variant = type === 'done' ? 'success' : 'primary';
    const icon = type === 'done' ? 'check2-circle' : 'info-circle';
    const message =
      type === 'done'
        ? `Task ${this.taskValue} has been marked done.`
        : `Task ${this.taskValue} has been assigned to ${this.selectTarget.value}`;

    const alertTemplate = document.querySelector('#alert-template');

    const alertClone = alertTemplate.content.cloneNode(true);
    const alert = alertClone.firstElementChild;
    alert.variant = variant;
    alert.querySelector('sl-icon').name = icon;
    alert.querySelector('.content').innerText = message;

    document.body.appendChild(alertClone);

    setTimeout(() => {
      alert.toast();
    }, 10);
  }
}
```

### HTML Template

```html
<body>
  <template id="alert-template">
    <sl-alert variant="success" duration="3000" closable>
      <sl-icon slot="icon" name="check2-circle"></sl-icon>
      <div class="content"></div>
    </sl-alert>
  </template>

  <sl-card>
    <h1 slot="header">Family Chore Manager</h1>
    <div class="list-item" data-controller="task" data-task-task-value="1">
      <span>Task 1: Vacuum Living Room</span>

      <sl-select
        placeholder="Assign To"
        data-task-target="select"
        data-action="sl-change->task#assign"
      >
        <sl-option value="mom">Mom</sl-option>
        <sl-option value="dad">Dad</sl-option>
      </sl-select>

      <sl-button
        variant="success"
        data-task-target="button"
        data-action="click->task#markDone"
      >
        <sl-icon slot="prefix" name="check2"></sl-icon>
        Mark Done
      </sl-button>
    </div>
    <sl-divider></sl-divider>
    <div class="list-item" data-controller="task" data-task-task-value="2">
      <span>Task 2: Water Plants</span>

      <sl-select
        placeholder="Assign To"
        data-task-target="select"
        data-action="sl-change->task#assign"
      >
        <sl-option value="mom">Mom</sl-option>
        <sl-option value="dad">Dad</sl-option>
      </sl-select>

      <sl-button
        variant="success"
        data-task-target="button"
        data-action="click->task#markDone"
      >
        <sl-icon slot="prefix" name="check2"></sl-icon>
        Mark Done
      </sl-button>
    </div>
    <sl-divider></sl-divider>
    <div class="list-item" data-controller="task" data-task-task-value="3">
      <span>Task 3: Dust Off Bookshelves</span>

      <sl-select
        placeholder="Assign To"
        data-task-target="select"
        data-action="sl-change->task#assign"
      >
        <sl-option value="mom">Mom</sl-option>
        <sl-option value="dad">Dad</sl-option>
      </sl-select>

      <sl-button
        variant="success"
        data-task-target="button"
        data-action="click->task#markDone"
      >
        <sl-icon slot="prefix" name="check2"></sl-icon>
        Mark Done
      </sl-button>
    </div>
  </sl-card>
</body>
```

## Key Concepts

### Channel Setup

Create named BroadcastChannel instances in `connect()`:
- Use separate channels for different message types (e.g., `assignments` and `done`)
- Set `onmessage` handlers to receive messages from other tabs
- Always close channels in `disconnect()` to prevent memory leaks

### Sending Messages

Use `postMessage()` to broadcast data to all tabs listening on the same channel:
- Include identifiers (like task IDs) to filter messages in receivers
- Messages are received by all tabs, including the sender

### Receiving Messages

In the `onmessage` callback:
- Check if the message is relevant to the current controller instance
- Update DOM state based on received data
- The callback executes in the context of other browser tabs, not the sender

### Declarative State Management

To make state management more declarative, use Stimulus values with value changed callbacks. For example, making `done` a Stimulus value allows responding to changes declaratively when other client-side logic sets the value in the DOM.


## Pattern Card: Inter-Tab Communication

**When to use**: Sync state across browser tabs without WebSocket (same machine only).

**GOOD - Broadcast Channel API with Stimulus**:

```javascript
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { channel: String };
  
  connect() {
    this.channel = new BroadcastChannel(this.channelValue);
    this.channel.onmessage = (event) => this.receive(event.data);
  }
  
  disconnect() {
    this.channel.close();
  }
  
  send(data) {
    this.channel.postMessage(data);
  }
  
  receive(data) {
    // Handle received data from other tabs
    console.log('Received:', data);
  }
}
```

**Note**: Broadcast Channel API only works for tabs on the same machine, not across devices.
