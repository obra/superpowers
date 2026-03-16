# Caching Patterns

> HTTP caching and fragment caching lessons from 37signals.

---

## HTTP Caching (ETags)

### How ETags Work

ETags let the browser avoid re-downloading unchanged content. Here's the flow:

1. **First request**: Server responds with content + ETag header (a fingerprint of the data)
2. **Subsequent requests**: Browser sends `If-None-Match` header with the ETag
3. **Server checks**: If content unchanged, responds with `304 Not Modified` (no body)
4. **Browser uses cache**: Displays cached content without re-downloading

In Rails, `fresh_when` computes an ETag from your objects and halts rendering if the browser's cache is still valid:

```ruby
def show
  fresh_when etag: @card  # Uses @card.cache_key_with_version
end
```

For multiple objects, pass an array—Rails combines them into a single ETag:

```ruby
def show
  @tags = Current.account.tags.alphabetically
  @boards = Current.user.boards.ordered_by_recently_accessed
  
  fresh_when etag: [@tags, @boards]
end
```

The ETag is computed from each object's `cache_key_with_version` (which includes `updated_at`), so any change to any object invalidates the cache.

### Don't HTTP Cache Forms

CSRF tokens get stale → 422 errors on submit ([#1607](https://github.com/basecamp/fizzy/pull/1607))

Remove `fresh_when` from pages with forms.

### Public Caching

- Safe for read-only public pages
- 30 seconds is reasonable ([#1377](https://github.com/basecamp/fizzy/pull/1377))
- Use concern to DRY up cache headers

## Fragment Caching

### Basic Pattern

```ruby
# Bad - same cache for different contexts
cache card

# Good - includes rendering context
cache [card, previewing_card?]
cache [card, Current.user.id]  # if user-specific
```

### Include What Affects Output
- Timezone affects rendered times
- User ID affects personalized content
- Filter state affects what's shown

### Touch Chains for Dependencies ([#566](https://github.com/basecamp/fizzy/pull/566))

```ruby
class Workflow::Stage < ApplicationRecord
  belongs_to :workflow, touch: true
end
```

Changes to children automatically update parent timestamps:

```ruby
# View - workflow changes when any stage changes
cache [card, card.collection.workflow]
```

### Domain Models for Cache Keys ([#1132](https://github.com/basecamp/fizzy/pull/1132))

For complex views, create dedicated cache key objects:

```ruby
class Cards::Columns
  def cache_key
    ActiveSupport::Cache.expand_cache_key([
      considering, on_deck, doing, closed,
      Workflow.all, user_filtering
    ])
  end
end
```

## Lazy-Loaded Content with Turbo Frames ([#1089](https://github.com/basecamp/fizzy/pull/1089))

Expensive menus (with multiple database queries) can slow down every page load. Convert them to lazy-loaded turbo frames that only load when needed:

```erb
<%# app/views/my/_menu.html.erb %>
<nav class="nav" data-controller="dialog"
     data-action="mouseenter->dialog#loadLazyFrames">
  <button data-action="click->dialog#open">Menu</button>

  <%= tag.dialog class: "popup", data: { dialog_target: "dialog" } do %>
    <%= turbo_frame_tag "my_menu", 
          src: my_menu_path, 
          loading: :lazy, 
          target: "_top" do %>
      <%# Placeholder content while loading %>
      <%= render "my/menus/skeleton" %>
    <% end %>
  <% end %>
</nav>
```

The controller loads the expensive data only when requested:

```ruby
# app/controllers/my/menus_controller.rb
class My::MenusController < ApplicationController
  def show
    @filters = Current.user.filters.all
    @boards = Current.user.boards.ordered_by_recently_accessed
    @tags = Current.account.tags.alphabetically
    @users = Current.account.users.active.alphabetically

    fresh_when etag: [@filters, @boards, @tags, @users]
  end
end
```

**Key points:**
- `loading: :lazy` defers the request until the frame is visible
- The frame only loads when the dialog opens (triggered by `mouseenter` or click)
- `fresh_when` with ETags prevents re-rendering if data hasn't changed
- Initial page load is faster since the menu queries are deferred

## User-Specific Content in Cached Fragments

When caching breaks because of user-specific elements, move the personalization to client-side JavaScript:

```erb
<%# Instead of breaking the cache with conditionals: %>
<% cache card do %>
  <div data-creator-id="<%= card.creator_id %>"
       data-controller="ownership"
       data-ownership-current-user-value="<%= Current.user.id %>">
    <button data-ownership-target="ownerOnly" 
            class="hidden">Delete</button>
  </div>
<% end %>
```

```javascript
// app/javascript/controllers/ownership_controller.js
export default class extends Controller {
  static targets = ["ownerOnly"]
  static values = { currentUser: Number }

  connect() {
    const creatorId = parseInt(this.element.dataset.creatorId)
    if (creatorId === this.currentUserValue) {
      this.ownerOnlyTargets.forEach(el => el.classList.remove("hidden"))
    }
  }
}
```

**Common patterns:**
- "You commented..." indicators → check creator ID via JS
- Delete/edit buttons → show/hide based on ownership
- "New" badges → compare timestamps client-side

See also: [Stimulus for Cached Fragment Personalization](hotwire.md#stimulus-for-cached-fragment-personalization-124) for the full pattern using a global `Current` object.

## Extract Dynamic Content to Turbo Frames ([#317](https://github.com/basecamp/fizzy/pull/317))

When part of a cached fragment needs frequent updates, extract it to a turbo frame:

```erb
<% cache [card, board] do %>
  <article class="card">
    <h2><%= card.title %></h2>
    
    <%# Assignment changes often - don't let it bust the cache %>
    <%= turbo_frame_tag card, :assignment, 
          src: card_assignment_path(card),
          loading: :lazy,
          refresh: :morph do %>
      <%# Placeholder %>
    <% end %>
  </article>
<% end %>
```

The assignment dropdown loads independently and can update without invalidating the card cache.
