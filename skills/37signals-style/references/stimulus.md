# Stimulus Controllers

> Small, focused, reusable JavaScript controllers.

---

## Philosophy

52 Stimulus controllers split roughly 60/40 between reusable utilities and domain-specific logic. Controllers remain:
- **Single-purpose** - One job per controller
- **Configured via values/classes** - No hardcoded strings
- **Event-based communication** - Controllers dispatch events, don't call each other

---

## Reusable Controllers Catalog

These controllers are generic enough to copy into any Rails project.

### Copy-to-Clipboard Controller (25 lines)

Simple async clipboard API wrapper with visual feedback:

```javascript
// app/javascript/controllers/copy_to_clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { content: String }
  static classes = [ "success" ]

  async copy(event) {
    event.preventDefault()
    this.reset()

    try {
      await navigator.clipboard.writeText(this.contentValue)
      this.element.classList.add(this.successClass)
    } catch {}
  }

  reset() {
    this.element.classList.remove(this.successClass)
    this.#forceReflow()
  }

  #forceReflow() {
    this.element.offsetWidth
  }
}
```

**Usage:**
```html
<button data-controller="copy-to-clipboard"
        data-copy-to-clipboard-content-value="https://example.com/share"
        data-copy-to-clipboard-success-class="copied"
        data-action="click->copy-to-clipboard#copy">
  Copy Link
</button>
```

### Auto-Click Controller (7 lines)

Clicks an element when it connects. Perfect for auto-submitting forms:

```javascript
// app/javascript/controllers/auto_click_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.element.click()
  }
}
```

**Usage:** `<button data-controller="auto-click" data-action="...">` - triggers on page load.

### Element Removal Controller (7 lines)

Removes any element on action:

```javascript
// app/javascript/controllers/element_removal_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  remove() {
    this.element.remove()
  }
}
```

**Usage:**
```html
<div data-controller="element-removal">
  <button data-action="element-removal#remove">Dismiss</button>
</div>
```

### Toggle Class Controller (31 lines)

Toggle, add, or remove CSS classes:

```javascript
// app/javascript/controllers/toggle_class_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static classes = [ "toggle" ]
  static targets = [ "checkbox" ]

  toggle() {
    this.element.classList.toggle(this.toggleClass)
  }

  add() {
    this.element.classList.add(this.toggleClass)
  }

  remove() {
    this.element.classList.remove(this.toggleClass)
  }

  checkAll() {
    this.checkboxTargets.forEach(checkbox => checkbox.checked = true)
  }

  checkNone() {
    this.checkboxTargets.forEach(checkbox => checkbox.checked = false)
  }
}
```

### Auto-Resize Controller (32 lines)

Auto-expands textareas as you type:

```javascript
// app/javascript/controllers/autoresize_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { minHeight: { type: Number, default: 0 } }

  connect() {
    this.resize()
  }

  resize() {
    this.element.style.height = "auto"
    const newHeight = Math.max(this.minHeightValue, this.element.scrollHeight)
    this.element.style.height = `${newHeight}px`
  }
}
```

**Usage:**
```html
<textarea data-controller="autoresize"
          data-autoresize-min-height-value="100"
          data-action="input->autoresize#resize"></textarea>
```

### Dialog Controller (45 lines)

Native `<dialog>` management:

```javascript
// app/javascript/controllers/dialog_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.element.addEventListener("close", this.#onClose.bind(this))
  }

  disconnect() {
    this.element.removeEventListener("close", this.#onClose.bind(this))
  }

  open() {
    this.element.showModal()
  }

  close() {
    this.element.close()
  }

  closeOnOutsideClick(event) {
    if (event.target === this.element) {
      this.close()
    }
  }

  #onClose() {
    this.dispatch("closed")
  }
}
```

**Usage:**
```html
<dialog data-controller="dialog"
        data-action="click->dialog#closeOnOutsideClick keydown.esc->dialog#close">
  <h2>Modal Content</h2>
  <button data-action="dialog#close">Close</button>
</dialog>

<button data-action="dialog#open" data-dialog-target="trigger">
  Open Dialog
</button>
```

### Auto-Submit Controller (28 lines)

Debounced form auto-submission:

