<#
.SYNOPSIS
    Run the Node-based unit tests for the dashboard JS helpers in
    dashboard/assets/app.js.

    Skipped automatically when node is not on PATH.

    Run:
        Invoke-Pester -Path tests/dashboard/Dashboard-JS.Tests.ps1 -Output Detailed
#>

BeforeAll {
    $script:RepoRoot   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:TestScript = Join-Path $PSScriptRoot 'app-tests.mjs'
}

Describe 'dashboard/assets/app.js (node tests)' {

    It 'passes the node-based unit tests' {
        $node = Get-Command node -ErrorAction SilentlyContinue
        if (-not $node) {
            Set-ItResult -Skipped -Because 'node is not installed on this machine'
            return
        }
        $output = & $node.Source $TestScript 2>&1
        $exit = $LASTEXITCODE
        $joined = ($output -join "`n")
        if ($exit -ne 0) {
            throw "node app-tests.mjs failed with exit code $exit`n$joined"
        }
        # Sanity check: the script prints "N passed, 0 failed" at the end.
        if ($joined -notmatch '\bpassed, 0 failed\b') {
            throw "node app-tests.mjs did not report a clean pass:`n$joined"
        }
    }
}
