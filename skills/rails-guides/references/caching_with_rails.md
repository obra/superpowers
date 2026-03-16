**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Caching with Rails: An Overview
===============================

This guide is an introduction to speeding up your Rails application with caching.

After reading this guide, you will know:

* What caching is.
* The types of caching strategies.
* How to manage the caching dependencies.
* Solid Cache - a database-backed Active Support cache store.
* Other cache stores.
* Cache keys.
* Conditional GET support.

--------------------------------------------------------------------------------

What is Caching?
----------------

Caching means storing content generated during the request-response cycle and
reusing it when responding to similar requests. It's like keeping your favorite
coffee mug right on your desk instead of in the kitchen cabinet — it’s ready
when you need it, saving you time and effort.

Caching is one of the most effective ways to boost an application's performance.
It allows websites running on modest infrastructure — a single server with a
single database — to sustain thousands of concurrent users.

Rails provides a set of caching features out of the box which allows you to not
only cache data, but also to tackle challenges like cache expiration, cache
dependencies, and cache invalidation.

This guide will explore Rails' comprehensive caching strategies, from fragment
caching to SQL caching. With these techniques, your Rails application can serve
millions of views while keeping response times low and server bills manageable.

Types of Caching
----------------

This is an introduction to some of the common types of caching.

By default, Action Controller caching is only enabled in your production environment. You can play
around with caching locally by running `bin/rails dev:cache`, or by setting
[`config.action_controller.perform_caching`][] to `true` in `config/environments/development.rb`.

