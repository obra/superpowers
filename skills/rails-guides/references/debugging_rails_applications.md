**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Debugging Rails Applications
============================

This guide introduces techniques for debugging Ruby on Rails applications.

After reading this guide, you will know:

* The purpose of debugging.
* How to track down problems and issues in your application that your tests aren't identifying.
* The different ways of debugging.
* How to analyze the stack trace.

--------------------------------------------------------------------------------

View Helpers for Debugging
--------------------------

One common task is to inspect the contents of a variable. Rails provides three different ways to do this:

* `debug`
* `to_yaml`
* `inspect`

### `debug`

The `debug` helper will return a \<pre> tag that renders the object using the YAML format. This will generate human-readable data from any object. For example, if you have this code in a view:

```html+erb
<%= debug @article %>
<p>
  <b>Title:</b>
  <%= @article.title %>
</p>
```

You'll see something like this:

```yaml
--- !ruby/object Article
attributes:
  updated_at: 2008-09-05 22:55:47
  body: It's a very helpful guide for debugging your Rails app.
  title: Rails debugging guide
  published: t
  id: "1"
  created_at: 2008-09-05 22:55:47
attributes_cache: {}


Title: Rails debugging guide
```

### `to_yaml`

Alternatively, calling `to_yaml` on any object converts it to YAML. You can pass this converted object into the `simple_format` helper method to format the output. This is how `debug` does its magic.

```html+erb
<%= simple_format @article.to_yaml %>
<p>
  <b>Title:</b>
  <%= @article.title %>
</p>
```

The above code will render something like this:

```yaml
--- !ruby/object Article
attributes:
updated_at: 2008-09-05 22:55:47
body: It's a very helpful guide for debugging your Rails app.
title: Rails debugging guide
published: t
id: "1"
created_at: 2008-09-05 22:55:47
attributes_cache: {}

Title: Rails debugging guide
```

### `inspect`

Another useful method for displaying object values is `inspect`, especially when working with arrays or hashes. This will print the object value as a string. For example:

```html+erb
<%= [1, 2, 3, 4, 5].inspect %>
<p>
  <b>Title:</b>
  <%= @article.title %>
</p>
```

Will render:

```
[1, 2, 3, 4, 5]

Title: Rails debugging guide
```

The Logger
----------

It can also be useful to save information to log files at runtime. Rails maintains a separate log file for each runtime environment.

### What is the Logger?

Rails makes use of the `ActiveSupport::Logger` class to write log information. Other loggers, such as `Log4r`, may be substituted:

```ruby
# config/environments/production.rb
config.logger = Logger.new(STDOUT)
config.logger = Log4r::Logger.new("Application Log")
```

TIP: By default, each log is created under `Rails.root/log/` and the log file is named after the environment in which the application is running.

### Log Levels

When something is logged, it's printed into the corresponding log if the log
level of the message is equal to or higher than the configured log level. If you
want to know the current log level, you can call the `Rails.logger.level`
method.

The available log levels are: `:debug`, `:info`, `:warn`, `:error`, `:fatal`,
and `:unknown`, corresponding to the log level numbers from 0 up to 5,
respectively. To change the default log level:

```ruby
# config/environments/production.rb
config.log_level = :warn
```

This is useful when you want to log under development or staging without flooding your production log with unnecessary information.

TIP: The default Rails log level is `:debug`. However, it is set to `:info` for the `production` environment in the default generated `config/environments/production.rb`.

### Sending Messages

To write in the current log use the `logger.(debug|info|warn|error|fatal|unknown)` method from within a controller, model, or mailer:

```ruby
logger.debug "Person attributes hash: #{@person.attributes.inspect}"
logger.info "Processing the request..."
logger.fatal "Terminating application, raised unrecoverable error!!!"
```

Here's an example of a method instrumented with extra logging:

```ruby
class ArticlesController < ApplicationController
  # ...

  def create
    @article = Article.new(article_params)
    logger.debug "New article: #{@article.attributes.inspect}"
    logger.debug "Article should be valid: #{@article.valid?}"

    if @article.save
      logger.debug "The article was saved and now the user is going to be redirected..."
      redirect_to @article, notice: 'Article was successfully created.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  # ...

  private
    def article_params
      params.expect(article: [:title, :body, :published])
    end
end
```

Here's an example of the log generated when this controller action is executed:

