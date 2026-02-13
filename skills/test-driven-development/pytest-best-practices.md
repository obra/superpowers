# Pytest Best Practices

## Import Mode

Use `importlib` import mode — [recommended by pytest for new projects](https://docs.pytest.org/en/7.1.x/explanation/goodpractices.html#choosing-an-import-mode). Add to `pyproject.toml`:

```toml
[tool.pytest.ini_options]
addopts = [
    "--import-mode=importlib",
]
```

**Why:** With `importlib` mode, pytest does not modify `sys.path` or `sys.modules`. This eliminates the need for `__init__.py` files in `tests/` and avoids subtle import side-effects that the legacy `prepend` mode causes (e.g., leaking your source package into `sys.path`).

## Test Directory Structure

Use the `src` layout with tests in a **sibling directory**. Mirror the source directory structure, with each test file named after its corresponding source file prefixed with `test_`.

```
project/
├── pyproject.toml
├── src/
│   └── mypkg/
│       ├── __init__.py
│       ├── orders/
│       │   ├── __init__.py
│       │   ├── repository.py
│       │   ├── service.py
│       │   └── validators.py
│       ├── payments/
│       │   ├── __init__.py
│       │   ├── gateway.py
│       │   └── processor.py
│       └── auth/
│           ├── __init__.py
│           ├── login.py
│           └── tokens.py
├── tests/
│   ├── conftest.py
│   ├── orders/
│   │   ├── test_repository.py
│   │   ├── test_service.py
│   │   └── test_validators.py
│   ├── payments/
│   │   ├── test_gateway.py
│   │   └── test_processor.py
│   └── auth/
│       ├── test_login.py
│       └── test_tokens.py
```

**Rules:**
- `tests/` sits next to `src/`, never inside it
- Directory structure under `tests/` mirrors `src/` exactly
- Test file for `src/mypkg/orders/repository.py` → `tests/orders/test_repository.py`
- **No `__init__.py` in `tests/`** — with `--import-mode=importlib`, pytest resolves imports without them
- Shared test fixtures go in `tests/conftest.py` (or subdirectory-level `conftest.py` for scoped fixtures)
- Install the package in editable mode: `pip install -e .`

**Legacy `prepend` mode (existing projects):** If you cannot switch to `importlib` mode, add `__init__.py` to `tests/` and every subdirectory — this is needed so pytest can distinguish `tests/orders/test_view.py` from `tests/payments/test_view.py`. Be aware this causes pytest to prepend the repo root to `sys.path`, making your source importable without installation.

**Why this structure:**
- Finding the test for any source file is instant — same path, `test_` prefix
- Adding a new source file? You know exactly where the test file goes
- CI can enforce coverage per-directory
- Refactoring source structure means moving tests in the same way

## Group Tests in Classes

Organize unit tests into **test classes** — not free functions scattered across the file.

**Why classes, not loose functions:**
- **Logical grouping** — tests for one unit live together
- **Subclassing** — shared setup and test inheritance across related test suites
- **Single parameterization** — `@pytest.mark.parametrize` on the class applies to every method inside it

<Good>
```python
@pytest.mark.parametrize("backend", ["sqlite", "postgres"])
class TestOrderRepository:
    """All tests run against both backends via single class-level parametrize."""

    def test_creates_order(self, backend):
        repo = make_repo(backend)
        order = repo.create(item="widget", qty=1)
        assert repo.get(order.id).item == "widget"

    def test_rejects_duplicate_id(self, backend):
        repo = make_repo(backend)
        repo.create(id="ORD-1", item="widget", qty=1)
        with pytest.raises(DuplicateOrderError):
            repo.create(id="ORD-1", item="gadget", qty=2)

    def test_lists_by_status(self, backend):
        repo = make_repo(backend)
        repo.create(item="a", qty=1, status="pending")
        repo.create(item="b", qty=2, status="shipped")
        assert len(repo.list_by_status("pending")) == 1
```
One `parametrize` on the class — every test method gets both backends. Group is obvious. Subclass to add DB-specific tests.
</Good>

<Bad>
```python
def test_creates_order_sqlite():
    ...

def test_creates_order_postgres():
    ...

def test_rejects_duplicate_id_sqlite():
    ...

def test_rejects_duplicate_id_postgres():
    ...
```
Duplicated per-backend. No grouping. No way to subclass shared behavior.
</Bad>

**Subclassing for shared behavior:**

```python
class TestBaseCache:
    """Shared tests any cache implementation must pass."""

    def make_cache(self):
        raise NotImplementedError

    def test_stores_and_retrieves(self):
        cache = self.make_cache()
        cache.set("k", "v")
        assert cache.get("k") == "v"

    def test_returns_none_for_missing_key(self):
        cache = self.make_cache()
        assert cache.get("missing") is None


class TestRedisCache(TestBaseCache):
    def make_cache(self):
        return RedisCache(host="localhost")


class TestInMemoryCache(TestBaseCache):
    def make_cache(self):
        return InMemoryCache()
```

Both `TestRedisCache` and `TestInMemoryCache` inherit and run all shared tests. Add implementation-specific tests by adding methods to the subclass.

**Rules:**
- One class per unit under test (e.g., `TestOrderRepository`, `TestEmailValidator`)
- Class name starts with `Test` (pytest discovery)
- No `__init__` method (pytest requirement)
- Use fixtures or factory methods for setup, not `setUp`/`tearDown`
- Class-level `@pytest.mark.parametrize` for cross-cutting variations (backends, configs, modes)
