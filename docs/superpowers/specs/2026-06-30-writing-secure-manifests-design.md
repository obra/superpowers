# Design: `writing-secure-manifests` skill

**Date:** 2026-06-30
**Status:** Approved (pending spec review)
**Branch:** acn-aikido

## Problem

Aikido surfaces two distinct classes of security issue:

1. **Dependency issues (SCA / EOL / malware / license).** Reactive — they appear
   when an upstream package gains a vulnerability. They cannot be authored away;
   they must be remediated (upgrade, patch, ignore-with-justification).
2. **Code/manifest issues (SAST / IaC).** Introduced by code or manifests we
   write ourselves. The flagship example is **"Container running as root"**, but
   it belongs to a tight family of container-hardening findings that are all
   fixed the same way. These are **preventable at authoring time**: if the
   manifest is written with secure defaults from the start, Aikido never flags it.

This spec addresses **class 2, container manifests only**. When Claude authors or
edits a container/orchestration manifest, it should apply secure-by-default
settings up front so the finding is never introduced.

Out of scope: class 1 (dependency remediation), Terraform/cloud IaC, and any
change to the official `aikido` plugin (it lives in the plugin cache and would be
clobbered on update — behavior changes belong in `vmlpowers`).

## Approach

A new **model-driven authoring skill** in `vmlpowers`:
`skills/writing-secure-manifests/SKILL.md`.

Chosen over a PostToolUse hook (rejected: too heavy, deterministic-but-brittle to
wire) and over augmenting the review agent (rejected: catches rather than
prevents). Skills self-activate by description match under the vmlpowers
"if there's a 1% chance a skill applies, invoke it" rule, so a keyword-rich
description is the activation mechanism — no registry edit, hook, or agent change
is required. Dropping the `SKILL.md` into `skills/` is sufficient for discovery.

## Trigger / activation

The skill description must self-activate when authoring or modifying any of:

- `Dockerfile`, `Containerfile`
- Kubernetes workload manifests: Deployment, Pod, StatefulSet, DaemonSet, Job,
  CronJob, ReplicaSet
- Helm chart templates (`templates/*.yaml`)
- `docker-compose.yml` / `compose.yaml`

The description references the matching Aikido SAST/IaC finding names (e.g.
"Container running as root") so the skill is recognizable both when *writing* a
manifest and when *acting on* such a finding.

## Content — secure-default checklist

Each item states: the insecure pattern, the secure rewrite (copy-pasteable
snippet for both Dockerfile and k8s where applicable), and the Aikido finding it
prevents.

| Control | Secure setting | Prevents |
|---|---|---|
| Run as non-root | Dockerfile non-root `USER` (numeric UID); k8s `securityContext.runAsNonRoot: true` + `runAsUser` | **Container running as root** |
| No privilege escalation | `allowPrivilegeEscalation: false`, `privileged: false` | Privileged container / privilege escalation |
| Drop capabilities | `capabilities.drop: ["ALL"]` (add back only what's needed) | Excessive Linux capabilities |
| Read-only root FS | `readOnlyRootFilesystem: true` + writable `emptyDir` mounts where needed | Writable container filesystem |
| No host namespaces | `hostNetwork/hostPID/hostIPC: false`, no `hostPath` volumes | Host namespace / hostPath exposure |
| Resource limits | `resources.limits` set (cpu/memory) | Resource-exhaustion (defense in depth) |
| Pinned base image | Digest or specific tag, never `:latest` | Unpinned / mutable base image |

The skill also includes a rule for **editing existing manifests**: if you touch a
container spec that lacks these controls, add them rather than matching the
insecure surrounding style.

## Structure

Single file: `skills/writing-secure-manifests/SKILL.md`, matching house style of
the existing skills:

- YAML frontmatter (`name`, keyword-rich `description`)
- Overview (one paragraph: prevent, don't catch)
- The secure-default checklist with snippets, grouped Dockerfile vs k8s
- A red-flags table ("This is just an internal service" → still runs as root, etc.)

No agent, hook, `plugin.json`, or `marketplace.json` changes.

## Non-goals

- No verification/scan step — defers to the existing `aikido:scan` flow and CI.
- No Terraform/cloud IaC coverage.
- No dependency (SCA) handling.
- No changes to the official `aikido` plugin.

## Success criteria

- Writing a fresh Dockerfile or k8s Deployment via Claude yields a manifest that
  runs as non-root with the hardening controls above, with no "Container running
  as root" finding on a subsequent Aikido scan.
- Editing an existing insecure manifest adds the missing controls rather than
  preserving the insecure pattern.
