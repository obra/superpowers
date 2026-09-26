# Installing Superpowers for Trae

Enable Superpowers in Trae without leaving a full cloned Superpowers repository inside your target project. This installer creates a runtime `.trae` directory, installs rules, flattens skills, and refreshes project memory.

## Prerequisites

- [Trae IDE](https://www.trae.ai) installed
- Git available in the local environment

## Installation

Open your target project in Trae and run the setup from that target project's root directory.

Just copy and paste the following prompt into your Trae chat:

> **For the AI Assistant:** Please initialize Superpowers for this project from the project root.
>
> Requirements:
> 1. Treat the current workspace root as the target project root.
> 2. Do not clone the full Superpowers repository into this target project.
> 3. Install `.trae/rules/superpowers.md` from the Trae installer source.
> 4. Fetch `https://github.com/obra/superpowers-skills.git` into a temporary directory, flatten it into `.trae/skills/`, and rename `using-skills` to `using-superpowers`.
> 5. Refresh the existing Superpowers project memory first; if update is not possible, create it as a new project memory entry instead.
> 6. Only remove known bootstrap leftovers such as temporary installer directories.
> 7. Preserve existing files under `.trae/rules/` other than `superpowers.md`.
> 8. Preserve existing custom skills under `.trae/skills/` when their names do not conflict with Superpowers skills. If a same-name skill already exists, replace it with the Superpowers version.
> 9. If `.trae` already contains unexpected non-empty directories or unexpected files beyond `rules`, `skills`, and known temporary leftovers, stop before deleting them and tell me exactly what needs manual review. Empty unexpected directories may stay in place.
> 10. When setup finishes successfully, the target project should only keep `.trae/rules/`, `.trae/skills/`, and the project memory.
> 11. If cleanup fails, finish the setup and explicitly tell me what to delete manually.
> 12. After setup, remind me that dynamic skill loading and memory usage may consume context faster than usual.
>
> **Step 1: Build the Trae runtime layout from the project root**
>
> ```powershell
> if (-not (Test-Path ".trae\rules")) { New-Item -ItemType Directory -Force -Path ".trae\rules" | Out-Null }
>
> $unexpectedEntries = @()
> if (Test-Path ".trae") {
>     $unexpectedEntries = Get-ChildItem -Path ".trae" -Force | Where-Object {
>         if ($_.Name -in @('rules', 'skills') -or $_.Name -like 'temp_*' -or $_.Name -eq 'INSTALL.md') {
>             return $false
>         }
>
>         -not ($_.PSIsContainer -and -not (Get-ChildItem -Path $_.FullName -Force | Select-Object -First 1))
>     }
> }
> if ($unexpectedEntries.Count -gt 0) {
>     Write-Host "Unexpected existing .trae entries detected. Review manually before continuing:"
>     $unexpectedEntries | Select-Object Name, FullName
>     throw "Unsafe to continue automatic cleanup."
> }
>
> Invoke-WebRequest -Uri "https://raw.githubusercontent.com/obra/superpowers/main/.trae/rules/superpowers.md" -OutFile ".trae\rules\superpowers.md"
>
> if (Test-Path ".superpowers_temp") { Remove-Item -Recurse -Force ".superpowers_temp" -ErrorAction SilentlyContinue }
> git clone https://github.com/obra/superpowers-skills.git .superpowers_temp 2>$null
> New-Item -ItemType Directory -Force -Path ".trae\skills" | Out-Null
>
> Get-ChildItem -Path ".superpowers_temp\skills" -Directory | Where-Object { $_.Name -notin @('tool', 'examples') } | ForEach-Object {
>     $entryDir = $_.FullName
>     if (Test-Path (Join-Path $entryDir 'SKILL.md')) {
>         $destinationPath = Join-Path ".trae\skills" $_.Name
>         if (Test-Path $destinationPath) { Remove-Item -Recurse -Force $destinationPath }
>         Copy-Item -Path $entryDir -Destination ".trae\skills\" -Recurse -Force
>     } else {
>         Get-ChildItem -Path $entryDir -Directory | ForEach-Object {
>             $destinationPath = Join-Path ".trae\skills" $_.Name
>             if (Test-Path $destinationPath) { Remove-Item -Recurse -Force $destinationPath }
>             Copy-Item -Path $_.FullName -Destination ".trae\skills\" -Recurse -Force
>         }
>     }
> }
>
> if (Test-Path ".trae\skills\using-skills") { Rename-Item -Path ".trae\skills\using-skills" -NewName "using-superpowers" }
> if (Test-Path ".superpowers_temp") { Remove-Item -Recurse -Force ".superpowers_temp" -ErrorAction SilentlyContinue }
> Get-ChildItem -Path ".trae" -Force | Where-Object { $_.Name -like 'temp_*' -or $_.Name -eq 'INSTALL.md' } | ForEach-Object {
>     Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
> }
> ```
>
> ```bash
> mkdir -p .trae/rules
> unexpected_entries=""
> if [ -d ".trae" ]; then
>   while IFS= read -r path; do
>     name=$(basename "$path")
>     [ "$name" = "rules" ] && continue
>     [ "$name" = "skills" ] && continue
>     case "$name" in
>       temp_*|INSTALL.md) continue ;;
>     esac
>     if [ -d "$path" ] && [ -z "$(find "$path" -mindepth 1 -print -quit)" ]; then
>       continue
>     fi
>     unexpected_entries="${unexpected_entries}${name}\n"
>   done < <(find .trae -mindepth 1 -maxdepth 1)
> fi
> if [ -n "$unexpected_entries" ]; then
>   echo "Unexpected existing .trae entries detected. Review manually before continuing:"
>   printf '%b' "$unexpected_entries"
>   exit 1
> fi
> curl -s -o .trae/rules/superpowers.md https://raw.githubusercontent.com/obra/superpowers/main/.trae/rules/superpowers.md
> rm -rf .superpowers_temp
> git clone https://github.com/obra/superpowers-skills.git .superpowers_temp >/dev/null 2>&1
> mkdir -p .trae/skills
> find .superpowers_temp/skills -mindepth 1 -maxdepth 2 -type f -name SKILL.md -exec dirname {} \; | sort -u | while read dir; do
>   dest=".trae/skills/$(basename "$dir")"
>   rm -rf "$dest"
>   cp -R "$dir" .trae/skills/
> done
> rm -rf .trae/skills/tool .trae/skills/examples
> if [ -d ".trae/skills/using-skills" ]; then mv .trae/skills/using-skills .trae/skills/using-superpowers; fi
> rm -rf .superpowers_temp
> find .trae -mindepth 1 -maxdepth 1 \( -name 'temp_*' -o -name INSTALL.md \) -exec rm -rf {} +
> ```
>
> **Step 2: Refresh or create the project core memory**
>
> Please use `manage_core_memory` with this behavior:
> - First try to update an existing project-level Superpowers workflow memory if one already exists.
> - If no matching memory exists, or the update cannot be completed, add a new project-level memory instead.
>
> Use the following memory content:
> - Title: Superpowers strict workflow constraints
> - Keywords: superpowers|workflow|tdd|debugging|skills
> - Category: Knowledge
> - Via: request
> - Content: This project follows the obra/superpowers methodology: prefer design and test-first development, use systematic debugging for root-cause analysis, invoke skills through the native Skill tool, use TodoWrite for multi-step workflows, and persist cross-task knowledge through manage_core_memory.

## Verify

Ask Trae to confirm all of the following:

1. `.trae/rules/superpowers.md` exists at the target project root.
2. `.trae/skills/using-superpowers` exists.
3. Existing non-Superpowers files under `.trae/rules/` remain untouched.
4. Existing custom skills under `.trae/skills/` remain untouched when their names do not conflict with Superpowers skills.
5. `.trae` contains `rules/` and `skills/` after setup, and only pre-existing empty extra directories may remain untouched. If unexpected files or non-empty extra directories exist, the installer stops safely for manual review.
6. No full `superpowers` repository clone remains inside the target project.
7. The Superpowers project memory was refreshed, or created if refresh was not possible.

## Why this Trae adaptation works

This migration keeps the core Superpowers philosophy while adapting it to Trae's native runtime model.

- **No Hooks Required**: Behavior is constrained through Trae Memory and Workspace Rules rather than external hooks.
- **Flattened Skills Directory**: Trae currently resolves skills more reliably from a flat `.trae/skills/` structure.
- **Flowcharts -> Trae Todo List**: Guided workflows map naturally onto Trae's Todo List instead of terminal-only checklists.
- **Local Knowledge -> Trae Core Memory**: This replaces `remembering-conversations` with `manage_core_memory`, and benefits from Trae's memory update mechanism to keep context more active and better coordinated over time.

## Migrating from older Trae setup

If you previously tested an earlier Trae bootstrap:

- Remove stale `.trae/temp_*` directories
- Remove nested or duplicated `.trae/skills` layouts
- Re-run the installation prompt above from the project root

## Updating

Ask the Trae assistant to run the same installation prompt again from the target project root. It should rebuild `.trae/skills/`, keep `.trae/rules/superpowers.md` active, and refresh the existing project memory before falling back to creating one.

## Troubleshooting

- If `.trae` already contains unexpected non-empty directories or unexpected files outside `rules/` and `skills/`, do not delete them blindly. Ask Trae to list them and wait for manual review.
- If `.trae` already contains unexpected empty directories outside `rules/` and `skills/`, the installer may leave them untouched in lax mode.
- If `.trae` still contains temporary installer leftovers such as `temp_*` after setup, ask Trae to delete only those leftovers and verify again.
- If a same-name skill already exists under `.trae/skills/`, expect it to be replaced by the Superpowers version during installation.
- If a different-name custom skill already exists under `.trae/skills/`, expect it to be preserved.
- If a full `superpowers` clone was accidentally created inside the target project, delete it and rerun the installer.
- If memory refresh fails because no matching entry exists, instruct Trae to create the new memory entry immediately.
- If cleanup fails because a file is locked, ask Trae to finish setup and tell you the exact path to remove manually.
