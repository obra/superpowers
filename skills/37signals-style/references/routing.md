# Routing Patterns

> Everything is CRUD - resource-based routing over custom actions.

---

## The CRUD Principle

Every action maps to a CRUD verb. When something doesn't fit, **create a new resource**.

```ruby
# BAD: Custom actions on existing resource
resources :cards do
  post :close
  post :reopen
  post :archive
  post :gild
end

# GOOD: New resources for each state change
resources :cards do
  resource :closure      # POST to close, DELETE to reopen
  resource :goldness     # POST to gild, DELETE to ungild
  resource :not_now      # POST to postpone
  resource :pin          # POST to pin, DELETE to unpin
  resource :watch        # POST to watch, DELETE to unwatch
end
```

**Why**: Standard REST verbs map cleanly to controller actions. No guessing what HTTP method to use.

## Real Examples from Fizzy Routes

```ruby
# config/routes.rb

resources :cards do
  scope module: :cards do
    resource :board           # Moving card to different board
    resource :closure         # Closing/reopening
    resource :column          # Assigning to workflow column
    resource :goldness        # Highlighting as important
    resource :image           # Managing header image
    resource :not_now         # Postponing
    resource :pin             # Pinning to sidebar
    resource :publish         # Publishing draft
    resource :reading         # Marking as read
    resource :triage          # Triaging
    resource :watch           # Subscribing to updates

    resources :assignments    # Managing assignees
    resources :steps          # Checklist items
    resources :taggings       # Tags
    resources :comments do
      resources :reactions    # Emoji reactions
    end
  end
end
```

## Noun-Based Resources

Turn verbs into nouns:

| Action | Resource |
|--------|----------|
| Close a card | `card.closure` |
| Watch a board | `board.watching` |
| Pin an item | `item.pin` |
| Publish a board | `board.publication` |
| Assign a user | `card.assignment` |
| Mark as golden | `card.goldness` |
| Postpone | `card.not_now` |

## Namespace for Context

```ruby
# Board-specific resources
resources :boards do
  scope module: :boards do
    resource :publication    # Publishing publicly
    resource :entropy        # Auto-postpone settings
    resource :involvement    # User's involvement level

    namespace :columns do
      resource :not_now      # "Not Now" pseudo-column
      resource :stream       # Main stream view
      resource :closed       # Closed cards view
    end
  end
end
```

## Use `resolve` for Custom URL Generation

Make `polymorphic_url` work correctly for nested resources:

```ruby
# config/routes.rb

resolve "Comment" do |comment, options|
  options[:anchor] = ActionView::RecordIdentifier.dom_id(comment)
  route_for :card, comment.card, options
end

resolve "Notification" do |notification, options|
  polymorphic_url(notification.notifiable_target, options)
end
```

**Why**: This lets you use `url_for(@comment)` and get the correct card URL with anchor.

## Shallow Nesting

Use `shallow: true` to avoid deep nesting:

```ruby
resources :boards, shallow: true do
  resources :cards
end

# Generates:
# /boards/:board_id/cards      (index, new, create)
# /cards/:id                   (show, edit, update, destroy)
```

## Singular Resources

Use `resource` (singular) for one-per-parent resources:

```ruby
resources :cards do
  resource :closure      # A card has one closure state
  resource :watching     # A user's watch status on a card
  resource :goldness     # A card is either golden or not
end
```

## Module Scoping

Group related controllers without changing URLs:

```ruby
# Using scope module (no URL prefix)
resources :cards do
  scope module: :cards do
    resource :closure      # Cards::ClosuresController at /cards/:id/closure
  end
end

# Using namespace (adds URL prefix)
namespace :cards do
  resources :drops         # Cards::DropsController at /cards/drops
end
```

## Path-Based Multi-Tenancy

Account ID in URL prefix, handled by middleware:

```ruby
# Middleware extracts /:account_id and sets Current.account
# Routes don't need to reference it explicitly

scope "/:account_id" do
  resources :boards
  resources :cards
end
```

## Controller Mapping

Keep controllers aligned with resources:

```
app/controllers/
├── application_controller.rb
├── cards_controller.rb
├── cards/
│   ├── assignments_controller.rb
│   ├── closures_controller.rb
│   ├── columns_controller.rb
│   ├── drops_controller.rb
│   ├── goldnesses_controller.rb
│   ├── not_nows_controller.rb
│   ├── pins_controller.rb
│   ├── watches_controller.rb
│   └── comments/
│       └── reactions_controller.rb
├── boards_controller.rb
└── boards/
    ├── columns_controller.rb
    ├── entropies_controller.rb
    └── publications_controller.rb
```

## API Design: Same Controllers, Different Format

No separate API namespace - just `respond_to`:

```ruby
class Cards::ClosuresController < ApplicationController
  include CardScoped

  def create
    @card.close

    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.json { head :no_content }
    end
  end

  def destroy
    @card.reopen

    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.json { head :no_content }
    end
  end
end
```

### Consistent Response Codes

| Action | Success Code |
|--------|--------------|
| Create | `201 Created` + `Location` header |
| Update | `204 No Content` |
| Delete | `204 No Content` |

```ruby
def create
  @comment = @card.comments.create!(comment_params)

  respond_to do |format|
    format.turbo_stream
    format.json { head :created, location: card_comment_path(@card, @comment) }
  end
end
```

## Key Principles

1. **Every action is CRUD** - Create, read, update, or destroy something
2. **Verbs become nouns** - "close" becomes "closure" resource
3. **Shallow nesting** - Avoid URLs like `/a/1/b/2/c/3/d/4`
4. **Singular when appropriate** - `resource` for one-per-parent
5. **Namespace for grouping** - Related controllers together
6. **Use `resolve`** - For polymorphic URL generation
7. **Same controller, different format** - No separate API controllers
