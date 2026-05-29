<#
.SYNOPSIS
    Pester tests for the per-commit skill-eval workflow scripts:
      scripts/detect-changed-skills.ps1
      scripts/wrap-eval-output.ps1
      scripts/build-manifest.ps1
      evals/code-review/run-eval.ps1 (Pattern A aggregation)

    Run:
        Invoke-Pester -Path tests/skill-eval/SkillEval.Tests.ps1 -Output Detailed
#>

BeforeAll {
    $script:RepoRoot   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:DetectPs1  = Join-Path $RepoRoot 'scripts' 'detect-changed-skills.ps1'
    $script:WrapPs1    = Join-Path $RepoRoot 'scripts' 'wrap-eval-output.ps1'
    $script:BuildPs1   = Join-Path $RepoRoot 'scripts' 'build-manifest.ps1'
    $script:RunEvalPs1 = Join-Path $RepoRoot 'evals' 'code-review' 'run-eval.ps1'
    $script:Utf8NoBom  = New-Object System.Text.UTF8Encoding($false)

    function script:New-TempDir {
        $p = Join-Path ([IO.Path]::GetTempPath()) ("skilleval-tests-" + [Guid]::NewGuid().ToString('N').Substring(0,12))
        New-Item -ItemType Directory -Path $p | Out-Null
        return $p
    }
}

# ============================================================================
# detect-changed-skills.ps1
# ============================================================================