NOTE: Changing the value of `config.action_controller.perform_caching` will
only have an effect on the caching provided by Action Controller.
For instance, it will not impact low-level caching, that we address
[below](#low-level-caching-using-rails-cache).

[`config.action_controller.perform_caching`]: configuring.html#config-action-controller-perform-caching

### Fragment Caching

Dynamic web applications usually build pages with a variety of components not
all of which have the same caching characteristics. When different parts of the
page need to be cached and expired separately you can use Fragment Caching.

Fragment Caching allows a fragment of view logic to be wrapped in a cache block and served out of the cache store when the next request comes in.

For example, if you wanted to cache each product on a page, you could use this
code:

```html+erb
<% @products.each do |product| %>
  <% cache product do %>
    <%= render product %>
  <% end %>
<% end %>
```

When your application receives its first request to this page, Rails will write
a new cache entry with a unique key. A key looks something like this:

```
views/products/index:bea67108094918eeba42cd4a6e786901/products/1
```

The string of characters in the middle is a template tree digest. It is a hash
digest computed based on the contents of the view fragment you are caching. If
you change the view fragment (e.g., the HTML changes), the digest will change,
expiring the existing file.

A cache version, derived from the product record, is stored in the cache entry.
When the product is touched, the cache version changes, and any cached fragments
that contain the previous version are ignored.

TIP: Cache stores like Memcached will automatically delete old cache files.

If you want to cache a fragment under certain conditions, you can use
`cache_if` or `cache_unless`:

```erb
<% cache_if admin?, product do %>
  <%= render product %>
<% end %>
```

#### Collection Caching

The `render` helper can also cache individual templates rendered for a collection.
It can even one up the previous example with `each` by reading all cache
templates at once instead of one by one. This is done by passing `cached: true` when rendering the collection:

```html+erb
<%= render partial: 'products/product', collection: @products, cached: true %>
```

All cached templates from previous renders will be fetched at once with much
greater speed. Additionally, the templates that haven't yet been cached will be
written to cache and multi fetched on the next render.

The cache key can be configured. In the example below, it is prefixed with the
current locale to ensure that different localizations of the product page
do not overwrite each other:

```html+erb
<%= render partial: 'products/product',
           collection: @products,
           cached: ->(product) { [I18n.locale, product] } %>
```

Additionally, you can configure `cached` with an options hash that takes `expires_in` and `key` so you can explicitly set the expiration.

```html+erb
<%= render partial: 'products/product',
           collection: @products,
           cached: { expires_in: 1.hour, key: ->(product) { [I18n.locale, product] } } %>
```

### Russian Doll Caching

You may want to nest cached fragments inside other cached fragments. This is
called Russian doll caching.

The advantage of Russian doll caching is that if a single product is updated,
all the other inner fragments can be reused when regenerating the outer
fragment.

As explained in the previous section, a cached file will expire if the value of
`updated_at` changes for a record on which the cached file directly depends.
However, this will not expire any cache the fragment is nested within.

For example, take the following view:

```erb
<% cache product do %>
  <%= render product.games %>
<% end %>
```

Which in turn renders this view:

```erb
<% cache game do %>
  <%= render game %>
<% end %>
```

If any attribute of game is changed, the `updated_at` value will be set to the
current time, thereby expiring the cache. However, because `updated_at`
will not be changed for the product object, that cache will not be expired and
your app will serve stale data. To fix this, we tie the models together with
the `touch` method:

```ruby
class Product < ApplicationRecord
  has_many :games
end

class Game < ApplicationRecord
  belongs_to :product, touch: true
end
```

With `touch` set to `true`, any action which changes `updated_at` for a game
record will also change it for the associated product, thereby expiring the
cache.

### Shared Partial Caching

It is possible to share partials and associated caching between files with different MIME types. For example shared partial caching allows template writers to share a partial between HTML and JavaScript files. When templates are collected in the template resolver file paths they only include the template language extension and not the MIME type. Because of this templates can be used for multiple MIME types. Both HTML and JavaScript requests will respond to the following code:

```ruby
render(partial: "hotels/hotel", collection: @hotels, cached: true)
```

Will load a file named `hotels/hotel.erb`.

Another option is to include the `formats` attribute to the partial to render.

```ruby
render(partial: "hotels/hotel", collection: @hotels, formats: :html, cached: true)
```

Will load a file named `hotels/hotel.html.erb` in any file MIME type, for example you could include this partial in a JavaScript file.

### Low-Level Caching using `Rails.cache`

Sometimes you need to cache a particular value or query result instead of caching view fragments. Rails' caching mechanism works great for storing any serializable information.

An efficient way to implement low-level caching is using the `Rails.cache.fetch` method. This method handles both _reading from_ and _writing to_ the cache. When called with a single argument, it fetches and returns the cached value for the given key. If a block is passed, the block is executed only on a cache miss. The block's return value is written to the cache under the given cache key and returned. In case of cache hit, the cached value is returned directly without executing the block.

Consider the following example. An application has a `Product` model with an instance method that looks up the product's price on a competing website. The data returned by this method would be perfect for low-level caching:

```ruby
class Product < ApplicationRecord
  def competing_price
    Rails.cache.fetch("#{cache_key_with_version}/competing_price", expires_in: 12.hours) do
      Competitor::API.find_price(id)
    end
  end
end
```

NOTE: Notice that in this example we used the `cache_key_with_version` method, so the resulting cache key will be something like `products/233-20140225082222765838000/competing_price`. `cache_key_with_version` generates a string based on the model's class name, `id`, and `updated_at` attributes. This is a common convention and has the benefit of invalidating the cache whenever the product is updated. In general, when you use low-level caching, you need to generate a cache key.

Below are some more examples of how to use low-level caching:

```ruby
# Store a value in the cache
Rails.cache.write("greeting", "Hello, world!")

# Retrieve the value from the cache
greeting = Rails.cache.read("greeting")
puts greeting # Output: Hello, world!

# Fetch a value with a block to set a default if it doesn’t exist
welcome_message = Rails.cache.fetch("welcome_message") { "Welcome to Rails!" }
puts welcome_message # Output: Welcome to Rails!

# Delete a value from the cache
Rails.cache.delete("greeting")
```

#### Avoid Caching Instances of Active Record Objects

Consider this example, which stores a list of Active Record objects representing superusers in the cache:

```ruby
# super_admins is an expensive SQL query, so don't run it too often
Rails.cache.fetch("super_admin_users", expires_in: 12.hours) do
  User.super_admins.to_a
end
```

You should __avoid__ this pattern. Why? Because the instance could change. In production, attributes
on it could differ, or the record could be deleted. And in development, it works unreliably with
cache stores that reload code when you make changes.

Instead, cache the ID or some other primitive data type. For example:

```ruby
# super_admins is an expensive SQL query, so don't run it too often
ids = Rails.cache.fetch("super_admin_user_ids", expires_in: 12.hours) do
  User.super_admins.pluck(:id)
end
User.where(id: ids).to_a
```

### SQL Caching

Query caching is a Rails feature that caches the result set returned by each
query. If Rails encounters the same query again for that request, it will use
the cached result set as opposed to running the query against the database
again.

For example:

```ruby
class ProductsController < ApplicationController
  def index
    # Run a find query
    @products = Product.all

    # ...

    # Run the same query again
    @products = Product.all
  end
end
```

The second time the same query is run against the database, it's not actually going to hit the database. The first time the result is returned from the query it is stored in the query cache (in memory) and the second time it's pulled from memory. However, each retrieval still instantiates new instances of the queried objects.

NOTE: Query caches are created at the start of an action and destroyed at the
end of that action and thus persist only for the duration of the action. If
you'd like to store query results in a more persistent fashion, you can with
low-level caching.

## Managing Dependencies

In order to correctly invalidate the cache, you need to properly define the
caching dependencies. Rails is clever enough to handle common cases so you don't
have to specify anything. However, sometimes, when you're dealing with custom
helpers for instance, you need to explicitly define them.

### Implicit Dependencies

Most template dependencies can be derived from calls to `render` in the template
itself. Here are some examples of render calls that [`ActionView::Digestor`](https://api.rubyonrails.org/classes/ActionView/Digestor.html) knows
how to decode:

```ruby
render partial: "comments/comment", collection: commentable.comments
render "comments/comments"
render("comments/comments")

render "header" # translates to render("comments/header")

render(@topic)         # translates to render("topics/topic")
render(topics)         # translates to render("topics/topic")
render(message.topics) # translates to render("topics/topic")
```

On the other hand, some calls need to be changed to make caching work properly.
For instance, if you're passing a custom collection, you'll need to change:

```ruby
render @project.documents.where(published: true)
```

to:

```ruby
render partial: "documents/document", collection: @project.documents.where(published: true)
```

### Explicit Dependencies

Sometimes you'll have template dependencies that can't be derived at all. This
is typically the case when rendering happens in helpers. Here's an example:

```html+erb
<%= render_sortable_todolists @project.todolists %>
```

You'll need to use a special comment format to call those out:

```html+erb
<%# Template Dependency: todolists/todolist %>
<%= render_sortable_todolists @project.todolists %>
```

In some cases, like a single table inheritance setup, you might have a bunch of
explicit dependencies. Instead of writing every template out, you can use a
wildcard to match any template in a directory:

```html+erb
<%# Template Dependency: events/* %>
<%= render_categorizable_events @person.events %>
```

As for collection caching, if the partial template doesn't start with a clean
cache call, you can still benefit from collection caching by adding a special
comment format anywhere in the template, like:

```html+erb
<%# Template Collection: notification %>
<% my_helper_that_calls_cache(some_arg, notification) do %>
  <%= notification.name %>
<% end %>
```

### External Dependencies

If you use a helper method, for example, inside a cached block and you then update
that helper, you'll have to bump the cache as well. It doesn't really matter how
you do it, but the MD5 of the template file must change. One recommendation is to
simply be explicit in a comment, like:

```html+erb
<%# Helper Dependency Updated: Jul 28, 2015 at 7pm %>
<%= some_helper_method(person) %>
```

Solid Cache
-----------

Solid Cache is a database-backed Active Support cache store. It leverages the
speed of modern [SSDs](https://en.wikipedia.org/wiki/Solid-state_drive) (Solid
State Drives) to offer cost-effective caching with larger storage capacity and
simplified infrastructure. While SSDs are slightly slower than RAM, the
difference is minimal for most applications. SSDs compensate for this by not
needing to be invalidated as frequently, since they can store much more data. As
a result, there are fewer cache misses on average, leading to fast response
times.

Solid Cache uses a FIFO (First In, First Out) caching strategy, where the first
item added to the cache is the first one to be removed when the cache reaches
its limit. This approach is simpler but less efficient compared to an LRU (Least
Recently Used) cache, which removes the least recently accessed items first,
better optimizing for frequently used data. However, Solid Cache compensates for
the lower efficiency of FIFO by allowing the cache to live longer, reducing the
frequency of invalidations.

Solid Cache is enabled by default from Rails version 8.0 and onward. However, if
you'd prefer not to utilize it, you can skip Solid Cache:

```bash
rails new app_name --skip-solid
```

NOTE: Using the `--skip-solid` flag skips all parts of the Solid
Trifecta (Solid Cache, Solid Queue, and Solid Cable). If you still
want to use some of them, you can install them separately. For
example, if you want to use Solid Queue and Solid Cable but not
Solid Cache, you can follow the installation guides for [Solid
Queue](https://github.com/rails/solid_queue#installation) and
[Solid Cable](https://github.com/rails/solid_cable#installation).

### Configuring the Database

To use Solid Cache, you can configure the database connection in your
`config/database.yml` file. Here's an example configuration for a SQLite
database:

```yaml
production:
  primary:
    <<: *default
    database: storage/production.sqlite3
  cache:
    <<: *default
    database: storage/production_cache.sqlite3
    migrations_paths: db/cache_migrate
```

In this configuration, the `cache` database is used to store cached data. You
can also specify a different database adapter, like MySQL or PostgreSQL, if you
prefer.

```yaml
production:
  primary: &primary_production
    <<: *default
    database: app_production
    username: app
    password: <%= ENV["APP_DATABASE_PASSWORD"] %>
  cache:
    <<: *primary_production
    database: app_production_cache
    migrations_paths: db/cache_migrate
```

If `database` or [`databases`](#sharding-the-cache) is not specified in the
cache configuration, Solid Cache will use the ActiveRecord::Base connection
pool. This means that cache reads and writes will be part of any wrapping
database transaction.

In production, the cache store is configured to use the Solid Cache store by
default:

```yaml
  # config/environments/production.rb
  config.cache_store = :solid_cache_store
```

You can [access the cache by calling
`Rails.cache`](#low-level-caching-using-rails-cache)


### Customizing the Cache Store

Solid Cache can be customized through the config/cache.yml file:

```yaml
default: &default
  store_options:
    # Cap age of oldest cache entry to fulfill retention policies
    max_age: <%= 60.days.to_i %>
    max_size: <%= 256.megabytes %>
    namespace: <%= Rails.env %>
```

For the full list of keys for store_options see [Cache
configuration](https://github.com/rails/solid_cache#cache-configuration).

Here, you can adjust the `max_age` and `max_size` options to control the age and
size of the cache entries.

### Handling Cache Expiration

Solid Cache tracks cache writes by incrementing a counter with each write. When
the counter reaches 50% of the `expiry_batch_size` from the [Cache
configuration](https://github.com/rails/solid_cache#cache-configuration), a
background task is triggered to handle cache expiry. This approach ensures cache
records expire faster than they are written when the cache needs to shrink.

The background task only runs when there are writes, so the process stays idle
when the cache is not being updated. If you prefer to run the expiry process in
a background job instead of a thread, set `expiry_method` from the [Cache
configuration](https://github.com/rails/solid_cache#cache-configuration) to
`:job`.

### Sharding the Cache

If you need more scalability, Solid Cache supports sharding — splitting the
cache across multiple databases. This spreads the load, making your cache even
more powerful. To enable sharding, add multiple cache databases to your
database.yml:

```yaml
# config/database.yml
production:
  cache_shard1:
    database: cache1_production
    host: cache1-db
  cache_shard2:
    database: cache2_production
    host: cache2-db
  cache_shard3:
    database: cache3_production
    host: cache3-db
```

Additionally, you must specify the shards in the cache configuration:

```yaml
# config/cache.yml
production:
  databases: [cache_shard1, cache_shard2, cache_shard3]
```

### Encryption

Solid Cache supports encryption to protect sensitive data. To enable encryption,
set the `encrypt` value in your cache configuration:

```yaml
# config/cache.yml
production:
  encrypt: true
```

You will need to set up your application to use [Active Record
Encryption](active_record_encryption.html).

### Caching in Development

By default, caching is *enabled* in development mode with
[`:memory_store`](#activesupport-cache-memorystore). This doesn't apply to
Action Controller caching, which is disabled by default.

To enable Action Controller caching Rails provides the `bin/rails dev:cache`
command.

```bash
$ bin/rails dev:cache
Development mode is now being cached.
$ bin/rails dev:cache
Development mode is no longer being cached.
```

If you want to use Solid Cache in development, set the `cache_store`
configuration in `config/environments/development.rb`:

```ruby
config.cache_store = :solid_cache_store
```

and ensure the `cache` database is created and migrated:

```bash
development:
  <<: *default
  database: cache
```

TIP: To disable caching set `cache_store` to
[`:null_store`](#activesupport-cache-nullstore)

Other Cache Stores
------------------

Rails provides different stores for the cached data (with the exception of SQL
Caching).

### Configuration

You can set up a different cache store by setting the
`config.cache_store` configuration option. Other parameters can be passed as
arguments to the cache store's constructor:

```ruby
config.cache_store = :memory_store, { size: 64.megabytes }
```

Alternatively, you can set `ActionController::Base.cache_store` outside of a configuration block.

You can access the cache by calling `Rails.cache`.

#### Connection Pool Options

[`:mem_cache_store`](#activesupport-cache-memcachestore) and
[`:redis_cache_store`](#activesupport-cache-rediscachestore) are configured to
use connection pooling. This means that if you're using Puma, or another
threaded server, you can have multiple threads performing queries to the cache
store at the same time.

If you want to disable connection pooling, set `:pool` option to `false` when configuring the cache store:

```ruby
config.cache_store = :mem_cache_store, "cache.example.com", { pool: false }
```

You can also override default pool settings by providing individual options to the `:pool` option:

```ruby
config.cache_store = :mem_cache_store, "cache.example.com", { pool: { size: 32, timeout: 1 } }
```

* `:size` - This option sets the number of connections per process (defaults to 5).

* `:timeout` - This option sets the number of seconds to wait for a connection (defaults to 5). If no connection is available within the timeout, a `Timeout::Error` will be raised.

### `ActiveSupport::Cache::Store`

[`ActiveSupport::Cache::Store`][] provides the foundation for interacting with the cache in Rails. This is an abstract class, and you cannot use it on its own. Instead, you must use a concrete implementation of the class tied to a storage engine. Rails ships with several implementations, documented below.

The main API methods are [`read`][ActiveSupport::Cache::Store#read], [`write`][ActiveSupport::Cache::Store#write], [`delete`][ActiveSupport::Cache::Store#delete], [`exist?`][ActiveSupport::Cache::Store#exist?], and [`fetch`][ActiveSupport::Cache::Store#fetch].

Options passed to the cache store's constructor will be treated as default options for the appropriate API methods.

[`ActiveSupport::Cache::Store`]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html
[ActiveSupport::Cache::Store#delete]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-delete
[ActiveSupport::Cache::Store#exist?]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-exist-3F
[ActiveSupport::Cache::Store#fetch]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-fetch
[ActiveSupport::Cache::Store#read]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-read
[ActiveSupport::Cache::Store#write]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/Store.html#method-i-write

### `ActiveSupport::Cache::MemoryStore`

[`ActiveSupport::Cache::MemoryStore`][] keeps entries in memory in the same Ruby process. The cache
store has a bounded size specified by sending the `:size` option to the
initializer (default is 32Mb). When the cache exceeds the allotted size, a
cleanup will occur and the least recently used entries will be removed.

```ruby
config.cache_store = :memory_store, { size: 64.megabytes }
```

If you're running multiple Ruby on Rails server processes (which is the case
if you're using Phusion Passenger or puma clustered mode), then your Rails server
process instances won't be able to share cache data with each other. This cache
store is not appropriate for large application deployments. However, it can
work well for small, low traffic sites with only a couple of server processes,
as well as development and test environments.

New Rails projects are configured to use this implementation in the development environment by default.

NOTE: Since processes will not share cache data when using `:memory_store`,
it will not be possible to manually read, write, or expire the cache via the Rails console.

[`ActiveSupport::Cache::MemoryStore`]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/MemoryStore.html

### `ActiveSupport::Cache::FileStore`

[`ActiveSupport::Cache::FileStore`][] uses the file system to store entries. The path to the directory where the store files will be stored must be specified when initializing the cache.

```ruby
config.cache_store = :file_store, "/path/to/cache/directory"
```

With this cache store, multiple server processes on the same host can share a
cache. This cache store is appropriate for low to medium traffic sites that are
served off one or two hosts. Server processes running on different hosts could
share a cache by using a shared file system, but that setup is not recommended.

As the cache will grow until the disk is full, it is recommended to
periodically clear out old entries.


[`ActiveSupport::Cache::FileStore`]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/FileStore.html

### `ActiveSupport::Cache::MemCacheStore`

[`ActiveSupport::Cache::MemCacheStore`][] uses Danga's `memcached` server to provide a centralized cache for your application. Rails uses the bundled `dalli` gem by default. This is currently the most popular cache store for production websites. It can be used to provide a single, shared cache cluster with very high performance and redundancy.

When initializing the cache, you should specify the addresses for all memcached servers in your cluster, or ensure the `MEMCACHE_SERVERS` environment variable has been set appropriately.

```ruby
config.cache_store = :mem_cache_store, "cache-1.example.com", "cache-2.example.com"
```

If neither are specified, it will assume memcached is running on localhost on the default port (`127.0.0.1:11211`), but this is not an ideal setup for larger sites.

```ruby
config.cache_store = :mem_cache_store # Will fallback to $MEMCACHE_SERVERS, then 127.0.0.1:11211
```

See the [`Dalli::Client` documentation](https://www.rubydoc.info/gems/dalli/Dalli/Client#initialize-instance_method) for supported address types.

The [`write`][ActiveSupport::Cache::MemCacheStore#write] (and `fetch`) method on this cache accepts additional options that take advantage of features specific to memcached.

[`ActiveSupport::Cache::MemCacheStore`]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/MemCacheStore.html
[ActiveSupport::Cache::MemCacheStore#write]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/MemCacheStore.html#method-i-write

### `ActiveSupport::Cache::RedisCacheStore`

[`ActiveSupport::Cache::RedisCacheStore`][] takes advantage of Redis support for automatic eviction
when it reaches max memory, allowing it to behave much like a Memcached cache server.

Deployment note: Redis doesn't expire keys by default, so take care to use a
dedicated Redis cache server. Don't fill up your persistent-Redis server with
volatile cache data! Read the
[Redis cache server setup guide](https://redis.io/topics/lru-cache) in detail.

For a cache-only Redis server, set `maxmemory-policy` to one of the variants of allkeys.
Redis 4+ supports least-frequently-used eviction (`allkeys-lfu`), an excellent
default choice. Redis 3 and earlier should use least-recently-used eviction (`allkeys-lru`).

Set cache read and write timeouts relatively low. Regenerating a cached value
is often faster than waiting more than a second to retrieve it. Both read and
write timeouts default to 1 second, but may be set lower if your network is
consistently low-latency.

By default, the cache store will attempt to reconnect to Redis once if the
connection fails during a request.

Cache reads and writes never raise exceptions; they just return `nil` instead,
behaving as if there was nothing in the cache. To gauge whether your cache is
hitting exceptions, you may provide an `error_handler` to report to an
exception gathering service. It must accept three keyword arguments: `method`,
the cache store method that was originally called; `returning`, the value that
was returned to the user, typically `nil`; and `exception`, the exception that
was rescued.

To get started, add the redis gem to your Gemfile:

```ruby
gem "redis"
```

Finally, add the configuration in the relevant `config/environments/*.rb` file:

```ruby
config.cache_store = :redis_cache_store, { url: ENV["REDIS_URL"] }
```

A more complex, production Redis cache store may look something like this:

```ruby
cache_servers = %w(redis://cache-01:6379/0 redis://cache-02:6379/0)
config.cache_store = :redis_cache_store, { url: cache_servers,

  connect_timeout:    30,  # Defaults to 1 second
  read_timeout:       0.2, # Defaults to 1 second
  write_timeout:      0.2, # Defaults to 1 second
  reconnect_attempts: 2,   # Defaults to 1

  error_handler: -> (method:, returning:, exception:) {
    # Report errors to Sentry as warnings
    Sentry.capture_exception exception, level: "warning",
      tags: { method: method, returning: returning }
  }
}
```

[`ActiveSupport::Cache::RedisCacheStore`]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/RedisCacheStore.html

### `ActiveSupport::Cache::NullStore`

[`ActiveSupport::Cache::NullStore`][] is scoped to each web request, and clears stored values at the end of a request. It is meant for use in development and test environments. It can be very useful when you have code that interacts directly with `Rails.cache` but caching interferes with seeing the results of code changes.

```ruby
config.cache_store = :null_store
```

[`ActiveSupport::Cache::NullStore`]: https://api.rubyonrails.org/classes/ActiveSupport/Cache/NullStore.html

### Custom Cache Stores

You can create your own custom cache store by simply extending
`ActiveSupport::Cache::Store` and implementing the appropriate methods. This way,
you can swap in any number of caching technologies into your Rails application.

To use a custom cache store, simply set the cache store to a new instance of your
custom class.

```ruby
config.cache_store = MyCacheStore.new
```

Cache Keys
----------

The keys used in a cache can be any object that responds to either `cache_key` or
`to_param`. You can implement the `cache_key` method on your classes if you need
to generate custom keys. Active Record will generate keys based on the class name
and record id.

You can use Hashes and Arrays of values as cache keys.

```ruby
# This is a valid cache key
Rails.cache.read(site: "mysite", owners: [owner_1, owner_2])
```

The keys you use on `Rails.cache` will not be the same as those actually used with
the storage engine. They may be modified with a namespace or altered to fit
technology backend constraints. This means, for instance, that you can't save
values with `Rails.cache` and then try to pull them out with the `dalli` gem.
However, you also don't need to worry about exceeding the memcached size limit or
violating syntax rules.

Conditional GET Support
-----------------------

Conditional GETs are a feature of the HTTP specification that provide a way for web servers to tell browsers that the response to a GET request hasn't changed since the last request and can be safely pulled from the browser cache.

They work by using the `HTTP_IF_NONE_MATCH` and `HTTP_IF_MODIFIED_SINCE` headers to pass back and forth both a unique content identifier and the timestamp of when the content was last changed. If the browser makes a request where the content identifier (ETag) or last modified since timestamp matches the server's version then the server only needs to send back an empty response with a not modified status.

It is the server's (i.e. our) responsibility to look for a last modified timestamp and the if-none-match header and determine whether or not to send back the full response. With conditional-get support in Rails this is a pretty easy task:

```ruby
class ProductsController < ApplicationController
  def show
    @product = Product.find(params[:id])

    # If the request is stale according to the given timestamp and etag value
    # (i.e. it needs to be processed again) then execute this block
    if stale?(last_modified: @product.updated_at.utc, etag: @product.cache_key_with_version)
      respond_to do |wants|
        # ... normal response processing
      end
    end

    # If the request is fresh (i.e. it's not modified) then you don't need to do
    # anything. The default render checks for this using the parameters
    # used in the previous call to stale? and will automatically send a
    # :not_modified. So that's it, you're done.
  end
end
```

Instead of an options hash, you can also simply pass in a model. Rails will use the `updated_at` and `cache_key_with_version` methods for setting `last_modified` and `etag`:

```ruby
class ProductsController < ApplicationController
  def show
    @product = Product.find(params[:id])

    if stale?(@product)
      respond_to do |wants|
        # ... normal response processing
      end
    end
  end
end
```

If you don't have any special response processing and are using the default rendering mechanism (i.e. you're not using `respond_to` or calling render yourself) then you've got an easy helper in `fresh_when`:

```ruby
class ProductsController < ApplicationController
  # This will automatically send back a :not_modified if the request is fresh,
  # and will render the default template (product.*) if it's stale.

  def show
    @product = Product.find(params[:id])
    fresh_when last_modified: @product.published_at.utc, etag: @product
  end
end
```

When both `last_modified` and `etag` are set, behavior varies depending on the value of `config.action_dispatch.strict_freshness`.
If set to `true`, only the `etag` is considered as specified by RFC 7232 section 6.
If set to `false`, both are considered and the cache is considered fresh if both conditions are satisfied, as was the historical Rails behavior.

Sometimes we want to cache response, for example a static page, that never gets
expired. To achieve this, we can use `http_cache_forever` helper and by doing
so browser and proxies will cache it indefinitely.

By default cached responses will be private, cached only on the user's web
browser. To allow proxies to cache the response, set `public: true` to indicate
that they can serve the cached response to all users.

Using this helper, `last_modified` header is set to `Time.new(2011, 1, 1).utc`
and `expires` header is set to a 100 years.

WARNING: Use this method carefully as browser/proxy won't be able to invalidate
the cached response unless browser cache is forcefully cleared.

```ruby
class HomeController < ApplicationController
  def index
    http_cache_forever(public: true) do
      render
    end
  end
end
```

### Strong v/s Weak ETags

Rails generates weak ETags by default. Weak ETags allow semantically equivalent
responses to have the same ETags, even if their bodies do not match exactly.
This is useful when we don't want the page to be regenerated for minor changes in
response body.

Weak ETags have a leading `W/` to differentiate them from strong ETags.

```
W/"618bbc92e2d35ea1945008b42799b0e7" → Weak ETag
"618bbc92e2d35ea1945008b42799b0e7" → Strong ETag
```

Unlike weak ETag, strong ETag implies that response should be exactly the same
and byte by byte identical. Useful when doing Range requests within a
large video or PDF file. Some CDNs support only strong ETags, like Akamai.
If you absolutely need to generate a strong ETag, it can be done as follows.

```ruby
class ProductsController < ApplicationController
  def show
    @product = Product.find(params[:id])
    fresh_when last_modified: @product.published_at.utc, strong_etag: @product
  end
end
```

You can also set the strong ETag directly on the response.

```ruby
response.strong_etag = response.body # => "618bbc92e2d35ea1945008b42799b0e7"
```
