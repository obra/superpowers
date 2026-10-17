# Superpowers for Qoder

Superpowers installs as a native Qoder plugin. Qoder discovers the shared
`skills/` tree and runs a `SessionStart` hook that injects the
`using-superpowers` bootstrap on startup, resume, clear, and compaction.

## Qoder CLI installation

Register this repository as a marketplace, then install the plugin:

```bash
qoder plugins marketplace add obra/superpowers
qoder plugins install superpowers@superpowers-dev
```

Start a fresh Qoder session after installing or updating. For unreleased local
validation, clone the repository, check out `dev`, and install from the checkout
root:

```bash
qoder plugins install /absolute/path/to/superpowers
```

## Qoder IDE installation

Qoder IDE imports plugin ZIP files. From the root of a Superpowers checkout,
create an upload-ready archive:

```bash
git archive --format=zip --prefix=superpowers/ -o superpowers-qoder.zip HEAD
```

In Qoder, open **Extensions → Plugins → Add Plugins → Upload Plugin** and select
`superpowers-qoder.zip`. Start a fresh task after importing or updating it.

## How it works

- `.qoder-plugin/plugin.json` registers the canonical `skills/` tree and the
  Qoder-specific hook configuration.
- `hooks/hooks-qoder.json` runs the shared cross-platform hook dispatcher with
  Qoder's `QODER_PLUGIN_ROOT`.
- `hooks/session-start` emits Qoder's native
  `hookSpecificOutput.additionalContext` response.
- `skills/using-superpowers/references/qoder-tools.md` maps skill actions to
  Qoder's native tools.

No skills are copied, and the integration does not edit user-level Qoder files.

## Verify the installation

```bash
qoder plugins list --json
```

The installed plugin should report 15 skills and one `SessionStart` hook. In a
clean session, send exactly:

```text
Let's make a react todo list
```

A working integration invokes `brainstorming` before writing code.

## Troubleshooting

- Run `qoder plugins validate /absolute/path/to/superpowers --strict` against a
  checkout when diagnosing manifest or hook wiring.
- Confirm the plugin is enabled in `qoder plugins list --json`.
- Restart the session after install, update, enable, disable, or reload.
- On Windows, install Git for Windows so the `bash` hook shell is available.
