# load_defaults Guide

## What is load_defaults?

`config.load_defaults(version)` in `config/application.rb` controls which new Rails framework defaults are active. When you upgrade Rails, the gem version changes but the defaults version doesn't — meaning you can safely test new defaults incrementally rather than all at once.

```ruby
# config/application.rb
module MyApp
  class Application < Rails::Application
    config.load_defaults 7.1  # This controls defaults, not the gem version
  end
end
```

## load_defaults Values and Their Changes

### load_defaults 5.2

- `config.active_record.cache_versioning` = true (cache keys include version stamp)
- `config.action_dispatch.use_authenticated_cookie_encryption` = true
- `config.active_support.use_authenticated_message_encryption` = true
- `config.active_support.use_sha1_digests` = true
- `config.action_controller.default_protect_from_forgery` = true

Risk: LOW — mostly security improvements

### load_defaults 6.0

- `config.autoloader` = :zeitwerk (major change — file naming must match constants)
- `config.action_view.default_enforce_utf8` = false
- `config.action_dispatch.use_cookies_with_metadata` = true
- `config.action_mailer.delivery_job` = ActionMailer::MailDeliveryJob

Risk: HIGH for autoloader (Zeitwerk naming), LOW for rest

### load_defaults 6.1

- `config.active_record.has_many_inversing` = true (bidirectional associations auto-set inverse)
- `config.active_job.retry_jitter` = 0.15 (adds jitter to retries)
- `config.action_dispatch.cookies_same_site_protection` = :lax
- `config.active_record.legacy_connection_handling` = false

Risk: MEDIUM — has_many_inversing can change association behavior

### load_defaults 7.0

- `config.action_controller.raise_on_open_redirects` = true (security — prevents open redirects)
- `config.action_view.button_to_generates_button_tag` = true
- `config.action_mailer.smtp_timeout` = 5
- `config.active_support.executor_around_test_case` = true
- `config.action_controller.wrap_parameters_by_default` = false (API breaking for some apps)

Risk: MEDIUM — raise_on_open_redirects may break redirect_to calls with user-provided URLs

### load_defaults 7.1

- `config.active_record.query_log_tags_format` = :sqlcommenter
- `config.active_record.cache_query_log_tags` = true
- `config.active_support.message_serializer` = :json_allow_marshal
- `config.active_support.cache_format_version` = 7.1
- `config.action_dispatch.default_headers` updated (security headers)
- `config.action_controller.allow_deprecated_parameters_hash_equality` = false

Risk: MEDIUM — cache format change requires coordinated deploy; message serializer change affects cookies/sessions

### load_defaults 7.2

- `config.active_record.raise_on_assign_to_attr_readonly` = true
- `config.active_record.belongs_to_required_validates_foreign_key` = false
- `config.active_model.i18n_customize_full_message` = true
- `config.active_support.to_time_preserves_timezone` = :zone

Risk: LOW-MEDIUM

### load_defaults 8.0

- `config.action_dispatch.show_exceptions` = :rescuable (was :all)
- `config.active_support.cache_format_version` = 8.0
- Solid Cache/Queue/Cable enabled by default in new apps

Risk: MEDIUM — cache format change, show_exceptions change

### load_defaults 8.1

- Various security defaults tightened
- `config.active_record.postgresql_adapter_decode_dates` = true

Risk: LOW for most apps

## Risk Tiers

### Tier 1 — Enable safely, minimal risk

- `action_dispatch.use_authenticated_cookie_encryption` (5.2)
- `active_support.use_sha1_digests` (5.2)
- `action_mailer.smtp_timeout` (7.0)
- `active_record.cache_query_log_tags` (7.1)
- `active_model.i18n_customize_full_message` (7.2)

### Tier 2 — Enable with testing, may affect behavior

- `active_record.has_many_inversing` (6.1) — test association behavior
- `action_controller.raise_on_open_redirects` (7.0) — grep for redirect_to with dynamic URLs
- `active_support.cache_format_version` (7.1) — coordinate across all servers
- `active_record.belongs_to_required_validates_foreign_key` (7.2)

### Tier 3 — Enable carefully, high impact

- `autoloader: :zeitwerk` (6.0) — requires Zeitwerk file naming compliance
- `active_support.message_serializer: :json_allow_marshal` (7.1) — affects cookies/sessions
- `action_controller.wrap_parameters_by_default: false` (7.0) — may break API parameter handling

## How to Transition load_defaults

### The safe approach

1. After upgrading to Rails X.Y, update Gemfile: `gem 'rails', '~> X.Y'`
2. Do NOT change `config.load_defaults` yet
3. Generate the new defaults file: `bin/rails app:update`
   This creates `config/initializers/new_framework_defaults_X_Y.rb` with all new defaults commented out
4. Uncomment and test Tier 1 settings first (run full test suite after each)
5. Uncomment and test Tier 2 settings with targeted testing
6. Uncomment and test Tier 3 settings with comprehensive testing
7. Once all settings are enabled and tested, change `config.load_defaults X.Y` and delete the initializer file
8. Run full test suite to verify

**Important:** If `new_framework_defaults_*.rb` exists with uncommented settings from a PREVIOUS upgrade, resolve that before starting the next upgrade.

## Attribution

Self-contained guide written from official Rails documentation and CHANGELOGs.
