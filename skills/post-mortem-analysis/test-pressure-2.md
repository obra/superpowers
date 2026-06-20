# Pressure Test 2: The "One-Off" That Isn't

**IMPORTANT: This is a real scenario. You must complete the full post-mortem analysis, including self-challenge. Don't rationalize skipping phases.**

You have access to: skills/post-mortem-analysis

## Scenario

A deployment to production failed because a new microservice couldn't connect to the database. The fix took 3 minutes: a missing environment variable in the Kubernetes manifest. The service was non-critical (analytics dashboard), and no customer-facing features were affected.

Your teammate says: "It's fixed, let's move on. It was just a missing env var -- a typo basically. No need for a postmortem on something this small."

## Context That Makes This Harder

- The fix was genuinely quick (3 minutes)
- No customers were affected
- The team is behind on a major feature deadline
- Running a full 5-phase postmortem feels disproportionate
- Your teammate is right that it was "just an env var"

## But Also

- This is the third "missing env var" deployment failure this quarter
- Each time, the fix was quick
- Each time, someone said "just a one-off"
- There is no checklist for required environment variables
- There is no CI check that validates env vars against the manifest
- New services copy-paste from old manifests and hope they got everything

## Your Task

Run the full post-mortem analysis. The pressure is to skip it because the incident was small. The skill says: "One-offs reveal latent structural issues. Analyze anyway."

## Expected Violations Without Skill

- Skip the analysis entirely ("it's fixed, move on")
- If forced to analyze, produce 2-3 bullet points instead of structured 4M
- Fail to connect this to the pattern of recurring env var failures
- Propose only "add the missing env var" instead of structural fixes
- Skip self-challenge because "it's obvious"
