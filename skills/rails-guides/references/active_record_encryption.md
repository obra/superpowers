**DO NOT READ THIS FILE ON GITHUB, GUIDES ARE PUBLISHED ON
<https://guides.rubyonrails.org>.**

Active Record Encryption
========================

This guide covers how to encrypt data in your database using Active Record.

After reading this guide, you will know:

* How to set up database encryption with Active Record.
* How to migrate unencrypted data.
* How to make different encryption schemes coexist.
* More about advanced concepts like Encryption Contexts and Key Providers.

--------------------------------------------------------------------------------

Active Record Encryption exists to protect sensitive information in your
application, such as personally identifiable information (PII) about your users.
Active Record supports application-level encryption by allowing you to declare
which attributes should be encrypted. It enables transparent encryption and
decryption of attributes when saving and retrieving data.

## Why Encrypt Data at the Application Level?

Encrypting specific attributes at the application level adds an additional
security layer. For example, if someone gains access to your application logs or
database backup, the encrypted data remains unreadable. It also helps avoid
accidental exposure of sensitive information in your application console or
logs.

Most importantly, this feature lets you explicitly define what data is sensitive
in your code. This enables precise access control throughout your application
and any connected services. For example, you can use tools like
[console1984](https://github.com/basecamp/console1984) to restrict decrypted
data access in the Rails console. You can also take advantage of automatic
[parameter filtering](#filtering-params-named-as-encrypted-attributes) for
encrypted fields.

## Setup

To start using Active Record Encryption, you need to generate keys and declare
attributes you want to encrypt in the model.

### Generate Encryption Key

You can generate a random key set by running `bin/rails db:encryption:init`:

```bash
$ bin/rails db:encryption:init
Add this entry to the credentials of the target environment:

active_record_encryption:
  primary_key: YehXdfzxVKpoLvKseJMJIEGs2JxerkB8
  deterministic_key: uhtk2DYS80OweAPnMLtrV2FhYIXaceAy
  key_derivation_salt: g7Q66StqUQDQk9SJ81sWbYZXgiRogBwS
```

These values can be stored by copying and pasting the generated values into your
existing [Rails credentials](/security.html#custom-credentials) file using
`bin/rails credentials:edit`.

Alternatively, the encryption keys can also be configured from other sources,
such as environment variables:

```ruby
# config/application.rb
config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"]
config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"]
config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"]
```

WARNING: It's recommended to use Rails built-in credentials support to store
keys. If you set them manually via configuration properties, make sure you don't
commit them with your code (e.g. use environment variables).

NOTE: The generated values are 32 bytes in length. If you generate these
yourself, the recommended minimum length is 12 bytes for the primary key and 20
bytes for the [salt](https://en.wikipedia.org/wiki/Salt_(cryptography)).

Once the keys are generated and stored, you can start using Active Record
Encryption by declaring attributes to be encrypted in the model.

### Declare Encrypted Attributes

The [`encrypts`
method](https://api.rubyonrails.org/classes/ActiveRecord/Encryption/EncryptableRecord.html#method-i-encrypts)
defines the attributes to be encrypted at the model level. These are regular
Active Record attributes backed by a column with the same name.

```ruby
class Article < ApplicationRecord
  encrypts :title
end
```

Active Record Encryption will transparently encrypt these attributes before
saving them to the database and will decrypt them upon retrieval. For example:

```ruby
article = Article.create(title: "Encrypt it all!")
article.title # => "Encrypt it all!"
```

However, in the Rails console, the executed SQL looks like this:

```sql
INSERT INTO "articles" ("title", "created_at", "updated_at")
VALUES ('{"p":"oq+RFYW8CucALxnJ6ccx","h":{"iv":"3nrJAIYcN1+YcGMQ","at":"JBsw7uB90yAyWbQ8E3krjg=="}}', ...) RETURNING "id"
```

The value inserted is a JSON object that contains the encrypted value for the
`title` attribute. More specifically, the JSON object stores two keys: `p` for
payload and `h` for headers. The ciphertext, which is compressed and encoded in
Base64, is stored as the payload. The `h` key stores metadata needed to decrypt
the value. The `iv` value is the initialization vector and `at` is
authentication tag (used to ensure the ciphertext has not been tampered with).

When looking at the `Article` in the Rails console, the encrypted attribute
`title` will also be filtered:

```irb
my-app(dev)> Article.first
  Article Load (0.1ms)  SELECT "articles".* FROM "articles" ORDER BY "articles"."id" ASC LIMIT ?  [["LIMIT", 1]]
=> #<Article:0x00007f83fd9533b8
    id: 1,
    title: "[FILTERED]",
    created_at: Fri, 12 Sep 2025 16:57:45.753372000 UTC +00:00,
    updated_at: Fri, 12 Sep 2025 16:57:45.753372000 UTC +00:00>
```

### Important: Storage Considerations

Encrypted data takes more storage because Active Record Encryption stores
additional metadata alongside the encrypted payload, and the payload itself is
Base64-encoded so it can fit safely in text-based columns.

When using the built-in envelope encryption key provider, you can estimate the
worst-case overhead to be around 255 bytes. This overhead is negligible for
larger sizes. Encryption also uses compression by default, which can offer up to
30% storage savings over the unencrypted version for larger payloads.

When using `string` columns, it’s important to know that modern databases define
the column size in terms of *number of characters*, not bytes. With encodings
like UTF-8, a single character can take up to four bytes. This means that a
column defined to hold N characters may actually consume up to 4 × N bytes in
storage.

Since an encrypted payload is binary data serialized with Base64, it can be
stored in regular a `string` column. Because it's a sequence of ASCII bytes, an
encrypted column can take up to four times its clear version size. So, even if
the bytes stored in the database are the same, the column must be four times
bigger.

In practice, this means:

* When encrypting short texts written in Western alphabets (mostly ASCII
  characters), you should account for that 255 additional overhead when defining
  the column size.
* When encrypting short texts written in non-Western alphabets, such as
  Cyrillic, you should multiply the column size by 4. Notice that the storage
  overhead is 255 bytes at most.
* When encrypting long texts, you can ignore column size concerns.

For example:

| Content to encrypt                                | Original column size | Recommended encrypted column size | Storage overhead (worst case) |
| ------------------------------------------------- | -------------------- | --------------------------------- | ----------------------------- |
| Email addresses                                   | string(255)          | string(510)                       | 255 bytes                     |
| Short sequence of emojis                          | string(255)          | string(1020)                      | 255 bytes                     |
| Summary of texts written in non-western alphabets | string(500)          | string(2000)                      | 255 bytes                     |
| Arbitrary long text                               | text                 | text                              | negligible                    |

## Basic Usage

### Querying Encrypted Data: Deterministic vs. Non-deterministic Encryption

By default, Active Record Encryption is non-deterministic, which means that
encrypting the same value with the same key twice will result in *different*
encrypted values (aka ciphertexts). The non-deterministic approach improves
security by making crypto-analysis of ciphertexts harder. However, it also means
that queries (such as `WHERE title = "Encrypt it all!"`) on encrypted values are
not possible, since the same plaintext value can result in a different encrypted
value that does not match the encrypted value previously stored in the JSON
document.

You can use deterministic encryption if you need to query using encrypted
values. For example, the `email` field on the `Author` model below:

```ruby
class Author < ApplicationRecord
  encrypts :email, deterministic: true
end

# You can only query by email if using deterministic encryption.
Author.find_by_email("tolkien@email.com")
```

The `:deterministic` option generates initialization vectors in a deterministic
way, meaning it will produce the same encrypted output given the same plaintext
input value. This makes querying encrypted attributes possible by string
equality comparison. For example, notice that the `p` and `iv` key in the JSON
document have the same value when we create and when we query an Author's email:

```irb
my-app(dev)> author = Author.create(name: "J.R.R. Tolkien", email: "tolkien@email.com")
  TRANSACTION (0.1ms)  begin transaction
  Author Create (0.4ms)  INSERT INTO "authors" ("name", "email", "created_at", "updated_at") VALUES (?, ?, ?, ?) RETURNING "id"  [["name", "J.R.R. Tolkien"], ["email", "{\"p\":\"8BAc8dGXqxksThLNmKmbWG8=\",\"h\":{\"iv\":\"NgqthINGlvoN+fhP\",\"at\":\"1uVTEDmQmPfpi1ULT9Nznw==\"}}"], ["created_at", "2025-09-19 18:08:40.104634"], ["updated_at", "2025-09-19 18:08:40.104634"]]
  TRANSACTION (0.1ms)  commit transaction

my-app(dev)> Author.find_by_email("tolkien@email.com")
  Author Load (0.1ms)  SELECT "authors".* FROM "authors" WHERE "authors"."email" = ? LIMIT ?  [["email", "{\"p\":\"8BAc8dGXqxksThLNmKmbWG8=\",\"h\":{\"iv\":\"NgqthINGlvoN+fhP\",\"at\":\"1uVTEDmQmPfpi1ULT9Nznw==\"}}"], ["LIMIT", 1]]
=> #<Author:0x00007f8a396289d0
    id: 3,
    name: "J.R.R. Tolkien",
    email: "[FILTERED]",
    created_at: Fri, 19 Sep 2025 18:08:40.104634000 UTC +00:00,
    updated_at: Fri, 19 Sep 2025 18:08:40.104634000 UTC +00:00>
```

In the above example, the initialization vector, `iv`, has the value
`"NgqthINGlvoN+fhP"` for the same string. Even if you use the same email string
in a different model instance (or different attribute with deterministic
encryption), it will map to the same `p` and `iv` values:

```irb
my-app(dev)> author2 = Author.create(name: "Different Author", email: "tolkien@email.com")
  TRANSACTION (0.1ms)  begin transaction
  Author Create (0.4ms)  INSERT INTO "authors" ("name", "email", "created_at", "updated_at") VALUES (?, ?, ?, ?) RETURNING "id"  [["name", "Different Author"], ["email", "{\"p\":\"8BAc8dGXqxksThLNmKmbWG8=\",\"h\":{\"iv\":\"NgqthINGlvoN+fhP\",\"at\":\"1uVTEDmQmPfpi1ULT9Nznw==\"}}"], ["created_at", "2025-09-19 18:20:11.291969"], ["updated_at", "2025-09-19 18:20:11.291969"]]
  TRANSACTION (0.1ms)  commit transaction
```

The `:deterministic` option allows for querying by trading off lesser security.
The data is still encrypted but the determinism makes crypto-analysis easier.
For this reason, non-deterministic encryption is recommended for all data unless
you need to query by the encrypted attribute.

NOTE: In non-deterministic mode, Active Record uses
[AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)-[GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
with a 256-bits key and a random initialization vector. In deterministic mode,
it also uses AES-GCM, but the initialization vector is not random. It is
generated as a function of the key and the plaintext content
([HMAC](https://en.wikipedia.org/wiki/HMAC)-SHA-256 digest of the two).

NOTE: If you do not define a `deterministic_key`, then you have effectively
disabled deterministic encryption.

### Ignoring Case

You might want to ignore the case when querying deterministically encrypted
data. There are two options for achieving this - `:downcase` and `:ignore_case`.

When you use the `:downcase` option when declaring the encrypted attribute, it
converts the data to downcase before encryption occurs. This allows to
effectively ignore case when querying data.

```ruby
class Person
  encrypts :email_address, deterministic: true, downcase: true
end
```

When using `:downcase`, the original case is lost.

You can use the `:ignore_case` option when you want to preserve the original
case for displaying but ignore the case when querying data:

```ruby
class Label
  encrypts :name, deterministic: true, ignore_case: true # the encrypted content with the original case will be stored in the column `original_name`
end
```

With the `:ignore_case` option, you need to add a new column named
`original_<column_name>` to store the encrypted content with the case unchanged.
When reading the `name` attribute, Rails will serve the version with the
original case. When querying `name`, it will ignore case.

### Serialized Attributes

By default, Active Record Encryption will serialize values using the underlying
type before encrypting them as long as the value is serializable as Strings. If
the underlying type is not serializable as a String, you can use a custom
[`message_serializer`](https://edgeapi.rubyonrails.org/classes/ActiveRecord/Encryption/MessageSerializer.html):

```ruby
class Article < ApplicationRecord
  encrypts :metadata, message_serializer: SomeCustomMessageSerializer.new
end
```

Attributes with structured types using the
[`serialized`](https://api.rubyonrails.org/v8.0.2/classes/ActiveRecord/AttributeMethods/Serialization/ClassMethods.html#method-i-serialize)
method can be encrypted as well. The `serialized` method is used when you have
an attribute that needs to be saved to the database as a serialized object
(using `YAML`, `JSON` or such), and retrieved by deserializing into the same
object.

WARNING: When using serialized attributes for custom types, the declaration of
the serialized attribute should go **before** the encryption declaration:

```ruby
# CORRECT
class Article < ApplicationRecord
  serialize :title, type: Title
  encrypts :title
end

# INCORRECT
class Article < ApplicationRecord
  encrypts :title
  serialize :title, type: Title
end
```

### Ensuring Uniqueness with Encrypted Data

Checking for uniqueness is only supported with deterministically encrypted data.

#### Unique Validations

If an attribute is deterministically encrypted, a uniqueness validation can be
specified normally, along with encryption:

```ruby
class Person
  validates :email_address, uniqueness: true
  encrypts :email_address, deterministic: true, downcase: true
end
```

If you want to ignore the case for uniqueness, make sure to use the `:downcase`
or `:ignore_case` option in the `encrypts` declaration. Using the
`:case_sensitive` option in the validation won't work.

NOTE: If you have a mix of unencrypted and encrypted data or if you have data
that is encrypted using two different sets of keys/schemes, you'll need to
enable [extended
queries](configuring.html#config-active-record-encryption-extend-queries) with
`config.active_record.encryption.extend_queries = true` in order to support
unique validations.

#### Unique Indexes

In order to support unique indexes on deterministically encrypted attributes,
it’s important to ensure that a given plaintext always produces the same
ciphertext. This consistency is what makes indexing and querying possible.

```ruby
class Person
  encrypts :email_address, deterministic: true
end
```

In order for unique indexes to work, you will have to ensure that the encryption
properties for the underlying attributes don't change.

### Filtering Params Named as Encrypted Attributes

Encrypted attributes are configured to be automatically
[filtered](configuring.html#config-filter-parameters) out of the Rails logs. So
sensitive information, like encrypted emails or credit card numbers, isn't
stored in your logs. For example, if you are filtering the `email` field, you
will see something like this in the logs: `Parameters: {"email"=>"[FILTERED]",
...}`.

In case you need to disable filtering of encrypted parameters, you can use the
following configuration:

```ruby
# config/application.rb
config.active_record.encryption.add_to_filter_parameters = false
```

When filtering is enabled, if you want to exclude specific attributes from
automatic filtering, you can use this configuration:

```ruby
config.active_record.encryption.excluded_from_filter_parameters = [:catchphrase]
```

NOTE: When generating the filter parameter, Rails will use the model name as a
prefix. E.g: For `User#email`, the filter parameter will be `user.email`.

### Action Text

You can encrypt Action Text attributes by passing `encrypted: true` in their
declaration.

```ruby
class Message < ApplicationRecord
  has_rich_text :content, encrypted: true
end
```

NOTE: Passing individual encryption options to Action Text attributes is not
supported. It will use non-deterministic encryption with the global encryption
options configured.

### Fixtures

To allow your tests can use plain text values in the YAML fixture files for
encrypted attributes, you can configure fixtures to be automatically encrypted
by adding this configuration to your `config/environments/test.rb` file:

```ruby
Rails.application.configure do
  config.active_record.encryption.encrypt_fixtures = true
  # ...
end
```

Without this setting, Rails would load fixture values as is. This wouldn't work
for encrypted attributes and Active Record Encryption expects a JSON value in
that column. However, when `encrypt_fixtures` is enabled, all the encryptable
attributes will be automatically encrypted  and also seamlessly decrypted,
according to the encryption settings defined in the model.

#### Action Text Fixtures

To encrypt Action Text fixtures, you can place them in
`fixtures/action_text/encrypted_rich_texts.yml`.

### Encoding

When encrypting strings non-deterministically, their original encoding is
preserved automatically.

For deterministic encryption, Rails stores the string encoding alongside the
ciphertext. However, to ensure consistent encryption output, especially for
querying or enforcing uniqueness, the library forces UTF-8 encoding by default.
This avoids producing different ciphertexts for identical strings with different
encodings.

You can customize this behavior. To change the default forced encoding:

```ruby
config.active_record.encryption.forced_encoding_for_deterministic_encryption = Encoding::US_ASCII
```

To disable forced encoding and preserve the original encoding in all cases:

```ruby
config.active_record.encryption.forced_encoding_for_deterministic_encryption = nil
```

### Compression

Active Record Encryption enables compression of encrypted payloads by default.
This can save up to 30% of the storage space for larger payloads.

NOTE: Compression is enabled by default but *not* applied to all payloads. It is
based on a size threshold (such as 140 bytes), which is used as a heuristic to
determine if compression is "worth it".

You can disable compression by setting the `compress` option to `false` when
encrypting attributes:

```ruby
class Article < ApplicationRecord
  encrypts :content, compress: false
end
```

You can also configure the algorithm used for the compression. The default
compressor is [`Zlib`](https://en.wikipedia.org/wiki/Zlib). You can implement
your own compressor by creating a class or module that responds to `deflate` and
`inflate` methods. For example:

```ruby
require "zstd-ruby"

module ZstdCompressor
  def self.deflate(data)
    Zstd.compress(data)
  end

  def self.inflate(data)
    Zstd.decompress(data)
  end
end

class User
  encrypts :name, compressor: ZstdCompressor
end
```

You can also configure the desired compression method globally:

```ruby
config.active_record.encryption.compressor = ZstdCompressor
```

### Using the API

Active Record Encryption is meant to be used declaratively, but there is also an
API for debugging or advanced use cases.

You can encrypt and decrypt all relevant attributes of an `article` model like
this:

```ruby
article.encrypt # encrypt or re-encrypt all the encryptable attributes
article.decrypt # decrypt all the encryptable attributes
```

You can check whether a given attribute is encrypted:

```ruby
article.encrypted_attribute?(:title)
```

You can read the `ciphertext` for an attribute:

```ruby
article.ciphertext_for(:title)
```

## Migrating Existing Data

### Support for Unencrypted Data

To ease the transition from unencrypted to encrypted attributes in your Rails
application, you can enable support for unencrypted data with:

```ruby
config.active_record.encryption.support_unencrypted_data = true
```

When enabled:

* Reading attributes that are still unencrypted will succeed without raising
  errors.

* Queries on deterministically encrypted attributes can match both encrypted and
  cleartext values, if you also enable `extended_queries`:

```ruby
config.active_record.encryption.extend_queries = true
```

This setup is intended only for migration periods during which both encrypted
and unencrypted data need to coexist in your application. Both options default
to `false`, which is the recommended long-term configuration to ensure data is
fully encrypted and enforced.

### Support for Previous Encryption Schemes

Changing encryption properties of attributes can break existing data. For
example, imagine you want to make a deterministic attribute non-deterministic.
If you change the declaration in the model, reading existing ciphertexts will
fail because the encryption method is different now.

To support these situations, you can specify previous encryption schemes to be
used globally or on a per-attribute basis.

Once you configure the previous scheme, the following will be supported:

* When reading encrypted data, Active Record Encryption will try previous
  encryption schemes if the current scheme doesn't work.

* When querying deterministic data, it will add ciphertexts using previous
  schemes so that queries work seamlessly with data encrypted with different
  schemes.

You need to enable `extended_queries` configuration for this to work:

```ruby
config.active_record.encryption.extend_queries = true
```

Next, let's see how to configure previous encryption schemes.

#### Global Previous Encryption Schemes

You can add previous encryption schemes by adding them as a list of properties
using the `previous` config property in your `config/application.rb`:

```ruby
config.active_record.encryption.previous = [ { key_provider: MyOldKeyProvider.new } ]
```

#### Per-attribute Previous Encryption Schemes

Use the `previous` option when declaring the encrypted attribute:

```ruby
class Article
  encrypts :title, deterministic: true, previous: { deterministic: false }
end
```

#### Encryption Schemes and Determinism

With deterministic encryption, you typically want ciphertexts to remain
constant. So when changing encryption schemes, non-deterministic and
deterministic encryption behave differently.

* With **non-deterministic encryption**, new information will always be
  encrypted with the *newest* (current) encryption scheme.

* With **deterministic encryption**, new information will be encrypted with the
  *oldest* encryption scheme by default.

It is possible to change this behavior for deterministic encryption to use the
*newest* encryption scheme for encrypting new data like this:

```ruby
class Article
  encrypts :title, deterministic: { fixed: false }
end
```

## Encryption Contexts

An encryption context defines the encryption components that are used at a given
moment. There is a default encryption context based on your global
configuration, but you can also configure a custom context for a given attribute
or when running a specific block of code.

NOTE: Encryption contexts are a flexible but advanced configuration mechanism.
Most users would not need to use them.

The main components of encryption contexts are:

* `encryptor`: exposes the internal API for encrypting and decrypting data.  It
  interacts with a `key_provider` to build encrypted messages and deal with
  their serialization. The encryption/decryption itself is done by the `cipher`
  and the serialization by `message_serializer`.
* `cipher`: the encryption algorithm itself (AES 256 GCM).
* `key_provider`: serves encryption and decryption keys.
* `message_serializer`: serializes and deserializes encrypted payloads.

WARNING: If you decide to build your own `message_serializer`, it's important to
use safe mechanisms that can't deserialize arbitrary objects. A commonly
supported scenario is encrypting existing unencrypted data. An attacker can
leverage this to enter a tampered payload before encryption takes place and
perform RCE attacks. This means custom serializers should avoid `Marshal`,
`YAML.load` (use `YAML.safe_load`  instead), or `JSON.load` (use `JSON.parse`
instead).

### Built-In Encryption Context

The global encryption context is the one used by default and is configured with
other configuration properties in your `config/application.rb` or environment
config files.

```ruby
config.active_record.encryption.key_provider = ActiveRecord::Encryption::EnvelopeEncryptionKeyProvider.new
config.active_record.encryption.encryptor = MyEncryptor.new
```

You can use
[`with_encryption_context`](https://api.rubyonrails.org/classes/ActiveRecord/Encryption/Contexts.html#method-i-with_encryption_context)
to override any of the properties of the encryption context.

### Encryption Context with a Block of Code

You can set an encryption context for a given block of code using
`with_encryption_context`:

```ruby
ActiveRecord::Encryption.with_encryption_context(encryptor: ActiveRecord::Encryption::NullEncryptor.new) do
  # ...
end
```

### Per-attribute Encryption Contexts

You can override encryption context configuration by passing options in the
attribute declaration:

```ruby
class Attribute
  encrypts :title, encryptor: MyAttributeEncryptor.new
end
```

### Encryption Context to Disable Encryption

You can run code without encryption:

```ruby
ActiveRecord::Encryption.without_encryption do
  # ...
end
```

This means that reading encrypted text will return the ciphertext, and saved
content will be stored unencrypted.

### Encryption Context to Protect Encrypted Data

You can run code in a block without encryption but prevent overwriting encrypted
content:

```ruby
ActiveRecord::Encryption.protecting_encrypted_data do
  # ...
end
```

This can be handy if you want to protect encrypted data while running arbitrary
code against it (e.g. in a Rails console).

## Key Management

Key providers implement key management strategies. You can configure key
providers globally or on a per-attribute basis.

### Built-in Key Providers

#### DerivedSecretKeyProvider

The
[`DerivedSecretKeyProvider`](https://api.rubyonrails.org/classes/ActiveRecord/Encryption/DerivedSecretKeyProvider.html)
serves keys derived from the provided passwords using PBKDF2. This is the key
provider configured by default.

```ruby
config.active_record.encryption.key_provider = ActiveRecord::Encryption::DerivedSecretKeyProvider.new(["some passwords", "to derive keys from. ", "These should be in", "credentials"])
```

NOTE: By default, `active_record.encryption` configures a
`DerivedSecretKeyProvider` with the keys defined in
`active_record.encryption.primary_key`.

#### EnvelopeEncryptionKeyProvider

The
[`EnvelopeEncryptionKeyProvider`](https://api.rubyonrails.org/classes/ActiveRecord/Encryption/EnvelopeEncryptionKeyProvider.html)
implements a simple [envelope
encryption](https://en.wikipedia.org/wiki/Hybrid_cryptosystem#Envelope_encryption)
strategy, where the data is encrypted with a key, which in turn is also
encrypted.

The `EnvelopeEncryptionKeyProvider` generates a random key for each data
encryption operation. It stores the data-key with the data itself. Then, the
data-key is also encrypted with a primary key defined in the credential
`active_record.encryption.primary_key`.

You can configure Active Record to use this key provider by adding this to your
`config/application.rb`:

```ruby
config.active_record.encryption.key_provider = ActiveRecord::Encryption::EnvelopeEncryptionKeyProvider.new
```

As with other built-in key providers, you can provide a list of primary keys in
`active_record.encryption.primary_key` to implement key-rotation schemes.

### Custom Key Providers

For more advanced key-management schemes, you can configure a custom key
provider in an initializer:

```ruby
ActiveRecord::Encryption.key_provider = MyKeyProvider.new
```

A key provider must implement this interface:

```ruby
class MyKeyProvider
  def encryption_key
  end

  def decryption_keys(encrypted_message)
  end
end
```

Both methods return `ActiveRecord::Encryption::Key` objects:

- `encryption_key` returns the key used for encrypting some content
- `decryption_keys` returns a list of potential keys for decrypting a given
  ciphertext.

A key can include arbitrary tags that will be stored unencrypted with the
message. You can use
[`ActiveRecord::Encryption::Message#headers`](https://edgeapi.rubyonrails.org/classes/ActiveRecord/Encryption/Message.html)
to examine those values when decrypting.

### Attribute-specific Key Providers

You can configure a key provider on a per-attribute basis with the
`key_provider` option. For example, assuming you have defined a custom key
provider called `ArticleKeyProvider`:

```ruby
class Article < ApplicationRecord
  encrypts :summary, key_provider: ArticleKeyProvider.new
end
```

### Attribute-specific Keys

You can configure a specific key for a given attribute using the `key` option:

```ruby
class Article < ApplicationRecord
  encrypts :summary, key: ENV["SOME_SECRET_KEY_FOR_ARTICLE_SUMMARIES"]
end
```

Active Record will use the key passed to `encrypts` to encrypt and decrypt the
`summary` attribute above.

### Rotating Keys

Active Record Encryption can work with lists of keys to support implementing key
rotation schemes. The reason to rotate keys may be as part of your
organization's security policy or if you suspect a key may be compromised.

In the example below, the *last key* is used for encrypting new content and all
keys are tried when decrypting content until one works.

```yml
active_record_encryption:
  primary_key:
    - a1cc4d7b9f420e40a337b9e68c5ecec6 # Previous keys can still decrypt existing content
    - bc17e7b413fd4720716a7633027f8cc4 # Active, encrypts new content
  key_derivation_salt: a3226b97b3b2f8372d1fc6d497a0c0d3
```

This enables key rotation workflow where you keep a short list of keys by adding
new keys, re-encrypting content, and deleting old keys.

NOTE: Rotating keys is not supported for deterministic encryption.

### Storing Key References

You can store a reference to the encryption key in the encrypted message itself.
The advantage of doing this is that decryption can be more performant as the
system does not have to try a list of keys to find one that works. The tradeoff
is that the encryption data will be a bit larger.

In order to store a key reference, you need to enable this configuration:

```ruby
config.active_record.encryption.store_key_references = true
```

