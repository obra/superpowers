**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Record and PostgreSQL
============================

This guide covers PostgreSQL specific usage of Active Record.

After reading this guide, you will know:

* How to use PostgreSQL's datatypes.
* How to use UUID primary keys.
* How to include non-key columns in indexes.
* How to use deferrable foreign keys.
* How to use unique constraints.
* How to implement exclusion constraints.
* How to implement full text search with PostgreSQL.
* How to back your Active Record models with database views.

--------------------------------------------------------------------------------

In order to use the PostgreSQL adapter you need to have at least version 9.3
installed. Older versions are not supported.

To get started with PostgreSQL have a look at the
[configuring Rails guide](configuring.html#configuring-a-postgresql-database).
It describes how to properly set up Active Record for PostgreSQL.

Datatypes
---------

PostgreSQL offers a number of specific datatypes. Following is a list of types,
that are supported by the PostgreSQL adapter.

### Bytea

* [type definition](https://www.postgresql.org/docs/current/static/datatype-binary.html)
* [functions and operators](https://www.postgresql.org/docs/current/static/functions-binarystring.html)

```ruby
# db/migrate/20140207133952_create_documents.rb
create_table :documents do |t|
  t.binary "payload"
end
```

```ruby
# app/models/document.rb
class Document < ApplicationRecord
end
```

```ruby
# Usage
data = File.read(Rails.root + "tmp/output.pdf")
Document.create payload: data
```

### Array

* [type definition](https://www.postgresql.org/docs/current/static/arrays.html)
* [functions and operators](https://www.postgresql.org/docs/current/static/functions-array.html)

```ruby
# db/migrate/20140207133952_create_books.rb
create_table :books do |t|
  t.string "title"
  t.string "tags", array: true
  t.integer "ratings", array: true
end
add_index :books, :tags, using: "gin"
add_index :books, :ratings, using: "gin"
```

```ruby
# app/models/book.rb
class Book < ApplicationRecord
end
```

```ruby
# Usage
Book.create title: "Brave New World",
            tags: ["fantasy", "fiction"],
            ratings: [4, 5]

## Books for a single tag
Book.where("'fantasy' = ANY (tags)")

## Books for multiple tags
Book.where("tags @> ARRAY[?]::varchar[]", ["fantasy", "fiction"])

## Books with 3 or more ratings
Book.where("array_length(ratings, 1) >= 3")
```

### Hstore

* [type definition](https://www.postgresql.org/docs/current/static/hstore.html)
* [functions and operators](https://www.postgresql.org/docs/current/static/hstore.html#id-1.11.7.26.5)

NOTE: You need to enable the `hstore` extension to use hstore.

```ruby
# db/migrate/20131009135255_create_profiles.rb
class CreateProfiles < ActiveRecord::Migration[8.2]
  enable_extension "hstore" unless extension_enabled?("hstore")
  create_table :profiles do |t|
    t.hstore "settings"
  end
end
```

```ruby
# app/models/profile.rb
class Profile < ApplicationRecord
end
```

```irb
irb> Profile.create(settings: { "color" => "blue", "resolution" => "800x600" })

irb> profile = Profile.first
irb> profile.settings
=> {"color"=>"blue", "resolution"=>"800x600"}

irb> profile.settings = {"color" => "yellow", "resolution" => "1280x1024"}
irb> profile.save!

irb> Profile.where("settings->'color' = ?", "yellow")
=> #<ActiveRecord::Relation [#<Profile id: 1, settings: {"color"=>"yellow", "resolution"=>"1280x1024"}>]>
```

### JSON and JSONB

* [type definition](https://www.postgresql.org/docs/current/static/datatype-json.html)
* [functions and operators](https://www.postgresql.org/docs/current/static/functions-json.html)

```ruby
# db/migrate/20131220144913_create_events.rb
# ... for json datatype:
create_table :events do |t|
  t.json "payload"
end
# ... or for jsonb datatype:
create_table :events do |t|
  t.jsonb "payload"
end
```

```ruby
# app/models/event.rb
class Event < ApplicationRecord
end
```

```irb
irb> Event.create(payload: { kind: "user_renamed", change: ["jack", "john"]})

irb> event = Event.first
irb> event.payload
=> {"kind"=>"user_renamed", "change"=>["jack", "john"]}

## Query based on JSON document
# The -> operator returns the original JSON type (which might be an object), whereas ->> returns text
irb> Event.where("payload->>'kind' = ?", "user_renamed")
```

### Range Types

* [type definition](https://www.postgresql.org/docs/current/static/rangetypes.html)
* [functions and operators](https://www.postgresql.org/docs/current/static/functions-range.html)

This type is mapped to Ruby [`Range`](https://docs.ruby-lang.org/en/master/Range.html) objects.

```ruby
# db/migrate/20130923065404_create_events.rb
create_table :events do |t|
  t.daterange "duration"
end
```

```ruby
# app/models/event.rb
class Event < ApplicationRecord
end
```

```irb
irb> Event.create(duration: Date.new(2014, 2, 11)..Date.new(2014, 2, 12))

irb> event = Event.first
irb> event.duration
=> Tue, 11 Feb 2014...Thu, 13 Feb 2014

## All Events on a given date
irb> Event.where("duration @> ?::date", Date.new(2014, 2, 12))

## Working with range bounds
irb> event = Event.select("lower(duration) AS starts_at").select("upper(duration) AS ends_at").first

irb> event.starts_at
=> Tue, 11 Feb 2014
irb> event.ends_at
=> Thu, 13 Feb 2014
```

### Composite Types

* [type definition](https://www.postgresql.org/docs/current/static/rowtypes.html)

Currently there is no special support for composite types. They are mapped to
normal text columns:

```sql
CREATE TYPE full_address AS
(
  city VARCHAR(90),
  street VARCHAR(90)
);
```

```ruby
# db/migrate/20140207133952_create_contacts.rb
execute <<-SQL
  CREATE TYPE full_address AS
  (
    city VARCHAR(90),
    street VARCHAR(90)
  );
SQL
create_table :contacts do |t|
  t.column :address, :full_address
end
```

```ruby
# app/models/contact.rb
class Contact < ApplicationRecord
end
```

```irb
irb> Contact.create address: "(Paris,Champs-Élysées)"
irb> contact = Contact.first
irb> contact.address
=> "(Paris,Champs-Élysées)"
irb> contact.address = "(Paris,Rue Basse)"
irb> contact.save!
```

### Enumerated Types

* [type definition](https://www.postgresql.org/docs/current/static/datatype-enum.html)

The type can be mapped as a normal text column, or to an [`ActiveRecord::Enum`](https://api.rubyonrails.org/classes/ActiveRecord/Enum.html).

```ruby
# db/migrate/20131220144913_create_articles.rb
def change
  create_enum :article_status, ["draft", "published", "archived"]

  create_table :articles do |t|
    t.enum :status, enum_type: :article_status, default: "draft", null: false
  end
end
```

You can also create an enum type and add an enum column to an existing table:

```ruby
# db/migrate/20230113024409_add_status_to_articles.rb
def change
  create_enum :article_status, ["draft", "published", "archived"]

  add_column :articles, :status, :enum, enum_type: :article_status, default: "draft", null: false
end
```

The above migrations are both reversible, but you can define separate `#up` and `#down` methods if required. Make sure you remove any columns or tables that depend on the enum type before dropping it:

```ruby
def down
  drop_table :articles

  # OR: remove_column :articles, :status
  drop_enum :article_status
end
```

Declaring an enum attribute in the model adds helper methods and prevents invalid values from being assigned to instances of the class:

```ruby
# app/models/article.rb
class Article < ApplicationRecord
  enum :status, {
    draft: "draft", published: "published", archived: "archived"
  }, prefix: true
end
```

```irb
irb> article = Article.create
irb> article.status
=> "draft" # default status from PostgreSQL, as defined in migration above

irb> article.status_published!
irb> article.status
=> "published"

irb> article.status_archived?
=> false

irb> article.status = "deleted"
ArgumentError: 'deleted' is not a valid status
```

To rename the enum you can use `rename_enum` along with updating any model
usage:

```ruby
# db/migrate/20150718144917_rename_article_status.rb
def change
  rename_enum :article_status, :article_state
end
```

To add a new value you can use `add_enum_value`:

```ruby
# db/migrate/20150720144913_add_new_state_to_articles.rb
def up
  add_enum_value :article_state, "archived" # will be at the end after published
  add_enum_value :article_state, "in review", before: "published"
  add_enum_value :article_state, "approved", after: "in review"
  add_enum_value :article_state, "rejected", if_not_exists: true # won't raise an error if the value already exists
end
```

NOTE: Enum values can't be dropped, which also means add_enum_value is irreversible. You can read why [here](https://www.postgresql.org/message-id/29F36C7C98AB09499B1A209D48EAA615B7653DBC8A@mail2a.alliedtesting.com).

To rename a value you can use `rename_enum_value`:

```ruby
# db/migrate/20150722144915_rename_article_state.rb
def change
  rename_enum_value :article_state, from: "archived", to: "deleted"
end
```

Hint: to show all the values of the all enums you have, you can call this query in `bin/rails db` or `psql` console:

```sql
SELECT n.nspname AS enum_schema,
       t.typname AS enum_name,
       e.enumlabel AS enum_value
  FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
```

### UUID

* [type definition](https://www.postgresql.org/docs/current/static/datatype-uuid.html)
* [pgcrypto generator function](https://www.postgresql.org/docs/current/static/pgcrypto.html)
* [uuid-ossp generator functions](https://www.postgresql.org/docs/current/static/uuid-ossp.html)

NOTE: If you're using PostgreSQL earlier than version 13.0 you may need to enable special extensions to use UUIDs. Enable the `pgcrypto` extension (PostgreSQL >= 9.4) or `uuid-ossp` extension (for even earlier releases).

```ruby
# db/migrate/20131220144913_create_revisions.rb
create_table :revisions do |t|
  t.uuid :identifier
end
```

```ruby
# app/models/revision.rb
class Revision < ApplicationRecord
end
```

```irb
irb> Revision.create identifier: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"

irb> revision = Revision.first
irb> revision.identifier
=> "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
```

You can use `uuid` type to define references in migrations:

```ruby
# db/migrate/20150418012400_create_blog.rb
enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")
create_table :posts, id: :uuid

create_table :comments, id: :uuid do |t|
  # t.belongs_to :post, type: :uuid
  t.references :post, type: :uuid
end
```

```ruby
# app/models/post.rb
class Post < ApplicationRecord
  has_many :comments
end
```

```ruby
# app/models/comment.rb
class Comment < ApplicationRecord
  belongs_to :post
end
```

See [this section](#uuid-primary-keys) for more details on using UUIDs as primary key.

### Bit String Types

* [type definition](https://www.postgresql.org/docs/current/static/datatype-bit.html)
* [functions and operators](https://www.postgresql.org/docs/current/static/functions-bitstring.html)

```ruby
# db/migrate/20131220144913_create_users.rb
create_table :users, force: true do |t|
  t.column :settings, "bit(8)"
end
```

```ruby
# app/models/user.rb
class User < ApplicationRecord
end
```

```irb
irb> User.create settings: "01010011"
irb> user = User.first
irb> user.settings
=> "01010011"
irb> user.settings = "0xAF"
irb> user.settings
=> "10101111"
irb> user.save!
```

### Network Address Types

* [type definition](https://www.postgresql.org/docs/current/static/datatype-net-types.html)

The types `inet` and `cidr` are mapped to Ruby
[`IPAddr`](https://docs.ruby-lang.org/en/master/IPAddr.html)
objects. The `macaddr` type is mapped to normal text.

```ruby
# db/migrate/20140508144913_create_devices.rb
create_table(:devices, force: true) do |t|
  t.inet "ip"
  t.cidr "network"
  t.macaddr "address"
end
```

```ruby
# app/models/device.rb
class Device < ApplicationRecord
end
```

```irb
irb> macbook = Device.create(ip: "192.168.1.12", network: "192.168.2.0/24", address: "32:01:16:6d:05:ef")

irb> macbook.ip
=> #<IPAddr: IPv4:192.168.1.12/255.255.255.255>

irb> macbook.network
=> #<IPAddr: IPv4:192.168.2.0/255.255.255.0>

irb> macbook.address
=> "32:01:16:6d:05:ef"
```

### Geometric Types

* [type definition](https://www.postgresql.org/docs/current/static/datatype-geometric.html)

All geometric types, with the exception of `points` are mapped to normal text.
A point is cast to an array containing `x` and `y` coordinates.

### Interval

* [type definition](https://www.postgresql.org/docs/current/static/datatype-datetime.html#DATATYPE-INTERVAL-INPUT)
* [functions and operators](https://www.postgresql.org/docs/current/static/functions-datetime.html)

This type is mapped to [`ActiveSupport::Duration`](https://api.rubyonrails.org/classes/ActiveSupport/Duration.html) objects.

```ruby
# db/migrate/20200120000000_create_events.rb
create_table :events do |t|
  t.interval "duration"
end
```

```ruby
# app/models/event.rb
class Event < ApplicationRecord
end
```

```irb
irb> Event.create(duration: 2.days)

irb> event = Event.first
irb> event.duration
=> 2 days
```

### Timestamps

* [Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)

Rails migrations with timestamps store the time a model was created or updated. By default and for legacy reasons, the columns use the `timestamp without time zone` data type.

```ruby
# db/migrate/20241220144913_create_devices.rb
create_table :posts, id: :uuid do |t|
  t.datetime :published_at
  # By default, Active Record will set the data type of this column to `timestamp without time zone`.
end
```

While this works ok, [PostgreSQL best practices](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29) recommend that `timestamp with time zone` is used instead for timezone-aware timestamps.
This must be configured before it can be used for new migrations.

To configure `timestamp with time zone` as your new timestamp default data type, place the following configuration in the `config/application.rb` file.

```ruby
# config/application.rb
ActiveSupport.on_load(:active_record_postgresqladapter) do
  self.datetime_type = :timestamptz
end
```

With that configuration in place, generate and apply new migrations, then verify their timestamps use the `timestamp with time zone` data type.

UUID Primary Keys
-----------------

NOTE: You need to enable the `pgcrypto` (only PostgreSQL >= 9.4) or `uuid-ossp`
extension to generate random UUIDs.

```ruby
# db/migrate/20131220144913_create_devices.rb
enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")
create_table :devices, id: :uuid do |t|
  t.string :kind
end
```

```ruby
# app/models/device.rb
class Device < ApplicationRecord
end
```

```irb
irb> device = Device.create
irb> device.id
=> "814865cd-5a1d-4771-9306-4268f188fe9e"
```

NOTE: `gen_random_uuid()` (from `pgcrypto`) is assumed if no `:default` option
was passed to `create_table`.

To use the Rails model generator for a table using UUID as the primary key, pass
`--primary-key-type=uuid` to the model generator.

For example:

```bash
$ bin/rails generate model Device --primary-key-type=uuid kind:string
```

When building a model with a foreign key that will reference this UUID, treat
`uuid` as the native field type, for example:

```bash
$ bin/rails generate model Case device_id:uuid
```

Indexing
--------

* [index creation](https://www.postgresql.org/docs/current/sql-createindex.html)

PostgreSQL includes a variety of index options. The following options are
supported by the PostgreSQL adapter in addition to the
[common index options](https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_index)

### Include

When creating a new index, non-key columns can be included with the `:include` option.
These keys are not used in index scans for searching, but can be read during an index
only scan without having to visit the associated table.

```ruby
# db/migrate/20131220144913_add_index_users_on_email_include_id.rb

add_index :users, :email, include: :id
```

Multiple columns are supported:

```ruby
# db/migrate/20131220144913_add_index_users_on_email_include_id_and_created_at.rb

add_index :users, :email, include: [:id, :created_at]
```

Generated Columns
-----------------

NOTE: Generated columns are supported since version 12.0 of PostgreSQL.

```ruby
# db/migrate/20131220144913_create_users.rb
create_table :users do |t|
  t.string :name
  t.virtual :name_upcased, type: :string, as: "upper(name)", stored: true
end

# app/models/user.rb
class User < ApplicationRecord
end

# Usage
user = User.create(name: "John")
User.last.name_upcased # => "JOHN"
```

Deferrable Foreign Keys
-----------------------

* [foreign key table constraints](https://www.postgresql.org/docs/current/sql-set-constraints.html)

By default, table constraints in PostgreSQL are checked immediately after each statement. It intentionally does not allow creating records where the referenced record is not yet in the referenced table. It is possible to run this integrity check later on when the transaction is committed by adding `DEFERRABLE` to the foreign key definition though. To defer all checks by default it can be set to `DEFERRABLE INITIALLY DEFERRED`. Rails exposes this PostgreSQL feature by adding the `:deferrable` key to the `foreign_key` options in the `add_reference` and `add_foreign_key` methods.

One example of this is creating circular dependencies in a transaction even if you have created foreign keys:

```ruby
add_reference :person, :alias, foreign_key: { deferrable: :deferred }
add_reference :alias, :person, foreign_key: { deferrable: :deferred }
```

If the reference was created with the `foreign_key: true` option, the following transaction would fail when executing the first `INSERT` statement. It does not fail when the `deferrable: :deferred` option is set though.

```ruby
ActiveRecord::Base.lease_connection.transaction do
  person = Person.create(id: SecureRandom.uuid, alias_id: SecureRandom.uuid, name: "John Doe")
  Alias.create(id: person.alias_id, person_id: person.id, name: "jaydee")
end
```

When the `:deferrable` option is set to `:immediate`, let the foreign keys keep the default behavior of checking the constraint immediately, but allow manually deferring the checks using `set_constraints` within a transaction. This will cause the foreign keys to be checked when the transaction is committed:

```ruby
ActiveRecord::Base.lease_connection.transaction do
  ActiveRecord::Base.lease_connection.set_constraints(:deferred)
  person = Person.create(alias_id: SecureRandom.uuid, name: "John Doe")
  Alias.create(id: person.alias_id, person_id: person.id, name: "jaydee")
end
```

By default `:deferrable` is `false` and the constraint is always checked immediately.

Unique Constraint
-----------------

* [unique constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)

```ruby
# db/migrate/20230422225213_create_items.rb
create_table :items do |t|
  t.integer :position, null: false
  t.unique_constraint [:position], deferrable: :immediate
end
```

If you want to change an existing unique index to deferrable, you can use `:using_index` to create deferrable unique constraints.

```ruby
add_unique_constraint :items, deferrable: :deferred, using_index: "index_items_on_position"
```

Like foreign keys, unique constraints can be deferred by setting `:deferrable` to either `:immediate` or `:deferred`. By default, `:deferrable` is `false` and the constraint is always checked immediately.

Exclusion Constraints
---------------------

* [exclusion constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)

```ruby
# db/migrate/20131220144913_create_products.rb
create_table :products do |t|
  t.integer :price, null: false
  t.daterange :availability_range, null: false

  t.exclusion_constraint "price WITH =, availability_range WITH &&", using: :gist, name: "price_check"
end
```

Like foreign keys, exclusion constraints can be deferred by setting `:deferrable` to either `:immediate` or `:deferred`. By default, `:deferrable` is `false` and the constraint is always checked immediately.

Full Text Search
----------------

```ruby
# db/migrate/20131220144913_create_documents.rb
create_table :documents do |t|
  t.string :title
  t.string :body
end

add_index :documents, "to_tsvector('english', title || ' ' || body)", using: :gin, name: "documents_idx"
```

```ruby
# app/models/document.rb
class Document < ApplicationRecord
end
```

```ruby
# Usage
Document.create(title: "Cats and Dogs", body: "are nice!")

## all documents matching 'cat & dog'
Document.where("to_tsvector('english', title || ' ' || body) @@ to_tsquery(?)",
                 "cat & dog")
```

Optionally, you can store the vector as automatically generated column (from PostgreSQL 12.0):

```ruby
# db/migrate/20131220144913_create_documents.rb
create_table :documents do |t|
  t.string :title
  t.string :body

  t.virtual :textsearchable_index_col,
            type: :tsvector, as: "to_tsvector('english', title || ' ' || body)", stored: true
end

add_index :documents, :textsearchable_index_col, using: :gin, name: "documents_idx"

# Usage
Document.create(title: "Cats and Dogs", body: "are nice!")

## all documents matching 'cat & dog'
Document.where("textsearchable_index_col @@ to_tsquery(?)", "cat & dog")
```

Database Views
--------------

* [view creation](https://www.postgresql.org/docs/current/static/sql-createview.html)

Imagine you need to work with a legacy database containing the following table:

```
rails_pg_guide=# \d "TBL_ART"
                                        Table "public.TBL_ART"
   Column   |            Type             |                         Modifiers
------------+-----------------------------+------------------------------------------------------------
 INT_ID     | integer                     | not null default nextval('"TBL_ART_INT_ID_seq"'::regclass)
 STR_TITLE  | character varying           |
 STR_STAT   | character varying           | default 'draft'::character varying
 DT_PUBL_AT | timestamp without time zone |
 BL_ARCH    | boolean                     | default false
Indexes:
    "TBL_ART_pkey" PRIMARY KEY, btree ("INT_ID")
```

This table does not follow the Rails conventions at all.
Because simple PostgreSQL views are updateable by default,
we can wrap it as follows:

```ruby
# db/migrate/20131220144913_create_articles_view.rb
execute <<-SQL
CREATE VIEW articles AS
  SELECT "INT_ID" AS id,
         "STR_TITLE" AS title,
         "STR_STAT" AS status,
         "DT_PUBL_AT" AS published_at,
         "BL_ARCH" AS archived
  FROM "TBL_ART"
  WHERE "BL_ARCH" = 'f'
SQL
```

```ruby
# app/models/article.rb
class Article < ApplicationRecord
  self.primary_key = "id"
  def archive!
    update_attribute :archived, true
  end
end
```

```irb
irb> first = Article.create! title: "Winter is coming", status: "published", published_at: 1.year.ago
irb> second = Article.create! title: "Brace yourself", status: "draft", published_at: 1.month.ago

irb> Article.count
=> 2
irb> first.archive!
irb> Article.count
=> 1
```

NOTE: This application only cares about non-archived `Articles`. A view also
allows for conditions so we can exclude the archived `Articles` directly.

Structure Dumps
--------------

If your `config.active_record.schema_format` is `:sql`, Rails will call `pg_dump` to generate a
structure dump.

You can use `ActiveRecord::Tasks::DatabaseTasks.structure_dump_flags` to configure `pg_dump`.
For example, to exclude comments from your structure dump, add this to an initializer:

```ruby
ActiveRecord::Tasks::DatabaseTasks.structure_dump_flags = ["--no-comments"]
```

Explain
-------

Along with the standard [`explain`][explain-options] options, the PostgreSQL adapter supports [`buffers`][explain-analyze-buffers].

```ruby
Company.where(id: owning_companies_ids).explain(:analyze, :buffers)
#=> EXPLAIN (ANALYZE, BUFFERS) SELECT "companies".* FROM "companies"
# ...
# Seq Scan on companies  (cost=0.00..2.21 rows=3 width=64)
# ...
```

See their documentation for more details.

[explain-options]: active_record_querying.html#explain-options
[explain-analyze-buffers]: https://www.postgresql.org/docs/current/sql-explain.html
