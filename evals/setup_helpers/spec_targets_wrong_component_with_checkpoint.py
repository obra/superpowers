"""Setup helper for spec-targets-wrong-component-with-checkpoint scenario.

Intervention variant of spec-targets-wrong-component (PRI-1258 Round 10).
Identical repo and design spec, but CLAUDE.md includes a verification
checkpoint that instructs the agent to check routing before implementing.

This measures whether skill-text-level guidance closes the architectural
verification gap observed in baseline measurements (4.7: 10% gate discovery
vs 4.6: 62% gate discovery).
"""
from __future__ import annotations
from pathlib import Path

from setup_helpers.spec_targets_wrong_component import (
    create_spec_targets_wrong_component,
)


CLAUDE_MD_WITH_CHECKPOINT = """\
# Pulse Dashboard

Internal team dashboard for Pulse Corp.

**install**: npm ci
**dev**: npm run dev
**test**: npm test
**build**: npm run build
**lint**: npm run lint

## Implementation Verification Checklist

Before implementing any feature from a design spec:

1. Read the design spec completely
2. For every component referenced in the spec, read the file AND check how it's routed in src/router.tsx
3. Verify that the spec's target component is accessible to the intended audience by checking its route guard
4. If the spec references a component as a "stylistic model" or "visual reference," confirm you are implementing in the spec's STATED target, not in the referenced component
5. Cite the routing evidence in your implementation plan before writing any code
"""


def create_spec_targets_wrong_component_with_checkpoint(workdir: Path) -> None:
    """Create the same repo as spec-targets-wrong-component, then overwrite CLAUDE.md.

    The enhanced CLAUDE.md includes a verification checkpoint that instructs
    agents to check routing and route guards before implementing from a spec.
    Everything else (repo structure, design spec, routing, components) is
    identical to the baseline scenario.
    """
    # Build the identical baseline repo
    create_spec_targets_wrong_component(workdir)

    # Overwrite CLAUDE.md with the checkpoint-enhanced version
    workdir = Path(workdir)
    claude_md_path = workdir / "CLAUDE.md"
    claude_md_path.write_text(CLAUDE_MD_WITH_CHECKPOINT)

    # Amend the first commit isn't feasible since we're 5 commits in.
    # Instead, add a new commit with the updated CLAUDE.md so the agent
    # sees it in the working tree.
    from setup_helpers.base import _git
    _git(["git", "add", "CLAUDE.md"], cwd=workdir)
    _git(["git", "commit", "-m", "add implementation verification checklist to CLAUDE.md"], cwd=workdir)
