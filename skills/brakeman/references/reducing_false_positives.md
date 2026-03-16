# Reducing False Positives in Brakeman

Strategies and techniques for minimizing false positives while maintaining security coverage.

## Understanding False Positives

False positives occur when Brakeman reports a potential vulnerability that isn't actually exploitable. This happens because static analysis must make conservative assumptions without runtime context.

**Common causes of false positives:**
- Custom sanitization methods Brakeman doesn't recognize
- Database values treated as unsafe by default
- Indirect data flow Brakeman can't track
- Business logic that prevents exploitation
- Already-secured code patterns Brakeman doesn't understand

**Important**: Always investigate warnings before dismissing them as false positives. Many "false positives" are actually real vulnerabilities.

## Strategy 1: Filter by Confidence Level

Start with high confidence warnings and work your way down.

```bash
# Only high confidence (most likely real issues)
brakeman -w3

# High and medium confidence
brakeman -w2

# All warnings (default)
brakeman -w1
```

**When to use**: Initial scans of large codebases or when overwhelmed by warnings.

**Recommendation**: Always review all high confidence warnings. Medium and weak confidence warnings may contain real issues too, so don't ignore them permanently.

## Strategy 2: Mark Safe Methods

Tell Brakeman about custom sanitization or escaping methods.

### Command-line Approach

```bash
# Mark methods as safe for HTML output
brakeman --safe-methods sanitize_user_input,escape_html

# Mark methods as safe for URLs
brakeman --url-safe-methods normalize_url,safe_url
```

### Configuration File Approach

```yaml
# config/brakeman.yml
---
:safe_methods:
  - sanitize_user_input
  - escape_html
  - clean_content
:url_safe_methods:
  - normalize_url
  - validate_url
```

### Example Scenario

**Your code:**
```ruby
# app/helpers/sanitizer_helper.rb
module SanitizerHelper
  def sanitize_user_input(text)
    ActionController::Base.helpers.sanitize(text, 
      tags: %w[p br strong em],
      attributes: %w[href title]
    )
  end
end

# app/views/posts/show.html.erb
<%= sanitize_user_input(@post.content) %>
```

**Without marking as safe**: Brakeman warns about unescaped output.

**After marking as safe**:
```bash
brakeman --safe-methods sanitize_user_input
```

No warning! But ensure your method actually is safe.

## Strategy 3: Scope Database Value Warnings

By default, Brakeman treats database values as potentially unsafe (because they may contain user input). For some applications, this assumption doesn't hold.

### Ignore Model Output (Use Carefully)

```bash
# Consider model attributes safe from XSS
brakeman --ignore-model-output
```

**Warning**: Only use if you're certain database values can't contain malicious content.

**Better approach**: Fix the root cause by sanitizing on input:

```ruby
class Post < ApplicationRecord
  before_validation :sanitize_content
  
  private
  
  def sanitize_content
    self.content = ActionController::Base.helpers.sanitize(content) if content_changed?
  end
end
```

## Strategy 4: Run Specific Checks

Focus on the most critical vulnerability types for your application.

```bash
# Security-critical checks only
brakeman -t SQL,CrossSiteScripting,CommandInjection,Authentication

# Exclude noisy checks
brakeman -x DefaultRoutes,Redirect,LinkTo
```

**When to use**: When specific check types produce many false positives but you still want coverage of critical issues.

**Available checks**:
```bash
brakeman --checks
```

## Strategy 5: Skip Problematic Code

Some legacy or generated code may produce unavoidable false positives.

```bash
# Skip specific files or directories
brakeman --skip-files vendor/,lib/legacy/,db/seeds/

# Skip generated files
brakeman --skip-files "db/migrate/*,db/schema.rb"
```

### Configuration File

```yaml
# config/brakeman.yml
---
:skip_files:
  - vendor/
  - node_modules/
  - lib/legacy/
  - app/models/auto_generated.rb
```

**Best practice**: Use sparingly and document why files are skipped.

## Strategy 6: Use Interactive Ignore Tool

The interactive ignore tool helps you review and document false positives systematically.

```bash
brakeman -I
```

### Interactive Workflow

1. **Initial prompt**: Choose inspection mode
   - `1` - Inspect all warnings
   - `2` - Hide previously ignored warnings
   - `3` - Skip and use current config

2. **For each warning**: Choose action
   - `i` - Ignore this warning
   - `n` - Ignore with note (recommended!)
   - `s` - Skip (keep showing)
   - `u` - Un-ignore if previously ignored
   - `a` - Ignore all remaining
   - `k` - Keep all remaining
   - `q` - Quit without saving

