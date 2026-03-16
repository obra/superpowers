# Testing Patterns

> Minitest with fixtures - simple, fast, deterministic.

---

## Minitest Over RSpec

37signals uses Minitest, not RSpec:
- Simpler, less DSL magic
- Ships with Rails
- Faster boot time
- Plain Ruby assertions

## Fixtures Over Factories

Fixtures provide deterministic, preloaded test data:

```yaml
# test/fixtures/users.yml
david:
  identity: david
  account: basecamp
  role: admin

jason:
  identity: jason
  account: basecamp
  role: member
```

```ruby
# In tests
test "admin can delete cards" do
  user = users(:david)
  card = cards(:urgent_bug)

  assert user.can_delete?(card)
end
```

**Why fixtures over factories**:
- Loaded once, reused across tests
- No runtime object creation overhead
- Relationships are explicit and visible
- Deterministic IDs for debugging

## Fixture Relationships

Use labels, not IDs:

```yaml
# test/fixtures/cards.yml
urgent_bug:
  board: engineering
  creator: david
  title: "Fix login bug"
  created_at: <%= 2.days.ago %>

# test/fixtures/comments.yml
first_comment:
  card: urgent_bug
  creator: jason
  body: "I'll take this one"
```

## ERB in Fixtures

Use ERB for dynamic values:

```yaml
recent_card:
  board: engineering
  creator: david
  created_at: <%= 1.hour.ago %>

old_card:
  board: engineering
  creator: david
  created_at: <%= 6.months.ago %>
```

## Test Structure

```ruby
class CardTest < ActiveSupport::TestCase
  setup do
    @card = cards(:urgent_bug)
    @user = users(:david)
  end

  test "closing a card creates an event" do
    assert_difference "Event.count", 1 do
      @card.close(by: @user)
    end

    assert @card.closed?
    assert_equal "closed", Event.last.action
  end

  test "closed cards cannot be edited" do
    @card.close(by: @user)

    assert_not @card.editable_by?(@user)
  end
end
```

## Integration Tests

Test full request/response cycles:

```ruby
class CardsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:david)
    sign_in_as @user
  end

  test "creating a card" do
    assert_difference "Card.count", 1 do
      post board_cards_path(boards(:engineering)),
        params: { card: { title: "New feature" } }
    end

    assert_redirected_to card_path(Card.last)
  end

  test "unauthorized users cannot delete" do
    sign_in_as users(:guest)

    assert_no_difference "Card.count" do
      delete card_path(cards(:urgent_bug))
    end

    assert_response :forbidden
  end
end
```

## System Tests

Use Capybara for browser testing:

```ruby
class CardSystemTest < ApplicationSystemTestCase
  setup do
    sign_in_as users(:david)
  end

  test "dragging card between columns" do
    visit board_path(boards(:engineering))

    card = find("[data-card-id='#{cards(:urgent_bug).id}']")
    target = find("[data-column='doing']")

    card.drag_to(target)

    assert_selector "[data-column='doing'] [data-card-id='#{cards(:urgent_bug).id}']"
  end
end
```

## Test Helpers

```ruby
# test/test_helper.rb
class ActiveSupport::TestCase
  include SignInHelper

  parallelize(workers: :number_of_processors)
  fixtures :all
end

module SignInHelper
  def sign_in_as(user)
    post session_path, params: {
      email: user.identity.email
    }
    # Follow magic link in test mode
    follow_redirect!
  end
end
```

## Testing Time

Use `travel_to` for time-dependent tests:

```ruby
test "cards auto-close after 30 days of inactivity" do
  card = cards(:stale_card)

  travel_to 31.days.from_now do
    Card.auto_close_stale!

    assert card.reload.closed?
  end
end
```

## VCR for External APIs

Record and replay HTTP interactions:

```ruby
test "fetching weather data" do
  VCR.use_cassette("weather/new_york") do
    weather = WeatherService.fetch("New York")

    assert_equal "Sunny", weather.condition
  end
end
```

## Testing Jobs

```ruby
test "closing card enqueues notification job" do
  assert_enqueued_with(job: NotifyWatchersJob) do
    cards(:urgent_bug).close(by: users(:david))
  end
end

test "notification job sends emails" do
  perform_enqueued_jobs do
    cards(:urgent_bug).close(by: users(:david))
  end

  assert_emails 3  # 3 watchers
end
```

## When Tests Ship

Tests ship **with** features in the same commit:
- Not beforehand (not strict TDD)
- Not afterward (not "I'll add tests later")
- Security fixes always include regression tests

## Key Principles

1. **Minitest is enough** - No need for RSpec's DSL
2. **Fixtures over factories** - Faster, deterministic, visible relationships
3. **Test behavior, not implementation** - What it does, not how
4. **Integration tests for flows** - Cover the full stack
5. **Ship tests with features** - Same commit, same PR
