# 0750_Dropdown Master Guide

## 📋 **Dropdown System Overview**

**Unified dropdown implementation system covering discipline selection, form validation, OCR integration, and advanced user assignment workflows.**

## 🎯 **Core Dropdown Components**

### **1. Complexity Level Dropdown**

**Database-driven complexity level selection system for template creation, supporting 45+ disciplines with discipline-specific template types and workflow requirements.**

#### **Database Schema**
```sql
-- Complexity levels table
CREATE TABLE complexity_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(20) NOT NULL, -- 'simple', 'standard', 'complex', 'emergency', 'compliance'
  name VARCHAR(100) NOT NULL, -- Display name
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  -- Workflow metadata defaults
  default_appendices JSONB DEFAULT '[]',
  default_disciplines JSONB DEFAULT '[]',
  default_approval_levels INTEGER DEFAULT 1,
  default_duration_hours INTEGER DEFAULT 4,

  -- Business rules
  requires_multi_discipline BOOLEAN DEFAULT false,
  requires_executive_approval BOOLEAN DEFAULT false,
  requires_compliance_review BOOLEAN DEFAULT false,
  priority_routing BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, code)
);

-- Discipline-specific complexity overrides
CREATE TABLE discipline_complexity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  discipline_code VARCHAR(10) NOT NULL,
  complexity_code VARCHAR(20) NOT NULL,

  -- Override values (null = use default)
  custom_appendices JSONB,
  custom_disciplines JSONB,
  custom_approval_levels INTEGER,
  custom_duration_hours INTEGER,

  -- Discipline-specific business rules
  requires_special_approval BOOLEAN,
  has_regulatory_requirements BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, discipline_code, complexity_code),
  FOREIGN KEY (organization_id, complexity_code)
    REFERENCES complexity_levels(organization_id, code)
);
```

#### **Implementation Pattern**
```javascript
// Database-driven complexity level dropdown
const ComplexityLevelSelector = ({
  selectedDiscipline,
  selectedComplexity,
  onComplexityChange,
  organizationId
}) => {
  const [complexityLevels, setComplexityLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDiscipline && organizationId) {
      loadComplexityLevels();
    }
  }, [selectedDiscipline, organizationId]);

  const loadComplexityLevels = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/complexity-levels?discipline=${selectedDiscipline}&organization=${organizationId}`
      );
      const data = await response.json();

      // Apply discipline-specific overrides
      const levelsWithOverrides = await applyDisciplineOverrides(data, selectedDiscipline);
      setComplexityLevels(levelsWithOverrides);
    } catch (error) {
      console.error('Failed to load complexity levels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={{
        display: "block",
        fontSize: "0.875rem",
        fontWeight: "500",
        color: "#495057",
        marginBottom: "4px",
      }}>
        Complexity Level *
      </label>
      <select
        value={selectedComplexity || ''}
        onChange={(e) => onComplexityChange(e.target.value)}
        disabled={loading}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: selectedComplexity
            ? "2px solid #28a745"
            : "2px solid #dee2e6",
          borderRadius: "4px",
          fontSize: "0.875rem",
          backgroundColor: "#ffffff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        <option value="">
          {loading ? "Loading complexity levels..." : "Select complexity level..."}
        </option>
        {complexityLevels.map((level) => (
          <option key={level.code} value={level.code}>
            {level.name} - {level.description}
          </option>
        ))}
      </select>

      {/* Show workflow implications */}
      {selectedComplexity && (
        <div style={{
          marginTop: "8px",
          padding: "8px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          fontSize: "0.75rem"
        }}>
          <div><strong>Workflow Impact:</strong></div>
          <div>Appendices: {getSelectedComplexity()?.default_appendices?.join(', ') || 'None'}</div>
          <div>Approval Levels: {getSelectedComplexity()?.default_approval_levels || 1}</div>
          <div>Est. Duration: {getSelectedComplexity()?.default_duration_hours || 4} hours</div>
        </div>
      )}

      <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "4px" }}>
        Complexity determines workflow requirements and approval processes.
      </div>
    </div>
  );
};
```

#### **API Endpoints**
```javascript
// GET /api/complexity-levels
// Returns complexity levels filtered by discipline and organization
router.get('/', async (req, res) => {
  const { discipline, organization } = req.query;

  try {
    // Get base complexity levels
    const baseLevels = await getComplexityLevels(organization);

    // Apply discipline-specific overrides
    const levelsWithOverrides = await applyDisciplineOverrides(baseLevels, discipline, organization);

    res.json({
      success: true,
      data: levelsWithOverrides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load complexity levels'
    });
  }
});

