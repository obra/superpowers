# 🚀 RunPod Setup Guide for QWEN Fine-Tuning

## Step-by-Step Guide to Launch Your First AI Training Pod

---

## 📋 **Prerequisites Checklist**

- ✅ **RunPod Account**: Created at https://runpod.io
- ✅ **Payment Method**: Added to RunPod account
- ✅ **Training Data**: Generated locally (4,200 pairs ready)
- ✅ **Scripts**: Fine-tuning scripts prepared locally

---

## 🎯 **Step 1: Launch Your GPU Pod**

### **1.1 Access RunPod Dashboard**
```
1. Go to https://runpod.io/console/pods
2. Click "Deploy" (green button)
3. Select "RTX A6000" from GPU options
```

### **1.2 Configure Pod Settings**
```yaml
# Pod Configuration:
Name: construct-ai-qwen-training
Template: RunPod Pytorch 2.1 (Ubuntu 22.04)
GPU Type: RTX A6000 (48GB VRAM)
GPU Count: 1
Storage: 100GB (NVMe)
Container Disk: 50GB

# Cost Estimate: ~$2-3/hour
```

### **1.3 Deploy the Pod**
```
1. Click "Deploy on-demand"
2. Wait 2-3 minutes for pod to initialize
3. Pod status will change to "Running"
```

---

## 🔧 **Step 2: Connect to Your Pod**

### **2.1 Open Terminal Connection**
```bash
# Click "Connect" button on your pod
# Select "Connect to Jupyter Lab" or "Start SSH"
# Copy the connection URL
```

### **2.2 Alternative: Direct SSH Connection**
```bash
# From RunPod dashboard, get SSH command:
ssh -i ~/.ssh/id_rsa root@123.456.78.90 -p 12345

# Or use the web terminal in RunPod dashboard
```

---

## 📦 **Step 3: Upload Training Data & Scripts**

### **3.1 Create Project Directory**
```bash
# In your RunPod terminal:
cd /workspace
mkdir construct-ai-training
cd construct-ai-training
mkdir scripts data models
```

### **3.2 Upload Files from Local Machine**

#### **Option A: Using RunPod File Manager**
```
1. In RunPod dashboard, click "Files" tab
2. Upload these files from your local machine:
   - scripts/fine_tune_qwen.py
   - scripts/data_generator.py
   - scripts/quality_validator.py
   - data/00435_contracts_post_award_training_pairs.json
   - config/procedure_specs.json
```

#### **Option B: Using SCP (Command Line)**
```bash
# From your local machine terminal:
scp -i ~/.ssh/id_rsa scripts/fine_tune_qwen.py root@YOUR_POD_IP:/workspace/construct-ai-training/scripts/
scp -i ~/.ssh/id_rsa data/00435_contracts_post_award_training_pairs.json root@YOUR_POD_IP:/workspace/construct-ai-training/data/
scp -i ~/.ssh/id_rsa config/procedure_specs.json root@YOUR_POD_IP:/workspace/construct-ai-training/config/
```

#### **Option C: Using Hugging Face (Recommended)**
```python
# In RunPod Jupyter notebook - upload to HF first:
from huggingface_hub import upload_file, create_repo

# Create HF repo
create_repo("your-username/construct-training-data", repo_type="dataset", private=True)

# Upload files
upload_file("data/00435_contracts_post_award_training_pairs.json",
           "contracts_data.json",
           repo_id="your-username/construct-training-data")

# Then download in RunPod:
from huggingface_hub import hf_hub_download
hf_hub_download(repo_id="your-username/construct-training-data",
               filename="contracts_data.json",
               local_dir="data/")
```

---

## 🔧 **Step 4: Install Dependencies**

### **4.1 Update System & Install Base Packages**
```bash
# Update system
apt update && apt upgrade -y

# Install Python dependencies
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install ML packages
pip install transformers peft datasets trl accelerate bitsandbytes
pip install huggingface_hub scipy
```

### **4.2 Install Unsloth (Recommended for Speed)**
```bash
pip install unsloth[colab]@git+https://github.com/unslothai/unsloth.git
```

