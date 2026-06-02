#Requires -Version 5.1
# Bisection script to find which test creates unwanted files/state
# Usage: .\find-polluter.ps1 <file_or_dir_to_check> <test_pattern>
# Example: .\find-polluter.ps1 '.git' 'src\**\*.test.ts'

param(
    [Parameter(Mandatory=$true)]
    [string]$PollutionCheck,
    [Parameter(Mandatory=$true)]
    [string]$TestPattern
)

Write-Host "Searching for test that creates: $PollutionCheck"
Write-Host "Test pattern: $TestPattern"
Write-Host ""

# Get list of test files using Get-ChildItem -Recurse
# Support patterns like 'src/**/*.test.ts' (bash) or 'src\**\*.test.ts' (PS native)
$normalizedPattern = $TestPattern -replace '\\', '/'
if ($normalizedPattern -match '^(.+?)/\*\*/(.+)$') {
    $searchDir = $Matches[1]
    $filter = $Matches[2]
    $TEST_FILES = Get-ChildItem -Recurse -Path $searchDir -Filter $filter -ErrorAction SilentlyContinue | Sort-Object Name
} else {
    $TEST_FILES = Get-ChildItem -Recurse -Path '.' -Filter $TestPattern -ErrorAction SilentlyContinue | Sort-Object Name
}

$TOTAL = @($TEST_FILES).Count
Write-Host "Found $TOTAL test files"
Write-Host ""

$COUNT = 0
foreach ($TEST_FILE in $TEST_FILES) {
    $COUNT++

    # Skip if pollution already exists
    if (Test-Path $PollutionCheck) {
        Write-Host "WARNING: Pollution already exists before test $COUNT/$TOTAL"
        Write-Host "   Skipping: $TEST_FILE"
        continue
    }

    Write-Host "[$COUNT/$TOTAL] Testing: $TEST_FILE"

    # Run the test
    try {
        npm test "$TEST_FILE" >$null 2>&1
    } catch {
        # Ignore test failures (equivalent to || true)
    }

    # Check if pollution appeared
    if (Test-Path $PollutionCheck) {
        Write-Host ""
        Write-Host "FOUND POLLUTER!"
        Write-Host "   Test: $TEST_FILE"
        Write-Host "   Created: $PollutionCheck"
        Write-Host ""
        Write-Host "Pollution details:"
        Get-ChildItem $PollutionCheck | Format-Table -AutoSize
        Write-Host ""
        Write-Host "To investigate:"
        Write-Host "  npm test $TEST_FILE    # Run just this test"
        Write-Host "  Get-Content $TEST_FILE # Review test code"
        exit 1
    }
}

Write-Host ""
Write-Host "No polluter found - all tests clean!"
exit 0
