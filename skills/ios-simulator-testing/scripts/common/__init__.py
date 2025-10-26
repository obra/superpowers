"""
Common utilities shared across iOS simulator scripts.

This module centralizes genuinely reused code patterns to eliminate duplication
while respecting Jackson's Law - no over-abstraction, only truly shared logic.

Organization:
- idb_utils: IDB-specific operations (accessibility tree, element manipulation)
- device_utils: Command building for simctl and IDB
"""

from .device_utils import build_idb_command, build_simctl_command
from .idb_utils import (
    count_elements,
    flatten_tree,
    get_accessibility_tree,
    get_screen_size,
)

__all__ = [
    "build_idb_command",
    "build_simctl_command",
    "count_elements",
    "flatten_tree",
    "get_accessibility_tree",
    "get_screen_size",
]
