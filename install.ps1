# Superpowers 로컬 설치 스크립트 (Windows PowerShell)
# 사용법: PowerShell에서 실행:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned  (최초 1회)
#   .\install.ps1

$ErrorActionPreference = "Stop"
$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Superpowers 로컬 설치 시작 ===" -ForegroundColor Cyan

# 1. 스킬 설치
$SkillsTarget = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force -Path $SkillsTarget | Out-Null
$skills = Get-ChildItem "$RepoDir\skills" -Directory
foreach ($skill in $skills) {
    $dest = "$SkillsTarget\$($skill.Name)"
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item "$($skill.FullName)\*" -Destination $dest -Recurse -Force
}
Write-Host "✓ 스킬 설치 완료 ($($skills.Count)개)" -ForegroundColor Green

# 2. 커맨드 설치
$CommandsTarget = "$env:USERPROFILE\.claude\commands"
New-Item -ItemType Directory -Force -Path $CommandsTarget | Out-Null
$cmds = Get-ChildItem "$RepoDir\commands" -Filter "*.md"
foreach ($cmd in $cmds) {
    Copy-Item $cmd.FullName -Destination $CommandsTarget -Force
}
Write-Host "✓ 커맨드 설치 완료 ($($cmds.Count)개)" -ForegroundColor Green

# 3. settings.json 설정
$SettingsFile = "$env:USERPROFILE\.claude\settings.json"
$HookCmd = "$RepoDir\hooks\run-hook.cmd"

if (Test-Path $SettingsFile) {
    Copy-Item $SettingsFile "$SettingsFile.backup" -Force
    Write-Host "✓ 기존 settings.json 백업됨" -ForegroundColor Yellow
}

$settings = @{
    "`$schema" = "https://json.schemastore.org/claude-code-settings.json"
    hooks = @{
        SessionStart = @(
            @{
                matcher = "startup|resume|clear|compact"
                hooks = @(
                    @{
                        type = "command"
                        command = "$HookCmd session-start"
                        async = $false
                    }
                )
            }
        )
    }
    permissions = @{
        allow = @("Skill")
    }
}

$settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile -Encoding UTF8
Write-Host "✓ ~/.claude/settings.json 설정 완료" -ForegroundColor Green

# 4. worktrunk 설치 (선택)
if (-not (Get-Command wt -ErrorAction SilentlyContinue)) {
    if (Get-Command cargo -ErrorAction SilentlyContinue) {
        Write-Host "worktrunk 설치 중..." -ForegroundColor Yellow
        cargo install worktrunk
        Write-Host "✓ worktrunk 설치 완료" -ForegroundColor Green
    } else {
        Write-Host "⚠️  worktrunk 건너뜀 (Rust 없음 - https://rustup.rs 설치 후 'cargo install worktrunk' 실행)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ worktrunk 이미 설치됨" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 설치 완료 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "사용 방법:"
Write-Host "  /brainstorm   -아이디어 설계 대화"
Write-Host "  /write-plan   -구현 계획서 작성"
Write-Host "  /execute-plan -계획 단계별 실행"
Write-Host "  wt switch [branch] - 병렬 worktree 전환"
Write-Host ""
Write-Host "새 Claude Code 세션을 시작하면 superpowers가 자동으로 활성화됩니다." -ForegroundColor Green
