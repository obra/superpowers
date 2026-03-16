**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Record Validations
=========================

This guide teaches you how to validate Active Record objects before saving them
to the database using Active Record's validations feature.

After reading this guide, you will know:

* How to use the built-in Active Record validations and options.
* How to check the validity of objects.
* How to create conditional and strict validations.
* How to create your own custom validation methods.
* How to work with the validation error messages and displaying them in views.

--------------------------------------------------------------------------------

Validations Overview
--------------------

Here's an example of a very simple validation:

```ruby
class Person < ApplicationRecord
  validates :name, presence: true
end
```

```irb
irb> Person.new(name: "John Doe").valid?
=> true
irb> Person.new(name: nil).valid?
=> false
```

As you can see, the `Person` is not valid without a `name` attribute.

Before we dig into more details, let's talk about how validations fit into the
big picture of your application.

### Why Use Validations?

Validations are used to ensure that only valid data is saved into your database.
For example, it may be important to your application to ensure that every user
provides a valid email address and mailing address. Model-level validations are
the best way to ensure that only valid data is saved into your database. They
can be used with any database, cannot be bypassed by end users, and are
convenient to test and maintain. Rails provides built-in helpers for common
needs, and allows you to create your own validation methods as well.


### Alternate Ways to Validate

There are several other ways to validate data before it is saved into your
database, including native database constraints, client-side validations and
controller-level validations. Here's a summary of the pros and cons:

* Database constraints and/or stored procedures make the validation mechanisms
  database-dependent and can make testing and maintenance more difficult.
  However, if your database is used by other applications, it may be a good idea
  to use some constraints at the database level. Additionally, database-level
  validations can safely handle some things (such as uniqueness in heavily-used
  tables) that can be difficult to implement otherwise.
* Client-side validations can be useful, but are generally unreliable if used
  alone. If they are implemented using JavaScript, they may be bypassed if
  JavaScript is turned off in the user's browser. However, if combined with
  other techniques, client-side validation can be a convenient way to provide
  users with immediate feedback as they use your site.
* Controller-level validations can be tempting to use, but often become unwieldy
  and difficult to test and maintain. Whenever possible, it's a good idea to
  keep your controllers simple, as it will make working with your application
  easier in the long run.

Rails recommends using model-level validations in most circumstances, however
there may be specific cases where you want to complement them with alternate
validations.

### Validation Triggers

There are two kinds of Active Record objects - those that correspond to a row
inside your database and those that do not. When you instantiate a new object,
using the `new` method, the object does not get saved in the database as yet.
Once you call `save` on that object, it will be saved into the appropriate
database table. Active Record uses an instance method called `persisted?` (and
its inverse `new_record?`) to determine whether an object is already in the
database or not. Consider the following Active Record class:

```ruby
class Person < ApplicationRecord
end
```

We can see how it works by looking at some `bin/rails console` output:

```irb
irb> p = Person.new(name: "Jane Doe")
=> #<Person id: nil, name: "Jane Doe", created_at: nil, updated_at: nil>

irb> p.new_record?
=> true

irb> p.persisted?
=> false

irb> p.save
=> true

irb> p.new_record?
=> false

irb> p.persisted?
=> true
```

Saving a new record will send an SQL `INSERT` operation to the database, whereas
updating an existing record will send an SQL `UPDATE` operation. Validations are
typically run before these commands are sent to the database. If any validations
fail, the object will be marked as invalid and Active Record will not perform
the `INSERT` or `UPDATE` operation. This helps to avoid storing an invalid
object in the database. You can choose to have specific validations run when an
object is created, saved, or updated.

