# Troubleshooting

## Test Suite Failures After Upgrade

**"NoMethodError: undefined method 'update_attributes'"**
- Cause: Removed in Rails 6.0
- Fix: `grep -r "update_attributes" app/ lib/` and replace with `update`

**"ArgumentError: wrong number of arguments (given 1, expected 0)"** on cache
- Cause: Cache format change in Rails 7.1 or 8.0 load_defaults
- Fix: Clear cache: `rails cache:clear`. If in production, coordinate cache clear with deploy.

**"ActionController::Parameters does not respond to to_h"** or params comparison error
- Cause: Rails 7.2 removed `params == hash`
- Fix: Use `params.to_h == hash` or `params.permit(...) == hash`

**"ActiveRecord::ConnectionNotEstablished"**
- Cause: Direct `ActiveRecord::Base.connection` usage removed in 7.2
- Fix: Wrap in `ActiveRecord::Base.with_connection { |conn| ... }`

**Jobs not running after transaction**
- Cause: Rails 7.2 transaction-aware job enqueuing — jobs wait for transaction commit
- Fix: Expected behavior. If you need immediate execution, use `perform_now`. Test your transaction boundaries.

**"NameError: wrong constant name" or autoload errors**
- Cause: Zeitwerk naming mismatch (Rails 6.0)
- Fix: Run `rails zeitwerk:check` to identify problematic files. File `app/models/my_model.rb` must define `MyModel`, not `My_Model`.

**"show_exceptions must be a Symbol"**
- Cause: Rails 7.2 — `show_exceptions` no longer accepts booleans
- Fix: `config.action_dispatch.show_exceptions = :all` (was `true`) or `:none` (was `false`)

## Asset Pipeline Issues (Rails 8.0)

**Assets returning 404 after upgrade**
- Cause: Incomplete Propshaft migration
- Fix:
  1. Remove `sprockets-rails` from Gemfile, add `propshaft`
  2. Remove `config.assets.*` Sprockets-specific config
  3. Remove `//= require` directives in JS/CSS files (Propshaft uses imports instead)
  4. Run `rails assets:precompile` and check output

**"Sprockets::Error: Asset not found"**
- Cause: Still using Sprockets manifest directives with Propshaft
- Fix: Rewrite asset includes as direct imports

## railsdiff.org API Issues

**WebFetch returns empty or error for GitHub compare URL**
- Cause: GitHub API rate limit (60 req/hour unauthenticated) or network issue
- Fix: Wait and retry, or proceed with static detection patterns in `references/detection-patterns.md`. Note in the report that live config diff was unavailable.

**Version tag not found in railsdiff repo**
- Cause: Very new patch release not yet in the `railsdiff/rails-new-output` repo
- Fix: Use the nearest minor version tag (e.g., `v8.1.0` if `v8.1.1` not found). Or use static references.

**Unexpected diff content**
- Cause: Some patch releases change files that aren't breaking. railsdiff shows ALL changes.
- Fix: Focus on files in `config/environments/`, `config/initializers/`, `config/database.yml`, `Gemfile`. Ignore `package.json`, CSS files unless you're explicitly migrating assets.

## Gem Conflicts

**"Bundler could not find compatible versions"**
- Fix: Run `bundle update rails --conservative`. Check which gem is blocking with `bundle update rails 2>&1 | grep "Conflict"`. See `references/gem-compatibility.md` for required versions.

**Devise not working after upgrade**
- Fix: Check `references/gem-compatibility.md` for required Devise version. Run `bundle update devise`. Check for pending migrations: `rails db:migrate:status`.

**RSpec failures that passed before**
- Cause: Often rspec-rails version incompatibility
- Fix: Upgrade `rspec-rails` to the version in `references/gem-compatibility.md`. Common: `gem 'rspec-rails', '~> 6.0'` for Rails 7+.

## load_defaults Issues

**"Uninitialized constant" after enabling new defaults**
- Cause: Zeitwerk-related change from load_defaults 6.0
- Fix: Run `rails zeitwerk:check` to identify all naming issues. Check `references/load-defaults-guide.md` Tier 3 section.

**Session/cookie errors after bumping load_defaults**
- Cause: `active_support.message_serializer` change (7.1)
- Fix: Do not change message_serializer if you have existing user sessions. Wait for session expiry window, then enable.

**Tests fail only in CI after load_defaults change**
- Cause: Cache format version change — CI may have cached assets/data in old format
- Fix: Clear CI cache, or add explicit cache invalidation step.

## Fetch Changelog Script Issues

**`./scripts/fetch-changelogs.sh: Permission denied`**
- Fix: `chmod +x scripts/fetch-changelogs.sh`

**`curl: command not found`**
- Fix: Install curl: `brew install curl` (macOS) or `apt-get install curl` (Ubuntu)

**No output for a version**
- Cause: That patch version may not exist as a tag in the Rails repo
- Fix: Run `./scripts/fetch-changelogs.sh --list-versions` to see available tags. Use the nearest minor version.

## Attribution

Compiled from:
- Mario Alberto Chavez Cardenas (MIT) — troubleshooting reference from rails-upgrade-skill
- OmbuLabs.ai / FastRuby.io (MIT) — common upgrade issues from claude-code_rails-upgrade-skill
- Community knowledge and Rails issue tracker
