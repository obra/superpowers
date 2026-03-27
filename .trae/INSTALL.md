# Installing Superpowers for Trae

## Prerequisites

- [Trae IDE](https://www.trae.ai) installed
- Git available in the local environment

## Installation

Place this `.trae` folder at the root of the target project, then ask the Trae assistant to perform the setup for you.

Just copy and paste the following prompt into your Trae chat:

> **For the AI Assistant:** Please initialize Superpowers for this project from the project root.
>
> Requirements:
> 1. Treat the current workspace root as the target project root and create `.trae` there if it does not already exist.
> 2. Install `.trae/rules/superpowers.md`.
> 3. Fetch `https://github.com/obra/superpowers-skills.git` into a temporary folder, then flatten the nested directories into `.trae/skills/`.
> 4. Rename `using-skills` to `using-superpowers`.
> 5. Use `manage_core_memory` to automatically register the project memory described below after the files are ready.
> 6. If temporary directory cleanup fails, finish the setup and explicitly tell me to delete `.trae/temp_skills` manually after the task.
> 7. After setup, remind me that dynamic skill loading and memory usage may consume context faster than usual.
>
> **Step 1: Run the appropriate initialization script from the project root**
>
> ```powershell
> if (-not (Test-Path ".trae")) { New-Item -ItemType Directory -Force -Path ".trae" | Out-Null }
> if (-not (Test-Path ".trae\rules")) { New-Item -ItemType Directory -Force -Path ".trae\rules" | Out-Null }
>
> Invoke-WebRequest -Uri "https://raw.githubusercontent.com/obra/superpowers/main/.trae/rules/superpowers.md" -OutFile ".trae\rules\superpowers.md"
>
> if (Test-Path ".trae\skills") { Remove-Item -Recurse -Force ".trae\skills" }
> if (Test-Path ".trae\temp_skills") { Remove-Item -Recurse -Force ".trae\temp_skills" -ErrorAction SilentlyContinue }
> git clone https://github.com/obra/superpowers-skills.git .trae\temp_skills 2>$null
>
> New-Item -ItemType Directory -Force -Path ".trae\skills" | Out-Null
>
> Get-ChildItem -Path ".trae\temp_skills\skills" -Directory | Where-Object { $_.Name -notin @('tool', 'examples') } | ForEach-Object {
>     $categoryDir = $_.FullName
>     Get-ChildItem -Path $categoryDir -Directory | ForEach-Object {
>         Move-Item -Path $_.FullName -Destination ".trae\skills\" -Force
>     }
> }
>
> if (Test-Path ".trae\skills\using-skills") { Rename-Item -Path ".trae\skills\using-skills" -NewName "using-superpowers" }
> Remove-Item -Recurse -Force ".trae\temp_skills" -ErrorAction SilentlyContinue
> ```
>
> ```bash
> mkdir -p .trae/rules
> curl -s -o .trae/rules/superpowers.md https://raw.githubusercontent.com/obra/superpowers/main/.trae/rules/superpowers.md
> rm -rf .trae/skills .trae/temp_skills
> git clone https://github.com/obra/superpowers-skills.git .trae/temp_skills >/dev/null 2>&1
> mkdir -p .trae/skills
> find .trae/temp_skills/skills -mindepth 2 -maxdepth 2 -type d | while read dir; do
>   mv "$dir" .trae/skills/
> done
> rm -rf .trae/skills/tool .trae/skills/examples
> if [ -d ".trae/skills/using-skills" ]; then mv .trae/skills/using-skills .trae/skills/using-superpowers; fi
> rm -rf .trae/temp_skills
> ```
>
> **Step 2: Register the project core memory**
>
> Please use `manage_core_memory` to add one project-level memory with:
> - Title: Superpowers 严格工作流约束
> - Keywords: superpowers|workflow|tdd|debugging|skills
> - Category: Knowledge
> - Via: request
> - Content: 本项目严格遵循 obra/superpowers 开发方法论：知识沉淀与测试驱动开发优先；系统化过程胜于临时猜测；简化复杂性，以简洁为主要目标；证据胜于主张，在宣布成功前先核实。遇到功能开发先做设计与测试；遇到报错必须调用 systematic-debugging 做根因排查；技能调用必须通过内置 Skill 工具真实执行；多步骤流程使用 TodoWrite；跨任务知识通过 manage_core_memory 沉淀。

## What the AI should complete

1. Ensure `.trae` is created at the project root rather than inside a nested copied folder.
2. Install the Trae rule file to `.trae/rules/superpowers.md`.
3. Clone and flatten the latest `superpowers-skills` repository into `.trae/skills/`.
4. Rename `using-skills` to `using-superpowers`.
5. Register the project-level core memory automatically.
6. Warn the user if `.trae/temp_skills` could not be removed cleanly.

## Why this Trae adaptation works

This migration keeps the core Superpowers philosophy while adapting it to Trae's native runtime model.

- **No Hooks Required**: Behavior is constrained through Trae Memory and Workspace Rules rather than external hooks.
- **Flattened Skills Directory**: Trae currently resolves skills more reliably from a flat `.trae/skills/` structure.
- **Flowcharts -> Trae Todo List**: Guided workflows map naturally onto Trae's Todo List instead of terminal-only checklists.
- **Local Knowledge -> Trae Core Memory**: This replaces `remembering-conversations` with `manage_core_memory`, and benefits from Trae's memory update mechanism to keep context more active and better coordinated over time.

## Updating

Ask the Trae assistant to run the same installation prompt again from the project root. The setup will refresh `.trae/skills/` with the latest upstream skills and preserve the Trae-native workflow entrypoint.
