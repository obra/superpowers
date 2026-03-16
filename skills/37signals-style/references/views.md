# Views

> Turbo Streams, partials over components, and server-rendered HTML.

---

## Turbo Streams for Partial Updates

```erb
<%# app/views/cards/comments/create.turbo_stream.erb %>
<%= turbo_stream.before [@card, :new_comment],
    partial: "cards/comments/comment",
    locals: { comment: @comment } %>

<%= turbo_stream.update [@card, :new_comment],
    partial: "cards/comments/new",
    locals: { card: @card } %>
```

## Morphing for Complex Updates

```erb
<%# app/views/cards/update.turbo_stream.erb %>
<%= turbo_stream.replace dom_id(@card, :card_container),
    partial: "cards/container",
    method: :morph,
    locals: { card: @card.reload } %>
```

## Turbo Stream Subscriptions in Views

```erb
<%# app/views/cards/show.html.erb %>
<%= turbo_stream_from @card %>
<%= turbo_stream_from @card, :activity %>

<div data-controller="beacon" data-beacon-url-value="<%= card_reading_path(@card) %>">
  <%= render "cards/container", card: @card %>
  <%= render "cards/messages", card: @card %>
</div>
```

---

## Partials Over ViewComponents

```erb
<%# Use standard partials %>
<%= render "cards/container", card: @card %>
<%= render "cards/display/perma/meta", card: @card %>

<%# With caching %>
<% cache card do %>
  <section id="<%= dom_id(card, :card_container) %>">
    <%= render "cards/container/content", card: card %>
  </section>
<% end %>
```

---

## Fragment Caching Patterns

### Basic Fragment Cache

```erb
<% cache card do %>
  <%= render "cards/preview", card: card %>
<% end %>
```

### Composite Cache Keys

```erb
<%# Include context that affects output %>
<% cache [card, Current.user, timezone_from_cookie] do %>
  <%= render "cards/preview", card: card %>
<% end %>
```

### Collection Caching

```erb
<%= render partial: "cards/preview",
           collection: @cards,
           cached: true %>
```

### Cache with Touch Chains

```ruby
class Comment < ApplicationRecord
  belongs_to :card, touch: true  # Invalidates card cache
end

class Card < ApplicationRecord
  belongs_to :board, touch: true  # Invalidates board cache
end
```

---

## View Helpers: Stimulus-Integrated Components

### Dialog Helper

```ruby
# app/helpers/dialog_helper.rb
module DialogHelper
  def dialog_tag(id, **options, &block)
    options[:data] ||= {}
    options[:data][:controller] = "dialog #{options.dig(:data, :controller)}".strip
    options[:data][:action] = "click->dialog#closeOnOutsideClick keydown.esc->dialog#close"

    tag.dialog(id: id, **options, &block)
  end

  def dialog_close_button(**options)
    options[:data] ||= {}
    options[:data][:action] = "dialog#close"

    tag.button("Close", **options)
  end
end
```

**Usage:**

```erb
<%= dialog_tag "settings-dialog", class: "settings" do %>
  <h2>Settings</h2>
  <%= dialog_close_button class: "btn" %>
<% end %>
```

### Auto-Submit Form Helper

```ruby
# app/helpers/form_helper.rb
module FormHelper
  def auto_submit_form_with(**options, &block)
    options[:data] ||= {}
    options[:data][:controller] = "auto-submit #{options.dig(:data, :controller)}".strip
    options[:data][:auto_submit_delay_value] = options.delete(:delay) || 300

    form_with(**options, &block)
  end
end
```

### Button Helpers

```ruby
# app/helpers/button_helper.rb
module ButtonHelper
  def copy_button(content:, **options)
    options[:data] ||= {}
    options[:data][:controller] = "copy-to-clipboard"
    options[:data][:copy_to_clipboard_content_value] = content
    options[:data][:copy_to_clipboard_success_class] = "copied"
    options[:data][:action] = "click->copy-to-clipboard#copy"

    tag.button("Copy", **options)
  end
end
```

---

## HTTP Caching in Views

### Fresh When with ETags

```ruby
# In controller
def show
  @card = Card.find(params[:id])
  fresh_when etag: [@card, Current.user, timezone_from_cookie]
end
```

### Conditional GET

```ruby
def index
  @cards = Card.recent
  fresh_when etag: @cards
end
```

---

## Turbo Frame Patterns

### Lazy Loading Frames

```erb
<%= turbo_frame_tag "notifications",
    src: notifications_path,
    loading: :lazy do %>
  <p>Loading notifications...</p>
<% end %>
```

### Frame for Inline Editing

```erb
<%= turbo_frame_tag dom_id(card, :title) do %>
  <h1><%= card.title %></h1>
  <%= link_to "Edit", edit_card_path(card) %>
<% end %>
```

### Frame-Targeted Forms

```erb
<%= turbo_frame_tag dom_id(@card, :edit) do %>
  <%= form_with model: @card do |f| %>
    <%= f.text_field :title %>
    <%= f.submit %>
  <% end %>
<% end %>
```

---

## Broadcast Patterns

### Model-Level Broadcasting

```ruby
class Comment < ApplicationRecord
  after_create_commit -> {
    broadcast_append_to card, target: "comments"
  }

  after_destroy_commit -> {
    broadcast_remove_to card
  }
end
```

### Scoped Broadcasting (Multi-Tenant)

```ruby
# Always scope broadcasts by account
broadcast_to [Current.account, card], target: "comments"
```

---

## Rendering Conventions

### Prefer Locals Over Instance Variables

```erb
<%# Good - explicit dependencies %>
<%= render "cards/preview", card: card, draggable: true %>

<%# Avoid - implicit dependencies %>
<%= render "cards/preview" %>  <%# Uses @card implicitly %>
```

### Partial Naming

```
app/views/
├── cards/
│   ├── _card.html.erb           # Single card
│   ├── _preview.html.erb        # Card preview/summary
│   ├── _container.html.erb      # Card with wrapper
│   ├── _form.html.erb           # Card form
│   └── container/
│       └── _content.html.erb    # Nested partial
```

### DOM ID Conventions

```erb
<%# Use Rails dom_id helper %>
<div id="<%= dom_id(card) %>">           <%# card_123 %>
<div id="<%= dom_id(card, :preview) %>"> <%# preview_card_123 %>
<div id="<%= dom_id(card, :comments) %>"> <%# comments_card_123 %>
```
