<#
.SYNOPSIS
    Pester smoke tests for the parser, matcher, and schema modules.
    Run from this directory:
        Invoke-Pester -Path . -Output Detailed
#>

BeforeAll {
    $libRoot = Join-Path $PSScriptRoot '..' 'lib' | Resolve-Path
    Import-Module (Join-Path $libRoot 'Parse-Review.psm1')   -Force
    Import-Module (Join-Path $libRoot 'Match-Findings.psm1') -Force
    Import-Module (Join-Path $libRoot 'Schema.psm1')         -Force
}

Describe 'ConvertFrom-ReviewMarkdown' {
    Context 'well-formed review with one error finding' {
        BeforeAll {
            $md = @'
## 🤖 Code Review

### Holistic Assessment

**Motivation**: The fetch helper lacks host validation.

**Approach**: Single-file change adds a fetch wrapper.

**Summary**: ⚠️ Needs Changes. The diff introduces an SSRF vulnerability.

### Multi-Model Critique

Two additional models agreed.

### Grill

- Have I verified this is a problem? Yes — I traced the URL parameter from `parseRequest` at line 12 to the fetch call at line 44 with no validation in between.
- Could the author have a reason? No callers validate either.

### Detailed Findings

#### ❌ Security — Missing host allowlist on user-controlled URL

The `fetch` call at `src/fetch.ts:44` uses `req.query.url` without any host validation. This is a classic SSRF: an attacker can hit internal services. Add an allowlist check before calling fetch.
'@
            $script:Review = ConvertFrom-ReviewMarkdown -Markdown $md
        }

        It 'parses as a review' { $Review.Parseable | Should -BeTrue }
        It 'detects the verdict' { $Review.Verdict | Should -Be 'needs_changes' }
        It 'captures Motivation' { $Review.Motivation | Should -Match 'host validation' }
        It 'captures Approach' { $Review.Approach | Should -Match 'fetch wrapper' }
        It 'sees the multi-model section' { $Review.HasMultiModel | Should -BeTrue }
        It 'sees the grill section' { $Review.HasGrillSection | Should -BeTrue }
        It 'extracts one finding' { $Review.Findings.Count | Should -Be 1 }
        It 'finding severity is error' { $Review.Findings[0].Severity | Should -Be 'error' }
        It 'finding category is Security' { $Review.Findings[0].Category | Should -Be 'Security' }
        It 'finding extracts file ref with line' {
            $ref = $Review.Findings[0].FileRefs | Where-Object { $_.File -eq 'src/fetch.ts' -and $_.Line -eq 44 }
            $ref | Should -Not -BeNullOrEmpty
        }
    }

    Context 'verdict precedence — needs human review vs needs changes' {
        It 'matches Needs Human Review before Needs Changes' {
            $md = "## Review`n**Summary**: ⚠️ Needs Human Review — uncertain about SSRF impact."
            $r = ConvertFrom-ReviewMarkdown -Markdown $md
            $r.Verdict | Should -Be 'needs_human_review'
        }
    }

    Context 'severity icons stripped (text fallback)' {
        It 'still recognizes Error/Warning/Suggestion text' {
            $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### Warning Performance - O(n^2) in hot loop
The loop in `src/scan.go:100` is quadratic.
'@
            $r = ConvertFrom-ReviewMarkdown -Markdown $md
            $r.Findings[0].Severity | Should -Be 'warning'
        }
    }

    Context 'documented multi-model skip' {
        It 'sets MultiModelSkipDocumented' {
            $md = @'
## Review
**Summary**: LGTM

*Multi-model review skipped: only one model family available in this environment.*

### Detailed Findings
'@
            $r = ConvertFrom-ReviewMarkdown -Markdown $md
            $r.MultiModelSkipDocumented | Should -BeTrue
        }
    }

    Context 'garbage input' {
        It 'returns Parseable=false' {
            $r = ConvertFrom-ReviewMarkdown -Markdown 'just some prose'
            $r.Parseable | Should -BeFalse
        }
    }
}

