# Driving a Web UI (Browser)

Use a Chrome/CDP browser tool. After authenticated navigation, drive the page
through `eval` against the app's own JS entry points rather than synthesizing
clicks where possible — it's more robust to layout change than clicking
coordinates or brittle selectors.

## Authenticated navigation

If the app's login flow is a token-bearing redirect (e.g. a URL like
`/auth?token=<TOKEN>&next=<path>`), navigate straight to that URL and then wait
for an element you expect to exist once the session is live:

```text
navigate http://<host>/auth?token=<TOKEN>&next=<path>
await_element [data-some-marker]
```

Use the literal token value, not the path to the file that contains it. Passing
the path instead of the token itself typically renders as an "invalid token"
page rather than an obvious stack trace — if you see that error, check which
one you passed.

## Optimistic-vs-settled assertions

For any "did the optimistic UI update happen before the request resolved?"
scenario, fire the action but *don't await it*, take a synchronous DOM
snapshot (the pending placeholder is there *now*), then await and snapshot
again:

```javascript
(async () => {
  const before = {
    pendingCount: document.querySelectorAll(".optimistic-pending").length,
  };
  // Fire — capture the promise but don't await yet.
  const promise = window.App.doAction(id, payload).catch(e => e);
  // Synchronous: the pending placeholder is in the DOM RIGHT NOW.
  const sync = {
    pendingCount: document.querySelectorAll(".optimistic-pending").length,
    pendingText: document.querySelector(".optimistic-pending")?.textContent,
  };
  await promise;
  await new Promise(r => setTimeout(r, 200));  // let the DOM settle
  const after = {
    pendingCount: document.querySelectorAll(".optimistic-pending").length,
    failedCount: document.querySelectorAll(".optimistic-failed").length,
    reason: document.querySelector(".optimistic-failed-reason")?.textContent,
  };
  return JSON.stringify({ before, sync, after }, null, 2);
})()
```

Without the no-await capture you can't tell "rendered then reconciled" from
"never rendered" — both look identical in the post-await snapshot alone.

## Return a plain string from eval

Join your findings into a string (e.g. `JSON.stringify(..., null, 2)` or
`\n`-joined lines) before returning from `eval`. Some bridges stringify a
returned object as `[object Object]`, silently discarding everything you
wanted to inspect.

## Probing internal state when the DOM is ambiguous

Inspect the app's singleton via `window.<App>?.state` (or whatever it exposes)
when the DOM alone can't tell you what happened:

```javascript
JSON.stringify({
  state: window.App?.state,          // idle | processing | …
  hydrated: window.App?.hydrated,
  pendingType: typeof window.App?.pending,
  windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes("app")),
})
```

The `windowKeys` scan is useful when you don't already know the singleton's
name — grep the result for something plausible. If a hydration/connection
flag is `false` when you expect `true`, or a registry that should be an object
comes back `"undefined"`, that's usually the real bug, not a DOM timing issue.

## Prefer labels over selectors

When a step needs a concrete locator, prefer a label the user actually sees
(button text, aria-label, visible heading) over a brittle structural selector
like `#nav > li:nth-child(3)`. A layout shuffle breaks the selector; it rarely
changes the label.

## When console capture is unreliable

If the browser tool's console-log capture is flaky or stubbed, route debug
output through `eval` instead: push entries to a `window.__DEBUG_LOG` array
from the page, then read it back with a follow-up `eval` call. This sidesteps
the capture path entirely and gives you an ordinary string to inspect.
