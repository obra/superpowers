# LangExtract Local Development Setup Guide

This guide explains how to set up and run the LangExtract service locally for development and testing.

## Prerequisites

1. **Python 3.9+** installed
2. **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)
3. **pip** package manager

## Setup Steps

### 1. Navigate to LangExtract Directory

```bash
cd deep-agents
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `deep-agents` directory:

```bash
# LangExtract Configuration
LANGEXTRACT_API_KEY=your-gemini-api-key-here
# Optional: Change port (default: 8000)
LANGEXTRACT_PORT=8000
```

### 4. Start the LangExtract Service

```bash
python3 langextract_server.py
```

### 5. Verify the Service is Running

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","langextract_installed":true,"service":"LangExtract API","version":"1.0.0"}
```

### 6. Test the Extraction API

```bash
curl -X POST http://localhost:8000/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"This is a test document about construction project.","document_type":"correspondence"}'
```

## Configure Main App to Use Local LangExtract

### Option A: Set Environment Variable

Add to your `.env.dev` or `.env` file:

```bash
LANGEXTRACT_API_URL=http://localhost:8000
```

### Option B: Default Fallback

The main app will automatically use `http://localhost:8000` if `LANGEXTRACT_API_URL` is not set.

## Troubleshooting

### "Cannot connect to LangExtract API"

1. **Check if service is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check if correct port:**
   - Default port is 8000
   - Verify no firewall blocking the connection

3. **Restart the service:**
   ```bash
   # Kill existing process
   pkill -f langextract_server.py
   
   # Start fresh
   python3 langextract_server.py
   ```

### "LANGEXTRACT_API_KEY not found"

1. Verify your `.env` file in `deep-agents/` directory
2. Ensure the API key is valid
3. Restart the LangExtract service after adding the key

### CORS Errors

If you see CORS errors in the browser console:

1. Ensure CORS is enabled in `langextract_server.py`
2. Add your development origin to the allowed origins list

## Production Deployment

For production, deploy LangExtract as a separate service:

1. **Render.com Deployment:**
   - Follow the guide: `docs/deployment/RENDER_MULTI_CUSTOMER_DEPLOYMENT_GUIDE.md`
   - Set `LANGEXTRACT_API_URL` in main app environment variables

2. **Environment Configuration:**
   ```bash
   LANGEXTRACT_API_URL=https://your-customer-langextract.onrender.com
   ```

## Integration with HITL Workflows

When LangExtract is properly configured:

1. Open a HITL task in the My Tasks dashboard
2. The **"LangExtract Structured Data"** section will display:
   - Extracted entities (dates, organizations, amounts, etc.)
   - Document structure visualization
   - Key metadata from the document

3. If LangExtract is unavailable, you'll see:
   - Fallback message with troubleshooting guidance
   - No impact on other HITL functionality

## Current Status

| Status | Description |
|--------|-------------|
| ✅ Local Dev | Requires manual setup of Python service |
| ✅ Cloud | Deploy to Render.com |
| ⚠️ Unavailable | Service not running or misconfigured |

## Related Documentation

- [LangExtract README](../../deep-agents/LANGEXTRACT_README.md)
- [Render Deployment Guide](../../deep-agents/RENDER_DEPLOYMENT_GUIDE.md)
- [LangExtract Integration Procedure](00435_LANGEXTRACT_INTEGRATION_PROCEDURE.md)
- [HITL Workflow Procedure](0000_WORKFLOW_HITL_PROCEDURE.md)
