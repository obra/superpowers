# Watching

> Subscription patterns and toggle UI.

This guide covers patterns for managing user involvement with collections and resources—specifically, how users control which notifications they receive. Rather than a separate polymorphic subscriptions system, 37signals embeds notification preferences directly into access records, using an "involvement" enum that determines notification levels.

The core concept: when a user has access to a collection (like a board or project), their `Access` record also tracks their notification preference—whether they want no notifications (`access_only`), or to be notified about activity they're watching (`watching`). This eliminates the need for a separate `Subscription` model and keeps the mental model simple.

---

## Embedding Subscription State in Access Records

**Pattern**: Instead of a separate polymorphic `subscriptions` table, embed notification preferences directly into the join table that manages access.

**Why it matters**: Reduces complexity, eliminates joins, and makes the mental model simpler. Every access record already represents a relationship between a user and a resource—adding notification preferences to that same record is more natural.

**From PR [#310](https://github.com/basecamp/fizzy/pull/310)**:

### Before: Separate Subscription Model

```ruby
# Separate polymorphic subscription table
class Subscription < ApplicationRecord
  belongs_to :user
  delegated_type :subscribable, types: Subscribable::TYPES
end

# Subscribable concern
module Subscribable
  included do
    has_many :subscriptions, as: :subscribable, dependent: :destroy
    has_many :subscribers, through: :subscriptions, source: :user
  end

  def subscribe(user)
    subscriptions.create_or_find_by!(user: user)
  end

  def subscribed_by?(user)
    subscriptions.exists?(user: user)
  end
end

# Bucket model
class Bucket < ApplicationRecord
  include Subscribable
  has_many :accesses
  has_many :users, through: :accesses
end
```

### After: Involvement Enum on Access

```ruby
# Access model with involvement levels
class Access < ApplicationRecord
  belongs_to :bucket
  belongs_to :user

  enum :involvement, %i[ access_only watching everything ].index_by(&:itself)
end

# Bucket accessible concern
module Bucket::Accessible
  included do
    has_many :accesses, dependent: :destroy
    has_many :users, through: :accesses
    has_many :access_only_users, -> { merge(Access.access_only) },
             through: :accesses, source: :user
  end

  def access_for(user)
    accesses.find_by(user: user)
  end
end
```

### Migration Pattern

```ruby
class AddInvolvementToAccesses < ActiveRecord::Migration[8.1]
  def change
    change_table :accesses do |t|
      t.string :involvement, null: false, default: "watching"
    end
  end
end

class DropSubscriptions < ActiveRecord::Migration[8.1]
  def change
    # Migrate existing subscription data
    execute <<~SQL
      UPDATE accesses SET involvement = 'access_only'
    SQL

    execute <<~SQL
      UPDATE accesses SET involvement = 'watching'
      FROM (SELECT user_id, subscribable_id as bucket_id FROM subscriptions) AS subscriptions
      WHERE subscriptions.user_id = accesses.user_id
        AND subscriptions.bucket_id = accesses.bucket_id
    SQL

    drop_table :subscriptions
  end
end
```

**Key Takeaway**: If you already have a many-to-many relationship (like `accesses`), consider adding notification preferences there rather than creating a separate subscription system.

---

## 2. Simplifying Involvement Levels

**Pattern**: Start with fewer, clearer notification levels. Resist the temptation to offer too much granularity.

**Why it matters**: Users rarely understand complex notification settings. Simpler options lead to better UX and easier testing.

**From PR [#1088](https://github.com/basecamp/fizzy/pull/1088)**:

### Before: Three Levels (Confusing)

```ruby
enum :involvement, %i[ access_only watching everything ].index_by(&:itself)

# Helper labels
def involvement_access_label(collection, involvement)
  case involvement
  when "access_only"
    "Notifications are off for #{collection.name}"
  when "everything"
    "Notifying me about everything in #{collection.name}"
  when "watching"
    "Notifying me only about @mentions and new items in #{collection.name}"
  end
end
```

### After: Two Levels (Clear)

```ruby
enum :involvement, %i[ access_only watching ].index_by(&:itself)

# Simpler, action-oriented labels
def involvement_access_label(collection, involvement)
  case involvement
  when "access_only"
    "Watch this"
  when "watching"
    "Stop Watching"
  end
end
```

### Notification Logic Simplification

```ruby
# Before: Different logic for "everything" vs "watching"
def watchers_and_subscribers(include_only_watching: false)
  involvements = include_only_watching ? [:watching, :everything] : :everything
  subscribers = collection.users.where(accesses: { involvement: involvements })
  # ...
end

# After: Single "watching" level
def watchers_and_subscribers(include_only_watching: false)
  involvements = include_only_watching ? [:watching] : []
  subscribers = collection.users.where(accesses: { involvement: involvements })
  # ...
end
```

### Migration to Simplify

```ruby
class MigrateEverythingAccessesToWatching < ActiveRecord::Migration[8.1]
  def up
    execute <<-SQL
      UPDATE accesses
      SET involvement = 'watching'
      WHERE involvement = 'everything'
    SQL
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
```

**Key Principles**:
- **Binary is best**: "Watching" vs "Not Watching" is clearer than three+ levels
- **Action-oriented labels**: "Watch this" is clearer than "Notifications are off"
- **Always notify for @mentions and assignments**: Don't make users opt into these

---

## 3. Separating Resource-Level and Collection-Level Watching

**Pattern**: Distinguish between watching individual items (cards) vs watching for new items in a collection (boards).

**Why it matters**: These are different mental models. Users want to watch specific discussions (resource-level) separately from being notified about all new items (collection-level).

**From PR [#1228](https://github.com/basecamp/fizzy/pull/1228) & [#1231](https://github.com/basecamp/fizzy/pull/1231)**:

### Collection-Level Watching (Boards/Collections)

```ruby
# Collection accessible concern
module Collection::Accessible
  def watchers
    users.where(accesses: { involvement: :watching })
  end
end
```

### Resource-Level Watching (Cards/Items)

```ruby
# Card watchable concern
module Card::Watchable
  included do
    has_many :watches, dependent: :destroy
    has_many :watchers, -> { active.merge(Watch.watching) },
             through: :watches, source: :user

    after_create -> { watch_by creator }
  end

  def watched_by?(user)
    watchers.include?(user)
  end

  def watch_by(user)
    watches.where(user: user).first_or_create.update!(watching: true)
  end

  def unwatch_by(user)
    watches.where(user: user).first_or_create.update!(watching: false)
  end
end
```

### Different Notification Logic

```ruby
# Card events notifier
class Notifier::CardEventNotifier < Notifier
  private
    def recipients
      case source.action
      when "card_assigned"
        # Always notify assignees, regardless of watching status
        source.assignees.excluding(creator)
      when "card_published"
        # Only notify collection watchers for new cards
        collection.watchers.without(creator, *card.mentionees)
      when "comment_created"
        # Only notify card watchers for comments
        card.watchers.without(creator, *source.eventable.mentionees)
      else
        collection.watchers.without(creator)
      end
    end
end
```

**Key Insight**: Collection watching is about "notify me of NEW items," while resource watching is about "notify me of UPDATES to this specific item."

---

## 4. Toggle UI Patterns with Turbo

**Pattern**: Use Turbo Streams to update multiple parts of the page when toggling watch status, without full page reloads.

**Why it matters**: Provides instant feedback and keeps the UI in sync across multiple representations of the same state.

**From PR [#1239](https://github.com/basecamp/fizzy/pull/1239)**:

### Controller Pattern

```ruby
class Cards::WatchesController < ApplicationController
  include CardScoped

  def create
    @card.watch_by Current.user
    # No redirect - let turbo_stream template handle it
  end

  def destroy
    @card.unwatch_by Current.user
    # No redirect - let turbo_stream template handle it
  end
end
```

### Turbo Stream Template

```erb
<!-- app/views/cards/watches/create.turbo_stream.erb -->
<%= render "cards/watches/refresh", card: @card %>
```

```erb
<!-- app/views/cards/watches/_refresh.turbo_stream.erb -->
<%= turbo_stream.replace dom_id(card, :watch_button) do %>
  <%= render "cards/watches/watch_button", card: card %>
<% end %>

<%= turbo_stream.replace dom_id(card, :comment_watchers) do %>
  <%= render "cards/comments/watchers", card: card %>
<% end %>
```

### Partials for Reusability

```erb
<!-- app/views/cards/watches/_watch_button.html.erb -->
<div id="<%= dom_id(card, :watch_button) %>">
  <% if card.watched_by? Current.user %>
    <%= button_to card_watch_path(card), method: :delete,
                  class: "btn btn--reversed",
                  data: { controller: "tooltip" } do %>
      <%= icon_tag "bell" %>
      <span class="for-screen-reader">Stop watching</span>
    <% end %>
  <% else %>
    <%= button_to card_watch_path(card),
                  class: "btn",
                  data: { controller: "tooltip" } do %>
      <%= icon_tag "bell-off" %>
      <span class="for-screen-reader">Watch this</span>
    <% end %>
  <% end %>
</div>
```

```erb
<!-- app/views/cards/comments/_watchers.html.erb -->
<div id="<%= dom_id(card, :comment_watchers) %>"
     class="comments__subscribers flex flex-column margin-block-start">
  <strong class="txt-uppercase">Subscribers</strong>

  <p class="margin-none-block-start margin-block-end-half">
    <%= pluralize(card.watchers.without(User.system).count, "person") %>
    will be notified when someone comments on this.
  </p>

  <div class="flex align-center flex-wrap gap-half">
    <% card.watchers.without(User.system).alphabetically.each do |watcher| %>
      <%= avatar_tag watcher %>
    <% end %>
  </div>
</div>
```

### Initial Page Load

```erb
<!-- app/views/cards/container/footer/_published.html.erb -->
<aside class="card-perma__actions" role="toolbar">
  <%= turbo_frame_tag card, :watch,
                      src: card_watch_path(card),
                      target: "_top",
                      refresh: :morph %>
</aside>
```

**Key Patterns**:
1. **Extract partials** for the changing UI elements
2. **Use `dom_id` helpers** for consistent, unique IDs
3. **Update multiple locations** in one turbo stream response
4. **Lazy load** initial state with `turbo_frame_tag` + `src`

---

## 5. Data Cleanup on Access Removal

**Pattern**: When a user loses access to a collection/board, automatically clean up their associated watches to prevent orphaned records and privacy issues.

**Why it matters**: Prevents data leaks where users retain watch subscriptions to resources they can no longer access.

**From PR [#1519](https://github.com/basecamp/fizzy/pull/1519)**:

### Model Pattern

```ruby
module Board::Accessible
  included do
    # after access is destroyed, clean up related data
    after_destroy_commit :clean_inaccessible_data_for_user,
                         if: -> { user.present? }
  end

  def clean_inaccessible_data_for(user)
    mentions_for_user(user).destroy_all
    notifications_for_user(user).destroy_all
    watches_for(user).destroy_all
  end

  private
    def watches_for(user)
      Watch.where(card: cards, user: user)
    end
end
```

### Add Index for Performance

```ruby
class AddUserAndCardIndexToWatches < ActiveRecord::Migration[8.2]
  def change
    add_index :watches, %i[ user_id card_id ]
  end
end
```

### Testing Pattern

```ruby
test "watches are destroyed when access is lost" do
  kevin = users(:kevin)
  board = boards(:writebook)
  card = board.cards.first

  assert card.watched_by?(kevin)

  kevin_access = accesses(:writebook_kevin)

  perform_enqueued_jobs only: Board::CleanInaccessibleDataJob do
    kevin_access.destroy
  end

  assert_not card.watched_by?(kevin)
end
```

**Key Principle**: When access is revoked, clean up ALL user-specific state (watches, notifications, mentions, etc.) as part of the same transaction or background job.

---

## 6. Cache Invalidation Strategies

**Pattern**: Use `touch: true` on associations to automatically invalidate caches when involvement changes.

**Why it matters**: Keeps cached views up-to-date without manual cache busting logic.

**From PR [#1088](https://github.com/basecamp/fizzy/pull/1088) & [#1228](https://github.com/basecamp/fizzy/pull/1228)**:

### Touch on Association Changes

```ruby
class Access < ApplicationRecord
  belongs_to :collection
  belongs_to :user, touch: true  # Invalidates user cache key

  enum :involvement, %i[ access_only watching ].index_by(&:itself)
end
```

### Cache Keys Include User State

```ruby
class CardsController < ApplicationController
  def index
    @considering = page_and_filter_for @filter.with(engagement_status: "considering")
    @on_deck = page_and_filter_for @filter.with(engagement_status: "on_deck")
    @doing = page_and_filter_for @filter.with(engagement_status: "doing")
    @closed = page_and_filter_for_closed_cards

    # Include user_filtering in cache key (which depends on user.updated_at)
    @cache_key = [@considering, @on_deck, @doing, @closed]
                   .collect { it.page.records }
                   .including([Workflow.all, @user_filtering])

    fresh_when etag: @cache_key
  end
end
```

### Explicit Cache Invalidation for Lists

```erb
<!-- Turbo frame to refresh watchers list -->
<%= turbo_frame_tag dom_id(collection, :involvement_button) do %>
  <%= collection_watchers_list(collection) %>
  <%= involvement_button(collection, access, show_watchers) %>
<% end %>
```

**Key Patterns**:
1. **Touch associations** to auto-invalidate when involvement changes
2. **Include user state** in cache keys for personalized views
3. **Use Turbo frames** to selectively refresh changed portions

---

## 7. Testing Subscription Logic

**Pattern**: Test the notification logic at multiple levels—model, notifier, and integration.

**Why it matters**: Notification logic is business-critical and easy to break. Comprehensive tests prevent regressions.

**From PRs [#310](https://github.com/basecamp/fizzy/pull/310), [#1088](https://github.com/basecamp/fizzy/pull/1088), [#1231](https://github.com/basecamp/fizzy/pull/1231)**:

### Model-Level Tests

```ruby
class Card::WatchableTest < ActiveSupport::TestCase
  setup do
    Watch.destroy_all
    Access.all.update!(involvement: :access_only)
  end

  test "watched_by? when watching" do
    cards(:logo).watch_by users(:kevin)
    assert cards(:logo).watched_by?(users(:kevin))

    cards(:logo).unwatch_by users(:kevin)
    assert_not cards(:logo).watched_by?(users(:kevin))
  end

  test "cards are initially watched by their creator" do
    card = collections(:writebook).cards.create!(creator: users(:kevin))
    assert card.watched_by?(users(:kevin))
  end

  test "watchers" do
    collections(:writebook).access_for(users(:kevin)).watching!
    collections(:writebook).access_for(users(:jz)).watching!

    cards(:logo).watch_by users(:kevin)
    cards(:logo).unwatch_by users(:jz)
    cards(:logo).watch_by users(:david)

    assert_equal [users(:kevin), users(:david)].sort, cards(:logo).watchers.sort

    # Only active users
    users(:david).system!
    assert_equal [users(:kevin)].sort, cards(:logo).watchers.reload.sort
  end
end
```

### Notifier-Level Tests

```ruby
class Notifier::EventNotifierTest < ActiveSupport::TestCase
  test "published event creates notifications for collection watchers" do
    notifications = Notifier.for(events(:logo_published)).notify
    assert_equal [users(:kevin), users(:jz)], notifications.map(&:user)
  end

  test "assignment events only create a notification for the assignee" do
    collections(:writebook).access_for(users(:jz)).watching!
    collections(:writebook).access_for(users(:kevin)).watching!

    notifications = Notifier.for(events(:logo_assignment_jz)).notify
    assert_equal [users(:jz)], notifications.map(&:user)
  end

  test "assignment events do not notify you if you assigned yourself" do
    collections(:writebook).access_for(users(:david)).watching!

    notifications = Notifier.for(events(:logo_assignment_david)).notify
    assert_empty notifications
  end

  test "assignment events notify assignees regardless of involvement level" do
    # Even access_only users get notified when assigned
    collections(:writebook).access_for(users(:jz)).access_only!

    notifications = Notifier.for(events(:logo_assignment_jz)).notify
    assert_equal [users(:jz)], notifications.map(&:user)
  end

  test "does not create a notification for access-only users" do
    collections(:writebook).access_for(users(:kevin)).access_only!

    notifications = Notifier.for(events(:layout_commented)).notify
    assert_equal [users(:kevin)], notifications.map(&:user)
  end
end
```

### Controller-Level Tests

```ruby
class Collections::InvolvementsControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in_as :kevin
  end

  test "update involvement" do
    collection = collections(:writebook)
    collection.access_for(users(:kevin)).access_only!

    assert_changes -> { collection.access_for(users(:kevin)).involvement },
                   from: "access_only", to: "watching" do
      put collection_involvement_url(collection, involvement: "watching")
    end

    assert_response :success
  end
end
```

### Integration Tests

```ruby
class Cards::WatchesControllerTest < ActionDispatch::IntegrationTest
  test "create watch" do
    sign_in_as :kevin
    cards(:logo).unwatch_by users(:kevin)

    assert_changes -> { cards(:logo).watched_by?(users(:kevin)) },
                   from: false, to: true do
      post card_watch_path(cards(:logo))
    end
  end

  test "destroy watch" do
    sign_in_as :kevin
    cards(:logo).watch_by users(:kevin)

    assert_changes -> { cards(:logo).watched_by?(users(:kevin)) },
                   from: true, to: false do
      delete card_watch_path(cards(:logo))
    end
  end
end
```

**Test Coverage Checklist**:
- [ ] Auto-watching on resource creation
- [ ] Explicit watch/unwatch actions
- [ ] Collection-level involvement changes
- [ ] Notification routing based on involvement
- [ ] Edge cases (self-assignment, access_only users, etc.)
- [ ] Data cleanup when access is removed
- [ ] Cache invalidation on involvement changes

---

## Summary of Key Lessons

1. **Embed preferences in existing relationships** rather than creating separate subscription tables
2. **Keep involvement levels simple** (binary is best)
3. **Separate collection-level and resource-level watching** for clarity
4. **Use Turbo Streams** for high-fidelity toggle UIs that update multiple locations
5. **Clean up watches when access is removed** to prevent data leaks
6. **Touch associations** to automatically invalidate caches
7. **Test notification logic thoroughly** at all levels

These patterns emerged from real-world iteration and refinement in a production application, making them battle-tested and reliable for other Rails apps.
