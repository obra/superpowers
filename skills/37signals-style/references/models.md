# Models

> Rich domain models with composable concerns and state as records.

---

## Heavy Use of Concerns for Horizontal Behavior

Models include many concerns, each handling one aspect:

```ruby
# app/models/card.rb
class Card < ApplicationRecord
  include Assignable, Attachments, Broadcastable, Closeable, Colored,
    Entropic, Eventable, Exportable, Golden, Mentions, Multistep,
    Pinnable, Postponable, Promptable, Readable, Searchable, Stallable,
    Statuses, Storage::Tracked, Taggable, Triageable, Watchable

  belongs_to :account, default: -> { board.account }
  belongs_to :board
  belongs_to :creator, class_name: "User", default: -> { Current.user }

  has_many :comments, dependent: :destroy
  has_one_attached :image, dependent: :purge_later
  has_rich_text :description

  # Minimal model code - behavior is in concerns
end
```

## Concern Structure: Self-Contained Behavior

Each concern is self-contained with associations, scopes, and methods:

```ruby
# app/models/card/closeable.rb
module Card::Closeable
  extend ActiveSupport::Concern

  included do
    has_one :closure, dependent: :destroy

    scope :closed, -> { joins(:closure) }
    scope :open, -> { where.missing(:closure) }
    scope :recently_closed_first, -> { closed.order("closures.created_at": :desc) }
  end

  def closed?
    closure.present?
  end

  def open?
    !closed?
  end

  def closed_by
    closure&.user
  end

  def close(user: Current.user)
    unless closed?
      transaction do
        create_closure! user: user
        track_event :closed, creator: user
      end
    end
  end

  def reopen(user: Current.user)
    if closed?
      transaction do
        closure&.destroy
        track_event :reopened, creator: user
      end
    end
  end
end
```

---

## State as Records, Not Booleans

Instead of `closed: boolean`, create a separate record. This gives you:
- Timestamp of when it happened
- Who did it
- Easy scoping via `joins` and `where.missing`

```ruby
# BAD: Boolean column
class Card < ApplicationRecord
  # closed: boolean column in cards table

  scope :closed, -> { where(closed: true) }
  scope :open, -> { where(closed: false) }
end

# GOOD: Separate record
class Closure < ApplicationRecord
  belongs_to :card, touch: true
  belongs_to :user, optional: true
  # created_at gives you when
  # user gives you who
end

class Card < ApplicationRecord
  has_one :closure, dependent: :destroy

  scope :closed, -> { joins(:closure) }
  scope :open, -> { where.missing(:closure) }

  def closed?
    closure.present?
  end
end
```

### Real State Record Examples

```ruby
# Closure - tracks when/who closed a card
class Closure < ApplicationRecord
  belongs_to :account, default: -> { card.account }
  belongs_to :card, touch: true
  belongs_to :user, optional: true
end

# Goldness - marks a card as "golden" (important)
class Card::Goldness < ApplicationRecord
  belongs_to :account, default: -> { card.account }
  belongs_to :card, touch: true
end

# NotNow - marks a card as postponed
class Card::NotNow < ApplicationRecord
  belongs_to :account, default: -> { card.account }
  belongs_to :card, touch: true
  belongs_to :user, optional: true
end

# Publication - marks a board as publicly published
class Board::Publication < ApplicationRecord
  belongs_to :account, default: -> { board.account }
  belongs_to :board
  has_secure_token :key  # The public URL key
end
```

### Query Patterns with State Records

```ruby
# Finding open vs closed
Card.open                    # where.missing(:closure)
Card.closed                  # joins(:closure)

# Finding golden cards first
Card.with_golden_first       # left_outer_joins(:goldness).order(...)

# Finding active vs postponed
Card.active                  # open.published.where.missing(:not_now)
Card.postponed               # open.published.joins(:not_now)
```

---

## Default Values via Lambdas

```ruby
class Card < ApplicationRecord
  belongs_to :account, default: -> { board.account }
  belongs_to :creator, class_name: "User", default: -> { Current.user }
end

class Comment < ApplicationRecord
  belongs_to :account, default: -> { card.account }
  belongs_to :creator, class_name: "User", default: -> { Current.user }
end
```

---

## Current for Request Context

```ruby
# app/models/current.rb
class Current < ActiveSupport::CurrentAttributes
  attribute :session, :user, :identity, :account
  attribute :http_method, :request_id, :user_agent, :ip_address, :referrer

  def session=(value)
    super(value)
    self.identity = session.identity if value.present?
  end

  def identity=(identity)
    super(identity)
    self.user = identity.users.find_by(account: account) if identity.present?
  end
end
```

---

## Minimal Validations

