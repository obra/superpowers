# Company Management Integration

## Integration Points

### 1. Authentication System

#### Company-Based Authentication

```javascript
async function validateCompanyAccess(userId, companyId) {
    // Check user's company assignments
    const { data: assignments } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', userId);
        
    // Verify company access
    return assignments?.some(a => a.company_id === companyId);
}
```

#### Role Integration

```javascript
async function getCompanyRoles(companyId) {
    // Get company-specific roles
    const { data: roles } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId);
        
    return roles;
}
```

### 2. UI System

#### Company-Specific Components

```javascript
class CompanyUIManager {
    async loadCompanyComponents(companyId) {
        // Load company settings
        const settings = await this.loadCompanySettings(companyId);
        
        // Initialize components with settings
        this.initializeAccordions(settings.accordions);
        this.initializeButtons(settings.buttons);
        this.initializeModals(settings.modals);
    }
    
    async saveComponentState(companyId, state) {
        // Save component state for company
        await supabase
            .from('company_ui_state')
            .upsert({
                company_id: companyId,
                state: state
            });
    }
}
```

#### Theme Management

```javascript
class CompanyThemeManager {
    async applyCompanyTheme(companyId) {
        // Load company theme
        const { data: theme } = await supabase
            .from('company_themes')
            .select('*')
            .eq('company_id', companyId)
            .single();
            
        // Apply theme to DOM
        document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
        // ... other theme properties
    }
}
```

### 3. Data Management

#### Company Data Filtering

```javascript
class CompanyDataFilter {
    constructor(companyId) {
        this.companyId = companyId;
    }
    
    async getFilteredData(table, query = {}) {
        return await supabase
            .from(table)
            .select('*')
            .eq('company_id', this.companyId)
            .match(query);
    }
    
    applyCompanyFilter(query) {
        return {
            ...query,
            company_id: this.companyId
        };
    }
}
```

#### Cross-Company Data Sharing

```javascript
class CompanyDataSharing {
    async shareData(sourceCompanyId, targetCompanyId, data) {
        // Create shared data record
        const { data: shared } = await supabase
            .from('shared_company_data')
            .insert({
                source_company_id: sourceCompanyId,
                target_company_id: targetCompanyId,
                data: data,
                shared_at: new Date()
            });
            
        return shared;
    }
    
    async getSharedData(companyId) {
        // Get data shared with company
        return await supabase
            .from('shared_company_data')
            .select('*')
            .eq('target_company_id', companyId);
    }
}
```

## Caching and Path Management

### 1. Caching Strategy

#### Multi-Level Cache Implementation

```javascript
class CompanyCacheManager {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutes
        this.pathMap = new Map(); // Track path dependencies
    }
    
    async getCachedData(companyId, key, path = null) {
        const cacheKey = `${companyId}:${key}`;
        const cached = this.cache.get(cacheKey);
        
        // Check cache validity
        if (cached && Date.now() - cached.timestamp < this.maxAge) {
            // Verify path dependency if provided
            if (path && cached.path !== path) {
                this.cache.delete(cacheKey);
                return await this.fetchAndCache(companyId, key, path);
            }
            return cached.data;
        }
        
        return await this.fetchAndCache(companyId, key, path);
    }

    private async fetchAndCache(companyId, key, path) {
        const data = await this.fetchData(companyId, key);
        
        this.cache.set(`${companyId}:${key}`, {
            timestamp: Date.now(),
            data: data,
            path: path
        });

        // Update path mapping
        if (path) {
            if (!this.pathMap.has(path)) {
                this.pathMap.set(path, new Set());
            }
            this.pathMap.get(path).add(`${companyId}:${key}`);
        }
        
        return data;
    }

    invalidateByPath(path) {
        const affectedKeys = this.pathMap.get(path);
        if (affectedKeys) {
            affectedKeys.forEach(key => this.cache.delete(key));
            this.pathMap.delete(path);
        }
    }
}
```

#### Cache Coordination

```javascript
class CacheCoordinator {
    constructor() {
        this.cacheManagers = new Map();
    }

    registerCache(name, manager) {
        this.cacheManagers.set(name, manager);
    }

    invalidateRelatedCaches(path) {
        // Invalidate caches across all registered managers
        for (const manager of this.cacheManagers.values()) {
            manager.invalidateByPath(path);
        }
    }

    clearCompanyData(companyId) {
        // Clear company data across all caches
        for (const manager of this.cacheManagers.values()) {
            manager.clearCompany(companyId);
        }
    }
}
```

### 2. Path Management

#### Path Resolution Strategy

```javascript
class PathResolver {
    constructor(basePath) {
        this.basePath = basePath;
        this.pathCache = new Map();
    }

    resolvePath(relativePath) {
        const cacheKey = `path:${relativePath}`;
        
        if (this.pathCache.has(cacheKey)) {
            return this.pathCache.get(cacheKey);
        }

        const resolvedPath = this.normalizePath(
            path.join(this.basePath, relativePath)
        );
        
        this.pathCache.set(cacheKey, resolvedPath);
        return resolvedPath;
    }

    normalizePath(path) {
        // Ensure consistent path format
        return path.replace(/\\/g, '/');
    }

    invalidatePathCache() {
        this.pathCache.clear();
    }
}
```

#### Path-Aware Cache Integration

```javascript
class PathAwareCache extends CompanyCacheManager {
    constructor(pathResolver) {
        super();
        this.pathResolver = pathResolver;
    }

    async getCachedData(companyId, key, relativePath = null) {
        const resolvedPath = relativePath ? 
            this.pathResolver.resolvePath(relativePath) : null;
            
        return await super.getCachedData(companyId, key, resolvedPath);
    }

    invalidateByRelativePath(relativePath) {
        const resolvedPath = this.pathResolver.resolvePath(relativePath);
        super.invalidateByPath(resolvedPath);
    }
}
```

### Best Practices

1. **Cache Management**
   - Use consistent cache key formats
   - Implement cache warming for critical paths
   - Set appropriate cache durations
   - Handle cache invalidation events
   - Monitor cache hit rates

2. **Path Handling**
   - Use relative paths for portability
   - Normalize paths for consistency
   - Cache resolved paths
   - Handle path dependencies
   - Implement path validation

3. **Integration Guidelines**
   - Coordinate cache invalidation
   - Track path dependencies
   - Handle cross-cache interactions
   - Implement proper error handling
   - Monitor cache performance

## Related Documentation

- [Company Management Overview](0600_COMPANY_MANAGEMENT.md)
- [Implementation Details](0601_COMPANY_IMPLEMENTATION.md)
- [Troubleshooting Guide](0602_COMPANY_TROUBLESHOOTING.md)
