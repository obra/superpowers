# OpenCode Configuration for Ollama

This directory contains example configuration for using OpenCode with Ollama local models.

## Quick Setup

### 1. Start Ollama

```bash
ollama serve
```

### 2. Pull a Model

```bash
ollama pull codellama:7b
```

### 3. Configure OpenCode

Add this to your OpenCode configuration file (usually `~/.config/opencode/config.json`):

```json
{
  "providers": {
    "ollama": {
      "type": "openai",
      "baseUrl": "http://localhost:11434/v1",
      "model": "codellama:7b",
      "apiKey": "ollama"
    }
  },
  "defaultProvider": "ollama"
}
```

### 4. Install Superpowers

Point OpenCode to the Superpowers install instructions:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

## Full Example Configuration

```json
{
  "providers": {
    "ollama-codellama": {
      "type": "openai",
      "baseUrl": "http://localhost:11434/v1",
      "model": "codellama:7b",
      "apiKey": "ollama",
      "contextWindow": 4096
    },
    "ollama-llama3": {
      "type": "openai",
      "baseUrl": "http://localhost:11434/v1",
      "model": "llama3.1:8b",
      "apiKey": "ollama",
      "contextWindow": 8192
    },
    "ollama-qwen-coder": {
      "type": "openai",
      "baseUrl": "http://localhost:11434/v1",
      "model": "qwen2.5-coder:32b",
      "apiKey": "ollama",
      "contextWindow": 32768
    }
  },
  "defaultProvider": "ollama-qwen-coder"
}
```

## Model Recommendations

| Model | Context | VRAM | Best For |
|-------|---------|------|----------|
| `codellama:7b` | 4K | ~4GB | Basic code generation |
| `llama3.1:8b` | 8K | ~8GB | General reasoning |
| `qwen2.5-coder:7b` | 32K | ~4GB | Code with longer context |
| `qwen2.5-coder:32b` | 32K | ~16GB | Complex Superpowers workflows |

## Troubleshooting

### "Provider not found"

Ensure Ollama is running: `ollama serve`

### "Model not found"

List available models: `ollama list`

If empty, pull a model: `ollama pull codellama:7b`

### Connection errors

Verify Ollama API is reachable:

```bash
curl http://localhost:11434/api/tags
```

Should return a list of available models.
