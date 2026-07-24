# Releasing to the Codex portal

How to package a Superpowers release as the zip artifact OpenAI's Codex
plugin portal expects, and what to check before handing it over.

This is distinct from the older flow of syncing files into a fork of
`openai/plugins` and opening a PR, which
`scripts/sync-to-codex-plugin.sh` still implements — see the distribution
table in [porting-to-a-new-harness.md](porting-to-a-new-harness.md). The portal
artifact is a standalone, rootless archive: `.codex-plugin/`, `assets/`,
`skills/`, `README.md`, `LICENSE`, and `CODE_OF_CONDUCT.md` sit at the
archive root. Hooks, tests, docs, scripts, and other harnesses' manifests
are deliberately not shipped.

## Prerequisite: the OpenAI metadata source

Each packaged skill must carry `skills/<name>/agents/openai.yaml`. That
metadata is OpenAI-owned — it does not live in this repo — so the packaging
script seeds it from a prior official package. By default it looks for, in
order:

1. `../_tmp/sup-codex-packaging/superpowers/` (an unpacked package)
2. `../_tmp/sup-codex-packaging/superpowers.zip`
3. `../_tmp/sup-codex-packaging/superpowers.tar.gz`

or pass `--metadata-source <dir|.zip|.tar.gz>` explicitly.

If you have no prior package on disk, extract one from `openai/plugins`
(the upstream repo still carries the plugin, including the metadata):

```bash
# from a clone with an `upstream` remote pointing at github.com/openai/plugins
git fetch upstream
mkdir -p ../_tmp/sup-codex-packaging/superpowers
git archive upstream/main -- plugins/superpowers |
  tar -x --strip-components 2 -C ../_tmp/sup-codex-packaging/superpowers
```

**New skills fail the build.** The script requires one `openai.yaml` per
skill directory; otherwise it prints `Missing OpenAI agent metadata for
skill: <name>` for each gap and dies with `metadata source is incomplete`.
If a release adds a skill, there is no metadata for it yet;
you need an updated official package (or metadata added upstream in
`openai/plugins`) before you can package. Don't hand-invent the yaml.

## Build the archive

From a clean working tree, package the release tag:

```bash
scripts/package-codex-plugin.sh --ref vX.X.X
```

The script reads the version from `.codex-plugin/plugin.json` (bumped by
`scripts/bump-version.sh`, so it matches the release tag), stages the tree
from the git ref — never from the working copy — and writes
`../_tmp/sup-codex-packaging/superpowers-VERSION.zip`, printing entry
count, skill count, and a SHA-256. Timestamps and file order are pinned so
rebuilding the same ref reproduces the same archive.

Useful flags: `--output PATH`, `--format zip|tar.gz`, `--allow-dirty`
(archive still comes from `--ref`), `--keep-stage` (inspect the staging
dir). `--help` has the full list.

## Verify

The script already refuses archives containing source-only paths and
mismatched metadata counts. Sanity-check the result anyway:

```bash
unzip -Z1 ../_tmp/sup-codex-packaging/superpowers-X.X.X.zip | head
unzip -Z1 ../_tmp/sup-codex-packaging/superpowers-X.X.X.zip | grep -c 'agents/openai.yaml'
unzip -p  ../_tmp/sup-codex-packaging/superpowers-X.X.X.zip .codex-plugin/plugin.json | jq -r .version
```

Expect: rootless top-level entries (`.codex-plugin/`, `assets/`,
`skills/`), one `openai.yaml` per skill, and the release version.

The script itself is covered by `tests/codex/test-package-codex-plugin.sh`.

## Upload

Upload the zip through OpenAI's Codex plugin portal. This is a manual step
outside this repo; record the SHA-256 the script printed so the uploaded
artifact can be matched to the build.
