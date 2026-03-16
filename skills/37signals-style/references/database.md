# Database Patterns

> UUIDs, state as records, and database-backed everything.

---

## UUIDs as Primary Keys

All tables use UUIDs instead of auto-incrementing integers:

```ruby
# In migration
create_table :cards, id: :uuid do |t|
  t.references :board, type: :uuid, foreign_key: true
  t.string :title
  t.timestamps
end
```

**Why UUIDs**:
- No ID guessing/enumeration attacks
- Safe for distributed systems
- Client can generate IDs before insert
- Merge-friendly across databases

### UUIDv7 Format

Fizzy uses time-sortable UUIDv7 (base36-encoded as 25-char strings):

```ruby
# Fixtures generate deterministic UUIDs
# Runtime records are always "newer" than fixture data
# .first/.last work correctly in tests
```

## State as Records, Not Booleans

Instead of boolean flags, create records to represent state:

```ruby
# Bad - boolean flag
class Card < ApplicationRecord
  # closed: boolean

  def close
    update!(closed: true)
  end
end

# Good - state record with attribution
class Card < ApplicationRecord
  has_one :closure, dependent: :destroy

  def closed?
    closure.present?
  end

  def close(by:)
    create_closure!(creator: by)
  end

  def reopen
    closure.destroy!
  end
end

class Closure < ApplicationRecord
  belongs_to :card
  belongs_to :creator, class_name: "User"

  # Timestamps tell you when it was closed
  # creator tells you who closed it
end
```

**Why records over booleans**:
- Know WHO made the change
- Know WHEN it happened
- Query history easily
- Add metadata (reason, notes)

## Database-Backed Infrastructure

No Redis - everything uses the database:

### Solid Queue (Jobs)

```ruby
# Gemfile
gem "solid_queue"

# config/database.yml
production:
  queue:
    <<: *default
    database: fizzy_queue
```

### Solid Cache

```ruby
# Gemfile
gem "solid_cache"

# config/environments/production.rb
config.cache_store = :solid_cache_store
```

### Solid Cable (WebSockets)

```ruby
# Gemfile
gem "solid_cable"

# config/cable.yml
production:
  adapter: solid_cable
```

**Why database over Redis**:
- One less dependency to manage
- Same backup/restore process
- Simpler ops for small-medium scale
- SQLite works in development

## Account ID Everywhere

Multi-tenancy via `account_id` foreign key:

```ruby
class Card < ApplicationRecord
  belongs_to :account
  belongs_to :board

  # Scoped uniqueness
  validates :number, uniqueness: { scope: :account_id }
end

# Default scope (optional, use carefully)
class ApplicationRecord < ActiveRecord::Base
  def self.inherited(subclass)
    super
    subclass.default_scope { where(account_id: Current.account&.id) }
  end
end
```

## No Soft Deletes

Records are deleted, not marked as deleted:

```ruby
# Bad
class Card < ApplicationRecord
  scope :active, -> { where(deleted_at: nil) }
end

# Good - just delete it
card.destroy
```

**Why hard deletes**:
- Simpler queries (no `where(deleted: false)` everywhere)
- No data retention complexity
- If you need history, use events/audit logs

## Counter Caches

Denormalize counts for performance:

```ruby
class Board < ApplicationRecord
  has_many :cards, counter_cache: true
end

# Migration
add_column :boards, :cards_count, :integer, default: 0
```

## Minimal Foreign Keys

Fizzy uses `belongs_to` without database-level foreign keys in many places:

```ruby
# No FK constraint - application handles integrity
t.references :board, foreign_key: false

# With FK - database enforces
t.references :account, foreign_key: true
```

**Trade-off**: Flexibility vs. data integrity guarantees.

## Index Strategy

```ruby
# Always index foreign keys
add_index :cards, :board_id
add_index :cards, :account_id

# Index columns you filter/sort by
add_index :cards, :created_at
add_index :cards, :status

# Composite indexes for common queries
add_index :cards, [:account_id, :board_id, :created_at]
```

## Sharded Search

Full-text search uses 16 MySQL shards:

```ruby
class Search::Record < ApplicationRecord
  connects_to shards: {
    shard_0: { writing: :search_0, reading: :search_0 },
    shard_1: { writing: :search_1, reading: :search_1 },
    # ...
  }

  def self.shard_for(account)
    :"shard_#{Zlib.crc32(account.id.to_s) % 16}"
  end
end
```

**Why sharding over Elasticsearch**:
- Simpler ops (just MySQL)
- No separate search cluster
- Good enough for most scales

## Key Principles

1. **UUIDs over integers** - Security, distribution, client generation
2. **State records over booleans** - Who, when, why
3. **Database-backed infra** - Solid Queue/Cache/Cable over Redis
4. **Hard deletes** - Simpler queries, use audit logs for history
5. **Counter caches** - Denormalize common counts
6. **Index what you query** - But don't over-index
