# `swe-skills` Plugin Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an independently discoverable `plugins/swe-skills` companion plugin containing five skills, remove those skills from the core plugin, and preserve all current harness packaging and workflow behavior.

**Architecture:** Keep `superpowers` at the repository root as the bootstrap and core workflow plugin. Add a committed sibling plugin at `plugins/swe-skills` with its own harness manifests, an OpenCode skill-registration entry point without bootstrap injection, and Pi skill metadata. Move the five skill directories—including `code-review/references`—so each skill has exactly one active source. Update core references to use the explicit `swe-skills:` namespace.

**Tech Stack:** Markdown `SKILL.md` files, JSON manifests, Bash packaging/test scripts, Node.js OpenCode/Pi tests, Python JSON assertions, Git archive/rsync packaging.

## Global Constraints

- `swe-skills` is the sole source and distribution point for `behavior-guidelines`, `code-review`, `design-an-interface`, `managing-skill-library`, and `self-evolved`.
- `plugins/swe-skills/` is a committed sibling plugin; do not create a generated mirror or move the skills to another repository.
- `superpowers` retains `using-superpowers`, all session-start hooks, OpenCode bootstrap injection, Pi bootstrap injection, and Gemini bootstrap context ownership.
- Core workflow references to moved skills use `swe-skills:<skill-name>`; do not retain a fallback `superpowers:<moved-skill>` namespace.
- The companion plugin supports every current harness integration represented in this repository.
- Both plugin families use the same synchronized version value and participate in `.version-bump.json` checks.
- The split introduces no third-party runtime dependency and does not redesign skill prose beyond required namespace/path updates.
- The core package must not include companion-only skills, manifests, or runtime files; the companion package must not include core bootstrap/hooks.
- Do not create commits during implementation without the human partner's explicit consent; if consent is provided, use the commit messages listed at the end of each task.

---

## File Map

### New companion plugin files

- Create: `plugins/swe-skills/.claude-plugin/plugin.json` — Claude Code metadata and local `skills/` path; no core bootstrap hook.
- Create: `plugins/swe-skills/.codex-plugin/plugin.json` — Codex metadata, local `skills/` path, and `hooks: {}` to suppress hook auto-discovery.
- Create: `plugins/swe-skills/.cursor-plugin/plugin.json` — Cursor metadata and local `skills/` path.
- Create: `plugins/swe-skills/.kimi-plugin/plugin.json` — Kimi metadata and local `skills/` path; no `sessionStart` bootstrap.
- Create: `plugins/swe-skills/gemini-extension.json` — Gemini extension metadata without a core context-file include.
- Create: `plugins/swe-skills/package.json` — OpenCode package entry point and Pi `skills` resource declaration.
- Create: `plugins/swe-skills/.opencode/plugins/swe-skills.js` — OpenCode `config` hook that registers only `plugins/swe-skills/skills`; it must not inject bootstrap text.
- Create: `plugins/swe-skills/README.md` — companion-plugin installation and ownership documentation.
- Create: `plugins/swe-skills/LICENSE` — repository MIT license copied verbatim for standalone package archives.
- Move: `skills/behavior-guidelines/` → `plugins/swe-skills/skills/behavior-guidelines/`.
- Move: `skills/code-review/` → `plugins/swe-skills/skills/code-review/`, preserving its three `references/*.md` files and excluding `.DS_Store`.
- Move: `skills/design-an-interface/` → `plugins/swe-skills/skills/design-an-interface/`.
- Move: `skills/managing-skill-library/` → `plugins/swe-skills/skills/managing-skill-library/`.
- Move: `skills/self-evolved/` → `plugins/swe-skills/skills/self-evolved/`.

### Core files to modify

- Modify: `skills/brainstorming/SKILL.md` — change the behavior-guidelines invocation to `swe-skills:behavior-guidelines`.
- Modify: `skills/requesting-code-review/SKILL.md` — change the code-review requirement to `swe-skills:code-review`.
- Modify: `skills/subagent-driven-development/SKILL.md` — change both moved-skill requirements to the `swe-skills:` namespace.
- Modify: `skills/subagent-driven-development/implementer-prompt.md` — change the behavior-guidelines load target.
- Modify: `agents/code-reviewer.md` — change its required review skill namespace.
- Modify: `agents/mobile-plan-reviewer.md` — change its required review skill namespace.
- Modify: `docs/superpowers/plans/2026-06-28-opencode-sdd-implementer-dispatch.md` — update active namespace references.
- Modify: `docs/superpowers/specs/2026-06-28-opencode-sdd-implementer-dispatch-design.md` — update active namespace references.
- Do not rewrite `.history/` snapshots; they are historical records, not active source.

