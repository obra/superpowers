# Configuration Patterns

> Rails configuration and environment management lessons from 37signals.

---

## RAILS_MASTER_KEY Pattern ([#554](https://github.com/basecamp/fizzy/pull/554))
```bash
# .kamal/secrets.production
SECRETS=$(kamal secrets fetch --adapter 1password \
  --from Production/RAILS_MASTER_KEY)
RAILS_MASTER_KEY=$(kamal secrets extract RAILS_MASTER_KEY $SECRETS)
```

**Why it matters:**
- Single secret (`RAILS_MASTER_KEY`) unlocks all environment credentials
- Simplifies deployment - only one secret to manage per environment
- Works seamlessly with Kamal and 1Password

## YAML Configuration DRYness

### Anchor References Over Inheritance ([#584](https://github.com/basecamp/fizzy/pull/584))

```yaml
# Before - verbose repetition
production: &production
  <<: *default_connection
  <<: *default_options

beta:
  <<: *production

# After - cleaner anchor reference
production: &production
  <<: *default_connection
  <<: *default_options

beta: *production
staging: *production
```

**Why it matters:**
- More concise and readable
- Easier to add new environments
- Standard YAML feature, no magic

### Apply to All Config Files ([#584](https://github.com/basecamp/fizzy/pull/584))
Use this pattern consistently across:
- `config/cable.yml`
- `config/cache.yml`
- `config/queue.yml`
- `config/recurring.yml`
- `config/database.yml`

## Environment-Specific Configuration

### Explicit RAILS_ENV in Deploy Files ([#554](https://github.com/basecamp/fizzy/pull/554), [#584](https://github.com/basecamp/fizzy/pull/584))

```yaml
# config/deploy.production.yml
env:
  clear:
    RAILS_ENV: production

# config/deploy.beta.yml
env:
  clear:
    RAILS_ENV: beta
```

**Why it matters:**
- Makes environment explicit in deployment config
- Prevents environment confusion
- Clear documentation of which environment you're deploying to

### Environment Files Inherit from Production ([#554](https://github.com/basecamp/fizzy/pull/554), [#584](https://github.com/basecamp/fizzy/pull/584))

```ruby
# config/environments/beta.rb
require_relative "production"

Rails.application.configure do
  config.action_mailer.default_url_options = {
    host: "%{tenant}.37signals.works"
  }
end
```

```ruby
# config/environments/staging.rb
require_relative "production"

Rails.application.configure do
  config.action_mailer.default_url_options = {
    host: "%{tenant}.fizzy.37signals-staging.com"
  }
end
```

**Why it matters:**
- Production settings are the default
- Only override what's different
- Reduces configuration drift
- Beta/staging get all production optimizations by default

## Test Environment Handling

### Avoid Requiring Credentials in Tests ([#647](https://github.com/basecamp/fizzy/pull/647))

```ruby
# Bad - requires encrypted credentials to run tests
http_basic_authenticate_with(
  name: Rails.application.credentials.account_signup_http_basic_auth.name,
  password: Rails.application.credentials.account_signup_http_basic_auth.password
)

# Good - fallback for test environment
http_basic_authenticate_with(
  name: Rails.env.test? ? "testname" :
    Rails.application.credentials.account_signup_http_basic_auth.name,
  password: Rails.env.test? ? "testpassword" :
    Rails.application.credentials.account_signup_http_basic_auth.password
)
```

**Why it matters:**
- Tests run without encrypted credentials
- Faster CI setup - no credential decryption needed
- Developers can run tests immediately after checkout

## Environment Variable Precedence

### ENV Takes Priority Over Config ([#1976](https://github.com/basecamp/fizzy/pull/1976))

```ruby
# Bad - config.x can't be overridden
config.x.content_security_policy.report_uri ||= ENV["CSP_REPORT_URI"]

# Good - ENV has precedence
report_uri = ENV.fetch("CSP_REPORT_URI") {
  config.x.content_security_policy.report_uri
}
```

**Why it matters:**
- Environment variables win over configuration
- Enables runtime overrides without code changes
- Clearer intent: "presence of ENV → use it"
- Better for containerized deployments

### Consistent Pattern for Boolean ENV Vars ([#1976](https://github.com/basecamp/fizzy/pull/1976))

```ruby
# Check for key presence first, then parse value
report_only = if ENV.key?("CSP_REPORT_ONLY")
  ENV["CSP_REPORT_ONLY"] == "true"
else
  config.x.content_security_policy.report_only
end
```

**Why it matters:**
- Distinguishes between "not set" and "set to false"
- Prevents `ENV["CSP_REPORT_ONLY"]` being nil and defaulting incorrectly
- Explicit about which source is being used

