# Porting Superpowers to a New Harness

This guide explains how to add support for a new harness — an IDE, CLI, or
agent runner that isn't Claude Code — so that Superpowers skills auto-trigger
there the same way they do natively.

It is written in two layers. **Part 1–3** explain how the system works and how
to tell whether a harness can be supported at all; read these before you touch
anything. **Part 4–8** are a prescriptive procedure for an agent (supervised by
a human partner) to execute the port end to end, through distribution. An
appendix indexes the current reference integrations so you can copy the closest
one.

The integration mechanism differs across harnesses, and it will keep changing.
This guide deliberately teaches the **invariants** — the things that must be
true no matter the mechanism — and points you at a live reference implementation
to copy. When this guide and the code disagree, the code wins; fix the guide.

## Before you start

Adding a harness is the highest-stakes contribution type in this repo. Before
writing anything:

- Read `CLAUDE.md` and `.github/PULL_REQUEST_TEMPLATE.md` in full — the
  contributor rules and the new-harness PR requirements are not optional.
- Search open **and closed** PRs for a prior attempt at this harness. If one
  exists, understand why it stalled before starting your own.

---

## Part 1 — How Superpowers works across harnesses

Superpowers is the same content everywhere. What changes per harness is the thin
layer that delivers that content to the model and translates its instructions
into the harness's native tools. Three components:

1. **Skills (harness-agnostic).** Everything in `skills/` is the source of
   truth, shared verbatim by every harness. Skills are written to describe
   *actions* — "invoke a skill", "read a file", "dispatch a subagent", "create a
   todo" — and never name a specific tool. This is what lets one skill body run
   on Claude Code, Codex, Gemini, pi, and the rest without edits.

2. **Tool mapping (per-harness).** Each harness needs the action vocabulary
   translated into its real tool names. That translation lives in
   `skills/using-superpowers/references/<harness>-tools.md` and/or inline in the
   harness's bootstrap injector (see Part 5). It says, e.g., "*dispatch a
   subagent* → call `task` with `subagent_type`."

3. **Bootstrap (per-harness).** At the start of every session, the full
   `skills/using-superpowers/SKILL.md` is injected into the model's context,
   wrapped in `<EXTREMELY_IMPORTANT>` tags, with the tool mapping appended. That
   injected skill is what teaches the model that skills exist and that it must
   check for a relevant skill before acting. **The bootstrap is the entire
   integration.** Without it, the skill files are inert — present on disk, never
   invoked.

### Two rules that make this work

**1. Skills name actions, not tools.** Do **not** edit skill bodies to fit your
harness. Porting adds a tool-mapping reference and a bootstrap injector; it
never reaches into `skills/*/SKILL.md` to swap tool names. (The project's
contributor guidelines treat skill content as carefully-tuned behavior-shaping
code; rewording it for "compliance" is rejected on sight.)

