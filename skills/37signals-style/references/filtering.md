# Filtering

> Filter objects and URL-based state management.

---

## Filter Object Pattern

**Pattern**: Extract filtering logic from controllers into dedicated Plain Old Ruby Objects (POROs).

### Evolution Journey (PRs [#115](https://github.com/basecamp/fizzy/pull/115), [#116](https://github.com/basecamp/fizzy/pull/116))

**Before**: Logic lived in controller as instance variables and before_action callbacks
```ruby
# Anti-pattern: Controller doing too much
class BubblesController < ApplicationController
  before_action :set_tag_filters, :set_assignee_filters

  def index
    @bubbles = @bucket.bubbles
    @bubbles = @bubbles.ordered_by(params[:order_by] || Bubble.default_order_by)
    @bubbles = @bubbles.tagged_with(@tag_filters) if @tag_filters
    @bubbles = @bubbles.assigned_to(@assignee_filters) if @assignee_filters
    # ... more filtering
  end

  private
    def set_tag_filters
      if params[:tag_ids]
        @tag_filters = Current.account.tags.where id: params[:tag_ids]
      end
    end
end
```

**After**: Clean filter object with single responsibility
```ruby
# Controller (slim and focused)
class BubblesController < ApplicationController
  before_action :set_filter

  def index
    @bubbles = @filter.bubbles
  end

  private
    def set_filter
      @filter = @bucket.bubble_filter_from helpers.view_filter_params
    end
end

# Filter object (encapsulates all filtering logic)
class Bucket::BubbleFilter
  def initialize(bucket, params = {})
    @bucket = bucket
    @status = params["status"]
    @order_by = params["order_by"]
    @term = params["term"]
    @tag_ids = params["tag_ids"]
    @assignee_ids = params["assignee_ids"]
  end

  def bubbles
    @bubbles ||= begin
      result = bucket.bubbles
      result = result.ordered_by(order_by || Bubble.default_order_by)
      result = result.with_status(status || Bubble.default_status)
      result = result.tagged_with(tags) if tags
      result = result.assigned_to(assignees) if assignees
      result = result.mentioning(term) if term
      result
    end
  end

  def tags
    @tags ||= account.tags.where(id: tag_ids) if tag_ids
  end

  def assignees
    @assignees ||= account.users.where(id: assignee_ids) if assignee_ids
  end

  private
    attr_reader :bucket, :status, :order_by, :term, :tag_ids, :assignee_ids
    delegate :account, to: :bucket, private: true
end
```

**Why it matters**:
- **Testability**: Filter logic can be tested in isolation without controller/request overhead
- **Reusability**: Same filter can be used in multiple contexts (controllers, views, background jobs)
- **Clarity**: Reader immediately understands what data is being filtered
- **Separation of concerns**: Controller handles HTTP, filter handles business logic

