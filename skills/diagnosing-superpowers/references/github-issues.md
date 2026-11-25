# GitHub issues

Use `gh` when it is installed and authenticated; it handles auth, rate
limits, and JSON. Fall back to the public API with curl, then to a URL
your partner opens.

## Search

```bash
gh search issues --repo obra/superpowers --limit 10 "<terms>" \
  --json number,state,title --jq '.[] | "\(.number)\t\(.state)\t\(.title)"'
```

Without `gh` (unauthenticated, 10 requests a minute):

```bash
curl -s -H "Accept: application/vnd.github+json" \
  "https://api.github.com/search/issues?q=repo:obra/superpowers+is:issue+<url-encoded terms>&per_page=10" \
  | jq -r '.items[] | "\(.number)\t\(.state)\t\(.title)"'
```

Without curl, hand over `https://github.com/obra/superpowers/issues?q=<terms>`.

## Scrub

Scrub every issue or comment draft yourself, per
`references/redaction-policy.md`, before it is written to the workspace or
shown. `PUBLIC_REPOS` is `obra/superpowers` plus any repository your
partner says is public; `PROPRIETARY` is the terms they name as
proprietary, which may be none. Unless they already told you, ask which
repositories and terms in the draft are public or proprietary. Where the
policy says to report to your dispatcher, ask your partner. Rewrite
`path:line` citations as `transcript line <n>` and name each transcript
by session id, never by path. The draft is the only copy you modify; the
report, the case file, and the session files stay as they are.

Two slots carry your partner's own wording: the name they file under and
their summary. Keep both as given. If the summary contains something the
policy would replace, tell them what and let them reword it.

When you show the draft, say that scrubbing can miss things and ask your
partner to read all of it before approving.

## File

Fill `templates/issue.md`, scrub it as described under Scrub, write the
scrubbed draft to the workspace, and show your human partner the exact
text for approval. After approval:

```bash
gh issue create --repo obra/superpowers --title "<title>" --body-file <path> \
  --label bug --label automated-issue-report
```

GitHub drops labels silently when the reporter lacks push access, so the
labels land only for collaborators; the template footer still marks the
issue as skill-filed. `gh` cannot attach files: give your partner the
bundle path to attach through the browser after the issue exists.

Without `gh`, hand over a prefilled link on the `bug_report.md` template,
which applies the `bug` label for any reporter:

```
https://github.com/obra/superpowers/issues/new?template=bug_report.md&title=<url-encoded title>&body=<url-encoded body>
```

GitHub rejects URLs over about 8,000 characters; past that, send the link
with the title only and tell your partner to paste the body from the file.

## Comment

To add the report to an existing issue, fill `templates/issue.md` as the
comment body, leaving out its `Title:` line and the duplicate-search
checkbox. Scrub it as described under Scrub, write the scrubbed draft to
the workspace as its own file, and show your human partner the exact text
for approval. After approval:

```bash
gh issue comment <number> --repo obra/superpowers --body-file <path>
```

`gh` cannot attach files to comments either; if a bundle exists, give your
partner its path to attach through the browser. Without `gh`, hand over
`https://github.com/obra/superpowers/issues/<number>` and tell your
partner to paste the scrubbed draft from the file.
