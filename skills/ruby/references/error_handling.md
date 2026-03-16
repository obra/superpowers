# Ruby Error Handling Patterns

## Custom Exception Hierarchies

Structure domain exceptions under a base error for targeted rescue:

```ruby
module MyApp
  class Error < StandardError; end

  # Group by domain
  class PaymentError < Error; end
  class InsufficientFundsError < PaymentError; end
  class InvalidCardError < PaymentError; end
  class PaymentDeclinedError < PaymentError; end

  class AuthenticationError < Error; end
  class TokenExpiredError < AuthenticationError; end
  class InvalidCredentialsError < AuthenticationError; end
end

# Callers can rescue at any granularity:
rescue MyApp::InsufficientFundsError  # specific
rescue MyApp::PaymentError            # category
rescue MyApp::Error                   # all app errors
```

## The Weirich raise/fail Convention

Jim Weirich's convention distinguishes intent:

```ruby
def process_order(order)
  # Use `fail` for first-time exceptions (signal a problem)
  fail ArgumentError, "Order cannot be nil" if order.nil?
  fail MyApp::PaymentError, "Order already processed" if order.processed?

  begin
    payment_gateway.charge(order)
  rescue PaymentError => e
    logger.error("Payment failed: #{e.message}")
    raise  # Use `raise` only for re-raising caught exceptions
  end
end
```

## Result Object Pattern

Avoid exceptions for expected failure cases; return result objects instead:

```ruby
class Result
  attr_reader :value, :error

  def self.success(value) = new(value: value)
  def self.failure(error) = new(error: error)

  def initialize(value: nil, error: nil)
    @value = value
    @error = error
  end

  def success? = error.nil?
  def failure? = !success?

  def and_then
    return self if failure?
    yield(value)
  end
end

# Usage
def divide(a, b)
  return Result.failure("Division by zero") if b.zero?
  Result.success(a.to_f / b)
end

# Chainable
divide(10, 2)
  .and_then { |val| Result.success(val * 100) }
  .and_then { |val| Result.success("$#{val}") }
# => Result(value: "$500.0")
```

## Caller-Supplied Fallback Strategy

Let callers decide how to handle errors via blocks:

```ruby
def fetch_user(id, &fallback)
  user = User.find(id)
rescue ActiveRecord::RecordNotFound => e
  if fallback
    fallback.call(e)
  else
    raise
  end
end

# Callers choose their strategy:
user = fetch_user(999) { |_e| User.new(name: "Guest") }     # fallback
user = fetch_user(999) { |e| raise CustomError, e.message }  # re-raise as different type
user = fetch_user(999)                                        # propagate original error
```

## Exception Context Best Practices

### Include Actionable Information

```ruby
# Bad
raise "Invalid input"

# Good - include the failing value and expectation
raise ArgumentError,
  "Expected positive integer for age, got: #{age.inspect} (#{age.class})"

# Good - include context for debugging
raise MyApp::PaymentError,
  "Payment failed for order ##{order.id}: gateway returned #{response.code}"
```

### Wrap External Exceptions

```ruby
def fetch_data(url)
  HTTP.get(url)
rescue HTTP::Error, Timeout::Error, SocketError => e
  raise MyApp::ExternalServiceError,
    "Failed to fetch #{url}: #{e.class} - #{e.message}",
    cause: e  # Ruby 2.1+ preserves the cause chain
end
```

### Retry with Limits

```ruby
def with_retries(max: 3, on: StandardError)
  attempts = 0
  begin
    attempts += 1
    yield
  rescue *Array(on) => e
    raise if attempts >= max
    sleep(2 ** attempts * 0.1)  # exponential backoff
    retry
  end
end

with_retries(max: 3, on: [Net::ReadTimeout, Net::OpenTimeout]) do
  api_client.fetch_data
end
```
