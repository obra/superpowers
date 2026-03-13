# YAGNI Checklist - You Aren't Gonna Need It

## Table of Contents

- [What is YAGNI?](#what-is-yagni)
- [YAGNI Violation Types](#yagni-violation-types)
- [YAGNI Detection Checklist](#yagni-detection-checklist)
- [Common YAGNI Scenarios](#common-yagni-scenarios)
- [Plan Validation Questions](#plan-validation-questions)
- [YAGNI-Compliant Alternatives](#yagni-compliant-alternatives)
- [Red Flags in Plans](#red-flags-in-plans)
- [Resolution Strategies](#resolution-strategies)
- [Examples in Plan Context](#examples-in-plan-context)

## What is YAGNI?

**YAGNI (You Aren't Gonna Need It)** is a principle that states functionality should not be added until it is actually needed. It fights against over-engineering and speculative development.

## YAGNI Violation Types

### 1. Premature Abstraction

**Symptoms:**
- Abstract base classes with one implementation
- Plugin systems without plugins
- Generic solutions for specific problems
- Configuration for hypothetical scenarios

**Example:**
```typescript
// ❌ YAGNI: Plugin system for one widget
interface WidgetPlugin {
  render(): React.ReactNode;
  configure(options: WidgetOptions): void;
}

class WidgetManager {
  plugins: Map<string, WidgetPlugin> = new Map();

  register(plugin: WidgetPlugin) { ... }
  unregister(name: string) { ... }
  loadFromConfig(config: PluginConfig[]) { ... }
}

// When you only have one widget:
<WidgetManager plugins={[UserProfileWidget]} />
```

```typescript
// ✅ YAGNI-compliant: Direct implementation first
<UserProfileWidget />
// Add abstraction when you have 2+ widgets
```

### 2. Over-Configuration

**Symptoms:**
- Settings that won't be changed
- Environment variables for constants
- Config files for simple values
- Feature flags for unimplemented features

**Example:**
```javascript
// ❌ YAGNI: Config for values that never change
{
  "buttonPadding": 8,
  "primaryColor": "#007bff",
  "maxRetries": 3,
  "timeout": 5000
}
```

```javascript
// ✅ YAGNI-compliant: Hardcode until change needed
const BUTTON_PADDING = 8;  // Extract when used in 2+ places
const PRIMARY_COLOR = "#007bff";  // Extract when theming needed
```

### 3. Future-Proofing

**Symptoms:**
- "We'll need this later" features
- Scalability for theoretical load
- Multi-tenant architecture for single tenant
- Multi-language support for one language

### 4. Speculative Extensibility

**Symptoms:**
- Hook points that won't be used
- Event systems for no listeners
- Extension points without extensions
- API versioning for one version

## YAGNI Detection Checklist

### For Each Feature in Plan

- [ ] Is this required for the current user story?
- [ ] Is there a concrete, immediate use case?
- [ ] Can this be added later without rewriting?
- [ ] Is the complexity justified by the value?
- [ ] Would a simpler solution work now?

### For Each Configuration

- [ ] Will this value actually be changed?
- [ ] Is this configurable in other similar projects?
- [ ] Does this need to vary by environment?
- [ ] Is the overhead of configuration worth it?

### For Each Abstraction

- [ ] Are there 2+ concrete use cases now?
- [ ] Is the abstraction simpler than duplication?
- [ ] Will this abstraction actually be used?
- [ ] Can the abstraction be added later?

## Common YAGNI Scenarios

### 1. Database Design

**YAGNI Violations:**
- Soft delete when hard delete is fine
- Audit logging when not required
- Multi-tenant fields for single tenant
- Archiving strategies for new features

**Questions to Ask:**
- Do we actually need to restore deleted records?
- Who will review audit logs?
- When will we add tenants?
- How long until we have archive-worthy data?

### 2. API Design

**YAGNI Violations:**
- GraphQL when REST is sufficient
- Pagination for small datasets
- Caching strategies for low traffic
- Rate limiting for internal APIs

**Questions to Ask:**
- How many entities will this endpoint return?
- What's the actual response time without caching?
- Who would abuse this API?
- What's the actual traffic volume?

### 3. UI Components

**YAGNI Violations:**
- Theme system for single theme
- 10 button variants when 2 are used
- Responsive breakpoints for unsupported devices
- Accessibility features for internal tools

**Questions to Ask:**
- Will we actually have multiple themes?
- Which button variants are used in designs?
- What devices do our users actually use?
- Who are the actual users of this tool?

### 4. Testing

**YAGNI Violations:**
- 100% coverage mandate
- E2E tests for simple CRUD
- Load testing for low-traffic features
- Cross-browser testing for Chrome-only users

**Questions to Ask:**
- What's the critical path for users?
- What bugs have actually occurred?
- What's the actual usage pattern?
- What browsers do analytics show?

## Plan Validation Questions

### High-Priority Checks

1. **Does the plan include features not in requirements?**
   ```
   Requirement: "User can log in"
   Plan includes: "OAuth, SAML, MFA, passwordless"
   → YAGNI violation: Implement basic auth first
   ```

2. **Are there abstractions without concrete needs?**
   ```
   Plan: "Create plugin architecture for widget system"
   Reality: Only one widget type needed
   → YAGNI violation: Build direct widget first
   ```

3. **Is there premature optimization?**
   ```
   Plan: "Add Redis caching layer"
   Reality: Database queries complete in <50ms
   → YAGNI violation: Optimize when it's a problem
   ```

### Medium-Priority Checks

1. **Are there configurable values that won't change?**
   ```
   Plan: "Make pagination limit configurable"
   Reality: 20 items per page is standard
   → YAGNI consideration: Hardcode, extract when needed
   ```

2. **Is there generic handling for specific cases?**
   ```
   Plan: "Support N validation rules per field"
   Reality: Only required + email validation needed
   → YAGNI consideration: Handle specific case first
   ```

## YAGNI-Compliant Alternatives

### When Tempted to Add Abstraction

| Instead of... | Do this first... | Add abstraction when... |
|---------------|------------------|------------------------|
| Plugin system | Direct implementation | 2+ plugins exist |
| Generic validator | Specific validation | 3+ similar validations |
| Config file | Hardcoded constants | Values differ by env |
| Event system | Direct function calls | 2+ listeners needed |
| Microservices | Monolith modules | Team scaling issues |

### When Tempted to Optimize

| Instead of... | Do this first... | Optimize when... |
|---------------|------------------|------------------|
| Database caching | Direct queries | >200ms response |
| CDN | Serve static files | >1s load time |
| Connection pooling | Simple connections | Connection limits hit |
| Async processing | Synchronous | User waits >3s |
| Pagination | Full list | >50 items |

## Red Flags in Plans

### Critical (Must Fix)
- Building features for hypothetical users
- Multi-tenant architecture for single tenant
- API versioning before first release
- Scalability for theoretical load

### Warning (Consider Carefully)
- More than 3 configuration options
- Generic solutions for one use case
- Extensibility hooks without clear need
- Caching for low-traffic features

### Info (Keep in Mind)
- Extra fields "just in case"
- Comments about future features
- TODO items not in current scope
- "We might need this" statements

## Resolution Strategies

### When YAGNI Violation Found

1. **Assess the actual need**
   - Is this in current requirements?
   - What's the concrete use case?
   - When will this be needed?

2. **Determine the right scope**
   - Remove speculative features
   - Simplify abstractions
   - Hardcode configuration values
   - Focus on immediate requirements

3. **Document future possibilities**
   - Add comments for future extension
   - Note potential abstraction points
   - Don't build, but design for addition

## Examples in Plan Context

### Example 1: Admin Interface

**Plan says:**
```markdown
Create comprehensive admin panel with:
- User management
- Role configuration
- Audit logging
- Export functionality
- Bulk operations
```

**YAGNI Check:**
- Requirements only mention "admin can view users"
- No mention of roles, audit, export, bulk ops

**Recommendation:**
```markdown
Create simple user list view:
- Display users in table
- Basic filtering
- YAGNI: Add admin features when admin workflows are defined
```

### Example 2: API Design

**Plan says:**
```markdown
Design API with:
- Versioning (/v1/, /v2/)
- Pagination for all endpoints
- HATEOAS links
- Rate limiting
- Request queuing
```

**YAGNI Check:**
- Only one client (web app)
- Low traffic expected initially
- Small dataset

**Recommendation:**
```markdown
Simple REST API:
- No versioning until breaking change needed
- Pagination when datasets grow >50 items
- YAGNI: Add rate limiting when abuse detected
```
