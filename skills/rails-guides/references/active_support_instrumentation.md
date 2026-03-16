**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Support Instrumentation
==============================

Active Support is a part of core Rails that provides Ruby language extensions, utilities, and other things. One of the things it includes is an instrumentation API that can be used inside an application to measure certain actions that occur within Ruby code, such as those inside a Rails application or the framework itself. It is not limited to Rails, however. It can be used independently in other Ruby scripts if desired.

In this guide, you will learn how to use the Active Support's instrumentation API to measure events inside of Rails and other Ruby code.

After reading this guide, you will know:

* What instrumentation can provide.
* How to add a subscriber to a hook.
* The hooks inside the Rails framework for instrumentation.
* How to build a custom instrumentation implementation.

--------------------------------------------------------------------------------

Introduction to Instrumentation
-------------------------------

The instrumentation API provided by Active Support allows developers to provide hooks which other developers may hook into. There are [several of these](#rails-framework-hooks) within the Rails framework. With this API, developers can choose to be notified when certain events occur inside their application or another piece of Ruby code.

For example, there is [a hook](#sql-active-record) provided within Active Record that is called every time Active Record uses an SQL query on a database. This hook could be **subscribed** to, and used to track the number of queries during a certain action. There's [another hook](#process-action-action-controller) around the processing of an action of a controller. This could be used, for instance, to track how long a specific action has taken.

You are even able to [create your own events](#creating-custom-events) inside your application which you can later subscribe to.

Subscribing to an Event
-----------------------

Use [`ActiveSupport::Notifications.subscribe`][] with a block to listen to any notification. Depending on the amount of
arguments the block takes, you will receive different data.

The first way to subscribe to an event is to use a block with a single argument. The argument will be an instance of
[`ActiveSupport::Notifications::Event`][].

```ruby
ActiveSupport::Notifications.subscribe "process_action.action_controller" do |event|
  event.name        # => "process_action.action_controller"
  event.duration    # => 10 (in milliseconds)
  event.allocations # => 1826
  event.payload     # => {:extra=>information}

  Rails.logger.info "#{event} Received!"
end
```

If you don't need all the data recorded by an Event object, you can also specify a
block that takes the following five arguments:

* Name of the event
* Time when it started
* Time when it finished
* A unique ID for the instrumenter that fired the event
* The payload for the event

```ruby
ActiveSupport::Notifications.subscribe "process_action.action_controller" do |name, started, finished, unique_id, payload|
  # your own custom stuff
  Rails.logger.info "#{name} Received! (started: #{started}, finished: #{finished})" # process_action.action_controller Received! (started: 2019-05-05 13:43:57 -0800, finished: 2019-05-05 13:43:58 -0800)
end
```

If you are concerned about the accuracy of `started` and `finished` to compute a precise elapsed time, then use [`ActiveSupport::Notifications.monotonic_subscribe`][]. The given block would receive the same arguments as above, but the `started` and `finished` will have values with an accurate monotonic time instead of wall-clock time.

```ruby
ActiveSupport::Notifications.monotonic_subscribe "process_action.action_controller" do |name, started, finished, unique_id, payload|
  # your own custom stuff
  duration = finished - started # 1560979.429234 - 1560978.425334
  Rails.logger.info "#{name} Received! (duration: #{duration})" # process_action.action_controller Received! (duration: 1.0039)
end
```

You may also subscribe to events matching a regular expression. This enables you to subscribe to
multiple events at once. Here's how to subscribe to everything from `ActionController`:

```ruby
ActiveSupport::Notifications.subscribe(/action_controller/) do |event|
  # inspect all ActionController events
end
```

[`ActiveSupport::Notifications::Event`]: https://api.rubyonrails.org/classes/ActiveSupport/Notifications/Event.html
[`ActiveSupport::Notifications.monotonic_subscribe`]: https://api.rubyonrails.org/classes/ActiveSupport/Notifications.html#method-c-monotonic_subscribe
[`ActiveSupport::Notifications.subscribe`]: https://api.rubyonrails.org/classes/ActiveSupport/Notifications.html#method-c-subscribe

Rails Framework Hooks
---------------------

Within the Ruby on Rails framework, there are a number of hooks provided for common events. These events and their payloads are detailed below.

### Action Cable

#### `perform_action.action_cable`

| Key              | Value                     |
| ---------------- | ------------------------- |
| `:channel_class` | Name of the channel class |
| `:action`        | The action                |
| `:data`          | A hash of data            |

#### `transmit.action_cable`

| Key              | Value                     |
| ---------------- | ------------------------- |
| `:channel_class` | Name of the channel class |
| `:data`          | A hash of data            |
| `:via`           | Via                       |

#### `transmit_subscription_confirmation.action_cable`

| Key              | Value                     |
| ---------------- | ------------------------- |
| `:channel_class` | Name of the channel class |

#### `transmit_subscription_rejection.action_cable`

| Key              | Value                     |
| ---------------- | ------------------------- |
| `:channel_class` | Name of the channel class |

#### `broadcast.action_cable`

| Key             | Value                |
| --------------- | -------------------- |
| `:broadcasting` | A named broadcasting |
| `:message`      | A hash of message    |
| `:coder`        | The coder            |

### Action Controller

#### `start_processing.action_controller`

| Key           | Value                                                     |
| ------------- | --------------------------------------------------------- |
| `:controller` | The controller name                                       |
| `:action`     | The action                                                |
| `:request`    | The [`ActionDispatch::Request`][] object                  |
| `:params`     | Hash of request parameters without any filtered parameter |
| `:headers`    | Request headers                                           |
| `:format`     | html/js/json/xml etc                                      |
| `:method`     | HTTP request verb                                         |
| `:path`       | Request path                                              |

```ruby
{
  controller: "PostsController",
  action: "new",
  params: { "action" => "new", "controller" => "posts" },
  headers: #<ActionDispatch::Http::Headers:0x0055a67a519b88>,
  format: :html,
  method: "GET",
  path: "/posts/new"
}
```

#### `process_action.action_controller`

| Key             | Value                                                     |
| --------------- | --------------------------------------------------------- |
| `:controller`   | The controller name                                       |
| `:action`       | The action                                                |
| `:params`       | Hash of request parameters without any filtered parameter |
| `:headers`      | Request headers                                           |
| `:format`       | html/js/json/xml etc                                      |
| `:method`       | HTTP request verb                                         |
| `:path`         | Request path                                              |
| `:request`      | The [`ActionDispatch::Request`][] object                  |
| `:response`     | The [`ActionDispatch::Response`][] object                 |
| `:status`       | HTTP status code                                          |
| `:view_runtime` | Amount spent in view in ms                                |
| `:db_runtime`   | Amount spent executing database queries in ms             |

```ruby
{
  controller: "PostsController",
  action: "index",
  params: {"action" => "index", "controller" => "posts"},
  headers: #<ActionDispatch::Http::Headers:0x0055a67a519b88>,
  format: :html,
  method: "GET",
  path: "/posts",
  request: #<ActionDispatch::Request:0x00007ff1cb9bd7b8>,
  response: #<ActionDispatch::Response:0x00007f8521841ec8>,
  status: 200,
  view_runtime: 46.848,
  db_runtime: 0.157
}
```

#### `send_file.action_controller`

| Key     | Value                     |
| ------- | ------------------------- |
| `:path` | Complete path to the file |

Additional keys may be added by the caller.

#### `send_data.action_controller`

`ActionController` does not add any specific information to the payload. All options are passed through to the payload.

#### `redirect_to.action_controller`

| Key         | Value                                    |
| ----------- | ---------------------------------------- |
| `:status`   | HTTP response code                       |
| `:location` | URL to redirect to                       |
| `:request`  | The [`ActionDispatch::Request`][] object |

```ruby
{
  status: 302,
  location: "http://localhost:3000/posts/new",
  request: <ActionDispatch::Request:0x00007ff1cb9bd7b8>
}
```

#### `halted_callback.action_controller`

| Key       | Value                         |
| --------- | ----------------------------- |
| `:filter` | Filter that halted the action |

```ruby
{
  filter: ":halting_filter"
}
```

#### `unpermitted_parameters.action_controller`

| Key           | Value                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| `:keys`       | The unpermitted keys                                                          |
| `:context`    | Hash with the following keys: `:controller`, `:action`, `:params`, `:request` |

#### `send_stream.action_controller`

| Key            | Value                                    |
| -------------- | ---------------------------------------- |
| `:filename`    | The filename                             |
| `:type`        | HTTP content type                        |
| `:disposition` | HTTP content disposition                 |

```ruby
{
  filename: "subscribers.csv",
  type: "text/csv",
  disposition: "attachment"
}
```

#### `rate_limit.action_controller`

| Key          | Value                                         |
| ------------ | --------------------------------------------- |
| `:request`   | The [`ActionDispatch::Request`][] object      |
| `:count`     | Number of requests made                       |
| `:to`        | Maximum number of requests allowed            |
| `:within`    | Time window for the rate limit                |
| `:by`        | Identifier for the rate limit (e.g. IP)       |
| `:name`      | Name of the rate limit                        |
| `:scope`     | Scope of the rate limit                       |
| `:cache_key` | The cache key used for storing the rate limit |

### Action Controller: Caching

#### `write_fragment.action_controller`

| Key    | Value            |
| ------ | ---------------- |
| `:key` | The complete key |

```ruby
{
  key: 'posts/1-dashboard-view'
}
```

#### `read_fragment.action_controller`

| Key    | Value            |
| ------ | ---------------- |
| `:key` | The complete key |

```ruby
{
  key: 'posts/1-dashboard-view'
}
```

#### `expire_fragment.action_controller`

| Key    | Value            |
| ------ | ---------------- |
| `:key` | The complete key |

```ruby
{
  key: 'posts/1-dashboard-view'
}
```

#### `exist_fragment?.action_controller`

| Key    | Value            |
| ------ | ---------------- |
| `:key` | The complete key |

```ruby
{
  key: 'posts/1-dashboard-view'
}
```

### Action Dispatch

#### `process_middleware.action_dispatch`

| Key           | Value                  |
| ------------- | ---------------------- |
| `:middleware` | Name of the middleware |

#### `redirect.action_dispatch`

| Key         | Value                                    |
| ------------------ | ---------------------------------------- |
| `:status`          | HTTP response code                       |
| `:location`        | URL to redirect to                       |
| `:request`         | The [`ActionDispatch::Request`][] object |
| `:source_location` | Source location of redirect in routes    |

#### `request.action_dispatch`

| Key         | Value                                    |
| ----------- | ---------------------------------------- |
| `:request`  | The [`ActionDispatch::Request`][] object |

[`ActionDispatch::Request`]: https://api.rubyonrails.org/classes/ActionDispatch/Request.html
[`ActionDispatch::Response`]: https://api.rubyonrails.org/classes/ActionDispatch/Response.html

### Action Mailbox

#### `process.action_mailbox`

| Key              | Value                                                  |
| -----------------| ------------------------------------------------------ |
| `:mailbox`       | Instance of the Mailbox class inheriting from [`ActionMailbox::Base`][] |
| `:inbound_email` | Hash with data about the inbound email being processed |

```ruby
{
  mailbox: #<RepliesMailbox:0x00007f9f7a8388>,
  inbound_email: {
    id: 1,
    message_id: "0CB459E0-0336-41DA-BC88-E6E28C697DDB@37signals.com",
    status: "processing"
  }
}
```

[`ActionMailbox::Base`]: https://api.rubyonrails.org/classes/ActionMailbox/Base.html

### Action Mailer

#### `deliver.action_mailer`

| Key                   | Value                                                |
| --------------------- | ---------------------------------------------------- |
| `:mailer`             | Name of the mailer class                             |
| `:message_id`         | ID of the message, generated by the Mail gem         |
| `:subject`            | Subject of the mail                                  |
| `:to`                 | To address(es) of the mail                           |
| `:from`               | From address of the mail                             |
| `:bcc`                | BCC addresses of the mail                            |
| `:cc`                 | CC addresses of the mail                             |
| `:date`               | Date of the mail                                     |
| `:mail`               | The encoded form of the mail                         |
| `:perform_deliveries` | Whether delivery of this message is performed or not |

```ruby
{
  mailer: "Notification",
  message_id: "4f5b5491f1774_181b23fc3d4434d38138e5@mba.local.mail",
  subject: "Rails Guides",
  to: ["users@rails.com", "dhh@rails.com"],
  from: ["me@rails.com"],
  date: Sat, 10 Mar 2012 14:18:09 +0100,
  mail: "...", # omitted for brevity
  perform_deliveries: true
}
```

#### `process.action_mailer`

| Key           | Value                    |
| ------------- | ------------------------ |
| `:mailer`     | Name of the mailer class |
| `:action`     | The action               |
| `:args`       | The arguments            |

```ruby
{
  mailer: "Notification",
  action: "welcome_email",
  args: []
}
```

### Action View

#### `render_template.action_view`

| Key           | Value                              |
| ------------- | ---------------------------------- |
| `:identifier` | Full path to template              |
| `:layout`     | Applicable layout                  |
| `:locals`     | Local variables passed to template |

```ruby
{
  identifier: "/Users/adam/projects/notifications/app/views/posts/index.html.erb",
  layout: "layouts/application",
  locals: { foo: "bar" }
}
```

#### `render_partial.action_view`

| Key           | Value                              |
| ------------- | ---------------------------------- |
| `:identifier` | Full path to template              |
| `:locals`     | Local variables passed to template |

```ruby
{
  identifier: "/Users/adam/projects/notifications/app/views/posts/_form.html.erb",
  locals: { foo: "bar" }
}
```

#### `render_collection.action_view`

| Key           | Value                                 |
| ------------- | ------------------------------------- |
| `:identifier` | Full path to template                 |
| `:count`      | Size of collection                    |
| `:cache_hits` | Number of partials fetched from cache |

The `:cache_hits` key is only included if the collection is rendered with `cached: true`.

```ruby
{
  identifier: "/Users/adam/projects/notifications/app/views/posts/_post.html.erb",
  count: 3,
  cache_hits: 0
}
```

#### `render_layout.action_view`

| Key           | Value                 |
| ------------- | --------------------- |
| `:identifier` | Full path to template |


```ruby
{
  identifier: "/Users/adam/projects/notifications/app/views/layouts/application.html.erb"
}
```

### Active Job

#### `enqueue_at.active_job`

| Key          | Value                                  |
| ------------ | -------------------------------------- |
| `:adapter`   | QueueAdapter object processing the job |
| `:job`       | Job object                             |

#### `enqueue.active_job`

| Key          | Value                                  |
| ------------ | -------------------------------------- |
| `:adapter`   | QueueAdapter object processing the job |
| `:job`       | Job object                             |

#### `enqueue_retry.active_job`

| Key          | Value                                  |
| ------------ | -------------------------------------- |
| `:job`       | Job object                             |
| `:adapter`   | QueueAdapter object processing the job |
| `:error`     | The error that caused the retry        |
| `:wait`      | The delay of the retry                 |

#### `enqueue_all.active_job`

| Key          | Value                                  |
| ------------ | -------------------------------------- |
| `:adapter`   | QueueAdapter object processing the job |
| `:jobs`      | An array of Job objects                |

#### `perform_start.active_job`

| Key          | Value                                  |
| ------------ | -------------------------------------- |
| `:adapter`   | QueueAdapter object processing the job |
| `:job`       | Job object                             |

#### `perform.active_job`

| Key           | Value                                         |
| ------------- | --------------------------------------------- |
| `:adapter`    | QueueAdapter object processing the job        |
| `:job`        | Job object                                    |
| `:db_runtime` | Amount spent executing database queries in ms |

#### `retry_stopped.active_job`

| Key          | Value                                  |
| ------------ | -------------------------------------- |
| `:adapter`   | QueueAdapter object processing the job |
| `:job`       | Job object                             |
| `:error`     | The error that caused the retry        |

#### `discard.active_job`

| Key          | Value                                  |
| ------------ | -------------------------------------- |
| `:adapter`   | QueueAdapter object processing the job |
| `:job`       | Job object                             |
| `:error`     | The error that caused the discard      |

### Active Record

#### `sql.active_record`

| Key                  | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| `:sql`               | SQL statement                                          |
| `:name`              | Name of the operation                                  |
| `:binds`             | Bind parameters                                        |
| `:type_casted_binds` | Typecasted bind parameters                             |
| `:async`             | `true` if query is loaded asynchronously               |
| `:allow_retry`       | `true` if the query can be automatically retried       |
| `:connection`        | Connection object                                      |
| `:transaction`       | Current transaction, if any                            |
| `:affected_rows`     | Number of rows affected by the query                   |
| `:row_count`         | Number of rows returned by the query                   |
| `:cached`            | `true` is added when result comes from the query cache |
| `:statement_name`    | SQL Statement name (Postgres only)                     |

Adapters may add their own data as well.

```ruby
{
  sql: "SELECT \"posts\".* FROM \"posts\" ",
  name: "Post Load",
  binds: [<ActiveModel::Attribute::WithCastValue:0x00007fe19d15dc00>],
  type_casted_binds: [11],
  async: false,
  allow_retry: true,
  connection: <ActiveRecord::ConnectionAdapters::SQLite3Adapter:0x00007f9f7a838850>,
  transaction: <ActiveRecord::ConnectionAdapters::RealTransaction:0x0000000121b5d3e0>
  affected_rows: 0
  row_count: 5,
  statement_name: nil,
}
```

If the query is not executed in the context of a transaction, `:transaction` is `nil`.

#### `strict_loading_violation.active_record`

This event is only emitted when [`config.active_record.action_on_strict_loading_violation`][] is set to `:log`.

| Key           | Value                                            |
| ------------- | ------------------------------------------------ |
| `:owner`      | Model with `strict_loading` enabled              |
| `:reflection` | Reflection of the association that tried to load |

[`config.active_record.action_on_strict_loading_violation`]: configuring.html#config-active-record-action-on-strict-loading-violation

#### `instantiation.active_record`

| Key              | Value                                     |
| ---------------- | ----------------------------------------- |
| `:record_count`  | Number of records that instantiated       |
| `:class_name`    | Record's class                            |

```ruby
{
  record_count: 1,
  class_name: "User"
}
```

#### `start_transaction.active_record`

This event is emitted when a transaction has been started.

| Key                  | Value                                                |
| -------------------- | ---------------------------------------------------- |
| `:transaction`       | Transaction object                                   |
| `:connection`        | Connection object                                    |

Please, note that Active Record does not create the actual database transaction
until needed:

```ruby
ActiveRecord::Base.transaction do
  # We are inside the block, but no event has been triggered yet.

  # The following line makes Active Record start the transaction.
  User.count # Event fired here.
end
```

Remember that ordinary nested calls do not create new transactions:

```ruby
ActiveRecord::Base.transaction do |t1|
  User.count # Fires an event for t1.
  ActiveRecord::Base.transaction do |t2|
    # The next line fires no event for t2, because the only
    # real database transaction in this example is t1.
    User.first.touch
  end
end
```

However, if `requires_new: true` is passed, you get an event for the nested
transaction too. This might be a savepoint under the hood:

```ruby
ActiveRecord::Base.transaction do |t1|
  User.count # Fires an event for t1.
  ActiveRecord::Base.transaction(requires_new: true) do |t2|
    User.first.touch # Fires an event for t2.
  end
end
```

#### `transaction.active_record`

This event is emitted when a database transaction finishes. The state of the
transaction can be found in the `:outcome` key.

| Key                  | Value                                                |
| -------------------- | ---------------------------------------------------- |
| `:transaction`       | Transaction object                                   |
| `:outcome`           | `:commit`, `:rollback`, `:restart`, or `:incomplete` |
| `:connection`        | Connection object                                    |

In practice, you cannot do much with the transaction object, but it may still be
helpful for tracing database activity. For example, by tracking
`transaction.uuid`.

#### `deprecated_association.active_record`

This event is emitted when a deprecated association is accessed, and the
configured deprecated associations mode is `:notify`.

| Key                  | Value                                                |
| -------------------- | ---------------------------------------------------- |
| `:reflection`        | The reflection of the association                    |
| `:message`           | A descriptive message about the access               |
| `:location`          | The application-level location of the access         |
| `:backtrace`         | Only present if the option `:backtrace` is true      |

The `:location` is a `Thread::Backtrace::Location` object, and `:backtrace`, if
present, is an array of `Thread::Backtrace::Location` objects. These are
computed using the Active Record backtrace cleaner. In Rails applications, this
is the same as `Rails.backtrace_cleaner`.

### Active Storage

#### `preview.active_storage`

| Key          | Value               |
| ------------ | ------------------- |
| `:key`       | Secure token        |

#### `transform.active_storage`

#### `analyze.active_storage`

| Key          | Value                          |
| ------------ | ------------------------------ |
| `:analyzer`  | Name of analyzer e.g., ffprobe |

### Active Storage: Storage Service

#### `service_upload.active_storage`

| Key          | Value                        |
| ------------ | ---------------------------- |
| `:key`       | Secure token                 |
| `:service`   | Name of the service          |
| `:checksum`  | Checksum to ensure integrity |

#### `service_streaming_download.active_storage`

| Key          | Value               |
| ------------ | ------------------- |
| `:key`       | Secure token        |
| `:service`   | Name of the service |

#### `service_download_chunk.active_storage`

| Key          | Value                           |
| ------------ | ------------------------------- |
| `:key`       | Secure token                    |
| `:service`   | Name of the service             |
| `:range`     | Byte range attempted to be read |

#### `service_download.active_storage`

| Key          | Value               |
| ------------ | ------------------- |
| `:key`       | Secure token        |
| `:service`   | Name of the service |

#### `service_delete.active_storage`

| Key          | Value               |
| ------------ | ------------------- |
| `:key`       | Secure token        |
| `:service`   | Name of the service |

#### `service_delete_prefixed.active_storage`

| Key          | Value               |
| ------------ | ------------------- |
| `:prefix`    | Key prefix          |
| `:service`   | Name of the service |

#### `service_exist.active_storage`

| Key          | Value                       |
| ------------ | --------------------------- |
| `:key`       | Secure token                |
| `:service`   | Name of the service         |
| `:exist`     | File or blob exists or not  |

#### `service_url.active_storage`

| Key          | Value               |
| ------------ | ------------------- |
| `:key`       | Secure token        |
| `:service`   | Name of the service |
| `:url`       | Generated URL       |

#### `service_update_metadata.active_storage`

This event is only emitted when using the Google Cloud Storage service.

| Key             | Value                            |
| --------------- | -------------------------------- |
| `:key`          | Secure token                     |
| `:service`      | Name of the service              |
| `:content_type` | HTTP `Content-Type` field        |
| `:disposition`  | HTTP `Content-Disposition` field |

### Active Support: Caching

#### `cache_read.active_support`

| Key                | Value                   |
| ------------------ | ----------------------- |
| `:key`             | Key used in the store   |
| `:store`           | Name of the store class |
| `:hit`             | If this read is a hit   |
| `:super_operation` | `:fetch` if a read is done with [`fetch`][ActiveSupport::Cache::Store#fetch] |

#### `cache_read_multi.active_support`

| Key                | Value                   |
| ------------------ | ----------------------- |
| `:key`             | Keys used in the store  |
| `:store`           | Name of the store class |
| `:hits`            | Keys of cache hits      |
| `:super_operation` | `:fetch_multi` if a read is done with [`fetch_multi`][ActiveSupport::Cache::Store#fetch_multi] |

#### `cache_generate.active_support`

This event is only emitted when [`fetch`][ActiveSupport::Cache::Store#fetch] is called with a block.

| Key      | Value                   |
| -------- | ----------------------- |
| `:key`   | Key used in the store   |
| `:store` | Name of the store class |

Options passed to `fetch` will be merged with the payload when writing to the store.

```ruby
{
  key: "name-of-complicated-computation",
  store: "ActiveSupport::Cache::MemCacheStore"
}
```

#### `cache_fetch_hit.active_support`

This event is only emitted when [`fetch`][ActiveSupport::Cache::Store#fetch] is called with a block.

| Key      | Value                   |
| -------- | ----------------------- |
| `:key`   | Key used in the store   |
| `:store` | Name of the store class |

Options passed to `fetch` will be merged with the payload.

```ruby
{
  key: "name-of-complicated-computation",
  store: "ActiveSupport::Cache::MemCacheStore"
}
```

#### `cache_write.active_support`

| Key      | Value                   |
| -------- | ----------------------- |
| `:key`   | Key used in the store   |
| `:store` | Name of the store class |

Cache stores may add their own data as well.

```ruby
{
  key: "name-of-complicated-computation",
  store: "ActiveSupport::Cache::MemCacheStore"
}
```

#### `cache_write_multi.active_support`

| Key      | Value                                |
| -------- | ------------------------------------ |
| `:key`   | Keys and values written to the store |
| `:store` | Name of the store class              |


#### `cache_increment.active_support`

| Key       | Value                   |
| --------- | ----------------------- |
| `:key`    | Key used in the store   |
| `:store`  | Name of the store class |
| `:amount` | Increment amount        |

```ruby
{
  key: "bottles-of-beer",
  store: "ActiveSupport::Cache::RedisCacheStore",
  amount: 99
}
```

#### `cache_decrement.active_support`

| Key       | Value                   |
| --------- | ----------------------- |
| `:key`    | Key used in the store   |
| `:store`  | Name of the store class |
| `:amount` | Decrement amount        |

```ruby
{
  key: "bottles-of-beer",
  store: "ActiveSupport::Cache::RedisCacheStore",
  amount: 1
}
```

#### `cache_delete.active_support`

| Key      | Value                   |
| -------- | ----------------------- |
| `:key`   | Key used in the store   |
| `:store` | Name of the store class |

```ruby
{
  key: "name-of-complicated-computation",
  store: "ActiveSupport::Cache::MemCacheStore"
}
```

#### `cache_delete_multi.active_support`

| Key      | Value                   |
| -------- | ----------------------- |
| `:key`   | Keys used in the store  |
| `:store` | Name of the store class |

#### `cache_delete_matched.active_support`

This event is only emitted when using [`RedisCacheStore`][ActiveSupport::Cache::RedisCacheStore],
[`FileStore`][ActiveSupport::Cache::FileStore], or [`MemoryStore`][ActiveSupport::Cache::MemoryStore].

| Key      | Value                   |
| -------- | ----------------------- |
| `:key`   | Key pattern used        |
| `:store` | Name of the store class |

```ruby
{
  key: "posts/*",
  store: "ActiveSupport::Cache::RedisCacheStore"
}
```

#### `cache_cleanup.active_support`

This event is only emitted when using [`MemoryStore`][ActiveSupport::Cache::MemoryStore].

| Key      | Value                                         |
| -------- | --------------------------------------------- |
| `:store` | Name of the store class                       |
| `:size`  | Number of entries in the cache before cleanup |

```ruby
{
  store: "ActiveSupport::Cache::MemoryStore",
  size: 9001
}
```

#### `cache_prune.active_support`

This event is only emitted when using [`MemoryStore`][ActiveSupport::Cache::MemoryStore].

| Key      | Value                                         |
| -------- | --------------------------------------------- |
| `:store` | Name of the store class                       |
| `:key`   | Target size (in bytes) for the cache          |
| `:from`  | Size (in bytes) of the cache before prune     |

```ruby
{
  store: "ActiveSupport::Cache::MemoryStore",
  key: 5000,
  from: 9001
}
```

#### `cache_exist?.active_support`

| Key      | Value                   |
| -------- | ----------------------- |
| `:key`   | Key used in the store   |
| `:store` | Name of the store class |

```ruby
{
  key: "name-of-complicated-computation",
  store: "ActiveSupport::Cache::MemCacheStore"
}
```

[ActiveSupport::Cache::FileStore]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/FileStore.html
[ActiveSupport::Cache::MemCacheStore]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/MemCacheStore.html
[ActiveSupport::Cache::MemoryStore]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/MemoryStore.html
[ActiveSupport::Cache::RedisCacheStore]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/RedisCacheStore.html
[ActiveSupport::Cache::Store#fetch]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-fetch
[ActiveSupport::Cache::Store#fetch_multi]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-fetch_multi

### Active Support: Messages

#### `message_serializer_fallback.active_support`

| Key             | Value                         |
| --------------- | ----------------------------- |
| `:serializer`   | Primary (intended) serializer |
| `:fallback`     | Fallback (actual) serializer  |
| `:serialized`   | Serialized string             |
| `:deserialized` | Deserialized value            |

```ruby
{
  serializer: :json_allow_marshal,
  fallback: :marshal,
  serialized: "\x04\b{\x06I\"\nHello\x06:\x06ETI\"\nWorld\x06;\x00T",
  deserialized: { "Hello" => "World" },
}
```

### Rails

#### `deprecation.rails`

| Key                    | Value                                                 |
| ---------------------- | ------------------------------------------------------|
| `:message`             | The deprecation warning                               |
| `:callstack`           | Where the deprecation came from                       |
| `:gem_name`            | Name of the gem reporting the deprecation             |
| `:deprecation_horizon` | Version where the deprecated behavior will be removed |

### Railties

#### `load_config_initializer.railties`

| Key            | Value                                               |
| -------------- | --------------------------------------------------- |
| `:initializer` | Path of loaded initializer in `config/initializers` |

Exceptions
----------

If an exception happens during any instrumentation, the payload will include
information about it.

| Key                 | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| `:exception`        | An array of two elements. Exception class name and the message |
| `:exception_object` | The exception object                                           |

Creating Custom Events
----------------------

Adding your own events is easy as well. Active Support will take care of
all the heavy lifting for you. Simply call [`ActiveSupport::Notifications.instrument`][] with a `name`, `payload`, and a block.
The notification will be sent after the block returns. Active Support will generate the start and end times,
and add the instrumenter's unique ID. All data passed into the `instrument` call will make
it into the payload.

Here's an example:

```ruby
ActiveSupport::Notifications.instrument "my.custom.event", this: :data do
  # do your custom stuff here
end
```

Now you can listen to this event with:

```ruby
ActiveSupport::Notifications.subscribe "my.custom.event" do |name, started, finished, unique_id, data|
  puts data.inspect # {:this=>:data}
end
```

You may also call `instrument` without passing a block. This lets you leverage the
instrumentation infrastructure for other messaging uses.

```ruby
ActiveSupport::Notifications.instrument "my.custom.event", this: :data

ActiveSupport::Notifications.subscribe "my.custom.event" do |name, started, finished, unique_id, data|
  puts data.inspect # {:this=>:data}
end
```

You should follow Rails conventions when defining your own events. The format is: `event.library`.
If your application is sending Tweets, you should create an event named `tweet.twitter`.

[`ActiveSupport::Notifications.instrument`]: https://api.rubyonrails.org/classes/ActiveSupport/Notifications.html#method-c-instrument
