**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON
<https://guides.rubyonrails.org>.**

The Rails Command Line
======================

After reading this guide, you will know how to use the Rails command line:

* To create a Rails application.
* To generate models, controllers, tests, and database migrations.
* To start a development server.
* To inspect a Rails application through an interactive shell.
* To add and edit credentials.

--------------------------------------------------------------------------------

Overview
--------

The Rails command line is a powerful part of the Ruby on Rails framework. It
allows you to quickly start a new application by generating boilerplate code
(that follows Rails conventions). This guide includes an overview of Rails
commands that allow you to manage all aspects of your web application, including
the database.

You can get a list of commands available to you, which will often depend on your
current directory, by typing `bin/rails --help`. Each command has a description
to help clarify what it does.

```bash
$ bin/rails --help
Usage:
  bin/rails COMMAND [options]

You must specify a command. The most common commands are:

  generate     Generate new code (short-cut alias: "g")
  console      Start the Rails console (short-cut alias: "c")
  server       Start the Rails server (short-cut alias: "s")
  test         Run tests except system tests (short-cut alias: "t")
  test:system  Run system tests
  dbconsole    Start a console for the database specified in config/database.yml
               (short-cut alias: "db")
  plugin new   Create a new Rails railtie or engine

All commands can be run with -h (or --help) for more information.
```

The output of `bin/rails --help` then proceeds to list all commands in
alphabetical order, with a short description of each:

```bash
In addition to those commands, there are:
about                              List versions of all Rails frameworks ...
action_mailbox:ingress:exim        Relay an inbound email from Exim to ...
action_mailbox:ingress:postfix     Relay an inbound email from Postfix ...
action_mailbox:ingress:qmail       Relay an inbound email from Qmail to ...
action_mailbox:install             Install Action Mailbox and its ...
...
db:fixtures:load                   Load fixtures into the ...
db:migrate                         Migrate the database ...
db:migrate:status                  Display status of migrations
db:rollback                        Roll the schema back to ...
...
turbo:install                      Install Turbo into the app
turbo:install:bun                  Install Turbo into the app with bun
turbo:install:importmap            Install Turbo into the app with asset ...
turbo:install:node                 Install Turbo into the app with webpacker
turbo:install:redis                Switch on Redis and use it in development
version                            Show the Rails version
yarn:install                       Install all JavaScript dependencies as ...
zeitwerk:check                     Check project structure for Zeitwerk ...
```

In addition to `bin/rails --help`, running any command from the list above with
the `--help` flag can also be useful. For example, you can learn about the
options that can be used with `bin/rails routes`:

```bash
$ bin/rails routes --help
Usage:
  bin/rails routes

Options:
  -c, [--controller=CONTROLLER]      # Filter by a specific controller, e.g. PostsController or Admin::PostsController.
  -g, [--grep=GREP]                  # Grep routes by a specific pattern.
  -E, [--expanded], [--no-expanded]  # Print routes expanded vertically with parts explained.
  -u, [--unused], [--no-unused]      # Print unused routes.

List all the defined routes
```

Most Rails command line subcommands can be run with `--help` (or `-h`) and the
output can be very informative. For example `bin/rails generate model --help`
prints two pages of description, in addition to usage and options:

```bash
$ bin/rails generate model --help
Usage:
  bin/rails generate model NAME [field[:type][:index] field[:type][:index]] [options]
Options:
...
Description:
    Generates a new model. Pass the model name, either CamelCased or
    under_scored, and an optional list of attribute pairs as arguments.

    Attribute pairs are field:type arguments specifying the
    model's attributes. Timestamps are added by default, so you don't have to
    specify them by hand as 'created_at:datetime updated_at:datetime'.

    As a special case, specifying 'password:digest' will generate a
    password_digest field of string type, and configure your generated model and
    tests for use with Active Model has_secure_password (assuming the default ORM and test framework are being used).
    ...
```

Some of the most commonly used commands are:

* `bin/rails console`
* `bin/rails server`
* `bin/rails test`
* `bin/rails generate`
* `bin/rails db:migrate`
* `bin/rails db:create`
* `bin/rails routes`
* `bin/rails dbconsole`
* `rails new app_name`

We'll cover the above commands (and more) in the following sections, starting
with the command for creating a new application.

Creating a New Rails Application
--------------------------------

We can create a brand new Rails application using the `rails new` command.

INFO: You will need the rails gem installed in order to run the `rails new`
command. You can do this by typing `gem install rails` - for more step-by-step
instructions, see the [Installing Ruby on Rails](install_ruby_on_rails.html)
guide.

With the `new` command, Rails will set up the entire default directory structure
along with all the code needed to run a sample application right out of the box.
The first argument to `rails new` is the application name:

```bash
$ rails new my_app
     create
     create  README.md
     create  Rakefile
     create  config.ru
     create  .gitignore
     create  Gemfile
     create  app
     ...
     create  tmp/cache
     ...
        run  bundle install
```