### **4.3 Verify GPU Setup**
```python
# Create a test script
python -c "
import torch
print(f'CUDA available: {torch.cuda.is_available()}')
print(f'GPU count: {torch.cuda.device_count()}')
if torch.cuda.is_available():
    print(f'GPU name: {torch.cuda.get_device_name(0)}')
    print(f'GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
"
```

---

## 🚀 **Step 5: Execute Fine-Tuning**

### **5.1 Create Fine-Tuning Script**
```python
# In RunPod Jupyter notebook - create fine_tune_notebook.py:

import os
import torch
from unsloth import FastLanguageModel
from datasets import Dataset
from trl import SFTTrainer
from transformers import TrainingArguments
import json

print("🚀 Starting QWEN Fine-Tuning for Contracts Post-Award")
print("=" * 60)

# Step 1: Load Training Data
print("📚 Loading training data...")
with open('data/00435_contracts_post_award_training_pairs.json', 'r') as f:
    training_data = json.load(f)

dataset = Dataset.from_list(training_data[:4200])  # Use all 4200 pairs
print(f"✅ Loaded {len(dataset)} training examples")

# Step 2: Load QWEN Model
print("🤖 Loading QWEN 2.5-7B model...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-7B-Instruct",
    max_seq_length=2048,
    dtype=None,
    load_in_4bit=True,
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                   "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
    use_rslora=False,
    loftq_config=None,
)

print(f"✅ Model loaded. Trainable parameters: {model.num_parameters(only_trainable=True):,}")

# Step 3: Format Dataset
def format_instruction(example):
    if example.get('input', '').strip():
        text = f"### Instruction:\n{example['instruction']}\n\n### Input:\n{example['input']}\n\n### Response:\n{example['output']}"
    else:
        text = f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"
    return {"text": text}

dataset = dataset.map(format_instruction)
dataset = dataset.train_test_split(test_size=0.05, seed=42)
train_dataset = dataset['train']
val_dataset = dataset['test']

print(f"📊 Training: {len(train_dataset)} examples")
print(f"📊 Validation: {len(val_dataset)} examples")

# Step 4: Training Configuration
training_args = TrainingArguments(
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    warmup_steps=5,
    max_steps=120,  # ~4-6 hours training
    learning_rate=2e-4,
    fp16=not torch.cuda.is_bf16_supported(),
    bf16=torch.cuda.is_bf16_supported(),
    logging_steps=10,
    optim="adamw_8bit",
    weight_decay=0.01,
    lr_scheduler_type="linear",
    seed=3407,
    output_dir="outputs_contracts",
    report_to="none",
    save_strategy="steps",
    save_steps=30,
    save_total_limit=3,
    evaluation_strategy="steps",
    eval_steps=30,
)

# Step 5: Initialize Trainer
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    dataset_text_field="text",
    max_seq_length=2048,
    dataset_num_proc=2,
    packing=False,
    args=training_args,
)

# Step 6: Train the Model
print("🎯 Starting fine-tuning...")
trainer_stats = trainer.train()

print(f"✅ Training completed in {trainer_stats.metrics['train_runtime']:.2f} seconds")
print(f"📈 Final loss: {trainer_stats.metrics.get('train_loss', 'N/A')}")

# Step 7: Save Model
print("💾 Saving LoRA adapter...")
model.save_pretrained("lora_contracts_post_award")
tokenizer.save_pretrained("lora_contracts_post_award")

print("🎉 Fine-tuning complete!")
print("📁 Model saved to: lora_contracts_post_award/")
```

### **5.2 Run the Training**
```python
# Execute the training script
%run fine_tune_notebook.py
```

---

## 📊 **Step 6: Monitor Training Progress**

### **6.1 Watch Training Logs**
```python
# Training will show progress like:
# Step 10/120: loss=2.34, learning_rate=1.85e-04
# Step 20/120: loss=1.87, learning_rate=1.70e-04
# ...
```

### **6.2 Expected Training Time**
```
- RTX A6000: ~4-6 hours for 4,200 training pairs
- Loading model: 5-10 minutes
- Training: 3-5 hours
- Saving: 5 minutes
```

### **6.3 Monitor GPU Usage**
```python
# Check GPU memory usage during training
!nvidia-smi
```

---

## 📁 **Step 7: Download Trained Model**

