# Authentication Patterns

> Passwordless magic links without Devise - ~150 lines of custom code.

---

## Why Not Devise?

Devise is powerful but heavyweight. For passwordless auth, custom code is simpler:
- No password storage complexity
- No password reset flows
- Fewer dependencies
- Full control over the flow

## Magic Link Flow

```
1. User enters email
2. Server generates 6-digit code, emails it
3. User enters code on verification page
4. Server validates code, creates session
```

## Identity Model

Separate global identity from per-account users:

```ruby
class Identity < ApplicationRecord
  has_many :access_tokens, dependent: :destroy
  has_many :magic_links, dependent: :destroy
  has_many :sessions, dependent: :destroy
  has_many :users, dependent: :nullify
  has_many :accounts, through: :users

  validates :email_address, format: { with: URI::MailTo::EMAIL_REGEXP }
  normalizes :email_address, with: ->(value) { value.strip.downcase.presence }

  def self.find_by_permissable_access_token(token, method:)
    if (access_token = AccessToken.find_by(token: token)) && access_token.allows?(method)
      access_token.identity
    end
  end

  def send_magic_link(**attributes)
    magic_links.create!(attributes).tap do |magic_link|
      MagicLinkMailer.sign_in_instructions(magic_link).deliver_later
    end
  end
end
```

## MagicLink Model

A separate model for magic link codes with automatic expiration and cleanup:

```ruby
class MagicLink < ApplicationRecord
  CODE_LENGTH = 6
  EXPIRATION_TIME = 15.minutes

  belongs_to :identity

  enum :purpose, %w[ sign_in sign_up ], prefix: :for, default: :sign_in

  scope :active, -> { where(expires_at: Time.current...) }
  scope :stale, -> { where(expires_at: ..Time.current) }

  before_validation :generate_code, on: :create
  before_validation :set_expiration, on: :create

  validates :code, uniqueness: true, presence: true

  class << self
    def consume(code)
      active.find_by(code: Code.sanitize(code))&.consume
    end

    def cleanup
      stale.delete_all
    end
  end

  def consume
    destroy
    self
  end

  private
    def generate_code
      self.code ||= loop do
        candidate = Code.generate(CODE_LENGTH)
        break candidate unless self.class.exists?(code: candidate)
      end
    end

    def set_expiration
      self.expires_at ||= EXPIRATION_TIME.from_now
    end
end
```

**Why a separate model?** Codes can be cleaned up independently, tracked for abuse, and support different purposes (sign-in vs sign-up).

## Session Model

```ruby
class Session < ApplicationRecord
  belongs_to :identity
end
```

## Authentication Concern

The full concern with class-level DSL methods for controller configuration:

```ruby
module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_account
    before_action :require_authentication
    helper_method :authenticated?
  end

  class_methods do
    # For login/signup pages - redirect if already logged in
    def require_unauthenticated_access(**options)
      allow_unauthenticated_access **options
      before_action :redirect_authenticated_user, **options
    end

    # For public pages that optionally show user info
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
      before_action :resume_session, **options
    end

    # For non-tenanted pages (login, account selector)
    def disallow_account_scope(**options)
      skip_before_action :require_account, **options
      before_action :redirect_tenanted_request, **options
    end
  end

  private
    def authenticated?
      Current.identity.present?
    end

    def require_authentication
      resume_session || authenticate_by_bearer_token || request_authentication
    end

    def resume_session
      if session = find_session_by_cookie
        set_current_session session
      end
    end

    def find_session_by_cookie
      Session.find_signed(cookies.signed[:session_token])
    end

    def authenticate_by_bearer_token
      if request.authorization.to_s.include?("Bearer")
        authenticate_or_request_with_http_token do |token|
          if identity = Identity.find_by_permissable_access_token(token, method: request.method)
            Current.identity = identity
          end
        end
      end
    end

    def request_authentication
      session[:return_to_after_authenticating] = request.url if Current.account.present?
      redirect_to_login_url
    end

    def start_new_session_for(identity)
      identity.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
        set_current_session session
      end
    end

    def set_current_session(session)
      Current.session = session
      cookies.signed.permanent[:session_token] = { value: session.signed_id, httponly: true, same_site: :lax }
    end

    def terminate_session
      Current.session.destroy
      cookies.delete(:session_token)
    end

    def redirect_authenticated_user
      redirect_to main_app.root_url if authenticated?
    end
end
```

