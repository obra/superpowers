**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Active Support Core Extensions
==============================

Active Support is the Ruby on Rails component responsible for providing Ruby
language extensions and utilities.

It offers a richer bottom-line at the language level, targeted both at the development of Rails applications, and at the development of Ruby on Rails itself.

After reading this guide, you will know:

* What Core Extensions are.
* How to load all extensions.
* How to cherry-pick just the extensions you want.
* What extensions Active Support provides.

--------------------------------------------------------------------------------

How to Load Core Extensions
---------------------------

### Stand-Alone Active Support

In order to have the smallest default footprint possible, Active Support loads the minimum dependencies by default. It is broken in small pieces so that only the desired extensions can be loaded. It also has some convenience entry points to load related extensions in one shot, even everything.

Thus, after a simple require like:

```ruby
require "active_support"
```

only the extensions required by the Active Support framework are loaded.

#### Cherry-picking a Definition

This example shows how to load [`Hash#with_indifferent_access`][Hash#with_indifferent_access].  This extension enables the conversion of a `Hash` into an [`ActiveSupport::HashWithIndifferentAccess`][ActiveSupport::HashWithIndifferentAccess] which permits access to the keys as either strings or symbols.

```ruby
{ a: 1 }.with_indifferent_access["a"] # => 1
```

For every single method defined as a core extension this guide has a note that says where such a method is defined. In the case of `with_indifferent_access` the note reads:

NOTE: Defined in `active_support/core_ext/hash/indifferent_access.rb`.

That means that you can require it like this:

```ruby
require "active_support"
require "active_support/core_ext/hash/indifferent_access"
```

Active Support has been carefully revised so that cherry-picking a file loads only strictly needed dependencies, if any.

#### Loading Grouped Core Extensions

The next level is to simply load all extensions to `Hash`. As a rule of thumb, extensions to `SomeClass` are available in one shot by loading `active_support/core_ext/some_class`.

Thus, to load all extensions to `Hash` (including `with_indifferent_access`):

```ruby
require "active_support"
require "active_support/core_ext/hash"
```

#### Loading All Core Extensions

You may prefer just to load all core extensions, there is a file for that:

```ruby
require "active_support"
require "active_support/core_ext"
```

#### Loading All Active Support

And finally, if you want to have all Active Support available just issue:

```ruby
require "active_support/all"
```

That does not even put the entire Active Support in memory upfront indeed, some stuff is configured via `autoload`, so it is only loaded if used.

### Active Support Within a Ruby on Rails Application

A Ruby on Rails application loads all Active Support unless [`config.active_support.bare`][] is true. In that case, the application will only load what the framework itself cherry-picks for its own needs, and can still cherry-pick itself at any granularity level, as explained in the previous section.

[`config.active_support.bare`]: configuring.html#config-active-support-bare

Extensions to All Objects
-------------------------

### `blank?` and `present?`

The following values are considered to be blank in a Rails application:

* `nil` and `false`,

* strings composed only of whitespace (see note below),

* empty arrays and hashes, and

* any other object that responds to `empty?` and is empty.

INFO: The predicate for strings uses the Unicode-aware character class `[:space:]`, so for example U+2029 (paragraph separator) is considered to be whitespace.

WARNING: Note that numbers are not mentioned. In particular, 0 and 0.0 are **not** blank.

For example, this method from `ActionController::HttpAuthentication::Token::ControllerMethods` uses [`blank?`][Object#blank?] for checking whether a token is present:

```ruby
def authenticate(controller, &login_procedure)
  token, options = token_and_options(controller.request)
  unless token.blank?
    login_procedure.call(token, options)
  end
end
```

The method [`present?`][Object#present?] is equivalent to `!blank?`. This example is taken from `ActionDispatch::Http::Cache::Response`:

```ruby
def set_conditional_cache_control!
  unless self["Cache-Control"].present?
    # ...
  end
end
```

NOTE: Defined in `active_support/core_ext/object/blank.rb`.

[Object#blank?]: https://api.rubyonrails.org/classes/Object.html#method-i-blank-3F
[Object#present?]: https://api.rubyonrails.org/classes/Object.html#method-i-present-3F

### `presence`

The [`presence`][Object#presence] method returns its receiver if `present?`, and `nil` otherwise. It is useful for idioms like this:

```ruby
host = config[:host].presence || "localhost"
```

NOTE: Defined in `active_support/core_ext/object/blank.rb`.

[Object#presence]: https://api.rubyonrails.org/classes/Object.html#method-i-presence

### `duplicable?`

As of Ruby 2.5, most objects can be duplicated via `dup` or `clone`:

```ruby
"foo".dup           # => "foo"
"".dup              # => ""
Rational(1).dup     # => (1/1)
Complex(0).dup      # => (0+0i)
1.method(:+).dup    # => TypeError (allocator undefined for Method)
```

Active Support provides [`duplicable?`][Object#duplicable?] to query an object about this:

```ruby
"foo".duplicable?           # => true
"".duplicable?              # => true
Rational(1).duplicable?     # => true
Complex(1).duplicable?      # => true
1.method(:+).duplicable?    # => false
```

WARNING: Any class can disallow duplication by removing `dup` and `clone` or raising exceptions from them. Thus only `rescue` can tell whether a given arbitrary object is duplicable. `duplicable?` depends on the hard-coded list above, but it is much faster than `rescue`. Use it only if you know the hard-coded list is enough in your use case.

NOTE: Defined in `active_support/core_ext/object/duplicable.rb`.

[Object#duplicable?]: https://api.rubyonrails.org/classes/Object.html#method-i-duplicable-3F

### `deep_dup`

The [`deep_dup`][Object#deep_dup] method returns a deep copy of a given object. Normally, when you `dup` an object that contains other objects, Ruby does not `dup` them, so it creates a shallow copy of the object. If you have an array with a string, for example, it will look like this:

```ruby
array     = ["string"]
duplicate = array.dup

duplicate.push "another-string"

# the object was duplicated, so the element was added only to the duplicate
array     # => ["string"]
duplicate # => ["string", "another-string"]

duplicate.first.gsub!("string", "foo")

# first element was not duplicated, it will be changed in both arrays
array     # => ["foo"]
duplicate # => ["foo, "another-string"]
```

As you can see, after duplicating the `Array` instance, we got another object, therefore we can modify it and the original object will stay unchanged. This is not true for array's elements, however. Since `dup` does not make a deep copy, the string inside the array is still the same object.

If you need a deep copy of an object, you should use `deep_dup`. Here is an example:

```ruby
array     = ["string"]
duplicate = array.deep_dup

duplicate.first.gsub!("string", "foo")

array     # => ["string"]
duplicate # => ["foo"]
```

If the object is not duplicable, `deep_dup` will just return it:

```ruby
number = 1
duplicate = number.deep_dup
number.object_id == duplicate.object_id   # => true
```

NOTE: Defined in `active_support/core_ext/object/deep_dup.rb`.

[Object#deep_dup]: https://api.rubyonrails.org/classes/Object.html#method-i-deep_dup

### `try`

When you want to call a method on an object only if it is not `nil`, the simplest way to achieve it is with conditional statements, adding unnecessary clutter. The alternative is to use [`try`][Object#try]. `try` is like `Object#public_send` except that it returns `nil` if sent to `nil`.

Here is an example:

```ruby
# without try
unless @number.nil?
  @number.next
end

# with try
@number.try(:next)
```

Another example is this code from `ActiveRecord::ConnectionAdapters::AbstractAdapter` where `@logger` could be `nil`. You can see that the code uses `try` and avoids an unnecessary check.

```ruby
def log_info(sql, name, ms)
  if @logger.try(:debug?)
    name = "%s (%.1fms)" % [name || "SQL", ms]
    @logger.debug(format_log_entry(name, sql.squeeze(" ")))
  end
end
```

`try` can also be called without arguments but a block, which will only be executed if the object is not nil:

```ruby
@person.try { |p| "#{p.first_name} #{p.last_name}" }
```

Note that `try` will swallow no-method errors, returning nil instead. If you want to protect against typos, use [`try!`][Object#try!] instead:

```ruby
@number.try(:nest)  # => nil
@number.try!(:nest) # NoMethodError: undefined method `nest' for 1:Integer
```

NOTE: Defined in `active_support/core_ext/object/try.rb`.

[Object#try]: https://api.rubyonrails.org/classes/Object.html#method-i-try
[Object#try!]: https://api.rubyonrails.org/classes/Object.html#method-i-try-21

### `class_eval(*args, &block)`

You can evaluate code in the context of any object's singleton class using [`class_eval`][Kernel#class_eval]:

```ruby
class Proc
  def bind(object)
    block, time = self, Time.current
    object.class_eval do
      method_name = "__bind_#{time.to_i}_#{time.usec}"
      define_method(method_name, &block)
      method = instance_method(method_name)
      remove_method(method_name)
      method
    end.bind(object)
  end
end
```

NOTE: Defined in `active_support/core_ext/kernel/singleton_class.rb`.

[Kernel#class_eval]: https://api.rubyonrails.org/classes/Kernel.html#method-i-class_eval

### `acts_like?(duck)`

The method [`acts_like?`][Object#acts_like?] provides a way to check whether some class acts like some other class based on a simple convention: a class that provides the same interface as `String` defines

```ruby
def acts_like_string?
end
```

which is only a marker, its body or return value are irrelevant. Then, client code can query for duck-type-safeness this way:

```ruby
some_klass.acts_like?(:string)
```

Rails has classes that act like `Date` or `Time` and follow this contract.

NOTE: Defined in `active_support/core_ext/object/acts_like.rb`.

[Object#acts_like?]: https://api.rubyonrails.org/classes/Object.html#method-i-acts_like-3F

### `to_param`

All objects in Rails respond to the method [`to_param`][Object#to_param], which is meant to return something that represents them as values in a query string, or as URL fragments.

By default `to_param` just calls `to_s`:

```ruby
7.to_param # => "7"
```

The return value of `to_param` should **not** be escaped:

```ruby
"Tom & Jerry".to_param # => "Tom & Jerry"
```

Several classes in Rails overwrite this method.

For example `nil`, `true`, and `false` return themselves. [`Array#to_param`][Array#to_param] calls `to_param` on the elements and joins the result with "/":

```ruby
[0, true, String].to_param # => "0/true/String"
```

Notably, the Rails routing system calls `to_param` on models to get a value for the `:id` placeholder. `ActiveRecord::Base#to_param` returns the `id` of a model, but you can redefine that method in your models. For example, given

```ruby
class User
  def to_param
    "#{id}-#{name.parameterize}"
  end
end
```

we get:

```ruby
user_path(@user) # => "/users/357-john-smith"
```

WARNING. Controllers need to be aware of any redefinition of `to_param` because when a request like that comes in "357-john-smith" is the value of `params[:id]`.

NOTE: Defined in `active_support/core_ext/object/to_param.rb`.

[Array#to_param]: https://api.rubyonrails.org/classes/Array.html#method-i-to_param
[Object#to_param]: https://api.rubyonrails.org/classes/Object.html#method-i-to_param

### `to_query`

The [`to_query`][Object#to_query] method constructs a query string that associates a given `key` with the return value of `to_param`. For example, with the following `to_param` definition:

```ruby
class User
  def to_param
    "#{id}-#{name.parameterize}"
  end
end
```

we get:

```ruby
current_user.to_query("user") # => "user=357-john-smith"
```

This method escapes whatever is needed, both for the key and the value:

```ruby
account.to_query("company[name]")
# => "company%5Bname%5D=Johnson+%26+Johnson"
```

so its output is ready to be used in a query string.

Arrays return the result of applying `to_query` to each element with `key[]` as key, and join the result with "&":

```ruby
[3.4, -45.6].to_query("sample")
# => "sample%5B%5D=3.4&sample%5B%5D=-45.6"
```

Hashes also respond to `to_query` but with a different signature. If no argument is passed a call generates a sorted series of key/value assignments calling `to_query(key)` on its values. Then it joins the result with "&":

```ruby
{ c: 3, b: 2, a: 1 }.to_query # => "a=1&b=2&c=3"
```

The method [`Hash#to_query`][Hash#to_query] accepts an optional namespace for the keys:

```ruby
{ id: 89, name: "John Smith" }.to_query("user")
# => "user%5Bid%5D=89&user%5Bname%5D=John+Smith"
```

NOTE: Defined in `active_support/core_ext/object/to_query.rb`.

[Hash#to_query]: https://api.rubyonrails.org/classes/Hash.html#method-i-to_query
[Object#to_query]: https://api.rubyonrails.org/classes/Object.html#method-i-to_query

### `with_options`

The method [`with_options`][Object#with_options] provides a way to factor out common options in a series of method calls.

Given a default options hash, `with_options` yields a proxy object to a block. Within the block, methods called on the proxy are forwarded to the receiver with their options merged. For example, you get rid of the duplication in:

```ruby
class Account < ApplicationRecord
  has_many :customers, dependent: :destroy
  has_many :products,  dependent: :destroy
  has_many :invoices,  dependent: :destroy
  has_many :expenses,  dependent: :destroy
end
```

this way:

```ruby
class Account < ApplicationRecord
  with_options dependent: :destroy do |assoc|
    assoc.has_many :customers
    assoc.has_many :products
    assoc.has_many :invoices
    assoc.has_many :expenses
  end
end
```

That idiom may convey _grouping_ to the reader as well. For example, say you want to send a newsletter whose language depends on the user. Somewhere in the mailer you could group locale-dependent bits like this:

```ruby
I18n.with_options locale: user.locale, scope: "newsletter" do |i18n|
  subject i18n.t :subject
  body    i18n.t :body, user_name: user.name
end
```

TIP: Since `with_options` forwards calls to its receiver they can be nested. Each nesting level will merge inherited defaults in addition to their own.

NOTE: Defined in `active_support/core_ext/object/with_options.rb`.

[Object#with_options]: https://api.rubyonrails.org/classes/Object.html#method-i-with_options

### JSON Support

Active Support provides a better implementation of `to_json` than the `json` gem ordinarily provides for Ruby objects. This is because some classes, like `Hash` and `Process::Status` need special handling in order to provide a proper JSON representation.

NOTE: Defined in `active_support/core_ext/object/json.rb`.

### Instance Variables

Active Support provides several methods to ease access to instance variables.

#### `instance_values`

The method [`instance_values`][Object#instance_values] returns a hash that maps instance variable names without "@" to their
corresponding values. Keys are strings:

```ruby
class C
  def initialize(x, y)
    @x, @y = x, y
  end
end

C.new(0, 1).instance_values # => {"x" => 0, "y" => 1}
```

NOTE: Defined in `active_support/core_ext/object/instance_variables.rb`.

[Object#instance_values]: https://api.rubyonrails.org/classes/Object.html#method-i-instance_values

#### `instance_variable_names`

The method [`instance_variable_names`][Object#instance_variable_names] returns an array. Each name includes the "@" sign.

```ruby
class C
  def initialize(x, y)
    @x, @y = x, y
  end
end

C.new(0, 1).instance_variable_names # => ["@x", "@y"]
```

NOTE: Defined in `active_support/core_ext/object/instance_variables.rb`.

[Object#instance_variable_names]: https://api.rubyonrails.org/classes/Object.html#method-i-instance_variable_names

### Silencing Warnings and Exceptions

The methods [`silence_warnings`][Kernel#silence_warnings] and [`enable_warnings`][Kernel#enable_warnings] change the value of `$VERBOSE` accordingly for the duration of their block, and reset it afterwards:

```ruby
silence_warnings { Object.const_set "RAILS_DEFAULT_LOGGER", logger }
```

Silencing exceptions is also possible with [`suppress`][Kernel#suppress]. This method receives an arbitrary number of exception classes. If an exception is raised during the execution of the block and is `kind_of?` any of the arguments, `suppress` captures it and returns silently. Otherwise the exception is not captured:

```ruby
# If the user is locked, the increment is lost, no big deal.
suppress(ActiveRecord::StaleObjectError) do
  current_user.increment! :visits
end
```

NOTE: Defined in `active_support/core_ext/kernel/reporting.rb`.

[Kernel#enable_warnings]: https://api.rubyonrails.org/classes/Kernel.html#method-i-enable_warnings
[Kernel#silence_warnings]: https://api.rubyonrails.org/classes/Kernel.html#method-i-silence_warnings
[Kernel#suppress]: https://api.rubyonrails.org/classes/Kernel.html#method-i-suppress

### `in?`

The predicate [`in?`][Object#in?] tests if an object is included in another object. An `ArgumentError` exception will be raised if the argument passed does not respond to `include?`.

Examples of `in?`:

```ruby
1.in?([1, 2])        # => true
"lo".in?("hello")   # => true
25.in?(30..50)      # => false
1.in?(1)            # => ArgumentError
```

NOTE: Defined in `active_support/core_ext/object/inclusion.rb`.

[Object#in?]: https://api.rubyonrails.org/classes/Object.html#method-i-in-3F

Extensions to `Module`
----------------------

### Attributes

#### `alias_attribute`

Model attributes have a reader, a writer, and a predicate. You can alias a model attribute having the corresponding three methods all defined for you by using [`alias_attribute`][Module#alias_attribute]. As in other aliasing methods, the new name is the first argument, and the old name is the second (one mnemonic is that they go in the same order as if you did an assignment):

```ruby
class User < ApplicationRecord
  # You can refer to the email column as "login".
  # This can be meaningful for authentication code.
  alias_attribute :login, :email
end
```

NOTE: Defined in `active_support/core_ext/module/aliasing.rb`.

[Module#alias_attribute]: https://api.rubyonrails.org/classes/Module.html#method-i-alias_attribute

#### Internal Attributes

When you are defining an attribute in a class that is meant to be subclassed, name collisions are a risk. That's remarkably important for libraries.

Active Support defines the macros [`attr_internal_reader`][Module#attr_internal_reader], [`attr_internal_writer`][Module#attr_internal_writer], and [`attr_internal_accessor`][Module#attr_internal_accessor]. They behave like their Ruby built-in `attr_*` counterparts, except they name the underlying instance variable in a way that makes collisions less likely.

The macro [`attr_internal`][Module#attr_internal] is a synonym for `attr_internal_accessor`:

```ruby
# library
class ThirdPartyLibrary::Crawler
  attr_internal :log_level
end

# client code
class MyCrawler < ThirdPartyLibrary::Crawler
  attr_accessor :log_level
end
```

In the previous example it could be the case that `:log_level` does not belong to the public interface of the library and it is only used for development. The client code, unaware of the potential conflict, subclasses and defines its own `:log_level`. Thanks to `attr_internal` there's no collision.

By default the internal instance variable is named with a leading underscore, `@_log_level` in the example above. That's configurable via `Module.attr_internal_naming_format` though, you can pass any `sprintf`-like format string with a leading `@` and a `%s` somewhere, which is where the name will be placed. The default is `"@_%s"`.

Rails uses internal attributes in a few spots, for examples for views:

```ruby
module ActionView
  class Base
    attr_internal :captures
    attr_internal :request, :layout
    attr_internal :controller, :template
  end
end
```

NOTE: Defined in `active_support/core_ext/module/attr_internal.rb`.

[Module#attr_internal]: https://api.rubyonrails.org/classes/Module.html#method-i-attr_internal
[Module#attr_internal_accessor]: https://api.rubyonrails.org/classes/Module.html#method-i-attr_internal_accessor
[Module#attr_internal_reader]: https://api.rubyonrails.org/classes/Module.html#method-i-attr_internal_reader
[Module#attr_internal_writer]: https://api.rubyonrails.org/classes/Module.html#method-i-attr_internal_writer

#### Module Attributes

The macros [`mattr_reader`][Module#mattr_reader], [`mattr_writer`][Module#mattr_writer], and [`mattr_accessor`][Module#mattr_accessor] are the same as the `cattr_*` macros defined for class. In fact, the `cattr_*` macros are just aliases for the `mattr_*` macros. Check [Class Attributes](#class-attributes).

For example, the API for the logger of Active Storage is generated with `mattr_accessor`:

```ruby
module ActiveStorage
  mattr_accessor :logger
end
```

NOTE: Defined in `active_support/core_ext/module/attribute_accessors.rb`.

[Module#mattr_accessor]: https://api.rubyonrails.org/classes/Module.html#method-i-mattr_accessor
[Module#mattr_reader]: https://api.rubyonrails.org/classes/Module.html#method-i-mattr_reader
[Module#mattr_writer]: https://api.rubyonrails.org/classes/Module.html#method-i-mattr_writer

### Parents

#### `module_parent`

The [`module_parent`][Module#module_parent] method on a nested named module returns the module that contains its corresponding constant:

```ruby
module X
  module Y
    module Z
    end
  end
end
M = X::Y::Z

X::Y::Z.module_parent # => X::Y
M.module_parent       # => X::Y
```

If the module is anonymous or belongs to the top-level, `module_parent` returns `Object`.

WARNING: Note that in that case `module_parent_name` returns `nil`.

NOTE: Defined in `active_support/core_ext/module/introspection.rb`.

[Module#module_parent]: https://api.rubyonrails.org/classes/Module.html#method-i-module_parent

#### `module_parent_name`

The [`module_parent_name`][Module#module_parent_name] method on a nested named module returns the fully qualified name of the module that contains its corresponding constant:

```ruby
module X
  module Y
    module Z
    end
  end
end
M = X::Y::Z

X::Y::Z.module_parent_name # => "X::Y"
M.module_parent_name       # => "X::Y"
```

For top-level or anonymous modules `module_parent_name` returns `nil`.

WARNING: Note that in that case `module_parent` returns `Object`.

NOTE: Defined in `active_support/core_ext/module/introspection.rb`.

[Module#module_parent_name]: https://api.rubyonrails.org/classes/Module.html#method-i-module_parent_name

#### `module_parents`

The method [`module_parents`][Module#module_parents] calls `module_parent` on the receiver and upwards until `Object` is reached. The chain is returned in an array, from bottom to top:

```ruby
module X
  module Y
    module Z
    end
  end
end
M = X::Y::Z

X::Y::Z.module_parents # => [X::Y, X, Object]
M.module_parents       # => [X::Y, X, Object]
```

NOTE: Defined in `active_support/core_ext/module/introspection.rb`.

[Module#module_parents]: https://api.rubyonrails.org/classes/Module.html#method-i-module_parents

### Anonymous

A module may or may not have a name:

```ruby
module M
end
M.name # => "M"

N = Module.new
N.name # => "N"

Module.new.name # => nil
```

You can check whether a module has a name with the predicate [`anonymous?`][Module#anonymous?]:

```ruby
module M
end
M.anonymous? # => false

Module.new.anonymous? # => true
```

Note that being unreachable does not imply being anonymous:

```ruby
module M
end

m = Object.send(:remove_const, :M)

m.anonymous? # => false
```

though an anonymous module is unreachable by definition.

NOTE: Defined in `active_support/core_ext/module/anonymous.rb`.

[Module#anonymous?]: https://api.rubyonrails.org/classes/Module.html#method-i-anonymous-3F

### Method Delegation

#### `delegate`

The macro [`delegate`][Module#delegate] offers an easy way to forward methods.

Let's imagine that users in some application have login information in the `User` model but name and other data in a separate `Profile` model:

```ruby
class User < ApplicationRecord
  has_one :profile
end
```

With that configuration you get a user's name via their profile, `user.profile.name`, but it could be handy to still be able to access such attribute directly:

```ruby
class User < ApplicationRecord
  has_one :profile

  def name
    profile.name
  end
end
```

That is what `delegate` does for you:

```ruby
class User < ApplicationRecord
  has_one :profile

  delegate :name, to: :profile
end
```

It is shorter, and the intention more obvious.

The method must be public in the target.

The `delegate` macro accepts several methods:

```ruby
delegate :name, :age, :address, :twitter, to: :profile
```

When interpolated into a string, the `:to` option should become an expression that evaluates to the object the method is delegated to. Typically a string or symbol. Such an expression is evaluated in the context of the receiver:

```ruby
# delegates to the Rails constant
delegate :logger, to: :Rails

# delegates to the receiver's class
delegate :table_name, to: :class
```

WARNING: If the `:prefix` option is `true` this is less generic, see below.

By default, if the delegation raises `NoMethodError` and the target is `nil` the exception is propagated. You can ask that `nil` is returned instead with the `:allow_nil` option:

```ruby
delegate :name, to: :profile, allow_nil: true
```

With `:allow_nil` the call `user.name` returns `nil` if the user has no profile.

The option `:prefix` adds a prefix to the name of the generated method. This may be handy for example to get a better name:

```ruby
delegate :street, to: :address, prefix: true
```

The previous example generates `address_street` rather than `street`.

WARNING: Since in this case the name of the generated method is composed of the target object and target method names, the `:to` option must be a method name.

A custom prefix may also be configured:

```ruby
delegate :size, to: :attachment, prefix: :avatar
```

In the previous example the macro generates `avatar_size` rather than `size`.

The option `:private` changes methods scope:

```ruby
delegate :date_of_birth, to: :profile, private: true
```

The delegated methods are public by default. Pass `private: true` to change that.

NOTE: Defined in `active_support/core_ext/module/delegation.rb`

[Module#delegate]: https://api.rubyonrails.org/classes/Module.html#method-i-delegate

#### `delegate_missing_to`

Imagine you would like to delegate everything missing from the `User` object,
to the `Profile` one. The [`delegate_missing_to`][Module#delegate_missing_to] macro lets you implement this
in a breeze:

```ruby
class User < ApplicationRecord
  has_one :profile

  delegate_missing_to :profile
end
```

The target can be anything callable within the object, e.g. instance variables,
methods, constants, etc. Only the public methods of the target are delegated.

NOTE: Defined in `active_support/core_ext/module/delegation.rb`.

[Module#delegate_missing_to]: https://api.rubyonrails.org/classes/Module.html#method-i-delegate_missing_to

### Redefining Methods

There are cases where you need to define a method with `define_method`, but don't know whether a method with that name already exists. If it does, a warning is issued if they are enabled. No big deal, but not clean either.

The method [`redefine_method`][Module#redefine_method] prevents such a potential warning, removing the existing method before if needed.

You can also use [`silence_redefinition_of_method`][Module#silence_redefinition_of_method] if you need to define
the replacement method yourself (because you're using `delegate`, for
example).

NOTE: Defined in `active_support/core_ext/module/redefine_method.rb`.

[Module#redefine_method]: https://api.rubyonrails.org/classes/Module.html#method-i-redefine_method
[Module#silence_redefinition_of_method]: https://api.rubyonrails.org/classes/Module.html#method-i-silence_redefinition_of_method

Extensions to `Class`
---------------------

### Class Attributes

#### `class_attribute`

The method [`class_attribute`][Class#class_attribute] declares one or more inheritable class attributes that can be overridden at any level down the hierarchy.

```ruby
class A
  class_attribute :x
end

class B < A; end

class C < B; end

A.x = :a
B.x # => :a
C.x # => :a

B.x = :b
A.x # => :a
C.x # => :b

C.x = :c
A.x # => :a
B.x # => :b
```

For example `ActionMailer::Base` defines:

```ruby
class_attribute :default_params
self.default_params = {
  mime_version: "1.0",
  charset: "UTF-8",
  content_type: "text/plain",
  parts_order: [ "text/plain", "text/enriched", "text/html" ]
}.freeze
```

They can also be accessed and overridden at the instance level.

```ruby
A.x = 1

a1 = A.new
a2 = A.new
a2.x = 2

a1.x # => 1, comes from A
a2.x # => 2, overridden in a2
```

The generation of the writer instance method can be prevented by setting the option `:instance_writer` to `false`.

```ruby
module ActiveRecord
  class Base
    class_attribute :table_name_prefix, instance_writer: false, default: "my"
  end
end
```

A model may find that option useful as a way to prevent mass-assignment from setting the attribute.

The generation of the reader instance method can be prevented by setting the option `:instance_reader` to `false`.

```ruby
class A
  class_attribute :x, instance_reader: false
end

A.new.x = 1
A.new.x # NoMethodError
```

For convenience `class_attribute` also defines an instance predicate which is the double negation of what the instance reader returns. In the examples above it would be called `x?`.

When `:instance_reader` is `false`, the instance predicate returns a `NoMethodError` just like the reader method.

If you do not want the instance predicate, pass `instance_predicate: false` and it will not be defined.

NOTE: Defined in `active_support/core_ext/class/attribute.rb`.

[Class#class_attribute]: https://api.rubyonrails.org/classes/Class.html#method-i-class_attribute

#### `cattr_reader`, `cattr_writer`, and `cattr_accessor`

The macros [`cattr_reader`][Module#cattr_reader], [`cattr_writer`][Module#cattr_writer], and [`cattr_accessor`][Module#cattr_accessor] are analogous to their `attr_*` counterparts but for classes. They initialize a class variable to `nil` unless it already exists, and generate the corresponding class methods to access it:

```ruby
class MysqlAdapter < AbstractAdapter
  # Generates class methods to access @@emulate_booleans.
  cattr_accessor :emulate_booleans
end
```

Also, you can pass a block to `cattr_*` to set up the attribute with a default value:

```ruby
class MysqlAdapter < AbstractAdapter
  # Generates class methods to access @@emulate_booleans with default value of true.
  cattr_accessor :emulate_booleans, default: true
end
```

Instance methods are also created for convenience, but they are simply proxies to the internal value which is shared among the class. As a result, when an instance modifies the value, this affects the entire class hierarchy. This behavior is different than `class_attribute` (see above).

For example:

```ruby
class Foo
  cattr_accessor :bar
end

instance = Foo.new

Foo.bar = 1
instance.bar # => 1

instance.bar = 2
Foo.bar # => 2
```

The generation of the reader instance method can be prevented by setting `:instance_reader` to `false` and the generation of the writer instance method can be prevented by setting `:instance_writer` to `false`. Generation of both methods can be prevented by setting `:instance_accessor` to `false`. In all cases, the value must be exactly `false` and not any false value.

```ruby
module A
  class B
    # No first_name instance reader is generated.
    cattr_accessor :first_name, instance_reader: false
    # No last_name= instance writer is generated.
    cattr_accessor :last_name, instance_writer: false
    # No surname instance reader or surname= writer is generated.
    cattr_accessor :surname, instance_accessor: false
  end
end
```

A model may find it useful to set `:instance_accessor` to `false` as a way to prevent mass-assignment from setting the attribute.

NOTE: Defined in `active_support/core_ext/module/attribute_accessors.rb`.

[Module#cattr_accessor]: https://api.rubyonrails.org/classes/Module.html#method-i-cattr_accessor
[Module#cattr_reader]: https://api.rubyonrails.org/classes/Module.html#method-i-cattr_reader
[Module#cattr_writer]: https://api.rubyonrails.org/classes/Module.html#method-i-cattr_writer

### Descendants

#### `descendants`

The [`descendants`][Class#descendants] method returns all classes that are `<` than its receiver:

```ruby
class C; end
C.descendants # => []

class B < C; end
C.descendants # => [B]

class A < B; end
C.descendants # => [B, A]

class D < C; end
C.descendants # => [B, A, D]
```

The order in which these classes are returned is unspecified.

NOTE: Defined in `active_support/core_ext/class/subclasses.rb`.

[Class#descendants]: https://api.rubyonrails.org/classes/Class.html#method-i-descendants

Extensions to `String`
----------------------

### Output Safety

#### Motivation

Inserting data into HTML templates needs extra care. For example, you can't just interpolate `@review.title` verbatim into an HTML page. For one thing, if the review title is "Flanagan & Matz rules!" the output won't be well-formed because an ampersand has to be escaped as "&amp;amp;". What's more, depending on the application, that may be a big security hole because users can inject malicious HTML setting a hand-crafted review title. Check out the section about cross-site scripting in the [Security guide](security.html#cross-site-scripting-xss) for further information about the risks.

#### Safe Strings

Active Support has the concept of _(html) safe_ strings. A safe string is one that is marked as being insertable into HTML as is. It is trusted, no matter whether it has been escaped or not.

Strings are considered to be _unsafe_ by default:

```ruby
"".html_safe? # => false
```

You can obtain a safe string from a given one with the [`html_safe`][String#html_safe] method:

```ruby
s = "".html_safe
s.html_safe? # => true
```

It is important to understand that `html_safe` performs no escaping whatsoever, it is just an assertion:

```ruby
s = "<script>...</script>".html_safe
s.html_safe? # => true
s            # => "<script>...</script>"
```

It is your responsibility to ensure calling `html_safe` on a particular string is fine.

If you append onto a safe string, either in-place with `concat`/`<<`, or with `+`, the result is a safe string. Unsafe arguments are escaped:

```ruby
"".html_safe + "<" # => "&lt;"
```

Safe arguments are directly appended:

```ruby
"".html_safe + "<".html_safe # => "<"
```

These methods should not be used in ordinary views. Unsafe values are automatically escaped:

```erb
<%= @review.title %> <%# fine, escaped if needed %>
```

To insert something verbatim use the [`raw`][] helper rather than calling `html_safe`:

```erb
<%= raw @cms.current_template %> <%# inserts @cms.current_template as is %>
```

or, equivalently, use `<%==`:

```erb
<%== @cms.current_template %> <%# inserts @cms.current_template as is %>
```

The `raw` helper calls `html_safe` for you:

```ruby
def raw(stringish)
  stringish.to_s.html_safe
end
```

NOTE: Defined in `active_support/core_ext/string/output_safety.rb`.

[`raw`]: https://api.rubyonrails.org/classes/ActionView/Helpers/OutputSafetyHelper.html#method-i-raw
[String#html_safe]: https://api.rubyonrails.org/classes/String.html#method-i-html_safe

#### Transformation

As a rule of thumb, except perhaps for concatenation as explained above, any method that may change a string gives you an unsafe string. These are `downcase`, `gsub`, `strip`, `chomp`, `underscore`, etc.

In the case of in-place transformations like `gsub!` the receiver itself becomes unsafe.

INFO: The safety bit is lost always, no matter whether the transformation actually changed something.

#### Conversion and Coercion

Calling `to_s` on a safe string returns a safe string, but coercion with `to_str` returns an unsafe string.

#### Copying

Calling `dup` or `clone` on safe strings yields safe strings.

### `remove`

The method [`remove`][String#remove] will remove all occurrences of the pattern:

```ruby
"Hello World".remove(/Hello /) # => "World"
```

There's also the destructive version `String#remove!`.

NOTE: Defined in `active_support/core_ext/string/filters.rb`.

[String#remove]: https://api.rubyonrails.org/classes/String.html#method-i-remove

### `squish`

The method [`squish`][String#squish] strips leading and trailing whitespace, and substitutes runs of whitespace with a single space each:

```ruby
" \n  foo\n\r \t bar \n".squish # => "foo bar"
```

There's also the destructive version `String#squish!`.

Note that it handles both ASCII and Unicode whitespace.

NOTE: Defined in `active_support/core_ext/string/filters.rb`.

[String#squish]: https://api.rubyonrails.org/classes/String.html#method-i-squish

### `truncate`

The method [`truncate`][String#truncate] returns a copy of its receiver truncated after a given `length`:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate(20)
# => "Oh dear! Oh dear!..."
```

Ellipsis can be customized with the `:omission` option:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate(20, omission: "&hellip;")
# => "Oh dear! Oh &hellip;"
```

Note in particular that truncation takes into account the length of the omission string.

Pass a `:separator` to truncate the string at a natural break:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate(18)
# => "Oh dear! Oh dea..."
"Oh dear! Oh dear! I shall be late!".truncate(18, separator: " ")
# => "Oh dear! Oh..."
```

The option `:separator` can be a regexp:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate(18, separator: /\s/)
# => "Oh dear! Oh..."
```

In above examples "dear" gets cut first, but then `:separator` prevents it.

NOTE: Defined in `active_support/core_ext/string/filters.rb`.

[String#truncate]: https://api.rubyonrails.org/classes/String.html#method-i-truncate

### `truncate_bytes`

The method [`truncate_bytes`][String#truncate_bytes] returns a copy of its receiver truncated to at most `bytesize` bytes:

```ruby
"👍👍👍👍".truncate_bytes(15)
# => "👍👍👍…"
```

Ellipsis can be customized with the `:omission` option:

```ruby
"👍👍👍👍".truncate_bytes(15, omission: "🖖")
# => "👍👍🖖"
```

NOTE: Defined in `active_support/core_ext/string/filters.rb`.

[String#truncate_bytes]: https://api.rubyonrails.org/classes/String.html#method-i-truncate_bytes

### `truncate_words`

The method [`truncate_words`][String#truncate_words] returns a copy of its receiver truncated after a given number of words:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate_words(4)
# => "Oh dear! Oh dear!..."
```

Ellipsis can be customized with the `:omission` option:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate_words(4, omission: "&hellip;")
# => "Oh dear! Oh dear!&hellip;"
```

Pass a `:separator` to truncate the string at a natural break:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate_words(3, separator: "!")
# => "Oh dear! Oh dear! I shall be late..."
```

The option `:separator` can be a regexp:

```ruby
"Oh dear! Oh dear! I shall be late!".truncate_words(4, separator: /\s/)
# => "Oh dear! Oh dear!..."
```

NOTE: Defined in `active_support/core_ext/string/filters.rb`.

[String#truncate_words]: https://api.rubyonrails.org/classes/String.html#method-i-truncate_words

### `inquiry`

The [`inquiry`][String#inquiry] method converts a string into a `StringInquirer` object making equality checks prettier.

```ruby
"production".inquiry.production? # => true
"active".inquiry.inactive?       # => false
```

NOTE: Defined in `active_support/core_ext/string/inquiry.rb`.

[String#inquiry]: https://api.rubyonrails.org/classes/String.html#method-i-inquiry

### `starts_with?` and `ends_with?`

Active Support defines 3rd person aliases of `String#start_with?` and `String#end_with?`:

```ruby
"foo".starts_with?("f") # => true
"foo".ends_with?("o")   # => true
```

NOTE: Defined in `active_support/core_ext/string/starts_ends_with.rb`.

### `strip_heredoc`

The method [`strip_heredoc`][String#strip_heredoc] strips indentation in heredocs.

For example in

```ruby
if options[:usage]
  puts <<-USAGE.strip_heredoc
    This command does such and such.

    Supported options are:
      -h         This message
      ...
  USAGE
end
```

the user would see the usage message aligned against the left margin.

Technically, it looks for the least indented line in the whole string, and removes
that amount of leading whitespace.

NOTE: Defined in `active_support/core_ext/string/strip.rb`.

[String#strip_heredoc]: https://api.rubyonrails.org/classes/String.html#method-i-strip_heredoc

### `indent`

The [`indent`][String#indent] method indents the lines in the receiver:

```ruby
<<EOS.indent(2)
def some_method
  some_code
end
EOS
# =>
  def some_method
    some_code
  end
```

The second argument, `indent_string`, specifies which indent string to use. The default is `nil`, which tells the method to make an educated guess peeking at the first indented line, and fallback to a space if there is none.

```ruby
"  foo".indent(2)        # => "    foo"
"foo\n\t\tbar".indent(2) # => "\t\tfoo\n\t\t\t\tbar"
"foo".indent(2, "\t")    # => "\t\tfoo"
```

While `indent_string` is typically one space or tab, it may be any string.

The third argument, `indent_empty_lines`, is a flag that says whether empty lines should be indented. Default is false.

```ruby
"foo\n\nbar".indent(2)            # => "  foo\n\n  bar"
"foo\n\nbar".indent(2, nil, true) # => "  foo\n  \n  bar"
```

The [`indent!`][String#indent!] method performs indentation in-place.

NOTE: Defined in `active_support/core_ext/string/indent.rb`.

[String#indent!]: https://api.rubyonrails.org/classes/String.html#method-i-indent-21
[String#indent]: https://api.rubyonrails.org/classes/String.html#method-i-indent

### Access

#### `at(position)`

The [`at`][String#at] method returns the character of the string at position `position`:

```ruby
"hello".at(0)  # => "h"
"hello".at(4)  # => "o"
"hello".at(-1) # => "o"
"hello".at(10) # => nil
```

NOTE: Defined in `active_support/core_ext/string/access.rb`.

[String#at]: https://api.rubyonrails.org/classes/String.html#method-i-at

#### `from(position)`

The [`from`][String#from] method returns the substring of the string starting at position `position`:

```ruby
"hello".from(0)  # => "hello"
"hello".from(2)  # => "llo"
"hello".from(-2) # => "lo"
"hello".from(10) # => nil
```

NOTE: Defined in `active_support/core_ext/string/access.rb`.

[String#from]: https://api.rubyonrails.org/classes/String.html#method-i-from

#### `to(position)`

The [`to`][String#to] method returns the substring of the string up to position `position`:

```ruby
"hello".to(0)  # => "h"
"hello".to(2)  # => "hel"
"hello".to(-2) # => "hell"
"hello".to(10) # => "hello"
```

NOTE: Defined in `active_support/core_ext/string/access.rb`.

[String#to]: https://api.rubyonrails.org/classes/String.html#method-i-to

#### `first(limit = 1)`

The [`first`][String#first] method returns a substring containing the first `limit` characters of the string.

The call `str.first(n)` is equivalent to `str.to(n-1)` if `n` > 0, and returns an empty string for `n` == 0.

NOTE: Defined in `active_support/core_ext/string/access.rb`.

[String#first]: https://api.rubyonrails.org/classes/String.html#method-i-first

#### `last(limit = 1)`

The [`last`][String#last] method returns a substring containing the last `limit` characters of the string.

The call `str.last(n)` is equivalent to `str.from(-n)` if `n` > 0, and returns an empty string for `n` == 0.

NOTE: Defined in `active_support/core_ext/string/access.rb`.

[String#last]: https://api.rubyonrails.org/classes/String.html#method-i-last

### Inflections

#### `pluralize`

The method [`pluralize`][String#pluralize] returns the plural of its receiver:

```ruby
"table".pluralize     # => "tables"
"ruby".pluralize      # => "rubies"
"equipment".pluralize # => "equipment"
```

As the previous example shows, Active Support knows some irregular plurals and uncountable nouns. Built-in rules can be extended in `config/initializers/inflections.rb`. This file is generated by default, by the `rails new` command and has instructions in comments.

`pluralize` can also take an optional `count` parameter. If `count == 1` the singular form will be returned. For any other value of `count` the plural form will be returned:

```ruby
"dude".pluralize(0) # => "dudes"
"dude".pluralize(1) # => "dude"
"dude".pluralize(2) # => "dudes"
```

Active Record uses this method to compute the default table name that corresponds to a model:

```ruby
# active_record/model_schema.rb
def undecorated_table_name(model_name)
  table_name = model_name.to_s.demodulize.underscore
  pluralize_table_names ? table_name.pluralize : table_name
end
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#pluralize]: https://api.rubyonrails.org/classes/String.html#method-i-pluralize

#### `singularize`

The [`singularize`][String#singularize] method is the inverse of `pluralize`:

```ruby
"tables".singularize    # => "table"
"rubies".singularize    # => "ruby"
"equipment".singularize # => "equipment"
```

Associations compute the name of the corresponding default associated class using this method:

```ruby
# active_record/reflection.rb
def derive_class_name
  class_name = name.to_s.camelize
  class_name = class_name.singularize if collection?
  class_name
end
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#singularize]: https://api.rubyonrails.org/classes/String.html#method-i-singularize

#### `camelize`

The method [`camelize`][String#camelize] returns its receiver in camel case:

```ruby
"product".camelize    # => "Product"
"admin_user".camelize # => "AdminUser"
```

As a rule of thumb you can think of this method as the one that transforms paths into Ruby class or module names, where slashes separate namespaces:

```ruby
"backoffice/session".camelize # => "Backoffice::Session"
```

For example, Action Pack uses this method to load the class that provides a certain session store:

```ruby
# action_controller/metal/session_management.rb
def session_store=(store)
  @@session_store = store.is_a?(Symbol) ?
    ActionDispatch::Session.const_get(store.to_s.camelize) :
    store
end
```

`camelize` accepts an optional argument, it can be `:upper` (default), or `:lower`. With the latter the first letter becomes lowercase:

```ruby
"visual_effect".camelize(:lower) # => "visualEffect"
```

That may be handy to compute method names in a language that follows that convention, for example JavaScript.

INFO: As a rule of thumb you can think of `camelize` as the inverse of `underscore`, though there are cases where that does not hold: `"SSLError".underscore.camelize` gives back `"SslError"`. To support cases such as this, Active Support allows you to specify acronyms in `config/initializers/inflections.rb`:

```ruby
ActiveSupport::Inflector.inflections do |inflect|
  inflect.acronym "SSL"
end

"SSLError".underscore.camelize # => "SSLError"
```

`camelize` is aliased to [`camelcase`][String#camelcase].

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#camelcase]: https://api.rubyonrails.org/classes/String.html#method-i-camelcase
[String#camelize]: https://api.rubyonrails.org/classes/String.html#method-i-camelize

#### `underscore`

The method [`underscore`][String#underscore] goes the other way around, from camel case to paths:

```ruby
"Product".underscore   # => "product"
"AdminUser".underscore # => "admin_user"
```

Also converts "::" back to "/":

```ruby
"Backoffice::Session".underscore # => "backoffice/session"
```

and understands strings that start with lowercase:

```ruby
"visualEffect".underscore # => "visual_effect"
```

`underscore` accepts no argument though.

Rails uses `underscore` to get a lowercased name for controller classes:

```ruby
# actionpack/lib/abstract_controller/base.rb
def controller_path
  @controller_path ||= name.delete_suffix("Controller").underscore
end
```

For example, that value is the one you get in `params[:controller]`.

INFO: As a rule of thumb you can think of `underscore` as the inverse of `camelize`, though there are cases where that does not hold. For example, `"SSLError".underscore.camelize` gives back `"SslError"`.

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#underscore]: https://api.rubyonrails.org/classes/String.html#method-i-underscore

#### `titleize`

The method [`titleize`][String#titleize] capitalizes the words in the receiver:

```ruby
"alice in wonderland".titleize # => "Alice In Wonderland"
"fermat's enigma".titleize     # => "Fermat's Enigma"
```

`titleize` is aliased to [`titlecase`][String#titlecase].

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#titlecase]: https://api.rubyonrails.org/classes/String.html#method-i-titlecase
[String#titleize]: https://api.rubyonrails.org/classes/String.html#method-i-titleize

#### `dasherize`

The method [`dasherize`][String#dasherize] replaces the underscores in the receiver with dashes:

```ruby
"name".dasherize         # => "name"
"contact_data".dasherize # => "contact-data"
```

The XML serializer of models uses this method to dasherize node names:

```ruby
# active_model/serializers/xml.rb
def reformat_name(name)
  name = name.camelize if camelize?
  dasherize? ? name.dasherize : name
end
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#dasherize]: https://api.rubyonrails.org/classes/String.html#method-i-dasherize

#### `demodulize`

Given a string with a qualified constant name, [`demodulize`][String#demodulize] returns the very constant name, that is, the rightmost part of it:

```ruby
"Product".demodulize                        # => "Product"
"Backoffice::UsersController".demodulize    # => "UsersController"
"Admin::Hotel::ReservationUtils".demodulize # => "ReservationUtils"
"::Inflections".demodulize                  # => "Inflections"
"".demodulize                               # => ""
```

Active Record for example uses this method to compute the name of a counter cache column:

```ruby
# active_record/reflection.rb
def counter_cache_column
  if options[:counter_cache] == true
    "#{active_record.name.demodulize.underscore.pluralize}_count"
  elsif options[:counter_cache]
    options[:counter_cache]
  end
end
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#demodulize]: https://api.rubyonrails.org/classes/String.html#method-i-demodulize

#### `deconstantize`

Given a string with a qualified constant reference expression, [`deconstantize`][String#deconstantize] removes the rightmost segment, generally leaving the name of the constant's container:

```ruby
"Product".deconstantize                        # => ""
"Backoffice::UsersController".deconstantize    # => "Backoffice"
"Admin::Hotel::ReservationUtils".deconstantize # => "Admin::Hotel"
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#deconstantize]: https://api.rubyonrails.org/classes/String.html#method-i-deconstantize

#### `parameterize`

The method [`parameterize`][String#parameterize] normalizes its receiver in a way that can be used in pretty URLs.

```ruby
"John Smith".parameterize # => "john-smith"
"Kurt Gödel".parameterize # => "kurt-godel"
```

To preserve the case of the string, set the `preserve_case` argument to true. By default, `preserve_case` is set to false.

```ruby
"John Smith".parameterize(preserve_case: true) # => "John-Smith"
"Kurt Gödel".parameterize(preserve_case: true) # => "Kurt-Godel"
```

To use a custom separator, override the `separator` argument.

```ruby
"John Smith".parameterize(separator: "_") # => "john_smith"
"Kurt Gödel".parameterize(separator: "_") # => "kurt_godel"
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#parameterize]: https://api.rubyonrails.org/classes/String.html#method-i-parameterize

#### `tableize`

The method [`tableize`][String#tableize] is `underscore` followed by `pluralize`.

```ruby
"Person".tableize      # => "people"
"Invoice".tableize     # => "invoices"
"InvoiceLine".tableize # => "invoice_lines"
```

As a rule of thumb, `tableize` returns the table name that corresponds to a given model for simple cases. The actual implementation in Active Record is not straight `tableize` indeed, because it also demodulizes the class name and checks a few options that may affect the returned string.

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#tableize]: https://api.rubyonrails.org/classes/String.html#method-i-tableize

#### `classify`

The method [`classify`][String#classify] is the inverse of `tableize`. It gives you the class name corresponding to a table name:

```ruby
"people".classify        # => "Person"
"invoices".classify      # => "Invoice"
"invoice_lines".classify # => "InvoiceLine"
```

The method understands qualified table names:

```ruby
"highrise_production.companies".classify # => "Company"
```

Note that `classify` returns a class name as a string. You can get the actual class object by invoking `constantize` on it, explained next.

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#classify]: https://api.rubyonrails.org/classes/String.html#method-i-classify

#### `constantize`

The method [`constantize`][String#constantize] resolves the constant reference expression in its receiver:

```ruby
"Integer".constantize # => Integer

module M
  X = 1
end
"M::X".constantize # => 1
```

If the string evaluates to no known constant, or its content is not even a valid constant name, `constantize` raises `NameError`.

Constant name resolution by `constantize` starts always at the top-level `Object` even if there is no leading "::".

```ruby
X = :in_Object
module M
  X = :in_M

  X                 # => :in_M
  "::X".constantize # => :in_Object
  "X".constantize   # => :in_Object (!)
end
```

So, it is in general not equivalent to what Ruby would do in the same spot, had a real constant be evaluated.

Mailer test cases obtain the mailer being tested from the name of the test class using `constantize`:

```ruby
# action_mailer/test_case.rb
def determine_default_mailer(name)
  name.delete_suffix("Test").constantize
rescue NameError => e
  raise NonInferrableMailerError.new(name)
end
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#constantize]: https://api.rubyonrails.org/classes/String.html#method-i-constantize

#### `humanize`

The method [`humanize`][String#humanize] tweaks an attribute name for display to end users.

Specifically, it performs these transformations:

  * Applies human inflection rules to the argument.
  * Deletes leading underscores, if any.
  * Removes a "_id" suffix if present.
  * Replaces underscores with spaces, if any.
  * Downcases all words except acronyms.
  * Capitalizes the first word.

The capitalization of the first word can be turned off by setting the
`:capitalize` option to false (default is true).

```ruby
"name".humanize                         # => "Name"
"author_id".humanize                    # => "Author"
"author_id".humanize(capitalize: false) # => "author"
"comments_count".humanize               # => "Comments count"
"_id".humanize                          # => "Id"
```

If "SSL" was defined to be an acronym:

```ruby
"ssl_error".humanize # => "SSL error"
```

The helper method `full_messages` uses `humanize` as a fallback to include
attribute names:

```ruby
def full_messages
  map { |attribute, message| full_message(attribute, message) }
end

def full_message
  # ...
  attr_name = attribute.to_s.tr(".", "_").humanize
  attr_name = @base.class.human_attribute_name(attribute, default: attr_name)
  # ...
end
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#humanize]: https://api.rubyonrails.org/classes/String.html#method-i-humanize

#### `foreign_key`

The method [`foreign_key`][String#foreign_key] gives a foreign key column name from a class name. To do so it demodulizes, underscores, and adds "_id":

```ruby
"User".foreign_key           # => "user_id"
"InvoiceLine".foreign_key    # => "invoice_line_id"
"Admin::Session".foreign_key # => "session_id"
```

Pass a false argument if you do not want the underscore in "_id":

```ruby
"User".foreign_key(false) # => "userid"
```

Associations use this method to infer foreign keys, for example `has_one` and `has_many` do this:

```ruby
# active_record/associations.rb
foreign_key = options[:foreign_key] || reflection.active_record.name.foreign_key
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#foreign_key]: https://api.rubyonrails.org/classes/String.html#method-i-foreign_key

#### `upcase_first`

The method [`upcase_first`][String#upcase_first] capitalizes the first letter of the receiver:

```ruby
"employee salary".upcase_first # => "Employee salary"
"".upcase_first                # => ""
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#upcase_first]: https://api.rubyonrails.org/classes/String.html#method-i-upcase_first

#### `downcase_first`

The method [`downcase_first`][String#downcase_first] converts the first letter of the receiver to lowercase:

```ruby
"If I had read Alice in Wonderland".downcase_first # => "if I had read Alice in Wonderland"
"".downcase_first                                  # => ""
```

NOTE: Defined in `active_support/core_ext/string/inflections.rb`.

[String#downcase_first]: https://api.rubyonrails.org/classes/String.html#method-i-downcase_first

### Conversions

#### `to_date`, `to_time`, `to_datetime`

The methods [`to_date`][String#to_date], [`to_time`][String#to_time], and [`to_datetime`][String#to_datetime] are basically convenience wrappers around `Date._parse`:

```ruby
"2010-07-27".to_date              # => Tue, 27 Jul 2010
"2010-07-27 23:37:00".to_time     # => 2010-07-27 23:37:00 +0200
"2010-07-27 23:37:00".to_datetime # => Tue, 27 Jul 2010 23:37:00 +0000
```

`to_time` receives an optional argument `:utc` or `:local`, to indicate which time zone you want the time in:

```ruby
"2010-07-27 23:42:00".to_time(:utc)   # => 2010-07-27 23:42:00 UTC
"2010-07-27 23:42:00".to_time(:local) # => 2010-07-27 23:42:00 +0200
```

Default is `:local`.

Please refer to the documentation of `Date._parse` for further details.

INFO: The three of them return `nil` for blank receivers.

NOTE: Defined in `active_support/core_ext/string/conversions.rb`.

[String#to_date]: https://api.rubyonrails.org/classes/String.html#method-i-to_date
[String#to_datetime]: https://api.rubyonrails.org/classes/String.html#method-i-to_datetime
[String#to_time]: https://api.rubyonrails.org/classes/String.html#method-i-to_time

Extensions to `Symbol`
----------------------

### `starts_with?` and `ends_with?`

Active Support defines 3rd person aliases of `Symbol#start_with?` and `Symbol#end_with?`:

```ruby
:foo.starts_with?("f") # => true
:foo.ends_with?("o")   # => true
```

NOTE: Defined in `active_support/core_ext/symbol/starts_ends_with.rb`.

Extensions to `Numeric`
-----------------------

### Bytes

All numbers respond to these methods:

* [`bytes`][Numeric#bytes]
* [`kilobytes`][Numeric#kilobytes]
* [`megabytes`][Numeric#megabytes]
* [`gigabytes`][Numeric#gigabytes]
* [`terabytes`][Numeric#terabytes]
* [`petabytes`][Numeric#petabytes]
* [`exabytes`][Numeric#exabytes]
* [`zettabytes`][Numeric#zettabytes]

They return the corresponding amount of bytes, using a conversion factor of 1024:

```ruby
2.kilobytes   # => 2048
3.megabytes   # => 3145728
3.5.gigabytes # => 3758096384.0
-4.exabytes   # => -4611686018427387904
```

Singular forms are aliased so you are able to say:

```ruby
1.megabyte # => 1048576
```

NOTE: Defined in `active_support/core_ext/numeric/bytes.rb`.

[Numeric#bytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-bytes
[Numeric#exabytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-exabytes
[Numeric#gigabytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-gigabytes
[Numeric#kilobytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-kilobytes
[Numeric#megabytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-megabytes
[Numeric#petabytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-petabytes
[Numeric#terabytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-terabytes
[Numeric#zettabytes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-zettabytes

### Time

The following methods:

* [`seconds`][Numeric#seconds]
* [`minutes`][Numeric#minutes]
* [`hours`][Numeric#hours]
* [`days`][Numeric#days]
* [`weeks`][Numeric#weeks]
* [`fortnights`][Numeric#fortnights]

enable time declarations and calculations, like `45.minutes + 2.hours + 4.weeks`. Their return values can also be added to or subtracted from Time objects.

These methods can be combined with [`from_now`][Duration#from_now], [`ago`][Duration#ago], etc, for precise date calculations. For example:

```ruby
# equivalent to Time.current.advance(days: 1)
1.day.from_now

# equivalent to Time.current.advance(weeks: 2)
2.weeks.from_now

# equivalent to Time.current.advance(days: 4, weeks: 5)
(4.days + 5.weeks).from_now
```

WARNING. For other durations please refer to the time extensions to `Integer`.

NOTE: Defined in `active_support/core_ext/numeric/time.rb`.

[Duration#ago]: https://api.rubyonrails.org/classes/ActiveSupport/Duration.html#method-i-ago
[Duration#from_now]: https://api.rubyonrails.org/classes/ActiveSupport/Duration.html#method-i-from_now
[Numeric#days]: https://api.rubyonrails.org/classes/Numeric.html#method-i-days
[Numeric#fortnights]: https://api.rubyonrails.org/classes/Numeric.html#method-i-fortnights
[Numeric#hours]: https://api.rubyonrails.org/classes/Numeric.html#method-i-hours
[Numeric#minutes]: https://api.rubyonrails.org/classes/Numeric.html#method-i-minutes
[Numeric#seconds]: https://api.rubyonrails.org/classes/Numeric.html#method-i-seconds
[Numeric#weeks]: https://api.rubyonrails.org/classes/Numeric.html#method-i-weeks

### Formatting

Enables the formatting of numbers in a variety of ways.

Produce a string representation of a number as a telephone number:

```ruby
5551234.to_fs(:phone)
# => 555-1234
1235551234.to_fs(:phone)
# => 123-555-1234
1235551234.to_fs(:phone, area_code: true)
# => (123) 555-1234
1235551234.to_fs(:phone, delimiter: " ")
# => 123 555 1234
1235551234.to_fs(:phone, area_code: true, extension: 555)
# => (123) 555-1234 x 555
1235551234.to_fs(:phone, country_code: 1)
# => +1-123-555-1234
```

Produce a string representation of a number as currency:

```ruby
1234567890.50.to_fs(:currency)                 # => $1,234,567,890.50
1234567890.506.to_fs(:currency)                # => $1,234,567,890.51
1234567890.506.to_fs(:currency, precision: 3)  # => $1,234,567,890.506
```

Produce a string representation of a number as a percentage:

```ruby
100.to_fs(:percentage)
# => 100.000%
100.to_fs(:percentage, precision: 0)
# => 100%
1000.to_fs(:percentage, delimiter: ".", separator: ",")
# => 1.000,000%
302.24398923423.to_fs(:percentage, precision: 5)
# => 302.24399%
```

Produce a string representation of a number in delimited form:

```ruby
12345678.to_fs(:delimited)                     # => 12,345,678
12345678.05.to_fs(:delimited)                  # => 12,345,678.05
12345678.to_fs(:delimited, delimiter: ".")     # => 12.345.678
12345678.to_fs(:delimited, delimiter: ",")     # => 12,345,678
12345678.05.to_fs(:delimited, separator: " ")  # => 12,345,678 05
```

Produce a string representation of a number rounded to a precision:

```ruby
111.2345.to_fs(:rounded)                     # => 111.235
111.2345.to_fs(:rounded, precision: 2)       # => 111.23
13.to_fs(:rounded, precision: 5)             # => 13.00000
389.32314.to_fs(:rounded, precision: 0)      # => 389
111.2345.to_fs(:rounded, significant: true)  # => 111
```

Produce a string representation of a number as a human-readable number of bytes:

```ruby
123.to_fs(:human_size)                  # => 123 Bytes
1234.to_fs(:human_size)                 # => 1.21 KB
12345.to_fs(:human_size)                # => 12.1 KB
1234567.to_fs(:human_size)              # => 1.18 MB
1234567890.to_fs(:human_size)           # => 1.15 GB
1234567890123.to_fs(:human_size)        # => 1.12 TB
1234567890123456.to_fs(:human_size)     # => 1.1 PB
1234567890123456789.to_fs(:human_size)  # => 1.07 EB
```

Produce a string representation of a number in human-readable words:

```ruby
123.to_fs(:human)               # => "123"
1234.to_fs(:human)              # => "1.23 Thousand"
12345.to_fs(:human)             # => "12.3 Thousand"
1234567.to_fs(:human)           # => "1.23 Million"
1234567890.to_fs(:human)        # => "1.23 Billion"
1234567890123.to_fs(:human)     # => "1.23 Trillion"
1234567890123456.to_fs(:human)  # => "1.23 Quadrillion"
```

NOTE: Defined in `active_support/core_ext/numeric/conversions.rb`.

Extensions to `Integer`
-----------------------

### `multiple_of?`

The method [`multiple_of?`][Integer#multiple_of?] tests whether an integer is multiple of the argument:

```ruby
2.multiple_of?(1) # => true
1.multiple_of?(2) # => false
```

NOTE: Defined in `active_support/core_ext/integer/multiple.rb`.

[Integer#multiple_of?]: https://api.rubyonrails.org/classes/Integer.html#method-i-multiple_of-3F

### `ordinal`

The method [`ordinal`][Integer#ordinal] returns the ordinal suffix string corresponding to the receiver integer:

```ruby
1.ordinal    # => "st"
2.ordinal    # => "nd"
53.ordinal   # => "rd"
2009.ordinal # => "th"
-21.ordinal  # => "st"
-134.ordinal # => "th"
```

NOTE: Defined in `active_support/core_ext/integer/inflections.rb`.

[Integer#ordinal]: https://api.rubyonrails.org/classes/Integer.html#method-i-ordinal

### `ordinalize`

The method [`ordinalize`][Integer#ordinalize] returns the ordinal string corresponding to the receiver integer. In comparison, note that the `ordinal` method returns **only** the suffix string.

```ruby
1.ordinalize    # => "1st"
2.ordinalize    # => "2nd"
53.ordinalize   # => "53rd"
2009.ordinalize # => "2009th"
-21.ordinalize  # => "-21st"
-134.ordinalize # => "-134th"
```

NOTE: Defined in `active_support/core_ext/integer/inflections.rb`.

[Integer#ordinalize]: https://api.rubyonrails.org/classes/Integer.html#method-i-ordinalize

### Time

The following methods:

* [`months`][Integer#months]
* [`years`][Integer#years]

enable time declarations and calculations, like `4.months + 5.years`. Their return values can also be added to or subtracted from Time objects.

These methods can be combined with [`from_now`][Duration#from_now], [`ago`][Duration#ago], etc, for precise date calculations. For example:

```ruby
# equivalent to Time.current.advance(months: 1)
1.month.from_now

# equivalent to Time.current.advance(years: 2)
2.years.from_now

# equivalent to Time.current.advance(months: 4, years: 5)
(4.months + 5.years).from_now
```

WARNING. For other durations please refer to the time extensions to `Numeric`.

NOTE: Defined in `active_support/core_ext/integer/time.rb`.

[Integer#months]: https://api.rubyonrails.org/classes/Integer.html#method-i-months
[Integer#years]: https://api.rubyonrails.org/classes/Integer.html#method-i-years

Extensions to `BigDecimal`
--------------------------

### `to_s`

The method `to_s` provides a default specifier of "F". This means that a simple call to `to_s` will result in floating-point representation instead of scientific notation:

```ruby
BigDecimal(5.00, 6).to_s       # => "5.0"
```

Scientific notation is still supported:

```ruby
BigDecimal(5.00, 6).to_s("e")  # => "0.5E1"
```

Extensions to `Enumerable`
--------------------------

### `index_by`

The method [`index_by`][Enumerable#index_by] generates a hash with the elements of an enumerable indexed by some key.

It iterates through the collection and passes each element to a block. The element will be keyed by the value returned by the block:

```ruby
invoices.index_by(&:number)
# => {"2009-032" => <Invoice ...>, "2009-008" => <Invoice ...>, ...}
```

WARNING. Keys should normally be unique. If the block returns the same value for different elements no collection is built for that key. The last item will win.

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#index_by]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-index_by

### `index_with`

The method [`index_with`][Enumerable#index_with] generates a hash with the elements of an enumerable as keys. The value
is either a passed default or returned in a block.

```ruby
post = Post.new(title: "hey there", body: "what's up?")

%i( title body ).index_with { |attr_name| post.public_send(attr_name) }
# => { title: "hey there", body: "what's up?" }

WEEKDAYS.index_with(Interval.all_day)
# => { monday: [ 0, 1440 ], … }
```

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#index_with]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-index_with

### `many?`

The method [`many?`][Enumerable#many?] is shorthand for `collection.size > 1`:

```erb
<% if pages.many? %>
  <%= pagination_links %>
<% end %>
```

If an optional block is given, `many?` only takes into account those elements that return true:

```ruby
@see_more = videos.many? { |video| video.category == params[:category] }
```

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#many?]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-many-3F

### `exclude?`

The predicate [`exclude?`][Enumerable#exclude?] tests whether a given object does **not** belong to the collection. It is the negation of the built-in `include?`:

```ruby
to_visit << node if visited.exclude?(node)
```

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#exclude?]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-exclude-3F

### `including`

The method [`including`][Enumerable#including] returns a new enumerable that includes the passed elements:

```ruby
[ 1, 2, 3 ].including(4, 5)                    # => [ 1, 2, 3, 4, 5 ]
["David", "Rafael"].including %w[ Aaron Todd ] # => ["David", "Rafael", "Aaron", "Todd"]
```

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#including]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-including

### `excluding`

The method [`excluding`][Enumerable#excluding] returns a copy of an enumerable with the specified elements
removed:

```ruby
["David", "Rafael", "Aaron", "Todd"].excluding("Aaron", "Todd") # => ["David", "Rafael"]
```

`excluding` is aliased to [`without`][Enumerable#without].

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#excluding]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-excluding
[Enumerable#without]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-without

### `pluck`

The method [`pluck`][Enumerable#pluck] extracts the given key from each element:

```ruby
[{ name: "David" }, { name: "Rafael" }, { name: "Aaron" }].pluck(:name) # => ["David", "Rafael", "Aaron"]
[{ id: 1, name: "David" }, { id: 2, name: "Rafael" }].pluck(:id, :name) # => [[1, "David"], [2, "Rafael"]]
```

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#pluck]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-pluck

### `pick`

The method [`pick`][Enumerable#pick] extracts the given key from the first element:

```ruby
[{ name: "David" }, { name: "Rafael" }, { name: "Aaron" }].pick(:name) # => "David"
[{ id: 1, name: "David" }, { id: 2, name: "Rafael" }].pick(:id, :name) # => [1, "David"]
```

NOTE: Defined in `active_support/core_ext/enumerable.rb`.

[Enumerable#pick]: https://api.rubyonrails.org/classes/Enumerable.html#method-i-pick

Extensions to `Array`
---------------------

### Accessing

Active Support augments the API of arrays to ease certain ways of accessing them. For example, [`to`][Array#to] returns the subarray of elements up to the one at the passed index:

```ruby
%w(a b c d).to(2) # => ["a", "b", "c"]
[].to(7)          # => []
```

Similarly, [`from`][Array#from] returns the tail from the element at the passed index to the end. If the index is greater than the length of the array, it returns an empty array.

```ruby
%w(a b c d).from(2)  # => ["c", "d"]
%w(a b c d).from(10) # => []
[].from(0)           # => []
```

The method [`including`][Array#including] returns a new array that includes the passed elements:

```ruby
[ 1, 2, 3 ].including(4, 5)          # => [ 1, 2, 3, 4, 5 ]
[ [ 0, 1 ] ].including([ [ 1, 0 ] ]) # => [ [ 0, 1 ], [ 1, 0 ] ]
```

The method [`excluding`][Array#excluding] returns a copy of the Array excluding the specified elements.
This is an optimization of `Enumerable#excluding` that uses `Array#-`
instead of `Array#reject` for performance reasons.

```ruby
["David", "Rafael", "Aaron", "Todd"].excluding("Aaron", "Todd") # => ["David", "Rafael"]
[ [ 0, 1 ], [ 1, 0 ] ].excluding([ [ 1, 0 ] ])                  # => [ [ 0, 1 ] ]
```

The methods [`second`][Array#second], [`third`][Array#third], [`fourth`][Array#fourth], and [`fifth`][Array#fifth] return the corresponding element, as do [`second_to_last`][Array#second_to_last] and [`third_to_last`][Array#third_to_last] (`first` and `last` are built-in). Thanks to social wisdom and positive constructiveness all around, [`forty_two`][Array#forty_two] is also available.

```ruby
%w(a b c d).third # => "c"
%w(a b c d).fifth # => nil
```

NOTE: Defined in `active_support/core_ext/array/access.rb`.

[Array#excluding]: https://api.rubyonrails.org/classes/Array.html#method-i-excluding
[Array#fifth]: https://api.rubyonrails.org/classes/Array.html#method-i-fifth
[Array#forty_two]: https://api.rubyonrails.org/classes/Array.html#method-i-forty_two
[Array#fourth]: https://api.rubyonrails.org/classes/Array.html#method-i-fourth
[Array#from]: https://api.rubyonrails.org/classes/Array.html#method-i-from
[Array#including]: https://api.rubyonrails.org/classes/Array.html#method-i-including
[Array#second]: https://api.rubyonrails.org/classes/Array.html#method-i-second
[Array#second_to_last]: https://api.rubyonrails.org/classes/Array.html#method-i-second_to_last
[Array#third]: https://api.rubyonrails.org/classes/Array.html#method-i-third
[Array#third_to_last]: https://api.rubyonrails.org/classes/Array.html#method-i-third_to_last
[Array#to]: https://api.rubyonrails.org/classes/Array.html#method-i-to

### Extracting

The method [`extract!`][Array#extract!] removes and returns the elements for which the block returns a true value.
If no block is given, an Enumerator is returned instead.

```ruby
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
odd_numbers = numbers.extract! { |number| number.odd? } # => [1, 3, 5, 7, 9]
numbers # => [0, 2, 4, 6, 8]
```

NOTE: Defined in `active_support/core_ext/array/extract.rb`.

[Array#extract!]: https://api.rubyonrails.org/classes/Array.html#method-i-extract-21

### Options Extraction

When the last argument in a method call is a hash, except perhaps for a `&block` argument, Ruby allows you to omit the brackets:

```ruby
User.exists?(email: params[:email])
```

That syntactic sugar is used a lot in Rails to avoid positional arguments where there would be too many, offering instead interfaces that emulate named parameters. In particular it is very idiomatic to use a trailing hash for options.

If a method expects a variable number of arguments and uses `*` in its declaration, however, such an options hash ends up being an item of the array of arguments, where it loses its role.

In those cases, you may give an options hash a distinguished treatment with [`extract_options!`][Array#extract_options!]. This method checks the type of the last item of an array. If it is a hash it pops it and returns it, otherwise it returns an empty hash.

Let's see for example the definition of the `caches_action` controller macro:

```ruby
def caches_action(*actions)
  return unless cache_configured?
  options = actions.extract_options!
  # ...
end
```

This method receives an arbitrary number of action names, and an optional hash of options as last argument. With the call to `extract_options!` you obtain the options hash and remove it from `actions` in a simple and explicit way.

NOTE: Defined in `active_support/core_ext/array/extract_options.rb`.

[Array#extract_options!]: https://api.rubyonrails.org/classes/Array.html#method-i-extract_options-21

### Conversions

#### `to_sentence`

The method [`to_sentence`][Array#to_sentence] turns an array into a string containing a sentence that enumerates its items:

```ruby
%w().to_sentence                # => ""
%w(Earth).to_sentence           # => "Earth"
%w(Earth Wind).to_sentence      # => "Earth and Wind"
%w(Earth Wind Fire).to_sentence # => "Earth, Wind, and Fire"
```

This method accepts three options:

* `:two_words_connector`: What is used for arrays of length 2. Default is " and ".
* `:words_connector`: What is used to join the elements of arrays with 3 or more elements, except for the last two. Default is ", ".
* `:last_word_connector`: What is used to join the last items of an array with 3 or more elements. Default is ", and ".

The defaults for these options can be localized, their keys are:

| Option                 | I18n key                            |
| ---------------------- | ----------------------------------- |
| `:two_words_connector` | `support.array.two_words_connector` |
| `:words_connector`     | `support.array.words_connector`     |
| `:last_word_connector` | `support.array.last_word_connector` |

NOTE: Defined in `active_support/core_ext/array/conversions.rb`.

[Array#to_sentence]: https://api.rubyonrails.org/classes/Array.html#method-i-to_sentence

#### `to_fs`

The method [`to_fs`][Array#to_fs] acts like `to_s` by default.

If the array contains items that respond to `id`, however, the symbol
`:db` may be passed as argument. That's typically used with
collections of Active Record objects. Returned strings are:

```ruby
[].to_fs(:db)            # => "null"
[user].to_fs(:db)        # => "8456"
invoice.lines.to_fs(:db) # => "23,567,556,12"
```

Integers in the example above are supposed to come from the respective calls to `id`.

NOTE: Defined in `active_support/core_ext/array/conversions.rb`.

[Array#to_fs]: https://api.rubyonrails.org/classes/Array.html#method-i-to_fs

#### `to_xml`

The method [`to_xml`][Array#to_xml] returns a string containing an XML representation of its receiver:

```ruby
Contributor.limit(2).order(:rank).to_xml
# =>
# <?xml version="1.0" encoding="UTF-8"?>
# <contributors type="array">
#   <contributor>
#     <id type="integer">4356</id>
#     <name>Jeremy Kemper</name>
#     <rank type="integer">1</rank>
#     <url-id>jeremy-kemper</url-id>
#   </contributor>
#   <contributor>
#     <id type="integer">4404</id>
#     <name>David Heinemeier Hansson</name>
#     <rank type="integer">2</rank>
#     <url-id>david-heinemeier-hansson</url-id>
#   </contributor>
# </contributors>
```

To do so it sends `to_xml` to every item in turn, and collects the results under a root node. All items must respond to `to_xml`, an exception is raised otherwise.

By default, the name of the root element is the underscored and dasherized plural of the name of the class of the first item, provided the rest of elements belong to that type (checked with `is_a?`) and they are not hashes. In the example above that's "contributors".

If there's any element that does not belong to the type of the first one the root node becomes "objects":

```ruby
[Contributor.first, Commit.first].to_xml
# =>
# <?xml version="1.0" encoding="UTF-8"?>
# <objects type="array">
#   <object>
#     <id type="integer">4583</id>
#     <name>Aaron Batalion</name>
#     <rank type="integer">53</rank>
#     <url-id>aaron-batalion</url-id>
#   </object>
#   <object>
#     <author>Joshua Peek</author>
#     <authored-timestamp type="datetime">2009-09-02T16:44:36Z</authored-timestamp>
#     <branch>origin/master</branch>
#     <committed-timestamp type="datetime">2009-09-02T16:44:36Z</committed-timestamp>
#     <committer>Joshua Peek</committer>
#     <git-show nil="true"></git-show>
#     <id type="integer">190316</id>
#     <imported-from-svn type="boolean">false</imported-from-svn>
#     <message>Kill AMo observing wrap_with_notifications since ARes was only using it</message>
#     <sha1>723a47bfb3708f968821bc969a9a3fc873a3ed58</sha1>
#   </object>
# </objects>
```

If the receiver is an array of hashes the root element is by default also "objects":

```ruby
[{ a: 1, b: 2 }, { c: 3 }].to_xml
# =>
# <?xml version="1.0" encoding="UTF-8"?>
# <objects type="array">
#   <object>
#     <b type="integer">2</b>
#     <a type="integer">1</a>
#   </object>
#   <object>
#     <c type="integer">3</c>
#   </object>
# </objects>
```

WARNING. If the collection is empty the root element is by default "nil-classes". That's a gotcha, for example the root element of the list of contributors above would not be "contributors" if the collection was empty, but "nil-classes". You may use the `:root` option to ensure a consistent root element.

The name of children nodes is by default the name of the root node singularized. In the examples above we've seen "contributor" and "object". The option `:children` allows you to set these node names.

The default XML builder is a fresh instance of `Builder::XmlMarkup`. You can configure your own builder via the `:builder` option. The method also accepts options like `:dasherize` and friends, they are forwarded to the builder:

```ruby
Contributor.limit(2).order(:rank).to_xml(skip_types: true)
# =>
# <?xml version="1.0" encoding="UTF-8"?>
# <contributors>
#   <contributor>
#     <id>4356</id>
#     <name>Jeremy Kemper</name>
#     <rank>1</rank>
#     <url-id>jeremy-kemper</url-id>
#   </contributor>
#   <contributor>
#     <id>4404</id>
#     <name>David Heinemeier Hansson</name>
#     <rank>2</rank>
#     <url-id>david-heinemeier-hansson</url-id>
#   </contributor>
# </contributors>
```

NOTE: Defined in `active_support/core_ext/array/conversions.rb`.

[Array#to_xml]: https://api.rubyonrails.org/classes/Array.html#method-i-to_xml

### Wrapping

The method [`Array.wrap`][Array.wrap] wraps its argument in an array unless it is already an array (or array-like).

Specifically:

* If the argument is `nil` an empty array is returned.
* Otherwise, if the argument responds to `to_ary` it is invoked, and if the value of `to_ary` is not `nil`, it is returned.
* Otherwise, an array with the argument as its single element is returned.

```ruby
Array.wrap(nil)       # => []
Array.wrap([1, 2, 3]) # => [1, 2, 3]
Array.wrap(0)         # => [0]
```

This method is similar in purpose to `Kernel#Array`, but there are some differences:

* If the argument responds to `to_ary` the method is invoked. `Kernel#Array` moves on to try `to_a` if the returned value is `nil`, but `Array.wrap` returns an array with the argument as its single element right away.
* If the returned value from `to_ary` is neither `nil` nor an `Array` object, `Kernel#Array` raises an exception, while `Array.wrap` does not, it just returns the value.
* It does not call `to_a` on the argument, if the argument does not respond to `to_ary` it returns an array with the argument as its single element.

The last point is particularly worth comparing for some enumerables:

```ruby
Array.wrap(foo: :bar) # => [{:foo=>:bar}]
Array(foo: :bar)      # => [[:foo, :bar]]
```

There's also a related idiom that uses the splat operator:

```ruby
[*object]
```

NOTE: Defined in `active_support/core_ext/array/wrap.rb`.

[Array.wrap]: https://api.rubyonrails.org/classes/Array.html#method-c-wrap

### Duplicating

The method [`Array#deep_dup`][Array#deep_dup] duplicates itself and all objects inside
recursively with the Active Support method `Object#deep_dup`. It works like `Array#map`, sending `deep_dup` method to each object inside.

```ruby
array = [1, [2, 3]]
dup = array.deep_dup
dup[1][2] = 4
array[1][2] == nil   # => true
```

NOTE: Defined in `active_support/core_ext/object/deep_dup.rb`.

[Array#deep_dup]: https://api.rubyonrails.org/classes/Array.html#method-i-deep_dup

### Grouping

#### `in_groups_of(number, fill_with = nil)`

The method [`in_groups_of`][Array#in_groups_of] splits an array into consecutive groups of a certain size. It returns an array with the groups:

```ruby
[1, 2, 3].in_groups_of(2) # => [[1, 2], [3, nil]]
```

or yields them in turn if a block is passed:

```html+erb
<% sample.in_groups_of(3) do |a, b, c| %>
  <tr>
    <td><%= a %></td>
    <td><%= b %></td>
    <td><%= c %></td>
  </tr>
<% end %>
```

The first example shows how `in_groups_of` fills the last group with as many `nil` elements as needed to have the requested size. You can change this padding value using the second optional argument:

```ruby
[1, 2, 3].in_groups_of(2, 0) # => [[1, 2], [3, 0]]
```

And you can tell the method not to fill the last group by passing `false`:

```ruby
[1, 2, 3].in_groups_of(2, false) # => [[1, 2], [3]]
```

As a consequence `false` can't be used as a padding value.

NOTE: Defined in `active_support/core_ext/array/grouping.rb`.

[Array#in_groups_of]: https://api.rubyonrails.org/classes/Array.html#method-i-in_groups_of

#### `in_groups(number, fill_with = nil)`

The method [`in_groups`][Array#in_groups] splits an array into a certain number of groups. The method returns an array with the groups:

```ruby
%w(1 2 3 4 5 6 7).in_groups(3)
# => [["1", "2", "3"], ["4", "5", nil], ["6", "7", nil]]
```

or yields them in turn if a block is passed:

```ruby
%w(1 2 3 4 5 6 7).in_groups(3) { |group| p group }
["1", "2", "3"]
["4", "5", nil]
["6", "7", nil]
```

The examples above show that `in_groups` fills some groups with a trailing `nil` element as needed. A group can get at most one of these extra elements, the rightmost one if any. And the groups that have them are always the last ones.

You can change this padding value using the second optional argument:

```ruby
%w(1 2 3 4 5 6 7).in_groups(3, "0")
# => [["1", "2", "3"], ["4", "5", "0"], ["6", "7", "0"]]
```

And you can tell the method not to fill the smaller groups by passing `false`:

```ruby
%w(1 2 3 4 5 6 7).in_groups(3, false)
# => [["1", "2", "3"], ["4", "5"], ["6", "7"]]
```

As a consequence `false` can't be used as a padding value.

NOTE: Defined in `active_support/core_ext/array/grouping.rb`.

[Array#in_groups]: https://api.rubyonrails.org/classes/Array.html#method-i-in_groups

#### `split(value = nil)`

The method [`split`][Array#split] divides an array by a separator and returns the resulting chunks.

If a block is passed the separators are those elements of the array for which the block returns true:

```ruby
(-5..5).to_a.split { |i| i.multiple_of?(4) }
# => [[-5], [-3, -2, -1], [1, 2, 3], [5]]
```

Otherwise, the value received as argument, which defaults to `nil`, is the separator:

```ruby
[0, 1, -5, 1, 1, "foo", "bar"].split(1)
# => [[0], [-5], [], ["foo", "bar"]]
```

TIP: Observe in the previous example that consecutive separators result in empty arrays.

NOTE: Defined in `active_support/core_ext/array/grouping.rb`.

[Array#split]: https://api.rubyonrails.org/classes/Array.html#method-i-split

Extensions to `Hash`
--------------------

### Conversions

#### `to_xml`

The method [`to_xml`][Hash#to_xml] returns a string containing an XML representation of its receiver:

```ruby
{ foo: 1, bar: 2 }.to_xml
# =>
# <?xml version="1.0" encoding="UTF-8"?>
# <hash>
#   <foo type="integer">1</foo>
#   <bar type="integer">2</bar>
# </hash>
```

To do so, the method loops over the pairs and builds nodes that depend on the _values_. Given a pair `key`, `value`:

* If `value` is a hash there's a recursive call with `key` as `:root`.

* If `value` is an array there's a recursive call with `key` as `:root`, and `key` singularized as `:children`.

* If `value` is a callable object it must expect one or two arguments. Depending on the arity, the callable is invoked with the `options` hash as first argument with `key` as `:root`, and `key` singularized as second argument. Its return value becomes a new node.

* If `value` responds to `to_xml` the method is invoked with `key` as `:root`.

* Otherwise, a node with `key` as tag is created with a string representation of `value` as text node. If `value` is `nil` an attribute "nil" set to "true" is added. Unless the option `:skip_types` exists and is true, an attribute "type" is added as well according to the following mapping:

```ruby
XML_TYPE_NAMES = {
  "Symbol"     => "symbol",
  "Integer"    => "integer",
  "BigDecimal" => "decimal",
  "Float"      => "float",
  "TrueClass"  => "boolean",
  "FalseClass" => "boolean",
  "Date"       => "date",
  "DateTime"   => "datetime",
  "Time"       => "datetime"
}
```

By default the root node is "hash", but that's configurable via the `:root` option.

The default XML builder is a fresh instance of `Builder::XmlMarkup`. You can configure your own builder with the `:builder` option. The method also accepts options like `:dasherize` and friends, they are forwarded to the builder.

NOTE: Defined in `active_support/core_ext/hash/conversions.rb`.

[Hash#to_xml]: https://api.rubyonrails.org/classes/Hash.html#method-i-to_xml

### Merging

Ruby has a built-in method `Hash#merge` that merges two hashes:

```ruby
{ a: 1, b: 1 }.merge(a: 0, c: 2)
# => {:a=>0, :b=>1, :c=>2}
```

Active Support defines a few more ways of merging hashes that may be convenient.

#### `reverse_merge` and `reverse_merge!`

In case of collision the key in the hash of the argument wins in `merge`. You can support option hashes with default values in a compact way with this idiom:

```ruby
options = { length: 30, omission: "..." }.merge(options)
```

Active Support defines [`reverse_merge`][Hash#reverse_merge] in case you prefer this alternative notation:

```ruby
options = options.reverse_merge(length: 30, omission: "...")
```

And a bang version [`reverse_merge!`][Hash#reverse_merge!] that performs the merge in place:

```ruby
options.reverse_merge!(length: 30, omission: "...")
```

WARNING. Take into account that `reverse_merge!` may change the hash in the caller, which may or may not be a good idea.

NOTE: Defined in `active_support/core_ext/hash/reverse_merge.rb`.

[Hash#reverse_merge!]: https://api.rubyonrails.org/classes/Hash.html#method-i-reverse_merge-21
[Hash#reverse_merge]: https://api.rubyonrails.org/classes/Hash.html#method-i-reverse_merge

#### `reverse_update`

The method [`reverse_update`][Hash#reverse_update] is an alias for `reverse_merge!`, explained above.

WARNING. Note that `reverse_update` has no bang.

NOTE: Defined in `active_support/core_ext/hash/reverse_merge.rb`.

[Hash#reverse_update]: https://api.rubyonrails.org/classes/Hash.html#method-i-reverse_update

#### `deep_merge` and `deep_merge!`

As you can see in the previous example if a key is found in both hashes the value in the one in the argument wins.

Active Support defines [`Hash#deep_merge`][Hash#deep_merge]. In a deep merge, if a key is found in both hashes and their values are hashes in turn, then their _merge_ becomes the value in the resulting hash:

```ruby
{ a: { b: 1 } }.deep_merge(a: { c: 2 })
# => {:a=>{:b=>1, :c=>2}}
```

The method [`deep_merge!`][Hash#deep_merge!] performs a deep merge in place.

NOTE: Defined in `active_support/core_ext/hash/deep_merge.rb`.

[Hash#deep_merge!]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_merge-21
[Hash#deep_merge]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_merge

### Deep Duplicating

The method [`Hash#deep_dup`][Hash#deep_dup] duplicates itself and all keys and values
inside recursively with Active Support method `Object#deep_dup`. It works like `Enumerator#each_with_object` with sending `deep_dup` method to each pair inside.

```ruby
hash = { a: 1, b: { c: 2, d: [3, 4] } }

dup = hash.deep_dup
dup[:b][:e] = 5
dup[:b][:d] << 5

hash[:b][:e] == nil      # => true
hash[:b][:d] == [3, 4]   # => true
```

NOTE: Defined in `active_support/core_ext/object/deep_dup.rb`.

[Hash#deep_dup]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_dup

### Working with Keys

#### `except!`

The method [`except!`][Hash#except!] is identical to the built-in `except` method but removes keys in place, returning `self`.

```ruby
{ a: 1, b: 2 }.except!(:a) # => {:b=>2}
{ a: 1, b: 2 }.except!(:c) # => {:a=>1, :b=>2}
```

If the receiver responds to `convert_key`, the method is called on each of the arguments. This allows `except!` (and `except`) to play nice with hashes with indifferent access for instance:

```ruby
{ a: 1 }.with_indifferent_access.except!(:a)  # => {}
{ a: 1 }.with_indifferent_access.except!("a") # => {}
```

NOTE: Defined in `active_support/core_ext/hash/except.rb`.

[Hash#except!]: https://api.rubyonrails.org/classes/Hash.html#method-i-except-21

#### `stringify_keys` and `stringify_keys!`

The method [`stringify_keys`][Hash#stringify_keys] returns a hash that has a stringified version of the keys in the receiver. It does so by sending `to_s` to them:

```ruby
{ nil => nil, 1 => 1, a: :a }.stringify_keys
# => {"" => nil, "1" => 1, "a" => :a}
```

In case of key collision, the value will be the one most recently inserted into the hash:

```ruby
{ "a" => 1, a: 2 }.stringify_keys
# The result will be
# => {"a"=>2}
```

This method may be useful for example to easily accept both symbols and strings as options. For instance `ActionView::Helpers::FormHelper` defines:

```ruby
def to_checkbox_tag(options = {}, checked_value = "1", unchecked_value = "0")
  options = options.stringify_keys
  options["type"] = "checkbox"
  # ...
end
```

The second line can safely access the "type" key, and let the user to pass either `:type` or "type".

There's also the bang variant [`stringify_keys!`][Hash#stringify_keys!] that stringifies keys in place.

Besides that, one can use [`deep_stringify_keys`][Hash#deep_stringify_keys] and [`deep_stringify_keys!`][Hash#deep_stringify_keys!] to stringify all the keys in the given hash and all the hashes nested in it. An example of the result is:

```ruby
{ nil => nil, 1 => 1, nested: { a: 3, 5 => 5 } }.deep_stringify_keys
# => {""=>nil, "1"=>1, "nested"=>{"a"=>3, "5"=>5}}
```

NOTE: Defined in `active_support/core_ext/hash/keys.rb`.

[Hash#deep_stringify_keys!]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_stringify_keys-21
[Hash#deep_stringify_keys]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_stringify_keys
[Hash#stringify_keys!]: https://api.rubyonrails.org/classes/Hash.html#method-i-stringify_keys-21
[Hash#stringify_keys]: https://api.rubyonrails.org/classes/Hash.html#method-i-stringify_keys

#### `symbolize_keys` and `symbolize_keys!`

The method [`symbolize_keys`][Hash#symbolize_keys] returns a hash that has a symbolized version of the keys in the receiver, where possible. It does so by sending `to_sym` to them:

```ruby
{ nil => nil, 1 => 1, "a" => "a" }.symbolize_keys
# => {nil=>nil, 1=>1, :a=>"a"}
```

WARNING. Note in the previous example only one key was symbolized.

In case of key collision, the value will be the one most recently inserted into the hash:

```ruby
{ "a" => 1, a: 2 }.symbolize_keys
# => {:a=>2}
```

This method may be useful for example to easily accept both symbols and strings as options. For instance `ActionText::TagHelper` defines

```ruby
def rich_textarea_tag(name, value = nil, options = {})
  options = options.symbolize_keys

  options[:input] ||= "trix_input_#{ActionText::TagHelper.id += 1}"
  # ...
end
```

The third line can safely access the `:input` key, and let the user to pass either `:input` or "input".

There's also the bang variant [`symbolize_keys!`][Hash#symbolize_keys!] that symbolizes keys in place.

Besides that, one can use [`deep_symbolize_keys`][Hash#deep_symbolize_keys] and [`deep_symbolize_keys!`][Hash#deep_symbolize_keys!] to symbolize all the keys in the given hash and all the hashes nested in it. An example of the result is:

```ruby
{ nil => nil, 1 => 1, "nested" => { "a" => 3, 5 => 5 } }.deep_symbolize_keys
# => {nil=>nil, 1=>1, nested:{a:3, 5=>5}}
```

NOTE: Defined in `active_support/core_ext/hash/keys.rb`.

[Hash#deep_symbolize_keys!]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_symbolize_keys-21
[Hash#deep_symbolize_keys]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_symbolize_keys
[Hash#symbolize_keys!]: https://api.rubyonrails.org/classes/Hash.html#method-i-symbolize_keys-21
[Hash#symbolize_keys]: https://api.rubyonrails.org/classes/Hash.html#method-i-symbolize_keys

#### `to_options` and `to_options!`

The methods [`to_options`][Hash#to_options] and [`to_options!`][Hash#to_options!] are aliases of `symbolize_keys` and `symbolize_keys!`, respectively.

NOTE: Defined in `active_support/core_ext/hash/keys.rb`.

[Hash#to_options!]: https://api.rubyonrails.org/classes/Hash.html#method-i-to_options-21
[Hash#to_options]: https://api.rubyonrails.org/classes/Hash.html#method-i-to_options

#### `assert_valid_keys`

The method [`assert_valid_keys`][Hash#assert_valid_keys] receives an arbitrary number of arguments, and checks whether the receiver has any key outside that list. If it does `ArgumentError` is raised.

```ruby
{ a: 1 }.assert_valid_keys(:a)  # passes
{ a: 1 }.assert_valid_keys("a") # ArgumentError
```

Active Record does not accept unknown options when building associations, for example. It implements that control via `assert_valid_keys`.

NOTE: Defined in `active_support/core_ext/hash/keys.rb`.

[Hash#assert_valid_keys]: https://api.rubyonrails.org/classes/Hash.html#method-i-assert_valid_keys

### Working with Values

#### `deep_transform_values` and `deep_transform_values!`

The method [`deep_transform_values`][Hash#deep_transform_values] returns a new hash with all values converted by the block operation. This includes the values from the root hash and from all nested hashes and arrays.

```ruby
hash = { person: { name: "Rob", age: "28" } }

hash.deep_transform_values { |value| value.to_s.upcase }
# => {person: {name: "ROB", age: "28"}}
```

There's also the bang variant [`deep_transform_values!`][Hash#deep_transform_values!] that destructively converts all values by using the block operation.

NOTE: Defined in `active_support/core_ext/hash/deep_transform_values.rb`.

[Hash#deep_transform_values!]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_transform_values-21
[Hash#deep_transform_values]: https://api.rubyonrails.org/classes/Hash.html#method-i-deep_transform_values

### Slicing

The method [`slice!`][Hash#slice!] replaces the hash with only the given keys and returns a hash containing the removed key/value pairs.

```ruby
hash = { a: 1, b: 2 }
rest = hash.slice!(:a) # => {:b=>2}
hash                   # => {:a=>1}
```

NOTE: Defined in `active_support/core_ext/hash/slice.rb`.

[Hash#slice!]: https://api.rubyonrails.org/classes/Hash.html#method-i-slice-21

### Extracting

The method [`extract!`][Hash#extract!] removes and returns the key/value pairs matching the given keys.

```ruby
hash = { a: 1, b: 2 }
rest = hash.extract!(:a) # => {:a=>1}
hash                     # => {:b=>2}
```

The method `extract!` returns the same subclass of Hash that the receiver is.

```ruby
hash = { a: 1, b: 2 }.with_indifferent_access
rest = hash.extract!(:a).class
# => ActiveSupport::HashWithIndifferentAccess
```

NOTE: Defined in `active_support/core_ext/hash/slice.rb`.

[Hash#extract!]: https://api.rubyonrails.org/classes/Hash.html#method-i-extract-21

### Indifferent Access

The method [`with_indifferent_access`][Hash#with_indifferent_access] returns an [`ActiveSupport::HashWithIndifferentAccess`][ActiveSupport::HashWithIndifferentAccess] out of its receiver:

```ruby
{ a: 1 }.with_indifferent_access["a"] # => 1
```

NOTE: Defined in `active_support/core_ext/hash/indifferent_access.rb`.

[ActiveSupport::HashWithIndifferentAccess]: https://api.rubyonrails.org/classes/ActiveSupport/HashWithIndifferentAccess.html
[Hash#with_indifferent_access]: https://api.rubyonrails.org/classes/Hash.html#method-i-with_indifferent_access

Extensions to `Regexp`
----------------------

### `multiline?`

The method [`multiline?`][Regexp#multiline?] says whether a regexp has the `/m` flag set, that is, whether the dot matches newlines.

```ruby
%r{.}.multiline?  # => false
%r{.}m.multiline? # => true

Regexp.new(".").multiline?                    # => false
Regexp.new(".", Regexp::MULTILINE).multiline? # => true
```

Rails uses this method in a single place, also in the routing code. Multiline regexps are disallowed for route requirements and this flag eases enforcing that constraint.

```ruby
def verify_regexp_requirements(requirements)
  # ...
  if requirement.multiline?
    raise ArgumentError, "Regexp multiline option is not allowed in routing requirements: #{requirement.inspect}"
  end
  # ...
end
```

NOTE: Defined in `active_support/core_ext/regexp.rb`.

[Regexp#multiline?]: https://api.rubyonrails.org/classes/Regexp.html#method-i-multiline-3F

Extensions to `Range`
---------------------

### `to_fs`

Active Support defines `Range#to_fs` as an alternative to `to_s` that understands an optional format argument. As of this writing the only supported non-default format is `:db`:

```ruby
(Date.today..Date.tomorrow).to_fs
# => "2009-10-25..2009-10-26"

(Date.today..Date.tomorrow).to_fs(:db)
# => "BETWEEN '2009-10-25' AND '2009-10-26'"
```

As the example depicts, the `:db` format generates a `BETWEEN` SQL clause. That is used by Active Record in its support for range values in conditions.

NOTE: Defined in `active_support/core_ext/range/conversions.rb`.

### `===` and `include?`

The methods `Range#===` and `Range#include?` say whether some value falls between the ends of a given instance:

```ruby
(2..3).include?(Math::E) # => true
```

Active Support extends these methods so that the argument may be another range in turn. In that case we test whether the ends of the argument range belong to the receiver themselves:

```ruby
(1..10) === (3..7)  # => true
(1..10) === (0..7)  # => false
(1..10) === (3..11) # => false
(1...9) === (3..9)  # => false

(1..10).include?(3..7)  # => true
(1..10).include?(0..7)  # => false
(1..10).include?(3..11) # => false
(1...9).include?(3..9)  # => false
```

NOTE: Defined in `active_support/core_ext/range/compare_range.rb`.

### `overlap?`

The method [`Range#overlap?`][Range#overlap?] says whether any two given ranges have non-void intersection:

```ruby
(1..10).overlap?(7..11)  # => true
(1..10).overlap?(0..7)   # => true
(1..10).overlap?(11..27) # => false
```

NOTE: Defined in `active_support/core_ext/range/overlap.rb`.

[Range#overlap?]: https://api.rubyonrails.org/classes/Range.html#method-i-overlaps-3F

Extensions to `Date`
--------------------

### Calculations

INFO: The following calculation methods have edge cases in October 1582, since days 5..14 just do not exist. This guide does not document their behavior around those days for brevity, but it is enough to say that they do what you would expect. That is, `Date.new(1582, 10, 4).tomorrow` returns `Date.new(1582, 10, 15)` and so on. Please check `test/core_ext/date_ext_test.rb` in the Active Support test suite for expected behavior.

#### `Date.current`

Active Support defines [`Date.current`][Date.current] to be today in the current time zone. That's like `Date.today`, except that it honors the user time zone, if defined. It also defines [`Date.yesterday`][Date.yesterday] and [`Date.tomorrow`][Date.tomorrow], and the instance predicates [`past?`][DateAndTime::Calculations#past?], [`today?`][DateAndTime::Calculations#today?], [`tomorrow?`][DateAndTime::Calculations#tomorrow?], [`next_day?`][DateAndTime::Calculations#next_day?], [`yesterday?`][DateAndTime::Calculations#yesterday?], [`prev_day?`][DateAndTime::Calculations#prev_day?], [`future?`][DateAndTime::Calculations#future?], [`on_weekday?`][DateAndTime::Calculations#on_weekday?] and [`on_weekend?`][DateAndTime::Calculations#on_weekend?], all of them relative to `Date.current`.

When making Date comparisons using methods which honor the user time zone, make sure to use `Date.current` and not `Date.today`. There are cases where the user time zone might be in the future compared to the system time zone, which `Date.today` uses by default. This means `Date.today` may equal `Date.yesterday`.

NOTE: Defined in `active_support/core_ext/date/calculations.rb`.

[Date.current]: https://api.rubyonrails.org/classes/Date.html#method-c-current
[Date.tomorrow]: https://api.rubyonrails.org/classes/Date.html#method-c-tomorrow
[Date.yesterday]: https://api.rubyonrails.org/classes/Date.html#method-c-yesterday
[DateAndTime::Calculations#future?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-future-3F
[DateAndTime::Calculations#on_weekday?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-on_weekday-3F
[DateAndTime::Calculations#on_weekend?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-on_weekend-3F
[DateAndTime::Calculations#past?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-past-3F

#### Named Dates

##### `beginning_of_week`, `end_of_week`

The methods [`beginning_of_week`][DateAndTime::Calculations#beginning_of_week] and [`end_of_week`][DateAndTime::Calculations#end_of_week] return the dates for the
beginning and end of the week, respectively. Weeks are assumed to start on
Monday, but that can be changed passing an argument, setting thread local
`Date.beginning_of_week` or [`config.beginning_of_week`][].

```ruby
d = Date.new(2010, 5, 8)     # => Sat, 08 May 2010
d.beginning_of_week          # => Mon, 03 May 2010
d.beginning_of_week(:sunday) # => Sun, 02 May 2010
d.end_of_week                # => Sun, 09 May 2010
d.end_of_week(:sunday)       # => Sat, 08 May 2010
```

`beginning_of_week` is aliased to [`at_beginning_of_week`][DateAndTime::Calculations#at_beginning_of_week] and `end_of_week` is aliased to [`at_end_of_week`][DateAndTime::Calculations#at_end_of_week].

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[`config.beginning_of_week`]: configuring.html#config-beginning-of-week
[DateAndTime::Calculations#at_beginning_of_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_beginning_of_week
[DateAndTime::Calculations#at_end_of_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_end_of_week
[DateAndTime::Calculations#beginning_of_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-beginning_of_week
[DateAndTime::Calculations#end_of_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-end_of_week

##### `monday`, `sunday`

The methods [`monday`][DateAndTime::Calculations#monday] and [`sunday`][DateAndTime::Calculations#sunday] return the dates for the previous Monday (or the same day if it is Monday) and
next Sunday (or the same day if it is Sunday), respectively.

```ruby
d = Date.new(2010, 5, 8)     # => Sat, 08 May 2010
d.monday                     # => Mon, 03 May 2010
d.sunday                     # => Sun, 09 May 2010

d = Date.new(2012, 9, 10)    # => Mon, 10 Sep 2012
d.monday                     # => Mon, 10 Sep 2012

d = Date.new(2012, 9, 16)    # => Sun, 16 Sep 2012
d.sunday                     # => Sun, 16 Sep 2012
```

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#monday]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-monday
[DateAndTime::Calculations#sunday]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-sunday

##### `prev_week`, `next_week`

The method [`next_week`][DateAndTime::Calculations#next_week] receives a symbol with a day name in English (default is the thread local [`Date.beginning_of_week`][Date.beginning_of_week], or [`config.beginning_of_week`][], or `:monday`) and it returns the date corresponding to that day.

```ruby
d = Date.new(2010, 5, 9) # => Sun, 09 May 2010
d.next_week              # => Mon, 10 May 2010
d.next_week(:saturday)   # => Sat, 15 May 2010
```

The method [`prev_week`][DateAndTime::Calculations#prev_week] is analogous:

```ruby
d.prev_week              # => Mon, 26 Apr 2010
d.prev_week(:saturday)   # => Sat, 01 May 2010
d.prev_week(:friday)     # => Fri, 30 Apr 2010
```

`prev_week` is aliased to [`last_week`][DateAndTime::Calculations#last_week].

Both `next_week` and `prev_week` work as expected when `Date.beginning_of_week` or `config.beginning_of_week` are set.

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[Date.beginning_of_week]: https://api.rubyonrails.org/classes/Date.html#method-c-beginning_of_week
[DateAndTime::Calculations#last_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-last_week
[DateAndTime::Calculations#next_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-next_week
[DateAndTime::Calculations#prev_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-prev_week

##### `beginning_of_month`, `end_of_month`

The methods [`beginning_of_month`][DateAndTime::Calculations#beginning_of_month] and [`end_of_month`][DateAndTime::Calculations#end_of_month] return the dates for the beginning and end of the month:

```ruby
d = Date.new(2010, 5, 9) # => Sun, 09 May 2010
d.beginning_of_month     # => Sat, 01 May 2010
d.end_of_month           # => Mon, 31 May 2010
```

`beginning_of_month` is aliased to [`at_beginning_of_month`][DateAndTime::Calculations#at_beginning_of_month], and `end_of_month` is aliased to [`at_end_of_month`][DateAndTime::Calculations#at_end_of_month].

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#at_beginning_of_month]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_beginning_of_month
[DateAndTime::Calculations#at_end_of_month]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_end_of_month
[DateAndTime::Calculations#beginning_of_month]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-beginning_of_month
[DateAndTime::Calculations#end_of_month]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-end_of_month

##### `quarter`, `beginning_of_quarter`, `end_of_quarter`

The method [`quarter`][DateAndTime::Calculations#quarter] returns the quarter of the receiver's calendar year:

```ruby
d = Date.new(2010, 5, 9) # => Sun, 09 May 2010
d.quarter                # => 2
```

The methods [`beginning_of_quarter`][DateAndTime::Calculations#beginning_of_quarter] and [`end_of_quarter`][DateAndTime::Calculations#end_of_quarter] return the dates for the beginning and end of the quarter of the receiver's calendar year:

```ruby
d = Date.new(2010, 5, 9) # => Sun, 09 May 2010
d.beginning_of_quarter   # => Thu, 01 Apr 2010
d.end_of_quarter         # => Wed, 30 Jun 2010
```

`beginning_of_quarter` is aliased to [`at_beginning_of_quarter`][DateAndTime::Calculations#at_beginning_of_quarter], and `end_of_quarter` is aliased to [`at_end_of_quarter`][DateAndTime::Calculations#at_end_of_quarter].

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-quarter
[DateAndTime::Calculations#at_beginning_of_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_beginning_of_quarter
[DateAndTime::Calculations#at_end_of_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_end_of_quarter
[DateAndTime::Calculations#beginning_of_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-beginning_of_quarter
[DateAndTime::Calculations#end_of_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-end_of_quarter

##### `beginning_of_year`, `end_of_year`

The methods [`beginning_of_year`][DateAndTime::Calculations#beginning_of_year] and [`end_of_year`][DateAndTime::Calculations#end_of_year] return the dates for the beginning and end of the year:

```ruby
d = Date.new(2010, 5, 9) # => Sun, 09 May 2010
d.beginning_of_year      # => Fri, 01 Jan 2010
d.end_of_year            # => Fri, 31 Dec 2010
```

`beginning_of_year` is aliased to [`at_beginning_of_year`][DateAndTime::Calculations#at_beginning_of_year], and `end_of_year` is aliased to [`at_end_of_year`][DateAndTime::Calculations#at_end_of_year].

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#at_beginning_of_year]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_beginning_of_year
[DateAndTime::Calculations#at_end_of_year]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-at_end_of_year
[DateAndTime::Calculations#beginning_of_year]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-beginning_of_year
[DateAndTime::Calculations#end_of_year]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-end_of_year

#### Other Date Computations

##### `years_ago`, `years_since`

The method [`years_ago`][DateAndTime::Calculations#years_ago] receives a number of years and returns the same date those many years ago:

```ruby
date = Date.new(2010, 6, 7)
date.years_ago(10) # => Wed, 07 Jun 2000
```

[`years_since`][DateAndTime::Calculations#years_since] moves forward in time:

```ruby
date = Date.new(2010, 6, 7)
date.years_since(10) # => Sun, 07 Jun 2020
```

If such a day does not exist, the last day of the corresponding month is returned:

```ruby
Date.new(2012, 2, 29).years_ago(3)     # => Sat, 28 Feb 2009
Date.new(2012, 2, 29).years_since(3)   # => Sat, 28 Feb 2015
```

[`last_year`][DateAndTime::Calculations#last_year] is short-hand for `#years_ago(1)`.

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#last_year]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-last_year
[DateAndTime::Calculations#years_ago]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-years_ago
[DateAndTime::Calculations#years_since]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-years_since

##### `months_ago`, `months_since`

The methods [`months_ago`][DateAndTime::Calculations#months_ago] and [`months_since`][DateAndTime::Calculations#months_since] work analogously for months:

```ruby
Date.new(2010, 4, 30).months_ago(2)   # => Sun, 28 Feb 2010
Date.new(2010, 4, 30).months_since(2) # => Wed, 30 Jun 2010
```

If such a day does not exist, the last day of the corresponding month is returned:

```ruby
Date.new(2010, 4, 30).months_ago(2)    # => Sun, 28 Feb 2010
Date.new(2009, 12, 31).months_since(2) # => Sun, 28 Feb 2010
```

[`last_month`][DateAndTime::Calculations#last_month] is short-hand for `#months_ago(1)`.

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#last_month]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-last_month
[DateAndTime::Calculations#months_ago]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-months_ago
[DateAndTime::Calculations#months_since]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-months_since

##### `weeks_ago`, `weeks_since`

The method [`weeks_ago`][DateAndTime::Calculations#weeks_ago] and [`weeks_since`][DateAndTime::Calculations#week_since] work analogously for weeks:

```ruby
Date.new(2010, 5, 24).weeks_ago(1)   # => Mon, 17 May 2010
Date.new(2010, 5, 24).weeks_since(2) # => Mon, 07 Jun 2010
```

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#weeks_ago]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-weeks_ago
[DateAndTime::Calculations#weeks_since]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-weeks_since

##### `advance`

The most generic way to jump to other days is [`advance`][Date#advance]. This method receives a hash with keys `:years`, `:months`, `:weeks`, `:days`, and returns a date advanced as much as the present keys indicate:

```ruby
date = Date.new(2010, 6, 6)
date.advance(years: 1, weeks: 2)  # => Mon, 20 Jun 2011
date.advance(months: 2, days: -2) # => Wed, 04 Aug 2010
```

Note in the previous example that increments may be negative.

NOTE: Defined in `active_support/core_ext/date/calculations.rb`.

[Date#advance]: https://api.rubyonrails.org/classes/Date.html#method-i-advance

#### Changing Components

The method [`change`][Date#change] allows you to get a new date which is the same as the receiver except for the given year, month, or day:

```ruby
Date.new(2010, 12, 23).change(year: 2011, month: 11)
# => Wed, 23 Nov 2011
```

This method is not tolerant to non-existing dates, if the change is invalid `ArgumentError` is raised:

```ruby
Date.new(2010, 1, 31).change(month: 2)
# => ArgumentError: invalid date
```

NOTE: Defined in `active_support/core_ext/date/calculations.rb`.

[Date#change]: https://api.rubyonrails.org/classes/Date.html#method-i-change

#### Durations

[`Duration`][ActiveSupport::Duration] objects can be added to and subtracted from dates:

```ruby
d = Date.current
# => Mon, 09 Aug 2010
d + 1.year
# => Tue, 09 Aug 2011
d - 3.hours
# => Sun, 08 Aug 2010 21:00:00 UTC +00:00
```

They translate to calls to `since` or `advance`. For example here we get the correct jump in the calendar reform:

```ruby
Date.new(1582, 10, 4) + 1.day
# => Fri, 15 Oct 1582
```

[ActiveSupport::Duration]: https://api.rubyonrails.org/classes/ActiveSupport/Duration.html

#### Timestamps

INFO: The following methods return a `Time` object if possible, otherwise a `DateTime`. If set, they honor the user time zone.

##### `beginning_of_day`, `end_of_day`

The method [`beginning_of_day`][Date#beginning_of_day] returns a timestamp at the beginning of the day (00:00:00):

```ruby
date = Date.new(2010, 6, 7)
date.beginning_of_day # => Mon Jun 07 00:00:00 +0200 2010
```

The method [`end_of_day`][Date#end_of_day] returns a timestamp at the end of the day (23:59:59):

```ruby
date = Date.new(2010, 6, 7)
date.end_of_day # => Mon Jun 07 23:59:59 +0200 2010
```

`beginning_of_day` is aliased to [`at_beginning_of_day`][Date#at_beginning_of_day], [`midnight`][Date#midnight], [`at_midnight`][Date#at_midnight].

NOTE: Defined in `active_support/core_ext/date/calculations.rb`.

[Date#at_beginning_of_day]: https://api.rubyonrails.org/classes/Date.html#method-i-at_beginning_of_day
[Date#at_midnight]: https://api.rubyonrails.org/classes/Date.html#method-i-at_midnight
[Date#beginning_of_day]: https://api.rubyonrails.org/classes/Date.html#method-i-beginning_of_day
[Date#end_of_day]: https://api.rubyonrails.org/classes/Date.html#method-i-end_of_day
[Date#midnight]: https://api.rubyonrails.org/classes/Date.html#method-i-midnight

##### `beginning_of_hour`, `end_of_hour`

The method [`beginning_of_hour`][DateTime#beginning_of_hour] returns a timestamp at the beginning of the hour (hh:00:00):

```ruby
date = DateTime.new(2010, 6, 7, 19, 55, 25)
date.beginning_of_hour # => Mon Jun 07 19:00:00 +0200 2010
```

The method [`end_of_hour`][DateTime#end_of_hour] returns a timestamp at the end of the hour (hh:59:59):

```ruby
date = DateTime.new(2010, 6, 7, 19, 55, 25)
date.end_of_hour # => Mon Jun 07 19:59:59 +0200 2010
```

`beginning_of_hour` is aliased to [`at_beginning_of_hour`][DateTime#at_beginning_of_hour].

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

##### `beginning_of_minute`, `end_of_minute`

The method [`beginning_of_minute`][DateTime#beginning_of_minute] returns a timestamp at the beginning of the minute (hh:mm:00):

```ruby
date = DateTime.new(2010, 6, 7, 19, 55, 25)
date.beginning_of_minute # => Mon Jun 07 19:55:00 +0200 2010
```

The method [`end_of_minute`][DateTime#end_of_minute] returns a timestamp at the end of the minute (hh:mm:59):

```ruby
date = DateTime.new(2010, 6, 7, 19, 55, 25)
date.end_of_minute # => Mon Jun 07 19:55:59 +0200 2010
```

`beginning_of_minute` is aliased to [`at_beginning_of_minute`][DateTime#at_beginning_of_minute].

INFO: `beginning_of_hour`, `end_of_hour`, `beginning_of_minute`, and `end_of_minute` are implemented for `Time` and `DateTime` but **not** `Date` as it does not make sense to request the beginning or end of an hour or minute on a `Date` instance.

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

[DateTime#at_beginning_of_minute]: https://api.rubyonrails.org/classes/DateTime.html#method-i-at_beginning_of_minute
[DateTime#beginning_of_minute]: https://api.rubyonrails.org/classes/DateTime.html#method-i-beginning_of_minute
[DateTime#end_of_minute]: https://api.rubyonrails.org/classes/DateTime.html#method-i-end_of_minute

##### `ago`, `since`

The method [`ago`][Date#ago] receives a number of seconds as argument and returns a timestamp those many seconds ago from midnight:

```ruby
date = Date.current # => Fri, 11 Jun 2010
date.ago(1)         # => Thu, 10 Jun 2010 23:59:59 EDT -04:00
```

Similarly, [`since`][Date#since] moves forward:

```ruby
date = Date.current # => Fri, 11 Jun 2010
date.since(1)       # => Fri, 11 Jun 2010 00:00:01 EDT -04:00
```

NOTE: Defined in `active_support/core_ext/date/calculations.rb`.

[Date#ago]: https://api.rubyonrails.org/classes/Date.html#method-i-ago
[Date#since]: https://api.rubyonrails.org/classes/Date.html#method-i-since

Extensions to `DateTime`
------------------------

WARNING: `DateTime` is not aware of DST rules and so some of these methods have edge cases when a DST change is going on. For example [`seconds_since_midnight`][DateTime#seconds_since_midnight] might not return the real amount in such a day.

### Calculations

The class `DateTime` is a subclass of `Date` so by loading `active_support/core_ext/date/calculations.rb` you inherit these methods and their aliases, except that they will always return datetimes.

The following methods are reimplemented so you do **not** need to load `active_support/core_ext/date/calculations.rb` for these ones:

* [`beginning_of_day`][DateTime#beginning_of_day] / [`midnight`][DateTime#midnight] / [`at_midnight`][DateTime#at_midnight] / [`at_beginning_of_day`][DateTime#at_beginning_of_day]
* [`end_of_day`][DateTime#end_of_day]
* [`ago`][DateTime#ago]
* [`since`][DateTime#since] / [`in`][DateTime#in]

On the other hand, [`advance`][DateTime#advance] and [`change`][DateTime#change] are also defined and support more options, they are documented below.

The following methods are only implemented in `active_support/core_ext/date_time/calculations.rb` as they only make sense when used with a `DateTime` instance:

* [`beginning_of_hour`][DateTime#beginning_of_hour] / [`at_beginning_of_hour`][DateTime#at_beginning_of_hour]
* [`end_of_hour`][DateTime#end_of_hour]

[DateTime#ago]: https://api.rubyonrails.org/classes/DateTime.html#method-i-ago
[DateTime#at_beginning_of_day]: https://api.rubyonrails.org/classes/DateTime.html#method-i-at_beginning_of_day
[DateTime#at_beginning_of_hour]: https://api.rubyonrails.org/classes/DateTime.html#method-i-at_beginning_of_hour
[DateTime#at_midnight]: https://api.rubyonrails.org/classes/DateTime.html#method-i-at_midnight
[DateTime#beginning_of_day]: https://api.rubyonrails.org/classes/DateTime.html#method-i-beginning_of_day
[DateTime#beginning_of_hour]: https://api.rubyonrails.org/classes/DateTime.html#method-i-beginning_of_hour
[DateTime#end_of_day]: https://api.rubyonrails.org/classes/DateTime.html#method-i-end_of_day
[DateTime#end_of_hour]: https://api.rubyonrails.org/classes/DateTime.html#method-i-end_of_hour
[DateTime#in]: https://api.rubyonrails.org/classes/DateTime.html#method-i-in
[DateTime#midnight]: https://api.rubyonrails.org/classes/DateTime.html#method-i-midnight

#### Named Datetimes

##### `DateTime.current`

Active Support defines [`DateTime.current`][DateTime.current] to be like `Time.now.to_datetime`, except that it honors the user time zone, if defined. The instance predicates [`past?`][DateAndTime::Calculations#past?] and [`future?`][DateAndTime::Calculations#future?] are defined relative to `DateTime.current`.

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

[DateTime.current]: https://api.rubyonrails.org/classes/DateTime.html#method-c-current

#### Other Extensions

##### `seconds_since_midnight`

The method [`seconds_since_midnight`][DateTime#seconds_since_midnight] returns the number of seconds since midnight:

```ruby
now = DateTime.current     # => Mon, 07 Jun 2010 20:26:36 +0000
now.seconds_since_midnight # => 73596
```

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

[DateTime#seconds_since_midnight]: https://api.rubyonrails.org/classes/DateTime.html#method-i-seconds_since_midnight

##### `utc`

The method [`utc`][DateTime#utc] gives you the same datetime in the receiver expressed in UTC.

```ruby
now = DateTime.current # => Mon, 07 Jun 2010 19:27:52 -0400
now.utc                # => Mon, 07 Jun 2010 23:27:52 +0000
```

This method is also aliased as [`getutc`][DateTime#getutc].

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

[DateTime#getutc]: https://api.rubyonrails.org/classes/DateTime.html#method-i-getutc
[DateTime#utc]: https://api.rubyonrails.org/classes/DateTime.html#method-i-utc

##### `utc?`

The predicate [`utc?`][DateTime#utc?] says whether the receiver has UTC as its time zone:

```ruby
now = DateTime.now # => Mon, 07 Jun 2010 19:30:47 -0400
now.utc?           # => false
now.utc.utc?       # => true
```

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

[DateTime#utc?]: https://api.rubyonrails.org/classes/DateTime.html#method-i-utc-3F

##### `advance`

The most generic way to jump to another datetime is [`advance`][DateTime#advance]. This method receives a hash with keys `:years`, `:months`, `:weeks`, `:days`, `:hours`, `:minutes`, and `:seconds`, and returns a datetime advanced as much as the present keys indicate.

```ruby
d = DateTime.current
# => Thu, 05 Aug 2010 11:33:31 +0000
d.advance(years: 1, months: 1, days: 1, hours: 1, minutes: 1, seconds: 1)
# => Tue, 06 Sep 2011 12:34:32 +0000
```

This method first computes the destination date passing `:years`, `:months`, `:weeks`, and `:days` to `Date#advance` documented above. After that, it adjusts the time calling [`since`][DateTime#since] with the number of seconds to advance. This order is relevant, a different ordering would give different datetimes in some edge-cases. The example in `Date#advance` applies, and we can extend it to show order relevance related to the time bits.

If we first move the date bits (that have also a relative order of processing, as documented before), and then the time bits we get for example the following computation:

```ruby
d = DateTime.new(2010, 2, 28, 23, 59, 59)
# => Sun, 28 Feb 2010 23:59:59 +0000
d.advance(months: 1, seconds: 1)
# => Mon, 29 Mar 2010 00:00:00 +0000
```

but if we computed them the other way around, the result would be different:

```ruby
d.advance(seconds: 1).advance(months: 1)
# => Thu, 01 Apr 2010 00:00:00 +0000
```

WARNING: Since `DateTime` is not DST-aware you can end up in a non-existing point in time with no warning or error telling you so.

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

[DateTime#advance]: https://api.rubyonrails.org/classes/DateTime.html#method-i-advance
[DateTime#since]: https://api.rubyonrails.org/classes/DateTime.html#method-i-since

#### Changing Components

The method [`change`][DateTime#change] allows you to get a new datetime which is the same as the receiver except for the given options, which may include `:year`, `:month`, `:day`, `:hour`, `:min`, `:sec`, `:offset`, `:start`:

```ruby
now = DateTime.current
# => Tue, 08 Jun 2010 01:56:22 +0000
now.change(year: 2011, offset: Rational(-6, 24))
# => Wed, 08 Jun 2011 01:56:22 -0600
```

If hours are zeroed, then minutes and seconds are too (unless they have given values):

```ruby
now.change(hour: 0)
# => Tue, 08 Jun 2010 00:00:00 +0000
```

Similarly, if minutes are zeroed, then seconds are too (unless it has given a value):

```ruby
now.change(min: 0)
# => Tue, 08 Jun 2010 01:00:00 +0000
```

This method is not tolerant to non-existing dates, if the change is invalid `ArgumentError` is raised:

```ruby
DateTime.current.change(month: 2, day: 30)
# => ArgumentError: invalid date
```

NOTE: Defined in `active_support/core_ext/date_time/calculations.rb`.

[DateTime#change]: https://api.rubyonrails.org/classes/DateTime.html#method-i-change

#### Durations

[`Duration`][ActiveSupport::Duration] objects can be added to and subtracted from datetimes:

```ruby
now = DateTime.current
# => Mon, 09 Aug 2010 23:15:17 +0000
now + 1.year
# => Tue, 09 Aug 2011 23:15:17 +0000
now - 1.week
# => Mon, 02 Aug 2010 23:15:17 +0000
```

They translate to calls to `since` or `advance`. For example here we get the correct jump in the calendar reform:

```ruby
DateTime.new(1582, 10, 4, 23) + 1.hour
# => Fri, 15 Oct 1582 00:00:00 +0000
```

Extensions to `Time`
--------------------

### Calculations

They are analogous. Please refer to their documentation above and take into account the following differences:

* [`change`][Time#change] accepts an additional `:usec` option.
* `Time` understands DST, so you get correct DST calculations as in

```ruby
Time.zone_default
# => #<ActiveSupport::TimeZone:0x7f73654d4f38 @utc_offset=nil, @name="Madrid", ...>

# In Barcelona, 2010/03/28 02:00 +0100 becomes 2010/03/28 03:00 +0200 due to DST.
t = Time.local(2010, 3, 28, 1, 59, 59)
# => Sun Mar 28 01:59:59 +0100 2010
t.advance(seconds: 1)
# => Sun Mar 28 03:00:00 +0200 2010
```

* If [`since`][Time#since] or [`ago`][Time#ago] jumps to a time that can't be expressed with `Time` a `DateTime` object is returned instead.

[Time#ago]: https://api.rubyonrails.org/classes/Time.html#method-i-ago
[Time#change]: https://api.rubyonrails.org/classes/Time.html#method-i-change
[Time#since]: https://api.rubyonrails.org/classes/Time.html#method-i-since

#### `Time.current`

Active Support defines [`Time.current`][Time.current] to be today in the current time zone. That's like `Time.now`, except that it honors the user time zone, if defined. It also defines the instance predicates [`past?`][DateAndTime::Calculations#past?], [`today?`][DateAndTime::Calculations#today?], [`tomorrow?`][DateAndTime::Calculations#tomorrow?], [`next_day?`][DateAndTime::Calculations#next_day?], [`yesterday?`][DateAndTime::Calculations#yesterday?], [`prev_day?`][DateAndTime::Calculations#prev_day?] and [`future?`][DateAndTime::Calculations#future?], all of them relative to `Time.current`.

When making Time comparisons using methods which honor the user time zone, make sure to use `Time.current` instead of `Time.now`. There are cases where the user time zone might be in the future compared to the system time zone, which `Time.now` uses by default. This means `Time.now.to_date` may equal `Date.yesterday`.

NOTE: Defined in `active_support/core_ext/time/calculations.rb`.

[DateAndTime::Calculations#next_day?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-next_day-3F
[DateAndTime::Calculations#prev_day?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-prev_day-3F
[DateAndTime::Calculations#today?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-today-3F
[DateAndTime::Calculations#tomorrow?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-tomorrow-3F
[DateAndTime::Calculations#yesterday?]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-yesterday-3F

#### `all_day`, `all_week`, `all_month`, `all_quarter`, and `all_year`

The method [`all_day`][DateAndTime::Calculations#all_day] returns a range representing the whole day of the current time.

```ruby
now = Time.current
# => Mon, 09 Aug 2010 23:20:05 UTC +00:00
now.all_day
# => Mon, 09 Aug 2010 00:00:00 UTC +00:00..Mon, 09 Aug 2010 23:59:59 UTC +00:00
```

Analogously, [`all_week`][DateAndTime::Calculations#all_week], [`all_month`][DateAndTime::Calculations#all_month], [`all_quarter`][DateAndTime::Calculations#all_quarter] and [`all_year`][DateAndTime::Calculations#all_year] all serve the purpose of generating time ranges.

```ruby
now = Time.current
# => Mon, 09 Aug 2010 23:20:05 UTC +00:00
now.all_week
# => Mon, 09 Aug 2010 00:00:00 UTC +00:00..Sun, 15 Aug 2010 23:59:59 UTC +00:00
now.all_week(:sunday)
# => Sun, 16 Sep 2012 00:00:00 UTC +00:00..Sat, 22 Sep 2012 23:59:59 UTC +00:00
now.all_month
# => Sat, 01 Aug 2010 00:00:00 UTC +00:00..Tue, 31 Aug 2010 23:59:59 UTC +00:00
now.all_quarter
# => Thu, 01 Jul 2010 00:00:00 UTC +00:00..Thu, 30 Sep 2010 23:59:59 UTC +00:00
now.all_year
# => Fri, 01 Jan 2010 00:00:00 UTC +00:00..Fri, 31 Dec 2010 23:59:59 UTC +00:00
```

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#all_day]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-all_day
[DateAndTime::Calculations#all_month]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-all_month
[DateAndTime::Calculations#all_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-all_quarter
[DateAndTime::Calculations#all_week]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-all_week
[DateAndTime::Calculations#all_year]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-all_year
[Time.current]: https://api.rubyonrails.org/classes/Time.html#method-c-current

#### `prev_day`, `next_day`

[`prev_day`][Time#prev_day] and [`next_day`][Time#next_day] return the time in the last or next day:

```ruby
t = Time.new(2010, 5, 8) # => 2010-05-08 00:00:00 +0900
t.prev_day               # => 2010-05-07 00:00:00 +0900
t.next_day               # => 2010-05-09 00:00:00 +0900
```

NOTE: Defined in `active_support/core_ext/time/calculations.rb`.

[Time#next_day]: https://api.rubyonrails.org/classes/Time.html#method-i-next_day
[Time#prev_day]: https://api.rubyonrails.org/classes/Time.html#method-i-prev_day

#### `prev_month`, `next_month`

[`prev_month`][Time#prev_month] and [`next_month`][Time#next_month] return the time with the same day in the last or next month:

```ruby
t = Time.new(2010, 5, 8) # => 2010-05-08 00:00:00 +0900
t.prev_month             # => 2010-04-08 00:00:00 +0900
t.next_month             # => 2010-06-08 00:00:00 +0900
```

If such a day does not exist, the last day of the corresponding month is returned:

```ruby
Time.new(2000, 5, 31).prev_month # => 2000-04-30 00:00:00 +0900
Time.new(2000, 3, 31).prev_month # => 2000-02-29 00:00:00 +0900
Time.new(2000, 5, 31).next_month # => 2000-06-30 00:00:00 +0900
Time.new(2000, 1, 31).next_month # => 2000-02-29 00:00:00 +0900
```

NOTE: Defined in `active_support/core_ext/time/calculations.rb`.

[Time#next_month]: https://api.rubyonrails.org/classes/Time.html#method-i-next_month
[Time#prev_month]: https://api.rubyonrails.org/classes/Time.html#method-i-prev_month

#### `prev_year`, `next_year`

[`prev_year`][Time#prev_year] and [`next_year`][Time#next_year] return a time with the same day/month in the last or next year:

```ruby
t = Time.new(2010, 5, 8) # => 2010-05-08 00:00:00 +0900
t.prev_year              # => 2009-05-08 00:00:00 +0900
t.next_year              # => 2011-05-08 00:00:00 +0900
```

If date is the 29th of February of a leap year, you obtain the 28th:

```ruby
t = Time.new(2000, 2, 29) # => 2000-02-29 00:00:00 +0900
t.prev_year               # => 1999-02-28 00:00:00 +0900
t.next_year               # => 2001-02-28 00:00:00 +0900
```

NOTE: Defined in `active_support/core_ext/time/calculations.rb`.

[Time#next_year]: https://api.rubyonrails.org/classes/Time.html#method-i-next_year
[Time#prev_year]: https://api.rubyonrails.org/classes/Time.html#method-i-prev_year

#### `prev_quarter`, `next_quarter`

[`prev_quarter`][DateAndTime::Calculations#prev_quarter] and [`next_quarter`][DateAndTime::Calculations#next_quarter] return the date with the same day in the previous or next quarter:

```ruby
t = Time.local(2010, 5, 8) # => 2010-05-08 00:00:00 +0300
t.prev_quarter             # => 2010-02-08 00:00:00 +0200
t.next_quarter             # => 2010-08-08 00:00:00 +0300
```

If such a day does not exist, the last day of the corresponding month is returned:

```ruby
Time.local(2000, 7, 31).prev_quarter  # => 2000-04-30 00:00:00 +0300
Time.local(2000, 5, 31).prev_quarter  # => 2000-02-29 00:00:00 +0200
Time.local(2000, 10, 31).prev_quarter # => 2000-07-31 00:00:00 +0300
Time.local(2000, 11, 31).next_quarter # => 2001-03-01 00:00:00 +0200
```

`prev_quarter` is aliased to [`last_quarter`][DateAndTime::Calculations#last_quarter].

NOTE: Defined in `active_support/core_ext/date_and_time/calculations.rb`.

[DateAndTime::Calculations#last_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-last_quarter
[DateAndTime::Calculations#next_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-next_quarter
[DateAndTime::Calculations#prev_quarter]: https://api.rubyonrails.org/classes/DateAndTime/Calculations.html#method-i-prev_quarter

### Time Constructors

Active Support defines [`Time.current`][Time.current] to be `Time.zone.now` if there's a user time zone defined, with fallback to `Time.now`:

```ruby
Time.zone_default
# => #<ActiveSupport::TimeZone:0x7f73654d4f38 @utc_offset=nil, @name="Madrid", ...>
Time.current
# => Fri, 06 Aug 2010 17:11:58 CEST +02:00
```

Analogously to `DateTime`, the predicates [`past?`][DateAndTime::Calculations#past?], and [`future?`][DateAndTime::Calculations#future?] are relative to `Time.current`.

If the time to be constructed lies beyond the range supported by `Time` in the runtime platform, usecs are discarded and a `DateTime` object is returned instead.

#### Durations

[`Duration`][ActiveSupport::Duration] objects can be added to and subtracted from time objects:

```ruby
now = Time.current
# => Mon, 09 Aug 2010 23:20:05 UTC +00:00
now + 1.year
# => Tue, 09 Aug 2011 23:21:11 UTC +00:00
now - 1.week
# => Mon, 02 Aug 2010 23:21:11 UTC +00:00
```

They translate to calls to `since` or `advance`. For example here we get the correct jump in the calendar reform:

```ruby
Time.utc(1582, 10, 3) + 5.days
# => Mon Oct 18 00:00:00 UTC 1582
```

Extensions to `File`
--------------------

### `atomic_write`

With the class method [`File.atomic_write`][File.atomic_write] you can write to a file in a way that will prevent any reader from seeing half-written content.

The name of the file is passed as an argument, and the method yields a file handle opened for writing. Once the block is done `atomic_write` closes the file handle and completes its job.

For example, Action Pack uses this method to write asset cache files like `all.css`:

```ruby
File.atomic_write(joined_asset_path) do |cache|
  cache.write(join_asset_file_contents(asset_paths))
end
```

To accomplish this `atomic_write` creates a temporary file. That's the file the code in the block actually writes to. On completion, the temporary file is renamed, which is an atomic operation on POSIX systems. If the target file exists `atomic_write` overwrites it and keeps owners and permissions. However there are a few cases where `atomic_write` cannot change the file ownership or permissions, this error is caught and skipped over trusting in the user/filesystem to ensure the file is accessible to the processes that need it.

NOTE. Due to the chmod operation `atomic_write` performs, if the target file has an ACL set on it this ACL will be recalculated/modified.

WARNING. Note you can't append with `atomic_write`.

The auxiliary file is written in a standard directory for temporary files, but you can pass a directory of your choice as second argument.

NOTE: Defined in `active_support/core_ext/file/atomic.rb`.

[File.atomic_write]: https://api.rubyonrails.org/classes/File.html#method-c-atomic_write

Extensions to `NameError`
-------------------------

Active Support adds [`missing_name?`][NameError#missing_name?] to `NameError`, which tests whether the exception was raised because of the name passed as argument.

The name may be given as a symbol or string. A symbol is tested against the bare constant name, a string is against the fully qualified constant name.

TIP: A symbol can represent a fully qualified constant name as in `:"ActiveRecord::Base"`, so the behavior for symbols is defined for convenience, not because it has to be that way technically.

For example, when an action of `ArticlesController` is called Rails tries optimistically to use `ArticlesHelper`. It is OK that the helper module does not exist, so if an exception for that constant name is raised it should be silenced. But it could be the case that `articles_helper.rb` raises a `NameError` due to an actual unknown constant. That should be reraised. The method `missing_name?` provides a way to distinguish both cases:

```ruby
def default_helper_module!
  module_name = name.delete_suffix("Controller")
  module_path = module_name.underscore
  helper module_path
rescue LoadError => e
  raise e unless e.is_missing? "helpers/#{module_path}_helper"
rescue NameError => e
  raise e unless e.missing_name? "#{module_name}Helper"
end
```

NOTE: Defined in `active_support/core_ext/name_error.rb`.

[NameError#missing_name?]: https://api.rubyonrails.org/classes/NameError.html#method-i-missing_name-3F

Extensions to `LoadError`
-------------------------

Active Support adds [`is_missing?`][LoadError#is_missing?] to `LoadError`.

Given a path name `is_missing?` tests whether the exception was raised due to that particular file (except perhaps for the ".rb" extension).

For example, when an action of `ArticlesController` is called Rails tries to load `articles_helper.rb`, but that file may not exist. That's fine, the helper module is not mandatory so Rails silences a load error. But it could be the case that the helper module does exist and in turn requires another library that is missing. In that case Rails must reraise the exception. The method `is_missing?` provides a way to distinguish both cases:

```ruby
def default_helper_module!
  module_name = name.delete_suffix("Controller")
  module_path = module_name.underscore
  helper module_path
rescue LoadError => e
  raise e unless e.is_missing? "helpers/#{module_path}_helper"
rescue NameError => e
  raise e unless e.missing_name? "#{module_name}Helper"
end
```

NOTE: Defined in `active_support/core_ext/load_error.rb`.

[LoadError#is_missing?]: https://api.rubyonrails.org/classes/LoadError.html#method-i-is_missing-3F

Extensions to Pathname
-------------------------

### `existence`

The [`existence`][Pathname#existence] method returns the receiver if the named file exists otherwise returns `nil`. It is useful for idioms like this:

```ruby
content = Pathname.new("file").existence&.read
```

NOTE: Defined in `active_support/core_ext/pathname/existence.rb`.

[Pathname#existence]: https://api.rubyonrails.org/classes/Pathname.html#method-i-existence
