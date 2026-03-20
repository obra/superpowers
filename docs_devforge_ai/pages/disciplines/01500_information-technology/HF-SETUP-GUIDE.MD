# 🔐 Hugging Face Account Setup Guide

## Essential Checks Before Fine-Tuning

---

## 📋 **Account Requirements Checklist**

### **1. Account Status**
- ✅ **Account Created**: https://huggingface.co/join
- ✅ **Email Verified**: Check inbox for verification email
- ✅ **Profile Complete**: Add name, organization, location

### **2. Model Access Permissions**
- ✅ **Qwen/Qwen2.5-7B-Instruct Access**: Model requires explicit approval
- ⚠️ **Gated Repository**: QWEN models are behind access controls

### **3. API Token Setup**
- ✅ **Token Generated**: For programmatic access
- ✅ **Token Permissions**: Read + Write access
- ✅ **Token Secure**: Never share publicly

---

## 🔍 **Step-by-Step Account Verification**

### **Step 1: Verify Account Access**

1. **Go to Hugging Face**: https://huggingface.co/
2. **Sign In**: Use your account credentials
3. **Check Profile**: Click your profile picture → Settings

### **Step 2: Check QWEN Model Access**

**IMPORTANT**: QWEN models require explicit approval before you can download them.

#### **Method A: Direct Model Check**
```
1. Visit: https://huggingface.co/Qwen/Qwen2.5-7B-Instruct
2. If you see "This model has access restrictions":
   - Click "Request access" button
   - Fill out the access request form
   - Wait for approval (usually 1-2 business days)
3. If you see "Use this model":
   - ✅ You have access - proceed
```

#### **Method B: API Token Test**
```python
# Test your access programmatically
from huggingface_hub import HfApi
import os

# Set your token
os.environ['HF_TOKEN'] = 'your_token_here'  # Replace with actual token

# Test access
api = HfApi()
try:
    # This will fail if you don't have access
    model_info = api.model_info("Qwen/Qwen2.5-7B-Instruct")
    print("✅ Access confirmed!")
    print(f"Model size: {model_info.safetensors.total_size / 1024**3:.1f} GB")
except Exception as e:
    print(f"❌ Access denied: {e}")
    print("Request access at: https://huggingface.co/Qwen/Qwen2.5-7B-Instruct")
```

### **Step 3: Generate/Verify API Token**

#### **Create New Token** (if needed)
```
1. Go to: https://huggingface.co/settings/tokens
2. Click: "New token"
3. Name: "construct-ai-training"
4. Role: "Write" (allows model uploads)
5. Click: "Generate token"
6. ⚠️ COPY AND SAVE THE TOKEN - You won't see it again!
```

#### **Verify Token Permissions**
```python
# Test token permissions
from huggingface_hub import HfApi

# Replace with your actual token
HF_TOKEN = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

api = HfApi(token=HF_TOKEN)

# Test read access
try:
    models = api.list_models(author="Qwen", limit=5)
    print("✅ Read access confirmed")
except Exception as e:
    print(f"❌ Read access failed: {e}")

# Test write access (creates a test repo)
try:
    api.create_repo("test-access-check", repo_type="model", private=True)
    api.delete_repo("test-access-check", repo_type="model")
    print("✅ Write access confirmed")
except Exception as e:
    print(f"❌ Write access failed: {e}")
```

---

## 🚨 **Common Access Issues & Solutions**

### **Issue 1: "Repository Not Found"**
```
Error: Repository 'Qwen/Qwen2.5-7B-Instruct' not found
```
**Solutions:**
- ✅ Request access to the model
- ✅ Wait for approval email
- ✅ Check your internet connection

### **Issue 2: "Authentication Failed"**
```
Error: Authentication failed. Please check your token
```
**Solutions:**
- ✅ Regenerate token with "Write" permissions
- ✅ Check token format (should start with "hf_")
- ✅ Verify token wasn't truncated when copying

