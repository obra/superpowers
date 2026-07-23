import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_ctx():
    ctx = MagicMock()
    ctx._hooks = {}
    ctx._injected = []

    def register_hook(event, fn):
        ctx._hooks[event] = fn

    def inject_message(content, role="user"):
        ctx._injected.append({"content": content, "role": role})

    ctx.register_hook.side_effect = register_hook
    ctx.inject_message.side_effect = inject_message
    return ctx
