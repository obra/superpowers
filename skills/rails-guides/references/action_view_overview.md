**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Action View Overview
====================

After reading this guide, you will know:

* What Action View is and how to use it with Rails.
* How best to use templates, partials, and layouts.
* How to use localized views.

--------------------------------------------------------------------------------

What is Action View?
--------------------

Action View is the V in
[MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller).
[Action Controller](action_controller_overview.html) and Action View work
together to handle web requests. Action Controller is concerned with
communicating with the model layer (of MVC) and retrieving data. Action View is
then responsible for rendering a response body to the web request using that
data.

By default, Action View templates (also referred to simply as "views") are
written using Embedded Ruby (ERB), which allows using Ruby code within HTML
documents.

Action View provides many [helper](#helpers) methods for dynamically generating
HTML tags for forms, dates, and strings. It's also possible to add custom
helpers to your application as needed.

NOTE: Action View can make use of Active Model features like
[`to_param`](https://api.rubyonrails.org/classes/ActiveModel/Conversion.html#method-i-to_param)
and
[`to_partial_path`](https://api.rubyonrails.org/classes/ActiveModel/Conversion.html#method-i-to_partial_path)
to simplify code. That doesn't mean Action View depends on Active Model. Action
View is an independent package that can be used with any Ruby library.

Using Action View with Rails
----------------------------

Action View templates (aka "views") are stored in subdirectories in the
`app/views` directory. There is a subdirectory matching the name of each
controller. The view files inside that subdirectory are used to render specific
views as a response to controller actions.

For example, when you use scaffolding to generate an `article` resource, Rails
generates the following files in `app/views/articles`:

```bash
$ bin/rails generate scaffold article
      [...]
      invoke  scaffold_controller
      create    app/controllers/articles_controller.rb
      invoke    erb
      create      app/views/articles
      create      app/views/articles/index.html.erb
      create      app/views/articles/edit.html.erb
      create      app/views/articles/show.html.erb
      create      app/views/articles/new.html.erb
      create      app/views/articles/_form.html.erb
      [...]
```

The file names follow a Rails naming convention. They share their name with the
associated controller action. For example the `index.html.erb`, `edit.html.erb`,
etc.

By following this naming convention, Rails will automatically find and render
the matching view at the end of a controller action, without you having to
specify it. For example, the `index` action in the `articles_controller.rb` will
automatically render the `index.html.erb` view inside the `app/views/articles/`
directory. The name and the location of the file are both important.

The final HTML returned to the client is composed of a combination of the
`.html.erb` ERB file, a layout template that wraps it, and all the partials that
the ERB file may reference. In the rest of this guide, you will find more
details about each of the three components: `Templates`, `Partials`, `Layouts`.

Templates
---------

Action View templates can be written in different formats. If the template file
has a `.erb` extension, it uses embedded Ruby to build an HTML response. If the
template has a `.jbuilder` extension, it uses the
[Jbuilder](https://github.com/rails/jbuilder) gem to build a JSON response. And
a template with a `.builder` extension uses the
[`Builder::XmlMarkup`](https://github.com/rails/builder) library to build an XML
response.

Rails uses the file extension to distinguish among multiple template systems.
For example, an HTML file using the ERB template system will have `.html.erb` as
a file extension, and a JSON file using the Jbuilder template system will have
the `.json.jbuilder` file extension. Other libraries may add other template
types and file extensions as well.

### ERB

An ERB template is a way to sprinkle Ruby code within static HTML using special
ERB tags like `<% %>` and `<%= %>`.

When Rails processes the ERB view templates ending with `.html.erb`, it
evaluates the embedded Ruby code and replaces the ERB tags with the dynamic
output. That dynamic content is combined with the static HTML markup to form the
final HTML response.

Within an ERB template, Ruby code can be included using both `<% %>` and `<%=
%>` tags. The `<% %>` tag (without the `=`) is used when you want to execute
Ruby code but not directly output the result, such as conditions or loops. The
tag `<%= %>` is used for Ruby code that generates an output and you want that
output rendered within the template, such as a model attribute like
`person.name` in this example:

```html+erb
<h1>Names</h1>
<% @people.each do |person| %>
  Name: <%= person.name %><br>
<% end %>
```

The loop is set up using regular embedding tags (`<% %>`) and the name is
inserted using the output embedding tags (`<%= %>`).

Note that functions such as `print` and `puts` won't be rendered to the view
with ERB templates. So something like this would not work:

```html+erb
<%# WRONG %>
Hi, Mr. <% puts "Frodo" %>
```

The above example shows that comments can be added in ERB within `<%# %>` tag.

To suppress leading and trailing whitespaces, you can use `<%-` `-%>`
interchangeably with `<%` and `%>`.

### Jbuilder

`Jbuilder` is a gem that's maintained by the Rails team and included in the
default Rails `Gemfile`. It is used to build JSON responses using templates.

If you don't have it, you can add the following to your `Gemfile`:

```ruby
gem "jbuilder"
```

A `Jbuilder` object named `json` is automatically made available to templates
with a `.jbuilder` extension.

Here is a basic example:

```ruby
json.name("Alex")
json.email("alex@example.com")
```

would produce:

```json
{
  "name": "Alex",
  "email": "alex@example.com"
}
```

See the [Jbuilder documentation](https://github.com/rails/jbuilder#jbuilder) for
more examples.

### Builder

Builder templates are a more programmatic alternative to ERB. It's similar to
`JBuilder` but is used to generate XML, instead of JSON.

An `XmlMarkup` object named `xml` is automatically made available to templates
with a `.builder` extension.

Here is a basic examples:

```ruby
xml.em("emphasized")
xml.em { xml.b("emph & bold") }
xml.a("A Link", "href" => "https://rubyonrails.org")
xml.target("name" => "compile", "option" => "fast")
```

which would produce:

```html
<em>emphasized</em>
<em><b>emph &amp; bold</b></em>
<a href="https://rubyonrails.org">A link</a>
<target option="fast" name="compile" />
```

Any method with a block will be treated as an XML markup tag with nested markup
in the block. For example, the following:

```ruby
xml.div {
  xml.h1(@person.name)
  xml.p(@person.bio)
}
```

would produce something like:

```html
<div>
  <h1>David Heinemeier Hansson</h1>
  <p>A product of Danish Design during the Winter of '79...</p>
</div>
```

See [Builder documentation](https://github.com/rails/builder) for more examples.

### Template Compilation

By default, Rails will compile each template to a method to render it. In the
development environment, when you alter a template, Rails will check the file's
modification time and recompile it.

There is also Fragment Caching for when different parts of the page need to be
cached and expired separately. Learn more about it in the [caching
guide](caching_with_rails.html#fragment-caching).

Partials
--------

Partial templates - usually just called "partials" - are a way of breaking up
the view templates into smaller reusable chunks. With partials, you can extract
a piece of code from your main template to a separate smaller file, and render
that file in the main template. You can also pass data to the partial files from
the main template.

Let's see this in action with some examples:

### Rendering Partials

To render a partial as part of a view, you use the
[`render`](https://api.rubyonrails.org/classes/ActionView/Helpers/RenderingHelper.html#method-i-render)
method within the view:

```erb
<%= render "product" %>
```

This will look for a file named `_product.html.erb` in the same folder to render
within that view. Partial file names start with leading underscore character by
convention. The file name distinguishes partials from regular views. However, no
underscore is used when referring to partials for rendering within a view. This
is true even when you reference a partial from another directory:

```erb
<%= render "application/product" %>
```

That code will look for and display a partial file named `_product.html.erb` in
`app/views/application/`.

### Using Partials to Simplify Views

One way to use partials is to treat them as the equivalent of methods. A way to
move details out of a view so that you can grasp what's going on more easily.
For example, you might have a view that looks like this:

```html+erb
<%= render "application/ad_banner" %>

<h1>Products</h1>

<p>Here are a few of our fine products:</p>
<% @products.each do |product| %>
  <%= render partial: "product", locals: { product: product } %>
<% end %>

<%= render "application/footer" %>
```

Here, the `_ad_banner.html.erb` and `_footer.html.erb` partials could contain
content that is shared among many pages in your application. You don't need to
see the details of these sections when you're focused on a Products' page.

The above example also uses the `_product.html.erb` partial. This partial
contains details for rendering an individual product and is used to render each
product in the collection `@products`.

### Passing Data to Partials with `locals` Option

When rendering a partial, you can pass data to the partial from the rendering
view. You use the `locals:` options hash for this. Each key in the `locals:`
option is available as a partial-local variable:

```html+erb
<%# app/views/products/show.html.erb %>

<%= render partial: "product", locals: { my_product: @product } %>

<%# app/views/products/_product.html.erb %>

<%= tag.div id: dom_id(my_product) do %>
  <h1><%= my_product.name %></h1>
<% end %>
```

A "partial-local variable" is a variable that is local to a given partial and
only available from within that partial. In the above example, `my_product` is a
partial-local variable. It was assigned the value of `@product` when passed to
the partial from the original view.

Note that typically we'd simply call this local variable `product`. We are using
`my_product` to distinguish it from the instance variable name and template name
in this example.

Since `locals` is a hash, you can pass in multiple variables as needed, like
`locals: { my_product: @product, my_reviews: @reviews }`.

However, if a template refers to a variable that *isn't* passed into the view as
part of the `locals:` option, the template will raise an
`ActionView::Template::Error`:

```html+erb
<%# app/views/products/_product.html.erb %>

<%= tag.div id: dom_id(my_product) do %>
  <h1><%= my_product.name %></h1>

  <%# => raises ActionView::Template::Error for `product_reviews` %>
  <% product_reviews.each do |review| %>
    <%# ... %>
  <% end %>
<% end %>
```

### Using `local_assigns`

Each partial has a method called [local_assigns][] available. You can use this
method to access keys passed via the `locals:` option. If a partial was not
rendered with `:some_key` set, the value of `local_assigns[:some_key]` will be
`nil` within the partial.

For example, `product_reviews` is `nil` in the below example since only
`product` is set in `locals:`:

```html+erb
<%# app/views/products/show.html.erb %>

<%= render partial: "product", locals: { product: @product } %>

<%# app/views/products/_product.html.erb %>

<% local_assigns[:product]          # => "#<Product:0x0000000109ec5d10>" %>
<% local_assigns[:product_reviews]  # => nil %>
```

One use case for `local_assigns` is optionally passing in a local variable and
then conditionally performing an action in the partial based on whether the
local variable is set. For example:

```html+erb
<% if local_assigns[:redirect] %>
  <%= form.hidden_field :redirect, value: true %>
<% end %>
```

Another example from Active Storage's `_blob.html.erb`. This one sets the size
based on whether `in_gallery` local variable is set when rendering the partial
that contains this line:

```html+erb
<%= image_tag blob.representation(resize_to_limit: local_assigns[:in_gallery] ? [ 800, 600 ] : [ 1024, 768 ]) %>
```

### `render` without `partial` and `locals` Options

In the above examples, `render` takes 2 options: `partial` and `locals`. But if
these are the only options you need to use, you can skip the keys, `partial` and
`locals`, and specify the values only.

For example, instead of:

```erb
<%= render partial: "product", locals: { product: @product } %>
```

You can write:

```erb
<%= render "product", product: @product %>
```

You can also use this shorthand based on conventions:

```erb
<%= render @product %>
```

This will look for a partial named `_product.html.erb` in `app/views/products/`,
as well as pass a local named `product` set to the value `@product`.


### The `as` and `object` Options

By default, objects passed to the template are in a local variable with the same
name as the template. So, given:

```erb
<%= render @product %>
```

within the `_product.html.erb` partial you'll get `@product` instance variable
in the local variable `product`, as if you had written:

```erb
<%= render partial: "product", locals: { product: @product } %>
```

The `object` option can be used to specify a different name. This is useful when
the template's object is elsewhere (e.g. in a different instance variable or in
a local variable).

For example, instead of:

```erb
<%= render partial: "product", locals: { product: @item } %>
```

you can write:

```erb
<%= render partial: "product", object: @item %>
```

This assigns the instance variable `@item` to a partial local variable named
`product`. What if you wanted to change the local variable name from the default
`product` to something else? You can use the `:as` option for that.

With the `as` option, you can specify a different name for the local variable
like this:

```erb
<%= render partial: "product", object: @item, as: "item" %>
```

This is equivalent to

```erb
<%= render partial: "product", locals: { item: @item } %>
```

### Rendering Collections

It's common for a view to iterate over a collection, such as `@products`, and
render a partial template for each object in the collection. This pattern has
been implemented as a single method that accepts an array and renders a partial
for each one of the elements in the array.

So this example for rendering all the products:

```erb
<% @products.each do |product| %>
  <%= render partial: "product", locals: { product: product } %>
<% end %>
```

can be rewritten in a single line:

```erb
<%= render partial: "product", collection: @products %>
```

When a partial is called with a collection, the individual instances of the
partial have access to the member of the collection being rendered via a
variable named after the partial. In this case, since the partial is
`_product.html.erb`, you can use `product` to refer to the collection member
that is being rendered.

You can also use the following conventions based shorthand syntax for rendering
collections.

```erb
<%= render @products %>
```

The above assumes that `@products` is a collection of `Product` instances. Rails
uses naming conventions to determine the name of the partial to use by looking
at the model name in the collection, `Product` in this case. In fact, you can
even render a collection made up of instances of different models using this
shorthand, and Rails will choose the proper partial for each member of the
collection.

### Spacer Templates

You can also specify a second partial to be rendered between instances of the
main partial by using the `:spacer_template` option:

```erb
<%= render partial: @products, spacer_template: "product_ruler" %>
```

Rails will render the `_product_ruler.html.erb` partial (with no data passed to
it) between each pair of `_product.html.erb` partials.

### Counter Variables

Rails also makes a counter variable available within a partial called by the
collection. The variable is named after the title of the partial followed by
`_counter`. For example, when rendering a collection `@products` the partial
`_product.html.erb` can access the variable `product_counter`. The variable
indexes the number of times the partial has been rendered within the enclosing
view, starting with a value of `0` on the first render.

```erb
<%# index.html.erb %>
<%= render partial: "product", collection: @products %>
```

```erb
<%# _product.html.erb %>
<%= product_counter %> # 0 for the first product, 1 for the second product...
```

This also works when the local variable name is changed using the `as:` option.
So if you did `as: :item`, the counter variable would be `item_counter`.

NOTE: When rendering collections with instances of different models, the counter variable increments for each partial, regardless of the class of the model being rendered.

Note: The following two sections, [Strict Locals](#strict-locals) and [Local
Assigns with Pattern Matching](#local-assigns-with-pattern-matching) are more
advanced features of using partials, included here for completeness.

### `local_assigns` with Pattern Matching

Since `local_assigns` is a `Hash`, it's compatible with [Ruby 3.1's pattern
matching assignment
operator](https://docs.ruby-lang.org/en/master/syntax/pattern_matching_rdoc.html):

```ruby
local_assigns => { product:, **options }
product # => "#<Product:0x0000000109ec5d10>"
options # => {}
```

When keys other than `:product` are assigned into a partial-local `Hash`
variable, they can be splatted into helper method calls:

```html+erb
<%# app/views/products/_product.html.erb %>

<% local_assigns => { product:, **options } %>

<%= tag.div id: dom_id(product), **options do %>
  <h1><%= product.name %></h1>
<% end %>

<%# app/views/products/show.html.erb %>

<%= render "products/product", product: @product, class: "card" %>
<%# => <div id="product_1" class="card">
  #      <h1>A widget</h1>
  #    </div>
%>
```

Pattern matching assignment also supports variable renaming:

```ruby
local_assigns => { product: record }
product             # => "#<Product:0x0000000109ec5d10>"
record              # => "#<Product:0x0000000109ec5d10>"
product == record   # => true
```

You can also conditionally read a variable, then fall back to a default value
when the key isn't part of the `locals:` options, using `fetch`:

```html+erb
<%# app/views/products/_product.html.erb %>

<% local_assigns.fetch(:related_products, []).each do |related_product| %>
  <%# ... %>
<% end %>
```

Combining Ruby 3.1's pattern matching assignment with calls to
[Hash#with_defaults](https://api.rubyonrails.org/classes/Hash.html#method-i-with_defaults)
enables compact partial-local default variable assignments:

```html+erb
<%# app/views/products/_product.html.erb %>

<% local_assigns.with_defaults(related_products: []) => { product:, related_products: } %>

<%= tag.div id: dom_id(product) do %>
  <h1><%= product.name %></h1>

  <% related_products.each do |related_product| %>
    <%# ... %>
  <% end %>
<% end %>
```

[local_assigns]:
    https://api.rubyonrails.org/classes/ActionView/Template.html#method-i-local_assigns

### Strict Locals

Action View partials are compiled into regular Ruby methods under the hood.
Because it is impossible in Ruby to dynamically create local variables, every single combination of `locals` passed to
a partial requires compiling another version:

```html+erb
<%# app/views/articles/show.html.erb %>
<%= render partial: "article", layout: "box", locals: { article: @article } %>
<%= render partial: "article", layout: "box", locals: { article: @article, theme: "dark" } %>
```

The above snippet will cause the partial to be compiled twice, taking more time and using more memory.

```ruby
def _render_template_2323231_article_show(buffer, local_assigns, article:)
  # ...
end

def _render_template_3243454_article_show(buffer, local_assigns, article:, theme:)
  # ...
end
```

When the number of combinations is small, it's not really a problem, but if it's large it can waste
a sizeable amount of memory and take a long time to compile. To counter act this you can use
strict locals to define the compiled partial signature, and ensure only a single version of the partial is compiled:

```html+erb
<%# locals: (article:, theme: "light") -%>
...
```

You can enforce how many and which `locals` a template accepts, set default
values, and more with a `locals:` signature, using the same syntax as Ruby method signatures.

Here are some examples of the `locals:` signature:

```html+erb
<%# app/views/messages/_message.html.erb %>

<%# locals: (message:) -%>
<%= message %>
```

The above makes `message` a required local variable. Rendering the partial
without a `:message` local variable argument will raise an exception:

```ruby
render "messages/message"
# => ActionView::Template::Error: missing local: :message for app/views/messages/_message.html.erb
```

If a default value is set then it can be used if `message` is not passed in
`locals:`:

```erb
<%# app/views/messages/_message.html.erb %>

<%# locals: (message: "Hello, world!") -%>
<%= message %>
```

Rendering the partial without a `:message` local variable uses the default value
set in the `locals:` signature:

```ruby
render "messages/message"
# => "Hello, world!"
```

Rendering the partial with local variables not specified in the `local:` signature will also raise an exception:

```ruby
render "messages/message", unknown_local: "will raise"
# => ActionView::Template::Error: unknown local: :unknown_local for app/views/messages/_message.html.erb
```

You can allow optional local variable arguments with the double splat `**`
operator:

```erb

<%# app/views/messages/_message.html.erb %>

<%# locals: (message: "Hello, world!", **attributes) -%>
<%= tag.p(message, **attributes) %>
```

Or you can disable `locals` entirely by setting the `locals:` to empty `()`:

```erb
<%# app/views/messages/_message.html.erb %>

<%# locals: () %>
```

Rendering the partial with *any* local variable arguments will raise an
exception:

```ruby
render "messages/message", unknown_local: "will raise"
# => ActionView::Template::Error: no locals accepted for app/views/messages/_message.html.erb
```

Action View will process the `locals:` signature in any templating engine
that supports `#`-prefixed comments, and will read the signature from any
line in the partial.

CAUTION: Only keyword arguments are supported. Defining positional or block
arguments will raise an Action View Error at render-time.

The `local_assigns` method does not contain default values specified in the
`local:` signature. To access a local variable with a default value that
is named the same as a reserved Ruby keyword, like `class` or `if`, the values
can be accessed through `binding.local_variable_get`:

```erb
<%# locals: (class: "message") %>
<div class="<%= binding.local_variable_get(:class) %>">...</div>
```

Layouts
-------

Layouts can be used to render a common view template around the results of Rails
controller actions. A Rails application can have multiple layouts that pages can
be rendered within.

For example, an application might have one layout for a logged in user and
another for the marketing part of the site. The logged in user layout might
include top-level navigation that should be present across many controller
actions. The sales layout for a SaaS app might include top-level navigation for
things like "Pricing" and "Contact Us" pages. Different layouts can have a
different header and footer content.

To find the layout for the current controller action, Rails first looks for a
file in `app/views/layouts` with the same base name as the controller. For
example, rendering actions from the `ProductsController` class will use
`app/views/layouts/products.html.erb`.

Rails will use `app/views/layouts/application.html.erb` if a controller-specific layout does not exist.

Here is an example of a simple layout in `application.html.erb` file:

```html+erb
<!DOCTYPE html>
<html>
<head>
  <title><%= "Your Rails App" %></title>
  <%= csrf_meta_tags %>
  <%= csp_meta_tag %>
  <%= stylesheet_link_tag "application", "data-turbo-track": "reload" %>
  <%= javascript_importmap_tags %>
</head>
<body>

<nav>
  <ul>
    <li><%= link_to "Home", root_path %></li>
    <li><%= link_to "Products", products_path %></li>
    <!-- Additional navigation links here -->
  </ul>
</nav>

<%= yield %>

<footer>
  <p>&copy; <%= Date.current.year %> Your Company</p>
</footer>
```

In the above example layout, view content will be rendered in place of `<%=
yield %>`, and surrounded by the same `<head>`, `<nav>`, and `<footer>` content.

Rails provides more ways to assign specific layouts to individual controllers
and actions. You can learn more about layouts in general in the [Layouts and
Rendering in Rails](layouts_and_rendering.html) guide.

### Partial Layouts

Partials can have their own layouts applied to them. These layouts are different
from those applied to a controller action, but they work in a similar fashion.

Let's say you're displaying an article on a page which should be wrapped in a
`div` for display purposes. First, you'll create a new `Article`:

```ruby
Article.create(body: "Partial Layouts are cool!")
```

In the `show` template, you'll render the `_article` partial wrapped in the
`box` layout:

```html+erb
<%# app/views/articles/show.html.erb %>
<%= render partial: 'article', layout: 'box', locals: { article: @article } %>
```

The `box` layout simply wraps the `_article` partial in a `div`:

```html+erb
<%# app/views/articles/_box.html.erb %>
<div class="box">
  <%= yield %>
</div>
```

Note that the partial layout has access to the local `article` variable that was
passed into the `render` call, although it is not being used within
`_box.html.erb` in this case.

Unlike application-wide layouts, partial layouts still have the underscore
prefix in their name.

You can also render a block of code within a partial layout instead of calling
`yield`. For example, if you didn't have the `_article` partial, you could do
this instead:

```html+erb
<%# app/views/articles/show.html.erb %>
<%= render(layout: 'box', locals: { article: @article }) do %>
  <div>
    <p><%= article.body %></p>
  </div>
<% end %>
```

Assuming you use the same `_box` partial from above, this would produce the same
output as the previous example.

### Collection with Partial Layouts

When rendering collections it is also possible to use the `:layout` option:

```erb
<%= render partial: "article", collection: @articles, layout: "special_layout" %>
```

The layout will be rendered together with the partial for each item in the
collection. The current object and object_counter variables, `article` and
`article_counter` in the above example, will be available in the layout as well,
the same way they are within the partial.

Helpers
-------

Rails provides many helper methods to use with Action View. These include
methods for:

* Formatting dates, strings and numbers
* Creating HTML links to images, videos, stylesheets, etc...
* Sanitizing content
* Creating forms
* Localizing content

You can learn more about helpers in the [Action View Helpers
Guide](action_view_helpers.html) and the [Action View Form Helpers
Guide](form_helpers.html).

Localized Views
---------------

Action View has the ability to render different templates depending on the
current locale.

For example, suppose you have an `ArticlesController` with a `show` action. By
default, calling this action will render `app/views/articles/show.html.erb`. But
if you set `I18n.locale = :de`, then Action View will try to render the template
`app/views/articles/show.de.html.erb` first. If the localized template isn't
present, the undecorated version will be used. This means you're not required to
provide localized views for all cases, but they will be preferred and used if
available.

You can use the same technique to localize the rescue files in your public
directory. For example, setting `I18n.locale = :de` and creating
`public/500.de.html` and `public/404.de.html` would allow you to have localized
rescue pages.

See the [Rails Internationalization (I18n) API documentation](i18n.html) for
more details.
