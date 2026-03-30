# Breaking Changes by Rails Version

Reference document for the Rails upgrade skill. Covers all breaking changes from Rails 5.2 through 8.1.
Organized by version pair with HIGH / MEDIUM / LOW priority tables.

---

## Summary Statistics

| Version Pair | Total Changes | HIGH | MEDIUM | LOW | Difficulty | Time Estimate |
|---|---|---|---|---|---|---|
| 5.2 → 6.0 | ~15 | 5 | 6 | 4 | Hard | 1-2 weeks |
| 6.0 → 6.1 | ~10 | 3 | 4 | 3 | Medium | 3-5 days |
| 6.1 → 7.0 | ~12 | 5 | 5 | 2 | Hard | 1-2 weeks |
| 7.0 → 7.1 | 12 | 5 | 4 | 3 | Medium | 2-4 hours |
| 7.1 → 7.2 | 38 | 5 | 12 | 21 | Hard | 4-8 hours |
| 7.2 → 8.0 | 13 | 5 | 4 | 4 | Very Hard | 6-12 hours |
| 8.0 → 8.1 | 8 | 3 | 3 | 2 | Easy | 2-4 hours |

---

## Rails 5.2 → 6.0

**Difficulty: Hard**
**Time estimate: 1-2 weeks**

The Zeitwerk autoloader is the dominant change. Every file in the app must follow strict naming conventions. Also significant: removal of long-deprecated methods (`update_attributes`, `before_filter`, `render nothing: true`) and a new default CSRF strategy.

### HIGH Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 1 | **Zeitwerk autoloader replaces classic autoloader** | Files with names that do not match their constant name cause `NameError: uninitialized constant`. The classic autoloader is deprecated and will warn loudly. | `config/application.rb`, `config/initializers/`, every file in `app/` and `lib/` | Set `config.load_defaults 6.0`. Remove `config.autoloader = :classic`. Rename any file where the filename does not exactly correspond to the CamelCase constant it defines (e.g., `html_parser.rb` must define `HtmlParser`). Use `bin/rails zeitwerk:check` to find violations. |
| 2 | **require_dependency removed** | `require_dependency` calls raise `NoMethodError` or are silently ignored under Zeitwerk, breaking load order assumptions. | `app/**/*.rb`, `lib/**/*.rb` | Remove every `require_dependency` call. Zeitwerk handles eager loading automatically. For code that genuinely needs a class available before autoloading, use `require` with an explicit path, but this is rarely needed. |
| 3 | **update_attributes / update_attributes! removed** | `NoMethodError` on every model save path that used these methods. This was deprecated since Rails 5.x; Rails 6.0 removes them entirely. | `app/models/**/*.rb`, `app/controllers/**/*.rb`, `lib/**/*.rb`, `spec/**/*.rb`, `test/**/*.rb` | Replace all `update_attributes(params)` with `update(params)`. Replace all `update_attributes!(params)` with `update!(params)`. Run a global search for `update_attributes` to catch every occurrence. |
| 4 | **before_filter / after_filter / skip_before_filter removed** | `NoMethodError` in any controller that uses these methods. Deprecated since Rails 5.1. | `app/controllers/**/*.rb` | Replace `before_filter` with `before_action`. Replace `after_filter` with `after_action`. Replace `around_filter` with `around_action`. Replace `skip_before_filter` with `skip_before_action`. Replace `skip_after_filter` with `skip_after_action`. |
| 5 | **protect_from_forgery default changed to :exception** | The CSRF protection strategy in `ApplicationController` now defaults to raising an `ActionController::InvalidAuthenticityToken` exception instead of resetting the session. This can expose unexpected exception-handling gaps. | `app/controllers/application_controller.rb` | If you previously relied on session-reset behavior, add `protect_from_forgery with: :null_session` explicitly. If you already had `with: :exception`, the explicit declaration is now redundant but harmless. Review error handling for `ActionController::InvalidAuthenticityToken`. |

### MEDIUM Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 6 | **Ruby 2.5+ required** | Rails 6.0 will not boot on Ruby < 2.5. | `Gemfile`, `.ruby-version`, CI configuration | Upgrade Ruby to at least 2.5. Ruby 2.7 is recommended for forward compatibility toward Rails 7.x, which requires Ruby 2.7. |
| 7 | **ActiveStorage::Blob.create_after_upload! removed** | `NoMethodError` wherever blobs are created programmatically. | All code that calls `ActiveStorage::Blob.create_after_upload!` | Replace with `ActiveStorage::Blob.create_and_upload!`. The new method name is more descriptive of the two-step operation. |
| 8 | **render nothing: true removed** | `ArgumentError: :nothing option is no longer supported` | `app/controllers/**/*.rb` | Replace `render nothing: true` with `head :ok`. Replace `render nothing: true, status: :created` with `head :created`. Use `head <status>` for any status code. |
| 9 | **belongs_to required by default (Rails 5.0 opt-in now default)** | Validation errors on models where the foreign key is intentionally nil. Note: this was technically introduced in Rails 5.0 as opt-in; in 6.0 it is fully the default. | `app/models/**/*.rb` | Add `optional: true` to every `belongs_to` association where a nil foreign key is intentional (e.g., polymorphic associations that can be unset). |
| 10 | **Webpacker replaces Sprockets as default JS pipeline** | Sprockets is still included for CSS and images, but new apps default to Webpacker for JavaScript. Existing apps may see JS bundling break if they switch. | `Gemfile`, `config/webpacker.yml`, `app/javascript/` | If staying with Sprockets for JS: add `gem 'webpacker'` is not required; ensure `gem 'sprockets', '~> 4.0'` is present. If migrating to Webpacker: run `rails webpacker:install` and move JS to `app/javascript/`. |
| 11 | **ActionCable configuration API changes** | Cable connections may fail with outdated adapter configuration. | `config/cable.yml`, `config/environments/*.rb` | Review `config/cable.yml`. Update adapter names if using Redis (verify gem name `redis` vs `hiredis`). Review channel authentication if using Devise or Warden. |

