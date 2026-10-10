# `swe-skills` Plugin Split Design

## Purpose

Split five reusable software-engineering skills out of the root `superpowers` plugin into a first-class companion plugin named `swe-skills`, while preserving support for every harness currently supported by this repository.

The moved skills are:

- `behavior-guidelines`
- `code-review`
- `design-an-interface`
- `managing-skill-library`
- `self-evolved`

The new plugin will live at `plugins/swe-skills/` in this repository. `superpowers` remains the core workflow plugin and keeps its bootstrap/session-start runtime.

## Goals

1. Make `swe-skills` the sole source and distribution point for the five skills.
2. Keep the new plugin installable and discoverable across all current harness integrations.
3. Make cross-plugin dependencies explicit by changing core references to the `swe-skills:` namespace.
4. Keep the core plugin's bootstrap, hooks, and unrelated skills working without behavior changes.
5. Keep the `superpowers` and `swe-skills` versions synchronized using the repository's existing version-bump workflow.
6. Validate the split through structural, manifest, packaging, loader, and regression tests.

## Non-goals

- Do not move `using-superpowers`, session-start hooks, OpenCode bootstrap injection, Pi extension logic, or Gemini context ownership.
- Do not create a generated mirror or retain compatibility copies of the five skills in the root `skills/` directory.
- Do not introduce a shared manifest abstraction or a new external dependency.
- Do not redesign the content of the five skills except for namespace/path references required by the split.
- Do not move the skills to a separate repository.

## Architecture

The repository will contain two sibling plugin sources:

```text
plugins/
└── swe-skills/
    ├── .claude-plugin/plugin.json
    ├── .codex-plugin/plugin.json
    ├── .cursor-plugin/plugin.json
    ├── .kimi-plugin/plugin.json
    ├── gemini-extension.json
    ├── package.json
    └── skills/
        ├── behavior-guidelines/SKILL.md
        ├── code-review/
        │   ├── SKILL.md
        │   └── references/
        │       ├── code-quality-checklist.md
        │       ├── object-design.md
        │       └── solid-checklist.md
        ├── design-an-interface/SKILL.md
        ├── managing-skill-library/SKILL.md
        └── self-evolved/SKILL.md
```

The root plugin keeps its existing layout and contains every remaining skill plus its runtime/bootstrap files. The five moved directories, including `code-review/references/`, are removed from the root `skills/` tree. Incidental `.DS_Store` files are not carried into the new plugin.

Each current harness manifest will follow the existing per-harness conventions and point to `plugins/swe-skills/skills/` or the equivalent local plugin-relative path. The new plugin will use the name `swe-skills`, its own display metadata, and the same synchronized version as `superpowers`.

## Components and responsibilities

### `superpowers`

- Owns `using-superpowers` and session initialization.
- Owns Claude/Cursor hooks, OpenCode bootstrap injection, Pi extension behavior, and Gemini context inclusion.
- Registers only the remaining core skills.
- Documents that workflows requiring moved skills need the companion plugin installed.

### `swe-skills`

- Owns and registers exactly the five moved skills.
- Ships the three `code-review` reference checklists with that skill.
- Provides harness-specific metadata and package entry points without duplicating core bootstrap behavior.
- Can be installed for access to these skills, but full Superpowers workflow behavior requires the core plugin as well.

### Core workflow references

Update active core references that require moved skills, including references in:

