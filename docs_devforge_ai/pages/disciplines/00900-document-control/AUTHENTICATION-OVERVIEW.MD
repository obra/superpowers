# 0020 Authentication Overview

## 🎯 System Overview

This document provides a comprehensive overview of the project's authentication, security, and access control systems. The authentication system encompasses user management, role-based access control (RBAC), organization isolation, and secure database access patterns.

## 🚨 **CRITICAL PERMISSION SEPARATION**

### **Modal Dropdown vs Accordion Navigation Permissions**

This authentication overview covers **global application access patterns**, but there are **two distinct permission systems** that operate independently:

#### **1. Modal Dropdown Permissions** (Covered in Dropdown Management docs)
- ✅ **What disciplines appear in modal dropdowns**
- ✅ **What template types users can create in modals**
- ✅ **Governance users** can see/select all disciplines in modals regardless of navigation path

#### **2. Accordion Navigation Permissions** (Covered in this document)
- ✅ **What accordion sections users can access/click**
- ✅ **What application areas users can navigate to**
- ✅ **What pages users can enter through the sidebar**

**Key Distinction**: Governance users can create templates for ALL disciplines via modal dropdowns, but their accordion navigation may still be restricted to governance-specific sections.

See **["CRITICAL: Discipline Dropdown Access Control Rules" in 0910_DROPDOWN_MANAGEMENT.md](../user-interface/0910_DROPDOWN_MANAGEMENT.md#critical-discipline-dropdown-access-control-rules)** for modal-specific access rules.

## 🏗️ Core Authentication Components

### Database Security Architecture
- **Row Level Security (RLS)**: Implemented on all mission-critical tables
- **Organization-Based Isolation**: Multi-tenant data access control
- **Creator Ownership Patterns**: User accountability for created records
- **Role-Based Access Control**: JSONB permissions with explicit role definitions

### User Management Systems
- **User Profile Management**: Comprehensive user data and preferences
- **Organization Membership**: User assignment and management
- **Discipline Access Control**: Page-specific and function-specific permissions
- **External Party Integration**: Contractor and vendor authentication

### Security Implementation
- **RLS Policy Management**: Organization-scoped data access
- **Audit Trail Systems**: Complete tracking of user actions
- **Secure Migration Patterns**: Production-ready schema updates
- **API Security**: Secure external service integrations

### Organization-Based Access Control

#### User-Specific Organization Association (November 2025)
**Architectural Change**: The authentication system has undergone a fundamental transformation from system-wide active organization to user-specific organization relationships. This ensures proper multi-tenant data isolation and user-centric access control.

**Key Changes**:
- **Database Schema**: Migrated from system-wide organization context to `user_organization_access` table for explicit user-organization relationships
- **Lookup Function**: Implemented `fetchUserOrganization()` function for efficient multi-tenant user organization resolution
- **Template Management**: Templates are now scoped to user's assigned organizations, preventing cross-organization data access
- **Fallback Strategy**: EPCM organization fallback for development mode and error scenarios to ensure system reliability
- **Access Control**: User-specific organization name resolution and proper access control throughout the application

**Benefits**:
- **Enhanced Security**: Explicit user-organization relationships prevent unauthorized data access between organizations
- **Performance Optimization**: Efficient organization lookups improve application responsiveness
- **Scalability**: Foundation for true multi-tenant architecture with per-user organization associations
- **Reliability**: Robust fallback mechanisms ensure application continues functioning during edge cases

**Technical Implementation**:
```javascript
// fetchUserOrganization() function signature
async function fetchUserOrganization(userId) {
  // Returns user's organization associations for multi-tenant access control
}
```

**Impact on Existing Systems**:
- **Breaking Change**: Affects how templates and data are scoped across organizations
- **Migration Required**: Applications must update to use user-specific organization contexts
- **Future-Reference**: Represents the standard for multi-tenant implementation going forward

## 📊 Current System Status

### 🚨 Critical Security Incident - October 11, 2025
**INFINITE RECURSION CRISIS RESOLVED**

**Incident Summary**: Complete system failure due to circular dependencies in RLS policies between core authentication tables (`user_role_assignments` and `user_organization_access`).

**Root Cause**: Policies on authentication tables referenced each other, creating infinite loops that made the entire database inaccessible.

**Resolution**: Emergency fix implemented with self-contained policies and proper type casting. System fully restored.

**Key Lessons**:
- ❌ **Never reference secured tables in RLS policies** (creates circular dependencies)
- ✅ **Use self-contained policy logic** with direct `auth.uid()` comparisons
- ✅ **Always cast to TEXT** for UUID comparisons (`user_id::text = auth.uid()::text`)
- ✅ **Test for recursion** before deploying policies

**Prevention Measures**: New documentation added ([0030_RLS_INFINITE_RECURSION_ISSUES_AND_SOLUTIONS.md](0030_RLS_INFINITE_RECURSION_ISSUES_AND_SOLUTIONS.md)) with comprehensive prevention strategies.

### Security Implementation Progress
- **RLS Coverage**: 55+ tables secured (17% of total database)
- **Organization Isolation**: Multi-tenant access control implemented
- **Role-Based Access**: Hierarchical permission systems active
- **Audit Systems**: Complete user action tracking enabled
- **Critical Incidents**: 1 resolved (infinite recursion crisis)

### Active Security Components
- ✅ Row Level Security: Comprehensive RLS policy framework
- ✅ Organization-Based Access: Multi-tenant data isolation
- ✅ Creator Ownership Patterns: User accountability for records
- ✅ Role-Based Permissions: Hierarchical access control
- ✅ Audit Trail Systems: Complete action tracking
- ✅ Security Monitoring: Automated compliance checking
- ✅ **Circular Dependency Prevention**: New validation systems active

## 📁 Documentation Structure

### Core Guides
- **[0021_RLS_IMPLEMENTATION_GUIDE.md](0021_RLS_IMPLEMENTATION_GUIDE.md)** - Technical implementation procedures and patterns
- **[0022_SECURITY_DASHBOARDS.md](0022_SECURITY_DASHBOARDS.md)** - Dashboard access and monitoring tools
- **[0023_IMPLEMENTATION_PROGRESS.md](0023_IMPLEMENTATION_PROGRESS.md)** - Current status and progress tracking

### Reference Materials
- **[0024_SECURITY_PATTERNS_REFERENCE.md](0024_SECURITY_PATTERNS_REFERENCE.md)** - RLS policy templates and examples
- **[0025_TROUBLESHOOTING_GUIDE.md](0025_TROUBLESHOOTING_GUIDE.md)** - Error resolution and debugging

### Legacy Documentation
- **[archive/](archive/)** - Original documentation files (preserved for reference)

## 🎯 Key Security Achievements

- **Batch 18 Complete**: 5 governance and procurement tables secured
- **Schema Evolution**: Added missing security columns to 120+ tables
- **Zero Security Breaches**: All authenticated access properly controlled
- **Performance Optimized**: Strategic indexing with minimal overhead

## 🚀 Next Priority Actions

1. **Complete Remaining Tables**: Secure remaining 270+ database tables
2. **Enhanced Monitoring**: Implement automated security dashboards
3. **Advanced RBAC**: Deploy sophisticated role-based access controls
4. **Audit Automation**: Create continuous compliance monitoring systems

## 📚 Related Documentation

### System Architecture
- **[../0200_SYSTEM_ARCHITECTURE.md](../0200_SYSTEM_ARCHITECTURE.md)** - Overall system security context
- **[../database-systems/0300_TABLE_CONFORMANCE_AUDIT.md](../database-systems/0300_TABLE_CONFORMANCE_AUDIT.md)** - Security compliance tracking

### Development Resources
- **[../0305_SQLITE_FIRST_WORKFLOW.md](../0305_SQLITE_FIRST_WORKFLOW.md)** - Safe development practices
- **[../0220_INFRASTRUCTURE_INTEGRATION.md](../0220_INFRASTRUCTURE_INTEGRATION.md)** - Production environment security

---

*This overview serves as the entry point to the authentication documentation. For detailed implementation procedures, see [0021_RLS_IMPLEMENTATION_GUIDE.md](0021_RLS_IMPLEMENTATION_GUIDE.md).*
