# Observability & Logging

> Patterns from 37signals' Fizzy codebase.

---

## Structured JSON Logging ([#285](https://github.com/basecamp/fizzy/pull/285))

```ruby
# config/environments/production.rb
config.log_level = :fatal  # Suppress unstructured logs
config.structured_logging.logger = ActiveSupport::Logger.new(STDOUT)
```

Use `rails_structured_logging` gem.

## Multi-Tenant Context ([#301](https://github.com/basecamp/fizzy/pull/301))

Inject tenant into every log:

```ruby
before_action { logger.struct tenant: ApplicationRecord.current_tenant }
```

## User Context ([#472](https://github.com/basecamp/fizzy/pull/472))

Log authenticated user:

```ruby
def set_current_session(session)
  logger.struct "Authorized User##{session.user.id}",
    authentication: { user: { id: session.user.id } }
end
```

## Yabeda Metrics Stack ([#1112](https://github.com/basecamp/fizzy/pull/1112))

```ruby
# Gemfile
gem "yabeda"
gem "yabeda-rails"
gem "yabeda-puma-plugin"
gem "yabeda-prometheus-mmap"

# config/puma.rb
plugin :yabeda
plugin :yabeda_prometheus

on_worker_boot do
  Yabeda::ActiveRecord.start_timed_metric_collection_task
end
```

## Additional Yabeda Modules ([#1165](https://github.com/basecamp/fizzy/pull/1165))

```ruby
gem "yabeda-activejob"
gem "yabeda-gc"
gem "yabeda-http_requests"

# In initializer
Yabeda::ActiveJob.install!
```

## Log Configuration ([#1602](https://github.com/basecamp/fizzy/pull/1602))

```ruby
# Silence health checks
config.silence_healthcheck_path = "/up"

# Separate logger for jobs
config.solid_queue.logger = ActiveSupport::Logger.new(STDOUT, level: :info)
```

## Console Auditing ([#1834](https://github.com/basecamp/fizzy/pull/1834))

For compliance, use `console1984` + `audits1984`:

```ruby
config.console1984.protected_environments = %i[production staging]
config.audits1984.base_controller_class = "AdminController"
```

Requires Active Record Encryption keys in protected environments.

## OpenTelemetry Collector ([#1118](https://github.com/basecamp/fizzy/pull/1118))

Deploy as sidecar for container metrics:

```yaml
# config/otel_collector.yml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: "kamal-containers"
          docker_sd_configs:
            - host: unix:///var/run/docker.sock
```