WARNING: While validations usually prevent invalid data from being saved to the
database, it's important to be aware that not all methods in Rails trigger
validations. Some methods allow changes to be made directly to the database
without performing validations. As a result, if you're not careful, it’s
possible to [bypass validations](#skipping-validations) and save an object in an
invalid state.

The following methods trigger validations, and will save the object to the
database only if the object is valid:

* [`create`][]
* [`create!`][]
* [`save`][]
* [`save!`][]
* [`update`][]
* [`update!`][]

The bang versions (methods that end with an exclamation mark, like `save!`)
raise an exception if the record is invalid. The non-bang versions - `save` and
`update` returns `false`, and `create` returns the object.

[`create`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence/ClassMethods.html#method-i-create
[`create!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence/ClassMethods.html#method-i-create-21
[`save`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-save
[`save!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-save-21
[`update`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update
[`update!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update-21

### Skipping Validations

The following methods skip validations, and will save the object to the database
regardless of its validity. They should be used with caution. Refer to the
method documentation to learn more.

* [`decrement!`][]
* [`decrement_counter`][]
* [`increment!`][]
* [`increment_counter`][]
* [`insert`][]
* [`insert!`][]
* [`insert_all`][]
* [`insert_all!`][]
* [`toggle!`][]
* [`touch`][]
* [`touch_all`][]
* [`update_all`][]
* [`update_attribute`][]
* [`update_attribute!`][]
* [`update_column`][]
* [`update_columns`][]
* [`update_counters`][]
* [`upsert`][]
* [`upsert_all`][]
* `save(validate: false)`

NOTE: `save` also has the ability to skip validations if `validate: false` is
passed as an argument. This technique should be used with caution.


[`decrement!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-decrement-21
[`decrement_counter`]:
    https://api.rubyonrails.org/classes/ActiveRecord/CounterCache/ClassMethods.html#method-i-decrement_counter
[`increment!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-increment-21
[`increment_counter`]:
    https://api.rubyonrails.org/classes/ActiveRecord/CounterCache/ClassMethods.html#method-i-increment_counter
[`insert`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-insert
[`insert!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-insert-21
[`insert_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-insert_all
[`insert_all!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-insert_all-21
[`toggle!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-toggle-21
[`touch`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-touch
[`touch_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-touch_all
[`update_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-update_all
[`update_attribute`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update_attribute
[`update_attribute!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update_attribute-21
[`update_column`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update_column
[`update_columns`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update_columns
[`update_counters`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-update_counters
[`upsert`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-upsert
[`upsert_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-upsert_all

### Checking Validity

Before saving an Active Record object, Rails runs your validations, and if these
validations produce any validation errors, then Rails will not save the object.

You can also run the validations on your own. [`valid?`][] triggers your
validations and returns true if no errors are found in the object, and false
otherwise. As you saw above:

```ruby
class Person < ApplicationRecord
  validates :name, presence: true
end
```

```irb
irb> Person.new(name: "John Doe").valid?
=> true
irb> Person.new(name: nil).valid?
=> false
```

After Active Record has performed validations, any failures can be accessed
through the [`errors`][] instance method, which returns a collection of errors.
By definition, an object is valid if the collection is empty after running
validations.

NOTE: An object instantiated with `new` will not report errors even if it's
technically invalid, because validations are automatically run only when the
object is saved, such as with the `create` or `save` methods.

```ruby
class Person < ApplicationRecord
  validates :name, presence: true
end
```

```irb
irb> person = Person.new
=> #<Person id: nil, name: nil, created_at: nil, updated_at: nil>
irb> person.errors.size
=> 0

irb> person.valid?
=> false
irb> person.errors.objects.first.full_message
=> "Name can't be blank"

irb> person.save
=> false

irb> person.save!
ActiveRecord::RecordInvalid: Validation failed: Name can't be blank

irb> Person.create!
ActiveRecord::RecordInvalid: Validation failed: Name can't be blank
```

[`invalid?`][] is the inverse of `valid?`. It triggers your validations,
returning true if any errors were found in the object, and false otherwise.

[`errors`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations.html#method-i-errors
[`invalid?`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations.html#method-i-invalid-3F
[`valid?`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Validations.html#method-i-valid-3F

### Inspecting and Handling Errors

To verify whether or not a particular attribute of an object is valid, you can
use [`errors[:attribute]`][Errors#squarebrackets]. It returns an array of all
the error messages for `:attribute`. If there are no errors on the specified
attribute, an empty array is returned. This allows you to easily determine
whether there are any validation issues with a specific attribute.

Here’s an example illustrating how to check for errors on an attribute:

```ruby
class Person < ApplicationRecord
  validates :name, presence: true
end
```

```irb
irb> new_person = Person.new
irb> new_person.errors[:name]
=> [] # no errors since validations are not run until saved
irb> new_person.errors[:name].any?
=> false

irb> create_person = Person.create
irb> create_person.errors[:name]
=> ["can't be blank"] # validation error because `name` is required
irb> create_person.errors[:name].any?
=> true
```

Additionally, you can use the
[`errors.add`](https://api.rubyonrails.org/classes/ActiveModel/Errors.html#method-i-add)
method to manually add error messages for specific attributes. This is
particularly useful when defining custom validation scenarios.

```ruby
class Person < ApplicationRecord
  validate do |person|
    errors.add :name, :too_short, message: "is not long enough"
  end
end
```

NOTE: To read about validation errors in greater depth refer to the [Working
with Validation Errors](#working-with-validation-errors) section.

[Errors#squarebrackets]:
    https://api.rubyonrails.org/classes/ActiveModel/Errors.html#method-i-5B-5D

Validations
-----------

Active Record offers many predefined validations that you can use directly
inside your class definitions. These predefined validations provide common
validation rules. Each time a validation fails, an error message is added to the
object's `errors` collection, and this error is associated with the specific
attribute being validated.

When a validation fails, the error message is stored in the `errors` collection
under the attribute name that triggered the validation. This means you can
easily access the errors related to any specific attribute. For instance, if you
validate the `:name` attribute and the validation fails, you will find the error
message under `errors[:name]`.

In modern Rails applications, the more concise validate syntax is commonly used,
for example:

```ruby
validates :name, presence: true
```

However, older versions of Rails used "helper" methods, such as:

```ruby
validates_presence_of :name
```

Both notations perform the same function, but the newer form is recommended for
its readability and alignment with Rails' conventions.

Each validation accepts an arbitrary number of attribute names, allowing you to
apply the same type of validation to multiple attributes in a single line of
code.

Additionally, all validations accept the `:on` and `:message` options. The `:on`
option specifies when the validation should be triggered, with possible values
being `:create` or `:update`. The `:message` option allows you to define a
custom error message that will be added to the errors collection if the
validation fails. If you do not specify a message, Rails will use a default
error message for that validation.

INFO: To see a list of the available default helpers, take a look at
[`ActiveModel::Validations::HelperMethods`][]. This API section uses the older
notation as described above.

[`ActiveModel::Validations::HelperMethods`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations/HelperMethods.html

Below we outline the most commonly used validations.

### `absence`

This validator validates that the specified attributes are absent. It uses the
[`Object#present?`][] method to check if the value is neither nil nor a blank
string - that is, a string that is either empty or consists of whitespace only.

`#absence` is commonly used for conditional validations. For example:

```ruby
class Person < ApplicationRecord
  validates :phone_number, :address, absence: true, if: :invited?
end
```

```irb
irb> person = Person.new(name: "Jane Doe", invitation_sent_at: Time.current)
irb> person.valid?
=> true # absence validation passes
```

If you want to be sure that an association is absent, you'll need to test
whether the associated object itself is absent, and not the foreign key used to
map the association.

```ruby
class LineItem < ApplicationRecord
  belongs_to :order, optional: true
  validates :order, absence: true
end
```

```irb
irb> line_item = LineItem.new
irb> line_item.valid?
=> true # absence validation passes

order = Order.create
irb> line_item_with_order = LineItem.new(order: order)
irb> line_item_with_order.valid?
=> false # absence validation fails
```

NOTE: For `belongs_to` the association presence is validated by default. If you
don’t want to have association presence validated, use `optional: true`.

Rails will usually infer the inverse association automatically. In cases where
you use a custom `:foreign_key` or a `:through` association, it's important to
explicitly set the `:inverse_of` option to optimize the association lookup. This
helps avoid unnecessary database queries during validation.

For more details, check out the [Bi-directional Associations
documentation](association_basics.html#bi-directional-associations).

NOTE: If you want to ensure that the association is both present and valid, you
also need to use `validates_associated`. More on that in the
[validates_associated section](#validates-associated).

If you validate the absence of an object associated via a
[`has_one`](association_basics.html#the-has-one-association) or
[`has_many`](association_basics.html#the-has-many-association) relationship, it
will check that the object is neither `present?` nor `marked_for_destruction?`.

Since `false.present?` is false, if you want to validate the absence of a
boolean field you should use:

```ruby
validates :field_name, exclusion: { in: [true, false] }
```

The default error message is _"must be blank"_.

[`Object#present?`]:
    https://api.rubyonrails.org/classes/Object.html#method-i-present-3F

### `acceptance`

This method validates that a checkbox on the user interface was checked when a
form was submitted. This is typically used when the user needs to agree to your
application's terms of service, confirm that some text is read, or any similar
concept.

```ruby
class Person < ApplicationRecord
  validates :terms_of_service, acceptance: true
end
```

This check is performed only if `terms_of_service` is not `nil`. The default
error message for this validation is _"must be accepted"_. You can also pass in
a custom message via the `message` option.

```ruby
class Person < ApplicationRecord
  validates :terms_of_service, acceptance: { message: "must be agreed to" }
end
```

It can also receive an `:accept` option, which determines the allowed values
that will be considered as acceptable. It defaults to `['1', true]` and can be
easily changed.

```ruby
class Person < ApplicationRecord
  validates :terms_of_service, acceptance: { accept: "yes" }
  validates :eula, acceptance: { accept: ["TRUE", "accepted"] }
end
```

This validation is very specific to web applications and this 'acceptance' does
not need to be recorded anywhere in your database. If you don't have a field for
it, the validator will create a virtual attribute. If the field does exist in
your database, the `accept` option must be set to or include `true` or else the
validation will not run.

### `confirmation`

You should use this validator when you have two text fields that should receive
exactly the same content. For example, you may want to confirm an email address
or a password. This validation creates a virtual attribute whose name is the
name of the field that has to be confirmed with "_confirmation" appended.

```ruby
class Person < ApplicationRecord
  validates :email, confirmation: true
end
```

In your view template you could use something like

```erb
<%= text_field :person, :email %>
<%= text_field :person, :email_confirmation %>
```

NOTE: This check is performed only if `email_confirmation` is not `nil`. To
require confirmation, make sure to add a presence check for the confirmation
attribute (we'll take a look at the [`presence`](#presence) check later on in
this guide):

```ruby
class Person < ApplicationRecord
  validates :email, confirmation: true
  validates :email_confirmation, presence: true
end
```

There is also a `:case_sensitive` option that you can use to define whether the
confirmation constraint will be case sensitive or not. This option defaults to
true.

```ruby
class Person < ApplicationRecord
  validates :email, confirmation: { case_sensitive: false }
end
```

The default error message for this validator is _"doesn't match confirmation"_.
You can also pass in a custom message via the `message` option.

Generally when using this validator, you will want to combine it with the `:if`
option to only validate the "_confirmation" field when the initial field has
changed and **not** every time you save the record. More on [conditional
validations](#conditional-validations) later.

```ruby
class Person < ApplicationRecord
  validates :email, confirmation: true
  validates :email_confirmation, presence: true, if: :email_changed?
end
```

### `comparison`

This validator will validate a comparison between any two comparable values.

```ruby
class Promotion < ApplicationRecord
  validates :end_date, comparison: { greater_than: :start_date }
end
```

The default error message for this validator is _"failed comparison"_. You can
also pass in a custom message via the `message` option.

These options are all supported:

| Option                      | Description                                                              | Default Error Message                       |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| `:greater_than`             | Specifies the value must be greater than the supplied value.             | "must be greater than %{count}"             |
| `:greater_than_or_equal_to` | Specifies the value must be greater than or equal to the supplied value. | "must be greater than or equal to %{count}" |
| `:equal_to`                 | Specifies the value must be equal to the supplied value.                 | "must be equal to %{count}"                 |
| `:less_than`                | Specifies the value must be less than the supplied value.                | "must be less than %{count}"                |
| `:less_than_or_equal_to`    | Specifies the value must be less than or equal to the supplied value.    | "must be less than or equal to %{count}"    |
| `:other_than`               | Specifies the value must be other than the supplied value.               | "must be other than %{count}"               |

NOTE: The validator requires a compare option be supplied. Each option accepts a
value, proc, or symbol. Any class that includes
[Comparable](https://docs.ruby-lang.org/en/master/Comparable.html) can be compared.

### `format`

This validator validates the attributes' values by testing whether they match a
given regular expression, which is specified using the `:with` option.

```ruby
class Product < ApplicationRecord
  validates :legacy_code, format: { with: /\A[a-zA-Z]+\z/,
    message: "only allows letters" }
end
```

Inversely, by using the `:without` option instead you can require that the
specified attribute does _not_ match the regular expression.

In either case, the provided `:with` or `:without` option must be a regular
expression or a proc or lambda that returns one.

The default error message is _"is invalid"_.

WARNING: Use `\A` and `\z` to match the start and end of the string, `^` and `$`
match the start/end of a line. Due to frequent misuse of `^` and `$`, you need
to pass the `multiline: true` option in case you use any of these two anchors in
the provided regular expression. In most cases, you should be using `\A` and
`\z`.

### `inclusion` and `exclusion`

Both of these validators validate whether an attribute’s value is included or
excluded from a given set. The set can be any enumerable object such as an
array, range, or a dynamically generated collection using a proc, lambda, or
symbol.

- **`inclusion`** ensures that the value is present in the set.
- **`exclusion`** ensures that the value is *not* present in the set.

In both cases, the option `:in` receives the set of values, and `:within` can be
used as an alias. For full options on customizing error messages, see the
[message documentation](#message).

If the enumerable is a numerical, time, or datetime range, the test is performed
using `Range#cover?`, otherwise, it uses `include?`. When using a proc or
lambda, the instance under validation is passed as an argument, allowing for
dynamic validation.

#### Examples

For `inclusion`:

```ruby
class Coffee < ApplicationRecord
  validates :size, inclusion: { in: %w(small medium large),
    message: "%{value} is not a valid size" }
end
```

For `exclusion`:

```ruby
class Account < ApplicationRecord
  validates :subdomain, exclusion: { in: %w(www us ca jp),
    message: "%{value} is reserved." }
end
```

Both validators allow the use of dynamic validation through methods that return
an enumerable. Here’s an example using a proc for `inclusion`:

```ruby
class Coffee < ApplicationRecord
  validates :size, inclusion: { in: ->(coffee) { coffee.available_sizes } }

  def available_sizes
    %w(small medium large extra_large)
  end
end
```

Similarly, for `exclusion`:

```ruby
class Account < ApplicationRecord
  validates :subdomain, exclusion: { in: ->(account) { account.reserved_subdomains } }

  def reserved_subdomains
    %w(www us ca jp admin)
  end
end
```

### `length`

This validator validates the length of the attributes' values. It provides a
variety of options, so you can specify length constraints in different ways:

```ruby
class Person < ApplicationRecord
  validates :name, length: { minimum: 2 }
  validates :bio, length: { maximum: 500 }
  validates :password, length: { in: 6..20 }
  validates :registration_number, length: { is: 6 }
end
```

The possible length constraint options are:

| Option     | Description                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `:minimum` | The attribute cannot have less than the specified length.                                             |
| `:maximum` | The attribute cannot have more than the specified length.                                             |
| `:in`      | The attribute length must be included in a given interval. The value for this option must be a range. |
| `:is`      | The attribute length must be equal to the given value.                                                |

The default error messages depend on the type of length validation being
performed. You can customize these messages using the `:wrong_length`,
`:too_long`, and `:too_short` options and `%{count}` as a placeholder for the
number corresponding to the length constraint being used. You can still use the
`:message` option to specify an error message.

```ruby
class Person < ApplicationRecord
  validates :bio, length: { maximum: 1000,
    too_long: "%{count} characters is the maximum allowed" }
end
```

NOTE: The default error messages are plural (e.g. "is too short (minimum is
%{count} characters)"). For this reason, when `:minimum` is 1 you should provide
a custom message or use `presence: true` instead. Similarly, when `:in` or
`:within` have a lower limit of 1, you should either provide a custom message or
call `presence` prior to `length`. Only one constraint option can be used at a
time apart from the `:minimum` and `:maximum` options which can be combined
together.

### `numericality`

This validator validates that your attributes have only numeric values. By
default, it will match an optional sign followed by an integer or floating point
number.

To specify that only integer numbers are allowed, set `:only_integer` to true.
Then it will use the following regular expression to validate the attribute's
value.

```ruby
/\A[+-]?\d+\z/
```

Otherwise, it will try to convert the value to a number using `Float`. `Float`s
are converted to `BigDecimal` using the column's precision value or a maximum of
15 digits.

```ruby
class Player < ApplicationRecord
  validates :points, numericality: true
  validates :games_played, numericality: { only_integer: true }
end
```

The default error message for `:only_integer` is _"must be an integer"_.

Besides `:only_integer`, this validator also accepts the `:only_numeric` option
which specifies the value must be an instance of `Numeric` and attempts to parse
the value if it is a `String`.

NOTE: By default, `numericality` doesn't allow `nil` values. You can use
`allow_nil: true` option to permit it. For `Integer` and `Float` columns empty
strings are converted to `nil`.

The default error message when no options are specified is _"is not a number"_.

There are also many options that can be used to add constraints to acceptable
values:

| Option                      | Description                                                              | Default Error Message                       |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| `:greater_than`             | Specifies the value must be greater than the supplied value.             | "must be greater than %{count}"             |
| `:greater_than_or_equal_to` | Specifies the value must be greater than or equal to the supplied value. | "must be greater than or equal to %{count}" |
| `:equal_to`                 | Specifies the value must be equal to the supplied value.                 | "must be equal to %{count}"                 |
| `:less_than`                | Specifies the value must be less than the supplied value.                | "must be less than %{count}"                |
| `:less_than_or_equal_to`    | Specifies the value must be less than or equal to the supplied value.    | "must be less than or equal to %{count}"    |
| `:other_than`               | Specifies the value must be other than the supplied value.               | "must be other than %{count}"               |
| `:in`                       | Specifies the value must be in the supplied range.                       | "must be in %{count}"                       |
| `:odd`                      | Specifies the value must be an odd number.                               | "must be odd"                               |
| `:even`                     | Specifies the value must be an even number.                              | "must be even"                              |


### `presence`

This validator validates that the specified attributes are not empty. It uses
the [`Object#blank?`][] method to check if the value is either `nil` or a blank
string - that is, a string that is either empty or consists of whitespace.

```ruby
class Person < ApplicationRecord
  validates :name, :login, :email, presence: true
end
```

```irb
person = Person.new(name: "Alice", login: "alice123", email: "alice@example.com")
person.valid?
=> true # presence validation passes

invalid_person = Person.new(name: "", login: nil, email: "bob@example.com")
invalid_person.valid?
=> false # presence validation fails
```

To check that an association is present, you'll need to test that the associated
object is present, and not the foreign key used to map the association. Testing
the association will help you to determine that the foreign key is not empty and
also that the referenced object exists.

```ruby
class Supplier < ApplicationRecord
  has_one :account
  validates :account, presence: true
end
```

```irb
irb> account = Account.create(name: "Account A")

irb> supplier = Supplier.new(account: account)
irb> supplier.valid?
=> true # presence validation passes

irb> invalid_supplier = Supplier.new
irb> invalid_supplier.valid?
=> false # presence validation fails
```

In cases where you use a custom `:foreign_key` or a `:through` association, it's
important to explicitly set the `:inverse_of` option to optimize the association
lookup. This helps avoid unnecessary database queries during validation.

For more details, check out the [Bi-directional Associations
documentation](association_basics.html#bi-directional-associations).

NOTE: If you want to ensure that the association is both present and valid, you
also need to use `validates_associated`. More on that
[below](#validates-associated).

If you validate the presence of an object associated via a
[`has_one`](association_basics.html#the-has-one-association) or
[`has_many`](association_basics.html#the-has-many-association) relationship, it
will check that the object is neither `blank?` nor `marked_for_destruction?`.

Since `false.blank?` is true, if you want to validate the presence of a boolean
field you should use one of the following validations:

```ruby
# Value _must_ be true or false
validates :boolean_field_name, inclusion: [true, false]
# Value _must not_ be nil, aka true or false
validates :boolean_field_name, exclusion: [nil]
```

By using one of these validations, you will ensure the value will NOT be `nil`
which would result in a `NULL` value in most cases.

The default error message is _"can't be blank"_.

[`Object#blank?`]:
    https://api.rubyonrails.org/classes/Object.html#method-i-blank-3F

### `uniqueness`

This validator validates that the attribute's value is unique right before the
object gets saved.

```ruby
class Account < ApplicationRecord
  validates :email, uniqueness: true
end
```

The validation happens by performing an SQL query into the model's table,
searching for an existing record with the same value in that attribute.

There is a `:scope` option that you can use to specify one or more attributes
that are used to limit the uniqueness check:

```ruby
class Holiday < ApplicationRecord
  validates :name, uniqueness: { scope: :year,
    message: "should happen once per year" }
end
```

WARNING. This validation does not create a uniqueness constraint in the
database, so a scenario can occur whereby two different database connections
create two records with the same value for a column that you intended to be
unique. To avoid this, you must create a unique index on that column in your
database.

In order to add a uniqueness database constraint on your database, use the
[`add_index`][] statement in a migration and include the `unique: true` option.

If you are using the `:scope` option in your uniqueness validation, and you wish
to create a database constraint to prevent possible violations of the uniqueness
validation, you must create a unique index on both columns in your database. See
[the MySQL manual][] and [the MariaDB manual][] for more details about multiple
column indexes, or [the PostgreSQL manual][] for examples of unique constraints
that refer to a group of columns.

There is also a `:case_sensitive` option that you can use to define whether the
uniqueness constraint will be case sensitive, case insensitive, or if it should
respect the default database collation. This option defaults to respecting the
default database collation.

```ruby
class Person < ApplicationRecord
  validates :name, uniqueness: { case_sensitive: false }
end
```

WARNING: Some databases are configured to perform case-insensitive searches
anyway.

A `:conditions` option can be used to specify additional conditions as a `WHERE`
SQL fragment to limit the uniqueness constraint lookup:

```ruby
validates :name, uniqueness: { conditions: -> { where(status: "active") } }
```

The default error message is _"has already been taken"_.

See [`validates_uniqueness_of`][] for more information.

[`validates_uniqueness_of`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Validations/ClassMethods.html#method-i-validates_uniqueness_of
[`add_index`]:
    https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_index
[the MySQL manual]:
    https://dev.mysql.com/doc/refman/en/multiple-column-indexes.html
[the MariaDB manual]: https://mariadb.com/kb/en/compound-composite-indexes/
[the PostgreSQL manual]:
    https://www.postgresql.org/docs/current/static/ddl-constraints.html

### `validates_associated`

You should use this validator when your model has associations that always need
to be validated. Every time you try to save your object, `valid?` will be called
on each one of the associated objects.

```ruby
class Library < ApplicationRecord
  has_many :books
  validates_associated :books
end
```

This validation will work with all of the association types.

WARNING: Don't use `validates_associated` on both ends of your associations.
They would call each other in an infinite loop.

The default error message for [`validates_associated`][] is _"is invalid"_. Note
that each associated object will contain its own `errors` collection; errors do
not bubble up to the calling model.

NOTE: [`validates_associated`][] can only be used with ActiveRecord objects,
everything up until now can also be used on any object which includes
[`ActiveModel::Validations`][].

[`validates_associated`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Validations/ClassMethods.html#method-i-validates_associated

### `validates_each`

This validator validates attributes against a block. It doesn't have a
predefined validation function. You should create one using a block, and every
attribute passed to [`validates_each`][] will be tested against it.

In the following example, we will reject names and surnames that begin with
lowercase.

```ruby
class Person < ApplicationRecord
  validates_each :name, :surname do |record, attr, value|
    record.errors.add(attr, "must start with upper case") if /\A[[:lower:]]/.match?(value)
  end
end
```

The block receives the record, the attribute's name, and the attribute's value.

You can do anything you like to check for valid data within the block. If your
validation fails, you should add an error to the model, therefore making it
invalid.

[`validates_each`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations/ClassMethods.html#method-i-validates_each

### `validates_with`

This validator passes the record to a separate class for validation.

```ruby
class AddressValidator < ActiveModel::Validator
  def validate(record)
    if record.house_number.blank?
      record.errors.add :house_number, "is required"
    end

    if record.street.blank?
      record.errors.add :street, "is required"
    end

    if record.postcode.blank?
      record.errors.add :postcode, "is required"
    end
  end
end

class Invoice < ApplicationRecord
  validates_with AddressValidator
end
```

There is no default error message for `validates_with`. You must manually add
errors to the record's errors collection in the validator class.

NOTE: Errors added to `record.errors[:base]` relate to the state of the record
as a whole.

To implement the validate method, you must accept a `record` parameter in the
method definition, which is the record to be validated.

If you want to add an error on a specific attribute, you can pass it as the
first argument to the `add` method.

```ruby
def validate(record)
  if record.some_field != "acceptable"
    record.errors.add :some_field, "this field is unacceptable"
  end
end
```

We will cover [validation errors](#working-with-validation-errors) in greater
detail later.

The [`validates_with`][] validator takes a class, or a list of classes to use
for validation.

```ruby
class Person < ApplicationRecord
  validates_with MyValidator, MyOtherValidator, on: :create
end
```

Like all other validations, `validates_with` takes the `:if`, `:unless` and
`:on` options. If you pass any other options, it will send those options to the
validator class as `options`:

```ruby
class AddressValidator < ActiveModel::Validator
  def validate(record)
    options[:fields].each do |field|
      if record.send(field).blank?
        record.errors.add field, "is required"
      end
    end
  end
end

class Invoice < ApplicationRecord
  validates_with AddressValidator, fields: [:house_number, :street, :postcode, :country]
end
```

NOTE: The validator will be initialized *only once* for the whole application
life cycle, and not on each validation run, so be careful about using instance
variables inside it.

If your validator is complex enough that you want instance variables, you can
easily use a plain old Ruby object instead:

```ruby
class Invoice < ApplicationRecord
  validate do |invoice|
    AddressValidator.new(invoice).validate
  end
end

class AddressValidator
  def initialize(invoice)
    @invoice = invoice
  end

  def validate
    validate_field(:house_number)
    validate_field(:street)
    validate_field(:postcode)
  end

  private
    def validate_field(field)
      if @invoice.send(field).blank?
        @invoice.errors.add field, "#{field.to_s.humanize} is required"
      end
    end
end
```

We will cover [custom validations](#performing-custom-validations) more later.

[`validates_with`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations/ClassMethods.html#method-i-validates_with

Validation Options
------------------

There are several common options supported by the validators. These options are:

* [`:allow_nil`](#allow-nil): Skip validation if the attribute is `nil`.
* [`:allow_blank`](#allow-blank): Skip validation if the attribute is blank.
* [`:message`](#message): Specify a custom error message.
* [`:on`](#on): Specify the contexts where this validation is active.
* [`:strict`](#strict-validations): Raise an exception when the validation
  fails.
* [`:if` and `:unless`](#conditional-validations): Specify when the validation
  should or should not occur.

NOTE: Not all of these options are supported by every validator, please refer to
the API documentation for [`ActiveModel::Validations`][].

[`ActiveModel::Validations`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations.html

### `:allow_nil`

The `:allow_nil` option skips the validation when the value being validated is
`nil`.

```ruby
class Coffee < ApplicationRecord
  validates :size, inclusion: { in: %w(small medium large),
    message: "%{value} is not a valid size" }, allow_nil: true
end
```

```irb
irb> Coffee.create(size: nil).valid?
=> true
irb> Coffee.create(size: "mega").valid?
=> false
```

For full options to the message argument please see the [message
documentation](#message).

### `:allow_blank`

The `:allow_blank` option is similar to the `:allow_nil` option. This option
will let validation pass if the attribute's value is `blank?`, like `nil` or an
empty string for example.

```ruby
class Topic < ApplicationRecord
  validates :title, length: { is: 6 }, allow_blank: true
end
```

```irb
irb> Topic.create(title: "").valid?
=> true
irb> Topic.create(title: nil).valid?
=> true
irb> Topic.create(title: "short").valid?
=> false # 'short' is not of length 6, so validation fails even though it's not blank
```

### `:message`

As you've already seen, the `:message` option lets you specify the message that
will be added to the `errors` collection when validation fails. When this option
is not used, Active Record will use the respective default error message for
each validation.

The `:message` option accepts either a `String` or `Proc` as its value.

A `String` `:message` value can optionally contain any/all of `%{value}`,
`%{attribute}`, and `%{model}` which will be dynamically replaced when
validation fails. This replacement is done using the [i18n
gem](https://github.com/ruby-i18n/i18n), and the placeholders must match
exactly, no spaces are allowed.

```ruby
class Person < ApplicationRecord
  # Hard-coded message
  validates :name, presence: { message: "must be given please" }

  # Message with dynamic attribute value. %{value} will be replaced
  # with the actual value of the attribute. %{attribute} and %{model}
  # are also available.
  validates :age, numericality: { message: "%{value} seems wrong" }
end
```

A `Proc` `:message` value is given two arguments: the object being validated,
and a hash with `:model`, `:attribute`, and `:value` key-value pairs.

```ruby
class Person < ApplicationRecord
  validates :username,
    uniqueness: {
      # object = person object being validated
      # data = { model: "Person", attribute: "Username", value: <username> }
      message: ->(object, data) do
        "Hey #{object.name}, #{data[:value]} is already taken."
      end
    }
end
```

To translate error messages, see the [I18n
guide](i18n.html#error-message-scopes).

### `:on`

The `:on` option lets you specify when the validation should happen. The default
behavior for all the built-in validations is to be run on save (both when you're
creating a new record and when you're updating it). If you want to change it,
you can use `on: :create` to run the validation only when a new record is
created or `on: :update` to run the validation only when a record is updated.

```ruby
class Person < ApplicationRecord
  # it will be possible to update email with a duplicated value
  validates :email, uniqueness: true, on: :create

  # it will be possible to create the record with a non-numerical age
  validates :age, numericality: true, on: :update

  # the default (validates on both create and update)
  validates :name, presence: true
end
```

You can also use `:on` to define custom contexts. Custom contexts need to be
triggered explicitly by passing the name of the context to `valid?`, `invalid?`,
or `save`.

```ruby
class Person < ApplicationRecord
  validates :email, uniqueness: true, on: :account_setup
  validates :age, numericality: true, on: :account_setup
end
```

```irb
irb> person = Person.new(age: 'thirty-three')
irb> person.valid?
=> true
irb> person.valid?(:account_setup)
=> false
irb> person.errors.messages
=> {:email=>["has already been taken"], :age=>["is not a number"]}
```

`person.valid?(:account_setup)` executes both the validations without saving the
model. `person.save(context: :account_setup)` validates `person` in the
`account_setup` context before saving.

Passing an array of symbols is also acceptable.

```ruby
class Book
  include ActiveModel::Validations

  validates :title, presence: true, on: [:update, :ensure_title]
end
```

```irb
irb> book = Book.new(title: nil)
irb> book.valid?
=> true
irb> book.valid?(:ensure_title)
=> false
irb> book.errors.messages
=> {:title=>["can't be blank"]}
```

When triggered by an explicit context, validations are run for that context, as
well as any validations _without_ a context.

```ruby
class Person < ApplicationRecord
  validates :email, uniqueness: true, on: :account_setup
  validates :age, numericality: true, on: :account_setup
  validates :name, presence: true
end
```

```irb
irb> person = Person.new
irb> person.valid?(:account_setup)
=> false
irb> person.errors.messages
=> {:email=>["has already been taken"], :age=>["is not a number"], :name=>["can't be blank"]}
```

You can read more about use-cases for `:on` in the [Custom Contexts
section](#custom-contexts).

Conditional Validations
-----------------------

Sometimes it will make sense to validate an object only when a given condition
is met. You can do that by using the `:if` and `:unless` options, which can take
a symbol, a `Proc` or an `Array`. You may use the `:if` option when you want to
specify when the validation **should** happen. Alternatively, if you want to
specify when the validation **should not** happen, then you may use the
`:unless` option.

### Using a Symbol with `:if` and `:unless`

You can associate the `:if` and `:unless` options with a symbol corresponding to
the name of a method that will get called right before validation happens. This
is the most commonly used option.

```ruby
class Order < ApplicationRecord
  validates :card_number, presence: true, if: :paid_with_card?

  def paid_with_card?
    payment_type == "card"
  end
end
```

### Using a Proc with `:if` and `:unless`

It is possible to associate `:if` and `:unless` with a `Proc` object which will
be called. Using a `Proc` object gives you the ability to write an inline
condition instead of a separate method. This option is best suited for
one-liners.

```ruby
class Account < ApplicationRecord
  validates :password, confirmation: true,
    unless: Proc.new { |a| a.password.blank? }
end
```

As `lambda` is a type of `Proc`, it can also be used to write inline conditions
taking advantage of the shortened syntax.

```ruby
validates :password, confirmation: true, unless: -> { password.blank? }
```

### Grouping Conditional Validations

Sometimes it is useful to have multiple validations use one condition. It can be
easily achieved using [`with_options`][].

```ruby
class User < ApplicationRecord
  with_options if: :is_admin? do |admin|
    admin.validates :password, length: { minimum: 10 }
    admin.validates :email, presence: true
  end
end
```

All validations inside of the `with_options` block will automatically have `if:
:is_admin?` merged into its options.

[`with_options`]:
    https://api.rubyonrails.org/classes/Object.html#method-i-with_options

### Combining Validation Conditions

On the other hand, when multiple conditions define whether or not a validation
should happen, an `Array` can be used. Moreover, you can apply both `:if` and
`:unless` to the same validation.

```ruby
class Computer < ApplicationRecord
  validates :mouse, presence: true,
                    if: [Proc.new { |c| c.market.retail? }, :desktop?],
                    unless: Proc.new { |c| c.trackpad.present? }
end
```

The validation only runs when all the `:if` conditions and none of the `:unless`
conditions are evaluated to `true`.

Strict Validations
------------------

You can also specify validations to be strict and raise
`ActiveModel::StrictValidationFailed` when the object is invalid.

```ruby
class Person < ApplicationRecord
  validates :name, presence: { strict: true }
end
```

```irb
irb> Person.new.valid?
=> ActiveModel::StrictValidationFailed: Name can't be blank
```

Strict validations ensure that an exception is raised immediately when
validation fails, which can be useful in situations where you want to enforce
immediate feedback or halt processing when invalid data is encountered. For
example, you might use strict validations in a scenario where invalid input
should prevent further operations, such as when processing critical transactions
or performing data integrity checks.

There is also the ability to pass a custom exception to the `:strict` option.

```ruby
class Person < ApplicationRecord
  validates :token, presence: true, uniqueness: true, strict: TokenGenerationException
end
```

```irb
irb> Person.new.valid?
=> TokenGenerationException: Token can't be blank
```

Listing Validators
------------------

If you want to find out all of the validators for a given object, you can use
`validators`.

For example, if we have the following model using a custom validator and a
built-in validator:

```ruby
class Person < ApplicationRecord
  validates :name, presence: true, on: :create
  validates :email, format: URI::MailTo::EMAIL_REGEXP
  validates_with MyOtherValidator, strict: true
end
```

We can now use `validators` on the "Person" model to list all validators, or
even check a specific field using `validators_on`.

```irb
irb> Person.validators
#=> [#<ActiveRecord::Validations::PresenceValidator:0x10b2f2158
      @attributes=[:name], @options={:on=>:create}>,
     #<MyOtherValidatorValidator:0x10b2f17d0
      @attributes=[:name], @options={:strict=>true}>,
     #<ActiveModel::Validations::FormatValidator:0x10b2f0f10
      @attributes=[:email],
      @options={:with=>URI::MailTo::EMAIL_REGEXP}>]
     #<MyOtherValidator:0x10b2f0948 @options={:strict=>true}>]

irb> Person.validators_on(:name)
#=> [#<ActiveModel::Validations::PresenceValidator:0x10b2f2158
      @attributes=[:name], @options={on: :create}>]
```

[`validate`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations/ClassMethods.html#method-i-validate

Performing Custom Validations
-----------------------------

When the built-in validations are not enough for your needs, you can write your
own validators or validation methods as you prefer.

### Custom Validators

Custom validators are classes that inherit from [`ActiveModel::Validator`][].
These classes must implement the `validate` method which takes a record as an
argument and performs the validation on it. The custom validator is called using
the `validates_with` method.

```ruby
class MyValidator < ActiveModel::Validator
  def validate(record)
    unless record.name.start_with? "X"
      record.errors.add :name, "Provide a name starting with X, please!"
    end
  end
end

class Person < ApplicationRecord
  validates_with MyValidator
end
```

The easiest way to add custom validators for validating individual attributes is
with the convenient [`ActiveModel::EachValidator`][]. In this case, the custom
validator class must implement a `validate_each` method which takes three
arguments: record, attribute, and value. These correspond to the instance, the
attribute to be validated, and the value of the attribute in the passed
instance.

```ruby
class EmailValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    unless URI::MailTo::EMAIL_REGEXP.match?(value)
      record.errors.add attribute, (options[:message] || "is not an email")
    end
  end
end

class Person < ApplicationRecord
  validates :email, presence: true, email: true
end
```

As shown in the example, you can also combine standard validations with your own
custom validators.

[`ActiveModel::EachValidator`]:
    https://api.rubyonrails.org/classes/ActiveModel/EachValidator.html
[`ActiveModel::Validator`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validator.html

### Custom Methods

You can also create methods that verify the state of your models and add errors
to the `errors` collection when they are invalid. You must then register these
methods by using the [`validate`][] class method, passing in the symbols for the
validation methods' names.

You can pass more than one symbol for each class method and the respective
validations will be run in the same order as they were registered.

The `valid?` method will verify that the `errors` collection is empty, so your
custom validation methods should add errors to it when you wish validation to
fail:

```ruby
class Invoice < ApplicationRecord
  validate :expiration_date_cannot_be_in_the_past,
    :discount_cannot_be_greater_than_total_value

  def expiration_date_cannot_be_in_the_past
    if expiration_date.present? && expiration_date < Date.today
      errors.add(:expiration_date, "can't be in the past")
    end
  end

  def discount_cannot_be_greater_than_total_value
    if discount > total_value
      errors.add(:discount, "can't be greater than total value")
    end
  end
end
```

By default, such validations will run every time you call `valid?` or save the
object. But it is also possible to control when to run these custom validations
by giving an `:on` option to the `validate` method, with either: `:create` or
`:update`.

```ruby
class Invoice < ApplicationRecord
  validate :active_customer, on: :create

  def active_customer
    errors.add(:customer_id, "is not active") unless customer.active?
  end
end
```

See the section above for more details about [`:on`](#on).

### Custom Contexts

You can define your own custom validation contexts for callbacks, which is
useful when you want to perform validations based on specific scenarios or group
certain callbacks together and run them in a specific context. A common scenario
for custom contexts is when you have a multi-step form and want to perform
validations per step.

For instance, you might define custom contexts for each step of the form:

```ruby
class User < ApplicationRecord
  validate :personal_information, on: :personal_info
  validate :contact_information, on: :contact_info
  validate :location_information, on: :location_info

  private
    def personal_information
      errors.add(:base, "Name must be present") if first_name.blank?
      errors.add(:base, "Age must be at least 18") if age && age < 18
    end

    def contact_information
      errors.add(:base, "Email must be present") if email.blank?
      errors.add(:base, "Phone number must be present") if phone.blank?
    end

    def location_information
      errors.add(:base, "Address must be present") if address.blank?
      errors.add(:base, "City must be present") if city.blank?
    end
end
```

In these cases, you may be tempted to [skip
callbacks](active_record_callbacks.html#skipping-callbacks) altogether, but
defining a custom context can be a more structured approach. You will need to
combine a context with the `:on` option to define a custom context for a
callback.

Once you've defined the custom context, you can use it to trigger the
validations:

```irb
irb> user = User.new(name: "John Doe", age: 17, email: "jane@example.com", phone: "1234567890", address: "123 Main St")
irb> user.valid?(:personal_info) # => false
irb> user.valid?(:contact_info) # => true
irb> user.valid?(:location_info) # => false
```

You can also use the custom contexts to trigger the validations on any method
that supports callbacks. For example, you could use the custom context to
trigger the validations on `save`:

```irb
irb> user = User.new(name: "John Doe", age: 17, email: "jane@example.com", phone: "1234567890", address: "123 Main St")
irb> user.save(context: :personal_info) # => false
irb> user.save(context: :contact_info) # => true
irb> user.save(context: :location_info) # => false
```

Working with Validation Errors
------------------------------

The [`valid?`][] and [`invalid?`][] methods only provide a summary status on
validity. However you can dig deeper into each individual error by using various
methods from the [`errors`][] collection.

The following is a list of the most commonly used methods. Please refer to the
[`ActiveModel::Errors`][] documentation for a list of all the available methods.

[`ActiveModel::Errors`]:
    https://api.rubyonrails.org/classes/ActiveModel/Errors.html

### `errors`

The [`errors`][] method is the starting point through which you can drill down
into various details of each error.

This returns an instance of the class `ActiveModel::Errors` containing all
errors, each error is represented by an [`ActiveModel::Error`][] object.

```ruby
class Person < ApplicationRecord
  validates :name, presence: true, length: { minimum: 3 }
end
```

```irb
irb> person = Person.new
irb> person.valid?
=> false
irb> person.errors.full_messages
=> ["Name can't be blank", "Name is too short (minimum is 3 characters)"]

irb> person = Person.new(name: "John Doe")
irb> person.valid?
=> true
irb> person.errors.full_messages
=> []

irb> person = Person.new
irb> person.valid?
=> false
irb> person.errors.first.details
=> {:error=>:too_short, :count=>3}
```

[`ActiveModel::Error`]:
    https://api.rubyonrails.org/classes/ActiveModel/Error.html

### `errors[]`

[`errors[]`][Errors#squarebrackets] is used when you want to check the error
messages for a specific attribute. It returns an array of strings with all error
messages for the given attribute, each string with one error message. If there
are no errors related to the attribute, it returns an empty array.

This method is only useful _after_ validations have been run, because it only
inspects the `errors` collection and does not trigger validations itself. It's
different from the `ActiveRecord::Base#invalid?` method explained above because
it doesn't verify the validity of the object as a whole. `errors[]` only checks
to see whether there are errors found on an individual attribute of the object.

```ruby
class Person < ApplicationRecord
  validates :name, presence: true, length: { minimum: 3 }
end
```

```irb
irb> person = Person.new(name: "John Doe")
irb> person.valid?
=> true
irb> person.errors[:name]
=> []

irb> person = Person.new(name: "JD")
irb> person.valid?
=> false
irb> person.errors[:name]
=> ["is too short (minimum is 3 characters)"]

irb> person = Person.new
irb> person.valid?
=> false
irb> person.errors[:name]
=> ["can't be blank", "is too short (minimum is 3 characters)"]
```

### `errors.where` and Error Object

Sometimes we may need more information about each error besides its message.
Each error is encapsulated as an `ActiveModel::Error` object, and the
[`where`][] method is the most common way of access.

`where` returns an array of error objects filtered by various degrees of
conditions.

Given the following validation:

```ruby
class Person < ApplicationRecord
  validates :name, presence: true, length: { minimum: 3 }
end
```

We can filter for just the `attribute` by passing it as the first parameter to
`errors.where(:attr)`. The second parameter is used for filtering the `type` of
error we want by calling `errors.where(:attr, :type)`.

```irb
irb> person = Person.new
irb> person.valid?
=> false

irb> person.errors.where(:name)
=> [ ... ] # all errors for :name attribute

irb> person.errors.where(:name, :too_short)
=> [ ... ] # :too_short errors for :name attribute
```

Lastly, we can filter by any `options` that may exist on the given type of error
object.

```irb
irb> person = Person.new
irb> person.valid?
=> false

irb> person.errors.where(:name, :too_short, minimum: 3)
=> [ ... ] # all name errors being too short and minimum is 3
```

You can read various information from these error objects:

```irb
irb> error = person.errors.where(:name).last

irb> error.attribute
=> :name
irb> error.type
=> :too_short
irb> error.options[:count]
=> 3
```

You can also generate the error message:

```irb
irb> error.message
=> "is too short (minimum is 3 characters)"
irb> error.full_message
=> "Name is too short (minimum is 3 characters)"
```

The [`full_message`][] method generates a more user-friendly message, with the
capitalized attribute name prepended. (To customize the format that
`full_message` uses, see the [I18n guide](i18n.html#active-model-methods).)

[`full_message`]:
    https://api.rubyonrails.org/classes/ActiveModel/Errors.html#method-i-full_message
[`where`]:
    https://api.rubyonrails.org/classes/ActiveModel/Errors.html#method-i-where

### `errors.add`

The [`add`][] method creates the error object by taking the `attribute`, the
error `type` and additional options hash. This is useful when writing your own
validator, as it lets you define very specific error situations.

```ruby
class Person < ApplicationRecord
  validate do |person|
    errors.add :name, :too_plain, message: "is not cool enough"
  end
end
```

```irb
irb> person = Person.new
irb> person.errors.where(:name).first.type
=> :too_plain
irb> person.errors.where(:name).first.full_message
=> "Name is not cool enough"
```

[`add`]:
    https://api.rubyonrails.org/classes/ActiveModel/Errors.html#method-i-add

### `errors[:base]`

You can add errors that are related to the object's state as a whole, instead of
being related to a specific attribute. To do this you must use `:base` as the
attribute when adding a new error.

```ruby
class Person < ApplicationRecord
  validate do |person|
    errors.add :base, :invalid, message: "This person is invalid because ..."
  end
end
```

```irb
irb> person = Person.new
irb> person.errors.where(:base).first.full_message
=> "This person is invalid because ..."
```

### `errors.size`

The `size` method returns the total number of errors for the object.

```ruby
class Person < ApplicationRecord
  validates :name, presence: true, length: { minimum: 3 }
end
```

```irb
irb> person = Person.new
irb> person.valid?
=> false
irb> person.errors.size
=> 2

irb> person = Person.new(name: "Andrea", email: "andrea@example.com")
irb> person.valid?
=> true
irb> person.errors.size
=> 0
```

### `errors.clear`

The `clear` method is used when you intentionally want to clear the `errors`
collection. Of course, calling `errors.clear` upon an invalid object won't
actually make it valid: the `errors` collection will now be empty, but the next
time you call `valid?` or any method that tries to save this object to the
database, the validations will run again. If any of the validations fail, the
`errors` collection will be filled again.

```ruby
class Person < ApplicationRecord
  validates :name, presence: true, length: { minimum: 3 }
end
```

```irb
irb> person = Person.new
irb> person.valid?
=> false
irb> person.errors.empty?
=> false

irb> person.errors.clear
irb> person.errors.empty?
=> true

irb> person.save
=> false

irb> person.errors.empty?
=> false
```

Displaying Validation Errors in Views
-------------------------------------

Once you've defined a model and added validations, you'll want to display an
error message when a validation fails during the creation of that model via a
web form.

Since every application handles displaying validation errors differently, Rails
does not include any view helpers for generating these messages. However, Rails
gives you a rich number of methods to interact with validations that you can use
to build your own. In addition, when generating a scaffold, Rails will put some
generated ERB into the `_form.html.erb` that displays the full list of errors on
that model.

Assuming we have a model that's been saved in an instance variable named
`@article`, it looks like this:

```html+erb
<% if @article.errors.any? %>
  <div id="error_explanation">
    <h2><%= pluralize(@article.errors.count, "error") %> prohibited this article from being saved:</h2>

    <ul>
      <% @article.errors.each do |error| %>
        <li><%= error.full_message %></li>
      <% end %>
    </ul>
  </div>
<% end %>
```

Furthermore, if you use the Rails form helpers to generate your forms, when a
validation error occurs on a field, it will generate an extra `<div>` around the
entry.

```html
<div class="field_with_errors">
  <input id="article_title" name="article[title]" size="30" type="text" value="">
</div>
```

You can then style this div however you'd like. The default scaffold that Rails
generates, for example, adds this CSS rule:

```css
.field_with_errors {
  padding: 2px;
  background-color: red;
  display: table;
}
```

This means that any field with an error ends up with a 2 pixel red border.

### Customizing Error Field Wrapper

Rails uses the `field_error_proc` configuration option to wrap fields with
errors in HTML. By default, this option wraps the erroneous form fields in a
`<div>` with a `field_with_errors` class, as seen in the example above:

```ruby
config.action_view.field_error_proc = Proc.new { |html_tag, instance| content_tag :div, html_tag, class: "field_with_errors" }
```

You can customize this behavior by modifying the field_error_proc setting in
your application configuration, allowing you to change how errors are presented
in your forms. For more details, refer to the [Configuration Guide on
field_error_proc](configuring.html#config-action-view-field-error-proc).
