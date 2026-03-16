# Workflows

> Event-driven state and undoable commands.

---

## Event-Driven State Tracking

**Pattern**: Store state transitions as events with structured metadata instead of just updating state fields.

**Implementation** (from PR [#121](https://github.com/basecamp/fizzy/pull/121)):

```ruby
module Event::Stages
  extend ActiveSupport::Concern

  included do
    store_accessor :particulars, :stage_id
  end

  def stage
    @stage ||= account.stages.find_by_id stage_id
  end
end
```

**Why it matters**:
- Creates an audit trail of all state changes
- Enables time-travel queries ("what stage was this in last week?")
- Supports undo/redo functionality
- Powers activity feeds and notifications
- Allows retroactive analysis of workflow bottlenecks

**Application**: Any system with status fields (order status, ticket status, approval workflows) should consider event sourcing instead of direct updates.

---

## 2. After-Commit Callbacks for Default Data

**Pattern**: Use `after_create_commit` to create default associated records, ensuring they're only created after the transaction succeeds.

**Implementation** (from PR [#413](https://github.com/basecamp/fizzy/pull/413)):

```ruby
class Workflow < ApplicationRecord
  DEFAULT_STAGES = [ "Triage", "In progress", "On Hold", "Review" ]

  after_create_commit :create_default_stages

  private
    def create_default_stages
      Workflow::Stage.insert_all \
        DEFAULT_STAGES.collect { |default_stage_name|
          { workflow_id: id, name: default_stage_name }
        }
    end
end
```

**Why it matters**:
- Avoids creating orphaned records if parent creation fails
- Uses `insert_all` for performance with multiple records
- Keeps default configuration in one place
- Ensures atomic operations

**Application**: Use for any resource that requires default child records (project templates, user preferences, configuration presets).

---

## 3. Cascading Workflow Changes

**Pattern**: When a parent's workflow changes, update all children in a single operation.

**Implementation** (from PR [#329](https://github.com/basecamp/fizzy/pull/329)):

```ruby
class Bucket < ApplicationRecord
  belongs_to :workflow, optional: true
  has_many :bubbles, dependent: :destroy

  after_save :update_bubbles_workflow, if: :saved_change_to_workflow_id?

  private
    def update_bubbles_workflow
      bubbles.update_all(stage_id: workflow&.stages&.first&.id)
    end
end
```

**Why it matters**:
- Maintains consistency when workflow configuration changes
- Uses `update_all` for performance (single SQL UPDATE)
- Handles nil workflows gracefully with safe navigation (`&.`)
- Only runs when workflow actually changes

**Application**: Useful for hierarchical data where parent changes should cascade (organization settings, folder permissions, template applications).

---

## 4. Computed State from Associations

**Pattern**: Derive state from associations rather than storing redundant data.

**Implementation** (from PR [#389](https://github.com/basecamp/fizzy/pull/389)):

```ruby
module Card::Colored
  extend ActiveSupport::Concern

  def color
    color_from_stage || Colorable::DEFAULT_COLOR
  end

  private
    def color_from_stage
      stage&.color&.presence if doing?
    end
end
```

**Why it matters**:
- Single source of truth (stage owns the color)
- Changes propagate automatically
- No data synchronization issues
- Easier testing and reasoning

**Application**: Prefer computed properties over denormalized columns when consistency matters more than read performance.

---

## 5. Custom Turbo Stream Actions for Real-Time Updates

**Pattern**: Extend Turbo Streams with custom actions for complex UI state changes.

**Implementation** (from PR [#389](https://github.com/basecamp/fizzy/pull/389)):

```ruby
# JavaScript
Turbo.StreamActions.set_css_variable = function() {
  const name = this.getAttribute("name")
  const value = this.getAttribute("value")

  this.targetElements.forEach(element =>
    element.style.setProperty(name, value)
  )
}

# Ruby helper
module TurboStreamsActionsHelper
  def set_css_variable(target, name:, value:)
    tag.turbo_stream target: target, action: "set_css_variable", name:, value:
  end
end

Turbo::Streams::TagBuilder.prepend(TurboStreamsActionsHelper)

# Usage in turbo_stream view
<%= turbo_stream.set_css_variable dom_id(@card, :card_container),
      name: "--card-color",
      value: @card.color %>
```

**Why it matters**:
- Updates UI without full DOM replacement
- Maintains smooth user experience during state transitions
- Declarative from server side
- Reusable across application

**Application**: Use for any dynamic UI that needs to reflect server-side state changes (theme updates, progress indicators, status badges).

---

## 6. Undoable Command Pattern

**Pattern**: Structure operations as command objects with built-in undo support.

**Implementation** (from PR [#662](https://github.com/basecamp/fizzy/pull/662)):

```ruby
class Command::Stage < Command
  include Command::Cards

  store_accessor :data, :stage_id, :original_stage_ids_by_card_id

  def execute
    original_stage_ids_by_card_id = {}

    transaction do
      cards.find_each do |card|
        next unless card_compatible_with_stage?(card)

        original_stage_ids_by_card_id[card.id] = card.stage_id
        card.change_stage_to stage
      end

      update! original_stage_ids_by_card_id: original_stage_ids_by_card_id
    end
  end

  def undo
    transaction do
      affected_cards_by_id = user.accessible_cards
        .where(id: original_stage_ids_by_card_id.keys)
        .index_by(&:id)
      stages_by_id = Workflow::Stage
        .where(id: original_stage_ids_by_card_id.values)
        .uniq
        .index_by(&:id)

      original_stage_ids_by_card_id.each do |card_id, original_stage_id|
        card = affected_cards_by_id[card_id.to_i]
        stage = stages_by_id[original_stage_id.to_i]

        next unless card && stage

        card.change_stage_to stage
      end
    end
  end
end
```

**Why it matters**:
- Captures original state before changes
- Enables true undo (not just "reverse operation")
- Handles batch operations correctly
- Stores undo data with the command itself
- Uses `index_by` for efficient lookups when undoing

**Application**: Critical for user-facing bulk operations, data imports, or any destructive action that users might want to reverse.

---

## 7. Scope-Based Filtering with Polymorphic Support

**Pattern**: Build flexible filters by chaining scopes with polymorphic relationships.

**Implementation** (from PR [#218](https://github.com/basecamp/fizzy/pull/218)):

```ruby
class Filter < ApplicationRecord
  include Params, Resources, Summarized

  has_and_belongs_to_many :stages,
    class_name: "Workflow::Stage",
    join_table: "filters_stages"

  def bubbles
    result = base_scope
    result = result.assigned_to(assignees.ids) if assignees.present?
    result = result.in_stage(stages.ids) if stages.present?
    result = result.tagged_with(tags.ids) if tags.present?
    result
  end
end

# In the filterable model
module Bubble::Staged
  included do
    scope :in_stage, ->(stage) { where stage: stage }
  end
end
```

**Why it matters**:
- Composable filtering logic
- Each concern adds its own scope
- Conditionally applied based on filter presence
- Easy to test individual scopes
- Supports complex AND/OR logic

**Application**: Essential for any list view with multiple filter criteria (admin panels, reports, search results).

---

## 8. Contextual Defaults with Delegation

**Pattern**: Delegate workflow state to parent but allow local overrides.

**Implementation** (from PR [#121](https://github.com/basecamp/fizzy/pull/121)):

```ruby
module Bubble::Staged
  extend ActiveSupport::Concern

  included do
    belongs_to :stage, class_name: "Workflow::Stage", optional: true
  end

  def workflow
    stage&.workflow
  end

  def toggle_stage(stage)
    if self.stage == stage
      update! stage: nil
      track_event :unstaged, stage_id: stage.id
    else
      update! stage: stage
      track_event :staged, stage_id: stage.id
    end
  end
end
```

**Why it matters**:
- Item can exist without a stage (optional: true)
- Workflow derived from current stage
- Toggle pattern simplifies UI (same button adds/removes)
- Events track both directions of state change

**Application**: Use for optional categorization systems, toggleable features, or reversible state.

---

## 9. Workflow Summary Generation

**Pattern**: Generate human-readable summaries of complex filter/workflow state.

**Implementation** (from PR [#218](https://github.com/basecamp/fizzy/pull/218)):

```ruby
module Filter::Summarized
  def summary
    [
      index_summary,
      tag_summary,
      assignee_summary,
      stage_summary,
      terms_summary
    ].compact.to_sentence + " #{bucket_summary}"
  end

  private
    def stage_summary
      if stages.any?
        "staged in #{stages.pluck(:name).to_choice_sentence}"
      end
    end
end
```

**Why it matters**:
- Makes complex state understandable at a glance
- Helps users understand current view/filter
- Useful for saved filters and bookmarks
- Aids in debugging and logging

**Application**: Any complex query builder, filter system, or workflow state display.

---

## 10. Testing Workflow State Transitions

**Pattern**: Test both the state change AND the event creation.

**Implementation** (from PR [#413](https://github.com/basecamp/fizzy/pull/413)):

```ruby
test "create with default stages" do
  workflow = Workflow.create name: "My New Workflow"
  assert_equal Workflow::DEFAULT_STAGES.sort,
               workflow.stages.collect(&:name).sort
end
```

**Best practices from the PRs**:
- Test default creation
- Test state transitions
- Test edge cases (already in state, nil state)
- Test undo operations
- Test batch operations
- Use `assert_changes` for state verification

---

## 11. Before-Create Initialization

**Pattern**: Set initial workflow state before record creation to ensure consistency.

**Implementation** (from PR [#121](https://github.com/basecamp/fizzy/pull/121), later refactored in [#1258](https://github.com/basecamp/fizzy/pull/1258)):

```ruby
included do
  before_create :assign_initial_stage
end

private
  def assign_initial_stage
    self.stage = collection.initial_workflow_stage
  end
```

**Why it matters**:
- Ensures records never exist without required workflow state
- Happens before validation, so can be validated
- Atomic with record creation
- Predictable default state

**Application**: Use when every record must start in a specific workflow state (new orders, draft documents, pending approvals).

---

## 12. Contextual Validation and Compatibility Checks

**Pattern**: Validate workflow transitions based on business context.

**Implementation** (from PR [#662](https://github.com/basecamp/fizzy/pull/662)):

```ruby
class Command::Stage < Command
  validates_presence_of :stage

  private
    def card_compatible_with_stage?(card)
      stage&.workflow && card.collection.workflow == stage.workflow
    end
end
```

**Why it matters**:
- Prevents invalid state transitions
- Catches configuration errors early
- Provides clear error messages
- Business rules enforced at model layer

**Application**: Critical for multi-tenant systems or contexts where different entities have different workflow rules.

---

## Key Takeaways

1. **Events > Direct Updates**: Store state changes as events for auditability and flexibility
2. **Batch Operations**: Use `update_all`, `insert_all` for performance with multiple records
3. **Safe Navigation**: Leverage `&.` operator for optional associations in workflows
4. **Computed Properties**: Derive state from associations when consistency matters
5. **Undo Support**: Capture original state in command objects for true undo
6. **Scoped Filtering**: Build composable filters with chained scopes
7. **Custom Turbo Actions**: Extend Turbo Streams for complex UI updates
8. **Contextual Defaults**: Use callbacks for initialization, delegation for inheritance
9. **Human Summaries**: Generate readable descriptions of complex state
10. **Comprehensive Testing**: Test state changes, events, edge cases, and undo

---

## PR References

- **[#121](https://github.com/basecamp/fizzy/pull/121)**: Initial workflow spike - basic stage tracking, event model
- **[#218](https://github.com/basecamp/fizzy/pull/218)**: Stage filtering - scope-based filtering, join tables, summaries
- **[#329](https://github.com/basecamp/fizzy/pull/329)**: Bucket-level workflows - cascading changes, parent-child relationships
- **[#389](https://github.com/basecamp/fizzy/pull/389)**: Stage colors - computed properties, custom Turbo actions, real-time updates
- **[#413](https://github.com/basecamp/fizzy/pull/413)**: Default stages - after_commit callbacks, insert_all performance
- **[#662](https://github.com/basecamp/fizzy/pull/662)**: Stage command - undoable commands, contextual validation
- **[#763](https://github.com/basecamp/fizzy/pull/763)**: Stage resolution - command context awareness
- **[#1258](https://github.com/basecamp/fizzy/pull/1258)**: Workflow cleanup - migration from stages to columns (demonstrates refactoring patterns)

Each pattern is production-tested and battle-hardened from a real-world project management application.
