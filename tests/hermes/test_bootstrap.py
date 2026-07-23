import os
import sys
import importlib
import pytest

sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../.hermes-plugin")
))

BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for hermes"


def _load():
    if "__init__" in sys.modules:
        del sys.modules["__init__"]
    return importlib.import_module("__init__")


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


class TestGetBootstrap:
    def test_returns_none_when_skill_file_missing(self, tmp_path):
        m = _load()
        m._bootstrap_cache = None
        m._SKILLS_DIR = str(tmp_path / "nonexistent")
        assert m._get_bootstrap() is None

    def test_caches_false_on_missing_file(self, tmp_path):
        m = _load()
        m._bootstrap_cache = None
        m._SKILLS_DIR = str(tmp_path / "nonexistent")
        m._get_bootstrap()
        assert m._bootstrap_cache is False

    def test_returns_string_with_real_skill(self):
        m = _load()
        m._bootstrap_cache = None
        result = m._get_bootstrap()
        assert result is not None
        assert isinstance(result, str)

    def test_same_object_returned_on_second_call(self):
        m = _load()
        m._bootstrap_cache = None
        r1 = m._get_bootstrap()
        r2 = m._get_bootstrap()
        assert r1 is r2

    def test_contains_marker(self):
        m = _load()
        m._bootstrap_cache = None
        result = m._get_bootstrap()
        assert BOOTSTRAP_MARKER in result

    def test_contains_extremely_important_wrapper(self):
        m = _load()
        m._bootstrap_cache = None
        result = m._get_bootstrap()
        assert result.startswith("<EXTREMELY_IMPORTANT>")
        assert result.rstrip().endswith("</EXTREMELY_IMPORTANT>")

    def test_frontmatter_absent_from_output(self):
        m = _load()
        m._bootstrap_cache = None
        result = m._get_bootstrap()
        assert "---\nname:" not in result
