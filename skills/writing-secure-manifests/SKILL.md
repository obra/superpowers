---
name: writing-secure-manifests
description: Use when writing or editing a Dockerfile, Containerfile, Kubernetes manifest (Deployment/Pod/StatefulSet/DaemonSet/Job/CronJob), Helm chart template, or docker-compose/compose file - applies secure-by-default container settings (non-root user, securityContext, dropped capabilities, read-only root filesystem, pinned base image) so Aikido SAST/IaC findings like "Container running as root" are never introduced. Also use when remediating such a finding.
---

# Writing Secure Manifests

## Overview

Aikido flags two kinds of issue: dependency issues (reactive — you remediate
them) and **code/manifest issues you author yourself** (preventable). This skill
covers the second kind for container manifests. The flagship finding is
**"Container running as root,"** but it travels with a small family of
container-hardening findings that are all fixed the same way.

**Core principle: prevent, don't catch.** Apply the secure defaults below as you
write the manifest, so there is nothing for a scan to flag later. This is not a
review step — it is how the manifest gets written in the first place.

When you touch a container spec that is missing these controls, **add them** —
do not match the insecure surrounding style.

## The secure-default checklist

Apply every applicable control. Each lists the insecure pattern, the secure
rewrite, and the Aikido finding it prevents.

### 1. Run as non-root → prevents "Container running as root"

A container running as root gives an attacker who compromises the workload root
inside the container, easing escalation and lateral movement.

**Dockerfile** — create and switch to a non-root user (numeric UID so k8s
`runAsNonRoot` can verify it):

```dockerfile
RUN addgroup --system --gid 10001 app \
 && adduser --system --uid 10001 --ingroup app app
USER 10001
```

**Kubernetes** — set it on the pod and container `securityContext`:

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
  containers:
    - name: app
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
```

### 2. No privilege escalation → prevents privilege-escalation findings

```yaml
      securityContext:
        allowPrivilegeEscalation: false
        privileged: false
```

### 3. Drop all capabilities → prevents "excessive Linux capabilities"

Drop everything, add back only the specific capabilities the workload proves it
needs (rare — most don't).

```yaml
      securityContext:
        capabilities:
          drop: ["ALL"]
```

### 4. Read-only root filesystem → prevents "writable container filesystem"

```yaml
      securityContext:
        readOnlyRootFilesystem: true
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

Mount writable `emptyDir` volumes only for paths the app genuinely writes to.

### 5. No host namespaces or hostPath → prevents host-exposure findings

```yaml
spec:
  hostNetwork: false
  hostPID: false
  hostIPC: false
  # do not use hostPath volumes
```

### 6. Set resource limits (defense in depth)

```yaml
      resources:
        limits:
          cpu: "500m"
          memory: "256Mi"
        requests:
          cpu: "100m"
          memory: "128Mi"
```

### 7. Pin the base image → prevents "unpinned/mutable base image"

Never `:latest`. Use a specific tag, preferably with a digest:

```dockerfile
FROM node:22.11.0-bookworm-slim@sha256:<digest>
```

## A complete secure container spec (k8s)

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    fsGroup: 10001
  containers:
    - name: app
      image: registry.example.com/app:1.4.2@sha256:<digest>
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        allowPrivilegeEscalation: false
        privileged: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        limits: { cpu: "500m", memory: "256Mi" }
        requests: { cpu: "100m", memory: "128Mi" }
      volumeMounts:
        - { name: tmp, mountPath: /tmp }
  volumes:
    - { name: tmp, emptyDir: {} }
```

## Red Flags

| Thought | Reality |
|---|---|
| "It's just an internal service, root is fine" | Internal services are exactly where lateral movement starts. Run non-root. |
| "The base image already runs as a user" | Verify it. Most official images default to root unless you set `USER`. Set it explicitly. |
| "I'll add securityContext later / in review" | Later is how the finding ships. Add it as you write the spec. |
| "readOnlyRootFilesystem will break the app" | Mount an `emptyDir` for the specific writable paths instead of leaving the whole FS writable. |
| "The surrounding manifests don't set this" | Don't inherit insecure style. Add the controls to what you touch. |
| "`:latest` is easier" | It is unpinned and flagged. Pin a tag, ideally with a digest. |
| "Dropping ALL capabilities is risky" | Start from ALL-dropped and add back only the proven-needed ones. Default deny. |