**Key insight from PR [#115](https://github.com/basecamp/fizzy/pull/115)**: Don't be afraid to iterate. The initial implementation lived on the model, then moved to a concern, then extracted to a PORO when it became clear the logic didn't belong on the domain model.

---

## 2. Query Composition: Lazy Evaluation with Memoization

**Pattern**: Build queries lazily using memoization, allowing filters to be composed incrementally.

```ruby
class Filter
  def cards
    @cards ||= begin
      result = creator.accessible_cards.preloaded.published
      result = result.indexed_by(indexed_by)
      result = result.sorted_by(sorted_by)
      result = result.where(id: card_ids) if card_ids.present?
      result = result.where.missing(:not_now) unless include_not_now_cards?
      result = result.open unless include_closed_cards?
      result = result.unassigned if assignment_status.unassigned?
      result = result.assigned_to(assignees.ids) if assignees.present?
      result = result.where(creator_id: creators.ids) if creators.present?
      result = result.where(board: boards.ids) if boards.present?
      result = result.tagged_with(tags.ids) if tags.present?
      result = result.where(cards: { created_at: creation_window }) if creation_window
      result = result.closed_at_window(closure_window) if closure_window
      result = result.closed_by(closers) if closers.present?
      result = terms.reduce(result) do |result, term|
        result.mentioning(term, user: creator)
      end

      result.distinct
    end
  end
end
```

**Why it matters**:
- **Performance**: Query isn't executed until results are needed
- **Composability**: Each condition is independent and can be conditionally applied
- **Readability**: Sequential building mirrors how humans think about filtering
- **Testability**: Easy to verify each filter condition in isolation

**Key techniques**:
1. **Memoization** (`@cards ||=`) - Execute query only once
2. **Conditional application** - Only add filters when relevant data exists
3. **Distinct at the end** - Handle edge cases where joins might create duplicates
4. **Reduce for arrays** - Elegant way to apply multiple similar filters (e.g., search terms)

---

## 3. URL-Based Filter State: Stateless Filtering

**Pattern**: Store filter state entirely in URL parameters, making filters bookmarkable and shareable.

### Filter Params Module

```ruby
module Filter::Params
  PERMITTED_PARAMS = [
    :assignment_status,
    :indexed_by,
    :sorted_by,
    :creation,
    :closure,
    card_ids: [],
    assignee_ids: [],
    creator_ids: [],
    closer_ids: [],
    board_ids: [],
    tag_ids: [],
    terms: []
  ]

  # Convert filter to URL params
  def as_params
    @as_params ||= {}.tap do |params|
      params[:indexed_by]        = indexed_by
      params[:sorted_by]         = sorted_by
      params[:creation]          = creation
      params[:closure]           = closure
      params[:assignment_status] = assignment_status
      params[:terms]             = terms
      params[:tag_ids]           = tags.ids
      params[:board_ids]         = boards.ids
      params[:card_ids]          = card_ids
      params[:assignee_ids]      = assignees.ids
      params[:creator_ids]       = creators.ids
      params[:closer_ids]        = closers.ids
    end.compact_blank.reject(&method(:default_value?))
  end

  # Remove a specific filter value from params
  def as_params_without(key, value)
    as_params.dup.tap do |params|
      if params[key].is_a?(Array)
        params[key] = params[key] - [ value ]
        params.delete(key) if params[key].empty?
      elsif params[key] == value
        params.delete(key)
      end
    end
  end
end
```

### Controller Pattern

```ruby
module FilterScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_filter
  end

  private
    def set_filter
      if params[:filter_id].present?
        @filter = Current.user.filters.find(params[:filter_id])
      else
        @filter = Current.user.filters.from_params filter_params
      end
    end

    def filter_params
      params.reverse_merge(**Filter.default_values).permit(*Filter::PERMITTED_PARAMS)
    end
end
```

**Why it matters**:
- **Shareability**: Users can share filtered views via URL
- **Bookmarkability**: Users can bookmark specific filter combinations
- **Statelessness**: No server-side session state needed
- **Back button works**: Browser history navigation works naturally
- **Deep linking**: Direct links to filtered views work correctly

**Key insight from PR [#138](https://github.com/basecamp/fizzy/pull/138)**: The `as_params_without` method is crucial for creating "remove filter" links that preserve other active filters.

---

## 4. Filter Chips as Links (PR [#138](https://github.com/basecamp/fizzy/pull/138))

**Pattern**: Render active filters as removable chips using links, not forms.

**Before** (form-based approach):
```ruby
# Anti-pattern: Using forms and JavaScript to manage filter chips
def filter_chip_tag(text, name:, value:)
  tag.button class: "btn txt-small btn--remove",
             data: { action: "filter-form#removeFilter form#submit" } do
    concat hidden_field_tag(name, value, id: nil)
    concat tag.span(text)
    concat image_tag("close.svg")
  end
end

# Required complex JavaScript to hide/show and enable/disable inputs
class FilterFormController extends Controller {
  removeFilter(event) {
    event.preventDefault()
    this.#hideChip(event.target.closest("button"))
  }

  #hideChip(button) {
    button.querySelector("input").disabled = true
    button.hidden = true
  }
}
```

**After** (link-based approach):
```ruby
# Better: Pure links, no JavaScript needed for basic functionality
def filter_chip_tag(text, params)
  link_to bubbles_path(params), class: "btn txt-small btn--remove" do
    concat tag.span(text)
    concat image_tag("close.svg")
  end
end

# Usage in view
<% filter.tags.each do |tag| %>
  <%= filter_chip_tag tag.hashtag, filter.as_params_without(:tag_ids, tag.id) %>
<% end %>

<% filter.assignees.each do |assignee| %>
  <%= filter_chip_tag "for #{assignee.name}", filter.as_params_without(:assignee_ids, assignee.id) %>
<% end %>
```

**Why it matters**:
- **Simplicity**: No JavaScript required for basic removal functionality
- **Accessibility**: Links work with screen readers and keyboard navigation out of the box
- **Progressive enhancement**: Works even if JavaScript fails to load
- **Turbo-friendly**: Turbo Drive handles navigation automatically
- **Less code**: Eliminated 20+ lines of JavaScript

**Testing pattern**:
```ruby
test "params without a key-value pair" do
  filter = users(:david).filters.new(
    indexed_by: "most_discussed",
    assignee_ids: [ users(:jz).id, users(:kevin).id ]
  )

  # Removing one assignee keeps the other
  expected = { indexed_by: "most_discussed", assignee_ids: [ users(:kevin).id ] }
  assert_equal expected.stringify_keys,
               filter.as_params_without(:assignee_ids, users(:jz).id).to_h

  # Removing the only value of a key removes the key entirely
  expected = { assignee_ids: [ users(:jz).id, users(:kevin).id ] }
  assert_equal expected.stringify_keys,
               filter.as_params_without(:indexed_by, "most_discussed").to_h
end
```

---

## 5. Stimulus Controllers for Filters (PR [#567](https://github.com/basecamp/fizzy/pull/567))

**Pattern**: Use two complementary Stimulus controllers for rich filtering UX.

### Filter Controller: Search/Filtering

```javascript
// Controls filtering items based on user input
import { Controller } from "@hotwired/stimulus"
import { debounce } from "helpers/timing_helpers"

export default class extends Controller {
  static targets = [ "input", "item" ]

  initialize() {
    this.filter = debounce(this.filter.bind(this), 100)
  }

  filter() {
    this.itemTargets.forEach(item => {
      if (item.textContent.toLowerCase().includes(this.inputTarget.value.toLowerCase())) {
        item.removeAttribute("hidden")
      } else {
        item.toggleAttribute("hidden", true)
      }
    })

    this.dispatch("changed")
  }
}
```

### Navigable List Controller: Keyboard Navigation

```javascript
// Provides keyboard navigation for filtered items
export default class extends Controller {
  static targets = [ "item" ]
  static values = {
    reverseOrder: { type: Boolean, default: false },
    selectionAttribute: { type: String, default: "aria-selected" },
    focusOnSelection: { type: Boolean, default: true },
    actionableItems: { type: Boolean, default: false }
  }

  connect() {
    this.reset()
  }

  reset() {
    if (this.reverseOrderValue) {
      this.selectLast()
    } else {
      this.selectFirst()
    }
  }

  navigate(event) {
    this.#keyHandlers[event.key]?.call(this, event)
  }

  #selectPrevious() {
    const index = this.#visibleItems.indexOf(this.currentItem)
    if (index > 0) {
      this.#setCurrentFrom(this.#visibleItems[index - 1])
    }
  }

  #selectNext() {
    const index = this.#visibleItems.indexOf(this.currentItem)
    if (index >= 0 && index < this.#visibleItems.length - 1) {
      this.#setCurrentFrom(this.#visibleItems[index + 1])
    }
  }

  #clickCurrentItem(event) {
    if (this.actionableItemsValue && this.currentItem) {
      const clickableElement = this.currentItem.querySelector("a,button") || this.currentItem
      clickableElement.click()
      event.preventDefault()
    }
  }

  #toggleCurrentItem(event) {
    if (this.actionableItemsValue && this.currentItem) {
      const toggleable = this.currentItem.querySelector("input[type=checkbox]")
      if (toggleable) {
        toggleable.checked = !toggleable.checked
        toggleable.dispatchEvent(new Event('change', { bubbles: true }))
        event.preventDefault()
      }
    }
  }

  get #visibleItems() {
    return this.itemTargets.filter(item => !item.hidden)
  }

  #keyHandlers = {
    ArrowDown(event) {
      this.#handleArrowKey(event, this.#selectNext.bind(this))
    },
    ArrowUp(event) {
      this.#handleArrowKey(event, this.#selectPrevious.bind(this))
    },
    Enter(event) {
      this.#clickCurrentItem(event)
    },
    Space(event) {
      this.#toggleCurrentItem(event)
    }
  }
}
```

### View Integration

```erb
<dialog data-controller="filter navigable-list"
        data-action="keydown->navigable-list#navigate
                     filter:changed->navigable-list#reset"
        data-navigable-list-focus-on-selection-value="false"
        data-navigable-list-actionable-items-value="true">

  <%= text_field_tag :search, nil,
        placeholder: "Filter…",
        class: "input",
        autofocus: true,
        data: {
          filter_target: "input",
          action: "input->filter#filter"
        } %>

  <ul>
    <% @tags.each do |tag| %>
      <li data-filter-target="item"
          data-navigable-list-target="item">
        <%= link_to tag.hashtag, tag_path(tag) %>
      </li>
    <% end %>
  </ul>
</dialog>
```

**Why it matters**:
- **Separation of concerns**: Filter handles search, navigable-list handles keyboard interaction
- **Composability**: Controllers can be used independently or together
- **Accessibility**: Proper ARIA attributes for screen readers
- **UX**: Keyboard navigation feels like native OS behavior
- **Responsive**: Debounced filtering prevents lag on large lists

**Key insight from PR [#567](https://github.com/basecamp/fizzy/pull/567)**: The `filter:changed` event dispatched by the filter controller triggers `navigable-list#reset`, ensuring keyboard selection stays on visible items after filtering.

---

## 6. Testing Filter Logic

**Pattern**: Test filters as unit tests on the model/PORO, not as integration tests.

```ruby
class FilterTest < ActiveSupport::TestCase
  test "cards" do
    # Test multiple filter conditions
    filter = users(:david).filters.new(
      creator_ids: [ users(:david).id ],
      tag_ids: [ tags(:mobile).id ]
    )
    assert_equal [ cards(:layout) ], filter.cards

    # Test unassigned filter
    filter = users(:david).filters.new(
      assignment_status: "unassigned",
      board_ids: [ @new_board.id ]
    )
    assert_equal [ @new_card ], filter.cards
  end

  test "can't see cards in boards that aren't accessible" do
    boards(:writebook).update! all_access: false
    boards(:writebook).accesses.revoke_from users(:david)

    assert_empty users(:david).filters.new(
      board_ids: [ boards(:writebook).id ]
    ).cards
  end

  test "remembering equivalent filters" do
    # Test that equivalent filters are deduped
    assert_difference "Filter.count", +1 do
      filter = users(:david).filters.remember(
        sorted_by: "latest",
        assignment_status: "unassigned",
        tag_ids: [ tags(:mobile).id ]
      )

      assert_changes "filter.reload.updated_at" do
        # Same filter params should update existing, not create new
        assert_equal filter, users(:david).filters.remember(
          tag_ids: [ tags(:mobile).id ],
          assignment_status: "unassigned"
        )
      end
    end
  end

  test "turning into params" do
    filter = users(:david).filters.new(
      sorted_by: "latest",
      tag_ids: "",
      assignee_ids: [ users(:jz).id ],
      board_ids: [ boards(:writebook).id ]
    )

    expected = {
      assignee_ids: [ users(:jz).id ],
      board_ids: [ boards(:writebook).id ]
    }
    assert_equal expected, filter.as_params
  end
end
```

**Why it matters**:
- **Speed**: Unit tests run 10-100x faster than controller/system tests
- **Isolation**: Test filter logic independent of HTTP/routing/rendering
- **Coverage**: Easy to test edge cases and combinations
- **Debugging**: Failures pinpoint exact filter condition that's broken

**Key testing principles**:
1. Test the query results, not the SQL
2. Test permission boundaries (what users can/can't see)
3. Test filter deduplication/normalization
4. Test param serialization/deserialization
5. Test resource cleanup (what happens when filtered resources are deleted)

---

## 7. Advanced Pattern: Filter Persistence with Digest

**Pattern**: Allow saving filters by generating a digest of normalized params.

```ruby
module Filter::Params
  class_methods do
    def find_by_params(params)
      find_by params_digest: digest_params(params)
    end

    def digest_params(params)
      Digest::MD5.hexdigest normalize_params(params).to_json
    end

    def normalize_params(params)
      params
        .to_h
        .compact_blank
        .reject(&method(:default_value?))
        .collect { |name, value|
          [ name, value.is_a?(Array) ? value.collect(&:to_s) : value.to_s ]
        }
        .sort_by { |name, _| name.to_s }
        .to_h
    end
  end

  def self.remember(attrs)
    create!(attrs)
  rescue ActiveRecord::RecordNotUnique
    find_by_params(attrs).tap(&:touch)
  end
end
```

**Why it matters**:
- **Deduplication**: Prevents creating duplicate saved filters
- **Normalization**: `tag_ids: [1, 2]` and `tag_ids: ["1", "2"]` are treated as same
- **Order independence**: Array order doesn't affect digest
- **Smart defaults**: Default values are excluded from digest

**Use cases**:
- Saved searches/filters
- Recent filters list
- Filter analytics (which filters are most popular)
- Filter sharing (generate short URLs for complex filters)

---

## Summary: Key Takeaways

1. **Extract to POROs**: Move filter logic from controllers to dedicated filter objects
2. **Lazy composition**: Build queries incrementally with memoization
3. **URL as state**: Store all filter state in URL parameters for shareability
4. **Links over forms**: Use links for filter chips, simpler than form JavaScript
5. **Dual Stimulus controllers**: Separate filtering from keyboard navigation
6. **Unit test filters**: Test query logic as unit tests, not integration tests
7. **Normalize params**: Create digests for filter deduplication and persistence

These patterns scale from simple tag filtering to complex multi-dimensional filtering with saved searches, keyboard navigation, and real-time filtering UX.
