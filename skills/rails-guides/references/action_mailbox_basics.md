**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON <https://guides.rubyonrails.org>.**

Action Mailbox Basics
=====================

This guide provides you with all you need to get started in receiving emails to
your application.

After reading this guide, you will know:

* How to receive email within a Rails application.
* How to configure Action Mailbox.
* How to generate and route emails to a mailbox.
* How to test incoming emails.

--------------------------------------------------------------------------------

What is Action Mailbox?
-----------------------

Action Mailbox routes incoming emails to controller-like mailboxes for
processing in your Rails application. Action Mailbox is for receiving email,
while [Action Mailer](action_mailer_basics.html) is for *sending* them.

The inbound emails are routed asynchronously using [Active
Job](active_job_basics.html) to one or several dedicated mailboxes. These emails
are turned into
[`InboundEmail`](https://api.rubyonrails.org/classes/ActionMailbox/InboundEmail.html)
records using [Active Record](active_record_basics.html), which are capable of
interacting directly with the rest of your domain model.

`InboundEmail` records also provide lifecycle tracking, storage of the original
email via [Active Storage](active_storage_overview.html), and responsible data
handling with on-by-default [incineration](#incineration-of-inboundemails).

Action Mailbox ships with ingresses which enable your application to receive
emails from external email providers such as Mailgun, Mandrill, Postmark, and
SendGrid. You can also handle inbound emails directly via the built-in Exim,
Postfix, and Qmail ingresses.

## Setup

Action Mailbox has a few moving parts. First, you'll run the installer. Next,
you'll choose and configure an ingress for handling incoming email. You're then
ready to add Action Mailbox routing, create mailboxes, and start processing
incoming emails.

To start, let's install Action Mailbox:

```bash
$ bin/rails action_mailbox:install
```

This will create an `application_mailbox.rb` file and copy over migrations.

```bash
$ bin/rails db:migrate
```

This will run the Action Mailbox and Active Storage migrations.

The Action Mailbox table `action_mailbox_inbound_emails` stores incoming
messages and their processing status.

At this point, you can start your Rails server and check out
`http://localhost:3000/rails/conductor/action_mailbox/inbound_emails`. See
[Local Development and Testing](#local-development-and-testing) for more.

The next step is to configure an ingress in your Rails application to specify
how incoming emails should be received.

## Ingress Configuration

Configuring ingress involves setting up credentials and endpoint information for
the chosen email service. Here are the steps for each of the supported
ingresses.

### Exim

Tell Action Mailbox to accept emails from an SMTP relay:

```ruby
# config/environments/production.rb
config.action_mailbox.ingress = :relay
```

Generate a strong password that Action Mailbox can use to authenticate requests
to the relay ingress.

Use `bin/rails credentials:edit` to add the password to your application's
encrypted credentials under `action_mailbox.ingress_password`, where Action
Mailbox will automatically find it:

```yaml
action_mailbox:
  ingress_password: ...
```

Alternatively, provide the password in the `RAILS_INBOUND_EMAIL_PASSWORD`
environment variable.

Configure Exim to pipe inbound emails to `bin/rails
action_mailbox:ingress:exim`, providing the `URL` of the relay ingress and the
`INGRESS_PASSWORD` you previously generated. If your application lived at
`https://example.com`, the full command would look like this:

```bash
$ bin/rails action_mailbox:ingress:exim URL=https://example.com/rails/action_mailbox/relay/inbound_emails INGRESS_PASSWORD=...
```

### Mailgun

Give Action Mailbox your Mailgun Signing key (which you can find under Settings
-> Security & Users -> API security in Mailgun), so it can authenticate requests
to the Mailgun ingress.

Use `bin/rails credentials:edit` to add your Signing key to your application's
encrypted credentials under `action_mailbox.mailgun_signing_key`, where Action
Mailbox will automatically find it:

```yaml
action_mailbox:
  mailgun_signing_key: ...
```

Alternatively, provide your Signing key in the `MAILGUN_INGRESS_SIGNING_KEY`
environment variable.

Tell Action Mailbox to accept emails from Mailgun:

```ruby
# config/environments/production.rb
config.action_mailbox.ingress = :mailgun
```

[Configure
Mailgun](https://documentation.mailgun.com/docs/mailgun/user-manual/receive-forward-store/)
to forward inbound emails to
`/rails/action_mailbox/mailgun/inbound_emails/mime`. If your application lived
at `https://example.com`, you would specify the fully-qualified URL
`https://example.com/rails/action_mailbox/mailgun/inbound_emails/mime`.

### Mandrill

Give Action Mailbox your Mandrill API key, so it can authenticate requests to
the Mandrill ingress.

Use `bin/rails credentials:edit` to add your API key to your application's
encrypted credentials under `action_mailbox.mandrill_api_key`, where Action
Mailbox will automatically find it:

```yaml
action_mailbox:
  mandrill_api_key: ...
```

Alternatively, provide your API key in the `MANDRILL_INGRESS_API_KEY`
environment variable.

Tell Action Mailbox to accept emails from Mandrill:

```ruby
# config/environments/production.rb
config.action_mailbox.ingress = :mandrill
```

[Configure
Mandrill](https://mailchimp.com/developer/transactional/guides/set-up-inbound-email-processing/)
to route inbound emails to `/rails/action_mailbox/mandrill/inbound_emails`. If
your application lived at `https://example.com`, you would specify the
fully-qualified URL
`https://example.com/rails/action_mailbox/mandrill/inbound_emails`.

### Postfix

Tell Action Mailbox to accept emails from an SMTP relay:

```ruby
# config/environments/production.rb
config.action_mailbox.ingress = :relay
```

Generate a strong password that Action Mailbox can use to authenticate requests
to the relay ingress.

Use `bin/rails credentials:edit` to add the password to your application's
encrypted credentials under `action_mailbox.ingress_password`, where Action
Mailbox will automatically find it:

```yaml
action_mailbox:
  ingress_password: ...
```

Alternatively, provide the password in the `RAILS_INBOUND_EMAIL_PASSWORD`
environment variable.

[Configure
Postfix](https://serverfault.com/questions/258469/how-to-configure-postfix-to-pipe-all-incoming-email-to-a-script)
to pipe inbound emails to `bin/rails action_mailbox:ingress:postfix`, providing
the `URL` of the Postfix ingress and the `INGRESS_PASSWORD` you previously
generated. If your application lived at `https://example.com`, the full command
would look like this:

```bash
$ bin/rails action_mailbox:ingress:postfix URL=https://example.com/rails/action_mailbox/relay/inbound_emails INGRESS_PASSWORD=...
```

### Postmark

Tell Action Mailbox to accept emails from Postmark:

```ruby
# config/environments/production.rb
config.action_mailbox.ingress = :postmark
```

Generate a strong password that Action Mailbox can use to authenticate requests
to the Postmark ingress.

Use `bin/rails credentials:edit` to add the password to your application's
encrypted credentials under `action_mailbox.ingress_password`, where Action
Mailbox will automatically find it:

```yaml
action_mailbox:
  ingress_password: ...
```

Alternatively, provide the password in the `RAILS_INBOUND_EMAIL_PASSWORD`
environment variable.

[Configure Postmark inbound
webhook](https://postmarkapp.com/manual#configure-your-inbound-webhook-url) to
forward inbound emails to `/rails/action_mailbox/postmark/inbound_emails` with
the username `actionmailbox` and the password you previously generated. If your
application lived at `https://example.com`, you would configure Postmark with
the following fully-qualified URL:

```
https://actionmailbox:PASSWORD@example.com/rails/action_mailbox/postmark/inbound_emails
```

NOTE: When configuring your Postmark inbound webhook, be sure to check the box
labeled **"Include raw email content in JSON payload"**. Action Mailbox needs
the raw email content to work.

### Qmail

Tell Action Mailbox to accept emails from an SMTP relay:

```ruby
# config/environments/production.rb
config.action_mailbox.ingress = :relay
```

Generate a strong password that Action Mailbox can use to authenticate requests
to the relay ingress.

Use `bin/rails credentials:edit` to add the password to your application's
encrypted credentials under `action_mailbox.ingress_password`, where Action
Mailbox will automatically find it:

```yaml
action_mailbox:
  ingress_password: ...
```

Alternatively, provide the password in the `RAILS_INBOUND_EMAIL_PASSWORD`
environment variable.

Configure Qmail to pipe inbound emails to `bin/rails
action_mailbox:ingress:qmail`, providing the `URL` of the relay ingress and the
`INGRESS_PASSWORD` you previously generated. If your application lived at
`https://example.com`, the full command would look like this:

```bash
$ bin/rails action_mailbox:ingress:qmail URL=https://example.com/rails/action_mailbox/relay/inbound_emails INGRESS_PASSWORD=...
```

### SendGrid

Tell Action Mailbox to accept emails from SendGrid:

```ruby
# config/environments/production.rb
config.action_mailbox.ingress = :sendgrid
```

Generate a strong password that Action Mailbox can use to authenticate requests
to the SendGrid ingress.

Use `bin/rails credentials:edit` to add the password to your application's
encrypted credentials under `action_mailbox.ingress_password`, where Action
Mailbox will automatically find it:

```yaml
action_mailbox:
  ingress_password: ...
```

Alternatively, provide the password in the `RAILS_INBOUND_EMAIL_PASSWORD`
environment variable.

[Configure SendGrid Inbound
Parse](https://sendgrid.com/docs/for-developers/parsing-email/setting-up-the-inbound-parse-webhook/)
to forward inbound emails to `/rails/action_mailbox/sendgrid/inbound_emails`
with the username `actionmailbox` and the password you previously generated. If
your application lived at `https://example.com`, you would configure SendGrid
with the following URL:

```
https://actionmailbox:PASSWORD@example.com/rails/action_mailbox/sendgrid/inbound_emails
```

NOTE: When configuring your SendGrid Inbound Parse webhook, be sure to check the
box labeled **“Post the raw, full MIME message.”** Action Mailbox needs the raw
MIME message to work.

## Processing Incoming Email

Processing incoming emails usually entails using the email content to create
models, update views, queue background work, etc. in your Rails application.

Before you can start processing incoming emails, you'll need to setup Action
Mailbox routing and create mailboxes.

### Configure Routing

After an incoming email is received via the configured ingress, it needs to be
forwarded to a mailbox for actual processing by your application. Much like the
[Rails router](routing.html) that dispatches URLs to controllers, routing in
Action Mailbox defines which emails go to which mailboxes for processing. Routes
are added to the `application_mailbox.rb` file using regular expressions:

```ruby
# app/mailboxes/application_mailbox.rb
class ApplicationMailbox < ActionMailbox::Base
  routing(/^save@/i     => :forwards)
  routing(/@replies\./i => :replies)
end
```

The regular expression matches the incoming email's `to`, `cc`, or `bcc` fields.
For example, the above will match any email sent to `save@` to a "forwards"
mailbox. There are other ways to route an email, see
[`ActionMailbox::Base`](https://api.rubyonrails.org/classes/ActionMailbox/Base.html)
for more.

We need to create that "forwards" mailbox next.

### Create a Mailbox

```bash
# Generate new mailbox
$ bin/rails generate mailbox forwards
```

This creates `app/mailboxes/forwards_mailbox.rb`, with a `ForwardsMailbox` class
and a `process` method.

### Process Email

When processing an `InboundEmail`, you can get the parsed version of the email
as a [`Mail`](https://github.com/mikel/mail) object with `InboundEmail#mail`.
You can also get the raw source directly using the `#source` method. With the
`Mail` object, you can access the relevant fields, such as `mail.to`,
`mail.body.decoded`, etc.

```irb
irb> mail
=> #<Mail::Message:33780, Multipart: false, Headers: <Date: Wed, 31 Jan 2024 22:18:40 -0600>, <From: someone@hey.com>, <To: save@example.com>, <Message-ID: <65bb1ba066830_50303a70397e@Bhumis-MacBook-Pro.local.mail>>, <In-Reply-To: >, <Subject: Hello Action Mailbox>, <Mime-Version: 1.0>, <Content-Type: text/plain; charset=UTF-8>, <Content-Transfer-Encoding: 7bit>, <x-original-to: >>
irb> mail.to
=> ["save@example.com"]
irb> mail.from
=> ["someone@hey.com"]
irb> mail.date
=> Wed, 31 Jan 2024 22:18:40 -0600
irb> mail.subject
=> "Hello Action Mailbox"
irb> mail.body.decoded
=> "This is the body of the email message."
# mail.decoded, a shorthand for mail.body.decoded, also works
irb> mail.decoded
=> "This is the body of the email message."
irb> mail.body
=> <Mail::Body:0x00007fc74cbf46c0 @boundary=nil, @preamble=nil, @epilogue=nil, @charset="US-ASCII", @part_sort_order=["text/plain", "text/enriched", "text/html", "multipart/alternative"], @parts=[], @raw_source="This is the body of the email message.", @ascii_only=true, @encoding="7bit">
```

### Inbound Email Status

While the email is being routed to a matching mailbox and processed, Action
Mailbox updates the email status stored in `action_mailbox_inbound_emails` table
with one of the following values:

- `pending`: Received by one of the ingress controllers and scheduled for
  routing.
- `processing`: During active processing, while a specific mailbox is running
  its `process` method.
- `delivered`: Successfully processed by the specific mailbox.
- `failed`: An exception was raised during the specific mailbox’s execution of
  the `process` method.
- `bounced`: Rejected processing by the specific mailbox and bounced to sender.

If the email is marked either `delivered`, `failed`, or `bounced` it's
considered "processed" and marked for
[incineration](#incineration-of-inboundemails).

## Example

Here is an example of an Action Mailbox that processes emails to create
"forwards" for the user's project.

The `before_processing` callback is used to ensure that certain conditions are
met before `process` method is called. In this case, `before_processing` checks
that the user has at least one project. Other supported [Action Mailbox
callbacks](https://api.rubyonrails.org/classes/ActionMailbox/Callbacks.html) are
`after_processing` and `around_processing`.

The email can be bounced using `bounced_with` if the "forwarder" has no
projects. The "forwarder" is a `User` with the same email as `mail.from`.

If the "forwarder" does have at least one project, the `record_forward` method
creates an Active Record model in the application using the email data
`mail.subject` and `mail.decoded`. Otherwise, it sends an email, using Action
Mailer, requesting the "forwarder" to choose a project.

```ruby
# app/mailboxes/forwards_mailbox.rb
class ForwardsMailbox < ApplicationMailbox
  # Callbacks specify prerequisites to processing
  before_processing :require_projects

  def process
    # Record the forward on the one project, or…
    if forwarder.projects.one?
      record_forward
    else
      # …involve a second Action Mailer to ask which project to forward into.
      request_forwarding_project
    end
  end

  private
    def require_projects
      if forwarder.projects.none?
        # Use Action Mailers to bounce incoming emails back to sender – this halts processing
        bounce_with Forwards::BounceMailer.no_projects(inbound_email, forwarder: forwarder)
      end
    end

    def record_forward
      forwarder.forwards.create subject: mail.subject, content: mail.decoded
    end

    def request_forwarding_project
      Forwards::RoutingMailer.choose_project(inbound_email, forwarder: forwarder).deliver_now
    end

    def forwarder
      @forwarder ||= User.find_by(email_address: mail.from)
    end
end
```

## Local Development and Testing

It's helpful to be able to test incoming emails in development without actually
sending and receiving real emails. To accomplish this, there's a conductor
controller mounted at `/rails/conductor/action_mailbox/inbound_emails`, which
gives you an index of all the InboundEmails in the system, their state of
processing, and a form to create a new InboundEmail as well.

Here is and example of testing an inbound email with Action Mailbox TestHelpers.

```ruby
class ForwardsMailboxTest < ActionMailbox::TestCase
  test "directly recording a client forward for a forwarder and forwardee corresponding to one project" do
    assert_difference -> { people(:david).buckets.first.recordings.count } do
      receive_inbound_email_from_mail \
        to: "save@example.com",
        from: people(:david).email_address,
        subject: "Fwd: Status update?",
        body: <<~BODY
          --- Begin forwarded message ---
          From: Frank Holland <frank@microsoft.com>

          What's the status?
        BODY
    end

    recording = people(:david).buckets.first.recordings.last
    assert_equal people(:david), recording.creator
    assert_equal "Status update?", recording.forward.subject
    assert_match "What's the status?", recording.forward.content.to_s
  end
end
```

Please refer to the [ActionMailbox::TestHelper
API](https://api.rubyonrails.org/classes/ActionMailbox/TestHelper.html) for
further test helper methods.

## Incineration of InboundEmails

By default, an `InboundEmail` that has been processed will be incinerated after
30 days. The `InboundEmail` is considered as processed when its status changes
to `delivered`, `failed`, or `bounced`.

The actual incineration is done via the
[`IncinerationJob`](https://api.rubyonrails.org/classes/ActionMailbox/IncinerationJob.html)
that's scheduled to run after
[`config.action_mailbox.incinerate_after`](configuring.html#config-action-mailbox-incinerate-after)
time. This value is set to `30.days` by default, but you can change it in your
production.rb configuration. (Note that this far-future incineration scheduling
relies on your job queue being able to hold jobs for that long.)

Default data incineration ensures that you're not holding on to people's data
unnecessarily after they may have canceled their accounts or deleted their
content.

The intention with Action Mailbox processing is that as you process an email,
you should extract all the data you need from the email and persist it into
domain models in your application. The `InboundEmail` stays in the system for
the configured time to allow for debugging and forensics and then will be
deleted.
