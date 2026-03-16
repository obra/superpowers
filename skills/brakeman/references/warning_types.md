# Brakeman Warning Types Reference

This document provides detailed descriptions of all vulnerability types that Brakeman can detect in Rails applications.

## Injection Vulnerabilities

### SQL Injection

**Description**: Occurs when user input is directly interpolated into SQL queries without proper escaping or parameterization.

**Risk**: Attackers can execute arbitrary SQL commands, potentially reading, modifying, or deleting database data.

**Vulnerable Code Examples**:
```ruby
# String interpolation in queries
User.where("email = '#{params[:email]}'")

# String concatenation
User.where("name = '" + params[:name] + "'")

# Raw SQL with interpolation
ActiveRecord::Base.connection.execute("SELECT * FROM users WHERE id = #{params[:id]}")
```

**Secure Alternatives**:
```ruby
# Use parameterized queries
User.where("email = ?", params[:email])
User.where(email: params[:email])

# Use hash conditions
User.where(name: params[:name])

# Use named placeholders
User.where("name = :name", name: params[:name])
```

**Remediation**: Always use parameterized queries or ActiveRecord's built-in query methods that automatically escape values.

---

### Command Injection

**Description**: Occurs when user input is passed to system commands without proper sanitization.

**Risk**: Attackers can execute arbitrary system commands on the server.

**Vulnerable Code Examples**:
```ruby
# Backticks with interpolation
`ls #{params[:directory]}`

# system() with interpolation
system("cat #{params[:file]}")

# exec() with string interpolation
exec("rm -rf #{params[:path]}")

