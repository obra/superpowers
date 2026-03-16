# Hotwire Patterns

> Turbo and Stimulus best practices from 37signals.

---

## Turbo Morphing

- Enable globally: `turbo_refreshes_with method: :morph, scroll: :preserve`
- Listen for `turbo:morph-element` to restore client-side state
- Use `data-turbo-permanent` for elements that shouldn't refresh
- Ensure unique IDs - duplicates break morphing
- Set `refresh: :morph` on frames with `src` to prevent removal during morphs ([hotwired/turbo#1452](https://github.com/hotwired/turbo/pull/1452))

## Turbo Frames

- Wrap form sections in frames to prevent reset on partial updates
- Lazy-load expensive content via frames with `loading: "lazy"`
- Use `turbo_stream.replace` instead of redirects for in-place updates
- Use `refresh: :morph` on lazy-loaded frames to prevent flicker
- Use `data-turbo-frame="_parent"` to target parent frame without knowing its ID ([hotwired/turbo#1446](https://github.com/hotwired/turbo/pull/1446))

### Nested Frame Targeting

Target parent frames without hardcoding IDs:

```html
<turbo-frame id="modal">
  <turbo-frame id="search-results">
    <!-- Component doesn't need to know parent's ID -->
    <a href="/items/123" data-turbo-frame="_parent">
      Select Item
    </a>
  </turbo-frame>
</turbo-frame>
```

## Common Turbo Issues

| Problem | Solution |
|---------|----------|
| Timers not updating after morph | Bind to `turbo:morph-element` event |
| Forms resetting on page refresh | Wrap in turbo frames |
| Pagination breaking | Ensure unique IDs |
| Flickering on replace | Use `method: :morph` |
| localStorage state lost | Restore on `turbo:morph-element` |

## Stimulus Best Practices

- Use **Values API** over `getAttribute()` - cleaner, type-coerced
- Use **camelCase** in JavaScript (even for data attributes)
- Always clean up in `disconnect()` - timers, listeners
- Use `:self` action filter to scope events
- Extract shared helpers to modules (`date_helpers.js`, `timing_helpers.js`)

### Timer Cleanup Pattern

Always clean up intervals and timeouts in `disconnect()`:

```javascript
export default class extends Controller {
  #timer

  connect() {
    this.#timer = setInterval(() => this.refresh(), 30_000)
  }

  disconnect() {
    clearInterval(this.#timer)
  }
}
```

### Timing Helpers

Extract common timing utilities to shared modules:

```javascript
// helpers/timing_helpers.js
export function throttle(fn, delay = 1000) {
  let timeoutId = null
  return (...args) => {
    if (!timeoutId) {
      fn(...args)
      timeoutId = setTimeout(() => timeoutId = null, delay)
    }
  }
}

export function debounce(fn, delay = 1000) {
  let timeoutId = null
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function nextFrame() {
  return new Promise(requestAnimationFrame)
}

export function nextEvent(element, eventName) {
  return new Promise(resolve => 
    element.addEventListener(eventName, resolve, { once: true })
  )
}
```

## State Persistence

- localStorage for UI preferences (expanded panels, draft content)
- Accept flash-of-collapsed-content as acceptable tradeoff
- Restore state on `turbo:morph-element` events
- Use `nextFrame()` helper to wait for morph completion

### Restoring localStorage on Morph

```javascript
export default class extends Controller {
  static targets = ["input"]
  static values = { key: String }

  initialize() {
    this.save = debounce(this.save.bind(this), 300)
  }

  connect() {
    this.restoreContent()
  }

  save() {
    const content = this.inputTarget.value
    if (content) {
      localStorage.setItem(this.keyValue, content)
    } else {
      localStorage.removeItem(this.keyValue)
    }
  }

  async restoreContent() {
    await nextFrame()
    const saved = localStorage.getItem(this.keyValue)
    if (saved) {
      this.inputTarget.value = saved
    }
  }
}
```

Wire it up to restore after morphs:

```erb
<%= form.text_area :body,
      data: {
        local_save_target: "input",
        action: "input->local-save#save turbo:morph-element->local-save#restoreContent"
      } %>
```

## Links Over JavaScript

- Filter chips as plain `<a>` tags, not JS-powered buttons
- Better browser affordances (right-click, cmd+click)
- Simpler, more declarative code
- Let the browser do what browsers do

## Morphing + Turbo Streams

When replacing content containing Turbo Frames:

```ruby
render turbo_stream: turbo_stream.replace(
  [@record, :container],
  partial: "records/container",
  method: :morph  # Prevents flickering
)
```

Mark nested frames as permanent:

```erb
<%= turbo_frame_tag record, :details,
    data: { turbo_permanent: true } %>
```

## Element-Level Morph Events

Prefer element-specific events over global for better performance:

```ruby
# In helper
def local_datetime_tag(datetime, style: :time, **attributes)
  tag.time datetime: datetime.to_i,
    data: {
      local_time_target: style,
      action: "turbo:morph-element->local-time#refreshTarget"
    }
end
```

More efficient than `turbo:morph@window` because it only fires on the specific element.

## Turbo Frames Preserve Form State

Wrap independent sections in frames:

```erb
<%= turbo_frame_tag @record, :settings do %>
  <%= form_with model: @record do |form| %>
    <!-- form fields -->
  <% end %>
<% end %>
```

Respond with targeted replacement instead of redirect:

```ruby
def update
  @record.update(record_params)
  render turbo_stream: turbo_stream.replace(
    [@record, :settings],
    partial: "records/settings"
  )
end
```

## POST + Turbo Streams for UI State

For state toggles (expand/collapse, watch/unwatch), use POST not GET:

```erb
<%= link_to toggle_path, data: { turbo_method: "post" } %>
```

Controller returns stream update instead of redirect.

## Frame Morphing Configuration

Set `refresh: :morph` on frames with `src`:

```erb
<%= turbo_frame_tag "notifications",
      src: notifications_path,
      refresh: "morph" %>
```

Prevents frame removal during page morphs.

## Broadcasts with Turbo Streams

### Model-Level Broadcasts

Use `broadcasts_refreshes` for automatic updates:

```ruby
module Card::Broadcastable
  extend ActiveSupport::Concern

  included do
    broadcasts_refreshes
  end
end
```

### Subscribing to Broadcasts

```erb
<%= turbo_stream_from Current.user, :notifications %>
```

## Auto-Submit Forms

Submit forms automatically on connect (useful for redirects/searches):

```javascript
export default class extends Controller {
  connect() {
    this.element.addEventListener("turbo:submit-end", 
      this.#handleSubmitEnd.bind(this), { once: true })
    this.submit()
  }

  submit() {
    this.element.setAttribute("aria-busy", "true")
    this.element.requestSubmit()
  }

  #handleSubmitEnd(event) {
    if (event.detail.success) {
      this.element.remove()
    } else {
      this.element.setAttribute("aria-busy", "false")
    }
  }
}
```

## Auto-Save Forms

Save forms automatically after changes with debouncing:

```javascript
const AUTOSAVE_INTERVAL = 3000

export default class extends Controller {
  #timer

  disconnect() {
    this.submit()
  }

  async submit() {
    if (this.#dirty) {
      await this.#save()
    }
  }

  change(event) {
    if (event.target.form === this.element && !this.#dirty) {
      this.#scheduleSave()
    }
  }

  #scheduleSave() {
    this.#timer = setTimeout(() => this.#save(), AUTOSAVE_INTERVAL)
  }

  async #save() {
    clearTimeout(this.#timer)
    this.#timer = null
    this.element.requestSubmit()
  }

  get #dirty() {
    return !!this.#timer
  }
}
```

## Lazy Loading on Visibility

Fetch content when element becomes visible:

```javascript
export default class extends Controller {
  static values = { url: String }

  connect() {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        this.#fetch()
        observer.disconnect()
      }
    })
    observer.observe(this.element)
  }

  #fetch() {
    get(this.urlValue, { responseKind: "turbo-stream" })
  }
}
```

## Dialog Controller Pattern

Handle dialogs with proper accessibility and lazy-loading:

```javascript
export default class extends Controller {
  static targets = ["dialog"]
  static values = { modal: { type: Boolean, default: false } }

  connect() {
    this.dialogTarget.setAttribute("aria-hidden", "true")
  }

  open() {
    if (this.modalValue) {
      this.dialogTarget.showModal()
    } else {
      this.dialogTarget.show()
    }
    this.loadLazyFrames()
    this.dialogTarget.setAttribute("aria-hidden", "false")
  }

  close() {
    this.dialogTarget.close()
    this.dialogTarget.setAttribute("aria-hidden", "true")
  }

  closeOnClickOutside({ target }) {
    if (!this.element.contains(target)) this.close()
  }

  // Prevent morphing from closing open dialogs
  preventCloseOnMorphing(event) {
    if (event.detail?.attributeName === "open") {
      event.preventDefault()
    }
  }

  loadLazyFrames() {
    this.dialogTarget.querySelectorAll("turbo-frame").forEach(frame => {
      frame.loading = "eager"
    })
  }
}
```

## Copy to Clipboard

Simple clipboard pattern with success feedback:

```javascript
export default class extends Controller {
  static values = { content: String }
  static classes = ["success"]

  async copy(event) {
    event.preventDefault()
    this.element.classList.remove(this.successClass)
    this.element.offsetWidth // Force reflow for animation reset

    try {
      await navigator.clipboard.writeText(this.contentValue)
      this.element.classList.add(this.successClass)
    } catch {}
  }
}
```

## Hotkey Controller

Handle keyboard shortcuts:

```javascript
export default class extends Controller {
  click(event) {
    if (this.#isClickable && !this.#shouldIgnore(event)) {
      event.preventDefault()
      this.element.click()
    }
  }

  #shouldIgnore(event) {
    return event.defaultPrevented || 
           event.target.closest("input, textarea, [contenteditable]")
  }

  get #isClickable() {
    return getComputedStyle(this.element).pointerEvents !== "none"
  }
}
```

Usage:

```erb
<button data-controller="hotkey"
        data-action="keydown.n@document->hotkey#click">
  New Item <kbd>N</kbd>
</button>
```

## Stimulus for Cached Fragment Personalization

Cached partials can't access `Current.user`. Move user-specific styling to client-side:

```javascript
// initializers/current.js
class Current {
  get user() {
    const id = document.head.querySelector('meta[name="current-user-id"]')?.content
    return id ? { id: parseInt(id) } : null
  }
}
window.Current = new Current()
```

```javascript
// controllers/personalize_controller.js
export default class extends Controller {
  static targets = ["item"]
  static classes = ["mine"]

  itemTargetConnected(element) {
    if (element.dataset.creatorId == Current.user?.id) {
      element.classList.add(this.mineClass)
    }
  }
}
```

```erb
<!-- In layout -->
<meta name="current-user-id" content="<%= Current.user&.id %>">

<!-- Cached partial uses data attributes, not conditionals -->
<div data-creator-id="<%= comment.creator_id %>"
     data-personalize-target="item">
```

## Frame Reload on Document Morph

Reload frames after document-level morphs:

```javascript
export default class extends Controller {
  reload() {
    this.element.reload()
  }

  morphReload(event) {
    const newElement = event.detail.newElement
    if (newElement?.tagName === "TURBO-FRAME") {
      event.preventDefault()
      this.element.reload()
    }
  }
}
```

```erb
<%= turbo_frame_tag "dynamic-content",
      src: content_path,
      data: {
        controller: "frame",
        action: "turbo:morph@document->frame#reload"
      } %>
```

## Navigable List Pattern

Keyboard-navigable lists with arrow key support:

```javascript
export default class extends Controller {
  static targets = ["item"]
  static values = {
    selectionAttribute: { type: String, default: "aria-selected" },
    actionableItems: { type: Boolean, default: false }
  }

  connect() {
    this.selectFirst()
  }

  navigate(event) {
    switch (event.key) {
      case "ArrowDown": this.#selectNext(); break
      case "ArrowUp": this.#selectPrevious(); break
      case "Enter": this.#activateCurrent(event); break
    }
  }

  selectFirst() {
    this.#selectItem(this.#visibleItems[0])
  }

  #selectItem(item) {
    if (!item) return
    this.#clearSelection()
    item.setAttribute(this.selectionAttributeValue, "true")
    item.scrollIntoView({ block: "nearest" })
    this.currentItem = item
  }

  #clearSelection() {
    this.itemTargets.forEach(item => 
      item.removeAttribute(this.selectionAttributeValue))
  }

  get #visibleItems() {
    return this.itemTargets.filter(item => !item.hidden)
  }

  #selectNext() {
    const index = this.#visibleItems.indexOf(this.currentItem)
    if (index < this.#visibleItems.length - 1) {
      this.#selectItem(this.#visibleItems[index + 1])
    }
  }

  #selectPrevious() {
    const index = this.#visibleItems.indexOf(this.currentItem)
    if (index > 0) {
      this.#selectItem(this.#visibleItems[index - 1])
    }
  }

  #activateCurrent(event) {
    if (this.actionableItemsValue && this.currentItem) {
      const clickable = this.currentItem.querySelector("a,button")
      clickable?.click()
      event.preventDefault()
    }
  }
}
```

## Turbo Permanent Elements

Use `data-turbo-permanent` to preserve elements across navigations:

```erb
<!-- Footer frames that persist across page loads -->
<div id="footer_frames" data-turbo-permanent>
  <%= render "notifications/tray" %>
  <%= render "quick_actions/bar" %>
</div>

<!-- Rich text editor content during morphs -->
<div class="editor-content" data-turbo-permanent>
  <%= form.rich_text_area :body %>
</div>
```

## Testing Turbo Frames

Use the built-in assertion helpers ([hotwired/turbo-rails#742](https://github.com/hotwired/turbo-rails/pull/742)):

```ruby
# Assert frame exists with specific attributes
assert_turbo_frame "comments", loading: "lazy"
assert_turbo_frame @user, :profile, target: "_top"

# Assert frame contains specific content
assert_turbo_frame "search-results" do
  assert_select "li", count: 5
end

# Assert frame doesn't exist
assert_no_turbo_frame "admin-panel"
```

## Turbo Flash Helper

Create a helper for flash messages in Turbo Stream responses:

```ruby
module TurboFlash
  extend ActiveSupport::Concern

  included do
    helper_method :turbo_stream_flash
  end

  private
    def turbo_stream_flash(**flash_options)
      turbo_stream.replace(:flash,
        partial: "layouts/shared/flash",
        locals: { flash: flash_options })
    end
end
```

Usage in controller:

```ruby
def create
  @record = Record.create!(record_params)
  render turbo_stream: [
    turbo_stream.prepend("records", @record),
    turbo_stream_flash(notice: "Created successfully")
  ]
end
```

## Drag and Drop Patterns

### Simple Drag Controller

For basic D&D between containers, use a focused controller instead of heavyweight sortable libraries:

```javascript
export default class extends Controller {
  static targets = ["item", "container"]
  static values = { url: String }
  static classes = ["draggedItem", "hoverContainer"]

  async dragStart(event) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.dropEffect = "move"
    
    await nextFrame() // Wait for drag to start
    this.dragItem = event.target.closest("[data-drag-target='item']")
    this.sourceContainer = this.dragItem.closest("[data-drag-target='container']")
    this.dragItem.classList.add(this.draggedItemClass)
  }

  dragOver(event) {
    event.preventDefault()
    const container = event.target.closest("[data-drag-target='container']")
    this.#clearContainerHoverClasses()

    if (container && container !== this.sourceContainer) {
      container.classList.add(this.hoverContainerClass)
    }
  }

  async drop(event) {
    const container = event.target.closest("[data-drag-target='container']")
    if (!container || container === this.sourceContainer) return

    this.wasDropped = true
    // POST to server, let it re-render the column
    await post(this.urlValue, {
      body: JSON.stringify({
        item_id: this.dragItem.dataset.id,
        target: container.dataset.column
      })
    })
  }

  dragEnd() {
    this.dragItem.classList.remove(this.draggedItemClass)
    this.#clearContainerHoverClasses()
    if (this.wasDropped) this.dragItem.remove()
    this.sourceContainer = null
    this.dragItem = null
    this.wasDropped = false
  }

  #clearContainerHoverClasses() {
    this.containerTargets.forEach(c => 
      c.classList.remove(this.hoverContainerClass))
  }
}
```

**Key insights:**
- Use `await nextFrame()` before applying drag classes (prevents visual glitches)
- Track source container to prevent dropping on self
- Optimistically remove on successful drop
- Let the server handle ordering logic and re-render

### Drag Visual Feedback

```css
.drag--dragged-item {
  filter: grayscale(1) brightness(0.97);
  opacity: 0.6;
  outline: 2px dashed var(--color-accent);
}

.drag--hover-container {
  background-color: var(--color-drop-zone);
  outline: 2px dashed var(--color-accent);
  transition: background-color 200ms;
}

/* Disable hover states during drag to prevent flicker */
ul:not(.dragging) li:hover {
  background-color: var(--hover-color);
}
```

### Conditional Draggable Items

Make draggability a render-time decision:

```erb
<%= render partial: "items/item",
           collection: @items,
           locals: { draggable: @allow_reorder } %>
```

```erb
<%# In the partial %>
<article draggable="<%= local_assigns.fetch(:draggable, false) %>"
         data-drag-target="item"
         data-id="<%= item.id %>">
```

### Accessibility for Drag Handles

```erb
<button class="drag-handle">
  <%= image_tag "drag.svg", aria: { hidden: true } %>
  <span class="visually-hidden">
    Drag to reorder
  </span>
</button>
```

### Using @rails/request.js with Turbo

Make `@rails/request.js` use Turbo's fetch for proper integration:

```javascript
// application.js
window.fetch = Turbo.fetch
```

## Progressive Installation

Show interactive UI only after JavaScript loads:

```javascript
connect() {
  this.element.classList.add("installed")
}
```

```css
.interactive-widget {
  visibility: hidden;
}

.interactive-widget.installed {
  visibility: visible;
}
```

Also restore after morphs:

```erb
data-action="turbo:morph@document->widget#install"
```