**Key patterns**:
- Class methods create a DSL for controllers: `require_unauthenticated_access`, `allow_unauthenticated_access`, `disallow_account_scope`
- Authentication cascade: cookie session → bearer token → redirect to login
- Multi-tenant aware: stores return URL only when account context exists

## Sessions Controller

```ruby
class SessionsController < ApplicationController
  disallow_account_scope
  require_unauthenticated_access except: :destroy
  rate_limit to: 10, within: 3.minutes, only: :create,
    with: -> { redirect_to new_session_path, alert: "Try again later." }

  def create
    if identity = Identity.find_by_email_address(email_address)
      redirect_to_session_magic_link identity.send_magic_link
    else
      # Handle signup flow...
    end
  end

  def destroy
    terminate_session
    redirect_to_logout_url
  end

  private
    def email_address
      params.expect(:email_address)
    end
end
```

## Magic Link Controller

```ruby
class Sessions::MagicLinksController < ApplicationController
  disallow_account_scope
  require_unauthenticated_access
  rate_limit to: 10, within: 15.minutes, only: :create,
    with: -> { redirect_to session_magic_link_path, alert: "Wait 15 minutes, then try again" }

  def show
    # Renders code entry form
  end

  def create
    if magic_link = MagicLink.consume(code)
      authenticate_with magic_link
    else
      redirect_to session_magic_link_path, flash: { shake: true }
    end
  end

  private
    def authenticate_with(magic_link)
      if email_address_pending_authentication_matches?(magic_link.identity.email_address)
        start_new_session_for magic_link.identity
        redirect_to after_sign_in_url(magic_link)
      else
        redirect_to new_session_path, alert: "Authentication failed. Please try again."
      end
    end

    def after_sign_in_url(magic_link)
      magic_link.for_sign_up? ? new_signup_completion_path : after_authentication_url
    end

    def code
      params.expect(:code)
    end
end
```

**Security detail**: The email entered on the login page is stored in session and must match the magic link's identity email. This prevents code interception attacks.

## Magic Link Mailer

```ruby
class MagicLinkMailer < ApplicationMailer
  def sign_in_instructions(magic_link)
    @magic_link = magic_link
    @identity = @magic_link.identity

    mail to: @identity.email_address, subject: "Your Fizzy code is #{@magic_link.code}"
  end
end
```

**Why code in subject?** Users can authenticate from any device—see code in email notification, type it on the device where they're logging in.

## Current Context

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :session, :user, :identity, :account
  attribute :user_agent, :ip_address

  def user=(user)
    super
    self.identity = user&.identity
    self.account = user&.account
  end
end
```

## Multi-Account Support

Users can belong to multiple accounts via the same identity:

```ruby
class User < ApplicationRecord
  belongs_to :identity
  belongs_to :account

  # Same person, different accounts
  # identity.users.count > 1
end
```

## Session Path Scoping

For multi-tenant apps, scope session cookie to account path:

```ruby
cookies.signed.permanent[:session_token] = {
  value: session.signed_id,
  path: "/#{account.external_id}"  # e.g., "/1234567"
}
```

**Why**: Allows simultaneous login to multiple accounts without cookie conflicts.

## Development Convenience

Show magic link code in flash for local development:

```ruby
def serve_development_magic_link(magic_link)
  if Rails.env.development?
    flash[:magic_link_code] = magic_link&.code
  end
end

def ensure_development_magic_link_not_leaked
  unless Rails.env.development?
    raise "Leaking magic link via flash in #{Rails.env}?" if flash[:magic_link_code].present?
  end
end
```

**Safety net**: The `after_action` callback raises in non-development environments if the code accidentally leaks.

## Key Principles

1. **Passwordless is simpler** - No password storage, reset flows, or breach liability
2. **Rate limit aggressively** - Prevent email bombing (10 requests per 3-15 minutes)
3. **Verify email matches** - Store pending email in session, verify against magic link
4. **Separate model for codes** - Enables cleanup, abuse tracking, multiple purposes
5. **Separate identity from user** - One person, many accounts
6. **Class-level DSL** - `require_unauthenticated_access`, `allow_unauthenticated_access`, `disallow_account_scope` make controller setup declarative
