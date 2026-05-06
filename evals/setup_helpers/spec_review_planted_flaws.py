"""Setup helper for the spec-reviewer-catches-planted-flaws drill scenario.

Writes a deliberately incomplete spec to docs/superpowers/specs/. The
spec contains the kinds of flaws the brainstorming skill's spec
document reviewer is meant to catch:

  * a literal "TODO" placeholder in the Requirements section
  * a "specified later" deferral in the Architecture section
  * a Testing Strategy section that is vague, non-actionable filler

Layered on top of the base repo (which provides a working tree + git
history). Files are committed so the agent sees a clean checkout.
"""

from __future__ import annotations

from pathlib import Path

from setup_helpers.base import _git

SPEC_BODY = """\
# Test Feature Design

## Overview

This is a test feature that does something useful for the team.

## Requirements

1. The feature should work correctly
2. It should be fast
3. TODO: Add more requirements here

## Architecture

The feature will use a simple architecture with:

- A frontend component
- A backend service
- Error handling will be specified later once we understand the failure modes better

## Data Flow

Data flows from the frontend to the backend.

## Testing Strategy

Tests will be written to cover the main functionality.
"""


def add_flawed_spec_for_review(workdir: Path) -> None:
    workdir = Path(workdir)
    specs_dir = workdir / "docs" / "superpowers" / "specs"
    specs_dir.mkdir(parents=True, exist_ok=True)
    (specs_dir / "test-feature-design.md").write_text(SPEC_BODY)
    _git(["git", "add", "docs"], cwd=workdir)
    _git(["git", "commit", "-m", "draft test-feature spec for review"], cwd=workdir)
