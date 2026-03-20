# Discipline Code Standardization - Usage Guide

## Quick Start

To standardize discipline codes throughout your project, simply run:

```bash
node run-standardization.js
```

This will execute the complete workflow automatically.

## Manual Execution

If you prefer to run each step individually:

### Step 1: Scan for Codes
```bash
node discipline-code-scanner.js
```
This scans your codebase and generates:
- `discipline-scan-results.json` - Detailed analysis
- `discipline-mapping.json` - Code mappings to apply

### Step 2: Apply Standardization
```bash
node discipline-code-standardizer.js
```
This applies the changes and generates:
- `discipline-standardization-report.json` - Change report
- `discipline-standardization-log.txt` - Execution log

### Step 3: Validate Changes
```bash
cd client && npm run build
```
This ensures no syntax errors were introduced.

## Understanding the Process

### What Gets Standardized

The standardization process converts all discipline codes to a consistent 5-digit format:

| Before | After | Pattern |
|--------|-------|---------|
| `087` | `00087` | 3-digit → 5-digit |
| `102` | `00102` | 3-digit → 5-digit |
| `872` | `00872` | 3-digit → 5-digit |

### Where Changes Are Applied

- **Directory names**: `087-project/` → `00087-project/`
- **Component files**: `087-project-page.js` → `00087-project-page.js`
- **CSS classes**: `A-087-nav` → `A-00087-nav`
- **JavaScript references**: `pageId="087"` → `pageId="00087"`
- **Image assets**: `087.png` → `00087.png`
- **Import paths**: `from './087-project/'` → `from './00087-project/'`

### What Gets Skipped

- **No changes to 5-digit codes**: Already correct format
- **No changes to version numbers**: Skip semantic versions
- **No changes to dates**: Skip dates in any format
- **No changes to UUIDs**: Skip long identifiers

## Safety Features

### 1. Automatic Backup
Before any changes, a complete backup is created:
```bash
backup-pre-standardization-[timestamp].tar.gz
```

### 2. Validation Checkpoints
- Syntax validation for all modified files
- Build validation to ensure no errors
- Rollback capability if issues occur

### 3. Comprehensive Logging
- Every change is logged with file path and line numbers
- Detailed error reporting
- Execution timeline tracking

## Rollback Procedure

If issues occur, restore from backup:

```bash
# Extract the backup archive
tar -xzf backup-pre-standardization-[timestamp].tar.gz

# Verify the rollback
cd client && npm run build
```

## Troubleshooting

### Common Issues

#### "No code mappings found"
**Cause**: Scanner didn't run or mapping file wasn't created
**Solution**: 
1. Ensure scanner ran successfully
2. Check `discipline-mapping.json` exists
3. Re-run scanner if needed

#### "Build validation failed"
**Cause**: Changes introduced syntax errors
**Solution**:
1. Check error details in build output
2. Review changes in `discipline-standardization-report.json`
3. Consider rolling back from backup

#### "Permission denied" errors
**Cause**: File system permissions
**Solution**:
1. Check write permissions in project directory
2. Run with appropriate user privileges

### Error Recovery

If critical errors occur:

1. **Check logs**: `discipline-standardization-log.txt`
2. **Review changes**: `discipline-standardization-report.json`
3. **Rollback if needed**: Use the backup archive
4. **Debug manually**: Examine specific files mentioned in errors

## Customization

### Modify Scan Paths
Edit `discipline-code-scanner.js`:
```javascript
const SCAN_PATHS = [
  'client/src/pages',        // Add or remove paths
  'client/src/components', 
  // ... your paths
];
```

### Add New Patterns
Edit `discipline-code-standardizer.js`:
```javascript
REPLACEMENT_PATTERNS = {
  // Add your custom patterns here
  yourPattern: {
    pattern: /your-regex/g,
    replacement: (match, groups) => 'your-replacement'
  }
};
```

### Adjust Safety Thresholds
Edit validation settings in both scripts to be more or less strict based on your needs.

## Expected Results

After successful standardization:

### ✅ Success Indicators
- All discipline codes use 5-digit format
- No build errors
- All discipline pages load correctly
- Consistent naming throughout codebase

### 📊 Generated Reports
- `discipline-scan-results.json` - Complete analysis
- `discipline-mapping.json` - Applied mappings
- `discipline-standardization-report.json` - Change summary
- `discipline-standardization-completion.md` - Final report

## Best Practices

### Before Running
1. **Commit current state**: Ensure clean git state
2. **Check disk space**: Ensure sufficient space for backups
3. **Notify team**: Inform other developers of upcoming changes

### During Execution
1. **Monitor logs**: Watch for warnings or errors
2. **Don't interrupt**: Let the process complete fully
3. **Review reports**: Check generated reports after completion

### After Completion
1. **Test functionality**: Verify all pages work correctly
2. **Update documentation**: Refresh any internal docs if needed
3. **Commit changes**: Once validated, commit to version control

## Integration with Development Workflow

### Continuous Integration
Add to your CI pipeline:
```yaml
- name: Standardize Discipline Codes
  run: node run-standardization.js
  # Add validation that no changes occurred if not expected
```

### Pre-commit Hooks
Prevent inconsistent codes from being committed:
```bash
#!/bin/bash
node discipline-code-scanner.js
if [ $? -eq 0 ]; then
  echo "✅ Code scan passed"
else
  echo "❌ Discipline code inconsistencies found"
  exit 1
fi
```

---

## Support

If you encounter issues:
1. Check this documentation first
2. Review the generated log files
3. Consider rolling back and investigating specific issues
4. Consult the project team for complex problems

*This standardization ensures consistent, maintainable architecture throughout the Construct AI project.*