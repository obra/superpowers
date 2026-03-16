**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Multiple Databases with Active Record
=====================================

This guide covers using multiple databases with your Rails application.

After reading this guide you will know:

* How to set up your application for multiple databases.
* How automatic connection switching works.
* How to use horizontal sharding for multiple databases.
* What features are supported and what's still a work in progress.

--------------------------------------------------------------------------------

As an application grows in popularity and usage, you'll need to scale the application
to support your new users and their data. One way in which your application may need
to scale is on the database level. Rails supports using multiple databases, so you don't
have to store your data all in one place.

At this time the following features are supported:

* Multiple writer databases and a replica for each
* Automatic connection switching for the model you're working with
* Automatic swapping between the writer and replica depending on the HTTP verb and recent writes
* Rails tasks for creating, dropping, migrating, and interacting with the multiple databases

The following features are not (yet) supported:

* Load balancing replicas

## Setting up Your Application

While Rails tries to do most of the work for you, there are still some steps you'll
need to do to get your application ready for multiple databases.

Let's say we have an application with a single writer database, and we need to add a
new database for some new tables we're adding. The name of the new database will be
"animals".

`config/database.yml` looks like this:

```yaml
production:
  database: my_primary_database
  adapter: mysql2
  username: root
  password: <%= ENV['ROOT_PASSWORD'] %>
```

Let's add a second database called "animals" and replicas for both databases as
well. To do this, we need to change our `config/database.yml` from a 2-tier to a
3-tier config.

If a `primary` configuration key is provided, it will be used as the "default" configuration. If
there is no configuration named `primary`, Rails will use the first configuration as default
for each environment. The default configurations will use the default Rails filenames. For example,
primary configurations will use `db/schema.rb` for the schema file, whereas all the other entries
will use `db/[CONFIGURATION_NAMESPACE]_schema.rb` for the filename.

```yaml
production:
  primary:
    database: my_primary_database
    username: root
    password: <%= ENV['ROOT_PASSWORD'] %>
    adapter: mysql2
  primary_replica:
    database: my_primary_database
    username: root_readonly
    password: <%= ENV['ROOT_READONLY_PASSWORD'] %>
    adapter: mysql2
    replica: true
  animals:
    database: my_animals_database
    username: animals_root
    password: <%= ENV['ANIMALS_ROOT_PASSWORD'] %>
    adapter: mysql2
    migrations_paths: db/animals_migrate
  animals_replica:
    database: my_animals_database
    username: animals_readonly
    password: <%= ENV['ANIMALS_READONLY_PASSWORD'] %>
    adapter: mysql2
    replica: true
```

