# What They Deliberately Avoid

> Patterns and gems 37signals chooses NOT to use.

---

## Notable Absences

The Fizzy codebase is interesting as much for what's missing as what's present.

## Authentication: No Devise

**Instead**: ~150 lines of custom passwordless magic link code.

**Why avoid Devise**:
- Too heavyweight for passwordless auth
- Comes with password complexity they don't need
- Custom code is simpler to understand and modify

See [authentication.md](authentication.md) for the pattern.

## Authorization: No Pundit/CanCanCan

**Instead**: Simple predicate methods on models.

```ruby
# No policy objects - just model methods
class Card < ApplicationRecord
  def editable_by?(user)
    !closed? && (creator == user || user.admin?)
  end

  def deletable_by?(user)
    user.admin? || creator == user
  end
end

# In controller
def edit
  head :forbidden unless @card.editable_by?(Current.user)
end
```

**Why avoid authorization gems**:
- Simple predicates are easier to understand
- No separate policy files to maintain
- Logic lives with the model it protects

## Service Objects

**Instead**: Rich domain models with focused methods.

```ruby
# Bad - service object
class CardCloser
  def initialize(card, user)
    @card = card
    @user = user
  end

  def call
    @card.update!(closed: true, closed_by: @user)
    NotifyWatchersJob.perform_later(@card)
    @card
  end
end

# Good - model method
class Card < ApplicationRecord
  def close(by:)
    transaction do
      create_closure!(creator: by)
      notify_watchers_later
    end
  end
end
```

**Why avoid service objects**:
- They fragment domain logic across files
- Models become anemic (just data, no behavior)
- Simple operations don't need coordination objects

## Form Objects

**Instead**: Strong parameters and model validations.

```ruby
# No form objects - just params.expect
def create
  @card = @board.cards.create!(card_params)
end

private
  def card_params
    params.expect(card: [:title, :description, { tag_ids: [] }])
  end
```

**When form objects might be justified**: Complex multi-model forms. But even then, consider if nested attributes suffice.

## Decorators/Presenters

**Instead**: View helpers and partials.

```ruby
# No decorator gems
# Just helpers for view logic
module CardsHelper
  def card_status_badge(card)
    if card.closed?
      tag.span "Closed", class: "badge badge--closed"
    elsif card.overdue?
      tag.span "Overdue", class: "badge badge--warning"
    end
  end
end
```

## ViewComponent

**Instead**: ERB partials with locals.

```erb
<%# No ViewComponent - just partials %>
<%= render "cards/preview", card: @card, draggable: true %>
```

**Why partials are enough**:
- Simpler mental model
- No component class overhead
- Rails has good partial caching built-in

## GraphQL

**Instead**: REST endpoints with Turbo.

**Why avoid GraphQL**:
- Adds complexity for uncertain benefit
- REST + Turbo handles their needs
- No mobile app requiring flexible queries

## Sidekiq

**Instead**: Solid Queue (database-backed).

**Why avoid Sidekiq**:
- Removes Redis dependency
- Database is already managed
- Good enough for their scale

## React/Vue/Frontend Framework

**Instead**: Turbo + Stimulus + server-rendered HTML.

**Why avoid SPAs**:
- Server rendering is simpler
- Less JavaScript to maintain
- Turbo provides SPA-like feel
- Stimulus handles interactions

## Tailwind CSS

**Instead**: Native CSS with cascade layers.

**Why avoid Tailwind**:
- Native CSS has nesting, variables, layers now
- No build step complexity
- Semantic class names preferred

## RSpec

**Instead**: Minitest (ships with Rails).

**Why avoid RSpec**:
- Minitest is simpler, less DSL
- Faster boot time
- Good enough assertions

## FactoryBot

**Instead**: Fixtures.

**Why avoid factories**:
- Fixtures are faster (loaded once)
- Relationships are explicit in YAML
- Deterministic test data

## The Philosophy

> "We reach for gems when Rails doesn't provide a solution. But Rails provides most solutions."

Before adding a dependency, ask:
1. Can vanilla Rails do this?
2. Is the complexity worth the benefit?
3. Will we need to maintain this dependency?
4. Does it make the codebase harder to understand?

## What They DO Use

Some gems that made the cut:

- `solid_queue`, `solid_cache`, `solid_cable` - Database-backed infrastructure
- `turbo-rails`, `stimulus-rails` - Hotwire
- `propshaft` - Simple asset pipeline
- `kamal` - Deployment
- `bcrypt` - Password hashing (for magic link tokens)
- `image_processing` - Active Storage variants

The bar is high. Each gem must clearly earn its place.