### Distribution and version files to modify

- Modify: `.claude-plugin/marketplace.json` — add a `swe-skills` plugin entry sourced from `./plugins/swe-skills` and include its synchronized version.
- Modify: `.agents/plugins/marketplace.json` — add a `swe-skills` entry sourced from `./plugins/swe-skills`, with matching policy/category/author metadata and synchronized version if the marketplace schema accepts it.
- Modify: `.version-bump.json` — declare every companion manifest/package/marketplace version field.
- Modify: `README.md` — explain the two-plugin installation model in the harness installation sections.
- Modify: `docs/README.opencode.md` and `.opencode/INSTALL.md` — document installing the core package plus the companion skill package/source supported by the repository’s OpenCode distribution path.
- Modify: `docs/README.kimi.md` — document the separate `swe-skills` marketplace entry and that only `superpowers` owns session-start bootstrap.
- Modify: `scripts/package-codex-plugin.sh` — add an optional plugin-root mode while preserving the current root-plugin default.
- Modify: `scripts/sync-to-codex-plugin.sh` — add explicit source-plugin and destination-plugin options so nested companion content cannot be embedded into the core sync.

### New and modified tests

- Create: `tests/swe-skills/test-plugin-layout.sh` — assert ownership, required files, manifest names/paths, synchronized versions, and absence of bootstrap files.
- Create: `tests/swe-skills/test-opencode-plugin.mjs` — assert the companion OpenCode entry registers only its skill directory and exposes no bootstrap transform.
- Modify: `tests/codex/test-package-codex-plugin.sh` — retain root-package coverage and add a companion-package archive scenario.
- Modify: `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` — add a nested-source scenario proving companion files remain isolated.
- Modify: `tests/kimi/test-plugin-manifest.sh` or add a companion-specific manifest assertion — keep root Kimi checks and validate the new manifest separately.
- Modify: `tests/opencode/setup.sh` and add companion assertions to `tests/opencode/test-plugin-loading.sh` if the existing isolated OpenCode fixture is reused; otherwise keep companion checks in `tests/swe-skills/test-opencode-plugin.mjs`.
- Modify: `tests/pi/test-pi-extension.mjs` only if shared package-discovery assertions are generalized; core Pi bootstrap expectations must remain unchanged.

---

## Task 1: Add failing ownership and manifest contract tests

**Files:**
- Create: `tests/swe-skills/test-plugin-layout.sh`
- Create: `tests/swe-skills/test-opencode-plugin.mjs`

**Interfaces:**
- Consumes: repository root at `tests/../..` and the expected future `plugins/swe-skills` tree.
- Produces: executable structural assertions that later migration and manifest tasks must satisfy.

- [ ] **Step 1: Write the structural test before creating the plugin**

Implement `tests/swe-skills/test-plugin-layout.sh` as a Bash test that:

1. Sets `REPO_ROOT` from the test location and `PLUGIN_ROOT="$REPO_ROOT/plugins/swe-skills"`.
2. Expects exactly these five immediate `skills` directories, sorted lexicographically:
   `behavior-guidelines`, `code-review`, `design-an-interface`, `managing-skill-library`, `self-evolved`.
3. Fails if any of those names still exists under `$REPO_ROOT/skills`.
4. Requires `code-review/references/code-quality-checklist.md`, `object-design.md`, and `solid-checklist.md`.
5. Parses each of the five JSON manifests with Python and asserts `name == "swe-skills"`, `version == the core `.codex-plugin/plugin.json` version`, and `skills == "./skills/"` wherever the manifest has a `skills` field.
6. Asserts `.codex-plugin/plugin.json` has `hooks == {}`.
7. Asserts the companion package declares `name == "swe-skills"`, the same version, `main == ".opencode/plugins/swe-skills.js"`, and `pi.skills == ["./skills"]`.
8. Asserts the companion tree has no `using-superpowers`, `hooks/`, `.pi/extensions/`, or core `.opencode` bootstrap file.

Use clear failure messages naming the missing or unexpected path.

- [ ] **Step 2: Write the OpenCode registration test**

Implement `tests/swe-skills/test-opencode-plugin.mjs` using Node’s built-in `node:test` and `assert/strict`:

