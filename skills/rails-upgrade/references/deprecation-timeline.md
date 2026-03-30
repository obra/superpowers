# Deprecation Timeline

Track when deprecations were introduced, when they become warnings, and when they are removed. Fix deprecations as soon as they appear — don't wait for removal. Each version's deprecation warnings are telling you exactly what will break in the next version.

## Deprecation Lifecycle

```
Version N:     Feature works normally
               ↓
Version N+1:   DEPRECATED — shows warnings in logs/tests
               ↓ (typically 1-2 minor versions)
Version N+2:   REMOVED — raises errors
```

The gap between "deprecated" and "removed" is your window. Use it.

---

## Timeline by Version

### Removed in Rails 6.0 (deprecated earlier in 5.x)

| Feature | Deprecated In | Removed In | Replacement |
|---------|--------------|------------|-------------|
| `update_attributes` | 5.x | 6.0 | `update` |
| `before_filter` / `after_filter` / `around_filter` | 5.1 | 6.0 | `before_action` / `after_action` / `around_action` |
| `render nothing: true` | 5.x | 6.0 | `head :ok` |

---

### Removed in Rails 7.1 (deprecated in 7.0)

| Feature | Deprecated In | Removed In | Replacement |
|---------|--------------|------------|-------------|
| `to_s(:format)` on Date/Time/Numeric | 7.0 | 7.1 | `to_fs(:format)` |

---

### Removed in Rails 7.2 (deprecated in 7.0–7.1)

| Feature | Deprecated In | Removed In | Replacement |
|---------|--------------|------------|-------------|
| `Rails.application.secrets` | 7.0 | 7.2 | `Rails.application.credentials` |
| `config.cache_classes` | 7.1 | 7.2 | `config.enable_reloading` (logic is inverted!) |
| `config.preview_path` (singular) | 7.1 | 7.2 | `config.preview_paths` (array) |
| `config.action_dispatch.show_exceptions` boolean | 7.1 | 7.2 | Symbols: `:all`, `:rescuable`, or `:none` |
| `params == hash` comparison | 7.1 | 7.2 | `params.to_h == hash` |
| `ActiveRecord::Base.connection` (direct call) | 7.1 | 7.2 | `with_connection { |conn| ... }` block |

Note on `cache_classes`: the meaning is **inverted**. `cache_classes: false` (don't cache = do reload) becomes `enable_reloading: true`.

---

### Removed in Rails 8.0 (deprecated in 7.2)

| Feature | Deprecated In | Removed In | Replacement |
|---------|--------------|------------|-------------|
| `query_constraints` | 7.2 | 8.0 | `foreign_key` |
| `serialize` old syntax | 7.2 | 8.0 | `serialize :attr, type: X, coder: Y` |
| `fixture_path` (singular) | 7.2 | 8.0 | `fixture_paths` (plural array) |
| `to_default_s` | 7.2 | 8.0 | `to_s` |
| Sprockets (as default asset pipeline) | 7.2 | 8.0 | Propshaft (or keep Sprockets explicitly) |
| `ActiveRecord::ConnectionPool#connection` | 7.2 | 8.0 | `with_connection { |conn| ... }` |
| `ActiveSupport::ProxyObject` | 7.2 | 8.0 | `BasicObject` |

---

### Removed in Rails 8.1 (deprecated in 8.0)

| Feature | Deprecated In | Removed In | Replacement |
|---------|--------------|------------|-------------|
| `pool:` key in `database.yml` | 8.0 | 8.1 | `max_connections:` |
| Semicolon (`;`) as query string separator | 8.0 | 8.1 | Ampersand (`&`) only |
| Built-in Sidekiq ActiveJob adapter | 8.0 | 8.1 | sidekiq gem 7.3.3+ (ships its own adapter) |
| Built-in SuckerPunch ActiveJob adapter | 8.0 | 8.1 | sucker_punch gem 3.2+ (ships its own adapter) |
| Azure Storage service in Active Storage | 8.0 | 8.1 | S3, GCS, or Disk |

---

### Still Active in 8.1 (not yet removed)

| Feature | Deprecated In | Expected Removal | Replacement |
|---------|--------------|------------------|-------------|
| Old form helper names (`text_area`, `check_box`) | 8.0 | 8.2+ | `textarea`, `checkbox` (new aliases) |
| Various internal APIs | 8.0–8.1 | 9.0+ | See individual release notes |

---

## Finding Deprecation Warnings

### During test runs

```bash
# Run tests and show deprecation warnings
bundle exec rspec 2>&1 | grep "DEPRECATION WARNING"
bundle exec rails test 2>&1 | grep "DEPRECATION WARNING"

# Save to file for review
bundle exec rspec 2>&1 | grep "DEPRECATION WARNING" > deprecations.txt

# Count and rank unique deprecations
sort deprecations.txt | uniq -c | sort -rn
```

### Configure test environment

```ruby
# config/environments/test.rb

# Fail tests immediately on any deprecation (strict — recommended during upgrades)
config.active_support.deprecation = :raise

# Show warnings without failing (useful for an initial audit pass)
config.active_support.deprecation = :stderr
```

### Disallow specific deprecations (Rails 6.1+)

```ruby
# config/environments/test.rb
config.active_support.disallowed_deprecation_warnings = [
  "cache_classes is deprecated"
]
config.active_support.disallowed_deprecation = :raise
```

### Track deprecations in production

```ruby
# config/initializers/deprecation_tracking.rb
ActiveSupport::Notifications.subscribe("deprecation.rails") do |name, start, finish, id, payload|
  Rails.logger.warn "DEPRECATION: #{payload[:message]}"
  # Optionally forward to error tracking:
  # Honeybadger.notify(payload[:message])
  # Sentry.capture_message(payload[:message])
end
```

---

## Best Practices

1. **Fix deprecations immediately** when they appear — don't batch them up for later
2. **Run after every gem update**: `bundle exec rails test 2>&1 | grep "DEPRECATION"`
3. **Treat deprecation warnings as bugs** — they are future errors with a countdown timer
4. **Never skip a version** — each version's warnings are roadmaps to the next version's failures
5. **Document each fix** with a comment showing the old and new approach, so the team understands why the change was made

---

## Attribution

Based on:
- Mario Alberto Chávez Cárdenas (MIT) — deprecations-timeline.md from rails-upgrade-skill
- OmbuLabs.ai / FastRuby.io (MIT) — deprecation-warnings.md from claude-code_rails-upgrade-skill