Describe 'detect-changed-skills.ps1' {

    BeforeEach {
        $script:Repo = New-TempDir
        Push-Location $Repo
        & git init -q
        & git config user.email "t@example.com"
        & git config user.name "t"
        New-Item -ItemType Directory -Path "evals" | Out-Null
        New-Item -ItemType Directory -Path "skills" | Out-Null
        Set-Content "README.md" "init"
        & git add .
        & git commit -q -m "init"
    }

    AfterEach {
        Pop-Location
        Remove-Item -Recurse -Force $Repo -ErrorAction SilentlyContinue
    }

    It 'returns [] when no skills exist' {
        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef '--full-sweep'
        $out | Should -Be '[]'
    }

    It 'returns a skill when its run-eval.ps1 exists and matching paths changed' {
        New-Item -ItemType Directory -Path "evals/code-review" | Out-Null
        Set-Content "evals/code-review/run-eval.ps1" "# stub"
        & git add .
        & git commit -q -m "add eval"

        New-Item -ItemType Directory -Path "skills/code-review" | Out-Null
        Set-Content "skills/code-review/SKILL.md" "edit"
        & git add .
        & git commit -q -m "edit skill"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef "HEAD~1" -HeadRef HEAD
        $out | Should -Be '["code-review"]'
    }

    It 'returns [] when no relevant paths changed' {
        New-Item -ItemType Directory -Path "evals/code-review" | Out-Null
        Set-Content "evals/code-review/run-eval.ps1" "# stub"
        & git add .
        & git commit -q -m "add eval"

        Set-Content "README.md" "edit unrelated"
        & git add .
        & git commit -q -m "unrelated"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef "HEAD~1" -HeadRef HEAD
        $out | Should -Be '[]'
    }

    It 'sweeps every skill with run-eval.ps1 when evals/_shared/ changes' {
        New-Item -ItemType Directory -Path "evals/code-review" | Out-Null
        New-Item -ItemType Directory -Path "evals/other-skill" | Out-Null
        New-Item -ItemType Directory -Path "evals/_shared" | Out-Null
        Set-Content "evals/code-review/run-eval.ps1" "# stub"
        Set-Content "evals/other-skill/run-eval.ps1" "# stub"
        Set-Content "evals/_shared/README.md" "shared"
        & git add .
        & git commit -q -m "add suites + shared"

        Set-Content "evals/_shared/README.md" "shared v2"
        & git add .
        & git commit -q -m "edit shared"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef "HEAD~1" -HeadRef HEAD
        $out | Should -Be '["code-review","other-skill"]'
    }

    It 'excludes skills without run-eval.ps1' {
        New-Item -ItemType Directory -Path "evals/code-review" | Out-Null
        New-Item -ItemType Directory -Path "skills/no-eval-skill" | Out-Null
        Set-Content "evals/code-review/run-eval.ps1" "# stub"
        Set-Content "skills/no-eval-skill/SKILL.md" "x"
        & git add .
        & git commit -q -m "add"

        Set-Content "skills/no-eval-skill/SKILL.md" "y"
        & git add .
        & git commit -q -m "edit no-eval"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef "HEAD~1" -HeadRef HEAD
        $out | Should -Be '[]'
    }

    It 'full-sweep mode returns every skill regardless of git state' {
        New-Item -ItemType Directory -Path "evals/aaa-skill" | Out-Null
        New-Item -ItemType Directory -Path "evals/bbb-skill" | Out-Null
        Set-Content "evals/aaa-skill/run-eval.ps1" "# stub"
        Set-Content "evals/bbb-skill/run-eval.ps1" "# stub"
        & git add .
        & git commit -q -m "add"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef '--full-sweep'
        $out | Should -Be '["aaa-skill","bbb-skill"]'
    }

    It 'OnlySkills allow-list intersects results' {
        New-Item -ItemType Directory -Path "evals/aaa-skill" | Out-Null
        New-Item -ItemType Directory -Path "evals/bbb-skill" | Out-Null
        Set-Content "evals/aaa-skill/run-eval.ps1" "# stub"
        Set-Content "evals/bbb-skill/run-eval.ps1" "# stub"
        & git add .
        & git commit -q -m "add"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef '--full-sweep' -OnlySkills "bbb-skill"
        $out | Should -Be '["bbb-skill"]'
    }

    It 'auto-discovers repo root from a deep subdirectory' {
        # Regression for Copilot finding: Find-RepoRoot must traverse
        # ancestors correctly when no -RepoRoot is passed.
        New-Item -ItemType Directory -Path "evals/aaa-skill" | Out-Null
        Set-Content "evals/aaa-skill/run-eval.ps1" "# stub"
        New-Item -ItemType Directory -Path "skills/aaa-skill/subdir/deeper" -Force | Out-Null
        Set-Content "skills/aaa-skill/subdir/deeper/notes.md" "x"
        & git add .
        & git commit -q -m "init"

        # Run the script with cwd inside skills/<skill>/subdir/deeper —
        # Find-RepoRoot has to walk up three directories to locate
        # `evals/`. No -RepoRoot passed.
        $deep = Join-Path $Repo 'skills/aaa-skill/subdir/deeper'
        $out = pwsh -NoProfile -Command "Set-Location '$deep'; & '$DetectPs1' -FullSweep"
        $out | Should -Be '["aaa-skill"]'
    }

    It 'handles a skill directory rename via git diff' {
        New-Item -ItemType Directory -Path "skills/old-name" | Out-Null
        Set-Content "skills/old-name/SKILL.md" "old"
        New-Item -ItemType Directory -Path "evals/new-name" | Out-Null
        Set-Content "evals/new-name/run-eval.ps1" "# stub"
        & git add .
        & git commit -q -m "init"

        # Rename old -> new (preserves history; old dir no longer exists)
        & git mv "skills/old-name" "skills/new-name"
        & git commit -q -m "rename"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef "HEAD~1" -HeadRef HEAD
        $arr = $out | ConvertFrom-Json
        # Git's default rename detection may collapse the diff to show
        # only the destination path. The new skill (which still has
        # run-eval.ps1) must be re-evaluated; the old name no longer
        # exists so it's correctly absent from the matrix.
        @($arr) | Should -Contain 'new-name'
    }

    It 'does not full-sweep on evals/_docs/ changes' {
        New-Item -ItemType Directory -Path "evals/aaa-skill" | Out-Null
        New-Item -ItemType Directory -Path "evals/_docs" | Out-Null
        Set-Content "evals/aaa-skill/run-eval.ps1" "# stub"
        Set-Content "evals/_docs/headline-score.md" "doc"
        & git add .
        & git commit -q -m "add docs + skill"

        Set-Content "evals/_docs/headline-score.md" "doc v2"
        & git add .
        & git commit -q -m "edit doc only"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef "HEAD~1" -HeadRef HEAD
        $out | Should -Be '[]'
    }

    It 'still full-sweeps on evals/_shared/ changes' {
        New-Item -ItemType Directory -Path "evals/aaa-skill" | Out-Null
        New-Item -ItemType Directory -Path "evals/_shared" | Out-Null
        Set-Content "evals/aaa-skill/run-eval.ps1" "# stub"
        Set-Content "evals/_shared/lib.ps1" "shared"
        & git add .
        & git commit -q -m "add shared + skill"

        Set-Content "evals/_shared/lib.ps1" "shared v2"
        & git add .
        & git commit -q -m "edit shared"

        $out = & pwsh -NoProfile -File $DetectPs1 -RepoRoot $Repo -BaseRef "HEAD~1" -HeadRef HEAD
        $out | Should -Be '["aaa-skill"]'
    }
}