### LOW Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 12 | **Action Mailbox introduced** | No breaking change, but conflicts possible with `mail_room` gem or custom inbound mail routing. | `app/mailboxes/`, `Gemfile` | Check for conflicts with existing mail-handling gems. Run `rails action_mailbox:install` only if you intend to adopt it. |
| 13 | **Action Text introduced** | No breaking change unless you already have a `rich_text` database column or a gem conflict with `trix`. | `app/models/**/*.rb`, `Gemfile` | Run `rails action_text:install` only if you want rich text editing. Check for column name conflicts. |
| 14 | **ActionDispatch::Http::UploadedFile#to_io removed** | Code that called `to_io` on uploaded files will fail. | `app/**/*.rb` | Use `uploaded_file.open` or `uploaded_file.read` instead. |
| 15 | **Multiple database support (basic) added** | New configuration options available; no breaking change for single-database apps. | `config/database.yml` | No action required unless adopting multi-database. New `config.active_record.primary_abstract_class` option available. |

---

## Rails 6.0 → 6.1

**Difficulty: Medium**
**Time estimate: 3-5 days**

The most significant change is the transformation of `model.errors[:attribute]` from returning strings to returning `ActiveModel::Error` objects. Any code that treats errors as plain strings will silently produce wrong output or raise errors. The `replace_on_assign_to_many` change affects file upload behavior.

### HIGH Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 1 | **ActiveRecord errors[:attribute] returns Error objects, not strings** | `model.errors[:name]` now returns an array of `ActiveModel::Error` objects. Code that calls string methods directly (e.g., `errors[:name].first.upcase`, or concatenating into a string) will produce wrong output. `errors.full_messages` still works. | `app/views/**/*.erb`, `app/views/**/*.haml`, `app/helpers/**/*.rb`, `app/models/**/*.rb`, `spec/**/*.rb`, `test/**/*.rb` | Audit every location that reads from `model.errors[:attribute]`. To get the string message, call `.message` on the Error object, or use `errors.full_messages_for(:attribute)`. In RSpec matchers like `include("can't be blank")`, switch to `include(a_string_matching(...))` or use `errors.full_messages`. |
| 2 | **replace_on_assign_to_many behavior change for has_many_attached** | Assigning a new set of files to a `has_many_attached` association now replaces existing files by default. Previously it appended. This can cause silent data loss if your UI expects append behavior. | `app/models/**/*.rb` anywhere `has_many_attached` is used, all file upload controllers and forms | Audit every `has_many_attached` assignment. If you need append behavior, set `config.active_storage.replace_on_assign_to_many = false` in `config/application.rb` (deprecated but available as escape hatch). Long term, use explicit `attach` calls for append behavior. |
| 3 | **Strict loading mode introduced** | When `strict_loading` is enabled on a model or query, `ActiveRecord::StrictLoadingViolationError` is raised on any lazy association load. Only affects code that explicitly opts in, but it changes how N+1 queries surface. | `app/models/**/*.rb`, `config/application.rb` | No action required unless you enable `config.active_record.strict_loading_by_default`. If you do enable it, fix all N+1 queries by adding explicit `includes`/`preload`/`eager_load` calls. |

### MEDIUM Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 4 | **destroy_all on loaded relation changes** | Calling `destroy_all` on an already-loaded ActiveRecord relation now deletes records but does not update the in-memory collection the same way as before. Code that relies on the collection being empty after `destroy_all` may behave unexpectedly. | `app/models/**/*.rb`, `app/controllers/**/*.rb` | After calling `destroy_all`, call `reload` on the association if you need to read it again. Do not assume the in-memory relation reflects the database state post-deletion. |
| 5 | **Horizontal sharding support added** | New `connected_to(role:, shard:)` API may conflict with custom sharding implementations. | `app/models/**/*.rb`, `config/database.yml` | If using a custom sharding solution, verify it does not conflict with the new built-in API. Review `config/database.yml` if you have multiple databases configured. |
| 6 | **config.active_record.legacy_connection_handling introduced** | New option that changes how connections are returned to the pool in multi-database setups. Defaults to `true` for existing apps upgrading; new apps default to `false`. | `config/application.rb` | For existing apps: the option will be `true` by default (old behavior preserved). Plan to set it to `false` before Rails 7.0, which removes the legacy mode entirely. |
| 7 | **Ruby 2.5 still minimum; 2.7 recommended** | Ruby 2.5 and 2.6 will reach end of life soon. Rails 7.0 requires Ruby 2.7. | `Gemfile`, `.ruby-version` | Upgrade to Ruby 2.7 now to avoid a forced upgrade when moving to 7.0. |

### LOW Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 8 | **ActionMailbox improvements** | New routing and processing options; no breaking changes to existing configurations. | `app/mailboxes/` | Review release notes if using ActionMailbox. |
| 9 | **New connected_to API additions** | `connected_to` now accepts `shard:` keyword. Existing calls with only `role:` continue to work. | `app/**/*.rb` | No action required unless you need sharding. |
| 10 | **config.active_record.legacy_connection_handling = false path** | If you proactively set this to `false` in 6.1, test your multi-database connection handling carefully. | `config/application.rb` | Set to `false` in 6.1 to prepare for 7.0, but verify with full test suite. |

