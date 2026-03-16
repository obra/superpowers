---
title: Stimulus - Outlets API
date: '2023-12-19'
categories:
- Stimulus
tags:
- Outlets
- Inter-controller Communication
- Controllers
description: Signal data changes across controller boundaries using the Stimulus Outlets API.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Example: Background Job Dashboard](#example-background-job-dashboard)
- [Implementation](#implementation)
  - [JobDashboardController](#jobdashboardcontroller)
  - [JobController](#jobcontroller)
  - [WidgetController](#widgetcontroller)
- [Pattern Card: Outlets API (Inter-Controller Communication)](#pattern-card-outlets-api-inter-controller-communication)


## Overview

The Stimulus Outlets API provides a public way to enable inter-controller communication. Previously, developers had to use the private `getControllerForElementAndIdentifier` API, which was discouraged. The [Outlets API](https://stimulus.hotwired.dev/reference/outlets) offers a clean, supported approach to pass data between controllers.

## Example: Background Job Dashboard

A background job dashboard demonstrates the Outlets API. The dashboard displays a list of jobs with status indicators and counter widgets. When JSON data updates arrive (simulated via intervals), the dashboard uses outlets to update job indicators and widget counters.

## Implementation

### JobDashboardController

The central controller receives raw JSON data and declares two outlets: `job` and `widget`.

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { jobs: Array };
  static targets = ['template', 'list'];
  static outlets = ['job', 'widget'];

  jobsValueChanged() {
    // append job element from template if not present
    this.#appendJobElements();

    setTimeout(() => {
      this.jobOutlets.forEach((outlet) => {
        const job = this.jobsValue.find((job) => job.id === outlet.element.id);
        outlet.refresh(job);
      });

      this.widgetOutlets.forEach((outlet) => {
        outlet.update(
          this.jobsValue.filter((job) => job.status === outlet.statusValue)
            .length
        );
      });
    }, 1);
  }

  #appendJobElements() {
    for (const job of this.jobsValue.filter((job) => job.status === 'queued')) {
      if (document.querySelector(`#${job.id}`)) break;

      const jobClone = this.templateTarget.content.cloneNode(true);

      let jobHTML = jobClone.firstElementChild.outerHTML;
      jobHTML = jobHTML.replaceAll('ID', job.id);
      jobHTML = jobHTML.replaceAll('TYPE', job.type);
      jobHTML = jobHTML.replaceAll(
        'DATETIME',
        new Date(job.queuedAt).toLocaleString()
      );

      this.listTarget.insertAdjacentHTML('beforeend', jobHTML);
    }
  }
}
```

The controller uses the `jobsValueChanged()` callback to signal changes to outlet controllers. It iterates over `jobOutlets` and sends the appropriate job entry from the jobs array. It then updates each widget outlet by sending the count of jobs matching the widget's status.

### JobController

The job controller updates status indicators using CSS classes.

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['indicator'];
  static classes = ['queued', 'running', 'completed', 'failed'];

  initialize() {
    this.classMap = {
      queued: this.queuedClasses,
      running: this.runningClasses,
      completed: this.completedClasses,
      failed: this.failedClasses,
    };
  }

  refresh(job) {
    this.indicatorTarget.classList.remove(
      ...this.queuedClasses,
      ...this.runningClasses,
      ...this.completedClasses,
      ...this.failedClasses
    );

    const currentClasses = this.classMap[job.status];

    this.indicatorTarget.classList.add(...currentClasses);
  }
}
```

The controller uses Stimulus CSS classes variables arranged in a map. When `refresh()` is called via the outlet, it removes all status classes and adds only the classes matching the job's status.

### WidgetController

The widget controller updates counter displays.

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = { status: String };
  static targets = ['count'];

  update(count) {
    this.countTarget.innerText = count;
  }
}
```

The controller receives the count via the `update()` method called from the outlet and updates the count target's text content.


## Pattern Card: Outlets API (Inter-Controller Communication)

**When to use**: Pass data or trigger actions between controllers.

**GOOD - Declare outlets and call methods on them**:

```html
<div data-controller="dashboard"
     data-dashboard-job-outlet=".job"
     data-dashboard-widget-outlet=".widget">
  
  <div class="job" data-controller="job" id="job-1">...</div>
  <div class="job" data-controller="job" id="job-2">...</div>
  
  <div class="widget" data-controller="widget" 
       data-widget-status-value="running">...</div>
</div>
```

```javascript
// dashboard_controller.js
export default class extends Controller {
  static outlets = ['job', 'widget'];
  static values = { jobs: Array };

  jobsValueChanged() {
    // Update each job outlet
    this.jobOutlets.forEach((outlet) => {
      const job = this.jobsValue.find(j => j.id === outlet.element.id);
      outlet.refresh(job);
    });

    // Update widget counters
    this.widgetOutlets.forEach((outlet) => {
      const count = this.jobsValue.filter(
        j => j.status === outlet.statusValue
      ).length;
      outlet.update(count);
    });
  }
}

// job_controller.js
export default class extends Controller {
  static targets = ['indicator'];
  static classes = ['queued', 'running', 'completed'];

  refresh(job) {
    // Remove all status classes, add current
    this.indicatorTarget.classList.remove(
      ...this.queuedClasses,
      ...this.runningClasses,
      ...this.completedClasses
    );
    this.indicatorTarget.classList.add(...this[`${job.status}Classes`]);
  }
}

// widget_controller.js
export default class extends Controller {
  static values = { status: String };
  static targets = ['count'];

  update(count) {
    this.countTarget.textContent = count;
  }
}
```

**BAD - Using private API**:

```javascript
// Don't use private API for controller communication
const otherController = this.application
  .getControllerForElementAndIdentifier(element, 'other'); // Private!
```