### **7.1 Compress Model Files**
```bash
# In RunPod terminal:
cd /workspace/construct-ai-training
tar -czf lora_contracts_post_award.tar.gz lora_contracts_post_award/
```

### **7.2 Download via RunPod Dashboard**
```
1. Go to your pod's "Files" tab
2. Right-click "lora_contracts_post_award.tar.gz"
3. Select "Download"
```

### **7.3 Upload to Hugging Face**
```python
# In RunPod notebook:
from huggingface_hub import upload_folder, create_repo

# Create model repo
create_repo("your-username/construct-ai-contracts-adapter", repo_type="model")

# Upload model
upload_folder(
    folder_path="lora_contracts_post_award",
    repo_id="your-username/construct-ai-contracts-adapter"
)

print("✅ Model uploaded to Hugging Face!")
```

---

## 🧪 **Step 8: Test the Trained Model**

### **8.1 Quick Inference Test**
```python
# In RunPod notebook:
from unsloth import FastLanguageModel

# Load trained model
model, tokenizer = FastLanguageModel.from_pretrained("lora_contracts_post_award")

FastLanguageModel.for_inference(model)

# Test prompt
test_prompt = """### Instruction:
Analyze this variation request for additional concrete

### Input:
Subject: Variation Request - VI-001
Dear Engineer,
Our records show that 45m³ was poured but contract allows 35m³ due to unforeseen ground conditions.
Please approve variation VI-001 for the additional 10m³ at R2,500 per m³.

### Response:
"""

inputs = tokenizer([test_prompt], return_tensors="pt").to("cuda")

outputs = model.generate(
    **inputs,
    max_new_tokens=300,
    temperature=0.7,
    top_p=0.9,
    use_cache=True
)

response = tokenizer.batch_decode(outputs)[0]
print("🤖 AI Response:")
print(response.split("### Response:")[-1].strip())
```

---

## 🛑 **Step 9: Stop Your Pod (Save Money!)**

### **9.1 Stop the Pod**
```bash
# In RunPod dashboard:
1. Go to your pod
2. Click "Stop" (not terminate - this preserves files)
3. Pod status: "Stopped" (no cost when stopped)
```

### **9.2 Resume Later**
```bash
# When ready to continue:
1. Click "Start" on stopped pod
2. Wait 1-2 minutes for restart
3. All files are preserved
```

---

## 💰 **Cost Tracking**

### **Estimated Costs**
```
- Pod Running: $2-3/hour
- 6 hours training = $12-18
- Storage: $0.10/GB/month
- Total: ~$15-20 for first discipline
```

### **Cost Saving Tips**
```
✅ Stop pod when not actively training
✅ Use spot instances if available
✅ Train multiple disciplines in one session
✅ Delete pod after downloading model
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **CUDA Out of Memory**
```python
# Reduce batch size
training_args = TrainingArguments(
    per_device_train_batch_size=1,  # Reduce from 2
    gradient_accumulation_steps=8,  # Increase from 4
    # ... other args
)
```

#### **Training Stuck**
```python
# Check GPU usage
!nvidia-smi

# Kill stuck processes
!pkill -f python
```

#### **Connection Lost**
```bash
# Training will auto-save checkpoints
# Resume from last checkpoint
trainer.train(resume_from_checkpoint="outputs_contracts/checkpoint-90")
```

---

## 🎯 **Success Checklist**

- ✅ **Pod Launched**: RTX A6000 running
- ✅ **Data Uploaded**: 4,200 training pairs loaded
- ✅ **Dependencies Installed**: All packages ready
- ✅ **Training Started**: Loss decreasing over time
- ✅ **Model Saved**: LoRA adapter created
- ✅ **Files Downloaded**: Model saved locally
- ✅ **Pod Stopped**: Costs minimized

---

## 📞 **Next Steps After Training**

1. **Integrate Model**: Use `scripts/integrate_simulation.py`
2. **Test Simulation**: Run correspondence workflow with AI
3. **Compare Performance**: AI vs hardcoded responses
4. **Scale Training**: Train additional disciplines

---

**🎉 You're now ready to train your first AI model!**

**Pro Tip**: Start small - train for 30 steps first to verify everything works, then scale up to 120 steps for production quality.