```javascript
// app/javascript/controllers/auto_submit_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { delay: { type: Number, default: 300 } }

  connect() {
    this.timeout = null
  }

  submit() {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.element.requestSubmit()
    }, this.delayValue)
  }

  submitNow() {
    clearTimeout(this.timeout)
    this.element.requestSubmit()
  }

  disconnect() {
    clearTimeout(this.timeout)
  }
}
```

**Usage:**
```html
<form data-controller="auto-submit" data-auto-submit-delay-value="500">
  <input type="text" data-action="input->auto-submit#submit">
  <select data-action="change->auto-submit#submitNow">
</form>
```

### Local Time Controller (40 lines)

Display times in user's local timezone:

```javascript
// app/javascript/controllers/local_time_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    datetime: String,
    format: { type: String, default: "relative" }
  }

  connect() {
    this.render()
  }

  render() {
    const date = new Date(this.datetimeValue)

    if (this.formatValue === "relative") {
      this.element.textContent = this.#relativeTime(date)
    } else {
      this.element.textContent = date.toLocaleString()
    }
  }

  #relativeTime(date) {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }
}
```

### Beacon Controller (20 lines)

Track views/reads by pinging a URL:

```javascript
// app/javascript/controllers/beacon_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { url: String }

  connect() {
    this.#sendBeacon()
  }

  #sendBeacon() {
    if (this.hasUrlValue) {
      navigator.sendBeacon(this.urlValue)
    }
  }
}
```

**Usage:**
```html
<div data-controller="beacon"
     data-beacon-url-value="/cards/123/reading">
  <!-- Content that should be marked as "read" -->
</div>
```

### Form Reset Controller (12 lines)

Reset form on successful submission:

```javascript
// app/javascript/controllers/form_reset_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  reset() {
    this.element.reset()
  }

  resetOnSuccess(event) {
    if (event.detail.success) {
      this.reset()
    }
  }
}
```

**Usage:**
```html
<form data-controller="form-reset"
      data-action="turbo:submit-end->form-reset#resetOnSuccess">
```

### Character Counter Controller (25 lines)

Show remaining characters:

```javascript
// app/javascript/controllers/character_counter_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "input", "counter" ]
  static values = { max: Number }

  connect() {
    this.update()
  }

  update() {
    const remaining = this.maxValue - this.inputTarget.value.length
    this.counterTarget.textContent = remaining

    if (remaining < 0) {
      this.counterTarget.classList.add("over-limit")
    } else {
      this.counterTarget.classList.remove("over-limit")
    }
  }
}
```

---

## Stimulus Best Practices

### Use Values API Over getAttribute

```javascript
// Good
static values = { url: String, delay: Number }
this.urlValue
this.delayValue

// Avoid
this.element.getAttribute("data-url")
```

### Use camelCase in JavaScript

```javascript
// Good
static values = { autoSubmit: Boolean }  // data-auto-submit-value

// Matches Rails conventions
```

### Always Clean Up in disconnect()

```javascript
disconnect() {
  clearTimeout(this.timeout)
  this.observer?.disconnect()
  this.element.removeEventListener("custom", this.handler)
}
```

### Use :self Action Filter

```javascript
// Only trigger on this element, not bubbled events
data-action="click:self->modal#close"
```

### Extract Shared Helpers to Modules

```javascript
// app/javascript/helpers/date_helpers.js
export function formatRelativeTime(date) { ... }

// app/javascript/controllers/local_time_controller.js
import { formatRelativeTime } from "../helpers/date_helpers"
```

### Dispatch Events for Communication

```javascript
// In controller
this.dispatch("selected", { detail: { id: this.idValue } })

// In HTML
data-action="dropdown:selected->form#updateField"
```

---

## File Organization

```
app/javascript/
├── controllers/
│   ├── application.js
│   ├── auto_click_controller.js
│   ├── auto_submit_controller.js
│   ├── autoresize_controller.js
│   ├── beacon_controller.js
│   ├── character_counter_controller.js
│   ├── copy_to_clipboard_controller.js
│   ├── dialog_controller.js
│   ├── element_removal_controller.js
│   ├── form_reset_controller.js
│   ├── local_time_controller.js
│   └── toggle_class_controller.js
└── helpers/
    ├── date_helpers.js
    └── dom_helpers.js
```
