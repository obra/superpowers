# Dispatching Parallel Agents Prompts

These examples are written in the style Codex expects for multi-agent work:
clear role assignment, narrow responsibilities, and an explicit orchestration
goal.

## UI debugging with browser evidence

```text
Investigate why the settings modal fails to save.
Have browser_debugger reproduce it and capture console/network evidence,
explorer trace the responsible code path, and worker implement the smallest fix
once the failure mode is clear.

If browser_debugger is not configured, skip it and have explorer infer the flow
from code and existing tests instead.

Wait for all relevant agents, summarize the evidence first, then summarize the
fix.
```

## Independent failure domains

```text
Investigate these failures in parallel. Spawn one focused agent per domain.
Have explorer map the code path for each domain, have worker own the smallest
safe fix only when the root cause is clear, and have reviewer summarize any
shared risk or conflicting edits before integration.

Domains:
1. API auth regression in /api/session
2. Notification queue retry bug
3. Flaky tests in settings modal

Wait for all agents, then summarize each domain separately and call out any
cross-domain dependency before changing code.
```

## CSV fan-out for homogeneous review

```text
Create /tmp/services.csv with columns service,owner,path and one row per
service that needs review.

Then use spawn_agents_on_csv with:
- csv_path: /tmp/services.csv
- id_column: service
- instruction: "Review {service} owned by {owner} at {path}. Have worker return
  JSON with keys service, risk, summary, and follow_up via
  report_agent_job_result."
- output_schema: an object with required string fields service, risk, summary,
  and follow_up
- output_csv_path: /tmp/services-review.csv

After the batch finishes, summarize the highest-risk rows first.
```
