# Superpowers for Kilo Code

Superpowers loads through Kilo's native server plugin system. The plugin
registers the repository's original skill directory and injects the
`using-superpowers` bootstrap into the system context of a top-level session.
There is no skill copying, `npx skills` wrapper, or per-session opt-in.

## Preview installation

This integration is not yet part of a released Superpowers version. Do not
install a moving development branch as if it were a supported release. For
review or local testing, first obtain and review a checkout containing
`.kilo/plugin/superpowers.js` and `package.json`'s `./server` export. A checkout
of a release without those files is not a Kilo integration.

Tested with Kilo Code CLI 7.8.17, using its native server plugins and
`experimental.chat.system.transform` hook. VS Code was not separately tested.

From that checkout's root, use Kilo's native plugin manager (POSIX shell):

```sh
kilo plugin "file://$PWD" --global
```

This installs the reviewed local package; it does not download an upstream
release or copy skill files. Keep the checkout available at the installed path.
When a release includes this integration, the release installation command
should identify that actual release rather than a development branch.

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
inside the checkout: it discovers the skills relative to its own installed
module. Do not copy just the plugin file.

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
- Source provenance is limited to the installed package's skill directory;
  see the compatibility and trust boundary below.

## Compatibility and trust boundary

The supported, tested host for this preview is Kilo Code CLI **7.8.17**.
Kilo documents `skills.paths` as user/project configuration, but does not
provide a documented plugin API for registering outside-project skill
provenance. The plugin therefore still uses the **private**
`skill_path_origins` field. This is a compatibility exception, not a stable
public API or a claim of support for other Kilo versions.

The exception applies only to `skillsDir` derived from the installed plugin's
module URL. Existing origin entries (including `trusted: false`) are not
upgraded, other skill paths receive no trust, and permissions are not changed.
Installing this JavaScript plugin already means trusting its code; its bundled
Markdown is likewise treated as trusted and can resolve environment/file
substitutions. This is not a sandbox for third-party or project skill content.
Kilo must still downgrade files resolving into the active project to
project-controlled sources.

The native test verifies discovery, parent/child request wiring, and a project
Markdown escape rejection with a benign discovery control. Run it again before
upgrading Kilo; passing unit tests alone does not establish host compatibility.
If the private contract changes, stop using this preview until the integration
has been adapted and revalidated. Do not work around rejection by granting
trust to arbitrary paths or broadening permissions.

References:
- [Kilo skill configuration](https://kilo.ai/docs/customize/skills)
- [Kilo plugin hooks](https://kilo.ai/docs/automate/extending/plugins)
- [Host discovery implementation](https://github.com/Kilo-Org/kilocode/blob/bd0ab67e8b00c8d27d03cbc9d163bdaf20c37213/packages/opencode/src/skill/index.ts#L274-L291)
  corroborates the private field and path-origin policy on that source revision;
  it is not source-level proof of the published 7.8.17 binary. The 7.8.17 claim
  is backed by the native runtime tests instead.

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
