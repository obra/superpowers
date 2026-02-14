# Skill Patterns

> From Anthropic's [Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) — patterns observed from early adopters and internal teams.

## Choosing your approach: Problem-first vs. tool-first

Think of it like Home Depot. You might walk in with a problem — "I need to fix a kitchen cabinet" — and an employee points you to the right tools. Or you might pick out a new drill and ask how to use it for your specific job.

* **Problem-first:** "I need to set up a project workspace" → Your skill orchestrates the right MCP calls in the right sequence. Users describe outcomes; the skill handles the tools.
* **Tool-first:** "I have Notion MCP connected" → Your skill teaches Claude the optimal workflows and best practices. Users have access; the skill provides expertise.

Most skills lean one direction. Knowing which framing fits your use case helps you choose the right pattern.

## Pattern 1: Sequential workflow orchestration

**Use when:** Your users need multi-step processes in a specific order.

**Example structure:**
```
## Workflow: Onboard New Customer

### Step 1: Create Account
Call MCP tool: `create_customer`
Parameters: name, email, company

### Step 2: Setup Payment
Call MCP tool: `setup_payment_method`
Wait for: payment method verification

### Step 3: Create Subscription
Call MCP tool: `create_subscription`
Parameters: plan_id, customer_id (from Step 1)

### Step 4: Send Welcome Email
Call MCP tool: `send_email`
Template: welcome_email_template
```

**Key techniques:** Explicit step ordering, dependencies between steps, validation at each stage, rollback instructions for failures.

## Pattern 2: Multi-MCP coordination

**Use when:** Workflows span multiple services.

**Example: Design-to-development handoff**
```
### Phase 1: Design Export (Figma MCP)
1. Export design assets from Figma
2. Generate design specifications
3. Create asset manifest

### Phase 2: Asset Storage (Drive MCP)
1. Create project folder in Drive
2. Upload all assets
3. Generate shareable links

### Phase 3: Task Creation (Linear MCP)
1. Create development tasks
2. Attach asset links to tasks
3. Assign to engineering team

### Phase 4: Notification (Slack MCP)
1. Post handoff summary to #engineering
2. Include asset links and task references
```

**Key techniques:** Clear phase separation, data passing between MCPs, validation before moving to next phase, centralized error handling.

## Pattern 3: Iterative refinement

**Use when:** Output quality improves with iteration.

**Example: Report generation**
```
## Iterative Report Creation

### Initial Draft
1. Fetch data via MCP
2. Generate first draft report
3. Save to temporary file

### Quality Check
1. Run validation script: `scripts/check_report.py`
2. Identify issues:
   - Missing sections
   - Inconsistent formatting
   - Data validation errors

### Refinement Loop
1. Address each identified issue
2. Regenerate affected sections
3. Re-validate
4. Repeat until quality threshold met

### Finalization
1. Apply final formatting
2. Generate summary
3. Save final version
```

**Key techniques:** Explicit quality criteria, iterative improvement loops, validation scripts, knowing when to stop iterating.

## Pattern 4: Context-aware tool selection

**Use when:** Same outcome, different tools depending on context.

**Example: File storage**
```
## Smart File Storage

### Decision Tree
1. Check file type and size
2. Determine best storage location:
   - Large files (>10MB): Use cloud storage MCP
   - Collaborative docs: Use Notion/Docs MCP
   - Code files: Use GitHub MCP
   - Temporary files: Use local storage

### Execute Storage
Based on decision:
- Call appropriate MCP tool
- Apply service-specific metadata
- Generate access link

### Provide Context to User
Explain why that storage was chosen
```

**Key techniques:** Clear decision criteria, fallback options, transparency about choices.

## Pattern 5: Domain-specific intelligence

**Use when:** Your skill adds specialized knowledge beyond tool access.

**Example: Financial compliance**
```
## Payment Processing with Compliance

### Before Processing (Compliance Check)
1. Fetch transaction details via MCP
2. Apply compliance rules:
   - Check sanctions lists
   - Verify jurisdiction allowances
   - Assess risk level
3. Document compliance decision

### Processing
IF compliance passed:
  - Call payment processing MCP tool
  - Apply appropriate fraud checks
  - Process transaction
ELSE:
  - Flag for review
  - Create compliance case

### Audit Trail
- Log all compliance checks
- Record processing decisions
- Generate audit report
```

**Key techniques:** Domain expertise embedded in logic, compliance before action, comprehensive documentation, clear governance.
