## 2026-03-14 - Optimize isFullDocument string allocation
**Learning:** Brainstorm server receives full HTML screens that can be multi-megabytes. Calling `toLowerCase()` on the entire string before checking the first few characters for `<!doctype` causes huge unnecessary memory allocations and blocks the event loop.
**Action:** Only substring the first few characters (e.g., 20) of large text payloads before calling string transformation functions like `toLowerCase()` when doing prefix checks.

## 2026-03-24 - Avoid String.prototype.replace() on multi-megabyte strings
**Learning:** Using `String.prototype.replace()` (even with a simple string pattern) on multi-megabyte HTML payloads causes massive event-loop blocking overhead (~27ms for a 5MB string vs ~0.03ms with slice). This affects both `wrapInFrame` (replacing `<!-- CONTENT -->`) and `handleRequest` (injecting before `</body>`).
**Action:** Always prefer `indexOf`/`lastIndexOf` combined with `String.slice()` for inserting or replacing content in large string payloads.
