**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Record Basics
====================

This guide is an introduction to Active Record.

After reading this guide, you will know:

* How Active Record fits into the Model-View-Controller (MVC) paradigm.
* What Object Relational Mapping and Active Record patterns are and how
  they are used in Rails.
* How to use Active Record models to manipulate data stored in a relational
  database.
* Active Record schema naming conventions.
* The concepts of database migrations, validations, callbacks, and associations.

--------------------------------------------------------------------------------

What is Active Record?
----------------------

Active Record is part of the M in [MVC][] - the model - which is the layer of
the system responsible for representing data and business logic. Active Record
helps you create and use Ruby objects whose attributes require persistent
storage to a database.

NOTE: What is the difference between Active Record and Active Model? It's
possible to model data with Ruby objects that do *not* need to be backed by a
database. [Active Model](active_model_basics.html) is commonly used for that in
Rails, making Active Record and Active Model both part of the M in MVC, as well
as your own plain Ruby objects.

The term "Active Record" also refers to a software architecture pattern. Active
Record in Rails is an implementation of that pattern. It's also a description of
something called an [Object Relational Mapping][ORM] system. The below sections
explain these terms.

### The Active Record Pattern

The [Active Record pattern is described by Martin Fowler][MFAR] in the book
_Patterns of Enterprise Application Architecture_ as "an object that wraps a row
in a database table, encapsulates the database access, and adds domain logic to
that data." Active Record objects carry both data and behavior. Active Record
classes match very closely to the record structure of the underlying database.
This way users can easily read from and write to the database, as you will see
in the examples below.

### Object Relational Mapping

Object Relational Mapping, commonly referred to as ORM, is a technique that
connects the rich objects of a programming language to tables in a relational
database management system (RDBMS). In the case of a Rails application, these
are Ruby objects. Using an ORM, the attributes of Ruby objects, as well as the
relationship between objects, can be easily stored and retrieved from a database
without writing SQL statements directly. Overall, ORMs minimize the amount of
database access code you have to write.

NOTE: Basic knowledge of relational database management systems (RDBMS) and
structured query language (SQL) is helpful in order to fully understand Active
Record. Please refer to [this SQL tutorial][sqlcourse] (or [this RDBMS
tutorial][rdbmsinfo]) or study them by other means if you would like to learn
more.

### Active Record as an ORM Framework

Active Record gives us the ability to do the following using Ruby objects:

* Represent models and their data.
* Represent associations between models.
* Represent inheritance hierarchies through related models.
* Validate models before they get persisted to the database.
* Perform database operations in an object-oriented fashion.

[MVC]: https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller
[MFAR]: https://www.martinfowler.com/eaaCatalog/activeRecord.html
[ORM]: https://en.wikipedia.org/wiki/Object-relational_mapping
[sqlcourse]: https://www.khanacademy.org/computing/computer-programming/sql
[rdbmsinfo]: https://www.devart.com/what-is-rdbms/

Convention over Configuration in Active Record
----------------------------------------------

When writing applications using other programming languages or frameworks, it
may be necessary to write a lot of configuration code. This is particularly true
for ORM frameworks in general. However, if you follow the conventions adopted by
Rails, you'll write very little to no configuration code when creating Active
Record models.

Rails adopts the idea that if you configure your applications in the same way
most of the time, then that way should be the default. Explicit configuration
should be needed only in those cases where you can't follow the convention.

