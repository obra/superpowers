import importlib
import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../.hermes-plugin")
))

BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for hermes"

# Hermes spills injected context over 10,000 chars to a file, which breaks
# inline injection semantics. The bootstrap must stay under it with margin.
HERMES_CONTEXT_SPILL_LIMIT = 10_000


def _load():
    if "__init__" in sys.modules:
        del sys.modules["__init__"]
    return importlib.import_module("__init__")


def _bootstrap():
    m = _load()
    return m._build_bootstrap(m._skills_dir())


class TestStripFrontmatter:
    def test_strips_yaml_block(self):
        m = _load()
        content = "---\nname: foo\ndescription: bar\n---\n# Body\nContent here"
        assert m._strip_frontmatter(content) == "# Body\nContent here"

    def test_no_frontmatter_returns_trimmed_content(self):
        m = _load()
        content = "# No frontmatter\nJust content"
        assert m._strip_frontmatter(content) == "# No frontmatter\nJust content"

    def test_strips_surrounding_whitespace_from_body(self):
        m = _load()
        content = "---\nname: foo\n---\n\n\n# Body\n\n"
        assert m._strip_frontmatter(content) == "# Body"


class TestSkillsDirResolution:
    def test_repo_layout_resolves(self):
        # The repo checkout IS the git-clone layout: .hermes-plugin/ and
        # skills/ are siblings, so resolution must succeed from here.
        m = _load()
        skills = m._skills_dir()
        assert os.path.isfile(
            os.path.join(skills, "using-superpowers", "SKILL.md")
        )


class TestBootstrapContent:
    def test_marker_and_wrapper(self):
        content = _bootstrap()
        assert BOOTSTRAP_MARKER in content
        assert content.startswith("<EXTREMELY_IMPORTANT>")
        assert content.rstrip().endswith("</EXTREMELY_IMPORTANT>")

    def test_contains_using_superpowers_body(self):
        content = _bootstrap()
        # A distinctive line from the skill body proves the real SKILL.md was
        # embedded, not a stub.
        assert "You have superpowers" in content
        assert "## The Rule" in content

    def test_frontmatter_stripped(self):
        content = _bootstrap()
        assert "---\nname:" not in content

    def test_tool_mapping_sourced_from_reference_file(self):
        m = _load()
        content = _bootstrap()
        ref = os.path.join(
            m._skills_dir(), "using-superpowers", "references", "hermes-tools.md"
        )
        with open(ref, encoding="utf-8") as f:
            ref_text = f.read().strip()
        # The mapping is included verbatim from the reference file — the
        # single source, not a drift-prone inline copy.
        assert ref_text in content
        assert "read_file" in content

    def test_skill_view_guidance_present(self):
        content = _bootstrap()
        assert 'skill_view("superpowers:brainstorming")' in content

    def test_under_hermes_context_spill_limit(self):
        content = _bootstrap()
        assert len(content) < HERMES_CONTEXT_SPILL_LIMIT, (
            f"bootstrap is {len(content)} chars; hermes spills injected "
            f"context over {HERMES_CONTEXT_SPILL_LIMIT} to a file, which "
            "breaks inline injection"
        )
