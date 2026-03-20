# UI Accordion Standards for Construct AI

This document outlines the standardized patterns and procedures for implementing and maintaining the Construct AI accordion navigation system.

## 🎯 Accordion System Overview

The accordion navigation system provides hierarchical content organization and navigation for the Construct AI platform, organizing the application into hierarchical sections and subsections based on organizational structure, user roles, and functional categories.

### Key Features
- **Hierarchical Navigation**: Multi-level section/subsection organization
- **Dynamic Content Loading**: Real-time content adaptation based on user permissions
- **Multi-Organization Support**: Cross-organizational collaboration capabilities
- **Responsive Design**: Mobile and desktop optimized interface
- **Real-time Updates**: Live synchronization and state management

## 🏗️ System Architecture Standards

### Data Flow Architecture

**1. Primary: Server API (`/api/accordion-sections`)**
- **Source**: `server/src/routes/accordion-sections-routes.js`
- **Template**: `MASTER_TEMPLATE` + organization mappings
- **Collaboration**: Merged via `server/src/routes/accordion-collaboration-routes.js`
- **Fallback**: None - authoritative source
- **Content**: Complete section structure

**2. Secondary: Client Fallback (Development)**
- **Source**: `client/src/common/js/config/00200-ui-display-mappings.js`
- **Variable**: `sectionMappings`
- **Purpose**: Development environment when API unavailable
- **Maintenance**: Must be kept synchronized with server template

**3. Tertiary: Emergency Fallback**
- **Source**: `client/src/modules/accordion/00200-accordion-component.js`
- **Purpose**: Critical sections when all else fails
- **Content**: Minimal operational sections only

## 🔧 Implementation Standards

### URL Pattern Standards

#### ❌ NEVER use double-hash routing:
```javascript
{ title: 'Link Name', url: '/#/route-name' } // BROKEN
```

#### ✅ ALWAYS use React Router format:
```javascript
{ title: 'Link Name', url: '/route-name' } // CORRECT
```

### Link Ordering Standards

**MANDATORY: All section links must follow alphabetical ordering**

1. **Section Title First**: Main page link always first
2. **Alphabetical Sort**: Remaining links A-Z (case-insensitive)
3. **Ignore Special Characters**: Pure alphabetical sorting

#### ✅ CORRECT EXAMPLE:
```javascript
{
  title: 'Safety',
  links: [
    { title: 'Safety', url: '/safety' },              // 1. Section title first
    { title: 'Contractor Vetting', url: '/contractor-vetting' }, // 2. Alphabetical
    { title: 'Documents', url: '/all-documents' },    // 3. C before E, I, S
    { title: 'Email Management', url: '/email-management' } // 4. E before I, S
  ]
}
```

#### ❌ INCORRECT EXAMPLE:
```javascript
{
  title: 'Safety',
  links: [
    { title: 'Safety', url: '/safety' },              // ✓ Correct position
    { title: 'Inspections', url: '/inspections' },     // ✗ Should be after Email Management
    { title: 'Contractor Vetting', url: '/contractor-vetting' }, // ✗ Should be before Documents
    { title: 'Documents', url: '/all-documents' },    // ✗ Wrong alphabetical position
    { title: 'Email Management', url: '/email-management' } // ✗ Wrong alphabetical position
  ]
}
```

## 📋 Section-Specific Hierarchy Structures

### Contracts Hierarchy Structure
```
00400 - Contracts (main button)
  ├── 00400 - Contracts (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  └── 00425 - Contracts Pre Award (sub-button)
      ├── 00425 - Contracts Pre Award (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
  └── 00435 - Contracts Post Award (sub-button)
      ├── 00435 - Contracts Post Award (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
```

### Directors Hierarchy Structure
```
00876 - Directors (main button)
  ├── 00876 - Directors (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 00880 - Board of Directors (sub-button)
  │   ├── 00880 - Board of Directors (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00882 - Director Construction (sub-button)
  │   ├── 00882 - Director Construction (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  [... and so on for all Director roles]
```

### Design Hierarchy Structure
```
00800 - Design (main button)
  ├── 00800 - Design (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 00825 - Architectural (sub-button)
  │   ├── 00825 - Architectural (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00835 - Chemical Engineering (sub-button)
  │   ├── 00835 - Chemical Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  [... engineering disciplines ...]
```

## ⚠️ Critical Synchronization Requirements

### 3-Tier Fallback System Synchronization
**When adding/modifying sections:**
1. ✅ Update server template (`accordion-sections-routes.js`)
2. ✅ Update client fallback (`sectionMappings` in `00200-ui-display-mappings.js`)
3. ✅ Test 3-tier fallback - ensure all levels work consistently

### Template-Based Structure (NOT Database-Driven)
**The accordion structure is constructed from server-side templates, not from Supabase page queries.**

- ❌ **WRONG**: Assuming Supabase stores/defines accordion structure
- ✅ **CORRECT**: Supabase stores only org/collaboration config, not structure
- ✅ **Source of Truth**: Server templates generate the complete structure

