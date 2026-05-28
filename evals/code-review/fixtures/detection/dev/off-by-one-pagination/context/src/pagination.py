// src/pagination.py — paginate a list of items.

from dataclasses import dataclass
from typing import List, TypeVar

T = TypeVar("T")


@dataclass
class Page:
    items: list
    page: int
    page_size: int
    total: int


def paginate(items: List[T], page: int, page_size: int) -> Page:
    """Return the items for `page` (1-indexed). Returns empty Page beyond end."""
    if page < 1:
        raise ValueError("page must be >= 1")
    if page_size < 1:
        raise ValueError("page_size must be >= 1")
    start = (page - 1) * page_size
    # BUG INTRODUCED IN PR: end was previously `start + page_size`. Now it
    # is `start + page_size - 1`, which drops the last item of each page
    # (Python slicing is end-exclusive).
    end = start + page_size - 1
    return Page(items=items[start:end], page=page, page_size=page_size, total=len(items))
