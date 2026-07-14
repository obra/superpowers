---
description: Build & deliver a hosted app for a HyperData hub (claim a workshop order, or build direct)
---
# ACE × HyperData — Hosted App

Develop a single-file HTML app for a HyperData hub as an external builder:
claim an App-Workshop build order, or build one directly on request.

## Usage

```
/ace:hyperdata-app
```

This command invokes the `ace-hyperdata-app` skill.

## Prerequisites (one-time)

```bash
pip install "hyperdata-client @ git+https://github.com/hyper-instrument/hyper-data.git#subdirectory=client"
hd connect http://<your-hub>:8021 --token <PAT>   # PAT: workshop:build + hosted-apps:write
hd agent init --ide codex                           # official skills + MCP snippet
```

## Typical session

```bash
hd workshop list                    # anything to claim?
hd workshop claim                   # take one order + read the requirement
# ... probe real data, build app.html, validate, submit ...
```

## Invocation

```
Skill("ace-hyperdata-app")
```