- `skills/brainstorming/SKILL.md`
- `skills/requesting-code-review/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `skills/subagent-driven-development/implementer-prompt.md`

References in checked-in planning/spec documents that describe the old namespace should also be updated when they are part of the active repository documentation surface. Historical `.history/` snapshots are not an active source surface and should not be rewritten.

## Data flow and installation model

1. A user installs `superpowers` for the core bootstrap and workflow skills.
2. The user installs `swe-skills` when they need the five companion skills.
3. The selected harness discovers each plugin through its respective manifest or package entry point.
4. `superpowers` continues to initialize the session using its own bootstrap.
5. The harness discovers `swe-skills` skills from the companion plugin's local `skills/` directory.
6. Core instructions refer to companion skills using `swe-skills:<skill-name>`, making the installation dependency explicit.

No runtime loader in `superpowers` should read into `plugins/swe-skills/`; the plugins remain independently discoverable and independently packaged.

## Versioning and distribution

Both plugin families use the same version value. The implementation must:

- Add the new plugin manifests and package metadata to `.version-bump.json`.
- Ensure version bumping updates both plugin families consistently.
- Add `swe-skills` to marketplace metadata that supports multiple local plugin entries.
- Extend or add packaging support for the nested companion plugin without changing the existing `superpowers` archive contract.
- Keep sync scripts' source and destination assumptions explicit so nested plugin content is not accidentally embedded into the core plugin package.
- Update installation documentation in `README.md` and harness-specific docs where needed to describe the two-plugin installation model.

The new plugin should not inherit core-only hooks, tests, docs, or bootstrap files merely because it is in the same repository.

## Migration details

1. Move the five skill directories from root `skills/` into `plugins/swe-skills/skills/`.
2. Preserve all tracked skill content and the three `code-review` references.
3. Remove the original root directories so there is one authoritative source for each skill.
4. Add all required companion manifests/package metadata.
5. Update core namespace references from `superpowers:<moved-skill>` to `swe-skills:<moved-skill>`.
6. Update active documentation and install instructions.
7. Update package, sync, marketplace, version-bump, and test infrastructure for the second plugin.
8. Add targeted assertions that core and companion skill ownership do not overlap.

## Error handling and compatibility

The split intentionally does not provide a fallback namespace. A missing companion plugin should surface as an unavailable `swe-skills:<skill-name>` dependency rather than silently resolving a stale copy from core. This prevents duplicate sources and makes installation problems diagnosable.

Core bootstrap behavior must remain unchanged. Existing harness integrations that only install `superpowers` must continue to load the core plugin and its remaining skills; workflows that require one of the moved skills now have an explicit companion-plugin prerequisite.

Packaging must fail validation if:

- A moved skill remains under root `skills/`.
- A required companion skill or reference file is absent.
- A manifest points outside the companion plugin's own skill tree.
- The two plugin versions diverge.
- A core package accidentally includes companion-only content.

## Testing and verification

### Structural checks

- Assert the five moved skill names are absent from root `skills/`.
- Assert the companion plugin contains exactly the five moved skills.
- Assert all three `code-review` reference files are present.
- Assert no duplicate active skill source exists between the two plugin trees.

### Namespace/reference checks

- Search active source, tests, and documentation for stale `superpowers:<moved-skill>` references.
- Verify required core references use `swe-skills:<skill-name>`.
- Verify `self-evolved` points to `swe-skills:managing-skill-library` where a qualified namespace is required.

### Manifest and loader checks

- Validate every current harness manifest for `swe-skills`.
- Run existing Claude hook, Cursor, Kimi, OpenCode, Pi, Gemini, and Codex manifest/loader tests with the nested plugin present.
- Verify core bootstrap tests still pass and do not discover companion skills as core skills.

### Packaging checks

- Package the companion plugin using the supported Codex/package flow.
- Verify the archive includes only companion skills, required metadata, and support references.
- Verify core-only hooks/bootstrap files and unrelated repository directories are excluded.
- Verify synchronized versions in both plugin families and marketplace entries.

### Regression checks

- Run the repository's existing test suite.
- Run targeted namespace, path, manifest, and archive-content scans.
- Confirm the working tree contains no accidental generated artifacts or duplicate skill files.

## Acceptance criteria

The design is successfully implemented when:

1. `plugins/swe-skills/` is a valid independently installable plugin for every supported harness.
2. The five skills exist only in `plugins/swe-skills/`.
3. Core references use the `swe-skills:` namespace and no active stale namespace remains.
4. `superpowers` still owns and injects its bootstrap exactly as before.
5. Both plugins report the same version and pass version-bump validation.
6. Marketplace, packaging, sync, and installation documentation describe both plugins correctly.
7. Companion and core packaging tests pass without cross-contamination.
8. Existing core plugin tests and unrelated skill behavior remain passing.

## Architectural Decisions

### Use a committed sibling plugin at `plugins/swe-skills/`

A committed nested plugin is the clearest representation of ownership and matches the requested same-repository layout. A generated distribution was rejected because it would create a second release/staging path and make local testing less direct. An external repository was rejected because the requested source must remain in this repository and would add repository coordination overhead.

### Move the skills exclusively

The five skills will have one source of truth in `swe-skills`. Keeping copies in core was rejected because duplicate sources can drift and make namespace resolution ambiguous. A compatibility fallback was rejected because it would hide missing companion-plugin installation.

### Keep bootstrap ownership in `superpowers`

`using-superpowers`, hooks, and harness bootstrap logic remain in core because they initialize the broader Superpowers workflow rather than belong to the five reusable SWE skills. Duplicating or moving bootstrap behavior was rejected as unnecessary coupling and a larger regression surface.

### Use explicit `swe-skills:` references

Core workflows will name the companion dependency explicitly. Retaining `superpowers:` references was rejected because it would describe the wrong ownership boundary. Folding the guidance into core was rejected because it would duplicate content and alter the scope of the split.

### Support all current harnesses

The companion plugin will follow every existing harness integration rather than launch with a partial subset. A Claude-only rollout was rejected because the repository currently maintains cross-harness packaging conventions and tests; partial support would create inconsistent behavior for users of other supported harnesses.

### Synchronize versions

`superpowers` and `swe-skills` will share the same version value. Independent version streams were rejected for this initial repository split because the two packages are released from the same checkout and must remain migration-compatible. A later change could decouple them, but that is outside this design.

### Reuse existing manifest and packaging conventions

The implementation will extend existing per-harness manifests, version-bump metadata, marketplace entries, and packaging tests rather than introduce a new abstraction. A new shared manifest layer was rejected because it would add complexity unrelated to the split and would increase the number of changed integration surfaces.
