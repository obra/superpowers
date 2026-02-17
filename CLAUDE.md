# Superpowers - Fork Maintenance

## Fork Relationship

- **Origin (push)**: `cameronsjo/superpowers`
- **Upstream (pull)**: `obra/superpowers`

## Syncing Upstream

```bash
git fetch upstream
git merge upstream/main
```

Resolve conflicts in favor of local customizations when they're in files you've intentionally modified. For everything else, prefer upstream.

## Where Customizations Live

- `skills/` — skill content modifications
- `README.md` — re-owned header and installation instructions
- `CLAUDE.md` — this file (fork-only)

## What Not to Touch When Merging

- Upstream's `.claude-plugin/plugin.json` version bumps — accept those, they track upstream releases
- Upstream's new skills — accept and review, don't auto-reject

## Customization Patterns

### What We Changed from Upstream

- **"your human partner" → "the user"** across all skills
- **Removed discard option** from finishing-a-development-branch (3 options, not 4)
- **Folded Common Mistakes/Red Flags** into the flow for finishing-a-development-branch
- **Updated worktree references** to sibling convention (`project--branch`)
- **Replaced Jesse-specific paths** (e.g., `/home/jesse/` in tmux skill)
- **AskUserQuestion over interviews** in brainstorming and plan handoffs
- **executing-plans: continuous execution** — replaced batch-with-checkpoints model with continuous execution (stop only on blockers). Merged from essentials
- **brainstorming: richer AskUserQuestion guidance** — multiSelect tips, recommended-option-first pattern. Merged from essentials

### What We Kept (and Why)

- **"Announce at start" patterns** — these aren't just ceremony. double-shot-latte's Stop hook judge reads the transcript to decide whether to continue. Skill announcements signal "multi-step workflow active" to the judge, preventing premature stops.
- **Red Flags / Common Mistakes sections** — genuinely useful self-checks in most skills. Only folded into flow for finishing-a-development-branch where they were redundant.
- **"Violating the letter is violating the spirit"** — good discipline framing, not a Jesse-ism.

## Local Development

Skills are markdown files in `skills/*/SKILL.md`. Test by restarting Claude Code after edits.
