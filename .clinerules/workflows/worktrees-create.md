# Generic Worktree Creation Process

**Purpose**: Create new Git worktrees with a common prefix, establishing a main branch worktree and feature branch worktrees for parallel development.

**Usage**: Replace `{PREFIX}` with your desired worktree prefix (e.g., "Mar-09", "feature", "dev").

## Prompt Template

```
Create new worktrees with the {PREFIX} prefix i.e. a local main branch along with two worktrees {PREFIX}-1 and {PREFIX}-2. On completion only show these 3 worktrees in the GIT WORKTREES menu and remove worktrees with the file name prefix {OLD_PREFIX}.

Additional context:
- New worktrees to create: {PREFIX}, {PREFIX}-1, {PREFIX}-2
- Main worktree path: /Users/_General/superpowers/{PREFIX}
- Feature worktree paths: /Users/_General/superpowers/{PREFIX}-1, /Users/_General/superpowers/{PREFIX}-2
- Old worktrees to remove: {OLD_PREFIX}, {OLD_PREFIX}-1, {OLD_PREFIX}-2
- Expected outcome: Only {PREFIX} worktrees remain, with {PREFIX} as the new main worktree
```

## Key Technical Concepts

- Git worktree management for multiple branch checkouts
- Branch creation from existing main branch
- Worktree addition and removal
- Main worktree relocation
- Workflow initialization for new development cycles

## Process Steps

1. **Create new branch for main worktree**:
   - Create branch `{PREFIX}` from `main`
   - Add worktree at `/Users/_General/superpowers/{PREFIX}` for branch `{PREFIX}`

2. **Create feature worktrees**:
   - Create branch `{PREFIX}-1` from `{PREFIX}`
   - Add worktree at `/Users/_General/superpowers/{PREFIX}-1` for branch `{PREFIX}-1`
   - Create branch `{PREFIX}-2` from `{PREFIX}`
   - Add worktree at `/Users/_General/superpowers/{PREFIX}-2` for branch `{PREFIX}-2`

3. **Remove old worktrees**:
   - Remove worktree `/Users/_General/superpowers/{OLD_PREFIX}-1`
   - Remove worktree `/Users/_General/superpowers/{OLD_PREFIX}-2`
   - Prune removed worktrees

4. **Relocate main worktree** (if needed):
   - Move `.git` directory from old main to new main worktree
   - Update `.git` files in remaining worktrees to point to new `.git` location
   - Remove old main worktree directory
   - Clean up worktree metadata

5. **Verify worktrees**:
   - List worktrees to confirm only {PREFIX} worktrees remain
   - Ensure new main worktree is properly configured

## Commands Used

```bash
git branch {PREFIX} main
git worktree add /Users/_General/superpowers/{PREFIX} {PREFIX}
git worktree add -b {PREFIX}-1 /Users/_General/superpowers/{PREFIX}-1 {PREFIX}
git worktree add -b {PREFIX}-2 /Users/_General/superpowers/{PREFIX}-2 {PREFIX}
git worktree remove /Users/_General/superpowers/{OLD_PREFIX}-1
git worktree remove /Users/_General/superpowers/{OLD_PREFIX}-2
git worktree prune
# For main relocation:
rm /Users/_General/superpowers/{PREFIX}/.git  # Remove worktree .git file
cp -r /Users/_General/superpowers/{OLD_PREFIX}/.git /Users/_General/superpowers/{PREFIX}/.git
sed -i '' 's|/Users/_General/superpowers/{OLD_PREFIX}/.git|/Users/_General/superpowers/{PREFIX}/.git|g' /Users/_General/superpowers/{PREFIX}-1/.git
sed -i '' 's|/Users/_General/superpowers/{OLD_PREFIX}/.git|/Users/_General/superpowers/{PREFIX}/.git|g' /Users/_General/superpowers/{PREFIX}-2/.git
rm -rf /Users/_General/superpowers/{OLD_PREFIX}
rm -rf /Users/_General/superpowers/{PREFIX}/.git/worktrees/{PREFIX}
git worktree list
```

## Safety Considerations

- Ensure all changes in old worktrees are committed before removal
- Backup important data before relocating main worktree
- Test worktrees after creation to ensure proper functionality
- Coordinate with other developers when changing main worktree location
- Verify .git paths are correctly updated after relocation

## Example Usage

For creating worktrees with "{PREFIX}" prefix and removing "{OLD_PREFIX}":
```
Create new worktrees with the {PREFIX} prefix i.e. a local main branch along with two worktrees {PREFIX}-1 and {PREFIX}-2. On completion only show these 3 worktrees in the GIT WORKTREES menu and remove worktrees with the file name prefix {OLD_PREFIX}.
```

## Submodules

- [](https://github.com/Construct-AI-primary/construct_ai_docs.git)<https://github.com/Construct-AI-primary/construct_ai_docs.git> (as construct_ai_docs/)