---

## Rails 6.1 → 7.0

**Difficulty: Hard**
**Time estimate: 1-2 weeks**

The move to Hotwire (Turbo + Stimulus) replacing Turbolinks and Webpacker is the dominant change. Most apps will need significant JavaScript restructuring. Also: `config.active_record.legacy_connection_handling` is removed, Ruby 2.7+ required.

### HIGH Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 1 | **Webpacker removed from Rails core** | Webpacker is no longer a default dependency. Apps built on Webpacker must migrate to jsbundling-rails, importmap-rails, or another bundler. | `Gemfile`, `app/javascript/`, `config/webpacker.yml`, `package.json`, layout files | Choose a replacement: `importmap-rails` (no build step, recommended for simple apps), `jsbundling-rails` with esbuild/rollup/webpack (for complex JS). Run the appropriate install generator. Remove `webpacker` gem. |
| 2 | **Turbolinks replaced by Turbo (Hotwire)** | `Turbolinks.visit()`, `data-turbolinks-*` attributes, and Turbolinks JavaScript events are gone. Turbo has a different API and event names. | `app/javascript/**/*.js`, `app/views/**/*.erb`, `app/views/**/*.html.*` | Replace `data-turbolinks-action` with `data-turbo-action`. Replace `turbolinks:load` event with `turbo:load`. Replace `Turbolinks.visit()` with `Turbo.visit()`. Remove `gem 'turbolinks'` and add `gem 'turbo-rails'`. Run `rails turbo:install`. |
| 3 | **config.active_record.legacy_connection_handling removed** | Apps that had `config.active_record.legacy_connection_handling = true` will error on boot. | `config/application.rb`, `config/environments/*.rb` | Remove the setting. If it was `false`, just remove it. If it was `true`, you need to update your multi-database connection handling code to use the new non-legacy approach before upgrading. |
| 4 | **Ruby 2.7+ required** | Rails 7.0 will not boot on Ruby < 2.7. | `Gemfile`, `.ruby-version`, CI configuration | Upgrade to Ruby 2.7 minimum. Ruby 3.0 or 3.1 recommended for forward compatibility. |
| 5 | **ActiveSupport::Dependencies::Loadable removed** | Internal autoloading hooks that some gems relied on are gone. Third-party gems that monkey-patched the old autoloader will break. | `Gemfile` | Update all gems to versions compatible with Zeitwerk. Run `bundle update` and check for Zeitwerk-related errors. Use `bin/rails zeitwerk:check`. |

### MEDIUM Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 6 | **Encryption API added (Active Record Encryption)** | No breaking change, but new `encrypts` declaration available. If you have a custom encryption solution, verify it does not conflict. | `app/models/**/*.rb` | No action required unless adopting the new API. Check for conflicts with `attr_encrypted` or similar gems. |
| 7 | **query_log_tags added** | New SQL comment annotation feature. No breaking change, but may add unexpected SQL comments in logs. | `config/application.rb` | Opt in via `config.active_record.query_log_tags_enabled = true`. No action required if not enabling. |
| 8 | **belongs_to optional default (enforcement)** | Rails 7.0 more strictly enforces `belongs_to required: true` by default. Models that previously passed validation with nil foreign keys may now fail. | `app/models/**/*.rb`, `test/**/*.rb`, `spec/**/*.rb` | Audit all `belongs_to` associations. Add `optional: true` where nil is intentional. Fix failing tests. |
| 9 | **Sprockets 4.x required** | If using Sprockets, version 3.x is no longer supported. | `Gemfile` | Upgrade to `gem 'sprockets', '~> 4.0'`. Update `config/initializers/assets.rb` if present. Some `//= require_tree .` directives need to be explicit in Sprockets 4. |
| 10 | **ActionDispatch::Response#content_type changes** | The `content_type` method now returns only the MIME type without charset. Code testing `response.content_type == "text/html; charset=utf-8"` will fail. | `test/**/*.rb`, `spec/**/*.rb` | Update assertions to use `assert_equal "text/html", response.media_type` and check charset separately via `response.charset`. |

### LOW Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 11 | **Stimulus 3.x (Hotwire)** | If using Stimulus, update to Stimulus 3 as part of Hotwire migration. | `app/javascript/controllers/` | Run `rails stimulus:install` after setting up Hotwire. Stimulus 3 is backwards compatible with Stimulus 2 for basic usage. |
| 12 | **at_css / at_xpath removed from ActionView** | Rarely used helper methods removed. | `app/views/**/*.erb` | No action required unless these helpers are used. |

---

## Rails 7.0 → 7.1

**Difficulty: Medium**
**Time estimate: 2-4 hours**

Several high-priority config changes with subtle gotchas. The `cache_classes` → `enable_reloading` rename is especially dangerous because the boolean meaning is inverted. Every environment file must be updated.

