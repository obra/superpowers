# Superpowers for Kilo Code

Superpowers loads through Kilo's native server plugin system. The plugin
registers the repository's original skill directory and injects the
`using-superpowers` bootstrap into the system context of a top-level session.
There is no skill copying, `npx skills` wrapper, or per-session opt-in.

## Installation

Tested with Kilo Code CLI 7.8.17, using its native server plugins and
`experimental.chat.system.transform` hook. VS Code was not separately tested.

Install the git-hosted plugin with Kilo's plugin manager:

```sh
kilo plugin git:github.com/obra/superpowers@dev --global
```

Restart Kilo after installation. Superpowers must be installed separately in
Kilo even if it is already installed in another harness. Kilo does not load
OpenCode's `.opencode` configuration directories.

### Local development

Clone this repository, then add the native plugin's absolute file URL to the
`plugin` array in your Kilo config (`~/.config/kilo/kilo.json`, or `kilo.json`
in a test project):

```json
{
  "plugin": ["file:///absolute/path/to/superpowers/.kilo/plugin/superpowers.js"]
}
```

Preserve any existing plugins and other config settings. The file must remain
inside the checkout: it imports the shared implementation and discovers the
skills relative to that implementation. Do not copy just the plugin file.

## Verify

Open a clean Kilo session and send exactly:

```text
Let's make a react todo list
```

A working integration invokes the native `skill` tool to load `brainstorming`
before writing application code. Asking Kilo to use a skill explicitly is not
this acceptance test.

## Behavior

- Skills are discovered through Kilo's `skills.paths` configuration, without
  creating skill symlinks or overwriting your existing skill paths.
- Bootstrap injection is transient: it appends to the existing system context,
  not the persisted user message, without adding another system message.
- Repeated agent steps do not duplicate the bootstrap. Freshly reloaded system
  contexts, including those after compaction, receive it again.
- Task subagents keep access to skills but do not receive the controller
  bootstrap, so they do not restart brainstorming for delegated work.
- The plugin uses Kilo's native `skill`, `todowrite`, `task`, `read`,
  `write`, `edit`, `bash`, `grep`, `glob`, and `webfetch` tool names.
- Kilo 7.8.17 requires runtime source metadata for plugin-owned skill files
  outside the active project. The plugin scopes this to its own installed
  skills directory, preserves existing origins, and leaves other paths and
  permissions unchanged. Kilo still treats files resolving into the active
  project as project-controlled. This uses Kilo's internal `skill_path_origins`
  field; revalidate discovery when upgrading Kilo.

## Troubleshooting

Use `kilo --print-logs --log-level DEBUG` to diagnose plugin loading. Ensure
`KILO_PURE` is not set: it disables external plugins.

If skills are listed but do not trigger automatically, verify that the server
plugin loaded, not just the skill files. The package's `./server` export is the
Kilo entrypoint; its default export contains `{ id, server }`.

For a local installation, check that the checkout still exists at the
configured absolute URL. Restart Kilo after moving or updating it.

## Infrastructure tests

```sh
node --test tests/kilo/test-plugin.mjs
```

These contract tests cover skill registration, bootstrap injection,
idempotence, child-session handling, lookup recovery, empty system contexts, and
isolation from OpenCode's tool mapping. They do not replace the real
clean-session/model acceptance test above.

Exercise the installed CLI without a model or credentials:

```sh
python3 tests/kilo/test-native.py --kilo /absolute/path/to/kilo --output /new/evidence/directory
```

This installs the package through `kilo plugin` into an isolated home, checks
that all repository skills are discoverable, creates real parent/child sessions,
and captures outgoing requests at a loopback endpoint. The endpoint deliberately
returns HTTP 400; it never generates a substitute model response. The test
verifies that only top-level sessions receive the bootstrap and that child
sessions retain skills.

Real clean-session transcripts and model-specific limitations are recorded in
[the acceptance evidence](../tests/kilo/acceptance.md).
