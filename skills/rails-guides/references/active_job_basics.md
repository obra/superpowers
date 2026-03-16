**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Job Basics
=================

This guide provides you with all you need to get started in creating, enqueuing
and executing background jobs.

After reading this guide, you will know:

* How to create and enqueue jobs.
* How to configure and use Solid Queue.
* How to run jobs in the background.
* How to send emails from your application asynchronously.

--------------------------------------------------------------------------------

What is Active Job?
-------------------

Active Job is a framework in Rails designed for declaring background jobs and
executing them on a queuing backend. It provides a standardized interface for
tasks like sending emails, processing data, or handling regular maintenance
activities, such as clean-ups and billing charges. By offloading these tasks
from the main application thread to a queuing backend like the default Solid
Queue, Active Job ensures that time-consuming operations do not block the
request-response cycle. This can improve the performance and responsiveness of
the application, allowing it to handle tasks in parallel.

Create and Enqueue Jobs
-----------------------

This section will provide a step-by-step guide to create a job and enqueue it.

### Create the Job

Active Job provides a Rails generator to create jobs. The following will create
a job in `app/jobs` (with an attached test case under `test/jobs`):

```bash
$ bin/rails generate job guests_cleanup
invoke  test_unit
create    test/jobs/guests_cleanup_job_test.rb
create  app/jobs/guests_cleanup_job.rb
```

You can also create a job that will run on a specific queue:

```bash
$ bin/rails generate job guests_cleanup --queue urgent
```

If you don't want to use a generator, you could create your own file inside of
`app/jobs`, just make sure that it inherits from `ApplicationJob`.

Here's what a job looks like:

```ruby
class GuestsCleanupJob < ApplicationJob
  queue_as :default

  def perform(*guests)
    # Do something later
  end
end
```

Note that you can define `perform` with as many arguments as you want.

If you already have an abstract class and its name differs from
`ApplicationJob`, you can pass the `--parent` option to indicate you want a
different abstract class:

```bash
$ bin/rails generate job process_payment --parent=payment_job
```

```ruby
class ProcessPaymentJob < PaymentJob
  queue_as :default

  def perform(*args)
    # Do something later
  end
end
```

### Enqueue the Job

Enqueue a job using [`perform_later`][] and, optionally, [`set`][]. Like so:

```ruby
# Enqueue a job to be performed as soon as the queuing system is
# free.
GuestsCleanupJob.perform_later guest
```

```ruby
# Enqueue a job to be performed tomorrow at noon.
GuestsCleanupJob.set(wait_until: Date.tomorrow.noon).perform_later(guest)
```

```ruby
# Enqueue a job to be performed 1 week from now.
GuestsCleanupJob.set(wait: 1.week).perform_later(guest)
```

```ruby
# `perform_now` and `perform_later` will call `perform` under the hood so
# you can pass as many arguments as defined in the latter.
GuestsCleanupJob.perform_later(guest1, guest2, filter: "some_filter")
```

That's it!

[`perform_later`]:
    https://api.rubyonrails.org/classes/ActiveJob/Enqueuing/ClassMethods.html#method-i-perform_later
[`set`]:
    https://api.rubyonrails.org/classes/ActiveJob/Core/ClassMethods.html#method-i-set

### Enqueue Jobs in Bulk

