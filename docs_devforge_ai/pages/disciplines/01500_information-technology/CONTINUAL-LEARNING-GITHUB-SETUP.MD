# Continual Learning GitHub Setup Guide

## Overview
This guide explains how to configure GitHub secrets for the automated continual learning pipeline.

## Required Secrets

Add these secrets to your GitHub repository settings for the continual learning workflow to function:

### Core Required Secrets

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `RUNPOD_API_KEY` | RunPod API key for GPU training | RunPod Dashboard → Account → API Keys |
| `RUNPOD_SERVERLESS_URL` | RunPod serverless endpoint URL | RunPod Dashboard → Serverless → Your endpoint |
| `HUGGINGFACE_API_TOKEN` | Hugging Face API token | Hugging Face → Settings → Access Tokens |

### Optional Secrets (for enhanced functionality)

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Slack → Apps → Incoming Webhooks |
| `RENDER_DEPLOY_HOOK_STAGING` | Render staging deploy hook | Render Dashboard → Service → Settings |

## How to Add GitHub Secrets

### Step-by-Step Instructions

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/Construct-AI-primary/construct_ai`

2. **Access repository settings**
   - Click on the "Settings" tab
   - Scroll down to "Security" section in the left sidebar
   - Click on "Secrets and variables"
   - Click on "Actions"

3. **Add each secret**
   - Click the "New repository secret" button
   - Enter the secret name (exactly as shown above)
   - Paste the secret value
   - Click "Add secret"

### Example: Adding SUPABASE_URL

```
Name: SUPABASE_URL
Value: https://mseizswoiwyewsidknta.supabase.co
```

### Example: Adding SUPABASE_SERVICE_ROLE_KEY

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZWl6c3dvaXd5ZXdzaWRrbnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTM1MTA2MCwiZXhwIjoyMDQwOTI3MDYwfQ.7UmcdZK07uYAFowRg8E_dM0xfbYTF8D7RojBFMdDfe0
```

## Verifying Setup

After adding all secrets:

1. **Trigger a manual workflow run**
   - Go to GitHub Actions tab
   - Select "Continual Learning Pipeline" workflow
   - Click "Run workflow"
   - Choose "force_training: true" to test with minimal data

2. **Check workflow logs**
   - Monitor the workflow execution
   - Verify that secrets are accessible (no "secret not found" errors)
   - Confirm data export and training job initiation

## Security Best Practices

- **Never commit secrets to code** - Always use GitHub secrets
- **Rotate keys regularly** - Update secrets when keys are compromised or expired
- **Limit secret scope** - Only give necessary permissions to each service
- **Monitor usage** - Check GitHub Actions logs for any secret exposure

## Troubleshooting

### Common Issues

**"Secret not found" error:**
- Verify the secret name matches exactly (case-sensitive)
- Ensure you're adding secrets to the correct repository

**"Invalid API key" error:**
- Double-check the API key value was copied correctly
- Verify the key hasn't expired
- Confirm the key has necessary permissions

**Workflow doesn't trigger:**
- Check that the workflow file is in `.github/workflows/continual-learning.yml`
- Verify the cron schedule or manual trigger configuration

## Next Steps

Once secrets are configured:

1. **Test the pipeline** with a manual run
2. **Monitor weekly executions** (Sundays 2 AM UTC)
3. **Review training results** and adjust parameters as needed
4. **Set up monitoring** for production performance

## Support

For issues with secret configuration:
- Check GitHub Actions documentation: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Review workflow logs for specific error messages
- Verify all required secrets are present and valid