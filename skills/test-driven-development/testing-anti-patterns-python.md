# Testing Anti-Patterns (Python Backend)

**Load this reference when:** writing or changing tests, adding mocks, or tempted to add test-only methods to production code.

## Overview

Tests must verify real behavior, not mock behavior. Mocks are a means to isolate, not the thing being tested.

**Core principle:** Test what the code does, not what the mocks do.

**Following strict TDD prevents these anti-patterns.**

## The Iron Laws

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## Anti-Pattern 1: Testing Mock Behavior

**The violation:**
```python
# ❌ BAD: Testing that the mock was called, not actual behavior
def test_user_service_creates_user(mocker):
    mock_repo = mocker.patch('app.services.user_service.UserRepository')
    
    service = UserService()
    service.create_user("alice@example.com")
    
    # This only tests the mock was called, not that a user was created!
    mock_repo.return_value.save.assert_called_once()
```

**Why this is wrong:**
- You're verifying the mock works, not that the service works
- Test passes when mock is called, tells you nothing about real behavior
- Real repository could be broken and this test still passes

**The fix:**
```python
# ✅ GOOD: Test actual behavior with real or in-memory repository
def test_user_service_creates_user(db_session):
    repo = UserRepository(db_session)
    service = UserService(repo)
    
    user = service.create_user("alice@example.com")
    
    # Assert on actual state
    assert user.email == "alice@example.com"
    assert db_session.query(User).filter_by(email="alice@example.com").first() is not None
```

**HTTP client example:**
```python
# ❌ BAD: Testing that you called requests.get
def test_fetches_weather(mocker):
    mock_get = mocker.patch('requests.get')
    mock_get.return_value.json.return_value = {"temp": 20}
    
    result = get_weather("London")
    
    mock_get.assert_called_with("https://api.weather.com/London")  # Testing the mock!

# ✅ GOOD: Test the transformation/business logic
def test_fetches_weather(responses):  # using responses library
    responses.add(
        responses.GET,
        "https://api.weather.com/London",
        json={"temperature_celsius": 20, "humidity": 65}
    )
    
    result = get_weather("London")
    
    # Test YOUR code's behavior, not that HTTP happened
    assert result.temp_fahrenheit == 68  # Conversion logic tested
    assert result.is_humid is True
```

### Gate Function

```
BEFORE using assert_called, assert_called_once, assert_called_with:
  Ask: "Am I testing real behavior or just that a mock was invoked?"

  IF testing mock invocation only:
    STOP - Test actual outcomes instead (state, return values, side effects)

  Test real behavior instead
```

## Anti-Pattern 2: Test-Only Methods in Production

**The violation:**
```python
# ❌ BAD: Test-only method polluting production class
class DatabaseConnection:
    def __init__(self, url: str):
        self.engine = create_engine(url)
        self.session = Session(self.engine)
    
    def reset_for_testing(self):  # DANGER: test-only!
        """Drops all tables - only for tests!"""
        Base.metadata.drop_all(self.engine)
        Base.metadata.create_all(self.engine)


# ❌ BAD: Adding debug/test methods to models
class Order:
    def _set_created_at_for_testing(self, dt):  # Test pollution!
        self.created_at = dt
```

**Why this is wrong:**
- Production class polluted with test-only code
- Dangerous if accidentally called in production
- Violates YAGNI and separation of concerns
- `reset_for_testing()` could destroy production data

**The fix:**
```python
# ✅ GOOD: Test utilities in conftest.py, separate from production
# conftest.py
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.close()
    Base.metadata.drop_all(engine)


# ✅ GOOD: Use factories for test data
# tests/factories.py
import factory

class OrderFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Order
    
    created_at = factory.LazyFunction(datetime.utcnow)
    
    @classmethod
    def create_with_date(cls, created_at, **kwargs):
        return cls.create(created_at=created_at, **kwargs)
```

### Gate Function

```
BEFORE adding any method to production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP - Don't add it
    Put it in conftest.py or tests/factories.py

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP - Wrong class for this method
```

## Anti-Pattern 3: Mocking Without Understanding

**The violation:**
```python
# ❌ BAD: Over-mocking breaks the behavior you're testing
def test_order_total_applies_discount(mocker):
    # Mocking the discount service... but it writes to cache!
    mocker.patch('app.services.discount_service.DiscountService.calculate')
    
    order = Order(items=[Item(price=100)])
    order.apply_discount(user_id=123)
    
    # Test fails mysteriously - discount wasn't cached
    # so subsequent calls behave differently
```

**Why this is wrong:**
- Mocked method had side effect test depended on (caching)
- Over-mocking to "be safe" breaks actual behavior
- Test passes for wrong reason or fails mysteriously

