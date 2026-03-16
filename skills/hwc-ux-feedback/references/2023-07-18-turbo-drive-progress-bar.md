---
title: Turbo Drive - Re-Use the Turbo Progress Bar
date: '2023-07-18'
tags:
- Navigation
- Turbo Drive
- Progress Bar
- WebSocket
- Rails
- ActionCable
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Turbo Progress Bar API](#turbo-progress-bar-api)
- [Programmatic Control](#programmatic-control)
- [Example: WebSocket Integration](#example-websocket-integration)
- [Rails Implementation with ActionCable](#rails-implementation-with-actioncable)
  - [ActionCable Channel](#actioncable-channel)
  - [Controller Action](#controller-action)
  - [Background Job](#background-job)
  - [JavaScript with ActionCable](#javascript-with-actioncable)
- [Dynamic Enable/Disable](#dynamic-enabledisable)
- [Considerations](#considerations)
- [Pattern Card: Custom Progress Bar for Long Operations](#pattern-card-custom-progress-bar-for-long-operations)


## Overview
Turbo Drive includes a progress bar displayed at the top of the browser window. By default, it appears when a Turbo Drive visit exceeds a specific timeout. The progress bar can be programmatically controlled for custom use cases.

## Turbo Progress Bar API
The Turbo progress bar is accessible via `window.Turbo.navigator.adapter.progressBar`. This object provides methods to control the progress bar programmatically.

## Programmatic Control
To update the progress bar programmatically, use the following methods:

- `setValue(amount)`: Sets the progress value (0-1)
- `show()`: Displays the progress bar
- `hide()`: Hides the progress bar

## Example: WebSocket Integration
When receiving progress updates via WebSocket, parse the payload and update the progress bar:

```js
const ws = new WebSocket(`ws://${location.host}:8080`);

ws.onmessage = (event) => {
  // use event.data to access payload
  const { amount } = JSON.parse(event.data);

  window.Turbo.navigator.adapter.progressBar.setValue(amount);
  if (amount < 1) {
    window.Turbo.navigator.adapter.progressBar.show();
  } else {
    window.Turbo.navigator.adapter.progressBar.hide();
  }
};
```

## Rails Implementation with ActionCable

### ActionCable Channel
Create a channel to broadcast progress updates:

```ruby
# app/channels/progress_channel.rb
class ProgressChannel < ApplicationCable::Channel
  def subscribed
    stream_from "progress_#{params[:id]}"
  end
end
```

### Controller Action
Create a controller action that starts a background process and broadcasts progress:

```ruby
# app/controllers/tasks_controller.rb
class TasksController < ApplicationController
  def start
    task_id = SecureRandom.uuid
    
    # Start background job or process
    ProgressJob.perform_later(task_id)
    
    render json: { task_id: task_id }
  end
end
```

### Background Job
Use a background job to simulate progress updates:

```ruby
# app/jobs/progress_job.rb
class ProgressJob < ApplicationJob
  def perform(task_id)
    progress = 0
    
    while progress < 1.0
      sleep 0.1 # Simulate work
      progress += 0.05
      progress = [progress, 1.0].min
      
      ActionCable.server.broadcast(
        "progress_#{task_id}",
        { amount: progress }
      )
    end
  end
end
```

### JavaScript with ActionCable
Update the JavaScript to use ActionCable:

```js
// app/javascript/channels/progress_channel.js
import consumer from "./consumer"

const progressChannel = consumer.subscriptions.create(
  { channel: "ProgressChannel", id: taskId },
  {
    received(data) {
      const { amount } = data;
      
      window.Turbo.navigator.adapter.progressBar.setValue(amount);
      if (amount < 1) {
        window.Turbo.navigator.adapter.progressBar.show();
      } else {
        window.Turbo.navigator.adapter.progressBar.hide();
      }
    }
  }
);
```

## Dynamic Enable/Disable
To enable or disable progress bar updates dynamically, guard the progress bar state management with conditional logic based on data attributes or other conditions. For example, check a data attribute on the event's target element before updating the progress bar.

## Considerations
The Turbo progress bar is designed for navigation feedback. Using it for non-navigation tasks may result in poor UX. Consider using it for extended navigation scenarios such as filtering large datasets that take time to process.


## Pattern Card: Custom Progress Bar for Long Operations

**When to use**: Background jobs, file uploads, or any operation with measurable progress.

**GOOD - Reusing Turbo's progress bar with WebSocket**:

```javascript
import consumer from "./channels/consumer"

consumer.subscriptions.create(
  { channel: "ProgressChannel", id: taskId },
  {
    received({ amount }) {
      const progressBar = window.Turbo.navigator.adapter.progressBar;
      progressBar.setValue(amount);
      amount < 1 ? progressBar.show() : progressBar.hide();
    }
  }
);
```

```ruby
# app/jobs/progress_job.rb
class ProgressJob < ApplicationJob
  def perform(task_id)
    progress = 0
    while progress < 1.0
      progress += 0.05
      ActionCable.server.broadcast("progress_#{task_id}", { amount: progress })
      sleep 0.1
    end
  end
end
```

**BAD - Custom progress bar without Turbo integration**:

```javascript
// Don't create a separate progress bar system
const customBar = document.createElement('div');
// ... lots of custom CSS and positioning
```