```js
const pluginModule = await import(pathToFileURL(resolve(repoRoot, 'plugins/swe-skills/.opencode/plugins/swe-skills.js')).href);
const plugin = await pluginModule.SweSkillsPlugin({ client: {}, directory: repoRoot });
const config = {};
await plugin.config(config);
assert.deepEqual(config.skills.paths, [resolve(repoRoot, 'plugins/swe-skills/skills')]);
assert.equal(plugin['experimental.chat.messages.transform'], undefined);
```

Also assert that the registered path contains all five expected `SKILL.md` files and does not contain `using-superpowers/SKILL.md`.

- [ ] **Step 3: Run the new tests and verify they fail for the missing plugin**

Run:

```bash
bash tests/swe-skills/test-plugin-layout.sh
node --test tests/swe-skills/test-opencode-plugin.mjs
```

Expected: both commands fail because `plugins/swe-skills` and its manifests/entry point do not exist yet.

- [ ] **Step 4: Make the test executable and review only the new test diff**

Run:

```bash
chmod +x tests/swe-skills/test-plugin-layout.sh
git diff -- tests/swe-skills
```

If the human partner authorizes commits, commit this test-only checkpoint as:

```text
test: define swe-skills plugin boundaries
```

---

## Task 2: Move the five skill sources into the companion plugin

**Files:**
- Create: `plugins/swe-skills/skills/`
- Move: `skills/behavior-guidelines/` → `plugins/swe-skills/skills/behavior-guidelines/`
- Move: `skills/code-review/` → `plugins/swe-skills/skills/code-review/`
- Move: `skills/design-an-interface/` → `plugins/swe-skills/skills/design-an-interface/`
- Move: `skills/managing-skill-library/` → `plugins/swe-skills/skills/managing-skill-library/`
- Move: `skills/self-evolved/` → `plugins/swe-skills/skills/self-evolved/`

**Interfaces:**
- Consumes: the failing ownership test from Task 1.
- Produces: one authoritative source for each moved skill under `plugins/swe-skills/skills`.

- [ ] **Step 1: Move tracked skill directories without changing their prose**

Run:

```bash
mkdir -p plugins/swe-skills/skills
git mv skills/behavior-guidelines plugins/swe-skills/skills/behavior-guidelines
git mv skills/code-review plugins/swe-skills/skills/code-review
git mv skills/design-an-interface plugins/swe-skills/skills/design-an-interface
git mv skills/managing-skill-library plugins/swe-skills/skills/managing-skill-library
git mv skills/self-evolved plugins/swe-skills/skills/self-evolved
```

Remove only the incidental `plugins/swe-skills/skills/code-review/.DS_Store` if it moved with the directory. Do not edit skill content in this task.

- [ ] **Step 2: Verify source ownership and content preservation**

Run:

```bash
find plugins/swe-skills/skills -maxdepth 2 -type f | sort
find skills -maxdepth 2 -type f | sort | grep -E '/(behavior-guidelines|code-review|design-an-interface|managing-skill-library|self-evolved)(/|$)' || true
git diff --summary
```

Expected: the five skill directories are absent from root `skills/`; Git reports directory renames; `code-review` retains `SKILL.md` and exactly its three Markdown reference files.

- [ ] **Step 3: Run the ownership test**

Run:

```bash
bash tests/swe-skills/test-plugin-layout.sh
```

Expected: it still fails only for missing companion manifests/package metadata, not for missing skill directories or duplicate ownership.

If the human partner authorizes commits, commit this move checkpoint as:

```text
refactor: move swe skills into companion plugin
```

---

## Task 3: Add all-harness companion manifests and runtime registration

**Files:**
- Create: `plugins/swe-skills/.claude-plugin/plugin.json`
- Create: `plugins/swe-skills/.codex-plugin/plugin.json`
- Create: `plugins/swe-skills/.cursor-plugin/plugin.json`
- Create: `plugins/swe-skills/.kimi-plugin/plugin.json`
- Create: `plugins/swe-skills/gemini-extension.json`
- Create: `plugins/swe-skills/package.json`
- Create: `plugins/swe-skills/.opencode/plugins/swe-skills.js`
- Create: `plugins/swe-skills/README.md`
- Create: `plugins/swe-skills/LICENSE`

**Interfaces:**
- Consumes: the five moved skill trees from Task 2.
- Produces: `swe-skills` manifests for Claude, Codex, Cursor, Kimi, Gemini, OpenCode, and Pi; a no-bootstrap OpenCode registration function named `SweSkillsPlugin`.

- [ ] **Step 1: Add the minimal Claude manifest**

Create `.claude-plugin/plugin.json` using the repository’s existing author/license conventions, with:

