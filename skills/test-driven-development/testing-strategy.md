# Test Strategy

A test strategy defines how we approach automated testing: goals, scope, methods, priorities, and tools. It guides everyday testing decisions and ensures the team works in a consistent, predictable way.

---

# Chapter 1: Introduction

This document outlines our shared testing approach for a Ruby on Rails application using Minitest. It is written for senior Ruby developers and intended to stay flexible. Use it when writing tests manually or collaborating with AI-generated tests. Its purpose is to support clear, consistent decisions across the team.

## 1.1 Why We Test

Our tests serve three goals:

**1. Verify requirements**
Confirm that the implemented behaviour matches the requested behaviour.

**2. Prevent regressions**
Ensure behaviour stays predictable and consistent over time. CI failures act as an early warning system.

**3. Specify and document current behaviour**
Provide an executable description of how the system behaves. Test names and assertions should clearly express intent.

When something is well tested:

- The tests are easy to read and understand.
- They run fast and errors are easy to spot.
- They prevent unintentional changes to the logic.
- They describe the behaviour we want to keep deeply enough to track changes and spot side effects.
- They make the logic easy to refactor because it is clear what will break when something changes.

## 1.2 Feature Coverage

Automated tests must back every feature or change. This includes: new features, bug fixes, refactors, configuration changes, and data migrations with logic.

Tests should focus on:

- Business logic (happy path and at least the most common failure path).
- At least one integration-level test that exercises the fundamental components without mocking internal collaborators.

**Testing objectives by level:**

- At the controller level, confirm the expected action is taken, check the status code, and verify that the page is updated accordingly (assert a few key elements — not the full structure).
- At the model level, confirm the object does what it should do (business logic, not Rails defaults).

## 1.3 Out of Scope

Items we do not test:

- Visual design or third-party UI behaviour.
- Rails framework internals (e.g. that `has_many` creates association methods).
- Temporary Rake tasks — these are tested manually.
- Analytics events unless they are business-critical.

## 1.4 DHH/Vanilla Rails Philosophy

These principles guide all decisions in this document:

- **Test at the highest level that gives confidence.** Prefer an integration test over five unit tests that together cover the same ground.
- **Test against a real database with fixtures.** Rails wraps each test in a transaction rolled back after completion. Use this to your advantage rather than fighting it.
- **Minimal mocking.** Mock only genuine external boundaries (third-party HTTP services, external APIs). Never mock the object under test or Rails internals.
- **No coverage percentage targets.** Percentage gates encourage trivial tests and create false confidence. Cover high-risk code; skip trivial Rails behaviour.
- **Don't test what Rails already tests.** Default enum scopes, standard `has_many` methods, and built-in validations already have upstream tests.
- **Keep the code-to-test ratio reasonable.** A simple model should not need a 500-line test file.

---

# Chapter 2: Test Levels

## 2.1 Models (ActiveSupport::TestCase)

Model tests cover the business logic that lives in `app/models`. Inherit from `ActiveSupport::TestCase`.

**What to test:**

- Validations: one test with all valid attributes; one test per invalid attribute that asserts the expected error message.
- Custom associations (associations with scope, conditions, or non-standard configuration).
- Computed properties and instance methods.
- Functional scopes — assert real records appear or are excluded without mocking.
- Callbacks that produce observable side effects (e.g. setting a default, scheduling a job, touching a timestamp).
- Enum defaults only when they are conditionally assigned by the application.
- Custom errors and exceptions raised intentionally (these are part of the contract).
- Commands with side effects: assert the final state of the record or database, not internal collaborator calls.

**What not to test:**

- Rails default enum scopes and predicate methods.
- Standard association methods with no custom logic.
- Database constraints that have no application-level validation counterpart.

**Object construction in tests**: Prefer `build` (instantiate without persisting) over `create` (persist to database) when persistence is not required for the test. Only call `create` when the test actually needs the record in the database.

