#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Smoke adapter for end-to-end harness testing.

.DESCRIPTION
    Ignores stdin entirely. Reads `caseId` from the request JSON and emits
    a canned review markdown file from ./canned-reviews/<caseId>.review.md
    if present; otherwise echoes a generic "no findings" review.

    Use this only to validate the harness pipeline (sandboxing, scoring,
    report writing). It is NOT a real reviewer.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$requestJson = [Console]::In.ReadToEnd()
$request = $requestJson | ConvertFrom-Json
$caseId = $request.caseId

$cannedDir = Join-Path $PSScriptRoot 'canned-reviews'
$cannedPath = Join-Path $cannedDir "$caseId.review.md"

if (Test-Path -LiteralPath $cannedPath -PathType Leaf) {
    Get-Content -LiteralPath $cannedPath -Raw -Encoding utf8
} else {
    @"
# Review: $caseId

**Motivation:** smoke adapter — no canned review for this case.

**Approach:** placeholder.

## Summary

**Verdict:** LGTM — no findings.

"@
}

# Emit fake META on stderr for cost-tracking pipeline test.
[Console]::Error.WriteLine('META: {"adapter":"smoke","model":"none","latency_ms":0,"tokens_in":0,"tokens_out":0}')