## 🎨 User Experience Standards

### Progressive Disclosure
1. **Initial Load**: High-level overview with collapsed sections
2. **Context Expansion**: Expand relevant sections as needed
3. **Content Discovery**: Hierarchical information revealed progressively
4. **State Preservation**: Remember user expansion preferences

### Responsive Design
- **Mobile**: Touch-optimized navigation with swipe gestures
- **Tablet**: Adaptive layout with optimized touch targets
- **Desktop**: Full hierarchical navigation with keyboard shortcuts

### Accessibility Features
- **Keyboard Navigation**: Full arrow key and tab navigation
- **Screen Reader Support**: ARIA labels and live regions
- **Focus Management**: Proper focus indicators and management
- **High Contrast**: WCAG AA compliant color schemes

## 🔄 Dynamic Behavior Standards

### Organization Filtering
- **Template Selection**: Organization-specific template mapping
- **Section Filtering**: User role and permission-based filtering
- **Collaboration Merge**: Cross-organizational section sharing

### Real-time Updates
- **Live Synchronization**: Real-time section updates via subscriptions
- **State Management**: Centralized accordion state with React Context
- **Performance Optimization**: Lazy loading and virtualization for large hierarchies

## 📊 Implementation Procedures

### For New Section Addition

1. **Update Server Template**: Add to `MASTER_TEMPLATE` in `accordion-sections-routes.js`
2. **Update Client Fallback**: Add to `sectionMappings` in `00200-ui-display-mappings.js`
3. **Test All Environments**: Verify API, client fallback, and emergency fallback
4. **Update Organization Mappings**: Add to `ORGANIZATION_TEMPLATES` if needed

### For Organization Setup

1. **Map Organization to Template**: Add entry in `ORGANIZATION_TEMPLATES`
2. **Configure Collaboration**: Set up organization_collaborations if needed
3. **Test Template Resolution**: Verify correct template selection
4. **Validate Section Filtering**: Confirm appropriate sections displayed

### For Collaboration Features

1. **Define Collaboration Rules**: Set up organization_collaborations table
2. **Configure Precedence**: Define page_precedence and shared_sections
3. **Test Merge Logic**: Verify correct section merging and ordering
4. **Validate Permissions**: Ensure proper access control

## 🐛 Error Prevention Standards

### Common Issues & Solutions

#### No Sections Loading
**Prevention**: Always test API availability before deployment
**Causes**: API unavailable, organization not mapped, auth issues
**Solutions**: Check API health, verify mappings, test authentication

#### Wrong Template Applied
**Prevention**: Validate organization mapping in all environments
**Causes**: Incorrect mapping, inheritance issues, collaboration conflicts
**Solutions**: Verify mappings, check inheritance, review precedence

#### Client Fallback Incomplete
**Prevention**: Automated synchronization checks
**Impact**: Different navigation in development vs production
**Solutions**: Synchronize client fallback with server template

#### URL Routing Issues
**Prevention**: Code review checklist for accordion link additions
**Cause**: Manual `/#/` prefixes causing double-hash routing
**Fix**: Always use React Router format: `/route-name`

## 📈 Performance Standards

### Loading Strategies
- **Lazy Loading**: Section content loaded on demand
- **Virtualization**: Large hierarchies rendered efficiently
- **Caching**: Template and section data cached appropriately
- **Bundle Splitting**: Component code split for optimal loading

### Memory Management
- **Component Cleanup**: Proper unmounting and resource cleanup
- **State Optimization**: Efficient state management and updates
- **Event Listener Management**: Proper cleanup of event subscriptions
- **DOM Optimization**: Minimal DOM manipulation and efficient rendering

## 🔒 Security Standards

### Authentication & Authorization
- **User Context**: Proper authentication verification
- **Role-Based Access**: Section filtering based on user roles
- **Organization Isolation**: Multi-tenant data isolation
- **Permission Validation**: Server-side permission checking

### Data Protection
- **Input Validation**: All user inputs validated and sanitized
- **XSS Prevention**: Content Security Policy and input encoding
- **CSRF Protection**: Request validation and token verification
- **Audit Logging**: Security event logging and monitoring

## 📋 Maintenance Standards

### Regular Review Procedures
- **Monthly**: Review section completeness and organization mappings
- **Quarterly**: Audit link ordering and alphabetical compliance
- **Bi-annually**: Performance optimization and accessibility testing
- **Annually**: Complete system architecture review

### Quality Assurance
- **Automated Testing**: Link validation and routing tests
- **Manual Testing**: Cross-browser and device compatibility
- **User Acceptance**: Real user navigation pattern validation
- **Performance Monitoring**: Loading time and interaction tracking

## 📚 Related Standards

- **File Naming Standards**: `docs/standards/0002_FILE_NAMING_STANDARDS.md`
- **Agent Coding Standards**: `docs/standards/0000_AGENT_CODING_STANDARDS.md`
- **Complete Implementation**: `docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md`
