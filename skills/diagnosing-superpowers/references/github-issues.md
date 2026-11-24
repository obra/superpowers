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

## File

Fill `templates/issue.md`, scrub it per `references/redaction-policy.md`,
write the scrubbed draft to the workspace, and show your human partner
the exact text for approval. After approval:

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

When posting a comment onto an existing issue, run the draft comment
through the exact same `references/redaction-policy.md` scrub, write the
scrubbed draft to the workspace, and show your human partner the exact
text for approval before posting. After approval:

```bash
gh issue comment <number> --repo obra/superpowers --body-file <path>
```

`gh` cannot attach files to comments either; if a bundle exists, give your
partner its path to attach through the browser. Without `gh`, hand over
`https://github.com/obra/superpowers/issues/<number>` and tell your
partner to paste the scrubbed draft from the file.
