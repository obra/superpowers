$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$skill = Join-Path $repoRoot "skills\using-superpowers\SKILL.md"
$content = Get-Content -LiteralPath $skill -Raw

function Fail($message) {
  Write-Error "FAIL: $message"
  exit 1
}

if ($content -notmatch [regex]::Escape("description: Use when a user asks to implement, debug, review, plan, research, automate, or modify files and a specialized skill may apply")) {
  Fail "using-superpowers description should be scoped to concrete work where a specialized skill may apply"
}

if ($content -notmatch [regex]::Escape("Invoke a skill when the user request clearly matches a skill description or explicitly names a skill.")) {
  Fail "using-superpowers rule should invoke skills on clear matches or explicit skill requests"
}

if ($content -match [regex]::Escape("Use when starting any conversation")) {
  Fail "using-superpowers should not trigger on every conversation start"
}

if ($content -match [regex]::Escape("1% chance")) {
  Fail "using-superpowers should not use the broad 1% chance trigger"
}

if ($content -match [regex]::Escape("This is just a simple question")) {
  Fail "using-superpowers should not frame every simple question as requiring a skill check"
}

Write-Output "PASS: using-superpowers trigger scope is concrete and explicit"