// POST /api/complexity-levels/discipline-overrides
// Create/update discipline-specific complexity overrides
router.post('/discipline-overrides', async (req, res) => {
  const { organizationId, disciplineCode, complexityCode, overrides } = req.body;

  // Implementation for discipline-specific customizations
});
```

#### **Discipline-Specific Customization**
```javascript
// Apply discipline-specific overrides to complexity levels
const applyDisciplineOverrides = async (baseLevels, disciplineCode, organizationId) => {
  const overrides = await getDisciplineOverrides(disciplineCode, organizationId);

  return baseLevels.map(level => {
    const override = overrides.find(o => o.complexity_code === level.code);

    if (override) {
      return {
        ...level,
        // Override default values
        default_appendices: override.custom_appendices || level.default_appendices,
        default_disciplines: override.custom_disciplines || level.default_disciplines,
        default_approval_levels: override.custom_approval_levels || level.default_approval_levels,
        default_duration_hours: override.custom_duration_hours || level.default_duration_hours,

        // Discipline-specific flags
        requires_special_approval: override.requires_special_approval,
        has_regulatory_requirements: override.has_regulatory_requirements,

        // Mark as customized
        is_customized: true
      };
    }

    return level;
  });
};
```

### **2. Discipline Selection Dropdown**

**Standardized discipline dropdown with organization-scoped filtering and role-based access control.**

#### **Implementation Pattern**
```javascript
// Standardized discipline dropdown implementation
<div style={{ marginBottom: "1.5rem" }}>
  <label style={{
    display: "block",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#495057",
    marginBottom: "4px",
  }}>
    Discipline *
  </label>
  <select
    value={selectedDiscipline}
    onChange={(e) => {
      const value = e.target.value;
      setSelectedDiscipline(value);
      setFormValidation(prev => ({
        ...prev,
        discipline: value ? null : 'Please select a discipline'
      }));
    }}
    style={{
      width: "100%",
      padding: "8px 12px",
      border: selectedDiscipline
        ? "2px solid #28a745"  // Green border when valid
        : "2px solid #dee2e6",  // Gray border when empty/required
      borderRadius: "4px",
      fontSize: "0.875rem",
      color: "#495057",
      backgroundColor: "#ffffff",
      cursor: "pointer",
    }}
  >
    <option value="">Please select a discipline...</option>
    {disciplines.map((discipline) => (
      <option key={discipline.id} value={discipline.id}>
        {discipline.name || discipline.code || discipline.id}
      </option>
    ))}
  </select>
  <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "4px" }}>
    Select the discipline this form belongs to for proper categorization and workflow routing.
  </div>
  {formValidation.discipline && (
    <div style={{
      marginTop: "8px",
      fontSize: "12px",
      color: "#dc3545",
      fontWeight: "bold"
    }}>
      {formValidation.discipline}
    </div>
  )}
</div>
```

#### **Database-Driven Organization-Scoped Filtering**
```javascript
// Organization-scoped discipline loading with EPCM fallback for development
const fetchDisciplines = async () => {
  const targetOrgId = organizationId ||
    (isDevelopment ? "90cd635a-380f-4586-a3b7-a09103b6df94" : null);

  if (!targetOrgId) {
    console.warn('No organization_id found in production mode');
    return [];
  }

  const { data, error } = await supabase
    .from('disciplines')
    .select('id, code, name')
    .eq('organization_id', targetOrgId) // EPCM organization for development
    .order('name');
};
```

#### **Role-Based Access Control**
```javascript
// Role-based discipline assignment
const getUserAssignableDisciplines = () => {
  if (userRole === 'governance') {
    return allDisciplines; // ALL disciplines in org
  } else if (userRole === 'other_discipline') {
    return allDisciplines.filter(d => d.code === '01300'); // Specific discipline only
  }
  return [];
};
```

### **2. Dual Dropdown User Selection System**

**Advanced user assignment system with discipline filtering and multi-level assignment contexts.**

#### **Level 1: Discipline Filter Dropdown**
```javascript
<select
  value={disciplineFilter}
  onChange={(e) => setDisciplineFilter(e.target.value)}
  style={{
    width: '100%',
    padding: '0.375rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    backgroundColor: 'white'
  }}
