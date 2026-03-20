# Render Environment Variables Setup

## Required Environment Variables for Production

Add these environment variables in your Render dashboard under **Environment** tab:

### Core Application
```
NODE_ENV=production
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### LLM Provider API Keys
```
# Primary providers (choose based on your needs)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
COHERE_API_KEY=your-cohere-key
MISTRAL_API_KEY=your-mistral-key
HUGGINGFACE_API_KEY=hf_your-huggingface-key

# Optional
OPENAI_ORG_ID=org-your-organization-id
```

### Optional Services
```
FLOWISE_URL=your-flowise-instance-url
FLOWISE_API_KEY=your-flowise-api-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_REDIRECT_URI=https://your-domain.com/pages/0175-auth-callback/0175-auth-callback.html
```

## Priority Setup Order

### 1. Essential (Required for basic functionality)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. AI Features (Choose at least one)
- `ANTHROPIC_API_KEY` (recommended - cost effective)
- `HUGGINGFACE_API_KEY` (free tier available)
- `OPENAI_API_KEY` (if you have quota)
- `COHERE_API_KEY` (good embeddings)
- `MISTRAL_API_KEY` (cost effective)

### 3. Optional Enhancements
- `FLOWISE_URL` + `FLOWISE_API_KEY` (if using Flowise)
- `GOOGLE_CLIENT_ID` + `GOOGLE_REDIRECT_URI` (OAuth)

## Cost-Effective Recommendations

### Free/Low Cost Setup
1. **Hugging Face**: Free embeddings (local processing)
2. **Anthropic Claude Haiku**: Cost-effective text generation
3. **Cohere**: Free trial + competitive pricing

### Balanced Setup
1. **Anthropic Claude Sonnet**: Better quality
2. **OpenAI GPT-3.5**: Familiar models
3. **Hugging Face**: Free embeddings

### High Performance Setup
1. **Anthropic Claude Opus**: Highest quality
2. **OpenAI GPT-4**: Advanced reasoning
3. **Cohere**: High-quality embeddings

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit API keys to your repository
- Use different keys for development vs production
- Monitor usage and set billing alerts
- Rotate keys regularly
- Only add keys you actually plan to use

## Testing Your Setup

After adding environment variables to Render:

1. **Deploy your application**
2. **Check logs** for any missing environment variable errors
3. **Test document upload** to verify AI processing works
4. **Monitor costs** in your provider dashboards

## Current System Behavior

Based on your current configuration:
- ✅ **Hugging Face embeddings**: Working (local, no API costs)
- ⚠️ **OpenAI**: Quota exceeded (falls back to simulation)
- ✅ **Fallback systems**: Working correctly
- ✅ **Document processing**: Continues successfully

The system is designed to gracefully handle missing API keys and quota limits, so you can add providers incrementally as needed.

---

*Setup guide for Render deployment*
*Last updated: July 10, 2025*
