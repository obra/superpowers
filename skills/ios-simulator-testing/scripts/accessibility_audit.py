#!/usr/bin/env python3
"""
iOS Simulator Accessibility Audit

Scans the current simulator screen for accessibility compliance issues.
Optimized for minimal token output while maintaining functionality.

Usage: python scripts/accessibility_audit.py [options]
"""

import argparse
import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from typing import Any

from common import flatten_tree, get_accessibility_tree


@dataclass
class Issue:
    """Represents an accessibility issue."""

    severity: str  # critical, warning, info
    rule: str
    element_type: str
    issue: str
    fix: str

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class AccessibilityAuditor:
    """Performs accessibility audits on iOS simulator screens."""

    # Critical rules that block users
    CRITICAL_RULES = {
        "missing_label": lambda e: e.get("type") in ["Button", "Link"] and not e.get("AXLabel"),
        "empty_button": lambda e: e.get("type") == "Button"
        and not (e.get("AXLabel") or e.get("AXValue")),
        "image_no_alt": lambda e: e.get("type") == "Image" and not e.get("AXLabel"),
    }

    # Warnings that degrade UX
    WARNING_RULES = {
        "missing_hint": lambda e: e.get("type") in ["Slider", "TextField"] and not e.get("help"),
        "missing_traits": lambda e: e.get("type") and not e.get("traits"),
    }

    # Info level suggestions
    INFO_RULES = {
        "no_identifier": lambda e: not e.get("AXUniqueId"),
        "deep_nesting": lambda e: e.get("depth", 0) > 5,
    }

    def __init__(self, udid: str | None = None):
        """Initialize auditor with optional device UDID."""
        self.udid = udid

    def get_accessibility_tree(self) -> dict:
        """Fetch accessibility tree from simulator using shared utility."""
        return get_accessibility_tree(self.udid, nested=True)

    @staticmethod
    def _is_small_target(element: dict) -> bool:
        """Check if touch target is too small (< 44x44 points)."""
        frame = element.get("frame", {})
        width = frame.get("width", 0)
        height = frame.get("height", 0)
        return width < 44 or height < 44

    def _flatten_tree(self, node: dict, depth: int = 0) -> list[dict]:
        """Flatten nested accessibility tree for easier processing using shared utility."""
        return flatten_tree(node, depth)

    def audit_element(self, element: dict) -> list[Issue]:
        """Audit a single element for accessibility issues."""
        issues = []

        # Check critical rules
        for rule_name, rule_func in self.CRITICAL_RULES.items():
            if rule_func(element):
                issues.append(
                    Issue(
                        severity="critical",
                        rule=rule_name,
                        element_type=element.get("type", "Unknown"),
                        issue=self._get_issue_description(rule_name),
                        fix=self._get_fix_suggestion(rule_name),
                    )
                )

        # Check warnings (skip if critical issues found)
        if not issues:
            for rule_name, rule_func in self.WARNING_RULES.items():
                if rule_func(element):
                    issues.append(
                        Issue(
                            severity="warning",
                            rule=rule_name,
                            element_type=element.get("type", "Unknown"),
                            issue=self._get_issue_description(rule_name),
                            fix=self._get_fix_suggestion(rule_name),
                        )
                    )

        # Check info level (only if verbose or no other issues)
        if not issues:
            for rule_name, rule_func in self.INFO_RULES.items():
                if rule_func(element):
                    issues.append(
                        Issue(
                            severity="info",
                            rule=rule_name,
                            element_type=element.get("type", "Unknown"),
                            issue=self._get_issue_description(rule_name),
                            fix=self._get_fix_suggestion(rule_name),
                        )
                    )

        return issues

    def _get_issue_description(self, rule: str) -> str:
        """Get human-readable issue description."""
        descriptions = {
            "missing_label": "Interactive element missing accessibility label",
            "empty_button": "Button has no text or label",
            "image_no_alt": "Image missing alternative text",
            "missing_hint": "Complex control missing hint",
            "small_touch_target": "Touch target smaller than 44x44pt",
            "missing_traits": "Element missing accessibility traits",
            "no_identifier": "Missing accessibility identifier",
            "deep_nesting": "Deeply nested (>5 levels)",
        }
        return descriptions.get(rule, "Accessibility issue")

    def _get_fix_suggestion(self, rule: str) -> str:
        """Get fix suggestion for issue."""
        fixes = {
            "missing_label": "Add accessibilityLabel",
            "empty_button": "Set button title or accessibilityLabel",
            "image_no_alt": "Add accessibilityLabel with description",
            "missing_hint": "Add accessibilityHint",
            "small_touch_target": "Increase to minimum 44x44pt",
            "missing_traits": "Set appropriate accessibilityTraits",
            "no_identifier": "Add accessibilityIdentifier for testing",
            "deep_nesting": "Simplify view hierarchy",
        }
        return fixes.get(rule, "Review accessibility")

    def audit(self, verbose: bool = False) -> dict[str, Any]:
        """Perform full accessibility audit."""
        # Get accessibility tree
        tree = self.get_accessibility_tree()

        # Flatten for processing
        elements = self._flatten_tree(tree)

        # Audit each element
        all_issues = []
        for element in elements:
            issues = self.audit_element(element)
            for issue in issues:
                issue_dict = issue.to_dict()
                # Add minimal element info for context
                issue_dict["element"] = {
                    "type": element.get("type", "Unknown"),
                    "label": element.get("AXLabel", "")[:30] if element.get("AXLabel") else None,
                }
                all_issues.append(issue_dict)

        # Count by severity
        critical = len([i for i in all_issues if i["severity"] == "critical"])
        warning = len([i for i in all_issues if i["severity"] == "warning"])
        info = len([i for i in all_issues if i["severity"] == "info"])

        # Build result (token-optimized)
        result = {
            "summary": {
                "total": len(elements),
                "issues": len(all_issues),
                "critical": critical,
                "warning": warning,
                "info": info,
            }
        }

        if verbose:
            # Full details only if requested
            result["issues"] = all_issues
        else:
            # Default: top issues only (token-efficient)
            result["top_issues"] = self._get_top_issues(all_issues)

        return result

    def _get_top_issues(self, issues: list[dict]) -> list[dict]:
        """Get top 3 issues grouped by type (token-efficient)."""
        if not issues:
            return []

        # Group by rule
        grouped = {}
        for issue in issues:
            rule = issue["rule"]
            if rule not in grouped:
                grouped[rule] = {
                    "severity": issue["severity"],
                    "rule": rule,
                    "count": 0,
                    "fix": issue["fix"],
                }
            grouped[rule]["count"] += 1

        # Sort by severity and count
        severity_order = {"critical": 0, "warning": 1, "info": 2}
        sorted_issues = sorted(
            grouped.values(), key=lambda x: (severity_order[x["severity"]], -x["count"])
        )

        return sorted_issues[:3]


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Audit iOS simulator screen for accessibility issues"
    )
    parser.add_argument("--udid", help="Device UDID (uses booted device if not specified)")
    parser.add_argument("--output", help="Save JSON report to file")
    parser.add_argument(
        "--verbose", action="store_true", help="Include all issue details (increases output)"
    )

    args = parser.parse_args()

    # Perform audit
    auditor = AccessibilityAuditor(udid=args.udid)

    try:
        result = auditor.audit(verbose=args.verbose)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    # Output results
    if args.output:
        # Save to file
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        # Print minimal summary
        summary = result["summary"]
        print(f"Audit complete: {summary['issues']} issues ({summary['critical']} critical)")
        print(f"Report saved to: {args.output}")
    # Print to stdout (token-optimized by default)
    elif args.verbose:
        print(json.dumps(result, indent=2))
    else:
        # Ultra-compact output
        summary = result["summary"]
        print(f"Elements: {summary['total']}, Issues: {summary['issues']}")
        print(
            f"Critical: {summary['critical']}, Warning: {summary['warning']}, Info: {summary['info']}"
        )

        if result.get("top_issues"):
            print("\nTop issues:")
            for issue in result["top_issues"]:
                print(
                    f"  [{issue['severity']}] {issue['rule']} ({issue['count']}x) - {issue['fix']}"
                )

    # Exit with error if critical issues found
    if result["summary"]["critical"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