You can enqueue multiple jobs at once using
[`perform_all_later`](https://api.rubyonrails.org/classes/ActiveJob.html#method-c-perform_all_later).
For more details see [Bulk Enqueuing](#bulk-enqueuing).

Default Backend: Solid Queue
------------------------------

Solid Queue, which is enabled by default from Rails version 8.0 and onward, is a
database-backed queuing system for Active Job, allowing you to queue large
amounts of data without requiring additional dependencies such as Redis.

Besides regular job enqueuing and processing, Solid Queue supports delayed jobs,
concurrency controls, numeric priorities per job, priorities by queue order, and
more.

### Set Up

#### Development

In development, Rails provides an asynchronous in-process queuing system, which
keeps the jobs in RAM. If the process crashes or the machine is reset, then all
outstanding jobs are lost with the default async backend. This can be fine for
smaller apps or non-critical jobs in development.

However, if you use Solid Queue instead, you can configure it in the same way as
in the production environment:

```ruby
# config/environments/development.rb
config.active_job.queue_adapter = :solid_queue
config.solid_queue.connects_to = { database: { writing: :queue } }
```

which sets the `:solid_queue` adapter as the default for Active Job in the
development environment, and connects to the `queue` database for writing.

Thereafter, you'd add `queue` to the development database configuration:

```yaml
# config/database.yml
development:
  primary:
    <<: *default
    database: storage/development.sqlite3
  queue:
    <<: *default
    database: storage/development_queue.sqlite3
    migrations_paths: db/queue_migrate
```

NOTE: The key `queue` from the database configuration needs to match the key
used in the configuration for `config.solid_queue.connects_to`.

You can then run `db:prepare` to ensure the `queue` database in `development` has all the required tables:

```bash
$ bin/rails db:prepare
```

TIP: You can find the default generated schema for the `queue` database in
`db/queue_schema.rb`. They will contain tables like
`solid_queue_ready_executions`, `solid_queue_scheduled_executions`, and more.

Finally, to start the queue and start processing jobs you can run:

```bash
bin/jobs start
```

#### Production

Solid Queue is already configured for the production environment. If you open
`config/environments/production.rb`, you will see the following:

```ruby
# config/environments/production.rb
# Replace the default in-process and non-durable queuing backend for Active Job.
config.active_job.queue_adapter = :solid_queue
config.solid_queue.connects_to = { database: { writing: :queue } }
```

Additionally, the database connection for the `queue` database is configured in
`config/database.yml`:

```yaml
# config/database.yml
# Store production database in the storage/ directory, which by default
# is mounted as a persistent Docker volume in config/deploy.yml.
production:
  primary:
    <<: *default
    database: storage/production.sqlite3
  queue:
    <<: *default
    database: storage/production_queue.sqlite3
    migrations_paths: db/queue_migrate
```

Make sure you run `db:prepare` so your database is ready to use:

```bash
$ bin/rails db:prepare
```


### Configuration

The configuration options for Solid Queue are defined in `config/queue.yml`.
Here is an example of the default configuration:

```yaml
default: &default
  dispatchers:
    - polling_interval: 1
      batch_size: 500
  workers:
    - queues: "*"
      threads: 3
      processes: <%= ENV.fetch("JOB_CONCURRENCY", 1) %>
      polling_interval: 0.1
```

In order to understand the configuration options for Solid Queue, you must
understand the different types of roles:

- **Dispatchers**: They select jobs scheduled to run for the future. When it's
  time for these jobs to run, dispatchers move them from the
  `solid_queue_scheduled_executions` table to the `solid_queue_ready_executions`
  table so workers can pick them up. They also manage concurrency-related
  maintenance.
- **Workers**: They pick up jobs that are ready to run. These jobs are taken
  from the `solid_queue_ready_executions` table.
- **Scheduler**: This takes care of recurring tasks, adding jobs to the queue
  when they're due.
- **Supervisor**: It oversees the whole system, managing workers and
  dispatchers. It starts and stops them as needed, monitors their health, and
  ensures everything runs smoothly.

Everything is optional in the `config/queue.yml`. If no configuration is
provided, Solid Queue will run with one dispatcher and one worker with default
settings. Below are some of the configuration options you can set in
`config/queue.yml`:

| **Option**                           | **Description**                                                                                     | **Default Value**                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **polling_interval**                 | Time in seconds workers/dispatchers wait before checking for more jobs.                             | 1 second (dispatchers), 0.1 seconds (workers) |
| **batch_size**                       | Number of jobs dispatched in a batch.                                                               | 500                                           |
| **concurrency_maintenance_interval** | Time in seconds the dispatcher waits before checking for blocked jobs that can be unblocked.        | 600 seconds                                   |
| **queues**                           | List of queues workers fetch jobs from. Supports `*` for all queues or queue name prefixes.         | `*`                                           |
| **threads**                          | Maximum size of the thread pool for each worker. Determines how many jobs a worker fetches at once. | 3                                             |
| **processes**                        | Number of worker processes forked by the supervisor. Each process can dedicate a CPU core.          | 1                                             |
| **concurrency_maintenance**          | Whether the dispatcher performs concurrency maintenance work.                                       | true                                          |

You can read more about these [configuration options in the Solid Queue
documentation](https://github.com/rails/solid_queue?tab=readme-ov-file#configuration).
There are also [additional configuration
options](https://github.com/rails/solid_queue?tab=readme-ov-file#other-configuration-settings)
that can be set in `config/<environment>.rb` to further configure Solid Queue in
your Rails Application.

### Queue Order

As per the configuration options in the [Configuration section](#configuration),
the `queues` configuration option will list the queues that workers will pick
jobs from. In a list of queues, the order matters. Workers will pick jobs from
the first queue in the list - once there are no more jobs in the first queue,
only then will it move onto the second, and so on.

```yaml
# config/queue.yml
production:
  workers:
    - queues:[active_storage*, mailers]
      threads: 3
      polling_interval: 5
```

In the above example, workers will fetch jobs from queues starting with
"active_storage", like  the `active_storage_analyse` queue and
`active_storage_transform` queue. Only when no jobs remain in the
`active_storage`-prefixed queues will workers move on to the `mailers` queue.

NOTE: The wildcard `*` (like at the end of "active_storage") is only allowed on
its own or at the end of a queue name to match all queues with the same prefix.
You can't specify queue names such as `*_some_queue`.

WARNING: Using wildcard queue names (e.g., `queues: active_storage*`) can slow
down polling performance in SQLite and PostgreSQL due to the need for a `DISTINCT`
query to identify all matching queues, which can be slow on large tables in these RDBMS.
For better performance, it’s best to specify exact queue names instead of using
wildcards. Read more about this in [Queues specification and performance in the
Solid Queue documentation](https://github.com/rails/solid_queue?tab=readme-ov-file#queues-specification-and-performance)

Active Job supports positive integer priorities when enqueuing jobs (see
[Priority section](#priority)). Within a single queue, jobs are picked based on
their priority (with lower integers being higher priority). However, when you
have multiple queues, the order of the queues themselves takes priority.

For example, if you have two queues, `production` and `background`, jobs in the
`production` queue will always be processed first, even if some jobs in the
`background` queue have a higher priority.

### Threads, Processes, and Signals

In Solid Queue, parallelism is achieved through threads (configurable via the
[`threads` parameter](#configuration)), processes (via the [`processes`
parameter](#configuration)), or horizontal scaling. The supervisor manages
processes and responds to the following signals:

- **TERM, INT**: Starts graceful termination, sending a TERM signal and waiting
  up to `SolidQueue.shutdown_timeout`. If not finished, a QUIT signal forces
  processes to exit.
- **QUIT**: Forces immediate termination of processes.

If a worker is killed unexpectedly (e.g., with a `KILL` signal), in-flight jobs
are marked as failed, and errors like `SolidQueue::Processes::ProcessExitError`
or `SolidQueue::Processes::ProcessPrunedError` are raised. Heartbeat settings
help manage and detect expired processes. Read more about [Threads, Processes
and Signals in the Solid Queue
documentation](https://github.com/rails/solid_queue?tab=readme-ov-file#threads-processes-and-signals).

### Errors When Enqueuing

Solid Queue raises a `SolidQueue::Job::EnqueueError` when Active Record errors
occur during job enqueuing. This is different from the `ActiveJob::EnqueueError`
raised by Active Job, which handles the error and makes `perform_later` return
false. This makes error handling trickier for jobs enqueued by Rails or
third-party gems like `Turbo::Streams::BroadcastJob`.

For recurring tasks, any errors encountered while enqueuing are logged, but they
won’t be raised. Read more about [Errors When Enqueuing in the Solid Queue
documentation](https://github.com/rails/solid_queue?tab=readme-ov-file#errors-when-enqueuing).

### Concurrency Controls

Solid Queue extends Active Job with concurrency controls, allowing you to limit
how many jobs of a certain type or with specific arguments can run at the same
time. If a job exceeds the limit, it will be blocked until another job finishes
or the duration expires. For example:

```ruby
class MyJob < ApplicationJob
  limits_concurrency to: 2, key: ->(contact) { contact.account }, duration: 5.minutes

  def perform(contact)
    # perform job logic
  end
end
```

In this example, only two `MyJob` instances for the same account will run
concurrently. After that, other jobs will be blocked until one completes.

The `group` parameter can be used to control concurrency across different job
types. For instance, two different job classes that use the same group will have
their concurrency limited together:

```ruby
class Box::MovePostingsByContactToDesignatedBoxJob < ApplicationJob
  limits_concurrency key: ->(contact) { contact }, duration: 15.minutes, group: "ContactActions"
end

class Bundle::RebundlePostingsJob < ApplicationJob
  limits_concurrency key: ->(bundle) { bundle.contact }, duration: 15.minutes, group: "ContactActions"
end
```

This ensures that only one job for a given contact can run at a time, regardless
of the job class.

Read more about [Concurrency Controls in the Solid Queue
documentation](https://github.com/rails/solid_queue?tab=readme-ov-file#concurrency-controls).

### Error Reporting on Jobs

If your error tracking service doesn’t automatically report job errors, you can
manually hook into Active Job to report them. For example, you can add a
`rescue_from` block in `ApplicationJob`:

```ruby
class ApplicationJob < ActiveJob::Base
  rescue_from(Exception) do |exception|
    Rails.error.report(exception)
    raise exception
  end
end
```

If you use ActionMailer, you’ll need to handle errors for `MailDeliveryJob`
separately:

```ruby
class ApplicationMailer < ActionMailer::Base
  ActionMailer::MailDeliveryJob.rescue_from(Exception) do |exception|
    Rails.error.report(exception)
    raise exception
  end
end
```

### Transactional Integrity on Jobs

⚠️ Having your jobs in the same ACID-compliant database as your application data
enables a powerful yet sharp tool: taking advantage of transactional integrity
to ensure some action in your app is not committed unless your job is also committed
and vice versa, and ensuring that your job won't be enqueued until the transaction
within which you're enqueuing it is committed. This can be very powerful and useful,
but it can also backfire if you base some of your logic on this behavior,
and in the future, you move to another active job backend, or if you simply move
Solid Queue to its own database, and suddenly the behavior changes under you.

Because this can be quite tricky and many people shouldn't need to worry about it,
by default Solid Queue is configured in a different database as the main app.

However, if you use Solid Queue in the same database as your app, you can make sure you
don't rely accidentally on transactional integrity with Active Job’s
`enqueue_after_transaction_commit` option which can be enabled for individual jobs or
all jobs through `ApplicationJob`:

```ruby
class ApplicationJob < ActiveJob::Base
  self.enqueue_after_transaction_commit = true
end
```

You can also configure Solid Queue to use the same database as your app while
avoiding relying on transactional integrity by setting up a separate database
connection for Solid Queue jobs. Read more about [Transactional Integrity in the
Solid Queue
documentation](https://github.com/rails/solid_queue?tab=readme-ov-file#jobs-and-transactional-integrity)

### Recurring Tasks

Solid Queue supports recurring tasks, similar to cron jobs. These tasks are
defined in a configuration file (by default, `config/recurring.yml`) and can be
scheduled at specific times. Here's an example of a task configuration:

```yaml
production:
  a_periodic_job:
    class: MyJob
    args: [42, { status: "custom_status" }]
    schedule: every second
  a_cleanup_task:
    command: "DeletedStuff.clear_all"
    schedule: every day at 9am
```

Each task specifies a `class` or `command` and a `schedule` (parsed using
[Fugit](https://github.com/floraison/fugit)). You can also pass arguments to
jobs, such as in the example for `MyJob` where `args` are passed. This can be
passed as a single argument, a hash, or an array of arguments that can also
include kwargs as the last element in the array. This allows jobs to run
periodically at specified times.

Read more about [Recurring Tasks in the Solid Queue
documentation](https://github.com/rails/solid_queue?tab=readme-ov-file#recurring-tasks).

### Job Tracking and Management

A tool like
[`mission_control-jobs`](https://github.com/rails/mission_control-jobs) can help
centralize the monitoring and management of failed jobs. It provides insights
into job statuses, failure reasons, and retry behaviors, enabling you to track
and resolve issues more effectively.

For instance, if a job fails to process a large file due to a timeout,
`mission_control-jobs` allows you to inspect the failure, review the job’s
arguments and execution history, and decide whether to retry, requeue, or
discard it.

Queues
------

With Active Job you can schedule the job to run on a specific queue using
[`queue_as`][]:

```ruby
class GuestsCleanupJob < ApplicationJob
  queue_as :low_priority
  # ...
end
```

You can prefix the queue name for all your jobs using
[`config.active_job.queue_name_prefix`][] in `application.rb`:

```ruby
# config/application.rb
module YourApp
  class Application < Rails::Application
    config.active_job.queue_name_prefix = Rails.env
  end
end
```

```ruby
# app/jobs/guests_cleanup_job.rb
class GuestsCleanupJob < ApplicationJob
  queue_as :low_priority
  # ...
end

# Now your job will run on queue production_low_priority on your
# production environment and on staging_low_priority
# on your staging environment
```

You can also configure the prefix on a per job basis.

```ruby
class GuestsCleanupJob < ApplicationJob
  queue_as :low_priority
  self.queue_name_prefix = nil
  # ...
end

# Now your job's queue won't be prefixed, overriding what
# was configured in `config.active_job.queue_name_prefix`.
```

The default queue name prefix delimiter is '\_'.  This can be changed by setting
[`config.active_job.queue_name_delimiter`][] in `application.rb`:

```ruby
# config/application.rb
module YourApp
  class Application < Rails::Application
    config.active_job.queue_name_prefix = Rails.env
    config.active_job.queue_name_delimiter = "."
  end
end
```

```ruby
# app/jobs/guests_cleanup_job.rb
class GuestsCleanupJob < ApplicationJob
  queue_as :low_priority
  # ...
end

# Now your job will run on queue production.low_priority on your
# production environment and on staging.low_priority
# on your staging environment
```

To control the queue from the job level you can pass a block to `queue_as`. The
block will be executed in the job context (so it can access `self.arguments`),
and it must return the queue name:

```ruby
class ProcessVideoJob < ApplicationJob
  queue_as do
    video = self.arguments.first
    if video.owner.premium?
      :premium_videojobs
    else
      :videojobs
    end
  end

  def perform(video)
    # Do process video
  end
end
```

```ruby
ProcessVideoJob.perform_later(Video.last)
```

If you want more control on what queue a job will be run you can pass a `:queue`
option to `set`:

```ruby
MyJob.set(queue: :another_queue).perform_later(record)
```

NOTE: If you choose to use an [alternate queuing
backend](#alternate-queuing-backends) you may need to specify the queues to
listen to.

[`config.active_job.queue_name_delimiter`]:
    configuring.html#config-active-job-queue-name-delimiter
[`config.active_job.queue_name_prefix`]:
    configuring.html#config-active-job-queue-name-prefix
[`queue_as`]:
    https://api.rubyonrails.org/classes/ActiveJob/QueueName/ClassMethods.html#method-i-queue_as


Priority
--------

You can schedule a job to run with a specific priority using
`queue_with_priority`:

```ruby
class GuestsCleanupJob < ApplicationJob
  queue_with_priority 10
  # ...
end
```

Solid Queue, the default queuing backend, prioritizes jobs based on the order of
the queues.  You can read more about it in the [Order of Queues
section](#queue-order). If you're using Solid Queue, and both the order of the
queues and the priority option are used, the queue order will take precedence,
and the priority option will only apply within each queue.

Other queuing backends may allow jobs to be prioritized relative to others
within the same queue or across multiple queues. Refer to the documentation of
your backend for more information.

Similar to `queue_as`, you can also pass a block to `queue_with_priority` to be
evaluated in the job context:

```ruby
class ProcessVideoJob < ApplicationJob
  queue_with_priority do
    video = self.arguments.first
    if video.owner.premium?
      0
    else
      10
    end
  end

  def perform(video)
    # Process video
  end
end
```

```ruby
ProcessVideoJob.perform_later(Video.last)
```

You can also pass a `:priority` option to `set`:

```ruby
MyJob.set(priority: 50).perform_later(record)
```

NOTE: If a lower priority number performs before or after a higher priority
number depends on the adapter implementation. Refer to documentation of your
backend for more information. Adapter authors are encouraged to treat a lower
number as more important.

[`queue_with_priority`]:
    https://api.rubyonrails.org/classes/ActiveJob/QueuePriority/ClassMethods.html#method-i-queue_with_priority

Job Continuations
-----------------

Jobs can be split into resumable steps using continuations. This is useful when
a job may be interrupted - for example, during queue shutdown. When using
continuations, the job can resume from the last completed step, avoiding the
need to restart from the beginning.

To use continuations, include the `ActiveJob::Continuable` module. You can then
define each step using the `step` method inside the `perform` method. Each step can
be declared with a block or by referencing a method name.

```ruby
class ProcessImportJob < ApplicationJob
  include ActiveJob::Continuable

  def perform(import_id)
    # Always runs on job start, even when resuming from an interrupted step.
    @import = Import.find(import_id)

    # Step defined using a block
    step :initialize do
      @import.initialize
    end

    # Step with a cursor — progress is saved and resumed if the job is interrupted
    step :process do |step|
      @import.records.find_each(start: step.cursor) do |record|
        record.process
        step.advance! from: record.id
      end
    end

    # Step defined by referencing a method
    step :finalize
  end

  private
    def finalize
      @import.finalize
    end
end
```

Each step runs sequentially. If the job is interrupted between steps, or within a
step that uses a cursor, the job resumes from the last recorded position. This
makes it easier to build long-running or multi-phase jobs that can safely pause
and resume without losing progress.
For more details, see [ActiveJob::Continuation](https://api.rubyonrails.org/classes/ActiveJob/Continuation.html).

Callbacks
---------

Active Job provides hooks to trigger logic during the life cycle of a job. Like
other callbacks in Rails, you can implement the callbacks as ordinary methods
and use a macro-style class method to register them as callbacks:

```ruby
class GuestsCleanupJob < ApplicationJob
  queue_as :default

  around_perform :around_cleanup

  def perform
    # Do something later
  end

  private
    def around_cleanup
      # Do something before perform
      yield
      # Do something after perform
    end
end
```

The macro-style class methods can also receive a block. Consider using this
style if the code inside your block is so short that it fits in a single line.
For example, you could send metrics for every job enqueued:

```ruby
class ApplicationJob < ActiveJob::Base
  before_enqueue { |job| $statsd.increment "#{job.class.name.underscore}.enqueue" }
end
```

### Available Callbacks

* [`before_enqueue`][]
* [`around_enqueue`][]
* [`after_enqueue`][]
* [`before_perform`][]
* [`around_perform`][]
* [`after_perform`][]
* [`after_discard`][]

[`before_enqueue`]:
    https://api.rubyonrails.org/classes/ActiveJob/Callbacks/ClassMethods.html#method-i-before_enqueue
[`around_enqueue`]:
    https://api.rubyonrails.org/classes/ActiveJob/Callbacks/ClassMethods.html#method-i-around_enqueue
[`after_enqueue`]:
    https://api.rubyonrails.org/classes/ActiveJob/Callbacks/ClassMethods.html#method-i-after_enqueue
[`before_perform`]:
    https://api.rubyonrails.org/classes/ActiveJob/Callbacks/ClassMethods.html#method-i-before_perform
[`around_perform`]:
    https://api.rubyonrails.org/classes/ActiveJob/Callbacks/ClassMethods.html#method-i-around_perform
[`after_perform`]:
    https://api.rubyonrails.org/classes/ActiveJob/Callbacks/ClassMethods.html#method-i-after_perform
[`after_discard`]:
    https://api.rubyonrails.org/classes/ActiveJob/Exceptions/ClassMethods.html#method-i-after_discard

Please note that when enqueuing jobs in bulk using `perform_all_later`,
callbacks such as `around_enqueue` will not be triggered on the individual jobs.
See [Bulk Enqueuing Callbacks](#bulk-enqueue-callbacks).

Bulk Enqueuing
--------------

You can enqueue multiple jobs at once using
[`perform_all_later`](https://api.rubyonrails.org/classes/ActiveJob.html#method-c-perform_all_later).
Bulk enqueuing reduces the number of round trips to the queue data store (like
Redis or a database), making it a more performant operation than enqueuing the
same jobs individually.

`perform_all_later` is a top-level API on Active Job. It accepts instantiated
jobs as arguments (note that this is different from `perform_later`).
`perform_all_later` does call `perform` under the hood. The arguments passed to
`new` will be passed on to `perform` when it's eventually called.

Here is an example calling `perform_all_later` with `GuestsCleanupJob` instances:

```ruby
# Create jobs to pass to `perform_all_later`.
# The arguments to `new` are passed on to `perform`
cleanup_jobs = Guest.all.map { |guest| GuestsCleanupJob.new(guest) }

# Will enqueue a separate job for each instance of `GuestsCleanupJob`
ActiveJob.perform_all_later(cleanup_jobs)

# Can also use `set` method to configure options before bulk enqueuing jobs.
cleanup_jobs = Guest.all.map { |guest| GuestsCleanupJob.new(guest).set(wait: 1.day) }

ActiveJob.perform_all_later(cleanup_jobs)
```

`perform_all_later` logs the number of jobs successfully enqueued, for example
if `Guest.all.map` above resulted in 3 `cleanup_jobs`, it would log
`Enqueued 3 jobs to Async (3 GuestsCleanupJob)` (assuming all were enqueued).

The return value of `perform_all_later` is `nil`. Note that this is different
from `perform_later`, which returns the instance of the queued job class.

### Enqueue Multiple Active Job Classes

With `perform_all_later`, it's also possible to enqueue different Active Job
class instances in the same call. For example:

```ruby
class ExportDataJob < ApplicationJob
  def perform(*args)
    # Export data
  end
end

class NotifyGuestsJob < ApplicationJob
  def perform(*guests)
    # Email guests
  end
end

# Instantiate job instances
cleanup_job = GuestsCleanupJob.new(guest)
export_job = ExportDataJob.new(data)
notify_job = NotifyGuestsJob.new(guest)

# Enqueues job instances from multiple classes at once
ActiveJob.perform_all_later(cleanup_job, export_job, notify_job)
```

### Bulk Enqueue Callbacks

When enqueuing jobs in bulk using `perform_all_later`, callbacks such as
`around_enqueue` will not be triggered on the individual jobs. This behavior is
in line with other Active Record bulk methods. Since callbacks run on individual
jobs, they can't take advantage of the bulk nature of this method.

However, the `perform_all_later` method does fire an
[`enqueue_all.active_job`](active_support_instrumentation.html#enqueue-all-active-job)
event which you can subscribe to using `ActiveSupport::Notifications`.

The method
[`successfully_enqueued?`](https://api.rubyonrails.org/classes/ActiveJob/Core.html#method-i-successfully_enqueued-3F)
can be used to find out if a given job was successfully enqueued.

### Queue Backend Support

For `perform_all_later`, bulk enqueuing needs to be backed by the queue backend.
Solid Queue, the default queue backend, supports bulk enqueuing using
`enqueue_all`.

[Other backends](#alternate-queuing-backends) like Sidekiq have a `push_bulk`
method, which can push a large number of jobs to Redis and prevent the round
trip network latency. GoodJob also supports bulk enqueuing with the
`GoodJob::Bulk.enqueue` method.

If the queue backend does *not* support bulk enqueuing, `perform_all_later` will
enqueue jobs one by one.

Action Mailer
------------

One of the most common jobs in a modern web application is sending emails
outside of the request-response cycle, so the user doesn't have to wait on it.
Active Job is integrated with Action Mailer so you can easily send emails
asynchronously:

```ruby
# If you want to send the email now use #deliver_now
UserMailer.welcome(@user).deliver_now

# If you want to send the email through Active Job use #deliver_later
UserMailer.welcome(@user).deliver_later
```

NOTE: Using the asynchronous queue from a Rake task (for example, to send an
email using `.deliver_later`) will generally not work because Rake will likely
end, causing the in-process thread pool to be deleted, before any/all of the
`.deliver_later` emails are processed. To avoid this problem, use `.deliver_now`
or run a persistent queue in development.


Internationalization
--------------------

Each job uses the `I18n.locale` set when the job was created. This is useful if
you send emails asynchronously:

```ruby
I18n.locale = :eo

UserMailer.welcome(@user).deliver_later # Email will be localized to Esperanto.
```


Supported Types for Arguments
----------------------------

ActiveJob supports the following types of arguments by default:

  - Basic types (`NilClass`, `String`, `Integer`, `Float`, `BigDecimal`,
    `TrueClass`, `FalseClass`)
  - `Symbol`
  - `Date`
  - `Time`
  - `DateTime`
  - `ActiveSupport::TimeWithZone`
  - `ActiveSupport::Duration`
  - `Hash` (Keys should be of `String` or `Symbol` type)
  - `ActiveSupport::HashWithIndifferentAccess`
  - `Array`
  - `Range`
  - `Module`
  - `Class`

### GlobalID

Active Job supports
[GlobalID](https://github.com/rails/globalid/blob/main/README.md) for
parameters. This makes it possible to pass live Active Record objects to your
job instead of class/id pairs, which you then have to manually deserialize.
Before, jobs would look like this:

```ruby
class TrashableCleanupJob < ApplicationJob
  def perform(trashable_class, trashable_id, depth)
    trashable = trashable_class.constantize.find(trashable_id)
    trashable.cleanup(depth)
  end
end
```

Now you can simply do:

```ruby
class TrashableCleanupJob < ApplicationJob
  def perform(trashable, depth)
    trashable.cleanup(depth)
  end
end
```

This works with any class that mixes in `GlobalID::Identification`, which by
default has been mixed into Active Record classes.

### Serializers

You can extend the list of supported argument types. You just need to define
your own serializer:

```ruby
# app/serializers/money_serializer.rb
class MoneySerializer < ActiveJob::Serializers::ObjectSerializer
  # Converts an object to a simpler representative using supported object types.
  # The recommended representative is a Hash with a specific key. Keys can be of basic types only.
  # You should call `super` to add the custom serializer type to the hash.
  def serialize(money)
    super(
      "amount" => money.amount,
      "currency" => money.currency
    )
  end

  # Converts serialized value into a proper object.
  def deserialize(hash)
    Money.new(hash["amount"], hash["currency"])
  end

  # Checks if an argument should be serialized by this serializer.
  def klass
    Money
  end
end
```

and add this serializer to the list:

```ruby
# config/initializers/custom_serializers.rb
Rails.application.config.active_job.custom_serializers << MoneySerializer
```

Note that autoloading reloadable code during initialization is not supported.
Thus it is recommended to set-up serializers to be loaded only once, e.g. by
amending `config/application.rb` like this:

```ruby
# config/application.rb
module YourApp
  class Application < Rails::Application
    config.autoload_once_paths << "#{root}/app/serializers"
  end
end
```

Exceptions
----------

Exceptions raised during the execution of the job can be handled with
[`rescue_from`][]:

```ruby
class GuestsCleanupJob < ApplicationJob
  queue_as :default

  rescue_from(ActiveRecord::RecordNotFound) do |exception|
    # Do something with the exception
  end

  def perform
    # Do something later
  end
end
```

If an exception from a job is not rescued, then the job is referred to as
"failed".

[`rescue_from`]:
    https://api.rubyonrails.org/classes/ActiveSupport/Rescuable/ClassMethods.html#method-i-rescue_from

### Retrying or Discarding Failed Jobs

A failed job will not be retried, unless configured otherwise.

It's possible to retry or discard a failed job by using [`retry_on`] or
[`discard_on`], respectively. For example:

```ruby
class RemoteServiceJob < ApplicationJob
  retry_on CustomAppException # defaults to 3s wait, 5 attempts

  discard_on ActiveJob::DeserializationError

  def perform(*args)
    # Might raise CustomAppException or ActiveJob::DeserializationError
  end
end
```

[`discard_on`]:
    https://api.rubyonrails.org/classes/ActiveJob/Exceptions/ClassMethods.html#method-i-discard_on
[`retry_on`]:
    https://api.rubyonrails.org/classes/ActiveJob/Exceptions/ClassMethods.html#method-i-retry_on

### Deserialization

GlobalID allows serializing full Active Record objects passed to `#perform`.

If a passed record is deleted after the job is enqueued but before the
`#perform` method is called Active Job will raise an
[`ActiveJob::DeserializationError`][] exception.

[`ActiveJob::DeserializationError`]:
    https://api.rubyonrails.org/classes/ActiveJob/DeserializationError.html

Job Testing
--------------

You can find detailed instructions on how to test your jobs in the [testing
guide](testing.html#testing-jobs).

Debugging
---------

If you need help figuring out where jobs are coming from, you can enable
[verbose logging](debugging_rails_applications.html#verbose-enqueue-logs).

Alternate Queuing Backends
--------------------------

Active Job has other built-in adapters for multiple queuing backends (Resque, Delayed Job, and others). To get an up-to-date list of the adapters see
the API Documentation for [`ActiveJob::QueueAdapters`][].

[`ActiveJob::QueueAdapters`]:
    https://api.rubyonrails.org/classes/ActiveJob/QueueAdapters.html

### Configuring the Backend

You can change your queuing backend with [`config.active_job.queue_adapter`]:

```ruby
# config/application.rb
module YourApp
  class Application < Rails::Application
    # Be sure to have the adapter's gem in your Gemfile
    # and follow the adapter's specific installation
    # and deployment instructions.
    config.active_job.queue_adapter = :async
  end
end
```

You can also configure your backend on a per job basis:

```ruby
class GuestsCleanupJob < ApplicationJob
  self.queue_adapter = :resque
  # ...
end

# Now your job will use `resque` as its backend queue adapter, overriding the default Solid Queue adapter.
```

[`config.active_job.queue_adapter`]:
    configuring.html#config-active-job-queue-adapter

### Starting the Backend

Since jobs run in parallel to your Rails application, most queuing libraries
require that you start a library-specific queuing service (in addition to
starting your Rails app) for the job processing to work. Refer to library
documentation for instructions on starting your queue backend.

Here is a noncomprehensive list of documentation:

- [Sidekiq](https://github.com/mperham/sidekiq/wiki/Active-Job)
- [Resque](https://github.com/resque/resque/wiki/ActiveJob)
- [Sneakers](https://github.com/jondot/sneakers/wiki/How-To:-Rails-Background-Jobs-with-ActiveJob)
- [Queue Classic](https://github.com/QueueClassic/queue_classic#active-job)
- [Delayed Job](https://github.com/collectiveidea/delayed_job#active-job)
- [Que](https://github.com/que-rb/que#additional-rails-specific-setup)
- [Good Job](https://github.com/bensheldon/good_job#readme)
