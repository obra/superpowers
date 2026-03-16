# Multi-Tenancy Patterns

> URL path-based multi-tenancy patterns from 37signals' Fizzy.

---

## Path-Based Tenancy with Middleware ([#283](https://github.com/basecamp/fizzy/pull/283))

Extract tenant from URL paths and "mount" Rails at that prefix:

```ruby
module AccountSlug
  PATTERN = /(\d{7,})/
  PATH_INFO_MATCH = /\A(\/#{AccountSlug::PATTERN})/

  class Extractor
    def initialize(app)
      @app = app
    end

    def call(env)
      request = ActionDispatch::Request.new(env)

      if request.path_info =~ PATH_INFO_MATCH
        # Move prefix from PATH_INFO to SCRIPT_NAME
        request.engine_script_name = request.script_name = $1
        request.path_info = $'.empty? ? "/" : $'
        env["fizzy.external_account_id"] = AccountSlug.decode($2)
      end

      if env["fizzy.external_account_id"]
        account = Account.find_by(external_account_id: env["fizzy.external_account_id"])
        Current.with_account(account) { @app.call(env) }
      else
        Current.without_account { @app.call(env) }
      end
    end
  end
end

# Insert middleware
Rails.application.config.middleware.insert_after Rack::TempfileReaper, AccountSlug::Extractor
```

**Why path-based**: No wildcard DNS/SSL, simpler local dev, no `/etc/hosts` hacking.

## Current Context Pattern ([#168](https://github.com/basecamp/fizzy/pull/168), [#279](https://github.com/basecamp/fizzy/pull/279))

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :session, :user, :identity, :account

  def with_account(value, &)
    with(account: value, &)
  end

  def without_account(&)
    with(account: nil, &)
  end
end
```

## ActiveJob Tenant Preservation ([#168](https://github.com/basecamp/fizzy/pull/168))

Automatically capture/restore tenant in background jobs:

```ruby
module FizzyActiveJobExtensions
  extend ActiveSupport::Concern

  prepended do
    attr_reader :account
    self.enqueue_after_transaction_commit = true
  end

  def initialize(...)
    super
    @account = Current.account
  end

  def serialize
    super.merge({ "account" => @account&.to_gid })
  end

  def deserialize(job_data)
    super
    if _account = job_data.fetch("account", nil)
      @account = GlobalID::Locator.locate(_account)
    end
  end

  def perform_now
    if account.present?
      Current.with_account(account) { super }
    else
      super
    end
  end
end

ActiveSupport.on_load(:active_job) do
  prepend FizzyActiveJobExtensions
end
```

Uses GlobalID for serialization - works across all job backends.

## Recurring Jobs: Iterate All Tenants ([#279](https://github.com/basecamp/fizzy/pull/279))

```ruby
# Recurring jobs run outside request context
class AutoPopAllDueJob < ApplicationJob
  def perform
    ApplicationRecord.with_each_tenant do |tenant|
      Bubble.auto_pop_all_due
    end
  end
end
```

Easy to forget during multi-tenant migration.

## Session Cookie Path Scoping ([#879](https://github.com/basecamp/fizzy/pull/879))

For simultaneous login to multiple tenants:

```ruby
def set_current_session(session)
  cookies.signed.permanent[:session_token] = {
    value: session.signed_id,
    httponly: true,
    same_site: :lax,
    path: Account.sole.slug  # e.g., "/1234567"
  }
end
```

Without path scoping, cookies from one tenant clobber another.

## Test Setup for Path-Based Tenancy ([#879](https://github.com/basecamp/fizzy/pull/879))

```ruby
# test_helper.rb
Rails.application.config.active_record_tenanted.default_tenant =
  ActiveRecord::FixtureSet.identify(:'37s_fizzy')

class ActionDispatch::IntegrationTest
  setup do
    integration_session.default_url_options[:script_name] =
      "/#{ApplicationRecord.current_tenant}"
  end
end

class ActionDispatch::SystemTestCase
  setup do
    self.default_url_options[:script_name] =
      "/#{ApplicationRecord.current_tenant}"
  end
end
```

## Always Scope Controller Lookups ([#372](https://github.com/basecamp/fizzy/pull/372))

Defense in depth - don't rely solely on middleware:

```ruby
# Bad
def set_comment
  @comment = Comment.find(params[:comment_id])
end

# Good - scope through tenant
def set_comment
  @comment = Current.account.comments.find(params[:comment_id])
end

# Better - scope through user's accessible records
def set_bubble
  @bubble = Current.user.accessible_bubbles.find(params[:bubble_id])
end
```

## Default Tenant for Dev Console ([#168](https://github.com/basecamp/fizzy/pull/168), [#879](https://github.com/basecamp/fizzy/pull/879))

```ruby
# config/initializers/tenanting/default_tenant.rb
Rails.application.configure do
  if Rails.env.development?
    config.active_record_tenanted.default_tenant = "175932900"
  end
end
```

Makes console work ergonomic without constant tenant switching.

## Solid Cache Multi-Tenant Config ([#168](https://github.com/basecamp/fizzy/pull/168), [#279](https://github.com/basecamp/fizzy/pull/279))

Avoid Rails' automatic shard swapping conflicts:

```yaml
# config/cache.yml
# DON'T use database: key - causes shard swap issues

default_connection: &default_connection
  connects_to:
    database:
      writing: :cache

development:
  <<: *default_connection
  store_options:
    max_size: <%= 256.megabytes %>
    namespace: <%= Rails.env %>
```

## Test Middleware in Isolation

```ruby
def call_with_env(path, extra_env = {})
  captured = {}
  extra_env = { "action_dispatch.routes" => Rails.application.routes }.merge(extra_env)

  app = ->(env) do
    captured[:script_name] = env["SCRIPT_NAME"]
    captured[:path_info] = env["PATH_INFO"]
    captured[:current_account] = Current.account
    [ 200, {}, [ "ok" ] ]
  end

  middleware = AccountSlug::Extractor.new(app)
  middleware.call Rack::MockRequest.env_for(path, extra_env.merge(method: "GET"))

  captured
end

test "moves account prefix from PATH_INFO to SCRIPT_NAME" do
  account = accounts(:initech)
  slug = AccountSlug.encode(account.external_account_id)

  captured = call_with_env "/#{slug}/boards"

  assert_equal "/#{slug}", captured.fetch(:script_name)
  assert_equal "/boards", captured.fetch(:path_info)
  assert_equal account, captured.fetch(:current_account)
end
```

## Architecture Decision

Fizzy settled on **path-based tenancy with shared database** (not database-per-tenant):
- URL paths like `/1234567/boards/123`
- Middleware sets `Current.account`
- Models scoped via `account_id` foreign keys
- Simpler than database-per-tenant while maintaining isolation
