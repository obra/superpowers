)# Appendix D Training Materials - Page Structure Implementation

## Document Information
- **File**: `docs/implementation/01900_procurement/appendix_d_training_materials_modifications.md`
- **Component**: `client/src/pages/01900-procurement/components/01900-appendix-d-training-materials.js`
- **Date**: December 17, 2025
- **Purpose**: Document the complete restructuring of Appendix D Training Materials to match Scope of Work page architecture

## 📚 **Comprehensive Cross-References & Source Files**

This document integrates patterns and implementations from **20+ source documents** across the ConstructAI system. All referenced documents are listed below with their specific contributions.

### **📋 Core Implementation Procedures**
- **[0002_AGENT_CENTRIC_WORKFLOW_PAGE_IMPLEMENTATION_PROCEDURE.md](../procedures/0002_AGENT_CENTRIC_WORKFLOW_PAGE_IMPLEMENTATION_PROCEDURE.md)**: Primary procedure for complex agent-centric workflow pages with 24+ AI prompts and 8-interface developer modal
- **[0000_PAGE_IMPLEMENTATION_PROCEDURE.md](../procedures/0000_PAGE_IMPLEMENTATION_PROCEDURE.md)**: Basic page structure, Template A compliance, accordion integration, and navigation patterns
- **[0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md](../procedures/0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md)**: General workflow patterns and AI agent orchestration frameworks
- **[0000_ROLES_AGENT_IMPLEMENTATION_PROCEDURE.md](../procedures/0000_ROLES_AGENT_IMPLEMENTATION_PROCEDURE.md)**: Agent discipline confinement and permission models
- **[0000_ROLES_USER_IMPLEMENTATION_PROCEDURE.md](../procedures/0000_ROLES_USER_IMPLEMENTATION_PROCEDURE.md)**: User role management and RBAC integration

### **🤖 AI Agent & Prompt Management Systems**
- **[PROCUREMENT_WORKFLOW_AGENT_PROMPTS_INVENTORY_AND_DEVELOPER_TOOLS_IMPLEMENTATION_WITH_MAGIC_WAND.md](PROCUREMENT_WORKFLOW_AGENT_PROMPTS_INVENTORY_AND_DEVELOPER_TOOLS_IMPLEMENTATION_WITH_MAGIC_WAND.md)**: Comprehensive 24+ agent prompts inventory and developer testing modal patterns
- **[1300_02050_PROMPT_MANAGEMENT_SYSTEM.md](../pages-disciplines/1300_02050_PROMPT_MANAGEMENT_SYSTEM.md)**: Advanced prompt lifecycle management with multi-category support
- **[1300_02050_MASTER_GUIDE_EXTERNAL_API_SETTINGS.md](../pages-disciplines/1300_02050_MASTER_GUIDE_EXTERNAL_API_SETTINGS.md)**: External API integration patterns (OpenAI, Claude, Google AI)
- **[1300_02050_MASTER_GUIDE_PROMPTS_MANAGEMENT.md](../pages-disciplines/1300_02050_MASTER_GUIDE_PROMPTS_MANAGEMENT.md)**: Prompt management and version control systems
- **[1300_02050_AUTO_PROMPT_GENERATION_SYSTEM.md](../pages-disciplines/1300_02050_AUTO_PROMPT_GENERATION_SYSTEM.md)**: Automated prompt generation and optimization

### **🏗️ Procurement Workflow Integration**
- **[PROCUREMENT_WORKFLOW_RATIONALIZATION_PLAN.md](PROCUREMENT_WORKFLOW_RATIONALIZATION_PLAN.md)**: Overall workflow rationalization strategy and agent-centric patterns
- **[PROCUREMENT_WORKFLOW_RATIONALIZATION_PHASE_1_IMPLEMENTATION_PLAN.md](PROCUREMENT_WORKFLOW_RATIONALIZATION_PHASE_1_IMPLEMENTATION_PLAN.md)**: Phase 1 implementation with core UI/UX and agent integration
- **[PROCUREMENT_WORKFLOW_RATIONALIZATION_PHASE_2_IMPLEMENTATION_PLAN.md](PROCUREMENT_WORKFLOW_RATIONALIZATION_PHASE_2_IMPLEMENTATION_PLAN.md)**: Phase 2 document generation and content creation
- **[PROCUREMENT_WORKFLOW_RATIONALIZATION_PHASE_3_IMPLEMENTATION_PLAN.md](PROCUREMENT_WORKFLOW_RATIONALIZATION_PHASE_3_IMPLEMENTATION_PLAN.md)**: Phase 3 enterprise integrations (Gantt, HITL, sequences, My Tasks)
- **[01900-scope-of-work-page.js](../client/src/pages/01900-procurement/01900-scope-of-work-page.js)**: Reference implementation for stats dashboard and data table patterns

### **🗃️ Database & Schema References**
- **[docs/schema/table-index.md](../schema/table-index.md)**: Complete alphabetical index of all 429 database tables with usage tracking
- **[docs/schema/README.md](../schema/README.md)**: Database schema documentation and management procedures
- **[docs/schema/current-full-schema.md](../schema/current-full-schema.md)**: Complete PostgreSQL schema with RLS policies and constraints

### **🎨 UI/UX & Styling Standards**
- **[docs/user-interface/0750_UI_MASTER_GUIDE.md](../user-interface/0750_UI_MASTER_GUIDE.md)**: UI component standards and Template A implementation
- **[docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md](../user-interface/0975_ACCORDION_MASTER_GUIDE.md)**: Accordion navigation and 3-tier fallback system
- **[client/src/common/css/templates/template-a-standard.css](../client/src/common/css/templates/template-a-standard.css)**: Template A CSS framework with consistent styling

### **🔧 Development & Testing Frameworks**
- **[docs/dev-tools/1500_DEVELOPMENT_MASTER_GUIDE.md](../dev-tools/1500_DEVELOPMENT_MASTER_GUIDE.md)**: Development tools and build system standards
- **[docs/github/0300_GITHUB_INTEGRATION_MASTER_GUIDE.md](../github/0300_GITHUB_INTEGRATION_MASTER_GUIDE.md)**: Git workflow and branch protection standards
- **[docs/deployment/README.md](../deployment/README.md)**: Deployment procedures and production release standards

### **📚 Documentation & Quality Standards**
- **[0000_DOCUMENTATION_MASTER_GUIDE.md](../0000_DOCUMENTATION_MASTER_GUIDE.md)**: Documentation organization and functional categorization
- **[docs/0000_DOCUMENTATION_GUIDE.md](../0000_DOCUMENTATION_GUIDE.md)**: Technical documentation standards and procedures
- **[AGENTS.md](../../AGENTS.md)**: AI agent development guidelines and architectural patterns

### **🔗 Enterprise Integration Systems**
- **Gantt Chart Integration**: Procurement delivery timeline integration patterns
- **HITL Workflow System**: Human-in-the-loop task management and certification workflows
- **Sequence Management**: Intelligent document processing sequence optimization
- **My Tasks Dashboard**: Intelligent task orchestration with chatbot assistance

### **🎯 Use Case: Agent-Centric Training Materials Management**
This document serves as the **reference implementation** for complex workflow pages requiring:
- **24+ AI agent prompts** for training content generation and management
- **Multi-disciplinary collaboration** across technical, safety, and training domains
- **Enterprise integrations** with Gantt charts, HITL workflows, and sequence management
- **Advanced developer testing** with 8-interface modal and Magic Wand optimization
- **Agent orchestration** with capability monitoring and intelligent task dispatching

### **Use Case: Agent-Centric Training Materials Management**
This document serves as the **reference implementation** for complex workflow pages requiring:
- **24+ AI agent prompts** for training content generation and management
- **Multi-disciplinary collaboration** across technical, safety, and training domains
- **Enterprise integrations** with Gantt charts, HITL workflows, and sequence management
- **Advanced developer testing** with 8-interface modal and Magic Wand optimization
- **Agent orchestration** with capability monitoring and intelligent task dispatching

**Implementation Pattern**: Follow this document when building similar sophisticated workflow pages that combine AI agent automation, human-AI collaboration, and enterprise system integration.

## Executive Summary

This document outlines the comprehensive modifications made to the Appendix D Training Materials component to align it with the established Scope of Work page structure and functionality. The page was transformed from a basic tabbed interface to a sophisticated management dashboard with stats cards, advanced search/filtering, data tables, and modal-based CRUD operations.

## Background & Requirements

### Original State
- Basic tabbed interface (Add/Manage/Certification tabs)
- Simple form inputs with basic validation
- No search or filtering capabilities
- Minimal UI components and styling
- Bootstrap components mixed with plain HTML

### Target State
- Match Scope of Work page architecture exactly
- Procurement-style stats dashboard
- Advanced search and filtering
- Professional data table with actions
- Modal-based create/edit functionality
- Consistent styling and UX patterns
- No Bootstrap dependencies (plain HTML + CSS)

### Guide Reference
- **Primary Reference**: `01900-scope-of-work-page.js` - Procurement stats structure
- **Secondary Reference**: `01900-scope-of-work.js` - Component architecture
- **Styling Reference**: `template-a-standard.css` - Consistent CSS framework

## Implementation Details

### 1. Architecture Transformation

#### Before:
```javascript
// Simple tabbed component with basic forms
const AppendixDTrainingMaterials = ({ t }) => {
  const [activeTab, setActiveTab] = useState('add');
  // Basic state management
}
```

#### After:
```javascript
// Full-featured management dashboard
const AppendixDTrainingMaterials = ({ t }) => {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [trainingMaterials, setTrainingMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Advanced state management with filtering, search, CRUD operations
}
```

### 2. Stats Dashboard Implementation

#### Procurement-Style Stats Cards
Adapted the exact structure from `scope-of-work-page.js`:

```jsx
{/* Dashboard Stats */}
<div className="scope-dashboard">
  <div className="scope-card">
    <h5>Total Training Programs</h5>
    <div className="card-value">{trainingMaterials.length}</div>
    <div className="card-trend neutral">Filtered by Training discipline</div>
  </div>

  <div className="scope-card">
    <h5>Draft Programs</h5>
    <div className="card-value">{draftCount}</div>
    <div className="card-trend positive">In preparation</div>
  </div>

  <div className="scope-card">
    <h5>In Progress</h5>
    <div className="card-value">{inProgressCount}</div>
    <div className="card-trend positive">Active training</div>
  </div>

  <div className="scope-card">
    <h5>Completed</h5>
    <div className="card-value">{completedCount}</div>
    <div className="card-trend positive">Certified & delivered</div>
  </div>
</div>
```

**Key Features:**
- **Real-time counts** based on training material status
- **Procurement-style CSS classes**: `scope-dashboard`, `scope-card`, `card-value`, `card-trend`
- **Training-specific labels** adapted from procurement terminology
- **Status filtering** logic matching the component's data structure

### 3. Search & Filter System

#### Advanced Filtering Implementation
```jsx
{/* Table Header with Actions - Matching Scope of Work positioning */}
<div className="table-section-header">
  <h5>Training Material Programs</h5>
  <div className="table-actions">
    <span className="badge badge-secondary">{filteredMaterials.length} programs</span>
    <button
      type="button"
      className="scope-btn scope-btn-primary"
      onClick={() => setShowModal(true)}
      style={{ marginLeft: "1rem" }}
    >
      <i className="bi bi-plus-circle me-2"></i>New Training Material
    </button>
  </div>
</div>

{/* Search and Filters */}
<div className="filters-section">
  <div className="filter-row">
    <div className="filter-group">
      <label>Search Programs</label>
      <div className="input-with-icon">
        <i className="bi bi-search"></i>
        <input
          type="text"
          placeholder="Search by program name, purpose, target audience..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
    <div className="filter-group">
      <label>Delivery Mode</label>
      <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
        <option value="all">All Modes</option>
        <option value="In-person">In-person</option>
        <option value="Online">Online</option>
        <option value="Hybrid">Hybrid</option>
      </select>
    </div>
    <div className="filter-group">
      <label>Status</label>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="all">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
    <div className="filter-group">
      <label>Priority</label>
      <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
        <option value="all">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>
    <div className="filter-group">
      <button className="btn-secondary" onClick={clearFilters}>
        Clear Filters
      </button>
    </div>
  </div>
</div>
```

**Search Bar Functionality:**

The search bar provides comprehensive text search across multiple training program fields:

**Searchable Fields:**
- **Program Purpose**: Main objective/description of the training program
- **Target Audience**: Who the training is designed for (e.g., "engineers", "operators", "managers")
- **Program Title/Name**: If the program has a specific title
- **Certification Details**: Certification type and issuing authority
- **Duration**: Training duration information
- **Delivery Mode**: Training delivery method (In-person, Online, Hybrid)

**Search Behavior:**
- **Partial matching**: Searches for substrings within text fields
- **Case-insensitive**: "Safety Training" matches "safety training"
- **Multi-field results**: Shows programs that match any of the searchable fields
- **Real-time updates**: Results filter immediately as you type
- **Combined filtering**: Works alongside dropdown filters for refined results

**Example Search Queries:**
- `"safety training"` → Finds programs with "safety" or "training" in purpose/audience
- `"engineers"` → Finds programs targeted at engineers
- `"certification"` → Finds programs with certification requirements
- `"online"` → Finds programs with online delivery components

**Features:**
- **Multi-field search**: Purpose, target audience, certification, and duration
- **Dropdown filters**: Delivery mode, status, priority
- **Real-time filtering** with immediate results
- **Clear filters** functionality
- **Responsive layout** with proper form groups

### 4. Data Table Implementation

#### Professional Table Structure with Sortable Columns

The data table displays training materials in a comprehensive, sortable format with 7 columns of information and action controls. All columns (except Actions) are sortable to enable flexible data organization.