```ruby
class Account < ApplicationRecord
  validates :name, presence: true  # That's it
end

class Identity < ApplicationRecord
  validates :email_address, format: { with: URI::MailTo::EMAIL_REGEXP }
end
```

### Contextual Validations

```ruby
class Signup
  validates :email_address, format: { with: URI::MailTo::EMAIL_REGEXP }, on: :identity_creation
  validates :full_name, :identity, presence: true, on: :completion
end
```

---

## Let It Crash (Bang Methods)

```ruby
def create
  @comment = @card.comments.create!(comment_params)  # Raises on failure
end
```

---

## Model Callbacks: Used Sparingly

Only 38 callback occurrences across 30 files in the entire codebase. When used:

```ruby
class MagicLink < ApplicationRecord
  before_validation :generate_code, on: :create
  before_validation :set_expiration, on: :create
end

class Card < ApplicationRecord
  after_create_commit :send_notifications
end
```

**Pattern:** Callbacks for setup/cleanup, not business logic.

---

## PORO Patterns (Plain Old Ruby Objects)

POROs live under model namespaces for related logic that doesn't need persistence:

### Presentation Logic

```ruby
# app/models/event/description.rb
class Event::Description
  include ActionView::Helpers::SanitizeHelper

  attr_reader :event

  def initialize(event)
    @event = event
  end

  def to_s
    case event.action
    when "created"    then "#{creator_name} created this card"
    when "closed"     then "#{creator_name} closed this card"
    when "reopened"   then "#{creator_name} reopened this card"
    when "assigned"   then assignment_description
    when "unassigned" then unassignment_description
    else "#{creator_name} updated this card"
    end
  end

  private
    def creator_name
      h event.creator.name  # Sanitize for safety!
    end

    def assignment_description
      assignee = User.find_by(id: event.particulars["assignee_id"])
      if assignee == event.creator
        "#{creator_name} self-assigned"
      else
        "#{creator_name} assigned #{h assignee&.name}"
      end
    end
end
```

### Complex Operations

```ruby
# app/models/system_commenter.rb
class SystemCommenter
  attr_reader :card

  def initialize(card)
    @card = card
  end

  def comment_on(event)
    card.comments.create!(
      body: Event::Description.new(event).to_s,
      system: true,
      creator: event.creator
    )
  end
end
```

### View Context Bundling

```ruby
# app/models/user/filtering.rb
class User::Filtering
  attr_reader :user, :filter, :expanded

  def initialize(user, filter, expanded: false)
    @user = user
    @filter = filter
    @expanded = expanded
  end

  def boards
    user.boards.accessible
  end

  def assignees
    user.account.users.active.alphabetically
  end

  def tags
    user.account.tags.alphabetically
  end

  def form_id
    "user-filtering"
  end
end
```

### When to Use POROs

1. **Presentation logic** - `Event::Description` formats events for display
2. **Complex operations** - `SystemCommenter` creates comments from events
3. **View context bundling** - `User::Filtering` collects filter UI state
4. **NOT service objects** - POROs are model-adjacent, not controller-adjacent

---

## Scope Naming Conventions

### Semantic, Business-Focused Names

```ruby
# Good - business-focused
scope :active, -> { where.missing(:pop) }
scope :unassigned, -> { where.missing(:assignments) }
scope :golden, -> { joins(:goldness) }

# Not - SQL-ish
scope :without_pop, -> { ... }
scope :no_assignments, -> { ... }
```

### Common Scope Patterns

```ruby
class Card < ApplicationRecord
  # Status scopes
  scope :open, -> { where.missing(:closure) }
  scope :closed, -> { joins(:closure) }
  scope :published, -> { where(status: :published) }
  scope :draft, -> { where(status: :draft) }

  # Ordering scopes
  scope :alphabetically, -> { order(title: :asc) }
  scope :recently_created, -> { order(created_at: :desc) }
  scope :recently_updated, -> { order(updated_at: :desc) }

  # Filtering scopes
  scope :created_by, ->(user) { where(creator: user) }
  scope :assigned_to, ->(user) { joins(:assignments).where(assignments: { user: user }) }
  scope :tagged_with, ->(tag_ids) { joins(:taggings).where(taggings: { tag_id: tag_ids }) }

  # Preloading scopes
  scope :preloaded, -> {
    includes(:creator, :board, :tags, :assignments, :closure, :goldness)
  }
end
```

---

## Concern Organization Guidelines

1. **Each concern should be 50-150 lines**
2. **Must be cohesive** - related functionality together
3. **Don't create concerns just to reduce file size**
4. **Name concerns for the capability they provide**: `Closeable`, `Watchable`, `Assignable`
