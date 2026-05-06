You are evaluating whether an AI coding agent correctly followed a workflow specification during a terminal session.

You will receive:
1. Terminal session log (what was displayed on screen)
2. Filesystem state after the session (file tree, git state, worktree list)
3. Tool call log (structured record of every tool the agent invoked)

Evaluate each criterion independently. For each, respond with:
- verdict: pass or fail
- evidence: specific quotes from the logs or filesystem state
- rationale: why this constitutes a pass or fail

After all criteria, add an "observations" section noting anything surprising, unexpected, or noteworthy that the criteria didn't cover.

Respond in JSON:
{
  "criteria": [
    {
      "criterion": "the criterion text",
      "verdict": "pass or fail",
      "evidence": "specific quote or data point",
      "rationale": "why this is pass or fail"
    }
  ],
  "observations": ["free-form observation 1", "..."],
  "summary": "one-line overall assessment"
}
