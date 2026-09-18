### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `parse.ParseError(line, message)` from Task 1.
- Produces:
  - `rules.Rule` — type alias `tuple[str, str]`, the substring (already lowercased) and the category.
  - `rules.parse_rules(text: str) -> list[Rule]` — rules in file order, raises `ParseError`.
  - `rules.categorize(description: str, rules: list[Rule]) -> str | None` — the category of the first rule whose substring appears in the description, case-insensitively; `None` if none match.

**Pinned decisions:**
- Blank and whitespace-only lines are ignored; they do not become rules and do not shift the line numbers of later rules.
- A line is split on its **first** `=`, so `a=b=c` is substring `a`, category `b=c`.
- Substring and category are stripped of surrounding whitespace; the substring is lowercased for matching, the category is kept verbatim.
- Exact `message` values: `rule has no '='`, `rule has an empty substring`, `rule has an empty category`.
- No comment syntax — `#` has no special meaning.

- [ ] **Step 1: Write the failing tests**

`test_rules.py`:

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_lowercases_substring_and_strips_whitespace(self):
        self.assertEqual(parse_rules("  Coffee = food  \n"), [("coffee", "food")])

    def test_blank_lines_are_ignored(self):
        self.assertEqual(
            parse_rules("\ncoffee=food\n   \n\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_splits_on_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_line_without_equals_reports_its_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\nrent housing\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "rule has no '='")

    def test_empty_substring_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n")
        self.assertEqual(caught.exception.message, "rule has an empty substring")

    def test_empty_category_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=\n")
        self.assertEqual(caught.exception.message, "rule has an empty category")


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("BIG COFFEE Co", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("shop", "retail")]
        self.assertEqual(categorize("coffee shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `Rule`, `parse_rules`, and `categorize` in `ledgerlite/rules.py`**

`parse_rules` iterates `enumerate(text.splitlines(), start=1)`, skips lines that are empty after stripping, and uses `str.partition("=")` to apply the pinned split and validation.

`categorize` lowercases the description once, then returns the first rule's category whose substring is `in` it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and categorization"
```
