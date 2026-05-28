## 🤖 Code Review

### Holistic Assessment

**Motivation**: The PR replaces a vetted backend call with a direct `fetch()` to a user-supplied URL. The stated goal of "removing an indirection" is reasonable, but it dramatically changes the threat model.

**Approach**: Read the diff, then the surrounding `handleProxy` and route wiring to see whether any host validation exists upstream. None does, and no downstream consumer re-validates.

**Summary**: ⚠️ Needs Changes. The PR introduces a Server-Side Request Forgery vector by removing the only host-validation step. The author claims this "fixes both problems" without acknowledging or mitigating the regression.

---

### Detailed Findings

#### ❌ Security — Missing host allowlist (SSRF) in src/proxy.ts:24

The URL comes straight from `req.query.url`, is only parsed for syntactic validity by `parseUrl`, and is then handed to `fetch()` with no host check. An attacker can supply `http://169.254.169.254/...` (cloud metadata), `http://10.0.0.1/admin`, `file://`, or any internal host the proxy can reach. This is a classic Server-Side Request Forgery (SSRF). The previous backend call did the allowlist validation; nothing in this PR replaces it.

**Evidence**: `src/proxy.ts:18` (no validate call) and `src/proxy.ts:24` (the new `fetch(url.toString(), ...)` line).

**Suggested fix**: Add a host allowlist check before `fetch()` (or restore the vetted backend call). Reject private IP ranges, link-local, and non-`http(s)` schemes.

#### ⚠️ Correctness — Weakened justification in PR description

The PR description asserts this change "fixes both problems" without explaining the SSRF tradeoff. The motivation should either acknowledge the regression and document the mitigation, or the change should be reverted. Reviewers should not have to reverse-engineer the security impact from the diff.
