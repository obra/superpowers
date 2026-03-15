## 2026-03-15 - [O(1) String Lowercasing in Node.js Event Loop]
**Learning:** Node.js `toLowerCase()` on massive strings (like entire HTML documents) blocks the event loop and requires large memory allocations.
**Action:** Always extract a short prefix using `.slice()` before calling `.toLowerCase()` when only checking the start of a large string.