# %x{} with interpolation
%x{ping #{params[:host]}}
```

**Secure Alternatives**:
```ruby
# Use array form of system commands
system("ls", params[:directory])

# Use shellwords to escape arguments
require 'shellwords'
system("cat #{Shellwords.escape(params[:file])}")

# Better: avoid shell commands entirely, use Ruby APIs
FileUtils.rm_rf(params[:path]) # Use FileUtils instead of shell
```

**Remediation**: Use array form of system commands or avoid shell commands entirely by using Ruby's built-in file/network APIs.

---

### Cross-Site Scripting (XSS)

**Description**: Occurs when user input is rendered in views without proper escaping.

**Risk**: Attackers can inject malicious JavaScript that executes in victims' browsers.

**Vulnerable Code Examples**:
```erb
<!-- Unescaped output -->
<%= raw @user.bio %>
<%= @comment.text.html_safe %>
<%= params[:search].html_safe %>

<!-- In attributes without quotes -->
<div id=<%= params[:id] %>>

<!-- In JavaScript -->
<script>
  var name = '<%= @user.name %>';
</script>
```

**Secure Alternatives**:
```erb
<!-- Default escaping (safe) -->
<%= @user.bio %>

<!-- Explicitly escape -->
<%= h @user.bio %>

<!-- For trusted HTML, sanitize first -->
<%= sanitize @user.bio %>

<!-- In JavaScript, use json helper -->
<script>
  var name = <%= @user.name.to_json %>;
</script>
```

**Remediation**: Never use `html_safe` or `raw` on user input. Use Rails' default escaping or `sanitize` for HTML content.

---

### Cross-Site Scripting (Content Tag)

**Description**: Occurs when using `content_tag` helpers with unescaped user input.

**Risk**: Similar to regular XSS, allows JavaScript injection.

**Vulnerable Code Examples**:
```ruby
content_tag :div, params[:content].html_safe
content_tag :span, raw(params[:text])
```

**Secure Alternatives**:
```ruby
# Let Rails handle escaping
content_tag :div, params[:content]

# Or sanitize if HTML is expected
content_tag :div, sanitize(params[:content])
```

---

### Cross-Site Scripting (JSON)

**Description**: Occurs when unescaped data is embedded in JSON responses or JavaScript.

**Risk**: Can lead to XSS in JSON-based APIs or JSONP endpoints.

**Vulnerable Code Examples**:
```ruby
render json: {data: params[:input].html_safe}
render json: User.all.to_json.html_safe
```

**Secure Alternatives**:
```ruby
# Use proper JSON encoding
render json: {data: params[:input]}

# Rails handles JSON escaping automatically
render json: User.all
```

## Authentication & Authorization

### Authentication

**Description**: Missing or weak authentication mechanisms detected.

**Common Issues**:
- No authentication required for sensitive actions
- Weak password requirements
- Missing authentication callbacks

**Example Issues**:
```ruby
# Controller with no authentication
class AdminController < ApplicationController
  # Missing: before_action :authenticate_user!
  
  def destroy_user
    User.find(params[:id]).destroy
  end
end
```

**Remediation**:
```ruby
class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin
  
  def destroy_user
    User.find(params[:id]).destroy
  end
end
```

---

### Basic Authentication

**Description**: Use of HTTP Basic Authentication detected.

**Risk**: Credentials transmitted in easily decoded Base64 encoding.

**Vulnerable Code**:
```ruby
class ApiController < ApplicationController
  http_basic_authenticate_with name: "user", password: "password"
end
```

**Remediation**: Use more secure authentication methods like OAuth, JWT, or session-based authentication over HTTPS.

---

### Cross-Site Request Forgery (CSRF)

**Description**: Application doesn't protect against CSRF attacks.

**Risk**: Attackers can trick users into performing unintended actions.

**Common Issues**:
```ruby
# ApplicationController without CSRF protection
class ApplicationController < ActionController::Base
  # Missing: protect_from_forgery with: :exception
end
```

**Remediation**:
```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  # or for APIs:
  # protect_from_forgery with: :null_session
end
```

## Mass Assignment

### Mass Assignment

**Description**: Models allow unrestricted mass assignment of attributes.

**Risk**: Attackers can modify unintended model attributes.

**Vulnerable Code (Rails < 4)**:
```ruby
# Model with no attr_accessible
class User < ActiveRecord::Base
  # No protection defined
end

# Controller
def create
  User.create(params[:user]) # Can set ANY attribute
end
```

**Secure Code (Rails 4+)**:
```ruby
# Controller with strong parameters
def create
  User.create(user_params)
end

private

def user_params
  params.require(:user).permit(:name, :email)
end
```

**Remediation**: Always use strong parameters in Rails 4+ or `attr_accessible` in Rails 3.

---

### Attribute Restriction

**Description**: Model lacks attribute restrictions (Rails 3 specific).

**Risk**: Similar to mass assignment issues.

**Remediation**: Define `attr_accessible` to whitelist safe attributes.

## Routing & Redirects

### Default Routes

**Description**: Application uses catch-all default routes.

**Risk**: Exposes all public controller methods as actions.

**Vulnerable Code**:
```ruby
# config/routes.rb
match ':controller/:action/:id'
```

**Remediation**:
```ruby
# Define explicit routes
resources :users, only: [:index, :show, :create, :update]

# Or be specific
get 'users/:id', to: 'users#show'
```

---

### Unsafe Redirects

**Description**: Redirect destinations based on unvalidated user input.

**Risk**: Phishing attacks by redirecting to malicious sites.

**Vulnerable Code**:
```ruby
redirect_to params[:url]
redirect_to params[:return_to]
redirect_to "http://#{params[:host]}/page"
```

**Secure Alternatives**:
```ruby
# Whitelist allowed redirect paths
SAFE_REDIRECTS = ['/dashboard', '/profile', '/home']

def redirect_safely
  url = params[:return_to]
  if SAFE_REDIRECTS.include?(url)
    redirect_to url
  else
    redirect_to root_path
  end
end

# Or validate URL format
def safe_redirect
  url = params[:return_to]
  if url =~ /\A\/[a-z0-9_\-\/]+\z/i
    redirect_to url
  else
    redirect_to root_path
  end
end
```

---

### Dynamic Render Paths

**Description**: Render paths determined by user input.

**Risk**: Can expose arbitrary views or templates.

**Vulnerable Code**:
```ruby
render params[:template]
render action: params[:action]
render file: "/path/#{params[:template]}"
```

**Secure Alternatives**:
```ruby
# Whitelist allowed templates
ALLOWED_TEMPLATES = ['index', 'show', 'dashboard']

def safe_render
  template = params[:template]
  if ALLOWED_TEMPLATES.include?(template)
    render template
  else
    render 'index'
  end
end
```

## File Operations

### File Access

**Description**: File operations use user-controlled paths.

**Risk**: Unauthorized file reading or writing.

**Vulnerable Code**:
```ruby
File.read(params[:file])
File.open(params[:path])
send_file params[:filename]
```

**Secure Alternatives**:
```ruby
# Validate and restrict paths
def safe_file_read
  filename = File.basename(params[:file])
  safe_path = Rails.root.join('public', 'downloads', filename)
  
  if File.exist?(safe_path) && safe_path.to_s.start_with?(Rails.root.join('public', 'downloads').to_s)
    File.read(safe_path)
  else
    raise "Invalid file"
  end
end
```

---

### Path Traversal

**Description**: File paths vulnerable to directory traversal attacks.

**Risk**: Access to files outside intended directory.

**Vulnerable Code**:
```ruby
File.read("uploads/#{params[:file]}")
send_file "/var/data/#{params[:path]}"
```

**Remediation**: Use `File.basename` to strip directory components and validate paths.

## Code Execution

### Dangerous Evaluation

**Description**: Use of `eval`, `instance_eval`, `class_eval`, or `module_eval` with user input.

**Risk**: Arbitrary Ruby code execution.

**Vulnerable Code**:
```ruby
eval(params[:code])
instance_eval(params[:method])
class_eval("def #{params[:name]}; end")
```

**Remediation**: Avoid `eval` entirely. Use safer alternatives like `send`, `public_send`, or whitelist approaches.

---

### Dangerous Send

**Description**: Using `send` with user-controlled method names.

**Risk**: Can call private methods or unintended functionality.

**Vulnerable Code**:
```ruby
object.send(params[:method])
user.send(params[:action], params[:value])
```

**Secure Alternatives**:
```ruby
# Use public_send instead
object.public_send(params[:method])

# Or whitelist methods
SAFE_METHODS = ['name', 'email', 'created_at']
method = params[:method]
if SAFE_METHODS.include?(method)
  object.public_send(method)
end
```

---

### Remote Code Execution

**Description**: Potential for arbitrary code execution through various vectors.

**Risk**: Complete server compromise.

**Common Vectors**:
- Unsafe deserialization
- YAML.load with user input
- Unrestricted file uploads
- Code injection via templates

---

### Remote Execution in YAML.load

**Description**: Using `YAML.load` with untrusted input.

**Risk**: Can execute arbitrary code through YAML serialization.

**Vulnerable Code**:
```ruby
YAML.load(params[:data])
YAML.load(File.read(params[:file]))
```

**Secure Alternatives**:
```ruby
# Use safe_load instead
YAML.safe_load(params[:data])

# Or specify allowed classes
YAML.safe_load(params[:data], permitted_classes: [Symbol, Date, Time])
```

## Serialization & Deserialization

### Unsafe Deserialization

**Description**: Deserializing untrusted data.

**Risk**: Code execution through object deserialization.

**Vulnerable Code**:
```ruby
Marshal.load(params[:data])
Marshal.restore(cookie[:serialized])
```

**Remediation**: Never deserialize untrusted data. Use JSON for data exchange.

---

### Cookie Serialization

**Description**: Insecure cookie serialization configuration.

**Risk**: Remote code execution through cookie manipulation.

**Check Configuration**:
```ruby
# config/initializers/session_store.rb
# Ensure using :json, not :marshal or :hybrid
Rails.application.config.action_dispatch.cookies_serializer = :json
```

## Session Management

### Session Manipulation

**Description**: Session data vulnerable to manipulation.

**Common Issues**:
- Session fixation vulnerabilities
- Predictable session IDs
- Session data in cookies without signing

**Remediation**: Use Rails' default encrypted and signed cookies.

---

### Session Settings

**Description**: Insecure session configuration.

**Risk**: Session hijacking or manipulation.

**Check Settings**:
```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: '_app_session',
  secure: true,        # Require HTTPS
  httponly: true,      # Prevent JavaScript access
  same_site: :strict   # CSRF protection
```

## Validation & Format Issues

### Format Validation

**Description**: Regular expression validation using `^` and `$` instead of `\A` and `\z`.

**Risk**: Validation bypass through newline injection.

**Vulnerable Code**:
```ruby
validates :email, format: { with: /^[\w+\-.]+@[a-z\d\-.]+\.[a-z]+$/i }
```

**Secure Code**:
```ruby
validates :email, format: { with: /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i }
```

**Explanation**: `^` and `$` match line boundaries, allowing newlines. `\A` and `\z` match string boundaries.

## Denial of Service

### Denial of Service

**Description**: Code patterns that can cause DoS attacks.

**Common Patterns**:
- Uncontrolled resource consumption
- Regex DoS (ReDoS)
- Large file processing
- Memory exhaustion

---

### Divide By Zero

**Description**: Potential division by zero errors with user input.

**Risk**: Application crashes.

**Vulnerable Code**:
```ruby
result = total / params[:count].to_i
```

**Secure Code**:
```ruby
count = params[:count].to_i
result = count > 0 ? total / count : 0
```

## SSL & Network Security

### SSL Verification Bypass

**Description**: SSL certificate verification disabled.

**Risk**: Man-in-the-middle attacks.

**Vulnerable Code**:
```ruby
require 'net/http'
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE
```

**Secure Code**:
```ruby
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_PEER
```

## Information Disclosure

### Information Disclosure

**Description**: Sensitive information exposed through various channels.

**Common Issues**:
- Detailed error messages in production
- Debug information visible
- Sensitive data in logs
- Source code exposure

**Remediation**:
```ruby
# config/environments/production.rb
config.consider_all_requests_local = false
config.log_level = :info
config.filter_parameters += [:password, :ssn, :credit_card]
```

---

### Detailed Exceptions

**Description**: Detailed error pages shown in production.

**Risk**: Exposes application internals and stack traces.

**Remediation**:
```ruby
# config/environments/production.rb
config.consider_all_requests_local = false
```

## Maintenance & Dependencies

### Unmaintained Dependencies

**Description**: Use of gems with known security vulnerabilities.

**Risk**: Known exploits available.

**Remediation**:
```bash
# Update gems regularly
bundle update

# Check for vulnerabilities
gem install bundler-audit
bundle audit check --update
```

## Other Warnings

### Mail Link

**Description**: Mail links using user input without validation.

**Risk**: Email injection or manipulation.

**Vulnerable Code**:
```erb
<%= mail_to params[:email] %>
```

---

### Unscoped Find

**Description**: Using `find` without scoping to current user.

**Risk**: Authorization bypass, accessing other users' records.

**Vulnerable Code**:
```ruby
def show
  @post = Post.find(params[:id]) # Can access any post
end
```

**Secure Code**:
```ruby
def show
  @post = current_user.posts.find(params[:id]) # Scoped to current user
end
```

## Interpreting Warnings

When Brakeman reports a warning:

1. **Review the code context**: Understand what the code is doing
2. **Assess actual risk**: Not all warnings represent real vulnerabilities
3. **Check confidence level**: High confidence warnings are more likely to be real
4. **Consider user input flow**: Trace where the data comes from
5. **Verify exploitability**: Can an attacker actually reach this code path?
6. **Document decisions**: If ignoring, document why it's a false positive

Remember: Brakeman provides warnings, not definitive proof of vulnerabilities. Manual review is essential.