You can pass options to the `new` command to modify its default behavior. You
can also create [application templates](generators.html#application-templates)
and use them with the `new` command.

### Configure a Different Database

When creating a new Rails application, you can specify a preferred database for
your application by using the `--database` option. The default database for
`rails new` is SQLite. For example, you can set up a PostgreSQL database like
this:

```bash
$ rails new booknotes --database=postgresql
      create
      create  app/controllers
      create  app/helpers
...
```

The main difference is the content of the `config/database.yml` file. With the
PostgreSQL option, it looks like this:

```yaml
# PostgreSQL. Versions 9.3 and up are supported.
#
# Install the pg driver:
#   gem install pg
# On macOS with Homebrew:
#   gem install pg -- --with-pg-config=/usr/local/bin/pg_config
# On Windows:
#   gem install pg
#       Choose the win32 build.
#       Install PostgreSQL and put its /bin directory on your path.
#
# Configure Using Gemfile
# gem "pg"
#
default: &default
  adapter: postgresql
  encoding: unicode
  # For details on connection pooling, see Rails configuration guide
  # https://guides.rubyonrails.org/configuring.html#database-pooling
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 3 } %>


development:
  <<: *default
  database: booknotes_development
  ...
```

The `--database=postgresql` option will also modify other files generated for a
new Rails app appropriately, such as adding the `pg` gem to the `Gemfile`, etc.

### Skipping Defaults

The `rails new` command by default creates dozens of files. By using the
`--skip` option, you can skip some files from being generated if you don't need
them. For example,

```bash
$ rails new no_storage --skip-active-storage
Based on the specified options, the following options will also be activated:

  --skip-action-mailbox [due to --skip-active-storage]
  --skip-action-text [due to --skip-active-storage]

      create
      create  README.md
      ...
```

In the above example, Action Mailbox and Action Text are skipped in addition to
Active Storage because they depend on Active Storage functionality.

TIP: You can get a full list of what can be skipped in the options section of
`rails new --help` command.

Starting a Rails Application Server
-----------------------------------

We can start a Rails application using the `bin/rails server` command, which
launches the [Puma](https://github.com/puma/puma) web server that comes bundled
with Rails. You'll use this any time you want to access your application through
a web browser.

```bash
$ cd my_app
$ bin/rails server
=> Booting Puma
=> Rails 8.2.0 application starting in development
=> Run `bin/rails server --help` for more startup options
Puma starting in single mode...
* Puma version: 6.4.0 (ruby 3.1.3-p185) ("The Eagle of Durango")
*  Min threads: 3
*  Max threads: 3
*  Environment: development
*          PID: 5295
* Listening on http://127.0.0.1:3000
* Listening on http://[::1]:3000
Use Ctrl-C to stop
```

With just two commands we have a Rails application up and running. The `server`
command starts the application listening on port 3000 by default. You can open
your browser to [http://localhost:3000](http://localhost:3000) to see a basic
Rails application running.

INFO: Most common commands have a shortcut aliases. To start the server you can
use the alias "s": `bin/rails s`.

You can run the application on a different port using the `-p` option. You can
also change the environment using `-e` (default is `development`).

```bash
$ bin/rails server -e production -p 4000
```

The `-b` option binds Rails to the specified IP address, by default it is
localhost. You can run a server as a daemon by passing a `-d` option.

Generating Code
---------------

You can use the `bin/rails generate` command to generate a number of different
files and add functionality to your application, such as models, controllers,
and full scaffolds.

To see a list of built-in generators, you can run `bin/rails generate` (or
`bin/rails g` for short) without any arguments. It lists all available
generators after the usage. You can also learn more about what a specific
generator will do by using the `--pretend` option.

```bash
$ bin/rails generate
Usage:
  bin/rails generate GENERATOR [args] [options]

General options:
  -h, [--help]     # Print generator's options and usage
  -p, [--pretend]  # Run but do not make any changes
  -f, [--force]    # Overwrite files that already exist
  -s, [--skip]     # Skip files that already exist
  -q, [--quiet]    # Suppress status output

Please choose a generator below.
Rails:
  application_record
  benchmark
  channel
  controller
  generator
  helper
...
```

NOTE: When you add certain gems to your application, they may install more
generators. You can also create your own generators, see the [Generators
guide](generators.html) for more information.

The purpose of Rails' built-in generators is to save you time by freeing you
from having to write repetitive boilerplate code.

Let's add a controller with the `controller` generator.

### Generating Controllers

We can find out exactly how to use the `controller` generator with the
`bin/rails generate controller` command (which is the same as using it with
`--help`). There is a "Usage" section and even an example:

```bash
$ bin/rails generate controller
Usage:
  bin/rails generate controller NAME [action action] [options]
...
Examples:
    `bin/rails generate controller credit_cards open debit credit close`

    This generates a `CreditCardsController` with routes like /credit_cards/debit.
        Controller: app/controllers/credit_cards_controller.rb
        Test:       test/controllers/credit_cards_controller_test.rb
        Views:      app/views/credit_cards/debit.html.erb [...]
        Helper:     app/helpers/credit_cards_helper.rb

    `bin/rails generate controller users index --skip-routes`

    This generates a `UsersController` with an index action and no routes.

    `bin/rails generate controller admin/dashboard --parent=admin_controller`

    This generates a `Admin::DashboardController` with an `AdminController` parent class.
```

The controller generator is expecting parameters in the form of `generate
controller ControllerName action1 action2`. Let's make a `Greetings` controller
with an action of `hello`, which will say something nice to us.

```bash
$ bin/rails generate controller Greetings hello
     create  app/controllers/greetings_controller.rb
      route  get 'greetings/hello'
     invoke  erb
     create    app/views/greetings
     create    app/views/greetings/hello.html.erb
     invoke  test_unit
     create    test/controllers/greetings_controller_test.rb
     invoke  helper
     create    app/helpers/greetings_helper.rb
     invoke    test_unit
```

The above command created various files at specific directories. It created a
controller file, a view file, a functional test file, a helper for the view, and
added a route.

To test out the new controller, we can modify the `hello` action and the view to
display a message:

```ruby
class GreetingsController < ApplicationController
  def hello
    @message = "Hello, how are you today?"
  end
end
```

```html+erb
<h1>A Greeting for You!</h1>
<p><%= @message %></p>
```

Then, we can start the Rails server, with `bin/rails server`, and go to the
added route
[http://localhost:3000/greetings/hello](http://localhost:3000/greetings/hello)
to see the message.

Now let's use the generator to add models to our application.

### Generating Models

The Rails model generator command has a very detailed "Description" section that
is worth reading. Here is the basic usage:

```bash
$ bin/rails generate model
Usage:
  bin/rails generate model NAME [field[:type][:index] field[:type][:index]] [options]
...
```

As an example, we can generate a `post` model like this:

```bash
$ bin/rails generate model post title:string body:text
    invoke  active_record
    create    db/migrate/20250807202154_create_posts.rb
    create    app/models/post.rb
    invoke    test_unit
    create      test/models/post_test.rb
    create      test/fixtures/posts.yml
```

The model generator adds test files as well as a migration, which you'll need to
run with `bin/rails db:migrate`.

NOTE: For a list of available field types for the `type` parameter, refer to the
[API
documentation](https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_column).
The `index` parameter generates a corresponding index for the column. If you
don't specify a type for a field, Rails will default to type `string`.

In addition to generating controllers and models separately, Rails also provides
generators that add code for both at once as well as other files needed for a
standard CRUD resource. There are two generator commands that do this:
`resource` and `scaffold`. The `resource` command is more lightweight than
`scaffold` and generates less code.

### Generating Resources

The `bin/rails generate resource` command generates model, migration, empty
controller, routes, and tests. It does not generate views and it does not fill
in the controller with CRUD methods.

Here are all the files generated with the `resource` command for `post`:

```bash
$ bin/rails generate resource post title:string body:text
      invoke  active_record
      create    db/migrate/20250919150856_create_posts.rb
      create    app/models/post.rb
      invoke    test_unit
      create      test/models/post_test.rb
      create      test/fixtures/posts.yml
      invoke  controller
      create    app/controllers/posts_controller.rb
      invoke    erb
      create      app/views/posts
      invoke    test_unit
      create      test/controllers/posts_controller_test.rb
      invoke    helper
      create      app/helpers/posts_helper.rb
      invoke      test_unit
      invoke  resource_route
       route    resources :posts
```

Use the `resource` command when you don't need views (e.g. writing an API) or
prefer to add controller actions manually.

### Generating Scaffolds

A Rails scaffold generates a full set of files for a resource, including a
model, controller, views (HTML and JSON), routes, migration, tests, and helper
files. It can be used for quickly prototyping CRUD interfaces or when you want
to generate the basic structure of a resource as a starting point that you can
customize.

If you scaffold the `post` resource you can see all of the files mentioned above
being generated:

```bash
$ bin/rails generate scaffold post title:string body:text
      invoke  active_record
      create    db/migrate/20250919150748_create_posts.rb
      create    app/models/post.rb
      invoke    test_unit
      create      test/models/post_test.rb
      create      test/fixtures/posts.yml
      invoke  resource_route
       route    resources :posts
      invoke  scaffold_controller
      create    app/controllers/posts_controller.rb
      invoke    erb
      create      app/views/posts
      create      app/views/posts/index.html.erb
      create      app/views/posts/edit.html.erb
      create      app/views/posts/show.html.erb
      create      app/views/posts/new.html.erb
      create      app/views/posts/_form.html.erb
      create      app/views/posts/_post.html.erb
      invoke    resource_route
      invoke    test_unit
      create      test/controllers/posts_controller_test.rb
      create      test/system/posts_test.rb
      invoke    helper
      create      app/helpers/posts_helper.rb
      invoke      test_unit
      invoke    jbuilder
      create      app/views/posts/index.json.jbuilder
      create      app/views/posts/show.json.jbuilder
      create      app/views/posts/_post.json.jbuilder
```

At this point, you can run `bin/rails db:migrate` to create the `post` table
(see [Managing the Database](#managing-the-database) for more on that command).
Then, if you start the Rails server with `bin/rails server` and navigate to
[http://localhost:3000/posts](http://localhost:3000/posts), you will be able to
interact with the `post` resource - see a list of posts, create new posts, as
well as edit and delete them.

INFO: The scaffold generates test files, though you will need to modify them and
actually add test cases for your code. See the [Testing guide](testing.html) for
an in-depth look at creating and running tests.

### Undoing Code Generation with `bin/rails destroy`

Imagine you made a typing error when using the `generate` command for a model
(or controller or scaffold or anything), it would be tedious to manually delete
each file that was created by the generator. Rails provides a `destroy` command
for that reason. You can think of `destroy` as the opposite of `generate`. It'll
figure out what generate did, and undo it.

INFO: You can also use the alias "d" to invoke the destroy command: `bin/rails d`.

For example, if you meant to generate an `article` model but instead typed
`artcle`:

```bash
$ bin/rails generate model Artcle title:string body:text
      invoke  active_record
      create    db/migrate/20250808142940_create_artcles.rb
      create    app/models/artcle.rb
      invoke    test_unit
      create      test/models/artcle_test.rb
      create      test/fixtures/artcles.yml
```

You can undo the `generate` command with `destroy` like this:

```bash
$ bin/rails destroy model Artcle title:string body:text
      invoke  active_record
      remove    db/migrate/20250808142940_create_artcles.rb
      remove    app/models/artcle.rb
      invoke    test_unit
      remove      test/models/artcle_test.rb
      remove      test/fixtures/artcles.yml
```

Interacting with a Rails Application
------------------------------------

### `bin/rails console`

The `bin/rails console` command loads a full Rails environment (including
models, database, etc.) into an interactive IRB style shell. It is a powerful
feature of the Ruby on Rails framework as it allows you to interact with, debug
and explore your entire application at the command line.

The Rails Console can be useful for testing out ideas by prototyping with code
and for creating and updating records in the database without needing to use a
browser.

```bash
$ bin/rails console
my-app(dev):001:0> Post.create(title: 'First!')
```

The Rails Console has several useful features. For example, if you wish to test
out some code without changing any data, you can use `sandbox` mode with
`bin/rails console --sandbox`. The `sandbox` mode wraps all database operations
in a transaction that rolls back when you exit:

```bash
$ bin/rails console --sandbox
Loading development environment in sandbox (Rails 8.2.0)
Any modifications you make will be rolled back on exit
my-app(dev):001:0>
```

The `sandbox` option is great for safely testing destructive changes without
affecting your database.

You can also specify the Rails environment for the `console` command with the
`-e` option:

```bash
$ bin/rails console -e test
Loading test environment (Rails 8.1.0)
```

#### The `app` Object

Inside the Rails Console you have access to the `app` and `helper` instances.

With the `app` method you can access named route helpers:

```irb
my-app(dev)> app.root_path
=> "/"
my-app(dev)> app.edit_user_path
=> "profile/edit"
```

You can also use the `app` object to make requests of your application without
starting a real server:

```irb
my-app(dev)> app.get "/", headers: { "Host" => "localhost" }
Started GET "/" for 127.0.0.1 at 2025-08-11 11:11:34 -0500
...

my-app(dev)> app.response.status
=> 200
```

NOTE: You have to pass the "Host" header with the `app.get` request above,
because the Rack client used under-the-hood defaults to "www.example.com" if
"Host" is not specified. You can modify your application to always use `localhost`
using a configuration or an initializer.

The reason you can "make requests" like above is because the `app` object is the
same one that Rails uses for integration tests:

```irb
my-app(dev)> app.class
=> ActionDispatch::Integration::Session
```

The `app` object exposes methods like `app.cookies`, `app.session`, `app.post`,
and `app.response`. This way you can simulate and debug integration tests in the
Rails Console.

#### The `helper` Object

The `helper` object in the Rails console is your direct portal into Rails’ view
layer. It allows you to test out view-related formatting and utility methods in
the console, as well as custom helpers defined in your application (i.e. in
`app/helpers`).

```irb
my-app(dev)> helper.time_ago_in_words 3.days.ago
=> "3 days"

my-app(dev)> helper.l(Date.today)
=> "2025-08-11"

my-app(dev)> helper.pluralize(3, "child")
=> "3 children"

my-app(dev)> helper.truncate("This is a very long sentence", length: 22)
=> "This is a very long..."

my-app(dev)> helper.link_to("Home", "/")
=> "<a href=\"/\">Home</a>"
```

Assuming a `custom_helper` method is defined in a `app/helpers/*_helper.rb`
file:

```irb
my-app(dev)> helper.custom_helper
"testing custom_helper"
```

### `bin/rails dbconsole`

The `bin/rails dbconsole` command figures out which database you're using and
drops you into the command line interface appropriate for that database. It also
figures out the command line parameters to start a session based on your
`config/database.yml` file and current Rails environment.

Once you're in a `dbconsole` session, you can interact with your database
directly as you normally would. For example, if you're using PostgreSQL, running
`bin/rails dbconsole` may look like this:

```bash
$ bin/rails dbconsole
psql (17.5 (Homebrew))
Type "help" for help.

booknotes_development=# help
You are using psql, the command-line interface to PostgreSQL.
Type:  \copyright for distribution terms
       \h for help with SQL commands
       \? for help with psql commands
       \g or terminate with semicolon to execute query
       \q to quit
booknotes_development=# \dt
                    List of relations
 Schema |              Name              | Type  | Owner
--------+--------------------------------+-------+-------
 public | action_text_rich_texts         | table | bhumi
 ...
```

The `dbconsole` command is a very convenient shorthand, it's equivalent to
running the `psql` command (or `mysql` or `sqlite`) with the appropriate
arguments from your `database.yml`:

```bash
psql -h <host> -p <port> -U <username> <database_name>
```

So if your `database.yml` file looks like this:

```yml
development:
  adapter: postgresql
  database: myapp_development
  username: myuser
  password:
  host: localhost
```

Running the `bin/rails dbconsole` command is the same as:

```bash
psql -h localhost -U myuser myapp_development
```

NOTE: The `dbconsole` command supports MySQL (including MariaDB), PostgreSQL,
and SQLite3. You can also use the alias "db" to invoke the dbconsole: `bin/rails db`.

If you are using multiple databases, `bin/rails dbconsole` will connect to the
primary database by default. You can specify which database to connect to using
`--database` or `--db`:

```bash
$ bin/rails dbconsole --database=animals
```

### `bin/rails runner`

The `runner` command executes Ruby code in the context of the Rails application
without having to open a Rails Console. This can be useful for one-off tasks
that do not need the interactivity of the Rails Console. For instance:

```bash
$ bin/rails runner "puts User.count"
42

$ bin/rails runner 'MyJob.perform_now'
```

You can specify the environment in which the `runner` command should operate
using the `-e` switch.

```bash
$ bin/rails runner -e production "puts User.count"
```

You can also execute code in a Ruby file with the `runner` command, in the
context of your Rails application:

```bash
$ bin/rails runner lib/path_to_ruby_script.rb
```

By default, `bin/rails runner` scripts are automatically wrapped with the Rails
Executor (which is an instance of [`ActiveSupport::Executor`][]) associated with
your Rails application. The Executor creates a “safe zone” to run arbitrary
Ruby inside a Rails app so that the autoloader, middleware stack, and Active
Support hooks all behave consistently.

Therefore, executing `bin/rails runner lib/path_to_ruby_script.rb` is
functionally equivalent to the following:

```ruby
Rails.application.executor.wrap do
  # executes code inside lib/path_to_ruby_script.rb
end
```

If you have a reason to opt of this behavior, there is a `--skip-executor`
option.

```bash
$ bin/rails runner --skip-executor lib/long_running_script.rb
```

[`ActiveSupport::Executor`]:
  https://api.rubyonrails.org/classes/ActiveSupport/Executor.html

### `bin/rails boot`

The `bin/rails boot` command is a low-level Rails command whose entire job is to
boot your Rails application. Specifically it loads `config/boot.rb` and
`config/application.rb` files so that the application environment is ready to
run.

The `boot` command boots the application and exits — it does nothing else. It
can be useful for debugging boot problems. If your app fails to start and you
want to isolate the boot phase (without running migrations, starting the server,
etc.), `bin/rails boot` can be a simple test.

It can also be useful for timing application initialization. You can profile how
long your application takes to boot by wrapping `bin/rails boot` in a profiler.

Inspecting an Application
-------------------------

### `bin/rails routes`

The `bin/rails routes` command lists all defined routes in your application,
including the URI Pattern and HTTP verb, as well as the Controller Action it
maps to.

```bash
$ bin/rails routes
  Prefix  Verb  URI Pattern     Controller#Action
  books   GET   /books(:format) books#index
  books   POST  /books(:format) books#create
  ...
  ...
```

This can be useful for tracking down a routing issue, or simply getting an
overview of the resources and routes that are part of a Rails application. You
can also narrow down the output of the `routes` command with options like
`--controller(-c)` or `--grep(-g)`:

```bash
# Only show routes where the controller name contains "users"
$ bin/rails routes --controller users

# Show routes handled by namespace Admin::UsersController
$ bin/rails routes -c admin/users

# Search by name, path, or controller/action with -g (or --grep)
$ bin/rails routes -g users
```

There is also an option, `bin/rails routes --expanded`, that displays even more
information about each route, including the line number in your
`config/routes.rb` where that route is defined:

```bash
$ bin/rails routes --expanded
--[ Route 1 ]--------------------------------------------------------------------------------
Prefix            |
Verb              |
URI               | /assets
Controller#Action | Propshaft::Server
Source Location   | propshaft (1.2.1) lib/propshaft/railtie.rb:49
--[ Route 2 ]--------------------------------------------------------------------------------
Prefix            | about
Verb              | GET
URI               | /about(.:format)
Controller#Action | posts#about
Source Location   | /Users/bhumi/Code/try_markdown/config/routes.rb:2
--[ Route 3 ]--------------------------------------------------------------------------------
Prefix            | posts
Verb              | GET
URI               | /posts(.:format)
Controller#Action | posts#index
Source Location   | /Users/bhumi/Code/try_markdown/config/routes.rb:4
```

TIP: In development mode, you can also access the same routes info by going to
`http://localhost:3000/rails/info/routes`

### `bin/rails about`

The `bin/rails about` command displays information about your Rails application,
such as Ruby, RubyGems, and Rails versions, database adapter, schema version,
etc. It is useful when you need to ask for help or check if a security patch
might affect you.

```bash
$ bin/rails about
About your application's environment
Rails version             8.2.0
Ruby version              3.2.0 (x86_64-linux)
RubyGems version          3.3.7
Rack version              3.0.8
JavaScript Runtime        Node.js (V8)
Middleware:               ActionDispatch::HostAuthorization, Rack::Sendfile, ...
Application root          /home/code/my_app
Environment               development
Database adapter          sqlite3
Database schema version   20250205173523
```

### `bin/rails initializers`

The `bin/rails initializers` command prints out all defined initializers in the
order they are invoked by Rails:

```bash
$ bin/rails initializers
ActiveSupport::Railtie.active_support.deprecator
ActionDispatch::Railtie.action_dispatch.deprecator
ActiveModel::Railtie.active_model.deprecator
...
Booknotes::Application.set_routes_reloader_hook
Booknotes::Application.set_clear_dependencies_hook
Booknotes::Application.enable_yjit
```

This command can be useful when initializers depend on each other and the order
in which they are run matters. Using this command, you can see what's run
before/after and discover the relationship between initializers. Rails runs
framework initializers first and then application ones, defined in
`config/initializers`.

### `bin/rails middleware`

The `bin/rails middleware` shows you the entire Rack middleware stack for your
Rails application, in the exact order the middlewares are run for each request.

```bash
$ bin/rails middleware
use ActionDispatch::HostAuthorization
use Rack::Sendfile
use ActionDispatch::Static
use ActionDispatch::Executor
use ActionDispatch::ServerTiming
...
```

This can be useful to see which middleware Rails includes and which ones are
added by gems (Warden::Manager from Devise) as well as for debugging and
profiling.

### `bin/rails stats`

The `bin/rails stats` command shows you things like lines of code (LOC) and the
number of classes and methods for various components in your application.

```bash
$ bin/rails stats
+----------------------+--------+--------+---------+---------+-----+-------+
| Name                 |  Lines |    LOC | Classes | Methods | M/C | LOC/M |
+----------------------+--------+--------+---------+---------+-----+-------+
| Controllers          |    309 |    247 |       7 |      37 |   5 |     4 |
| Helpers              |     10 |     10 |       0 |       0 |   0 |     0 |
| Jobs                 |      7 |      2 |       1 |       0 |   0 |     0 |
| Models               |     89 |     70 |       6 |       3 |   0 |    21 |
| Mailers              |     10 |     10 |       2 |       1 |   0 |     8 |
| Channels             |     16 |     14 |       1 |       2 |   2 |     5 |
| Views                |    622 |    501 |       0 |       1 |   0 |   499 |
| Stylesheets          |    584 |    495 |       0 |       0 |   0 |     0 |
| JavaScript           |     81 |     62 |       0 |       0 |   0 |     0 |
| Libraries            |      0 |      0 |       0 |       0 |   0 |     0 |
| Controller tests     |    117 |     75 |       4 |       9 |   2 |     6 |
| Helper tests         |      0 |      0 |       0 |       0 |   0 |     0 |
| Model tests          |     21 |      9 |       3 |       0 |   0 |     0 |
| Mailer tests         |      7 |      5 |       1 |       1 |   1 |     3 |
| Integration tests    |      0 |      0 |       0 |       0 |   0 |     0 |
| System tests         |     51 |     41 |       1 |       4 |   4 |     8 |
+----------------------+--------+--------+---------+---------+-----+-------+
| Total                |   1924 |   1541 |      26 |      58 |   2 |    24 |
+----------------------+--------+--------+---------+---------+-----+-------+
  Code LOC: 1411     Test LOC: 130     Code to Test Ratio: 1:0.1
```

### `bin/rails time:zones:all`

The `bin/rails time:zones:all` command prints the complete list of time zones
that Active Support knows about, along with their UTC offsets followed by the
Rails timezone identifiers.

As an example, you can use `bin/rails time:zones:local` to see your system's
timezone:

```bash
$ bin/rails time:zones:local

* UTC -06:00 *
Central America
Central Time (US & Canada)
Chihuahua
Guadalajara
Mexico City
Monterrey
Saskatchewan
```

This can be useful when setting `config.time_zone` in `config/application.rb`,
when you need an exact Rails time zone name and spelling (e.g., "Pacific Time
(US & Canada)"), to validate user input or when debugging.

Managing Assets
---------------

The `bin/rails assets:*` commands allow you to manage assets in the `app/assets`
directory.

You can get a list of all commands in the `assets:` namespace like this:

```bash
$ bin/rails -T assets
bin/rails assets:clean[count]  # Removes old files in config.assets.output_path
bin/rails assets:clobber       # Remove config.assets.output_path
bin/rails assets:precompile    # Compile all the assets from config.assets.paths
bin/rails assets:reveal        # Print all the assets available in config.assets.paths
bin/rails assets:reveal:full   # Print the full path of assets available in config.assets.paths
```

You can precompile the assets in `app/assets` using `bin/rails
assets:precompile`. See the [Asset Pipeline
guide](asset_pipeline.html#precompiling-assets) for more on precompiling.

You can remove older compiled assets using `bin/rails assets:clean`. The
`assets:clean` command allows for rolling deploys that may still be linking to
an old asset while the new assets are being built.

If you want to clear `public/assets` completely, you can use `bin/rails assets:clobber`.

Managing the Database
---------------------

The commands in this section, `bin/rails db:*`, are all about setting up
databases, managing migrations, etc.

You can get a list of all commands in the `db:` namespace like this:

```bash
$ bin/rails -T db
bin/rails db:create              # Create the database from DATABASE_URL or
bin/rails db:drop                # Drop the database from DATABASE_URL or
bin/rails db:encryption:init     # Generate a set of keys for configuring
bin/rails db:environment:set     # Set the environment value for the database
bin/rails db:fixtures:load       # Load fixtures into the current environments
bin/rails db:migrate             # Migrate the database (options: VERSION=x,
bin/rails db:migrate:down        # Run the "down" for a given migration VERSION
bin/rails db:migrate:redo        # Roll back the database one migration and
bin/rails db:migrate:status      # Display status of migrations
bin/rails db:migrate:up          # Run the "up" for a given migration VERSION
bin/rails db:prepare             # Run setup if database does not exist, or run
bin/rails db:reset               # Drop and recreate all databases from their
bin/rails db:rollback            # Roll the schema back to the previous version
bin/rails db:schema:cache:clear  # Clear a db/schema_cache.yml file
bin/rails db:schema:cache:dump   # Create a db/schema_cache.yml file
bin/rails db:schema:dump         # Create a database schema file (either db/
bin/rails db:schema:load         # Load a database schema file (either db/
bin/rails db:seed                # Load the seed data from db/seeds.rb
bin/rails db:seed:replant        # Truncate tables of each database for current
bin/rails db:setup               # Create all databases, load all schemas, and
bin/rails db:version             # Retrieve the current schema version number
bin/rails test:db                # Reset the database and run `bin/rails test`
```

### Database Setup

The `db:create` and `db:drop` commands create or delete the database for the
current environment (or all environments with the `db:create:all`,
`db:drop:all`)

The `db:seed` command loads sample data from `db/seeds.rb` and the
`db:seed:replant` command truncates tables of each database for the current
environment and then loads the seed data.

The `db:setup` command creates all databases, loads all schemas, and initializes
with the seed data (it does not drop databases first, like the `db:reset`
command below).

The `db:reset` command drops and recreates all databases from their schema for
the current environment and loads the seed data (so it's a combination of the
above commands).

NOTE: For more on seed data, see [this
section](active_record_migrations.html#migrations-and-seed-data) of the Active
Record Migrations guide.

### Migrations

The `db:migrate` command is one of the most frequently run commands in a Rails
application; it migrates the database by running all new (not yet run)
migrations.

The `db:migrate:up` command runs the "up" method and the `db:migrate:down`
command runs the "down" method for the migration specified by the VERSION
argument.

```bash
$ bin/rails db:migrate:down VERSION=20250812120000
```

The `db:rollback` command rolls the schema back to the previous version (or you
can specify steps with the `STEP=n` argument).

The `db:migrate:redo` command rolls back the database one migration and
re-migrates up. It is a combination of the above two commands.

There is also a `db:migrate:status` command, which shows which migrations have
been run and which are still pending:

```bash
$ bin/rails db:migrate:status
database: db/development.sqlite3

 Status   Migration ID    Migration Name
--------------------------------------------------
   up     20250101010101  Create users
   up     20250102020202  Add email to users
  down    20250812120000  Add age to users
```

NOTE: Please see the [Migration Guide](active_record_migrations.html) for an
explanation of concepts related to database migrations and other migration commands.

### Schema Management

There are two main commands that help with managing the database schema in your
Rails application: `db:schema:dump` and `db:schema:load`.

The `db:schema:dump` command reads your database’s current schema and writes
it out to the `db/schema.rb` file (or `db/structure.sql` if you’ve configured
the schema format to `sql`). After running migrations, Rails automatically calls
`schema:dump` so your schema file is always up to date (and doesn't need to be
modified manually).

The schema file is a blueprint of your database and it is useful for setting up
new environments for tests or development. It’s version-controlled, so you can
see changes to the schema over time.

The `db:schema:load` command drops and recreates the database schema from
`db/schema.rb` (or `db/structure.sql`). It does this directly, *without*
replaying each migration one at a time.

This command is useful for quickly resetting a database to the current schema
without running years of migrations one by one. For example, running `db:setup`
also calls `db:schema:load` after creating the database and before seeding it.

You can think of `db:schema:dump` as the one that *writes* the `schema.rb` file
and `db:schema:load` as the one that *reads* that file.

### Other Utility Commands

#### `bin/rails db:version`

The `bin/rails db:version` command will show you the current version of the
database, which can be useful for troubleshooting.

```bash
$ bin/rails db:version

database: storage/development.sqlite3
Current version: 20250806173936
```

#### `db:fixtures:load`

The `db:fixtures:load` command loads fixtures into the current environment's
database. To load specific fixtures, you can use `FIXTURES=x,y`. To load from a
subdirectory in `test/fixtures`, use `FIXTURES_DIR=z`.

```bash
$ bin/rails db:fixtures:load
   -> Loading fixtures from test/fixtures/users.yml
   -> Loading fixtures from test/fixtures/books.yml
```

#### `db:system:change`

In an existing Rails application, it's possible to switch to a different
database. The `db:system:change` command helps with that by changing the
`config/database.yml` file and your database gem to the target database.

```bash
$ bin/rails db:system:change --to=postgresql
    conflict  config/database.yml
Overwrite config/database.yml? (enter "h" for help) [Ynaqdhm] Y
       force  config/database.yml
        gsub  Gemfile
        gsub  Gemfile
...
```

#### `db:encryption:init`

The `db:encryption:init` command generates a set of keys for configuring Active
Record encryption in a given environment.

Running Tests
-------------

The `bin/rails test` command helps you run the different types of tests in your
application. The `bin/rails test --help` output has good examples of the
different options for this command:

You can run a single test by appending a line number to a filename:

```bash
  bin/rails test test/models/user_test.rb:27
```

You can run multiple tests within a line range by appending the line range to a filename:

```bash
  bin/rails test test/models/user_test.rb:10-20
```

You can run multiple files and directories at the same time:

```bash
  bin/rails test test/controllers test/integration/login_test.rb
```

Rails comes with a testing framework called Minitest and there are also Minitest
options you can use with the `test` command:

```bash
# Only run tests whose names match the regex /validation/
$ bin/rails test -n /validation/
```

INFO: Please see the  [Testing Guide](testing.html) for explanations and
examples of different types of tests.

Other Useful Commands
---------------------

### `bin/rails notes`

The `bin/rails notes` command searches through your code for comments beginning
with a specific keyword. You can refer to `bin/rails notes --help` for
information about usage.

By default, it will search in `app`, `config`, `db`, `lib`, and `test`
directories for FIXME, OPTIMIZE, and TODO annotations in files with extension
`.builder`, `.rb`, `.rake`, `.yml`, `.yaml`, `.ruby`, `.css`, `.js`, and `.erb`.

```bash
$ bin/rails notes
app/controllers/admin/users_controller.rb:
  * [ 20] [TODO] any other way to do this?
  * [132] [FIXME] high priority for next deploy

lib/school.rb:
  * [ 13] [OPTIMIZE] refactor this code to make it faster
```

#### Annotations

You can pass specific annotations by using the `-a` (or `--annotations`) option.
Note that annotations are case sensitive.

```bash
$ bin/rails notes --annotations FIXME RELEASE
app/controllers/admin/users_controller.rb:
  * [101] [RELEASE] We need to look at this before next release
  * [132] [FIXME] high priority for next deploy

lib/school.rb:
  * [ 17] [FIXME]
```

#### Add Tags

You can add more default tags to search for by using
`config.annotations.register_tags`:

```ruby
config.annotations.register_tags("DEPRECATEME", "TESTME")
```

```bash
$ bin/rails notes
app/controllers/admin/users_controller.rb:
  * [ 20] [TODO] do A/B testing on this
  * [ 42] [TESTME] this needs more functional tests
  * [132] [DEPRECATEME] ensure this method is deprecated in next release
```

#### Add Directories

You can add more default directories to search from by using
`config.annotations.register_directories`:

```ruby
config.annotations.register_directories("spec", "vendor")
```

#### Add File Extensions

You can add more default file extensions by using
`config.annotations.register_extensions`:

```ruby
config.annotations.register_extensions("scss", "sass") { |annotation| /\/\/\s*(#{annotation}):?\s*(.*)$/ }
```

### `bin/rails tmp:`

The `Rails.root/tmp` directory is, like the *nix /tmp directory, the holding
place for temporary files like process id files and cached actions.

The `tmp:` namespaced commands will help you clear and create the
`Rails.root/tmp` directory:

```bash
$ bin/rails tmp:cache:clear # clears `tmp/cache`.
$ bin/rails tmp:sockets:clear # clears `tmp/sockets`.
$ bin/rails tmp:screenshots:clear` # clears `tmp/screenshots`.
$ bin/rails tmp:clear # clears all cache, sockets, and screenshot files.
$ bin/rails tmp:create # creates tmp directories for cache, sockets, and pids.
```

### `bin/rails secret`

The `bin/rails secret` command generates a cryptographically secure random
string for use as a secret key in your Rails application.

```bash
$ bin/rails secret
4d39f92a661b5afea8c201b0b5d797cdd3dcf8ae41a875add6ca51489b1fbbf2852a666660d32c0a09f8df863b71073ccbf7f6534162b0a690c45fd278620a63
```

It can be useful for setting the secret key in your application's
`config/credentials.yml.enc` file.

### `bin/rails credentials`

The `credentials` commands provide access to encrypted credentials, so you can
safely store access tokens, database passwords, and the like inside the app
without relying on a bunch of environment variables.

To add values to the encrypted YML file `config/credentials.yml.enc`, you can
use the `credentials:edit` command:

```bash
$ bin/rails credentials:edit
```

This opens the decrypted credentials in an editor (set by `$VISUAL` or
`$EDITOR`) for editing. When saved, the content is encrypted automatically.

You can also use the `:show` command to view the decrypted credential file,
which may look something like this (This is from a sample application and not
sensitive data):

```bash
$ bin/rails credentials:show
# aws:
#   access_key_id: 123
#   secret_access_key: 345
active_record_encryption:
  primary_key: 99eYu7ZO0JEwXUcpxmja5PnoRJMaazVZ
  deterministic_key: lGRKzINTrMTDSuuOIr6r5kdq2sH6S6Ii
  key_derivation_salt: aoOUutSgvw788fvO3z0hSgv0Bwrm76P0

# Used as the base secret for all MessageVerifiers in Rails, including the one protecting cookies.
secret_key_base: 6013280bda2fcbdbeda1732859df557a067ac81c423855aedba057f7a9b14161442d9cadfc7e48109c79143c5948de848ab5909ee54d04c34f572153466fc589
```

You can learn about credentials in the [Rails Security
Guide](security.html#custom-credentials).

TIP: Check out the detailed description for this command in the output of
`bin/rails credentials --help`.

Custom Rake Tasks
-----------------

You may want to create custom rake tasks in your application, to delete old
records from the database for example. You can do this with the `bin/rails
generate task` command. Custom rake tasks have a `.rake` extension and are
placed in the `lib/tasks` folder in your Rails application. For example:

```bash
$ bin/rails generate task cool
create  lib/tasks/cool.rake
```

The `cool.rake` file can contain this:

```ruby
desc "I am short description for a cool task"
task task_name: [:prerequisite_task, :another_task_we_depend_on] do
  # Any valid Ruby code is allowed.
end
```

To pass arguments to your custom rake task:

```ruby
task :task_name, [:arg_1] => [:prerequisite_1, :prerequisite_2] do |task, args|
  argument_1 = args.arg_1
end
```

You can group tasks by placing them in namespaces:

```ruby
namespace :db do
  desc "This task has something to do with the database"
  task :my_db_task do
    # ...
  end
end
```

Invoking rake tasks looks like this:

```bash
$ bin/rails task_name
$ bin/rails "task_name[value1]" # entire argument string should be quoted
$ bin/rails "task_name[value1, value2]" # separate multiple args with a comma
$ bin/rails db:my_db_task
```

If you need to interact with your application models, perform database queries,
and so on, your task can depend on the `environment` task, which will load your
Rails application.

```ruby
task task_that_requires_app_code: [:environment] do
  puts User.count
end
```