```
Started POST "/articles" for 127.0.0.1 at 2018-10-18 20:09:23 -0400
Processing by ArticlesController#create as HTML
  Parameters: {"utf8"=>"✓", "authenticity_token"=>"XLveDrKzF1SwaiNRPTaMtkrsTzedtebPPkmxEFIU0ordLjICSnXsSNfrdMa4ccyBjuGwnnEiQhEoMN6H1Gtz3A==", "article"=>{"title"=>"Debugging Rails", "body"=>"I'm learning how to print in logs.", "published"=>"0"}, "commit"=>"Create Article"}
New article: {"id"=>nil, "title"=>"Debugging Rails", "body"=>"I'm learning how to print in logs.", "published"=>false, "created_at"=>nil, "updated_at"=>nil}
Article should be valid: true
   (0.0ms)  begin transaction
  ↳ app/controllers/articles_controller.rb:31
  Article Create (0.5ms)  INSERT INTO "articles" ("title", "body", "published", "created_at", "updated_at") VALUES (?, ?, ?, ?, ?)  [["title", "Debugging Rails"], ["body", "I'm learning how to print in logs."], ["published", 0], ["created_at", "2018-10-19 00:09:23.216549"], ["updated_at", "2018-10-19 00:09:23.216549"]]
  ↳ app/controllers/articles_controller.rb:31
   (2.3ms)  commit transaction
  ↳ app/controllers/articles_controller.rb:31
The article was saved and now the user is going to be redirected...
Redirected to http://localhost:3000/articles/1
Completed 302 Found in 4ms (ActiveRecord: 0.8ms)
```

Adding extra logging like this makes it easy to search for unexpected or unusual behavior in your logs. If you add extra logging, be sure to make sensible use of log levels to avoid filling your production logs with useless trivia.

### Verbose Query Logs

When looking at database query output in logs, it may not be immediately clear why multiple database queries are triggered when a single method is called:

```irb
irb(main):001:0> Article.pamplemousse
  Article Load (0.4ms)  SELECT "articles".* FROM "articles"
  Comment Load (0.2ms)  SELECT "comments".* FROM "comments" WHERE "comments"."article_id" = ?  [["article_id", 1]]
  Comment Load (0.1ms)  SELECT "comments".* FROM "comments" WHERE "comments"."article_id" = ?  [["article_id", 2]]
  Comment Load (0.1ms)  SELECT "comments".* FROM "comments" WHERE "comments"."article_id" = ?  [["article_id", 3]]
=> #<Comment id: 2, author: "1", body: "Well, actually...", article_id: 1, created_at: "2018-10-19 00:56:10", updated_at: "2018-10-19 00:56:10">
```

After enabling `verbose_query_logs` we can see additional information for each query:

```irb
irb(main):003:0> Article.pamplemousse
  Article Load (0.2ms)  SELECT "articles".* FROM "articles"
  ↳ app/models/article.rb:5
  Comment Load (0.1ms)  SELECT "comments".* FROM "comments" WHERE "comments"."article_id" = ?  [["article_id", 1]]
  ↳ app/models/article.rb:6
  Comment Load (0.1ms)  SELECT "comments".* FROM "comments" WHERE "comments"."article_id" = ?  [["article_id", 2]]
  ↳ app/models/article.rb:6
  Comment Load (0.1ms)  SELECT "comments".* FROM "comments" WHERE "comments"."article_id" = ?  [["article_id", 3]]
  ↳ app/models/article.rb:6
=> #<Comment id: 2, author: "1", body: "Well, actually...", article_id: 1, created_at: "2018-10-19 00:56:10", updated_at: "2018-10-19 00:56:10">
```

Below each database statement you can see arrows pointing to the specific source filename (and line number) of the method that resulted in a database call e.g. `↳ app/models/article.rb:5`.

This can help you identify and address performance problems caused by N+1 queries: i.e. single database queries that generate multiple additional queries.

