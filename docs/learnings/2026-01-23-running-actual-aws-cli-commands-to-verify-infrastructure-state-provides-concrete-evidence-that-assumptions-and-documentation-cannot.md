---
date: 2026-01-23
tags: [verification, evidence, aws, infrastructure, testing]
workflow: [verification-before-completion, systematic-debugging]
---

# Running actual AWS CLI commands to verify infrastructure state provides concrete evidence that assumptions and documentation cannot

## Problem

When using verification-before-completion skill for schedule manager Lambda, needed to verify the deployment worked. Could have relied on:
- SAM deployment success message
- Assumption that if SAM succeeded, everything is deployed
- Documentation showing the design should work

Instead, ran actual verification commands that revealed real state.

## Solution

**Verification commands executed:**

```bash
# 1. Verify Lambda exists and configuration
aws lambda get-function \
  --function-name calendar-prep-schedule-manager \
  --query 'Configuration.[FunctionName,State,LastUpdateStatus,Runtime,MemorySize,Role]'

# Output confirmed:
# - State: Active
# - LastUpdateStatus: Successful
# - Role: CalendarPrepScheduleManagerRole (correct)

# 2. Test actual invocation
aws lambda invoke \
  --function-name calendar-prep-schedule-manager \
  --payload '{"action":"GET","userId":"pieter.portauw@gmail.com"}'

# Output showed:
# - StatusCode: 200
# - Actual response with existing schedule details

# 3. Verify IAM permissions
aws iam get-role-policy \
  --role-name CalendarPrepAmplifyRole \
  --policy-name LambdaInvokeScheduleManager

# Confirmed: lambda:InvokeFunction permission exists

# 4. Check CloudWatch logs
aws logs filter-log-events \
  --log-group-name "/aws/lambda/calendar-prep-schedule-manager" \
  --filter-pattern "Schedule operation"

# Showed: Recent successful GET operation with 508ms duration
```

**Evidence collected:**
- ✅ Lambda deployed (not assumed)
- ✅ Lambda responds to real invocations (not mocked)
- ✅ IAM permissions exist on correct role (not guessed)
- ✅ Logs show actual operations (not inferred)

## Prevention

**Always verify infrastructure with actual commands:**

**For Lambda deployments:**
```bash
# Don't trust deployment logs alone
aws lambda get-function --function-name [name]        # Exists?
aws lambda invoke --function-name [name] --payload {} # Works?
aws logs tail /aws/lambda/[name]                      # Logs show success?
```

**For IAM permissions:**
```bash
# Don't assume role name
aws sts get-caller-identity  # What role am I using?
aws iam get-role-policy      # Does policy actually exist?
```

**For EventBridge schedules:**
```bash
# Don't trust API response
aws scheduler get-schedule --name [name]  # Actually created?
```

**Benefits:**
- Catches wrong assumptions (CalendarPrepAmplifyRole vs CalendarPrepComputeRole)
- Provides evidence for claims ("Lambda works" = StatusCode 200 + logs)
- Documents verification steps for others
- Finds deployment issues before user does

**Red flags:**
- Claiming "deployed successfully" based only on CloudFormation status
- Assuming IAM role names from documentation
- Not testing actual invocations before marking complete
