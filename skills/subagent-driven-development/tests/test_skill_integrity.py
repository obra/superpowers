"""
Tests for subagent-driven-development skill integrity.

Validates that the SKILL.md and all prompt templates are structurally sound,
cross-references are valid, and the adversarial review system is properly configured.

Run: python -m pytest .codex/skills/subagent-driven-development/tests/ -v
  or: python -m unittest discover -s .codex/skills/subagent-driven-development/tests/ -p 'test_*.py' -v
"""

import os
import re
import unittest
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SKILL_MD = SKILL_DIR / "SKILL.md"


class TestFileExistence(unittest.TestCase):
    """All referenced prompt files must exist."""

    REQUIRED_FILES = [
        "SKILL.md",
        "implementer-prompt.md",
        "spec-reviewer-prompt.md",
        "code-quality-reviewer-prompt.md",
        "tdd-verifier-prompt.md",
        "adversarial-security-prompt.md",
        "adversarial-edge-cases-prompt.md",
        "adversarial-architecture-prompt.md",
        "adversarial-fix-prompt.md",
    ]

    def test_all_required_files_exist(self):
        for filename in self.REQUIRED_FILES:
            filepath = SKILL_DIR / filename
            self.assertTrue(
                filepath.exists(),
                f"Required file missing: {filename}"
            )

    def test_no_empty_files(self):
        for filename in self.REQUIRED_FILES:
            filepath = SKILL_DIR / filename
            if filepath.exists():
                content = filepath.read_text(encoding="utf-8")
                self.assertGreater(
                    len(content.strip()), 50,
                    f"File appears empty or too short: {filename} ({len(content)} chars)"
                )


class TestSkillFrontmatter(unittest.TestCase):
    """SKILL.md must have valid YAML frontmatter."""

    def setUp(self):
        self.content = SKILL_MD.read_text(encoding="utf-8")

    def test_has_frontmatter_delimiters(self):
        self.assertTrue(
            self.content.startswith("---"),
            "SKILL.md must start with --- (YAML frontmatter)"
        )
        # Find closing ---
        second_delimiter = self.content.index("---", 3)
        self.assertGreater(second_delimiter, 3, "Missing closing --- delimiter")

    def test_has_name_field(self):
        match = re.search(r"^name:\s*(.+)$", self.content, re.MULTILINE)
        self.assertIsNotNone(match, "Missing 'name' field in frontmatter")
        self.assertEqual(match.group(1).strip(), "subagent-driven-development")

    def test_has_description_field(self):
        match = re.search(r"^description:\s*(.+)$", self.content, re.MULTILINE)
        self.assertIsNotNone(match, "Missing 'description' field in frontmatter")
        self.assertGreater(len(match.group(1).strip()), 20, "Description too short")


class TestSkillReferencesPrompts(unittest.TestCase):
    """SKILL.md must reference all prompt files and vice versa."""

    def setUp(self):
        self.content = SKILL_MD.read_text(encoding="utf-8")

    def test_references_all_prompt_files(self):
        expected_refs = [
            "implementer-prompt.md",
            "spec-reviewer-prompt.md",
            "code-quality-reviewer-prompt.md",
            "tdd-verifier-prompt.md",
            "adversarial-security-prompt.md",
            "adversarial-edge-cases-prompt.md",
            "adversarial-architecture-prompt.md",
            "adversarial-fix-prompt.md",
        ]
        for ref in expected_refs:
            self.assertIn(
                ref, self.content,
                f"SKILL.md does not reference {ref}"
            )

    def test_prompt_templates_section_lists_all(self):
        """The Prompt Templates section must list all 8 prompts."""
        section_match = re.search(
            r"## Prompt Templates\s*\n((?:- .+\n)+)",
            self.content
        )
        self.assertIsNotNone(section_match, "Missing '## Prompt Templates' section")
        section = section_match.group(1)
        prompts_listed = re.findall(r"`\./([^`]+)`", section)
        self.assertEqual(
            len(prompts_listed), 8,
            f"Expected 8 prompts in section, found {len(prompts_listed)}: {prompts_listed}"
        )


