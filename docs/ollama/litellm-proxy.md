# LiteLLM Proxy Configuration for Ollama

LiteLLM acts as a bridge between coding agents that expect specific APIs (OpenAI, Anthropic, Gemini) and Ollama's local models.

## Quick Setup

### 1. Install LiteLLM

```bash
pip install litellm
```

### 2. Start Ollama

```bash
ollama serve
```

### 3. Start LiteLLM Proxy

For OpenAI-compatible API (Codex, OpenCode, Cursor):
```bash
litellm --model ollama/codellama:7b --port 4000
```

For Anthropic-compatible API (Claude Code via proxy):
```bash
litellm --model ollama/codellama:7b --port 4000
```

### 4. Configure Your Platform

| Platform | Environment Variables |
|----------|----------------------|
| **Codex** | `OPENAI_API_BASE=http://localhost:4000`<br>`OPENAI_API_KEY=ollama` |
| **OpenCode** | `baseUrl: "http://localhost:4000/v1"`<br>`apiKey: "ollama"` |
| **Claude Code** | `ANTHROPIC_BASE_URL=http://localhost:4000`<br>`ANTHROPIC_API_KEY=ollama` |
| **Cursor** | API URL: `http://localhost:4000/v1`<br>API Key: `ollama` |

## Advanced Configuration

### config.yaml for LiteLLM

Create a `litellm-config.yaml` file:

```yaml
model_list:
  - model_name: "superpowers-model"
    litellm_params:
      model: "ollama/codellama:7b"
      api_base: "http://localhost:11434"

  - model_name: "superpowers-coder"
    litellm_params:
      model: "ollama/qwen2.5-coder:32b"
      api_base: "http://localhost:11434"

  - model_name: "superpowers-reasoner"
    litellm_params:
      model: "ollama/llama3.1:70b"
      api_base: "http://localhost:11434"
```

Start with config:
```bash
litellm --config litellm-config.yaml --port 4000
```

### Multiple Models

You can configure LiteLLM to route different tasks to different models:

```yaml
model_list:
  - model_name: "fast"
    litellm_params:
      model: "ollama/codellama:7b"
      api_base: "http://localhost:11434"

  - model_name: "smart"
    litellm_params:
      model: "ollama/qwen2.5-coder:32b"
      api_base: "http://localhost:11434"
```

Then in your platform config, use:
- `fast` for quick responses
- `smart` for complex reasoning

## Troubleshooting

### "Connection refused"
- Ensure Ollama is running: `ollama serve`
- Ensure LiteLLM is running: `curl http://localhost:4000/health`

### "Model not found"
- Check model name format: `ollama/modelname:tag`
- Verify model is pulled: `ollama list`

### Slow responses
- LiteLLM adds minimal overhead
- Slowness is from Ollama inference — use a smaller model or GPU acceleration

## Related

- [LiteLLM Documentation](https://docs.litellm.ai/)
- [Ollama Setup Guide](./ollama-setup.md)
