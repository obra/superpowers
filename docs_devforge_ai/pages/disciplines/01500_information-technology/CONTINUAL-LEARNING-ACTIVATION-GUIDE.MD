# Continual Learning System Activation Guide

## Overview
This guide covers the final steps to activate your continual learning system with real credentials and test the complete pipeline.

## Step 1: Add Real API Tokens to GitHub Secrets

### Required Secrets

Navigate to: `https://github.com/Construct-AI-primary/construct_ai/settings/secrets/actions`

#### 1. Hugging Face Token
```
Name: HUGGINGFACE_API_TOKEN
Value: [Get from https://huggingface.co/settings/tokens]
- Create a new token with "Write" permissions
- Copy the token value
```

#### 2. RunPod API Key
```
Name: RUNPOD_API_KEY
Value: [Get from RunPod Dashboard → Account → API Keys]
- Copy your RunPod API key
```

#### 3. RunPod Serverless URL
```
Name: RUNPOD_SERVERLESS_URL
Value: https://api.runpod.ai/v2/h0otc3cc5z59co
- This is your deployed endpoint URL
```

#### 4. Supabase Keys (Already Added)
```
SUPABASE_URL: ✅ Already configured
SUPABASE_SERVICE_ROLE_KEY: ✅ Already configured
```

## Step 2: Test with Actual Training Data

### Manual Test Run

1. **Go to GitHub Actions:**
   - Navigate to your repository → Actions tab
   - Select "Continual Learning Pipeline" workflow

2. **Trigger Manual Test:**
   - Click "Run workflow"
   - Select "force_training: true"
   - Click "Run workflow"

3. **Monitor the Test:**
   - Watch the workflow execution
   - Check each step:
     - ✅ Data export from Supabase
     - ✅ Training data upload
     - ✅ RunPod serverless training start
     - ✅ Model upload to Hugging Face

### Expected Test Results

**Success Indicators:**
- Workflow completes without errors
- Training data exported (>50 samples)
- RunPod job starts successfully
- Model uploaded to `construct-ai/deep-agents`

**Timeline:** ~10-15 minutes for test run

## Step 3: Monitor First Automated Training Run

### When It Runs
- **Next Sunday** at 2:00 AM UTC (weekly schedule)
- Or manually trigger anytime for testing

### Monitoring Steps

1. **Pre-Run Check (Saturday):**
   - Verify HITL data has accumulated
   - Check Supabase `ai_training_data` table
   - Ensure >50 pending training samples

2. **During Run (Sunday 2 AM UTC):**
   - GitHub Actions will automatically start
   - Monitor progress in Actions tab
   - Check RunPod dashboard for GPU usage

3. **Post-Run Validation:**
   - Verify model uploaded to Hugging Face
   - Check training data marked as "completed"
   - Review workflow logs for any issues

### Performance Metrics to Track

| Metric | Target | How to Check |
|--------|--------|--------------|
| Training Data Samples | >50 | Supabase query |
| Training Duration | <2 hours | RunPod logs |
| Model Upload | Success | Hugging Face repo |
| Cost | <$10/week | RunPod billing |

## Step 4: Production Monitoring Setup

### Weekly Health Checks

**Every Sunday after training:**
```bash
# Check training data status
curl -H "Authorization: Bearer $SUPABASE_KEY" \
     "$SUPABASE_URL/rest/v1/ai_training_data?status=eq.completed&select=count"

# Verify model updates
curl https://huggingface.co/api/models/construct-ai/deep-agents
```

### Alert Setup

**Slack/Discord Webhook (Optional):**
- Add `SLACK_WEBHOOK_URL` to GitHub secrets
- Get notified of training success/failure

**Email Alerts:**
- GitHub Actions can send emails on workflow failure
- Configure in repository settings

## Step 5: Optimization & Scaling

### After First Few Runs

1. **Adjust Training Parameters:**
   - Modify `runpod-serverless/config.py`
   - Tune learning rate, batch size, epochs

2. **Data Quality Improvements:**
   - Review HITL correction patterns
   - Adjust quality thresholds in workflow

3. **Cost Optimization:**
   - Monitor GPU usage vs. training time
   - Consider A6000 GPUs if RTX 4090 overkill

## Troubleshooting Common Issues

### Training Fails to Start
**Symptoms:** Workflow shows "training data insufficient"
**Solution:** Manually trigger with `force_training: true`

### GPU Not Available
**Symptoms:** RunPod job fails with GPU error
**Solution:** Try different GPU type (A6000) or wait for availability

### Model Upload Fails
**Symptoms:** Training completes but Hugging Face upload fails
**Solution:** Check `HUGGINGFACE_API_TOKEN` permissions

### High Costs
**Symptoms:** Training runs too long or too frequently
**Solution:** Reduce training steps or increase quality threshold

## Success Metrics

### Week 1 Goals
- ✅ System deploys successfully
- ✅ First automated training completes
- ✅ Model uploaded to Hugging Face
- ✅ Cost stays under $10

### Month 1 Goals
- 📈 15-25% accuracy improvement
- 📊 Consistent weekly training runs
- 💰 Cost optimization achieved
- 🔄 Full automation working

## Emergency Stop

**If something goes wrong:**
1. Disable GitHub Actions workflow
2. Check RunPod costs
3. Review error logs
4. Re-enable with fixes

## Support

**For issues:**
- Check GitHub Actions logs first
- Review RunPod endpoint logs
- Verify API keys and permissions
- Contact support if needed

---

**🎯 Your continual learning system is now ready for activation! Follow these steps to go live with automated AI improvement.**