**The fix:**
```python
# ✅ GOOD: Mock at the right level (external API, not your service)
def test_order_total_applies_discount(mocker):
    # Mock the EXTERNAL call, not your service
    mocker.patch(
        'app.clients.discount_api.fetch_user_discount',
        return_value={"percent": 10}
    )
    
    order = Order(items=[Item(price=100)])
    order.apply_discount(user_id=123)
    
    assert order.total == 90  # Your logic runs, external call mocked
```

**Database example:**
```python
# ❌ BAD: Mocking SQLAlchemy query - hides real query bugs
def test_find_active_users(mocker):
    mock_query = mocker.patch.object(Session, 'query')
    mock_query.return_value.filter.return_value.all.return_value = [User(id=1)]
    
    result = find_active_users()
    assert len(result) == 1  # Passes but query could be totally wrong!

# ✅ GOOD: Use real database (in-memory SQLite or testcontainers)
def test_find_active_users(db_session):
    db_session.add(User(id=1, status="active"))
    db_session.add(User(id=2, status="inactive"))
    db_session.commit()
    
    result = find_active_users(db_session)
    
    assert len(result) == 1
    assert result[0].id == 1
```

### Gate Function

```
BEFORE mocking any method:
  STOP - Don't mock yet

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at lower level (the actual slow/external operation)
    NOT the high-level method the test depends on

  IF unsure what test depends on:
    Run test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level

  Red flags:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - mocker.patch() on your own service classes
```

## Anti-Pattern 4: Incomplete Mocks

**The violation:**
```python
# ❌ BAD: Partial mock of API response
def test_process_payment(mocker):
    mocker.patch('app.clients.stripe.create_charge', return_value={
        'id': 'ch_123',
        'status': 'succeeded'
        # Missing: 'balance_transaction', 'receipt_url', 'metadata'
        # Code downstream breaks accessing these!
    })
    
    result = process_payment(amount=1000)
    # Later: KeyError when code tries to log receipt_url
```

**Why this is wrong:**
- **Partial mocks hide structural assumptions** - You only mocked fields you know about
- **Downstream code may depend on fields you didn't include** - Silent failures
- **Tests pass but integration fails** - Mock incomplete, real API complete
- **False confidence** - Test proves nothing about real behavior

**The Iron Rule:** Mock the COMPLETE data structure as it exists in reality.

**The fix:**
```python
# ✅ GOOD: Complete mock matching real API schema
def test_process_payment(mocker):
    mocker.patch('app.clients.stripe.create_charge', return_value={
        'id': 'ch_123',
        'status': 'succeeded',
        'amount': 1000,
        'currency': 'usd',
        'balance_transaction': 'txn_456',
        'receipt_url': 'https://receipt.stripe.com/...',
        'metadata': {},
        'created': 1699999999
    })
    
    result = process_payment(amount=1000)
    assert result.receipt_url is not None
```

**Better: Use Pydantic/dataclass for type safety:**
```python
# ✅ BEST: Schema-enforced mocks
# tests/fixtures/stripe_fixtures.py
from app.schemas import StripeChargeResponse

def make_charge_response(**overrides) -> StripeChargeResponse:
    """Factory that enforces complete schema."""
    defaults = {
        'id': 'ch_test_123',
        'status': 'succeeded',
        'amount': 1000,
        'currency': 'usd',
        'balance_transaction': 'txn_456',
        'receipt_url': 'https://receipt.stripe.com/test',
        'metadata': {},
        'created': 1699999999
    }
    return StripeChargeResponse(**{**defaults, **overrides})


def test_process_payment(mocker):
    mocker.patch(
        'app.clients.stripe.create_charge',
        return_value=make_charge_response(amount=1000)
    )
    result = process_payment(amount=1000)
    assert result.receipt_url is not None
```

### Gate Function

```
BEFORE creating mock responses (dict or object):
  Check: "What fields does the real API response contain?"

  Actions:
    1. Examine actual API response from docs/examples
    2. Include ALL fields system might consume downstream
    3. Use Pydantic/dataclass factories to enforce completeness

  Critical:
    Partial mocks fail silently when code depends on omitted fields
    
  If uncertain: Include all documented fields
```

## Anti-Pattern 5: Mocking datetime Incorrectly

**The violation:**
```python
# ❌ BAD: Patching datetime breaks everything
@patch('datetime.datetime')
def test_token_expires_after_24h(mock_dt):
    mock_dt.now.return_value = datetime(2024, 1, 1, 12, 0)
    # Breaks: datetime is a C extension, weird behavior ensues
    
    token = create_token()
    # TypeError, AttributeError, or silently wrong behavior
```

**Why this is wrong:**
- `datetime` is a C extension, patching it directly causes issues
- Other code using datetime breaks unexpectedly
- Mock doesn't behave like real datetime

