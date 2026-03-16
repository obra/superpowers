**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Action Mailer Basics
====================

This guide covers sending emails from your Rails application.

After reading this guide, you will know:

* How to generate and edit Action Mailer classes and mailer views.
* How to send attachments and multipart emails.
* How to use Action Mailer callbacks.
* How to configure Action Mailer for your environment.
* How to preview emails and test your Action Mailer classes.

--------------------------------------------------------------------------------

What is Action Mailer?
----------------------

Action Mailer allows you to send emails from your Rails application. It's one of
the two email related components in the Rails framework. The other is [Action
Mailbox](action_mailbox_basics.html), which deals with _receiving_ emails.

Action Mailer uses classes (called "mailers") and views to create and configure
the email to send. Mailers are classes that inherit from
[`ActionMailer::Base`][]. Mailer classes are similar to controller classes. Both
have:

* Instance variables that are accessible in views.
* The ability to use layouts and partials.
* The ability to access a params hash.
* Actions and associated views in `app/views`.

[`ActionMailer::Base`]:
    https://api.rubyonrails.org/classes/ActionMailer/Base.html

Creating a Mailer and Views
---------------------------

This section will provide a step-by-step guide to sending email with Action
Mailer. Here are the details of each step.

### Generate the Mailer

First, you use the "mailer" generator to create the Mailer related classes:

```bash
$ bin/rails generate mailer User
create  app/mailers/user_mailer.rb
invoke  erb
create    app/views/user_mailer
invoke  test_unit
create    test/mailers/user_mailer_test.rb
create    test/mailers/previews/user_mailer_preview.rb
```

Like the `UserMailer` below, all generated Mailer classes inherit from
`ApplicationMailer`:

```ruby
# app/mailers/user_mailer.rb
class UserMailer < ApplicationMailer
end
```

The `ApplicationMailer` class inherits from `ActionMailer::Base`, and can be
used to define attributes common to all Mailers:

```ruby
# app/mailers/application_mailer.rb
class ApplicationMailer < ActionMailer::Base
  default from: "from@example.com"
  layout "mailer"
end
```

If you don't want to use a generator, you can also manually add a file to the
`app/mailers` directory. Make sure that your class inherits from
`ApplicationMailer`:

```ruby
# app/mailers/custom_mailer.rb
class CustomMailer < ApplicationMailer
end
```

### Edit the Mailer

The `UserMailer` in `app/mailers/user_mailer.rb` initially doesn't have any methods. So next, we add
methods (aka actions) to the mailer that will send specific emails.

Mailers have methods called "actions" and they use views to structure their
content, similar to controllers. While a controller generates HTML content to
send back to the client, a Mailer creates a message to be delivered via email.

Let's add a method called `welcome_email` to the `UserMailer`, that will send an
email to the user's registered email address:

```ruby
class UserMailer < ApplicationMailer
  default from: "notifications@example.com"

  def welcome_email
    @user = params[:user]
    @url  = "http://example.com/login"
    mail(to: @user.email_address, subject: "Welcome to My Awesome Site")
  end
end
```

NOTE: The method names in mailers do not have to end in `_email`.

Here is a quick explanation of the Mailer related methods used above:

* The [`default`][] method sets default values for all emails sent from _this_
  mailer. In this case, we use it to set the `:from` header value for all
  messages in this class. This can be overridden on a per-email basis.
* The [`mail`][] method creates the actual email message. We use it to specify
  the values of headers like `:to` and `:subject` per email.

There is also the [`headers`][] method (not used above), which is used to
specify email headers with a hash or by calling `headers[:field_name] = 'value'`.

It is possible to specify an action directly while using the generator like
this:

```bash
$ bin/rails generate mailer User welcome_email
```

The above will generate the `UserMailer` with an empty `welcome_email` method.

You can also send multiple emails from a single mailer class. It can be
convenient to group related emails together. For example, the above `UserMailer`
can have a `goodbye_email` (and corresponding view) in addition to the
`welcome_email`.

[`default`]:
    https://api.rubyonrails.org/classes/ActionMailer/Base.html#method-c-default
[`mail`]:
    https://api.rubyonrails.org/classes/ActionMailer/Base.html#method-i-mail
[`headers`]:
    https://api.rubyonrails.org/classes/ActionMailer/Base.html#method-i-headers

