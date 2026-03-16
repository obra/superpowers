# Jorge Manrubia Code Review Patterns

> 📝 **A note on attribution**: We created these personal pattern files to give credit to individual developers whose review style we found instructive. This content was compiled with AI assistance by analyzing PR comments, so take it with a grain of salt—some patterns may be misattributed or misinterpreted. When in doubt, check the linked PRs.

> Extracted from PRs [#339](https://github.com/basecamp/fizzy/pull/339), [#483](https://github.com/basecamp/fizzy/pull/483), [#929](https://github.com/basecamp/fizzy/pull/929), [#1052](https://github.com/basecamp/fizzy/pull/1052)
> Focus: Architecture, Rails patterns, testing, and performance

---

## Code Review Philosophy

### Question Everything, Suggest Gently

**Pattern**: Jorge doesn't mandate changes - he questions and offers alternatives.

```
"For your consideration, I'd consider introducing a proper object..."
"I think you could remove these..."
"What do you think of naming this..."
```

**Why it matters**: Creates collaborative atmosphere, teaches decision-making, not just solutions.

**PR [#929](https://github.com/basecamp/fizzy/pull/929)**: Multiple back-and-forth discussions about quota design, each building on previous feedback.

---

### Public vs Private Surface Area

**Pattern**: Aggressively minimize public methods.

```ruby
# Bad - exposes internal details
class Quota
  def reset_quota
  def check_if_due_for_reset
  def calculate_usage
end

# Good - narrow public API
class Quota
  def spend(cost)
  def ensure_not_depleted

  private
    def reset_if_due
    def depleted?
end
```

**PR [#929](https://github.com/basecamp/fizzy/pull/929) feedback**:
> "I'd use the rule of not adding public methods that are not used anywhere. The narrower the public surface of a class the better, since it's easier to grasp its responsibilities at a glance."

**Why it matters**:
- Easier to understand class responsibilities
- Signals internal vs external concerns
- Prevents coupling

---

### Domain-Driven Naming

**Pattern**: Choose names that reflect business reality, not implementation.

**PR [#929](https://github.com/basecamp/fizzy/pull/929) examples**:

```ruby
# Jorge's suggestion: treat quota as something you "spend"
quota.spend(cost)           # not increment_usage(cost)
quota.ensure_not_depleted   # not ensure_under_limit
quota.depleted?             # not over_limit?

# Reasoning: "A quota is something you spend until you don't have anything left"
```

**Why it matters**: Code reads like the domain experts talk about it.

---

## Architecture Decisions

### Introduce Proper Objects When State Couples

**Pattern**: When parameters get passed through multiple method layers, extract an object.

**PR [#929](https://github.com/basecamp/fizzy/pull/929) - Before (code smell)**:
```ruby
def cost(within:)
  # ...
end

def cost_microcents(within:)
  # ...
end

def limit_cost(within:)
  # ...
end
```

**Jorge's feedback**:
> "The `limit` param results in having to pass it down the pipeline to several other methods. The shared param is often a smell that something is missing."

**After - Extracted `Ai::Quota` model**:
```ruby
class Ai::Quota < ApplicationRecord
  def spend(cost)
  def ensure_not_depleted
  def reset_if_due
end
```

**Why it matters**:
- Eliminates parameter coupling
- Encapsulates related behavior
- Creates clear ownership of concepts

**From PR [#929](https://github.com/basecamp/fizzy/pull/929)**: Quota went from concern with shared params → proper AR model with full lifecycle.

---

### Custom Types: Only When Justified

**Pattern**: Consider custom Active Model types, but weigh the cost.

**PR [#929](https://github.com/basecamp/fizzy/pull/929) discussion** about `Money` type:

Jorge initially suggested custom Active Model type:
```ruby
# Could be done with custom type
class MoneyType < ActiveModel::Type::Value
  def cast(value)
    # handle "$100", 100, BigDecimal...
  end
end

attribute :limit, :money_type
attribute :used, :money_type
```

But then reconsidered:
> "The more I think about this, the more I feel that doing this conversion like this is totally fine. I feel like the whole custom type / accessor thing for money is too much."

**Final approach - Value object**:
```ruby
class Ai::Quota::Money < Data.define(:value)
  MICROCENTS_PER_DOLLAR = 100 * 1_000_000

  def self.wrap(value)
    case value
    when String then convert_dollars_to_microcents(BigDecimal(value[NUMBER_REGEX]))
    when Integer then new(value)
    # ...
    end
  end

  def in_microcents
    value
  end

  def in_dollars
    in_microcents.to_d / MICROCENTS_PER_DOLLAR
  end
end

# Usage
quota.spend(Money.wrap("$5.00"))
message.cost.in_dollars
```

**Why this approach won**:
- Money conversion only happens in one place (`Ai::Quota`)
- Value object encapsulates arithmetic
- Avoids framework overhead
- Fixed-point arithmetic (no float errors)

**Decision criteria**:
> "If we kept messing around with quota amounts in several other places in the app, then the custom type could be justified. But I think the current approach is simple enough."

---

### Concerns: Public Behavior Only

**Pattern**: Don't extract concerns containing only private methods.

**PR [#929](https://github.com/basecamp/fizzy/pull/929)**:
```ruby
# Initial attempt - concern with reset logic
module Ai::Quota::Resettable
  private
    def reset_if_due
    def due_for_reset?
end

# Jorge's feedback:
# "We normally don't extract concerns that only contains private methods."

# Final - inlined into main class
class Ai::Quota
  def spend(cost)
    reset_if_due
    increment!(:used, cost.in_microcents)
  end

  private
    def reset_if_due
      reset if due_for_reset?
    end
end
```

**Rule**:
- **Concern**: Auxiliary public traits (Attachable, Named, Mentionable)
- **Private methods**: Inline in main class unless very large

---

### Wrapping Methods: Hide or Reveal?

**Pattern**: Consider whether wrapping methods hide useful details or just add noise.

**PR [#929](https://github.com/basecamp/fizzy/pull/929) - Jorge changed his mind mid-review**:

Initial thought:
```ruby
# Wrapper seems noisy
user.ensure_ai_quota_not_depleted
user.spend_ai_quota(cost)

# Direct access cleaner?
user.ai_quota.ensure_not_depleted
user.ai_quota.spend(cost)
```

Then reconsidered:
> "Sorry, I notice now that the wrapping methods were dealing with the 'lazy creation' of AI quota. I think it's fine as it was 👍"

**Final pattern**:
```ruby
module User::AiQuota
  def spend_ai_quota(cost)
    fetch_or_create_ai_quota.spend(cost)
  end

  private
    def fetch_or_create_ai_quota
      ai_quota || create_ai_quota!(limit: DEFAULT_QUOTA)
    end
end
```

**Why it matters**: Lazy initialization is internal detail worth hiding.

---

## Performance Patterns

### Memoize in Hot Paths

**Pattern**: Cache method results that are called repeatedly during rendering.

**PR [#1052](https://github.com/basecamp/fizzy/pull/1052)**:
```ruby
# Before - called many times during page render
def as_params
  {}.tap do |params|
    params[:indexed_by] = indexed_by
    params[:sorted_by] = sorted_by
    # ... many queries ...
  end
end

# After
def as_params
  @as_params ||= {}.tap do |params|
    params[:indexed_by] = indexed_by
    # ...
  end
end
```

**Jorge's note**: "This method is invoked many times during a page rendering and it triggers many queries (which will be cached, but we can save that with memoization)"

**Why it matters**: Even query cache has overhead - better to call once.

---

### Template Caching Strategy

**Pattern**: Layer caching at multiple levels - HTTP, template fragments, queries.

**PR [#1052](https://github.com/basecamp/fizzy/pull/1052) - Timeline caching**:

```ruby
# Controller - HTTP caching
class EventsController
  def index
    fresh_when @day_timeline
  end
end

# View - shared across users
<% cache [ user, filter, day.to_date, events ], "day-timeline" do %>
  <%= render "columns" %>
<% end %>

# Partial - filter menu cached per user
<% cache [ user, filter, expanded? ], "user-filtering" do %>
  <%= render "filters/menu" %>
<% end %>
```

**Jorge's comment**:
> "I cached the filter menu since it implies rendering a bunch of templates and triggering many queries. The cache won't be shared across users, but it will be reused essentially in every rendered screen on a per-user basis."

**Caching layers**:
1. **HTTP cache** - Full response (via `fresh_when`)
2. **Column cache** - Shared across users with same events
3. **Filter menu** - Per-user, reused across pages
4. **Timezone** - Added to etag for user-specific rendering

**Why it matters**:
- Identify what varies (user, data, time)
- Cache at the right granularity
- Reuse fragments across requests

---

### Guard Against Token Limits

**Pattern**: When integrating with LLMs, count tokens before sending.

**PR [#483](https://github.com/basecamp/fizzy/pull/483)** - Donal's feedback on embeddings:
```ruby
# Need to truncate to token limit
module Searchable
  def embedding_input
    truncated_to_token_limit(text_for_embedding)
  end

  private
    def truncated_to_token_limit(text)
      tokenizer = Tiktoken.encoding_for_model("text-embedding-3-small")
      tokens = tokenizer.encode(text)

      # Subtract buffer for safety
      max_tokens = 8096 - 20

      if tokens.length > max_tokens
        tokenizer.decode(tokens.first(max_tokens))
      else
        text
      end
    end
end
```

**Why it matters**: API will reject over-limit requests; better to truncate gracefully.

---

## Testing Patterns

### VCR for External APIs

**Pattern**: Record real API responses, replay in tests.

**PR [#483](https://github.com/basecamp/fizzy/pull/483)** - AI translation tests:

```ruby
# test/test_helper.rb
VCR.configure do |config|
  config.cassette_library_dir = "test/vcr_cassettes"
  config.hook_into :webmock
  config.filter_sensitive_data('<API_KEY>') { Rails.application.credentials.openai.api_key }
end

# test/models/command/ai/translator_test.rb
class Command::Ai::TranslatorTest < ActiveSupport::TestCase
  test "filter by assignments" do
    VCR.use_cassette("translator/filter_by_assignments") do
      result = Command::Ai::Translator.new("cards assigned to jz").translate
      assert_equal "jz", result.context[:assignees].first
    end
  end
end
```

**To update cassettes**: `VCR_RECORD=1 bin/rails test`

**Why it matters**:
- Fast tests (no network calls)
- Deterministic (same response every time)
- Works offline
- Documents actual API responses

---

### Development Tests OK

**Pattern**: It's fine to commit WIP tests, clean up before merge.

**PR [#483](https://github.com/basecamp/fizzy/pull/483) - Jorge's comment**:
```ruby
# test/models/command/chat_query_test.rb
# > "This is a test I created for development purposes, I'll nix and create a proper suite"
```

**Why it matters**: Tests evolve with the feature; exploration tests help thinking.

---

## Rails Patterns

### Data.define for Value Objects

**Pattern**: Use Ruby 3.2's `Data.define` for immutable value objects.

**PR [#929](https://github.com/basecamp/fizzy/pull/929)**:
```ruby
class Ai::Quota::Money < Data.define(:value)
  def self.wrap(value)
    new(convert(value))
  end

  def in_dollars
    value.to_d / MICROCENTS_PER_DOLLAR
  end
end

# Usage
money = Money.wrap("$100")
money.value        # => 10000000000 (microcents)
money.in_dollars   # => 100.0
```

**Benefits over Struct**:
- Immutable by default
- Pattern matching support
- Cleaner syntax

---

### Fixed-Point Arithmetic for Money

**Pattern**: Store money as integers (microcents) to avoid float errors.

**PR [#929](https://github.com/basecamp/fizzy/pull/929) discussion**:

```ruby
# Why not DECIMAL column?
# SQLite's DECIMAL is backed by float:
sqlite> SELECT (0.1 + 0.1 + 0.1) - 0.3 as difference;
5.55111512312578e-17

# Solution: INTEGER column with fixed-point conversion
class Ai::Quota::Money
  CENTS_PER_DOLLAR = 100
  MICROCENTS_PER_CENT = 1_000_000
  MICROCENTS_PER_DOLLAR = CENTS_PER_DOLLAR * MICROCENTS_PER_CENT

  def self.convert_dollars_to_microcents(dollars)
    (dollars.to_d * MICROCENTS_PER_DOLLAR).round.to_i
  end
end
```

**Why microcents, not cents?**
- LLM costs are fractions of a cent ($0.00001 per token)
- Microcents give 6 decimal places of precision

---

### Time-Based Reset Without Cron

**Pattern**: Check and reset on use, not scheduled job.

**PR [#929](https://github.com/basecamp/fizzy/pull/929)**:
```ruby
class Ai::Quota
  def spend(cost)
    transaction do
      reset_if_due
      increment!(:used, cost.in_microcents)
    end
  end

  private
    def reset_if_due
      reset if due_for_reset?
    end

    def due_for_reset?
      reset_at.before?(Time.current)
    end

    def reset
      update(used: 0, reset_at: 7.days.from_now)
    end
end
```

**Jorge's feedback on cron approach**:
> "As I was working on this I noticed that we can get by without the Cron job by checking if the quota has to be reset when its incremented. This simplifies things a bit."

**Why it matters**:
- One less moving part
- Resets happen exactly when needed
- No scheduler dependency

---

### Error Handling: Specific Errors

**Pattern**: Define custom errors for business rules.

**PR [#929](https://github.com/basecamp/fizzy/pull/929)**:
```ruby
class Ai::Quota
  class UsageExceedsQuotaError < StandardError; end

  def ensure_not_depleted
    reset_if_due
    raise UsageExceedsQuotaError if depleted?
  end
end

# Controller
rescue_from Ai::Quota::UsageExceedsQuotaError do
  render json: { error: "You've depleted your quota" },
         status: :too_many_requests
end
```

**Why it matters**:
- Specific rescue blocks
- Clear intent
- HTTP status codes match business rules

---

### JavaScript Error Handling

**Pattern**: Parse error responses, show descriptive messages.

**PR [#929](https://github.com/basecamp/fizzy/pull/929)**:
```javascript
// conversation/composer_controller.js
async #failPendingMessage(clientMessageId, response) {
  let errorMessage = null

  if (response?.contentType?.includes('application/json')) {
    const error = JSON.parse(await response.responseText)
    errorMessage = error.error
  }

  this.conversationMessagesOutlet.failPendingMessage(
    clientMessageId,
    errorMessage
  )
}
```

```css
/* Show error as data attribute */
.conversation__message--failed[data-error]::after {
  color: var(--color-negative);
  content: attr(data-error);
  display: block;
}
```

**Why it matters**: Users see "You've depleted your quota" not generic "Error occurred".

---

## Decision-Making Process

### Extract Only When Justified

**Pattern**: Jorge models his thinking process out loud.

**PR [#929](https://github.com/basecamp/fizzy/pull/929) progression**:
1. "The limit param is a smell that something is missing"
2. "Thinking about how to clarify this, my mind goes to having a new record"
3. "This way you remove the responsibility of tracking AI quotas from conversation"

**Teaching moment**: Shows *why* extraction helps, not just *what* to extract.

---

### Reconsider Based on New Information

**Pattern**: Jorge often changes recommendations as discussion evolves.

**PR [#929](https://github.com/basecamp/fizzy/pull/929) - Money type decision**:
- First: "Could we clarify this with an object?"
- Then: "You could use a custom Active Model type"
- Finally: "I think it's good as it is... the current approach is simple enough"

**Why it matters**:
- No ego in code review
- Models learning process
- Best solution emerges through discussion

---

### The "Few Lines of Code" Heuristic

**Pattern**: Default to fewer lines unless more are clearly justified.

**PR [#929](https://github.com/basecamp/fizzy/pull/929)**:
> "My rule of thumb is that the fewer lines of code the better, but of course, it's a fine line without absolute truths (sometimes the extra lines are justified). You have a much better sense of the problems with amounts here so follow your instinct 👍"

---

## Key Takeaways

1. **Narrow public APIs** - Only expose what's actually used
2. **Domain names over technical** - `depleted?` not `over_limit?`
3. **Objects emerge from coupling** - Shared params → extract object
4. **Memoize hot paths** - Methods called during rendering
5. **Layer caching** - HTTP, templates, queries
6. **Fixed-point for money** - Integers, not floats
7. **Reset on use, not cron** - Simpler, more reliable
8. **VCR for APIs** - Fast, deterministic tests
9. **Custom types: only when spread** - If used in one place, value object is enough
10. **Teach through questions** - "What do you think of..." not "Change this to..."
