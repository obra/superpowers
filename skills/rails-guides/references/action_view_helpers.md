**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Action View Helpers
====================

After reading this guide, you will know:

* How to format dates, strings, and numbers.
* How to work with text and tags.
* How to link to images, videos, stylesheets, etc.
* How to work with Atom feeds and JavaScript in the views.
* How to cache, capture, debug and sanitize content.

--------------------------------------------------------------------------------

The following outlines **some of the most commonly used helpers** available in
Action View. It serves as a good starting point, but reviewing the full [API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers.html) is
also recommended, as it covers all of the helpers in more detail.

Formatting
----------

### Dates

These helpers facilitate the display of date and/or time elements as contextual
human readable forms.

#### distance_of_time_in_words

Reports the approximate distance in time between two `Time` or `Date` objects or
integers as seconds. Set `include_seconds` to true if you want more detailed
approximations.

```ruby
distance_of_time_in_words(Time.current, 15.seconds.from_now)
# => less than a minute
distance_of_time_in_words(Time.current, 15.seconds.from_now, include_seconds: true)
# => less than 20 seconds
```

NOTE: We use `Time.current` instead of `Time.now` because it returns the current
time based on the timezone set in Rails, whereas `Time.now` returns a Time
object based on the server's timezone.

See the [`distance_of_time_in_words` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-distance_of_time_in_words)
for more information.

#### time_ago_in_words

Reports the approximate distance in time between a `Time` or `Date` object, or
integer as seconds,  and `Time.current`.

```ruby
time_ago_in_words(3.minutes.from_now) # => 3 minutes
```

