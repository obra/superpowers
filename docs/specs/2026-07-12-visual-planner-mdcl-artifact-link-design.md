# Visual Planner mdcl Artifact Linking

## Goal

Update `agents/visual-planner/agent.md` so the visual-planner agent uses the `mdcl-cli` skill for artifact location and local hosting, returning the URL produced by mdcl instead of starting or reusing a manually managed HTTP server.

## Design

The visual-planner instructions will require the agent to use the `mdcl-cli` skill. The input contract will no longer expose `PORT`; mdcl owns the daemon port and the workflow uses its default port, `4321`.

The HTML generation workflow remains unchanged except for artifact location and an explicit style-reference path: before writing the HTML skeleton, the agent will read `agents/visual-planner/style-reference.html`; it will resolve the configured artifact root with `mdcl artifact-path get` and write `<slug>.html` there. After writing, it will verify the artifact and daemon through the mdcl workflow, then run `mdcl artifacts link <slug>.html` and return the exact URL printed by that command.

Before writing the HTML skeleton, the agent will use the exact repository-relative path `agents/visual-planner/style-reference.html` instead of searching for the style reference.

The instructions will explicitly prohibit port scanning, starting `python3 -m http.server`, constructing a URL manually, or guessing the port. The existing URL-only output contract remains in force.

## Architectural Decisions

### Use the `mdcl-cli` skill for artifact hosting

The visual-planner agent will use the installed `mdcl-cli` skill rather than duplicating its server and artifact-linking logic. This keeps artifact discovery and serving aligned with the workspace-scoped mdcl daemon. A manually managed Python HTTP server is rejected because it bypasses mdcl’s artifact registry and can produce inconsistent links.

### Use mdcl’s default port 4321

The visual-planner agent will rely on mdcl’s default daemon port instead of accepting a configurable `PORT` input or scanning ports. This matches the requested default behavior and avoids instructions that compete with mdcl’s own daemon lifecycle.

### Return mdcl’s printed URL verbatim

The agent will return the URL emitted by `mdcl artifacts link`, not a URL assembled from the filename or assumed port. This ensures the returned link reflects the daemon’s actual serving configuration.

## Scope

Only `agents/visual-planner/agent.md` will be changed during implementation. The design does not alter the required HTML stack, visual layout requirements, output filename slugging, or URL-only response format.