## 2.2 Controllers (ActionDispatch::IntegrationTest)

Controller tests are functional tests. All controller tests inherit from `ActionDispatch::IntegrationTest` — Rails scaffolds do this automatically.

**What to test:**

- All happy paths and the most common failure path for each action.
- Status codes and redirects.
- Authentication and authorisation (redirect or forbidden when not allowed).
- That the response body contains the expected HTML elements (a heading, a form, a key element — not the full page structure).
- Flash messages where they matter.

**What not to test:**

- Business logic of collaborating models — that belongs in model tests.
- Private controller methods.
- Instance variable values directly.

**Example patterns:**

```ruby
class ArticlesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @article = articles(:one)
  end

  test "should get index" do
    get articles_url
    assert_response :success
  end

  test "should create article" do
    assert_difference("Article.count") do
      post articles_url, params: { article: { title: "Hello Rails", body: "Content" } }
    end
    assert_redirected_to article_path(Article.last)
  end

  test "should update article" do
    patch article_url(@article), params: { article: { title: "Updated" } }
    assert_redirected_to article_path(@article)
    assert_equal "Updated", @article.reload.title
  end

  test "should destroy article" do
    assert_difference("Article.count", -1) do
      delete article_url(@article)
    end
    assert_redirected_to articles_path
  end
end
```

## 2.3 Integration Testing (ActionDispatch::IntegrationTest)

Integration tests cover real multi-step workflows that touch several components without mocks. They inherit from `ActionDispatch::IntegrationTest` (same base class as controller tests).

Each major feature should have at least one integration test covering the core workflow end-to-end through HTTP.

```ruby
class BlogFlowTest < ActionDispatch::IntegrationTest
  test "can create and view an article" do
    get "/articles/new"
    assert_response :success

    post "/articles", params: { article: { title: "Hello", body: "World" } }
    assert_response :redirect
    follow_redirect!

    assert_response :success
    assert_dom "h1", text: "Hello"
  end
end
```

Use `follow_redirect!` after any redirect before making further assertions.

> **Policy**: Do not write system tests (`ApplicationSystemTestCase`). Use
> `ActionDispatch::IntegrationTest` for behavior and `ActionView::TestCase`
> for HTML assertions. Never use Capybara or `bin/rails test:system`.

## 2.5 Jobs (ActiveJob::TestCase)

Test jobs in two ways:

**In isolation** — test that the job does its work when performed:

```ruby
class BillingJobTest < ActiveJob::TestCase
  test "account is charged" do
    perform_enqueued_jobs do
      BillingJob.perform_later(account, product)
    end
    assert account.reload.charged_for?(product)
  end
end
```

Use `perform_enqueued_jobs` with `perform_later` rather than calling `perform_now` directly. This ensures retry behaviour is exercised.

**In context** — test that the job is enqueued by the calling code:

```ruby
class AccountTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  test "#charge_for enqueues billing job" do
    assert_enqueued_with(job: BillingJob) do
      account.charge_for(product)
    end
  end
end
```

For multiple jobs:

```ruby
assert_enqueued_jobs 2, only: [AdminNotificationJob, UserNotificationJob] do
  user.confirm
end
```

## 2.6 Mailers (ActionMailer::TestCase)

Mailer unit tests live in `test/mailers/` and inherit from `ActionMailer::TestCase`. Test `from`, `to`, `subject`, and body content using `assert_emails`, `assert_equal`, and `assert_includes`. For `deliver_later` emails, use `assert_enqueued_email_with`. In integration tests, wrap the triggering action in `assert_emails 1 do ... end` to confirm the right action sends the email. See Appendix A.4 for full patterns.

## 2.7 Action Cable (ActionCable::Channel::TestCase)

Channel tests live in `test/channels/` and inherit from `ActionCable::Channel::TestCase`. Use `subscribe` to simulate a subscription and `assert_has_stream` / `assert_has_stream_for` to confirm streaming. Use `stub_connection` to inject connection identifiers. For broadcast assertions from models or jobs, include `ActionCable::TestHelper` and use `assert_broadcast_on`. See Appendix A.5 for full patterns.

