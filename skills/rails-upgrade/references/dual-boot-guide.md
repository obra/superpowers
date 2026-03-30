# Dual Boot Guide

## What is Dual Boot?

Dual boot lets you test your app against both the current and next Rails version simultaneously. This is the FastRuby.io approach for large or risk-sensitive upgrades.

```bash
# Current Rails version
bundle exec rspec

# Next Rails version
BUNDLE_GEMFILE=Gemfile.next bundle exec rspec
```

## When to Use Dual Boot

Use dual boot when:
- Upgrade difficulty is HIGH or VERY HARD (see breaking-changes.md difficulty column)
- App has complex gem dependencies or >50k LOC
- Team needs to ship features during a long upgrade

Skip dual boot when:
- Upgrade is EASY or MEDIUM difficulty
- Breaking changes are few and localized
- Small codebase (<10k LOC)

## Setup

### Step 1: Add next_rails gem

```ruby
# Gemfile
gem "next_rails", group: :development
```

```bash
bundle install
```

### Step 2: Initialize dual boot

```bash
bundle exec next_rails --init
```

This creates `Gemfile.next` with Rails bumped to the next version.

### Step 3: Configure Gemfile

```ruby
# Gemfile
def next?
  File.basename(__FILE__) == "Gemfile.next"
end

if next?
  gem "rails", "~> 8.0"
else
  gem "rails", "~> 7.2"
end
```

### Step 4: Install both sets of gems

```bash
bundle install
BUNDLE_GEMFILE=Gemfile.next bundle install
```

## Using NextRails.next? for Code

When code needs to behave differently between versions, use `NextRails.next?`:

```ruby
# In models, controllers, initializers:
if NextRails.next?
  # Rails 8.0 behavior
  config.asset_pipeline = :propshaft
else
  # Rails 7.2 behavior
  config.asset_pipeline = :sprockets
end
```

**IMPORTANT:** Always use `NextRails.next?` — NEVER use `Rails.version` comparisons or `respond_to?` for version branching:

```ruby
# WRONG:
if Rails.version >= "8.0"

# WRONG:
if respond_to?(:new_method)

# CORRECT:
if NextRails.next?
```

## Running Tests

```bash
# Run against current Rails
bundle exec rspec

# Run against next Rails
BUNDLE_GEMFILE=Gemfile.next bundle exec rspec

# Shorthand with next_rails
bundle exec next rspec
```

## CI Configuration

```yaml
# .github/workflows/tests.yml
jobs:
  test:
    strategy:
      matrix:
        gemfile: [Gemfile, Gemfile.next]
    env:
      BUNDLE_GEMFILE: ${{ matrix.gemfile }}
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: bundle install
      - name: Run tests
        run: bundle exec rspec
```

## Post-Upgrade Cleanup

Once all tests pass on Gemfile.next:

1. Copy Gemfile.next contents to Gemfile (update the main Gemfile to use new Rails version)
2. Remove `if next?` blocks and `NextRails.next?` conditionals
3. Delete `Gemfile.next`
4. Run: `bundle install`
5. Run full test suite one final time

## Attribution

Based on FastRuby.io / OmbuLabs dual-boot methodology (MIT). Uses the `next_rails` gem: https://github.com/fastruby/next_rails
