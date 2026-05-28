<#
.SYNOPSIS
    Parse a code review (markdown produced by an LLM following the
    code-review skill's output format) into a structured object.

    Returns a PSCustomObject:
      {
        Parseable      : bool                       # false if it didn't look like a review at all
        Title          : string | $null             # text after the leading '## ' (e.g., 'Code Review')
        Motivation     : string | $null
        Approach       : string | $null
        SummaryLine    : string | $null             # raw verdict line text
        Verdict        : 'lgtm'|'needs_human_review'|'needs_changes'|'reject'|'unknown'
        Findings       : Finding[]
        HasMultiModel  : bool                       # detected a 'Multi-Model' / 'Step 5' section
        MultiModelSkipDocumented : bool             # 'Multi-model review skipped: ...'
        HasGrillSection: bool
        GrillWordCount : int                        # length of content after a Grill / Step 6 heading
        RawText        : string
        ParseWarnings  : string[]
      }

    Each Finding:
      {
        Severity   : 'error'|'warning'|'suggestion'|'unknown'
        Category   : string                         # text after the icon, before the dash
        Title      : string                         # text after the dash
        Body       : string                         # paragraph text under the heading
        FileRefs   : @( @{ File=...; Line=int|null }, ... )
      }

.NOTES
    The parser is intentionally permissive. We want to extract everything
    the reviewer produced so downstream matchers can be strict; we don't
    want to reject reviews because of cosmetic formatting drift.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Verdict detection ---------------------------------------------------

function Get-VerdictFromSummary {
    [CmdletBinding()]
    param([string] $SummaryLine)

    if (-not $SummaryLine) { return 'unknown' }
    $t = $SummaryLine.ToLowerInvariant()

    # Order matters: 'needs human review' must beat 'needs changes' before 'lgtm'
    if ($t -match 'reject')             { return 'reject' }
    if ($t -match 'needs[\s\-]?human')  { return 'needs_human_review' }
    if ($t -match 'needs[\s\-]?changes') { return 'needs_changes' }
    if ($t -match 'lgtm|looks good to me|approved') { return 'lgtm' }
    return 'unknown'
}

# --- Severity detection from finding heading ----------------------------

function Get-SeverityFromHeading {
    [CmdletBinding()]
    param([string] $HeadingText)

    if (-not $HeadingText) { return 'unknown' }
    # Accept emoji OR textual fallback (severity icons may be stripped).
    if ($HeadingText -match '❌|:x:|\bError\b|\b\[ERROR\]') { return 'error' }
    if ($HeadingText -match '⚠️|⚠|:warning:|\bWarning\b|\b\[WARN(ING)?\]') { return 'warning' }
    if ($HeadingText -match '💡|:bulb:|\bSuggestion\b|\bNote\b|\b\[SUGGEST(ION)?\]') { return 'suggestion' }
    return 'unknown'
}

# --- File / line reference extraction -----------------------------------

# Match references like:
#   src/foo.ts:42
#   `src/foo.ts:42`
#   `src/foo.ts` line 42
#   src\foo.ts:42
#   path/to/File.cs (line 100)
$script:FileRefPatterns = @(
    # path:line in backticks   `src/foo.ts:42`  or  `src/foo.ts:42-50`
    '(?<file>[\w./\\][\w./\\\-]*\.[\w]+):(?<line>\d+)',
    # path then 'line N' / '(line N)'
    '(?<file>[\w./\\][\w./\\\-]*\.[\w]+)\s*\(?\bline[s]?\s+(?<line>\d+)\)?'
)

# Bare file (no line)
$script:BareFilePattern = '(?<file>[\w./\\][\w./\\\-]*\.[\w]+)'

function Get-FileRefs {
    [CmdletBinding()]
    param([string] $Text)

    $refs = New-Object System.Collections.Generic.List[object]
    $seen = New-Object System.Collections.Generic.HashSet[string]

    foreach ($pattern in $script:FileRefPatterns) {
        $matches = [regex]::Matches($Text, $pattern)
        foreach ($m in $matches) {
            $file = ($m.Groups['file'].Value -replace '\\', '/').Trim('`', '"', "'", '(', ')')
            $line = [int]$m.Groups['line'].Value
            $key = "${file}:${line}"
            if ($seen.Add($key)) {
                $refs.Add([PSCustomObject]@{ File = $file; Line = $line })
            }
        }
    }

    # Also collect bare files (line=null) so semantic-only matchers have something to work with.
    $bareMatches = [regex]::Matches($Text, $script:BareFilePattern)
    foreach ($m in $bareMatches) {
        $file = ($m.Groups['file'].Value -replace '\\', '/').Trim('`', '"', "'", '(', ')')
        # Skip if we already have a (file, line) for this file — line is more specific.
        if (-not ($refs | Where-Object { $_.File -eq $file -and $_.Line })) {
            $key = "${file}:"
            if ($seen.Add($key)) {
                $refs.Add([PSCustomObject]@{ File = $file; Line = $null })
            }
        }
    }

    return ,$refs.ToArray()
}

# --- Main parser --------------------------------------------------------

function ConvertFrom-ReviewMarkdown {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string] $Markdown)

    $warnings = New-Object System.Collections.Generic.List[string]
    $lines = $Markdown -split "(`r`n|`n)"
    # split returns the separators too when using a capture group — strip them
    $lines = @($lines | Where-Object { $_ -notmatch '^(?:`r`n|`n)$' })

    $title          = $null
    $motivation     = $null
    $approach       = $null
    $summaryLine    = $null
    $findings       = New-Object System.Collections.Generic.List[object]
    $hasMultiModel  = $false
    $multiModelSkipDocumented = $false
    $hasGrillSection = $false
    $grillContent   = New-Object System.Text.StringBuilder

    # State machine: walk lines, track current section + current finding-being-built.
    $section = 'preamble'
    $currentFindingHeading = $null
    $currentFindingBody    = New-Object System.Text.StringBuilder

    function _FlushFinding {
        param($Heading, $Body, $List)
        if (-not $Heading) { return }
        $bodyText = $Body.ToString().Trim()
        $headingClean = $Heading -replace '^#+\s*', ''

        # Try to split "Severity Category — Description"
        $severity = Get-SeverityFromHeading -HeadingText $headingClean
        # Strip the leading icon/severity word
        $rest = $headingClean -replace '^(?:❌|⚠️|⚠|💡|:[a-z]+:|\[(?:ERROR|WARN(?:ING)?|SUGGEST(?:ION)?)\]|Error|Warning|Suggestion|Note)\s*', ''
        $category = ''
        $titleText = $rest
        # Dash splitter: handle —, –, -, or :
        if ($rest -match '^\s*(?<cat>[^—–\-:]+?)\s*[—–\-:]\s*(?<title>.+)$') {
            $category = $matches.cat.Trim()
            $titleText = $matches.title.Trim()
        }

        $combinedForRefs = "$titleText`n$bodyText"
        $refs = Get-FileRefs -Text $combinedForRefs

        $List.Add([PSCustomObject]@{
            Severity = $severity
            Category = $category
            Title    = $titleText
            Body     = $bodyText
            FileRefs = $refs
            Heading  = $headingClean
        })
    }

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        # Detect H2 'Code Review' title
        if ($line -match '^##\s+(?:🤖\s*)?(.+?)\s*$' -and -not $title) {
            $title = $matches[1].Trim()
            continue
        }

        # Detect main sections (H3)
        if ($line -match '^###\s+(.+?)\s*$') {
            # First, flush any in-progress finding.
            if ($currentFindingHeading) {
                _FlushFinding -Heading $currentFindingHeading -Body $currentFindingBody -List $findings
                $currentFindingHeading = $null
                $currentFindingBody = New-Object System.Text.StringBuilder
            }
            $h = $matches[1].Trim()
            $hLower = $h.ToLowerInvariant()
            if     ($hLower -match 'holistic|summary|verdict')  { $section = 'holistic' }
            elseif ($hLower -match 'detailed findings|findings|issues') { $section = 'findings' }
            elseif ($hLower -match 'multi[\s\-]?model|step\s*5') {
                $section = 'multi_model'
                $hasMultiModel = $true
            }
            elseif ($hLower -match 'grill|self[\s\-]?critique|step\s*6') {
                $section = 'grill'
                $hasGrillSection = $true
            }
            elseif ($hLower -match 'independent assessment|step\s*2') { $section = 'independent' }
            elseif ($hLower -match 'pr narrative|reconcil|step\s*3')  { $section = 'reconcile' }
            else { $section = 'other' }
            continue
        }

        # Detect finding headings (H4)
        if ($section -eq 'findings' -and $line -match '^####\s+(.+?)\s*$') {
            if ($currentFindingHeading) {
                _FlushFinding -Heading $currentFindingHeading -Body $currentFindingBody -List $findings
            }
            $currentFindingHeading = $matches[1].Trim()
            $currentFindingBody = New-Object System.Text.StringBuilder
            continue
        }

        # Within findings, accumulate body
        if ($section -eq 'findings' -and $currentFindingHeading) {
            [void]$currentFindingBody.AppendLine($line)
            continue
        }

        # Within holistic / preamble, capture Motivation / Approach / Summary lines
        if ($section -in @('holistic','preamble','independent','reconcile','other')) {
            if ($line -match '^\s*\*\*Motivation\*\*\s*[:\-]\s*(.*)$') {
                $motivation = $matches[1].Trim()
                continue
            }
            if ($line -match '^\s*\*\*Approach\*\*\s*[:\-]\s*(.*)$') {
                $approach = $matches[1].Trim()
                continue
            }
            if ($line -match '^\s*\*\*Summary\*\*\s*[:\-]\s*(.*)$') {
                $summaryLine = $matches[1].Trim()
                continue
            }
        }

        # Capture grill content for word count
        if ($section -eq 'grill') {
            [void]$grillContent.AppendLine($line)
        }

        # Detect documented skip
        if ($line -match 'multi[\s\-]?model.+(skip|skipped)' -or
            $line -match '(skip|skipped).+multi[\s\-]?model') {
            $multiModelSkipDocumented = $true
        }
    }

    # Flush trailing finding
    if ($currentFindingHeading) {
        _FlushFinding -Heading $currentFindingHeading -Body $currentFindingBody -List $findings
    }

    # If no explicit Summary line was found, scan whole text for verdict tokens.
    if (-not $summaryLine) {
        $verdictMatch = [regex]::Match($Markdown, '(?im)^[\s\*]*Summary[\s\*]*[:\-]\s*(.+)$')
        if ($verdictMatch.Success) { $summaryLine = $verdictMatch.Groups[1].Value.Trim() }
    }
    $verdict = Get-VerdictFromSummary -SummaryLine $summaryLine

    # If still unknown, fall back: search markdown for a verdict token.
    if ($verdict -eq 'unknown') {
        $verdict = Get-VerdictFromSummary -SummaryLine $Markdown
    }

    $grillText = $grillContent.ToString()
    $grillWords = if ($grillText.Trim()) { ($grillText -split '\s+' | Where-Object { $_ }).Count } else { 0 }

    $parseable = ($title -or $findings.Count -gt 0 -or $verdict -ne 'unknown')
    if (-not $parseable) {
        $warnings.Add('Could not identify any review structure (no title, findings, or verdict).')
    }

    return [PSCustomObject]@{
        Parseable                 = $parseable
        Title                     = $title
        Motivation                = $motivation
        Approach                  = $approach
        SummaryLine               = $summaryLine
        Verdict                   = $verdict
        Findings                  = $findings.ToArray()
        HasMultiModel             = $hasMultiModel
        MultiModelSkipDocumented  = $multiModelSkipDocumented
        HasGrillSection           = $hasGrillSection
        GrillWordCount            = $grillWords
        RawText                   = $Markdown
        ParseWarnings             = $warnings.ToArray()
    }
}

Export-ModuleMember -Function ConvertFrom-ReviewMarkdown, Get-VerdictFromSummary, Get-SeverityFromHeading, Get-FileRefs
