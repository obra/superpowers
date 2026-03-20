# Authentication Migration Agent

## Purpose
Migrate a single file from direct supabaseClient.from() calls to Phase 2 authentication abstractions

## Parameters
- target_file: Path to file needing migration
- agent_instance: Instance identifier (1-31)
- migration_scope: Type of migration (modal, page, service)

## Process Flow
1. **Analysis Phase**: Read target file and identify all supabaseClient.from() calls
2. **Migration Phase**: Replace direct calls with Phase 2 abstractions
3. **Validation Phase**: Ensure syntax is valid and no violations remain
4. **Reporting Phase**: Report completion status and changes made

## Success Criteria
- ✅ Zero supabaseClient.from() calls remaining in file
- ✅ All authentication checks use Phase 2 patterns (auth.isAuthenticated, auth.user)
- ✅ Required imports added (useAuth, useDatabase)
- ✅ File functionality preserved
- ✅ Consistent with Phase 2 architectural patterns

## Migration Patterns Applied

### Database Operations
```javascript
// BEFORE
const { data, error } = await supabaseClient.from('users').select('*');

// AFTER
const data = await database.select('users', '*');
```

### Authentication Checks
```javascript
// BEFORE
if (!currentUser || !currentUser.id) {
  throw new Error('User not authenticated');
}

// AFTER
if (!auth.isAuthenticated || !auth.user) {
  showErrorToast('Authentication required');
  return;
}
```

### User Data Access
```javascript
// BEFORE
const userId = currentUser?.id;
const userEmail = currentUser?.email;

// AFTER
const userId = auth.user?.id;
const userEmail = auth.user?.email;
```

## Error Handling
- **Syntax Errors**: Abort migration and report
- **Missing Imports**: Automatically add required imports
- **Complex Patterns**: Flag for manual review
- **Validation Failures**: Provide detailed error reports

## Performance Metrics
- **Average Migration Time**: 30-60 seconds per file
- **Success Rate Target**: >95%
- **Memory Usage**: <50MB per agent instance
- **Concurrent Safety**: No file conflicts between agents