Connection URLs for databases can also be configured using environment variables. The variable
name is formed by concatenating the connection name with `_DATABASE_URL`. For example, setting
`ANIMALS_DATABASE_URL="mysql2://username:password@host/database"` is merged into the `animals`
configuration in `database.yml` in the `production` environment. See
[Configuring a Database](configuring.html#configuring-a-database) for details about how the
merging works.

When using multiple databases, there are a few important settings.

First, the database name for `primary` and `primary_replica` should be the same because they contain
the same data. This is also the case for `animals` and `animals_replica`.

Second, the username for the writers and replicas should be different, and the
replica user's database permissions should be set to only read and not write.

When using a replica database, you need to add a `replica: true` entry to the replica in
`config/database.yml`. This is because Rails otherwise has no way of knowing which one is a replica
and which one is the writer. Rails will not run certain tasks, such as migrations, against replicas.

Lastly, for new writer databases, you need to set the `migrations_paths` key to the directory
where you will store migrations for that database. We'll look more at `migrations_paths`
later on in this guide.

You can also configure the schema dump file by setting `schema_dump` to a custom schema file name
or completely skip the schema dumping by setting `schema_dump: false`.

Now that we have a new database, let's set up the connection model.

The primary database replica may be configured in `ApplicationRecord` this way:

```ruby
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  connects_to database: { writing: :primary, reading: :primary_replica }
end
```

If you use a differently named class for your application record you need to
set `primary_abstract_class` instead, so that Rails knows which class `ActiveRecord::Base`
should share a connection with.

```ruby
class PrimaryApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  connects_to database: { writing: :primary, reading: :primary_replica }
end
```

In that case, classes that connect to `primary`/`primary_replica` can inherit
from your primary abstract class like standard Rails applications do with
`ApplicationRecord`:

```ruby
class Person < PrimaryApplicationRecord
end
```

On the other hand, we need to set up our models persisted in the "animals" database:

```ruby
class AnimalsRecord < ApplicationRecord
  self.abstract_class = true

  connects_to database: { writing: :animals, reading: :animals_replica }
end
```

Those models should inherit from that common abstract class:

```ruby
class Dog < AnimalsRecord
  # Talks automatically to the animals database.
end
```

By default, Rails expects the database roles to be `writing` and `reading` for the primary
and replica respectively. If you have a legacy system you may already have roles set up that
you don't want to change. In that case you can set a new role name in your application config.

```ruby
config.active_record.writing_role = :default
config.active_record.reading_role = :readonly
```

It's important to connect to your database in a single model and then inherit from that model
for the tables rather than connect multiple individual models to the same database. Database
clients have a limit to the number of open connections there can be, and if you do this, it will
multiply the number of connections you have since Rails uses the model class name for the
connection specification name.

Now that we have the `config/database.yml` and the new model set up, it's time
to create the databases. Rails ships with all the commands you need to use
multiple databases.

You can run `bin/rails --help` to see all the commands you're able to run. You should see the following:

```bash
$ bin/rails --help
...
db:create                          # Create the database from DATABASE_URL or config/database.yml for the ...
db:create:animals                  # Create animals database for current environment
db:create:primary                  # Create primary database for current environment
db:drop                            # Drop the database from DATABASE_URL or config/database.yml for the cu...
db:drop:animals                    # Drop animals database for current environment
db:drop:primary                    # Drop primary database for current environment
db:migrate                         # Migrate the database (options: VERSION=x, VERBOSE=false, SCOPE=blog)
db:migrate:animals                 # Migrate animals database for current environment
db:migrate:primary                 # Migrate primary database for current environment
db:migrate:status                  # Display status of migrations
db:migrate:status:animals          # Display status of migrations for animals database
db:migrate:status:primary          # Display status of migrations for primary database
db:reset                           # Drop and recreates all databases from their schema for the current environment and loads the seeds
db:reset:animals                   # Drop and recreates the animals database from its schema for the current environment and loads the seeds
db:reset:primary                   # Drop and recreates the primary database from its schema for the current environment and loads the seeds
db:rollback                        # Roll the schema back to the previous version (specify steps w/ STEP=n)
db:rollback:animals                # Rollback animals database for current environment (specify steps w/ STEP=n)
db:rollback:primary                # Rollback primary database for current environment (specify steps w/ STEP=n)
db:schema:dump                     # Create a database schema file (either db/schema.rb or db/structure.sql  ...
db:schema:dump:animals             # Create a database schema file (either db/schema.rb or db/structure.sql  ...
db:schema:dump:primary             # Create a db/schema.rb file that is portable against any DB supported  ...
db:schema:load                     # Load a database schema file (either db/schema.rb or db/structure.sql  ...
db:schema:load:animals             # Load a database schema file (either db/schema.rb or db/structure.sql  ...
db:schema:load:primary             # Load a database schema file (either db/schema.rb or db/structure.sql  ...
db:setup                           # Create all databases, loads all schemas, and initializes with the seed data (use db:reset to also drop all databases first)
db:setup:animals                   # Create the animals database, loads the schema, and initializes with the seed data (use db:reset:animals to also drop the database first)
db:setup:primary                   # Create the primary database, loads the schema, and initializes with the seed data (use db:reset:primary to also drop the database first)
...
```

Running a command like `bin/rails db:create` will create both the primary and animals databases.
Note that there is no command for creating the database users, and you'll need to do that manually
to support the read-only users for your replicas. If you want to create just the animals
database you can run `bin/rails db:create:animals`.

## Connecting to Databases without Managing Schema and Migrations

If you would like to connect to an external database without any database
management tasks such as schema management, migrations, seeds, etc., you can set
the per database config option `database_tasks: false`. By default it is
set to true.

```yaml
production:
  primary:
    database: my_database
    adapter: mysql2
  animals:
    database: my_animals_database
    adapter: mysql2
    database_tasks: false
```

## Generators and Migrations

Migrations for multiple databases should live in their own folders prefixed with the
name of the database key in the configuration.

You also need to set `migrations_paths` in the database configurations to tell
Rails where to find the migrations.

For example the `animals` database would look for migrations in the `db/animals_migrate` directory and
`primary` would look in `db/migrate`. Rails generators now take a `--database` option
so that the file is generated in the correct directory. The command can be run like so:

```bash
$ bin/rails generate migration CreateDogs name:string --database animals
```

If you are using Rails generators, the scaffold and model generators will create the abstract
class for you. Simply pass the database key to the command line.

```bash
$ bin/rails generate scaffold Dog name:string --database animals
```

A class with the camelized database name and `Record` will be created. In this
example the database is "animals" so we end up with `AnimalsRecord`:

```ruby
class AnimalsRecord < ApplicationRecord
  self.abstract_class = true

  connects_to database: { writing: :animals }
end
```

The generated model will automatically inherit from `AnimalsRecord`.

```ruby
class Dog < AnimalsRecord
end
```

NOTE: Since Rails doesn't know which database is the replica for your writer you will need to
add this to the abstract class after you're done.

Rails will only generate `AnimalsRecord` once. It will not be overwritten by new
scaffolds or deleted if the scaffold is deleted.

If you already have an abstract class and its name differs from `AnimalsRecord`, you can pass
the `--parent` option to indicate you want a different abstract class:

```bash
$ bin/rails generate scaffold Dog name:string --database animals --parent Animals::Record
```

This will skip generating `AnimalsRecord` since you've indicated to Rails that you want to
use a different parent class.

## Activating Automatic Role Switching

Finally, in order to use the read-only replica in your application, you'll need to activate
the middleware for automatic switching.

Automatic switching allows the application to switch from the writer to the replica or the replica
to the writer based on the HTTP verb and whether there was a recent write by the requesting user.

If the application receives a POST, PUT, DELETE, or PATCH request, the application will
automatically write to the writer database. If the request is not one of those methods,
but the application recently made a write, the writer database will also be used. All
other requests will use the replica database.

To activate the automatic connection switching middleware you can run the automatic swapping
generator:

```bash
$ bin/rails g active_record:multi_db
```

And then uncomment the following lines:

```ruby
Rails.application.configure do
  config.active_record.database_selector = { delay: 2.seconds }
  config.active_record.database_resolver = ActiveRecord::Middleware::DatabaseSelector::Resolver
  config.active_record.database_resolver_context = ActiveRecord::Middleware::DatabaseSelector::Resolver::Session
end
```

Rails guarantees "read your own write" and will send your GET or HEAD request to the
writer if it's within the `delay` window. By default the delay is set to 2 seconds. You
should change this based on your database infrastructure. Rails doesn't guarantee "read
a recent write" for other users within the delay window and will send GET and HEAD requests
to the replicas unless they wrote recently.

The automatic connection switching in Rails is relatively primitive and deliberately doesn't
do a whole lot. The goal is a system that demonstrates how to do automatic connection
switching that is flexible enough to be customizable by app developers.

The setup in Rails allows you to easily change how the switching is done and what
parameters it's based on. Let's say you want to use a cookie instead of a session to
decide when to swap connections. You can write your own class:

```ruby
class MyCookieResolver < ActiveRecord::Middleware::DatabaseSelector::Resolver
  def self.call(request)
    new(request.cookies)
  end

  def initialize(cookies)
    @cookies = cookies
  end

  attr_reader :cookies

  def last_write_timestamp
    self.class.convert_timestamp_to_time(cookies[:last_write])
  end

  def update_last_write_timestamp
    cookies[:last_write] = self.class.convert_time_to_timestamp(Time.now)
  end

  def save(response)
  end
end
```

And then pass it to the middleware:

```ruby
config.active_record.database_selector = { delay: 2.seconds }
config.active_record.database_resolver = ActiveRecord::Middleware::DatabaseSelector::Resolver
config.active_record.database_resolver_context = MyCookieResolver
```

## Using Manual Connection Switching

There are some cases where you may want your application to connect to a writer or a replica
and the automatic connection switching isn't adequate. For example, you may know that for a
particular request you always want to send the request to a replica, even when you are in a
POST request path.

To do this Rails provides a `connected_to` method that will switch to the connection you
need.

```ruby
ActiveRecord::Base.connected_to(role: :reading) do
  # All code in this block will be connected to the reading role.
end
```

The "role" in the `connected_to` call looks up the connections that are connected on that
connection handler (or role). The `reading` connection handler will hold all the connections
that were connected via `connects_to` with the role name of `reading`.

Note that `connected_to` with a role will look up an existing connection and switch
using the connection specification name. This means that if you pass an unknown role
like `connected_to(role: :nonexistent)` you will get an error that says
`ActiveRecord::ConnectionNotEstablished (No connection pool for 'ActiveRecord::Base' found for the 'nonexistent' role.)`

If you want Rails to ensure any queries performed are read-only, pass `prevent_writes: true`.
This just prevents queries that look like writes from being sent to the database.
You should also configure your replica database to run in read-only mode.

```ruby
ActiveRecord::Base.connected_to(role: :reading, prevent_writes: true) do
  # Rails will check each query to ensure it's a read query.
end
```

## Horizontal Sharding

Horizontal sharding is when you split up your database to reduce the number of rows on each
database server, but maintain the same schema across "shards". This is commonly called "multi-tenant"
sharding.

The API for supporting horizontal sharding in Rails is similar to the multiple database / vertical
sharding API that's existed since Rails 6.0.

Shards are declared in the three-tier config like this:

```yaml
production:
  primary:
    database: my_primary_database
    adapter: mysql2
  primary_replica:
    database: my_primary_database
    adapter: mysql2
    replica: true
  primary_shard_one:
    database: my_primary_shard_one
    adapter: mysql2
    migrations_paths: db/migrate_shards
  primary_shard_one_replica:
    database: my_primary_shard_one
    adapter: mysql2
    replica: true
  primary_shard_two:
    database: my_primary_shard_two
    adapter: mysql2
    migrations_paths: db/migrate_shards
  primary_shard_two_replica:
    database: my_primary_shard_two
    adapter: mysql2
    replica: true
```

Models are then connected with the `connects_to` API via the `shards` key:

```ruby
class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  connects_to database: { writing: :primary, reading: :primary_replica }
end

class ShardRecord < ApplicationRecord
  self.abstract_class = true

  connects_to shards: {
    shard_one: { writing: :primary_shard_one, reading: :primary_shard_one_replica },
    shard_two: { writing: :primary_shard_two, reading: :primary_shard_two_replica }
  }
end

class Person < ShardRecord
end
```

If you're using shards, make sure both `migrations_paths` and `schema_dump` remain unchanged for
all the shards. When generating a migration you can pass the `--database` option and
use one of the shard names. Since they all set the same path, it doesn't matter which
one you choose.

```
$ bin/rails g scaffold Dog name:string --database primary_shard_one
```

Then models can swap shards manually via the `connected_to` API. If
using sharding, both a `role` and a `shard` must be passed:

```ruby
ShardRecord.connected_to(role: :writing, shard: :shard_one) do
  @person = Person.create! # Creates a record in shard shard_one
end

ShardRecord.connected_to(role: :writing, shard: :shard_two) do
  Person.find(@person.id) # Can't find record, doesn't exist because it was created
                   # in the shard named ":shard_one".
end
```

The horizontal sharding API also supports read replicas. You can swap the
role and the shard with the `connected_to` API.

```ruby
ShardRecord.connected_to(role: :reading, shard: :shard_one) do
  Person.first # Lookup record from read replica of shard one.
end
```

## Activating Automatic Shard Switching

Applications are able to automatically switch shards per request using the `ShardSelector`
middleware, which allows an application to provide custom logic for determining the appropriate
shard for each request.

The same generator used for the database selector above can be used to generate an initializer file
for automatic shard swapping:

```bash
$ bin/rails g active_record:multi_db
```

Then in the generated `config/initializers/multi_db.rb` uncomment and modify the following code:

```ruby
Rails.application.configure do
  config.active_record.shard_selector = { lock: true }
  config.active_record.shard_resolver = ->(request) { Tenant.find_by!(host: request.host).shard }
end
```

Applications must provide a resolver to provide application-specific logic. An example resolver that
uses a subdomain to determine the shard might look like this:

```ruby
config.active_record.shard_resolver = ->(request) {
  subdomain = request.subdomain
  tenant = Tenant.find_by_subdomain!(subdomain)
  tenant.shard
}
```

The behavior of `ShardSelector` can be altered through some configuration options.

`lock` is true by default and will prohibit the request from switching shards during the request. If
`lock` is false, then shard swapping will be allowed. For tenant-based sharding, `lock` should
always be true to prevent application code from mistakenly switching between tenants.

`class_name` is the name of the abstract connection class to switch. By default, the `ShardSelector`
will use `ActiveRecord::Base`, but if the application has multiple databases, then this option
should be set to the name of the sharded database's abstract connection class.

Options may be set in the application configuration. For example, this configuration tells
`ShardSelector` to switch shards using `AnimalsRecord.connected_to`:


``` ruby
config.active_record.shard_selector = { lock: true, class_name: "AnimalsRecord" }
```


## Granular Database Connection Switching

Starting from Rails 6.1, it's possible to switch connections for one database
instead of all databases globally.

With granular database connection switching, any abstract connection class
will be able to switch connections without affecting other connections. This
is useful for switching your `AnimalsRecord` queries to read from the replica
while ensuring your `ApplicationRecord` queries go to the primary.

```ruby
AnimalsRecord.connected_to(role: :reading) do
  Dog.first # Reads from animals_replica.
  Person.first  # Reads from primary.
end
```

It's also possible to swap connections granularly for shards.

```ruby
AnimalsRecord.connected_to(role: :reading, shard: :shard_one) do
  # Will read from shard_one_replica. If no connection exists for shard_one_replica,
  # a ConnectionNotEstablished error will be raised.
  Dog.first

  # Will read from primary writer.
  Person.first
end
```

To switch only the primary database cluster use `ApplicationRecord`:

```ruby
ApplicationRecord.connected_to(role: :reading, shard: :shard_one) do
  Person.first # Reads from primary_shard_one_replica.
  Dog.first # Reads from animals_primary.
end
```

`ActiveRecord::Base.connected_to` maintains the ability to switch
connections globally.

### Handling Associations with Joins across Databases

As of Rails 7.0+, Active Record has an option for handling associations that would perform
a join across multiple databases. If you have a has many through or a has one through association
that you want to disable joining and perform 2 or more queries, pass the `disable_joins: true` option.

For example:

```ruby
class Dog < AnimalsRecord
  has_many :treats, through: :humans, disable_joins: true
  has_many :humans

  has_one :home
  has_one :yard, through: :home, disable_joins: true
end

class Home
  belongs_to :dog
  has_one :yard
end

class Yard
  belongs_to :home
end
```

Previously calling `@dog.treats` without `disable_joins` or `@dog.yard` without `disable_joins`
would raise an error because databases are unable to handle joins across clusters. With the
`disable_joins` option, Rails will generate multiple select queries
to avoid attempting joining across clusters. For the above association, `@dog.treats` would generate the
following SQL:

```sql
SELECT "humans"."id" FROM "humans" WHERE "humans"."dog_id" = ?  [["dog_id", 1]]
SELECT "treats".* FROM "treats" WHERE "treats"."human_id" IN (?, ?, ?)  [["human_id", 1], ["human_id", 2], ["human_id", 3]]
```

While `@dog.yard` would generate the following SQL:

```sql
SELECT "home"."id" FROM "homes" WHERE "homes"."dog_id" = ? [["dog_id", 1]]
SELECT "yards".* FROM "yards" WHERE "yards"."home_id" = ? [["home_id", 1]]
```

There are some important things to be aware of with this option:

1. There may be performance implications since now two or more queries will be performed (depending
   on the association) rather than a join. If the select for `humans` returned a high number of IDs
   the select for `treats` may send too many IDs.
2. Since we are no longer performing joins, a query with an order or limit is now sorted in-memory since
   order from one table cannot be applied to another table.
3. This setting must be added to all associations where you want joining to be disabled.
   Rails can't guess this for you because association loading is lazy, to load `treats` in `@dog.treats`
   Rails already needs to know what SQL should be generated.

### Schema Caching

If you want to load a schema cache for each database you must set
`schema_cache_path` in each database configuration and set
`config.active_record.lazily_load_schema_cache = true` in your application
configuration. Note that this will lazily load the cache when the database
connections are established.

## Caveats

### Load Balancing Replicas

Rails doesn't support automatic load balancing of replicas. This is very
dependent on your infrastructure. We may implement basic, primitive load
balancing in the future, but for an application at scale this should be
something your application handles outside of Rails.