---

# Chapter 3: Framework and Tools

## 3.1 Test Framework

- **Minitest**: the default Rails test framework. Use `test "description" do ... end` syntax throughout.
- **Test helpers**: `test/test_helper.rb` for global setup. Custom helpers go in `test/test_helpers/` and are included in the relevant base class.
- **Parallel execution**: tests must be order-independent and parallelisable.

## 3.2 Built-in Minitest Assertions

Key assertions available in all test cases:

| Assertion | Purpose |
|-----------|---------|
| `assert(test)` | Ensures `test` is truthy |
| `assert_not(test)` | Ensures `test` is falsy |
| `assert_equal(expected, actual)` | Ensures `expected == actual` |
| `assert_nil(obj)` / `assert_not_nil(obj)` | Checks nil-ness |
| `assert_empty(obj)` / `assert_not_empty(obj)` | Checks emptiness |
| `assert_includes(collection, obj)` | Checks membership |
| `assert_raises(ExceptionClass) { }` | Ensures block raises exception |
| `assert_match(regexp, string)` | Checks string against regexp |
| `refute(test)` | Alias for `assert_not` — use when semantically clearer |

## 3.3 Rails-Specific Assertions

| Assertion | Purpose |
|-----------|---------|
| `assert_difference(expr, n) { }` | Checks numeric change in expression |
| `assert_no_difference(expr) { }` | Checks expression does not change |
| `assert_changes(expr, from:, to:) { }` | Checks expression transitions between values |
| `assert_response(status)` | Checks HTTP status (`:success`, `:redirect`, `:not_found`, etc.) |
| `assert_redirected_to(path)` | Checks redirect destination |
| `assert_dom(selector, text)` | Checks HTML element presence and content |
| `assert_enqueued_with(job:) { }` | Checks job was enqueued |
| `assert_enqueued_jobs(n) { }` | Checks number of jobs enqueued |
| `perform_enqueued_jobs { }` | Executes enqueued jobs inline |
| `assert_emails(n) { }` | Checks emails sent |
| `assert_queries_count(n) { }` | Checks SQL query count (N+1 detection) |
| `assert_no_queries { }` | Asserts no SQL queries executed |
| `assert_broadcast_on(stream, data) { }` | Checks Action Cable broadcast |

## 3.4 Test Base Classes

Use the appropriate base class for each test type:

| Test type | Base class |
|-----------|------------|
| Models, POROs, concerns | `ActiveSupport::TestCase` |
| Controllers, integration | `ActionDispatch::IntegrationTest` |
| Mailers | `ActionMailer::TestCase` |
| Jobs | `ActiveJob::TestCase` |
| System tests | `ActionDispatch::SystemTestCase` |
| View helpers | `ActionView::TestCase` |
| Action Cable channels | `ActionCable::Channel::TestCase` |
| Action Cable connections | `ActionCable::Connection::TestCase` |

---

# Chapter 4: Test Structure

## 4.1 Directory Organisation

```
test/
├── controllers/          # Controller tests (ActionDispatch::IntegrationTest)
├── models/               # Model tests
│   └── concerns/         # Concern tests (if tested independently)
├── jobs/                 # Background job tests
├── mailers/              # Mailer tests
├── channels/             # Action Cable channel tests
├── integration/          # Multi-component workflow tests
├── system/               # Full-stack browser tests (minimal)
├── helpers/              # View helper tests
├── views/                # View partial tests (ActionView::TestCase)
├── fixtures/             # Test data (YAML)
├── test_helpers/         # Shared test helper modules
└── test_helper.rb        # Global test configuration
```

## 4.2 Naming Conventions

**File naming:**

- `{model_name}_test.rb` for models
- `{controller_name}_controller_test.rb` for controllers
- `{job_name}_job_test.rb` for jobs
- `{mailer_name}_mailer_test.rb` for mailers

