# Ollama Local AI Setup

Guide users through setting up Ollama for local AI model usage with Superpowers workflows.

## When to Use This Skill

Activate when:
- User asks about using local AI models
- User mentions Ollama, LM Studio, or local inference
- User wants offline/privacy-preserving AI capabilities
- User asks about reducing API costs

## Setup Flow

### 1. Assess User's Situation

Ask these questions:
1. Do you already have Ollama installed? (`ollama --version`)
2. What's your GPU situation? (integrated, dedicated, CPU-only)
3. How much VRAM/RAM is available?

### 2. Install Ollama

If not installed, guide them through:

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://ollama.com/install.sh | iex
```

### 3. Choose and Pull a Model

Based on their hardware, recommend a model:

| Hardware | Model | Command |
|----------|-------|---------|
| 4GB+ VRAM | CodeLlama 7B | `ollama pull codellama:7b` |
| 4GB+ VRAM | Qwen2.5-Coder 7B | `ollama pull qwen2.5-coder:7b` |
| 8GB+ VRAM | Llama 3.1 8B | `ollama pull llama3.1:8b` |
| 16GB+ VRAM | Qwen2.5-Coder 32B | `ollama pull qwen2.5-coder:32b` |
| CPU-only | Phi3 mini | `ollama pull phi3:mini` |

**Important:** For Superpowers workflows (brainstorming, planning, subagent-driven development), recommend at least a 7B model. Smaller models may struggle with multi-step reasoning.

### 4. Configure the Host Platform

Guide them through the platform-specific configuration. Reference the full guide at `docs/ollama-setup.md` for detailed steps.

**OpenCode** (best Ollama support):
- Set `baseUrl` to `http://localhost:11434/v1`
- Set `model` to their pulled model name
- Set `apiKey` to any value (e.g., "ollama")

**Codex:**
- Set `OPENAI_API_BASE=http://localhost:11434/v1`
- Set `OPENAI_API_KEY=ollama`

**Cursor:**
- Add custom model in Settings → AI → Models
- Set API URL to `http://localhost:11434/v1`
- Set API key to any value

**Claude Code:**
- Not natively supported (Anthropic-only)
- Suggest using LiteLLM proxy as workaround

### 5. Verify the Setup

Have them test:

```bash
# Check Ollama is running
ollama list

# Test the API
curl http://localhost:11434/api/generate -d '{
  "model": "codellama:7b",
  "prompt": "Say hello",
  "stream": false
}'
```

Then start a coding session and verify Superpowers skills trigger correctly.

### 6. Troubleshoot Common Issues

**"Connection refused"** → Ollama not running. Start with `ollama serve`.

**Slow responses** → Normal for local inference. Suggest smaller model or GPU acceleration.

**Poor reasoning quality** → Upgrade to a larger model (32B+ if hardware allows).

**Context window too small** → Some models have 4K context. Suggest models with 8K+ context for Superpowers workflows.

**Skills not triggering** → Not an Ollama issue. Check Superpowers installation for their platform.

## Important Notes

- Superpowers is **provider-agnostic** — it works with ANY model through the host agent
- Ollama provides the model; Superpowers provides the workflow
- Local models are significantly slower than cloud APIs — set expectations accordingly
- Quality varies by model — recommend testing multiple models for their use case
- No API keys needed for Ollama (local, no authentication)

## Reference

Full documentation with detailed platform configuration: `docs/ollama-setup.md`
