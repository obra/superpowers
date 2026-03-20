# 🚀 Phase 2: Controlled Testing - Manual Workflow Trigger Guide

## 🎯 Phase 2 Objective
Execute the continual learning workflow manually with controlled parameters to identify root causes without risking production failures.

## 📋 Pre-Phase 2 Checklist
- [x] Phase 1 completed - permissions fixed
- [x] Code committed and pushed to repository
- [ ] GitHub repository accessible
- [ ] Required secrets configured in GitHub

## 🖱️ Manual Workflow Trigger Instructions

### **Step 1: Access GitHub Actions**
1. Go to your GitHub repository
2. Click on the **"Actions"** tab
3. Find **"Continual Learning Pipeline"** in the workflows list

### **Step 2: Manual Trigger**
1. Click the **"Run workflow"** button (dropdown on the right)
2. Select **"main"** branch (or your current branch)
3. **IMPORTANT**: Set these parameters:
   ```
   force_training: true
   ```
4. Click **"Run workflow"**

### **Step 3: Monitor Execution**
1. Click on the running workflow job
2. Watch the **"check-training-data"** job first
3. Monitor logs in real-time

---

## 📊 Expected Phase 2 Results

### **✅ SUCCESS Indicators (check-training-data job)**

**Expected Log Output:**
```
📦 Installing dependencies for continual learning pipeline
📊 Current timestamp: 2026-01-22 XX:XX:XX
📡 Fetching training data from Supabase...
📊 Training data count: 0
🎯 Average quality score: 0.5
📋 Data quality threshold: 0.8
✅ Force training enabled for testing
has_sufficient_data=true
data_quality_score=0.5
📝 Data check completed successfully
```

**What this means:**
- ✅ Script permissions working (no "Permission denied")
- ✅ Supabase secrets configured correctly
- ✅ Force training bypass working
- ✅ Workflow can proceed to next jobs

### **❌ FAILURE Indicators**

#### **Permission Error (Should be Fixed)**
```
Permission denied: scripts/export_training_data.py
```
**Status:** Should NOT occur after Phase 1 fixes

#### **Secrets Missing**
```
curl: (22) The requested URL returned error: 401
```
**Action:** Check GitHub repository secrets configuration

#### **Supabase Connection Failed**
```
Failed to connect to database
```
**Action:** Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

---

## 🔍 Phase 2 Monitoring Guide

### **Job Execution Order**

1. **check-training-data** (5-10 minutes)
   - Installs Node.js dependencies
   - Queries Supabase for training data
   - Calculates quality scores
   - Sets output variables for next jobs

2. **runpod-training** (15-30 minutes)
   - Prepares training data from Supabase
   - Calls RunPod serverless endpoint
   - Receives training job confirmation

3. **correspondence-training** (45-90 minutes)
   - Matrix job: runs for each of 17 specialists
   - Downloads and processes specialist data
   - Trains models on RunPod
   - Validates and registers models

### **Key Monitoring Points**

#### **📊 Data Pipeline Check**
Watch for these lines in check-training-data:
```
📊 Training data count: [number]
🎯 Average quality score: [number]
✅ Force training enabled for testing
```

#### **🚀 Training Job Submission**
Watch for these lines in runpod-training:
```
📡 Endpoint: https://api.runpod.ai/v2/[endpoint]/runsync
📄 Response Body: {"status": "success", "id": "xxxxx"}
✅ Training job started successfully
```

#### **🏗️ Matrix Job Progress**
Watch for these patterns in correspondence-training:
```
🏃‍♂️ Running training script for [specialist]
✅ Training completed successfully for [specialist]
✅ Model validation passed for [specialist]
✅ Model activated successfully for [specialist]
```

---

## 🎯 Phase 2 Success Criteria

### **Minimum Success (Data Pipeline Working)**
- ✅ check-training-data job completes without permission errors
- ✅ Force training parameter works
- ✅ Output variables set correctly
- ✅ Workflow proceeds to runpod-training job

### **Good Success (API Connectivity Working)**
- ✅ RunPod endpoint responds (even with auth errors)
- ✅ Training data export works
- ✅ Basic API connectivity established

### **Full Success (Training Pipeline Working)**
- ✅ At least one specialist training completes
- ✅ Model validation passes
- ✅ Model registration succeeds

---

## 🚨 Common Phase 2 Issues & Solutions

### **Issue 1: Workflow Doesn't Start**
**Symptom:** Manual trigger doesn't create a workflow run
**Check:**
- Repository has Actions enabled
- Branch protection rules not blocking
- Workflow file committed to correct branch

