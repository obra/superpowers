---
title: Stimulus - Orchestrate Complex UI Changes with Target Callbacks
date: 2024-05-07
categories:
- Stimulus
tags:
- targets
- callbacks
- target-callbacks
- stimulus-controllers
- turbo-streams
- action-cable
description: Use Stimulus target callbacks to dynamically update parts of your UI when targets are connected or disconnected
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [HTML Structure](#html-structure)
  - [Stimulus Controller](#stimulus-controller)
  - [How It Works](#how-it-works)
- [Rails/Turbo Stream Integration](#railsturbo-stream-integration)
  - [Server-Side Broadcasting](#server-side-broadcasting)
  - [Job Partial](#job-partial)
  - [View Setup](#view-setup)
- [Pattern Card: Target Callbacks](#pattern-card-target-callbacks)


## Overview

Stimulus target callbacks allow controllers to react when targets are connected or disconnected from the DOM. This is useful for updating UI based on DOM state without requiring server-side state management.

When information needed to update the UI is already present in the DOM, using client-side logic can be simpler than server-side rendered HTML changes. This approach avoids server CPU overhead and state management for ephemeral UI changes.

## Implementation

### HTML Structure

The controller manages a list of job items and statistics counters. Each job item is a target, and each counter is a separate target:

```html
<body data-controller="job-list">
  <main>
    <ul id="job-list"></ul>
  </main>
  <aside>
    <div>
      <span data-job-list-target="totalCount">0</span>
    </div>
    <div>
      <span data-job-list-target="dataProcessingCount">0</span>
    </div>
    <div>
      <span data-job-list-target="fileUploadCount">0</span>
    </div>
    <div>
      <span data-job-list-target="emailDispatchCount">0</span>
    </div>
  </aside>
</body>
```

The appended `<li>` elements are `itemTargets` of the `job-list-controller`. Each item has a `data-job-type` attribute to categorize jobs.

### Stimulus Controller

The controller uses target callbacks to update counts when items are added or removed:

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = [
    'item',
    'totalCount',
    'dataProcessingCount',
    'fileUploadCount',
    'emailDispatchCount',
  ];

  itemTargetConnected() {
    this.#updateCounts();
  }

  itemTargetDisconnected() {
    this.#updateCounts();
  }

  #updateCounts() {
    this.totalCountTarget.innerHTML = this.itemTargets.length;

    this.dataProcessingCountTarget.innerHTML = this.itemTargets.filter(
      (element) => element.dataset.jobType === 'Data Processing'
    ).length;

    this.fileUploadCountTarget.innerHTML = this.itemTargets.filter(
      (element) => element.dataset.jobType === 'File Upload'
    ).length;

    this.emailDispatchCountTarget.innerHTML = this.itemTargets.filter(
      (element) => element.dataset.jobType === 'Email Dispatch'
    ).length;
  }
}
```

### How It Works

- `itemTargetConnected()` is called automatically when a new `item` target is added to the DOM
- `itemTargetDisconnected()` is called automatically when an `item` target is removed from the DOM
- Both callbacks invoke `#updateCounts()` to recalculate all statistics
- The total count uses `itemTargets.length`
- Category counts filter `itemTargets` by `data-job-type` attribute

This approach simplifies UI updates by deriving counts from existing DOM state rather than maintaining separate server-side counters.

## Rails/Turbo Stream Integration

### Server-Side Broadcasting

In Rails, use Turbo Streams via Action Cable to broadcast job updates:

```ruby
# app/models/job.rb
class Job < ApplicationRecord
  after_create_commit :broadcast_append
  after_destroy_commit :broadcast_remove

  private

  def broadcast_append
    broadcast_append_to(
      "jobs",
      target: "job-list",
      partial: "jobs/job",
      locals: { job: self }
    )
  end

  def broadcast_remove
    broadcast_remove_to("jobs", target: "job_#{id}")
  end
end
```

### Job Partial

```erb
<!-- app/views/jobs/_job.html.erb -->
<li
  id="job_<%= job.id %>"
  data-job-list-target="item"
  data-job-type="<%= job.job_type %>"
  class="job relative flex items-center space-x-4 px-4 py-4 sm:px-6 lg:px-8"
>
  <div class="min-w-0 flex-auto">
    <div class="flex items-center gap-x-3">
      <h2 class="min-w-0 text-sm font-semibold leading-6 text-white">
        <span class="truncate"><%= job.id %></span>
      </h2>
    </div>
    <div class="mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-gray-400">
      <p class="truncate"><%= job.job_type %></p>
      <p class="whitespace-nowrap">Initiated <%= job.created_at.to_s %></p>
    </div>
  </div>
</li>
```

### View Setup

```erb
<!-- app/views/jobs/index.html.erb -->
<%= turbo_stream_from "jobs" %>

<body data-controller="job-list">
  <main>
    <ul id="job-list">
      <%= render @jobs %>
    </ul>
  </main>
  <aside>
    <div>
      <span data-job-list-target="totalCount"><%= @jobs.count %></span>
    </div>
    <div>
      <span data-job-list-target="dataProcessingCount">0</span>
    </div>
    <div>
      <span data-job-list-target="fileUploadCount">0</span>
    </div>
    <div>
      <span data-job-list-target="emailDispatchCount">0</span>
    </div>
  </aside>
</body>
```

When Turbo Streams append or remove job items, Stimulus target callbacks automatically trigger to update the statistics counters.


## Pattern Card: Target Callbacks

**When to use**: React when targets are connected/disconnected (e.g., from Turbo Stream updates).

**GOOD - Update UI when targets change**:

```javascript
export default class extends Controller {
  static targets = ['item'];
  static values = { count: Number };

  itemTargetConnected(target) {
    this.countValue = this.itemTargets.length;
  }

  itemTargetDisconnected(target) {
    this.countValue = this.itemTargets.length;
  }

  countValueChanged() {
    this.element.querySelector('.count').textContent = this.countValue;
  }
}
```
