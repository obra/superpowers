# Installing Superpowers for oh-my-pi (omp)

## Prerequisite

OMP must already be installed. This integration was verified with omp 16.5.2.
This records the tested environment, not a minimum version or compatibility
floor.

## Install from git

Use omp's native plugin installer:

```bash
omp plugin install github:obra/superpowers
```

omp marketplace installation does not load `omp.extensions` modules and
therefore is not the native installation path for this integration. Use the Git
install above instead.

## Local development

Link an absolute path to your checkout:

```bash
omp plugin link /absolute/path/to/superpowers
```

After installing or linking, restart OMP or start a new session.

## Verify

Confirm that omp registered the plugin:

```bash
omp plugin list --json
```

(`omp plugin list` is also available for human-readable output.)

Then start a clean session and send this exact prompt:

> Let's make a react todo list

The Superpowers bootstrap should load, and `brainstorming` should auto-trigger
before any code is written.

If registration or startup fails, inspect omp diagnostics under `~/.omp/logs/`.

## Remove

```bash
omp plugin uninstall superpowers
```