class TestOptInGates(unittest.TestCase):
    """The opt-in gate system must be properly defined."""

    def setUp(self):
        self.content = SKILL_MD.read_text(encoding="utf-8")

    def test_has_opt_in_section(self):
        self.assertIn(
            "## Step 0: Opt-In Gates",
            self.content,
            "Missing opt-in gates section"
        )

    def test_presents_four_options(self):
        """Must offer exactly 4 options: (a) both, (b) TDD, (c) adversarial, (d) neither."""
        self.assertIn("(a) Both TDD + Adversarial", self.content)
        self.assertIn("(b) TDD only", self.content)
        self.assertIn("(c) Adversarial only", self.content)
        self.assertIn("(d) Neither", self.content)

    def test_asks_before_execution(self):
        """Opt-in must come BEFORE task extraction in the flow."""
        optin_pos = self.content.index("Step 0: Opt-In Gates")
        process_pos = self.content.index("## The Process")
        self.assertLess(
            optin_pos, process_pos,
            "Opt-in gates must be defined before The Process section"
        )

    def test_no_re_ask_per_task(self):
        """Must explicitly say not to re-ask per task."""
        self.assertIn(
            "Don't re-ask per task",
            self.content,
            "Must include instruction not to re-ask gates per task"
        )


class TestComplexityClassification(unittest.TestCase):
    """Complexity classification system must be complete."""

    def setUp(self):
        self.content = SKILL_MD.read_text(encoding="utf-8")

    def test_has_complexity_section(self):
        self.assertIn(
            "## Task Complexity Classification",
            self.content,
            "Missing complexity classification section"
        )

    def test_defines_three_levels(self):
        for level in ["LOW", "MEDIUM", "HIGH"]:
            self.assertIn(
                f"**{level}**",
                self.content,
                f"Missing complexity level: {level}"
            )

    def test_agent_selection_matrix(self):
        """Must define which agents spawn at each complexity level."""
        self.assertIn("Agent Selection Matrix", self.content)
        # LOW = security only
        self.assertRegex(
            self.content,
            r"LOW.*Security only",
            "LOW complexity must spawn security only"
        )

    def test_classification_logic(self):
        """Must include classification pseudocode."""
        self.assertIn("complexity = HIGH", self.content)
        self.assertIn("complexity = MEDIUM", self.content)
        self.assertIn("complexity = LOW", self.content)


class TestAdversarialFlow(unittest.TestCase):
    """Adversarial review flow must have proper controls."""

    def setUp(self):
        self.content = SKILL_MD.read_text(encoding="utf-8")

    def test_parallel_dispatch_mentioned(self):
        self.assertIn(
            "IN PARALLEL",
            self.content,
            "Must mention parallel dispatch for adversarial agents"
        )

    def test_fix_loop_max_3(self):
        self.assertIn(
            "max 3",
            self.content.lower(),
            "Must define max 3 iterations for fix loop"
        )

    def test_escalate_to_human_on_failure(self):
        self.assertIn(
            "Escalate to human",
            self.content,
            "Must escalate to human when fix loop exhausted"
        )

    def test_zero_context_isolation(self):
        """Adversarial agents must receive zero implementation context."""
        self.assertIn(
            "ZERO context",
            self.content,
            "Must enforce zero context isolation for adversarial agents"
        )

    def test_only_rerun_failed_reviewers(self):
        self.assertIn(
            "ONLY the adversarial reviewers that FAIL",
            self.content,
            "Must only re-run failed reviewers, not all"
        )


class TestPromptTemplateStructure(unittest.TestCase):
    """Each prompt template must have consistent structure."""

    ADVERSARIAL_PROMPTS = [
        "adversarial-security-prompt.md",
        "adversarial-edge-cases-prompt.md",
        "adversarial-architecture-prompt.md",
    ]

    def test_adversarial_prompts_have_severity_levels(self):
        """All adversarial prompts must define CRITICAL, HIGH, MEDIUM, LOW."""
        for filename in self.ADVERSARIAL_PROMPTS:
            content = (SKILL_DIR / filename).read_text(encoding="utf-8")
            for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                self.assertIn(
                    f"**{severity}:**",
                    content,
                    f"{filename} missing severity level: {severity}"
                )

    def test_adversarial_prompts_have_verdict(self):
        """All adversarial prompts must define PASS/FAIL verdict."""
        for filename in self.ADVERSARIAL_PROMPTS:
            content = (SKILL_DIR / filename).read_text(encoding="utf-8")
            self.assertIn("**PASS:**", content, f"{filename} missing PASS verdict")
            self.assertIn("**FAIL:**", content, f"{filename} missing FAIL verdict")

    def test_adversarial_prompts_have_report_format(self):
        """All adversarial prompts must define report format."""
        for filename in self.ADVERSARIAL_PROMPTS:
            content = (SKILL_DIR / filename).read_text(encoding="utf-8")
            self.assertIn(
                "## Report Format",
                content,
                f"{filename} missing Report Format section"
            )

    def test_tdd_verifier_has_three_outcomes(self):
        content = (SKILL_DIR / "tdd-verifier-prompt.md").read_text(encoding="utf-8")
        self.assertIn("VERIFIED", content)
        self.assertIn("PARTIAL", content)
        self.assertIn("NOT FOLLOWED", content)

    def test_fix_prompt_has_scope_restriction(self):
        content = (SKILL_DIR / "adversarial-fix-prompt.md").read_text(encoding="utf-8")
        self.assertIn(
            "ONLY these files are in scope",
            content,
            "Fix agent must have strict file scope restriction"
        )

    def test_fix_prompt_requires_tests(self):
        content = (SKILL_DIR / "adversarial-fix-prompt.md").read_text(encoding="utf-8")
        self.assertIn(
            "Add tests for each fix",
            content,
            "Fix agent must require tests for each fix"
        )

    def test_implementer_has_tdd_reference(self):
        content = (SKILL_DIR / "implementer-prompt.md").read_text(encoding="utf-8")
        self.assertIn("TDD", content, "Implementer prompt must reference TDD")

    def test_all_prompts_have_status_reporting(self):
        """All action prompts must define a status report format."""
        action_prompts = [
            "implementer-prompt.md",
            "adversarial-fix-prompt.md",
        ]
        for filename in action_prompts:
            content = (SKILL_DIR / filename).read_text(encoding="utf-8")
            self.assertIn(
                "DONE",
                content,
                f"{filename} missing DONE status"
            )
            self.assertIn(
                "BLOCKED",
                content,
                f"{filename} missing BLOCKED status"
            )