```json
{
  "name": "swe-skills",
  "version": "6.1.1",
  "description": "Software engineering guidance, code review, interface design, and skill-library practices.",
  "author": { "name": "Jesse Vincent", "email": "jesse@fsck.com" },
  "homepage": "https://github.com/obra/superpowers",
  "license": "MIT",
  "keywords": ["skills", "software-engineering", "code-review", "design", "workflow"],
  "skills": "./skills/"
}
```

Use the current repository version rather than hard-coding a new release number if the core manifest has changed since this plan was written.

- [ ] **Step 2: Add the remaining declarative manifests**

Create the following exact behavioral contracts:

- `.codex-plugin/plugin.json`: `name: "swe-skills"`, synchronized `version`, `description`, `skills: "./skills/"`, and `hooks: {}`.
- `.cursor-plugin/plugin.json`: `name: "swe-skills"`, description, and `skills: "./skills/"`; do not add core hooks.
- `.kimi-plugin/plugin.json`: `name: "swe-skills"`, synchronized `version`, description, and `skills: "./skills/"`; omit `sessionStart`, `skillInstructions`, and unsupported runtime fields because this plugin has no bootstrap.
- `gemini-extension.json`: `name: "swe-skills"`, synchronized `version`, and companion description; do not reference `GEMINI.md` or `using-superpowers`.

Validate all JSON with:

```bash
python3 -m json.tool plugins/swe-skills/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/swe-skills/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/swe-skills/.cursor-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/swe-skills/.kimi-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/swe-skills/gemini-extension.json >/dev/null
```

- [ ] **Step 3: Add OpenCode registration without bootstrap injection**

Create `plugins/swe-skills/.opencode/plugins/swe-skills.js` with a named export `SweSkillsPlugin`. Resolve the plugin root from `import.meta.url`, derive `skillsDir` as `../../skills`, and return only a `config` hook that appends `skillsDir` to `config.skills.paths` if absent. Do not read any file, define any transform hook, or inject `using-superpowers`.

The implementation must satisfy this shape:

```js
export const SweSkillsPlugin = async () => ({
  config: async (config) => {
    config.skills = config.skills || {};
    config.skills.paths = config.skills.paths || [];
    if (!config.skills.paths.includes(skillsDir)) {
      config.skills.paths.push(skillsDir);
    }
  },
});
```

- [ ] **Step 4: Add the OpenCode/Pi package manifest**

Create `plugins/swe-skills/package.json` with:

```json
{
  "name": "swe-skills",
  "version": "6.1.1",
  "description": "Software engineering skills for coding agents",
  "type": "module",
  "main": ".opencode/plugins/swe-skills.js",
  "keywords": ["pi-package", "skills", "software-engineering", "code-review"],
  "pi": {
    "skills": ["./skills"]
  }
}
```

Do not add a Pi extension: `superpowers` remains the only plugin that injects bootstrap context.

- [ ] **Step 5: Add standalone companion documentation and license**

Copy the root `LICENSE` byte-for-byte to `plugins/swe-skills/LICENSE`. Create `plugins/swe-skills/README.md` documenting:

- The five included skill names.
- That the directory is a companion to `superpowers`.
- That `superpowers` owns bootstrap/session-start behavior.
- That installing both plugins provides the complete workflow.
- That `swe-skills` alone provides the five discoverable skills without bootstrap injection.

- [ ] **Step 6: Run the contract tests**

Run:

```bash
bash tests/swe-skills/test-plugin-layout.sh
node --test tests/swe-skills/test-opencode-plugin.mjs
```

Expected: PASS, including the exact five-skill ownership assertion and the no-bootstrap OpenCode assertion.

If the human partner authorizes commits, commit this checkpoint as:

```text
feat: add swe-skills companion plugin manifests
```

---

## Task 4: Update active cross-plugin namespaces

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `agents/code-reviewer.md`
- Modify: `agents/mobile-plan-reviewer.md`
- Modify: `docs/superpowers/plans/2026-06-28-opencode-sdd-implementer-dispatch.md`
- Modify: `docs/superpowers/specs/2026-06-28-opencode-sdd-implementer-dispatch-design.md`
- Modify: `plugins/swe-skills/skills/self-evolved/SKILL.md`

**Interfaces:**
- Consumes: the explicit plugin namespace `swe-skills` from Task 3.
- Produces: active instructions that resolve moved skills from the companion plugin and contain no stale core namespace.

- [ ] **Step 1: Enumerate active stale references before editing**

Run:

