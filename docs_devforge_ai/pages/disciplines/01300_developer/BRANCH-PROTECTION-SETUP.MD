# 🛡️ GitHub Branch Protection Setup Guide

**Step-by-step guide to configure repository-wide branch protection rules in GitHub web interface**

---

## 🎯 **Prerequisites**

- ✅ Repository admin/owner access
- ✅ `.github/CODEOWNERS` file in place
- ✅ `.github/PULL_REQUEST_TEMPLATE.md` file in place
- ✅ Protected branches identified (`main`, `master`, `production`)

---

## 📋 **Step 1: Access Repository Settings**

1. Navigate to your GitHub repository
2. Click **"Settings"** tab
3. Scroll down and click **"Branches"** in the left sidebar

**Expected URL**: `https://github.com/[owner]/[repo]/settings/branches`

---

## 📋 **Step 2: Configure Branch Protection Rules**

### **Main Branch Protection (CRITAL)**

Click **"Add rule"** and configure for `main` branch:

#### **Branch Pattern**
```
main
```

#### **Protection Rules** ✅ **ALL REQUIRED**
- [x] **Require a pull request before merging**
  - [x] **Require approvals**
    - [x] **Minimum number of approvals required:** `2`
  - [x] **Dismiss stale pull request approvals when new commits are pushed**
  - [x] **Require review from Code Owners**

- [x] **Require status checks to pass before merging**
  - [x] **Include administrators**
  - Status checks that must pass:
    ```
    build
    test
    lint
    security-scan
    integration-tests
    ```
    *(Add your actual workflow names here)*

- [x] **Require branches to be up to date before merging**

- [x] **Include administrators** in restrictions

- [x] **Block force pushes**

---

### **Additional Branch Protections**

#### **Production/Staging Branches (if applicable)**

**Branch Pattern:**
```
production
staging
```

**Protection Rules:**
- [x] **Require a pull request before merging**
  - [x] **Minimum number of approvals:** `1`
  - [x] **Require review from Code Owners**
- [x] **Require status checks to pass**
- [x] **Include administrators**
- [x] **Block force pushes**

---

## 📋 **Step 3: Configure Required Status Checks**

If you haven't set up GitHub Actions yet:

### **Setting Up Basic Status Checks**

1. Go to **"Settings" → "Branches" → "Branch protection rules"**
2. Edit the `main` branch rule
3. Under **"Status checks that must pass"**, add:

**Required Checks:**
```
✅ continuous-integration/travis-ci
✅ continuous-integration/jenkins
✅ codecov/patch
✅ codecov/project
✅ security/snyk
```

### **GitHub Actions Status Checks**

If using GitHub Actions workflows, they'll automatically appear once they run. Common ones:

**Workflow Status Checks:**
```
✅ test (ci.yml)
✅ lint (ci.yml)
✅ build (ci.yml)
✅ security (security.yml)
✅ deploy (deploy.yml)
```

**Custom Verification:**
```bash
# To see available status checks on a PR:
gh pr checks VIEW
```

---

## 📋 **Step 4: Verifying Branch Protection Rules**

### **Test Protection Enforcement**

1. **Create a test branch:**
```bash
git checkout -b test/feature-test
echo "test" >> test-file.txt
git add test-file.txt
git commit -m "test: verify branch protection"
git push origin test/feature-test
```

2. **Try to merge directly (should fail):**
```bash
# Don't actually do this - it's blocked
git checkout main
git merge test/feature-test  # SHOULD BE BLOCKED
```

3. **Create PR (should work):**
   - Go to GitHub → Pull Requests → "New pull request"
   - Should enforce 2 approvals minimum
   - Should require all status checks to pass

### **Check Protection Status**

**Visual Verification:**
- [x] Main branch shows **shield icon** in branch list
- [x] PRs to main require **2 approvals minimum**
- [x] Force push button is **disabled**
- [x] Direct pushes to main are **blocked**

**API Verification:**
```bash
# Check if rules are active via GitHub CLI
gh api repos/[owner]/[repo]/branches/main/protection | jq .
```

---

## 🔧 **Step 5: Troubleshooting Common Issues**

### **Problem: Status Checks Don't Appear**

**Solutions:**
1. **Ensure workflows run on PRs**: Add `pull_request` trigger to `.github/workflows/ci.yml`
2. **Check workflow permissions**: Repository must have Actions enabled
3. **Branch pattern match**: Verify branch name matches the protected pattern

### **Problem: Code Owners Not Required**

**Solutions:**
1. **Verify CODEOWNERS file**: `/Users/_PropAI/construct_ai/.github/CODEOWNERS`
2. **Check file syntax**: Must be valid CODEOWNERS format
3. **Wait for indexing**: GitHub may take time to process new CODEOWNERS

### **Problem: PR Template Not Used**

**Solutions:**
1. **File location**: Must be `.github/PULL_REQUEST_TEMPLATE.md` (EXACTLY)
2. **GitHub feature**: Ensure repository has PR templates enabled in settings
3. **Cache refresh**: May take GitHub a few minutes to recognize

### **Problem: Force Pushes Still Allowed**

**Solutions:**
1. **Admin restrictions**: Must include administrators in "Include administrators"
2. **Repository permissions**: You must be repo admin to restrict yourself
3. **Organization override**: Org admins may override individual repo settings

---

## 📊 **Protection Metrics Monitoring**

### **Daily Health Check**

