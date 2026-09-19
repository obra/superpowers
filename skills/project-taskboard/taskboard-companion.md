# Task Board Companion Guide

Browser-based interactive task board companion for visualizing plan hierarchies and live execution progress.

Just as `brainstorming` offers a visual companion for design choices and mockups, execution skills (`executing-plans` and `subagent-driven-development`) can offer this companion when users want a visual project dashboard.

## When to Offer

Offer just-in-time when starting execution of a plan with multiple tasks:
> "I can run a local task board in your browser to visualize the plan hierarchy and execution progress as tasks complete. Would you like me to open that?"

If accepted:
1. Start the server with `--project-root`:
   ```bash
   python3 skills/project-taskboard/scripts/taskboard.py start      --root .superpowers/taskboard      --project-root .
   ```
2. The companion will serve the dashboard at `http://127.0.0.1:47832/`.
3. Plan file changes (`- [x] **Step N**`) will be reflected automatically. Subagents or inline runners can also post status updates via the REST API.