```bash
grep -RInE 'superpowers:(behavior-guidelines|code-review|design-an-interface|managing-skill-library|self-evolved)' \
  --exclude-dir=.git --exclude-dir=.history . || true
```

Record every match outside `.history`; these are the only active references to update.

- [ ] **Step 2: Replace moved-skill namespaces surgically**

Apply only these substitutions:

```text
superpowers:behavior-guidelines       → swe-skills:behavior-guidelines
superpowers:code-review        → swe-skills:code-review
superpowers:managing-skill-library     → swe-skills:managing-skill-library
```

For prose that names a skill without the `superpowers:` prefix but describes a required plugin namespace, add the `swe-skills:` qualifier rather than changing unrelated wording. Do not change references to core skills such as `superpowers:using-superpowers`.

- [ ] **Step 3: Verify namespace ownership**

Run:

```bash
if grep -RInE 'superpowers:(behavior-guidelines|code-review|design-an-interface|managing-skill-library|self-evolved)' \
  --exclude-dir=.git --exclude-dir=.history .; then
  echo 'stale moved-skill namespace remains' >&2
  exit 1
fi
grep -RInE 'swe-skills:(behavior-guidelines|code-review|managing-skill-library)' \
  skills agents docs/superpowers plugins/swe-skills
```

Expected: no stale active namespace and explicit companion references in all required workflow files.

- [ ] **Step 4: Run the skill-content frontmatter and Markdown checks used by the repository**

Run the repository’s existing skill validation command from `tests/claude-code/README.md` or the documented fast test runner. The moved skills must load from the companion path, while core skills must continue to load from root `skills/`.

If the human partner authorizes commits, commit this checkpoint as:

```text
fix: qualify cross-plugin skill references
```

---

## Task 5: Update marketplace metadata, synchronized versions, and installation docs

**Files:**
- Modify: `.claude-plugin/marketplace.json`
- Modify: `.agents/plugins/marketplace.json`
- Modify: `.version-bump.json`
- Modify: `README.md`
- Modify: `docs/README.opencode.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/README.kimi.md`
- Modify: `plugins/swe-skills/README.md`

**Interfaces:**
- Consumes: the companion manifest names and paths from Task 3.
- Produces: marketplace/install metadata that describes both plugins and synchronized-version checks that include every companion manifest.

- [ ] **Step 1: Add companion marketplace entries**

In `.claude-plugin/marketplace.json`, retain the existing `superpowers` entry and add a second entry with:

```json
{
  "name": "swe-skills",
  "description": "Software engineering skills for code review, interface design, behavior guidelines, and skill-library management.",
  "version": "6.1.1",
  "source": "./plugins/swe-skills",
  "author": {
    "name": "Jesse Vincent",
    "email": "jesse@fsck.com"
  }
}
```

In `.agents/plugins/marketplace.json`, add the corresponding `swe-skills` entry with source URL `./plugins/swe-skills`, `AVAILABLE` installation policy, `ON_INSTALL` authentication policy, and `Developer Tools` category. Keep the existing core entry unchanged except for adding synchronized version metadata if the Codex marketplace schema supports it and the test is updated accordingly.

- [ ] **Step 2: Extend `.version-bump.json`**

Add entries for:

```text
plugins/swe-skills/package.json                         version
plugins/swe-skills/.claude-plugin/plugin.json           version
plugins/swe-skills/.cursor-plugin/plugin.json           version
plugins/swe-skills/.codex-plugin/plugin.json            version
plugins/swe-skills/.kimi-plugin/plugin.json             version
plugins/swe-skills/gemini-extension.json                version
.claude-plugin/marketplace.json                         plugins.1.version
```

If `.agents/plugins/marketplace.json` gains explicit version fields, add its exact dotted field paths too. Do not remove the existing root declarations.

- [ ] **Step 3: Update installation documentation without inventing unsupported commands**

Update the root and harness-specific documentation to state:

- `superpowers` installs the core workflows and bootstrap.
- `swe-skills` installs the five companion skills.
- Full workflow users install both marketplace entries/packages.
- `swe-skills` does not inject bootstrap context by itself.
- Kimi users install the separate marketplace entry and start a fresh session after changes.
- OpenCode users add both plugin package entries using the repository’s supported package/source form; do not claim that a root Git package automatically exposes the nested package unless the installer test proves it.

Keep existing user-facing URLs and commands from the repository; add only the companion plugin name/path needed for the documented marketplace or local checkout flow.

- [ ] **Step 4: Verify metadata and version synchronization**

