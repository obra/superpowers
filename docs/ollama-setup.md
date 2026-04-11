# Using Superpowers with Ollama (Local AI Models)

This guide explains how to configure your coding agent to use Ollama's local models instead of external AI providers, while still benefiting from Superpowers' workflow skills.

## Overview

Superpowers is **provider-agnostic** — it doesn't connect to any AI model directly. It only provides behavioral instructions to whatever agent is running it. This means you can use Superpowers with Ollama by configuring your **host agent** to use Ollama instead of cloud models.

## Prerequisites

### 1. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com)

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows (PowerShell)
irm https://ollama.com/install.sh | iex
```

### 2. Pull a Model

Choose a model suitable for your hardware:

```bash
# For code generation (recommended)
ollama pull codellama:7b

# More capable models (requires more VRAM)
ollama pull llama3.1:8b
ollama pull qwen2.5-coder:7b
ollama pull deepseek-coder:6.7b

# For powerful local reasoning (requires 16GB+ VRAM)
ollama pull llama3.1:70b
ollama pull qwen2.5-coder:32b
```

Verify the model is available:

```bash
ollama list
```

---

## Platform-Specific Configuration

### OpenCode (Recommended for Ollama)

OpenCode has native support for Ollama through its OpenAI-compatible API.

#### Step 1: Start Ollama

```bash
ollama serve
```

The API will be available at `http://localhost:11434`

#### Step 2: Configure OpenCode

In your OpenCode configuration, set the model provider to use Ollama:

```json
{
  "provider": "openai",
  "baseUrl": "http://localhost:11434/v1",
  "model": "codellama:7b",
  "apiKey": "ollama"
}
```

**Note:** The `apiKey` can be any value (Ollama doesn't require authentication). The model name should match the output of `ollama list`.

#### Step 3: Install Superpowers

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

Superpowers skills will automatically inject their workflow instructions into your Ollama-powered sessions.

---

### Codex

Codex can use Ollama via the OpenAI-compatible endpoint.

#### Step 1: Start Ollama

```bash
ollama serve
```

#### Step 2: Set Environment Variables

```bash
# Point Codex to Ollama instead of OpenAI
export OPENAI_API_BASE="http://localhost:11434/v1"
export OPENAI_API_KEY="ollama"

# On Windows (PowerShell):
$env:OPENAI_API_BASE = "http://localhost:11434/v1"
$env:OPENAI_API_KEY = "ollama"
```

#### Step 3: Install Superpowers

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

---

### Cursor

Cursor supports Ollama through its model configuration settings.

#### Step 1: Start Ollama

```bash
ollama serve
```

#### Step 2: Configure Cursor

1. Open Cursor Settings → AI → Models
2. Add a custom model with these settings:
   - **Model Name:** `codellama:7b` (or your preferred model)
   - **API Base URL:** `http://localhost:11434/v1`
   - **API Key:** `ollama` (any value works)
3. Set it as the default model for Agent mode

#### Step 3: Install Superpowers

In Cursor Agent chat:

```text
/add-plugin superpowers
```

---

### Claude Code

Claude Code currently only supports Anthropic's models. Ollama integration is **not directly supported** at this time. You need to use a proxy layer like [LiteLLM](https://github.com/BerriAI/litellm) to route Claude Code requests to Ollama.

**Using LiteLLM Proxy:**

1. Install LiteLLM:
```bash
pip install litellm
```

2. Start the proxy pointing to Ollama:
```bash
litellm --model ollama/codellama:7b --port 4000
```

3. Set environment for Claude Code:
```bash
export ANTHROPIC_BASE_URL="http://localhost:4000"
export ANTHROPIC_API_KEY="ollama"
```

4. Then install Superpowers as normal.

---

### Gemini CLI

Gemini CLI currently only supports Google's Gemini models. Ollama integration is **not directly supported** at this time. You need to use a proxy layer like [LiteLLM](https://github.com/BerriAI/litellm).

**Using LiteLLM Proxy:**

1. Install LiteLLM:
```bash
pip install litellm
```

2. Start the proxy with Gemini-compatible model:
```bash
litellm --model ollama/gemma:7b --port 4000
```

3. Point Gemini CLI to the proxy (check Gemini CLI documentation for custom endpoint support).

**Alternative:** If Gemini CLI doesn't support custom endpoints, you cannot use it with Ollama directly. Consider using OpenCode or Codex instead — both have native Ollama support.

---

## Model Recommendations for Superpowers Workflows

Superpowers' skills require strong reasoning capabilities. Here are tested model recommendations:

| Use Case | Model | VRAM Required | Notes |
|----------|-------|---------------|-------|
| Code generation | `codellama:7b` | ~4GB | Fast, good for simple tasks |
| Code generation | `qwen2.5-coder:7b` | ~4GB | Better code quality |
| Code generation | `deepseek-coder:6.7b` | ~4GB | Strong coding abilities |
| General reasoning | `llama3.1:8b` | ~8GB | Good all-rounder |
| Complex planning | `qwen2.5-coder:32b` | ~16GB | Best for Superpowers workflows |
| Complex reasoning | `llama3.1:70b` | ~40GB | Powerful but resource-heavy |

**Minimum recommendation:** 7B+ parameter model with at least 4GB VRAM for basic tasks. For full Superpowers workflows (brainstorming, planning, subagent-driven development), use a 32B+ model if your hardware supports it.

---

## Testing Your Setup

### 1. Verify Ollama is Running

```bash
ollama list
ollama ps  # Shows currently loaded models
```

### 2. Test a Simple Request

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "codellama:7b",
  "prompt": "Hello, world!",
  "stream": false
}'
```

### 3. Start a Superpowers Session

Start your coding agent and try a simple task. The Superpowers skills should automatically trigger the brainstorming workflow.

Example prompt:

```
I want to add a dark mode toggle to my app
```

Your agent should respond with the Superpowers workflow (asking clarifying questions, not jumping straight into code).

---

## Troubleshooting

### "Connection refused" on `http://localhost:11434`

Ollama is not running. Start it with:

```bash
ollama serve
```

### Model not found

Ensure the model is pulled and available:

```bash
ollama list
```

If not listed, pull it:

```bash
ollama pull codellama:7b
```

### Slow responses

Local models require significant compute. Consider:
- Using a smaller model (7B instead of 32B)
- Enabling GPU acceleration in Ollama (if available)
- Increasing Ollama's context window if hitting limits

### Skills not triggering

Superpowers skills are provider-agnostic. If skills aren't triggering, it's not an Ollama issue — check that Superpowers is properly installed for your platform.

### Platform doesn't support custom endpoints

Claude Code and Gemini CLI don't natively support custom API endpoints. Use [LiteLLM Proxy](docs/ollama/litellm-proxy.md) as a bridge.

---

## Limitations

- **No streaming proxy:** Ollama's API is OpenAI-compatible, but some platforms may have issues with streaming or tool calling
- **Model quality:** Local models may not match cloud model quality for complex reasoning tasks
- **Context window:** Local models typically have smaller context windows (4K-8K tokens vs 128K+ for cloud models)
- **Speed:** Local inference is significantly slower than cloud API calls

---

## Additional Resources

- [Ollama Documentation](https://ollama.com/docs)
- [Ollama OpenAI-Compatible API](https://ollama.com/blog/openai-compatibility)
- [LiteLLM Proxy (for unsupported platforms)](https://github.com/BerriAI/litellm)
