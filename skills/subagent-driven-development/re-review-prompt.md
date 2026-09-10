# Persistent Reviewer Re-Review Prompt

Send this as a new turn to the existing reviewer child. Never create a new
reviewer for a fix round.

```text
Re-review milestone [MILESTONE_NAME] as pass [2_OR_3].

Acceptance criteria:
[ACCEPTANCE_CRITERIA]

Prior Critical/Important findings:
[FINDINGS]

Implementer report:
[REPORT_PATH]

Exact fixed review range:
[BASE_SHA]..[HEAD_SHA]

Review the full exact BASE..HEAD milestone range against the acceptance
criteria. Verdict every prior finding and check whether the fixes introduced
new Critical or Important breakage anywhere in this milestone range.

Remain read-only. Do not edit files or create commits.

Do not invoke `task`, `create_session`, `run_factory`, background agents, or
any other nested delegation. Do not create helper agents, reviewers, sessions,
factories, or swarms.

Return:

- each prior finding: ADDRESSED or NOT ADDRESSED with file:line evidence;
- new Critical/Important findings, if any;
- Minor observations that do not extend the loop;
- milestone quality verdict;
- pass number and remaining Critical/Important count.

This is review pass [2_OR_3] of at most three total. If pass 3 leaves any
Critical or Important finding unresolved, state that the controller must stop
and escalate. Do not recommend another reviewer or another pass.
```
