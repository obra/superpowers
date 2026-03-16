# Email

> Multi-tenant mailers and timezone handling.

---

## Multi-Tenant URL Helpers in Mailers

**Pattern**: Override `default_url_options` in ApplicationMailer to inject tenant context into all email URLs.

```ruby
# app/mailers/application_mailer.rb
class ApplicationMailer < ActionMailer::Base
  private
    def default_url_options
      if Current.account
        super.merge(script_name: Current.account.slug)
      else
        super
      end
    end
end
```

**Environment Configuration** (from PR [#314](https://github.com/basecamp/fizzy/pull/314)):
```ruby
# config/environments/production.rb
config.action_mailer.default_url_options = { host: "%{tenant}.example.com" }

# config/environments/development.rb
config.action_mailer.default_url_options = { host: "%{tenant}.example.com", port: 3000 }

# config/environments/test.rb
config.action_mailer.default_url_options = { host: "example.com" }
```

**Why it matters**:
- In multi-tenant apps, URLs in emails must point to the correct tenant
- Centralizing this logic prevents scattered tenant-handling code across mailers
- The `%{tenant}` placeholder works with ActiveRecord::Tenanted gem integration

**From**: PR [#314](https://github.com/basecamp/fizzy/pull/314) (Configure tenanted Action Mailer URL helpers)

---

## 2. User Timezone Awareness in Email Delivery

**Pattern**: Wrap email delivery in the recipient's timezone context to ensure all timestamps render correctly.

```ruby
# app/models/notification/bundle.rb
def deliver
  user.in_time_zone do
    Current.with_account(user.account) do
      processing!
      Notification::BundleMailer.notification(self).deliver if deliverable?
      delivered!
    end
  end
end

# app/models/user/configurable.rb
def in_time_zone(&block)
  Time.use_zone(timezone, &block)
end
```

**Test Coverage** (from PR [#1326](https://github.com/basecamp/fizzy/pull/1326)):
```ruby
test "deliver sends email with time in user's time zone" do
  @user.settings.update!(timezone_name: "Madrid")

  freeze_time Time.utc(2025, 1, 15, 14, 30, 0) do
    @user.notifications.create!(source: events(:logo_published), creator: @user)
    bundle = @user.notification_bundles.pending.last
    bundle.deliver

    email = ActionMailer::Base.deliveries.last
    assert_not_nil email

    # Time in Madrid should be 15:30 (UTC+1 in winter)
    assert_match /everything since 3pm/i, email.text_part&.body&.to_s
  end
end
```

**Why it matters**:
- Email timestamps must be in the recipient's timezone, not server time
- Affects relative time displays like "since 3pm" or "yesterday at 2:30pm"
- `Time.use_zone` creates a block-scoped timezone context
- Tests should verify timezone handling with actual timezone calculations

**From**: PR [#1326](https://github.com/basecamp/fizzy/pull/1326) (Fix: use user timezone when delivering notification emails)

---

## 3. SVG Fallbacks for Email Avatars

**Pattern**: Replace SVG images with HTML/CSS equivalents since most email clients don't support SVG.

```ruby
# app/helpers/avatars_helper.rb
def mail_avatar_tag(user, size: 48, **options)
  if user.avatar.attached?
    image_tag user_avatar_url(user), alt: user.name, class: "avatar", size: size, **options
  else
    tag.span class: "avatar", style: "background-color: #{avatar_background_color(user)};" do
      user.initials
    end
  end
end

def avatar_background_color(user)
  AVATAR_COLORS[Zlib.crc32(user.to_param) % AVATAR_COLORS.size]
end
```

**Email Layout CSS** (from PR [#1525](https://github.com/basecamp/fizzy/pull/1525)):
```css
.avatar {
  border-radius: 50%;
  color: white;
  display: block;
  font-weight: 600;
  height: 2.75em;
  line-height: 2.75em;
  mso-line-height-rule: exactly;  /* Outlook-specific */
  overflow: hidden;
  text-align: center;
  width: 2.75em;
}
```

**Test Coverage**:
```ruby
test "renders avatar with initials in span when avatar is not attached" do
  email = Notification::BundleMailer.notification(@bundle)

  assert_match /<span[^>]*class="avatar"[^>]*>/, email.html_part.body.to_s
  assert_match /#{@user.initials}/, email.html_part.body.to_s
  assert_match /style="background-color: #[A-F0-9]{6};?"/, email.html_part.body.to_s
end

test "renders avatar with external image URL when avatar is attached" do
  @user.avatar.attach(
    io: File.open(Rails.root.join("test", "fixtures", "files", "avatar.png")),
    filename: "avatar.png",
    content_type: "image/png"
  )

  email = Notification::BundleMailer.notification(@bundle)

  assert_match /<img[^>]*class="avatar"[^>]*>/, email.html_part.body.to_s
  assert_match /<img[^>]*class="avatar"[^>]*src="[^"]*"/, email.html_part.body.to_s
end
```

**Why it matters**:
- Gmail, Outlook, Apple Mail all block SVG images for security
- Text-based initials with colored backgrounds provide graceful degradation
- Using CRC32 hash ensures consistent colors per user
- Tests should verify both HTML structure and inline styles
- Even HEY (37signals' email service) doesn't support SVG

**From**: PR [#1525](https://github.com/basecamp/fizzy/pull/1525) (Render SVG avatars with regular HTML in emails)

---

## 4. Environment-Based SMTP Configuration

**Pattern**: Configure SMTP via environment variables for flexibility across deployments.

```ruby
# config/environments/production.rb
if smtp_address = ENV["SMTP_ADDRESS"].presence
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = {
    address: smtp_address,
    port: ENV.fetch("SMTP_PORT", ENV["SMTP_TLS"] == "true" ? "465" : "587").to_i,
    domain: ENV.fetch("SMTP_DOMAIN", nil),
    user_name: ENV.fetch("SMTP_USERNAME", nil),
    password: ENV.fetch("SMTP_PASSWORD", nil),
    authentication: ENV.fetch("SMTP_AUTHENTICATION", "plain"),
    tls: ENV["SMTP_TLS"] == "true",
    openssl_verify_mode: ENV["SMTP_SSL_VERIFY_MODE"]
  }
end
```

**Environment Variables**:
- `SMTP_ADDRESS`: Required - SMTP server hostname
- `SMTP_PORT`: Defaults to 587 (or 465 if TLS enabled)
- `SMTP_DOMAIN`: Optional - sending domain
- `SMTP_USERNAME`: SMTP auth username
- `SMTP_PASSWORD`: SMTP auth password
- `SMTP_AUTHENTICATION`: Defaults to "plain"
- `SMTP_TLS`: Set to "true" for port 465 TLS
- `SMTP_SSL_VERIFY_MODE`: SSL verification mode

**Why it matters**:
- No hardcoded SMTP settings in version control
- Easy to switch between Sendmail (default) and SMTP
- Works with any SMTP provider (Sendgrid, Postmark, Mailgun, etc.)
- Smart defaults reduce required configuration
- Conditional setup means SMTP is opt-in via environment

**From**: PR [#1911](https://github.com/basecamp/fizzy/pull/1911) (Configure email delivery in production using environment variables)

---

## 5. SMTP Delivery Error Handling

**Pattern**: Add targeted retry and rescue logic to ActionMailer's delivery job for graceful SMTP error handling.

```ruby
# app/jobs/concerns/smtp_delivery_error_handling.rb
module SmtpDeliveryErrorHandling
  extend ActiveSupport::Concern

  included do
    # Retry delivery to possibly-unavailable remote mailservers.
    retry_on Net::OpenTimeout, Net::ReadTimeout, Socket::ResolutionError,
             wait: :polynomially_longer

    # Net::SMTPServerBusy is SMTP error code 4xx, a temporary error.
    # Common: 452 4.3.1 Insufficient system storage.
    retry_on Net::SMTPServerBusy, wait: :polynomially_longer

    # SMTP error 50x.
    rescue_from Net::SMTPSyntaxError do |error|
      case error.message
      when /\A501 5\.1\.3/
        # Ignore undeliverable email addresses.
        Sentry.capture_exception error, level: :info
      else
        raise
      end
    end

    # SMTP error 5xx except 50x and 53x.
    # * 550 5.1.1: Unknown users
    # * 552 5.6.0: Message/headers too large
    rescue_from Net::SMTPFatalError do |error|
      case error.message
      when /\A550 5\.1\.1/, /\A552 5\.6\.0/, /\A555 5\.5\.4/
        Sentry.capture_exception error, level: :info
      else
        raise
      end
    end
  end
end

# lib/rails_ext/action_mailer_mail_delivery_job.rb
Rails.application.config.to_prepare do
  ActionMailer::MailDeliveryJob.include SmtpDeliveryErrorHandling
end
```

**Why it matters**:
- Network issues (timeouts, DNS failures) are transient - retry automatically
- 4xx SMTP errors are temporary (mailbox full, rate limits) - retry with backoff
- 5xx SMTP errors for bad addresses shouldn't crash jobs - log and continue
- `polynomially_longer` wait provides exponential backoff
- Pattern matching on error messages allows granular handling
- Inclusion in `ActionMailer::MailDeliveryJob` applies to all mailers globally
- Reduces noise in error tracking by demoting expected errors to info level

**From**: Multiple PRs (implementation found in codebase)

---

## 6. Batch Email Delivery with ActiveJob.perform_all_later

**Pattern**: Use `perform_all_later` to enqueue multiple email delivery jobs efficiently in a single database transaction.

```ruby
# app/models/notification/bundle.rb
class Notification::Bundle < ApplicationRecord
  class << self
    def deliver_all
      due.in_batches do |batch|
        jobs = batch.collect { DeliverJob.new(it) }
        ActiveJob.perform_all_later jobs
      end
    end

    def deliver_all_later
      DeliverAllJob.perform_later
    end
  end

  scope :due, -> { pending.where("ends_at <= ?", Time.current) }
end

# Triggered via recurring job
# config/recurring.yml
deliver_bundled_notifications:
  schedule: "every 30 minutes"
  command: "Notification::Bundle.deliver_all_later"
```

**Why it matters**:
- `perform_all_later` (Rails 7.1+) enqueues jobs in bulk with a single DB insert
- Much faster than calling `perform_later` in a loop (N+1 inserts)
- Essential for high-volume email delivery
- Works seamlessly with Solid Queue (database-backed queue)
- Combine with `in_batches` to avoid loading entire dataset
- Separate "schedule job" from "do work" for better observability

**From**: PR patterns (implementation found in codebase)

---

## 7. One-Click Unsubscribe Headers

**Pattern**: Add RFC 8058 compliant List-Unsubscribe headers for one-click unsubscribe support.

```ruby
# app/mailers/concerns/mailers/unsubscribable.rb
module Mailers::Unsubscribable
  extend ActiveSupport::Concern

  included do
    after_action :set_unsubscribe_headers
  end

  def set_unsubscribe_headers
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
    headers["List-Unsubscribe"] = "<#{notifications_unsubscribe_url(access_token: @unsubscribe_token)}>"
  end
end

# app/mailers/notification/bundle_mailer.rb
class Notification::BundleMailer < ApplicationMailer
  include Mailers::Unsubscribable

  def notification(bundle)
    @user = bundle.user
    @unsubscribe_token = @user.generate_token_for(:unsubscribe)
    # ...
  end
end
```

**Why it matters**:
- Gmail/Outlook show one-click unsubscribe button when both headers present
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click` signals RFC 8058 support
- `List-Unsubscribe` header contains the unsubscribe URL
- Use signed tokens (Rails `generate_token_for`) for security
- Extract to concern for reuse across notification mailers
- Improves deliverability by reducing spam complaints

**From**: Implementation found in codebase

---

## 8. Email Layout Best Practices

**Pattern**: Use inline styles with email-client-specific hacks for maximum compatibility.

```erb
<!-- app/views/layouts/mailer.html.erb -->
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
      html {
        -ms-text-size-adjust: 100%;      /* IE text size */
        -webkit-text-size-adjust: 100%;  /* iOS text size */
      }

      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 1rem;
      }

      .avatar {
        line-height: 2.5em;
        mso-line-height-rule: exactly;  /* Outlook line-height fix */
      }

      table, td {
        border-collapse: collapse;      /* Prevent spacing issues */
      }

      #body {
        height: 100% !important;
        margin: 0;
        padding: 0;
        width: 100% !important;
      }
    </style>
  </head>
  <body>
    <table id="body">
      <%= yield %>
    </table>
  </body>
</html>
```

**Why it matters**:
- Email clients strip `<style>` tags (especially Gmail) - use inline styles for critical CSS
- `mso-line-height-rule: exactly` fixes Outlook's line-height rendering
- Table-based layouts still most reliable for cross-client compatibility
- System fonts (`system-ui`) work well across platforms
- `!important` needed to override client defaults
- Keep it simple - complex CSS will break

**From**: PR [#1067](https://github.com/basecamp/fizzy/pull/1067) (Further polish mailer styles and type hierarchy)

---

## 9. Mailer Previews for Multi-Tenant Apps

**Pattern**: Set tenant context in mailer previews for realistic rendering.

```ruby
# test/mailers/previews/notification/bundle_mailer_preview.rb
class Notification::BundleMailerPreview < ActionMailer::Preview
  def notification
    bundle = Notification::Bundle.all.sample
    Current.account = bundle.account  # Set tenant context
    Notification::BundleMailer.notification bundle
  end
end
```

**Why it matters**:
- Mailer previews need tenant context for URL generation
- Setting `Current.account` ensures URLs include tenant prefix
- Use `.sample` or specific fixtures for consistent previews
- Preview in development via `/rails/mailers/notification/bundle_mailer/notification`
- Catches multi-tenant bugs before production

**From**: PR [#314](https://github.com/basecamp/fizzy/pull/314) and implementation in codebase

---

## 10. Testing Email Content and Structure

**Pattern**: Test both text content and HTML structure with regex assertions.

```ruby
# test/mailers/notification/bundle_mailer_test.rb
class Notification::BundleMailerTest < ActionMailer::TestCase
  test "includes expected content and structure" do
    email = Notification::BundleMailer.notification(@bundle)

    # Test HTML structure
    assert_match /<span[^>]*class="avatar"[^>]*>/, email.html_part.body.to_s
    assert_match /style="background-color: #[A-F0-9]{6};?"/, email.html_part.body.to_s

    # Test text content
    assert_match /everything since 3pm/i, email.text_part&.body&.to_s

    # Test headers
    assert_equal "user@example.com", email.to.first
    assert_match /New notifications/, email.subject
  end

  test "deliveries array accumulates sent emails" do
    assert_difference "ActionMailer::Base.deliveries.count", 1 do
      @bundle.deliver
    end

    email = ActionMailer::Base.deliveries.last
    assert_not_nil email
  end
end
```

**Test Environment Config**:
```ruby
# config/environments/test.rb
config.action_mailer.delivery_method = :test
config.action_mailer.default_url_options = { host: "example.com" }
```

**Why it matters**:
- `:test` delivery method captures emails in `ActionMailer::Base.deliveries` array
- Test HTML structure with regex to catch rendering bugs
- Test text content to verify timezone/localization handling
- Verify both `html_part` and `text_part` for multipart emails
- Use `assert_difference` to verify delivery actually happened
- Mock file attachments (avatars) with fixture files in `test/fixtures/files/`

**From**: PR [#1525](https://github.com/basecamp/fizzy/pull/1525) and [#1326](https://github.com/basecamp/fizzy/pull/1326) (test implementations)

---

## Summary: Key Takeaways

1. **Multi-tenancy**: Override `default_url_options` in ApplicationMailer for tenant-aware URLs
2. **Timezones**: Wrap delivery in user's timezone context (`Time.use_zone`) for correct timestamps
3. **Email Client Limits**: Replace SVG with HTML/CSS; use inline styles; test in real clients
4. **Resilience**: Add SMTP error handling with retries for transient failures
5. **Performance**: Use `ActiveJob.perform_all_later` for bulk email delivery
6. **UX**: Add one-click unsubscribe headers for better deliverability
7. **Configuration**: Use environment variables for SMTP settings
8. **Testing**: Verify HTML structure, content, and timezone handling with comprehensive tests
9. **Previews**: Set tenant context in mailer previews for accurate rendering
10. **Simplicity**: Keep email layouts simple - what works in browsers often breaks in email

All patterns are production-tested in Fizzy, a multi-tenant Rails app handling real-world email delivery at scale.