3. **After review**: Save changes
   - `1` - Save to config/brakeman.ignore
   - `2` - Start over
   - `3` - Quit without saving

### Best Practices for Notes

Always add notes explaining why warnings are ignored:

```json
{
  "ignored_warnings": [
    {
      "fingerprint": "abc123...",
      "note": "Admin-only endpoint, checked in before_action"
    },
    {
      "fingerprint": "def456...",
      "note": "Input validated against whitelist in line 42"
    },
    {
      "fingerprint": "ghi789...",
      "note": "Only accepts numeric IDs, cannot be exploited"
    }
  ]
}
```

## Strategy 7: Document Business Logic

When business logic prevents exploitation, document it clearly in code.

**Before (triggers warning):**
```ruby
def show
  @user = User.find(params[:id])
end
```

**After (with documentation):**
```ruby
def show
  # Safe: User scope limited by before_action :authorize_user_access
  # See application_controller.rb line 45
  @user = User.find(params[:id])
end
```

While Brakeman will still warn, the note helps during review and justifies ignoring.

## Strategy 8: Refactor to Safer Patterns

Sometimes the best solution is refactoring to patterns Brakeman understands.

### Example 1: Scoped Finds

**Before (triggers warning):**
```ruby
def destroy
  post = Post.find(params[:id])
  post.destroy
end
```

**After (no warning):**
```ruby
def destroy
  post = current_user.posts.find(params[:id])
  post.destroy
end
```

### Example 2: Explicit Rendering

**Before (triggers warning):**
```ruby
def show
  render params[:template]
end
```

**After (no warning):**
```ruby
def show
  template = ALLOWED_TEMPLATES.include?(params[:template]) ? params[:template] : 'default'
  render template
end
```

### Example 3: Strong Parameters

**Before (triggers warning in Rails 3):**
```ruby
def create
  User.create(params[:user])
end
```

**After (no warning):**
```ruby
def create
  User.create(user_params)
end

private

def user_params
  params.require(:user).permit(:name, :email)
end
```

## Strategy 9: Regular Review Cycles

Don't set and forget your ignore configuration.

### Monthly Review Process

1. **Show ignored warnings**:
   ```bash
   brakeman --show-ignored -o review.html
   ```

2. **Question each ignored warning**:
   - Is the justification still valid?
   - Has the code changed?
   - Could we refactor to eliminate the warning?

3. **Update ignore list**:
   ```bash
   brakeman -I
   ```

4. **Look for patterns**:
   - Multiple similar warnings might indicate a systemic issue
   - Common false positives might need better handling

## Strategy 10: Layered Defense

Accept that some false positives will remain, but layer other defenses.

### Complementary Security Measures

1. **Code review**: Human review catches what tools miss
2. **Dynamic testing**: Penetration testing and security scans
3. **WAF rules**: Web Application Firewall protects at runtime
4. **Input validation**: Strong input validation at boundaries
5. **Output encoding**: Consistent encoding in views
6. **Security headers**: CSP, X-Frame-Options, etc.
7. **Dependency scanning**: bundler-audit, Dependabot
8. **Security testing**: Automated security test suites

**Philosophy**: Brakeman is one tool in a comprehensive security program.

## Common False Positive Patterns

### Pattern 1: Admin-Only Endpoints

**Issue**: Brakeman doesn't understand authorization logic.

**Example**:
```ruby
class AdminController < ApplicationController
  before_action :require_admin
  
  def destroy_user
    User.find(params[:id]).destroy  # Warns about unscoped find
  end
end
```

**Solutions**:
1. Accept the warning and document it
2. Scope anyway: `User.admin_deletable.find(...)`
3. Ignore with note explaining admin authorization

### Pattern 2: Enum Values

**Issue**: Brakeman doesn't track that params contain only enum values.

**Example**:
```ruby
# User.statuses = ['active', 'inactive', 'pending']
User.where("status = '#{params[:status]}'")  # Warns about SQL injection
```

**Solutions**:
1. Use parameterized query: `User.where(status: params[:status])`
2. Validate enum: `User.where(status: User.statuses[params[:status]])`
3. Use ActiveRecord enums properly

### Pattern 3: Internal Data

**Issue**: Data from internal APIs treated as unsafe.

**Example**:
```ruby
# Data from internal microservice
response = InternalAPI.fetch_user_data(user_id)
render json: response.body.html_safe  # Warns about XSS
```

**Solutions**:
1. Don't use `html_safe` on API responses
2. Parse and re-encode: `render json: JSON.parse(response.body)`
3. If truly safe, mark the API method as safe

### Pattern 4: Path Validation

**Issue**: Brakeman doesn't see path validation logic.

