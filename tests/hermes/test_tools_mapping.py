import os
import re

import pytest

# The Hermes tool mapping is injected verbatim into the session bootstrap, so
# stale tool names in it become invalid tool calls. Pin the corrected tokens
# and forbid the stale ones reported in issue #2157.
_REFERENCE_FILE = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../../skills/using-superpowers/references/hermes-tools.md",
    )
)


@pytest.fixture(scope="module")
def mapping_text():
    with open(_REFERENCE_FILE, encoding="utf-8") as f:
        return f.read()


class TestHermesToolMapping:
    def test_qualified_skill_identifier_present(self, mapping_text):
        assert 'skill_view("superpowers:brainstorming")' in mapping_text

    def test_no_toolset_restriction_parameter(self, mapping_text):
        # Current Hermes delegate_task exposes no toolset-restriction
        # parameter; subagents inherit the parent session's toolsets.
        assert "toolsets=[" not in mapping_text
        assert "enabled_toolsets=" not in mapping_text

    def test_no_unqualified_skill_view_examples(self, mapping_text):
        # Plugin skills are runtime-registered under the superpowers: prefix;
        # an unqualified skill_view(...) fails with "Skill not found".
        assert re.search(r'skill_view\("(?!superpowers:)', mapping_text) is None
