---
name: training-models
description: Use when the user wants to train, fine-tune, or deploy a machine-learning model with the trisol CLI, especially LoRA, SFT, or distributed GPU training
---

# Training Models with Trisol

## Overview

Use the `trisol` CLI directly. The Trisol Agent Skill is convenient on the intranet but not available in all environments, so this skill encodes the same cold-start playbook as explicit CLI commands.

**Core principle:** discover first, submit once, poll to completion, deploy with exact version codes.

## When to Use

- Import a model or dataset from HuggingFace for training
- Submit LoRA / QLoRA / full SFT jobs
- Pick clusters, GPU models, and quota from the active team
- Poll a training job and deploy the resulting adapter or model
- **For true multi-node distributed training, prefer the Trisol model training center web UI**; single-node multi-GPU is fine via CLI

## Quick Reference

| Task | Command |
|------|---------|
| Install / update CLI | `curl -fsSL https://trisol.dp.tech/install.sh \| sh` then `trisol update` |
| Auth | `trisol login` (Feishu OAuth) or `echo "$TRISOL_TOKEN" \| trisol login --pat-stdin` |
| Switch team | `trisol config use-team <name>` |
| Import HF model | `trisol model import-hf <org/repo> --wait --team <name>` |
| Import HF dataset | `trisol dataset import-hf <org/repo> --team <name>` |
| Check quota | `trisol quota list -o json --team <name>` |
| Submit training | `trisol train submit <job-name> --base-model NAME:CODE --dataset NAME:CODE:FILE --cluster ... --gpu-model ... --gpu-count ... --mode lora --output-model <out> --create-output-model` |
| Poll job | `trisol train get <job-id> -o json` |
| Deploy | `trisol inference create --model NAME:CODE --cluster ... --gpu-model ... --wait` |

## Core Workflow

### 1. Pre-flight

```bash
trisol version -o json
trisol whoami -o json
trisol config use-team <team-name>
trisol config set output json
```

If the CLI is missing, install it with `curl -fsSL https://trisol.dp.tech/install.sh | sh`.

### 2. Resolve base model

```bash
trisol model list -o json --team <team>
trisol model get <model-name> -o json --team <team>
```

Capture the latest **ready** version code. Do **not** use `latest_version_code` blindly; pick `versions[] | select(.status == "ready") | max_by(.version_code)`.

If the model is not on the platform yet, import it:

```bash
trisol model import-hf Qwen/Qwen3-4B --wait --team <team>
```

### 3. Resolve dataset

```bash
trisol dataset list -o json --team <team>
trisol dataset get <dataset-name> -o json --team <team>
```

Confirm `manifest.trainable == true`. A dataset can be `ready` but lazy-loaded and not trainable.

If the dataset has multiple files, pick one split explicitly: `NAME:CODE:<relpath>`.

### 4. Pick quota

```bash
trisol quota list -o json --team <team>
```

Choose a **whole row** for `(cluster_name, gpu_model)`. Do not mix cluster and GPU from different rows. For LoRA deployment later, prefer a cluster with active PFS.

For single-node multi-GPU, use `--gpu-count N` on that row.

### 5. Submit

```bash
trisol train submit my-lora-job \
  --base-model qwen3-5-4b:1 \
  --dataset gsm8k-x-openai:1:main/train-00000-of-00001.parquet \
  --dataset-columns gsm8k-x-openai:1=prompt=question,response=answer \
  --dataset-format gsm8k-x-openai:1=alpaca \
  --mode lora \
  --cluster ali-wulan-gpu-prod \
  --gpu-model A100-SXM4-80GB \
  --gpu-count 1 \
  --output-model my-lora-adapter \
  --create-output-model \
  --team <team> \
  -o json
```

Capture the returned `id` as `JOB_ID`.

### 6. Poll

```bash
while true; do
  STATUS=$(trisol train get "$JOB_ID" -o json | jq -r '.status')
  echo "$(date): $STATUS"
  case "$STATUS" in
    succeeded|failed|error) break ;;
    *) sleep 60 ;;
  esac
done
```

On `succeeded`, read `output_model_id` and the **exact** `output_model_version_code` for deployment.

### 7. Deploy (optional)

```bash
trisol inference create \
  --model my-lora-adapter:<output_version_code> \
  --cluster ali-wulan-gpu-prod \
  --gpu-model A100-SXM4-80GB \
  --team <team> \
  --wait \
  -o json
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `latest_version_code` | Filter `versions` for `status == ready` and pick max `version_code` |
| Mixing cluster + GPU from different quota rows | Use a single quota row exactly as returned |
| Forgetting `:FILE` on multi-file datasets | Append the split path, e.g. `NAME:CODE:main/train-00000-of-00001.parquet` |
| Ignoring `manifest.trainable` | Check it explicitly; `ready` ≠ trainable |
| Deploying LoRA without PFS | Choose a cluster with active PFS for LoRA/QLoRA serving |
| Using `latest` for the trained output | Use the exact `output_model_version_code` from `train get` |

## Red Flags — STOP and Check

- The user asks for **multi-node distributed training** → direct them to the Trisol model training center web UI instead of CLI guesswork
- The base model has `.adapter` metadata → it is an adapter, not a base; download or reference its `base_model_name` first
- `quota list` returns empty → set active team or add `--all-teams`
- Training submission fails with 422 on dataset → re-check `:FILE`, column mapping, and dataset format
- Job status stays `preparing` for a long time with `WarmupNotReady` → this is normal while the platform caches HF weights; keep polling

## Verification Checklist

- [ ] `trisol whoami` succeeds and the active team is correct
- [ ] Base model version is `ready`
- [ ] Dataset `manifest.trainable == true`
- [ ] Quota row chosen is a single, unmixed `(cluster, gpu_model)` row
- [ ] `trisol train get <job-id>` reaches a terminal state
- [ ] Output model version code is captured exactly before deployment