**Example**:
```ruby
def download
  file = params[:file]
  if file =~ /\A[a-z0-9_\-]+\.pdf\z/i
    send_file "downloads/#{file}"  # Still warns
  end
end
```

**Solutions**:
1. Use more explicit path construction:
   ```ruby
   filename = File.basename(params[:file])
   safe_path = Rails.root.join('downloads', filename)
   send_file safe_path if File.exist?(safe_path)
   ```
2. Document validation in ignore note

### Pattern 5: Constant Values

**Issue**: Brakeman conservative about what's truly constant.

**Example**:
```ruby
TEMPLATE_MAP = {
  'profile' => 'users/profile',
  'settings' => 'users/settings'
}

render TEMPLATE_MAP[params[:view]]  # May warn
```

**Solution**: Brakeman should handle this, but if it warns, the code is actually safer than dynamic rendering.

## Configuration Template for Balanced Coverage

```yaml
# config/brakeman.yml
# Balanced configuration: security coverage with reduced noise
---
# Start with medium/high confidence
:confidence_level: 2

# Focus on critical checks
:run_checks:
  - SQL
  - CrossSiteScripting
  - CommandInjection
  - MassAssignment
  - Authentication
  - Authorization
  - Evaluation
  - Execute
  - FileAccess
  - UnsafeReflection

# Skip extremely noisy or low-priority checks
:skip_checks:
  - DefaultRoutes  # If you've verified routes
  - Redirect       # If you've reviewed redirect logic

# Skip generated/vendor code
:skip_files:
  - vendor/
  - node_modules/
  - db/schema.rb

# Custom sanitization methods
:safe_methods:
  - sanitize_user_input
  - strip_tags_and_escape

# Don't fail build on warnings initially
:exit_on_warn: false

# Ignore file
:ignore_file: config/brakeman.ignore

# Output settings
:quiet: true
:output_format: json
:output_files:
  - tmp/brakeman.json
  - tmp/brakeman.html
```

## Progressive Improvement Strategy

### Phase 1: Establish Baseline (Week 1)
```bash
# 1. Run initial scan
brakeman -w3 -o baseline-high.json -o baseline-high.html

# 2. Fix all high confidence warnings (or document why not)
brakeman -I

# 3. Commit ignore file
git add config/brakeman.ignore
```

### Phase 2: Medium Confidence (Week 2-4)
```bash
# 1. Review medium confidence
brakeman -w2 -o baseline-medium.json

# 2. Fix real issues, ignore false positives with notes
brakeman -I

# 3. Update ignore file
git add config/brakeman.ignore
```

### Phase 3: Low Confidence (Month 2)
```bash
# 1. Review remaining warnings
brakeman -w1 -o baseline-all.json

# 2. Triage systematically
brakeman -I
```

### Phase 4: Maintain (Ongoing)
```bash
# 1. Run in CI
brakeman -w2 --compare main.json

# 2. Monthly ignore review
brakeman --show-ignored

# 3. Quarterly comprehensive scan
brakeman -w1 --no-exit-on-warn
```

## Red Flags: When It's NOT a False Positive

Be especially careful dismissing warnings in these cases:

1. **User input flows to sensitive operations**: SQL queries, system commands, file operations
2. **Authentication/authorization bypasses**: Access control issues
3. **Mass assignment on sensitive models**: User, Admin, Payment models
4. **Eval-family functions**: eval, instance_eval, class_eval, etc.
5. **Unsafe deserialization**: Marshal.load, YAML.load without safe_load
6. **High confidence warnings**: These are rarely false positives

**When in doubt, treat it as real and prove otherwise.**

## Tools for Validation

After marking something as a false positive, validate your assumption:

### 1. Manual Testing
Try to exploit the vulnerability yourself.

### 2. Security Test
Write a security-focused test:
```ruby
# test/security/xss_test.rb
test "should escape malicious content" do
  post = Post.create(content: "<script>alert('xss')</script>")
  get post_path(post)
  assert_no_match /<script>/, response.body
  assert_match /&lt;script&gt;/, response.body
end
```

### 3. Code Review
Have another developer review the warning and your justification.

### 4. Penetration Testing
Include in penetration test scope.

## Summary: Balanced Approach

1. **Start conservative**: Review all high confidence warnings
2. **Mark judiciously**: Only ignore with clear justification
3. **Document everything**: Future you will thank present you
4. **Review regularly**: Ignored warnings should be revisited
5. **Refactor when possible**: Better code beats configuration
6. **Layer defenses**: Static analysis is one tool among many
7. **Stay skeptical**: Most "false positives" deserve investigation

Remember: The goal isn't zero warnings. The goal is understanding every warning and making informed decisions about risk.