### Create a Mailer View

Next, for the `welcome_email` action, you'll need to create a matching view in a
file called `welcome_email.html.erb` in the `app/views/user_mailer/` directory.
Here is a sample HTML template that can be used for the welcome email:

```html+erb
<h1>Welcome to example.com, <%= @user.name %></h1>
<p>
  You have successfully signed up to example.com,
  your username is: <%= @user.login %>.<br>
</p>
<p>
  To log in to the site, just follow this link: <%= link_to 'login', login_url %>.
</p>
<p>Thanks for joining and have a great day!</p>
```

NOTE: The above is the content of the `<body>` tag. It will be embedded in the
default mailer layout, which contains the `<html>` tag. See [Mailer
layouts](#mailer-views-and-layouts) for more.

You can also create a text version of the above email and store it in
`welcome_email.text.erb` in the `app/views/user_mailer/` directory (notice the
`.text.erb` extension vs. the `html.erb`). Sending both formats is considered
best practice because, in case of HTML rendering issues, the text version can
serve as a reliable fallback. Here is a sample text email:

```erb
Welcome to example.com, <%= @user.name %>
===============================================

You have successfully signed up to example.com,
your username is: <%= @user.login %>.

To log in to the site, just follow this link: <%= @url %>.

Thanks for joining and have a great day!
```

Notice that in both HTML and text email templates you can use the instance
variables `@user` and `@url`.

Now, when you call the `mail` method, Action Mailer will detect the two
templates (text and HTML) and automatically generate a `multipart/alternative`
email.

### Call the Mailer

Once you have a mailer class and view set up, the next step is to actually call
the mailer method that renders the email view (i.e. sends the email). Mailers
can be thought of as another way of rendering views. Controller actions render a
view to be sent over the HTTP protocol. Mailer actions render a view and send it
through email protocols instead.

Let's see an example of using the `UserMailer` to send a welcome email when a
user is successfully created.

First, let's create a `User` scaffold:

```bash
$ bin/rails generate scaffold user name email_address login
$ bin/rails db:migrate
```

Next, we edit the `create` action in the `UserController` to send a welcome
email when a new user is created. We do this by inserting a call to
`UserMailer.with(user: @user).welcome_email` right after the user is
successfully saved.

NOTE: We use [`deliver_later`][] to enqueue the email to be sent later. This
way, the controller action will continue without waiting for the email sending
code to run. The `deliver_later` method is backed by [Active
Job](active_job_basics.html#action-mailer).

```ruby
class UsersController < ApplicationController
  # ...

  def create
    @user = User.new(user_params)

    respond_to do |format|
      if @user.save
        # Tell the UserMailer to send a welcome email after save
        UserMailer.with(user: @user).welcome_email.deliver_later

        format.html { redirect_to user_url(@user), notice: "User was successfully created." }
        format.json { render :show, status: :created, location: @user }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # ...
end
```

Any key-value pair passed to [`with`][] becomes the `params` for the Mailer
action. For example, `with(user: @user, account: @user.account)` makes
`params[:user]` and `params[:account]` available in the Mailer action.

With the above mailer, view, and controller set up, if you create a new `User`,
you can examine the logs to see the welcome email being sent. The log file will
show the text and HTML versions being sent, like this:

```bash
[ActiveJob] [ActionMailer::MailDeliveryJob] [ec4b3786-b9fc-4b5e-8153-9153095e1cbf] Delivered mail 6661f55087e34_1380c7eb86934d@Bhumis-MacBook-Pro.local.mail (19.9ms)
[ActiveJob] [ActionMailer::MailDeliveryJob] [ec4b3786-b9fc-4b5e-8153-9153095e1cbf] Date: Thu, 06 Jun 2024 12:43:44 -0500
From: notifications@example.com
To: test@gmail.com
Message-ID: <6661f55087e34_1380c7eb86934d@Bhumis-MacBook-Pro.local.mail>
Subject: Welcome to My Awesome Site
Mime-Version: 1.0
Content-Type: multipart/alternative;
 boundary="--==_mimepart_6661f55086194_1380c7eb869259";
 charset=UTF-8
Content-Transfer-Encoding: 7bit


----==_mimepart_6661f55086194_1380c7eb869259
Content-Type: text/plain;

...

----==_mimepart_6661f55086194_1380c7eb869259
Content-Type: text/html;

...
```

You can also call the mailer from the Rails console and send emails, perhaps
useful as a test before you have a controller action set up. The below will send
the same `welcome_email` as above:

```irb
irb> user = User.first
irb> UserMailer.with(user: user).welcome_email.deliver_later
```

If you want to send emails right away (from a cronjob for example) you can call
[`deliver_now`][]:

```ruby
class SendWeeklySummary
  def run
    User.find_each do |user|
      UserMailer.with(user: user).weekly_summary.deliver_now
    end
  end
end
```

A method like `weekly_summary` from `UserMailer` would return an
[`ActionMailer::MessageDelivery`][] object, which has the methods `deliver_now`
or `deliver_later` to send itself now or later. The
`ActionMailer::MessageDelivery` object is a wrapper around a
[`Mail::Message`][]. If you want to inspect, alter, or do anything else with the
`Mail::Message` object you can access it with the [`message`][] method on the
`ActionMailer::MessageDelivery` object.

Here is an example of the `MessageDelivery` object from the Rails console
example above:

```irb
irb> UserMailer.with(user: user).weekly_summary
#<ActionMailer::MailDeliveryJob:0x00007f84cb0367c0
 @_halted_callback_hook_called=nil,
 @_scheduled_at_time=nil,
 @arguments=
  ["UserMailer",
   "welcome_email",
   "deliver_now",
   {:params=>
     {:user=>
       #<User:0x00007f84c9327198
        id: 1,
        name: "Bhumi",
        email_address: "hi@gmail.com",
        login: "Bhumi",
        created_at: Thu, 06 Jun 2024 17:43:44.424064000 UTC +00:00,
        updated_at: Thu, 06 Jun 2024 17:43:44.424064000 UTC +00:00>},
    :args=>[]}],
 @exception_executions={},
 @executions=0,
 @job_id="07747748-59cc-4e88-812a-0d677040cd5a",
 @priority=nil,
```

[`ActionMailer::MessageDelivery`]:
    https://api.rubyonrails.org/classes/ActionMailer/MessageDelivery.html
[`deliver_later`]:
    https://api.rubyonrails.org/classes/ActionMailer/MessageDelivery.html#method-i-deliver_later
[`deliver_now`]:
    https://api.rubyonrails.org/classes/ActionMailer/MessageDelivery.html#method-i-deliver_now
[`Mail::Message`]: https://api.rubyonrails.org/classes/Mail/Message.html
[`message`]:
    https://api.rubyonrails.org/classes/ActionMailer/MessageDelivery.html#method-i-message
[`with`]:
    https://api.rubyonrails.org/classes/ActionMailer/Parameterized/ClassMethods.html#method-i-with

Multipart Emails and Attachments
--------------------------------

The `multipart` MIME type represents a document that's comprised of multiple component parts, each of which may have its own individual MIME type (such as the `text/html` and `text/plain`). The `multipart` type encapsulates sending multiple files together in one transaction such as attaching multiple files to an email for example.

### Adding Attachments

You can add an attachment with Action Mailer by passing the file name and
content to the [attachments
method](https://api.rubyonrails.org/classes/ActionMailer/Base.html#method-i-attachments).
Action Mailer will automatically guess the `mime_type`, set the `encoding`, and
create the attachment.

```ruby
attachments["filename.jpg"] = File.read("/path/to/filename.jpg")
```

When the `mail` method is triggered, it will send a multipart email with an
attachment, properly nested with the top level being `multipart/mixed` and the
first part being a `multipart/alternative` containing the plain text and HTML
email messages.

The other way to send attachments is to specify the file name, MIME-type and
encoding headers, and content. Action Mailer will use the settings you pass in.

```ruby
encoded_content = SpecialEncode(File.read("/path/to/filename.jpg"))
attachments["filename.jpg"] = {
  mime_type: "application/gzip",
  encoding: "SpecialEncoding",
  content: encoded_content
}
```

NOTE: Action Mailer will automatically Base64 encode an attachment. If you want
something different, you can encode your content and pass in the encoded content
as well as the encoding in a `Hash` to the `attachments` method. If you specify
an encoding, Action Mailer will not try to Base64 encode the attachment.

### Making Inline Attachments

Sometimes, you may want to send an attachment (e.g. image) inline, so it appears
within the email body.

In order to do this, first, you turn an attachment into an inline attachment by
calling `#inline`:

```ruby
def welcome
  attachments.inline["image.jpg"] = File.read("/path/to/image.jpg")
end
```

Then in the view, you can reference `attachments` as a hash and specify the file
you want to show inline. You can call `url` on the hash and pass the result into
the
[`image_tag`](https://api.rubyonrails.org/classes/ActionView/Helpers/AssetTagHelper.html#method-i-image_tag)
method:

```html+erb
<p>Hello there, this is the image you requested:</p>

<%= image_tag attachments['image.jpg'].url %>
```

Since this is a standard call to `image_tag` you can pass in an options hash
after the attachment URL as well:

```html+erb
<p>Hello there, this is our image</p>

<%= image_tag attachments['image.jpg'].url, alt: 'My Photo', class: 'photos' %>
```

### Multipart Emails

As demonstrated in [Create a Mailer View](#create-a-mailer-view), Action Mailer
will automatically send multipart emails if you have different templates for the
same action. For example, if you have a `UserMailer` with
`welcome_email.text.erb` and `welcome_email.html.erb` in
`app/views/user_mailer`, Action Mailer will automatically send a multipart email
with both the HTML and text versions included as separate parts.

The [Mail](https://github.com/mikel/mail) gem has helper methods for making a
`multipart/alternate` email for `text/plain` and `text/html` [MIME
types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
and you can manually create any other type of MIME email.

NOTE: The order of the parts getting inserted is determined by the
`:parts_order` inside of the `ActionMailer::Base.default` method.

Multipart is also used when you send attachments with email.

Mailer Views and Layouts
------------------------

Action Mailer uses view files to specify the content to be sent in emails.
Mailer views are located in the `app/views/name_of_mailer_class` directory by
default. Similar to a controller view, the name of the file matches the name of
the mailer method.

Mailer views are rendered within a layout, similar to controller views. Mailer
layouts are located in `app/views/layouts`. The default layout is
`mailer.html.erb` and `mailer.text.erb`. This section covers various features
around mailer views and layouts.

### Configuring Custom View Paths

It is possible to change the default mailer view for your action in various
ways, as shown below.

There are `template_path` and `template_name` options to the `mail` method:

```ruby
class UserMailer < ApplicationMailer
  default from: "notifications@example.com"

  def welcome_email
    @user = params[:user]
    @url  = "http://example.com/login"
    mail(to: @user.email_address,
         subject: "Welcome to My Awesome Site",
         template_path: "notifications",
         template_name: "hello")
  end
end
```

The above configures the `mail` method to look for a template with the name
`hello` in the `app/views/notifications` directory.  You can also specify an
array of paths for `template_path`, and they will be searched in order.

If you need more flexibility, you can also pass a block and render a specific
template. You can also render plain text inline without using a template file:

```ruby
class UserMailer < ApplicationMailer
  default from: "notifications@example.com"

  def welcome_email
    @user = params[:user]
    @url  = "http://example.com/login"
    mail(to: @user.email_address,
         subject: "Welcome to My Awesome Site") do |format|
      format.html { render "another_template" }
      format.text { render plain: "hello" }
    end
  end
end
```

This will render the template `another_template.html.erb` for the HTML part and
"hello" for the text part. The
[render](https://api.rubyonrails.org/classes/ActionController/Rendering.html#method-i-render)
method is the same one used inside of Action Controller, so you can use all the
same options, such as `:plain`, `:inline`, etc.

Lastly, if you need to render a template located outside of the default
`app/views/mailer_name/` directory, you can apply the [`prepend_view_path`][],
like so:

```ruby
class UserMailer < ApplicationMailer
  prepend_view_path "custom/path/to/mailer/view"

  # This will try to load "custom/path/to/mailer/view/welcome_email" template
  def welcome_email
    # ...
  end
end
```

There is also an [`append_view_path`][] method.

[`append_view_path`]:
    https://api.rubyonrails.org/classes/ActionView/ViewPaths/ClassMethods.html#method-i-append_view_path
[`prepend_view_path`]:
    https://api.rubyonrails.org/classes/ActionView/ViewPaths/ClassMethods.html#method-i-prepend_view_path

### Generating URLs in Action Mailer Views

In order to add URLs to your mailer, you need to set the `host` value to your
application's domain first. This is because, unlike controllers, the mailer
instance doesn't have any context about the incoming request.

You can configure the default `host` across the application in
`config/application.rb`:

```ruby
config.action_mailer.default_url_options = { host: "example.com" }
```

Once the `host` is configured, it is recommended that email views use the
`*_url` with the full URL, and not the `*_path` helpers with relative URL. Since
email clients do not have web request context, `*_path` helpers have no base URL
to form complete web addresses.

For example, instead of:

```html+erb
<%= link_to 'welcome', welcome_path %>
```

Use:

```html+erb
<%= link_to 'welcome', welcome_url %>
```

By using the full URL, your links will work correctly in your emails.

#### Generating URLs with `url_for`

The [`url_for`][] helper generates a full URL, by default, in templates.

If you haven't configured the `:host` option globally, you'll need to pass it to
`url_for`.

```erb
<%= url_for(host: 'example.com',
            controller: 'welcome',
            action: 'greeting') %>
```

[`url_for`]:
    https://api.rubyonrails.org/classes/ActionView/RoutingUrlFor.html#method-i-url_for

#### Generating URLs with Named Routes

Similar to other URLs, you need to use the `*_url` variant of named route
helpers in emails as well.

You either configure the `:host` option globally or make sure to pass it to the
URL helper:

```erb
<%= user_url(@user, host: 'example.com') %>
```

### Adding Images in Action Mailer Views

In order to use the `image_tag` helper in emails, you need to specify the
`:asset_host` parameter. This is because a mailer instance doesn't have any
context about the incoming request.

Usually the `:asset_host` is consistent across the application, so you can
configure it globally in `config/application.rb`:

```ruby
config.action_mailer.asset_host = "http://example.com"
```

NOTE: Because we can't infer the protocol from the request, you'll need to
specify a protocol such as `http://` or `https://` in the `:asset_host` config.

Now you can display an image inside your email.

```html+erb
<%= image_tag 'image.jpg' %>
```

### Caching Mailer View

You can perform fragment caching in mailer views, similar to application views,
using the [`cache`][] method.

```html+erb
<% cache do %>
  <%= @company.name %>
<% end %>
```

And to use this feature, you need to enable it in your application's
`config/environments/*.rb` file:

```ruby
config.action_mailer.perform_caching = true
```

Fragment caching is also supported in multipart emails. Read more about caching
in the [Rails caching guide](caching_with_rails.html).

[`cache`]:
    https://api.rubyonrails.org/classes/ActionView/Helpers/CacheHelper.html#method-i-cache

### Action Mailer Layouts

Just like controller layouts, you can also have mailer layouts. Mailer layouts
are located in `app/views/layouts`. Here is the default layout:

```html
# app/views/layouts/mailer.html.erb
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
      /* Email styles need to be inline */
    </style>
  </head>

  <body>
    <%= yield %>
  </body>
</html>
```

The above layout is in a file `mailer.html.erb`. The default layout name is
specified in the `ApplicationMailer`, as we saw earlier with the line `layout
"mailer"` in the [Generate Mailer](#generate-the-mailer) section. Similar to
controller layouts, you use `yield` to render the mailer view inside the layout.

To use a different layout for a given mailer, call [`layout`][]:

```ruby
class UserMailer < ApplicationMailer
  layout "awesome" # Use awesome.(html|text).erb as the layout
end
```

To use a specific layout for a given email, you can pass in a `layout:
'layout_name'` option to the render call inside the format block:

```ruby
class UserMailer < ApplicationMailer
  def welcome_email
    mail(to: params[:user].email_address) do |format|
      format.html { render layout: "my_layout" }
      format.text
    end
  end
end
```

The above will render the HTML part using the `my_layout.html.erb` file and the
text part with the usual `user_mailer.text.erb` file.

[`layout`]:
    https://api.rubyonrails.org/classes/ActionView/Layouts/ClassMethods.html#method-i-layout

Sending Email
-------------

### Sending Email to Multiple Recipients

It is possible to send an email to more than one recipient by setting the `:to`
field to a list of email addresses. The list of emails can be an array or a
single string with the addresses separated by commas.

For example, to inform all admins of a new registration:

```ruby
class AdminMailer < ApplicationMailer
  default to: -> { Admin.pluck(:email_address) },
          from: "notification@example.com"

  def new_registration(user)
    @user = user
    mail(subject: "New User Signup: #{@user.email_address}")
  end
end
```

The same format can be used to add multiple carbon copy (cc) and blind carbon
copy (bcc) recipients, by setting the `:cc` and `:bcc` keys respectively
(similarly to the `:to` field).

### Sending Email with Name

It's possible to show the name, in addition to the email address, of the person
who receives the email or sends the email.

To show the name of the person when they receive the email, you can use
[`email_address_with_name`][] method in `to:`:

```ruby
def welcome_email
  @user = params[:user]
  mail(
    to: email_address_with_name(@user.email_address, @user.name),
    subject: "Welcome to My Awesome Site"
  )
end
```

The same method in `from:` works to display the name of the sender:

```ruby
class UserMailer < ApplicationMailer
  default from: email_address_with_name("notification@example.com", "Example Company Notifications")
end
```

If the name is blank (`nil` or empty string), it returns the email address.

[`email_address_with_name`]:
    https://api.rubyonrails.org/classes/ActionMailer/Base.html#method-i-email_address_with_name

### Sending Email with Subject Translation

If you don't pass a subject to the mail method, Action Mailer will try to find
it in your translations. See the [Internationalization
Guide](i18n.html#translations-for-action-mailer-e-mail-subjects) for more.

### Sending Emails without Template Rendering

There may be cases in which you want to skip the template rendering step and
instead supply the email body as a string. You can achieve this using the
`:body` option. Remember to set the `:content_type` option, such as setting it
to `text/html` below. Rails will default to `text/plain` as the content type.

```ruby
class UserMailer < ApplicationMailer
  def welcome_email
    mail(to: params[:user].email_address,
         body: params[:email_body],
         content_type: "text/html",
         subject: "Already rendered!")
  end
end
```

### Sending Emails with Dynamic Delivery Options

If you wish to override the default delivery
[configuration](#action-mailer-configuration) (e.g. SMTP credentials) while
delivering emails, you can do this using `delivery_method_options` in the mailer
action.

```ruby
class UserMailer < ApplicationMailer
  def welcome_email
    @user = params[:user]
    @url  = user_url(@user)
    delivery_options = { user_name: params[:company].smtp_user,
                         password: params[:company].smtp_password,
                         address: params[:company].smtp_host }
    mail(to: @user.email_address,
         subject: "Please see the Terms and Conditions attached",
         delivery_method_options: delivery_options)
  end
end
```

Action Mailer Callbacks
-----------------------

Action Mailer allows for you to specify `*_action` callbacks to configure the message, and `*_deliver` callbacks to control the delivery.

Here is a list with all the available Action Mailer callbacks, listed **in the order in which they will get called** when sending an email:

* [`before_action`][]
* [`around_action`][]
* [`after_action`][]
* [`before_deliver`][]
* [`around_deliver`][]
* [`after_deliver`][]

Callbacks can be specified with a block or a symbol representing a method name in the mailer class, similar to other callbacks (in controllers or models).

Here are some examples of when you may use one of these callbacks with mailers.

### `before_action`

You can use a `before_action` to set instance variables, populate the mail
object with defaults, or insert default headers and attachments.

```ruby
class InvitationsMailer < ApplicationMailer
  before_action :set_inviter_and_invitee
  before_action { @account = params[:inviter].account }

  default to:       -> { @invitee.email_address },
          from:     -> { common_address(@inviter) },
          reply_to: -> { @inviter.email_address_with_name }

  def account_invitation
    mail subject: "#{@inviter.name} invited you to their Basecamp (#{@account.name})"
  end

  def project_invitation
    @project    = params[:project]
    @summarizer = ProjectInvitationSummarizer.new(@project.bucket)

    mail subject: "#{@inviter.name.familiar} added you to a project in Basecamp (#{@account.name})"
  end

  private
    def set_inviter_and_invitee
      @inviter = params[:inviter]
      @invitee = params[:invitee]
    end
end
```

### `after_action`

You can use an `after_action` callback with a similar setup as a `before_action`
but also have access to instance variables that were set in your mailer action.

You can also use an `after_action` to override delivery method settings by
updating `mail.delivery_method.settings`.

```ruby
class UserMailer < ApplicationMailer
  before_action { @business, @user = params[:business], params[:user] }

  after_action :set_delivery_options,
               :prevent_delivery_to_guests,
               :set_business_headers

  def feedback_message
  end

  def campaign_message
  end

  private
    def set_delivery_options
      # You have access to the mail instance,
      # @business and @user instance variables here
      if @business && @business.has_smtp_settings?
        mail.delivery_method.settings.merge!(@business.smtp_settings)
      end
    end

    def prevent_delivery_to_guests
      if @user && @user.guest?
        mail.perform_deliveries = false
      end
    end

    def set_business_headers
      if @business
        headers["X-SMTPAPI-CATEGORY"] = @business.code
      end
    end
end
```

### `after_deliver`

You could use an `after_deliver` to record the delivery of the message. It also
allows observer/interceptor-like behaviors, but with access to the full mailer
context.

```ruby
class UserMailer < ApplicationMailer
  after_deliver :mark_delivered
  before_deliver :sandbox_staging
  after_deliver :observe_delivery

  def feedback_message
    @feedback = params[:feedback]
  end

  private
    def mark_delivered
      params[:feedback].touch(:delivered_at)
    end

    # An Interceptor alternative.
    def sandbox_staging
      message.to = ["sandbox@example.com"] if Rails.env.staging?
    end

    # A callback has more context than the comparable Observer example.
    def observe_delivery
      EmailDelivery.log(message, self.class, action_name, params)
    end
end
```

Mailer callbacks abort further processing if `body` is set to a non-nil value.
`before_deliver` can abort with `throw :abort`.

[`after_action`]:
    https://api.rubyonrails.org/classes/AbstractController/Callbacks/ClassMethods.html#method-i-after_action
[`after_deliver`]:
    https://api.rubyonrails.org/classes/ActionMailer/Callbacks/ClassMethods.html#method-i-after_deliver
[`around_action`]:
    https://api.rubyonrails.org/classes/AbstractController/Callbacks/ClassMethods.html#method-i-around_action
[`around_deliver`]:
    https://api.rubyonrails.org/classes/ActionMailer/Callbacks/ClassMethods.html#method-i-around_deliver
[`before_action`]:
    https://api.rubyonrails.org/classes/AbstractController/Callbacks/ClassMethods.html#method-i-before_action
[`before_deliver`]:
    https://api.rubyonrails.org/classes/ActionMailer/Callbacks/ClassMethods.html#method-i-before_deliver

Action Mailer View Helpers
--------------------------

Action Mailer views have access to most of the same helpers as regular views.

There are also some Action Mailer-specific helper methods available in
[`ActionMailer::MailHelper`][]. For example, these allow accessing the mailer
instance from your view with [`mailer`][MailHelper#mailer], and accessing the
message as [`message`][MailHelper#message]:

```erb
<%= stylesheet_link_tag mailer.name.underscore %>
<h1><%= message.subject %></h1>
```

[`ActionMailer::MailHelper`]:
    https://api.rubyonrails.org/classes/ActionMailer/MailHelper.html
[MailHelper#mailer]:
    https://api.rubyonrails.org/classes/ActionMailer/MailHelper.html#method-i-mailer
[MailHelper#message]:
    https://api.rubyonrails.org/classes/ActionMailer/MailHelper.html#method-i-message

Action Mailer Configuration
---------------------------

This section shows some example configurations for Action Mailer.

For more details on the various configuration options, see the [Configuring
Rails Applications](configuring.html#configuring-action-mailer) guide. You can
specify configuration options in environment specific files such as
production.rb.

### Example Action Mailer Configuration

Here is an example using the `:sendmail` delivery method, added to a
`config/environments/$RAILS_ENV.rb` file:

```ruby
config.action_mailer.delivery_method = :sendmail
# Defaults to:
# config.action_mailer.sendmail_settings = {
#   location: '/usr/sbin/sendmail',
#   arguments: %w[ -i ]
# }
config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = true
config.action_mailer.default_options = { from: "no-reply@example.com" }
```

### Action Mailer Configuration for Gmail

Add this to your `config/environments/$RAILS_ENV.rb` file to send via Gmail:

```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  address:         "smtp.gmail.com",
  port:            587,
  domain:          "example.com",
  user_name:       Rails.app.credentials.dig(:smtp, :user_name),
  password:        Rails.app.credentials.dig(:smtp, :password),
  authentication:  "plain",
  enable_starttls: true,
  open_timeout:    5,
  read_timeout:    5 }
```

NOTE: Google [blocks
sign-ins](https://support.google.com/accounts/answer/6010255) from apps it deems
less secure. You can [change your Gmail settings](https://www.google.com/settings/security/lesssecureapps) to allow the
attempts. If your Gmail account has 2-factor authentication enabled, then you
will need to set an [app password](https://myaccount.google.com/apppasswords)
and use that instead of your regular password.

Previewing and Testing Mailers
------------------------------

You can find detailed instructions on how to test your mailers in the [testing
guide](testing.html#testing-mailers).

### Previewing Emails

You can preview rendered email templates visually by visiting a special Action
Mailer preview URL. To set up a preview for `UserMailer`, create a class named
`UserMailerPreview` in the `test/mailers/previews/` directory. To see the
preview of `welcome_email` from `UserMailer`, implement a method that has the
same name in `UserMailerPreview` and call `UserMailer.welcome_email`:

```ruby
class UserMailerPreview < ActionMailer::Preview
  def welcome_email
    UserMailer.with(user: User.first).welcome_email
  end
end
```

Now the preview will be available at
<http://localhost:3000/rails/mailers/user_mailer/welcome_email>.

If you change something in the mailer view at
`app/views/user_mailer/welcome_email.html.erb` or the mailer itself, the preview
will automatically be updated. A list of previews is also available in
<http://localhost:3000/rails/mailers>.

By default, these preview classes live in `test/mailers/previews`. This can be
configured using the `preview_paths` option. For example, if you want to add
`lib/mailer_previews` to it, you can configure it in `config/application.rb`:

```ruby
config.action_mailer.preview_paths << "#{Rails.root}/lib/mailer_previews"
```

### Rescuing Errors

Rescue blocks inside of a mailer method cannot rescue errors that occur outside
of rendering. For example, record deserialization errors in a background job, or
errors from a third-party mail delivery service.

To rescue errors that occur during any part of the mailing process, use
[rescue_from](https://api.rubyonrails.org/classes/ActiveSupport/Rescuable/ClassMethods.html#method-i-rescue_from):

```ruby
class NotifierMailer < ApplicationMailer
  rescue_from ActiveJob::DeserializationError do
    # ...
  end

  rescue_from "SomeThirdPartyService::ApiError" do
    # ...
  end

  def notify(recipient)
    mail(to: recipient, subject: "Notification")
  end
end
```

Intercepting and Observing Emails
---------------------------------

Action Mailer provides hooks into the Mail observer and interceptor methods.
These allow you to register classes that are called during the mail delivery
life cycle of every email sent.

### Intercepting Emails

Interceptors allow you to make modifications to emails before they are handed
off to the delivery agents. An interceptor class must implement the
`.delivering_email(message)` method which will be called before the email is
sent.

```ruby
class SandboxEmailInterceptor
  def self.delivering_email(message)
    message.to = ["sandbox@example.com"]
  end
end
```

The interceptor needs to be registered using the `interceptors` config option.
You can do this in an initializer file like
`config/initializers/mail_interceptors.rb`:

```ruby
Rails.application.configure do
  if Rails.env.staging?
    config.action_mailer.interceptors = %w[SandboxEmailInterceptor]
  end
end
```

NOTE: The example above uses a custom environment called "staging" for a
production-like server but for testing purposes. You can read [Creating Rails
Environments](configuring.html#creating-rails-environments) for more information
about custom Rails environments.

### Observing Emails

Observers give you access to the email message _after_ it has been sent. An
observer class must implement the `:delivered_email(message)` method, which will
be called after the email is sent.

```ruby
class EmailDeliveryObserver
  def self.delivered_email(message)
    EmailDelivery.log(message)
  end
end
```

Similar to interceptors, you must register observers using the `observers`
config option. You can do this in an initializer file like
`config/initializers/mail_observers.rb`:

```ruby
Rails.application.configure do
  config.action_mailer.observers = %w[EmailDeliveryObserver]
end
```