**The fix:**
```python
# ✅ GOOD: Use freezegun
from freezegun import freeze_time

@freeze_time("2024-01-01 12:00:00")
def test_token_expires_after_24h():
    token = create_token()
    assert token.expires_at == datetime(2024, 1, 2, 12, 0)


# ✅ ALSO GOOD: Inject time as dependency
def test_token_expires_after_24h():
    fixed_now = datetime(2024, 1, 1, 12, 0)
    token = create_token(now=fixed_now)
    assert token.expires_at == datetime(2024, 1, 2, 12, 0)
```

## Anti-Pattern 6: Async Mock Mistakes

**The violation:**
```python
# ❌ BAD: Forgetting to make mock async
async def test_fetch_user(mocker):
    mocker.patch('app.client.get_user', return_value={"id": 1})
    
    result = await fetch_user(1)  # TypeError: object dict can't be used in 'await'
```

**The fix:**
```python
# ✅ GOOD: Use AsyncMock
from unittest.mock import AsyncMock

async def test_fetch_user(mocker):
    mocker.patch(
        'app.client.get_user',
        new=AsyncMock(return_value={"id": 1})
    )
    
    result = await fetch_user(1)
    assert result["id"] == 1


# ✅ ALSO GOOD: pytest-asyncio + mocker
async def test_fetch_user(mocker):
    mock_get = mocker.patch('app.client.get_user')
    mock_get.return_value = asyncio.coroutine(lambda: {"id": 1})()
    # Or with Python 3.8+:
    mock_get.return_value = AsyncMock(return_value={"id": 1})()
```

## Anti-Pattern 7: Database State Leaking Between Tests

**The violation:**
```python
# ❌ BAD: Tests depend on execution order
def test_create_user(db):
    create_user("alice@test.com")
    assert User.query.count() == 1

def test_list_users(db):
    # Fails if run after test_create_user - finds 2 users!
    create_user("bob@test.com")
    assert User.query.count() == 1  # Actually 2!
```

**Why this is wrong:**
- Tests are not isolated
- Order-dependent failures are hard to debug
- Parallel test execution becomes impossible

**The fix:**
```python
# ✅ GOOD: Transaction rollback per test
@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()  # Clean slate for each test
    connection.close()


# ✅ ALSO GOOD: Use pytest-postgresql or testcontainers
@pytest.fixture(scope="function")
def db_session(postgresql):
    engine = create_engine(postgresql.url())
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.close()
    Base.metadata.drop_all(engine)
```

## Anti-Pattern 8: Patching the Wrong Module Path

**The violation:**
```python
# app/services/user_service.py
from app.clients import email_client

def notify_user(user_id):
    email_client.send(...)

# ❌ BAD: Patching where it's defined, not where it's used
def test_notify_user(mocker):
    mocker.patch('app.clients.email_client.send')  # Wrong!
    notify_user(123)
    # Mock not applied - real email sent!
```

**The fix:**
```python
# ✅ GOOD: Patch where it's imported/used
def test_notify_user(mocker):
    mocker.patch('app.services.user_service.email_client.send')  # Correct!
    notify_user(123)
    # Mock applied correctly
```

**Rule:** Patch where the name is looked up, not where it's defined.

## Quick Reference

| Anti-Pattern | Python Fix |
|--------------|------------|
| `assert_called_once()` only | Test actual state/return values |
| Test-only methods in production | Use `conftest.py` fixtures |
| `mocker.patch('MyService')` | Mock external APIs at boundary |
| Partial mock dicts | Use dataclass/Pydantic factories |
| `@patch('datetime.datetime')` | Use `freezegun` |
| `mocker.patch()` on async | Use `AsyncMock` |
| Shared DB state | Transaction rollback per test |
| Wrong patch path | Patch where imported, not defined |

## Red Flags

- `assert_called` without asserting on actual outcomes
- Methods with `_for_testing` suffix in production code
- `mocker.patch()` on your own service classes
- Mock dicts without checking real API schema
- Tests pass alone, fail when run together
- `@patch('datetime.datetime')` anywhere
- Patch path doesn't match import statement

## Recommended Libraries

| Purpose | Library |
|---------|---------|
| Mocking | `pytest-mock` (wraps unittest.mock) |
| HTTP mocking | `responses`, `httpretty`, `respx` (async) |
| Time freezing | `freezegun` |
| Factories | `factory_boy`, `polyfactory` |
| Database fixtures | `pytest-postgresql`, `testcontainers` |
| Async testing | `pytest-asyncio`, `anyio` |

## The Bottom Line

**Mocks are tools to isolate, not things to test.**

If TDD reveals you're testing mock behavior, you've gone wrong.

Fix: Test real behavior or question why you're mocking at all.