Run:

```bash
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
./scripts/bump-version.sh --check
./scripts/bump-version.sh --audit
```

Expected: all declared files exist, all versions match, and the audit reports no undeclared version-bearing manifest files.

If the human partner authorizes commits, commit this checkpoint as:

```text
docs: document swe-skills companion installation
```

---

## Task 6: Generalize Codex packaging for the nested companion plugin

**Files:**
- Modify: `scripts/package-codex-plugin.sh`
- Modify: `tests/codex/test-package-codex-plugin.sh`

**Interfaces:**
- Consumes: either the root plugin (`.` by default) or `--plugin-root plugins/swe-skills`.
- Produces: a rootless archive containing the selected plugin’s `.codex-plugin`, optional standalone `README.md`/`LICENSE`, and only that plugin’s `skills/` tree.

- [ ] **Step 1: Add a failing companion archive scenario to the existing test**

Extend `tests/codex/test-package-codex-plugin.sh` with a second invocation using:

```bash
scripts/package-codex-plugin.sh \
  --plugin-root plugins/swe-skills \
  --plugin-name swe-skills \
  --metadata-source "$swe_metadata_source" \
  --output "$TEST_ROOT/swe-skills.zip" \
  --allow-dirty
```

The test must assert:

- The archive is written successfully.
- `.codex-plugin/plugin.json` exists and reports `name == swe-skills`.
- Exactly five top-level skill directories exist.
- All five `SKILL.md` files and the three code-review reference files exist.
- `skills/using-superpowers/`, `hooks/`, `.opencode/`, `.pi/`, root `package.json`, and root-only assets are absent.
- Every companion skill has its OpenAI metadata fixture.
- The root package scenario still produces the same archive paths and manifest summary as before.

Run the test before changing the package script. Expected: the existing default scenario passes and the new companion scenario fails with an unsupported option or missing archive.

- [ ] **Step 2: Add explicit plugin-root options while preserving defaults**

Add these options to `scripts/package-codex-plugin.sh`:

```text
--plugin-root PATH   Select the plugin source directory; default: .
--plugin-name NAME   Select the output basename/diagnostic name; default: manifest name.
```

Keep `--output`, `--format`, `--metadata-source`, `--ref`, `--allow-dirty`, and `--keep-stage` behavior unchanged for the root plugin.

When `--plugin-root` is `.`, preserve the existing archive selection exactly. When it is nested, archive only:

```text
<plugin-root>/.codex-plugin
<plugin-root>/README.md       (when present)
<plugin-root>/LICENSE         (when present)
<plugin-root>/assets          (when present)
<plugin-root>/skills
```

Extract the nested archive into a temporary source directory and copy those selected paths into the existing rootless staging directory before metadata injection. Do not copy `hooks`, `.opencode`, `.pi`, tests, docs, or the repository root.

Derive the default archive filename from `--plugin-name` and the selected manifest version, so the companion default is `swe-skills-VERSION.zip` rather than `superpowers-VERSION.zip`.

- [ ] **Step 3: Run both archive scenarios**

Run:

```bash
bash tests/codex/test-package-codex-plugin.sh
```

Expected: root and companion archive scenarios pass, including deterministic ZIP/TAR behavior, metadata completeness, executable-mode preservation for the root package, and source-only path exclusion.

- [ ] **Step 4: Inspect the generated archive contents manually**

Run:

```bash
unzip -Z1 "$TEST_ROOT/swe-skills.zip" | sort
```

Expected: rootless `skills/` and `.codex-plugin/` paths only, plus companion README/LICENSE if included; no core bootstrap or repository infrastructure.

If the human partner authorizes commits, commit this checkpoint as:

```text
feat: package nested swe-skills plugin
```

---

## Task 7: Isolate nested companion content in Codex sync

**Files:**
- Modify: `scripts/sync-to-codex-plugin.sh`
- Modify: `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`

**Interfaces:**
- Consumes: the existing sync behavior for the root `superpowers` plugin.
- Produces: explicit nested-source sync behavior that cannot copy `plugins/swe-skills` into the core destination.

- [ ] **Step 1: Add a nested-source fixture and failing test**

Extend the sync test fixture with:

```text
source/plugins/swe-skills/.codex-plugin/plugin.json
source/plugins/swe-skills/README.md
source/plugins/swe-skills/LICENSE
source/plugins/swe-skills/skills/example/SKILL.md
source/skills/core-only/SKILL.md
source/hooks/hooks.json
```