# ============================================================================
# wrap-eval-output.ps1
# ============================================================================

Describe 'wrap-eval-output.ps1' {

    BeforeEach {
        $script:Pages   = New-TempDir
        $script:EvalOut = New-TempDir
    }

    AfterEach {
        Remove-Item -Recurse -Force $Pages -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force $EvalOut -ErrorAction SilentlyContinue
    }

    It 'writes a single JSONL row + run-detail file for a good run' {
        $headline = @{
            schema_version = 1; pattern = "A"; headline_score = 87.5
            status = "ok"; adapter = "smoke"; trials = 3
            metrics = @{ tp = 21; fn = 3; case_count = 8; required_bug_count = 24 }
        } | ConvertTo-Json -Compress -Depth 10
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $headline, $Utf8NoBom)
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'),
            (@{ schema_version=1; pattern="A"; detail=@{ cases=@() } } | ConvertTo-Json -Compress -Depth 10), $Utf8NoBom)

        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "abc1234567" -CommitMessage "msg" -CommitAuthor "a" -Timestamp "2026-05-29T00:00:00Z" | Out-Null

        $hist = Join-Path $Pages 'data/code-review/history.jsonl'
        $hist | Should -Exist
        $lines = @(Get-Content $hist | Where-Object { $_ })
        $lines.Count | Should -Be 1
        $row = $lines[0] | ConvertFrom-Json
        $row.headline_score | Should -Be 87.5
        $row.status | Should -Be 'ok'
        $row.short_sha | Should -Be 'abc1234'
        $row.metrics.tp | Should -Be 21
        $row.detail_file | Should -Be 'runs/2026-05-29T00-00-00Z-abc1234.json'

        $detailPath = Join-Path $Pages 'data/code-review' $row.detail_file
        $detailPath | Should -Exist
        $detail = Get-Content $detailPath -Raw | ConvertFrom-Json
        $detail.skill | Should -Be 'code-review'
        $detail.pattern | Should -Be 'A'
    }

    It 'appends a second row without losing the first' {
        @(
            @{ ts = "2026-05-29T00:00:00Z"; commit = "aaaa1111000"; score = 50.0 }
            @{ ts = "2026-05-29T01:00:00Z"; commit = "bbbb2222000"; score = 75.0 }
        ) | ForEach-Object {
            $h = @{ schema_version=1; pattern="A"; headline_score=$_.score; status="ok"; adapter="smoke"; trials=1
                   metrics = @{ tp=1; fn=0; case_count=1; required_bug_count=1 } } | ConvertTo-Json -Compress -Depth 5
            [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $h, $Utf8NoBom)
            [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'),
                (@{ schema_version=1; pattern="A"; detail=@{} } | ConvertTo-Json -Compress), $Utf8NoBom)
            & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit $_.commit -Timestamp $_.ts | Out-Null
        }

        $lines = Get-Content (Join-Path $Pages 'data/code-review/history.jsonl')
        $lines.Count | Should -Be 2
        ($lines[0] | ConvertFrom-Json).headline_score | Should -Be 50.0
        ($lines[1] | ConvertFrom-Json).headline_score | Should -Be 75.0
    }

    It 'emits an error row + no detail file when headline-score.json is missing' {
        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "ffff0000111" -Timestamp "2026-05-29T00:00:00Z" | Out-Null

        $lines = @(Get-Content (Join-Path $Pages 'data/code-review/history.jsonl') | Where-Object { $_ })
        $row = $lines[0] | ConvertFrom-Json
        $row.status | Should -Be 'error'
        $row.headline_score | Should -BeNullOrEmpty
        $row.detail_file | Should -BeNullOrEmpty
        $row.error | Should -Match 'not produced'

        Test-Path (Join-Path $Pages 'data/code-review/runs') | Should -BeTrue
        (Get-ChildItem (Join-Path $Pages 'data/code-review/runs') -File -ErrorAction SilentlyContinue).Count | Should -Be 0
    }

    It 'writes UTF-8 without BOM' {
        $headline = @{ schema_version=1; pattern="A"; headline_score=0; status="ok"; adapter="smoke"; trials=1; metrics=@{ tp=0; fn=0; case_count=0; required_bug_count=0 } } | ConvertTo-Json -Compress -Depth 5
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $headline, $Utf8NoBom)
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'), '{"schema_version":1,"pattern":"A","detail":{}}', $Utf8NoBom)
        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "aaa111" -Timestamp "2026-05-29T00:00:00Z" | Out-Null

        $bytes = [IO.File]::ReadAllBytes((Join-Path $Pages 'data/code-review/history.jsonl'))
        ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) | Should -BeFalse
    }

    It 'demotes a contract-violating status=ok to status=error' {
        $bad = '{"schema_version":1,"pattern":"A","headline_score":null,"status":"ok","adapter":"smoke","trials":1,"metrics":{}}'
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $bad, $Utf8NoBom)
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'), '{"schema_version":1,"pattern":"A","detail":{}}', $Utf8NoBom)

        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "abc123" -Timestamp "2026-05-29T00:00:00Z" 2>&1 | Out-Null
        $lines = @(Get-Content (Join-Path $Pages 'data/code-review/history.jsonl') | Where-Object { $_ })
        $row = $lines[0] | ConvertFrom-Json
        $row.status | Should -Be 'error'
        $row.headline_score | Should -BeNullOrEmpty
        $row.detail_file | Should -BeNullOrEmpty
        $row.error | Should -Match 'contract violation'
    }

    It 'demotes status=ok when headline_score is out of range' {
        $bad = '{"schema_version":1,"pattern":"A","headline_score":150,"status":"ok","adapter":"smoke","trials":1,"metrics":{}}'
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $bad, $Utf8NoBom)
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'), '{"schema_version":1,"pattern":"A","detail":{}}', $Utf8NoBom)

        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "abc124" -Timestamp "2026-05-29T00:00:00Z" 2>&1 | Out-Null
        $lines = @(Get-Content (Join-Path $Pages 'data/code-review/history.jsonl') | Where-Object { $_ })
        $row = $lines[0] | ConvertFrom-Json
        $row.status | Should -Be 'error'
        $row.error | Should -Match 'outside \[0,100\]'
    }

    It 'demotes status=ok when run-detail.json is missing' {
        $good = '{"schema_version":1,"pattern":"A","headline_score":75,"status":"ok","adapter":"smoke","trials":1,"metrics":{"tp":3,"fn":1,"case_count":4,"required_bug_count":4}}'
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $good, $Utf8NoBom)
        # No run-detail.json written

        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "abc125" -Timestamp "2026-05-29T00:00:00Z" 2>&1 | Out-Null
        $lines = @(Get-Content (Join-Path $Pages 'data/code-review/history.jsonl') | Where-Object { $_ })
        $row = $lines[0] | ConvertFrom-Json
        $row.status | Should -Be 'error'
        $row.headline_score | Should -BeNullOrEmpty
        $row.error | Should -Match 'run-detail.json not produced'
        # No detail file written
        (Get-ChildItem (Join-Path $Pages 'data/code-review/runs') -File -ErrorAction SilentlyContinue).Count | Should -Be 0
    }

    It 'demotes status=ok when run-detail.json is unparseable' {
        $good = '{"schema_version":1,"pattern":"A","headline_score":75,"status":"ok","adapter":"smoke","trials":1,"metrics":{"tp":3,"fn":1,"case_count":4,"required_bug_count":4}}'
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $good, $Utf8NoBom)
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'), 'not json {{{', $Utf8NoBom)

        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "abc126" -Timestamp "2026-05-29T00:00:00Z" 2>&1 | Out-Null
        $lines = @(Get-Content (Join-Path $Pages 'data/code-review/history.jsonl') | Where-Object { $_ })
        $row = $lines[0] | ConvertFrom-Json
        $row.status | Should -Be 'error'
        $row.error | Should -Match 'Failed to parse run-detail.json'
    }

    It 'demotes status=ok when run-detail.json is missing the detail field' {
        $good = '{"schema_version":1,"pattern":"A","headline_score":75,"status":"ok","adapter":"smoke","trials":1,"metrics":{"tp":3,"fn":1,"case_count":4,"required_bug_count":4}}'
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $good, $Utf8NoBom)
        # Parseable JSON but no `detail` property
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'), '{"schema_version":1,"pattern":"A"}', $Utf8NoBom)

        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "abc127" -Timestamp "2026-05-29T00:00:00Z" 2>&1 | Out-Null
        $lines = @(Get-Content (Join-Path $Pages 'data/code-review/history.jsonl') | Where-Object { $_ })
        $row = $lines[0] | ConvertFrom-Json
        $row.status | Should -Be 'error'
        $row.error | Should -Match "missing required 'detail' field"
    }

    It 'demotes status=ok when run-detail.json has detail=null' {
        $good = '{"schema_version":1,"pattern":"A","headline_score":75,"status":"ok","adapter":"smoke","trials":1,"metrics":{"tp":3,"fn":1,"case_count":4,"required_bug_count":4}}'
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $good, $Utf8NoBom)
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'), '{"schema_version":1,"pattern":"A","detail":null}', $Utf8NoBom)

        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "abc128" -Timestamp "2026-05-29T00:00:00Z" 2>&1 | Out-Null
        $lines = @(Get-Content (Join-Path $Pages 'data/code-review/history.jsonl') | Where-Object { $_ })
        $row = $lines[0] | ConvertFrom-Json
        $row.status | Should -Be 'error'
        $row.error | Should -Match "'detail' field is null"
    }

    It 'tolerates a pre-existing history.jsonl that does not end with a newline' {
        # Seed a history file without trailing LF
        $skillDir = Join-Path $Pages 'data/code-review'
        New-Item -ItemType Directory -Path $skillDir -Force | Out-Null
        $existing = '{"commit":"prev","short_sha":"prev","timestamp":"t0","pattern":"A","headline_score":10.0,"status":"ok","detail_file":"runs/x.json"}'
        [IO.File]::WriteAllText((Join-Path $skillDir 'history.jsonl'), $existing, $Utf8NoBom)
        # Sanity: no trailing newline
        $bytes = [IO.File]::ReadAllBytes((Join-Path $skillDir 'history.jsonl'))
        $bytes[-1] | Should -Not -Be 0x0A

        $h = @{ schema_version=1; pattern="A"; headline_score=20.0; status="ok"; adapter="smoke"; trials=1; metrics=@{ tp=1; fn=0; case_count=1; required_bug_count=1 } } | ConvertTo-Json -Compress -Depth 5
        [IO.File]::WriteAllText((Join-Path $EvalOut 'headline-score.json'), $h, $Utf8NoBom)
        [IO.File]::WriteAllText((Join-Path $EvalOut 'run-detail.json'), '{"schema_version":1,"pattern":"A","detail":{}}', $Utf8NoBom)
        & pwsh -NoProfile -File $WrapPs1 -Skill code-review -EvalOutDir $EvalOut -PagesDir $Pages -Commit "next" -Timestamp "2026-05-29T01:00:00Z" | Out-Null

        $lines = @(Get-Content (Join-Path $skillDir 'history.jsonl') | Where-Object { $_ })
        $lines.Count | Should -Be 2
        ($lines[0] | ConvertFrom-Json).headline_score | Should -Be 10.0
        ($lines[1] | ConvertFrom-Json).headline_score | Should -Be 20.0
    }
}

