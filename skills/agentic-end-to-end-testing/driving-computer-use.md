# Driving a Desktop App (Computer Use)

Drive the live app through its accessibility tree, not screen-pixel guesses,
whenever an accessibility-driven tool is available. The worked example
throughout is macOS accessibility automation (an app-state dump plus
element-indexed click/type actions); the same dump-act-re-dump discipline
applies to any platform's accessibility layer.

## Dump, act, re-dump

Before touching anything, pull a full app-state dump — the accessibility
tree, not a screenshot. Read every element index and role off *that* dump;
never guess or reuse an index from a previous dump, since insertions and
removals renumber the tree.

```text
get_app_state {app}
click {app, element_index}       # index/role read from the dump above
type_text {app, text}
get_app_state {app}              # re-dump — did the field you predicted change?
```

Re-dump after every action, not just at the end. An action without a
following dump is a click you can't prove happened — you only have proof once
you've read the state back and it shows the change.

## Quote the observed state into the record

The evidence is the before → after value read from the dump, quoted directly
into the report or commit — not a description of the click. A counter that
should now read a higher page, a selection whose label changed after a
"next" action: put the literal *old value* and *new value* side by side so a
reader can re-run the same action and check for the same transition. "I
clicked the button" proves nothing; "field X read `A`, then `B`" is
falsifiable.

## Isolate before you drive

Copy the built app to a throwaway location under a distinct bundle
identifier and reset its permission grants before scripting it, so a driving
session can't corrupt the real app's session state or permissions. Build any
harness the driving needs outside the project's own repo — end-to-end
driving should never mutate the project under test.

## The escalation ladder

Accessibility automation on a real desktop is not always available cleanly.
Climb a ladder of approaches, and when a rung is blocked, record *why* before
trying the next one:

1. **Accessibility scripting** (on macOS, `osascript`/AppleScript) — the cheap
   default. Blocked signature: a permission error before any command runs
   (no Accessibility grant, e.g. `osascript` error `-1719`).
2. **UI-test harness** (on macOS, an XCUITest automation session) — the
   "proper" way to drive the real app end to end. Blocked signature: the
   harness process itself never establishes its automation session (an
   unsigned test runner killed before it attaches) — that's the harness
   failing to bootstrap, not a bug in the app under test.
3. **Raw input injection** (on macOS, a coordinate-clicking tool such as
   `cliclick` plus `screencapture` after each action) — the fallback of last
   resort when both of the above are blocked. Coarser than element-indexed
   driving, so screenshot after every action and confirm the click landed on
   the intended window before trusting the result.

Every rung you tried belongs in the report, including the ones that failed —
not only the one that worked. Diagnose each blocked rung enough to state the
failure cleanly (permission denied, session never attached, wrong window
frontmost) before moving on; a rung abandoned without a stated reason is
indistinguishable from one you never tried.

## A blocked ladder is a report, not an excuse

If every rung is blocked, that is the result: write down what you tried, what
each rung's failure looked like, and stop there. Never fall back to
describing what the UI "should" do, and never fabricate a dump or a
before/after value you didn't actually read back from the running app.
