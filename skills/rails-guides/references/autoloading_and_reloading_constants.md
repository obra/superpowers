**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Autoloading and Reloading Constants
===================================

This guide documents how autoloading and reloading works in `zeitwerk` mode.

After reading this guide, you will know:

* Related Rails configuration
* Project structure
* Autoloading, reloading, and eager loading
* Single Table Inheritance
* And more

--------------------------------------------------------------------------------

Introduction
------------

INFO. This guide documents autoloading, reloading, and eager loading in Rails applications.

In an ordinary Ruby program, you explicitly load the files that define classes and modules you want to use. For example, the following controller refers to `ApplicationController` and `Post`, and you'd normally issue `require` calls for them:

```ruby
# DO NOT DO THIS.
require "application_controller"
require "post"
# DO NOT DO THIS.

class PostsController < ApplicationController
  def index
    @posts = Post.all
  end
end
```

This is not the case in Rails applications, where application classes and modules are just available everywhere without `require` calls:

```ruby
class PostsController < ApplicationController
  def index
    @posts = Post.all
  end
end
```

Rails _autoloads_ them on your behalf if needed. This is possible thanks to a couple of [Zeitwerk](https://github.com/fxn/zeitwerk) loaders Rails sets up on your behalf, which provide autoloading, reloading, and eager loading.

On the other hand, those loaders do not manage anything else. In particular, they do not manage the Ruby standard library, gem dependencies, Rails components themselves, or even (by default) the application `lib` directory. That code has to be loaded as usual.


Project Structure
-----------------

In a Rails application file names have to match the constants they define, with directories acting as namespaces.

For example, the file `app/helpers/users_helper.rb` should define `UsersHelper` and the file `app/controllers/admin/payments_controller.rb` should define `Admin::PaymentsController`.

By default, Rails configures Zeitwerk to inflect file names with `String#camelize`. For example, it expects that `app/controllers/users_controller.rb` defines the constant `UsersController` because that is what `"users_controller".camelize` returns.

The section _Customizing Inflections_ below documents ways to override this default.

Please, check the [Zeitwerk documentation](https://github.com/fxn/zeitwerk#file-structure) for further details.

config.autoload_paths
---------------------

We refer to the list of application directories whose contents are to be autoloaded and (optionally) reloaded as _autoload paths_. For example, `app/models`. Such directories represent the root namespace: `Object`.

INFO. Autoload paths are called _root directories_ in Zeitwerk documentation, but we'll stay with "autoload path" in this guide.

Within an autoload path, file names must match the constants they define as documented [here](https://github.com/fxn/zeitwerk#file-structure).

By default, the autoload paths of an application consist of all the subdirectories of `app` that exist when the application boots ---except for `assets`, `javascript`, and `views`--- plus the autoload paths of engines it might depend on.

For example, if `UsersHelper` is implemented in `app/helpers/users_helper.rb`, the module is autoloadable, you do not need (and should not write) a `require` call for it:

```bash
$ bin/rails runner 'p UsersHelper'
UsersHelper
```

Rails adds custom directories under `app` to the autoload paths automatically. For example, if your application has `app/presenters`, you don't need to configure anything in order to autoload presenters; it works out of the box.

The array of default autoload paths can be extended by pushing to `config.autoload_paths`, in `config/application.rb` or `config/environments/*.rb`. For example:

```ruby
module MyApplication
  class Application < Rails::Application
    config.autoload_paths << "#{root}/extras"
  end
end
```

Also, engines can push in body of the engine class and in their own `config/environments/*.rb`.

WARNING. Please do not mutate `ActiveSupport::Dependencies.autoload_paths`; the public interface to change autoload paths is `config.autoload_paths`.

WARNING: You cannot autoload code in the autoload paths while the application boots. In particular, directly in `config/initializers/*.rb`. Please check [_Autoloading when the application boots_](#autoloading-when-the-application-boots) down below for valid ways to do that.

The autoload paths are managed by the `Rails.autoloaders.main` autoloader.

config.autoload_lib(ignore:)
----------------------------

By default, the `lib` directory does not belong to the autoload paths of applications or engines.

The configuration method `config.autoload_lib` adds the `lib` directory to `config.autoload_paths` and `config.eager_load_paths`. It has to be invoked from `config/application.rb` or `config/environments/*.rb`, and it is not available for engines.

Normally, `lib` has subdirectories that should not be managed by the autoloaders. Please, pass their name relative to `lib` in the required `ignore` keyword argument. For example:

```ruby
config.autoload_lib(ignore: %w(assets tasks))
```

Why? While `assets` and `tasks` share the `lib` directory with regular Ruby code, their contents are not meant to be reloaded or eager loaded.

The `ignore` list should have all `lib` subdirectories that do not contain files with `.rb` extension, or that should not be reloaded or eager loaded. For example,

```ruby
config.autoload_lib(ignore: %w(assets tasks templates generators middleware))
```

`config.autoload_lib` is not available before 7.1, but you can still emulate it as long as the application uses Zeitwerk:

```ruby
# config/application.rb
module MyApp
  class Application < Rails::Application
    lib = root.join("lib")

    config.autoload_paths << lib
    config.eager_load_paths << lib

    Rails.autoloaders.main.ignore(
      lib.join("assets"),
      lib.join("tasks"),
      lib.join("generators")
    )

    # ...
  end
end
```

config.autoload_once_paths
--------------------------

You may want to be able to autoload classes and modules without reloading them. The `autoload_once_paths` configuration stores code that can be autoloaded, but won't be reloaded.

By default, this collection is empty, but you can extend it pushing to `config.autoload_once_paths`. You can do so in `config/application.rb` or `config/environments/*.rb`. For example:

```ruby
module MyApplication
  class Application < Rails::Application
    config.autoload_once_paths << "#{root}/app/serializers"
  end
end
```

Also, engines can push in body of the engine class and in their own `config/environments/*.rb`.

INFO. If `app/serializers` is pushed to `config.autoload_once_paths`, Rails no longer considers this an autoload path, despite being a custom directory under `app`. This setting overrides that rule.

This is key for classes and modules that are cached in places that survive reloads, like the Rails framework itself.

For example, Active Job serializers are stored inside Active Job:

```ruby
# config/initializers/custom_serializers.rb
Rails.application.config.active_job.custom_serializers << MoneySerializer
```

and Active Job itself is not reloaded when there's a reload, only application and engines code in the autoload paths is.

Making `MoneySerializer` reloadable would be confusing, because reloading an edited version would have no effect on that class object stored in Active Job. Indeed, if `MoneySerializer` was reloadable, starting with Rails 7 such initializer would raise a `NameError`.

Another use case is when engines decorate framework classes:

```ruby
initializer "decorate ActionController::Base" do
  ActiveSupport.on_load(:action_controller_base) do
    include MyDecoration
  end
end
```

There, the module object stored in `MyDecoration` by the time the initializer runs becomes an ancestor of `ActionController::Base`, and reloading `MyDecoration` is pointless, it won't affect that ancestor chain.

Classes and modules from the autoload once paths can be autoloaded in `config/initializers`. So, with that configuration this works:

```ruby
# config/initializers/custom_serializers.rb
Rails.application.config.active_job.custom_serializers << MoneySerializer
```

INFO: Technically, you can autoload classes and modules managed by the `once` autoloader in any initializer that runs after `:bootstrap_hook`.

The autoload once paths are managed by `Rails.autoloaders.once`.

config.autoload_lib_once(ignore:)
---------------------------------

The method `config.autoload_lib_once` is similar to `config.autoload_lib`, except that it adds `lib` to `config.autoload_once_paths` instead. It has to be invoked from `config/application.rb` or `config/environments/*.rb`, and it is not available for engines.

By calling `config.autoload_lib_once`, classes and modules in `lib` can be autoloaded, even from application initializers, but won't be reloaded.

`config.autoload_lib_once` is not available before 7.1, but you can still emulate it as long as the application uses Zeitwerk:

```ruby
# config/application.rb
module MyApp
  class Application < Rails::Application
    lib = root.join("lib")

    config.autoload_once_paths << lib
    config.eager_load_paths << lib

    Rails.autoloaders.once.ignore(
      lib.join("assets"),
      lib.join("tasks"),
      lib.join("generators")
    )

    # ...
  end
end
```

Reloading
---------

Rails automatically reloads classes and modules if application files in the autoload paths change.

More precisely, if the web server is running and application files have been modified, Rails unloads all autoloaded constants managed by the `main` autoloader just before the next request is processed. That way, application classes or modules used during that request will be autoloaded again, thus picking up their current implementation in the file system.

Reloading can be enabled or disabled. The setting that controls this behavior is [`config.enable_reloading`][], which is `true` by default in `development` mode, and `false` by default in `production` mode. For backwards compatibility, Rails also supports `config.cache_classes`, which is equivalent to `!config.enable_reloading`.

Rails uses an evented file monitor to detect files changes by default.  It can be configured instead to detect file changes by walking the autoload paths. This is controlled by the [`config.file_watcher`][] setting.

In a Rails console there is no file watcher active regardless of the value of `config.enable_reloading`. This is because, normally, it would be confusing to have code reloaded in the middle of a console session. Similar to an individual request, you generally want a console session to be served by a consistent, non-changing set of application classes and modules.

However, you can force a reload in the console by executing `reload!`:

```irb
irb(main):001:0> User.object_id
=> 70136277390120
irb(main):002:0> reload!
Reloading...
=> true
irb(main):003:0> User.object_id
=> 70136284426020
```

As you can see, the class object stored in the `User` constant is different after reloading.

[`config.enable_reloading`]: configuring.html#config-enable-reloading
[`config.file_watcher`]: configuring.html#config-file-watcher

### Reloading and Stale Objects

It is very important to understand that Ruby does not have a way to truly reload classes and modules in memory, and have that reflected everywhere they are already used. Technically, "unloading" the `User` class means removing the `User` constant via `Object.send(:remove_const, "User")`.

For example, check out this Rails console session:

```irb
irb> joe = User.new
irb> reload!
irb> alice = User.new
irb> joe.class == alice.class
=> false
```

`joe` is an instance of the original `User` class. When there is a reload, the `User` constant then evaluates to a different, reloaded class. `alice` is an instance of the newly loaded `User`, but `joe` is not — his class is stale. You may define `joe` again, start an IRB subsession, or just launch a new console instead of calling `reload!`.

Another situation in which you may find this gotcha is subclassing reloadable classes in a place that is not reloaded:

```ruby
# lib/vip_user.rb
class VipUser < User
end
```

if `User` is reloaded, since `VipUser` is not, the superclass of `VipUser` is the original stale class object.

Bottom line: **do not cache reloadable classes or modules**.

## Autoloading When the Application Boots

While booting, applications can autoload from the autoload once paths, which are managed by the `once` autoloader. Please check the section [`config.autoload_once_paths`](#config-autoload-once-paths) above.

However, you cannot autoload from the autoload paths, which are managed by the `main` autoloader. This applies to code in `config/initializers` as well as application or engines initializers.

Why? Initializers only run once, when the application boots. They do not run again on reloads. If an initializer used a reloadable class or module, edits to them would not be reflected in that initial code, thus becoming stale. Therefore, referring to reloadable constants during initialization is disallowed.

Let's see what to do instead.

### Use Case 1: During Boot, Load Reloadable Code

#### Autoload on Boot and on Each Reload

Let's imagine `ApiGateway` is a reloadable class and you need to configure its endpoint while the application boots:

```ruby
# config/initializers/api_gateway_setup.rb
ApiGateway.endpoint = "https://example.com" # NameError
```

Initializers cannot refer to reloadable constants, you need to wrap that in a `to_prepare` block, which runs on boot, and after each reload:

```ruby
# config/initializers/api_gateway_setup.rb
Rails.application.config.to_prepare do
  ApiGateway.endpoint = "https://example.com" # CORRECT
end
```

NOTE: For historical reasons, this callback may run twice. The code it executes must be idempotent.

#### Autoload on Boot Only

Reloadable classes and modules can be autoloaded in `after_initialize` blocks too. These run on boot, but do not run again on reload. In some exceptional cases this may be what you want.

Preflight checks are a use case for this:

```ruby
# config/initializers/check_admin_presence.rb
Rails.application.config.after_initialize do
  unless Role.where(name: "admin").exists?
    abort "The admin role is not present, please seed the database."
  end
end
```

### Use Case 2: During Boot, Load Code that Remains Cached

Some configurations take a class or module object, and they store it in a place that is not reloaded. It is important that these are not reloadable, because edits would not be reflected in those cached stale objects.

One example is middleware:

```ruby
config.middleware.use MyApp::Middleware::Foo
```

When you reload, the middleware stack is not affected, so it would be confusing that `MyApp::Middleware::Foo` is reloadable. Changes in its implementation would have no effect.

Another example is Active Job serializers:

```ruby
# config/initializers/custom_serializers.rb
Rails.application.config.active_job.custom_serializers << MoneySerializer
```

Whatever `MoneySerializer` evaluates to during initialization gets pushed to the custom serializers, and that object stays there on reloads.

Yet another example are railties or engines decorating framework classes by including modules. For instance, [`turbo-rails`](https://github.com/hotwired/turbo-rails) decorates `ActiveRecord::Base` this way:

```ruby
initializer "turbo.broadcastable" do
  ActiveSupport.on_load(:active_record) do
    include Turbo::Broadcastable
  end
end
```

That adds a module object to the ancestor chain of `ActiveRecord::Base`. Changes in `Turbo::Broadcastable` would have no effect if reloaded, the ancestor chain would still have the original one.

Corollary: Those classes or modules **cannot be reloadable**.

An idiomatic way to organize these files is to put them in the `lib` directory and load them with `require` where needed. For example, if the application has custom middleware in `lib/middleware`, issue a regular `require` call before configuring it:

```ruby
require "middleware/my_middleware"
config.middleware.use MyMiddleware
```

Additionally, if `lib` is in the autoload paths, configure the autoloader to ignore that subdirectory:

```ruby
# config/application.rb
config.autoload_lib(ignore: %w(assets tasks ... middleware))
```

since you are loading those files yourself.

As noted above, another option is to have the directory that defines them in the autoload once paths and autoload. Please check the [section about config.autoload_once_paths](#config-autoload-once-paths) for details.

### Use Case 3: Configure Application Classes for Engines

Let's suppose an engine works with the reloadable application class that models users, and has a configuration point for it:

```ruby
# config/initializers/my_engine.rb
MyEngine.configure do |config|
  config.user_model = User # NameError
end
```

In order to play well with reloadable application code, the engine instead needs applications to configure the _name_ of that class:

```ruby
# config/initializers/my_engine.rb
MyEngine.configure do |config|
  config.user_model = "User" # OK
end
```

Then, at run time, `config.user_model.constantize` gives you the current class object.

Eager Loading
-------------

In production-like environments it is generally better to load all the application code when the application boots. Eager loading puts everything in memory ready to serve requests right away, and it is also [CoW](https://en.wikipedia.org/wiki/Copy-on-write)-friendly.

Eager loading is controlled by the flag [`config.eager_load`][], which is disabled by default in all environments except `production`. When a Rake task gets executed, `config.eager_load` is overridden by [`config.rake_eager_load`][], which is `false` by default. So, by default, in production environments Rake tasks do not eager load the application.

The order in which files are eager-loaded is undefined.

During eager loading, Rails invokes `Zeitwerk::Loader.eager_load_all`. That ensures all gem dependencies managed by Zeitwerk are eager-loaded too.


[`config.eager_load`]: configuring.html#config-eager-load
[`config.rake_eager_load`]: configuring.html#config-rake-eager-load

Single Table Inheritance
------------------------

Single Table Inheritance doesn't play well with lazy loading: Active Record has to be aware of STI hierarchies to work correctly, but when lazy loading, classes are precisely loaded only on demand!

To address this fundamental mismatch we need to preload STIs. There are a few options to accomplish this, with different trade-offs. Let's see them.

### Option 1: Enable Eager Loading

The easiest way to preload STIs is to enable eager loading by setting:

```ruby
config.eager_load = true
```

in `config/environments/development.rb` and `config/environments/test.rb`.

This is simple, but may be costly because it eager loads the entire application on boot and on every reload. The trade-off may be worthwhile for small applications, though.

### Option 2: Preload a Collapsed Directory

Store the files that define the hierarchy in a dedicated directory, which makes sense also conceptually. The directory is not meant to represent a namespace, its sole purpose is to group the STI:

```
app/models/shapes/shape.rb
app/models/shapes/circle.rb
app/models/shapes/square.rb
app/models/shapes/triangle.rb
```

In this example, we still want `app/models/shapes/circle.rb` to define `Circle`, not `Shapes::Circle`. This may be your personal preference to keep things simple, and also avoids refactors in existing code bases. The [collapsing](https://github.com/fxn/zeitwerk#collapsing-directories) feature of Zeitwerk allows us to do that:

```ruby
# config/initializers/preload_stis.rb

shapes = "#{Rails.root}/app/models/shapes"
Rails.autoloaders.main.collapse(shapes) # Not a namespace.

unless Rails.application.config.eager_load
  Rails.application.config.to_prepare do
    Rails.autoloaders.main.eager_load_dir(shapes)
  end
end
```

In this option, we eager load these few files on boot and reload even if the STI is not used. However, unless your application has a lot of STIs, this won't have any measurable impact.

INFO: The method `Zeitwerk::Loader#eager_load_dir` was added in Zeitwerk 2.6.2. For older versions, you can still list the `app/models/shapes` directory and invoke `require_dependency` on its contents.

WARNING: If models are added, modified, or deleted from the STI, reloading works as expected. However, if a new separate STI hierarchy is added to the application, you'll need to edit the initializer and restart the server.

### Option 3: Preload a Regular Directory

Similar to the previous one, but the directory is meant to be a namespace. That is, `app/models/shapes/circle.rb` is expected to define `Shapes::Circle`.

For this one, the initializer is the same except no collapsing is configured:

```ruby
# config/initializers/preload_stis.rb

unless Rails.application.config.eager_load
  Rails.application.config.to_prepare do
    Rails.autoloaders.main.eager_load_dir("#{Rails.root}/app/models/shapes")
  end
end
```

Same trade-offs.

### Option 4: Preload Types from the Database

In this option we do not need to organize the files in any way, but we hit the database:

```ruby
# config/initializers/preload_stis.rb

unless Rails.application.config.eager_load
  Rails.application.config.to_prepare do
    types = Shape.unscoped.select(:type).distinct.pluck(:type)
    types.compact.each(&:constantize)
  end
end
```

WARNING: The STI will work correctly even if the table does not have all the types, but methods like `subclasses` or `descendants` won't return the missing types.

WARNING: If models are added, modified, or deleted from the STI, reloading works as expected. However, if a new separate STI hierarchy is added to the application, you'll need to edit the initializer and restart the server.

Customizing Inflections
-----------------------

By default, Rails uses `String#camelize` to know which constant a given file or directory name should define. For example, `posts_controller.rb` should define `PostsController` because that is what `"posts_controller".camelize` returns.

It could be the case that some particular file or directory name does not get inflected as you want. For instance, `html_parser.rb` is expected to define `HtmlParser` by default. What if you prefer the class to be `HTMLParser`? There are a few ways to customize this.

The easiest way is to define acronyms:

```ruby
ActiveSupport::Inflector.inflections(:en) do |inflect|
  inflect.acronym "HTML"
  inflect.acronym "SSL"
end
```

Doing so affects how Active Support inflects globally. That may be fine in some applications, but you can also customize how to camelize individual basenames independently from Active Support by passing a collection of overrides to the default inflectors:

```ruby
Rails.autoloaders.each do |autoloader|
  autoloader.inflector.inflect(
    "html_parser" => "HTMLParser",
    "ssl_error"   => "SSLError"
  )
end
```

That technique still depends on `String#camelize`, though, because that is what the default inflectors use as fallback. If you instead prefer not to depend on Active Support inflections at all and have absolute control over inflections, configure the inflectors to be instances of `Zeitwerk::Inflector`:

```ruby
Rails.autoloaders.each do |autoloader|
  autoloader.inflector = Zeitwerk::Inflector.new
  autoloader.inflector.inflect(
    "html_parser" => "HTMLParser",
    "ssl_error"   => "SSLError"
  )
end
```

There is no global configuration that can affect said instances; they are deterministic.

You can even define a custom inflector for full flexibility. Please check the [Zeitwerk documentation](https://github.com/fxn/zeitwerk#custom-inflector) for further details.

### Where Should Inflection Customization Go?

If an application does not use the `once` autoloader, the snippets above can go in `config/initializers`. For example, `config/initializers/inflections.rb` for the Active Support use case, or `config/initializers/zeitwerk.rb` for the other ones.

Applications using the `once` autoloader have to move or load this configuration from the body of the application class in `config/application.rb`, because the `once` autoloader uses the inflector early in the boot process.

Custom Namespaces
-----------------

As we saw above, autoload paths represent the top-level namespace: `Object`.

Let's consider `app/services`, for example. This directory is not generated by default, but if it exists, Rails automatically adds it to the autoload paths.

By default, the file `app/services/users/signup.rb` is expected to define `Users::Signup`, but what if you prefer that entire subtree to be under a `Services` namespace? Well, with default settings, that can be accomplished by creating a subdirectory: `app/services/services`.

However, depending on your taste, that just might not feel right to you. You might prefer that `app/services/users/signup.rb` simply defines `Services::Users::Signup`.

Zeitwerk supports [custom root namespaces](https://github.com/fxn/zeitwerk#custom-root-namespaces) to address this use case, and you can customize the `main` autoloader to accomplish that:

```ruby
# config/initializers/autoloading.rb

# The namespace has to exist.
#
# In this example we define the module on the spot. Could also be created
# elsewhere and its definition loaded here with an ordinary `require`. In
# any case, `push_dir` expects a class or module object.
module Services; end

Rails.autoloaders.main.push_dir("#{Rails.root}/app/services", namespace: Services)
```

Rails < 7.1 did not support this feature, but you can still add this additional code in the same file and get it working:

```ruby
# Additional code for applications running on Rails < 7.1.
app_services_dir = "#{Rails.root}/app/services" # has to be a string
ActiveSupport::Dependencies.autoload_paths.delete(app_services_dir)
Rails.application.config.watchable_dirs[app_services_dir] = [:rb]
```

Custom namespaces are also supported for the `once` autoloader. However, since that one is set up earlier in the boot process, the configuration cannot be done in an application initializer. Instead, please put it in `config/application.rb`, for example.

Autoloading and Engines
-----------------------

Engines run in the context of a parent application, and their code is autoloaded, reloaded, and eager loaded by the parent application. If the application runs in `zeitwerk` mode, the engine code is loaded by `zeitwerk` mode. If the application runs in `classic` mode, the engine code is loaded by `classic` mode.

When Rails boots, engine directories are added to the autoload paths, and from the point of view of the autoloader, there's no difference. Autoloaders' main inputs are the autoload paths, and whether they belong to the application source tree or to some engine source tree is irrelevant.

For example, this application uses [Devise](https://github.com/heartcombo/devise):

```bash
$ bin/rails runner 'pp ActiveSupport::Dependencies.autoload_paths'
[".../app/controllers",
 ".../app/controllers/concerns",
 ".../app/helpers",
 ".../app/models",
 ".../app/models/concerns",
 ".../gems/devise-4.8.0/app/controllers",
 ".../gems/devise-4.8.0/app/helpers",
 ".../gems/devise-4.8.0/app/mailers"]
 ```

If the engine controls the autoloading mode of its parent application, the engine can be written as usual.

However, if an engine supports Rails 6 or Rails 6.1 and does not control its parent applications, it has to be ready to run under either `classic` or `zeitwerk` mode. Things to take into account:

1. If `classic` mode would need a `require_dependency` call to ensure some constant is loaded at some point, write it. While `zeitwerk` would not need it, it won't hurt, it will work in `zeitwerk` mode too.

2. `classic` mode underscores constant names ("User" -> "user.rb"), and `zeitwerk` mode camelizes file names ("user.rb" -> "User"). They coincide in most cases, but they don't if there are series of consecutive uppercase letters as in "HTMLParser". The easiest way to be compatible is to avoid such names. In this case, pick "HtmlParser".

3. In `classic` mode, the file `app/model/concerns/foo.rb` is allowed to define both `Foo` and `Concerns::Foo`. In `zeitwerk` mode, there's only one option: it has to define `Foo`. In order to be compatible, define `Foo`.

Testing
-------

### Manual Testing

The task `zeitwerk:check` checks if the project tree follows the expected naming conventions and it is handy for manual checks. For example, if you're migrating from `classic` to `zeitwerk` mode, or if you're fixing something:

```bash
$ bin/rails zeitwerk:check
Hold on, I am eager loading the application.
All is good!
```

There can be additional output depending on the application configuration, but the last "All is good!" is what you are looking for.

### Automated Testing

It is a good practice to verify in the test suite that the project eager loads correctly.

That covers Zeitwerk naming compliance and other possible error conditions. Please check the [section about testing eager loading](testing.html#testing-eager-loading) in the [_Testing Rails Applications_](testing.html) guide.

Troubleshooting
---------------

The best way to follow what the loaders are doing is to inspect their activity.

The easiest way to do that is to include

```ruby
Rails.autoloaders.log!
```

in `config/application.rb` after loading the framework defaults. That will print traces to standard output.

If you prefer logging to a file, configure this instead:

```ruby
Rails.autoloaders.logger = Logger.new("#{Rails.root}/log/autoloading.log")
```

The Rails logger is not yet available when `config/application.rb` executes. If you prefer to use the Rails logger, configure this setting in an initializer instead:

```ruby
# config/initializers/log_autoloaders.rb
Rails.autoloaders.logger = Rails.logger
```

Rails.autoloaders
-----------------

The Zeitwerk instances managing your application are available at

```ruby
Rails.autoloaders.main
Rails.autoloaders.once
```

The predicate

```ruby
Rails.autoloaders.zeitwerk_enabled?
```

is still available in Rails 7 applications, and returns `true`.
