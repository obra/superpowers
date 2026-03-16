**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Record Migrations
========================

Migrations are a feature of Active Record that allows you to evolve your
database schema over time. Rather than write schema modifications in pure SQL,
migrations allow you to use a Ruby Domain Specific Language (DSL) to describe
changes to your tables.

After reading this guide, you will know:

* Which generators you can use to create migrations.
* Which methods Active Record provides to manipulate your database.
* How to change existing migrations and update your schema.
* How migrations relate to `schema.rb`.
* How to maintain referential integrity.
* How to customize migration behavior with swappable strategies.

--------------------------------------------------------------------------------

Migration Overview
------------------

Migrations are a convenient way to [evolve your database schema over
time](https://en.wikipedia.org/wiki/Schema_migration) in a reproducible way.
They use a Ruby [DSL](https://en.wikipedia.org/wiki/Domain-specific_language) so
that you don't have to write [SQL](https://en.wikipedia.org/wiki/SQL) by hand,
allowing your schema and changes to be database independent. We recommend that
you read the guides for [Active Record Basics](active_record_basics.html) and
the [Active Record Associations](association_basics.html) to learn more about
some of the concepts mentioned here.

You can think of each migration as being a new 'version' of the database. A
schema starts off with nothing in it, and each migration modifies it to add or
remove tables, columns, or indexes. Active Record knows how to update your
schema along this timeline, bringing it from whatever point it is in the history
to the latest version. Read more about [how Rails knows which migration in the
timeline to run](#rails-migration-version-control).

Active Record updates your `db/schema.rb` file to match the up-to-date structure
of your database. Here's an example of a migration:

```ruby
# db/migrate/20240502100843_create_products.rb
class CreateProducts < ActiveRecord::Migration[8.2]
  def change
    create_table :products do |t|
      t.string :name
      t.text :description

      t.timestamps
    end
  end
end
```

This migration adds a table called `products` with a string column called `name`
and a text column called `description`. A primary key column called `id` will
also be added implicitly, as it's the default primary key for all Active Record
models. The `timestamps` macro adds two columns, `created_at` and `updated_at`.
These special columns are automatically managed by Active Record if they exist.

```ruby
# db/schema.rb
ActiveRecord::Schema[8.2].define(version: 2024_05_02_100843) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "products", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end
end
```

We define the change that we want to happen moving forward in time. Before this
migration is run, there will be no table. After it is run, the table will exist.
Active Record knows how to reverse this migration as well; if we roll this
migration back, it will remove the table. Read more about rolling back
migrations in the [Rolling Back section](#rolling-back).

After defining the change that we want to occur moving forward in time, it's
essential to consider the reversibility of the migration. While Active Record
can manage the forward progression of the migration, ensuring the creation of
the table, the concept of reversibility becomes crucial. With reversible
migrations, not only does the migration create the table when applied, but it
also enables smooth rollback functionality. In case of reverting the migration
above, Active Record intelligently handles the removal of the table, maintaining
database consistency throughout the process. See the [Reversing
Migrations section](#using-reversible) for more details.

Generating Migration Files
----------------------

### Creating a Standalone Migration

Migrations are stored as files in the `db/migrate` directory, one for each
migration class.

The name of the file is of the form `YYYYMMDDHHMMSS_create_products.rb`, it
contains a UTC timestamp identifying the migration followed by an underscore
followed by the name of the migration. The name of the migration class
(CamelCased version) should match the latter part of the file name.

For example, `20240502100843_create_products.rb` should define class
`CreateProducts` and `20240502101659_add_details_to_products.rb` should define
class `AddDetailsToProducts`. Rails uses this timestamp to determine which
migration should be run and in what order, so if you're copying a migration from
another application or generating a file yourself, be aware of its position in
the order. You can read more about how the timestamps are used in the [Rails
Migration Version Control section](#rails-migration-version-control).

NOTE: You can override the directory that migrations are stored in by setting the
`migrations_paths` option in your `config/database.yml`.

When generating a migration, Active Record automatically prepends the current
timestamp to the file name of the migration. For example, running the command
below will create an empty migration file whereby the filename is made up of a
timestamp prepended to the underscored name of the migration.

```bash
$ bin/rails generate migration AddPartNumberToProducts
```

```ruby
# db/migrate/20240502101659_add_part_number_to_products.rb
class AddPartNumberToProducts < ActiveRecord::Migration[8.2]
  def change
  end
end
```

The generator can do much more than prepend a timestamp to the file name. Based
on naming conventions and additional (optional) arguments it can also start
fleshing out the migration.

The following sections will cover the various ways you can create migrations
based on conventions and additional arguments.

### Creating a New Table

When you want to create a new table in your database, you can use a migration
with the format "CreateXXX" followed by a list of column names and types. This
will generate a migration file that sets up the table with the specified
columns.

```bash
$ bin/rails generate migration CreateProducts name:string part_number:string
```

generates

```ruby
class CreateProducts < ActiveRecord::Migration[8.2]
  def change
    create_table :products do |t|
      t.string :name
      t.string :part_number

      t.timestamps
    end
  end
end
```

NOTE: If you don't specify a type for a field (e.g., `name` instead of `name:string`), Rails will default to type `string`.

The generated file with its contents is just a starting point, and you can add
or remove from it as you see fit by editing the
`db/migrate/YYYYMMDDHHMMSS_create_products.rb` file.

### Adding Columns

When you want to add a new column to an existing table in your database, you can
use a migration with the format "AddColumnToTable" followed by a list of column
names and types. This will generate a migration file containing the appropriate
[`add_column`][] statements.

```bash
$ bin/rails generate migration AddPartNumberToProducts part_number:string
```

This will generate the following migration:

```ruby
class AddPartNumberToProducts < ActiveRecord::Migration[8.2]
  def change
    add_column :products, :part_number, :string
  end
end
```

NOTE: Rails infers the target table from the migration name when it matches the
`add_<columns>_to_<table>` or `remove_<columns>_from_<table>` patterns. Using a
name such as `AddPartNumberToProducts` lets the generator configure
`add_column :products, ...` automatically. For more on these conventions, run
`bin/rails generate migration --help` to see the generator usage and examples.

If you'd like to add an index on the new column, you can do that as well.

```bash
$ bin/rails generate migration AddPartNumberToProducts part_number:string:index
```

This will generate the appropriate [`add_column`][] and [`add_index`][]
statements:

```ruby
class AddPartNumberToProducts < ActiveRecord::Migration[8.2]
  def change
    add_column :products, :part_number, :string
    add_index :products, :part_number
  end
end
```

You are **not** limited to one magically generated column. For example:

```bash
$ bin/rails generate migration AddDetailsToProducts part_number:string price:decimal
```

This will generate a schema migration which adds two additional columns to the
`products` table.

```ruby
class AddDetailsToProducts < ActiveRecord::Migration[8.2]
  def change
    add_column :products, :part_number, :string
    add_column :products, :price, :decimal
  end
end
```

### Removing Columns

Similarly, if the migration name is of the form "RemoveColumnFromTable" and is
followed by a list of column names and types then a migration containing the
appropriate [`remove_column`][] statements will be created.

```bash
$ bin/rails generate migration RemovePartNumberFromProducts part_number:string
```

This will generate the appropriate [`remove_column`][] statements:

```ruby
class RemovePartNumberFromProducts < ActiveRecord::Migration[8.2]
  def change
    remove_column :products, :part_number, :string
  end
end
```

### Creating Associations

Active Record associations are used to define relationships between different
models in your application, allowing them to interact with each other through
their relationships and making it easier to work with related data. To learn
more about associations, you can refer to the [Association Basics
guide](association_basics.html).

One common use case for associations is creating foreign key references between
tables. The generator accepts column types such as `references` to facilitate
this process. [References](#references) are a shorthand for creating columns,
indexes, foreign keys, or even polymorphic association columns.

For example,

```bash
$ bin/rails generate migration AddUserRefToProducts user:references
```

generates the following [`add_reference`][] call:

```ruby
class AddUserRefToProducts < ActiveRecord::Migration[8.2]
  def change
    add_reference :products, :user, null: false, foreign_key: true
  end
end
```

The above migration creates a foreign key called `user_id` in the `products`
table, where `user_id` is a reference to the `id` column in the `users` table.
It also creates an index for the `user_id` column. The schema looks as follows:

```ruby
  create_table "products", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_products_on_user_id"
  end
```

`belongs_to` is an alias of `references`, so the above could be alternatively
written as:

```bash
$ bin/rails generate migration AddUserRefToProducts user:belongs_to
```

generating a migration and schema that is the same as above.

There is also a generator which will produce join tables if `JoinTable` is part
of the name:

```bash
$ bin/rails generate migration CreateJoinTableUserProduct user product
```

will produce the following migration:

```ruby
class CreateJoinTableUserProduct < ActiveRecord::Migration[8.2]
  def change
    create_join_table :users, :products do |t|
      # t.index [:user_id, :product_id]
      # t.index [:product_id, :user_id]
    end
  end
end
```

[`add_column`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_column
[`add_index`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_index
[`add_reference`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_reference
[`remove_column`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-remove_column

### Other Generators that Create Migrations

In addition to the `migration` generator, the `model`, `resource`, and
`scaffold` generators will create migrations appropriate for adding a new model.
This migration will already contain instructions for creating the relevant
table. If you tell Rails what columns you want, then statements for adding these
columns will also be created. For example, running:

```bash
$ bin/rails generate model Product name:string description:text
```

This will create a migration that looks like this:

```ruby
class CreateProducts < ActiveRecord::Migration[8.2]
  def change
    create_table :products do |t|
      t.string :name
      t.text :description

      t.timestamps
    end
  end
end
```

You can append as many column name/type pairs as you want.

### Passing Modifiers

When generating migrations, you can pass commonly used [type
modifiers](#column-modifiers) directly on the command line. These modifiers,
enclosed by curly braces and following the field type, allow you to tailor the
characteristics of your database columns without needing to manually edit the
migration file afterward.

For instance, running:

```bash
$ bin/rails generate migration AddDetailsToProducts 'price:decimal{5,2}' supplier:references{polymorphic}
```

will produce a migration that looks like this

```ruby
class AddDetailsToProducts < ActiveRecord::Migration[8.2]
  def change
    add_column :products, :price, :decimal, precision: 5, scale: 2
    add_reference :products, :supplier, polymorphic: true
  end
end
```

`NOT NULL` constraints can be imposed from the command line using the `!`
shortcut:

```bash
$ bin/rails generate migration AddEmailToUsers email:string!
```

will produce this migration

```ruby
class AddEmailToUsers < ActiveRecord::Migration[8.2]
  def change
    add_column :users, :email, :string, null: false
  end
end
```

TIP: For further help with generators, run `bin/rails generate --help`.
Alternatively, you can also run `bin/rails generate model --help` or `bin/rails
generate migration --help` for help with specific generators.

Updating Migrations
------------------

Once you have created your migration file using one of the generators from the
above [section](#generating-migration-files), you can update the generated
migration file in the `db/migrate` folder to define further changes you want to
make to your database schema.

### Creating a Table

The [`create_table`][] method is one of the most fundamental migration type, but
most of the time, will be generated for you from using a model, resource, or
scaffold generator. A typical use would be

```ruby
create_table :products do |t|
  t.string :name
end
```

This method creates a `products` table with a column called `name`.


#### Associations

If you're creating a table for a model that has an association, you can use the
`:references` type to create the appropriate column type. For example:

```ruby
create_table :products do |t|
  t.references :category
end
```

This will create a `category_id` column. Alternatively, you can use `belongs_to`
as an alias for `references`:

```ruby
create_table :products do |t|
  t.belongs_to :category
end
```

You can also specify the column type and index creation using the
[`:polymorphic`](association_basics.html#polymorphic-associations) option:

```ruby
create_table :taggings do |t|
  t.references :taggable, polymorphic: true
end
```

This will create `taggable_id`, `taggable_type` columns and the appropriate
indexes.

#### Primary Keys

By default, `create_table` will implicitly create a primary key called `id` for
you. You can change the name of the column with the `:primary_key` option, like
below:

```ruby
class CreateUsers < ActiveRecord::Migration[8.2]
  def change
    create_table :users, primary_key: "user_id" do |t|
      t.string :username
      t.string :email
      t.timestamps
    end
  end
end
```

This will yield the following schema:

```ruby
create_table "users", primary_key: "user_id", force: :cascade do |t|
  t.string "username"
  t.string "email"
  t.datetime "created_at", precision: 6, null: false
  t.datetime "updated_at", precision: 6, null: false
end
```

You can also pass an array to `:primary_key` for a composite primary key. Read
more about [composite primary keys](active_record_composite_primary_keys.html).

```ruby
class CreateUsers < ActiveRecord::Migration[8.2]
  def change
    create_table :users, primary_key: [:id, :name] do |t|
      t.string :name
      t.string :email
      t.timestamps
    end
  end
end
```

If you don't want a primary key at all, you can pass the option `id: false`.

```ruby
class CreateUsers < ActiveRecord::Migration[8.2]
  def change
    create_table :users, id: false do |t|
      t.string :username
      t.string :email
      t.timestamps
    end
  end
end
```

#### Database Options

If you need to pass database-specific options you can place an SQL fragment in
the `:options` option. For example:

```ruby
create_table :products, options: "ENGINE=BLACKHOLE" do |t|
  t.string :name, null: false
end
```

This will append `ENGINE=BLACKHOLE` to the SQL statement used to create the
table.

An index can be created on the columns created within the `create_table` block
by passing `index: true` or an options hash to the `:index` option:

```ruby
create_table :users do |t|
  t.string :name, index: true
  t.string :email, index: { unique: true, name: "unique_emails" }
end
```

[`create_table`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-create_table

#### Comments

You can pass the `:comment` option with any description for the table that will
be stored in the database itself and can be viewed with database administration
tools, such as MySQL Workbench or pgAdmin. Comments can help team members to
better understand the data model and to generate documentation in applications
with large databases. Currently only the MySQL and PostgreSQL adapters support
comments.

```ruby
class AddDetailsToProducts < ActiveRecord::Migration[8.2]
  def change
    add_column :products, :price, :decimal, precision: 8, scale: 2, comment: "The price of the product in USD"
    add_column :products, :stock_quantity, :integer, comment: "The current stock quantity of the product"
  end
end
```

### Creating a Join Table

The migration method [`create_join_table`][] creates an [HABTM (has and belongs
to many)](association_basics.html#the-has-and-belongs-to-many-association) join
table. A typical use would be:

```ruby
create_join_table :products, :categories
```

This migration will create a `categories_products` table with two columns called
`category_id` and `product_id`.

These columns have the option `:null` set to `false` by default, meaning that
you **must** provide a value in order to save a record to this table. This can
be overridden by specifying the `:column_options` option:

```ruby
create_join_table :products, :categories, column_options: { null: true }
```

By default, the name of the join table comes from the union of the first two
arguments provided to create_join_table, in lexical order. In this case,
the table would be named `categories_products`.

WARNING: The precedence between model names is calculated using the `<=>`
operator for `String`. This means that if the strings are of different lengths,
and the strings are equal when compared up to the shortest length, then the
longer string is considered of higher lexical precedence than the shorter one.
For example, one would expect the tables "paper_boxes" and "papers" to generate
a join table name of "papers_paper_boxes" because of the length of the name
"paper_boxes", but it in fact generates a join table name of
"paper_boxes_papers" (because the underscore '\_' is lexicographically _less_
than 's' in common encodings).

To customize the name of the table, provide a `:table_name` option:

```ruby
create_join_table :products, :categories, table_name: :categorization
```

This creates a join table with the name `categorization`.

Also, `create_join_table` accepts a block, which you can use to add indices
(which are not created by default) or any additional columns you so choose.

```ruby
create_join_table :products, :categories do |t|
  t.index :product_id
  t.index :category_id
end
```

[`create_join_table`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-create_join_table

### Changing Tables

If you want to change an existing table in place, there is [`change_table`][].

It is used in a similar fashion to `create_table` but the object yielded inside
the block has access to a number of special functions, for example:

```ruby
change_table :products do |t|
  t.remove :description, :name
  t.string :part_number
  t.index :part_number
  t.rename :upccode, :upc_code
end
```

This migration will remove the `description` and `name` columns, create a new
string column called `part_number` and add an index on it. Finally, it renames
the `upccode` column to `upc_code`.

[`change_table`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-change_table

### Changing Columns

Similar to the `remove_column` and `add_column` methods we covered
[earlier](#adding-columns), Rails also provides the [`change_column`][]
migration method.

```ruby
change_column :products, :part_number, :text
```

This changes the column `part_number` on products table to be a `:text` field.

NOTE: The `change_column` command is **irreversible**. To ensure your migration
can be safely reverted, you will need to provide your own `reversible`
migration. See the [Reversible Migrations section](#using-reversible) for more
details.

Besides `change_column`, the [`change_column_null`][] and
[`change_column_default`][] methods are used to change a null constraint and
default values of a column.

```ruby
change_column_default :products, :approved, from: true, to: false
```

This changes the default value of the `:approved` field from true to false. This
change will only be applied to future records, any existing records do not
change. Use [`change_column_null`][] to change a null constraint.

```ruby
change_column_null :products, :name, false
```

This sets `:name` field on products to a `NOT NULL` column. This change applies
to existing records as well, so you need to make sure all existing records have
a `:name` that is `NOT NULL`.

Setting the null constraint to `true` implies that column will accept a null
value, otherwise the `NOT NULL` constraint is applied and a value must be passed
in order to persist the record to the database.

NOTE: You could also write the above `change_column_default` migration as
`change_column_default :products, :approved, false`, but unlike the previous
example, this would make your migration irreversible.

[`change_column`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-change_column
[`change_column_default`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-change_column_default
[`change_column_null`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-change_column_null

### Column Modifiers

Column modifiers can be applied when creating or changing a column:

* `comment`      Adds a comment for the column.
* `collation`    Specifies the collation for a `string` or `text` column.
* `default`      Allows to set a default value on the column. Note that if you
  are using a dynamic value (such as a date), the default will only be
  calculated the first time (i.e. on the date the migration is applied). Use
  `nil` for `NULL`. Depending on your database, existing records may not
  receive the default value.
* `limit`        Sets the maximum number of characters for a `string` column and
  the maximum number of bytes for `text/binary/integer` columns.
* `null`         Allows or disallows `NULL` values in the column.
* `precision`    Specifies the precision for `decimal/numeric/datetime/time`
  columns.
* `scale`        Specifies the scale for the `decimal` and `numeric` columns,
  representing the number of digits after the decimal point.

NOTE: For `add_column` or `change_column` there is no option for adding indexes.
They need to be added separately using `add_index`.

Some adapters may support additional options; see the adapter specific API docs
for further information.

NOTE: `default` cannot be specified via command line when generating migrations.

### References

The `add_reference` method allows the creation of an appropriately named column
acting as the connection between one or more associations.

```ruby
add_reference :users, :role
```

This migration will create a foreign key column called `role_id` in the users
table. `role_id` is a reference to the `id` column in the `roles` table. In
addition, it creates an index for the `role_id` column, unless it is explicitly
told not to do so with the `index: false` option.

INFO: See also the [Active Record Associations][] guide to learn more.

The method `add_belongs_to` is an alias of `add_reference`.

```ruby
add_belongs_to :taggings, :taggable, polymorphic: true
```

The polymorphic option will create two columns on the taggings table which can
be used for polymorphic associations: `taggable_type` and `taggable_id`.

INFO: See this guide to learn more about [polymorphic associations][].

A foreign key can be created with the `foreign_key` option.

```ruby
add_reference :users, :role, foreign_key: true
```

For more `add_reference` options, visit the [API
documentation](https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_reference).

References can also be removed:

```ruby
remove_reference :products, :user, foreign_key: true, index: false
```

[Active Record Associations]: association_basics.html
[polymorphic associations]: association_basics.html#polymorphic-associations

### Foreign Keys

While it's not required, you might want to add foreign key constraints to
[guarantee referential integrity](#active-record-and-referential-integrity).

```ruby
add_foreign_key :articles, :authors
```

The [`add_foreign_key`][] call adds a new constraint to the `articles` table.
The constraint guarantees that a row in the `authors` table exists where the
`id` column matches the `articles.author_id` to ensure all authors listed in
the articles table are valid authors listed in the authors table.

NOTE: When using `references` in a migration, you are creating a new column in
the table and you'll have the option to add a foreign key using `foreign_key:
true` to that column. However, if you want to add a foreign key to an existing
column, you can use `add_foreign_key`.

If the column name of the table to which we're adding the foreign key cannot be
derived from the table with the referenced primary key then you can use the
`:column` option to specify the column name. Additionally, you can use the
`:primary_key` option if the referenced primary key is not `:id`.

For example, to add a foreign key on `articles.reviewer` referencing
`authors.email`:

```ruby
add_foreign_key :articles, :authors, column: :reviewer, primary_key: :email
```

This will add a constraint to the `articles` table that guarantees a row in the
`authors` table exists where the `email` column matches the `articles.reviewer`
field.

Several other options such as `name`, `on_delete`, `if_not_exists`, `validate`,
and `deferrable` are supported by `add_foreign_key`.

Foreign keys can also be removed using [`remove_foreign_key`][]:

```ruby
# let Active Record figure out the column name
remove_foreign_key :accounts, :branches

# remove foreign key for a specific column
remove_foreign_key :accounts, column: :owner_id
```

NOTE: Active Record only supports single column foreign keys. `execute` and
`structure.sql` are required to use composite foreign keys. See [Schema Dumping
and You](#schema-dumping-and-you).

### Composite Primary Keys

Sometimes a single column's value isn't enough to uniquely identify every row of
a table, but a combination of two or more columns *does* uniquely identify it.
This can be the case when using a legacy database schema without a single `id`
column as a primary key, or when altering schemas for sharding or multitenancy.

You can create a table with a composite primary key by passing the
`:primary_key` option to `create_table` with an array value:

```ruby
class CreateProducts < ActiveRecord::Migration[8.2]
  def change
    create_table :products, primary_key: [:customer_id, :product_sku] do |t|
      t.integer :customer_id
      t.string :product_sku
      t.text :description
    end
  end
end
```

INFO: Tables with composite primary keys require passing array values rather
than integer IDs to many methods. See also the [Active Record Composite Primary
Keys](active_record_composite_primary_keys.html) guide to learn more.

### Execute SQL

If the helpers provided by Active Record aren't enough, you can use the
[`execute`][] method to execute SQL commands. For example,

```ruby
class UpdateProductPrices < ActiveRecord::Migration[8.2]
  def up
    execute "UPDATE products SET price = 'free'"
  end

  def down
    execute "UPDATE products SET price = 'original_price' WHERE price = 'free';"
  end
end
```

In this example, we're updating the `price` column of the products table to
'free' for all records.

WARNING: Modifying data directly in migrations should be approached with
caution. Consider if this is the best approach for your use case, and be aware
of potential drawbacks such as increased complexity and maintenance overhead,
risks to data integrity and database portability. See the [Data Migrations
documentation](#data-migrations) for more details.

For more details and examples of individual methods, check the API
documentation.

In particular the documentation for
[`ActiveRecord::ConnectionAdapters::SchemaStatements`][], which provides the
methods available in the `change`, `up` and `down` methods.

For methods available regarding the object yielded by `create_table`, see
[`ActiveRecord::ConnectionAdapters::TableDefinition`][].

And for the object yielded by `change_table`, see
[`ActiveRecord::ConnectionAdapters::Table`][].

[`execute`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/DatabaseStatements.html#method-i-execute
[`ActiveRecord::ConnectionAdapters::SchemaStatements`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html
[`ActiveRecord::ConnectionAdapters::TableDefinition`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/TableDefinition.html
[`ActiveRecord::ConnectionAdapters::Table`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/Table.html

### Using the `change` Method

The `change` method is the primary way of writing migrations. It works for the
majority of cases in which Active Record knows how to reverse a migration's
actions automatically. Below are some of the actions that `change` supports:

* [`add_check_constraint`][]
* [`add_column`][]
* [`add_foreign_key`][]
* [`add_index`][]
* [`add_reference`][]
* [`add_timestamps`][]
* [`change_column_comment`][] (must supply `:from` and `:to` options)
* [`change_column_default`][] (must supply `:from` and `:to` options)
* [`change_column_null`][]
* [`change_table_comment`][] (must supply `:from` and `:to` options)
* [`create_join_table`][]
* [`create_table`][]
* `disable_extension`
* [`drop_join_table`][]
* [`drop_table`][] (must supply table creation options and block)
* `enable_extension`
* [`remove_check_constraint`][] (must supply original constraint expression)
* [`remove_column`][] (must supply original type and column options)
* [`remove_columns`][] (must supply original type and column options)
* [`remove_foreign_key`][] (must supply other table and original options)
* [`remove_index`][] (must supply columns and original options)
* [`remove_reference`][] (must supply original options)
* [`remove_timestamps`][] (must supply original options)
* [`rename_column`][]
* [`rename_index`][]
* [`rename_table`][]

[`change_table`][] is also reversible, as long as the block only calls
reversible operations like the ones listed above.

If you need to use any other methods, you should use `reversible` or write the
`up` and `down` methods instead of using the `change` method.

[`add_check_constraint`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_check_constraint
[`add_foreign_key`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_foreign_key
[`add_timestamps`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_timestamps
[`change_column_comment`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-change_column_comment
[`change_table_comment`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-change_table_comment
[`drop_join_table`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-drop_join_table
[`drop_table`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-drop_table
[`remove_check_constraint`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-remove_check_constraint
[`remove_foreign_key`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-remove_foreign_key
[`remove_index`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-remove_index
[`remove_reference`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-remove_reference
[`remove_timestamps`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-remove_timestamps
[`rename_column`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-rename_column
[`remove_columns`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-remove_columns
[`rename_index`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-rename_index
[`rename_table`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-rename_table

### Using `reversible`

If you'd like for a migration to do something that Active Record doesn't know
how to reverse, then you can use `reversible` to specify what to do when running
a migration and what else to do when reverting it.

```ruby
class ChangeProductsPrice < ActiveRecord::Migration[8.2]
  def change
    reversible do |direction|
      change_table :products do |t|
        direction.up   { t.change :price, :string }
        direction.down { t.change :price, :integer }
      end
    end
  end
end
```

This migration will change the type of the `price` column to a string, or back
to an integer when the migration is reverted. Notice the block being passed to
`direction.up` and `direction.down` respectively.

Alternatively, you can use `up` and `down` instead of `change`:

```ruby
class ChangeProductsPrice < ActiveRecord::Migration[8.2]
  def up
    change_table :products do |t|
      t.change :price, :string
    end
  end

  def down
    change_table :products do |t|
      t.change :price, :integer
    end
  end
end
```

Additionally, `reversible` is useful when executing raw SQL queries or
performing database operations that do not have a direct equivalent in
ActiveRecord methods. You can use [`reversible`][] to specify what to do when
running a migration and what else to do when reverting it. For example:

```ruby
class ExampleMigration < ActiveRecord::Migration[8.2]
  def change
    create_table :distributors do |t|
      t.string :zipcode
    end

    reversible do |direction|
      direction.up do
        # create a distributors view
        execute <<-SQL
          CREATE VIEW distributors_view AS
          SELECT id, zipcode
          FROM distributors;
        SQL
      end
      direction.down do
        execute <<-SQL
          DROP VIEW distributors_view;
        SQL
      end
    end

    add_column :users, :address, :string
  end
end
```

Using `reversible` will ensure that the instructions are executed in the right
order too. If the previous example migration is reverted, the `down` block will
be run after the `users.address` column is removed and before the `distributors`
table is dropped.

[`reversible`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Migration.html#method-i-reversible

### Using the `up`/`down` Methods

You can also use the old style of migration using `up` and `down` methods
instead of the `change` method.

The `up` method should describe the transformation you'd like to make to your
schema, and the `down` method of your migration should revert the
transformations done by the `up` method. In other words, the database schema
should be unchanged if you do an `up` followed by a `down`.

For example, if you create a table in the `up` method, you should drop it in the
`down` method. It is wise to perform the transformations in precisely the
reverse order they were made in the `up` method. The example in the `reversible`
section is equivalent to:

```ruby
class ExampleMigration < ActiveRecord::Migration[8.2]
  def up
    create_table :distributors do |t|
      t.string :zipcode
    end

    # create a distributors view
    execute <<-SQL
      CREATE VIEW distributors_view AS
      SELECT id, zipcode
      FROM distributors;
    SQL

    add_column :users, :address, :string
  end

  def down
    remove_column :users, :address

    execute <<-SQL
      DROP VIEW distributors_view;
    SQL

    drop_table :distributors
  end
end
```

### Throwing an error to prevent reverts

Sometimes your migration will do something which is just plain irreversible; for
example, it might destroy some data.

In such cases, you can raise `ActiveRecord::IrreversibleMigration` in your
`down` block.

```ruby
class IrreversibleMigrationExample < ActiveRecord::Migration[8.2]
  def up
    drop_table :example_table
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "This migration cannot be reverted because it destroys data."
  end
end
```

If someone tries to revert your migration, an error message will be displayed
saying that it can't be done.

### Reverting Previous Migrations

You can use Active Record's ability to rollback migrations using the
[`revert`][] method:

```ruby
require_relative "20121212123456_example_migration"

class FixupExampleMigration < ActiveRecord::Migration[8.2]
  def change
    revert ExampleMigration

    create_table(:apples) do |t|
      t.string :variety
    end
  end
end
```

The `revert` method also accepts a block of instructions to reverse. This could
be useful to revert selected parts of previous migrations.

For example, let's imagine that `ExampleMigration` is committed and it is later
decided that a Distributors view is no longer needed.

```ruby
class DontUseDistributorsViewMigration < ActiveRecord::Migration[8.2]
  def change
    revert do
      # copy-pasted code from ExampleMigration
      create_table :distributors do |t|
        t.string :zipcode
      end

      reversible do |direction|
        direction.up do
          # create a distributors view
          execute <<-SQL
            CREATE VIEW distributors_view AS
            SELECT id, zipcode
            FROM distributors;
          SQL
        end
        direction.down do
          execute <<-SQL
            DROP VIEW distributors_view;
          SQL
        end
      end

      # The rest of the migration was ok
    end
  end
end
```

The same migration could also have been written without using `revert` but this
would have involved a few more steps:

1. Reverse the order of `create_table` and `reversible`.
2. Replace `create_table` with `drop_table`.
3. Finally, replace `up` with `down` and vice-versa.

This is all taken care of by `revert`.

[`revert`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Migration.html#method-i-revert

Running Migrations
------------------

Rails provides a set of commands to run certain sets of migrations.

The very first migration related rails command you will use will probably be
`bin/rails db:migrate`. In its most basic form it just runs the `change` or `up`
method for all the migrations that have not yet been run. If there are no such
migrations, it exits. It will run these migrations in order based on the date of
the migration.

Note that running the `db:migrate` command also invokes the `db:schema:dump`
command, which will update your `db/schema.rb` file to match the structure of
your database.

If you specify a target version, Active Record will run the required migrations
(change, up, down) until it has reached the specified version. The version is
the numerical prefix on the migration's filename. For example, to migrate to
version 20240428000000 run:

```bash
$ bin/rails db:migrate VERSION=20240428000000
```

If version 20240428000000 is greater than the current version (i.e., it is
migrating upwards), this will run the `change` (or `up`) method on all
migrations up to and including 20240428000000, and will not execute any later
migrations. If migrating downwards, this will run the `down` method on all the
migrations down to, but not including, 20240428000000.

### Rolling Back

A common task is to rollback the last migration. For example, if you made a
mistake in it and wish to correct it. Rather than tracking down the version
number associated with the previous migration you can run:

```bash
$ bin/rails db:rollback
```

This will rollback the latest migration, either by reverting the `change` method
or by running the `down` method. If you need to undo several migrations you can
provide a `STEP` parameter:

```bash
$ bin/rails db:rollback STEP=3
```

The last 3 migrations will be reverted.

In some cases where you modify a local migration and would like to rollback that
specific migration before migrating back up again, you can use the
`db:migrate:redo` command. As with the `db:rollback` command, you can use the
`STEP` parameter if you need to go more than one version back, for example:

```bash
$ bin/rails db:migrate:redo STEP=3
```

NOTE: You could get the same result using `db:migrate`. However, these are there
for convenience so that you do not need to explicitly specify the version to
migrate to.

#### Transactions

In databases that support DDL transactions, changing the schema in a single
transaction, each migration is wrapped in a transaction.

INFO: A transaction ensures that if a migration fails partway through, any
changes that were successfully applied are rolled back, maintaining database
consistency. This means that either all operations within the transaction are
executed successfully, or none of them are, preventing the database from being
left in an inconsistent state if an error occurs during the transaction.

If the database does not support DDL transactions with statements that change
the schema, then when a migration fails, the parts of it that have succeeded
will not be rolled back. You will have to rollback the changes manually.

There are queries that you can’t execute inside a transaction though, and for
these situations you can turn the automatic transactions off with
`disable_ddl_transaction!`:

```ruby
class ChangeEnum < ActiveRecord::Migration[8.2]
  disable_ddl_transaction!

  def up
    execute "ALTER TYPE model_size ADD VALUE 'new_value'"
  end
end
```

NOTE: Remember that you can still open your own transactions, even if you are in
a Migration with self.disable_ddl_transaction!.

### Setting Up the Database

The `bin/rails db:setup` command will create the database, load the schema, and
initialize it with the seed data.

### Preparing the Database

The `bin/rails db:prepare` command is similar to `bin/rails db:setup`, but it
operates idempotently, so it can safely be called several times, but it will
only perform the necessary tasks once.

* If the database has not been created yet, the command behaves the same as
  `bin/rails db:setup`.
* If the database exists but the tables are missing, the command additionally
  loads the schema.
* If tables already exist, the command runs any pending migrations and dumps the
  updated schema.

Once the database and tables exist, the `db:prepare` task will not try to reload
the seed data, even if the previously loaded seed data or the existing seed file
have been altered or deleted. To reload the seed data, you can manually run
`bin/rails db:seed:replant`.

NOTE: This task will only load seeds if one of the databases or tables created
is a primary database for the environment or is configured with `seeds: true`.

### Resetting the Database

The `bin/rails db:reset` command will drop the database and set it up again.
This is functionally equivalent to `bin/rails db:drop db:setup`.

NOTE: This is not the same as running all the migrations. It will only use the
contents of the current `db/schema.rb` or `db/structure.sql` file. If a
migration can't be rolled back, `bin/rails db:reset` may not help you. To find
out more about dumping the schema see [Schema Dumping and You][] section.

If you need an alternative to `db:reset` that explicitly runs all migrations,
consider using the `bin/rails db:migrate:reset` command. You can follow that
command with `bin/rails db:seed` if needed.

NOTE: `bin/rails db:reset` rebuilds the database using the current schema. On
the other hand, `bin/rails db:migrate:reset` replays all migrations from the
beginning, which can lead to schema drift if, for example, migrations have been
altered, reordered, or removed.

[Schema Dumping and You]: #schema-dumping-and-you

### Running Specific Migrations

If you need to run a specific migration up or down, the `db:migrate:up` and
`db:migrate:down` commands will do that. Just specify the appropriate version
and the corresponding migration will have its `change`, `up` or `down` method
invoked, for example:

```bash
$ bin/rails db:migrate:up VERSION=20240428000000
```

By running this command the `change` method (or the `up` method) will be
executed for the migration with the version "20240428000000".

First, this command will check whether the migration exists and if it has
already been performed and if so, it will do nothing.

If the version specified does not exist, Rails will throw an exception.

```bash
$ bin/rails db:migrate VERSION=00000000000000
rails aborted!
ActiveRecord::UnknownMigrationVersionError:

No migration with version number 00000000000000.
```

### Running Migrations in Different Environments

By default running `bin/rails db:migrate` will run in the `development`
environment.

To run migrations against another environment you can specify it using the
`RAILS_ENV` environment variable while running the command. For example to run
migrations against the `test` environment you could run:

```bash
$ bin/rails db:migrate RAILS_ENV=test
```

### Changing the Output of Running Migrations

By default migrations tell you exactly what they're doing and how long it took.
A migration creating a table and adding an index might produce output like this

```
==  CreateProducts: migrating =================================================
-- create_table(:products)
   -> 0.0028s
==  CreateProducts: migrated (0.0028s) ========================================
```

Several methods are provided in migrations that allow you to control all this:

| Method                     | Purpose
| -------------------------- | -------
| [`suppress_messages`][]    | Takes a block as an argument and suppresses any output generated by the block.
| [`say`][]                  | Takes a message argument and outputs it as is. A second boolean argument can be passed to specify whether to indent or not.
| [`say_with_time`][]        | Outputs text along with how long it took to run its block. If the block returns an integer it assumes it is the number of rows affected.

For example, take the following migration:

```ruby
class CreateProducts < ActiveRecord::Migration[8.2]
  def change
    suppress_messages do
      create_table :products do |t|
        t.string :name
        t.text :description
        t.timestamps
      end
    end

    say "Created a table"

    suppress_messages { add_index :products, :name }
    say "and an index!", true

    say_with_time "Waiting for a while" do
      sleep 10
      250
    end
  end
end
```

This will generate the following output:

```
==  CreateProducts: migrating =================================================
-- Created a table
   -> and an index!
-- Waiting for a while
   -> 10.0013s
   -> 250 rows
==  CreateProducts: migrated (10.0054s) =======================================
```

If you want Active Record to not output anything, then running `bin/rails
db:migrate VERBOSE=false` will suppress all output.

[`say`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Migration.html#method-i-say
[`say_with_time`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Migration.html#method-i-say_with_time
[`suppress_messages`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Migration.html#method-i-suppress_messages

### Rails Migration Version Control

Rails keeps track of which migrations have been run through the
`schema_migrations` table in the database. When you run a migration, Rails
inserts a row into the `schema_migrations` table with the version number of the
migration, stored in the `version` column. This allows Rails to determine which
migrations have already been applied to the database.

For example, if you have a migration file named 20240428000000_create_users.rb,
Rails will extract the version number (20240428000000) from the filename and
insert it into the schema_migrations table after the migration has been
successfully executed.

You can view the contents of the schema_migrations table directly in your
database management tool or by using Rails console:

```irb
rails dbconsole
```

Then, within the database console, you can query the schema_migrations table:

```sql
SELECT * FROM schema_migrations;
```

This will show you a list of all migration version numbers that have been
applied to the database. Rails uses this information to determine which
migrations need to be run when you run rails db:migrate or rails db:migrate:up
commands.

Changing Existing Migrations
----------------------------

Occasionally you will make a mistake when writing a migration. If you have
already run the migration, then you cannot just edit the migration and run the
migration again: Rails thinks it has already run the migration and so will do
nothing when you run `bin/rails db:migrate`. You must rollback the migration
(for example with `bin/rails db:rollback`), edit your migration, and then run
`bin/rails db:migrate` to run the corrected version.

In general, editing existing migrations that have been already committed to
source control is not a good idea. You will be creating extra work for yourself
and your co-workers and cause major headaches if the existing version of the
migration has already been run on production machines. Instead, you should write
a new migration that performs the changes you require.

However, editing a freshly generated migration that has not yet been committed
to source control (or, more generally, has not been propagated beyond your
development machine) is common.

The `revert` method can be helpful when writing a new migration to undo previous
migrations in whole or in part (see [Reverting Previous Migrations][] above).

[Reverting Previous Migrations]: #reverting-previous-migrations

Schema Dumping and You
----------------------

### What are Schema Files for?

Migrations, mighty as they may be, are not the authoritative source for your
database schema. **Your database remains the source of truth.**

By default, Rails generates `db/schema.rb` which attempts to capture the current
state of your database schema.

It tends to be faster and less error prone to create a new instance of your
application's database by loading the schema file via `bin/rails db:schema:load`
than it is to replay the entire migration history. [Old migrations][] may fail
to apply correctly if those migrations use changing external dependencies or
rely on application code which evolves separately from your migrations.

TIP: Schema files are also useful if you want a quick look at what attributes an
Active Record object has. This information is not in the model's code and is
frequently spread across several migrations, but the information is nicely
summed up in the schema file.

[Old migrations]: #old-migrations

### Types of Schema Dumps

The format of the schema dump generated by Rails is controlled by the
[`config.active_record.schema_format`][] setting defined in
`config/application.rb`, or the `schema_format` value in the database configuration.
By default, the format is `:ruby`, or alternatively can be set to `:sql`.

#### Using the default `:ruby` schema

When `:ruby` is selected, then the schema is stored in `db/schema.rb`. If you
look at this file you'll find that it looks an awful lot like one very big
migration:

```ruby
ActiveRecord::Schema[8.2].define(version: 2008_09_06_171750) do
  create_table "authors", force: true do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "products", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "part_number"
  end
end
```

In many ways this is exactly what it is. This file is created by inspecting the
database and expressing its structure using `create_table`, `add_index`, and so
on.

#### Using the `:sql` schema dumper

However, `db/schema.rb` cannot express everything your database may support such
as triggers, sequences, stored procedures, etc.

While migrations may use `execute` to create database constructs that are not
supported by the Ruby migration DSL, these constructs may not be able to be
reconstituted by the schema dumper.

If you are using features like these, you should set the schema format to `:sql`
in order to get an accurate schema file that is useful to create new database
instances.

When the schema format is set to `:sql`, the database structure will be dumped
using a tool specific to the database into `db/structure.sql`. For example, for
PostgreSQL, the `pg_dump` utility is used. For MySQL and MariaDB, this file will
contain the output of `SHOW CREATE TABLE` for the various tables.

To load the schema from `db/structure.sql`, run `bin/rails db:schema:load`.
Loading this file is done by executing the SQL statements it contains. By
definition, this will create a perfect copy of the database's structure.

[`config.active_record.schema_format`]:
    configuring.html#config-active-record-schema-format

### Schema Dumps and Source Control

Because schema files are commonly used to create new databases, it is strongly
recommended that you check your schema file into source control.

Merge conflicts can occur in your schema file when two branches modify schema.
To resolve these conflicts run `bin/rails db:migrate` to regenerate the schema
file.

INFO: Newly generated Rails apps will already have the migrations folder
included in the git tree, so all you have to do is be sure to add any new
migrations you add and commit them.

Active Record and Referential Integrity
---------------------------------------

The Active Record pattern suggests that intelligence should primarily reside in
your models rather than in the database. Consequently, features like triggers or
constraints, which delegate some of that intelligence back into the database,
are not always favored.

Validations such as `validates :foreign_key, uniqueness: true` are one way in
which models can enforce data integrity. The `:dependent` option on associations
allows models to automatically destroy child objects when the parent is
destroyed. Like anything which operates at the application level, these cannot
guarantee referential integrity and so some people augment them with [foreign
key constraints][] in the database.

In practice, foreign key constraints and unique indexes are generally considered
safer when enforced at the database level. Although Active Record does not
provide direct support for working with these database-level features, you can
still use the execute method to run arbitrary SQL commands.

It's worth emphasizing that while the Active Record pattern emphasizes keeping
intelligence within models, neglecting to implement foreign keys and unique
constraints at the database level can potentially lead to integrity issues.
Therefore, it's advisable to complement the AR pattern with database-level
constraints where appropriate. These constraints should have their counterparts
explicitly defined in your code using associations and validations to ensure
data integrity across both application and database layers.

[foreign key constraints]: #foreign-keys

Migrations and Seed Data
------------------------

The main purpose of the Rails migration feature is to issue commands that modify
the schema using a consistent process. Migrations can also be used to add or
modify data. This is useful in an existing database that can't be destroyed and
recreated, such as a production database.

```ruby
class AddInitialProducts < ActiveRecord::Migration[8.2]
  def up
    5.times do |i|
      Product.create(name: "Product ##{i}", description: "A product.")
    end
  end

  def down
    Product.delete_all
  end
end
```

To add initial data after a database is created, Rails has a built-in 'seeds'
feature that speeds up the process. This is especially useful when reloading the
database frequently in development and test environments, or when setting up
initial data for production.

To get started with this feature, open up `db/seeds.rb` and add some Ruby code,
then run `bin/rails db:seed`.

NOTE: The code here should be idempotent so that it can be executed at any point
in every environment.

```ruby
["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
  MovieGenre.find_or_create_by!(name: genre_name)
end
```

This is generally a much cleaner way to set up the database of a blank
application.

Old Migrations
--------------

The `db/schema.rb` or `db/structure.sql` is a snapshot of the current state of
your database and is the authoritative source for rebuilding that database. This
makes it possible to delete or prune old migration files.

When you delete migration files in the `db/migrate/` directory, any environment
where `bin/rails db:migrate` was run when those files still existed will hold a
reference to the migration timestamp specific to them inside an internal Rails
database table named `schema_migrations`. You can read more about this in the
[Rails Migration Version Control section](#rails-migration-version-control).

If you run the `bin/rails db:migrate:status` command, which displays the status
(up or down) of each migration, you should see `********** NO FILE **********`
displayed next to any deleted migration file which was once executed on a
specific environment but can no longer be found in the `db/migrate/` directory.

### Migrations from Engines

When dealing with migrations from [Engines][], there's a caveat to consider.
Rake tasks to install migrations from engines are idempotent, meaning they will
have the same result no matter how many times they are called. Migrations
present in the parent application due to a previous installation are skipped,
and missing ones are copied with a new leading timestamp. If you deleted old
engine migrations and ran the install task again, you'd get new files with new
timestamps, and `db:migrate` would attempt to run them again.

Thus, you generally want to preserve migrations coming from engines. They have a
special comment like this:

```ruby
# This migration comes from blorgh (originally 20210621082949)
```

 [Engines]: engines.html

## Miscellaneous

### Using UUIDs instead of IDs for Primary Keys

By default, Rails uses auto-incrementing integers as primary keys for database
records. However, there are scenarios where using Universally Unique Identifiers
(UUIDs) as primary keys can be advantageous, especially in distributed systems
or when integration with external services is necessary. UUIDs provide a
globally unique identifier without relying on a centralized authority for
generating IDs.

#### Enabling UUIDs in Rails

Before using UUIDs in your Rails application, you'll need to ensure that your
database supports storing them. Additionally, you may need to configure your
database adapter to work with UUIDs.

NOTE: If you are using a version of PostgreSQL prior to 13, you may still need
to enable the pgcrypto extension to access the `gen_random_uuid()` function.

1. Rails Configuration

    In your Rails application configuration file (`config/application.rb`), add
    the following line to configure Rails to generate UUIDs as primary keys by
    default:

    ```ruby
    config.generators do |g|
      g.orm :active_record, primary_key_type: :uuid
    end
    ```

    This setting instructs Rails to use UUIDs as the default primary key type
    for ActiveRecord models.

2. Adding References with UUIDs:

    When creating associations between models using references, ensure that you
    specify the data type as :uuid to maintain consistency with the primary key
    type. For example:

    ``` ruby
    create_table :posts, id: :uuid do |t|
      t.references :author, type: :uuid, foreign_key: true
      # Other columns...
      t.timestamps
    end
    ```

    In this example, the `author_id` column in the posts table references the
    `id` column of the authors table. By explicitly setting the type to `:uuid`,
    you ensure that the foreign key column matches the data type of the primary
    key it references. Adjust the syntax accordingly for other associations and
    databases.

3. Migration Changes

    When generating migrations for your models, you'll notice that it specifies
    the id to be of type `uuid:`

    ```bash
      $ bin/rails g migration CreateAuthors
    ```

    ```ruby
    class CreateAuthors < ActiveRecord::Migration[8.2]
      def change
        create_table :authors, id: :uuid do |t|
          t.timestamps
        end
      end
    end
    ```

    which results in the following schema:

    ```ruby
    create_table "authors", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
      t.datetime "created_at", precision: 6, null: false
      t.datetime "updated_at", precision: 6, null: false
    end
    ```

    In this migration, the `id` column is defined as a UUID primary key with a
    default value generated by the `gen_random_uuid()` function.

UUIDs are guaranteed to be globally unique across different systems, making them
suitable for distributed architectures. They also simplify integration with
external systems or APIs by providing a unique identifier that doesn't rely on
centralized ID generation, and unlike auto-incrementing integers, UUIDs don't
expose information about the total number of records in a table, which can be
beneficial for security purposes.

However, UUIDs can also impact performance due to their size and are harder to
index. UUIDs will have worse performance for writes and reads compared with
integer primary keys and foreign keys.

NOTE: Therefore, it's essential to evaluate the trade-offs and consider the
specific requirements of your application before deciding to use UUIDs as
primary keys.

### Data Migrations

Data migrations involve transforming or moving data within your database. In
Rails, it is generally not advised to perform data migrations using migration
files. Here’s why:

- **Separation of Concerns**: Schema changes and data changes have different
  lifecycles and purposes. Schema changes alter the structure of your database,
  while data changes alter the content.
- **Rollback Complexity**: Data migrations can be hard to rollback safely and
  predictably.
- **Performance**: Data migrations can take a long time to run and may lock your
  tables, affecting application performance and availability.

Instead, consider using the
[`maintenance_tasks`](https://github.com/Shopify/maintenance_tasks) gem. This
gem provides a framework for creating and managing data migrations and other
maintenance tasks in a way that is safe and easy to manage without interfering
with schema migrations.

Customizing Migration Behavior with Swappable Strategies
--------------------------------------------------------

Rails allows you to customize how migrations execute by using **migration
strategies**. A migration strategy is an object that sits between your migration
and the connection, giving you control over how schema changes are applied to
the database.

By default, Rails uses [`ActiveRecord::Migration::DefaultStrategy`][], which
executes migrations by sending method calls directly to the connection.
However, you can replace this with your own strategy to modify, validate,
or even prevent certain migration operations. Migration strategies are
especially useful when you need different migration behavior across
environments. For example, production migrations may require:

* **Safety and Validation**: Prevent dangerous operations like dropping tables
  or removing columns in production environments.
* **Online Schema Changes**: Integrate with tools that perform schema
  changes without downtime (e.g., `pt-online-schema-change`, `gh-ost`).
* **Centralized Management**: Submit migrations to a centralized service
  rather than executing them directly, useful in large-scale deployments.

### Configuring a Global Migration Strategy

To customize how migrations are executed, you can define your own migration
strategy by subclassing [`ActiveRecord::Migration::DefaultStrategy`][]. This
default class automatically forwards all migration methods to the underlying
database connection, so you only need to override the methods you want to
customize.

For example, to prevent dropping tables in production:

```ruby
class CustomMigrationStrategy < ActiveRecord::Migration::DefaultStrategy
  def drop_table(table_name, **options)
    raise "Dropping tables is not allowed in production!"
  end
end
```

You can override any schema statement method your application needs, such as:

- `create_table`
- `drop_table`
- `add_column`
- `remove_column`
- `add_index`
- `remove_index`
- Or any other method from
  [`ActiveRecord::ConnectionAdapters::SchemaStatements`][]

You can also subclass [`ActiveRecord::Migration::ExecutionStrategy`][], the base
strategy class. This is useful if you want to define all migration behavior from
scratch, without having any methods forwarded to the connection.

Once you've defined your custom strategy, make it the default for migrations across
all database connections by setting [`config.active_record.migration_strategy`][].
For example, to set a custom strategy in production:

```ruby
# config/environments/production.rb
Rails.application.configure do
  config.active_record.migration_strategy = CustomMigrationStrategy
end
```

All migrations methods will be sent to your custom strategy in production.

### Configuring Per-Adapter Migration Strategies

If you're working with multiple database systems, a single global strategy is
likely insufficient: you may need to tailor migration behavior according to the
database. Active Record allows you to configure migration strategies on a
per-adapter basis. For example, suppose your application has a MySQL database,
`primary`, and a PostgreSQL database, `animals`:

```yaml
  primary:
    database: my_primary_database
    username: root
    password: <%= ENV['ROOT_PASSWORD'] %>
    adapter: trilogy
  animals:
    database: my_animals_database
    username: animals_root
    password: <%= ENV['ANIMALS_ROOT_PASSWORD'] %>
    adapter: postgresql
    migrations_paths: db/animals_migrate
```

You can configure a `migration_strategy` on each adapter class:

```ruby
# config/initializers/migration_strategies.rb
if Rails.env.production?
  ActiveSupport.on_load(:active_record_trilogyadapter) do
    ActiveRecord::ConnectionAdapters::Trilogy.migration_strategy =
      MySQLMigrationStrategy
  end

  ActiveSupport.on_load(:active_record_postgresqladapter) do
    ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.migration_strategy =
      PostgreSQLMigrationStrategy
  end
end
```

Migrations running against `primary` will use `MySQLMigrationStrategy`, and
migrations running against `animals` will use `PostgreSQLMigrationStrategy`.
The adapter-specific strategy takes precedence over any globally-configured
strategy.

[`ActiveRecord::Migration::DefaultStrategy`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Migration/DefaultStrategy.html
[`ActiveRecord::Migration::ExecutionStrategy`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Migration/ExecutionStrategy.html
[`config.active_record.migration_strategy`]:
    configuring.html#config-active-record-migration-strategy
[`ActiveRecord::ConnectionAdapters::SchemaStatements`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html
