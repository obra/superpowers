# Update 00180 Page for Fork Support

## Changes needed in 00180-enhanced-contributor-hub-page.js:

1. **Add fork detection:**
```javascript
const contributorFork = `https://github.com/${contributorUsername}/construct_ai`;
```

2. **Update branch creation:**
```javascript
// Instead of creating branch in main repo
// Create branch in contributor's fork
const branchName = `${pagePrefix}-${modalName}`;
const forkUrl = contributorFork;
```

3. **Update push instructions:**
```javascript
// Instead of: git push origin branch-name
// Use: git push fork branch-name
```

4. **Add PR creation helper:**
```javascript
const prUrl = `https://github.com/Construct-AI-primary/construct_ai/compare/main...${contributorUsername}:${branchName}`;
```

## Quick Implementation:
1. Add contributor username field to 00180 page
2. Update branch creation to use fork URLs
3. Test with one contributor