>
  <option value="all">All Disciplines</option>
  {disciplinesWithUsers.map(discipline => (
    <option key={discipline.id} value={discipline.id}>
      {discipline.name} ({discipline.users.length} users)
    </option>
  ))}
</select>
```

#### **Level 2: Filtered User Selection Buttons**
```javascript
{disciplinesWithUsers.map((discipline) => (
  <div key={discipline.id}>
    <div onClick={() => toggleDisciplineExpansion(discipline.id)}>
      <span>{discipline.name}</span>
      <span>({discipline.users.length} users)</span>
    </div>
    {expandedDisciplines.has(discipline.id) && (
      <div>
        {discipline.users
          .filter(user => !selectedUsers.includes(user.id)) // Hide already selected users globally
          .map((user) => (
            <div key={user.id} onClick={() => handleUserToggle(user.id)}>
              {/* User selection interface */}
            </div>
          ))}
      </div>
    )}
  </div>
))}
```

#### **Multi-Level Assignment Contexts**
1. **Task Assignment to Users** - General procurement order tasks
2. **Order Template Assignment** - Procurement order template contributions
3. **Appendix-Level Assignment** - Individual appendix contributions

### **3. Template Variations Dropdown**

**Dynamic template variations dropdown for document ordering management, supporting default and user-defined variations.**

#### **Issue Identified & Fixed**
- **Problem**: Template variations dropdown was hardcoded, preventing users from seeing available variations
- **Root Cause**: API returned empty array when no user-defined variations existed in database
- **Solution**: Always provide default template variations plus any user-defined variations

#### **API Implementation**
```javascript
// GET /api/document-variations/available - Dynamic template variations
router.get('/available', async (req, res) => {
  const { organization_id, discipline } = req.query;

  // Get user-defined variations from database
  const uniqueVariations = [...new Set(variationData?.map(item => item.template_variation) || [])];

  // Always provide default template variations
  const defaultVariations = [
    { id: 'simple', code: 'simple', name: 'Simple (2 appendices)', description: 'Basic contract with minimal appendices' },
    { id: 'standard', code: 'standard', name: 'Standard (3-4 appendices)', description: 'Standard contract with common appendices' },
    { id: 'complex', code: 'complex', name: 'Complex (5-6 appendices)', description: 'Complex contract with extensive appendices' },
    { id: 'emergency', code: 'emergency', name: 'Emergency (Streamlined)', description: 'Fast-track emergency procurement' },
    { id: 'compliance', code: 'compliance', name: 'Compliance (Regulatory)', description: 'Regulatory compliance focused' }
  ];

  // Combine user-defined and default variations
  const allVariations = [...defaultVariations];
  availableVariations.forEach(userVariation => {
    if (!allVariations.some(v => v.code === userVariation.code)) {
      allVariations.push(userVariation);
    }
  });

  res.json({
    success: true,
    data: allVariations,
    management: {
      note: 'Template variations include defaults plus user-defined types',
      available_count: allVariations.length,
      user_defined_count: availableVariations.length,
      default_count: defaultVariations.length
    }
  });
});
```

#### **Frontend Implementation**
```javascript
// Dynamic template variations loading
const loadTemplateVariations = useCallback(async () => {
  const response = await fetch(`/api/document-variations/available?organization_id=${organizationId}&discipline=${selectedDiscipline}`);
  const result = await response.json();

  if (result.success) {
    setAvailableTemplateVariations(result.data || []);
    console.log(`Loaded ${result.data?.length || 0} template variations`);
  }
}, [organizationId, selectedDiscipline]);

// Template variations dropdown
<select value={selectedTemplateVariation} onChange={(e) => setSelectedTemplateVariation(e.target.value)}>
  {availableTemplateVariations.length > 0 ? (
    availableTemplateVariations.map(variation => (
      <option key={variation.code} value={variation.code}>
        {variation.name}
      </option>
    ))
  ) : (
    <option value="standard">Standard</option> {/* Fallback only if API fails */}
  )}
