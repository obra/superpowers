# Modern Ruby Features (3.x+)

## Pattern Matching (Ruby 2.7+, stabilized 3.0+)

### Case/In Expressions

```ruby
# Value patterns
case status_code
in 200 then "OK"
in 404 then "Not Found"
in (500..) then "Server Error"
end

# Array patterns with rest/find
case [1, 2, 3, 4, 5]
in [Integer => first, *rest, Integer => last]
  "First: #{first}, Last: #{last}, Middle: #{rest}"
end

# Hash patterns with variable punning
case response
in { status: 200, body: { users: [{ name: }, *] } }
  "First user: #{name}"
in { status: (400..), error: message }
  "Error: #{message}"
end

# Find pattern (Ruby 3.0+)
case [1, 2, 3, "hello", 4, 5]
in [*, String => str, *]
  "Found string: #{str}"
end
```

### Guard Clauses in Patterns

```ruby
case user
in { role: "admin", active: true } => admin
  grant_admin_access(admin)
in { role: "admin", active: false }
  "Inactive admin"
in { age: (..17) }
  "Minor user"
in { age: age } if age >= 18
  "Adult user aged #{age}"
end
```

### Pin Operator

```ruby
expected_status = 200

case response
in { status: ^expected_status, body: }
  process(body)
in { status: }
  "Unexpected status: #{status}"
end
```

### Pattern Matching in Conditionals

```ruby
# Single pattern check (Ruby 3.0+)
if user in { role: "admin" }
  # admin-specific logic
end

# Rightward assignment with deconstruct
{ name: "John", age: 30 } => { name:, age: }
puts "#{name} is #{age}"

# In method arguments via deconstruct_keys
class Point
  attr_reader :x, :y

  def initialize(x:, y:)
    @x = x
    @y = y
  end

  def deconstruct_keys(keys)
    { x: @x, y: @y }.slice(*keys)
  end
end

case Point.new(x: 1, y: 2)
in { x: (0..), y: (0..) }
  "First quadrant"
end
```

## Ractors (Ruby 3.0+) - True Parallelism

Ractors provide thread-safe parallel execution by enforcing isolation.

### Basic Usage

```ruby
# Create and communicate with ractors
r = Ractor.new do
  value = Ractor.receive
  value * 2
end

r.send(21)
result = r.take  # => 42
```

### Parallel Processing

```ruby
# Fan-out/fan-in pattern
workers = 4.times.map do
  Ractor.new do
    loop do
      item = Ractor.receive
      Ractor.yield(expensive_compute(item))
    end
  end
end

# Distribute work
items.each_with_index do |item, i|
  workers[i % workers.size].send(item)
end

# Collect results
results = items.size.times.map { Ractor.select(*workers)[1] }
```

### Shareable Objects

```ruby
# Only shareable objects can cross ractor boundaries:
# - Immutable objects (frozen strings, integers, symbols)
# - Objects marked with Ractor.make_shareable

config = Ractor.make_shareable({ timeout: 30, retries: 3 }.freeze)

Ractor.new(config) do |cfg|
  # Can safely use cfg here
  cfg[:timeout]  # => 30
end
```

### Limitations

- Cannot share mutable objects between ractors
- Cannot access global/class variables from other ractors
- Many gems are not ractor-safe yet
- Best for CPU-bound parallel work, not I/O

## Fiber Scheduler (Ruby 3.0+)

### Non-blocking I/O with async gem

```ruby
require 'async'
require 'async/http/internet'

# Concurrent HTTP requests
Async do
  internet = Async::HTTP::Internet.new

  urls = %w[https://example.com https://example.org]

  tasks = urls.map do |url|
    Async do
      response = internet.get(url)
      [url, response.status]
    end
  end

  results = tasks.map(&:wait)
ensure
  internet&.close
end
```

### Custom Scheduler Integration

```ruby
# Ruby 3.0+ allows setting a fiber scheduler per thread
# The scheduler hooks into blocking operations (sleep, IO.read, etc.)
# and makes them non-blocking automatically

Fiber.set_scheduler(MyScheduler.new)

# Now sleep, IO operations, etc. become non-blocking
# within fibers scheduled by this scheduler
```

## RBS Type Signatures (Ruby 3.0+)

### Writing RBS Files

```rbs
# sig/user.rbs
class User
  attr_reader name: String
  attr_reader email: String
  attr_reader age: Integer?

  def initialize: (name: String, email: String, ?age: Integer?) -> void
  def adult?: () -> bool
  def full_name: () -> String

  # Union types
  def find: (Integer | String id) -> User?

  # Block types
  def each_post: () { (Post) -> void } -> void
               | () -> Enumerator[Post, void]

  # Interface types
  def process: (_Callable handler) -> Result
end

# Interfaces
interface _Callable
  def call: (*untyped) -> untyped
end

# Generics
class Result[T]
  attr_reader value: T?
  attr_reader error: String?

  def success?: () -> bool
end
```

### Tooling

```bash
# Generate RBS from Ruby code
typeprof app/models/user.rb > sig/user.rbs

# Type check with Steep
bundle exec steep check

# Validate RBS syntax
rbs validate

# Generate prototype from source
rbs prototype rb app/models/user.rb
```

## Other Notable Features

### Endless Methods (Ruby 3.0+)

```ruby
def square(x) = x * x
def full_name = "#{first_name} #{last_name}"
def admin? = role == "admin"
# Best for simple, single-expression methods
```

### Numbered Block Parameters (Ruby 2.7+)

```ruby
[1, 2, 3].map { _1 * 2 }
hash.each { puts "#{_1}: #{_2}" }
# Use only for simple blocks; named params are clearer for complex logic
```

### Hash#except (Ruby 3.0+)

```ruby
params = { name: "John", password: "secret", admin: true }
safe_params = params.except(:password, :admin)
# => { name: "John" }
```

### Enumerable#tally (Ruby 2.7+) and #filter_map (Ruby 2.7+)

```ruby
%w[apple banana apple cherry banana apple].tally
# => {"apple"=>3, "banana"=>2, "cherry"=>1}

[1, 2, 3, 4, 5].filter_map { |n| n * 2 if n.odd? }
# => [2, 6, 10]
```

### Data class (Ruby 3.2+)

```ruby
# Immutable value objects
Point = Data.define(:x, :y)
p = Point.new(x: 1, y: 2)
p.x  # => 1
p.with(x: 3)  # => Point(x: 3, y: 2) - returns new instance
```