Invoke the sync script with the new nested-source and destination options. Assert that the destination contains `plugins/swe-skills/skills/example/SKILL.md` and does not contain `plugins/superpowers/skills/example/SKILL.md` or any core-only source files. Run before implementation and verify the option is rejected or the assertion fails.

- [ ] **Step 2: Add explicit source and destination plugin options**

Add options to `scripts/sync-to-codex-plugin.sh`:

```text
--plugin-root PATH   Source plugin directory; default: .
--dest-rel PATH      Destination plugin path; default: plugins/superpowers.
```

Keep the current root defaults and all existing safety checks unchanged. For nested mode:

- Read the selected plugin’s `.codex-plugin/plugin.json` for version.
- Set the sync source path to `PLUGIN_ROOT` instead of the repository root.
- Anchor exclusions to the selected plugin source so root hooks, manifests, tests, and other plugin content are never copied.
- Preserve destination marketplace metadata and fixture files exactly as the existing sync script does.
- Never sync the nested plugin when `--plugin-root .` is used for the core package.

- [ ] **Step 3: Run the complete sync test**

Run:

```bash
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
```

Expected: all existing root sync scenarios pass plus the nested companion scenario, including deterministic previews and anchored exclusion behavior.

If the human partner authorizes commits, commit this checkpoint as:

```text
feat: isolate nested plugin codex sync
```

---

## Task 8: Add companion manifest and loader coverage for supported harnesses

**Files:**
- Modify: `tests/swe-skills/test-plugin-layout.sh`
- Modify: `tests/swe-skills/test-opencode-plugin.mjs`
- Modify: `tests/kimi/test-plugin-manifest.sh` or create `tests/swe-skills/test-kimi-manifest.sh`
- Modify: `tests/codex/test-marketplace-manifest.sh`
- Modify: `tests/opencode/setup.sh` and `tests/opencode/test-plugin-loading.sh` only if the shared fixture is extended
- Modify: `tests/pi/test-pi-extension.mjs` only if package assertions are generalized

**Interfaces:**
- Consumes: all manifests and runtime registration from Task 3, marketplace metadata from Task 5, and package behavior from Tasks 6–7.
- Produces: test coverage proving the split works across the current harness matrix without changing core bootstrap expectations.

- [ ] **Step 1: Extend manifest assertions for the companion plugin**

Add Python assertions that load each companion manifest and verify:

```text
Claude: name swe-skills, skills ./skills/
Cursor: name swe-skills, skills ./skills/
Codex: name swe-skills, skills ./skills/, hooks {}
Kimi: name swe-skills, skills ./skills/, no sessionStart
Gemini: name swe-skills, synchronized version
Package: name swe-skills, main .opencode/plugins/swe-skills.js, pi.skills [./skills]
```

Also assert that `.version-bump.json` declares each companion manifest.

- [ ] **Step 2: Extend marketplace assertions**

Update `tests/codex/test-marketplace-manifest.sh` to assert exactly one `superpowers` and exactly one `swe-skills` entry, with the expected source paths and policy/category fields. Keep the existing assertion that the root Codex manifest has `hooks: {}`.

- [ ] **Step 3: Verify root OpenCode and Pi bootstrap behavior remains unchanged**

Run:

```bash
bash tests/opencode/test-plugin-loading.sh
node --test tests/opencode/test-bootstrap-caching.mjs
node --test tests/pi/test-pi-extension.mjs
```

Expected: root `superpowers` still registers root `skills/` and injects exactly one cached `using-superpowers` bootstrap; no test should expect the companion plugin to inject bootstrap.

- [ ] **Step 4: Run the companion-specific tests**

Run:

```bash
bash tests/swe-skills/test-plugin-layout.sh
node --test tests/swe-skills/test-opencode-plugin.mjs
bash tests/kimi/test-plugin-manifest.sh
bash tests/codex/test-marketplace-manifest.sh
```

Expected: all pass with no duplicate ownership, no stale bootstrap, and synchronized metadata.

If the human partner authorizes commits, commit this checkpoint as:

```text
 test: cover swe-skills harness manifests
```

---

## Task 9: Run repository-wide verification and review the final diff

**Files:**
- No new implementation files; verify all files changed by Tasks 1–8.

**Interfaces:**
- Consumes: the complete split implementation.
- Produces: evidence that the approved design is implemented without cross-plugin contamination or stale references.

- [ ] **Step 1: Run structural and namespace scans**

Run:

```bash
set -e
for skill in behavior-guidelines code-review design-an-interface managing-skill-library self-evolved; do
  test ! -e "skills/$skill"
  test -e "plugins/swe-skills/skills/$skill/SKILL.md"
done

test -e plugins/swe-skills/skills/code-review/references/solid-checklist.md
test -e plugins/swe-skills/skills/code-review/references/object-design.md
test -e plugins/swe-skills/skills/code-review/references/code-quality-checklist.md

if grep -RInE 'superpowers:(behavior-guidelines|code-review|design-an-interface|managing-skill-library|self-evolved)' \
  --exclude-dir=.git --exclude-dir=.history .; then
  exit 1
fi

find plugins/swe-skills/skills -mindepth 1 -maxdepth 1 -type d -print | sed 's#.*/##' | LC_ALL=C sort
```

Expected: exactly five companion skill names and no active stale namespace.

- [ ] **Step 2: Run all targeted shell and Node tests**

Run:

```bash
bash tests/swe-skills/test-plugin-layout.sh
node --test tests/swe-skills/test-opencode-plugin.mjs
bash tests/codex/test-package-codex-plugin.sh
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
bash tests/codex/test-marketplace-manifest.sh
bash tests/kimi/test-plugin-manifest.sh
bash tests/opencode/test-plugin-loading.sh
node --test tests/opencode/test-bootstrap-caching.mjs
node --test tests/pi/test-pi-extension.mjs
bash tests/hooks/test-session-start.sh
```

Expected: every command exits zero.

- [ ] **Step 3: Run the repository’s documented test suite**

Run the fast repository test command documented in `docs/testing.md` and the Claude skill test runner’s fast suite from `tests/claude-code/run-skill-tests.sh`. Include the integration suite only if its prerequisites are available; report any unavailable external harness explicitly rather than masking it.

- [ ] **Step 4: Verify synchronized versions and clean generated artifacts**

Run:

```bash
./scripts/bump-version.sh --check
./scripts/bump-version.sh --audit
git status --short
git diff --check
git diff --stat
```

Expected: all versions match, audit has no undeclared manifest versions, `git diff --check` is clean, and no temporary archive/test artifacts are tracked.

- [ ] **Step 5: Review the complete diff against the approved design**

Run:

```bash
git diff -- \
  plugins/swe-skills \
  skills agents docs README.md .claude-plugin .agents .version-bump.json \
  scripts tests
```

Confirm manually:

- No moved skill remains duplicated under root `skills/`.
- `superpowers` bootstrap and hooks are unchanged except for intentional test/documentation references.
- The companion plugin has no bootstrap injection.
- Core package and companion package archives contain disjoint skill sets.
- Every active moved-skill reference uses `swe-skills:`.
- Marketplace and installation documentation clearly describe installing both plugins.

If the human partner authorizes a final commit, use:

```text
feat: split swe skills into companion plugin
```

---

## Execution Order and Dependencies

1. Task 1 establishes failing contract tests.
2. Task 2 moves the skill sources and satisfies ownership assertions.
3. Task 3 adds companion manifests/runtime registration and makes the companion tests pass.
4. Task 4 updates all active namespaces after the new owner exists.
5. Task 5 updates marketplace/version/install surfaces.
6. Task 6 generalizes Codex packaging and validates companion archives.
7. Task 7 isolates nested Codex sync behavior.
8. Task 8 expands harness-specific regression coverage.
9. Task 9 runs the full verification matrix and final diff review.

Tasks 4 and 5 can be worked in parallel after Task 3. Tasks 6 and 7 both depend on the companion Codex manifest from Task 3 but can be implemented independently. Task 9 is the final gate.

## Plan Self-Review

- **Spec coverage:** Architecture, exclusive ownership, bootstrap ownership, explicit namespaces, all-harness manifests, synchronized versions, marketplace entries, packaging, sync isolation, installation docs, structural checks, loader checks, regression tests, and acceptance criteria are covered by Tasks 1–9.
- **Placeholder scan:** No `TBD`, `TODO`, or unspecified implementation step is used. Every task names concrete paths, commands, assertions, and expected outcomes.
- **Consistency:** The companion plugin is consistently named `swe-skills`; its OpenCode export is consistently `SweSkillsPlugin`; its package main is consistently `.opencode/plugins/swe-skills.js`; core bootstrap remains rooted at `skills/using-superpowers/SKILL.md`; the five moved skills are never listed as core-owned after Task 2.
- **Scope check:** The plan is one cohesive repository split with independently testable migration, metadata, packaging, sync, and harness-validation tasks. No unrelated skill redesign or runtime dependency is included.
