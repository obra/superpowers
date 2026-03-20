# Discipline Code Standardization Plan

## Executive Summary

This document outlines a systematic approach to standardize discipline codes throughout the Construct AI project to ensure architectural consistency and prevent JSX syntax errors. The standardization follows a 5-digit full code format (e.g., `00102`, `00872`) replacing inconsistent short or partial codes.

## Current Analysis

Based on examination of existing discipline pages:

### ✅ Current Correct Patterns (5-digit format)
- Directory: `00102-administration/`, `00872-developer/`
- Component files: `00102-administration-page.js`, `00872-developer-page.js`
- CSS classes: `A-00102-navigation-container`, `A-087-navigation-container` (mixed)
- Images: `00102.png`, `00872.png`
- Chatbot IDs: `pageId="00102"`, `pageId="00872"`

### ❌ Inconsistent Patterns Found
- CSS class variations: `A-00102-*` vs `A-087-*` (different prefix lengths)
- Some directories may still use partial codes
- Inconsistent use of 3-digit vs 5-digit references

## Standardization Rules

### 1. Directory Structure
```
✅ CORRECT: 00512-project-name/
❌ INCORRECT: 512-project-name/
❌ INCORRECT: 0512-project-name/
```

### 2. Component Files
```
✅ CORRECT: 00512-project-name-component.js
❌ INCORRECT: 512-project-name-component.js
```

### 3. CSS Classes
```
✅ CORRECT: A-00512-class-name
❌ INCORRECT: A-512-class-name
❌ INCORRECT: A-0512-class-name
```

### 4. Asset References
```
✅ CORRECT: "00512.png", "00512-pages-style.css"
❌ INCORRECT: "512.png", "512-pages-style.css"
```

### 5. JavaScript References
```
✅ CORRECT: pageId="00512", triggerPage="00512-project-name"
❌ INCORRECT: pageId="512", triggerPage="512-project-name"
```

## Implementation Strategy

### Phase 1: Discovery and Mapping
1. **Scan all files** to identify current discipline code usage
2. **Create comprehensive mapping** of old → new codes
3. **Validate consistency** across file types

### Phase 2: Systematic Replacement
1. **Create backup** of current state
2. **Apply automated replacements** with validation
3. **Incremental testing** after each change batch

### Phase 3: Validation and Testing
1. **Build verification** to ensure no syntax errors
2. **Manual verification** of critical paths
3. **Regression testing** of core functionality

## Risk Mitigation

### Potential Issues
- **Partial updates** leading to broken references
- **Case-sensitive replacements** causing unintended changes
- **Build cache issues** masking real problems

### Prevention Strategies
- **Atomic operations** - all-or-nothing approach
- **Validation checkpoints** after each phase
- **Rollback capability** using git history
- **Incremental testing** to catch issues early

## Success Criteria

### Technical Metrics
- ✅ Zero JSX syntax errors in build
- ✅ All discipline pages load correctly
- ✅ Consistent 5-digit code format across codebase
- ✅ No broken internal links or references

### Architectural Goals
- ✅ Improved maintainability through consistency
- ✅ Easier future enhancements and debugging
- ✅ Standardized development patterns
- ✅ Clear naming conventions for new disciplines

## Implementation Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Phase 1 | 2-3 hours | Discovery, mapping, planning |
| Phase 2 | 4-6 hours | Automated replacement, testing |
| Phase 3 | 2-3 hours | Validation, optimization |
| **Total** | **8-12 hours** | Complete standardization |

## Rollback Plan

If issues occur during implementation:

1. **Immediate Rollback**: `git checkout HEAD~1` to restore previous state
2. **Partial Rollback**: Use git to revert specific commits
3. **Manual Restoration**: Use backups created before changes

## Next Steps

1. **Begin Phase 1**: Run discovery scan to identify all discipline codes
2. **Create mapping file**: Document all old → new code mappings
3. **Execute systematic replacement**: Apply changes incrementally
4. **Validate results**: Ensure build succeeds and functionality works

---

*This plan ensures systematic, safe implementation of discipline code standardization while preventing the architectural issues that caused previous JSX syntax errors.*