**2. Everything ships through the harness's own install mechanism. Never edit the
user's files.** The bootstrap, the skills, and the tool mapping all get delivered
*as part of what the harness installs* — a plugin, an extension, a marketplace
entry, an extension-bundled context file. A port **must not** reach into a user's
global or personal config (`~/.gemini/config/AGENTS.md`, `settings.json`,
`trustedFolders.json`, a hand-edited `~/.bashrc`, etc.) to inject anything. The
harness owns what it loads; your install artifact is the only thing you get to
write. If the install mechanism genuinely can't carry the bootstrap, that is a
limitation to surface (Part 6) — never a license to hand-edit the user's config.
(Shape C is *not* an exception: Gemini's context file is fine because it ships
*inside the installed extension* and is declared by the manifest's
`contextFileName` — the harness loads the extension's own file, not a file you
edited in the user's home.)

---

## Part 2 — Can this harness be supported?

A harness can support Superpowers only if it can do all of the following. Check
these before writing code — if the first one fails, stop.

### Hard requirement: automatic session-start injection

The harness must let you inject text into the model's context **at the start of
every session, with no per-session opt-in by your human partner.** This is the
one non-negotiable capability. It can take any form:

- a **hook/event system** that runs a shell command at session start and reads
  its stdout (Claude Code, Cursor, Copilot CLI), or
- an **in-process plugin/extension** with a session-start or message lifecycle
  callback that can mutate the message array (OpenCode, pi), or
- an **instructions-file** convention where the harness loads a context file that
  *your installed extension ships and declares* (e.g. Gemini's `contextFileName`
  pointing at the extension's own `GEMINI.md`) — not a file you edit in the user's
  home.

If the only way to get Superpowers in front of the model is for your human
partner to opt in each session (paste a prompt, run a command, enable a mode),
the harness
**cannot** be properly supported. The acceptance test in Part 3 will fail, and
the PR will be closed. This is the single most common reason a "port" isn't a
real port.

### The rest of the capability checklist

| Capability | Why it's needed | If absent |
|---|---|---|
| **Skill discovery + invocation** | The model must be able to load a skill's full content on demand | If there's no native skill tool, the sanctioned fallback is to `read` the relevant `SKILL.md` directly — see Part 5. A harness with neither a skill tool nor file-read cannot work. |
| **File read / write / edit** | Nearly every skill manipulates files | Essential. No workaround. |
| **Run shell commands** | TDD, verification, git workflows | Essential. |
| **Subagent / task dispatch** | `dispatching-parallel-agents`, `subagent-driven-development` | Degradable: if unavailable, those specific skills tell the model to do the work inline or report the missing capability — *never* to invent a `Task` call. Some harnesses gate this behind a config flag (e.g. Codex needs multi-agent enabled). |
| **Todo / task tracking** | Progress tracking in several skills | Degradable: fall back to a plan file or `TODO.md`. |
| **Web fetch / search** | A few skills | Degradable. |
| **Shell or polyglot script execution (Windows)** | Only for the shell-hook shape, only if you want Windows support | See Part 7. In-process-plugin harnesses sidestep this entirely. |

"Degradable" means: the skill already has fallback wording for the missing
tool. Your job in the tool mapping is to point at the real tool when it exists
and reuse that fallback wording when it doesn't.

### You may not need a new directory at all

Some "new harnesses" are really existing integrations under a different
installer. Factory's Droid, for example, consumes the Claude Code plugin via its
own `plugin install` command and needs no new files here. Before building,
check whether the harness can simply load an existing manifest. A port that adds
nothing to this repo but a paragraph in the README is a perfectly good outcome.

---

## Part 3 — Definition of done

A port is finished when **all** of these are true:

1. The `using-superpowers` bootstrap loads at session start, every session, with
   no per-session opt-in.
2. A tool mapping exists for the harness (in
   `references/<harness>-tools.md`, inline in the bootstrap, or both — per Part 5).
3. Skills can actually be invoked — natively, or via the documented
   read-`SKILL.md` fallback — and the model follows them.
4. **The acceptance test passes.** In a clean session, the user message:

   > Let's make a react todo list

   auto-triggers the `brainstorming` skill *before any code is written*. Capture
   the full transcript — the PR requires it.
5. Tests cover the integration (Part 5) and pass.
6. A real user can install it through the harness's own mechanism (not by
   hand-copying files), and the version is tracked in `.version-bump.json` where
   applicable (Part 6). Note that some installers rewrite or strip the manifest on
   install (one drops it to just `{"name": …}`), so "the *installed* files report
   the repo version" is not always achievable — track the version at the source
   manifest and don't treat a rewritten installed manifest as a failure.

A quick smoke check before the full acceptance test: start a session and ask the
model to describe its superpowers. If the bootstrap injected, it knows it has
them. (OpenCode's install doc uses `opencode run --print-logs "hello" 2>&1 |
grep -i superpowers` for the same goal via a different mechanism — log-grep
rather than asking the model; the `2>&1` matters because logs go to stderr. Find
your harness's equivalent.)

---

## Part 4 — Choose your integration shape

There are three structural shapes, distinguished by *how you get the bootstrap
in front of the model*. Pick the one that matches what your harness exposes,
then copy that reference implementation. The shape determines almost everything
in Part 5 — the steps below branch on it.

### How to tell which shape you have

Before routing, learn the harness's *actual* mechanism — and don't assume it's
well documented or that it behaves like whatever harness it forked from.

**Find the surface:**

- **Search the web for the harness's docs** (extension / plugin / hook / skill /
  MCP / "context file" / "rules file"). Vendor tools change fast; search rather
  than trust training knowledge.
- **Find and read an existing third-party extension/plugin for the harness.** A
  real working example beats docs — it shows the manifest shape, the install
  command, and which components the harness actually loads.
- Check what the harness loads at startup: a settings file? an extensions
  directory? a per-project or global instructions file (`AGENTS.md`, `<NAME>.md`)?

**If it's underdocumented, reverse-engineer it empirically** (a real porter has
had to do every one of these):

- `strings` the binary / grep the install tree for hook event names, config
  paths, and the instructions file it reads.
- **Ask the running model to enumerate its own tool names** — e.g. "list the
  exact machine names of every tool you can call." This is the authoritative way
  to get tool names without inventing them (see Step 4).
- Prove every assumption with a **unique-marker test**: inject a nonsense token
  through the mechanism you think works, start a fresh session, and confirm the
  token actually reached the model.

**A fork does not inherit its parent's behavior.** A harness derived from another
(e.g. a Gemini-derived CLI) may expose the parent's manifest fields and
`@`-include syntax and *still not honor them the same way*. Verify with a marker;
never assume the parent's recipe transfers.

Then route to a shape:

- Shell command at session start whose stdout is read → **Shape A**.
- Plugin/extension module with lifecycle callbacks you run code in → **Shape B**.
- Only ever an always-on instructions file, no hook and no code plugin →
  **Shape C**.

**Shapes compose — they are not mutually exclusive.** The *skill-discovery*
mechanism and the *bootstrap* mechanism need not be the same shape — but **both
must still ride the install mechanism** (rule 2). Decide the two questions
separately: *where do skills get discovered?* and *how does the bootstrap reach
the model every session?* A harness might install skills via a plugin yet need
the bootstrap delivered another install-shipped way (an extension-declared
context file, or — see below — by the harness surfacing the installed
`using-superpowers` skill's own description at session start). If more than one
install-mechanism surface injects automatically, prefer the most reliable. What
you may **not** do is bridge a gap by editing the user's global config.

### Shape A — Shell-hook

The harness has a hook system that runs a shell command at session start and
reads JSON from its stdout. The configured command runs `run-hook.cmd`, a
polyglot wrapper that just locates bash and dispatches the named script; the
script (`hooks/session-start`, or a harness-specific variant) is what reads
`using-superpowers/SKILL.md` and prints a JSON object whose **field name and
nesting differ per harness**.

- Reference: `hooks/session-start`, `hooks/run-hook.cmd`, and the per-harness
  hook config `hooks/hooks.json` (Claude Code) and `hooks/hooks-cursor.json`
  (Cursor).
- Manifests: `.cursor-plugin/plugin.json` is the Shape A manifest example that
  points the harness at `./skills/` and the right `hooks-*.json`. Claude Code's
  `.claude-plugin/plugin.json` sets neither field — it auto-discovers `skills/`
  and `hooks/hooks.json` by convention. Do **not** copy Codex's
  `.codex-plugin/plugin.json` for Shape A: it declares an empty `hooks` object
  specifically to suppress Codex's `hooks/hooks.json` auto-discovery, because
  Codex surfaces skills natively and runs no session-start hook.

> **A hook *system* is not a session-start *event*.** A harness can have a
> `hooks.json` mechanism — and even contain the literal string `SessionStart` in
> its binary — while having no hook event that fires at session start and can
> inject context. (One real harness only exposed pre/post-tool and stop events;
> the `SessionStart` strings were telemetry.) Confirm the *specific event* you
> need exists and can write to the model's context before committing to Shape A.
> If it can't, the bootstrap belongs in an instructions file (Shape C) instead.

### Shape B — In-process plugin / extension

The harness loads a JS/TS module that exposes lifecycle callbacks. You register
the skills directory through the harness's API and inject the bootstrap by
mutating the message array in code.

- Reference: `.opencode/plugins/superpowers.js` (JavaScript) and
  `.pi/extensions/superpowers.ts` (TypeScript). pi is the closest reference for
  any harness that has **no native skill tool**.

### Shape C — Instructions-file

The harness has neither a shell hook nor a code plugin — its session-start
surface is a context file that *your installed extension ships and the manifest
declares* (e.g. Gemini's `contextFileName` → the extension's own `GEMINI.md`).
You can't run code or mutate messages; the extension's context file points at the
bootstrap. There is no injector to assemble a string or strip frontmatter — the
harness loads the referenced content as-is. **This works only because the file is
part of the installed extension** — never substitute "edit the user's global
`GEMINI.md`/`AGENTS.md`" for shipping your own (rule 2).

- Reference: `gemini-extension.json` (manifest, with `contextFileName`),
  `GEMINI.md` (two `@`-includes — the bootstrap skill and the tool-mapping
  reference), `skills/using-superpowers/references/gemini-tools.md`.
- Note: `@`-include is a Gemini feature. If your harness loads an instructions
  file but has no include syntax, you must inline the bootstrap content into the
  file instead.
- **Don't trust that an `@`-include is actually expanded — prove it.** A
  Gemini-*derived* harness can accept `@./path` syntax yet treat it as a *hint
  the model may choose to read* (it emits a file-read tool call) rather than a
  guaranteed inline expansion. That's the difference between the bootstrap being
  reliably present every session and the model maybe-reading it. Run a
  unique-marker test: if the marker isn't in context *without* a tool call,
  **inline the content** rather than `@`-include it.

### Routing table

| If the harness… | Use shape | Copy from |
|---|---|---|
| runs a shell command at session start and reads its stdout | A (shell-hook) | Cursor (`hooks/session-start` + `hooks/hooks-cursor.json` + `.cursor-plugin/`) |
| is a JS/TS plugin host with session/message lifecycle callbacks | B (in-process) | OpenCode (`.opencode/`) — or pi (`.pi/`) if it has no native skill tool |
| ships an extension-declared context file it always loads | C (instructions-file) | Gemini (`gemini-extension.json` + `GEMINI.md` + `references/gemini-tools.md`) |
| has a plugin install command and a manifest `contextFileName` (or equivalent) the installer keeps | C via the plugin installer | Antigravity (`.antigravity-plugin/` — `agy plugin install` ships a generated context file; verify the installer preserves it — Part 6) |

Most real harnesses fit one row cleanly; the last is the hybrid case (rule 2 still
holds — the bootstrap rides the install mechanism, never a user-config edit).

---

## Part 5 — The porting procedure

### Step 1 — Study the closest reference implementation

Open the files named in Part 4 for your shape and read them end to end. The
patterns below are summaries; the code is the spec.

### Step 2 — Create the manifest / entry point

Create whatever the harness uses to recognize the plugin. Match the existing
ones in spirit:

- **Shape A:** a `*-plugin/plugin.json` (see `.cursor-plugin/plugin.json`) with
  `name`, `version`, `description`, author/license/keywords, `"skills":
  "./skills/"`, and `"hooks": "./hooks/hooks-<harness>.json"`. Plus the
  `hooks-<harness>.json` itself, registering a session-start hook whose command
  invokes `run-hook.cmd`.
- **Shape B:** the module the harness loads (e.g. `.<harness>/plugins/*.js`) plus
  whatever package metadata it needs to be discovered. The committed package
  metadata is the **repo-root `package.json`**: `main` points at the OpenCode
  plugin, the `pi` field (`pi.extensions`, `pi.skills`) plus the `pi-package`
  keyword declare the pi extension. Per-harness local manifests and lockfiles are
  kept out of git — `.opencode/.gitignore` excludes `node_modules`,
  `package.json`, and lockfiles. Do the same for your harness's *local* install
  artifacts so they don't pollute the repo — but never gitignore the repo-root
  `package.json`, which is the tracked source of truth.
  - **Build/dependency check.** Decide how the harness loads your module:
    does it run the source directly (pi's `.ts` is referenced as-is from
    `package.json`; OpenCode ships plain `.js`), or does it need a transpile/build
    step? Superpowers is zero-runtime-dependency. pi's `import type
    { ExtensionAPI }` works specifically because the harness runs the `.ts`
    directly, supplies that type at load, and the repo never type-checks the file
    in CI — the import isn't even declared as a dependency. If *your* harness
    actually type-checks or bundles the plugin, that breaks: an undeclared type
    import fails, and the PR rules only carve out *runtime* deps for new
    harnesses, not dev/type packages. If you hit this, confirm the approach with
    the maintainer rather than quietly adding a dependency. Keep any build output
    out of git and document the command.
- **Shape C (instructions-file):** a small manifest (see `gemini-extension.json`:
  `name`, `description`, `version`, `contextFileName`) plus the context file
  itself (`GEMINI.md` is just two `@`-includes: the bootstrap skill and the
  tool-mapping reference). The Gemini manifest has no `skills` field — Gemini
  auto-discovers the `skills/` directory bundled in the installed extension. If
  your harness has a native skill tool but no manifest field to register the
  directory, you must find its discovery convention (read its extension docs),
  then verify empirically: after wiring, ask the model to list its available
  skills — if the bundled skills don't appear, discovery isn't working yet.

### Step 3 — Wire the bootstrap injection

This is the heart of the port. The shared goal: at session start, get the
`using-superpowers` skill content (wrapped in `<EXTREMELY_IMPORTANT>` tags) plus
the harness's tool mapping in front of the model, with a note that the skill is
already active so the model doesn't try to load it again. *How* you do that —
and what you assemble vs. what the harness loads raw — depends entirely on your
shape. Do **not** apply one shape's recipe to another.

**Shape A — a script reads `SKILL.md` and prints the harness's JSON.** The
dispatched script (`hooks/session-start`) `cat`s the whole `SKILL.md` (frontmatter
included — that's fine; it's emitted verbatim), wraps it with the "You have
superpowers… for all other skills use the Skill tool" preamble, escapes it, and
prints the harness's JSON shape. The tool mapping for Shape A does **not** go
inline here — it lives in `references/<harness>-tools.md` (Step 4). Get the JSON
output shape exactly right. `hooks/session-start`
detects the harness from environment variables and prints *one of three* shapes:

- Cursor (`CURSOR_PLUGIN_ROOT` set): `{ "additional_context": "…" }`
- Claude Code (`CLAUDE_PLUGIN_ROOT` set, `COPILOT_CLI` unset):
  `{ "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": "…" } }`
- Copilot CLI / SDK standard (else): `{ "additionalContext": "…" }`

This is a trap. Emitting the wrong field, or an extra one, means the bootstrap
either never injects or injects twice (Claude Code reads both
`additional_context` and `hookSpecificOutput` without de-duplicating, so emitting
both double-injects). Find the
exact field, nesting, and event-matcher values your harness expects. Then
decide: add a fourth branch to `hooks/session-start`, or — if the harness needs
a different bootstrap message or env contract — add a dedicated
`hooks/session-start-<harness>` script. If you add a branch
and your harness *also* sets an env var an earlier branch keys on (some harnesses
set `CLAUDE_PLUGIN_ROOT` too), order your branch before the one that would
otherwise shadow it. Match the harness's
own event-matcher strings (Claude Code uses `startup|clear|compact`, Cursor
`sessionStart`); wrong matchers mean the hook silently never fires.

The **hook-config schema itself varies per harness** — don't assume the
Claude Code shape is universal. Compare `hooks/hooks.json` and
`hooks/hooks-cursor.json`: Cursor's uses
`"version": 1`, a lowercase `sessionStart` key, a relative
`./hooks/run-hook.cmd` command, and omits the `matcher`/`type`/`async` fields
Claude Code uses. Match your `hooks-<harness>.json` to whichever existing file is
closest, not to a single canonical template.

The hook **command string references a harness-provided plugin-root variable**,
and its name differs per harness: `hooks.json` uses `${CLAUDE_PLUGIN_ROOT}`,
`hooks-cursor.json` uses a relative path. Use
whatever your harness exports. (The `session-start` script re-derives the root
itself via `dirname`, so the script body doesn't depend on this — but the
command in the manifest does.)

**Discovering the harness's contract.** The three facts above — env var, JSON
field/nesting, matcher strings — are the harness's contract, not Superpowers',
so you have to source them. Read the harness's hook docs, or find out
empirically: register a throwaway session-start hook that dumps its environment
and emits a marker, then observe which env var identifies the harness and
whether/how the harness ingests your stdout. Pin these down before writing the
real branch.

**Shape B — assemble the string in code, then inject as a user message.** Here
you build the bootstrap yourself: read `SKILL.md`, strip its YAML frontmatter,
and assemble `<EXTREMELY_IMPORTANT>` + a short preamble that the skill is already
loaded and must not be re-invoked + the stripped body + the inline tool mapping +
`</EXTREMELY_IMPORTANT>`. One subtlety the references disagree on: OpenCode's
preamble says "do NOT use the skill tool…" (assumes a `skill` tool exists), while
pi's just says "do not try to load using-superpowers again." If your harness has
no skill tool, use pi's wording, not OpenCode's.

Inject the result as a **user-role message, not a system message** — system
messages bloat tokens when repeated every turn (#750) and multiple system
messages break some models (#894). Three things you must replicate:

- **Dedup guard.** The lifecycle callback can fire repeatedly (OpenCode's
  transform runs on *every* agent step; pi's `context` fires per turn). Before
  injecting, check whether a bootstrap marker is already present and skip if so.
  (The references pick different markers — pi a custom string, OpenCode the
  `EXTREMELY_IMPORTANT` tag; matching the tag is more robust since it needs no
  harness-specific constant.) Cache the bootstrap content at module level so
  you're not re-reading and re-parsing `SKILL.md` on every call (#1202).
- **Compaction.** If the harness compacts/summarizes history, re-inject
  afterward. pi sets an `injectBootstrap` flag on `session_start` and
  `session_compact`, clears it on `agent_end`, and inserts the message *after*
  any leading compaction-summary messages. OpenCode relies on its per-step
  re-injection plus the dedup guard.
- **Message-object shape is per-harness — discover yours, don't copy a literal.**
  The two references use *incompatible* shapes: pi builds
  `{ role, content: [{ type, text }], timestamp }`; OpenCode manipulates
  `message.info.role` and `message.parts[]`. Find your harness's message shape
  from its API; copying a reference's object literal verbatim will fail silently.

**Shape C — point your extension's context file at the bootstrap; assemble
nothing.** There is no injector, so you do *not* strip frontmatter or build a
wrapped string. The context file your extension ships (declared by the manifest —
*not* the user's own global file) pulls in two things: the `using-superpowers`
skill and the harness's tool-mapping reference. `GEMINI.md`
does this with two `@`-includes (`@./skills/using-superpowers/SKILL.md` and
`@./skills/using-superpowers/references/<harness>-tools.md`); the harness loads
them raw, frontmatter and all, and `SKILL.md` already carries its own
`<EXTREMELY-IMPORTANT>` block internally. If your harness has no include syntax,
inline the content into the instructions file instead. Gemini ships **no**
"already loaded, don't re-invoke" preamble — for an `@`-include harness the
content is the active instruction set, not a skill the model would re-load. If
you find your harness does try to re-invoke, add that note as a literal line in
the instructions file (you have no code to add it any other way).

### Step 4 — Write the tool mapping

Translate the action vocabulary into the harness's real tools. Cover every one
of these actions (omit only what genuinely doesn't apply):

- read a file
- create / edit / delete a file (one `apply_patch`-style tool, or separate
  write/edit?)
- run a shell command
- search file contents / find files by name (grep, glob)
- fetch a URL / web search
- **dispatch a subagent**, including how to pass the agent type — and any config
  flag needed to enable it
- **create / update todos** (treat older `TodoWrite` references as this action)
- **invoke a skill** — see Step 5

**Get the real tool names from the harness; never invent them.** If the docs
don't list them, the authoritative source is the harness itself: in a live
session, ask the model to "list the exact machine names of every tool you can
call, one per line" and use what it reports.

**How the harness finds the `skills/` directory is itself per-harness** — confirm
it, don't assume. Possibilities: a manifest `skills` path field (Codex's
`"skills": "./skills/"`); a *co-located* `skills/` the harness auto-scans (where a
path field is **ignored** — one real harness only scanned a `skills/` sitting next
to `plugin.json`); an API/registration call (OpenCode, pi); or you stage an
install dir that pairs the manifest with a **symlink to the repo's `skills/`** and
point the installer at the staging dir (verify the installer *dereferences* the
symlink and copies the real files — confirm with `agy plugin validate`/`install`
or the equivalent before relying on it). A `skills` path field is *not* portable.

Where the mapping lives depends on shape:

- **Shape A:** put it in `skills/using-superpowers/references/<harness>-tools.md`.
  The agent reaches it from the bootstrap — `SKILL.md`'s "Platform Adaptation"
  section links the per-harness references files. (Shape A harnesses have no
  instructions file; the mapping is *not* inlined into the hook output.)
- **Shape B:** the mapping is typically inlined into the bootstrap string you
  inject (see the `toolMapping` constant in `superpowers.js`). pi keeps it in
  *both* places — `piToolMapping()` inline **and** `references/pi-tools.md`. If
  you maintain it in two places, update both, or the port is half-done.
- **Shape C:** put it in `references/<harness>-tools.md` and pull it into the
  always-loaded instructions file (e.g. `GEMINI.md` `@`-includes
  `gemini-tools.md`).

You may also add a one-line pointer to your harness in `SKILL.md`'s "Platform
Adaptation" section so an agent reading the bootstrap knows where its mapping
lives. This is the one edit to a `SKILL.md` a port may make — and only because
that section is a pointer list, not behavior-shaping content. It does not violate
the "don't edit skill bodies" rule (Part 1); do not touch anything else in any
skill. (The list is a convenience pointer, not an exhaustive registry — not every
harness is listed.)

### Step 5 — Handle a harness with no native skill tool

`using-superpowers/SKILL.md` tells the model to *never read skill files manually
with file tools — always use your platform's skill-loading mechanism.* The point
is "don't bypass the mechanism," not "never use file-read." What counts as "your
platform's mechanism" depends on the harness — and for a harness with no skill
tool, the documented mechanism *is* reading `SKILL.md`. So reading it there
honors the rule rather than breaking it. Distinguish three cases:

1. **Native `Skill`-style tool** (Claude Code, Copilot CLI, Gemini's
   `activate_skill`): point the mapping at that tool.
2. **Native skill *discovery* but no `Skill` tool** (pi, Antigravity): the harness
   can find and list skills, but the model can't call a tool to load one. Get the
   skills installed where the harness scans (pi registers via `resources_discover`
   → `skillPaths`; OpenCode via its `config` hook; `agy plugin install` copies
   them in), and tell the model to load a skill by **reading its `SKILL.md` with
   the file-read tool when the skill applies** — the sanctioned mechanism here,
   the way `references/pi-tools.md` states it.

   **For the bootstrap itself, prefer a declared context file (Part 6).** If the
   harness has a `contextFileName`-style manifest field — as Antigravity does —
   ship a generated context file through the installer: it's guaranteed-loaded and
   carries both the `using-superpowers` content and the tool mapping. That is the
   strong, preferred path.

   **Fallback — the surfaced skill index.** If there's no context-file field but
   the harness surfaces each installed skill's name + description at session start,
   you need *neither* a built index nor a runtime-list instruction — the harness
   is the index, and `using-superpowers`'s own surfaced description can be what
   triggers the model to load it. This is softer than a declared context file;
   two things it does **not** give you, versus a context file / hook / in-process
   injector — account for both:
   - **It bootstraps *triggering*, not the *tool mapping*.** An injector prepends
     `<harness>-tools.md` alongside `using-superpowers` every session. Here nothing
     injects the mapping — the model only sees skill *descriptions* and must *read*
     your `references/<harness>-tools.md` when it needs tool names. It works
     because skills name actions (the model reads the mapping when it acts), but
     it's softer than injection. Make sure the mapping is reachable from what the
     model loads — e.g. linked from `SKILL.md`'s Platform Adaptation section and
     installed alongside the skills — not just sitting in the repo.
   - **There's no structural guarantee the trigger fires.** No `<EXTREMELY_IMPORTANT>`
     wrapper, no dedup, no re-injection after compaction — firing depends on the
     model choosing to act on a description it sees in the index. This is exactly
     why the acceptance test is mandatory here: it is the *only* guarantee, so run
     it on the model(s) your users will actually use, not just the strongest one.
3. **No skill system at all:** there is nothing to register, and the *only*
   mechanism is the model reading `SKILL.md` on demand. But the model can't read
   what it can't find: `using-superpowers/SKILL.md` does **not** enumerate the
   available skills, so on its own the model won't know which skills exist or
   their triggers. You must supply a discovery path. Two options, and they differ
   in durability: (a) generate a skill index (each `skills/*/SKILL.md`'s `name` +
   `description` frontmatter) and place it *inside* the `<EXTREMELY_IMPORTANT>`
   wrapper alongside the tool mapping (Shape B recipe above) so it's covered by
   the dedup guard — but a build-time index goes stale as skills are added; or
   (b) instruct the model to list `skills/*/SKILL.md` at runtime and read their
   frontmatter to find a match — slower but never stale. Prefer (b) unless you
   have a reason not to. Without either, a no-skill-system port loads the
   bootstrap but silently never triggers any other skill.

In cases 2 and 3, say plainly in your tool mapping that reading `SKILL.md` is the
blessed path, so the model doesn't think it's violating the "never read skill
files" rule. Don't go hunting for a `skillPaths`-style registration API in a
harness that has no skill system — case 3 has none.

### Step 6 — Add tests

Match the existing per-harness test style:

- **Shape A:** assert the hook's stdout has the exact JSON shape your harness
  consumes, and that it contains the bootstrap. See `tests/hooks/test-session-start.sh`,
  which validates each harness's output shape.
- **Shape B:** a unit test that fakes the harness's plugin API and asserts the
  lifecycle handlers register, the bootstrap injects once, the dedup guard
  works, and (if relevant) compaction re-injection works. See
  `tests/pi/test-pi-extension.mjs`. Add an isolated-install integration check in
  the style of `tests/opencode/`.
- If the bootstrap is cached, test that the cache behaves when the file is
  missing (see the OpenCode caching tests).

These automated tests cover the wiring; the live tmux run in Step 7 is what
proves the integration actually triggers skills.

### Step 7 — Install locally, then drive a live instance to verify

You cannot confirm a port works by reading code. You have to run the harness with
your in-progress port loaded and watch a real session — which is also how you
produce the transcript the PR requires.

**Install locally.** Point a *local* instance of the harness at your working
tree, not a published build:

- **Shape A / C:** install the plugin/extension from this repo's local path (or
  symlink its directory into wherever the harness looks). Find the harness's
  "install from a local directory / git checkout" path in its docs.
- **Shape B:** register the local module — e.g. an `opencode.json` `plugin`
  entry pointing at the local path, or pi resolving the `package.json` fields
  from the repo.

Reinstall after each change and restart the harness, since the bootstrap loads at
startup.

**Drive it with tmux.** Most harnesses are interactive REPLs/TUIs that can't be
driven by piping stdin, so run the harness inside a detached tmux session and
control it with `send-keys` / `capture-pane`. A harness may advertise a
non-interactive "run one prompt" mode (e.g. `opencode run "..."`) — try it for the
quick smoke check, but **don't depend on it**: these modes are frequently flaky,
auth-gated, or trust-gated (one real harness's `--print` mode hung and timed out
with no output every time). Be ready to do *everything*, including the smoke
check, through tmux.

**Clear the gates first, or tmux stalls silently.** Many harnesses block on
first-run onboarding, a "do you trust this folder?" prompt, a sandbox mode, or a
permission gate — and a detached tmux session will just sit there with no error
while it waits. Before the run, pre-trust your scratch directory (in the harness's
settings/config) or be prepared to answer those prompts via `send-keys`, and
account for the harness's startup time in your first `sleep`.

```bash
# 1. Launch the harness detached, in a throwaway project dir
mkdir -p /tmp/port-smoke
tmux new-session -d -s port-test -c /tmp/port-smoke '<harness-launch-command>'

# 2. Let it initialize — real TUIs take longer than you think (10s+ with a model
#    handshake); tune this. THEN capture and clear any blocking modal before you
#    type a prompt: first-run onboarding and "trust this folder?" are modal, so
#    keystrokes sent during them select menu items instead of typing your prompt.
sleep 12
tmux capture-pane -t port-test -p          # onboarding / trust prompt? answer it via send-keys first
# (e.g. tmux send-keys -t port-test Enter   # to accept a trust prompt — inspect before assuming)

# 3. Smoke check: does the model know it has superpowers?
#    Send the text and Enter as SEPARATE send-keys with a beat between them —
#    sending them together races on some TUIs (Enter arrives before the text lands).
tmux send-keys -t port-test 'What are your superpowers?'; sleep 0.4; tmux send-keys -t port-test Enter
sleep 5
tmux capture-pane -t port-test -p          # reply should show it knows its skills

# 4. Acceptance test: exact prompt (note the escaped apostrophe), fresh session
tmux send-keys -t port-test 'Let'\''s make a react todo list'; sleep 0.4; tmux send-keys -t port-test Enter
# poll until the turn finishes — re-capture every few seconds, don't capture once
sleep 8
tmux capture-pane -t port-test -p          # PASS = brainstorming triggers BEFORE any code

# 5. Save the transcript for the PR, then clean up
tmux capture-pane -t port-test -p > /tmp/port-smoke/transcript.txt
tmux kill-session -t port-test
```

tmux gotchas that bite here: wait after launch before the first capture; send the
prompt text and `Enter` as *separate* `send-keys` calls with a short `sleep`
between them (sending them together races on some TUIs), and `Enter` is a key name
not `\n`; the agent's turn takes time, so **poll `capture-pane` in a loop** rather
than capturing once; `capture-pane` shows only the visible pane, so for a long
conversation use the harness's own transcript/log file as the record of truth;
always `kill-session` when done.

If the smoke check shows the model *doesn't* know it has superpowers, the
bootstrap isn't loading — fix that before bothering with the acceptance test.

---

## Part 6 — Distribution and release

A working integration in this repo isn't usable until a real user can install
it. Distribution differs per harness ecosystem — find yours:

| Channel | Example | What you do |
|---|---|---|
| Native plugin marketplace | Claude Code | Register in `.claude-plugin/marketplace.json`; users `/plugin install`. The external `superpowers-marketplace` repo is the source of truth users install from — see the release steps in `CLAUDE.md`. |
| External marketplace fork, synced by script | Codex | `scripts/sync-to-codex-plugin.sh` rsyncs the tracked plugin files into a separate fork repo and opens a PR. Read its include/exclude list so you ship the right tree (it deliberately drops repo-internal dirs and other harnesses' dotdirs). |
| Git-URL extension install | Gemini, Kimi Code, OpenCode | Users install from a git URL (`gemini extensions install …`; Kimi Code `/plugins install …`; an `opencode.json` `plugin` array entry). Document the exact command. |
| Package-manifest fields | pi | Declared through fields in the repo-root `package.json`; users install via the harness's package command. |
| Local installer (plugin install) | Antigravity (`agy`) | A small `install.sh` that runs the harness's own `agy plugin install` against a staging dir holding the manifest, the skills, and a generated `contextFileName` context file (the bootstrap). Everything arrives through the install mechanism — *not* by editing the user's config (see below). |

Then:

- **A plugin installer may silently strip *undeclared* files — so make the
  bootstrap a file the installer *recognizes*, never a user-config edit.** A
  `plugin install` typically copies only the components it knows about
  (skills/agents/commands/mcp/hooks/context) and discards anything else, so a
  context file the manifest doesn't declare just vanishes from the install. The
  fix is **not** to give up and write into the user's config (**rule 2**) — it's
  to declare the bootstrap as a recognized component. In escalation order:
  - **Ship a context file the manifest declares.** If the harness has a
    `contextFileName`-style field (an extension-declared file it loads every
    session), that is the strongest clean bootstrap: declare it, and the installer
    preserves it *and* the harness loads it. Generate it at install time from the
    live `using-superpowers/SKILL.md` + the tool mapping (wrapped in
    `<EXTREMELY_IMPORTANT>`) so the installed bootstrap never drifts. This is what
    `.antigravity-plugin/install.sh` does — `agy plugin install` reports
    `✔ context : ANTIGRAVITY.md`, and a clean session reads `using-superpowers`'s
    SKILL.md, loads `brainstorming`, and enters the brainstorming flow before any
    code. **Verify with a marker** that the installer keeps the file and the
    harness loads it: one porter wrongly concluded it couldn't, because they
    shipped the file *without* declaring `contextFileName` and it was stripped as
    unrecognized.
  - **Otherwise lean on the installed `using-superpowers` skill itself.** If the
    harness surfaces each installed skill's name + description at session start,
    the `using-superpowers` description ("Use when starting any conversation…")
    can prompt the model to load it — installing the skill *is* the bootstrap.
    Softer (no guaranteed wrapper; it carries triggering but not the tool mapping
    — see Step 5), so prefer the declared context file when available.
  - If neither works, the harness cannot be cleanly supported yet — **say so**
    and raise it, rather than hand-editing the user's config.

- **Write install docs.** A `docs/README.<harness>.md` and/or a
  `.<harness>/INSTALL.md` (see `docs/README.opencode.md` and
  `.opencode/INSTALL.md`), plus an install section in the top-level `README.md`.
  The only supported install action is **running the harness's own install
  command** (`agy plugin install`, `gemini extensions install`, `/plugin
  install`, etc.). Hand-copying skill files and editing the user's global/personal
  config are *both* off-limits (rule 2 / the PR rules). If the harness has no
  install command at all — its only surface is a user-owned config file — then it
  fails the "deliver via install mechanism" rule, and you should raise that rather
  than ship an installer that edits the user's files.
- **Register the version.** If your harness introduces a *new* versioned
  manifest, add its path and version field to `.version-bump.json` so
  `scripts/bump-version.sh` keeps it in lockstep (read that file to see what's
  currently tracked). A new manifest that isn't registered there will ship a
  stale version. If your harness instead rides an already-tracked file — pi
  declares itself in the repo-root `package.json`, which is already listed —
  there's nothing new to add.
- **If no existing channel fits, you're standing up a new one.** None of the four
  rows may match your harness. If it needs a Codex-style external fork sync,
  `scripts/sync-to-codex-plugin.sh` is the template to clone (note its anchored
  include/exclude list and its PR automation). And whenever you add a new
  per-harness directory, add it to the *other* harnesses' sync excludes (e.g. the
  EXCLUDES list in `sync-to-codex-plugin.sh`) so your dotdir doesn't leak into
  their distributions.

---

## Part 7 — Cross-platform / Windows

Only relevant to the shell-hook shape. `hooks/run-hook.cmd` is a polyglot: a
single file that's valid as both a Windows batch script and a Unix shell script.
On Windows, `cmd.exe` runs the batch portion, which locates `bash` (Git for
Windows, then `bash` on PATH) and runs the named hook script; if no bash is
found it exits cleanly so the harness still works, just without injection. On
Unix, the leading `:` makes the batch block a no-op and the shell runs the
script directly.

Two rules this enforces, which you must respect:

- **Hook scripts are extensionless** (`session-start`, not `session-start.sh`).
  Claude Code's Windows handling prepends `bash` to any command containing
  `.sh`, which would double-invoke. Name your hook script without an extension.
- Don't write per-OS variants of the hook script. One extensionless bash script
  plus the polyglot wrapper covers all three platforms.

`hooks/run-hook.cmd` itself is the authoritative implementation — read it. See
`docs/windows/polyglot-hooks.md` for the background and rationale behind the
dispatcher pattern.

---

## Part 8 — Submitting the PR

- Target the **`dev`** branch. One harness per PR.
- Fill in the PR template's **"New harness support"** section and paste the
  complete acceptance-test transcript (the "Let's make a react todo list"
  session showing `brainstorming` auto-triggering). A PR without this proof will
  be closed.
- Superpowers is a zero-dependency plugin. Don't add a third-party runtime
  dependency. Adding a new harness is the one carve-out the contributor rules
  allow, and even then keep it to what the integration strictly requires —
  type-only imports that compile away are fine; runtime packages are not.
- Don't touch skill bodies (Part 1). If you found yourself editing a `SKILL.md`
  to make the port work, the fix belongs in your tool mapping instead.

---

## Appendix A — Reference integrations (current)

Use this as the live index; when in doubt, read the files, not this table.

| Harness | Entry point | Bootstrap mechanism | Tool mapping | Tests | Distribution |
|---|---|---|---|---|---|
| Claude Code | `.claude-plugin/plugin.json` + `hooks/hooks.json` | shell hook → `hooks/session-start` (`hookSpecificOutput.additionalContext`) | native `Skill` tool; `references/claude-code-tools.md` | `tests/hooks/` | marketplace |
| Codex | `.codex-plugin/plugin.json` (declares empty `hooks`) | native skill discovery (no session-start hook) | `references/codex-tools.md` | `tests/codex/`, `tests/codex-plugin-sync/` | fork sync (`scripts/sync-to-codex-plugin.sh`) |
| Cursor | `.cursor-plugin/plugin.json` + `hooks/hooks-cursor.json` | shell hook → `hooks/session-start` (`additional_context`) | `references/claude-code-tools.md` | `tests/hooks/` | hand-authored |
| Copilot CLI | (shares Claude Code hook path; `COPILOT_CLI` env) | shell hook → `hooks/session-start` (`additionalContext`) | `references/copilot-tools.md` | `tests/hooks/` | — |
| Gemini CLI | `gemini-extension.json` + `GEMINI.md` | instructions file `@`-includes bootstrap + mapping | `references/gemini-tools.md` | — | `gemini extensions install` |
| Kimi Code | `.kimi-plugin/plugin.json` | manifest `sessionStart.skill` loads `using-superpowers` | inline `skillInstructions` in manifest | `tests/kimi/` | marketplace or `/plugins install` GitHub URL |
| OpenCode | `.opencode/plugins/superpowers.js` (declared via root `package.json` `main`) | in-process: `config` hook registers skills dir; `experimental.chat.messages.transform` injects user message | inline in `superpowers.js` | `tests/opencode/` | `opencode.json` plugin git URL |
| pi | `.pi/extensions/superpowers.ts` | in-process: `resources_discover` registers skills; `context` event injects user message; lifecycle-flag + compaction-aware | `piToolMapping()` inline **and** `references/pi-tools.md` | `tests/pi/` | repo-root `package.json` fields |

## Appendix B — Gotchas that have bitten porters

- **Opt-in isn't a port.** If your human partner has to do anything per session
  to get Superpowers, the acceptance test fails. Re-read Part 2.
- **Wrong JSON field → silent failure or double injection.** Shape A only.
  Confirm the exact field/nesting; Claude Code reads two fields without dedup.
- **Hook-config schema varies per harness.** Shape A. Cursor's `hooks-cursor.json`
  looks nothing like the Claude Code one (`version`, lowercase `sessionStart`,
  relative command, no `matcher`/`type`/`async`). Match the closest existing file.
- **Plugin-root env var differs per harness.** Shape A. The hook command uses
  `${CLAUDE_PLUGIN_ROOT}` (Claude) or a relative path
  (Cursor). Use what your harness exports; the script re-derives the root itself.
- **System-message injection.** Shape B injects a *user* message on purpose
  (#750, #894). Don't "fix" it to a system message.
- **Per-step vs per-turn callbacks.** OpenCode fires every step (per-call dedup
  guard); pi fires per turn (lifecycle flag + `agent_end` reset). Copying one
  harness's dedup strategy onto the other's callback frequency breaks injection.
- **Message-object shape is per-harness.** Shape B. pi and OpenCode use
  incompatible shapes; discover yours, don't copy a reference's object literal.
- **Hunting for a skill-registration API that doesn't exist.** A harness with no
  skill system (not just no `Skill` tool) has nothing to register — the model
  reads `SKILL.md` on demand. Don't assume a `skillPaths` equivalent exists.
- **Mapping in two places.** For in-process plugins the mapping may live both
  inline and in a `references/` file (pi). Update both.
- **The "never read skill files" line.** It means "don't bypass your platform's
  skill-loading mechanism," not "never use file-read." On a no-skill-tool harness
  that mechanism *is* reading `SKILL.md` — say so explicitly in the mapping
  (Part 5).
- **`.sh` on Windows.** Keep hook scripts extensionless (Part 7).
- **Unregistered version.** A new manifest not added to `.version-bump.json`
  ships stale (Part 6).
- **Editing skills to fit the harness.** Never. The fix goes in the tool mapping.