**Test naming** — use descriptive names that read like documentation:

```ruby
test "#first_comment? when there are no comments returns false" do
  # ...
end

test ".active when all records are archived returns empty collection" do
  # ...
end

test "user can create project when authenticated" do
  # ...
end
```

Pattern: `test "{method/feature} - {scenario} - {expected outcome}"`

For instance methods: `test "#method_name scenario description"`
For class methods and scopes: `test ".method_name when condition"`

## 4.3 Test Independence

- Every test must run in isolation and pass in any order.
- No shared mutable state between tests.
- Use `setup` and `teardown` for per-test state:

```ruby
class ArticlesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @article = articles(:one)
  end

  teardown do
    Rails.cache.clear
  end

  test "should show article" do
    get article_url(@article)
    assert_response :success
  end
end
```

- Use `travel_to` to freeze time whenever assertions depend on date or time logic. Reset with `travel_back` in teardown, or use the block form: `travel_to(time) { ... }`.
- Tests must pass when run in parallel.

## 4.4 Test File Size

Keep test files under 500 lines. Split large files by concern:

- `project_test.rb` — core functionality
- `project_validations_test.rb` — validations
- `project_scopes_test.rb` — scopes

---

# Chapter 5: Test Data

## 5.1 Fixtures (Primary Strategy)

Fixtures are the primary test data source. They are database-independent YAML files stored in `test/fixtures/` — one file per model.

Rails automatically loads all fixtures before each test run and wraps each test in a transaction that rolls back after completion, so each test starts with a clean, predictable state.

**Fixture guidelines:**

- Keep fixtures minimal: one or two happy-case records and one or two failure-case records. Create everything else inline.
- Use associations by name, not by id:

```yaml
# test/fixtures/articles.yml
first:
  title: Welcome to Rails!
  category: web_frameworks
```

- Use ERB for dynamic values:

```yaml
recent:
  created_at: <%= 2.days.ago %>
```

- Name fixtures descriptively: `users(:admin)`, `projects(:active_discovery)`.
- Update fixtures when migrations add required columns.

**Accessing fixtures in tests:**

```ruby
user = users(:david)
users(:david, :steve)   # returns an array
```

## 5.2 Inline Record Creation

Create records inline when:

- Data is specific to a single test.
- Testing edge cases or boundary conditions.
- Building states that don't generalise across tests.

Prefer building unsaved objects (`Model.new`) when persistence is not required:

```ruby
test "project cannot have duplicate phases" do
  project = projects(:standard)
  project.phases.create!(name: "Discovery")

  duplicate = project.phases.build(name: "Discovery")
  refute duplicate.valid?
  assert_includes duplicate.errors[:name], "has already been taken"
end
```

## 5.3 Factories

This project uses fixtures, not factories (FactoryBot). Do not introduce FactoryBot.

## 5.4 Test Isolation and Transactions

Rails automatically wraps each test in a database transaction that is rolled back after the test completes. This keeps tests independent without needing explicit cleanup.

```ruby
class MyTest < ActiveSupport::TestCase
  test "newly created users are active by default" do
    # This user is not visible to other tests
    assert User.create.active?
  end
end
```

System tests use `truncation` instead of transactions (required for JavaScript tests — slower but necessary).

To opt out of transactions for a specific test case (e.g. when testing parallel transactions):

```ruby
class WorkerTest < ActiveSupport::TestCase
  self.use_transactional_tests = false
  # Remember to clean up created data manually
end
```

---

# Chapter 6: Writing Tests

## 6.1 Core Principles

**1. Focus on behaviour, not implementation**

Test what the code does, not how it does it. Assert on outcomes and side effects, not internal method calls. Never test private methods directly — test through the public interface.

**2. One test, one concept**

Each test verifies a single behaviour or scenario. If a test has multiple unrelated assertions, split it. Multiple assertions in the same test are fine when they all describe the same observable outcome (e.g. checking several attributes of a persisted record).

