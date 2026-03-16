---
title: Stimulus - KeyboardEvent 101
date: '2023-10-24'
categories:
- Stimulus
tags:
- Keyboardevent
- keyboard
- hotkeys
- form-input
- value-callbacks
- dom-manipulation
description: Use Stimulus' built in KeyboardEvent functionality to handle basic hotkeys.
free: true
ready: true
---

## Table of Contents

- [Overview](#overview)
- [Implementation](#implementation)
  - [Keyboard Actions](#keyboard-actions)
  - [Example: Dynamic Form Input Management](#example-dynamic-form-input-management)
- [Key Concepts](#key-concepts)
  - [Modifying Input Type with Value Callbacks](#modifying-input-type-with-value-callbacks)
  - [Adding/Removing Inputs](#addingremoving-inputs)
  - [Validation Rules](#validation-rules)
- [Important Notes](#important-notes)
- [Pattern Card: KeyboardEvent Handling](#pattern-card-keyboardevent-handling)


## Overview

Stimulus provides native [KeyboardEvent filter functionality](https://stimulus.hotwired.dev/reference/actions#keyboardevent-filter) for handling keyboard shortcuts, eliminating the need for third-party libraries for basic use cases.

## Implementation

### Keyboard Actions

Keyboard shortcuts are defined using the `keydown` action with modifier keys:
- `keydown.ctrl+0->controller#method` - Ctrl+0 triggers method
- `keydown.alt+down->controller#method` - Alt+Down triggers method
- `keydown.alt+up->controller#method` - Alt+Up triggers method

### Example: Dynamic Form Input Management

This example demonstrates adding/removing input fields and cycling through input types using keyboard shortcuts.

```js
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['input', 'label'];
  static values = {
    type: { type: String, default: 'text' },
  };

  validTypes = ['text', 'number', 'email', 'tel', 'url'];

  template =
    '<div data-controller="form-input" tabindex="0"><input type="text" data-action="keydown.ctrl+0->form-input#cycleTypeForward keydown.ctrl+9->form-input#cycleTypeBackward keydown.alt+down->form-input#insertInput keydown.alt+up->form-input#removeInput" data-form-input-target="input" /><label data-form-input-target="label"></label></div>';

  cycleTypeForward() {
    let typeIndex = this.validTypes.indexOf(this.typeValue);

    typeIndex++;
    typeIndex = typeIndex % this.validTypes.length;

    this.typeValue = this.validTypes[typeIndex];
  }

  cycleTypeBackward() {
    let typeIndex = this.validTypes.indexOf(this.typeValue);

    typeIndex--;
    if (typeIndex < 0) typeIndex = this.validTypes.length - 1;

    this.typeValue = this.validTypes[typeIndex];
  }

  insertInput() {
    const newInput = document.createElement('template');
    newInput.innerHTML = this.template.trim();

    const insertedChild = this.element.parentElement.insertBefore(
      newInput.content.firstChild,
      this.element.nextSibling
    );

    insertedChild.querySelector('input').focus();
  }

  removeInput() {
    if (document.querySelectorAll('input').length == 1) return;
    if (this.inputTarget.value != '') return;

    this.element.previousSibling.querySelector('input').focus();
    this.element.remove();
  }

  typeValueChanged(value, previousValue) {
    if (!this.validTypes.includes(value)) {
      this.typeValue = previousValue;
      return;
    }

    this.inputTarget.setAttribute('type', this.typeValue);
    this.labelTarget.innerText = this.typeValue;
  }
}
```

```html
<body>
  <div data-controller="form-input" tabindex="0">
    <input
      type="text"
      data-action="keydown.ctrl+0->form-input#cycleTypeForward keydown.ctrl+9->form-input#cycleTypeBackward keydown.alt+down->form-input#insertInput keydown.alt+up->form-input#removeInput"
      data-form-input-target="input"
    />
    <label data-form-input-target="label"></label>
  </div>
</body>
```

## Key Concepts

### Modifying Input Type with Value Callbacks

Use Stimulus value change callbacks (`typeValueChanged`) to handle type changes. This provides a single entry point for validation and updates. The value is exposed in the DOM, allowing changes from other sources like Turbo Streams.

Validation ensures only valid types are used by checking against an array of valid types. When valid, update the element's type attribute and display it in the label.

Keyboard actions for type cycling:
- `keydown.ctrl+0->form-input#cycleTypeForward`
- `keydown.ctrl+9->form-input#cycleTypeBackward`

### Adding/Removing Inputs

Store the template HTML as a string in the controller. Create a template element programmatically, set its innerHTML, then insert the content into the DOM using `insertBefore`. Focus the newly inserted input for better UX.

Keyboard actions for input management:
- `keydown.alt+down->form-input#insertInput` - Add new input
- `keydown.alt+up->form-input#removeInput` - Remove current input

### Validation Rules

- Never remove the last input (maintain at least one input)
- Never remove inputs that contain values (only remove empty inputs)
- Focus management: focus newly added inputs, or focus previous sibling when removing

## Important Notes

- System shortcuts cannot be overridden (and doing so is an accessibility antipattern)
- Elements must have `tabindex="0"` to receive keyboard events if they are not naturally focusable
- Value callbacks provide validation and a single source of truth for state changes



## Pattern Card: KeyboardEvent Handling

**When to use**: Handle keyboard shortcuts without third-party libraries.

**GOOD - Stimulus action filters**:

```html
<div data-controller="shortcuts"
     data-action="keydown.ctrl+s@document->shortcuts#save
                  keydown.escape@document->shortcuts#cancel
                  keydown.enter->shortcuts#submit">
  <input type="text">
  <button>Save</button>
</div>
```

```javascript
export default class extends Controller {
  save(event) {
    event.preventDefault(); // Prevent browser save dialog
    // Save logic
  }

  cancel(event) {
    // Cancel logic
  }

  submit(event) {
    // Submit logic
  }
}
```

**Supported modifiers**: `ctrl`, `alt`, `shift`, `meta`  
**Supported keys**: `enter`, `tab`, `esc`, `space`, `up`, `down`, `left`, `right`, plus letter/number keys