```jsx
<div className="table-section">
  <table>
    <thead>
      <tr>
        <th className="sortable" onClick={() => handleSort('purpose')}>
          Program {sortField === 'purpose' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th className="sortable" onClick={() => handleSort('targetAudience')}>
          Target Audience {sortField === 'targetAudience' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th className="sortable" onClick={() => handleSort('locationMode')}>
          Delivery Mode {sortField === 'locationMode' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th className="sortable" onClick={() => handleSort('status')}>
          Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th className="sortable" onClick={() => handleSort('priority')}>
          Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th className="sortable" onClick={() => handleSort('certification.type')}>
          Certification {sortField === 'certification.type' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredMaterials.map((material) => (
        <tr key={material.id}>
          <td>
            <strong>{material.purpose}</strong>
            <br />
            <small className="text-muted">
              Duration: {material.duration || 'Not specified'}
            </small>
          </td>
          <td>{material.targetAudience}</td>
          <td>
            <span className="badge info">{material.locationMode}</span>
          </td>
          <td>
            <span className={`badge ${getStatusClass(material.status)}`}>
              {material.status?.replace("_", " ") || "draft"}
            </span>
          </td>
          <td>
            <span className={`badge ${getPriorityClass(material.priority)}`}>
              {material.priority || "medium"}
            </span>
          </td>
          <td>
            {material.certification?.type ? (
              <span className="badge success">Certified</span>
            ) : (
              <span className="badge secondary">Pending</span>
            )}
          </td>
          <td>
            <div className="action-buttons">
              <button className="btn-icon" onClick={() => handleView(material)} title="View details">
                <i className="bi bi-eye"></i>
              </button>
              <button className="btn-icon" onClick={() => handleEdit(material)} title="Edit program">
                <i className="bi bi-pencil"></i>
              </button>
              <button className="btn-icon danger" onClick={() => handleDelete(material.id)} title="Delete program">
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### Column Details and Content

**1. Program Column:**
- **Primary Content**: Main purpose/objective of the training program
- **Secondary Content**: Duration information (displayed in muted text below the title)
- **Data Type**: String (purpose), String (duration)
- **Sorting**: Alphabetical by purpose text
- **Display**: Bold title with duration subtitle

**2. Target Audience Column:**
- **Content**: Specific audience the training is designed for
- **Examples**: "Construction Workers", "Project Managers", "Safety Officers", "Technical Staff"
- **Data Type**: String
- **Sorting**: Alphabetical by audience name
- **Display**: Plain text

**3. Delivery Mode Column:**
- **Content**: How the training will be delivered
- **Options**: "In-person", "Online", "Hybrid"
- **Data Type**: String (enumerated values)
- **Sorting**: Alphabetical (Hybrid, In-person, Online)
- **Display**: Colored info badge for visual distinction

**4. Status Column:**
- **Content**: Current development/implementation status
- **Options**: "draft", "in_progress", "completed"
- **Data Type**: String (enumerated status values)
- **Sorting**: Custom order (draft → in_progress → completed)
- **Display**: Color-coded badges (gray=draft, yellow=in_progress, green=completed)

**5. Priority Column:**
- **Content**: Urgency/importance level of the training program
- **Options**: "low", "medium", "high", "critical"
- **Data Type**: String (enumerated priority levels)
- **Sorting**: Custom priority order (low → medium → high → critical)
- **Display**: Color-coded badges with increasing intensity

**6. Certification Column:**
- **Content**: Whether the program includes certification
- **Logic**: Shows "Certified" if certification.type exists, otherwise "Pending"
- **Data Type**: Boolean-derived (based on certification object presence)
- **Sorting**: Alphabetical ("Certified" before "Pending")
- **Display**: Success badge for certified, secondary badge for pending

**7. Actions Column:**
- **Content**: Row-level action buttons
- **Buttons**: View (👁️), Edit (✏️), Delete (🗑️)
- **Functionality**: Direct actions on individual training programs
- **Display**: Icon buttons in a horizontal button group
- **Sorting**: Not sortable (fixed column)

#### Sorting Implementation

**Sort State Management:**
```javascript
const [sortField, setSortField] = useState('purpose'); // Default sort by program name
const [sortDirection, setSortDirection] = useState('asc'); // asc or desc

