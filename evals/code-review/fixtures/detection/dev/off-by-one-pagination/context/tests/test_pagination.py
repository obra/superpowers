# tests/test_pagination.py
# Existing tests cover the empty-list case and the page<1 error case.
# There is NO test that asserts page contents against expected items,
# so the off-by-one will not be caught by CI.

from src.pagination import paginate


def test_page_size_one_returns_empty_or_first():
    # This test happens to pass even with the bug, because items[0:0] is empty.
    p = paginate([], 1, 10)
    assert p.items == []


def test_invalid_page_raises():
    import pytest
    with pytest.raises(ValueError):
        paginate([1, 2, 3], 0, 10)