### HIGH Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 1 | **cache_classes renamed to enable_reloading (boolean INVERTED)** | Setting `config.cache_classes = false` (old development default: reload on each request) must become `config.enable_reloading = true`. Setting `config.cache_classes = true` (old production default: do not reload) must become `config.enable_reloading = false`. Using the old key raises a deprecation warning in 7.1 and an error in 7.2. | `config/environments/development.rb`, `config/environments/production.rb`, `config/environments/test.rb`, any custom environments | In development: change `config.cache_classes = false` to `config.enable_reloading = true`. In production and test: change `config.cache_classes = true` to `config.enable_reloading = false`. Remove the old key. Do not simply rename — the boolean is inverted. |
| 2 | **force_ssl enabled by default in production** | New production apps default to `config.force_ssl = true`. Upgrading apps that had it commented out may now have it silently enabled via `load_defaults 7.1`, causing redirect loops if SSL is not configured. | `config/environments/production.rb` | Explicitly set `config.force_ssl = false` if your app does not terminate SSL at the Rails level (e.g., SSL is handled by a load balancer and you don't want double-redirect). If you want SSL enforcement, leave it enabled or set it explicitly to `true`. |
| 3 | **config.action_mailer.preview_path → preview_paths (array)** | The singular `preview_path` option is deprecated. In 7.1 it still works with a warning; it will be removed in a future version. | `config/application.rb`, `config/environments/development.rb` | Rename `config.action_mailer.preview_path` to `config.action_mailer.preview_paths`. The value changes from a single string to an array: `config.action_mailer.preview_paths = [Rails.root.join("test/mailers/previews")]`. |
| 4 | **SQLite database defaults to storage/ directory** | New apps default SQLite databases to `storage/development.sqlite3` instead of `db/development.sqlite3`. Existing apps upgrading will not be affected if `config/database.yml` already has explicit paths, but running `app:update` may overwrite the config. | `config/database.yml` | If your `database.yml` has explicit file paths, no action required. If you run `rails app:update`, review the generated `database.yml` before accepting changes. Do not move an existing database file without updating the path. |
| 5 | **lib/ autoloaded by default; manual autoload_paths may conflict** | If you previously added `lib/` to `config.autoload_paths` manually, you may now get double-loading warnings or constant errors. Rails 7.1 adds `lib/` to autoload paths automatically (with the caveat that `lib/assets`, `lib/tasks`, and `lib/generators` are excluded). | `config/application.rb` | Remove manual `config.autoload_paths << Rails.root.join("lib")` if present. Use `config.autoload_lib(ignore: %w[assets tasks generators])` instead. Files in `lib/` must follow Zeitwerk naming conventions. |

### MEDIUM Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 6 | **Query log tags sqlcommenter format** | New `sqlcommenter` format available for query log tags. No breaking change, but format change may affect log parsing tools. | `config/application.rb` | No action required. Opt in via `config.active_record.query_log_tags_format = :sqlcommenter` only if desired. |
| 7 | **Cache format version 7.1** | A new, more efficient cache format is available. Old and new format caches are not interchangeable during a rolling deploy. | `config/application.rb` | Do not change `config.active_support.cache_format_version` until all servers in a cluster are running Rails 7.1. After full deployment, set `config.active_support.cache_format_version = 7.1` and flush your cache. |
| 8 | **Content Security Policy initializer** | CSP API has new helpers. No breaking change, but existing initializers may produce deprecation warnings. | `config/initializers/content_security_policy.rb` | Review and update CSP initializer. Run the app and check for CSP-related deprecation warnings in logs. |
| 9 | **ActionText attachment changes** | ActionText attachment handling updated. Verify that existing rich text content renders correctly after upgrade. | `app/views/**/*.erb` with ActionText content, stored rich text records | After upgrading, view existing rich text content and verify attachments render correctly. Run `rails action_text:install:migrations` if prompted. |

### LOW Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 10 | **New /up health check route** | Rails automatically mounts a `/up` health check route. This may conflict with an existing `/up` route. | `config/routes.rb` | Check if your app defines a `/up` route. If it does, rename your route or disable the default with `config.action_dispatch.health_check_path = false`. |
| 11 | **Verbose job logs in development** | New development logging shows more ActiveJob detail. No breaking change; may increase log noise. | `config/environments/development.rb` | No action required. Configure `config.active_job.verbose_enqueue_logs` if desired. |
| 12 | **Dockerfile generation** | Running `rails app:update` now generates a `Dockerfile` and related files. | `Dockerfile`, `.dockerignore` | Review generated Dockerfile before committing. No breaking change. |

---

## Rails 7.1 → 7.2

**Difficulty: Hard**
**Time estimate: 4-8 hours**

This version has 38 documented changes, many of which are deprecations graduating to removals. The transaction-aware job change is a major behavior change that can silently alter when jobs execute. `Rails.application.secrets` is removed entirely.

### HIGH Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 1 | **Transaction-aware job enqueuing (behavior change)** | Jobs and mailers enqueued inside an ActiveRecord transaction now wait for the transaction to commit before being picked up. Previously, a job could be enqueued before the transaction committed, leading to race conditions. This is now the correct behavior, but it changes the timing of job execution. Jobs inside rolled-back transactions are now discarded. | `app/models/**/*.rb`, `app/controllers/**/*.rb`, `app/jobs/**/*.rb`, `app/mailers/**/*.rb` — anywhere `perform_later` or `deliver_later` is called inside a `transaction` block | Audit all transaction blocks. If you enqueue jobs inside transactions intentionally expecting them to run even on rollback, this behavior has changed. If you need the old behavior, wrap the enqueue in `after_commit`. Most apps benefit from the new behavior as it eliminates a class of race conditions. |
| 2 | **show_exceptions changed from boolean to symbol** | `config.action_dispatch.show_exceptions = true` or `= false` is no longer valid. Must use `:all`, `:rescuable`, or `:none`. `:all` = show all exceptions (old `true`). `:none` = do not show any (old `false`). `:rescuable` = show only exceptions handled by `rescue_from`. | `config/environments/development.rb`, `config/environments/production.rb`, `config/environments/test.rb` | Change `config.action_dispatch.show_exceptions = true` to `config.action_dispatch.show_exceptions = :all`. Change `config.action_dispatch.show_exceptions = false` to `config.action_dispatch.show_exceptions = :none`. |
| 3 | **ActionController::Parameters no longer equals Hash** | `params == { key: value }` no longer returns `true`. This comparison was always semantically incorrect (params have security semantics that hashes do not), but it used to return `true` for convenience. Now it always returns `false`. | `app/controllers/**/*.rb`, `test/**/*.rb`, `spec/**/*.rb` | Replace `params == some_hash` with `params.to_h == some_hash` or `params.to_unsafe_h == some_hash`. In tests, use `expect(response.parsed_body).to eq(...)` instead of comparing params directly. |
| 4 | **ActiveRecord::Base.connection deprecated** | `ActiveRecord::Base.connection` is deprecated. It was a class-level method that returned a connection from the pool without a guaranteed return path, which could cause connection leaks. | `app/**/*.rb`, `lib/**/*.rb`, `config/initializers/**/*.rb`, `db/seeds.rb` | Replace with `ActiveRecord::Base.connection_pool.with_connection { |conn| ... }` or use `ActiveRecord::Base.lease_connection` for single queries. For most use cases, avoid direct connection access; let ActiveRecord manage connections through normal model queries. |
| 5 | **Rails.application.secrets removed** | `Rails.application.secrets` is completely gone. This was deprecated in Rails 6.x. Any code reading `Rails.application.secrets.some_key` will raise `NoMethodError`. | `config/secrets.yml`, `config/secrets.yml.enc`, anywhere `Rails.application.secrets` is referenced | Migrate all secrets to `Rails.application.credentials`. Run `rails credentials:edit` to add secrets. Replace all `Rails.application.secrets.key` calls with `Rails.application.credentials.key`. Remove `config/secrets.yml`. Update environment-specific credential files if needed. |

### MEDIUM Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 6 | **serialize requires type: or coder: parameter** | Calling `serialize :attribute` without a type or coder raises an error in 7.2. Previously, bare `serialize` defaulted to marshaling. | `app/models/**/*.rb` | Replace `serialize :column` with `serialize :column, type: Array` or `serialize :column, type: Hash` or `serialize :column, coder: JSON` depending on what the column stores. For arbitrary objects, use `serialize :column, coder: Marshal` to preserve old behavior (not recommended; prefer JSON). |
| 7 | **query_constraints deprecated in favor of foreign_key** | `query_constraints` on associations is deprecated. This was an experimental feature from Rails 7.1. | `app/models/**/*.rb` | Replace `query_constraints` with the appropriate `foreign_key` option. Review Rails 7.2 release notes for the exact migration path for your association type. |
| 8 | **ActionMailer test syntax: args: renamed to params:** | In mailer tests, the `args:` keyword argument is renamed to `params:`. | `test/mailers/**/*.rb`, `spec/mailers/**/*.rb` | Find all mailer test helpers that use `args:` and rename to `params:`. Example: `assert_enqueued_email_with MyMailer, :welcome, args: [user]` becomes `assert_enqueued_email_with MyMailer, :welcome, params: [user]`. |
| 9 | **fixture_path renamed to fixture_paths (array)** | `config.fixture_path` (singular string) is deprecated. Must use `config.fixture_paths` (plural array). | `config/application.rb`, `test/test_helper.rb` | Rename `config.fixture_path = Rails.root.join("test/fixtures")` to `config.fixture_paths = [Rails.root.join("test/fixtures")]`. Note it is now an array. |
| 10 | **ActiveSupport::Cache deprecated methods** | `to_default_s` and `clone_empty` on cache stores are deprecated and will be removed in 7.3. | `config/application.rb`, custom cache store implementations | Audit custom cache stores. Remove calls to deprecated methods. |
| 11 | **autoload_lib syntax change** | The `%w()` variant of the ignore argument is deprecated in favor of `%w[]`. | `config/application.rb` | Change `config.autoload_lib(ignore: %w(assets tasks))` to `config.autoload_lib(ignore: %w[assets tasks])`. |
| 12 | **Ruby 3.1+ required** | Rails 7.2 requires Ruby 3.1 or later. | `Gemfile`, `.ruby-version`, CI configuration | Upgrade to Ruby 3.1 minimum. Ruby 3.3 is recommended. Run your test suite against the new Ruby version before upgrading Rails. |

### LOW Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 13–33 | **21 additional deprecations** | Various minor deprecations. See the official Rails 7.2 release notes for the complete list. Most are method renames or option changes in rarely-used APIs. | Various | Run your full test suite after upgrading and address all deprecation warnings shown in the log output. Set `config.active_support.deprecation = :raise` in the test environment to turn deprecation warnings into errors during testing. |
| 34 | **allow_browser minimum versions feature** | New `allow_browser versions: :modern` controller method. No breaking change. | `app/controllers/application_controller.rb` | Optional adoption. If added, test that your supported browsers meet the minimum version requirements. |
| 35 | **DevContainers support added** | New devcontainer files generated by `rails app:update`. No breaking change. | `.devcontainer/` | Review generated files if you use Dev Containers. |

---

## Rails 7.2 → 8.0

**Difficulty: Very Hard**
**Time estimate: 6-12 hours**

The replacement of Sprockets with Propshaft as the default asset pipeline is the most disruptive change. Any app with non-trivial asset configuration will need significant work. Solid gems (Solid Cache, Solid Queue, Solid Cable) are now defaults, replacing Redis-backed solutions in the Rails default stack.

### HIGH Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 1 | **Sprockets replaced by Propshaft as default asset pipeline** | Sprockets is no longer included by default. If your app uses Sprockets, you must either explicitly keep it (`gem 'sprockets-rails'`) or migrate to Propshaft. Propshaft has a fundamentally simpler model: it does not support asset compilation directives (`//= require`). Assets are served by digest fingerprinting only. | `Gemfile`, `app/assets/`, `config/initializers/assets.rb`, layout files, `app/views/**/*.erb` | Option A (keep Sprockets): add `gem 'sprockets-rails'` to Gemfile. Update `config/application.rb` if needed. Option B (migrate to Propshaft): add `gem 'propshaft'`. Remove all `//= require` and `//= require_tree` directives from `.css` and `.js` manifests. Propshaft serves files by path, not by manifest. Update layout tags. Test all asset loading in production mode. |
| 2 | **Multi-database config restructured for Solid Cache/Queue/Cable** | The default `config/database.yml` for new apps includes separate databases for `primary`, `cache`, `queue`, and `cable`. Upgrading apps that do not adopt the Solid gems may have an incompatible `database.yml` after running `rails app:update`. | `config/database.yml`, `config/environments/*.rb` | Review `config/database.yml` carefully after running `rails app:update`. If not adopting Solid gems, you do not need the extra database entries. Remove or skip the generated cache/queue/cable database sections. |
| 3 | **Solid Cache, Solid Queue, Solid Cable as defaults** | New apps default to database-backed cache, job queue, and Action Cable. Existing apps are not forced to switch, but `rails app:update` will add these to Gemfile and config. Redis-backed setups may conflict with new defaults. | `Gemfile`, `config/cache.yml`, `config/queue.yml`, `config/cable.yml`, `config/environments/production.rb` | If keeping Redis: remove or do not add the Solid gems; keep your existing cache/queue/cable configuration. If adopting Solid gems: run `rails solid_cache:install`, `rails solid_queue:install`, `rails solid_cable:install` and create the required database migrations. |
| 4 | **config.assume_ssl setting introduced** | New `config.assume_ssl = true` is added to production config in new apps. This tells Rails to treat all requests as if they arrived over SSL (useful when SSL is terminated at a load balancer and Rails only sees plain HTTP). Without this, `request.ssl?` returns `false` even for HTTPS traffic, which can cause incorrect redirect URLs. | `config/environments/production.rb` | If you terminate SSL at a proxy or load balancer: add `config.assume_ssl = true`. If you terminate SSL at Rails directly: do not set this (or set to `false`). Review all `request.ssl?` checks and `force_ssl` behavior. |
| 5 | **Removed deprecated APIs** | Several deprecated APIs are removed: `sqlite3_deprecated_warning` configuration, `use_big_decimal_serializer`, `ActiveSupport::ProxyObject`. Any code using these will fail with `NoMethodError` or `NameError`. | `config/application.rb`, `app/**/*.rb`, `lib/**/*.rb`, custom serializers | Search for `sqlite3_deprecated_warning`, `use_big_decimal_serializer`, and `ProxyObject` across the codebase. Remove or replace each occurrence. For `ActiveSupport::ProxyObject`, use `BasicObject` or `Delegator` instead. |

### MEDIUM Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 6 | **Thruster gem for HTTP/2 and asset compression** | New apps include `thruster` in the Gemfile for HTTP/2 push and X-Sendfile acceleration. No breaking change for existing apps, but the Dockerfile changes. | `Gemfile`, `Dockerfile` | If adopting Thruster: add `gem 'thruster'` and update Dockerfile per the Rails 8 template. If not adopting: no action required. |
| 7 | **Kamal deployment integration** | Rails 8 includes Kamal 2 for deployment. New `config/deploy.yml` generated by `rails app:update`. If using a different deployment system, the generated file is safe to ignore but review before committing. | `config/deploy.yml`, `Dockerfile` | Review `config/deploy.yml` after `rails app:update`. If using Heroku, Fly.io, or another platform, the file can be removed or ignored. |
| 8 | **PWA manifest routes** | New apps get a `manifest.json` and `serviceworker.js` route. No breaking change, but `rails app:update` adds these files and routes. | `config/routes.rb`, `app/views/pwa/`, `app/controllers/` | Review new PWA-related files after `rails app:update`. Remove if not building a PWA. |
| 9 | **Environment config updates** | Various production and development defaults changed in the generated environment files. Running `rails app:update` surfaces these as conflicts. | `config/environments/*.rb` | Review each conflict from `rails app:update` carefully. Do not blindly accept all changes — compare your customizations against the new defaults. |

### LOW Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 10 | **params.expect() new API** | New `params.expect(:key)` method as a safer alternative to `params.require(:key).permit(...)`. No breaking change. | `app/controllers/**/*.rb` | Optional adoption. Useful for cleaner controller params handling. |
| 11 | **Built-in authentication generator** | `rails generate authentication` creates a full authentication scaffold. No breaking change; does not affect existing auth. | `app/models/`, `app/controllers/` | Adopt only if replacing an existing auth solution. Check for conflicts with Devise or other auth gems before running the generator. |
| 12 | **Form helper aliases added** | `textarea`, `checkbox`, `rich_textarea` are new aliases for `text_area`, `check_box`, `rich_text_area`. Old names still work. | `app/views/**/*.erb` | No action required. Existing view code is unaffected. |
| 13 | **script/ folder** | A new `script/` folder is generated for one-off scripts, as an alternative to `lib/tasks/`. | `script/` | No action required. |

---

## Rails 8.0 → 8.1

**Difficulty: Easy**
**Time estimate: 2-4 hours**

A relatively small set of changes. The most significant for most apps is the SSL configuration change (force_ssl and assume_ssl commented out by default, assuming Kamal handles SSL) and the database.yml pool rename.

### HIGH Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 1 | **force_ssl and assume_ssl commented out in production config** | New Rails 8.1 apps have `force_ssl` and `assume_ssl` commented out by default. The assumption is that Kamal or another reverse proxy handles SSL termination. Upgrading apps that had these settings enabled may find them silently disabled after running `rails app:update` and accepting the new config. | `config/environments/production.rb` | If NOT using Kamal or a proxy that handles SSL: explicitly uncomment and set `config.force_ssl = true` and `config.assume_ssl = true` as appropriate. If using Kamal with SSL offloading: the commented-out defaults are correct. Review your deployment topology before accepting this change. |
| 2 | **pool: renamed to max_connections: in database.yml** | The `pool:` key in `config/database.yml` is renamed to `max_connections:`. Using the old `pool:` key generates a deprecation warning in 8.1 and will be removed in a future version. | `config/database.yml` | Rename every `pool:` key to `max_connections:` across all database configuration sections (development, test, production, and any named databases). Example: `pool: 5` becomes `max_connections: 5`. |
| 3 | **bundler-audit integration** | Rails 8.1 adds `bundler-audit` as a default security scanning tool, integrated into the CI pipeline and `bin/` scripts. If your app has a custom CI setup, the new `bin/brakeman` and `bin/bundler-audit` scripts may conflict or need integration. | `Gemfile`, `bin/`, CI configuration (`.github/workflows/`, etc.) | Add `gem 'bundler-audit', require: false` to the Gemfile (development/test group). Run `bundle exec bundler-audit check --update` to verify your dependencies. Integrate into CI if desired. |

### MEDIUM Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 4 | **Semicolon query string separator removed** | `?key=value;other=value2` (semicolon-separated query strings) is no longer parsed. Only `&` is accepted as the query string separator. Semicolons in query strings now produce unexpected parameter parsing. | `app/controllers/**/*.rb`, any URLs generated or consumed by the app | Search for semicolons in query string generation. Replace `;` separators with `&`. If consuming external APIs that use semicolons, add a parsing adapter. |
| 5 | **Built-in ActiveJob adapters for Sidekiq and SuckerPunch removed** | `config.active_job.queue_adapter = :sidekiq` and `:sucker_punch` no longer work with the built-in adapters. These adapters have been moved to the respective gems. | `config/application.rb`, `config/environments/*.rb` | Upgrade to `sidekiq >= 7.3.3` (which includes its own ActiveJob adapter) or `sucker_punch >= 3.2`. No configuration changes are required beyond the gem upgrade; the adapter registration is handled by the gem. |
| 6 | **Active Storage Azure service removed** | `config.active_storage.service = :azure` and the `ActiveStorage::Service::AzureStorageService` class are removed. | `config/storage.yml`, `config/environments/*.rb` | If using Azure Blob Storage: switch to S3-compatible storage, Google Cloud Storage, or the Disk service. Alternatively, extract the Azure adapter into a separate gem. Migrate existing blobs before switching services. |

### LOW Priority

| # | Change | Impact | Files Affected | Action Required |
|---|---|---|---|---|
| 7 | **MySQL unsigned integer types deprecated in migrations** | Using `t.integer :column, unsigned: true` in migrations generates a deprecation warning. Unsigned integer support in MySQL through Active Record is being phased out. | `db/migrate/**/*.rb` | For new migrations, use a check constraint instead: `t.integer :column` plus `add_check_constraint :table, "column >= 0", name: "non_negative_column"`. Existing columns are unaffected at the database level. |
| 8 | **.gitignore updated with /config/*.key pattern** | The generated `.gitignore` now includes `/config/*.key` to prevent accidental credential key commits. If your `.gitignore` does not include this pattern, credential keys could be committed. | `.gitignore` | Add `/config/*.key` to `.gitignore` if not present. Verify that `config/credentials.yml.enc` is tracked but `config/master.key` and any environment-specific `.key` files are not. |

---

## Cumulative Impact Analysis

### Full Journey: Rails 5.2 → 8.1

Upgrading across all versions involves cumulative exposure to all the changes above. The total effort is substantially more than the sum of individual hops because some changes interact.

#### Top 10 Most Impactful Changes (by breadth of codebase affected)

| Rank | Change | Version | Why It Is High Impact |
|---|---|---|---|
| 1 | Transaction-aware jobs | 7.2 | Silent behavior change. Jobs that previously ran before a transaction committed now run after. Race conditions disappear, but timing-sensitive code breaks silently. |
| 2 | Sprockets → Propshaft | 8.0 | Complete asset pipeline replacement. Apps with complex Sprockets manifests require full rewrite of asset loading strategy. |
| 3 | Zeitwerk autoloader | 6.0 | Every file in the app must follow strict naming conventions. Large legacy codebases with informal naming patterns require widespread renaming. |
| 4 | cache_classes → enable_reloading (inverted boolean) | 7.1 | Every environment file must be updated. The inverted boolean means a copy-paste error produces the opposite of the intended behavior. Easy to overlook in a large diff. |
| 5 | Multi-database config restructure | 8.0 | `config/database.yml` structure changes significantly for apps adopting Solid gems. |
| 6 | show_exceptions changed to symbol | 7.2 | Breaks boot in all three environment configs if not updated. Error is clear but affects multiple files. |
| 7 | ActiveRecord::Base.connection deprecated | 7.2 | This pattern appears in many places: initializers, lib code, custom middleware, Rake tasks. |
| 8 | Webpacker → Hotwire/Turbo/ImportMaps | 7.0 | Complete JavaScript pipeline replacement. All Turbolinks event handlers, data attributes, and JavaScript events must be updated. |
| 9 | Rails.application.secrets removed | 7.2 | Complete API removal. Every reference to secrets must be migrated to credentials. |
| 10 | pool → max_connections | 8.1 | Simple rename, but affects every database configuration section and is easy to miss in multi-database setups. |

#### Hardest Single-Hop Upgrades

1. **7.2 → 8.0** (Very Hard): Asset pipeline replacement, Solid gems defaults, multi-database restructure all at once.
2. **6.1 → 7.0** (Hard): JavaScript pipeline replacement (Webpacker → Hotwire), `legacy_connection_handling` removal, Ruby 2.7 requirement.
3. **5.2 → 6.0** (Hard): Zeitwerk autoloader requires renaming files and removing `require_dependency` throughout the codebase.

#### Recommended Multi-Hop Strategy

For apps on Rails 5.2 upgrading to 8.1:

```
5.2 → 6.0  (address Zeitwerk, remove require_dependency, fix method removals)
6.0 → 6.1  (fix errors[] usage, verify file uploads)
6.1 → 7.0  (migrate JS pipeline, address Ruby 2.7 requirement)
7.0 → 7.1  (fix cache_classes inversion, lib/ autoloading)
7.1 → 7.2  (fix secrets, show_exceptions, transaction job behavior)
7.2 → 8.0  (migrate asset pipeline, evaluate Solid gems)
8.0 → 8.1  (rename pool, fix SSL config)
```

Each hop should be: upgrade gem → run `rails app:update` (reviewing each change) → run test suite → fix deprecation warnings → commit before proceeding to next hop.

---

## By-Symptom Quick Search Index

Use this section when you see a specific error or symptom and need to find the relevant change quickly.

### "My tests are failing with..."

| Symptom | Relevant Change | Version | Fix |
|---|---|---|---|
| `show_exceptions` error or invalid value | Boolean → symbol | 7.2 | Change `true`/`false` to `:all`/`:none` |
| `params == some_hash` returns false | Parameters ≠ Hash | 7.2 | Use `params.to_h == some_hash` |
| `connection` deprecated warning | `Base.connection` deprecated | 7.2 | Use `with_connection` or `lease_connection` |
| `NameError: uninitialized constant` after rename | Zeitwerk naming | 6.0 | File name must match constant name exactly |
| `errors[:attr]` returns objects not strings | Error objects | 6.1 | Call `.message` on each error or use `full_messages_for` |
| `cache_classes` unknown configuration key | Config key renamed | 7.1 | Rename to `enable_reloading` (and invert boolean) |
| `fixture_path` deprecation warning | Singular → plural | 7.2 | Use `fixture_paths` as an array |
| `args:` unknown keyword in mailer test | Test syntax change | 7.2 | Rename `args:` to `params:` |
| `serialize :column` raises error | Serialize requires type | 7.2 | Add `type: Array` or `coder: JSON` |

### "My app raises on boot with..."

| Symptom | Relevant Change | Version | Fix |
|---|---|---|---|
| `NoMethodError: update_attributes` | Method removed | 6.0 | Replace with `update` |
| `NoMethodError: before_filter` | Method removed | 6.0 | Replace with `before_action` |
| `NoMethodError: require_dependency` | Method removed | 6.0 | Remove the call; Zeitwerk autoloads it |
| `NoMethodError: secrets` | `secrets` removed | 7.2 | Migrate to `credentials` |
| `ArgumentError: render nothing: true` | Option removed | 6.0 | Use `head :ok` |
| `legacy_connection_handling` error | Option removed | 7.0 | Remove the config key |
| `pool:` deprecation warning | Key renamed | 8.1 | Rename to `max_connections:` |

### "I can't deploy because..."

| Symptom | Relevant Change | Version | Fix |
|---|---|---|---|
| SSL redirect loop | `force_ssl`/`assume_ssl` misconfigured | 7.1, 8.0, 8.1 | Set `force_ssl` and `assume_ssl` explicitly based on your SSL termination topology |
| Jobs not processing / running too early | Transaction-aware jobs | 7.2 | Jobs inside transactions now run post-commit; review all `perform_later` inside `transaction` blocks |
| Database connection errors in production | `database.yml` changes | 7.2, 8.0, 8.1 | Review `database.yml` structure after each `rails app:update` |
| Assets 404 in production | Propshaft migration incomplete | 8.0 | Complete migration from Sprockets; remove `//= require` directives |
| Webpacker compile errors | Webpacker removed | 7.0 | Migrate to Import Maps or jsbundling-rails |
| ActiveStorage files not loading | Azure service removed | 8.1 | Migrate to S3, GCS, or Disk service |
| Sidekiq jobs not enqueuing | Built-in adapter removed | 8.1 | Upgrade to `sidekiq >= 7.3.3` |

### "I see deprecation warnings about..."

| Warning Text | Relevant Change | Version | Fix |
|---|---|---|---|
| `cache_classes` | Config renamed | 7.1 | Rename to `enable_reloading` (invert boolean) |
| `preview_path` | Singular → plural | 7.1 | Use `preview_paths` as array |
| `fixture_path` | Singular → plural | 7.2 | Use `fixture_paths` as array |
| `ActiveRecord::Base.connection` | Method deprecated | 7.2 | Use `with_connection` |
| `serialize :column` without type | Type required | 7.2 | Add `type:` or `coder:` |
| `pool:` in database.yml | Key renamed | 8.1 | Rename to `max_connections:` |
| `query_constraints` | Deprecated | 7.2 | Use `foreign_key` |
| `unsigned: true` in migration | Deprecated | 8.1 | Use a check constraint instead |

---

## Attribution

Based on work by OmbuLabs.ai / FastRuby.io (MIT) and Mario Alberto Chavez Cardenas (MIT).

Official release notes: https://guides.rubyonrails.org/upgrading_ruby_on_rails.html