### **Issue 3: "Rate Limited"**
```
Error: Rate limit exceeded
```
**Solutions:**
- ✅ Wait 1 hour before retrying
- ✅ Use different network/IP
- ✅ Contact Hugging Face support if persistent

---

## 📁 **Repository Setup for Model Storage**

### **Create Model Repositories**

After training, you'll need to store your fine-tuned models:

#### **1. Training Data Repository**
```python
from huggingface_hub import create_repo

# Create private repo for training data
create_repo(
    repo_id="your-username/construct-training-data",
    repo_type="dataset",
    private=True,
    description="Training data for Construct AI fine-tuning"
)
```

#### **2. Model Repository**
```python
# Create private repo for trained models
create_repo(
    repo_id="your-username/construct-ai-contracts-adapter",
    repo_type="model",
    private=True,
    description="Fine-tuned QWEN adapter for contracts post-award analysis"
)
```

### **Repository Structure**
```
your-username/
├── construct-training-data/          # Dataset repo
│   ├── 00435_contracts_post_award_training_pairs.json
│   ├── validation_report.json
│   └── quality_report.md
│
└── construct-ai-contracts-adapter/    # Model repo
    ├── adapter_model.bin
    ├── adapter_config.json
    ├── tokenizer.json
    └── README.md
```

---

## 🔐 **Security Best Practices**

### **Token Management**
```bash
# Never commit tokens to code
# Use environment variables instead
export HF_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Or create .env file (add to .gitignore)
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Repository Privacy**
- ✅ **Private Repositories**: Keep training data and models private
- ✅ **Access Control**: Only share with authorized team members
- ✅ **Audit Logs**: Regular review of repository access

---

## 🧪 **Test Your Setup**

### **Complete Readiness Test**
```python
# Run this in RunPod to verify everything works
import os
from huggingface_hub import HfApi, login
from transformers import AutoTokenizer

# 1. Test login
login(os.environ.get('HF_TOKEN'))
print("✅ Hugging Face login successful")

# 2. Test model access
api = HfApi()
model_info = api.model_info("Qwen/Qwen2.5-7B-Instruct")
print(f"✅ Model access confirmed: {model_info.id}")

# 3. Test tokenizer download (quick test)
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-7B-Instruct", token=os.environ.get('HF_TOKEN'))
print("✅ Tokenizer download successful")

# 4. Test repository creation
test_repo = f"test-setup-{int(time.time())}"
api.create_repo(test_repo, repo_type="model", private=True)
api.delete_repo(test_repo, repo_type="model")
print("✅ Repository creation/deletion successful")

print("\\n🎉 All Hugging Face setup tests passed!")
print("Ready to start fine-tuning!")
```

---

## 🚨 **Pre-Flight Checklist**

Before starting training, verify:

- [ ] **Account active** and email verified
- [ ] **QWEN model access** approved (or requested)
- [ ] **API token** generated with write permissions
- [ ] **Token tested** with the verification script above
- [ ] **Repositories created** for data and model storage
- [ ] **Environment variables** set in RunPod
- [ ] **Test script** runs without errors

---

## 📞 **Getting Help**

### **If Access Request is Delayed**
```
1. Check spam folder for approval email
2. Contact: support@huggingface.co
3. Mention: "QWEN model access request for research"
```

### **If Token Issues Persist**
```
1. Delete old tokens
2. Create new token with "Write" role
3. Test immediately after creation
4. Use incognito/private browser if needed
```

### **Emergency Access (Not Recommended)**
```python
# Use alternative model for testing (if QWEN access delayed)
# Less optimal but works immediately
model_name = "microsoft/DialoGPT-medium"  # Public model
# Note: Performance will be lower
```

---

## 🎯 **Success Indicators**

**Your HF account is ready when:**
- ✅ QWEN model page shows "Use this model" (not "Request access")
- ✅ API token test script runs without authentication errors
- ✅ Repository creation/deletion works
- ✅ Model download starts immediately (no permission prompts)

**Time Estimate**: 5-15 minutes to verify existing setup

---

**🔐 Secure your Hugging Face account - it's the gateway to AI training!**