**3. Arrange–Act–Assert**

```ruby
test "user can create project with valid attributes" do
  # Arrange
  user = users(:standard_user)
  company = companies(:base_company)

  # Act
  project = user.projects.create(name: "New Project", company: company)

  # Assert
  assert project.persisted?
  assert_equal "New Project", project.name
  assert_equal user, project.creator
end
```

**4. Use the most specific assertion available**

Prefer `assert_equal expected, actual` over `assert actual == expected`. Use `refute` instead of `assert_not` when it reads more naturally.

**5. Test names read like documentation**

Include the scenario and expected outcome. Avoid generic names like `test_valid` or `test_1`.

## 6.2 Assertion Patterns

**Equality and truthiness:**

```ruby
assert_equal expected, actual
assert user.admin?
refute user.suspended?
assert_nil project.deleted_at
```

**Collections:**

```ruby
assert_includes collection, item
refute_includes collection, item
assert_empty collection
refute_empty collection
```

**Changes:**

```ruby
assert_difference "Project.count", 1 do
  Project.create!(name: "Test")
end

assert_changes "project.status", from: "pending", to: "open" do
  project.update(status: "open")
end

assert_no_difference "User.count" do
  User.create(email: "invalid")  # won't save due to validation
end
```

**Errors and exceptions:**

```ruby
assert_raises ActiveRecord::RecordNotFound do
  Project.find(999_999)
end

error = assert_raises CustomError do
  service.perform!
end
assert_match(/expected pattern/, error.message)
```

**Background jobs:**

```ruby
assert_enqueued_with job: WelcomeEmailJob, args: [user] do
  user.confirm!
end

assert_enqueued_jobs 2, only: SendNotificationJob do
  project.notify_team
end
```

**HTTP responses:**

```ruby
assert_response :success
assert_response :redirect
assert_redirected_to project_path(project)
assert_response :not_found
```

**View assertions:**

```ruby
assert_dom "h1", "Project Dashboard"
assert_dom "form[action=?]", projects_path
```

**N+1 detection (built-in, no gems required):**

```ruby
assert_queries_count(3) do
  project.members.map(&:name)
end
```

## 6.3 Common Model Patterns

**Validations:**

```ruby
test "project requires name" do
  project = Project.new(name: nil)
  refute project.valid?
  assert_includes project.errors[:name], "can't be blank"
end

test "project with valid attributes is valid" do
  project = Project.new(name: "Test", company: companies(:base_company))
  assert project.valid?
end
```

**Callbacks:**

```ruby
test "creating user generates authentication token" do
  user = User.create!(email: "test@example.com", password: "password")
  refute_nil user.authentication_token
end
```

**Scopes:**

```ruby
test ".active returns only non-archived projects" do
  active = projects(:active_project)
  archived = projects(:archived_project)

  result = Project.active

  assert_includes result, active
  refute_includes result, archived
end
```

## 6.4 Controller Test Patterns

```ruby
# Authentication redirect
test "requires authentication" do
  get projects_path
  assert_response :redirect
  assert_redirected_to login_path
end

# Authorisation
test "admin can access admin dashboard" do
  sign_in users(:admin)
  get admin_dashboard_path
  assert_response :success
end

# CRUD
test "creates record with valid params" do
  sign_in users(:admin)

  assert_difference "Project.count", 1 do
    post projects_path, params: { project: { name: "New Project" } }
  end

  assert_redirected_to project_path(Project.last)
end

# Flash
test "shows success notice after creating article" do
  assert_difference "Article.count" do
    post articles_url, params: { article: { title: "Hello", body: "World" } }
  end
  assert_equal "Article was successfully created.", flash[:notice]
end
```

## 6.5 What Not to Test

**Don't test:**

