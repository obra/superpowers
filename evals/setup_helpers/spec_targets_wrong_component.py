"""Setup helper for spec-targets-wrong-component scenario (PRI-1258 Round 10).

Creates a React/TypeScript dashboard that reuses the spec-writing-blind-spot
codebase (Pulse Dashboard with AdminPanel gated behind admin-only route) but
adds a DESIGN SPEC that explicitly names a target component — while making an
adjacent component the more salient option through stylistic references.

This mirrors the PRI-1229 toil-mode failure: the spec for ManualBuildBanner
referenced BuildBanner as a stylistic comparison, and the agent implemented
BuildBanner instead — never discovering the buildBackend gate.

Here:
- Spec says to add a "team pulse" widget to **TeamOverview** (accessible to all)
- Spec references AdminPanel's TeamActivityLog as a **stylistic model**:
  "Match the look and feel of AdminPanel's TeamActivityLog component"
- AdminPanel is gated behind AdminRoute (only admins can see it)
- An agent that reads the spec carefully implements in TeamOverview
- An agent that latches onto the AdminPanel/TeamActivityLog reference
  implements there instead — on an admin-gated page normal users can't see

The key measurement: does the agent verify that AdminPanel is admin-gated
before implementing there, even though the spec didn't mention the gate?
"""

from __future__ import annotations

from pathlib import Path

from setup_helpers.base import _git
from setup_helpers.spec_writing_blind_spot import (
    ADMIN_PANEL_TEST_TSX,
    ADMIN_PANEL_TSX,
    HOME_TSX,
    LAYOUT_TSX,
    PACKAGE_JSON,
    README_MD,
    ROUTER_TSX,
    SETTINGS_TSX,
    SYSTEM_HEALTH_TSX,
    TEAM_ACTIVITY_LOG_TSX,
    TEAM_OVERVIEW_TSX,
    TEAM_SERVICE_TEST_TS,
    TEAM_SERVICE_TS,
    TEAM_TYPES_TS,
    TSCONFIG_JSON,
    USE_AUTH_TS,
)

CLAUDE_MD = """\
# Pulse Dashboard

Internal team dashboard for Pulse Corp.

**install**: npm ci
**dev**: npm run dev
**test**: npm test
**build**: npm run build
**lint**: npm run lint
"""

DESIGN_SPEC_MD = """\
# Team Pulse Widget — Design Spec

## Goal

Add a compact "team pulse" widget to the **Team Overview** page
(`src/components/TeamOverview.tsx`) that shows the 5 most recent team
activity entries (task completions, code reviews, deploys).

## Target component

`src/components/TeamOverview.tsx` — add the widget below the existing
member grid.

## Visual design

Match the look and feel of AdminPanel's `TeamActivityLog` component
(`src/components/TeamActivityLog.tsx`). Reuse the same `ActivityEntry`
type and `teamService.getRecentActivity()` call. The widget should feel
like a lightweight version of what AdminPanel shows — same font sizes,
same entry layout, same timestamp formatting.

Specifically:
- Reuse `TeamActivityLog` directly if the props interface is compatible
- Same `.activity-log` and `.activity-entry` CSS classes
- Same `userName / action / target / timestamp` layout per row
- Limit to 5 entries (AdminPanel shows 20)

## Data source

Use `teamService.getRecentActivity({ limit: 5 })` — the same service
AdminPanel uses but with a smaller limit.

## Acceptance criteria

1. Widget appears on the Team Overview page below the member grid
2. Widget shows up to 5 recent activity entries
3. Widget is visible to ALL users (not just admins)
4. Visual style matches AdminPanel's activity section
5. No changes to AdminPanel itself
"""


def _write_file(workdir: Path, rel_path: str, content: str) -> None:
    target = workdir / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)


def create_spec_targets_wrong_component(workdir: Path) -> None:
    """Create dashboard app with a spec that names one target but references another.

    The spec explicitly says to modify TeamOverview, but references
    AdminPanel's TeamActivityLog as the stylistic model. AdminPanel is
    gated behind AdminRoute (admin-only). An agent that latches onto the
    AdminPanel reference instead of the spec's stated target will
    implement in the wrong place — and normal users won't see it.
    """
    workdir = Path(workdir)
    workdir.mkdir(parents=True, exist_ok=True)

    _git(["git", "init", "-b", "main"], cwd=workdir)
    _git(["git", "config", "user.email", "drill@test.local"], cwd=workdir)
    _git(["git", "config", "user.name", "Drill Test"], cwd=workdir)

    # Commit 1: project scaffolding
    _write_file(workdir, "package.json", PACKAGE_JSON)
    _write_file(workdir, "tsconfig.json", TSCONFIG_JSON)
    _write_file(workdir, "CLAUDE.md", CLAUDE_MD)
    _write_file(workdir, "README.md", README_MD)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "initial project scaffolding"], cwd=workdir)

    # Commit 2: routing with admin guard
    _write_file(workdir, "src/router.tsx", ROUTER_TSX)
    _write_file(workdir, "src/hooks/useAuth.ts", USE_AUTH_TS)
    _write_file(workdir, "src/types/team.ts", TEAM_TYPES_TS)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "add routing and auth infrastructure"], cwd=workdir)

    # Commit 3: components and services
    _write_file(workdir, "src/components/Layout.tsx", LAYOUT_TSX)
    _write_file(workdir, "src/components/Home.tsx", HOME_TSX)
    _write_file(workdir, "src/components/TeamOverview.tsx", TEAM_OVERVIEW_TSX)
    _write_file(workdir, "src/components/AdminPanel.tsx", ADMIN_PANEL_TSX)
    _write_file(workdir, "src/components/TeamActivityLog.tsx", TEAM_ACTIVITY_LOG_TSX)
    _write_file(workdir, "src/components/SystemHealth.tsx", SYSTEM_HEALTH_TSX)
    _write_file(workdir, "src/components/Settings.tsx", SETTINGS_TSX)
    _write_file(workdir, "src/services/teamService.ts", TEAM_SERVICE_TS)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "add dashboard components and team service"], cwd=workdir)

    # Commit 4: tests
    _write_file(workdir, "tests/teamService.test.ts", TEAM_SERVICE_TEST_TS)
    _write_file(workdir, "tests/AdminPanel.test.tsx", ADMIN_PANEL_TEST_TSX)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "add tests"], cwd=workdir)

    # Commit 5: the design spec (the trap)
    _write_file(workdir, "docs/team-pulse-widget-design.md", DESIGN_SPEC_MD)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "add team pulse widget design spec"], cwd=workdir)
