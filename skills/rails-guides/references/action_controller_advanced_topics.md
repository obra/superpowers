**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Action Controller Advanced Topics
=================================

In this guide, you will learn about some advanced topics related to controllers. After reading this guide, you will know how to:

* Protect against cross-site request forgery.
* Use Action Controller's built-in HTTP authentication.
* Stream data directly to the user's browser.
* Filter sensitive parameters from the application logs.
* Handle exceptions that may be raised during request processing.
* Use the built-in health check endpoint for load balancers and uptime monitors.

--------------------------------------------------------------------------------

Introduction
------------

This guide covers a number of advanced topics related to controllers in a Rails
application. Please see the [Action Controller
Overview](action_controller_overview.html) guide for an introduction to Action
Controllers.

Authenticity Token and Request Forgery Protection
-------------------------------------------------

Cross-site request forgery
([CSRF](https://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection.html#method-i-form_authenticity_token))
is a type of malicious attack where unauthorized requests are submitted by
impersonating a user that the web application trusts.

The first step to avoid this type of attack is to ensure that all "destructive"
actions (create, update, and destroy) in your application use non-GET requests (like POST, PUT and DELETE).

However, a malicious site can still send a non-GET request to your site, so
Rails builds in request forgery protection into controllers by default.

This is done by adding a token using the
[protect_from_forgery](https://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection/ClassMethods.html#method-i-protect_from_forgery)
method. This token is added to each request and is only known to your server.
Rails verifies the received token with the token in the session. If an incoming
request does not have the proper matching token, the server will deny access.

The CSRF token is added automatically when `config.action_controller.default_protect_from_forgery` is set to `true`, which is the default for newly created Rails applications. It can also be manually like this:

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
end
```

NOTE: All subclasses of `ActionController::Base` are protected by default and
will raise an `ActionController::InvalidCrossOriginRequest` error on unverified
requests.

### Authenticity Token in Forms

When you generate a form using `form_with` like this:

```erb
<%= form_with model: @user do |form| %>
  <%= form.text_field :username %>
  <%= form.text_field :password %>
<% end %>
```

A CSRF token named `authenticity_token` is automatically added as a hidden field
in the generated HTML:

```html
<form accept-charset="UTF-8" action="/users/1" method="post">
<input type="hidden"
       value="67250ab105eb5ad10851c00a5621854a23af5489"
       name="authenticity_token"/>
<!-- fields -->
</form>
```

Rails adds this token to every `form` that's generated using the [form
helpers](form_helpers.html), so most of the time you don't need to do anything.
If you're writing a form manually or need to add the token for another reason,
it's available through the
[`form_authenticity_token`](https://api.rubyonrails.org/classes/ActionController/RequestForgeryProtection.html#method-i-form_authenticity_token)
method.

```html
<!-- app/views/layouts/application.html.erb -->
<head>
  <meta name="csrf-token" content="<%= form_authenticity_token %>">
</head>
```

The `form_authenticity_token` method generates a valid authentication token.
That can be useful in places where Rails does not add it automatically, like in
custom Ajax calls.

You can learn more details about the CSRF attack as well as CSRF countermeasures
in the [Security Guide](security.html#cross-site-request-forgery-csrf).

Controlling Allowed Browser Versions
------------------------------------

Starting with version 7.2, Rails controllers use [`allow_browser`](https://api.rubyonrails.org/classes/ActionController/AllowBrowser/ClassMethods.html#method-i-allow_browser) method in `ApplicationController` to allow only modern browsers by default.

```ruby
class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
end
```

TIP: Modern browsers includes Safari 17.2+, Chrome 120+, Firefox 121+, Opera 106+. You can use [caniuse.com](https://caniuse.com/) to check for browser versions supporting the features you'd like to use.

In addition to the default of `:modern`, you can also specify the browser versions manually:

```ruby
class ApplicationController < ActionController::Base
  # All versions of Chrome and Opera will be allowed, but no versions of "internet explorer" (ie). Safari needs to be 16.4+ and Firefox 121+.
  allow_browser versions: { safari: 16.4, firefox: 121, ie: false }
end
```

Browsers matched in the hash passed to `versions:` will be blocked if they’re below the versions specified. This means that all other browsers not mentioned in `versions:` (Chrome and Opera in the above example), as well as agents that aren’t reporting a user-agent header, _will be_ allowed access.

You can also use `allow_browser` in a given controller and specify actions using `only` or `except`. For example:

```ruby
class MessagesController < ApplicationController
  # In addition to the browsers blocked by ApplicationController, also block Opera below 104 and Chrome below 119 for the show action.
  allow_browser versions: { opera: 104, chrome: 119 }, only: :show
end
```

A browser that’s blocked will, by default, be served the file in `public/406-unsupported-browser.html` with an HTTP status code of “406 Not Acceptable”.

HTTP Authentication
-------------------

Rails comes with three built-in HTTP authentication mechanisms:

* Basic Authentication
* Digest Authentication
* Token Authentication

### HTTP Basic Authentication

HTTP Basic Authentication is a simple authentication method where a user is
required to enter a username and password to access a website or a particular
section of a website (e.g. admin section). These credentials are entered into a
browser's HTTP basic dialog window. The user’s credentials are then encoded and
sent in the HTTP header with each request.

HTTP basic authentication is an authentication scheme that is supported by most
browsers. Using HTTP Basic authentication in a Rails controller can be done by
using the [`http_basic_authenticate_with`][] method:

```ruby
class AdminsController < ApplicationController
  http_basic_authenticate_with name: "Arthur", password: "42424242"
end
```

With the above in place, you can create controllers that inherit from
`AdminsController`. All actions in those controllers will use HTTP basic
authentication and require user credentials.

WARNING: HTTP Basic Authentication is easy to implement but not secure on its
own, as it will send unencrypted credentials over the network. Make sure to use
HTTPS when using Basic Authentication. You can also [force
HTTPS](#force-https-protocol).

[`http_basic_authenticate_with`]:
    https://api.rubyonrails.org/classes/ActionController/HttpAuthentication/Basic/ControllerMethods/ClassMethods.html#method-i-http_basic_authenticate_with

### HTTP Digest Authentication

HTTP digest authentication is more secure than basic authentication as it does
not require the client to send an unencrypted password over the network. The
credentials are hashed instead and a
[Digest](https://api.rubyonrails.org/classes/ActionController/HttpAuthentication/Digest.html)
is sent.

Using digest authentication with Rails can be done by using
the [`authenticate_or_request_with_http_digest`][] method:

```ruby
class AdminsController < ApplicationController
  USERS = { "admin" => "helloworld" }

  before_action :authenticate

  private
    def authenticate
      authenticate_or_request_with_http_digest do |username|
        USERS[username]
      end
    end
end
```

The `authenticate_or_request_with_http_digest` block takes only one argument -
the username. The block returns the password if found. If the return value is
`false` or `nil`, it is considered an authentication failure.

[`authenticate_or_request_with_http_digest`]:
    https://api.rubyonrails.org/classes/ActionController/HttpAuthentication/Digest/ControllerMethods.html#method-i-authenticate_or_request_with_http_digest

### HTTP Token Authentication

Token authentication (aka "Bearer" authentication) is an authentication method
where a client receives a unique token after successfully logging in, which it
then includes in the `Authorization` header of future requests. Instead of
sending credentials with each request, the client sends this
[token](https://api.rubyonrails.org/classes/ActionController/HttpAuthentication/Token.html)
(a string that represents the user's session) as a "bearer" of the
authentication.

This approach improves security by separating credentials from the ongoing
session. You use an authentication token that has been issued in advance to
perform authentication.

Implementing token authentication with Rails can be done using the
[`authenticate_or_request_with_http_token`][] method.

```ruby
class PostsController < ApplicationController
  TOKEN = "secret"

  before_action :authenticate

  private
    def authenticate
      authenticate_or_request_with_http_token do |token, options|
        ActiveSupport::SecurityUtils.secure_compare(token, TOKEN)
      end
    end
end
```

The `authenticate_or_request_with_http_token` block takes two arguments - the
token and a hash containing the options that were parsed from the HTTP
`Authorization` header. The block should return `true` if the authentication is
successful. Returning `false` or `nil` will cause an authentication failure.

[`authenticate_or_request_with_http_token`]:
    https://api.rubyonrails.org/classes/ActionController/HttpAuthentication/Token/ControllerMethods.html#method-i-authenticate_or_request_with_http_token

Streaming and File Downloads
----------------------------

Rails controllers provide a way to send a file to the user instead of rendering
an HTML page. This can be done with the [`send_data`][] and the [`send_file`][]
methods, which stream data to the client. The `send_file` method is a
convenience method that lets you provide the name of a file, and it will stream
the contents of that file.

Here is an example of how to use `send_data`:

```ruby
require "prawn"
class ClientsController < ApplicationController
  # Generates a PDF document with information on the client and
  # returns it. The user will get the PDF as a file download.
  def download_pdf
    client = Client.find(params[:id])
    send_data generate_pdf(client),
              filename: "#{client.name}.pdf",
              type: "application/pdf"
  end

  private
    def generate_pdf(client)
      Prawn::Document.new do
        text client.name, align: :center
        text "Address: #{client.address}"
        text "Email: #{client.email}"
      end.render
    end
end
```

The `download_pdf` action in the above example calls a private method which
generates the PDF document and returns it as a string. This string will then be
streamed to the client as a file download.

Sometimes when streaming files to the user, you may not want them to download
the file. Take images, for example, which can be embedded into HTML pages. To
tell the browser a file is not meant to be downloaded, you can set the
`:disposition` option to "inline". The default value for this option is
"attachment".

[`send_data`]:
    https://api.rubyonrails.org/classes/ActionController/DataStreaming.html#method-i-send_data
[`send_file`]:
    https://api.rubyonrails.org/classes/ActionController/DataStreaming.html#method-i-send_file

### Sending Files

If you want to send a file that already exists on disk, use the `send_file`
method.

```ruby
class ClientsController < ApplicationController
  # Stream a file that has already been generated and stored on disk.
  def download_pdf
    client = Client.find(params[:id])
    send_file("#{Rails.root}/files/clients/#{client.id}.pdf",
              filename: "#{client.name}.pdf",
              type: "application/pdf")
  end
end
```

The file will be read and streamed at 4 kB at a time by default, to avoid loading
the entire file into memory at once. You can turn off streaming with the
`:stream` option or adjust the block size with the `:buffer_size` option.

If `:type` is not specified, it will be guessed from the file extension
specified in `:filename`. If the content-type is not registered for the
extension, `application/octet-stream` will be used.

WARNING: Be careful when using data coming from the client (params, cookies,
etc.) to locate the file on disk. This is a security risk as it might allow
someone to gain access to sensitive files.

TIP: It is not recommended that you stream static files through Rails if you can
instead keep them in a public folder on your web server. It is much more
efficient to let the user download the file directly using Apache or another web
server, keeping the request from unnecessarily going through the whole Rails
stack.

### RESTful Downloads

While `send_data` works fine, if you are creating a RESTful application having
separate actions for file downloads is usually not necessary. In REST
terminology, the PDF file from the example above can be considered just another
representation of the client resource. Rails provides a slick way of doing
"RESTful" downloads. Here's how you can rewrite the example so that the PDF
download is a part of the `show` action, without any streaming:

```ruby
class ClientsController < ApplicationController
  # The user can request to receive this resource as HTML or PDF.
  def show
    @client = Client.find(params[:id])

    respond_to do |format|
      format.html
      format.pdf { render pdf: generate_pdf(@client) }
    end
  end
end
```

Now the user can request to get a PDF version of a client just by adding ".pdf"
to the URL:

```
GET /clients/1.pdf
```

You can call any method on `format` that is an extension registered as a MIME
type by Rails. Rails already registers common MIME types like `"text/html"` and
`"application/pdf"`:

```ruby
Mime::Type.lookup_by_extension(:pdf)
# => "application/pdf"
```

If you need additional MIME types, call
[`Mime::Type.register`](https://api.rubyonrails.org/classes/Mime/Type.html#method-c-register)
in the file `config/initializers/mime_types.rb`. For example, this is how you
would register the Rich Text Format (RTF):

```ruby
Mime::Type.register("application/rtf", :rtf)
```

NOTE: If you modify an initializer file, you have to restart the server for
their changes to take effect.

### Live Streaming of Arbitrary Data

Rails allows you to stream more than just files. In fact, you can stream
anything you would like in a response object. The
[`ActionController::Live`](https://api.rubyonrails.org/classes/ActionController/Live.html)
module allows you to create a persistent connection with a browser. By including
this module in your controller, you can send arbitrary data to the browser at
specific points in time.

```ruby
class MyController < ActionController::Base
  include ActionController::Live

  def stream
    response.headers["Content-Type"] = "text/event-stream"
    100.times {
      response.stream.write "hello world\n"
      sleep 1
    }
  ensure
    response.stream.close
  end
end
```

The above example will keep a persistent connection with the browser and send
100 messages of `"hello world\n"`, each one second apart.

Note that you have to make sure to close the response stream, otherwise the
stream will leave the socket open indefinitely. You also have to set the content
type to `text/event-stream` *before* calling `write` on the response stream.
Headers cannot be written after the response has been committed (when
`response.committed?` returns a truthy value) with either `write` or `commit`.

#### Example Use Case

Let's suppose that you were making a karaoke machine, and a user wants to get
the lyrics for a particular song. Each `Song` has a particular number of lines
and each line takes time `num_beats` to finish singing.

If we wanted to return the lyrics in karaoke fashion (only sending the line when
the singer has finished the previous line), then we could use
`ActionController::Live` as follows:

```ruby
class LyricsController < ActionController::Base
  include ActionController::Live

  def show
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"

    song = Song.find(params[:id])

    song.each do |line|
      response.stream.write line.lyrics
      sleep line.num_beats
    end
  ensure
    response.stream.close
  end
end
```

#### Streaming Considerations

Streaming arbitrary data is an extremely powerful tool. As shown in the previous
examples, you can choose when and what to send across a response stream.
However, you should also note the following things:

* Each response stream creates a new thread and copies over the thread local
  variables from the original thread. Having too many thread local variables can
  negatively impact performance. Similarly, a large number of threads can also
  hinder performance.
* Failing to close the response stream will leave the corresponding socket open
  forever. Make sure to call `close` whenever you are using a response stream.
* WEBrick servers buffer all responses, and so streaming with
  `ActionController::Live` will not work. You must use a web server which does
  not automatically buffer responses.

Log Filtering
-------------

Rails keeps a log file for each environment in the `log` folder at the
application's root directory. Log files are extremely useful when debugging your
application, but in a production environment you may not want every bit of
information stored in log files. Rails allows you to specify parameters that
should not be stored.

### Parameters Filtering

You can filter out sensitive request parameters from your log files by appending
them to [`config.filter_parameters`][] in the application configuration.

```ruby
config.filter_parameters << :password
```

These parameters will be marked `[FILTERED]` in the log.

The parameters specified in `filter_parameters` will be filtered out with
partial matching regular expression. So for example, `:passw` will filter out
`password`, `password_confirmation`, etc.

Rails adds a list of default filters, including `:passw`, `:secret`, and
`:token`, in the appropriate initializer
(`initializers/filter_parameter_logging.rb`) to handle typical application
parameters like `password`, `password_confirmation` and `my_token`.

[`config.filter_parameters`]: configuring.html#config-filter-parameters

### Redirects Filtering

Sometimes it's desirable to filter out sensitive locations that your application
is redirecting to. You can do that by using the `config.filter_redirect`
configuration option:

```ruby
config.filter_redirect << "s3.amazonaws.com"
```

You can set it to a String, a Regexp, or an Array of both.

```ruby
config.filter_redirect.concat ["s3.amazonaws.com", /private_path/]
```

Matching URLs will be replaced with `[FILTERED]`. However, if you only wish to
filter the parameters, not the whole URLs, you can use parameter filtering.

Force HTTPS Protocol
--------------------

If you'd like to ensure that communication to your controller is only possible
via HTTPS, you can do so by enabling the [`ActionDispatch::SSL`][] middleware
via [`config.force_ssl`][] in your environment configuration.

[`config.force_ssl`]: configuring.html#config-force-ssl
[`ActionDispatch::SSL`]:
    https://api.rubyonrails.org/classes/ActionDispatch/SSL.html

Built-in Health Check Endpoint
------------------------------

Rails comes with a built-in health check endpoint that is reachable at the `/up`
path. This endpoint will return a 200 status code if the app has booted with no
exceptions, and a 500 status code otherwise.

In production, many applications are required to report their status, whether
it's to an uptime monitor that will page an engineer when things go wrong, or a
load balancer or Kubernetes controller used to determine the health of a given
instance. This health check is designed to be a one-size fits all that will work
in many situations.

While any newly generated Rails applications will have the health check at
`/up`, you can configure the path to be anything you'd like in your
"config/routes.rb":

```ruby
Rails.application.routes.draw do
  get "health" => "rails/health#show", as: :rails_health_check
end
```

The health check will now be accessible via `GET` or `HEAD` requests to the
`/health` path.

NOTE: This endpoint does not reflect the status of all of your application's
dependencies, such as the database or redis. Replace "rails/health#show" with
your own controller action if you have application specific needs.

Reporting the health of an application requires some considerations. You'll have
to decide what you want to include in the check. For example, if a third-party
service is down and your application reports that it's down due to the
dependency, your application may be restarted unnecessarily. Ideally, your
application should handle third-party outages gracefully.

Handling Errors
----------------

Your application will likely contain bugs and throw exceptions that needs to be
handled. For example, if the user follows a link to a resource that no longer
exists in the database, Active Record will throw the
`ActiveRecord::RecordNotFound` exception.

Rails default exception handling displays a "500 Server Error" message for all
exceptions. If the request was made in development, a nice backtrace and
additional information is displayed, to help you figure out what went wrong. If
the request was made in production, Rails will display a simple "500 Server
Error" message, or a "404 Not Found" if there was a routing error, or a record
could not be found.

You can customize how these errors are caught and how they're displayed to the
user. There are several levels of exception handling available in a Rails
application. You can use `config.action_dispatch.show_exceptions` configuration
to control how Rails handles exceptions raised while responding to requests. You
can learn more about the levels of exceptions in the
[configuration](configuring.html#config-action-dispatch-show-exceptions) guide.

### The Default Error Templates

By default, in the production environment the application will render an error
page. These pages are contained in static HTML files in the public folder, in
`404.html`, `500.html`, etc. You can customize these files to add some extra
information and styles.

NOTE: The error templates are static HTML files so you can't use ERB, SCSS, or
layouts for them.

### `rescue_from`

You can catch specific errors and do something different with them by using the
[`rescue_from`][] method. It can handle exceptions of a certain type (or
multiple types) in an entire controller and its subclasses.

When an exception occurs which is caught by a `rescue_from` directive, the
exception object is passed to the handler.

Below is an example of how you can use `rescue_from` to intercept all
`ActiveRecord::RecordNotFound` errors and do something with them:

```ruby
class ApplicationController < ActionController::Base
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private
    def record_not_found
      render plain: "Record Not Found", status: 404
    end
end
```

The handler can be a method or a `Proc` object passed to the `:with` option. You
can also use a block directly instead of an explicit `Proc` object.

The above example doesn't improve on the default exception handling at all, but
it serves to show how once you catch specific exceptions, you're free to do
whatever you want with them. For example, you could create custom exception
classes that will be thrown when a user doesn't have access to a certain section
of your application:

```ruby
class ApplicationController < ActionController::Base
  rescue_from User::NotAuthorized, with: :user_not_authorized

  private
    def user_not_authorized
      flash[:error] = "You don't have access to this section."
      redirect_back(fallback_location: root_path)
    end
end

class ClientsController < ApplicationController
  # Check that the user has the right authorization to access clients.
  before_action :check_authorization

  def edit
    @client = Client.find(params[:id])
  end

  private
    # If the user is not authorized, throw the custom exception.
    def check_authorization
      raise User::NotAuthorized unless current_user.admin?
    end
end
```

WARNING: Using `rescue_from` with `Exception` or `StandardError` would cause
serious side-effects as it prevents Rails from handling exceptions properly. As
such, it is not recommended to do so unless there is a strong reason.

NOTE: Certain exceptions are only rescuable from the `ApplicationController`
class, as they are raised before the controller gets initialized, and the action
gets executed.

[`rescue_from`]: https://api.rubyonrails.org/classes/ActiveSupport/Rescuable/ClassMethods.html#method-i-rescue_from
