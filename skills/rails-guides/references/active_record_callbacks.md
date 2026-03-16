**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Record Callbacks
=======================

This guide teaches you how to hook into the life cycle of your Active Record
objects.

After reading this guide, you will know:

* When certain events occur during the life of an Active Record object.
* How to register, run, and skip callbacks that respond to these events.
* How to create relational, association, conditional, and transactional
  callbacks.
* How to create objects that encapsulate common behavior for your callbacks to
  be reused.

--------------------------------------------------------------------------------

The Object Life Cycle
---------------------

During the normal operation of a Rails application, objects may be [created,
updated, and
destroyed](active_record_basics.html#crud-reading-and-writing-data). Active
Record provides hooks into this object life cycle so that you can control your
application and its data.

Callbacks allow you to trigger logic before or after a change to an object's
state. They are methods that get called at certain moments of an object's life
cycle. With callbacks it is possible to write code that will run whenever an
Active Record object is initialized, created, saved, updated, deleted,
validated, or loaded from the database.

```ruby
class BirthdayCake < ApplicationRecord
  after_create -> { Rails.logger.info("Congratulations, the callback has run!") }
end
```

```irb
irb> BirthdayCake.create
Congratulations, the callback has run!
```

As you will see, there are many life cycle events and multiple options to hook
into these — either before, after, or even around them.

Callback Registration
---------------------

To use the available callbacks, you need to implement and register them.
Implementation can be done in a multitude of ways like using ordinary methods,
blocks and procs, or defining custom callback objects using classes or modules.
Let's go through each of these implementation techniques.

You can register the callbacks with a **macro-style class method that calls an
ordinary method** for implementation.

```ruby
class User < ApplicationRecord
  validates :username, :email, presence: true

  before_validation :ensure_username_has_value

  private
    def ensure_username_has_value
      if username.blank?
        self.username = email
      end
    end
end
```

The **macro-style class methods can also receive a block**. Consider using this
style if the code inside your block is so short that it fits in a single line:

```ruby
class User < ApplicationRecord
  validates :username, :email, presence: true

  before_validation do
    self.username = email if username.blank?
  end
end
```

Alternatively, you can **pass a proc to the callback** to be triggered.

```ruby
class User < ApplicationRecord
  validates :username, :email, presence: true

  before_validation ->(user) { user.username = user.email if user.username.blank? }
end
```

Lastly, you can define [**a custom callback object**](#callback-objects), as
shown below. We will cover these later in more detail.

```ruby
class User < ApplicationRecord
  validates :username, :email, presence: true

  before_validation AddUsername
end

class AddUsername
  def self.before_validation(record)
    if record.username.blank?
      record.username = record.email
    end
  end
end
```

### Registering Callbacks to Fire on Life Cycle Events

Callbacks can also be registered to only fire on certain life cycle events, this
can be done using the `:on` option and allows complete control over when and in
what context your callbacks are triggered.

NOTE: A context is like a category or a scenario in which you want certain
validations to apply. When you validate an ActiveRecord model, you can specify a
context to group validations. This allows you to have different sets of
validations that apply in different situations. In Rails, there are certain
default contexts for validations like :create, :update, and :save.

```ruby
class User < ApplicationRecord
  validates :username, :email, presence: true

  before_validation :ensure_username_has_value, on: :create

  # :on takes an array as well
  after_validation :set_location, on: [ :create, :update ]

  private
    def ensure_username_has_value
      if username.blank?
        self.username = email
      end
    end

    def set_location
      self.location = LocationService.query(self)
    end
end
```

NOTE: It is considered good practice to declare callback methods as private. If
left public, they can be called from outside of the model and violate the
principle of object encapsulation.

WARNING. Refrain from using methods like `update`, `save`, or any other methods
that cause side effects on the object within your callback methods. <br><br>
For instance, avoid calling `update(attribute: "value")` inside a callback. This
practice can modify the model's state and potentially lead to unforeseen side
effects during commit. <br><br> Instead, you can assign values directly (e.g.,
`self.attribute = "value"`) in `before_create`, `before_update`, or earlier
callbacks for a safer approach.

Available Callbacks
-------------------

Here is a list with all the available Active Record callbacks, listed **in the
order in which they will get called** during the respective operations:

### Creating an Object

* [`before_validation`][]
* [`after_validation`][]
* [`before_save`][]
* [`around_save`][]
* [`before_create`][]
* [`around_create`][]
* [`after_create`][]
* [`after_save`][]
* [`after_commit`][] / [`after_rollback`][]

See the [`after_commit` / `after_rollback`
section](active_record_callbacks.html#after-commit-and-after-rollback) for
examples using these two callbacks.

[`after_create`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-after_create
[`after_commit`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html#method-i-after_commit
[`after_rollback`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html#method-i-after_rollback
[`after_save`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-after_save
[`after_validation`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations/Callbacks/ClassMethods.html#method-i-after_validation
[`around_create`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-around_create
[`around_save`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-around_save
[`before_create`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-before_create
[`before_save`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-before_save
[`before_validation`]:
    https://api.rubyonrails.org/classes/ActiveModel/Validations/Callbacks/ClassMethods.html#method-i-before_validation

There are examples below that show how to use these callbacks. We've grouped
them by the operation they are associated with, and lastly show how they can be
used in combination.

#### Validation Callbacks

Validation callbacks are triggered whenever the record is validated directly via
the
[`valid?`](https://api.rubyonrails.org/classes/ActiveModel/Validations.html#method-i-valid-3F)
( or its alias
[`validate`](https://api.rubyonrails.org/classes/ActiveModel/Validations.html#method-i-validate))
or
[`invalid?`](https://api.rubyonrails.org/classes/ActiveModel/Validations.html#method-i-invalid-3F)
method, or indirectly via `create`, `update`, or `save`. They are called before
and after the validation phase.

```ruby
class User < ApplicationRecord
  validates :name, presence: true
  before_validation :titleize_name
  after_validation :log_errors

  private
    def titleize_name
      self.name = name.downcase.titleize if name.present?
      Rails.logger.info("Name titleized to #{name}")
    end

    def log_errors
      if errors.any?
        Rails.logger.error("Validation failed: #{errors.full_messages.join(', ')}")
      end
    end
end
```

```irb
irb> user = User.new(name: "", email: "john.doe@example.com", password: "abc123456")
=> #<User id: nil, email: "john.doe@example.com", created_at: nil, updated_at: nil, name: "">

irb> user.valid?
Name titleized to
Validation failed: Name can't be blank
=> false
```

#### Save Callbacks

Save callbacks are triggered whenever the record is persisted (i.e. "saved") to
the underlying database, via the `create`, `update`, or `save` methods. They are
called before, after, and around the object is saved.

```ruby
class User < ApplicationRecord
  before_save :hash_password
  around_save :log_saving
  after_save :update_cache

  private
    def hash_password
      self.password_digest = BCrypt::Password.create(password)
      Rails.logger.info("Password hashed for user with email: #{email}")
    end

    def log_saving
      Rails.logger.info("Saving user with email: #{email}")
      yield
      Rails.logger.info("User saved with email: #{email}")
    end

    def update_cache
      Rails.cache.write(["user_data", self], attributes)
      Rails.logger.info("Update Cache")
    end
end
```

```irb
irb> user = User.create(name: "Jane Doe", password: "password", email: "jane.doe@example.com")

Password hashed for user with email: jane.doe@example.com
Saving user with email: jane.doe@example.com
User saved with email: jane.doe@example.com
Update Cache
=> #<User id: 1, email: "jane.doe@example.com", created_at: "2024-03-20 16:02:43.685500000 +0000", updated_at: "2024-03-20 16:02:43.685500000 +0000", name: "Jane Doe">
```

#### Create Callbacks

Create callbacks are triggered whenever the record is persisted (i.e. "saved")
to the underlying database **for the first time** — in other words, when we're
saving a new record, via the `create` or `save` methods. They are called before,
after and around the object is created.

```ruby
class User < ApplicationRecord
  before_create :set_default_role
  around_create :log_creation
  after_create :send_welcome_email

  private
    def set_default_role
      self.role = "user"
      Rails.logger.info("User role set to default: user")
    end

    def log_creation
      Rails.logger.info("Creating user with email: #{email}")
      yield
      Rails.logger.info("User created with email: #{email}")
    end

    def send_welcome_email
      UserMailer.welcome_email(self).deliver_later
      Rails.logger.info("User welcome email sent to: #{email}")
    end
end
```

```irb
irb> user = User.create(name: "John Doe", email: "john.doe@example.com")

User role set to default: user
Creating user with email: john.doe@example.com
User created with email: john.doe@example.com
User welcome email sent to: john.doe@example.com
=> #<User id: 10, email: "john.doe@example.com", created_at: "2024-03-20 16:19:52.405195000 +0000", updated_at: "2024-03-20 16:19:52.405195000 +0000", name: "John Doe">
```

### Updating an Object

Update callbacks are triggered whenever an **existing** record is persisted
(i.e. "saved") to the underlying database. They are called before, after and
around the object is updated.

* [`before_validation`][]
* [`after_validation`][]
* [`before_save`][]
* [`around_save`][]
* [`before_update`][]
* [`around_update`][]
* [`after_update`][]
* [`after_save`][]
* [`after_commit`][] / [`after_rollback`][]

[`after_update`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-after_update
[`around_update`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-around_update
[`before_update`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-before_update

WARNING: The `after_save` callback is triggered on both create and update
operations. However, it consistently executes after the more specific callbacks
`after_create` and `after_update`, regardless of the sequence in which the macro
calls were made. Similarly, before and around save callbacks follow the same
rule: `before_save` runs before create/update, and `around_save` runs around
create/update operations. It's important to note that save callbacks will always
run before/around/after the more specific create/update callbacks.

We've already covered [validation](#validation-callbacks) and
[save](#save-callbacks) callbacks. See the [`after_commit` /
`after_rollback` section](#after-commit-and-after-rollback) for examples using
these two callbacks.

#### Update Callbacks

```ruby
class User < ApplicationRecord
  before_update :check_role_change
  around_update :log_updating
  after_update :send_update_email

  private
    def check_role_change
      if role_changed?
        Rails.logger.info("User role changed to #{role}")
      end
    end

    def log_updating
      Rails.logger.info("Updating user with email: #{email}")
      yield
      Rails.logger.info("User updated with email: #{email}")
    end

    def send_update_email
      UserMailer.update_email(self).deliver_later
      Rails.logger.info("Update email sent to: #{email}")
    end
end
```

```irb
irb> user = User.find(1)
=> #<User id: 1, email: "john.doe@example.com", created_at: "2024-03-20 16:19:52.405195000 +0000", updated_at: "2024-03-20 16:19:52.405195000 +0000", name: "John Doe", role: "user" >

irb> user.update(role: "admin")
User role changed to admin
Updating user with email: john.doe@example.com
User updated with email: john.doe@example.com
Update email sent to: john.doe@example.com
```

#### Using a Combination of Callbacks

Often, you will need to use a combination of callbacks to achieve the desired
behavior. For example, you may want to send a confirmation email after a user is
created, but only if the user is new and not being updated. When a user is
updated, you may want to notify an admin if critical information is changed. In
this case, you can use `after_create` and `after_update` callbacks together.

```ruby
class User < ApplicationRecord
  after_create :send_confirmation_email
  after_update :notify_admin_if_critical_info_updated

  private
    def send_confirmation_email
      UserMailer.confirmation_email(self).deliver_later
      Rails.logger.info("Confirmation email sent to: #{email}")
    end

    def notify_admin_if_critical_info_updated
      if saved_change_to_email? || saved_change_to_phone_number?
        AdminMailer.user_critical_info_updated(self).deliver_later
        Rails.logger.info("Notification sent to admin about critical info update for: #{email}")
      end
    end
end
```

```irb
irb> user = User.create(name: "John Doe", email: "john.doe@example.com")
Confirmation email sent to: john.doe@example.com
=> #<User id: 1, email: "john.doe@example.com", ...>

irb> user.update(email: "john.doe.new@example.com")
Notification sent to admin about critical info update for: john.doe.new@example.com
=> true
```

### Destroying an Object

Destroy callbacks are triggered whenever a record is destroyed, but ignored when
a record is deleted. They are called before, after and around the object is
destroyed.

* [`before_destroy`][]
* [`around_destroy`][]
* [`after_destroy`][]
* [`after_commit`][] / [`after_rollback`][]

[`after_destroy`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-after_destroy
[`around_destroy`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-around_destroy
[`before_destroy`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-before_destroy

Find [examples for using `after_commit` /
`after_rollback`](#after-commit-and-after-rollback).

#### Destroy Callbacks

```ruby
class User < ApplicationRecord
  before_destroy :check_admin_count
  around_destroy :log_destroy_operation
  after_destroy :notify_users

  private
    def check_admin_count
      if admin? && User.where(role: "admin").count == 1
        throw :abort
      end
      Rails.logger.info("Checked the admin count")
    end

    def log_destroy_operation
      Rails.logger.info("About to destroy user with ID #{id}")
      yield
      Rails.logger.info("User with ID #{id} destroyed successfully")
    end

    def notify_users
      UserMailer.deletion_email(self).deliver_later
      Rails.logger.info("Notification sent to other users about user deletion")
    end
end
```

```irb
irb> user = User.find(1)
=> #<User id: 1, email: "john.doe@example.com", created_at: "2024-03-20 16:19:52.405195000 +0000", updated_at: "2024-03-20 16:19:52.405195000 +0000", name: "John Doe", role: "admin">

irb> user.destroy
Checked the admin count
About to destroy user with ID 1
User with ID 1 destroyed successfully
Notification sent to other users about user deletion
```

### `after_initialize` and `after_find`

Whenever an Active Record object is instantiated, either by directly using `new`
or when a record is loaded from the database, the [`after_initialize`][]
callback will be called. It can be useful to avoid the need to directly override
your Active Record `initialize` method.

When loading a record from the database the [`after_find`][] callback will be
called. `after_find` is called before `after_initialize` if both are defined.

NOTE: The `after_initialize` and `after_find` callbacks have no `before_*`
counterparts.

They can be registered just like the other Active Record callbacks.

```ruby
class User < ApplicationRecord
  after_initialize do |user|
    Rails.logger.info("You have initialized an object!")
  end

  after_find do |user|
    Rails.logger.info("You have found an object!")
  end
end
```

```irb
irb> User.new
You have initialized an object!
=> #<User id: nil>

irb> User.first
You have found an object!
You have initialized an object!
=> #<User id: 1>
```

[`after_find`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-after_find
[`after_initialize`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-after_initialize

### `after_touch`

The [`after_touch`][] callback will be called whenever an Active Record object
is touched. You can [read more about `touch` in the API
docs](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-touch).

```ruby
class User < ApplicationRecord
  after_touch do |user|
    Rails.logger.info("You have touched an object")
  end
end
```

```irb
irb> user = User.create(name: "Kuldeep")
=> #<User id: 1, name: "Kuldeep", created_at: "2013-11-25 12:17:49", updated_at: "2013-11-25 12:17:49">

irb> user.touch
You have touched an object
=> true
```

It can be used along with `belongs_to`:

```ruby
class Book < ApplicationRecord
  belongs_to :library, touch: true
  after_touch do
    Rails.logger.info("A Book was touched")
  end
end

class Library < ApplicationRecord
  has_many :books
  after_touch :log_when_books_or_library_touched

  private
    def log_when_books_or_library_touched
      Rails.logger.info("Book/Library was touched")
    end
end
```

```irb
irb> book = Book.last
=> #<Book id: 1, library_id: 1, created_at: "2013-11-25 17:04:22", updated_at: "2013-11-25 17:05:05">

irb> book.touch # triggers book.library.touch
A Book was touched
Book/Library was touched
=> true
```

[`after_touch`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Callbacks/ClassMethods.html#method-i-after_touch

Running Callbacks
-----------------

The following methods trigger callbacks:

* `create`
* `create!`
* `destroy`
* `destroy!`
* `destroy_all`
* `destroy_by`
* `save`
* `save!`
* `save(validate: false)`
* `save!(validate: false)`
* `toggle!`
* `touch`
* `update_attribute`
* `update_attribute!`
* `update`
* `update!`
* `valid?`
* `validate`

Additionally, the `after_find` callback is triggered by the following finder
methods:

* `all`
* `first`
* `find`
* `find_by`
* `find_by!`
* `find_by_*`
* `find_by_*!`
* `find_by_sql`
* `last`
* `sole`
* `take`

The `after_initialize` callback is triggered every time a new object of the
class is initialized.

NOTE: The `find_by_*` and `find_by_*!` methods are dynamic finders generated
automatically for every attribute. Learn more about them in the [Dynamic finders
section](active_record_querying.html#dynamic-finders).

Conditional Callbacks
---------------------

As with [validations](active_record_validations.html), we can also make the
calling of a callback method conditional on the satisfaction of a given
predicate. We can do this using the `:if` and `:unless` options, which can take
a symbol, a `Proc` or an `Array`.

You may use the `:if` option when you want to specify under which conditions the
callback **should** be called. If you want to specify the conditions under which
the callback **should not** be called, then you may use the `:unless` option.

### Using `:if` and `:unless` with a `Symbol`

You can associate the `:if` and `:unless` options with a symbol corresponding to
the name of a predicate method that will get called right before the callback.

When using the `:if` option, the callback **won't** be executed if the predicate
method returns **false**; when using the `:unless` option, the callback
**won't** be executed if the predicate method returns **true**. This is the most
common option.

```ruby
class Order < ApplicationRecord
  before_save :normalize_card_number, if: :paid_with_card?
end
```

Using this form of registration it is also possible to register several
different predicates that should be called to check if the callback should be
executed. We will cover this in the [Multiple Callback Conditions
section](#multiple-callback-conditions).

### Using `:if` and `:unless` with a `Proc`

It is possible to associate `:if` and `:unless` with a `Proc` object. This
option is best suited when writing short validation methods, usually one-liners:

```ruby
class Order < ApplicationRecord
  before_save :normalize_card_number,
    if: ->(order) { order.paid_with_card? }
end
```

Since the proc is evaluated in the context of the object, it is also possible to
write this as:

```ruby
class Order < ApplicationRecord
  before_save :normalize_card_number, if: -> { paid_with_card? }
end
```

### Multiple Callback Conditions

The `:if` and `:unless` options also accept an array of procs or method names as
symbols:

```ruby
class Comment < ApplicationRecord
  before_save :filter_content,
    if: [:subject_to_parental_control?, :untrusted_author?]
end
```

You can easily include a proc in the list of conditions:

```ruby
class Comment < ApplicationRecord
  before_save :filter_content,
    if: [:subject_to_parental_control?, -> { untrusted_author? }]
end
```

### Using Both `:if` and `:unless`

Callbacks can mix both `:if` and `:unless` in the same declaration:

```ruby
class Comment < ApplicationRecord
  before_save :filter_content,
    if: -> { forum.parental_control? },
    unless: -> { author.trusted? }
end
```

The callback only runs when all the `:if` conditions and none of the `:unless`
conditions are evaluated to `true`.

Skipping Callbacks
------------------

Just as with [validations](active_record_validations.html), it is also possible
to skip callbacks by using the following methods:

* [`decrement!`][]
* [`decrement_counter`][]
* [`delete`][]
* [`delete_all`][]
* [`delete_by`][]
* [`increment!`][]
* [`increment_counter`][]
* [`insert`][]
* [`insert!`][]
* [`insert_all`][]
* [`insert_all!`][]
* [`touch_all`][]
* [`update_column`][]
* [`update_columns`][]
* [`update_all`][]
* [`update_counters`][]
* [`upsert`][]
* [`upsert_all`][]

Let's consider a `User` model where the `before_save` callback logs any changes
to the user's email address:

```ruby
class User < ApplicationRecord
  before_save :log_email_change

  private
    def log_email_change
      if email_changed?
        Rails.logger.info("Email changed from #{email_was} to #{email}")
      end
    end
end
```

Now, suppose there's a scenario where you want to update the user's email
address without triggering the `before_save` callback to log the email change.
You can use the `update_columns` method for this purpose:

```irb
irb> user = User.find(1)
irb> user.update_columns(email: 'new_email@example.com')
```

The above will update the user's email address without triggering the
`before_save` callback.

WARNING. These methods should be used with caution because there may be
important business rules and application logic in callbacks that you do not want
to bypass. Bypassing them without understanding the potential implications may
lead to invalid data.

[`decrement!`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-decrement-21
[`decrement_counter`]:
    https://api.rubyonrails.org/classes/ActiveRecord/CounterCache/ClassMethods.html#method-i-decrement_counter
[`delete`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-delete
[`delete_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-delete_all
[`delete_by`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-delete_by
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
[`touch_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-touch_all
[`update_column`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update_column
[`update_columns`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-update_columns
[`update_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-update_all
[`update_counters`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-update_counters
[`upsert`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-upsert
[`upsert_all`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-upsert_all

Suppressing Saving
------------------

In certain scenarios, you may need to temporarily prevent records from being
saved within your callbacks.
This can be useful if you have a record with complex nested associations and want
to skip saving specific records during certain operations without permanently disabling
the callbacks or introducing complex conditional logic.

Rails provides a mechanism to prevent saving records using the
[`ActiveRecord::Suppressor` module](https://api.rubyonrails.org/classes/ActiveRecord/Suppressor.html).
By using this module, you can wrap a block of code where you want to avoid
saving records of a specific type that otherwise would be saved by the code block.

Let's consider a scenario where a user has many notifications.
Creating a `User` will automatically create a `Notification` record as well.

```ruby
class User < ApplicationRecord
  has_many :notifications

  after_create :create_welcome_notification

  def create_welcome_notification
    notifications.create(event: "sign_up")
  end
end

class Notification < ApplicationRecord
  belongs_to :user
end
```

To create a user without creating a notification, we can use the
ActiveRecord::Suppressor module as follows:

```ruby
Notification.suppress do
  User.create(name: "Jane", email: "jane@example.com")
end
```

In the above code, the `Notification.suppress` block ensures that the
`Notification` is not saved during the creation of the "Jane" user.

WARNING: Using the Active Record Suppressor can introduce complexity and
unexpected behavior. Suppressing saving can obscure the intended flow of your
application, leading to difficulties in understanding and maintaining the
codebase over time. Carefully consider the implications of using the suppressor,
ensuring thorough documentation and thoughtful testing to mitigate
risks of unintended side effects and test failures.

Halting Execution
-----------------

As you start registering new callbacks for your models, they will be queued for
execution. This queue will include all of your model's validations, the
registered callbacks, and the database operation to be executed.

The whole callback chain is wrapped in a transaction. If any callback raises an
exception, the execution chain gets halted and a **rollback** is issued, and the
error will be re-raised.

```ruby
class Product < ActiveRecord::Base
  before_validation do
    raise "Price can't be negative" if total_price < 0
  end
end

Product.create # raises "Price can't be negative"
```

This unexpectedly breaks code that does not expect methods like `create` and
`save` to raise exceptions.

NOTE: If an exception occurs during the callback chain, Rails will re-raise it
unless it is an `ActiveRecord::Rollback` or `ActiveRecord::RecordInvalid`
exception. Instead, you should use `throw :abort` to intentionally halt the
chain. If any callback throws `:abort`, the process will be aborted and `create`
will return false.

```ruby
class Product < ActiveRecord::Base
  before_validation do
    throw :abort if total_price < 0
  end
end

Product.create # => false
```

However, it will raise an `ActiveRecord::RecordNotSaved` when calling `create!`.
This exception indicates that the record was not saved due to the callback's
interruption.

```ruby
Product.create! # => raises an ActiveRecord::RecordNotSaved
```


When `throw :abort` is called in any destroy callback, `destroy` will return
false:

```ruby
class User < ActiveRecord::Base
  before_destroy do
    throw :abort if still_active?
  end
end

User.first.destroy # => false
```

However, it will raise an `ActiveRecord::RecordNotDestroyed` when calling
`destroy!`.

```ruby
User.first.destroy! # => raises an ActiveRecord::RecordNotDestroyed
```

Association Callbacks
---------------------

Association callbacks are similar to normal callbacks, but they are triggered by
events in the life cycle of the associated collection. There are four available
association callbacks:

* `before_add`
* `after_add`
* `before_remove`
* `after_remove`

You can define association callbacks by adding options to the association.

Suppose you have an example where an author can have many books. However, before
adding a book to the authors collection, you want to ensure that the author has
not reached their book limit. You can do this by adding a `before_add` callback
to check the limit.

```ruby
class Author < ApplicationRecord
  has_many :books, before_add: :check_limit

  private
    def check_limit(_book)
      if books.count >= 5
        errors.add(:base, "Cannot add more than 5 books for this author")
        throw(:abort)
      end
    end
end
```

If a `before_add` callback throws `:abort`, the object does not get added to the
collection.

At times you may want to perform multiple actions on the associated object. In
this case, you can stack callbacks on a single event by passing them as an
array. Additionally, Rails passes the object being added or removed to the
callback for you to use.

```ruby
class Author < ApplicationRecord
  has_many :books, before_add: [:check_limit, :calculate_shipping_charges]

  def check_limit(_book)
    if books.count >= 5
      errors.add(:base, "Cannot add more than 5 books for this author")
      throw(:abort)
    end
  end

  def calculate_shipping_charges(book)
    weight_in_pounds = book.weight_in_pounds || 1
    shipping_charges = weight_in_pounds * 2

    shipping_charges
  end
end
```

Similarly, if a `before_remove` callback throws `:abort`, the object does not
get removed from the collection.

NOTE: These callbacks are called only when the associated objects are added or
removed through the association collection.

```ruby
# Triggers `before_add` callback
author.books << book
author.books = [book, book2]

# Does not trigger the `before_add` callback
book.update(author_id: 1)
```

Cascading Association Callbacks
-------------------------------

Callbacks can be performed when associated objects are changed. They work
through the model associations whereby life cycle events can cascade on
associations and fire callbacks.

Suppose an example where a user has many articles. A user's articles should be
destroyed if the user is destroyed. Let's add an `after_destroy` callback to the
`User` model by way of its association to the `Article` model:

```ruby
class User < ApplicationRecord
  has_many :articles, dependent: :destroy
end

class Article < ApplicationRecord
  after_destroy :log_destroy_action

  def log_destroy_action
    Rails.logger.info("Article destroyed")
  end
end
```

```irb
irb> user = User.first
=> #<User id: 1>
irb> user.articles.create!
=> #<Article id: 1, user_id: 1>
irb> user.destroy
Article destroyed
=> #<User id: 1>
```

WARNING: When using a `before_destroy` callback, it should be placed before
`dependent: :destroy` associations (or use the `prepend: true` option), to
ensure they execute before the records are deleted by `dependent: :destroy`.

Transaction Callbacks
---------------------

### `after_commit` and `after_rollback`

Two additional callbacks are triggered by the completion of a database
transaction: [`after_commit`][] and [`after_rollback`][]. These callbacks are
very similar to the `after_save` callback except that they don't execute until
after database changes have either been committed or rolled back. They are most
useful when your Active Record models need to interact with external systems
that are not part of the database transaction.

Consider a `PictureFile` model that needs to delete a file after the
corresponding record is destroyed.

```ruby
class PictureFile < ApplicationRecord
  after_destroy :delete_picture_file_from_disk

  def delete_picture_file_from_disk
    if File.exist?(filepath)
      File.delete(filepath)
    end
  end
end
```

If anything raises an exception after the `after_destroy` callback is called and
the transaction rolls back, then the file will have been deleted and the model
will be left in an inconsistent state. For example, suppose that
`picture_file_2` in the code below is not valid and the `save!` method raises an
error.

```ruby
PictureFile.transaction do
  picture_file_1.destroy
  picture_file_2.save!
end
```

By using the `after_commit` callback we can account for this case.

```ruby
class PictureFile < ApplicationRecord
  after_commit :delete_picture_file_from_disk, on: :destroy

  def delete_picture_file_from_disk
    if File.exist?(filepath)
      File.delete(filepath)
    end
  end
end
```

NOTE: The `:on` option specifies when a callback will be fired. If you don't
supply the `:on` option the callback will fire for every life cycle event. [Read
more about `:on`](#registering-callbacks-to-fire-on-life-cycle-events).

When a transaction completes, the `after_commit` or `after_rollback` callbacks
are called for all models created, updated, or destroyed within that
transaction. However, if an exception is raised within one of these callbacks,
the exception will bubble up and any remaining `after_commit` or
`after_rollback` methods will _not_ be executed.

```ruby
class User < ActiveRecord::Base
  after_commit { raise "Intentional Error" }
  after_commit {
    # This won't get called because the previous after_commit raises an exception
    Rails.logger.info("This will not be logged")
  }
end
```

WARNING. If your callback code raises an exception, you'll need to rescue it and
handle it within the callback in order to allow other callbacks to run.

`after_commit` makes very different guarantees than `after_save`,
`after_update`, and `after_destroy`. For example, if an exception occurs in an
`after_save` the transaction will be rolled back and the data will not be
persisted.

```ruby
class User < ActiveRecord::Base
  after_save do
    # If this fails the user won't be saved.
    EventLog.create!(event: "user_saved")
  end
end
```

However, during `after_commit` the data was already persisted to the database,
and thus any exception won't roll anything back anymore.

```ruby
class User < ActiveRecord::Base
  after_commit do
    # If this fails the user was already saved.
    EventLog.create!(event: "user_saved")
  end
end
```

The code executed within `after_commit` or `after_rollback` callbacks is itself
not enclosed within a transaction.

In the context of a single transaction, if you represent the same record in the
database, there's a crucial behavior in the `after_commit` and `after_rollback`
callbacks to note. These callbacks are triggered only for the first object of
the specific record that changes within the transaction. Other loaded objects,
despite representing the same database record, will not have their respective
`after_commit` or `after_rollback` callbacks triggered.

```ruby
class User < ApplicationRecord
  after_commit :log_user_saved_to_db, on: :update

  private
    def log_user_saved_to_db
      Rails.logger.info("User was saved to database")
    end
end
```

```irb
irb> user = User.create
irb> User.transaction { user.save; user.save }
# User was saved to database
```

WARNING: This nuanced behavior is particularly impactful in scenarios where you
expect independent callback execution for each object associated with the same
database record. It can influence the flow and predictability of callback
sequences, leading to potential inconsistencies in application logic following
the transaction.

### Aliases for `after_commit`

Using the `after_commit` callback only on create, update, or destroy is common.
Sometimes you may also want to use a single callback for both `create` and
`update`. Here are some common aliases for these operations:

* [`after_destroy_commit`][]
* [`after_create_commit`][]
* [`after_update_commit`][]
* [`after_save_commit`][]

Let's go through some examples:

Instead of using `after_commit` with the `on` option for a destroy like below:

```ruby
class PictureFile < ApplicationRecord
  after_commit :delete_picture_file_from_disk, on: :destroy

  def delete_picture_file_from_disk
    if File.exist?(filepath)
      File.delete(filepath)
    end
  end
end
```

You can instead use the `after_destroy_commit`.

```ruby
class PictureFile < ApplicationRecord
  after_destroy_commit :delete_picture_file_from_disk

  def delete_picture_file_from_disk
    if File.exist?(filepath)
      File.delete(filepath)
    end
  end
end
```

The same applies for `after_create_commit` and `after_update_commit`.

However, if you use the `after_create_commit` and the `after_update_commit`
callback with the same method name, it will only allow the last callback defined
to take effect, as they both internally alias to `after_commit` which overrides
previously defined callbacks with the same method name.

```ruby
class User < ApplicationRecord
  after_create_commit :log_user_saved_to_db
  after_update_commit :log_user_saved_to_db

  private
    def log_user_saved_to_db
      # This only gets called once
      Rails.logger.info("User was saved to database")
    end
end
```

```irb
irb> user = User.create # prints nothing

irb> user.save # updating @user
User was saved to database
```

In this case, it's better to use `after_save_commit` instead which is an alias
for using the `after_commit` callback for both create and update:

```ruby
class User < ApplicationRecord
  after_save_commit :log_user_saved_to_db

  private
    def log_user_saved_to_db
      Rails.logger.info("User was saved to database")
    end
end
```

```irb
irb> user = User.create # creating a User
User was saved to database

irb> user.save # updating user
User was saved to database
```

### Transactional Callback Ordering

By default (from Rails 7.1), transaction callbacks will run in the order they
are defined.

```ruby
class User < ActiveRecord::Base
  after_commit { Rails.logger.info("this gets called first") }
  after_commit { Rails.logger.info("this gets called second") }
end
```

However, in prior versions of Rails, when defining multiple transactional
`after_` callbacks (`after_commit`, `after_rollback`, etc), the order in which
the callbacks were run was reversed.

If for some reason you'd still like them to run in reverse, you can set the
following configuration to `false`. The callbacks will then run in the reverse
order. See the [Active Record configuration
options](configuring.html#config-active-record-run-after-transaction-callbacks-in-order-defined)
for more details.

```ruby
config.active_record.run_after_transaction_callbacks_in_order_defined = false
```

NOTE: This applies to all `after_*_commit` variations too, such as
`after_destroy_commit`.

[`after_create_commit`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html#method-i-after_create_commit
[`after_destroy_commit`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html#method-i-after_destroy_commit
[`after_save_commit`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html#method-i-after_save_commit
[`after_update_commit`]:
    https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html#method-i-after_update_commit

### Per transaction callback

You can also register transactional callbacks such as `before_commit`, `after_commit` and `after_rollback` on a specific transaction.
This is handy in situations where you need to perform an action that isn't specific to a model but rather a unit of work.

`ActiveRecord::Base.transaction` yields an `ActiveRecord::Transaction` object, which allows registering the said callbacks on it.

```ruby
Article.transaction do |transaction|
  article.update(published: true)

  transaction.after_commit do
    PublishNotificationMailer.with(article: article).deliver_later
  end
end
```

### `ActiveRecord.after_all_transactions_commit`

[`ActiveRecord.after_all_transactions_commit`][] is a callback that allows you to run code after all the current transactions have been successfully committed to the database.

```ruby
def publish_article(article)
  Article.transaction do
    Post.transaction do
      ActiveRecord.after_all_transactions_commit do
        PublishNotificationMailer.with(article: article).deliver_later
        # An email will be sent after the outermost transaction is committed.
      end
    end
  end
end
```

A callback registered to `after_all_transactions_commit` will be triggered after the outermost transaction is committed. If any of the currently open transactions is rolled back, the block is never called.
In the event that there are no open transactions at the time a callback is registered, the block will be yielded immediately.

[`ActiveRecord.after_all_transactions_commit`]: https://api.rubyonrails.org/classes/ActiveRecord.html#method-c-after_all_transactions_commit

Callback Objects
----------------

Sometimes the callback methods that you'll write will be useful enough to be
reused by other models. Active Record makes it possible to create classes that
encapsulate the callback methods, so they can be reused.

Here's an example of an `after_commit` callback  class to deal with the cleanup
of discarded files on the filesystem. This behavior may not be unique to our
`PictureFile` model and we may want to share it, so it's a good idea to
encapsulate this into a separate class. This will make testing that behavior and
changing it much easier.

```ruby
class FileDestroyerCallback
  def after_commit(file)
    if File.exist?(file.filepath)
      File.delete(file.filepath)
    end
  end
end
```

When declared inside a class, as above, the callback methods will receive the
model object as a parameter. This will work on any model that uses the class
like so:

```ruby
class PictureFile < ApplicationRecord
  after_commit FileDestroyerCallback.new
end
```

Note that we needed to instantiate a new `FileDestroyerCallback` object, since
we declared our callback as an instance method. This is particularly useful if
the callbacks make use of the state of the instantiated object. Often, however,
it will make more sense to declare the callbacks as class methods:

```ruby
class FileDestroyerCallback
  def self.after_commit(file)
    if File.exist?(file.filepath)
      File.delete(file.filepath)
    end
  end
end
```

When the callback method is declared this way, it won't be necessary to
instantiate a new `FileDestroyerCallback` object in our model.

```ruby
class PictureFile < ApplicationRecord
  after_commit FileDestroyerCallback
end
```

You can declare as many callbacks as you want inside your callback objects.