- Rails framework behaviour (e.g. `has_many` creates association methods, default enum scopes).
- Trivial delegations with no business logic.
- Third-party library internals.
- Implementation details (private methods, internal state).
- Database constraints that duplicate application-level validation already tested.

**Do test:**

- Custom business logic added to associations or callbacks.
- Enum state transitions with application-level side effects.
- Delegations that transform or validate data.
- Integration points with external services (mocked at the HTTP boundary).
- Public interfaces and their contracts (including raised exceptions).

---

# Chapter 7: CI and Maintenance

## 7.1 Local vs CI Execution

**Local development:**

```bash
bin/rails test test/models/project_test.rb       # single file
bin/rails test test/models/project_test.rb:42    # specific line
bin/rails test --fail-fast                        # stop on first failure
bin/rails test                                    # full suite (no system tests)
bin/rails test:system                             # system tests only
bin/rails test:all                                # everything including system tests
```

**CI:**

- All tests run on every push.
- Tests must pass before merging to `main`.
- No exceptions for "known failures".

## 7.2 Parallel Test Execution

Configure parallel testing in `test/test_helper.rb`:

```ruby
class ActiveSupport::TestCase
  parallelize(workers: :number_of_processors)
end
```

Override per-run with an environment variable:

```bash
PARALLEL_WORKERS=4 bin/rails test
```

Active Record automatically creates per-worker databases (e.g. `test-database-0`, `test-database-1`).

To enable work-stealing for better load balance:

```ruby
parallelize(workers: :number_of_processors, work_stealing: true)
```

**Requirements for parallel tests:**

- Tests must be order-independent.
- No shared global state.
- Use `travel_to` to stabilise time-sensitive tests.
- Use explicit `order` on queries where result ordering matters.

## 7.3 Database Setup on CI

```yaml
# .github/workflows/test.yml
- name: Setup Database
  run: |
    bin/rails db:create RAILS_ENV=test
    bin/rails db:schema:load RAILS_ENV=test
```

Use `db:schema:load` rather than `db:migrate` — it is faster and reliable. Only run migrations when testing migration logic itself.

If schema is out of date:

```bash
bin/rails test:db   # rebuilds the test database from schema
```

## 7.4 Flaky Test Policy

- Flaky tests must be fixed immediately — intermittent failures are treated as failures.
- Do not re-run failed tests automatically.
- Identify and fix the root cause.

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| Time-dependent assertions | Use `travel_to` to freeze time |
| Unordered AR queries | Add explicit `.order` |
| Random data | Use fixtures or fixed seeds |
| Async operations | Use `perform_enqueued_jobs` |

To reproduce a flaky parallel test, re-run with the same seed and worker count:

```bash
bin/rails test --seed 12345
PARALLEL_WORKERS=4 bin/rails test --seed 12345
```

## 7.5 Test Maintenance

- Update tests whenever features change.
- Remove irrelevant tests early — stale tests are noise.
- Convert overly specific regression tests into general ones as domain understanding improves.
- Profile slow tests with `bin/rails test --profile` before optimising.
- Watch for flakiness from unordered AR queries and time/date handling.

---

# Chapter 8: Appendix — Quick Reference

## A.1 Model Patterns

```ruby
# Validation
test "requires attribute" do
  record = Model.new(attribute: nil)
  refute record.valid?
  assert_includes record.errors[:attribute], "can't be blank"
end

# Scope
test ".active excludes archived records" do
  assert_includes Model.active, records(:active)
  refute_includes Model.active, records(:archived)
end

# Callback
test "before_create sets token" do
  record = Model.create!(name: "Test")
  refute_nil record.token
end

# Exception contract
test "find! raises RecordNotFound" do
  assert_raises(ActiveRecord::RecordNotFound) { Model.find(0) }
end
```

## A.2 Controller Patterns

