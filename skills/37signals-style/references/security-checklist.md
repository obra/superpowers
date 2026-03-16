# Security Checklist

> Security patterns and gotchas from 37signals.

---

## XSS Prevention

### Always Escape Before `html_safe`
```ruby
# Bad
"<span>#{user_input}</span>".html_safe

# Good
"<span>#{h(user_input)}</span>".html_safe
```

Escape in helpers, not views ([#1114](https://github.com/basecamp/fizzy/pull/1114)).

## CSRF Protection

### Don't HTTP Cache Pages With Forms
CSRF tokens get stale → 422 errors on form submit ([#1607](https://github.com/basecamp/fizzy/pull/1607))

### Sec-Fetch-Site Header
Additional CSRF check using browser's `Sec-Fetch-Site` header:
1. Report mode first to observe ([#1721](https://github.com/basecamp/fizzy/pull/1721))
2. Enforce after validation ([#1751](https://github.com/basecamp/fizzy/pull/1751))

Defense in depth - use alongside traditional tokens.

## SSRF (Server-Side Request Forgery)

For webhooks and any user-provided URLs:

### DNS Rebinding Protection ([#1903](https://github.com/basecamp/fizzy/pull/1903))
```ruby
# Resolve DNS once, pin the IP
resolved_ip = resolve_dns(url)
# Use pinned IP for request
Net::HTTP.new(host, port, ipaddr: resolved_ip)
```

### Block Private Networks ([#1905](https://github.com/basecamp/fizzy/pull/1905))
- Loopback (127.0.0.0/8)
- Private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Link-local (169.254.0.0/16) - AWS metadata!
- IPv4-mapped IPv6

### Validate Twice
Check at creation time AND request time.

## ActionText / Rich Text

### Sanitizer Config ([#873](https://github.com/basecamp/fizzy/pull/873))
```ruby
# In after_initialize - eager loading bypasses config otherwise
ActionText::ContentHelper.allowed_tags = ...
ActionText::ContentHelper.allowed_attributes = ...
```

### Remote Images ([#1859](https://github.com/basecamp/fizzy/pull/1859))
```ruby
# Use skip_pipeline for external URLs
image_tag url, skip_pipeline: true
```
Asset pipeline can't process arbitrary external URLs.

## Multi-tenancy

### Scope Broadcasts ([#1800](https://github.com/basecamp/fizzy/pull/1800))
```ruby
# Bad - leaks across tenants
broadcast_to :all_boards

# Good - scoped by account
broadcast_to [account, :all_boards]
```

### Disconnect Deactivated Users ([#1810](https://github.com/basecamp/fizzy/pull/1810))
```ruby
ActionCable.server.remote_connections
  .where(current_user: self)
  .disconnect(reconnect: false)
```

## Content Security Policy ([#1964](https://github.com/basecamp/fizzy/pull/1964))

```ruby
# config/initializers/content_security_policy.rb
config.content_security_policy do |policy|
  policy.script_src :self
  policy.style_src :self, :unsafe_inline
  policy.base_uri :none
  policy.form_action :self
  policy.frame_ancestors :self
  policy.report_uri ENV["CSP_REPORT_URI"] if ENV["CSP_REPORT_URI"]
end

config.content_security_policy_report_only = ENV["CSP_REPORT_ONLY"] == "true"
```

Use nonce-based script loading for importmap support.

## Sec-Fetch-Site as CSRF Fallback ([#1721](https://github.com/basecamp/fizzy/pull/1721), [#1751](https://github.com/basecamp/fizzy/pull/1751))

```ruby
def verified_request?
  super || safe_fetch_site?
end

def safe_fetch_site?
  %w[same-origin same-site].include?(
    request.headers["Sec-Fetch-Site"]&.downcase
  )
end
```

Add `Sec-Fetch-Site` to Vary header for proper caching.

## Rate Limiting ([#1304](https://github.com/basecamp/fizzy/pull/1304))

Use Rails 7.2+ built-in rate limiting for auth endpoints:

```ruby
class Sessions::MagicLinksController < ApplicationController
  rate_limit to: 10, within: 15.minutes, only: :create,
    with: -> { redirect_to session_magic_link_path,
               alert: "Try again in 15 minutes." }
end

class Memberships::EmailAddressesController < ApplicationController
  rate_limit to: 5, within: 1.hour, only: :create
end
```

**When to rate limit**:
- Authentication actions (login, magic links, password resets)
- Email sending endpoints
- External API calls
- Resource creation endpoints

## Authorization Patterns ([#1083](https://github.com/basecamp/fizzy/pull/1083))

Use controller concerns for consistent authorization:

```ruby
module Authorization
  extend ActiveSupport::Concern

  included do
    before_action :ensure_can_access_account, if: -> {
      ApplicationRecord.current_tenant && Current.session
    }
  end

  private
    def ensure_can_administer
      head :forbidden unless Current.user.admin?
    end

    def ensure_is_staff_member
      head :forbidden unless Current.user.staff?
    end
end

# In controllers
class WebhooksController < ApplicationController
  before_action :ensure_can_administer
end
```

Simple, readable, follows existing conventions.