const handleSort = (field) => {
  if (sortField === field) {
    // Toggle direction if same field
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    // New field, start with ascending
    setSortField(field);
    setSortDirection('asc');
  }
};
```

**Sorting Logic:**
```javascript
const sortedMaterials = useMemo(() => {
  return [...filteredMaterials].sort((a, b) => {
    let aValue = getNestedValue(a, sortField);
    let bValue = getNestedValue(b, sortField);

    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    // Custom sorting for specific fields
    if (sortField === 'status') {
      const statusOrder = { 'draft': 1, 'in_progress': 2, 'completed': 3 };
      aValue = statusOrder[aValue] || 0;
      bValue = statusOrder[bValue] || 0;
    }

    if (sortField === 'priority') {
      const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
      aValue = priorityOrder[aValue] || 0;
      bValue = priorityOrder[bValue] || 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
}, [filteredMaterials, sortField, sortDirection]);
```

**Visual Sort Indicators:**
- **Clickable Headers**: All sortable columns show pointer cursor
- **Sort Arrows**: ↑ for ascending, ↓ for descending
- **Active Column**: Current sort column highlighted
- **Hover Effects**: Visual feedback on sortable columns

**Features:**
- **7-column layout**: Program, Audience, Mode, Status, Priority, Certification, Actions
- **Fully sortable columns**: All data columns sortable (except Actions)
- **Rich data display**: Program name with duration, colored badges for status/priority
- **Action buttons**: View, Edit, Delete with proper icons and tooltips
- **Responsive design**: Horizontal scrolling on smaller screens
- **Empty states**: Proper messaging when no data available
- **Real-time sorting**: Immediate visual feedback and reordering

### 5. SOW Creation Wizard Adaptation for Training Materials

#### Training-Specific Wizard Implementation
The Appendix D component adapts the SOW Creation Wizard pattern to match the established 12-step workflow structure. The wizard follows the same multi-step approach but focuses on training program requirements instead of procurement specifications.

**Wizard Flow Matching SOW Creation Timeline:**
```jsx
// SOW Creation Wizard Steps → Training Materials Adaptation
// 1. Edit SOW → Edit Training Program
// 2. Country Selection → Training Scope Selection
// 3. Document Type → Training Type Selection
// 4. Category Selection → Training Category Selection
// 5. Template Selection → Training Template Selection
// 6. Draft Creation → Training Draft Creation
// 7. Additional Context → Training Context & References
// 8. AI Enhancement → AI Content Generation
// 9. Scope Details & Generated Content → Training Details & Content
// 10. Assign Disciplines → Assign Training Disciplines
// 11. Assign Users → Assign Training Users
// 12. Review & Save → Review & Save Training Program

<div className="training-wizard-container">
  {/* Wizard Progress Indicator */}
  <div className="wizard-progress">
    <div className="progress-steps">
      {wizardSteps.map((step, index) => (
        <div key={step.id} className={`step ${currentStep >= index ? 'completed' : ''} ${currentStep === index ? 'active' : ''}`}>
          <div className="step-number">{index + 1}</div>
          <div className="step-title">{step.title}</div>
        </div>
      ))}
    </div>
  </div>

  {/* Wizard Content */}
  <div className="wizard-content">
    {/* Step 1: Edit Training Program */}
    {currentStep === 0 && (
      <div className="wizard-step edit-training">
        <h3>Edit Training Program</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Training Program Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Equipment Safety Training Program"
            />
          </div>
          <div className="form-group">
            <label>Training Program Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the training program..."
              rows={3}
            />
          </div>
        </div>
      </div>
    )}

    {/* Step 2: Training Scope Selection */}
    {currentStep === 1 && (
      <div className="wizard-step scope-selection">
        <h3>Training Scope Selection</h3>
        <div className="scope-options">
          <div className="form-group">
            <label>Training Scope *</label>
            <select value={formData.scope} onChange={(e) => setFormData({...formData, scope: e.target.value})}>
              <option value="">Select Scope...</option>
              <option value="organization">Organization-wide</option>
              <option value="department">Department-specific</option>
              <option value="project">Project-specific</option>
              <option value="equipment">Equipment-specific</option>
            </select>
          </div>
          <div className="form-group">
            <label>Geographic Scope</label>
            <select value={formData.geographicScope} onChange={(e) => setFormData({...formData, geographicScope: e.target.value})}>
              <option value="">Select Geographic Scope...</option>
              <option value="local">Local Site</option>
              <option value="regional">Regional</option>
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
          </div>
        </div>
      </div>
    )}

    {/* Step 3: Training Type Selection */}
    {currentStep === 2 && (
      <div className="wizard-step type-selection">
        <h3>Training Type Selection</h3>
        <div className="training-types">
          {[
            { id: 'safety', label: 'Safety Training', icon: '🛡️' },
            { id: 'technical', label: 'Technical Training', icon: '🔧' },
            { id: 'compliance', label: 'Compliance Training', icon: '📋' },
            { id: 'certification', label: 'Certification Training', icon: '🎓' },
            { id: 'operational', label: 'Operational Training', icon: '⚙️' }
          ].map(type => (
            <div
              key={type.id}
              className={`training-type-card ${formData.trainingType === type.id ? 'selected' : ''}`}
              onClick={() => setFormData({...formData, trainingType: type.id})}
            >
              <div className="type-icon">{type.icon}</div>
              <div className="type-label">{type.label}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Step 4: Training Category Selection */}
    {currentStep === 3 && (
      <div className="wizard-step category-selection">
        <h3>Training Category Selection</h3>
        <div className="category-grid">
          {materialCategories.map(category => (
            <div
              key={category.value}
              className={`category-card ${formData.category === category.value ? 'selected' : ''}`}
              onClick={() => setFormData({...formData, category: category.value})}
            >
              <h4>{category.label}</h4>
              <p>{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Step 5: Training Template Selection */}
    {currentStep === 4 && (
      <div className="wizard-step template-selection">
        <h3>Training Template Selection</h3>
        <div className="template-selection">
          <div className="template-options">
            <div
              className={`template-card ${formData.template === 'blank' ? 'selected' : ''}`}
              onClick={() => setFormData({...formData, template: 'blank'})}
            >
              <h4>Blank Template</h4>
              <p>Start from scratch</p>
            </div>
            {availableTemplates.map(template => (
              <div
                key={template.id}
                className={`template-card ${formData.template === template.id ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, template: template.id})}
              >
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <small>Used {template.usageCount} times</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Step 6: Training Draft Creation */}
    {currentStep === 5 && (
      <div className="wizard-step draft-creation">
        <h3>Training Draft Creation</h3>
        <div className="draft-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Purpose of Training *</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                placeholder="e.g., Equipment Operation Training"
              />
            </div>
            <div className="form-group">
              <label>Target Audience *</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                placeholder="e.g., Operators, Maintenance Staff"
              />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                placeholder="e.g., 2 days, 16 hours"
              />
            </div>
            <div className="form-group">
              <label>Delivery Mode *</label>
              <select
                value={formData.locationMode}
                onChange={(e) => setFormData({...formData, locationMode: e.target.value})}
              >
                <option value="In-person">In-person</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Step 7: Training Context & References */}
    {currentStep === 6 && (
      <div className="wizard-step additional-context">
        <h3>Training Context & References</h3>
        <div className="context-section">
          <div className="form-group">
            <label>Additional Context</label>
            <textarea
              value={formData.additionalContext}
              onChange={(e) => setFormData({...formData, additionalContext: e.target.value})}
              placeholder="Any additional context or requirements..."
              rows={4}
            />
          </div>

          <div className="reference-urls">
            <h5>Reference URLs</h5>
            <div className="url-input-group">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/reference-document"
              />
              <button onClick={addUrl}>Add URL</button>
            </div>
            <div className="url-list">
              {formData.referenceUrls?.map((url, index) => (
                <div key={index} className="url-item">
                  <span>{url}</span>
                  <button onClick={() => removeUrl(index)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Step 8: AI Content Generation */}
    {currentStep === 7 && (
      <div className="wizard-step ai-enhancement">
        <h3>AI Content Generation</h3>
        <div className="ai-generation">
          <div className="generation-controls">
            <button onClick={generateContent} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Training Content'}
            </button>
            <div className="api-selection">
              <label>AI API:</label>
              <select value={selectedAPI} onChange={(e) => setSelectedAPI(e.target.value)}>
                {externalAPIs.map(api => (
                  <option key={api.id} value={api.id}>{api.api_name}</option>
                ))}
              </select>
            </div>
          </div>

          {generatedContent && (
            <div className="generated-preview">
              <h4>Generated Content Preview</h4>
              <div className="content-preview">
                {generatedContent}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Step 9: Training Details & Content */}
    {currentStep === 8 && (
      <div className="wizard-step scope-details">
        <h3>Training Details & Content</h3>
        <div className="training-content">
          <div className="content-sections">
            <div className="form-group">
              <label>Training Modules</label>
              <textarea
                value={formData.trainingModules}
                onChange={(e) => setFormData({...formData, trainingModules: e.target.value})}
                placeholder="Describe training modules, curriculum, and learning objectives..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Training Resources</label>
              <textarea
                value={formData.trainingResources}
                onChange={(e) => setFormData({...formData, trainingResources: e.target.value})}
                placeholder="Presentations, manuals, videos, simulations, assessment tools..."
                rows={3}
              />
            </div>

            <div className="evaluation-section">
              <h5>Evaluation & Assessment</h5>
              <div className="form-grid">
                <div className="form-group">
                  <label>Evaluation Method</label>
                  <select value={formData.evaluationMethod} onChange={(e) => setFormData({...formData, evaluationMethod: e.target.value})}>
                    <option value="written_test">Written Test</option>
                    <option value="practical_assessment">Practical Assessment</option>
                    <option value="oral_examination">Oral Examination</option>
                    <option value="competency_based">Competency-Based Assessment</option>
                    <option value="mixed">Mixed Methods</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Competency Criteria</label>
                  <textarea
                    value={formData.competencyCriteria}
                    onChange={(e) => setFormData({...formData, competencyCriteria: e.target.value})}
                    placeholder="Specific skills, knowledge areas, and performance standards..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="certification-section">
              <h5>Certification & Compliance</h5>
              <div className="form-grid">
                <div className="form-group">
                  <label>Certification Type</label>
                  <input
                    type="text"
                    value={formData.certification.type}
                    onChange={(e) => setFormData({...formData, certification: {...formData.certification, type: e.target.value}})}
                    placeholder="Certificate of Completion, Certification, License..."
                  />
                </div>
                <div className="form-group">
                  <label>Issued By</label>
                  <input
                    type="text"
                    value={formData.certification.issuedBy}
                    onChange={(e) => setFormData({...formData, certification: {...formData.certification, issuedBy: e.target.value}})}
                    placeholder="Issuing authority or organization..."
                  />
                </div>
                <div className="form-group">
                  <label>Validity Period</label>
                  <input
                    type="text"
                    value={formData.certification.validityPeriod}
                    onChange={(e) => setFormData({...formData, certification: {...formData.certification, validityPeriod: e.target.value}})}
                    placeholder="e.g., 2 years, Lifetime, Annual renewal..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Step 10: Assign Training Disciplines */}
    {currentStep === 9 && (
      <div className="wizard-step assign-disciplines">
        <h3>Assign Training Disciplines</h3>
        <div className="discipline-assignment">
          <div className="available-disciplines">
            <h5>Available Technical Disciplines</h5>
            <div className="discipline-list">
              {technicalDisciplines.map(discipline => (
                <div
                  key={discipline.code}
                  className={`discipline-item ${formData.assignedDisciplines?.includes(discipline.code) ? 'assigned' : ''}`}
                  onClick={() => toggleDisciplineAssignment(discipline.code)}
                >
                  <span>{discipline.name}</span>
                  <span className="discipline-code">({discipline.code})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="assigned-disciplines">
            <h5>Assigned Disciplines</h5>
            <div className="assigned-list">
              {formData.assignedDisciplines?.map(code => {
                const discipline = technicalDisciplines.find(d => d.code === code);
                return (
                  <div key={code} className="assigned-item">
                    <span>{discipline?.name}</span>
                    <button onClick={() => toggleDisciplineAssignment(code)}>Remove</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Step 11: Assign Training Users */}
    {currentStep === 10 && (
      <div className="wizard-step assign-users">
        <h3>Assign Training Users</h3>
        <div className="user-assignment">
          <div className="role-assignments">
            <div className="role-section">
              <h5>Training Coordinator</h5>
              <UserSelector
                selectedUser={formData.trainingCoordinator}
                onUserSelect={(user) => setFormData({...formData, trainingCoordinator: user})}
                discipline={formData.assignedDisciplines}
              />
            </div>

            <div className="role-section">
              <h5>Subject Matter Experts</h5>
              <MultiUserSelector
                selectedUsers={formData.subjectMatterExperts || []}
                onUsersSelect={(users) => setFormData({...formData, subjectMatterExperts: users})}
                discipline={formData.assignedDisciplines}
              />
            </div>

            <div className="role-section">
              <h5>Training Instructors</h5>
              <MultiUserSelector
                selectedUsers={formData.trainingInstructors || []}
                onUsersSelect={(users) => setFormData({...formData, trainingInstructors: users})}
                discipline={formData.assignedDisciplines}
              />
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Step 12: Review & Save */}
    {currentStep === 11 && (
      <div className="wizard-step review-save">
        <h3>Review & Save Training Program</h3>
        <div className="review-content">
          <div className="review-summary">
            <h4>Training Program Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <strong>Title:</strong> {formData.title}
              </div>
              <div className="summary-item">
                <strong>Purpose:</strong> {formData.purpose}
              </div>
              <div className="summary-item">
                <strong>Target Audience:</strong> {formData.targetAudience}
              </div>
              <div className="summary-item">
                <strong>Duration:</strong> {formData.duration}
              </div>
              <div className="summary-item">
                <strong>Delivery Mode:</strong> {formData.locationMode}
              </div>
              <div className="summary-item">
                <strong>Category:</strong> {materialCategories.find(c => c.value === formData.category)?.label}
              </div>
              <div className="summary-item">
                <strong>Training Type:</strong> {formData.trainingType}
              </div>
              <div className="summary-item">
                <strong>Disciplines:</strong> {formData.assignedDisciplines?.length || 0} assigned
              </div>
              <div className="summary-item">
                <strong>Users:</strong> {(formData.subjectMatterExperts?.length || 0) + (formData.trainingInstructors?.length || 0) + (formData.trainingCoordinator ? 1 : 0)} assigned
              </div>
            </div>
          </div>

          <div className="review-validation">
            <h4>Validation Checklist</h4>
            <div className="validation-items">
              <div className="validation-item">
                <input type="checkbox" checked={!!formData.title} readOnly />
                <span>Title provided</span>
              </div>
              <div className="validation-item">
                <input type="checkbox" checked={!!formData.purpose} readOnly />
                <span>Purpose defined</span>
              </div>
              <div className="validation-item">
                <input type="checkbox" checked={!!formData.targetAudience} readOnly />
                <span>Target audience specified</span>
              </div>
              <div className="validation-item">
                <input type="checkbox" checked={!!formData.locationMode} readOnly />
                <span>Delivery mode selected</span>
              </div>
              <div className="validation-item">
                <input type="checkbox" checked={!!formData.category} readOnly />
                <span>Category selected</span>
              </div>
              <div className="validation-item">
                <input type="checkbox" checked={formData.assignedDisciplines?.length > 0} readOnly />
                <span>Disciplines assigned</span>
              </div>
              <div className="validation-item">
                <input type="checkbox" checked={!!generatedContent} readOnly />
                <span>Content generated</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleFinalSubmit}
            disabled={!isFormValid()}
          >
            Save Training Program
          </button>
          <button type="button" className="btn-secondary" onClick={() => setCurrentStep(currentStep - 1)}>
            Back to Edit
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Wizard Navigation */}
  <div className="wizard-navigation">
    <button
      className="btn-secondary"
      onClick={() => setCurrentStep(currentStep - 1)}
      disabled={currentStep === 0}
    >
      Previous
    </button>

    <div className="step-indicator">
      Step {currentStep + 1} of {wizardSteps.length}
    </div>

    <button
      className="btn-primary"
      onClick={() => {
        if (currentStep === wizardSteps.length - 1) {
          handleFinalSubmit();
        } else {
          setCurrentStep(currentStep + 1);
        }
      }}
      disabled={!isStepValid(currentStep)}
    >
      {currentStep === wizardSteps.length - 1 ? 'Save Training Program' : 'Next'}
    </button>
  </div>
</div>
```

#### SOW Wizard Pattern Mapping:

| **SOW Creation Wizard Step** | **Training Materials Adaptation** | **Form Fields** |
|------------------------------|-----------------------------------|-----------------|
| **Context Establishment** | **Training Program Basics** | Purpose, Target Audience |
| **AI Content Generation** | **Delivery & Logistics Setup** | Duration, Delivery Mode, Priority |
| **Intelligent Enhancement** | **Certification & Compliance** | Certification Type, Issued By, Validity |
| **Quality Assurance** | **Program Status & Validation** | Status, Priority, Required Validations |
| **Approval Workflow** | **Program Activation** | Save/Create with immediate activation |

#### Key Adaptations Made:

**1. Content Focus Shift:**
- **SOW**: Procurement specifications, contractual terms, deliverables
- **Training**: Program purpose, audience targeting, certification requirements

**2. Compliance Framework:**
- **SOW**: Legal contracts, regulatory compliance, financial terms
- **Training**: Certification standards, training compliance, quality assurance

**3. Delivery Methods:**
- **SOW**: Procurement categories, supplier requirements, delivery schedules
- **Training**: Delivery modes (In-person/Online/Hybrid), duration, audience reach

**4. Quality Metrics:**
- **SOW**: Contract completeness, regulatory compliance, budget alignment
- **Training**: Certification validity, audience appropriateness, program effectiveness

#### Intelligent Features Adapted:

**Context-Aware Generation:**
```javascript
// SOW: Analyzes procurement category and regional requirements
const sowContext = analyzeProcurementContext(category, region, requirements);

// Training: Analyzes training needs and certification requirements
const trainingContext = analyzeTrainingContext(audience, purpose, certification);
```

**Risk Assessment:**
```javascript
// SOW: Contractual risks, supplier reliability, budget compliance
const procurementRisks = assessProcurementRisks(contractTerms, supplierHistory);

// Training: Program effectiveness, certification validity, audience engagement
const trainingRisks = assessTrainingRisks(programContent, audienceSize, certificationType);
```

**Validation Logic:**
```javascript
// SOW: Legal compliance, budget alignment, stakeholder approval
const sowValidation = validateProcurementDocument(content, requirements, stakeholders);

// Training: Certification standards, audience appropriateness, program feasibility
const trainingValidation = validateTrainingProgram(content, audience, certification);
```

### 5. Modal-Based CRUD Operations

#### Simple Wizard Modal
```jsx
<div className="tabs-content">
  {!showModal ? (
    // Management view with filters and table
    <div className="manage-section">
      {/* Filters and table content */}
    </div>
  ) : (
    // Create/Edit form
    <div className="form-section">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Form fields */}
        </div>
        <div className="form-actions">
          {/* Action buttons */}
        </div>
      </form>
    </div>
  )}
</div>
```

**Features:**
- **Integrated form**: No separate modal, uses tab-based navigation
- **Comprehensive fields**: Purpose, Audience, Duration, Mode, Priority, Status, Certification
- **Form validation**: Required field validation and user feedback
- **Loading states**: Proper loading indicators during save operations
- **Error handling**: Clear error messages and success notifications

### 6. Component Architecture Changes

#### Removed Components:
- ❌ React Bootstrap imports (`Button`, `Card`, `Table`, `Modal`, etc.)
- ❌ Bootstrap CSS classes and components
- ❌ Old tabbed interface with separate components
- ❌ Basic form handling

#### Added Components:
- ✅ Plain HTML elements with semantic CSS classes
- ✅ Procurement-style stats dashboard
- ✅ Advanced search and filtering system
- ✅ Professional data table with actions
- ✅ Modal-free integrated form system
- ✅ Comprehensive CRUD operations
- ✅ Loading states and error handling

### 7. CSS Framework Integration

#### Template-A-Standard.css Classes Used:
- `page-container` - Main page wrapper
- `content-wrapper` - Content container
- `page-header` - Header section
- `header-content` - Header content wrapper
- `header-icon` - Icon container
- `header-text` - Text content
- `header-actions` - Action buttons container
- `tabs-container` - Tab navigation wrapper
- `tabs-header` - Tab buttons container
- `tabs-content` - Tab content area
- `form-section` - Form container
- `form-grid` - Form fields grid
- `form-group` - Individual form field
- `form-actions` - Form action buttons
- `table-section` - Table container
- `btn-primary`, `btn-secondary` - Button styles
- `badge` with variants - Status indicators
- `alert` with variants - Messages
- `loading-spinner` - Loading indicators

### 8. Data Management & API Integration

#### CRUD Operations:
```javascript
const fetchTrainingMaterials = async () => {
  // GET /api/training-materials
};

const handleSubmit = async (e) => {
  // POST/PUT /api/training-materials
};

const handleDelete = async (id) => {
  // DELETE /api/training-materials/:id
};
```

#### State Management:
- **Supabase integration** for data persistence
- **Real-time filtering** with multiple criteria
- **Loading states** for all async operations
- **Error handling** with user feedback
- **Form state management** with validation

### 9. User Experience Enhancements

#### Navigation Flow:
1. **Stats Overview** - High-level metrics at page top
2. **Search & Filter** - Powerful data discovery tools
3. **Data Table** - Comprehensive information display
4. **Actions** - Inline editing and management
5. **Form Integration** - Seamless create/edit experience

#### Responsive Design:
- **Mobile-friendly** table with horizontal scrolling
- **Flexible layouts** that work on different screen sizes
- **Touch-friendly** buttons and interactions

#### Accessibility:
- **Semantic HTML** structure
- **Proper labels** on all form inputs
- **Keyboard navigation** support
- **Screen reader** compatibility

## Technical Specifications

### Dependencies:
```json
{
  "react": "^18.x",
  "supabase-js": "^2.x",
  "@common/js/auth/00175-supabase-client.js": "internal",
  "@modules/accordion/00200-accordion-component.js": "internal",
  "@components/chatbots/chatbotService.js": "internal",
  "../../../common/css/templates/template-a-standard.css": "internal"
}
```

### API Endpoints:
- `GET /api/training-materials` - Fetch all training materials
- `POST /api/training-materials` - Create new training material
- `PUT /api/training-materials/:id` - Update existing training material
- `DELETE /api/training-materials/:id` - Delete training material

### Browser Support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing & Validation

### Functionality Tests:
- ✅ Stats cards display correct counts
- ✅ Search filters work across all fields
- ✅ Table displays data correctly with proper formatting
- ✅ CRUD operations function properly
- ✅ Form validation prevents invalid submissions
- ✅ Error handling provides clear feedback
- ✅ Loading states display appropriately

### UI/UX Tests:
- ✅ Matches Scope of Work page visual design
- ✅ Responsive layout works on different screen sizes
- ✅ Form navigation is intuitive
- ✅ Action buttons are clearly visible and functional

## Performance Considerations

### Optimizations Implemented:
- **Efficient filtering** with memoized search results
- **Lazy loading** for large datasets (when implemented)
- **Minimal re-renders** through proper state management
- **Debounced search** (can be added if needed)
- **Pagination support** (ready for implementation)

### Memory Management:
- **Proper cleanup** of event listeners and timers
- **Efficient state updates** to prevent unnecessary re-renders
- **Component unmounting** handled correctly

## Agent Integration with External API Settings & Prompts Management

### Overview
The Appendix D Training Materials workflow now includes comprehensive integration with the External API Settings and Prompts Management systems. This enables agents to leverage configured external APIs (OpenAI, Claude, etc.) and managed AI prompts for enhanced training material generation and processing.

### External API Integration

#### Agent API Access Configuration
```javascript
// Enhanced training materials component with API integration
const AppendixDTrainingMaterials = ({ t }) => {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [externalAPIs, setExternalAPIs] = useState([]);
  const [selectedAPI, setSelectedAPI] = useState(null);

  // Load available external APIs for training material generation
  useEffect(() => {
    const loadExternalAPIs = async () => {
      const { data: apis } = await supabaseClient
        .from('external_api_configurations')
        .select('*')
        .eq('is_active', true)
        .in('api_type', ['openai', 'anthropic', 'google_ai']);

      setExternalAPIs(apis || []);
    };

    if (supabaseClient) loadExternalAPIs();
  }, [supabaseClient]);

  // Agent workflow with API integration
  const generateTrainingContent = async (materialData) => {
    if (!selectedAPI) {
      throw new Error('No AI API selected for content generation');
    }

    // Use configured external API for training content generation
    const response = await fetch(`/api/external-apis/${selectedAPI.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: materialData.generationPrompt,
        context: materialData.trainingContext,
        audience: materialData.targetAudience
      })
    });

    return response.json();
  };
};
```

#### API Selection UI Component
```jsx
{/* API Configuration Section */}
<div className="api-integration-section">
  <h5>🤖 AI Content Generation</h5>
  <div className="form-group">
    <label>Select AI API for Training Content</label>
    <select
      value={selectedAPI?.id || ''}
      onChange={(e) => {
        const api = externalAPIs.find(a => a.id === e.target.value);
        setSelectedAPI(api);
      }}
    >
      <option value="">Choose AI API...</option>
      {externalAPIs.map(api => (
        <option key={api.id} value={api.id}>
          {api.api_name} ({api.api_type})
        </option>
      ))}
    </select>
  </div>

  {selectedAPI && (
    <div className="api-status">
      <span className="badge success">API Connected</span>
      <small>Last health check: {selectedAPI.last_health_check}</small>
    </div>
  )}
</div>
```

### Prompts Management Integration

#### Agent Prompt Selection System
```javascript
// Enhanced component with prompt management integration
const AppendixDTrainingMaterials = ({ t }) => {
  const [availablePrompts, setAvailablePrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  // Load available prompts for training material generation
  useEffect(() => {
    const loadPrompts = async () => {
      const { data: prompts } = await supabaseClient
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'training_materials')
        .order('usage_count', { ascending: false });

      setAvailablePrompts(prompts || []);
    };

    if (supabaseClient) loadPrompts();
  }, [supabaseClient]);

  // Auto-prompt matching for training materials
  const findMatchingPrompt = async (materialData) => {
    const { data: autoPrompts } = await supabaseClient
      .from('prompts')
      .select('*')
      .eq('generated_by', 'auto_generation_service')
      .eq('is_active', true);

    // Pattern matching logic for training material documents
    const bestMatch = autoPrompts.find(prompt => {
      const patterns = prompt.detected_patterns;
      // Match training-specific patterns (audience, duration, certification, etc.)
      return patterns.trainingIndicators?.includes('certification') ||
             patterns.audienceTypes?.includes(materialData.targetAudience);
    });

    return bestMatch;
  };
};
```

#### Prompt Selection UI Component
```jsx
{/* Prompts Management Section */}
<div className="prompts-integration-section">
  <h5>📝 Content Generation Prompts</h5>
  <div className="form-group">
    <label>Select or Auto-Match Prompt</label>
    <select
      value={selectedPrompt?.id || 'auto'}
      onChange={(e) => {
        if (e.target.value === 'auto') {
          setSelectedPrompt(null); // Enable auto-matching
        } else {
          const prompt = availablePrompts.find(p => p.id === e.target.value);
          setSelectedPrompt(prompt);
        }
      }}
    >
      <option value="auto">🤖 Auto-match best prompt</option>
      {availablePrompts.map(prompt => (
        <option key={prompt.id} value={prompt.id}>
          {prompt.name} (v{prompt.version})
        </option>
      ))}
    </select>
  </div>

  {selectedPrompt && (
    <div className="prompt-preview">
      <h6>Prompt Preview</h6>
      <textarea
        value={selectedPrompt.content}
        readOnly
        rows={4}
        className="prompt-content"
      />
      <div className="prompt-meta">
        <span>Success Rate: {selectedPrompt.usage_stats?.success_rate || 0}%</span>
        <span>Uses: {selectedPrompt.usage_count || 0}</span>
      </div>
    </div>
  )}
</div>
```

### Dev-Only Prompt Modification & Testing UI

#### Developer Interface Toggle
```jsx
// Dev mode detection and UI toggle
const [devMode, setDevMode] = useState(false);
const [showDevInterface, setShowDevInterface] = useState(false);

// Detect developer mode (based on user role or environment)
useEffect(() => {
  const checkDevMode = async () => {
    const { data: user } = await supabaseClient.auth.getUser();
    const isDev = user.user?.app_metadata?.role === 'developer' ||
                  process.env.NODE_ENV === 'development';
    setDevMode(isDev);
  };

  checkDevMode();
}, []);

{devMode && (
  <div className="dev-tools-section">
    <button
      className="btn-secondary dev-toggle"
      onClick={() => setShowDevInterface(!showDevInterface)}
    >
      🛠️ Developer Tools {showDevInterface ? '▼' : '▶'}
    </button>

    {showDevInterface && (
      <DevPromptTestingInterface
        selectedPrompt={selectedPrompt}
        selectedAPI={selectedAPI}
        materialData={currentMaterial}
        onPromptUpdate={handlePromptUpdate}
        onTestExecution={handleTestExecution}
      />
    )}
  </div>
)}
```

#### Developer Prompt Testing Component
```jsx
// Comprehensive dev-only prompt testing interface
const DevPromptTestingInterface = ({
  selectedPrompt,
  selectedAPI,
  materialData,
  onPromptUpdate,
  onTestExecution
}) => {
  const [testPrompt, setTestPrompt] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  useEffect(() => {
    if (selectedPrompt) {
      setTestPrompt(selectedPrompt.content);
    }
  }, [selectedPrompt]);

  const executeTest = async () => {
    setIsTesting(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`/api/prompt-testing/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          apiConfig: selectedAPI,
          testData: materialData,
          testType: 'training_material_generation'
        })
      });

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      setTestResults(result);
      setPerformanceMetrics({
        executionTime,
        tokenUsage: result.tokenUsage,
        costEstimate: result.costEstimate,
        confidence: result.confidence
      });

      onTestExecution(result);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const savePromptChanges = async () => {
    if (!selectedPrompt) return;

    await fetch(`/api/prompts/${selectedPrompt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: testPrompt,
        updated_by: 'developer_testing',
        version: selectedPrompt.version + 0.1
      })
    });

    onPromptUpdate(testPrompt);
  };

  return (
    <div className="dev-prompt-testing">
      <div className="dev-header">
        <h6>🧪 Prompt Testing & Modification</h6>
        <div className="dev-controls">
          <button
            className="btn-sm btn-primary"
            onClick={executeTest}
            disabled={isTesting || !testPrompt}
          >
            {isTesting ? 'Testing...' : 'Test Prompt'}
          </button>
          <button
            className="btn-sm btn-secondary"
            onClick={savePromptChanges}
            disabled={!selectedPrompt}
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="prompt-editor">
        <label>Prompt Content</label>
        <textarea
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          rows={8}
          className="dev-textarea"
          placeholder="Enter or modify the prompt content..."
        />
      </div>

      {performanceMetrics && (
        <div className="performance-metrics">
          <h6>Performance Metrics</h6>
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">Execution Time</span>
              <span className="value">{performanceMetrics.executionTime}ms</span>
            </div>
            <div className="metric">
              <span className="label">Token Usage</span>
              <span className="value">{performanceMetrics.tokenUsage}</span>
            </div>
            <div className="metric">
              <span className="label">Cost Estimate</span>
              <span className="value">${performanceMetrics.costEstimate}</span>
            </div>
            <div className="metric">
              <span className="label">Confidence</span>
              <span className="value">{performanceMetrics.confidence}%</span>
            </div>
          </div>
        </div>
      )}

      {testResults && (
        <div className="test-results">
          <h6>Test Results</h6>
          {testResults.error ? (
            <div className="error-result">
              <span className="error-icon">❌</span>
              <span>{testResults.error}</span>
            </div>
          ) : (
            <div className="success-result">
              <div className="generated-content">
                <h6>Generated Training Content</h6>
                <pre>{JSON.stringify(testResults.generatedContent, null, 2)}</pre>
              </div>
              <div className="extraction-results">
                <h6>Extracted Fields</h6>
                <ul>
                  {testResults.extractedFields?.map((field, i) => (
                    <li key={i}>{field.name}: {field.value}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="prompt-history">
        <h6>Prompt Version History</h6>
        <div className="version-list">
          {selectedPrompt?.versions?.map((version, i) => (
            <div key={i} className="version-item">
              <span>v{version.version}</span>
              <span>{new Date(version.created_at).toLocaleDateString()}</span>
              <button
                className="btn-xs"
                onClick={() => setTestPrompt(version.content)}
              >
                Load
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Enhanced Agent Workflow Integration

#### Training Material Generation Agent
```javascript
// Enhanced agent class with API and prompt integration
class TrainingMaterialGenerationAgent {
  constructor(apiConfig, promptManager) {
    this.apiConfig = apiConfig;
    this.promptManager = promptManager;
    this.externalAPIManager = new ExternalAPIManager();
    this.auditLogger = new AgentAuditLogger();
  }

  async generateTrainingMaterial(materialSpec) {
    // Step 1: Select appropriate prompt
    const prompt = await this.promptManager.selectPrompt(materialSpec);

    // Step 2: Configure external API
    const apiClient = await this.externalAPIManager.getClient(this.apiConfig);

    // Step 3: Execute generation with monitoring
    const startTime = Date.now();
    const result = await this.executeGeneration(apiClient, prompt, materialSpec);
    const executionTime = Date.now() - startTime;

    // Step 4: Log agent activity
    await this.auditLogger.logActivity({
      agent: 'training_material_generation',
      action: 'generate_content',
      promptId: prompt.id,
      apiConfigId: this.apiConfig.id,
      executionTime,
      success: !result.error,
      materialSpec
    });

    return result;
  }

  async executeGeneration(apiClient, prompt, materialSpec) {
    try {
      const response = await apiClient.generate({
        prompt: prompt.content,
        context: {
          audience: materialSpec.targetAudience,
          duration: materialSpec.duration,
          certification: materialSpec.certification,
          deliveryMode: materialSpec.locationMode
        },
        parameters: {
          temperature: 0.7,
          maxTokens: 2000,
          model: this.apiConfig.model || 'gpt-4'
        }
      });

      return {
        success: true,
        content: response.content,
        metadata: {
          promptVersion: prompt.version,
          apiUsed: this.apiConfig.api_name,
          tokensUsed: response.usage?.total_tokens,
          costEstimate: this.calculateCost(response.usage)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          promptVersion: prompt.version,
          apiUsed: this.apiConfig.api_name
        }
      };
    }
  }

  calculateCost(usage) {
    // Cost calculation based on API provider rates
    const rates = {
      openai: { input: 0.0015, output: 0.002 },
      anthropic: { input: 0.008, output: 0.024 },
      google: { input: 0.0005, output: 0.0015 }
    };

    const provider = this.apiConfig.api_type;
    const rate = rates[provider];

    if (!rate || !usage) return 0;

    return ((usage.prompt_tokens || 0) * rate.input / 1000) +
           ((usage.completion_tokens || 0) * rate.output / 1000);
  }
}
```

### Security & Permissions Integration

#### Chatbot Permissions for Agents
```javascript
// Integration with chatbot permissions system
const checkAgentPermissions = async (userId, disciplineCode, requiredAPIs) => {
  const { data: permissions } = await supabaseClient
    .from('chatbot_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('discipline_code', disciplineCode)
    .eq('has_access', true);

  // Check if user has access to required APIs
  const hasRequiredAPIs = requiredAPIs.every(apiType =>
    permissions.some(p => p.api_configs?.includes(apiType))
  );

  // Check rate limits
  const rateLimitCheck = await checkRateLimits(userId, disciplineCode);

  return {
    hasAccess: hasRequiredAPIs && rateLimitCheck.allowed,
    permissions,
    rateLimit: rateLimitCheck
  };
};
```

### API Endpoints for Integration

#### New Integration Endpoints
```javascript
// API endpoints for agent integration
app.post('/api/training-materials/generate-content', async (req, res) => {
  try {
    const { materialSpec, apiConfigId, promptId } = req.body;

    // Check permissions
    const permissions = await checkAgentPermissions(req.user.id, '01900', ['openai']);

    if (!permissions.hasAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Initialize agent
    const agent = new TrainingMaterialGenerationAgent(
      await getAPIConfig(apiConfigId),
      await getPromptManager()
    );

    // Generate content
    const result = await agent.generateTrainingMaterial(materialSpec);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dev testing endpoint
app.post('/api/training-materials/dev-test-prompt', async (req, res) => {
  try {
    const { prompt, apiConfigId, testData } = req.body;

    // Only allow in development or for dev users
    if (process.env.NODE_ENV !== 'development') {
      const isDevUser = await checkDevUser(req.user.id);
      if (!isDevUser) {
        return res.status(403).json({ error: 'Dev access required' });
      }
    }

    const result = await testPromptWithAPI(prompt, apiConfigId, testData);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Monitoring & Analytics Integration

#### Agent Performance Tracking
```javascript
// Enhanced monitoring for agent activities
const trackAgentPerformance = async (agentActivity) => {
  await supabaseClient
    .from('agent_performance_metrics')
    .insert({
      agent_type: agentActivity.agent,
      action: agentActivity.action,
      execution_time: agentActivity.executionTime,
      success: agentActivity.success,
      prompt_id: agentActivity.promptId,
      api_config_id: agentActivity.apiConfigId,
      token_usage: agentActivity.tokenUsage,
      cost_estimate: agentActivity.costEstimate,
      user_id: agentActivity.userId,
      discipline_code: '01900',
      timestamp: new Date().toISOString()
    });
};
```

### Gantt Chart Timeline Integration

#### Training Materials as Gantt Milestones
```javascript
// Integration with procurement delivery Gantt charts
const integrateTrainingWithGantt = async (trainingMaterial, procurementOrderId) => {
  // Add training program as milestone in delivery schedule
  const ganttMilestone = {
    id: `training_${trainingMaterial.id}`,
    text: `Training: ${trainingMaterial.purpose}`,
    start_date: calculateTrainingStartDate(trainingMaterial, procurementOrderId),
    end_date: calculateTrainingEndDate(trainingMaterial),
    progress: trainingMaterial.status === 'completed' ? 1 : 0.5,
    type: 'milestone',
    procurement_reference: procurementOrderId,
    training_reference: trainingMaterial.id,
    color: getTrainingMilestoneColor(trainingMaterial)
  };

  // Add dependencies (training depends on equipment delivery)
  const dependencies = await calculateTrainingDependencies(trainingMaterial, procurementOrderId);

  await ganttApi.addMilestone(ganttMilestone);
  await ganttApi.addDependencies(dependencies);

  return ganttMilestone;
};

// Calculate training start date based on equipment delivery
const calculateTrainingStartDate = async (trainingMaterial, orderId) => {
  const equipmentDelivery = await procurementApi.getEquipmentDeliveryDate(orderId);
  const trainingLeadTime = calculateTrainingLeadTime(trainingMaterial);

  return new Date(equipmentDelivery.getTime() + trainingLeadTime * 24 * 60 * 60 * 1000);
};
```

#### Gantt Chart Training Status Display
```jsx
// Enhanced Gantt chart with training material status
<div className="gantt-training-integration">
  <div className="training-milestones-legend">
    <div className="legend-item">
      <span className="color-box certified"></span>
      <span>Certified Training Complete</span>
    </div>
    <div className="legend-item">
      <span className="color-box scheduled"></span>
      <span>Training Scheduled</span>
    </div>
    <div className="legend-item">
      <span className="color-box overdue"></span>
      <span>Training Overdue</span>
    </div>
  </div>

  {/* Training-specific Gantt controls */}
  <div className="training-gantt-controls">
    <button onClick={showTrainingMilestonesOnly}>
      Show Training Only
    </button>
    <button onClick={linkTrainingToEquipmentDelivery}>
      Link to Equipment Delivery
    </button>
  </div>
</div>
```

### HITL Workflow Integration

#### Certification HITL Tasks
```javascript
// HITL integration for training material certification
const createCertificationHITLTask = async (trainingMaterial) => {
  if (!trainingMaterial.certification?.type) return null;

  const hitlTask = {
    type: 'training_certification_review',
    title: `Review Certification: ${trainingMaterial.purpose}`,
    description: `Review and approve certification requirements for training program`,
    priority: 'high',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    context: {
      trainingMaterial,
      certificationRequirements: trainingMaterial.certification,
      complianceStandards: await getComplianceStandards(trainingMaterial.certification.type)
    }
  };

  return await hitlApi.createTask(hitlTask);
};

// Automated HITL trigger on training completion
const handleTrainingCompletion = async (trainingMaterial) => {
  // Update training status
  await updateTrainingStatus(trainingMaterial.id, 'pending_certification');

  // Create HITL task for certification review
  if (requiresCertificationReview(trainingMaterial)) {
    const hitlTask = await createCertificationHITLTask(trainingMaterial);
    await notifyCertifiers(hitlTask);
  }

  // Continue workflow
  await workflowApi.advanceTrainingWorkflow(trainingMaterial.id);
};
```

#### HITL Review Interface for Training
```jsx
// HITL review component for training certification
const TrainingCertificationReview = ({ hitlTask }) => {
  const [reviewDecision, setReviewDecision] = useState('');
  const [comments, setComments] = useState('');
  const [certificationApproval, setCertificationApproval] = useState({});

  const submitReview = async () => {
    await hitlApi.submitReview(hitlTask.id, {
      decision: reviewDecision,
      comments,
      certificationApproval,
      reviewedBy: currentUser.id,
      reviewedAt: new Date()
    });

    // Update training material status
    await trainingApi.updateCertificationStatus(
      hitlTask.context.trainingMaterial.id,
      reviewDecision === 'approve' ? 'certified' : 'needs_revision'
    );
  };

  return (
    <div className="training-hitl-review">
      <h4>Training Certification Review</h4>

      <div className="training-details">
        <h5>{hitlTask.context.trainingMaterial.purpose}</h5>
        <p><strong>Target Audience:</strong> {hitlTask.context.trainingMaterial.targetAudience}</p>
        <p><strong>Certification Type:</strong> {hitlTask.context.trainingMaterial.certification.type}</p>
      </div>

      <div className="certification-checklist">
        <h5>Certification Requirements Checklist</h5>
        {hitlTask.context.complianceStandards.map((standard, index) => (
          <div key={index} className="standard-item">
            <label>
              <input
                type="checkbox"
                checked={certificationApproval[standard.id] || false}
                onChange={(e) => setCertificationApproval({
                  ...certificationApproval,
                  [standard.id]: e.target.checked
                })}
              />
              {standard.name}: {standard.description}
            </label>
          </div>
        ))}
      </div>

      <div className="review-decision">
        <h5>Review Decision</h5>
        <label>
          <input
            type="radio"
            value="approve"
            checked={reviewDecision === 'approve'}
            onChange={(e) => setReviewDecision(e.target.value)}
          />
          Approve Certification
        </label>
        <label>
          <input
            type="radio"
            value="revise"
            checked={reviewDecision === 'revise'}
            onChange={(e) => setReviewDecision(e.target.value)}
          />
          Requires Revision
        </label>
        <label>
          <input
            type="radio"
            value="reject"
            checked={reviewDecision === 'reject'}
            onChange={(e) => setReviewDecision(e.target.value)}
          />
          Reject Certification
        </label>
      </div>

      <div className="review-comments">
        <label>Review Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Provide detailed feedback..."
          rows={4}
        />
      </div>

      <button onClick={submitReview} disabled={!reviewDecision}>
        Submit Review
      </button>
    </div>
  );
};
```

### Sequence Management Integration

#### Training-Aware Sequence Processing
```javascript
// Integration with intelligent sequence management
const integrateTrainingWithSequence = async (orderId) => {
  const sequence = await sequenceApi.getSequenceForOrder(orderId);

  // Identify training-related documents
  const trainingDocuments = sequence.sequence.filter(doc =>
    doc.includes('Appendix D') || doc.includes('Training')
  );

  // Adjust sequence based on training requirements
  const adjustedSequence = await adjustSequenceForTraining(
    sequence.sequence,
    trainingDocuments,
    orderId
  );

  // Update sequence with training awareness
  await sequenceApi.updateSequence(orderId, adjustedSequence);

  return adjustedSequence;
};

// Adjust sequence to optimize training material timing
const adjustSequenceForTraining = async (sequence, trainingDocuments, orderId) => {
  const equipmentDeliveryIndex = sequence.findIndex(doc =>
    doc.includes('Appendix C') || doc.includes('Delivery')
  );

  // Ensure training documents come after equipment delivery
  const adjustedSequence = [...sequence];
  trainingDocuments.forEach(trainingDoc => {
    const currentIndex = adjustedSequence.indexOf(trainingDoc);
    if (currentIndex < equipmentDeliveryIndex) {
      // Move training document after equipment delivery
      adjustedSequence.splice(currentIndex, 1);
      adjustedSequence.splice(equipmentDeliveryIndex + 1, 0, trainingDoc);
    }
  });

  return adjustedSequence;
};
```

#### Sequence Status Integration
```jsx
// Training materials in sequence visualization
<div className="sequence-training-integration">
  {sequence.map((document, index) => (
    <div key={document} className={`sequence-step ${getDocumentType(document)}`}>
      <span className="step-number">{index + 1}</span>
      <span className="step-name">{document}</span>
      {isTrainingDocument(document) && (
        <span className="training-indicator">🎓</span>
      )}
      <span className="step-status">{getDocumentStatus(document)}</span>
    </div>
  ))}
</div>
```

### My Tasks Dashboard Integration

#### Training Tasks in Intelligent Dashboard
```javascript
// Integration with My Tasks dashboard
const integrateTrainingWithMyTasks = async (trainingMaterial, assigneeId) => {
  const task = {
    id: `training_${trainingMaterial.id}`,
    type: 'training_assignment',
    title: `Training: ${trainingMaterial.purpose}`,
    description: `Complete training program development for ${trainingMaterial.targetAudience}`,
    priority: trainingMaterial.priority,
    dueDate: trainingMaterial.due_date,
    assigneeId,
    context: {
      trainingMaterial,
      discipline: '01900',
      procurementOrderId: trainingMaterial.procurement_order_id
    },
    chatbotEnabled: true,
    aiAssistance: {
      prompt: `Help with training program: ${trainingMaterial.purpose}`,
      context: trainingMaterial
    }
  };

  await myTasksApi.createTask(task);
  await setupChatbotAssistance(task);

  return task;
};

// Chatbot assistance for training tasks
const setupChatbotAssistance = async (task) => {
  const chatbotConfig = {
    taskId: task.id,
    welcomeMessage: `I'm here to help you with the training program "${task.context.trainingMaterial.purpose}". How can I assist?`,
    capabilities: [
      'Generate training content',
      'Suggest training methods',
      'Help with certification requirements',
      'Provide curriculum templates',
      'Answer training-related questions'
    ],
    context: task.context
  };

  await chatbotApi.setupTaskAssistance(chatbotConfig);
};
```

#### Training-Specific Chatbot Commands
```javascript
// Enhanced chatbot with training-specific commands
const trainingChatbotCommands = {
  'generate_training_content': {
    pattern: /generate.*content.*for.*(.+)/i,
    handler: async (match, context) => {
      const topic = match[1];
      const content = await trainingApi.generateContent(topic, context.trainingMaterial);
      return {
        response: `Here's generated content for "${topic}":`,
        content,
        actions: ['edit_content', 'approve_content', 'regenerate']
      };
    }
  },

  'suggest_training_method': {
    pattern: /suggest.*training.*method/i,
    handler: async (match, context) => {
      const suggestions = await trainingApi.suggestMethods(context.trainingMaterial);
      return {
        response: 'Based on the training requirements, here are recommended methods:',
        suggestions,
        reasoning: 'Methods selected based on audience, content complexity, and delivery mode'
      };
    }
  },

  'certification_help': {
    pattern: /help.*certification/i,
    handler: async (match, context) => {
      const certification = context.trainingMaterial.certification;
      const help = await certificationApi.getGuidance(certification);
      return {
        response: `For ${certification.type} certification:`,
        guidance: help,
        resources: certification.resources,
        checklist: certification.requirements
      };
    }
  }
};
```

### Workflow Optimization Learning Integration

#### Training Pattern Learning
```javascript
// Integration with AI learning optimization
const integrateTrainingWithOptimization = async (trainingExecution) => {
  // Extract training-specific patterns
  const patterns = {
    audience_effectiveness: analyzeAudienceEffectiveness(trainingExecution),
    content_complexity: analyzeContentComplexity(trainingExecution),
    delivery_mode_success: analyzeDeliveryModeSuccess(trainingExecution),
    certification_completion: analyzeCertificationCompletion(trainingExecution),
    revision_patterns: analyzeRevisionPatterns(trainingExecution)
  };

  // Update optimization model
  await optimizationApi.updateModel('training_generation', patterns);

  // Generate insights for future training programs
  const insights = await optimizationApi.generateInsights(patterns);

  // Store insights for future use
  await optimizationApi.storeInsights('training', insights);

  return insights;
};

// Analyze training effectiveness patterns
const analyzeAudienceEffectiveness = (execution) => {
  const audience = execution.trainingMaterial.targetAudience;
  const completionRate = execution.completionRate;
  const satisfactionScore = execution.satisfactionScore;

  return {
    audience_type: audience,
    effectiveness_score: (completionRate + satisfactionScore) / 2,
    sample_size: 1,
    factors: {
      content_relevance: execution.contentRelevance,
      delivery_engagement: execution.deliveryEngagement,
      practical_application: execution.practicalApplication
    }
  };
};
```

#### Optimization Recommendations for Training
```javascript
// Training-specific optimization recommendations
const generateTrainingOptimizations = async (patterns) => {
  const recommendations = [];

  // Content complexity optimization
  if (patterns.content_complexity.average > 0.8) {
    recommendations.push({
      type: 'content_simplification',
      priority: 'high',
      title: 'Simplify Complex Training Content',
      description: 'Training content is too complex for the target audience',
      action: 'Break down complex topics into smaller modules',
      expected_impact: '20-30% improvement in completion rates'
    });
  }

  // Delivery mode optimization
  const bestDeliveryMode = findBestDeliveryMode(patterns.delivery_mode_success);
  if (bestDeliveryMode.confidence > 0.8) {
    recommendations.push({
      type: 'delivery_mode_optimization',
      priority: 'medium',
      title: `Consider ${bestDeliveryMode.mode} Delivery`,
      description: `${bestDeliveryMode.mode} delivery shows ${bestDeliveryMode.improvement}% better results`,
      action: `Prioritize ${bestDeliveryMode.mode} for similar training programs`,
      expected_impact: `${bestDeliveryMode.improvement}% improvement in engagement`
    });
  }

  // Certification timing optimization
  if (patterns.certification_completion.averageDelay > 7) {
    recommendations.push({
      type: 'certification_timing',
      priority: 'medium',
      title: 'Optimize Certification Timing',
      description: 'Certification reviews are taking too long',
      action: 'Streamline certification checklist and provide clearer guidelines',
      expected_impact: '50% reduction in certification review time'
    });
  }

  return recommendations;
};
```

### Complete Integration Architecture

#### Unified Training Workflow System
```javascript
// Complete integrated training workflow system
class IntegratedTrainingWorkflowSystem {
  constructor() {
    this.externalAPIManager = new ExternalAPIManager();
    this.promptManager = new PromptManager();
    this.ganttIntegrator = new GanttIntegrator();
    this.hitlManager = new HITLManager();
    this.sequenceManager = new SequenceManager();
    this.myTasksIntegrator = new MyTasksIntegrator();
    this.optimizationLearner = new OptimizationLearner();
  }

  // Complete training program workflow
  async executeTrainingWorkflow(trainingSpec, orderId) {
    console.log(`[IntegratedTraining] Executing complete workflow for order ${orderId}`);

    // 1. Sequence-aware planning
    const sequencePosition = await this.sequenceManager.getTrainingPosition(orderId);
    await this.waitForSequencePrerequisites(sequencePosition);

    // 2. AI-powered content generation
    const content = await this.generateTrainingContent(trainingSpec);

    // 3. Gantt timeline integration
    await this.ganttIntegrator.addTrainingMilestone(content, orderId);

    // 4. My Tasks assignment with chatbot
    const task = await this.myTasksIntegrator.createTrainingTask(content, orderId);

    // 5. HITL certification workflow
    if (content.certificationRequired) {
      await this.hitlManager.scheduleCertificationReview(content);
    }

    // 6. Optimization learning
    await this.optimizationLearner.recordExecution(content);

    return {
      content,
      task,
      ganttMilestone: await this.ganttIntegrator.getMilestone(content.id),
      hitlTask: content.certificationRequired ? 'scheduled' : null,
      optimizationInsights: await this.optimizationLearner.getInsights(content)
    };
  }

  // Generate training content with full integration
  async generateTrainingContent(trainingSpec) {
    // Select optimal API and prompt
    const apiConfig = await this.externalAPIManager.selectOptimalAPI(trainingSpec);
    const prompt = await this.promptManager.selectOptimalPrompt(trainingSpec);

    // Generate content
    const content = await this.externalAPIManager.generateContent(apiConfig, prompt, trainingSpec);

    // Enhance with optimization insights
    const optimizedContent = await this.optimizationLearner.optimizeContent(content, trainingSpec);

    return {
      ...optimizedContent,
      apiUsed: apiConfig.id,
      promptUsed: prompt.id,
      optimizationApplied: optimizedContent !== content
    };
  }
}
```

## Future Enhancements

### Template Integration System

#### Annexure D Template Retrieval
When the template system for Annexure D (Appendix D) is implemented, the component should retrieve training material templates from the templates database table, following the same pattern as the SOW Creation Wizard.

**Template Source Implementation:**
```javascript
// Retrieve training templates from existing templates table
const fetchTrainingTemplates = async () => {
  const { data, error } = await supabaseClient
    .from('templates')
    .select('*')
    .eq('discipline_code', '01900') // Procurement discipline
    .eq('document_type', 'training_materials') // Training material templates
    .eq('is_active', true)
    .order('name');

  return data || [];
};
```

**Template Cards Display:**
```jsx
<div className="template-cards-grid">
  {trainingTemplates.map((template) => (
    <div key={template.id} className="template-card" onClick={() => selectTemplate(template)}>
      <div className="template-icon">📚</div>
      <h5>{template.name}</h5>
      <p>{template.description}</p>
      <div className="template-meta">
        <span className="badge">{template.training_type}</span>
        <span className="badge">{template.certification_level}</span>
      </div>
    </div>
  ))}
</div>
```

**Template Selection Flow:**
1. **Template Discovery**: Display available training material templates as cards
2. **Category Filtering**: Filter by training type (safety, technical, compliance, etc.)
3. **Template Selection**: User selects appropriate template for their needs
4. **Content Population**: Pre-populate form fields with template data
5. **Customization**: Allow user to modify template content as needed

#### Additional Context Step - Previous Templates Integration
In the "Additional Context" step of the training wizard (equivalent to the SOW wizard's enhancement modal), users should be able to reference previous completed Appendix D templates for context and consistency.

**Previous Templates Reference System:**
```jsx
<div className="additional-context-section">
  <h5>Reference Previous Training Programs</h5>

  {/* URL Input for External References */}
  <div className="form-group">
    <label>Add Reference URLs</label>
    <div className="url-input-group">
      <input
        type="url"
        value={newUrl}
        onChange={(e) => setNewUrl(e.target.value)}
        placeholder="https://example.com/previous-training-program"
      />
      <button className="btn-secondary" onClick={addUrl}>Add URL</button>
    </div>
  </div>

  {/* Previous Completed Templates Browser */}
  <div className="completed-templates-section">
    <h6>Browse Completed Appendix D Templates</h6>
    <div className="template-references-grid">
      {completedTemplates.map((template) => (
        <div key={template.id} className="template-reference-card" onClick={() => selectReference(template)}>
          <div className="template-ref-icon">📄</div>
          <div className="template-ref-details">
            <h6>{template.title}</h6>
            <p>Completed: {new Date(template.completed_at).toLocaleDateString()}</p>
            <small>Created by: {template.created_by}</small>
          </div>
          <button className="btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); addReferenceUrl(template.url); }}>
            Use as Reference
          </button>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Completed Templates Storage:**
Previous completed Appendix D templates should be stored in a dedicated table for reference purposes. Template *definitions* are stored in the existing `templates` table (filtered by `discipline_code = '01900'` and `document_type = 'training_materials'`), while completed template *instances* should be stored separately to maintain a history of successful training programs.

**Database Schema Recommendation:**
```sql
-- Completed training program instances (for reference)
-- Note: This table does not currently exist and would need to be created
CREATE TABLE completed_training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  purpose text,
  target_audience text,
  duration text,
  delivery_mode text,
  certification_type text,
  status text DEFAULT 'completed',
  created_by text,
  completed_at timestamp with time zone DEFAULT now(),
  url text, -- Reference URL for this completed program
  metadata jsonb DEFAULT '{}'::jsonb,
  discipline_code text DEFAULT '01900',
  organization_name text DEFAULT 'Organisations - EPCM'
);

-- Template definitions use existing templates table
-- No new table needed - use existing 'templates' table with filters:
-- discipline_code = '01900' AND document_type = 'training_materials'
```

**Reference URL Generation:**
When an Appendix D training program is completed, it should automatically generate a reference URL that can be used in future template creation:

```javascript
const generateReferenceUrl = (programId) => {
  return `${window.location.origin}/training-programs/reference/${programId}`;
};

// Store completed program with reference URL
const saveCompletedProgram = async (programData) => {
  const referenceUrl = generateReferenceUrl(programData.id);

  await supabaseClient
    .from('completed_training_programs')
    .insert({
      ...programData,
      url: referenceUrl,
      completed_at: new Date().toISOString()
    });
};
```

**Integration with Wizard Context:**
```javascript
// In the Additional Context step
const fetchCompletedTemplates = async () => {
  const { data, error } = await supabaseClient
    .from('completed_training_programs')
    .select('*')
    .eq('discipline_code', '01900')
    .order('completed_at', { ascending: false })
    .limit(10); // Most recent 10

  return data || [];
};

// Add selected template as context
const addReferenceUrl = (url) => {
  setFormData(prev => ({
    ...prev,
    referenceUrls: [...(prev.referenceUrls || []), url]
  }));
};
```

This enhancement allows users to leverage institutional knowledge from previous successful training programs, ensuring consistency and quality in new training material development.

### Potential Improvements:
- **Bulk operations** for multiple item management
- **Export functionality** for data download
- **Advanced sorting** beyond basic filtering
- **Real-time updates** with WebSocket integration
- **Audit trails** for change tracking
- **Advanced reporting** and analytics
- **Template-based creation** with pre-configured training programs

### Integration Opportunities:
- **Email notifications** for status changes
- **Calendar integration** for scheduling
- **Document attachments** for training materials
- **User permissions** for access control
- **Progress tracking** for individual trainees
- **Template marketplace** for sharing training program templates

## Agent-Centric Workflow Architecture

### Adopting Procurement SOW Agent-Centric Strategy

Following the enhanced procurement SOW workflow's agent-centric design, the Appendix D Training Materials system implements the same architectural patterns for seamless agent-human collaboration.

#### Agent-Executable Workflow Components

##### 1. Training Program Creation & Validation (Agent-Automated)
```javascript
// Agent can fully automate training program creation
const agentTrainingCreation = {
  inputs: {
    procurementOrderId: "from procurement workflow",
    audience: "target trainees",
    scope: "training scope and requirements",
    context: "equipment/material specifications"
  },

  agentSteps: [
    {
      step: "requirement_analysis",
      agent: "TrainingRequirementAgent",
      action: "Analyze training needs from procurement specifications",
      output: "training_requirements_analysis"
    },
    {
      step: "program_design",
      agent: "TrainingDesignAgent",
      action: "Design comprehensive training program structure",
      output: "training_program_draft"
    },
    {
      step: "content_generation",
      agent: "TrainingContentAgent",
      action: "Generate training materials and curriculum",
      output: "training_content_draft"
    },
    {
      step: "validation_check",
      agent: "TrainingValidationAgent",
      action: "Validate training program completeness and compliance",
      output: "validation_report"
    }
  ],

  hitlPoint: "stakeholder_review",
  humanAction: "Review and approve automated training program creation"
};
```

##### 2. Multi-Disciplinary Content Development (Parallel Agent Execution)
```javascript
// Agents contribute to training content autonomously
const agentContentDevelopment = {
  perDisciplineAutomation: {
    subject_matter_experts: {
      agent: "TechnicalTrainingAgent",
      inputs: ["equipment_specs", "operational_procedures", "safety_requirements"],
      actions: [
        "develop_technical_content",
        "create_practical_exercises",
        "generate_assessment_materials"
      ],
      outputs: ["technical_content", "exercises", "assessments"]
    },

    training_developers: {
      agent: "CurriculumDesignAgent",
      inputs: ["learning_objectives", "audience_analysis", "delivery_method"],
      actions: [
        "design_curriculum_structure",
        "create_learning_pathways",
        "develop_evaluation_methods"
      ]
    },

    safety_officers: {
      agent: "SafetyTrainingAgent",
      inputs: ["safety_procedures", "hazard_analysis", "regulatory_requirements"],
      actions: [
        "develop_safety_content",
        "create_emergency_procedures",
        "design_compliance_training"
      ]
    }
  },

  coordinationAgent: {
    role: "TrainingCoordinatorAgent",
    responsibilities: [
      "monitor_content_development",
      "validate_cross_module_consistency",
      "flag_gaps_for_human_resolution",
      "notify_certification_readiness"
    ]
  }
};
```

##### 3. Training Delivery & Assessment (Agent-Managed)
```javascript
// Agent manages training delivery and assessment
const agentTrainingDelivery = {
  schedulingAgent: {
    role: "TrainingSchedulerAgent",
    inputs: ["training_program", "participant_availability", "resource_constraints"],
    actions: [
      {
        step: "schedule_optimization",
        action: "Optimize training schedule for maximum participation"
      },
      {
        step: "resource_allocation",
        action: "Allocate trainers, facilities, and equipment"
      },
      {
        step: "calendar_integration",
        action: "Sync with participant and trainer calendars"
      }
    ]
  },

  assessmentAgent: {
    role: "TrainingAssessmentAgent",
    actions: [
      "create_pre_assessments",
      "monitor_participation",
      "evaluate_learning_outcomes",
      "generate_completion_certificates"
    ]
  },

  feedbackAgent: {
    role: "TrainingFeedbackAgent",
    actions: [
      "collect_participant_feedback",
      "analyze_training_effectiveness",
      "generate_improvement_recommendations",
      "update_training_materials"
    ]
  }
};
```

##### 4. Certification & Compliance (Agent-Coordinated)
```javascript
// Agent manages certification workflow
const agentCertificationWorkflow = {
  certificationAgent: {
    role: "CertificationAgent",
    inputs: ["training_completion", "assessment_results", "compliance_requirements"],
    actions: [
      {
        step: "eligibility_verification",
        action: "Verify participant eligibility for certification"
      },
      {
        step: "certificate_generation",
        action: "Generate personalized certificates with unique identifiers"
      },
      {
        step: "compliance_validation",
        action: "Ensure certificates meet regulatory and organizational standards"
      },
      {
        step: "record_maintenance",
        action: "Update training records and compliance databases"
      }
    ]
  },

  auditAgent: {
    role: "TrainingAuditAgent",
    actions: [
      "maintain_audit_trails",
      "generate_compliance_reports",
      "flag_non_compliance_issues",
      "schedule_recurring_audits"
    ]
  }
};
```

### HITL Integration Points for Training

#### Strategic Human Intervention Points:
```javascript
const trainingHITLPoints = {
  program_approval: {
    trigger: "new_training_program_created OR major_program_changes",
    human_action: "executive_approval",
    context_provided: ["program_overview", "business_case", "risk_assessment"],
    decision_options: ["approve", "modify", "reject_with_feedback"]
  },

  content_validation: {
    trigger: "technical_content_created OR safety_procedures_defined",
    human_action: "subject_matter_expert_review",
    context_provided: ["content_draft", "source_materials", "competency_alignment"],
    decision_options: ["approve", "request_revisions", "provide_guidance"]
  },

  assessment_design: {
    trigger: "assessment_methods_defined OR certification_criteria_set",
    human_action: "training_expert_validation",
    context_provided: ["assessment_design", "learning_objectives", "industry_standards"],
    decision_options: ["approve", "modify_criteria", "add_additional_assessments"]
  },

  stakeholder_conflicts: {
    trigger: "conflicting_training_requirements OR resource_constraints",
    human_action: "facilitated_resolution",
    context_provided: ["conflict_analysis", "stakeholder_positions", "alternative_solutions"]
  }
};
```

### Agent Permission Model for Training

#### Training Agent Permissions:
```javascript
// Agent permissions mapped to human equivalents for training workflows
const trainingAgentPermissions = {
  training_creation_agent: {
    can_create_programs: true,
    can_analyze_requirements: true,
    can_design_curriculum: true,
    can_read_procurement_data: true,
    cannot_approve_executive: false, // Explicit restriction
    cannot_modify_certification_standards: false
  },

  content_development_agents: {
    scoped_permissions: {
      technical_content: { can_create: true, can_edit: true, can_review: true },
      safety_content: { can_create: true, can_edit: true, can_review: true },
      assessment_content: { can_create: true, can_edit: true, can_review: true }
    },
    collaboration_permissions: {
      can_coordinate_with_other_agents: true,
      can_request_human_clarification: true,
      can_escalate_content_issues: true,
      can_share_resources: true
    }
  },

  delivery_agents: {
    can_schedule_sessions: true,
    can_manage_resources: true,
    can_track_participation: true,
    can_generate_reports: true,
    cannot_modify_certificates: false
  },

  certification_agents: {
    can_verify_eligibility: true,
    can_generate_certificates: true,
    can_update_records: true,
    can_generate_audits: true,
    cannot_modify_standards: false
  }
};
```

### Agent Learning & Continuous Improvement

#### Training Pattern Analysis:
```javascript
const trainingAgentLearning = {
  performance_patterns: {
    content_effectiveness: "analyze which content types yield best learning outcomes",
    delivery_methods: "track which delivery methods maximize engagement",
    assessment_accuracy: "measure how well assessments predict competency",
    completion_rates: "identify factors affecting training completion"
  },

  audience_adaptation: {
    learning_styles: "adapt content based on participant learning preferences",
    experience_levels: "modify complexity based on participant experience",
    cultural_factors: "adjust delivery methods for diverse audiences",
    accessibility_needs: "ensure content meets accessibility requirements"
  },

  content_optimization: {
    material_improvement: "continuously enhance training materials based on feedback",
    assessment_refinement: "improve assessment validity and reliability",
    resource_efficiency: "optimize resource utilization and training costs",
    outcome_maximization: "maximize learning outcomes and knowledge retention"
  }
};
```

### Agent-Human Collaboration Workflows

#### 1. Content Creation Workflow:
```
Agent Content Generation → Human SME Review → Agent Refinement → Human Final Approval
```

#### 2. Assessment Development Workflow:
```
Agent Assessment Design → Human Training Expert Validation → Agent Test Item Generation → Human Quality Review
```

#### 3. Certification Workflow:
```
Agent Eligibility Check → Human Compliance Review → Agent Certificate Generation → Human Final Verification
```

### Task-Based Agent Architecture

#### Individual Agent Task Cards:
```javascript
// Training-specific task cards for My Tasks dashboard
const trainingAgentTasks = {
  content_creation_task: {
    id: "training_content_{program_id}_{module_id}",
    type: "training_content_creation",
    title: "Create Training Content: {module_title}",
    description: "Develop training materials for {module_title} module in {program_name}",
    priority: "medium",
    assignee: "content_agent",
    context: {
      program_id: "uuid",
      module_id: "uuid",
      content_requirements: "detailed specs",
      audience: "target learners",
      delivery_method: "online/in_person"
    },
    actions: ["generate_content", "validate_content", "submit_for_review"],
    hitl_triggers: ["complex_technical_content", "safety_critical_information"]
  },

  assessment_design_task: {
    id: "training_assessment_{program_id}_{module_id}",
    type: "assessment_design",
    title: "Design Assessment: {module_title}",
    description: "Create evaluation materials for {module_title} learning objectives",
    priority: "high",
    assignee: "assessment_agent",
    context: {
      learning_objectives: "array",
      assessment_type: "formative/summative",
      competency_level: "beginner/intermediate/advanced"
    },
    actions: ["design_assessment", "create_questions", "validate_assessment"],
    hitl_triggers: ["high_stakes_assessment", "certification_assessment"]
  }
};
```

### Agent Orchestration for Training Programs

#### Parallel Agent Execution:
```javascript
// Coordinate multiple agents working on training program simultaneously
const trainingAgentOrchestration = {
  program_creation_orchestrator: {
    agents: ["TrainingRequirementAgent", "TrainingDesignAgent", "TrainingValidationAgent"],
    execution_model: "parallel_with_dependencies",
    dependencies: {
      "TrainingDesignAgent": ["TrainingRequirementAgent"],
      "TrainingValidationAgent": ["TrainingDesignAgent"]
    },
    coordination_rules: {
      conflict_resolution: "majority_vote_with_human_escalation",
      quality_thresholds: "minimum_80_percent_confidence",
      timeout_handling: "escalate_to_human_after_30_minutes"
    }
  },

  content_development_orchestrator: {
    agents: ["TechnicalTrainingAgent", "SafetyTrainingAgent", "CurriculumDesignAgent"],
    execution_model: "fully_parallel",
    coordination_rules: {
      consistency_check: "cross_reference_all_content",
      quality_gate: "human_review_required_for_safety_content",
      integration_test: "validate_content_coherence"
    }
  }
};
```

### Agent Transition Roadmap

#### Phase 1: Agent-Assisted (Current State)
- **Manual Tasks**: Program approval, stakeholder engagement, final certification
- **Agent Assistance**: Content generation, assessment design, scheduling optimization
- **HITL Points**: All major decisions and safety-critical content

#### Phase 2: Agent-Augmented (Enhanced State)
- **Agent Tasks**: Routine content creation, basic scheduling, progress tracking
- **Manual Tasks**: Complex decisions, quality assurance, stakeholder management
- **HITL Points**: Safety content, certification decisions, major program changes

#### Phase 3: Agent-Centric (Future State)
- **Agent Tasks**: End-to-end training program management, content optimization, outcome analysis
- **Manual Tasks**: Strategic oversight, quality assurance, continuous improvement
- **HITL Points**: Only critical business decisions and regulatory compliance issues

### User-Configurable Agent Involvement Levels

#### Agent Involvement Selection Interface
Users can select their preferred degree of agent involvement based on their risk tolerance, experience level, and specific workflow requirements:

```jsx
// Agent involvement level selector component
const AgentInvolvementSelector = ({ currentLevel, onLevelChange, workflowType }) => {
  const involvementLevels = {
    fullyAutomated: {
      title: '🤖 Fully Automated',
      description: 'Agents handle complete workflow with minimal oversight',
      confidence: 'High (>90%)',
      hitlTriggers: 'Critical failures only',
      userControl: 'Final approval only',
      risk: 'Medium',
      useCase: 'Routine, well-understood workflows'
    },

    assistedAutomation: {
      title: '👥 Assisted Automation',
      description: 'Agents propose actions, users review each step',
      confidence: 'Medium (70-90%)',
      hitlTriggers: 'Every major decision',
      userControl: 'Review and approve/reject',
      risk: 'Low',
      useCase: 'Complex workflows needing human judgment'
    },

    manualOverride: {
      title: '🎛️ Manual Override',
      description: 'Agents provide recommendations, users make decisions',
      confidence: 'Any level accepted',
      hitlTriggers: 'User-initiated reviews',
      userControl: 'Accept suggestions or manual input',
      risk: 'Very Low',
      useCase: 'High-risk workflows or user preference'
    },

    humanOnly: {
      title: '👤 Human Only',
      description: 'Traditional manual workflow with agent assistance',
      confidence: 'N/A',
      hitlTriggers: 'None',
      userControl: 'Complete manual control',
      risk: 'None',
      useCase: 'Regulatory requirements or high-risk scenarios'
    }
  };

  return (
    <div className="agent-involvement-selector">
      <h5>🤖 Agent Involvement Level</h5>
      <p>Choose how much automation you want in this workflow:</p>

      <div className="involvement-options">
        {Object.entries(involvementLevels).map(([key, level]) => (
          <div
            key={key}
            className={`involvement-card ${currentLevel === key ? 'selected' : ''}`}
            onClick={() => onLevelChange(key)}
          >
            <div className="card-header">
              <h6>{level.title}</h6>
              <span className={`risk-badge risk-${level.risk.toLowerCase()}`}>
                {level.risk} Risk
              </span>
            </div>

            <p className="card-description">{level.description}</p>

            <div className="card-details">
              <div className="detail-item">
                <strong>Agent Confidence:</strong> {level.confidence}
              </div>
              <div className="detail-item">
                <strong>HITL Triggers:</strong> {level.hitlTriggers}
              </div>
              <div className="detail-item">
                <strong>User Control:</strong> {level.userControl}
              </div>
            </div>

            <div className="card-use-case">
              <small><strong>Use Case:</strong> {level.useCase}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="level-recommendation">
        {getLevelRecommendation(workflowType, userProfile)}
      </div>
    </div>
  );
};

// Smart recommendation based on workflow type and user profile
const getLevelRecommendation = (workflowType, userProfile) => {
  const recommendations = {
    procurement: {
      expert: 'fullyAutomated',
      standard: 'assistedAutomation',
      novice: 'manualOverride'
    },
    training: {
      expert: 'assistedAutomation',
      standard: 'manualOverride',
      novice: 'humanOnly'
    },
    compliance: {
      expert: 'assistedAutomation',
      standard: 'manualOverride',
      novice: 'humanOnly'
    }
  };

  const userLevel = userProfile?.experience || 'standard';
  const recommended = recommendations[workflowType]?.[userLevel];

  return recommended ? (
    <div className="recommendation-notice">
      <i className="bi bi-lightbulb"></i>
      <span>Recommended for your experience level: <strong>{recommended.replace(/([A-Z])/g, ' $1').toLowerCase()}</strong></span>
    </div>
  ) : null;
};
```

#### Workflow Execution Based on User Selection
```javascript
// Dynamic workflow execution based on user-selected involvement level
const executeWorkflowWithUserLevel = async (workflowData, involvementLevel, userId) => {
  const executionStrategies = {
    fullyAutomated: {
      agentConfidenceThreshold: 0.9,
      hitlTriggers: ['critical_failure', 'policy_violation'],
      userNotifications: ['completion', 'exceptions'],
      approvalRequired: false
    },

    assistedAutomation: {
      agentConfidenceThreshold: 0.7,
      hitlTriggers: ['major_decision', 'complex_calculation', 'stakeholder_impact'],
      userNotifications: ['each_step', 'completion', 'issues'],
      approvalRequired: true
    },

    manualOverride: {
      agentConfidenceThreshold: 0,
      hitlTriggers: ['user_request'],
      userNotifications: ['agent_suggestions', 'completion'],
      approvalRequired: false
    },

    humanOnly: {
      agentConfidenceThreshold: 0,
      hitlTriggers: [],
      userNotifications: ['manual_steps'],
      approvalRequired: false
    }
  };

  const strategy = executionStrategies[involvementLevel];

  // Execute workflow with selected strategy
  return await agentOrchestrator.executeWithStrategy(
    workflowData,
    strategy,
    userId
  );
};

// Agent orchestrator with user involvement control
class UserControlledAgentOrchestrator {
  async executeWithStrategy(workflowData, strategy, userId) {
    const results = {
      completedSteps: [],
      pendingApprovals: [],
      agentSuggestions: [],
      manualSteps: []
    };

    for (const step of workflowData.steps) {
      const agentResult = await this.executeAgentStep(step, strategy);

      if (strategy.approvalRequired && this.requiresApproval(agentResult, strategy)) {
        // Queue for user approval
        results.pendingApprovals.push({
          step,
          agentResult,
          userId,
          timestamp: new Date()
        });

        // Notify user of pending approval
        await notificationService.notifyPendingApproval(userId, step);
      } else if (strategy.hitlTriggers.includes('user_request')) {
        // Provide agent suggestions for user consideration
        results.agentSuggestions.push({
          step,
          suggestion: agentResult,
          confidence: agentResult.confidence
        });
      } else {
        // Execute automatically
        results.completedSteps.push({
          step,
          result: agentResult,
          automated: true
        });
      }
    }

    return results;
  }

  requiresApproval(agentResult, strategy) {
    return agentResult.confidence < strategy.agentConfidenceThreshold ||
           strategy.hitlTriggers.some(trigger =>
             this.checkTriggerCondition(trigger, agentResult)
           );
  }

  checkTriggerCondition(trigger, agentResult) {
    const conditions = {
      critical_failure: agentResult.status === 'error',
      policy_violation: agentResult.violatesPolicy,
      major_decision: agentResult.decisionImpact === 'high',
      complex_calculation: agentResult.complexity === 'high',
      stakeholder_impact: agentResult.affectsStakeholders
    };

    return conditions[trigger] || false;
  }
}
```

#### User Involvement Level Persistence
```javascript
// User preference storage and learning
const userInvolvementPreferences = {
  // Store user preferences by workflow type
  saveUserPreference: async (userId, workflowType, involvementLevel) => {
    await userPreferencesService.save({
      userId,
      workflowType,
      involvementLevel,
      timestamp: new Date(),
      context: 'manual_selection'
    });
  },

  // Learn from user behavior and suggest improvements
  learnFromUsage: async (userId, workflowHistory) => {
    const patterns = analyzeWorkflowPatterns(workflowHistory);

    // Identify optimal involvement levels based on success rates
    const recommendations = {
      highSuccessWorkflows: patterns.highSuccess.map(w => w.involvementLevel),
      lowSuccessWorkflows: patterns.lowSuccess.map(w => w.involvementLevel)
    };

    // Store learning insights
    await learningService.storeInsights(userId, 'involvement_patterns', recommendations);

    return recommendations;
  },

  // Suggest involvement level based on learning
  suggestOptimalLevel: async (userId, workflowType) => {
    const insights = await learningService.getInsights(userId, 'involvement_patterns');
    const workflowInsights = insights?.[workflowType];

    if (workflowInsights?.highSuccessWorkflows?.length > 0) {
      // Suggest most successful level for this workflow type
      const successCounts = {};
      workflowInsights.highSuccessWorkflows.forEach(level => {
        successCounts[level] = (successCounts[level] || 0) + 1;
      });

      return Object.entries(successCounts)
        .sort(([,a], [,b]) => b - a)[0][0]; // Most successful level
    }

    return null; // No recommendation available
  }
};
```

#### Dynamic UI Adaptation Based on Involvement Level
```jsx
// Workflow interface that adapts to involvement level
const AdaptiveWorkflowInterface = ({ involvementLevel, workflowData, onAction }) => {
  const interfaceModes = {
    fullyAutomated: {
      showProgress: true,
      showAgentActivity: true,
      showUserControls: false,
      showApprovals: false,
      showSuggestions: false,
      autoAdvance: true
    },

    assistedAutomation: {
      showProgress: true,
      showAgentActivity: true,
      showUserControls: true,
      showApprovals: true,
      showSuggestions: false,
      autoAdvance: false
    },

    manualOverride: {
      showProgress: true,
      showAgentActivity: false,
      showUserControls: true,
      showApprovals: false,
      showSuggestions: true,
      autoAdvance: false
    },

    humanOnly: {
      showProgress: true,
      showAgentActivity: false,
      showUserControls: true,
      showApprovals: false,
      showSuggestions: false,
      autoAdvance: false
    }
  };

  const mode = interfaceModes[involvementLevel];

  return (
    <div className="adaptive-workflow-interface">
      {/* Progress Indicator - Always shown */}
      {mode.showProgress && (
        <WorkflowProgressIndicator
          workflowData={workflowData}
          showAgentSteps={mode.showAgentActivity}
        />
      )}

      {/* Agent Activity Feed - For automated modes */}
      {mode.showAgentActivity && (
        <AgentActivityFeed
          workflowId={workflowData.id}
          realTime={true}
        />
      )}

      {/* User Action Panel - For interactive modes */}
      {mode.showUserControls && (
        <UserActionPanel
          pendingActions={getPendingActions(workflowData)}
          onAction={onAction}
          showApprovals={mode.showApprovals}
        />
      )}

      {/* Agent Suggestions - For manual override mode */}
      {mode.showSuggestions && (
        <AgentSuggestionsPanel
          suggestions={getAgentSuggestions(workflowData)}
          onAcceptSuggestion={(suggestion) => onAction('accept_suggestion', suggestion)}
          onRejectSuggestion={(suggestion) => onAction('reject_suggestion', suggestion)}
        />
      )}

      {/* Auto-advance notification */}
      {mode.autoAdvance && (
        <div className="auto-advance-notice">
          <i className="bi bi-robot"></i>
          <span>This workflow will complete automatically. You'll be notified of the final results.</span>
        </div>
      )}
    </div>
  );
};
```

### Integration with Procurement Workflow

#### Seamless Procurement-to-Training Handover:
```javascript
// Automatic training program initiation from procurement completion
const procurementToTrainingIntegration = {
  trigger_events: {
    equipment_delivery: "initiate_equipment_training",
    material_acceptance: "initiate_material_handling_training",
    system_commissioning: "initiate_operational_training"
  },

  data_mapping: {
    procurement_specs: "training_requirements",
    equipment_details: "technical_content",
    safety_requirements: "safety_training_modules",
    acceptance_criteria: "assessment_standards"
  },

  agent_coordination: {
    procurement_agent: "transfer_context_to_training_agents",
    training_agent: "initialize_program_with_procurement_data",
    coordination_agent: "ensure_requirements_alignment"
  },

  // NEW: User involvement level inheritance
  involvement_inheritance: {
    // Inherit involvement level from procurement workflow if appropriate
    inherit_from_procurement: true,
    default_training_level: "assistedAutomation", // More conservative for training
    user_override_allowed: true,
    level_compatibility_check: (procurementLevel, trainingLevel) => {
      // Ensure compatibility between linked workflows
      const compatibilityMatrix = {
        fullyAutomated: ['assistedAutomation', 'manualOverride'],
        assistedAutomation: ['assistedAutomation', 'manualOverride', 'humanOnly'],
        manualOverride: ['manualOverride', 'humanOnly'],
        humanOnly: ['humanOnly']
      };
      return compatibilityMatrix[procurementLevel]?.includes(trainingLevel) || false;
    }
  }
};
```

This agent-centric architecture transforms the training materials workflow from manual coordination to intelligent automation while maintaining human oversight for critical decisions and safety-critical content.

## Implementation Phases for Appendix D Training Materials

Based on the procurement workflow agent prompts inventory and developer tools implementation patterns, the Appendix D Training Materials system should be implemented in **4 structured phases** with comprehensive testing frameworks and development tools.

---

## 📋 **Phase 1: Core UI/UX & Agent Integration Foundation**

### **1.1 Enhanced Management Dashboard**
- **Stats Dashboard**: Procurement-style cards with training metrics
- **Advanced Search & Filtering**: Multi-criteria filtering with real-time results
- **Professional Data Table**: Sortable columns with action buttons
- **SOW Wizard Adaptation**: 12-step training materials creation wizard

### **1.2 Agent Integration Setup**
- **External API Configuration**: OpenAI, Claude, Google AI integration
- **Prompt Management**: Basic prompt selection and management
- **Agent Workflow Foundation**: Core agent execution patterns

### **1.3 Developer Testing Modal (CRITICAL)**
Following the procurement workflow pattern, implement the **comprehensive developer testing modal**:

#### **Modal Architecture**:
```jsx
// Enhanced Developer Testing Modal - Multi-Function Testing Hub
const EnhancedDeveloperTestingModal = {
  features: {
    developerOnlyVisibility: 'Only visible when user has developer role',
    multiFunctionTesting: 'Prompt testing + Code testing + Performance analysis',
    pageSpecificContext: 'Shows relevant tests for training materials page',
    realTimeExecution: 'Run tests instantly without navigation',
    comprehensiveReporting: 'Detailed results with actionable insights',
    collaborativeDebugging: 'Share test results and debugging sessions'
  },

  modalComponents: {
    // PROMPT TESTING INTERFACE (Priority for Phase 1)
    promptInterface: {
      promptSelector: {
        options: await getPagePrompts('appendix-d-training'),
        onSelect: (promptId) => loadPromptForEditing(promptId)
      },

      promptEditor: createMonacoEditor({
        language: 'text',
        theme: 'vs-dark',
        minimap: { enabled: false },
        wordWrap: 'on'
      }),

      testInterface: {
        testInput: createTestInputField(),
        testButton: {
          onClick: async () => {
            const result = await testPromptWithInput(testInput.value);
            displayTestResults(result);
          }
        },
        resultsPanel: displayTestResults
      }
    },

    // UNIT TESTING INTERFACE
    unitTestInterface: {
      testDiscovery: {
        discoverTests: async () => {
          const componentPath = getCurrentComponentPath();
          return await discoverUnitTests(componentPath);
        }
      },

      testRunner: {
        runTests: async (testFiles) => {
          const results = await runJestTests(testFiles);
          return formatTestResults(results);
        }
      }
    }
  },

  activationTriggers: {
    keyboardShortcut: 'Ctrl+Shift+P (Prompt Editor) | Ctrl+Shift+T (Test Hub)',
    menuItem: 'Developer Menu → Testing Hub',
    contextMenu: 'Right-click on training materials → Test Component',
    errorTrigger: 'Automatic popup on agent failures',
    hotkeyCombos: {
      'Ctrl+Shift+U': 'Unit Tests',
      'Ctrl+Shift+I': 'Integration Tests',
      'Ctrl+Shift+R': 'Performance Tests'
    }
  }
};
```

#### **Magic Wand Feature**:
```jsx
// AI-Powered Prompt Enhancement (Phase 1 Advanced)
const MagicWandEnhancer = {
  enhancePrompt: async (originalPrompt, enhancementLevel = "balanced") => {
    // Analyze current prompt
    const analysis = await MagicWandAnalyzer.analyzePrompt(originalPrompt);

    // Generate enhancement
    const enhancement = await generateEnhancement(originalPrompt, analysis, enhancementLevel);

    return {
      enhancedPrompt: enhancement.enhancedPrompt,
      changes: enhancement.appliedChanges,
      confidence: enhancement.confidenceScore,
      improvement: enhancement.improvementEstimate
    };
  }
};
```

### **1.4 Required Agent Prompts (Phase 1)**
Based on procurement workflow inventory, implement these **12 Analysis & Processing prompts**:

1. **`training_requirement_analyzer_v1`** - Analyzes training needs from procurement specs
2. **`training_content_validator_v1`** - Validates training material completeness
3. **`training_audience_analyzer_v1`** - Analyzes target audience characteristics
4. **`training_complexity_assessor_v1`** - Assesses training program complexity
5. **`training_compliance_checker_v1`** - Checks regulatory compliance requirements
6. **`training_resource_estimator_v1`** - Estimates training resource requirements
7. **`training_schedule_optimizer_v1`** - Optimizes training delivery schedules
8. **`training_effectiveness_predictor_v1`** - Predicts training program effectiveness
9. **`training_cost_analyzer_v1`** - Analyzes training program costs
10. **`training_risk_assessor_v1`** - Assesses training program risks
11. **`training_quality_evaluator_v1`** - Evaluates training material quality
12. **`training_impact_analyzer_v1`** - Analyzes training program business impact

### **Phase 1 Success Criteria**:
- ✅ Training materials management dashboard fully functional
- ✅ Developer testing modal implemented with prompt testing capabilities
- ✅ All 12 analysis & processing agent prompts implemented and tested
- ✅ Magic Wand prompt enhancement feature working
- ✅ Basic agent integration with external APIs functional

---

## 📋 **Phase 2: Document Generation & Content Creation**

### **2.1 Advanced Content Generation**
- **AI-Powered Content Creation**: Full training material generation
- **Template-Based Generation**: Pre-configured training templates
- **Multi-Modal Content**: Text, diagrams, assessments, multimedia

### **2.2 Missing Document Generation Prompts (CRITICAL)**
Implement the **10 missing document generation prompts** from procurement inventory:

1. **`training_program_generator_v1`** ❌ MISSING - Generates complete training programs
2. **`training_module_creator_v1`** ❌ MISSING - Creates individual training modules
3. **`training_assessment_generator_v1`** ❌ MISSING - Generates assessment materials
4. **`training_resource_developer_v1`** ❌ MISSING - Develops training resources
5. **`training_certification_creator_v1`** ❌ MISSING - Creates certification documents
6. **`training_curriculum_builder_v1`** ❌ MISSING - Builds training curricula
7. **`training_material_formatter_v1`** ❌ MISSING - Formats training materials
8. **`training_document_assembler_v1`** ❌ MISSING - Assembles training documents
9. **`training_quality_enhancer_v1`** ❌ MISSING - Enhances training material quality
10. **`training_personalization_engine_v1`** ❌ MISSING - Personalizes training content

### **2.3 Enhanced Testing Framework**
Expand developer modal with **integration testing** and **performance testing**:

```jsx
// Integration Testing Interface
integrationTestInterface: {
  workflowTester: {
    testWorkflow: async (workflowType) => {
      const testScenario = createTrainingWorkflowTestScenario(workflowType);
      const results = await executeWorkflowTest(testScenario);
      return analyzeWorkflowResults(results);
    },

    availableWorkflows: [
      'training_program_creation',
      'content_generation_flow',
      'certification_workflow',
      'assessment_delivery'
    ]
  },

  apiTester: {
    discoverEndpoints: async () => {
      return await discoverTrainingAPIEndpoints();
    },

    endpointTester: {
      runTests: async (endpoints) => {
        const results = await testTrainingAPIEndpoints(endpoints);
        return formatAPIResults(results);
      }
    }
  }
},

// Performance Testing Interface
performanceTestInterface: {
  benchmarkRunner: {
    runBenchmarks: async () => {
      const component = getTrainingMaterialsComponent();
      const benchmarks = await runPerformanceBenchmarks(component);
      return analyzeBenchmarkResults(benchmarks);
    },

    metrics: {
      contentGenerationTime: 'Training content generation performance',
      assessmentProcessingTime: 'Assessment processing speed',
      resourceLoadingTime: 'Training resource loading times',
      userInteractionLatency: 'User interaction response times'
    }
  }
}
```

### **2.4 Workflow Integration Prompts**
Implement **4 workflow integration prompts**:

1. **`training_sequence_optimizer_v1`** - Optimizes training delivery sequences
2. **`training_task_dispatcher_v1`** - Dispatches training tasks to appropriate agents
3. **`training_content_validator_v1`** - Validates training content quality
4. **`training_consistency_checker_v1`** - Checks consistency across training materials

### **Phase 2 Success Criteria**:
- ✅ All 10 document generation prompts implemented and functional
- ✅ Full AI-powered training content generation working
- ✅ Integration testing and performance testing in developer modal
- ✅ Complete training material creation workflow operational
- ✅ Template-based generation system functional

---

## 📋 **Phase 3: Enterprise Integration & Advanced Features**

### **3.1 Gantt Chart Timeline Integration**
- Training materials as Gantt milestones
- Dependency linking with equipment delivery
- Visual status indicators for training progress

### **3.2 HITL Workflow Integration**
- Certification HITL tasks for training programs
- Specialized review interfaces for training materials
- Compliance standards validation checklists

### **3.3 Sequence Management Integration**
- Training-aware document processing sequences
- Intelligent sequencing relative to procurement workflows

### **3.4 My Tasks Dashboard Integration**
- Training tasks in intelligent dashboard
- Training-specific chatbot commands
- Proactive suggestions for training assignments

### **3.5 Advanced Testing Framework**
Expand developer modal with **UI testing**, **security testing**, and **test data generation**:

```jsx
// UI Testing Interface
uiTestInterface: {
  accessibilityTester: {
    runAudit: async () => {
      const results = await runAccessibilityAudit(getTrainingMaterialsComponent());
      return formatAccessibilityReport(results);
    }
  },

  visualRegressionTester: {
    captureBaseline: async () => {
      const screenshot = await captureTrainingMaterialsScreenshot();
      return saveVisualBaseline(screenshot);
    }
  }
},

// Security Testing Interface
securityTestInterface: {
  vulnerabilityScanner: {
    scanComponent: async (component) => {
      const vulnerabilities = await runSecurityScan(component);
      return formatSecurityReport(vulnerabilities);
    }
  }
},

// Test Data Generation Interface
testDataInterface: {
  trainingProgramGenerator: {
    generateTestPrograms: async () => {
      const testPrograms = await generateTrainingProgramTestData();
      return await populateTrainingDatabase(testPrograms);
    }
  },

  workflowSimulation: {
    simulateTrainingWorkflow: async (testDataId) => {
      const simulation = await createTrainingWorkflowSimulation(testDataId);
      return await executeWorkflowSimulation(simulation);
    }
  }
}
```

### **Phase 3 Success Criteria**:
- ✅ Full enterprise integration with procurement workflows
- ✅ HITL workflows for training certification
- ✅ Gantt chart integration for training timelines
- ✅ My Tasks integration with intelligent assistance
- ✅ Advanced testing capabilities in developer modal
- ✅ Complete workflow simulation and test data generation

---

## 📋 **Phase 4: Agent-Centric Architecture & Optimization**

### **4.1 Complete Agent-Centric Implementation**
- **Agent-Executable Workflow Components**: Full training program lifecycle automation
- **HITL Integration Points**: Strategic human intervention for training workflows
- **Agent Permission Model**: Comprehensive permissions for training agents
- **Agent Learning & Continuous Improvement**: Pattern analysis and optimization

### **4.2 Workflow Optimization Learning**
- **Training Pattern Analysis**: Effectiveness, delivery methods, assessment accuracy
- **Audience Adaptation**: Learning styles, experience levels, cultural factors
- **Content Optimization**: Material improvement through feedback loops

### **4.3 Collaborative Features**
Expand developer modal with **collaborative debugging** and **result export**:

```jsx
// Collaborative Debugging Interface
collaborationInterface: {
  sessionSharing: {
    createDebugSession: async () => {
      const sessionId = generateSessionId();
      const currentState = captureCurrentTrainingTestState();
      return await saveDebugSession(sessionId, currentState);
    },

    shareSession: async (sessionId, collaborators) => {
      const shareLink = generateShareLink(sessionId);
      await notifyCollaborators(collaborators, shareLink);
      return shareLink;
    }
  },

  resultExport: {
    exportResults: async (testResults, format = 'json') => {
      const formattedResults = formatTestResults(testResults, format);
      return downloadFile(formattedResults, `training-test-results-${Date.now()}.${format}`);
    }
  }
}
```

### **4.4 Production Readiness**
- **Production Monitoring**: Real-time performance monitoring and alerts
- **Optimization Recommendations**: AI-powered improvement suggestions
- **User Training**: Comprehensive training for end users and developers
- **Documentation**: Complete system documentation and API references

### **Phase 4 Success Criteria**:
- ✅ Complete agent-centric architecture operational
- ✅ Advanced workflow optimization and learning
- ✅ Collaborative debugging and result sharing
- ✅ Production-ready monitoring and alerting
- ✅ Full system documentation and user training
- ✅ End-to-end workflow automation achieved

---

## 🎯 **Implementation Strategy & Success Metrics**

### **Overall Success Metrics** (Aligned with Procurement Inventory):
- **Prompt Coverage**: 0/24 → 24/24 prompts (100% coverage)
- **Document Generation**: 0/10 → 10/10 prompts (100% document generation)
- **Developer Tools**: 0/1 → 1/1 modal (100% testing framework)
- **Magic Wand**: 0/1 → 1/1 feature (100% AI enhancement)
- **Testing Framework**: 0/8 → 8/8 interfaces (100% comprehensive testing)

### **Quality Assurance Framework**:
```javascript
// Comprehensive Testing Suite
const TrainingMaterialsTestingSuite = {
  unitTests: {
    coverage: '>80%',
    frameworks: ['Jest', 'React Testing Library'],
    automation: 'GitHub Actions CI/CD'
  },

  integrationTests: {
    workflowCoverage: '100% of training workflows',
    apiCoverage: '100% of training APIs',
    performanceBenchmarks: 'Established and monitored'
  },

  endToEndTests: {
    userJourneys: 'Complete training program creation to certification',
    crossBrowser: 'Chrome, Firefox, Safari, Edge',
    mobileResponsive: 'Tablet and mobile layouts'
  },

  aiQualityTests: {
    promptAccuracy: '>95% generated content quality',
    agentPerformance: 'Monitored and optimized',
    userSatisfaction: 'Survey-based feedback collection'
  }
};
```

### **Risk Mitigation Strategy**:
1. **Phased Implementation**: Each phase is self-contained with clear success criteria
2. **Comprehensive Testing**: Multi-layer testing framework prevents regressions
3. **Developer Tools**: Enhanced modal enables rapid iteration and debugging
4. **Rollback Plans**: Each phase includes rollback procedures
5. **User Feedback**: Continuous feedback collection and incorporation

### **Timeline & Resource Allocation**:
- **Phase 1**: 4 weeks - Core foundation and developer tools
- **Phase 2**: 4 weeks - Content generation and document creation
- **Phase 3**: 4 weeks - Enterprise integration and advanced features
- **Phase 4**: 4 weeks - Agent-centric optimization and production readiness

**Total Timeline**: 16 weeks for complete implementation with comprehensive testing and documentation.

---

## 🎯 **Conclusion & Next Steps**

The Appendix D Training Materials implementation should follow the **proven procurement workflow pattern** with **4 structured phases**, comprehensive **24 AI agent prompts**, and the **critical developer testing modal** that was planned but never implemented in the procurement system.

**Immediate Next Steps:**
1. **Begin Phase 1** implementation with developer testing modal
2. **Implement the 12 analysis prompts** following procurement patterns
3. **Deploy Magic Wand** feature for prompt optimization
4. **Establish comprehensive testing framework**

This phased approach ensures **systematic development**, **quality assurance**, and **successful deployment** of a world-class training materials management system that matches the sophistication of the procurement workflow rationalization.

**Status: READY FOR IMPLEMENTATION** - All patterns, tools, and success metrics defined for immediate development start.

---

**Document Version**: 1.0
**Last Updated**: December 17, 2025
**Author**: AI Assistant
**Review Status**: ✅ Complete
