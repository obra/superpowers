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

## Public draft

Extract only minimum public evidence from the complete local diagnosis into a
separate `templates/issue.md` draft, or a separate comment draft for the
closest existing issue. Scrub either under `references/redaction-policy.md`;
the `PROPRIETARY` list is not an exhaustive confidentiality check. Have an
independent auditor use `prompts/scrub-audit.md` with DRAFT set to the public
text file. Audit each separate public evidence excerpt or text attachment as
another DRAFT; audit any bundle attachment as BUNDLE. Resolve every miss or
uncertainty before showing the exact text and attachment list. Give the auditor
the unchanged local case as SOURCE_CASE for these diagnosis-derived artifacts;
it is read-only and is never attached. Do not rewrite the local case or report.
If a draft or attachment changes or is renamed after audit, repeat the affected
audit and show the revised artifact for approval. Post only the reviewed bytes;
verify the published text and attachments match them. For a new issue:

```bash
gh issue create --repo obra/superpowers --title "<title>" --body-file <path> \
  --label bug --label automated-issue-report
```

GitHub drops labels silently when the reporter lacks push access, so the
labels land only for collaborators; the template footer still marks the
issue as skill-filed. `gh` cannot attach files: give your partner the
bundle path to attach through the browser after the issue exists.

Without `gh`, hand over a prefilled link on the `diagnosis_report.md`
template, which applies both labels for any reporter:

```
https://github.com/obra/superpowers/issues/new?template=diagnosis_report.md&title=<url-encoded title>&body=<url-encoded body>
```

GitHub rejects URLs over about 8,000 characters; past that, send the link
with the title only and tell your partner to paste the body from the file.