# ============================================================================
# build-manifest.ps1
# ============================================================================

Describe 'build-manifest.ps1' {

    BeforeAll {
        function global:Write-Jsonl {
            param([string] $Path, [string[]] $JsonLines)
            $dir = Split-Path $Path -Parent
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            $content = ($JsonLines -join "`n") + "`n"
            $enc = New-Object System.Text.UTF8Encoding($false)
            [IO.File]::WriteAllText($Path, $content, $enc)
        }
    }

    AfterAll {
        Remove-Item Function:\Write-Jsonl -ErrorAction SilentlyContinue
    }

    BeforeEach {
        $script:Pages = New-TempDir
    }
    AfterEach {
        Remove-Item -Recurse -Force $Pages -ErrorAction SilentlyContinue
    }

    It 'emits manifest skipping skills with no history' {
        & pwsh -NoProfile -File $BuildPs1 -PagesDir $Pages | Out-Null
        $m = Get-Content (Join-Path $Pages 'data/manifest.json') -Raw | ConvertFrom-Json
        @($m.skills).Count | Should -Be 0
    }

    It 'computes delta_from_previous correctly' {
        Write-Jsonl (Join-Path $Pages 'data/code-review/history.jsonl') @(
            '{"commit":"a","short_sha":"a","timestamp":"t1","pattern":"A","headline_score":50.0,"status":"ok","adapter":"smoke","detail_file":"runs/x1.json"}',
            '{"commit":"b","short_sha":"b","timestamp":"t2","pattern":"A","headline_score":75.0,"status":"ok","adapter":"smoke","detail_file":"runs/x2.json"}'
        )
        & pwsh -NoProfile -File $BuildPs1 -PagesDir $Pages | Out-Null
        $m = Get-Content (Join-Path $Pages 'data/manifest.json') -Raw | ConvertFrom-Json
        @($m.skills).Count | Should -Be 1
        $m.skills[0].name | Should -Be 'code-review'
        $m.skills[0].latest.headline_score | Should -Be 75.0
        $m.skills[0].latest.delta_from_previous | Should -Be 25.0
        $m.skills[0].run_count | Should -Be 2
    }

    It 'tolerates an error row as the latest entry' {
        Write-Jsonl (Join-Path $Pages 'data/code-review/history.jsonl') @(
            '{"commit":"a","short_sha":"a","timestamp":"t1","pattern":"A","headline_score":50.0,"status":"ok","adapter":"smoke","detail_file":"runs/x1.json"}',
            '{"commit":"b","short_sha":"b","timestamp":"t2","pattern":null,"headline_score":null,"status":"error","error":"oops","detail_file":null}'
        )
        & pwsh -NoProfile -File $BuildPs1 -PagesDir $Pages | Out-Null
        $m = Get-Content (Join-Path $Pages 'data/manifest.json') -Raw | ConvertFrom-Json
        $m.skills[0].latest.status | Should -Be 'error'
        $m.skills[0].latest.delta_from_previous | Should -BeNullOrEmpty
        # Pattern is carried forward from the previous ok row.
        $m.skills[0].pattern | Should -Be 'A'
    }

    It 'leaves pattern null when the only history is an error row' {
        Write-Jsonl (Join-Path $Pages 'data/code-review/history.jsonl') @(
            '{"commit":"a","short_sha":"a","timestamp":"t1","pattern":null,"headline_score":null,"status":"error","error":"oops","detail_file":null}'
        )
        & pwsh -NoProfile -File $BuildPs1 -PagesDir $Pages | Out-Null
        $m = Get-Content (Join-Path $Pages 'data/manifest.json') -Raw | ConvertFrom-Json
        $m.skills[0].latest.status | Should -Be 'error'
        $m.skills[0].latest.delta_from_previous | Should -BeNullOrEmpty
        $m.skills[0].pattern | Should -BeNullOrEmpty
    }
}

