# Background Jobs

> Solid Queue patterns from 37signals.

---

## Configuration

### Development
```bash
# Run jobs in Puma process
export SOLID_QUEUE_IN_PUMA=1
```
Simplifies dev - no separate worker process ([#469](https://github.com/basecamp/fizzy/pull/469)).

### Production
- Match workers to CPU cores ([#1290](https://github.com/basecamp/fizzy/pull/1290))
- 3 threads for I/O-bound jobs ([#1329](https://github.com/basecamp/fizzy/pull/1329))

## Stagger Recurring Jobs

Prevent resource spikes by offsetting schedules ([#1329](https://github.com/basecamp/fizzy/pull/1329)):

```yaml
# Bad - all at :00
job_a: every hour at minute 0
job_b: every hour at minute 0

# Good - staggered
job_a: every hour at minute 12
job_b: every hour at minute 50
```

## Transaction Safety

### Enqueue After Commit ([#1664](https://github.com/basecamp/fizzy/pull/1664))
```ruby
# In initializer
ActiveJob::Base.enqueue_after_transaction_commit = true
```

Prevents jobs from running before the data they need exists.
Fixes `ActiveStorage::FileNotFoundError` on uploads.

## Error Handling

### Transient Errors ([#1924](https://github.com/basecamp/fizzy/pull/1924))

Retry network and temporary SMTP errors with polynomial backoff:

```ruby
module SmtpDeliveryErrorHandling
  extend ActiveSupport::Concern

  included do
    # Retry delivery to possibly-unavailable remote mailservers
    retry_on Net::OpenTimeout, Net::ReadTimeout, Socket::ResolutionError,
      wait: :polynomially_longer

    # Net::SMTPServerBusy is SMTP error code 4xx, a temporary error.
    # Common one: 452 4.3.1 Insufficient system storage.
    retry_on Net::SMTPServerBusy, wait: :polynomially_longer
  end
end
```

### Permanent Failures

Swallow gracefully—don't fail the job for unrecoverable errors. Log at info level, not error:

```ruby
module SmtpDeliveryErrorHandling
  extend ActiveSupport::Concern

  included do
    # SMTP error 50x
    rescue_from Net::SMTPSyntaxError do |error|
      case error.message
      when /\A501 5\.1\.3/  # Bad email address format
        Sentry.capture_exception error, level: :info
      else
        raise
      end
    end

    # SMTP error 5xx except 50x and 53x
    rescue_from Net::SMTPFatalError do |error|
      case error.message
      when /\A550 5\.1\.1/  # Unknown user
        Sentry.capture_exception error, level: :info
      when /\A552 5\.6\.0/  # Message too large
        Sentry.capture_exception error, level: :info
      when /\A555 5\.5\.4/  # Bad headers
        Sentry.capture_exception error, level: :info
      else
        raise
      end
    end
  end
end
```

Apply to ActionMailer's delivery job via initializer:

```ruby
# lib/rails_ext/action_mailer_mail_delivery_job.rb
Rails.application.config.to_prepare do
  ActionMailer::MailDeliveryJob.include SmtpDeliveryErrorHandling
end
```

**Why swallow instead of retry?** These errors are permanent—retrying won't help. The user has a bad email address or their mailbox is full. Log it for visibility but don't waste job queue resources.

## Maintenance Jobs

### Clean Finished Jobs ([#943](https://github.com/basecamp/fizzy/pull/943))
```yaml
clear_finished_jobs:
  command: "SolidQueue::Job.clear_finished_in_batches"
  schedule: every hour at minute 12
```

### Clean Orphaned Data ([#494](https://github.com/basecamp/fizzy/pull/494))
- Unused tags (daily)
- Old webhook deliveries (every 4 hours)
- Expired magic links

## Job Patterns

### Shallow Jobs
Jobs just call model methods:
```ruby
class NotifyRecipientsJob < ApplicationJob
  def perform(notifiable)
    notifiable.notify_recipients
  end
end
```

### `_later` and `_now` Convention

When a model method enqueues a job that invokes another method on that same class, use the `_later` suffix for the async version. The synchronous method can use `_now` or just the plain name:

```ruby
module Notifiable
  extend ActiveSupport::Concern

  included do
    after_create_commit :notify_recipients_later
  end

  # Called by the job - the actual work
  def notify_recipients
    Notifier.for(self)&.notify
  end

  private
    # Enqueues the job
    def notify_recipients_later
      NotifyRecipientsJob.perform_later(self)
    end
end

class NotifyRecipientsJob < ApplicationJob
  def perform(notifiable)
    notifiable.notify_recipients
  end
end
```

Another example with class methods:

```ruby
class Notification::Bundle < ApplicationRecord
  class << self
    # Synchronous - does the work
    def deliver_all
      due.in_batches do |batch|
        jobs = batch.collect { DeliverJob.new(it) }
        ActiveJob.perform_all_later jobs
      end
    end

    # Async - enqueues job
    def deliver_all_later
      DeliverAllJob.perform_later
    end
  end

  # Instance-level pattern
  def deliver
    processing!
    Notification::BundleMailer.notification(self).deliver if deliverable?
    delivered!
  end

  def deliver_later
    DeliverJob.perform_later(self)
  end
end
```

**Key insight**: The `_later` method is usually private and called from callbacks. The plain method name (`deliver`, `notify_recipients`) is the public API that the job invokes. This keeps the job class shallow—it just calls the model method.

## Continuable Jobs for Resilient Iteration ([#1083](https://github.com/basecamp/fizzy/pull/1083))

Use `ActiveJob::Continuable` to resume from where you left off after crashes:

```ruby
require "active_job/continuable"

class Event::WebhookDispatchJob < ApplicationJob
  include ActiveJob::Continuable
  queue_as :webhooks

  def perform(event)
    step :dispatch do |step|
      Webhook.active.triggered_by(event).find_each(start: step.cursor) do |webhook|
        webhook.trigger(event)
        step.advance! from: webhook.id
      end
    end
  end
end
```

**Why it matters**: If the job crashes midway through iteration, it resumes from where it left off rather than reprocessing everything. Essential for jobs processing large batches that might timeout.

**Use cases**: Webhooks dispatching, email broadcasts, bulk updates, data migrations.
