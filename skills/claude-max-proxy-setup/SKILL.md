---
name: claude-max-proxy-setup
description: Use when an agent or developer wants to reduce Claude API costs, route requests through a Claude Max or Pro subscription instead of per-token billing, or set up claude-max-api-proxy for OpenClaw or any OpenAI-compatible client
---

# Claude Max Proxy Setup

## Overview

> **Community tool** — `claude-max-api-proxy` is a third-party tool, not officially supported by Anthropic. Use at your own discretion.

The [claude-max-api-proxy](https://docs.openclaw.ai/providers/claude-max-api-proxy) routes API requests through your Claude Max or Pro subscription instead of billing per token. Agents running on OpenClaw or any OpenAI-compatible client can eliminate variable API costs.

**Core principle:** Run the proxy where Claude Code CLI is authenticated → point your agent at it → zero additional API charges.

## Prerequisites

- Claude Max ($200/mo) or Claude Pro ($20/mo) subscription
- Claude Code CLI installed and authenticated on the same machine
- Agent using an OpenAI-compatible API client (OpenClaw, LiteLLM, etc.)

Verify CLI is ready:

```bash
claude --version
```

## Installation

```bash
npm install -g claude-max-api-proxy
```

Start the proxy (default port 3456):

```bash
claude-max-api
```

For persistent operation (systemd example):

```ini
# /etc/systemd/system/claude-max-proxy.service
[Unit]
Description=Claude Max API Proxy
After=network.target

[Service]
ExecStart=/usr/local/bin/claude-max-api
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now claude-max-proxy
```

## OpenClaw Configuration

Update your OpenClaw agent config (`~/.openclaw/config.json5`):

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

For remote servers, use an SSH tunnel:

```bash
ssh -L 3456:localhost:3456 user@your-server
```

## Verification

```bash
curl http://localhost:3456/v1/models \
  -H "Authorization: Bearer not-needed"
```

## Quick Reference

| Model | Proxy model ID |
|-------|----------------|
| Claude Opus 4 | `openai/claude-opus-4` |
| Claude Sonnet 4 | `openai/claude-sonnet-4` |
| Claude Haiku 4 | `openai/claude-haiku-4` |

## Common Mistakes

### Wrong package name

- **Problem:** `npm install -g @anthropic-ai/claude-max-api-proxy` returns 404
- **Fix:** The package is `claude-max-api-proxy` (no scope prefix)

### Wrong start command

- **Problem:** `claude-max-api-proxy` not found after install
- **Fix:** The binary is `claude-max-api` (no `-proxy` suffix)

### Proxy not running when agent starts

- **Problem:** Agent throws connection refused errors, not a silent fallback
- **Fix:** Add proxy health check to startup: `curl -sf http://localhost:3456/v1/models || exit 1`

### Wrong config location

- **Problem:** Config change has no effect
- **Fix:** Set via `env` block in config, not agent-level model override alone

## Red Flags

**Never:**
- Start agent without verifying proxy is running first
- Mix direct `api.anthropic.com` calls with proxy calls in the same agent
- Share proxy access across untrusted networks without a reverse proxy + auth layer

**Always:**
- Confirm zero API charges appear in Anthropic console after switching
- Restart proxy after Claude Code CLI re-authentication