To take advantage of convention over configuration in Active Record, there are
some naming and schema conventions to follow. And in case you need to, it is
possible to [override naming conventions](#overriding-the-naming-conventions).

### Naming Conventions

Active Record uses this naming convention to map between models (represented by
Ruby objects) and database tables:

Rails will pluralize your model's class names to find the respective database
table. For example, a class named `Book` maps to a database table named `books`.
The Rails pluralization mechanisms are very powerful and capable of pluralizing
(and singularizing) both regular and irregular words in the English language.
This uses the [Active Support](active_support_core_extensions.html#pluralize)
[pluralize](https://api.rubyonrails.org/classes/ActiveSupport/Inflector.html#method-i-pluralize) method.

For class names composed of two or more words, the model class name will follow
the Ruby conventions of using an UpperCamelCase name. The database table name, in
that case, will be a snake_case name. For example:

* `BookClub` is the model class, singular with the first letter of each word
  capitalized.
* `book_clubs` is the matching database table, plural with underscores
  separating words.

Here are some more examples of model class names and corresponding table names:

| Model / Class    | Table / Schema |
| ---------------- | -------------- |
| `Article`        | `articles`     |
| `LineItem`       | `line_items`   |
| `Product`        | `products`     |
| `Person`         | `people`       |

### Schema Conventions

Active Record uses conventions for column names in the database tables as well,
depending on the purpose of these columns.

* **Primary keys** - By default, Active Record will use an integer column named
  `id` as the table's primary key (`bigint` for PostgreSQL, MySQL, and MariaDB,
  `integer` for SQLite). When using [Active Record Migrations](#migrations) to
  create your tables, this column will be automatically created.
* **Foreign keys** - These fields should be named following the pattern
  `singularized_table_name_id` (e.g., `order_id`, `line_item_id`). These are the
  fields that Active Record will look for when you create associations between
  your models.

There are also some optional column names that will add additional features to
Active Record instances:

* `created_at` - Automatically gets set to the current date and time when the
  record is first created.
* `updated_at` - Automatically gets set to the current date and time whenever
  the record is created or updated.
* `lock_version` - Adds [optimistic
  locking](https://api.rubyonrails.org/classes/ActiveRecord/Locking.html) to a
  model.
* `type` - Specifies that the model uses [Single Table
  Inheritance](https://api.rubyonrails.org/classes/ActiveRecord/Base.html#class-ActiveRecord::Base-label-Single+table+inheritance).
* `(association_name)_type` - Stores the type for [polymorphic
  associations](association_basics.html#polymorphic-associations).
* `(table_name)_count` - Used to cache the number of belonging objects on
  associations. For example, if `Article`s have many `Comment`s, a
  `comments_count` column in the `articles` table will cache the number of
  existing comments for each article.

NOTE: While these column names are optional, they are reserved by Active Record.
Steer clear of reserved keywords when naming your table's columns. For example,
`type` is a reserved keyword used to designate a table using Single Table
Inheritance (STI). If you are not using STI, use a different word to accurately
describe the data you are modeling.

Creating Active Record Models
-----------------------------

When generating a Rails application, an abstract `ApplicationRecord` class will
be created in `app/models/application_record.rb`. The `ApplicationRecord` class
inherits from
[`ActiveRecord::Base`](https://api.rubyonrails.org/classes/ActiveRecord/Base.html)
and it's what turns a regular Ruby class into an Active Record model.

`ApplicationRecord` is the base class for all Active Record models in your app.
To create a new model, subclass the `ApplicationRecord` class and you're good to
go:

```ruby
class Book < ApplicationRecord
end
```

This will create a `Book` model, mapped to a `books` table in the database,
where each column in the table is mapped to attributes of the `Book` class. An
instance of `Book` can represent a row in the `books` table. The `books` table
with columns `id`, `title`, and `author`, can be created using an SQL statement
like this:

```sql
CREATE TABLE books (
  id int(11) NOT NULL auto_increment,
  title varchar(255),
  author varchar(255),
  PRIMARY KEY  (id)
);
```

However, that is not how you do it normally in Rails. Database tables in Rails
are typically created using [Active Record Migrations](#migrations) and not raw
SQL. A migration for the `books` table above can be generated like this:

```bash
$ bin/rails generate migration CreateBooks title:string author:string
```

NOTE: If you don't specify a type for a field (e.g., `title` instead of `title:string`), Rails will default to type `string`.

and results in this:

```ruby
# Note:
# The `id` column, as the primary key, is automatically created by convention.
# Columns `created_at` and `updated_at` are added by `t.timestamps`.

# db/migrate/20240220143807_create_books.rb
class CreateBooks < ActiveRecord::Migration[8.2]
  def change
    create_table :books do |t|
      t.string :title
      t.string :author

      t.timestamps
    end
  end
end
```

That migration creates columns `id`, `title`, `author`, `created_at` and
`updated_at`. Each row of this table can be represented by an instance of the
`Book` class with the same attributes: `id`, `title`, `author`, `created_at`,
and `updated_at`. You can access a book's attributes like this:

```irb
irb> book = Book.new
=> #<Book:0x00007fbdf5e9a038 id: nil, title: nil, author: nil, created_at: nil, updated_at: nil>

irb> book.title = "The Hobbit"
=> "The Hobbit"
irb> book.title
=> "The Hobbit"
```

NOTE: You can generate the Active Record model class as well as a matching
migration with the command `bin/rails generate model Book title:string
author:string`. This creates the files `app/models/book.rb`,
`db/migrate/20240220143807_create_books.rb`, and a couple others for testing
purposes.

### Creating Namespaced Models

Active Record models are placed under the `app/models` directory by default. But
you may want to organize your models by placing similar models under their own
folder and namespace. For example, `order.rb` and `review.rb` under
`app/models/book` with `Book::Order` and `Book::Review` class names,
respectively. You can create namespaced models with Active Record.

In the case where the `Book` module does not already exist, the `generate`
command will create everything like this:

```bash
$ bin/rails generate model Book::Order
      invoke  active_record
      create    db/migrate/20240306194227_create_book_orders.rb
      create    app/models/book/order.rb
      create    app/models/book.rb
      invoke    test_unit
      create      test/models/book/order_test.rb
      create      test/fixtures/book/orders.yml
```

If the `Book` module already exists, you will be asked to resolve
the conflict:

```bash
$ bin/rails generate model Book::Order
      invoke  active_record
      create    db/migrate/20240305140356_create_book_orders.rb
      create    app/models/book/order.rb
    conflict    app/models/book.rb
  Overwrite /Users/bhumi/Code/rails_guides/app/models/book.rb? (enter "h" for help) [Ynaqdhm]
```

Once the namespaced model generation is successful, the `Book` and `Order`
classes look like this:

```ruby
# app/models/book.rb
module Book
  def self.table_name_prefix
    "book_"
  end
end

# app/models/book/order.rb
class Book::Order < ApplicationRecord
end
```

Setting the
[table_name_prefix](https://api.rubyonrails.org/classes/ActiveRecord/ModelSchema.html#method-c-table_name_prefix-3D)
in `Book` will allow `Order` model's database table to be named
`book_orders`, instead of plain `orders`.

The other possibility is that you already have a `Book` model that you want
to keep in `app/models`. In that case, you can choose `n` to not overwrite
`book.rb` during the `generate` command.

This will still allow for a namespaced table name for `Book::Order` class,
without needing the `table_name_prefix`:

```ruby
# app/models/book.rb
class Book < ApplicationRecord
  # existing code
end

Book::Order.table_name
# => "book_orders"
```

Overriding the Naming Conventions
---------------------------------

What if you need to follow a different naming convention or need to use your
Rails application with a legacy database? No problem, you can easily override
the default conventions.

Since `ApplicationRecord` inherits from `ActiveRecord::Base`, your application's
models will have a number of helpful methods available to them. For example, you
can use the `ActiveRecord::Base.table_name=` method to customize the table name
that should be used:

```ruby
class Book < ApplicationRecord
  self.table_name = "my_books"
end
```

If you do so, you will have to manually define the class name that is hosting
[the fixtures](testing.html#the-low-down-on-fixtures) (`my_books.yml`) using the
`set_fixture_class` method in your test definition:

```ruby
# test/models/book_test.rb
class BookTest < ActiveSupport::TestCase
  set_fixture_class my_books: Book
  fixtures :my_books
  # ...
end
```

It's also possible to override the column that should be used as the table's
primary key using the `ActiveRecord::Base.primary_key=` method:

```ruby
class Book < ApplicationRecord
  self.primary_key = "book_id"
end
```

NOTE: **Active Record does not recommend using non-primary key columns named
`id`.** Using a column named `id` which is not a single-column primary key
complicates the access to the column value. The application will have to use the
[`id_value`][] alias attribute to access the value of the non-PK `id` column.

[`id_value`]: https://api.rubyonrails.org/classes/ActiveRecord/ModelSchema.html#method-i-id_value

NOTE: If you try to create a column named `id` which is not the primary key,
Rails will throw an error during migrations such as: `you can't redefine the
primary key column 'id' on 'my_books'.` `To define a custom primary key, pass {
id: false } to create_table.`

CRUD: Reading and Writing Data
------------------------------

CRUD is an acronym for the four verbs we use to operate on data: **C**reate,
**R**ead, **U**pdate, and **D**elete. Active Record automatically creates methods
to allow you to read and manipulate data stored in your application's database
tables.

Active Record makes it seamless to perform CRUD operations by using these
high-level methods that abstract away database access details. Note that all of
these convenient methods result in SQL statement(s) that are executed against
the underlying database.

The examples below show a few of the CRUD methods as well as the resulting SQL
statements.

### Create

Active Record objects can be created from a hash, a block, or have their
attributes manually set after creation. The `new` method will return a new,
non-persisted object, while `create` will save the object to the database and
return it.

For example, given a `Book` model with attributes of `title` and `author`, the
`create` method call will create an object and save a new record to the
database:

```ruby
book = Book.create(title: "The Lord of the Rings", author: "J.R.R. Tolkien")

# Note that the `id` is assigned as this record is committed to the database.
book.inspect
# => "#<Book id: 106, title: \"The Lord of the Rings\", author: \"J.R.R. Tolkien\", created_at: \"2024-03-04 19:15:58.033967000 +0000\", updated_at: \"2024-03-04 19:15:58.033967000 +0000\">"
```

While the `new` method will instantiate an object *without* saving it to the
database:

```ruby
book = Book.new
book.title = "The Hobbit"
book.author = "J.R.R. Tolkien"

# Note that the `id` is not set for this object.
book.inspect
# => "#<Book id: nil, title: \"The Hobbit\", author: \"J.R.R. Tolkien\", created_at: nil, updated_at: nil>"

# The above `book` is not yet saved to the database.

book.save
book.id # => 107

# Now the `book` record is committed to the database and has an `id`.
```

If a block is provided, both `create` and `new` will yield the new object to that block for initialization, while only `create` will persist the resulting object to the database:

```ruby
book = Book.new do |b|
  b.title = "Metaprogramming Ruby 2"
  b.author = "Paolo Perrotta"
end

book.save
```

The resulting SQL statement from both `book.save` and `Book.create` look
something like this:

```sql
/* Note that `created_at` and `updated_at` are automatically set. */

INSERT INTO "books" ("title", "author", "created_at", "updated_at") VALUES (?, ?, ?, ?) RETURNING "id"  [["title", "Metaprogramming Ruby 2"], ["author", "Paolo Perrotta"], ["created_at", "2024-02-22 20:01:18.469952"], ["updated_at", "2024-02-22 20:01:18.469952"]]
```

Finally, if you'd like to insert several records **without callbacks or
validations**, you can directly insert records into the database using `insert` or `insert_all` methods:

```ruby
Book.insert(title: "The Lord of the Rings", author: "J.R.R. Tolkien")
Book.insert_all([{ title: "The Lord of the Rings", author: "J.R.R. Tolkien" }])
```

### Read

Active Record provides a rich API for accessing data within a database. You can
query a single record or multiple records, filter them by any attribute, order
them, group them, select specific fields, and do anything you can do with SQL.

```ruby
# Return a collection with all books.
books = Book.all

# Return a single book.
first_book = Book.first
last_book = Book.last
book = Book.take
```

The above results in the following SQL:

```sql
-- Book.all
SELECT "books".* FROM "books"

-- Book.first
SELECT "books".* FROM "books" ORDER BY "books"."id" ASC LIMIT ?  [["LIMIT", 1]]

-- Book.last
SELECT "books".* FROM "books" ORDER BY "books"."id" DESC LIMIT ?  [["LIMIT", 1]]

-- Book.take
SELECT "books".* FROM "books" LIMIT ?  [["LIMIT", 1]]
```

We can also find specific books with `find_by` and `where`. While `find_by`
returns a single record, `where` returns a list of records:

```ruby
# Returns the first book with a given title or `nil` if no book is found.
book = Book.find_by(title: "Metaprogramming Ruby 2")

# Alternative to Book.find_by(id: 42). Will throw an exception if no matching book is found.
book = Book.find(42)
```

The above resulting in this SQL:

```sql
-- Book.find_by(title: "Metaprogramming Ruby 2")
SELECT "books".* FROM "books" WHERE "books"."title" = ? LIMIT ?  [["title", "Metaprogramming Ruby 2"], ["LIMIT", 1]]

-- Book.find(42)
SELECT "books".* FROM "books" WHERE "books"."id" = ? LIMIT ?  [["id", 42], ["LIMIT", 1]]
```

```ruby
# Find all books by a given author, sort by created_at in reverse chronological order.
Book.where(author: "Douglas Adams").order(created_at: :desc)
```

resulting in this SQL:

```sql
SELECT "books".* FROM "books" WHERE "books"."author" = ? ORDER BY "books"."created_at" DESC [["author", "Douglas Adams"]]
```

There are many more Active Record methods to read and query records. You can
learn more about them in the [Active Record Query](active_record_querying.html) guide.

### Update

Once an Active Record object has been retrieved, its attributes can be modified
and it can be saved to the database.

```ruby
book = Book.find_by(title: "The Lord of the Rings")
book.title = "The Lord of the Rings: The Fellowship of the Ring"
book.save
```

A shorthand for this is to use a hash mapping attribute names to the desired
value, like so:

```ruby
book = Book.find_by(title: "The Lord of the Rings")
book.update(title: "The Lord of the Rings: The Fellowship of the Ring")
```

the `update` results in the following SQL:

```sql
/* Note that `updated_at` is automatically set. */

 UPDATE "books" SET "title" = ?, "updated_at" = ? WHERE "books"."id" = ?  [["title", "The Lord of the Rings: The Fellowship of the Ring"], ["updated_at", "2024-02-22 20:51:13.487064"], ["id", 104]]
```

This is useful when updating several attributes at once. Similar to `create`,
using `update` will commit the updated records to the database.

If you'd like to update several records in bulk **without callbacks or
validations**, you can update the database directly using `update_all`:

```ruby
Book.update_all(status: "already own")
```

### Delete

Likewise, once retrieved, an Active Record object can be destroyed, which
removes it from the database.

```ruby
book = Book.find_by(title: "The Lord of the Rings")
book.destroy
```

The `destroy` results in this SQL:

```sql
DELETE FROM "books" WHERE "books"."id" = ?  [["id", 104]]
```

If you'd like to delete several records in bulk, you may use `destroy_by`
or `destroy_all` method:

```ruby
# Find and delete all books by Douglas Adams.
Book.destroy_by(author: "Douglas Adams")

# Delete all books.
Book.destroy_all
```

Additionally, if you'd like to delete several records **without callbacks or
validations**, you can delete records directly from the database using `delete` and `delete_all` methods:

```ruby
Book.find_by(title: "The Lord of the Rings").delete
Book.delete_all
```

Validations
-----------

Active Record allows you to validate the state of a model before it gets written
into the database. There are several methods that allow for different types of
validations. For example, validate that an attribute value is not empty, is
unique, is not already in the database, follows a specific format, and many
more.

Methods like `save`, `create` and `update` validate a model before persisting it
to the database. If the model is invalid, no database operations are performed. In
this case the `save` and `update` methods return `false`. The `create` method still
returns the object, which can be checked for errors. All of these
methods have a bang counterpart (that is, `save!`, `create!` and `update!`),
which are stricter in that they raise an `ActiveRecord::RecordInvalid` exception
when validation fails. A quick example to illustrate:

```ruby
class User < ApplicationRecord
  validates :name, presence: true
end
```

```irb
irb> user = User.new
irb> user.save
=> false
irb> user.save!
ActiveRecord::RecordInvalid: Validation failed: Name can't be blank
```

The `create` method always returns the model, regardless of
its validity. You can then inspect this model for any errors.

```irb
irb> user = User.create
=> #<User:0x000000013e8b5008 id: nil, name: nil>
irb> user.errors.full_messages
=> ["Name can't be blank"]
```

You can learn more about validations in the [Active Record Validations
guide](active_record_validations.html).

Callbacks
---------

Active Record callbacks allow you to attach code to certain events in the
lifecycle of your models. This enables you to add behavior to your models by
executing code when those events occur, like when you create a new record,
update it, destroy it, and so on.

```ruby
class User < ApplicationRecord
  after_create :log_new_user

  private
    def log_new_user
      puts "A new user was registered"
    end
end
```

```irb
irb> @user = User.create
A new user was registered
```

You can learn more about callbacks in the [Active Record Callbacks
guide](active_record_callbacks.html).

Migrations
----------

Rails provides a convenient way to manage changes to a database schema via
migrations. Migrations are written in a domain-specific language and stored in
files which are executed against any database that Active Record supports.

Here's a migration that creates a new table called `publications`:

```ruby
class CreatePublications < ActiveRecord::Migration[8.2]
  def change
    create_table :publications do |t|
      t.string :title
      t.text :description
      t.references :publication_type
      t.references :publisher, polymorphic: true
      t.boolean :single_issue

      t.timestamps
    end
  end
end
```

Note that the above code is database-agnostic: it will run in MySQL, MariaDB,
PostgreSQL, SQLite, and others.

Rails keeps track of which migrations have been committed to the database and
stores them in a neighboring table in that same database called
`schema_migrations`.

To run the migration and create the table, you'd run `bin/rails db:migrate`, and
to roll it back and delete the table, `bin/rails db:rollback`.

You can learn more about migrations in the [Active Record Migrations
guide](active_record_migrations.html).

Associations
------------

Active Record associations allow you to define relationships between models.
Associations can be used to describe one-to-one, one-to-many, and many-to-many
relationships. For example, a relationship like “Author has many Books” can be
defined as follows:

```ruby
class Author < ApplicationRecord
  has_many :books
end
```

The `Author` class now has methods to add and remove books to an author, and
much more.

You can learn more about associations in the [Active Record Associations
guide](association_basics.html).
