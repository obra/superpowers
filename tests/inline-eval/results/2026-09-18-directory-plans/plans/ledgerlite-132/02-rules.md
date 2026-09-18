### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — one `(substring, category)` pair per rule line, in file order. Blank lines (and whitespace-only lines) are skipped; a line with no `=` is skipped; the split is at the *first* `=`, so the substring may not contain `=` but the category may; substring and category are stripped of surrounding whitespace.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — the category of the first rule whose substring occurs in `description`, compared case-insensitively; `None` when no rule matches.

- [ ] **Step 1: Write the failing tests**

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_skips_blank_and_whitespace_only_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n"), [("coffee", "food")])

    def test_skips_lines_without_an_equals_sign(self):
        self.assertEqual(parse_rules("nonsense\ncoffee=food\n"), [("coffee", "food")])

    def test_splits_at_the_first_equals_sign(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_empty_text_has_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("COFFEE SHOP 41", self.RULES), "food")
        self.assertEqual(categorize("Monthly Rent", self.RULES), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "treats")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

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

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

Split the text with `str.splitlines()`; split each rule with `line.split("=", 1)`. In `categorize`, lower-case the description once and compare against lower-cased substrings.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: rules file parsing and description categorization"
```