Verbose query logs are [enabled by default](configuring.html#config-active-record-verbose-query-logs) in the development environment logs.

WARNING: We recommend against using this setting in production environments. It relies on Ruby's `Kernel#caller` method which tends to allocate a lot of memory in order to generate stacktraces of method calls. Use query log tags (see below) instead.

### Verbose Enqueue Logs

Similar to the "Verbose Query Logs" above, allows to print source locations of methods that enqueue background jobs.

Verbose enqueue logs are [enabled by default](/7_1_release_notes.html#active-job-notable-changes) in the development environment logs.

```ruby
# config/environments/development.rb
config.active_job.verbose_enqueue_logs = true
```

```irb
# bin/rails console
ActiveJob.verbose_enqueue_logs = true
```

WARNING: We recommend against using this setting in production environments.

### Verbose redirect logs

Similar to other verbose log settings above, this logs the source location of a redirect.

```
Redirected to http://localhost:3000/posts/1
↳ app/controllers/posts_controller.rb:32:in `block (2 levels) in create'
```

It is enabled by default in development. To enable in other environments, use this configuration:

```rb
config.action_dispatch.verbose_redirect_logs = true
```

As with other verbose loggers, it is not recommended to be used in production environments.

SQL Query Comments
------------------

SQL statements can be commented with tags containing runtime information, such as the name of the controller or job, to
trace troublesome queries back to the area of the application that generated these statements. This is useful when you are
logging slow queries (e.g. [MySQL](https://dev.mysql.com/doc/refman/en/slow-query-log.html), [PostgreSQL](https://www.postgresql.org/docs/current/runtime-config-logging.html#GUC-LOG-MIN-DURATION-STATEMENT)),
viewing currently running queries, or for end-to-end tracing tools.

```ruby
config.active_record.query_log_tags_enabled = true
```

NOTE: Enabling Query tags automatically disables prepared statements, because it makes most queries unique.

By default the name of the application, the name and action of the controller, or the name of the job are logged. The
default format is [SQLCommenter](https://open-telemetry.github.io/opentelemetry-sqlcommenter/). For example:

```
Article Load (0.2ms)  SELECT "articles".* FROM "articles" /*application='Blog',controller='articles',action='index'*/

Article Update (0.3ms)  UPDATE "articles" SET "title" = ?, "updated_at" = ? WHERE "posts"."id" = ? /*application='Blog',job='ImproveTitleJob'*/  [["title", "Improved Rails debugging guide"], ["updated_at", "2022-10-16 20:25:40.091371"], ["id", 1]]
```

The behavior of [`ActiveRecord::QueryLogs`](https://api.rubyonrails.org/classes/ActiveRecord/QueryLogs.html) can be
modified to include anything that helps connect the dots from the SQL query, such as request and job ids for
application logs, account and tenant identifiers, etc.

### Tagged Logging

When running multi-user, multi-account applications, it's often useful
to be able to filter the logs using some custom rules. `TaggedLogging`
in Active Support helps you do exactly that by stamping log lines with subdomains, request ids, and anything else to aid debugging such applications.

```ruby
logger = ActiveSupport::TaggedLogging.new(Logger.new(STDOUT))
logger.tagged("BCX") { logger.info "Stuff" }                            # Logs "[BCX] Stuff"
logger.tagged("BCX", "Jason") { logger.info "Stuff" }                   # Logs "[BCX] [Jason] Stuff"
logger.tagged("BCX") { logger.tagged("Jason") { logger.info "Stuff" } } # Logs "[BCX] [Jason] Stuff"
```

### Impact of Logs on Performance

Logging will always have a small impact on the performance of your Rails app,
particularly when logging to disk. Additionally, there are a few subtleties:

Using the `:debug` level will have a greater performance penalty than `:fatal`,
as a far greater number of strings are being evaluated and written to the
log output (e.g. disk).

Another potential pitfall is too many calls to `Logger` in your code:

```ruby
logger.debug "Person attributes hash: #{@person.attributes.inspect}"
```

In the above example, there will be a performance impact even if the allowed
output level doesn't include debug. The reason is that Ruby has to evaluate
these strings, which includes instantiating the somewhat heavy `String` object
and interpolating the variables.

Therefore, it's recommended to pass blocks to the logger methods, as these are
only evaluated if the output level is the same as — or included in — the allowed level
(i.e. lazy loading). The same code rewritten would be:

```ruby
logger.debug { "Person attributes hash: #{@person.attributes.inspect}" }
```

The contents of the block, and therefore the string interpolation, are only
evaluated if debug is enabled. This performance savings are only really
noticeable with large amounts of logging, but it's a good practice to employ.

INFO: This section was written by [Jon Cairns at a Stack Overflow answer](https://stackoverflow.com/questions/16546730/logging-in-rails-is-there-any-performance-hit/16546935#16546935)
and it is licensed under [cc by-sa 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Debugging with the `debug` Gem
------------------------------

When your code is behaving in unexpected ways, you can try printing to logs or
the console to diagnose the problem. Unfortunately, there are times when this
sort of error tracking is not effective in finding the root cause of a problem.
When you actually need to journey into your running source code, the debugger
is your best companion.

The debugger can also help you if you want to learn about the Rails source code
but don't know where to start. Just debug any request to your application and
use this guide to learn how to move from the code you have written into the
underlying Rails code.

Rails 7 includes the `debug` gem in the `Gemfile` of new applications generated
by CRuby. By default, it is ready in the `development` and `test` environments.
Please check its [documentation](https://github.com/ruby/debug) for usage.

### Entering a Debugging Session

By default, a debugging session will start after the `debug` library is required, which happens when your app boots. But don't worry, the session won't interfere with your application.

To enter the debugging session, you can use `binding.break` and its aliases: `binding.b` and `debugger`. The following examples will use `debugger`:

```ruby
class PostsController < ApplicationController
  before_action :set_post, only: %i[ show edit update destroy ]

  # GET /posts or /posts.json
  def index
    @posts = Post.all
    debugger
  end
  # ...
end
```

Once your app evaluates the debugging statement, it'll enter the debugging session:

```ruby
Processing by PostsController#index as HTML
[2, 11] in ~/projects/rails-guide-example/app/controllers/posts_controller.rb
     2|   before_action :set_post, only: %i[ show edit update destroy ]
     3|
     4|   # GET /posts or /posts.json
     5|   def index
     6|     @posts = Post.all
=>   7|     debugger
     8|   end
     9|
    10|   # GET /posts/1 or /posts/1.json
    11|   def show
=>#0    PostsController#index at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:7
  #1    ActionController::BasicImplicitRender#send_action(method="index", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-8.2.0.alpha/lib/action_controller/metal/basic_implicit_render.rb:6
  # and 72 frames (use `bt' command for all frames)
(rdbg)
```

You can exit the debugging session at any time and continue your application execution with the `continue` (or `c`) command. Or, to exit both the debugging session and your application, use the `quit` (or `q`) command.

### The Context

After entering the debugging session, you can type in Ruby code as if you are in a Rails console or IRB.

```ruby
(rdbg) @posts    # ruby
[]
(rdbg) self
#<PostsController:0x0000000000aeb0>
(rdbg)
```

You can also use the `p` or `pp` command to evaluate Ruby expressions, which is useful when a variable name conflicts with a debugger command.

```ruby
(rdbg) p headers    # command
=> {"X-Frame-Options"=>"SAMEORIGIN", "X-XSS-Protection"=>"1; mode=block", "X-Content-Type-Options"=>"nosniff", "X-Download-Options"=>"noopen", "X-Permitted-Cross-Domain-Policies"=>"none", "Referrer-Policy"=>"strict-origin-when-cross-origin"}
(rdbg) pp headers    # command
{"X-Frame-Options"=>"SAMEORIGIN",
 "X-XSS-Protection"=>"1; mode=block",
 "X-Content-Type-Options"=>"nosniff",
 "X-Download-Options"=>"noopen",
 "X-Permitted-Cross-Domain-Policies"=>"none",
 "Referrer-Policy"=>"strict-origin-when-cross-origin"}
(rdbg)
```

Besides direct evaluation, the debugger also helps you collect a rich amount of information through different commands, such as:

- `info` (or `i`) - Information about current frame.
- `backtrace` (or `bt`) - Backtrace (with additional information).
- `outline` (or `o`, `ls`) - Available methods, constants, local variables, and instance variables in the current scope.

#### The `info` Command

`info` provides an overview of the values of local and instance variables that are visible from the current frame.

```ruby
(rdbg) info    # command
%self = #<PostsController:0x0000000000af78>
@_action_has_layout = true
@_action_name = "index"
@_config = {}
@_lookup_context = #<ActionView::LookupContext:0x00007fd91a037e38 @details_key=nil, @digest_cache=...
@_request = #<ActionDispatch::Request GET "http://localhost:3000/posts" for 127.0.0.1>
@_response = #<ActionDispatch::Response:0x00007fd91a03ea08 @mon_data=#<Monitor:0x00007fd91a03e8c8>...
@_response_body = nil
@_routes = nil
@marked_for_same_origin_verification = true
@posts = []
@rendered_format = nil
```

#### The `backtrace` Command

When used without any options, `backtrace` lists all the frames on the stack:

```ruby
=>#0    PostsController#index at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:7
  #1    ActionController::BasicImplicitRender#send_action(method="index", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-2.0.alpha/lib/action_controller/metal/basic_implicit_render.rb:6
  #2    AbstractController::Base#process_action(method_name="index", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-8.2.0.alpha/lib/abstract_controller/base.rb:214
  #3    ActionController::Rendering#process_action(#arg_rest=nil) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-8.2.0.alpha/lib/action_controller/metal/rendering.rb:53
  #4    block in process_action at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-8.2.0.alpha/lib/abstract_controller/callbacks.rb:221
  #5    block in run_callbacks at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activesupport-8.2.0.alpha/lib/active_support/callbacks.rb:118
  #6    ActionText::Rendering::ClassMethods#with_renderer(renderer=#<PostsController:0x0000000000af78>) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actiontext-8.2.0.alpha/lib/action_text/rendering.rb:20
  #7    block {|controller=#<PostsController:0x0000000000af78>, action=#<Proc:0x00007fd91985f1c0 /Users/st0012/...|} in <class:Engine> (4 levels) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actiontext-8.2.0.alpha/lib/action_text/engine.rb:69
  #8    [C] BasicObject#instance_exec at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activesupport-8.2.0.alpha/lib/active_support/callbacks.rb:127
  ..... and more
```

Every frame comes with:

- Frame identifier
- Call location
- Additional information (e.g. block or method arguments)

This will give you a great sense about what is happening in your app. However, you probably will notice that:

- There are too many frames (usually 50+ in a Rails app).
- Most of the frames are from Rails or other libraries you use.

The `backtrace` command provides 2 options to help you filter frames:

- `backtrace [num]` - only show `num` numbers of frames, e.g. `backtrace 10` .
- `backtrace /pattern/` - only show frames with identifier or location that matches the pattern, e.g. `backtrace /MyModel/`.

It is also possible to use these options together: `backtrace [num] /pattern/`.

#### The `outline` Command

`outline` is similar to `pry` and `irb`'s `ls` command. It will show you what is accessible from the current scope, including:

- Local variables
- Instance variables
- Class variables
- Methods & their sources

```ruby
ActiveSupport::Configurable#methods: config
AbstractController::Base#methods:
  action_methods  action_name  action_name=  available_action?  controller_path  inspect
  response_body
ActionController::Metal#methods:
  content_type       content_type=  controller_name  dispatch          headers
  location           location=      media_type       middleware_stack  middleware_stack=
  middleware_stack?  performed?     request          request=          reset_session
  response           response=      response_body=   response_code     session
  set_request!       set_response!  status           status=           to_a
ActionView::ViewPaths#methods:
  _prefixes  any_templates?  append_view_path   details_for_lookup  formats     formats=  locale
  locale=    lookup_context  prepend_view_path  template_exists?    view_paths
AbstractController::Rendering#methods: view_assigns

# .....

PostsController#methods: create  destroy  edit  index  new  show  update
instance variables:
  @_action_has_layout  @_action_name    @_config  @_lookup_context                      @_request
  @_response           @_response_body  @_routes  @marked_for_same_origin_verification  @posts
  @rendered_format
class variables: @@raise_on_open_redirects
```

### Breakpoints

There are many ways to insert and trigger a breakpoint in the debugger. In addition to adding debugging statements (e.g. `debugger`) directly in your code, you can also insert breakpoints with commands:

- `break` (or `b`)
  - `break` - list all breakpoints
  - `break <num>` - set a breakpoint on the `num` line of the current file
  - `break <file:num>` - set a breakpoint on the `num` line of `file`
  - `break <Class#method>` or `break <Class.method>` - set a breakpoint on `Class#method` or `Class.method`
  - `break <expr>.<method>` - sets a breakpoint on `<expr>` result's `<method>` method.
- `catch <Exception>` - set a breakpoint that'll stop when `Exception` is raised
- `watch <@ivar>` - set a breakpoint that'll stop when the result of current object's `@ivar` is changed (this is slow)

And to remove them, you can use:

- `delete` (or `del`)
  - `delete` - delete all breakpoints
  - `delete <num>` - delete the breakpoint with id `num`

#### The `break` Command

**Set a breakpoint on a specified line number - e.g. `b 28`**

```ruby
[20, 29] in ~/projects/rails-guide-example/app/controllers/posts_controller.rb
    20|   end
    21|
    22|   # POST /posts or /posts.json
    23|   def create
    24|     @post = Post.new(post_params)
=>  25|     debugger
    26|
    27|     respond_to do |format|
    28|       if @post.save
    29|         format.html { redirect_to @post, notice: "Post was successfully created." }
=>#0    PostsController#create at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:25
  #1    ActionController::BasicImplicitRender#send_action(method="create", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal/basic_implicit_render.rb:6
  # and 72 frames (use `bt' command for all frames)
(rdbg) b 28    # break command
#0  BP - Line  /Users/st0012/projects/rails-guide-example/app/controllers/posts_controller.rb:28 (line)
```

```ruby
(rdbg) c    # continue command
[23, 32] in ~/projects/rails-guide-example/app/controllers/posts_controller.rb
    23|   def create
    24|     @post = Post.new(post_params)
    25|     debugger
    26|
    27|     respond_to do |format|
=>  28|       if @post.save
    29|         format.html { redirect_to @post, notice: "Post was successfully created." }
    30|         format.json { render :show, status: :created, location: @post }
    31|       else
    32|         format.html { render :new, status: :unprocessable_entity }
=>#0    block {|format=#<ActionController::MimeResponds::Collec...|} in create at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:28
  #1    ActionController::MimeResponds#respond_to(mimes=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal/mime_responds.rb:205
  # and 74 frames (use `bt' command for all frames)

Stop by #0  BP - Line  /Users/st0012/projects/rails-guide-example/app/controllers/posts_controller.rb:28 (line)
```

Set a breakpoint on a given method call - e.g. `b @post.save`.

```ruby
[20, 29] in ~/projects/rails-guide-example/app/controllers/posts_controller.rb
    20|   end
    21|
    22|   # POST /posts or /posts.json
    23|   def create
    24|     @post = Post.new(post_params)
=>  25|     debugger
    26|
    27|     respond_to do |format|
    28|       if @post.save
    29|         format.html { redirect_to @post, notice: "Post was successfully created." }
=>#0    PostsController#create at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:25
  #1    ActionController::BasicImplicitRender#send_action(method="create", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal/basic_implicit_render.rb:6
  # and 72 frames (use `bt' command for all frames)
(rdbg) b @post.save    # break command
#0  BP - Method  @post.save at /Users/st0012/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/suppressor.rb:43

```

```ruby
(rdbg) c    # continue command
[39, 48] in ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/suppressor.rb
    39|         SuppressorRegistry.suppressed[name] = previous_state
    40|       end
    41|     end
    42|
    43|     def save(**) # :nodoc:
=>  44|       SuppressorRegistry.suppressed[self.class.name] ? true : super
    45|     end
    46|
    47|     def save!(**) # :nodoc:
    48|       SuppressorRegistry.suppressed[self.class.name] ? true : super
=>#0    ActiveRecord::Suppressor#save(#arg_rest=nil) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/suppressor.rb:44
  #1    block {|format=#<ActionController::MimeResponds::Collec...|} in create at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:28
  # and 75 frames (use `bt' command for all frames)

Stop by #0  BP - Method  @post.save at /Users/st0012/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/suppressor.rb:43
```

#### The `catch` Command

Stop when an exception is raised - e.g. `catch ActiveRecord::RecordInvalid`.

```ruby
[20, 29] in ~/projects/rails-guide-example/app/controllers/posts_controller.rb
    20|   end
    21|
    22|   # POST /posts or /posts.json
    23|   def create
    24|     @post = Post.new(post_params)
=>  25|     debugger
    26|
    27|     respond_to do |format|
    28|       if @post.save!
    29|         format.html { redirect_to @post, notice: "Post was successfully created." }
=>#0    PostsController#create at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:25
  #1    ActionController::BasicImplicitRender#send_action(method="create", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal/basic_implicit_render.rb:6
  # and 72 frames (use `bt' command for all frames)
(rdbg) catch ActiveRecord::RecordInvalid    # command
#1  BP - Catch  "ActiveRecord::RecordInvalid"
```

```ruby
(rdbg) c    # continue command
[75, 84] in ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb
    75|     def default_validation_context
    76|       new_record? ? :create : :update
    77|     end
    78|
    79|     def raise_validation_error
=>  80|       raise(RecordInvalid.new(self))
    81|     end
    82|
    83|     def perform_validations(options = {})
    84|       options[:validate] == false || valid?(options[:context])
=>#0    ActiveRecord::Validations#raise_validation_error at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb:80
  #1    ActiveRecord::Validations#save!(options={}) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb:53
  # and 88 frames (use `bt' command for all frames)

Stop by #1  BP - Catch  "ActiveRecord::RecordInvalid"
```

#### The `watch` Command

Stop when the instance variable is changed - e.g. `watch @_response_body`.

```ruby
[20, 29] in ~/projects/rails-guide-example/app/controllers/posts_controller.rb
    20|   end
    21|
    22|   # POST /posts or /posts.json
    23|   def create
    24|     @post = Post.new(post_params)
=>  25|     debugger
    26|
    27|     respond_to do |format|
    28|       if @post.save!
    29|         format.html { redirect_to @post, notice: "Post was successfully created." }
=>#0    PostsController#create at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:25
  #1    ActionController::BasicImplicitRender#send_action(method="create", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal/basic_implicit_render.rb:6
  # and 72 frames (use `bt' command for all frames)
(rdbg) watch @_response_body    # command
#0  BP - Watch  #<PostsController:0x00007fce69ca5320> @_response_body =
```

```ruby
(rdbg) c    # continue command
[173, 182] in ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal.rb
   173|       body = [body] unless body.nil? || body.respond_to?(:each)
   174|       response.reset_body!
   175|       return unless body
   176|       response.body = body
   177|       super
=> 178|     end
   179|
   180|     # Tests if render or redirect has already happened.
   181|     def performed?
   182|       response_body || response.committed?
=>#0    ActionController::Metal#response_body=(body=["<html><body>You are being <a href=\"ht...) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal.rb:178 #=> ["<html><body>You are being <a href=\"ht...
  #1    ActionController::Redirecting#redirect_to(options=#<Post id: 13, title: "qweqwe", content:..., response_options={:allow_other_host=>false}) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal/redirecting.rb:74
  # and 82 frames (use `bt' command for all frames)

Stop by #0  BP - Watch  #<PostsController:0x00007fce69ca5320> @_response_body =  -> ["<html><body>You are being <a href=\"http://localhost:3000/posts/13\">redirected</a>.</body></html>"]
(rdbg)
```

#### Breakpoint Options

In addition to different types of breakpoints, you can also specify options to achieve more advanced debugging workflows. Currently, the debugger supports 4 options:

- `do: <cmd or expr>` - when the breakpoint is triggered, execute the given command/expression and continue the program:
  - `break Foo#bar do: bt` - when `Foo#bar` is called, print the stack frames.
- `pre: <cmd or expr>` - when the breakpoint is triggered, execute the given command/expression before stopping:
  - `break Foo#bar pre: info` - when `Foo#bar` is called, print its surrounding variables before stopping.
- `if: <expr>` - the breakpoint only stops if the result of `<expr`> is true:
  - `break Post#save if: params[:debug]` - stops at `Post#save` if `params[:debug]` is also true.
- `path: <path_regexp>` - the breakpoint only stops if the event that triggers it (e.g. a method call) happens from the given path:
  - `break Post#save path: app/services/a_service` - stops at `Post#save` if the method call happens at a path that includes `app/services/a_service`.

Please also note that the first 3 options: `do:`, `pre:` and `if:` are also available for the debug statements we mentioned earlier. For example:

```ruby
[2, 11] in ~/projects/rails-guide-example/app/controllers/posts_controller.rb
     2|   before_action :set_post, only: %i[ show edit update destroy ]
     3|
     4|   # GET /posts or /posts.json
     5|   def index
     6|     @posts = Post.all
=>   7|     debugger(do: "info")
     8|   end
     9|
    10|   # GET /posts/1 or /posts/1.json
    11|   def show
=>#0    PostsController#index at ~/projects/rails-guide-example/app/controllers/posts_controller.rb:7
  #1    ActionController::BasicImplicitRender#send_action(method="index", args=[]) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/actionpack-7.0.0.alpha2/lib/action_controller/metal/basic_implicit_render.rb:6
  # and 72 frames (use `bt' command for all frames)
(rdbg:binding.break) info
%self = #<PostsController:0x00000000017480>
@_action_has_layout = true
@_action_name = "index"
@_config = {}
@_lookup_context = #<ActionView::LookupContext:0x00007fce3ad336b8 @details_key=nil, @digest_cache=...
@_request = #<ActionDispatch::Request GET "http://localhost:3000/posts" for 127.0.0.1>
@_response = #<ActionDispatch::Response:0x00007fce3ad397e8 @mon_data=#<Monitor:0x00007fce3ad396a8>...
@_response_body = nil
@_routes = nil
@marked_for_same_origin_verification = true
@posts = #<ActiveRecord::Relation [#<Post id: 2, title: "qweqwe", content: "qweqwe", created_at: "...
@rendered_format = nil
```

#### Program Your Debugging Workflow

With those options, you can script your debugging workflow in one line like:

```ruby
def create
  debugger(do: "catch ActiveRecord::RecordInvalid do: bt 10")
  # ...
end
```

And then the debugger will run the scripted command and insert the catch breakpoint

```ruby
(rdbg:binding.break) catch ActiveRecord::RecordInvalid do: bt 10
#0  BP - Catch  "ActiveRecord::RecordInvalid"
[75, 84] in ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb
    75|     def default_validation_context
    76|       new_record? ? :create : :update
    77|     end
    78|
    79|     def raise_validation_error
=>  80|       raise(RecordInvalid.new(self))
    81|     end
    82|
    83|     def perform_validations(options = {})
    84|       options[:validate] == false || valid?(options[:context])
=>#0    ActiveRecord::Validations#raise_validation_error at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb:80
  #1    ActiveRecord::Validations#save!(options={}) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb:53
  # and 88 frames (use `bt' command for all frames)
```

Once the catch breakpoint is triggered, it'll print the stack frames

```ruby
Stop by #0  BP - Catch  "ActiveRecord::RecordInvalid"

(rdbg:catch) bt 10
=>#0    ActiveRecord::Validations#raise_validation_error at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb:80
  #1    ActiveRecord::Validations#save!(options={}) at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/validations.rb:53
  #2    block in save! at ~/.rbenv/versions/3.0.1/lib/ruby/gems/3.0.0/gems/activerecord-7.0.0.alpha2/lib/active_record/transactions.rb:302
```

This technique can save you from repeated manual input and make the debugging experience smoother.

You can find more commands and configuration options from its [documentation](https://github.com/ruby/debug).

Debugging with the `web-console` Gem
------------------------------------

Web Console is a bit like `debug`, but it runs in the browser. You can request a console in the context of a view or a controller on any page. The console would be rendered next to your HTML content.

### Console

Inside any controller action or view, you can invoke the console by
calling the `console` method.

For example, in a controller:

```ruby
class PostsController < ApplicationController
  def new
    console
    @post = Post.new
  end
end
```

Or in a view:

```html+erb
<% console %>

<h2>New Post</h2>
```

This will render a console inside your view. You don't need to care about the
location of the `console` call; it won't be rendered on the spot of its
invocation but next to your HTML content.

The console executes pure Ruby code: You can define and instantiate
custom classes, create new models, and inspect variables.

NOTE: Only one console can be rendered per request. Otherwise `web-console`
will raise an error on the second `console` invocation.

### Inspecting Variables

You can invoke `instance_variables` to list all the instance variables
available in your context. If you want to list all the local variables, you can
do that with `local_variables`.

### Settings

* `config.web_console.allowed_ips`: Authorized list of IPv4 or IPv6
  addresses and networks (defaults: `127.0.0.1/8, ::1`).
* `config.web_console.whiny_requests`: Log a message when a console rendering
  is prevented (defaults: `true`).

Since `web-console` evaluates plain Ruby code remotely on the server, don't try
to use it in production.

Debugging Memory Leaks
----------------------

A Ruby application (on Rails or not), can leak memory — either in the Ruby code
or at the C code level.

In this section, you will learn how to find and fix such leaks by using tools
such as Valgrind.

### Valgrind

[Valgrind](http://valgrind.org/) is an application for detecting C-based memory
leaks and race conditions.

There are Valgrind tools that can automatically detect many memory management
and threading bugs, and profile your programs in detail. For example, if a C
extension in the interpreter calls `malloc()` but doesn't properly call
`free()`, this memory won't be available until the app terminates.

For further information on how to install Valgrind and use with Ruby, refer to
[Valgrind and Ruby](https://web.archive.org/web/20230518081626/https://blog.evanweaver.com/2008/02/05/valgrind-and-ruby/)
by Evan Weaver.

### Find a Memory Leak

There is an excellent article about detecting and fixing memory leaks at Derailed, [which you can read here](https://github.com/schneems/derailed_benchmarks#is-my-app-leaking-memory).


Plugins for Debugging
---------------------

There are some Rails plugins to help you to find errors and debug your
application. Here is a list of useful plugins for debugging:

* [Query Trace](https://github.com/ruckus/active-record-query-trace/tree/master) Adds query
  origin tracing to your logs.
* [Exception Notifier](https://github.com/smartinez87/exception_notification/tree/master)
  Provides a mailer object and a default set of templates for sending email
  notifications when errors occur in a Rails application.
* [Better Errors](https://github.com/charliesome/better_errors) Replaces the
  standard Rails error page with a new one containing more contextual information,
  like source code and variable inspection.
* [RailsPanel](https://github.com/dejan/rails_panel) Chrome extension for Rails
  development that will end your tailing of development.log. Have all information
  about your Rails app requests in the browser — in the Developer Tools panel.
  Provides insight to db/rendering/total times, parameter list, rendered views and
  more.
* [Pry](https://github.com/pry/pry) An IRB alternative and runtime developer console.

References
----------

* [web-console Homepage](https://github.com/rails/web-console)
* [debug homepage](https://github.com/ruby/debug)
