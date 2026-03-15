## 2026-03-14 - Optimize isFullDocument string allocation
**Learning:** Brainstorm server receives full HTML screens that can be multi-megabytes. Calling `toLowerCase()` on the entire string before checking the first few characters for `<!doctype` causes huge unnecessary memory allocations and blocks the event loop.
**Action:** Only substring the first few characters (e.g., 20) of large text payloads before calling string transformation functions like `toLowerCase()` when doing prefix checks.