# ============================================================================
# evals/code-review/run-eval.ps1 — Pattern A aggregation
# ============================================================================

Describe 'evals/code-review/run-eval.ps1' {

    It 'emits the Pattern A contract files against the smoke adapter' {
        $out = New-TempDir
        try {
            & pwsh -NoProfile -File $RunEvalPs1 -OutDir $out *> $null
            $headlinePath = Join-Path $out 'headline-score.json'
            $detailPath   = Join-Path $out 'run-detail.json'
            $headlinePath | Should -Exist
            $detailPath   | Should -Exist
            $h = Get-Content $headlinePath -Raw | ConvertFrom-Json
            $h.schema_version | Should -Be 1
            $h.pattern        | Should -Be 'A'
            $h.adapter        | Should -Be 'smoke'
            $h.status         | Should -Be 'ok'
            $h.headline_score | Should -BeGreaterOrEqual 0
            $h.headline_score | Should -BeLessOrEqual 100
            $expected = [math]::Round((100.0 * $h.metrics.tp / $h.metrics.required_bug_count), 2)
            $h.headline_score | Should -Be $expected
        } finally {
            Remove-Item -Recurse -Force $out -ErrorAction SilentlyContinue
        }
    }

    It 'reports an error when the adapter does not exist' {
        $out = New-TempDir
        try {
            & pwsh -NoProfile -File $RunEvalPs1 -OutDir $out -Adapter "C:\nope-no-adapter.ps1" *> $null
            $h = Get-Content (Join-Path $out 'headline-score.json') -Raw | ConvertFrom-Json
            $h.status | Should -Be 'error'
            $h.headline_score | Should -BeNullOrEmpty
        } finally {
            Remove-Item -Recurse -Force $out -ErrorAction SilentlyContinue
        }
    }

    It 'resolves a short adapter NAME via EVAL_ADAPTER to adapters/<name>.ps1' {
        $out = New-TempDir
        try {
            # No -Adapter arg, just $env:EVAL_ADAPTER set to a short name.
            $env:EVAL_ADAPTER = 'smoke'
            try {
                & pwsh -NoProfile -File $RunEvalPs1 -OutDir $out *> $null
            } finally {
                Remove-Item Env:EVAL_ADAPTER -ErrorAction SilentlyContinue
            }
            $h = Get-Content (Join-Path $out 'headline-score.json') -Raw | ConvertFrom-Json
            $h.status  | Should -Be 'ok'
            $h.adapter | Should -Be 'smoke'
        } finally {
            Remove-Item -Recurse -Force $out -ErrorAction SilentlyContinue
        }
    }

    It 'reports an error when EVAL_ADAPTER points at an unknown name' {
        $out = New-TempDir
        try {
            $env:EVAL_ADAPTER = 'no-such-adapter'
            try {
                & pwsh -NoProfile -File $RunEvalPs1 -OutDir $out *> $null
            } finally {
                Remove-Item Env:EVAL_ADAPTER -ErrorAction SilentlyContinue
            }
            $h = Get-Content (Join-Path $out 'headline-score.json') -Raw | ConvertFrom-Json
            $h.status | Should -Be 'error'
            $h.error  | Should -Match 'adapter not found'
        } finally {
            Remove-Item -Recurse -Force $out -ErrorAction SilentlyContinue
        }
    }
}