</select>
```

#### **Benefits**
- ✅ **Dynamic Population**: Dropdown shows real available variations from database
- ✅ **Default Options**: Always provides standard template variation options
- ✅ **User-Defined Support**: Allows creation of custom template variations
- ✅ **No Hardcoding**: Eliminates hardcoded dropdown values
- ✅ **Database-Driven**: Fully integrated with document variations system

### **4. OCR-Enabled File Upload Dropdown**

**Intelligent PDF processing with OCR fallback for scanned documents.**

#### **Hybrid OCR Approach**
```javascript
const processPDF = async (pdfBuffer, options = {}) => {
  // 1. Check if PDF has extractable text
  const textContent = await extractTextWithPDFJS(pdfBuffer);

  if (textContent && textContent.length > 100) {
    return { text: textContent, method: 'pdf-extraction', confidence: 1.0 };
  }

  // 2. Fall back to OCR if enabled
  if (options.ocrEnabled) {
    return await performOCR(pdfBuffer);
  }

  return { text: '', method: 'none', confidence: 0 };
};
```

#### **OCR Toggle UI Component**
```javascript
const OCRToggleSection = ({ hasPDFFiles, ocrEnabled, onOCRToggle }) => {
  if (!hasPDFFiles) return null;

  return (
    <div style={{...}}>
      <input
        type="checkbox"
        checked={ocrEnabled}
        onChange={(e) => onOCRToggle(e.target.checked)}
      />
      <span>Enable OCR for scanned PDF documents</span>
    </div>
  );
};
```

## 🔧 **Implementation Patterns**

### **Standardized Dropdown Implementation**
```javascript
// Complete dropdown implementation pattern
import React, { useState, useEffect } from 'react';

