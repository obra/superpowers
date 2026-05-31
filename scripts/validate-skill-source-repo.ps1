param([string] $RepoRoot = (Resolve-Path ".").Path)

$ErrorActionPreference = "Stop"

$ResolvedRepoRoot = (Resolve-Path $RepoRoot).Path
$ScriptsDir = Join-Path $ResolvedRepoRoot "scripts"
$Validator = Join-Path $ScriptsDir "validate_skill_source_repo.py"

& python $Validator
if ($LASTEXITCODE -ne 0) {
    throw "Skill source repo validation failed with exit code $LASTEXITCODE"
}
