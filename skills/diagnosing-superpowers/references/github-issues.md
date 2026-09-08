# GitHub issues without `gh`

A default `gh` login carries the `repo` scope: write access to every
repository your human partner can reach. This step needs none of that, so
it uses the public API and the browser.

## Search

Unauthenticated, 10 requests a minute. Search open and closed issues:

```bash
curl -s -H "Accept: application/vnd.github+json" \
  "https://api.github.com/search/issues?q=repo:obra/superpowers+is:issue+<url-encoded terms>&per_page=10" \
  | jq -r '.items[] | "\(.number)\t\(.state)\t\(.title)"'
```

If curl is unavailable, hand over the search URL instead:
`https://github.com/obra/superpowers/issues?q=<terms>`.

## File

Write the filled `templates/issue.md` to the workspace, then build the
link. The `diagnosis_report.md` template applies the `bug` and
`automated-issue-report` labels for any reporter; the `labels=` parameter
would not.

```
https://github.com/obra/superpowers/issues/new?template=diagnosis_report.md&title=<url-encoded title>&body=<url-encoded body>
```

GitHub rejects URLs over about 8,000 characters. If the link exceeds
that, send it with the title only and tell your partner to paste the body
from the file. Your partner submits the issue and attaches any bundle in
the form.