class TestRedFlags(unittest.TestCase):
    """Red flags section must cover adversarial-specific concerns."""

    def setUp(self):
        self.content = SKILL_MD.read_text(encoding="utf-8")

    def test_no_skip_adversarial(self):
        self.assertIn(
            "Proceed with unfixed CRITICAL/HIGH adversarial findings",
            self.content,
            "Red flags must prohibit proceeding with unfixed findings"
        )

    def test_no_adversarial_before_quality(self):
        self.assertIn(
            "Start adversarial review before code quality",
            self.content,
            "Red flags must enforce correct review order"
        )

    def test_no_infinite_loop(self):
        self.assertIn(
            "more than 3 times",
            self.content,
            "Red flags must cap fix loop iterations"
        )

    def test_context_isolation_enforced(self):
        self.assertIn(
            "Give adversarial reviewers context from the implementation session",
            self.content,
            "Red flags must enforce adversarial context isolation"
        )


class TestExecutingPlansIntegration(unittest.TestCase):
    """executing-plans skill must also have opt-in gates."""

    EXECUTING_PLANS_DIR = SKILL_DIR.parent / "executing-plans"

    def setUp(self):
        self.path = self.EXECUTING_PLANS_DIR / "SKILL.md"
        if self.path.exists():
            self.content = self.path.read_text(encoding="utf-8")
        else:
            self.content = ""

    def test_file_exists(self):
        self.assertTrue(self.path.exists(), "executing-plans/SKILL.md must exist")

    def test_has_opt_in_gates(self):
        self.assertIn(
            "Opt-In Gates",
            self.content,
            "executing-plans must have opt-in gates section"
        )

    def test_has_four_options(self):
        self.assertIn("(a) Both", self.content)
        self.assertIn("(b) TDD only", self.content)
        self.assertIn("(c) Adversarial only", self.content)
        self.assertIn("(d) Neither", self.content)

    def test_has_tdd_self_check(self):
        self.assertIn(
            "Red-Green-Refactor",
            self.content,
            "executing-plans must reference TDD self-check"
        )

    def test_has_adversarial_checklist(self):
        """Since no subagents, must have inline adversarial checklist."""
        for check in ["Security", "Edge cases", "Architecture"]:
            self.assertIn(
                check,
                self.content,
                f"executing-plans missing inline adversarial check: {check}"
            )

    def test_has_max_fix_attempts(self):
        self.assertIn(
            "3 fix attempts",
            self.content,
            "executing-plans must cap fix attempts"
        )


class TestCostDocumentation(unittest.TestCase):
    """Cost implications must be documented for informed user decisions."""

    def setUp(self):
        self.content = SKILL_MD.read_text(encoding="utf-8")

    def test_cost_section_exists(self):
        self.assertIn("**Cost:**", self.content, "Missing cost documentation")

    def test_documents_base_cost(self):
        self.assertIn(
            "implementer + 2 reviewers",
            self.content,
            "Must document base cost (no gates)"
        )

    def test_documents_worst_case(self):
        self.assertIn(
            "worst case",
            self.content.lower(),
            "Must document worst-case subagent count"
        )

    def test_documents_best_case(self):
        self.assertIn(
            "best case",
            self.content.lower(),
            "Must document best-case subagent count"
        )


if __name__ == "__main__":
    unittest.main()
