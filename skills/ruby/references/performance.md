# Ruby Performance Optimization

## YJIT (Ruby 3.1+)

YJIT is Ruby's built-in JIT compiler. Enable it for significant speedups on real-world code:

```bash
# Enable at runtime
ruby --yjit app.rb

# Or via environment variable
RUBY_YJIT_ENABLE=1 ruby app.rb

# Rails: add to config
# config/application.rb
RubyVM::YJIT.enable if defined?(RubyVM::YJIT)
```

```ruby
# Check YJIT status and stats
if defined?(RubyVM::YJIT)
  puts RubyVM::YJIT.enabled?
  puts RubyVM::YJIT.runtime_stats
end
```

YJIT works best with:
- Long-running processes (servers, not scripts)
- Code with consistent types at call sites
- Ruby 3.2+ (significant improvements over 3.1)

## GC Tuning

```ruby
# Key GC environment variables for tuning:
# RUBY_GC_HEAP_INIT_SLOTS=600000     - initial heap size
# RUBY_GC_MALLOC_LIMIT=64000000      - trigger GC after this many malloc bytes
# RUBY_GC_HEAP_GROWTH_FACTOR=1.25    - heap growth multiplier

# Monitor GC in production
GC.stat
# Key metrics: :count, :heap_allocated_pages, :total_allocated_objects,
#              :total_freed_objects, :major_gc_count, :minor_gc_count

# Measure allocations in a block
before = GC.stat(:total_allocated_objects)
# ... your code ...
after = GC.stat(:total_allocated_objects)
puts "Allocated: #{after - before} objects"
```

## Benchmarking

### Standard Library

```ruby
require 'benchmark'

Benchmark.bm(15) do |x|
  x.report("concat (+):") { n.times { str = "a" + "b" + "c" } }
  x.report("concat (<<):") { n.times { str = "a"; str << "b"; str << "c" } }
  x.report("interpolate:") { n.times { str = "#{"a"}#{"b"}#{"c"}" } }
end

# For quick comparisons
require 'benchmark/ips'  # gem install benchmark-ips

Benchmark.ips do |x|
  x.report("map + compact") { array.map { |i| transform(i) }.compact }
  x.report("filter_map")    { array.filter_map { |i| transform(i) } }
  x.compare!
end
```

### Memory Profiling

```ruby
require 'memory_profiler'

report = MemoryProfiler.report do
  1000.times { "string" + "concatenation" }
end

report.pretty_print
# Shows: allocated/retained memory, object counts, allocation sites
```

### CPU Profiling

```ruby
require 'ruby-prof'

result = RubyProf.profile do
  expensive_operation
end

# Output options
RubyProf::FlatPrinter.new(result).print(STDOUT)
RubyProf::GraphHtmlPrinter.new(result).print(File.open("profile.html", "w"))
RubyProf::FlameGraphPrinter.new(result).print(File.open("flame.txt", "w"))
```

## Common Performance Patterns

### String Building

```ruby
# Bad: O(n^2) - creates new string each iteration
result = ""
items.each { |item| result += item.to_s }

# Good: O(n) - mutates in place
result = String.new
items.each { |item| result << item.to_s }

# Best: let Ruby optimize
result = items.map(&:to_s).join
```

### Frozen String Literals

```ruby
# Add to top of file to freeze all string literals
# frozen_string_literal: true

# Benefits:
# - Prevents accidental mutation
# - Reduces object allocations (identical frozen strings share memory)
# - Required for Ractor compatibility

# When you need a mutable string in a frozen_string_literal file:
mutable = String.new("hello")
mutable = +"hello"  # unary plus unfreezes
```

### Efficient Enumeration

```ruby
# each_with_object avoids intermediate arrays vs. map + reduce
totals = items.each_with_object(Hash.new(0)) do |item, hash|
  hash[item.category] += item.amount
end

# Lazy enumerables for large/infinite sequences
(1..Float::INFINITY).lazy
  .select { |n| n.odd? }
  .map { |n| n ** 2 }
  .first(10)

# filter_map combines select + map in one pass (Ruby 2.7+)
valid_emails = users.filter_map { |u| u.email if u.active? }
```

### Memoization Patterns

```ruby
# Simple memoization (truthy values only)
def users
  @users ||= User.all.to_a
end

# Safe memoization (handles nil/false)
def feature_enabled?
  return @feature_enabled if defined?(@feature_enabled)
  @feature_enabled = expensive_check
end

# Memoization with arguments
def user(id)
  @users_cache ||= {}
  @users_cache[id] ||= User.find(id)
end
```

### Avoid N+1 in Pure Ruby

```ruby
# Bad: query/compute per item
users.each { |u| puts department_name(u.dept_id) }

# Good: batch load, then look up
depts = Department.where(id: users.map(&:dept_id)).index_by(&:id)
users.each { |u| puts depts[u.dept_id]&.name }
```