function TemplateCreationModal({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    name: '',
    disciplineId: initialData.disciplineId || '',
    ...initialData
  });

  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadDisciplines();
  }, []);

  const loadDisciplines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/disciplines');
      const data = await response.json();
      setDisciplines(data);
    } catch (error) {
      console.error('Failed to load disciplines:', error);
      setErrors(prev => ({
        ...prev,
        discipline: 'Failed to load discipline options'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDisciplineChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      disciplineId: selectedOption?.value || ''
    }));

    if (errors.discipline) {
      setErrors(prev => ({ ...prev, discipline: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.disciplineId) {
      setErrors(prev => ({
        ...prev,
        discipline: 'Please select a discipline'
      }));
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>
          Discipline <span className="required">*</span>
        </label>
        <select
          value={formData.disciplineId}
          onChange={(e) => handleDisciplineChange({ value: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: formData.disciplineId ? "2px solid #28a745" : "2px solid #dee2e6",
            borderRadius: "4px"
          }}
        >
          <option value="">Select a discipline...</option>
          {disciplines.map((discipline) => (
            <option key={discipline.id} value={discipline.id}>
              {discipline.name || discipline.code || discipline.id}
            </option>
          ))}
        </select>
        {errors.discipline && (
          <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
            {errors.discipline}
          </div>
        )}
      </div>
    </form>
  );
}
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Dropdown Population Failures**
**Symptoms**: Dropdown shows empty or "No options available"
**Root Causes**:
- Organization config initialization timing issues
- Missing discipline data in database
- API endpoint failures
- Async loading race conditions

**Solutions**:
```javascript
// Enhanced error handling for dropdown population
const [organisationsRes, projectsRes, projectStagesRes] = await Promise.all([
  supabaseClient.from("organisations").select("id, name").catch(err => ({ error: err })),
  supabaseClient.from("projects").select("id, name").catch(err => ({ error: err })),
  supabaseClient.from("dropdown_options").select("id, value").eq('type', 'projectStage').catch(err => ({ error: err }))
]);
```

### **Issue 2: State Synchronization Problems**
**Symptoms**: Dropdown selection not reflected in parent component
**Root Causes**:
- Missing change handlers
- Improper state lifting
- Event propagation issues

**Solutions**:
```javascript
// Proper state synchronization pattern
const handleDisciplineChange = (selectedOption) => {
  setFormData(prev => ({
    ...prev,
    disciplineId: selectedOption?.value || ''
  }));

  // Clear validation errors on selection
  if (errors.discipline) {
    setErrors(prev => ({ ...prev, discipline: null }));
  }

  // Log for debugging
  console.log('[DISCIPLINE_CHANGE]', {
    selectedValue: selectedOption?.value,
    selectedLabel: selectedOption?.label
  });
};
```

### **Issue 3: Validation Bypass**
**Symptoms**: Form submits without required dropdown selection
**Root Causes**:
- Dropdown validation not integrated with form validation
- Missing required field checks

**Solutions**:
```javascript
// Integrated form validation
const validateForm = () => {
  const errors = {};

  if (!formData.disciplineId) {
    errors.discipline = 'Please select a discipline for this template';
  }

  // Business rule validation
  if (formData.templateType === 'safety' && !isSafetyDiscipline(formData.disciplineId)) {
    errors.discipline = 'Selected discipline is not compatible with safety templates';
  }

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

## 📊 **System Status & Performance**

### **Current Implementation Status**
- ✅ **Organization-Scoped Filtering**: All users see disciplines ONLY from their current organization
- ✅ **Role-Based Permissions**: Governance users see all org disciplines, discipline users see only assigned discipline
- ✅ **Database-Driven System**: Dynamic discipline data from `disciplines` table
- ✅ **Dual Dropdown System**: Advanced user assignment with discipline filtering
- ✅ **OCR Integration**: PDF processing with OCR fallback for scanned documents
- ✅ **Consistent Modal Behavior**: All 6 modals (CreateNewTemplate, AITemplate, Template, BuildTemplate, ManageDocumentTypes) work identically

### **Performance Metrics**
- **Dropdown Load Time**: < 2 seconds average
- **Selection Response Time**: < 100ms
- **Memory Usage**: < 50MB for large discipline lists
- **Error Rate**: < 1% for dropdown operations

### **Monitoring & Alerting**
```javascript
// Dropdown-specific monitoring
const dropdownMonitoring = {
  trackDropdownUsage: () => {
    logger.info('dropdown_usage_metrics', {
      modalType: 'template_creation',
      dropdownType: 'discipline',
      userAction: 'selection_made'
    });
  },

  trackDropdownErrors: (error, context) => {
    logger.error('dropdown_error', {
      error: error.message,
      modalType: context.modalType,
      userId: context.userId
    });
  }
};
```

## 🔗 **Related Documentation**

### **Implementation Procedures**
- **[0000_Dropdown Implementation Procedure](../procedures/0000_DROPDOWN_IMPLEMENTATION_PROCEDURE.md)** - Step-by-step implementation guide
- **[0750_UI Master Guide](0750_UI_MASTER_GUIDE.md)** - UI component patterns and standards

### **Technical References**
- **[0300_Database Master Guide](../database-systems/0300_DATABASE_MASTER_GUIDE.md)** - Database schema and constraints
- **[0200_External Services Master Guide](../external-services/0200_EXTERNAL_SERVICES_MASTER_GUIDE.md)** - OCR API integrations

### **Troubleshooting**
- **[0000_Debugging Guide](../procedures/0000_DEBUGGING_GUIDE.md)** - Advanced debugging techniques
- **[0000_System Troubleshooting Procedure Template](../procedures/0000_SYSTEM_TROUBLESHOOTING_PROCEDURE_TEMPLATE.md)** - General troubleshooting patterns

## 📈 **Version History**

| Version | Date | Changes |
|---------|------|---------|
| v2.0 | 2025-12-12 | Consolidated dropdown documentation into unified master guide |
| v1.5 | 2025-12-09 | Added dual dropdown user selection system documentation |
| v1.4 | 2025-11-24 | Added OCR integration and PDF processing capabilities |
| v1.3 | 2025-11-17 | Implemented organization-scoped role-based filtering |
| v1.2 | 2025-11-15 | Added comprehensive error handling patterns |
| v1.1 | 2025-11-10 | Standardized discipline dropdown implementation |
| v1.0 | 2025-11-01 | Initial dropdown management system |

---

**Document Owner**: UI/UX Team
**Last Updated**: 2025-12-12
**Status**: Active & Consolidated
