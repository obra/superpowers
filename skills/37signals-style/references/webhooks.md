# Webhooks

> SSRF protection, delinquency tracking, and state machines.

---

## SSRF Protection

**PR:** [#1196](https://github.com/basecamp/fizzy/pull/1196)

### The Pattern

Prevent Server-Side Request Forgery (SSRF) attacks by:
1. Resolving DNS to IP addresses upfront
2. Blocking private/internal IP ranges
3. Pinning the resolved IP for the actual HTTP request

### Why It Matters

Webhooks are user-controlled URLs. Without protection, attackers can:
- Access internal services (AWS metadata, internal APIs)
- Perform DNS rebinding attacks (hostname resolves to public IP during validation, private IP during request)
- Scan internal networks

### Implementation

```ruby
# app/models/ssrf_protection.rb
module SsrfProtection
  extend self

  DNS_RESOLUTION_TIMEOUT = 2

  DNS_NAMESERVERS = %w[
    1.1.1.1
    8.8.8.8
  ]

  DISALLOWED_IP_RANGES = [
    IPAddr.new("0.0.0.0/8"),     # "This" network (RFC1700)
    IPAddr.new("100.64.0.0/10"), # Carrier-grade NAT (RFC6598)
    IPAddr.new("198.18.0.0/15")  # Benchmark testing (RFC2544)
  ].freeze

  def resolve_public_ip(hostname)
    ip_addresses = resolve_dns(hostname)
    public_ips = ip_addresses.reject { |ip| private_address?(ip) }
    public_ips.sort_by { |ipaddr| ipaddr.ipv4? ? 0 : 1 }.first&.to_s
  end

  def private_address?(ip)
    ip = IPAddr.new(ip.to_s) unless ip.is_a?(IPAddr)
    ip.private? || ip.loopback? || ip.link_local? || ip.ipv4_mapped? || in_disallowed_range?(ip)
  end

  private
    def resolve_dns(hostname)
      ip_addresses = []

      Resolv::DNS.open(nameserver: DNS_NAMESERVERS, timeouts: DNS_RESOLUTION_TIMEOUT) do |dns|
        dns.each_address(hostname) do |ip_address|
          ip_addresses << IPAddr.new(ip_address.to_s)
        end
      end

      ip_addresses
    end

    def in_disallowed_range?(ip)
      DISALLOWED_IP_RANGES.any? { |range| range.include?(ip) }
    end
end
```

**Key technique**: Pin the resolved IP to prevent DNS re-resolution:

```ruby
# In delivery logic
def resolved_ip
  return @resolved_ip if defined?(@resolved_ip)
  @resolved_ip = SsrfProtection.resolve_public_ip(uri.host)
end

def http
  Net::HTTP.new(uri.host, uri.port).tap do |http|
    http.ipaddr = resolved_ip  # Pin to resolved IP!
    http.use_ssl = (uri.scheme == "https")
    http.open_timeout = ENDPOINT_TIMEOUT
    http.read_timeout = ENDPOINT_TIMEOUT
  end
end
```

### Testing

```ruby
test "blocks DNS rebinding attack where hostname resolves to private IP after validation" do
  webhook = Webhook.create!(
    board: boards(:writebook),
    name: "Rebind Attack",
    url: "https://rebind.attacker.example/webhook"
  )
  event = events(:layout_commented)
  delivery = Webhook::Delivery.create!(webhook: webhook, event: event)

  # Stub DNS to return a private IP (simulating rebind to internal host)
  stub_dns_resolution("169.254.169.254") # AWS IMDS link-local address

  delivery.deliver

  assert_equal "completed", delivery.state
  assert_equal "private_uri", delivery.response[:error]
  assert_not delivery.succeeded?
end
```

---

## Delivery Pattern: Asynchronous with State Machine

**PR:** [#1196](https://github.com/basecamp/fizzy/pull/1196)

### The Pattern

Use a state machine to track webhook delivery lifecycle:
1. Create delivery record immediately (pending)
2. Enqueue background job
3. Track state transitions: pending → in_progress → completed/errored
4. Store request/response metadata

### Why It Matters

- **Auditability**: Full history of webhook attempts
- **Debugging**: See exactly what was sent and received
- **Resilience**: Jobs can fail/retry without losing delivery records
- **User visibility**: Show delivery status in UI

### Implementation

```ruby
# app/models/webhook/delivery.rb
class Webhook::Delivery < ApplicationRecord
  belongs_to :webhook
  belongs_to :event

  store :request, coder: JSON
  store :response, coder: JSON

  enum :state, %w[ pending in_progress completed errored ].index_by(&:itself), default: :pending

  after_create_commit :deliver_later

  def deliver_later
    Webhook::DeliveryJob.perform_later(self)
  end

  def deliver
    in_progress!

    self.request[:headers] = headers
    self.response = perform_request
    self.state = :completed
    save!

    webhook.delinquency_tracker.record_delivery_of(self)
  rescue
    errored!
    raise
  end

  def succeeded?
    completed? && response[:error].blank? && response[:code].between?(200, 299)
  end

  private
    def perform_request
      if resolved_ip.nil?
        { error: :private_uri }
      else
        request = Net::HTTP::Post.new(uri, headers).tap { |request| request.body = payload }
        response = http.request(request) { |net_http_response| stream_body_with_limit(net_http_response) }
        { code: response.code.to_i }
      end
    rescue ResponseTooLarge
      { error: :response_too_large }
    rescue Resolv::ResolvTimeout, Resolv::ResolvError, SocketError
      { error: :dns_lookup_failed }
    rescue Net::OpenTimeout, Net::ReadTimeout, Errno::ETIMEDOUT
      { error: :connection_timeout }
    rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH, Errno::ECONNRESET
      { error: :destination_unreachable }
    rescue OpenSSL::SSL::SSLError
      { error: :failed_tls }
    end
end
```

**Error handling strategy**: Catch specific network errors and store them as structured data, not exceptions.

---

## Retry Strategy: Delinquency Tracking

**PR:** [#1196](https://github.com/basecamp/fizzy/pull/1196)

### The Pattern

Instead of automatic retries, use a "delinquency tracker" that:
1. Counts consecutive failures
2. Tracks time since first failure
3. Auto-disables webhooks after threshold (10 failures over 1 hour)
4. Resets on any successful delivery

### Why It Matters

- **User control**: Don't silently retry forever
- **Resource protection**: Bad webhooks don't consume infinite job queue capacity
- **Clear feedback**: Users know when their webhook is broken
- **Self-healing**: Webhooks re-enable automatically when fixed

### Implementation

```ruby
# app/models/webhook/delinquency_tracker.rb
class Webhook::DelinquencyTracker < ApplicationRecord
  DELINQUENCY_THRESHOLD = 10
  DELINQUENCY_DURATION = 1.hour

  belongs_to :webhook

  def record_delivery_of(delivery)
    if delivery.succeeded?
      reset
    else
      mark_first_failure_time if consecutive_failures_count.zero?
      increment!(:consecutive_failures_count, touch: true)

      webhook.deactivate if delinquent?
    end
  end

  private
    def reset
      update_columns consecutive_failures_count: 0, first_failure_at: nil
    end

    def mark_first_failure_time
      update_columns first_failure_at: Time.current
    end

    def delinquent?
      failing_for_too_long? && too_many_consecutive_failures?
    end

    def failing_for_too_long?
      if first_failure_at
        first_failure_at.before?(DELINQUENCY_DURATION.ago)
      else
        false
      end
    end

    def too_many_consecutive_failures?
      consecutive_failures_count >= DELINQUENCY_THRESHOLD
    end
end
```

**Key insight**: This is better than exponential backoff for user-configured webhooks because it provides clear feedback and doesn't waste resources on permanently broken endpoints.

---

## Signature Verification: HMAC-SHA256

**PR:** [#1196](https://github.com/basecamp/fizzy/pull/1196)

### The Pattern

Sign webhook payloads with HMAC-SHA256 so recipients can verify authenticity:
1. Generate signing secret on webhook creation (`has_secure_token`)
2. Include signature in request headers
3. Include timestamp to prevent replay attacks

### Why It Matters

- Recipients can verify the webhook came from your application
- Prevents tampering with payload
- Standard pattern (used by Stripe, GitHub, etc.)

### Implementation

```ruby
# app/models/webhook.rb
class Webhook < ApplicationRecord
  has_secure_token :signing_secret
  # ...
end

# app/models/webhook/delivery.rb
def headers
  {
    "User-Agent" => USER_AGENT,
    "Content-Type" => content_type,
    "X-Webhook-Signature" => signature,
    "X-Webhook-Timestamp" => event.created_at.utc.iso8601
  }
end

def signature
  OpenSSL::HMAC.hexdigest("SHA256", webhook.signing_secret, payload)
end
```

**Recipient verification** (document this for your users):

```ruby
# In the webhook receiver's code
def verify_signature(payload, signature, secret)
  expected = OpenSSL::HMAC.hexdigest("SHA256", secret, payload)
  ActiveSupport::SecurityUtils.secure_compare(expected, signature)
end
```

---

## Background Job Integration

**PR:** [#1196](https://github.com/basecamp/fizzy/pull/1196)

### The Pattern

Use a two-stage job pattern:
1. **Dispatch job**: Finds webhooks to trigger for an event
2. **Delivery job**: Performs the actual HTTP request

### Why It Matters

- **Scalability**: One event can trigger multiple webhooks without blocking
- **Fault isolation**: One failing webhook doesn't affect others
- **Queue separation**: Webhooks in dedicated queue, won't block critical jobs

### Implementation

```ruby
# app/models/event.rb
class Event < ApplicationRecord
  after_create_commit :dispatch_webhooks

  private
    def dispatch_webhooks
      Event::WebhookDispatchJob.perform_later(self)
    end
end

# app/jobs/event/webhook_dispatch_job.rb
class Event::WebhookDispatchJob < ApplicationJob
  queue_as :webhooks

  def perform(event)
    Webhook.active.triggered_by(event).find_each do |webhook|
      webhook.trigger(event)  # Creates Webhook::Delivery, which enqueues Webhook::DeliveryJob
    end
  end
end

# app/jobs/webhook/delivery_job.rb
class Webhook::DeliveryJob < ApplicationJob
  queue_as :webhooks

  def perform(delivery)
    delivery.deliver
  end
end

# app/models/webhook/triggerable.rb
module Webhook::Triggerable
  extend ActiveSupport::Concern

  included do
    scope :triggered_by, ->(event) { where(board: event.board).triggered_by_action(event.action) }
    scope :triggered_by_action, ->(action) { where("subscribed_actions LIKE ?", "%\"#{action}\"%") }
  end

  def trigger(event)
    deliveries.create!(event: event)  # Creates delivery, which auto-enqueues via after_create_commit
  end
end
```

**Key insight**: The `after_create_commit :deliver_later` callback on Webhook::Delivery ensures the delivery job is only enqueued after the database transaction commits, preventing race conditions.

---

## Testing Webhooks

**PR:** [#1196](https://github.com/basecamp/fizzy/pull/1196)

### The Pattern

Use WebMock to stub HTTP requests in tests:
1. Test successful delivery (2xx responses)
2. Test all error scenarios (network errors, timeouts, SSL failures)
3. Test security protections (SSRF, response size limits)
4. Test payload formatting for different webhook types

### Why It Matters

- **Comprehensive coverage**: Test all failure modes without real network calls
- **Fast tests**: No actual HTTP requests
- **Deterministic**: No flaky network-dependent tests

### Implementation

```ruby
# test/models/webhook/delivery_test.rb
require "test_helper"

class Webhook::DeliveryTest < ActiveSupport::TestCase
  PUBLIC_TEST_IP = "93.184.216.34" # example.com's real IP

  setup do
    stub_dns_resolution(PUBLIC_TEST_IP)
  end

  test "deliver" do
    delivery = webhook_deliveries(:pending)

    stub_request(:post, delivery.webhook.url)
      .to_return(status: 200, headers: { "content-type" => "application/json" })

    delivery.deliver

    assert_equal "completed", delivery.state
    assert_equal 200, delivery.response[:code]
    assert delivery.succeeded?
  end

  test "deliver when the network timeouts" do
    delivery = webhook_deliveries(:pending)
    stub_request(:post, delivery.webhook.url).to_timeout

    delivery.deliver

    assert_equal "completed", delivery.state
    assert_equal "connection_timeout", delivery.response[:error]
    assert_not delivery.succeeded?
  end

  test "handles response too large error" do
    delivery = webhook_deliveries(:pending)

    large_body = "x" * 200.kilobytes
    stub_request(:post, delivery.webhook.url).to_return(status: 200, body: large_body)

    delivery.deliver

    assert_equal "completed", delivery.state
    assert_equal "response_too_large", delivery.response[:error]
    assert_not delivery.succeeded?
  end

  test "blocks DNS rebinding attack" do
    webhook = Webhook.create!(
      board: boards(:writebook),
      name: "Rebind Attack",
      url: "https://rebind.attacker.example/webhook"
    )
    delivery = Webhook::Delivery.create!(webhook: webhook, event: events(:layout_commented))

    stub_dns_resolution("169.254.169.254") # AWS IMDS

    delivery.deliver

    assert_equal "private_uri", delivery.response[:error]
    assert_not delivery.succeeded?
  end

  private
    def stub_dns_resolution(*ips)
      dns_mock = mock("dns")
      dns_mock.stubs(:each_address).multiple_yields(*ips)
      Resolv::DNS.stubs(:open).yields(dns_mock)
    end
end
```

**Testing pattern**: Test error conditions by stubbing exceptions, not by actually causing network failures.

---

## Payload Formatting: Multi-Format Support

**PR:** [#1196](https://github.com/basecamp/fizzy/pull/1196)

### The Pattern

Support multiple webhook formats based on destination URL pattern:
- **Generic**: JSON with full event object
- **Slack**: Convert HTML to Slack's mrkdwn format
- **Campfire**: Plain HTML
- **Basecamp**: URL-encoded HTML

### Why It Matters

- **Integration-ready**: Works with popular services out of the box
- **User-friendly**: No manual payload transformation needed
- **Flexible**: Generic JSON for custom integrations

### Implementation

```ruby
# app/models/webhook.rb
class Webhook < ApplicationRecord
  SLACK_WEBHOOK_URL_REGEX = %r{//hooks\.slack\.com/services/T[^\/]+/B[^\/]+/[^\/]+\Z}i
  CAMPFIRE_WEBHOOK_URL_REGEX = %r{/rooms/\d+/\d+-[^\/]+/messages\Z}i
  BASECAMP_CAMPFIRE_WEBHOOK_URL_REGEX = %r{/\d+/integrations/[^\/]+/buckets/\d+/chats/\d+/lines\Z}i

  def for_basecamp?
    url.match? BASECAMP_CAMPFIRE_WEBHOOK_URL_REGEX
  end

  def for_campfire?
    url.match? CAMPFIRE_WEBHOOK_URL_REGEX
  end

  def for_slack?
    url.match? SLACK_WEBHOOK_URL_REGEX
  end
end

# app/models/webhook/delivery.rb
def content_type
  if webhook.for_campfire?
    "text/html"
  elsif webhook.for_basecamp?
    "application/x-www-form-urlencoded"
  else
    "application/json"
  end
end

def payload
  @payload ||= if webhook.for_basecamp?
    { content: render_payload(formats: :html) }.to_query
  elsif webhook.for_campfire?
    render_payload(formats: :html)
  elsif webhook.for_slack?
    html = render_payload(formats: :html)
    { text: convert_html_to_mrkdwn(html) }.to_json
  else
    render_payload(formats: :json)
  end
end

def render_payload(**options)
  webhook.renderer.render(layout: false, template: "webhooks/event", assigns: { event: event }, **options).strip
end

def convert_html_to_mrkdwn(html)
  document = Nokogiri::HTML5(html)

  document.css("a").each do |a|
    a.replace("<#{a["href"].strip}|#{a.text}>") if a["href"].present?
  end

  document.css("b").each { |b| b.replace("*#{b.text}*") }
  document.css("i").each { |i| i.replace("_#{i.text}_") }

  document.text
end
```

**Key insight**: Use URL pattern matching to automatically detect destination type, rather than requiring users to configure payload format.

---

## Data Retention: Automatic Cleanup

**PR:** [#1292](https://github.com/basecamp/fizzy/pull/1292)

### The Pattern

Automatically delete old webhook delivery records:
1. Define staleness threshold (7 days)
2. Run cleanup job on recurring schedule (every 4 hours)
3. Use `delete_all` for performance (skip callbacks)

### Why It Matters

- **Database size**: Webhook deliveries can grow quickly
- **Query performance**: Keep relevant tables lean
- **Compliance**: Automatic data retention without manual intervention

### Implementation

```ruby
# app/models/webhook/delivery.rb
class Webhook::Delivery < ApplicationRecord
  STALE_THRESHOLD = 7.days

  scope :stale, -> { where(created_at: ...STALE_THRESHOLD.ago) }

  def self.cleanup
    stale.delete_all
  end
end

# config/recurring.yml (for Solid Queue recurring jobs)
cleanup_webhook_deliveries:
  command: "Webhook::Delivery.cleanup"
  schedule: every 4 hours at minute 51
```

**Testing cleanup**:

```ruby
test "cleanup" do
  webhook = webhooks(:active)
  event = events(:layout_commented)

  fresh_delivery = Webhook::Delivery.create!(webhook: webhook, event: event)
  stale_delivery = Webhook::Delivery.create!(webhook: webhook, event: event, created_at: 8.days.ago)

  Webhook::Delivery.cleanup

  assert Webhook::Delivery.exists?(fresh_delivery.id)
  assert_not Webhook::Delivery.exists?(stale_delivery.id)
end
```

**Important**: Fix from PR [#1292](https://github.com/basecamp/fizzy/pull/1292) - use `command:` not `class:` for class method calls:

```yaml
# RIGHT - calling a class method
cleanup_webhook_deliveries:
  command: "Webhook::Delivery.cleanup"
  schedule: every 4 hours

# WRONG - would try to instantiate and call #perform
cleanup_webhook_deliveries:
  class: Webhook::CleanupDeliveriesJob
```

---

## Additional Insights

### Response Size Limiting

Prevent memory exhaustion from large responses:

```ruby
class Webhook::Delivery < ApplicationRecord
  MAX_RESPONSE_SIZE = 100.kilobytes

  private
    def stream_body_with_limit(response)
      bytes_read = 0
      response.read_body do |chunk|
        bytes_read += chunk.bytesize
        raise ResponseTooLarge if bytes_read > MAX_RESPONSE_SIZE
      end
    end
end
```

### Timeout Configuration

Set reasonable timeouts to prevent hanging jobs:

```ruby
ENDPOINT_TIMEOUT = 7.seconds

def http
  Net::HTTP.new(uri.host, uri.port).tap do |http|
    http.open_timeout = ENDPOINT_TIMEOUT
    http.read_timeout = ENDPOINT_TIMEOUT
  end
end
```

### URL Validation

Validate webhook URLs at creation time:

```ruby
class Webhook < ApplicationRecord
  PERMITTED_SCHEMES = %w[ http https ].freeze

  validate :validate_url

  private
    def validate_url
      uri = URI.parse(url.presence)

      if PERMITTED_SCHEMES.exclude?(uri.scheme)
        errors.add :url, "must use #{PERMITTED_SCHEMES.to_choice_sentence}"
      end
    rescue URI::InvalidURIError
      errors.add :url, "not a URL"
    end
end
```

### User-Friendly Action Labels

Map internal event names to user-friendly labels (PR [#1161](https://github.com/basecamp/fizzy/pull/1161)):

```ruby
# app/helpers/webhooks_helper.rb
module WebhooksHelper
  ACTION_LABELS = {
    card_assigned: "Card assigned",
    card_closed: "Card closed",
    card_published: "Card published",
    comment_created: "Comment created"
  }.with_indifferent_access.freeze

  def webhook_action_options(actions = Webhook::PERMITTED_ACTIONS)
    actions.each_with_object({}) do |action, hash|
      hash[action.to_s] = webhook_action_label(action)
    end
  end

  def webhook_action_label(action)
    ACTION_LABELS[action] || action.to_s.humanize
  end
end
```

### Event Granularity

Separate similar events for better webhook filtering (PR [#1169](https://github.com/basecamp/fizzy/pull/1169), [#1229](https://github.com/basecamp/fizzy/pull/1229)):

```ruby
# Bad - single "card_closed" event for both user and system actions
def close(user: Current.user)
  track_event :closed, creator: user
end

# Good - separate events for user vs system actions
def close(user: Current.user, reason: Closure::Reason.default, event: :closed)
  track_event event, creator: user
end

# Called differently based on context
card.close(user: Current.user, event: :closed)           # User action
card.close(user: User.system, event: :auto_closed)      # System action
card.postpone(user: Current.user, event: :postponed)    # User postpone
card.auto_postpone(user: User.system, event: :auto_postponed)  # System postpone
```

**Why it matters**: Users can subscribe to specific events (e.g., only manual closures, not auto-closures), reducing noise.

---

## Summary

The key transferable patterns from Fizzy's webhook implementation:

1. **Security first**: SSRF protection with DNS pinning is essential for user-controlled URLs
2. **State tracking**: Store delivery metadata for debugging and auditability
3. **Smart failure handling**: Delinquency tracking beats infinite retries
4. **Standard signatures**: HMAC-SHA256 for payload verification
5. **Async architecture**: Two-stage job pattern for scalability
6. **Comprehensive testing**: WebMock for all network scenarios
7. **Multi-format support**: Auto-detect destination type from URL
8. **Data hygiene**: Automatic cleanup of old delivery records
9. **Event granularity**: Separate user vs system actions for better filtering
10. **User experience**: Friendly labels for webhook triggers in UI

These patterns are production-tested at scale and applicable to any Rails application implementing webhooks.