**✅ Expected States:**
```yaml
branch_protection:
  status: "ACTIVE"
  protected_branches: ["main", "production", "staging"]
  required_reviews: 2
  require_code_owner_reviews: true
  require_status_checks: true
  restrictions: "admins_included"
  force_push_blocked: true
```

### **Weekly Protection Report**

Generate via GitHub API:
```bash
# Get current protection rules
gh api repos/[owner]/[repo]/branches/main/protection

# Check recent PR compliance
gh pr list --state merged --limit 10 --json reviews,mergeable,statusCheckRollup
```

---

## 🚨 **Emergency Override Procedures**

### **When Protection Blocks Critical Fixes**

1. **Document the emergency** (use template in PR description)
2. **Get explicit approval** from repository administrators
3. **Use override code** in commit message: `PROTE-EMERGENCY-OVERRIDE-BRANCH-PROTECTION`
4. **Complete post-incident review** within 24 hours

**Emergency Override Template in PR:**
```markdown
## 🚨 EMERGENCY BRANCH PROTECTION OVERRIDE

**Override Code**: PROTE-EMERGENCY-OVERRIDE-BRANCH-PROTECTION

**Emergency Classification**:
- [x] CRITICAL: Production system down
- [x] SECURITY: Active vulnerability exploitation
- [x] DATA: Data corruption or integrity breach
- [x] BUSINESS: Revenue/contractual critical

**Immediate Action Required**:
- Issue blocking production deployment
- User impact: [quantify affected users/cost]
- Time constraint: Fix needed within [X] hours
- Alternatives attempted: Staging tests, workarounds

**Temporary Bypass Request**:
- Protection Level Override: All reviews waived
- Status Checks Override: Automated tests bypassed
- Timeline: Override active until [time/date]

**Accountability**:
- Author: Your Name
- Approvers: [Team Lead approval required]
- Post-Incident Review: Scheduled for [24 hours from merge]

---
🔴 USE ONLY IN TRUE EMERGENCIES - ALL BYPASSES ARE AUDITED
```

---

## 📚 **Customizing for Different Team Sizes**

### **Small Teams (2-5 developers)**
- [x] Keep 2 required reviews (peer programming mentality)
- [x] Enable status checks for automation
- [x] Require code owner reviews only for critical files
- [x] Allow force pushes for repository admins only

### **Medium Teams (5-20 developers)**
- [x] Maintain 2 reviews as minimum
- [x] Add specialized code owners for components
- [x] Implement branch naming conventions strictly
- [x] Add integration test status checks

### **Large Teams (20+ developers)**
- [x] Increase minimum reviews to 3 for critical changes
- [x] Implement specialized code owner teams
- [x] Add additional status checks (security, performance)
- [x] Implement gradual rollout and QA gates

---

## 🔍 **Verification Scripts**

### **Weekly Protection Audit**

Create this script to run weekly:

```bash
#!/bin/bash
# weekly_branch_protection_audit.sh

echo "🛡️ WEEKLY BRANCH PROTECTION AUDIT"
echo "Date: $(date)"
echo

# Check if main branch is protected
echo "🔐 Checking branch protection for main:"
PROTECTION_STATUS=$(gh api repos/[owner]/[repo]/branches/main/protection 2>/dev/null || echo "FAILED")
if [[ "$PROTECTION_STATUS" == *"required_pull_request_reviews"* ]]; then
    echo "✅ Branch protection active"
else
    echo "❌ Branch protection not properly configured"
    exit 1
fi

# Check recent PR quality
echo "📊 Analyzing recent PRs:"
gh pr list --state merged --limit 10 --json reviews,number,checks | jq -r '.[] | "\(.number): \(.reviews | length) reviews, checks: \(.checks | length)"'

echo "✅ Audit complete"
```

---

## 📞 **Support & Contact**

### **Implementation Help**
- **Documentation**: [Branch Protection Master Guide](../../../../dev-workflow/0000_BRANCH_PROTECTION_MASTER_GUIDE.md)
- **Emergency Override**: [Emergency Override Guide](./EMERGENCY_OVERRIDE_GUIDE.md)
- **Team Training**: Schedule protection system orientation

### **Common Issues**
- **Help**: Comment on blocked PRs for admin review
- **Escalation**: Tag repository admins for urgent issues
- **Improvement**: Suggest changes via PR to protection system docs

---

## ✅ **Post-Implementation Verification**

**Once configured, verify these work correctly:**

### **Protection Active ✅**
- [ ] Cannot push to main directly
- [ ] PRs require 2 approvals minimum
- [ ] Status checks must pass before merge
- [ ] Code owners must approve changes to their files
- [ ] Force pushes are blocked

### **Emergency Override Works ✅**
- [ ] Override procedure allows critical fixes
- [ ] Audit trail is maintained
- [ ] Post-incident review schedules are followed

### **Team Compliance ✅**
- [ ] All team members understand the system
- [ ] PR template is used consistently
- [ ] Awareness of emergency override procedures

---

**📋 Next Steps**: After completing this setup, test the full workflow by creating a feature branch, submitting a PR, and going through the approval process.

**🔄 Review Schedule**: Monthly review of protection rules effectiveness and team compliance.

---

*This setup guide transforms the repository from vulnerable direct merges to comprehensive protection against exactly the kind of merge disasters experienced recently. Based on the proven 01300 Governance page protection system.*

**Version**: 1.0 | **Last Updated**: October 28, 2025 | **Next Review**: November 28, 2025
