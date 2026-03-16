---
title: Stimulus - Value Changed Callbacks
categories:
- Stimulus
date: '2023-08-29'
tags:
- stimulus
- values
- callbacks
- 3rd party libs
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Value Changed Callbacks](#value-changed-callbacks)
- [Implementation Example](#implementation-example)
- [Key Points](#key-points)
- [Pattern Card: Value Changed Callbacks](#pattern-card-value-changed-callbacks)


## Overview

Stimulus value changed callbacks enable reactive updates when integrating third-party libraries. When a Stimulus value changes, Stimulus automatically calls a method named `{valueName}ValueChanged()`.

## Value Changed Callbacks

A Stimulus controller can define values that trigger callbacks when updated. For a value named `stockPrices`, the callback method is `stockPricesValueChanged()`.

The value changed callback can execute before the `connect` method completes, so guard against undefined state.

## Implementation Example

This example demonstrates updating a Chart.js chart when a Stimulus value changes:

```js
// chart_controller.js
import { Controller } from '@hotwired/stimulus';
import { Chart } from 'chart.js';

export default class extends Controller {
  static targets = ['canvas'];
  static values = {
    stockPrices: Object,
  };

  connect() {
    const cfg = {
      type: 'line',
      data: {
        labels: generateDailyLabels(),
        datasets: [
          {
            label: 'TechCorp',
            data: this.stockPricesValue['TechCorp'],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
          {
            label: 'HealthLabs',
            data: this.stockPricesValue['HealthLabs'],
            fill: false,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
          },
          {
            label: 'EcoEnergy',
            data: this.stockPricesValue['EcoEnergy'],
            fill: false,
            borderColor: 'rgb(255, 205, 86)',
            tension: 0.1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
          },
        },
      },
    };
    this.chart = new Chart(this.canvasTarget, cfg);
  }

  stockPricesValueChanged() {
    const datasets = this.chart?.data.datasets;

    if (!datasets) return;

    for (const stockName in this.stockPricesValue) {
      const dataset = datasets.find(({ label }) => label === stockName);

      dataset.data = this.stockPricesValue[stockName];
    }

    this.chart.update('none');
  }
}

function generateDailyLabels(year = new Date().getFullYear()) {
  let labels = [];
  let date = new Date(year, 0, 1);

  while (date.getFullYear() === year) {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    labels.push(`${month} ${day}`);

    date.setDate(date.getDate() + 1);
  }

  return labels;
}
```

## Key Points

1. **Safe navigation**: Use the optional chaining operator (`?.`) when accessing properties that may not exist yet, since value changed callbacks can run before `connect()` completes.

2. **Early return**: Check for required data and return early if it's not available.

3. **Iterating over object values**: When values are objects with dynamic keys, use a `for...in` loop to iterate over the keys.

4. **Finding matching datasets**: Use `find()` to locate the correct dataset by matching a property (e.g., `label`).

5. **Updating without animation**: Pass `'none'` to `chart.update()` to disable transition animations.


## Pattern Card: Value Changed Callbacks

**When to use**: React to state changes, especially when integrating third-party libraries.

**GOOD - Reactive updates with safe guards**:

```javascript
import { Controller } from '@hotwired/stimulus';
import Chart from 'chart.js';

export default class extends Controller {
  static targets = ['canvas'];
  static values = { data: Array };

  connect() {
    this.chart = new Chart(this.canvasTarget, {
      type: 'line',
      data: { datasets: [{ data: this.dataValue }] }
    });
  }

  disconnect() {
    this.chart?.destroy();
  }

  dataValueChanged() {
    // Guard: callback can fire before connect()
    if (!this.chart) return;
    
    this.chart.data.datasets[0].data = this.dataValue;
    this.chart.update('none'); // 'none' disables animation
  }
}
```

**BAD - No guard against early callback**:

```javascript
dataValueChanged() {
  // Crashes if called before connect()!
  this.chart.data.datasets[0].data = this.dataValue;
}
```
