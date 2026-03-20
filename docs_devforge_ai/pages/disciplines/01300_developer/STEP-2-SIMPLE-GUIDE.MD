# Step 2 - Simple 00180 Page Update (10 minutes)

## 🎯 What You Actually Need to Do

Since forking is disabled, here's the **exact 3-step process**:

## Step 2A: Create Contributor Branch (2 minutes)

**Run this command as repository owner:**
```bash
git checkout main
git pull origin main
git checkout -b contributor-test-00180-modal
git push origin contributor-test-00180-modal
```

## Step 2B: Update 00180 Page (8 minutes)

**Open `client/src/pages/00180-contributor-hub/00180-enhanced-contributor-hub-page.js`**

**Find the branch creation code and replace with:**

```javascript
// Add this near the top with other useState hooks:
const [contributorName, setContributorName] = useState('test');

// Find where branches are created and update to:
const createBranch = async (pagePrefix, taskName) => {
  const branchName = `contributor-${contributorName}-${pagePrefix}-${taskName}`;
  
  // Show instructions instead of creating branch
  return {
    branchName,
    instructions: `
      1. git fetch origin
      2. git checkout ${branchName}
      3. Make your changes
      4. git add .
      5. git commit -m "feat: ${pagePrefix} ${taskName}"
      6. git push origin ${branchName}
      7. Create PR at: https://github.com/Construct-AI-primary/construct_ai/pull/new/${branchName}
    `
  };
};
```

## Step 2C: Test (2 minutes)

**Test the workflow:**
1. Go to 00180 contributor hub
2. Enter "test" as contributor name
3. Create a branch (it will show instructions)
4. Follow the instructions to checkout the branch
5. Make a small change
6. Push and create PR

## ✅ That's It!

**No branch protection needed** - just use the branch naming convention `contributor-[name]-[prefix]-[task]`.

**Total time: 12 minutes** (2+8+2)