See the [`time_ago_in_words` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/DateHelper.html#method-i-time_ago_in_words)
for more information.

### Numbers

A set of methods for converting numbers into formatted strings. Methods are
provided for phone numbers, currency, percentage, precision, positional
notation, and file size.

#### number_to_currency

Formats a number into a currency string (e.g., $13.65).

```ruby
number_to_currency(1234567890.50) # => $1,234,567,890.50
```

See the [`number_to_currency` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_to_currency)
for more information.

#### number_to_human

Pretty prints (formats and approximates) a number so it is more readable by
users; useful for numbers that can get very large.

```ruby
number_to_human(1234)    # => 1.23 Thousand
number_to_human(1234567) # => 1.23 Million
```

See the [`number_to_human` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_to_human)
for more information.

#### number_to_human_size

Formats the bytes in size into a more understandable representation; useful for
reporting file sizes to users.

```ruby
number_to_human_size(1234)    # => 1.21 KB
number_to_human_size(1234567) # => 1.18 MB
```

See the [`number_to_human_size` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_to_human_size)
for more information.

#### number_to_percentage

Formats a number as a percentage string.

```ruby
number_to_percentage(100, precision: 0) # => 100%
```

See the [`number_to_percentage` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_to_percentage)
for more information.

#### number_to_phone

Formats a number into a phone number (US by default).

```ruby
number_to_phone(1235551234) # => 123-555-1234
```

See the [`number_to_phone` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_to_phone)
for more information.

#### number_with_delimiter

Formats a number with grouped thousands using a delimiter.

```ruby
number_with_delimiter(12345678) # => 12,345,678
```

See the [`number_with_delimiter` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_with_delimiter)
for more information.

#### number_with_precision

Formats a number with the specified level of `precision`, which defaults to 3.

```ruby
number_with_precision(111.2345)               # => 111.235
number_with_precision(111.2345, precision: 2) # => 111.23
```

See the [`number_with_precision` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/NumberHelper.html#method-i-number_with_precision)
for more information.

### Text

A set of methods for filtering, formatting and transforming strings.

#### excerpt

Given a `text` and a `phrase`, `excerpt` searches for and extracts the first
occurrence of the `phrase`, plus the requested surrounding text determined by a
`radius`. An omission marker is prepended/appended if the start/end of the
result does not coincide with the start/end of the text.

```ruby
excerpt("This is a very beautiful morning", "very", separator: " ", radius: 1)
# => ...a very beautiful...

excerpt("This is also an example", "an", radius: 8, omission: "<chop> ")
#=> <chop> is also an example
```

See the [`excerpt` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/TextHelper.html#method-i-excerpt)
for more information.

#### pluralize

Returns the singular or plural form of a word based on the value of a number.

```ruby
pluralize(1, "person") # => 1 person
pluralize(2, "person") # => 2 people
pluralize(3, "person", plural: "users") # => 3 users
```

See the [`pluralize` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/TextHelper.html#method-i-pluralize)
for more information.

#### truncate

Truncates a given `text` to a given `length`. If the text is truncated, an
omission marker will be appended to the result for a total length not exceeding
`length`.

```ruby
truncate("Once upon a time in a world far far away")
# => "Once upon a time in a world..."

truncate("Once upon a time in a world far far away", length: 17)
# => "Once upon a ti..."

truncate("one-two-three-four-five", length: 20, separator: "-")
# => "one-two-three..."

truncate("And they found that many people were sleeping better.", length: 25, omission: "... (continued)")
# => "And they f... (continued)"

truncate("<p>Once upon a time in a world far far away</p>", escape: false)
# => "<p>Once upon a time in a wo..."
```

See the [`truncate` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/TextHelper.html#method-i-truncate)
for more information.

#### word_wrap

Wraps the text into lines no longer than `line_width` width.

```ruby
word_wrap("Once upon a time", line_width: 8)
# => "Once\nupon a\ntime"
```

See the [`word_wrap` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/TextHelper.html#method-i-word_wrap)
for more information.

Forms
-----

Form helpers simplify working with models compared to using standard HTML
elements alone. They offer a range of methods tailored to generating forms based
on your models. Some methods correspond to a specific type of input, such as
text fields, password fields, select dropdowns, and more. When a form is
submitted, the inputs within the form are grouped into the params object and
sent back to the controller.

You can learn more about form helpers in the [Action View Form Helpers
Guide](form_helpers.html).

Navigation
----------

A set of methods to build links and URLs that depend on the routing subsystem.

### button_to

Generates a form that submits to the passed URL. The form has a submit button
with the value of the `name`.

```html+erb
<%= button_to "Sign in", sign_in_path %>
```

would output the following HTML:

```html
<form method="post" action="/sessions" class="button_to">
  <input type="submit" value="Sign in" />
</form>
```

See the [`button_to` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/UrlHelper.html#method-i-button_to)
for more information.

### current_page?

Returns true if the current request URL matches the given `options`.

```html+erb
<% if current_page?(controller: 'profiles', action: 'show') %>
  <strong>Currently on the profile page</strong>
<% end %>
```

See the [`current_page?` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/UrlHelper.html#method-i-current_page-3F)
for more information.

### link_to

Links to a URL derived from `url_for` under the hood. It's commonly used to
create links for RESTful resources, especially when passing models as arguments
to `link_to`.

```ruby
link_to "Profile", @profile
# => <a href="/profiles/1">Profile</a>

link_to "Book", @book # given a composite primary key [:author_id, :id]
# => <a href="/books/2_1">Book</a>

link_to "Profiles", profiles_path
# => <a href="/profiles">Profiles</a>

link_to nil, "https://example.com"
# => <a href="https://example.com">https://example.com</a>

link_to "Articles", articles_path, id: "articles", class: "article__container"
# => <a href="/articles" class="article__container" id="articles">Articles</a>
```

You can use a block if your link target can't fit in the name parameter.

```html+erb
<%= link_to @profile do %>
  <strong><%= @profile.name %></strong> -- <span>Check it out!</span>
<% end %>
```

It would output the following HTML:

```html
<a href="/profiles/1">
  <strong>David</strong> -- <span>Check it out!</span>
</a>
```

See the [`link_to` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/UrlHelper.html#method-i-link_to)
for more information.

### mail_to

Generates a `mailto` link tag to the specified email address. You can also
specify the link text, additional HTML options, and whether to encode the email
address.

```ruby
mail_to "john_doe@gmail.com"
# => <a href="mailto:john_doe@gmail.com">john_doe@gmail.com</a>

mail_to "me@john_doe.com", cc: "me@jane_doe.com",
        subject: "This is an example email"
# => <a href="mailto:"me@john_doe.com?cc=me@jane_doe.com&subject=This%20is%20an%20example%20email">"me@john_doe.com</a>
```

See the [`mail_to` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/UrlHelper.html#method-i-mail_to)
for more information.

### url_for

Returns the URL for the set of `options` provided.

```ruby
url_for @profile
# => /profiles/1

url_for [ @hotel, @booking, page: 2, line: 3 ]
# => /hotels/1/bookings/1?line=3&page=2

url_for @post # given a composite primary key [:blog_id, :id]
# => /posts/1_2
```

Sanitization
------------

A set of methods for scrubbing text of undesired HTML elements. The helpers are
particularly useful for helping to ensure that only safe and valid HTML/CSS is
rendered. It can also be useful to prevent XSS attacks by escaping or removing
potentially malicious content from user input before rendering it in your views.

This functionality is powered internally by the
[rails-html-sanitizer](https://github.com/rails/rails-html-sanitizer) gem.

### sanitize

The `sanitize` method will HTML encode all tags and strip all attributes that
aren't specifically allowed.

```ruby
sanitize @article.body
```

If either the `:attributes` or `:tags` options are passed, only the mentioned
attributes and tags are allowed and nothing else.

```ruby
sanitize @article.body, tags: %w(table tr td), attributes: %w(id class style)
```

To change defaults for multiple uses, for example, adding table tags to the
default:

```ruby
# config/application.rb
class Application < Rails::Application
  config.action_view.sanitized_allowed_tags = %w(table tr td)
end
```

See the [`sanitize` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/SanitizeHelper.html#method-i-sanitize)
for more information.

### sanitize_css

Sanitizes a block of CSS code, particularly when it comes across a style
attribute in HTML content. `sanitize_css` is particularly useful when dealing
with user-generated content or dynamic content that includes style attributes.

The `sanitize_css` method below will remove the styles that are not allowed.

```ruby
sanitize_css("background-color: red; color: white; font-size: 16px;")
```

See the [`sanitize_css` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/SanitizeHelper.html#method-i-sanitize_css)
for more information.

### strip_links

Strips all link tags from text leaving just the link text.

```ruby
strip_links("<a href='https://rubyonrails.org'>Ruby on Rails</a>")
# => Ruby on Rails

strip_links("emails to <a href='mailto:me@email.com'>me@email.com</a>.")
# => emails to me@email.com.

strip_links("Blog: <a href='http://myblog.com/'>Visit</a>.")
# => Blog: Visit.
```

See the [`strip_links` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/SanitizeHelper.html#method-i-strip_links)
for more information.

### strip_tags

Strips all HTML tags from the HTML, including comments and special characters.

```ruby
strip_tags("Strip <i>these</i> tags!")
# => Strip these tags!

strip_tags("<b>Bold</b> no more! <a href='more.html'>See more</a>")
# => Bold no more! See more

strip_links('<<a href="https://example.org">malformed & link</a>')
# => &lt;malformed &amp; link
```

See the [`strip_tags` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/SanitizeHelper.html#method-i-strip_tags)
for more information.

Assets
------

A set of methods for generating HTML that links views to assets such as images,
JavaScript files, stylesheets, and feeds.

By default, Rails links to these assets on the current host in the public
folder, but you can direct Rails to link to assets from a dedicated assets
server by setting [`config.asset_host`][] in the application configuration,
typically in `config/environments/production.rb`.

For example, let's say your asset host is `assets.example.com`:

```ruby
config.asset_host = "assets.example.com"
```

then the corresponding URL for an `image_tag` would be:

```ruby
image_tag("rails.png")
# => <img src="//assets.example.com/images/rails.png" />
```

[`config.asset_host`]: configuring.html#config-asset-host

### audio_tag

Generates an HTML audio tag with source(s), either as a single tag for a string
source or nested source tags within an array for multiple sources. The `sources`
can be full paths, files in your public audios directory, or [Active Storage
attachments](active_storage_overview.html).

```ruby
audio_tag("sound")
# => <audio src="/audios/sound"></audio>

audio_tag("sound.wav", "sound.mid")
# => <audio><source src="/audios/sound.wav" /><source src="/audios/sound.mid" /></audio>

audio_tag("sound", controls: true)
# => <audio controls="controls" src="/audios/sound"></audio>
```

INFO: Internally, `audio_tag` uses [`audio_path` from the
AssetUrlHelpers](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetUrlHelper.html#method-i-audio_path)
to build the audio path.

See the [`audio_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-audio_tag)
for more information.

### auto_discovery_link_tag

Returns a link tag that browsers and feed readers can use to auto-detect an RSS,
Atom, or JSON feed.

```ruby
auto_discovery_link_tag(:rss, "http://www.example.com/feed.rss", { title: "RSS Feed" })
# => <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="http://www.example.com/feed.rss" />
```

See the [`auto_discovery_link_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-auto_discovery_link_tag)
for more information.

### favicon_link_tag

Returns a link tag for a favicon managed by the asset pipeline. The `source` can
be a full path or a file that exists in your assets directory.

```ruby
favicon_link_tag
# => <link href="/assets/favicon.ico" rel="icon" type="image/x-icon" />
```

See the [`favicon_link_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-favicon_link_tag)
for more information.

### image_tag

Returns an HTML image tag for the source. The `source` can be a full path or a
file that exists in your `app/assets/images` directory.

```ruby
image_tag("icon.png")
# => <img src="/assets/icon.png" />

image_tag("icon.png", size: "16x10", alt: "Edit Article")
# => <img src="/assets/icon.png" width="16" height="10" alt="Edit Article" />
```

INFO: Internally, `image_tag` uses [`image_path` from the
AssetUrlHelpers](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetUrlHelper.html#method-i-image_path)
to build the image path.

See the [`image_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-image_tag)
for more information.

### javascript_include_tag

Returns an HTML script tag for each of the sources provided. You can pass in the
filename (`.js` extension is optional) of JavaScript files that exist in your
`app/assets/javascripts` directory for inclusion into the current page, or you
can pass the full path relative to your document root.

```ruby
javascript_include_tag("common")
# => <script src="/assets/common.js"></script>

javascript_include_tag("common", async: true)
# => <script src="/assets/common.js" async="async"></script>
```

Some of the most common attributes are `async` and `defer`, where `async` will
allow the script to be loaded in parallel to be parsed and evaluated as soon as
possible, and `defer` will indicate that the script is meant to be executed
after the document has been parsed.

INFO: Internally, `javascript_include_tag` uses [`javascript_path` from the
AssetUrlHelpers](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetUrlHelper.html#method-i-javascript_path)
to build the script path.

See the [`javascript_include_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-javascript_include_tag)
for more information.

### picture_tag

Returns an HTML picture tag for the source. It supports passing a String, an
Array, or a Block.

```ruby
picture_tag("icon.webp", "icon.png")
```

This generates the following HTML:

```html
<picture>
  <source srcset="/assets/icon.webp" type="image/webp" />
  <source srcset="/assets/icon.png" type="image/png" />
  <img src="/assets/icon.png" />
</picture>
```

See the [`picture_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-picture_tag)
for more information.

### preload_link_tag

Returns a link tag that browsers can use to preload the source. The source can
be the path of a resource managed by the asset pipeline, a full path, or a URI.

```ruby
preload_link_tag("application.css")
# => <link rel="preload" href="/assets/application.css" as="style" type="text/css" />
```

See the [`preload_link_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-preload_link_tag)
for more information.

### stylesheet_link_tag

Returns a stylesheet link tag for the sources specified as arguments. If you
don't specify an extension, `.css` will be appended automatically.

```ruby
stylesheet_link_tag("application")
# => <link href="/assets/application.css" rel="stylesheet" />

stylesheet_link_tag("application", media: "all")
# => <link href="/assets/application.css" media="all" rel="stylesheet" />
```

`media` is used to specify the media type for the link. The most common media
types are `all`, `screen`, `print`, and `speech`.

INFO: Internally, `stylesheet_link_tag` uses [`stylesheet_path` from the
AssetUrlHelpers](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetUrlHelper.html#method-i-stylesheet_path)
to build the stylesheet path.

See the [`stylesheet_link_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-stylesheet_link_tag)
for more information.

### video_tag

Generate an HTML video tag with source(s), either as a single tag for a string
source or nested source tags within an array for multiple sources. The `sources`
can be full paths, files in your public videos directory, or Active Storage
attachments.

```ruby
video_tag("trailer")
# => <video src="/videos/trailer"></video>

video_tag(["trailer.ogg", "trailer.flv"])
# => <video><source src="/videos/trailer.ogg" /><source src="/videos/trailer.flv" /></video>

video_tag("trailer", controls: true)
# => <video controls="controls" src="/videos/trailer"></video>
```

INFO: Internally, `video_tag` uses [`video_path` from the
AssetUrlHelpers](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetUrlHelper.html#method-i-video_path)
to build the video path.

See the [`video_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-video_tag)
for more information.

JavaScript
----------

A set of methods for working with JavaScript in your views.

### escape_javascript

Escapes carriage returns and single and double quotes for JavaScript segments.
You would use this method to take a string of text and make sure that it doesn’t
contain any invalid characters when the browser tries to parse it.

For example, if you have a partial with a greeting that contains double quotes,
you can escape the greeting to use in a JavaScript alert.

```html+erb
<%# app/views/users/greeting.html.erb %>
My name is <%= current_user.name %>, and I'm here to say "Welcome to our website!"
```

```html+erb
<script>
  var greeting = "<%= escape_javascript render('users/greeting') %>";
  alert(`Hello, ${greeting}`);
</script>
```

This will escape the quotes correctly and display the greeting in an alert box.

See the [`escape_javascript` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/JavaScriptHelper.html#method-i-escape_javascript)
for more information.

### javascript_tag

Returns a JavaScript tag wrapping the provided code. You can pass a hash of
options to control the behavior of the `<script>` tag.

```ruby
javascript_tag("alert('All is good')", type: "application/javascript")
```

```html
<script type="application/javascript">
//<![CDATA[
alert('All is good')
//]]>
</script>
```

Instead of passing the content as an argument, you can also use a block.

```html+erb
<%= javascript_tag type: "application/javascript" do %>
  alert("Welcome to my app!")
<% end %>
```

See the [`javascript_tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/JavaScriptHelper.html#method-i-javascript_tag)
for more information.

Alternative Tags
----------------

A set of methods to generate HTML tags programmatically.

### tag

Generates a standalone HTML tag with the given `name` and `options`.

Every tag can be built with:

```ruby
tag.some_tag_name(optional content, options)
```

where tag name can be e.g. `br`, `div`, `section`, `article`, or any tag really.

For example, here are some common uses:

```ruby
tag.h1 "All titles fit to print"
# => <h1>All titles fit to print</h1>

tag.div "Hello, world!"
# => <div>Hello, world!</div>
```

Additionally, you can pass options to add attributes to the generated tag.

```ruby
tag.section class: %w( kitties puppies )
# => <section class="kitties puppies"></section>
```

In addition, HTML `data-*` attributes can be passed to the `tag` helper using
the `data` option, with a hash containing key-value pairs of sub-attributes. The
sub-attributes are then converted to `data-*` attributes that are dasherized in
order to work well with JavaScript.

```ruby
tag.div data: { user_id: 123 }
# => <div data-user-id="123"></div>
```

See the [`tag` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/TagHelper.html#method-i-tag)
for more information.

### token_list

Returns a string of tokens built from the arguments provided. This method is
also aliased as `class_names`.

```ruby
token_list("cats", "dogs")
# => "cats dogs"

token_list(nil, false, 123, "", "foo", { bar: true })
# => "123 foo bar"

mobile, alignment = true, "center"
token_list("flex items-#{alignment}", "flex-col": mobile)
# => "flex items-center flex-col"
class_names("flex items-#{alignment}", "flex-col": mobile) # using the alias
# => "flex items-center flex-col"
```

Capture Blocks
--------------

A set of methods to let you extract generated markup which can be used in other
parts of a template or layout file.

It provides a method to capture blocks into variables through `capture`, and a
way to capture a block of markup for use in a layout through `content_for`.

### capture

The `capture` method allows you to extract part of a template into a variable.

```html+erb
<% @greeting = capture do %>
  <p>Welcome! The date and time is <%= Time.current %></p>
<% end %>
```

You can then use this variable anywhere in your templates, layouts, or helpers.

```html+erb
<html>
  <head>
    <title>Welcome!</title>
  </head>
  <body>
    <%= @greeting %>
  </body>
</html>
```

The return of capture is the string generated by the block.

``` ruby
@greeting
# => "Welcome! The date and time is 2018-09-06 11:09:16 -0500"
```

See the [`capture` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/CaptureHelper.html#method-i-capture)
for more information.

### content_for

Calling `content_for` stores a block of markup in an identifier for later use.
You can make subsequent calls to the stored content in other templates, helper
modules or the layout by passing the identifier as an argument to `yield`.

A common use case is to set the title of a page in a `content_for` block.

You define a `content_for` block in the special page's view, and then you
`yield` it within the layout. For other pages, where the `content_for` block
isn't utilized, it remains empty, resulting in nothing being yielded.

```html+erb
<%# app/views/users/special_page.html.erb %>
<% content_for(:html_title) { "Special Page Title" } %>
```

```html+erb
<%# app/views/layouts/application.html.erb %>
<html>
  <head>
    <title><%= content_for?(:html_title) ? yield(:html_title) : "Default Title" %></title>
  </head>
</html>
```

You'll notice that in the above example, we use the `content_for?` predicate
method to conditionally render a title. This method checks whether any content
has been captured yet using `content_for`, enabling you to adjust parts of your
layout based on the content within your views.

Additionally, you can employ `content_for` within a helper module.

```ruby
# app/helpers/title_helper.rb
module TitleHelper
  def html_title
    content_for(:html_title) || "Default Title"
  end
end
```

Now, you can call `html_title` in your layout to retrieve the content stored in
the `content_for` block. If a `content_for` block is set on the page being
rendered, such as in the case of the `special_page`, it will display the title.
Otherwise, it will display the default text "Default Title".

WARNING: `content_for` is ignored in caches. So you shouldn’t use it for
elements that will be fragment cached.

NOTE: You may be thinking what's the difference between `capture` and
`content_for`? <br><br>
`capture` is used to capture a block of markup in a variable, while
`content_for` is used to store a block of markup in an identifier for later use.
Internally `content_for` actually calls `capture`. However, the key difference
lies in their behavior when invoked multiple times.<br><br>
`content_for` can be called repeatedly, concatenating the blocks it receives for
a specific identifier in the order they are provided. Each subsequent call
simply adds to what's already stored. In contrast, `capture` only returns the
content of the block, without keeping track of any previous invocations.

See the [`content_for` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/CaptureHelper.html#method-i-content_for)
for more information.

Performance
-----------

### benchmark

Wrap a `benchmark` block around expensive operations or possible bottlenecks to
get a time reading for the operation.

```html+erb
<% benchmark "Process data files" do %>
  <%= expensive_files_operation %>
<% end %>
```

This would add something like `Process data files (0.34523)` to the log, which
you can then use to compare timings when optimizing your code.


NOTE: This helper is a part of Active Support, and it is also available on
controllers, helpers, models, etc.

See the [`benchmark` API
Documentation](https://api.rubyonrails.org/classes/ActiveSupport/Benchmarkable.html#method-i-benchmark)
for more information.

### cache

You can cache fragments of a view rather than an entire action or page. This
technique is useful for caching pieces like menus, lists of news topics, static
HTML fragments, and so on. It allows a fragment of view logic to be wrapped in a
cache block and served out of the cache store when the next request comes in.

The `cache` method takes a block that contains the content you wish to cache.

For example, you could cache the footer of your application layout by wrapping
it in a `cache` block.

```erb
<% cache do %>
  <%= render "application/footer" %>
<% end %>
```

You could also cache based on model instances, for example, you can cache each
article on a page by passing the `article` object to the `cache` method. This
would cache each article separately.

```erb
<% @articles.each do |article| %>
  <% cache article do %>
    <%= render article %>
  <% end %>
<% end %>
```

When your application receives its first request to this page, Rails will write
a new cache entry with a unique key. A key looks something like this:

```irb
views/articles/index:bea67108094918eeba32cd4a6f786301/articles/1
```

See [`Fragment Caching`](caching_with_rails.html#fragment-caching) and the
[`cache` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/CacheHelper.html#method-i-cache)
for more information.

Miscellaneous
-------------

### atom_feed

Atom Feeds are XML-based file formats used to syndicate content and can be used
by users in feed readers to browse content or by search engines to help discover
additional information about your site.

This helper makes building an Atom feed easy, and is mostly used in Builder
templates for creating XML. Here's a full usage example:

```ruby
# config/routes.rb
resources :articles
```

```ruby
# app/controllers/articles_controller.rb
def index
  @articles = Article.all

  respond_to do |format|
    format.html
    format.atom
  end
end
```

```ruby
# app/views/articles/index.atom.builder
atom_feed do |feed|
  feed.title("Articles Index")
  feed.updated(@articles.first.created_at)

  @articles.each do |article|
    feed.entry(article) do |entry|
      entry.title(article.title)
      entry.content(article.body, type: "html")

      entry.author do |author|
        author.name(article.author_name)
      end
    end
  end
end
```

See the [`atom_feed` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/AtomFeedHelper.html#method-i-atom_feed)
for more information.

### debug

Returns a YAML representation of an object wrapped with a `pre` tag. This
creates a very readable way to inspect an object.

```ruby
my_hash = { "first" => 1, "second" => "two", "third" => [1, 2, 3] }
debug(my_hash)
```

```html
<pre class="debug_dump">---
first: 1
second: two
third:
- 1
- 2
- 3
</pre>
```

See the [`debug` API
Documentation](https://api.rubyonrails.org/classes/ActionView/Helpers/DebugHelper.html#method-i-debug)
for more information.
