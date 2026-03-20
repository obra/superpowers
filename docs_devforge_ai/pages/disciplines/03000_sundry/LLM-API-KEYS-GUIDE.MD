# LLM API Keys Configuration Guide

## Overview
This guide covers all the API keys needed for the various LLM providers supported by the system.

## Required API Keys

### 1. OpenAI
- **Key**: `OPENAI_API_KEY`
- **Where to get**: https://platform.openai.com/api-keys
- **Format**: `sk-...` (starts with sk-)
- **Optional**: `OPENAI_ORG_ID` (if you're part of an organization)
- **Models**: GPT-4, GPT-3.5, text-embedding-ada-002, etc.
- **Use cases**: Text generation, embeddings, chat completion

### 2. Anthropic Claude
- **Key**: `ANTHROPIC_API_KEY`
- **Where to get**: https://console.anthropic.com/
- **Format**: `sk-ant-...` (starts with sk-ant-)
- **Models**: Claude-3 Haiku, Sonnet, Opus
- **Use cases**: Text generation, summarization, analysis

### 3. Cohere
- **Key**: `COHERE_API_KEY`
- **Where to get**: https://dashboard.cohere.ai/api-keys
- **Format**: Long alphanumeric string
- **Models**: Command, Command-R, Embed models
- **Use cases**: Text generation, embeddings, classification

### 4. Mistral AI
- **Key**: `MISTRAL_API_KEY`
- **Where to get**: https://console.mistral.ai/
- **Format**: Alphanumeric string
- **Models**: Mistral 7B, Mixtral 8x7B, Mistral Large
- **Use cases**: Text generation, code generation

### 5. Hugging Face
- **Key**: `HUGGINGFACE_API_KEY`
- **Where to get**: https://huggingface.co/settings/tokens
- **Format**: `hf_...` (starts with hf_)
- **Models**: Thousands of open-source models
- **Use cases**: Embeddings, text generation, specialized models

## Setting Up API Keys

### For Local Development
Add to your `.env` file (never commit this file):
```bash
# LLM Provider API Keys
OPENAI_API_KEY=sk-your-actual-openai-key
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key
COHERE_API_KEY=your-actual-cohere-key
MISTRAL_API_KEY=your-actual-mistral-key
HUGGINGFACE_API_KEY=hf_your-actual-huggingface-key

# Optional
OPENAI_ORG_ID=org-your-organization-id
```

### For Production (Render)
In your Render dashboard, go to Environment variables and add:

| Key | Value | Notes |
|-----|-------|-------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic Claude key |
| `COHERE_API_KEY` | `...` | Cohere API key |
| `MISTRAL_API_KEY` | `...` | Mistral AI key |
| `HUGGINGFACE_API_KEY` | `hf_...` | Hugging Face token |
| `OPENAI_ORG_ID` | `org-...` | Optional: OpenAI org ID |

## API Key Formats & Validation

### OpenAI
```
✅ Valid: sk-1234567890abcdef1234567890abcdef
❌ Invalid: openai_key_123
```

### Anthropic
```
✅ Valid: sk-ant-api03-1234567890abcdef
❌ Invalid: claude_key_123
```

### Cohere
```
✅ Valid: 1234567890abcdef1234567890abcdef
❌ Invalid: co_key_123
```

### Mistral
```
✅ Valid: 1234567890abcdef1234567890abcdef
❌ Invalid: mistral_key_123
```

### Hugging Face
```
✅ Valid: hf_1234567890abcdef1234567890abcdef
❌ Invalid: huggingface_key_123
```

## Cost Considerations

### Free Tiers Available
- **Hugging Face**: Free tier with rate limits
- **Cohere**: Free trial credits
- **OpenAI**: Free trial credits for new accounts

### Pay-per-use
- **OpenAI**: $0.0015-0.06 per 1K tokens (varies by model)
- **Anthropic**: $0.25-15 per million tokens (varies by model)
- **Cohere**: $0.15-2 per million tokens
- **Mistral**: $0.14-2 per million tokens

### Cost-Effective Options
1. **Hugging Face**: Free local inference (no API costs)
2. **Mistral 7B**: Lower cost option
3. **Claude Haiku**: Fast and cost-effective
4. **GPT-3.5**: Cheaper than GPT-4

## Security Best Practices

### ✅ Do This
- Store API keys in environment variables only
- Use different keys for development/production
- Rotate keys regularly
- Monitor usage and set billing alerts
- Use least-privilege access when available

### ❌ Never Do This
- Commit API keys to version control
- Share API keys in chat/email
- Use production keys in development
- Store keys in client-side code
- Leave unused keys active

## Testing API Keys

Use our test script to verify your keys work:
```bash
node test-anthropic-integration.js
```

Or test individual providers:
```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'

# Test Cohere
curl https://api.cohere.ai/v1/generate \
  -H "Authorization: Bearer $COHERE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"command","prompt":"Hello","max_tokens":10}'
```

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check API key format and validity
2. **429 Rate Limited**: You've exceeded usage limits
3. **403 Forbidden**: Check billing/account status
4. **Invalid Model**: Verify model name is correct

### Debug Steps
1. Verify API key format matches expected pattern
2. Check if key is set in environment variables
3. Test with a simple API call
4. Check account billing status
5. Verify model availability in your region

## Model Recommendations

### For Embeddings
1. **Hugging Face**: `all-MiniLM-L6-v2` (free, local)
2. **OpenAI**: `text-embedding-3-small` (high quality)
3. **Cohere**: `embed-english-v3.0` (good performance)

### For Text Generation
1. **Cost-effective**: Claude Haiku, GPT-3.5-turbo
2. **Balanced**: Claude Sonnet, GPT-4o-mini
3. **High-quality**: Claude Opus, GPT-4

### For Code Generation
1. **Specialized**: GPT-4 (code), Mistral (code)
2. **General**: Claude Sonnet, Command-R

---

*Last updated: July 10, 2025*
*For the latest pricing and model information, check each provider's documentation*