### **Issue 2: Permission Errors Still Occur**
**Symptom:** "Permission denied" in logs
**Check:**
- Phase 1 changes were committed and pushed
- Scripts have execute permissions in repository
- GitHub is using the updated workflow file

### **Issue 3: Secrets Not Found**
**Symptom:** Empty or undefined secret values
**Check:**
- Secrets are configured at repository level (not environment)
- Secret names match exactly: `SUPABASE_SERVICE_ROLE_KEY`, etc.
- No typos in secret names

### **Issue 4: Supabase Connection Fails**
**Symptom:** HTTP 401 or connection timeout
**Check:**
- `SUPABASE_URL` format: `https://xxxxx.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- Supabase project is active and accessible

### **Issue 5: RunPod API Errors**
**Symptom:** HTTP 401/403 from RunPod
**Check:**
- `RUNPOD_API_KEY` is correct and active
- `RUNPOD_SERVERLESS_URL` format is valid
- RunPod account has credits and endpoint exists

---

## 📞 Phase 2 Troubleshooting Commands

### **Test Supabase Connection Locally**
```bash
# Test with your actual values
curl -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
     -H "apikey: YOUR_SUPABASE_KEY" \
     "YOUR_SUPABASE_URL/rest/v1/ai_training_data?select=id&limit=1"
```

### **Test RunPod Connection Locally**
```bash
# Test with your actual values
curl -X POST YOUR_RUNPOD_URL \
     -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"input": {"test": "connection"}}'
```

### **Check Script Permissions**
```bash
# In repository directory
ls -la scripts/export_training_data.py
# Should show: -rwxr-xr-x
```

---

## 📈 Phase 2 Expected Timeline

| Time | Activity | Expected Status |
|------|----------|-----------------|
| 0-2 min | Workflow trigger | Job appears in Actions tab |
| 2-7 min | check-training-data | Job completes or shows clear error |
| 7-15 min | runpod-training | API call succeeds/fails clearly |
| 15-60 min | correspondence-training | First specialist job status visible |
| 60-120 min | Full completion | All jobs finished with clear results |

---

## 🎯 Phase 2 Decision Points

### **After check-training-data Completes:**

**✅ SUCCESS Path:**
- No permission errors
- Data check completes (even with 0 records)
- Proceeds to runpod-training
- **→ Continue to monitor runpod-training**

**❌ FAILURE Path:**
- Permission errors persist
- Secret configuration issues
- **→ Stop and fix issues before proceeding**

### **After runpod-training Completes:**

**✅ SUCCESS Path:**
- RunPod API responds (even with auth issues)
- Training job submitted
- Proceeds to correspondence-training
- **→ Continue to monitor matrix jobs**

**❌ FAILURE Path:**
- Complete API failure (network/dns issues)
- Endpoint not found
- **→ Fix API configuration before matrix testing**

### **After First Matrix Job:**

**✅ SUCCESS Path:**
- At least one specialist training completes
- Model validation works
- Model registration succeeds
- **→ Scale to full matrix testing**

**❌ FAILURE Path:**
- All matrix jobs fail with same error
- Systemic issues (GPU, data, auth)
- **→ Fix root cause before full deployment**

---

## 📊 Phase 2 Deliverables

### **Immediate Outputs:**
- Workflow execution logs with clear error patterns
- Identification of failing component (data/api/training)
- Specific error messages for targeted fixes

### **Decision Framework:**
- ✅ **Data Pipeline Working** → API connectivity is likely the issue
- ✅ **API Connectivity Working** → Training pipeline needs attention
- ✅ **Single Training Working** → Scale to full matrix
- ❌ **Systemic Failures** → Address root cause before proceeding

### **Next Phase Preparation:**
- Clear identification of root cause
- Specific fix required
- Confidence in resolution approach
- Ready for Phase 3 (single specialist) or Phase 4 (full matrix)

---

## 🎉 Phase 2 Completion Criteria

**Phase 2 is successful when you can answer:**

1. ✅ **Do permission errors still occur?** (Should be NO after Phase 1)
2. 🔍 **What is the primary failure point?** (Data/API/Training)
3. 🔍 **Are API connections working?** (Supabase/RunPod/HuggingFace)
4. 🔍 **Does the training pipeline execute?** (At least one job)
5. 📋 **What specific error messages appear?** (For targeted fixes)

**With this information, you'll know exactly what to fix for Phase 3!** 🚀