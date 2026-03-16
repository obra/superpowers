# DHH's Code Review Patterns

> 📝 **A note on attribution**: We created these personal pattern files to give credit to individual developers whose review style we found instructive. This content was compiled with AI assistance by analyzing PR comments, so take it with a grain of salt—some patterns may be misattributed or misinterpreted. When in doubt, check the linked PRs.

> Extracted from PR reviews in [basecamp/fizzy](https://github.com/basecamp/fizzy)
> Focus: Simplicity, directness, Rails conventions, and fighting abstraction

---

## Core Philosophy: Earn Your Abstractions

### Question Every Layer of Indirection

**Pattern**: DHH consistently challenges abstractions that don't justify their existence.

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "I find these explicit classes for the notifier rather anemic. And there's not as much future potential for a million more (unlike Basecamp). Think we're better off inlining them."

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "Good example of how this is getting confusing and very indirect between source and resource. And there just aren't enough variations to warrant this level of indirection."

**The Test**: Ask "Is this abstraction earning its keep?" If you can't point to 3+ variations that need it, inline it.

### "Anemic" Code Should Be Inlined

**Pattern**: Methods and classes that don't explain anything or provide meaningful abstraction should be removed.

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Don't think this method is carrying its weight. Either it needs to explain something or you should just inline."

> "Bit anemic. Would inline."

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Don't think this association definition should be necessary. We should be able to use everything from the delegated types."

**Rule**: If a method just wraps another call with no additional logic or explanation, delete it.

---

## Write-Time vs Read-Time Operations

### Compute at Write Time, Not Presentation Time

**From PR [#108](https://github.com/basecamp/fizzy/pull/108)**:
> "All this manipulation has to happen when you save, not when you present. So data model has to fit something where it can be updated. Otherwise you won't be able to paginate."

> "Don't think this approach is going to fly. These threads need to be paginated, so you can't do any in-memory sorting. This all needs to be converted to a delegated type, so you have a single table you can pull from."

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Would consider storing the current summary as a body here. Then you only compute this when there's a write."

> "These are some awfully complicated queries. Would consider a way to compute the sort code at write time instead."

**Pattern**:
```ruby
# Bad - computing at read time
def thread_entries
  (comments + events).sort_by(&:created_at)
end

# Good - using delegated types with single-table query
class Message < ApplicationRecord
  delegated_type :messageable, types: %w[Comment EventSummary]
end

# Now you can paginate:
bubble.messages.order(:created_at).limit(20)
```

**Why it matters**:
- Enables pagination
- Enables caching
- Removes complexity from views

---

## Database Over Application Logic

### Prefer DB Constraints Over AR Validations

**From PR [#1304](https://github.com/basecamp/fizzy/pull/1304)**:
> "Don't think these validations add much/anything over just having the DB raise an exception if, say, uniqueness constraint is violated... Generally speaking, we've almost entirely stopped using validations like this."

> "Another validation that can just be a db constraint."

**Pattern**:
```ruby
# Avoided
class JoinCode < ApplicationRecord
  validates :code, uniqueness: true
  validates :usages, numericality: { greater_than_or_equal_to: 0 }
end

# Preferred
# In migration:
add_index :join_codes, :code, unique: true
# Let the database enforce integrity
```

**When to validate**: Only when you need user-facing error messages for form display.

### Use AR Counter Caches

**From PR [#108](https://github.com/basecamp/fizzy/pull/108)**:
> "Should use AR counters: https://api.rubyonrails.org/v7.1/classes/ActiveRecord/CounterCache/ClassMethods.html"

> "You can lean on the AR counter methods here for a more natural API."

---

## Naming Principles

### Use Positive Names

**From PR [#108](https://github.com/basecamp/fizzy/pull/108)**:
> "`not_popped` is pretty cumbersome of a word. Consider something like `unpopped` if staying in the negative or go with something like `active`. Probably better with the latter."

**Pattern**:
```ruby
# Avoid
scope :not_popped, -> { where(popped_at: nil) }
scope :not_deleted, -> { where(deleted_at: nil) }

# Prefer
scope :active, -> { where(popped_at: nil) }
scope :visible, -> { where(deleted_at: nil) }
```

### Method Names Should Reflect Their Return Value

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "`collect` implies that we're returning an array of mentions (as #collect). Would use `create_mentions` when you don't care about the return value."

### Consistent Domain Language

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "`container` strikes me as out of context with mentions. We don't use that term anywhere else. Isn't this the same as the `source` concept we refer to in Notifications?"

> "This is a bit confusing. You can't really tell the difference between source and resource. Could we get clearer about this?"

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Should probably be `messages` now that you've dropped the `thread` domain name for the rest of the feature. And make that consistent throughout."

---

## Rails Conventions

### StringInquirer for Action Predicates

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "Bit too heavy-handed, imo. Better to make action return a StringInquirer. Then you can do `event.action.completed?`."

```ruby
# Instead of method_missing magic or case statements:
class Event < ApplicationRecord
  def action
    self[:action].inquiry
  end
end

# Usage:
event.action.completed?
event.action.published?
```

### Use `after_save_commit` Shorthand

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "You can use `after_save_commit` instead of `after_commit on: %i[ create update ]`."

### Prefer `pluck` Over `map`

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Use `pluck(:name)` instead of `map(&)`."

> "Don't think you need this accessor if you just use pluck at the callsite, so it's `event.assignees.pluck(:name)`."

### Delegate for Lazy Loading

**From PR [#108](https://github.com/basecamp/fizzy/pull/108)**:
> "Why not just delegate :user to :session? Then you get to lazy load it too."

### Touch Chains for Cache Invalidation

**From PR [#108](https://github.com/basecamp/fizzy/pull/108)**:
> "Needs to `touch: true` to bust caching."

---

## View Patterns

### Extract View Logic to Helpers, Not Partials

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Something about this feels slightly off. Maybe it's the fact that the partials are really more just like helper methods. There's virtually no html in them."

> "Smells like this should be a method on the EventSummary. There's no markup here. And there's feature envy."

**Pattern**: If a partial has virtually no HTML and is mostly Ruby logic, it should be:
1. A helper method (if view-specific)
2. A model method (if it's domain logic)

### Helpers Should Receive Explicit Parameters

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Generally consider it a smell to have helpers refer to magical ivars. Better to pass in the ivar to make that dependency explicit."

```ruby
# Bad - relies on @bubble ivar
def bubble_activity_count
  @bubble.comments_count + @bubble.events_count
end

# Good - explicit dependency
def bubble_activity_count(bubble)
  bubble.comments_count + bubble.events_count
end
```

### Double-Indent Attributes in Tag Helpers

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "Fix indention by double-indenting the attributes to the yielding method."

```erb
<%# Bad %>
<%= tag.div class: "foo",
  data: { controller: "bar" } do %>

<%# Good %>
<%= tag.div class: "foo",
    data: { controller: "bar" } do %>
```

### Use Tag Helpers for Meta Tags

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Would use a tag helper when you're doing interpolation like this."

```erb
<%# Instead of string interpolation: %>
<meta name="current-user-id" content="<%= Current.user.id %>">

<%# Use tag helper: %>
<%= tag.meta name: "current-user-id", content: Current.user.id if Current.user %>
```

### Turbo Stream Canonical Style

**From PR [#1581](https://github.com/basecamp/fizzy/pull/1581)**:
> "This should also use the canonical style: `turbo_stream.update [ @card, :new_comment ], partial: \"cards/comments/new\", locals: { card: @card }`"

> "Should use consistent style here, so `[ @card, :new_comment ]`, like we do in the destroy template."

---

## JavaScript / Stimulus Patterns

### Targets Over CSS Selectors

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Yeah this one is a bit odd. These should just be targets rather than using a css selector."

### Consider WebSocket Updates in Controllers

**From PR [#124](https://github.com/basecamp/fizzy/pull/124)**:
> "Is this going to catch new elements added via web socket? Thinking it probably won't. Maybe you need to extract this and also call it when element is added."

---

## Testing Philosophy

### Avoid Test-Induced Design Damage

**From PR [#108](https://github.com/basecamp/fizzy/pull/108)**:
> "I think that would then qualify as [test-induced design damage](https://dhh.dk/2014/test-induced-design-damage.html) 😄. Better replace that with a mock or even better just a fixture session you can use. We should never let our desire for ease of testing bleed into the application itself."

---

## Migrations

### Migrations Can Reference Models

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "Full `db:migrate` is an antipattern in my book. Migrations were only ever meant to be transient. To get a schema from one version to the next. Interacting directly with models present at the time of the migration is totally fine."

```ruby
# This is fine in migrations:
Notification.update_all(source_type: "Event")

# Instead of raw SQL:
execute "UPDATE notifications SET source_type = 'Event'"
```

---

## Be Explicit Over Clever

### Avoid Introspection Magic

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "Actually, I think this is too clever. There are only two different types of cards that have mentionable content: cards and comments. I would find a way to be explicit about this. Like just letting Mentionables define the 'mentionable_content' method."

**From PR [#425](https://github.com/basecamp/fizzy/pull/425)**:
> "Good example here too where the method_missing actually works a bit against you. You're probably better off with a `case event.action`."

**Pattern**: When there are only 2-3 cases, explicit `case` statements or defined methods beat metaprogramming.

### Avoid Unnecessary Base Class Extensions

**From PR [#259](https://github.com/basecamp/fizzy/pull/259)**:
> "This is a bit too much. Should just put this method on the Reaction class. Should be very hesitant to add base class extensions, and we should only go there if it's on its way to an upstream Active Support patch."

---

## Caching Principles

### Avoid Complex Cache Dependencies

**From PR [#1429](https://github.com/basecamp/fizzy/pull/1429)**:
> "Really don't like all these dependency on the base cache either. Better to flip it around to use lazy loading or touches. This is essentially the same thing anyway."

> "I really don't like the idea that this base page is cache dependent on anything beyond itself."

**Pattern**: Use `touch: true` on associations rather than adding cache key dependencies that span multiple models.

### Use `update_all` for Bulk Updates

**From PR [#1429](https://github.com/basecamp/fizzy/pull/1429)**:
> "I'd be surprised if we need this? We should just be able to do a `cards.update_all`. There aren't any side effects we're hoping to run here. This is just to bump the caches."

---

## API Design

### Implicit Respond To

**From PR [#1766](https://github.com/basecamp/fizzy/pull/1766)**:
> "We don't need a respond_to block when the action has templates for both formats. That'll automatically be implied."

```ruby
# Unnecessary:
def show
  respond_to do |format|
    format.html
    format.json
  end
end

# Just have show.html.erb and show.json.jbuilder - Rails handles it
def show
end
```

### Use Inline Jbuilder Partials

**From PR [#1766](https://github.com/basecamp/fizzy/pull/1766)**:
> "Inline." / "Inline as well."

> "Can just use `json.steps @card.steps, partial: \"steps/step\", as: :step`."

```ruby
# Instead of explicit render calls:
json.steps do
  json.array! @card.steps do |step|
    json.partial! "steps/step", step: step
  end
end

# Use inline style:
json.steps @card.steps, partial: "steps/step", as: :step
```

### Prefer `head :no_content` for Updates

**From PR [#1766](https://github.com/basecamp/fizzy/pull/1766)**:
> "Why use the `render :show` here vs `head :no_content`?"

---

## Routing

### Use My:: Namespace for Current User Resources

**From PR [#1766](https://github.com/basecamp/fizzy/pull/1766)**:
> "This should be `My::IdentitiesController`. We're putting everything that derives from `Current.identity` on that to imply there won't be a /identities/x."

**From PR [#1865](https://github.com/basecamp/fizzy/pull/1865)**:
> "Should stick with the `My::AvatarsController` format we have for the rest of the `/my` namespace."

---

## Data Defaults

### Use `created_at` for Initial Timestamps

**From PR [#2076](https://github.com/basecamp/fizzy/pull/2076)**:
> "Do we need to take this or could we just set `last_active_at = created_at` on first creation?"

---

## Authorization Patterns

### Unauthenticated Implies Unauthorized

**From PR [#1304](https://github.com/basecamp/fizzy/pull/1304)**:
> "This smells a little. If we're allowing unauthenticated access, it should be implied that we're also allowing unauthorized access, since you can't authorize someone you haven't authenticated. Let's level up `allow_unauthorized_access` to be able to do this directly."

---

## Key Takeaways

1. **Abstractions must earn their keep** - If it doesn't explain or enable variations, inline it
2. **Write time > Read time** - Compute summaries and sort keys when saving, not presenting
3. **Database over AR** - Prefer DB constraints over ActiveRecord validations
4. **Positive names** - Use `active` not `not_deleted`
5. **Explicit over clever** - Case statements beat metaprogramming for 2-3 variations
6. **StringInquirer for predicates** - `action.completed?` over string comparisons
7. **Touch chains** - Use `touch: true` for cache invalidation
8. **Helpers take params** - Don't rely on magical ivars
9. **Targets over selectors** - In Stimulus, use data-*-target
10. **Tests shouldn't shape design** - Never add code just for testability

---

## References

- **PR [#108](https://github.com/basecamp/fizzy/pull/108)**: Spike events system (write-time operations)
- **PR [#124](https://github.com/basecamp/fizzy/pull/124)**: Delegated types, view patterns
- **PR [#425](https://github.com/basecamp/fizzy/pull/425)**: Plain text mentions (abstraction removal)
- **PR [#1304](https://github.com/basecamp/fizzy/pull/1304)**: DB constraints over validations
- **PR [#1429](https://github.com/basecamp/fizzy/pull/1429)**: Caching strategies
- **PR [#1581](https://github.com/basecamp/fizzy/pull/1581)**: Turbo Stream conventions
- **PR [#1766](https://github.com/basecamp/fizzy/pull/1766)**: API patterns

