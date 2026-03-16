**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Action View Form Helpers
========================

Forms are a common interface for user input in web applications. However, form markup can be tedious to write and maintain because of the need to handle form controls, naming, and attributes. Rails simplifies this by providing view helpers, which are methods that output HTML form markup. This guide will help you understand the different helper methods and when to use each.

After reading this guide, you will know:

* How to create basic forms, such as a search form.
* How to work with model-based forms for creating and editing specific database records.
* How to generate select boxes from multiple types of data.
* What date and time helpers Rails provides.
* What makes a file upload form different.
* How to post forms to external resources and specify setting an `authenticity_token`.
* How to build complex forms.

--------------------------------------------------------------------------------

This guide is not intended to be a complete list of all available form helpers. Please refer to [the Rails API documentation](https://api.rubyonrails.org/classes/ActionView/Helpers.html) for an exhaustive list of form helpers and their arguments.

Working with Basic Forms
------------------------

The main form helper is [`form_with`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-form_with).

```erb
<%= form_with do |form| %>
  Form contents
<% end %>
```

When called without arguments, it creates an HTML `<form>` tag with the value of the `method` attribute set to `post` and the value of the `action` attribute set to the current page. For example, assuming the current page is a home page at `/home`, the generated HTML will look like this:

```html
<form action="/home" accept-charset="UTF-8" method="post">
  <input type="hidden" name="authenticity_token" value="Lz6ILqUEs2CGdDa-oz38TqcqQORavGnbGkG0CQA8zc8peOps-K7sHgFSTPSkBx89pQxh3p5zPIkjoOTiA_UWbQ" autocomplete="off">
  Form contents
</form>
```

Notice that the form contains an `input` element with type `hidden`. This `authenticity_token` hidden input is required for non-GET form submissions.
This token is a security feature in Rails used to prevent cross-site request forgery (CSRF) attacks, and form helpers automatically generate it for every non-GET form (assuming the security feature is enabled). You can read more about it in the [Securing Rails Applications](security.html#cross-site-request-forgery-csrf) guide.

### A Generic Search Form

One of the most basic forms on the web is a search form. This form contains:

* a form element with "GET" method,
* a label for the input,
* a text input element, and
* a submit element.

Here is how to create a search form with `form_with`:

```erb
<%= form_with url: "/search", method: :get do |form| %>
  <%= form.label :query, "Search for:" %>
  <%= form.search_field :query %>
  <%= form.submit "Search" %>
<% end %>
```

This will generate the following HTML:

```html
<form action="/search" accept-charset="UTF-8" method="get">
  <label for="query">Search for:</label>
  <input type="search" name="query" id="query">
  <input type="submit" name="commit" value="Search" data-disable-with="Search">
</form>
```

Notice that for the search form we are using the `url` option of `form_with`. Setting `url: "/search"` changes the form action value from the default current page path to `action="/search"`.

In general, passing `url: my_path` to `form_with` tells the form where to make the request. The other option is to pass Active Model objects to the form, as you will learn [below](#creating-forms-with-model-objects). You can also use [URL helpers](routing.html#path-and-url-helpers).

The search form example above also shows the [form builder](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html) object. You will learn about the many helpers provided by the form builder object (like`form.label` and `form.text_field`) in the next section.

TIP: For every form `input` element, an `id` attribute is generated from its name (`"query"` in above example). These IDs can be very useful for CSS styling or manipulation of form controls with JavaScript.

IMPORTANT: Use "GET" as the method for search forms. In general, Rails
conventions encourage using the right HTTP verb for controller actions. Using "GET" for
search allows users to bookmark a specific search.

### Helpers for Generating Form Elements

The form builder object yielded by `form_with` provides many helper methods for generating common form elements such as text fields, checkboxes, and radio buttons.

The first argument to these methods is always the name of the input. This is
useful to remember because when the form is submitted, that name will be passed
to the controller along with the form data in the `params` hash. The name will be the key in the `params` for the value entered by the user for that field.

For example, if the form contains `<%= form.text_field :query %>`, then you
would be able to get the value of this field in the controller with
`params[:query]`.

When naming inputs, Rails uses certain conventions that make it possible to submit parameters with non-scalar values such as arrays or hashes, which will also be accessible in `params`. You can read more about them in the [Form Input Naming Conventions and Params Hash](#form-input-naming-conventions-and-params-hash) section of this guide. For details on the precise usage of these helpers, please refer to the [API documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/FormTagHelper.html).

#### Checkboxes

A Checkbox is a form control that allows for a single value to be selected or deselected. A group of Checkboxes is generally used to allow a user to choose one or more options from the group.

Here's an example with three checkboxes in a form:

```erb
<%= form.checkbox :biography %>
<%= form.label :biography, "Biography" %>
<%= form.checkbox :romance %>
<%= form.label :romance, "Romance" %>
<%= form.checkbox :mystery %>
<%= form.label :mystery, "Mystery" %>
```

The above will generate the following:

```html
<input name="biography" type="hidden" value="0" autocomplete="off"><input type="checkbox" value="1" name="biography" id="biography">
<label for="biography">Biography</label>
<input name="romance" type="hidden" value="0" autocomplete="off"><input type="checkbox" value="1" name="romance" id="romance">
<label for="romance">Romance</label>
<input name="mystery" type="hidden" value="0" autocomplete="off"><input type="checkbox" value="1" name="mystery" id="mystery">
<label for="mystery">Mystery</label>
```

The first parameter to [`checkbox`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-checkbox) is the name of the input which can be found in the `params` hash. If the user has checked the "Biography" checkbox only, the `params` hash would contain:

```ruby
{
  "biography" => "1",
  "romance" => "0",
  "mystery" => "0"
}
```

You can use `params[:biography]` to check if that checkbox is selected by the user.

The checkbox's values (the values that will appear in `params`) can optionally be specified using the `checked_value` and `unchecked_value` parameters. See the [API documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-checkbox) for more details.

There is also a `collection_checkboxes`, which you can learn about in the [Collection Related Helpers section](#collection-related-helpers).

#### Radio Buttons

Radio buttons are form controls that only allow the user to select one option at a time from the list of choices.

For example, radio buttons for choosing your favorite ice cream flavor:

```erb
<%= form.radio_button :flavor, "chocolate_chip" %>
<%= form.label :flavor_chocolate_chip, "Chocolate Chip" %>
<%= form.radio_button :flavor, "vanilla" %>
<%= form.label :flavor_vanilla, "Vanilla" %>
<%= form.radio_button :flavor, "hazelnut" %>
<%= form.label :flavor_hazelnut, "Hazelnut" %>
```

The above will generate the following HTML:

```html
<input type="radio" value="chocolate_chip" name="flavor" id="flavor_chocolate_chip">
<label for="flavor_chocolate_chip">Chocolate Chip</label>
<input type="radio" value="vanilla" name="flavor" id="flavor_vanilla">
<label for="flavor_vanilla">Vanilla</label>
<input type="radio" value="hazelnut" name="flavor" id="flavor_hazelnut">
<label for="flavor_hazelnut">Hazelnut</label>
```

The second argument to [`radio_button`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-radio_button) is the value of the input. Because these radio buttons share the same name (`flavor`), the user will only be able to select one of them, and `params[:flavor]` will contain either `"chocolate_chip"`, `"vanilla"`, or `hazelnut`.

NOTE: Always use labels for checkbox and radio buttons. They associate text with
a specific option using the `for` attribute and, by expanding the clickable
region, make it easier for users to click the inputs.

### Other Helpers of Interest

There are many other form controls including text, email, password, date, and time. The below examples show some more helpers and their generated HTML.

Date and time related helpers:

```erb
<%= form.date_field :born_on %>
<%= form.time_field :started_at %>
<%= form.datetime_local_field :graduation_day %>
<%= form.month_field :birthday_month %>
<%= form.week_field :birthday_week %>
```

Output:

```html
<input type="date" name="born_on" id="born_on">
<input type="time" name="started_at" id="started_at">
<input type="datetime-local" name="graduation_day" id="graduation_day">
<input type="month" name="birthday_month" id="birthday_month">
<input type="week" name="birthday_week" id="birthday_week">
```

Helpers with special formatting:

```erb
<%= form.password_field :password %>
<%= form.email_field :address %>
<%= form.telephone_field :phone %>
<%= form.url_field :homepage %>
```

Output:

```html
<input type="password" name="password" id="password">
<input type="email" name="address" id="address">
<input type="tel" name="phone" id="phone">
<input type="url" name="homepage" id="homepage">
```

Other common helpers:

```erb
<%= form.textarea :message, size: "70x5" %>
<%= form.hidden_field :parent_id, value: "foo" %>
<%= form.number_field :price, in: 1.0..20.0, step: 0.5 %>
<%= form.range_field :discount, in: 1..100 %>
<%= form.search_field :name %>
<%= form.color_field :favorite_color %>
```

Output:

```html
<textarea name="message" id="message" cols="70" rows="5"></textarea>
<input value="foo" autocomplete="off" type="hidden" name="parent_id" id="parent_id">
<input step="0.5" min="1.0" max="20.0" type="number" name="price" id="price">
<input min="1" max="100" type="range" name="discount" id="discount">
<input type="search" name="name" id="name">
<input value="#000000" type="color" name="favorite_color" id="favorite_color">
```

Hidden inputs are not shown to the user but instead hold data like any textual input. Values inside them can be changed with JavaScript.

TIP: If you're using password input fields, you might want to configure your application to prevent those parameters from being logged. You can learn about how in the [Securing Rails Applications](security.html#logging) guide.

Creating Forms with Model Objects
---------------------------------

### Binding a Form to an Object

The `form_with` helper has a `:model` option that allows you to bind the form builder object to a model object. This means that the form will be scoped to that model object, and the form's fields will be populated with values from that model object.

For example, if we have a `@book` model object:

```ruby
@book = Book.new
# => #<Book id: nil, title: nil, author: nil>
```

And the following form to create a new book:

```erb
<%= form_with model: @book do |form| %>
  <div>
    <%= form.label :title %>
    <%= form.text_field :title %>
  </div>
  <div>
    <%= form.label :author %>
    <%= form.text_field :author %>
  </div>
  <%= form.submit %>
<% end %>
```

It will generate this HTML:

```html
<form action="/books" accept-charset="UTF-8" method="post">
  <input type="hidden" name="authenticity_token" value="ChwHeyegcpAFDdBvXvDuvbfW7yCA3e8gvhyieai7DhG28C3akh-dyuv-IBittsjPrIjETlQQvQJ91T77QQ8xWA" autocomplete="off">
  <div>
    <label for="book_title">Title</label>
    <input type="text" name="book[title]" id="book_title">
  </div>
  <div>
    <label for="book_author">Author</label>
    <input type="text" name="book[author]" id="book_author">
  </div>
  <input type="submit" name="commit" value="Create Book" data-disable-with="Create Book">
</form>
```

Some important things to notice when using `form_with` with a model object:

* The form `action` is automatically filled with an appropriate value, `action="/books"`. If you were updating a book, it would be `action="/books/42"`.
* The form field names are scoped with `book[...]`. This means that `params[:book]` will be a hash containing all these field's values. You can read more about the significance of input names in chapter [Form Input Naming Conventions and Params Hash](#form-input-naming-conventions-and-params-hash) of this guide.
* The submit button is automatically given an appropriate text value, "Create Book" in this case.

TIP: Typically your form inputs will mirror model attributes. However, they don't have to. If there is other information you need you can include a field in your form and access it via `params[:book][:my_non_attribute_input]`.

#### Composite Primary Key Forms

If you have a model with a [composite primary key](active_record_composite_primary_keys.html), the form building syntax is the same with slightly different output.

For example, to update a `@book` model object with a composite key `[:author_id, :id]` like this:

```ruby
@book = Book.find([2, 25])
# => #<Book id: 25, title: "Some book", author_id: 2>
```

The following form:

```erb
<%= form_with model: @book do |form| %>
  <%= form.text_field :title %>
  <%= form.submit %>
<% end %>
```

Will generate this HTML output:

```html
<form action="/books/2_25" method="post" accept-charset="UTF-8" >
  <input name="authenticity_token" type="hidden" value="ChwHeyegcpAFDdBvXvDuvbfW7yCA3e8gvhyieai7DhG28C3akh-dyuv-IBittsjPrIjETlQQvQJ91T77QQ8xWA" />
  <input type="text" name="book[title]" id="book_title" value="Some book" />
  <input type="submit" name="commit" value="Update Book" data-disable-with="Update Book">
</form>
```

Note the generated URL contains the `author_id` and `id` delimited by an
underscore. Once submitted, the controller can [extract each primary key
value](action_controller_overview.html#composite-key-parameters) from the parameters and update the record as it would with a singular
primary key.

#### The `fields_for` Helper

The `fields_for` helper is used to render fields for related model objects
within the same form. The associated "inner" model is usually related to the
"main" form model via an Active Record association. For example, if you had a
`Person` model with an associated `ContactDetail` model, you could create a
single form with inputs for both models like so:

```erb
<%= form_with model: @person do |person_form| %>
  <%= person_form.text_field :name %>
  <%= fields_for :contact_detail, @person.contact_detail do |contact_detail_form| %>
    <%= contact_detail_form.text_field :phone_number %>
  <% end %>
<% end %>
```

The above will produce the following output:

```html
<form action="/people" accept-charset="UTF-8" method="post">
  <input type="hidden" name="authenticity_token" value="..." autocomplete="off" />
  <input type="text" name="person[name]" id="person_name" />
  <input type="text" name="contact_detail[phone_number]" id="contact_detail_phone_number" />
</form>
```

The object yielded by `fields_for` is a form builder like the one yielded by
`form_with`. The `fields_for` helper creates a similar binding but without
rendering a `<form>` tag. You can learn more about `fields_for` in the [API
docs](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-fields_for).

### Relying on Record Identification

When dealing with RESTful resources, calls to `form_with` can be simplified by relying on **record identification**. This means you pass the model instance and have Rails figure out the model name, method, and other things. In the example below for creating a new record, both calls to `form_with` generate the same HTML:

```ruby
# longer way:
form_with(model: @article, url: articles_path)
# short-hand:
form_with(model: @article)
```

Similarly, for editing an existing article like below, both the calls to `form_with` will also generate the same HTML:

```ruby
# longer way:
form_with(model: @article, url: article_path(@article), method: "patch")
# short-hand:
form_with(model: @article)
```

Notice how the short-hand `form_with` invocation is conveniently the same, regardless of the record being new or existing. Record identification is smart enough to figure out if the record is new by asking [`record.persisted?`](https://api.rubyonrails.org/classes/ActiveRecord/Persistence.html#method-i-persisted-3F). It also selects the correct path to submit to, and the name based on the class of the object.

This is assuming that the `Article` model is declared with `resources :articles` in the routes file.

If you have a [singular resource](routing.html#singular-resources), you will need to call `resource` and `resolve` for it to work with `form_with`:

```ruby
resource :article
resolve("Article") { [:article] }
```

TIP: Declaring a resource has a number of side effects. See the [Rails Routing from the Outside In](routing.html#resource-routing-the-rails-default) guide for more information on setting up and using resources.

WARNING: When you're using [single-table inheritance](association_basics.html#single-table-inheritance-sti) with your models, you can't rely on record identification on a subclass if only their parent class is declared a resource. You will have to specify `:url`, and `:scope` (the model name) explicitly.

### Working with Namespaces

If you have namespaced routes, `form_with` has a shorthand for that. For example, if your application has an `admin` namespace:

```ruby
form_with model: [:admin, @article]
```

The above will create a form that submits to the `Admin::ArticlesController` inside the admin namespace,  therefore submitting to `admin_article_path(@article)` in the case of an update.

If you have several levels of namespacing then the syntax is similar:

```ruby
form_with model: [:admin, :management, @article]
```

For more information on Rails' routing system and the associated conventions, please see the [Rails Routing from the Outside In](routing.html) guide.

### Forms with PATCH, PUT, or DELETE Methods

The Rails framework encourages RESTful design, which means forms in your application will make requests where the `method` is `PATCH`, `PUT`, or `DELETE` in addition to `GET` and `POST`. However, HTML forms _don't support_ methods other than `GET` and `POST` when it comes to submitting forms.

Rails works around this limitation by emulating other methods over POST with a hidden input named `"_method"`. For example:

```ruby
form_with(url: search_path, method: "patch")
```

The above form Will generate this HTML output:

```html
<form action="/search" accept-charset="UTF-8" method="post">
  <input type="hidden" name="_method" value="patch" autocomplete="off">
  <input type="hidden" name="authenticity_token" value="R4quRuXQAq75TyWpSf8AwRyLt-R1uMtPP1dHTTWJE5zbukiaY8poSTXxq3Z7uAjXfPHiKQDsWE1i2_-h0HSktQ" autocomplete="off">
<!-- ... -->
</form>
```

When parsing POSTed data, Rails will take into account the special `_method` parameter and proceed as if the request's HTTP method was the one set as the value of `_method` (`PATCH` in this example).

When rendering a form, submission buttons can override the declared `method` attribute through the `formmethod:` keyword:

```erb
<%= form_with url: "/posts/1", method: :patch do |form| %>
  <%= form.button "Delete", formmethod: :delete, data: { confirm: "Are you sure?" } %>
  <%= form.button "Update" %>
<% end %>
```

Similar to `<form>` elements, most browsers _don't support_ overriding form methods declared through [formmethod][] other than `GET` and `POST`.

Rails works around this issue by emulating other methods over POST through a combination of [formmethod][], [value][button-value], and [name][button-name] attributes:

```html
<form accept-charset="UTF-8" action="/posts/1" method="post">
  <input name="_method" type="hidden" value="patch" />
  <input name="authenticity_token" type="hidden" value="f755bb0ed134b76c432144748a6d4b7a7ddf2b71" />
  <!-- ... -->

  <button type="submit" formmethod="post" name="_method" value="delete" data-confirm="Are you sure?">Delete</button>
  <button type="submit" name="button">Update</button>
</form>
```

In this case, the "Update" button will be treated as `PATCH` and the "Delete" button will be treated as `DELETE`.

[formmethod]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-formmethod
[button-name]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-name
[button-value]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-value

Making Select Boxes with Ease
-----------------------------

Select boxes, also known as drop-down list, allow users to select from a list of options. The HTML for select boxes requires a decent amount of markup - one `<option>` element for each option to choose from. Rails provides helper methods to help generate that markup.

For example, let's say we have a list of cities for the user to choose from. We can use the [`select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-select) helper:

```erb
<%= form.select :city, ["Berlin", "Chicago", "Madrid"] %>
```

The above will generate this HTML output:

```html
<select name="city" id="city">
  <option value="Berlin">Berlin</option>
  <option value="Chicago">Chicago</option>
  <option value="Madrid">Madrid</option>
</select>
```

And the selection will be available in `params[:city]` as usual.

We can also specify `<option>` values that differ from their labels:

```erb
<%= form.select :city, [["Berlin", "BE"], ["Chicago", "CHI"], ["Madrid", "MD"]] %>
```

Output:

```html
<select name="city" id="city">
  <option value="BE">Berlin</option>
  <option value="CHI">Chicago</option>
  <option value="MD">Madrid</option>
</select>
```

This way, the user will see the full city name, but `params[:city]` will be one of `"BE"`, `"CHI"`, or `"MD"`.

Lastly, we can specify a default choice for the select box with the `:selected` argument:

```erb
<%= form.select :city, [["Berlin", "BE"], ["Chicago", "CHI"], ["Madrid", "MD"]], selected: "CHI" %>
```

Output:

```html
<select name="city" id="city">
  <option value="BE">Berlin</option>
  <option value="CHI" selected="selected">Chicago</option>
  <option value="MD">Madrid</option>
</select>
```

### Option Groups for Select Boxes

In some cases we may want to improve the user experience by grouping related options together. We can do so by passing a `Hash` (or comparable `Array`) to `select`:

```erb
<%= form.select :city,
      {
        "Europe" => [ ["Berlin", "BE"], ["Madrid", "MD"] ],
        "North America" => [ ["Chicago", "CHI"] ],
      },
      selected: "CHI" %>
```

Output:

```html
<select name="city" id="city">
  <optgroup label="Europe">
    <option value="BE">Berlin</option>
    <option value="MD">Madrid</option>
  </optgroup>
  <optgroup label="North America">
    <option value="CHI" selected="selected">Chicago</option>
  </optgroup>
</select>
```

### Binding Select Boxes to Model Objects

Like other form controls, a select box can be bound to a model attribute. For example, if we have a `@person` model object like:

```ruby
@person = Person.new(city: "MD")
```

The following form:

```erb
<%= form_with model: @person do |form| %>
  <%= form.select :city, [["Berlin", "BE"], ["Chicago", "CHI"], ["Madrid", "MD"]] %>
<% end %>
```

Will output this select box:

```html
<select name="person[city]" id="person_city">
  <option value="BE">Berlin</option>
  <option value="CHI">Chicago</option>
  <option value="MD" selected="selected">Madrid</option>
</select>
```

The only difference is that the selected option will be found in `params[:person][:city]` instead of `params[:city]`.

Notice that the appropriate option was automatically marked `selected="selected"`. Since this select box was bound to an existing `@person` record, we didn't need to specify a `:selected` argument.

Using Date and Time Form Helpers
--------------------------------

In addition to the `date_field` and `time_field` helpers mentioned [earlier](#other-helpers-of-interest), Rails provides alternative date and time form helpers that render plain select boxes. The `date_select` helper renders a separate select box for year, month, and day.

For example, if we have a `@person` model object like:

```ruby
@person = Person.new(birth_date: Date.new(1995, 12, 21))
```

The following form:

```erb
<%= form_with model: @person do |form| %>
  <%= form.date_select :birth_date %>
<% end %>
```

Will output select boxes like:

```html
<select name="person[birth_date(1i)]" id="person_birth_date_1i">
  <option value="1990">1990</option>
  <option value="1991">1991</option>
  <option value="1992">1992</option>
  <option value="1993">1993</option>
  <option value="1994">1994</option>
  <option value="1995" selected="selected">1995</option>
  <option value="1996">1996</option>
  <option value="1997">1997</option>
  <option value="1998">1998</option>
  <option value="1999">1999</option>
  <option value="2000">2000</option>
</select>
<select name="person[birth_date(2i)]" id="person_birth_date_2i">
  <option value="1">January</option>
  <option value="2">February</option>
  <option value="3">March</option>
  <option value="4">April</option>
  <option value="5">May</option>
  <option value="6">June</option>
  <option value="7">July</option>
  <option value="8">August</option>
  <option value="9">September</option>
  <option value="10">October</option>
  <option value="11">November</option>
  <option value="12" selected="selected">December</option>
</select>
<select name="person[birth_date(3i)]" id="person_birth_date_3i">
  <option value="1">1</option>
  ...
  <option value="21" selected="selected">21</option>
  ...
  <option value="31">31</option>
</select>
```

Notice that, when the form is submitted, there will be no single value in the `params` hash that contains the full date. Instead, there will be several values with special names like `"birth_date(1i)"`. However, Active Model knows how to assemble these values into a full date, based on the declared type of the model attribute. So we can pass `params[:person]` to `Person.new` or `Person#update` just like we would if the form used a single field to represent the full date.

In addition to the [`date_select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-date_select) helper, Rails provides [`time_select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-time_select) which outputs select boxes for the hour and minute. There is [`datetime_select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-datetime_select) as well which combines both date and time select boxes.

### Select Boxes for Time or Date Components

Rails also provides helpers to render select boxes for individual date and time components: [`select_year`](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-select_year), [`select_month`](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-select_month), [`select_day`](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-select_day), [`select_hour`](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-select_hour), [`select_minute`](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-select_minute), and [`select_second`](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-select_second).  These helpers are "bare" methods, meaning they are not called on a form builder instance.  For example:

```erb
<%= select_year 2024, prefix: "party" %>
```

The above outputs a select box like:

```html
<select id="party_year" name="party[year]">
  <option value="2019">2019</option>
  <option value="2020">2020</option>
  <option value="2021">2021</option>
  <option value="2022">2022</option>
  <option value="2023">2023</option>
  <option value="2024" selected="selected">2024</option>
  <option value="2025">2025</option>
  <option value="2026">2026</option>
  <option value="2027">2027</option>
  <option value="2028">2028</option>
  <option value="2029">2029</option>
</select>
```

For each of these helpers, you may specify a `Date` or `Time` object instead of a number as the default value (for example `<%= select_year Date.today, prefix: "party" %>` instead of the above), and the appropriate date and time parts will be extracted and used.

### Selecting Time Zone

When you need to ask users what time zone they are in, there is a very convenient [`time_zone_select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-time_zone_select) helper to use.

Typically, you would have to provide a list of time zone options for users to select from. This can get tedious if not for the list of pre-defined [`ActiveSupport::TimeZone`](https://api.rubyonrails.org/classes/ActiveSupport/TimeZone.html) objects. The `time_with_zone` helper wraps this and can be used as follows:

```erb
<%= form.time_zone_select :time_zone %>
```

Output:

```html
<select name="time_zone" id="time_zone">
  <option value="International Date Line West">(GMT-12:00) International Date Line West</option>
  <option value="American Samoa">(GMT-11:00) American Samoa</option>
  <option value="Midway Island">(GMT-11:00) Midway Island</option>
  <option value="Hawaii">(GMT-10:00) Hawaii</option>
  <option value="Alaska">(GMT-09:00) Alaska</option>
  ...
  <option value="Samoa">(GMT+13:00) Samoa</option>
  <option value="Tokelau Is.">(GMT+13:00) Tokelau Is.</option>
</select>
```

Collection Related Helpers
--------------------------

If you need to generate a set of choices from a collection of arbitrary objects, Rails has `collection_select`, `collection_radio_button`, and `collection_checkboxes` helpers.

To see when these helpers are useful, suppose you have a `City` model and corresponding `belongs_to :city` association with `Person`:

```ruby
class City < ApplicationRecord
end

class Person < ApplicationRecord
  belongs_to :city
end
```

Assuming we have the following cities stored in the database:

```ruby
City.order(:name).map { |city| [city.name, city.id] }
# => [["Berlin", 1], ["Chicago", 3], ["Madrid", 2]]
```

We can allow the user to choose from the cities with the following form:

```erb
<%= form_with model: @person do |form| %>
  <%= form.select :city_id, City.order(:name).map { |city| [city.name, city.id] } %>
<% end %>
```

The above will generate this HTML:

```html
<select name="person[city_id]" id="person_city_id">
  <option value="1">Berlin</option>
  <option value="3">Chicago</option>
  <option value="2">Madrid</option>
</select>
```

The above example shows how you'd generate the choices manually. However, Rails has helpers that generate choices from a collection without having to explicitly iterate over it. These helpers determine the value and text label of each choice by calling specified methods on each object in the collection.

NOTE: When rendering a field for a `belongs_to` association, you must specify the name of the foreign key (`city_id` in the above example), rather than the name of the association itself.

### The `collection_select` Helper

To generate a select box, we can use [`collection_select`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-collection_select):

```erb
<%= form.collection_select :city_id, City.order(:name), :id, :name %>
```

The above outputs the same HTML as the manual iteration above:

```html
<select name="person[city_id]" id="person_city_id">
  <option value="1">Berlin</option>
  <option value="3">Chicago</option>
  <option value="2">Madrid</option>
</select>
```

NOTE: The order of arguments for `collection_select` is different from the order for `select`. With `collection_select` we specify the value method first (`:id` in the example above), and the text label method second (`:name` in the example above).  This is opposite of the order used when specifying choices for the `select` helper, where the text label comes first and the value second (`["Berlin", 1]` in the previous example).

### The `collection_radio_buttons` Helper

To generate a set of radio buttons, we can use [`collection_radio_buttons`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-collection_radio_buttons):

```erb
<%= form.collection_radio_buttons :city_id, City.order(:name), :id, :name %>
```

Output:

```html
<input type="radio" value="1" name="person[city_id]" id="person_city_id_1">
<label for="person_city_id_1">Berlin</label>

<input type="radio" value="3" name="person[city_id]" id="person_city_id_3">
<label for="person_city_id_3">Chicago</label>

<input type="radio" value="2" name="person[city_id]" id="person_city_id_2">
<label for="person_city_id_2">Madrid</label>
```

### The `collection_checkboxes` Helper

To generate a set of check boxes — for example, to support a `has_and_belongs_to_many` association — we can use [`collection_checkboxes`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-collection_checkboxes):

```erb
<%= form.collection_checkboxes :interest_ids, Interest.order(:name), :id, :name %>
```

Output:

```html
<input type="checkbox" name="person[interest_id][]" value="3" id="person_interest_id_3">
<label for="person_interest_id_3">Engineering</label>

<input type="checkbox" name="person[interest_id][]" value="4" id="person_interest_id_4">
<label for="person_interest_id_4">Math</label>

<input type="checkbox" name="person[interest_id][]" value="1" id="person_interest_id_1">
<label for="person_interest_id_1">Science</label>

<input type="checkbox" name="person[interest_id][]" value="2" id="person_interest_id_2">
<label for="person_interest_id_2">Technology</label>
```

Uploading Files
---------------

A common task with forms is allowing users to upload a file. It could be an avatar image or a CSV file with data to process. File upload fields can be rendered with the [`file_field`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html#method-i-file_field) helper.

```erb
<%= form_with model: @person do |form| %>
  <%= form.file_field :csv_file %>
<% end %>
```

The most important thing to remember with file uploads is that the rendered form's `enctype` attribute **must** be set to `multipart/form-data`. This is done automatically if you use a `file_field` inside a `form_with`. You can also set the attribute manually:

```erb
<%= form_with url: "/uploads", multipart: true do |form| %>
  <%= file_field_tag :csv_file %>
<% end %>
```

Both of which, output the following HTML form:

```html
<form enctype="multipart/form-data" action="/people" accept-charset="UTF-8" method="post">
<!-- ... -->
</form>
```

Note that, per `form_with` conventions, the field names in the two forms above will be different. In the first form, it will be `person[csv_file]` (accessible via `params[:person][:csv_file]`), and in the second form it will be just `csv_file` (accessible via `params[:csv_file]`).

### CSV File Upload Example

When using `file_field`, the object in the `params` hash is an instance of [`ActionDispatch::Http::UploadedFile`](https://api.rubyonrails.org/classes/ActionDispatch/Http/UploadedFile.html). Here is an example of how to save data in an uploaded CSV file to records in your application:

```ruby
  require "csv"

  def upload
    uploaded_file = params[:csv_file]
    if uploaded_file.present?
      csv_data = CSV.parse(uploaded_file.read, headers: true)
      csv_data.each do |row|
        # Process each row of the CSV file
        # SomeInvoiceModel.create(amount: row['Amount'], status: row['Status'])
        Rails.logger.info row.inspect
        #<CSV::Row "id":"po_1KE3FRDSYPMwkcNz9SFKuaYd" "Amount":"96.22" "Created (UTC)":"2022-01-04 02:59" "Arrival Date (UTC)":"2022-01-05 00:00" "Status":"paid">
      end
    end
    # ...
  end
```

If the file is an image that needs to be stored with a model (e.g. user's profile picture), there are a number of tasks to consider, like where to store the file (on Disk, Amazon S3, etc), resizing image files, and generating thumbnails, etc. [Active Storage](active_storage_overview.html) is designed to assist with these tasks.

Customizing Form Builders
-------------------------

We call the objects yielded by `form_with` or `fields_for` Form Builders. Form builders allow you to generate form elements associated with a model object
and are an instance of
[`ActionView::Helpers::FormBuilder`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormBuilder.html). This class can be extended to add custom helpers for your application.

For example, if you want to display a `text_field` along with a `label` across your application, you could add the following helper method to `application_helper.rb`:

```ruby
module ApplicationHelper
  def text_field_with_label(form, attribute)
    form.label(attribute) + form.text_field(attribute)
  end
end
```

And use it in a form as usual:

```erb
<%= form_with model: @person do |form| %>
  <%= text_field_with_label form, :first_name %>
<% end %>
```

But you can also create a subclass of `ActionView::Helpers::FormBuilder`, and
add the helpers there. After defining this `LabellingFormBuilder` subclass:

```ruby
class LabellingFormBuilder < ActionView::Helpers::FormBuilder
  def text_field(attribute, options = {})
    # super will call the original text_field method
    label(attribute) + super
  end
end
```

The above form can be replaced with:

```erb
<%= form_with model: @person, builder: LabellingFormBuilder do |form| %>
  <%= form.text_field :first_name %>
<% end %>
```

If you reuse this frequently you could define a `labeled_form_with` helper that automatically applies the `builder: LabellingFormBuilder` option:

```ruby
module ApplicationHelper
  def labeled_form_with(**options, &block)
    options[:builder] = LabellingFormBuilder
    form_with(**options, &block)
  end
end
```

The above can be used instead of `form_with`:

```erb
<%= labeled_form_with model: @person do |form| %>
  <%= form.text_field :first_name %>
<% end %>
```

All three cases above (the `text_field_with_label` helper, the `LabellingFormBuilder` subclass, and the `labeled_form_with` helper) will generate the same HTML output:

```html
<form action="/people" accept-charset="UTF-8" method="post">
  <!-- ... -->
  <label for="person_first_name">First name</label>
  <input type="text" name="person[first_name]" id="person_first_name">
</form>
```

The form builder used also determines what happens when you do:

```erb
<%= render partial: f %>
```

If `f` is an instance of `ActionView::Helpers::FormBuilder`, then this will render the `form` partial, setting the partial's object to the form builder. If the form builder is of class `LabellingFormBuilder`, then the `labelling_form` partial would be rendered instead.

Form builder customizations, such as `LabellingFormBuilder`, do hide the implementation details (and may seem like an overkill for the simple example above). Choose between different customizations, extending `FormBuilder` class or creating helpers, based on how frequently your forms use the custom elements.

Form Input Naming Conventions and `params` Hash
-----------------------------------------------

All of the form helpers described above help with generating the HTML for form elements so that the user can enter various types of input. How do you access the user input values in the Controller? The `params` hash is the answer. You've already seen the `params` hash in the above example. This section will more explicitly go over naming conventions around how form input is structured in the `params` hash.

The `params` hash can contain arrays and arrays of hashes. Values can be at the top level of the `params` hash or nested in another hash. For example, in a standard `create` action for a Person model, `params[:person]` will be a hash of all the attributes for the `Person` object.

Note that HTML forms don't have an inherent structure to the user input data, all they generate is name-value string pairs. The arrays and hashes you see in your application are the result of parameter naming conventions that Rails uses.

NOTE: The fields in the `params` hash need to be [permitted in the controller](#permitting-parameters-in-the-controller).

### Basic Structure

The two basic structures for user input form data are arrays and hashes.

Hashes mirror the syntax used for accessing the value in `params`. For example, if a form contains:

```html
<input id="person_name" name="person[name]" type="text" value="Henry"/>
```

the `params` hash will contain

```ruby
{ "person" => { "name" => "Henry" } }
```

and `params[:person][:name]` will retrieve the submitted value in the controller.

Hashes can be nested as many levels as required, for example:

```html
<input id="person_address_city" name="person[address][city]" type="text" value="New York"/>
```

The above will result in the `params` hash being

```ruby
{ "person" => { "address" => { "city" => "New York" } } }
```

The other structure is an Array. Normally Rails ignores duplicate parameter names, but if the parameter name ends with an empty set of square brackets `[]` then the parameters will be accumulated in an Array.

For example, if you want users to be able to input multiple phone numbers, you could place this in the form:

```html
<input name="person[phone_number][]" type="text"/>
<input name="person[phone_number][]" type="text"/>
<input name="person[phone_number][]" type="text"/>
```

This would result in `params[:person][:phone_number]` being an array containing the submitted phone numbers:

```ruby
{ "person" => { "phone_number" => ["555-0123", "555-0124", "555-0125"] } }
```

### Combining Arrays and Hashes

You can mix and match these two concepts. One element of a hash might be an array as in the previous example `params[:person]` hash has a key called `[:phone_number]` whose value is an array.

You also can have an array of hashes. For example, you can create any number of addresses by repeating the following form fragment:

```html
<input name="person[addresses][][line1]" type="text"/>
<input name="person[addresses][][line2]" type="text"/>
<input name="person[addresses][][city]" type="text"/>
<input name="person[addresses][][line1]" type="text"/>
<input name="person[addresses][][line2]" type="text"/>
<input name="person[addresses][][city]" type="text"/>
```

This would result in `params[:person][:addresses]` being an array of hashes. Each hash in the array will have the keys `line1`, `line2`, and `city`, something like this:

```ruby
{ "person" =>
  { "addresses" => [
    { "line1" => "1000 Fifth Avenue",
      "line2" => "",
      "city" => "New York"
    },
    { "line1" => "Calle de Ruiz de Alarcón",
      "line2" => "",
      "city" => "Madrid"
    }
    ]
  }
}
```

It's important to note that while hashes can be nested arbitrarily, only one level of "arrayness" is allowed. Arrays can usually be replaced by hashes. For example, instead of an array of model objects, you can have a hash of model objects keyed by their id or similar.

WARNING: Array parameters do not play well with the `checkbox` helper. According to the HTML specification unchecked checkboxes submit no value. However it is often convenient for a checkbox to always submit a value. The `checkbox` helper fakes this by creating an auxiliary hidden input with the same name. If the checkbox is unchecked only the hidden input is submitted. If it is checked then both are submitted but the value submitted by the checkbox takes precedence. There is a `include_hidden` option that can be set to `false` if you want to omit this hidden field. By default, this option is `true`.

### Hashes with an Index

Let's say you want to render a form with a set of fields for each of a person's
addresses. The [`fields_for`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-fields_for) helper with its `:index` option can assist:

```erb
<%= form_with model: @person do |person_form| %>
  <%= person_form.text_field :name %>
  <% @person.addresses.each do |address| %>
    <%= person_form.fields_for address, index: address.id do |address_form| %>
      <%= address_form.text_field :city %>
    <% end %>
  <% end %>
<% end %>
```

Assuming the person has two addresses with IDs 23 and 45, the above form would
render this output:

```html
<form accept-charset="UTF-8" action="/people/1" method="post">
  <input name="_method" type="hidden" value="patch" />
  <input id="person_name" name="person[name]" type="text" />
  <input id="person_address_23_city" name="person[address][23][city]" type="text" />
  <input id="person_address_45_city" name="person[address][45][city]" type="text" />
</form>
```

Which will result in a `params` hash that looks like:

```ruby
{
  "person" => {
    "name" => "Bob",
    "address" => {
      "23" => {
        "city" => "Paris"
      },
      "45" => {
        "city" => "London"
      }
    }
  }
}
```

All of the form inputs map to the `"person"` hash because we called `fields_for`
on the `person_form` form builder. Also, by specifying `index: address.id`, we
rendered the `name` attribute of each city input as
`person[address][#{address.id}][city]` instead of `person[address][city]`. This
way you can tell which `Address` records should be modified when processing the
`params` hash.

You can find more details about `fields_for` index option in the [API docs](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-fields_for).

Building Complex Forms
----------------------

As your application grows, you may need to create more complex forms, beyond editing a single object. For example, when creating a `Person` you can allow the user to create multiple `Address` records (home, work, etc.) within the same form. When editing a `Person` record later, the user should be able to add, remove, or update addresses as well.

### Configuring the Model for Nested Attributes

For editing an associated record for a given model (`Person` in this case), Active Record provides model level support via the [`accepts_nested_attributes_for`](https://api.rubyonrails.org/classes/ActiveRecord/NestedAttributes/ClassMethods.html#method-i-accepts_nested_attributes_for) method:

```ruby
class Person < ApplicationRecord
  has_many :addresses, inverse_of: :person
  accepts_nested_attributes_for :addresses
end

class Address < ApplicationRecord
  belongs_to :person
end
```

This creates an `addresses_attributes=` method on `Person` that allows you to create, update, and destroy addresses.

### Nested Forms in the View

The following form allows a user to create a `Person` and its associated addresses.

```html+erb
<%= form_with model: @person do |form| %>
  Addresses:
  <ul>
    <%= form.fields_for :addresses do |addresses_form| %>
      <li>
        <%= addresses_form.label :kind %>
        <%= addresses_form.text_field :kind %>

        <%= addresses_form.label :street %>
        <%= addresses_form.text_field :street %>
        ...
      </li>
    <% end %>
  </ul>
<% end %>
```

When an association accepts nested attributes, `fields_for` renders its block once for every element of the association. In particular, if a person has no addresses, it renders nothing.

A common pattern is for the controller to build one or more empty children so that at least one set of fields is shown to the user. The example below would result in 2 sets of address fields being rendered on the new person form.

For example, the above `form_with` with this change:

```ruby
def new
  @person = Person.new
  2.times { @person.addresses.build }
end
```

Will output the following HTML:

```html
<form action="/people" accept-charset="UTF-8" method="post"><input type="hidden" name="authenticity_token" value="lWTbg-4_5i4rNe6ygRFowjDfTj7uf-6UPFQnsL7H9U9Fe2GGUho5PuOxfcohgm2Z-By3veuXwcwDIl-MLdwFRg" autocomplete="off">
  Addresses:
  <ul>
      <li>
        <label for="person_addresses_attributes_0_kind">Kind</label>
        <input type="text" name="person[addresses_attributes][0][kind]" id="person_addresses_attributes_0_kind">

        <label for="person_addresses_attributes_0_street">Street</label>
        <input type="text" name="person[addresses_attributes][0][street]" id="person_addresses_attributes_0_street">
        ...
      </li>

      <li>
        <label for="person_addresses_attributes_1_kind">Kind</label>
        <input type="text" name="person[addresses_attributes][1][kind]" id="person_addresses_attributes_1_kind">

        <label for="person_addresses_attributes_1_street">Street</label>
        <input type="text" name="person[addresses_attributes][1][street]" id="person_addresses_attributes_1_street">
        ...
      </li>
  </ul>
</form>
```

The `fields_for` yields a form builder. The parameter names will be what
`accepts_nested_attributes_for` expects. For example, when creating a person
with 2 addresses, the submitted parameters in `params` would look like this:

```ruby
{
  "person" => {
    "name" => "John Doe",
    "addresses_attributes" => {
      "0" => {
        "kind" => "Home",
        "street" => "221b Baker Street"
      },
      "1" => {
        "kind" => "Office",
        "street" => "31 Spooner Street"
      }
    }
  }
}
```

The actual value of the keys in the `:addresses_attributes` hash is not important. But they need to be strings of integers and different for each address.

If the associated object is already saved, `fields_for` autogenerates a hidden input with the `id` of the saved record. You can disable this by passing `include_id: false` to `fields_for`.

```ruby
{
  "person" => {
    "name" => "John Doe",
    "addresses_attributes" => {
      "0" => {
        "id" => 1,
        "kind" => "Home",
        "street" => "221b Baker Street"
      },
      "1" => {
        "id" => "2",
        "kind" => "Office",
        "street" => "31 Spooner Street"
      }
    }
  }
}
```

### Permitting Parameters in the Controller

As usual you need to [declare the permitted
parameters](action_controller_overview.html#strong-parameters) in the controller
before you pass them to the model:

```ruby
def create
  @person = Person.new(person_params)
  # ...
end

private
  def person_params
    params.expect(person: [ :name, addresses_attributes: [[ :id, :kind, :street ]] ])
  end
```

### Removing Associated Objects

You can allow users to delete associated objects by passing `allow_destroy: true` to `accepts_nested_attributes_for`

```ruby
class Person < ApplicationRecord
  has_many :addresses
  accepts_nested_attributes_for :addresses, allow_destroy: true
end
```

If the hash of attributes for an object contains the key `_destroy` with a value
that evaluates to `true` (e.g. `1`, `'1'`, `true`, or `'true'`) then the object will be
destroyed. This form allows users to remove addresses:

```erb
<%= form_with model: @person do |form| %>
  Addresses:
  <ul>
    <%= form.fields_for :addresses do |addresses_form| %>
      <li>
        <%= addresses_form.checkbox :_destroy %>
        <%= addresses_form.label :kind %>
        <%= addresses_form.text_field :kind %>
        ...
      </li>
    <% end %>
  </ul>
<% end %>
```

The HTML for the `_destroy` field:

```html
<input type="checkbox" value="1" name="person[addresses_attributes][0][_destroy]" id="person_addresses_attributes_0__destroy">
```

You also need to update the permitted params in your controller to include
the `_destroy` field:

```ruby
def person_params
  params.require(:person).
    permit(:name, addresses_attributes: [:id, :kind, :street, :_destroy])
end
```

### Preventing Empty Records

It is often useful to ignore sets of fields that the user has not filled in. You can control this by passing a `:reject_if` proc to `accepts_nested_attributes_for`. This proc will be called with each hash of attributes submitted by the form. If the proc returns `true` then Active Record will not build an associated object for that hash. The example below only tries to build an address if the `kind` attribute is set.

```ruby
class Person < ApplicationRecord
  has_many :addresses
  accepts_nested_attributes_for :addresses, reject_if: lambda { |attributes| attributes["kind"].blank? }
end
```

As a convenience you can instead pass the symbol `:all_blank` which will create a proc that will reject records where all the attributes are blank excluding any value for `_destroy`.

Forms to External Resources
---------------------------

Rails form helpers can be used to build a form for posting data to an external resource. If the external API expects an `authenticity_token` for the resource, this can be passed as an `authenticity_token: 'your_external_token'` parameter to `form_with`:

```erb
<%= form_with url: 'http://farfar.away/form', authenticity_token: 'external_token' do %>
  Form contents
<% end %>
```

At other times, the fields that can be used in the form are limited by an external API and it may be undesirable to generate an `authenticity_token`. To _not_ send a token, you can pass `false` to the `:authenticity_token` option:

```erb
<%= form_with url: 'http://farfar.away/form', authenticity_token: false do %>
  Form contents
<% end %>
```

Using Tag Helpers without a Form Builder
----------------------------------------

In case you need to render form fields outside of the context of a form builder, Rails provides tag helpers for common form elements. For example, [`checkbox_tag`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormTagHelper.html#method-i-checkbox_tag):

```erb
<%= checkbox_tag "accept" %>
```

Output:

```html
<input type="checkbox" name="accept" id="accept" value="1" />
```

Generally, these helpers have the same name as their form builder counterparts plus a `_tag` suffix.  For a complete list, see the [`FormTagHelper` API documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/FormTagHelper.html).

Using `form_tag` and `form_for`
-------------------------------

Before `form_with` was introduced in Rails 5.1 its functionality was split between [`form_tag`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormTagHelper.html#method-i-form_tag) and [`form_for`](https://api.rubyonrails.org/classes/ActionView/Helpers/FormHelper.html#method-i-form_for). Both are now discouraged in favor of `form_with`, but you can still find them being used in some codebases.