```ruby
# Authentication redirect
test "requires authentication" do
  get projects_path
  assert_redirected_to login_path
end

# Create success
test "creates record with valid params" do
  sign_in users(:admin)
  assert_difference "Project.count" do
    post projects_path, params: { project: { name: "New" } }
  end
  assert_redirected_to project_path(Project.last)
end

# Create failure
test "does not create record with invalid params" do
  sign_in users(:admin)
  assert_no_difference "Project.count" do
    post projects_path, params: { project: { name: "" } }
  end
  assert_response :unprocessable_entity
end
```

## A.3 Job Patterns

```ruby
# Job in isolation
class CleanupJobTest < ActiveJob::TestCase
  test "removes orphaned records" do
    perform_enqueued_jobs do
      CleanupJob.perform_later
    end
    assert_equal 0, OrphanedRecord.count
  end
end

# Job enqueuing from calling code
test "confirming user enqueues welcome email job" do
  assert_enqueued_with job: WelcomeEmailJob, args: [users(:david)] do
    users(:david).confirm!
  end
end

# Multiple jobs
test "notifying team enqueues correct number of jobs" do
  assert_enqueued_jobs 3, only: NotificationJob do
    project.notify_team
  end
end
```

## A.4 Mailer Patterns

```ruby
# Unit test
class WelcomeMailerTest < ActionMailer::TestCase
  test "welcome email is addressed correctly" do
    email = WelcomeMailer.welcome(users(:david))

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal ["david@example.com"], email.to
    assert_equal "Welcome!", email.subject
    assert_includes email.body.to_s, "Hello David"
  end
end

# Functional: triggered by an action
test "registration sends welcome email" do
  assert_emails 1 do
    post users_path, params: { user: { email: "new@example.com", password: "secret" } }
  end
end

# deliver_later
test "confirmation enqueues welcome email" do
  assert_enqueued_email_with WelcomeMailer, :welcome, args: [users(:david)] do
    WelcomeMailer.welcome(users(:david)).deliver_later
  end
end
```

## A.5 Action Cable Patterns

```ruby
# Channel subscription
class NotificationsChannelTest < ActionCable::Channel::TestCase
  test "subscribes and streams for user" do
    stub_connection current_user: users(:david)
    subscribe
    assert subscription.confirmed?
    assert_has_stream_for users(:david)
  end
end

# Broadcast from a job
class ChatRelayJobTest < ActiveJob::TestCase
  include ActionCable::TestHelper

  test "broadcasts message to room" do
    room = rooms(:general)
    assert_broadcast_on(ChatChannel.broadcasting_for(room), text: "Hello") do
      ChatRelayJob.perform_now(room, "Hello")
    end
  end
end
```

## A.6 Migration Testing Pattern

Only test migrations that transform, backfill, or derive data. Skip migrations that only add/remove columns, add indexes, or change column properties.

```ruby
# test/support/migration_test_helper.rb
module MigrationTestHelper
  def run_migration_up(version)
    ActiveRecord::Migration.suppress_messages do
      ActiveRecord::MigrationContext.new("db/migrate").up(version)
    end
  end

  def run_migration_down(version)
    ActiveRecord::Migration.suppress_messages do
      ActiveRecord::MigrationContext.new("db/migrate").down(version)
    end
  end
end
```

```ruby
class BackfillProjectStatusTest < ActiveSupport::TestCase
  include MigrationTestHelper

  MIGRATION_VERSION = 20250115123456

  setup do
    run_migration_down(MIGRATION_VERSION)
    # Insert data in old schema using raw SQL
    ActiveRecord::Base.connection.execute(
      "INSERT INTO projects (name, company_id, created_at, updated_at) VALUES ('Old Project', 1, NOW(), NOW())"
    )
  end

  test "backfills status for existing projects" do
    run_migration_up(MIGRATION_VERSION)
    assert_equal "pending", Project.find_by(name: "Old Project").status
  end

  teardown do
    run_migration_up(MIGRATION_VERSION)
  end
end
```

---

_This document follows the official Rails Testing Guide as its authoritative reference. When in doubt, consult `resource-for-ruby/rails-guides/testing.md`._