## Development Environment Configuration

### Feature Flags for Local Development ([#863](https://github.com/basecamp/fizzy/pull/863))

```ruby
# Bad - conditional association breaks test/dev
unless Rails.application.config.x.local_authentication
  belongs_to :signal_account, optional: true
end

# Good - always define, conditionally use
belongs_to :signal_account, optional: true
```

**Why it matters:**
- Avoid conditional model definitions
- Tests and development work the same way
- Feature flags control behavior, not structure

### Development Scripts for Flexibility ([#863](https://github.com/basecamp/fizzy/pull/863))

Create helper scripts for common dev tasks:

```ruby
# script/create-local-user.rb
#!/usr/bin/env ruby
require_relative "../config/environment"

unless Rails.env.development?
  puts "ERROR: This script is intended for development only."
  exit 1
end

# ... script logic
```

**Why it matters:**
- Scriptable development workflows
- Repeatable setup processes
- Self-documenting development tasks

### Smart Seed Data ([#863](https://github.com/basecamp/fizzy/pull/863))

```ruby
# db/seeds.rb
def create_tenant(name, bare: false)
  if bare
    # Simple tenant without external dependencies
    queenbee_id = Digest::SHA256.hexdigest(name)[0..8].to_i(16)
    Account.create(name: name, queenbee_id: queenbee_id)
  else
    # Full tenant with external integrations
    signal_account = SignalId::Account.find_by_product_and_name!("fizzy", name)
    Account.create_with_admin_user(queenbee_id: signal_account.queenbee_id)
  end
end

# Create "cleanslate" minimal tenant
create_tenant "cleanslate", bare: true
# Create full-featured tenants
create_tenant "production-like"
```

**Why it matters:**
- Support both minimal and full development setups
- Work offline with `bare: true` tenants
- Test different data scenarios easily

### Dynamic Development Output ([#863](https://github.com/basecamp/fizzy/pull/863))

```bash
# bin/dev - shows available tenants dynamically
bin/rails runner - <<EOF
  ApplicationRecord.with_each_tenant do |tenant|
    puts "  - #{Account.sole.name}: http://localhost:3006/#{tenant}"
  end
EOF
```

**Why it matters:**
- Always shows current state
- Self-documenting setup
- No stale documentation

## Kamal Deployment Configuration

### Kamal Secrets Pattern ([#554](https://github.com/basecamp/fizzy/pull/554))

```bash
# .kamal/secrets.production
SECRETS=$(kamal secrets fetch --adapter 1password \
  --account basecamp \
  --from Deploy/AppName/BASECAMP_REGISTRY_PASSWORD \
         Production/RAILS_MASTER_KEY)

GITHUB_TOKEN=$(gh config get -h github.com oauth_token)
BASECAMP_REGISTRY_PASSWORD=$(kamal secrets extract BASECAMP_REGISTRY_PASSWORD $SECRETS)
RAILS_MASTER_KEY=$(kamal secrets extract RAILS_MASTER_KEY $SECRETS)
```

**Why it matters:**
- All secrets in one place (1Password)
- Single fetch operation
- Environment-specific secret files
- Combines multiple secret sources (1Password + gh)

### Environment-Specific Deploy Files ([#554](https://github.com/basecamp/fizzy/pull/554), [#584](https://github.com/basecamp/fizzy/pull/584))

```
config/deploy.yml          # Base configuration
config/deploy.beta.yml     # Beta overrides
config/deploy.staging.yml  # Staging overrides
config/deploy.production.yml # Production overrides
```

**Why it matters:**
- Different servers per environment
- Different accessory configurations
- Environment-specific SSL/proxy settings
- Clear separation of deployment concerns

### Kamal Aliases ([#554](https://github.com/basecamp/fizzy/pull/554))

```yaml
# config/deploy.yml
aliases:
  console: app exec -i --reuse "bin/rails console"
  ssh: app exec -i --reuse /bin/bash
```

**Why it matters:**
- Shortcuts for common commands
- Consistent across team
- Self-documenting deployment operations
- `kamal console -d production` instead of long exec commands

## Configuration Organization Principles

#### 1. Default to Production Settings
Beta, staging inherit from production unless they need differences.

#### 2. ENV Variables Beat Config Files
Runtime configuration wins over compile-time configuration.

#### 3. One Secret Per Environment
Use `RAILS_MASTER_KEY` to unlock environment-specific credentials.

#### 4. Make Tests Self-Contained
Tests shouldn't require external secrets or services.

#### 5. Development Should Be Flexible
Support both minimal (bare) and full-featured local environments.
