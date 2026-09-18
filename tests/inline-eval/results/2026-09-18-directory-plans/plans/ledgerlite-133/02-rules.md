### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ledgerlite.rules.Rule = tuple[str, str]` — a `(substring, category)` pair. The substring is stored lowercased so matching needs no repeated case folding.
  - `ledgerlite.rules.parse_rules(text: str) -> list[Rule]` — rules in file order.
  - `ledgerlite.rules.categorize(description: str, rules: list[Rule]) -> str | None` — the category of the first rule whose substring appears in the description, case-insensitively; `None` if none match.

Decisions this task pins (the spec is silent): a line is skipped when it is blank, whitespace-only, or contains no `=`; the split is on the **first** `=`, so a substring may not contain `=` but a category may — `coffee=food=drink` yields `("coffee", "food=drink")`; surrounding whitespace is stripped from both sides; a rule with an empty substring or empty category is skipped.

- [ ] **Step 1: Write the failing tests**

```python
# test_rules.py
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_substring_is_lowercased_and_whitespace_stripped(self):
        self.assertEqual(parse_rules("  Coffee Shop = food  \n"), [("coffee shop", "food")])

    def test_blank_and_unparseable_lines_are_skipped(self):
        text = "coffee=food\n\n   \nnonsense\nrent=housing\n"
        self.assertEqual(parse_rules(text), [("coffee", "food"), ("rent", "housing")])

    def test_empty_substring_or_category_is_skipped(self):
        self.assertEqual(parse_rules("=food\ncoffee=\n"), [])

    def test_splits_on_first_equals(self):
        self.assertEqual(parse_rules("coffee=food=drink\n"), [("coffee", "food=drink")])

    def test_empty_text_has_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("COFFEE SHOP #4", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        rules = [("shop", "shopping"), ("coffee", "food")]
        self.assertEqual(categorize("Coffee Shop", rules), "shopping")

    def test_no_match_is_none(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_no_rules_is_none(self):
        self.assertIsNone(categorize("Coffee Shop", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `Rule`, `parse_rules(text: str) -> list[Rule]`, and `categorize(description: str, rules: list[Rule]) -> str | None` in `ledgerlite/rules.py`**

`categorize` lowercases the description once and returns the first rule whose substring is `in` it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```