Describe 'Invoke-DetectionScore' {
    BeforeAll {
        # Synthetic expected.json
        $script:Expected = @'
{
  "case_id": "ssrf-fetch",
  "mode": "standalone",
  "mature": true,
  "bugs": [
    {
      "id": "missing-host-allowlist",
      "category": "security",
      "expectation": "required",
      "expected_severity": "error",
      "evidence_regions": [
        { "file": "src/fetch.ts", "lines": [40, 50] }
      ],
      "semantic_keywords": ["allowlist", "ssrf", "host", "validate"],
      "description": "User-controlled URL flows into fetch without host check."
    }
  ],
  "non_bug_distractors": [
    {
      "id": "exec-array-args",
      "evidence_regions": [ { "file": "src/exec.ts", "lines": [30, 40] } ],
      "note": "args are array, not shell string"
    }
  ]
}
'@ | ConvertFrom-Json
    }

    It 'awards TP when finding hits the evidence region' {
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### ❌ Security — Missing host allowlist
The fetch at `src/fetch.ts:44` lacks SSRF protection. Add an allowlist.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $Expected
        $s.Detection.TP | Should -Be 1
        $s.Detection.FN | Should -Be 0
        $s.Detection.FPDistractor | Should -Be 0
        $s.Detection.FPUnmatched  | Should -Be 0
    }

    It 'awards TP via semantic match when line is far off' {
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### ❌ Security — SSRF via missing host allowlist
The code at `src/fetch.ts:200` does not validate the host before reaching out. SSRF risk.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $Expected
        $s.Detection.TP | Should -Be 1
    }

    It 'counts distractor flag as FP' {
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### ❌ Security — Command injection in exec
The exec call at `src/exec.ts:35` may shell out unsafely.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $Expected
        $s.Detection.TP | Should -Be 0
        $s.Detection.FN | Should -Be 1
        $s.Detection.FPDistractor | Should -Be 1
    }

    It 'counts unmatched finding as FP when mature=true' {
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### 💡 Style — Use const instead of let in `src/other.ts:10`
Minor.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $Expected
        $s.Detection.FN | Should -Be 1
        $s.Detection.FPUnmatched | Should -Be 1
        $s.Detection.AdjudicationQueue.Count | Should -Be 0
    }

    It 'queues unmatched finding when mature=false' {
        $exp = ($Expected | ConvertTo-Json -Depth 20 | ConvertFrom-Json)
        $exp.mature = $false
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### 💡 Style — Use const instead of let in `src/other.ts:10`
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $exp
        $s.Detection.FPUnmatched | Should -Be 0
        $s.Detection.AdjudicationQueue.Count | Should -Be 1
    }

    It 'computes severity delta when reviewer downgrades error to warning' {
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### ⚠️ Security — Missing host allowlist
The fetch at `src/fetch.ts:44` lacks SSRF protection.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $Expected
        $s.Severity.Under | Should -Be 1
        $s.Severity.Exact | Should -Be 0
    }

    It 'flags verdict floor violation' {
        $exp = ($Expected | ConvertTo-Json -Depth 20 | ConvertFrom-Json)
        $exp | Add-Member -NotePropertyName expected_verdict_at_least -NotePropertyValue 'needs_changes' -Force
        $md = @'
## Review
**Summary**: LGTM
### Detailed Findings
#### ❌ Security — Missing host allowlist at src/fetch.ts:44
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $exp
        $s.Verdict.Violation | Should -BeTrue
    }

    It 'does NOT count a location-overlapping finding with zero keyword overlap' {
        # Two bugs share an evidence region. A finding lands inside the
        # overlap but only mentions concepts from bug B. It must match B,
        # not A — proving that location-only collisions are filtered.
        $exp = @'
{
  "case_id": "overlap",
  "mode": "standalone",
  "mature": true,
  "bugs": [
    {
      "id": "bug-a-race",
      "category": "concurrency",
      "expectation": "required",
      "expected_severity": "warning",
      "evidence_regions": [ { "file": "src/cache.ts", "lines": [10, 20] } ],
      "semantic_keywords": ["race", "concurrent", "synchroniz", "atomic"],
      "description": "Concurrent first-access race."
    },
    {
      "id": "bug-b-comment",
      "category": "correctness",
      "expectation": "optional",
      "expected_severity": "suggestion",
      "evidence_regions": [ { "file": "src/cache.ts", "lines": [11, 13] } ],
      "semantic_keywords": ["motivation", "benchmark", "premature", "justif"],
      "description": "Misleading performance comment."
    }
  ]
}
'@ | ConvertFrom-Json
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### 💡 Documentation — Performance justification is unsupported
At `src/cache.ts:12` the added comment cites a hot-path benchmark with no measurement. Either remove the motivation or back it with numbers.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $exp
        # The single finding matches only bug-b (comment), not bug-a (race).
        ($s.Bugs | Where-Object Id -eq 'bug-a-race').Caught       | Should -BeFalse
        ($s.Bugs | Where-Object Id -eq 'bug-b-comment').Caught    | Should -BeTrue
        ($s.Bugs | Where-Object Id -eq 'bug-a-race').DuplicateCount   | Should -Be 0
        ($s.Bugs | Where-Object Id -eq 'bug-b-comment').DuplicateCount | Should -Be 0
        $s.Detection.TP | Should -Be 0
        $s.Detection.FN | Should -Be 1
    }

    It 'still matches when location overlaps AND keywords match' {
        # Same two-bug setup, but a finding actually addresses bug A.
        $exp = @'
{
  "case_id": "overlap",
  "mode": "standalone",
  "mature": true,
  "bugs": [
    {
      "id": "bug-a-race",
      "category": "concurrency",
      "expectation": "required",
      "expected_severity": "warning",
      "evidence_regions": [ { "file": "src/cache.ts", "lines": [10, 20] } ],
      "semantic_keywords": ["race", "concurrent", "synchroniz", "atomic"],
      "description": "Concurrent first-access race."
    },
    {
      "id": "bug-b-comment",
      "category": "correctness",
      "expectation": "optional",
      "expected_severity": "suggestion",
      "evidence_regions": [ { "file": "src/cache.ts", "lines": [11, 13] } ],
      "semantic_keywords": ["motivation", "benchmark", "premature", "justif"],
      "description": "Misleading performance comment."
    }
  ]
}
'@ | ConvertFrom-Json
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### ⚠️ Concurrency — Race on lazy first-access at `src/cache.ts:15`
Two concurrent callers can both observe the cache as empty, both kick off the synchronous load, and only the second assignment wins.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        $s = Invoke-DetectionScore -Review $r -Expected $exp
        ($s.Bugs | Where-Object Id -eq 'bug-a-race').Caught | Should -BeTrue
        # Finding falls inside bug-b's region [11,13]+/-8 = [3,21] too, but
        # it has zero overlap with bug-b's keywords, so must NOT match it.
        ($s.Bugs | Where-Object Id -eq 'bug-b-comment').Caught | Should -BeFalse
    }

    It 'restores location-only matching when LocationKeywordMin=0' {
        $exp = @'
{
  "case_id": "loc-only",
  "mode": "standalone",
  "mature": true,
  "bugs": [
    {
      "id": "bug-a",
      "category": "security",
      "expectation": "required",
      "expected_severity": "error",
      "evidence_regions": [ { "file": "src/x.ts", "lines": [10, 20] } ],
      "semantic_keywords": ["ssrf", "allowlist"],
      "description": "x"
    }
  ]
}
'@ | ConvertFrom-Json
        $md = @'
## Review
**Summary**: Needs Changes
### Detailed Findings
#### ⚠️ Something — Possible issue
The code at `src/x.ts:15` looks suspicious to me.
'@
        $r = ConvertFrom-ReviewMarkdown -Markdown $md
        # With default LocationKeywordMin=1: NOT a match (no keyword overlap).
        $s1 = Invoke-DetectionScore -Review $r -Expected $exp
        $s1.Detection.TP | Should -Be 0
        # With LocationKeywordMin=0: match by location alone.
        $s2 = Invoke-DetectionScore -Review $r -Expected $exp -LocationKeywordMin 0
        $s2.Detection.TP | Should -Be 1
    }
}

