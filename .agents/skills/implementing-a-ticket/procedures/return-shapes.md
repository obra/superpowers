# Implementer return shapes

Standalone: the code implementer's three return shapes and the two-channel delivery rules.
Numbered 1–4. Every reference out of this file names its file. Read this before emitting
any shape.

The coordinator parses these programmatically. No prose outside the JSON.

## 1 — Hand-back (PR open + self-reviewed, ready for the coordinator's independent review)

```json
{"ok": true, "readyForReview": true, "prNumber": 87, "prUrl": "...",
 "branch": "tkt-<n>-<slug>", "worktreePath": "./tkt-<n>-<slug>",
 "filesChanged": 4, "selfReview": "lint-grade",
 "checksRun": ["format_command", "lint_command", "typecheck_command", "test_command", "build_command", "criteria-fit", "bug-scan", "security-scan", "invariant-scan"],
 "iteration": 0, "routing": {"for": "code-coordinator", "issue": 42, "answers": "round-1 findings"},
 "summary": "..."}
```

`checksRun` names only gates that ran; a blank gate key is skipped, and the `summary` says
which were skipped.

`routing` is part of the shape, not an optional extra: it is the key the coordinator matches a sent
copy against a returned one, so a hand-back without it produces the unmatched duplicate the
two-channel rule exists to avoid. Emit it on both channels, identically.

`prNumber` and `prUrl` name the same PR. Emit both: the coordinator's dispatches to the
`code-quality-reviewer` and the `unit-test-writer` take the number, and neither side should
have to parse it back out of the URL. `worktreePath` is the same field the Blocked shape
carries, and for the same reason — the coordinator passes it to both of those agents, so it is emitted
rather than reconstructed from the `tkt-<n>-<slug>` convention.

## 2 — Delivery channels

**Deliver the hand-back on both channels: `SendMessage` it to the coordinator, *and* return it as your
result.** The dispatch carries the coordinator's own address as a field (`coordinator-dispatch-handback.md`
section 1); `SendMessage` it there and nowhere else. **Never send to `"main"`, never to
another implementer, and never to a name you inferred** — the orchestrating thread is not the coordinator,
so a guessed recipient bypasses the coordinator *silently*, which is worse than not sending at all.
You have no `ListAgents` to check a guess against, which is exactly why the address is given
to you rather than discovered.

**Returning the shape is unconditional, and is not a fallback for a send that did not
happen.** The two are not alternatives: a message that is dispatched but never lands would
otherwise take the hand-back off both channels at once, and neither end can observe that from
its own side. So return the shape on every path, including one where `SendMessage` reported
success. **A duplicate arriving by both channels is the designed outcome, not a fault** —
`routing` is what makes the two idempotent, so the coordinator recognises the second as the same
hand-back and drops it rather than reporting it.

**If the dispatch carried no address, or the send fails, name the reason in `toolGap`** — e.g.
`"no coordinator address in the dispatch; hand-back returned for relay"`. The return is not what
`toolGap` announces; the return was happening regardless. What it announces is that the direct
channel was unavailable, so the relay is now the only copy. Do not retry a failed send against
a guessed address. Without that marker nobody can tell a missing channel from an implementer that
chose not to send, and it stays the only signal separating those two. What it cannot report
is whether a send that returned success actually arrived — no marker you can set observes
that, which is exactly why the return is unconditional rather than conditional on the send.

```json
"routing": {"for": "code-coordinator", "issue": 42, "answers": "round-1 findings"}
```

**Emit `routing` on both channels, identically.** A relay that has to guess the recipient or
reconstruct the round number is where facts get dropped, and identical `routing` is also what
lets the coordinator collapse a message and a return into one hand-back instead of two.

If a tool or channel you were told to use turns out to be unusable — a tool simply absent
(no `Grep`, no `SendMessage`: a harness condition, not a failure, and the one the
first-turn tool self-test exists to catch), or a route you could not
take, such as the hand-back address above — name it in a `toolGap` field rather than
improvising prose or inventing a workaround that hides the gap:

```json
"toolGap": "Grep unavailable; fell back to Bash grep per the Step 0 fallback"
```

An absent `SendMessage` and an absent address are different gaps and read differently to
the coordinator — the first says the channel does not exist for you at all, the second that it exists
but you were given nowhere to point it. Say which.

## 3 — Merged (after the coordinator's reviewer approved and the coordinator merged)

```json
{"ok": true, "merged": true, "prUrl": "...",
 "routing": {"for": "code-coordinator", "issue": 42, "answers": "merged; worktree cleaned up"}}
```

`routing` rides on every returned shape for the same reason: any of them may be relayed, and
the relay needs the key without reconstructing it.

## 4 — Blocked (implementer can't complete the change)

```json
{"ok": false,
 "reason": "criteria-unclear | missing-info | tests-failed | gate-failed | pr-create-failed | gh-not-authenticated | base-unreachable | worktree-already-exists",
 "missingInfo": "...", "suggestedNextStep": "...", "worktreePath": "./tkt-<n>-<slug>",
 "routing": {"for": "code-coordinator", "issue": 42, "answers": "blocked: <reason>"}}
```

`routing` rides on this shape for the same reason as on the hand-back: a blocked result is
relayed too, and the relay needs the key without reconstructing it.

The worktree stays in place on a blocker — the user will need it to inspect what went wrong.
