---
name: rails-guides
description: Official Rails documentation. Use when asked about any Rails-specific topic including ActiveRecord, routing, controllers, views, mailers, jobs, Action Cable, Action Text, Active Storage, migrations, validations, callbacks, associations, caching, security, or internals.
---

# Rails Guides

Official Rails documentation for reference during development.

## Topic Map

### Getting Started
- `references/getting_started.md` — Rails basics, MVC overview, first app walkthrough
- `references/command_line.md` — `rails` command, generators, rake tasks
- `references/configuring.md` — Environments, initializers, credentials, database.yml
- `references/autoloading_and_reloading_constants.md` — Zeitwerk, module naming, reload behavior
- `references/initialization.md` — Rails boot sequence, railties, engines

### Active Record
- `references/active_record_basics.md` — Models, CRUD, conventions, migrations
- `references/active_record_querying.md` — Finders, scopes, joins, includes, explain
- `references/active_record_validations.md` — Built-in validators, custom validators, errors
- `references/active_record_callbacks.md` — Lifecycle hooks, after_commit, skip_callback
- `references/association_basics.md` — belongs_to, has_many, has_one, HABTM, polymorphic
- `references/active_record_migrations.md` — Schema changes, reversible migrations, db:migrate
- `references/active_record_encryption.md` — Encrypting attributes at rest
- `references/active_record_composite_primary_keys.md` — Multi-column primary keys
- `references/active_record_multiple_databases.md` — Multi-DB setup, sharding, replicas
- `references/active_record_postgresql.md` — PostgreSQL-specific features (hstore, jsonb, arrays)
- `references/active_model_basics.md` — ActiveModel outside ActiveRecord, form objects

### Action Controller
- `references/action_controller_overview.md` — Controllers, params, filters, sessions, cookies
- `references/action_controller_advanced_topics.md` — Streaming, live, metal, http auth
- `references/routing.md` — Resources, namespaces, constraints, named routes, URL helpers

### Action View
- `references/action_view_overview.md` — Templates, partials, layouts, formats
- `references/action_view_helpers.md` — form_with, link_to, tag, content_tag, asset helpers
- `references/form_helpers.md` — form_with, field helpers, nested forms, uploads
- `references/layouts_and_rendering.md` — render, redirect_to, respond_to, layout inheritance

### Frontend / Hotwire
- `references/working_with_javascript_in_rails.md` — Import maps, Turbo, Stimulus overview
- `references/action_text_overview.md` — Rich text with Trix, attachments

### Jobs & Mailers
- `references/active_job_basics.md` — Job classes, queues, retry, test helpers
- `references/action_mailer_basics.md` — Mailers, templates, deliveries, previews
- `references/action_mailbox_basics.md` — Incoming email routing and processing

### Storage
- `references/active_storage_overview.md` — File uploads, variants, direct uploads, S3/GCS/Azure

### Testing
- `references/testing.md` — Minitest, fixtures, test types, helpers, assertions

### Real-Time
- `references/action_cable_overview.md` — WebSockets, channels, broadcasting, connections

### Security & Performance
- `references/security.md` — SQL injection, XSS, CSRF, mass assignment, secure headers
- `references/caching_with_rails.md` — Fragment, action, HTTP caching, cache stores
- `references/asset_pipeline.md` — Sprockets, Propshaft, precompile, digests
- `references/tuning_performance_for_deployment.md` — Puma, connection pooling, GC

### Internationalization
- `references/i18n.md` — Translation files, locale, pluralization, date formats

### API & Rack
- `references/api_app.md` — API-only Rails, slim middleware stack
- `references/rails_on_rack.md` — Middleware stack, Rack integration

### Advanced
- `references/active_support_core_extensions.md` — String, Array, Hash, Date extensions
- `references/active_support_instrumentation.md` — Notifications, log subscribers
- `references/association_basics.md` — Association options, eager loading strategies
- `references/debugging_rails_applications.md` — debug gem, logger, web-console, byebug
- `references/error_reporting.md` — Error::Reporter, Sentry integration
- `references/threading_and_code_execution.md` — Thread safety, executor, reloader
- `references/upgrading_ruby_on_rails.md` — Version upgrade paths, deprecation handling
