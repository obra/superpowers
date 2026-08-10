from pathlib import Path

import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_ctx():
    ctx = MagicMock()
    ctx._hooks = {}
    ctx._skills = {}

    def register_hook(event, fn):
        ctx._hooks[event] = fn

    def register_skill(name, path):
        # Mimic hermes' real register_skill, which calls path.exists() and
        # therefore breaks on a str (the bug that silently disabled the whole
        # plugin, found 2026-07-23). Keeping that fidelity here means a
        # regression to str paths fails these tests instead of failing
        # silently inside hermes.
        if not isinstance(path, Path):
            raise AttributeError(
                f"register_skill requires a pathlib.Path, got {type(path).__name__}"
            )
        ctx._skills[name] = path

    ctx.register_hook.side_effect = register_hook
    ctx.register_skill.side_effect = register_skill
    return ctx