Describe 'Test-ExpectedJson (schema)' {
    It 'accepts a minimal valid expected.json' {
        $obj = '{"case_id":"foo","mode":"standalone","bugs":[{"id":"b","category":"security","expectation":"required","expected_severity":"error","evidence_regions":[{"file":"a.ts","lines":[1,5]}],"semantic_keywords":["ssrf"],"description":"x"}]}' | ConvertFrom-Json
        $errors = Test-ExpectedJson -Expected $obj
        $errors | Should -BeNullOrEmpty
    }
    It 'rejects unknown category' {
        $obj = '{"case_id":"foo","mode":"standalone","bugs":[{"id":"b","category":"smells-funny","expectation":"required","expected_severity":"error","evidence_regions":[{"file":"a.ts","lines":[1,5]}],"semantic_keywords":["ssrf"],"description":"x"}]}' | ConvertFrom-Json
        $errors = Test-ExpectedJson -Expected $obj
        ($errors -join ' ') | Should -Match 'category'
    }
    It 'rejects mismatched case_id and directory name' {
        $obj = '{"case_id":"foo","mode":"standalone","bugs":[{"id":"b","category":"security","expectation":"required","expected_severity":"error","evidence_regions":[{"file":"a.ts","lines":[1,5]}],"semantic_keywords":["ssrf"],"description":"x"}]}' | ConvertFrom-Json
        $errors = Test-ExpectedJson -Expected $obj -CaseDirName 'bar'
        ($errors -join ' ') | Should -Match "directory name 'bar'"
    }
}
