# Performance Patterns

> Database, CSS, and rendering optimizations from 37signals.

---

## CSS Performance

### Avoid Complex `:has()` Selectors
Safari freezes on complex nested `:has()` selectors ([#1089](https://github.com/basecamp/fizzy/pull/1089)).
Prefer simpler selectors over clever CSS.

### View Transitions
Remove unnecessary `view-transition-name` causing navigation jank.

## Database Performance

### N+1 → JOINs
Replace `find_each` loops with JOINs for bulk operations ([#1129](https://github.com/basecamp/fizzy/pull/1129)).

Accept "unmaintainable" SQL when performance requires it:
> "Way way way faster but feels unmaintainable"

### Counter Caches
Fast reads, but callbacks are bypassed. Consider manual approach if you need side effects.

## Pagination

- Start with reasonable page sizes (25-50)
- Reduce if initial render is slow ([#1089](https://github.com/basecamp/fizzy/pull/1089): 50 → 25)
- Use "Load more" buttons or intersection observer
- Separate pagination per column/section

## Active Storage

### Read Replicas
Use `preprocessed: true` - lazy generation fails on read-only replicas ([#767](https://github.com/basecamp/fizzy/pull/767))

### Slow Uploads
Extend signed URL expiry from default 5 min to 48 hours ([#773](https://github.com/basecamp/fizzy/pull/773)).
Cloudflare buffering can exceed default timeout.

### Large Files
Skip previews above size threshold (e.g., 16MB) to avoid timeouts ([#941](https://github.com/basecamp/fizzy/pull/941))

### Avatars
- Redirect to blob URL instead of streaming through Rails
- Define thumbnail variants for consistent sizing
- Faster than proxying through the app

## Rendering Performance

### Lazy Loading
- Convert expensive menus to turbo frames
- Load on interaction, not page load
- Reduces initial render time significantly

### Debouncing
100ms debounce on filter search feels responsive ([#567](https://github.com/basecamp/fizzy/pull/567))

## Puma/Ruby Tuning ([#1283](https://github.com/basecamp/fizzy/pull/1283))

```ruby
# config/puma.rb
workers Concurrent.physical_processor_count
threads 1, 1

before_fork do
  Process.warmup  # GC, compact, malloc_trim for CoW
end
```

Use `autotuner` gem to collect data and suggest tuning.

## N+1 Prevention ([#1747](https://github.com/basecamp/fizzy/pull/1747))

Use `prosopite` gem for detection. Replace:
```ruby
# Bad - extra query
assignments.exists? assignee: user

# Good - in-memory
assignments.any? { |a| a.assignee_id == user.id }
```

Create `preloaded` scopes:
```ruby
scope :preloaded, -> {
  includes(:column, :tags, board: [:entropy, :columns])
}
```

## Optimistic UI for D&D ([#1927](https://github.com/basecamp/fizzy/pull/1927))

Insert immediately, request async:
```javascript
#insertDraggedItem(container, item) {
  // Insert at correct position respecting priority
  const topItems = container.querySelectorAll("[data-drag-and-drop-top]")
  // ... insert logic
}

await this.#submitDropRequest(item, container)
```

## Batch SQL Over N+1 Loops ([#1129](https://github.com/basecamp/fizzy/pull/1129))

Replace `find_each` with JOINs:
```ruby
# Single query with JOINs instead of N queries
user.mentions
  .joins("LEFT JOIN cards ON ...")
  .joins("LEFT JOIN comments ON ...")
  .where("cards.collection_id = ?", id)
  .destroy_all
```
