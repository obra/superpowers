# Template Management & Scalability Guide

## Current Challenge

**Problem:** The current hardcoded template system in `template-generation-service.js` will become unwieldy as new templates are added:

```javascript
const templatePrompts = {
  'safety-policy': this.getSafetyPolicyPrompt(customizations),
  'risk-assessment': this.getRiskAssessmentPrompt(customizations),
  'project-scope': this.getProjectScopePrompt(customizations),
  'sow': this.getProjectScopePrompt(customizations),
  // Adding new templates requires manual updates here
};
```

## Scalable Solutions

### 1. Dynamic Template Registration System 🏆 **RECOMMENDED**

**Approach:** Use a registry pattern where templates register themselves dynamically.

#### Implementation:

**Template Registry Service:**
```javascript
// server/services/template-registry.js
class TemplateRegistry {
  constructor() {
    this.templates = new Map();
    this.prompts = new Map();
  }

  registerTemplate(templateConfig) {
    const { type, name, description, promptGenerator, validation } = templateConfig;
    
    // Validate template config
    if (!type || !name || !promptGenerator) {
      throw new Error(`Invalid template config for type: ${type}`);
    }
    
    this.templates.set(type, { name, description, validation });
    this.prompts.set(type, promptGenerator);
    
    console.log(`✅ Registered template: ${type} - ${name}`);
  }

  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([type, config]) => ({
      type,
      ...config
    }));
  }

  getTemplatePrompt(type, customizations) {
    const promptGenerator = this.prompts.get(type);
    if (!promptGenerator) {
      throw new Error(`Template type '${type}' not found`);
    }
    return promptGenerator(customizations);
  }

  validateTemplateType(type) {
    return this.templates.has(type);
  }
}

export default new TemplateRegistry();
```

**Template Definitions (Separate Files):**
```javascript
// server/templates/safety-policy.js
export default {
  type: 'safety-policy',
  name: 'Safety Policy',
  description: 'Comprehensive safety policy template',
  validation: {
    requiredFields: ['policy_statement', 'scope'],
    maxSections: 10
  },
  promptGenerator: (customizations) => {
    return `
      Generate a comprehensive safety policy template for ${customizations.organization || 'construction company'}.
      
      Requirements:
      - Create sections for policy statement, scope, responsibilities, procedures
      - Include risk assessment fields with risk ratings (High/Medium/Low)
      - Add compliance checklist items with checkboxes
      - Include emergency procedures section
      - EXPLICITLY SET field behaviors for EACH field: editable (user input), readonly (policy text), ai_generated (summaries)
      - Set appropriate validation rules (required fields, text limits)
      - Include sections: Policy Statement, Scope, Responsibilities, Risk Assessment, Emergency Procedures, Compliance

      Field Types to Use:
      - text: for names, titles, references
      - textarea: for detailed descriptions, procedures
      - select: for dropdowns (risk levels, compliance status)
      - date: for review dates, effective dates
      - checkbox: for checklist items
      - email: for contact information

      CRITICAL: Every field MUST have a "behavior" attribute set to one of: "editable", "readonly", or "ai_generated"

      Output must be valid JSON with this structure:
      {
        "title": "Safety Policy Template",
        "sections": [
          {
            "id": "unique_id",
            "heading": "Section Title",
            "level": 1,
            "content": [
              {
                "id": "field_id",
                "type": "text|textarea|select|date|checkbox|email",
                "label": "Field Label",
                "behavior": "editable|readonly|ai_generated",
                "required": true|false,
                "validation": { "maxLength": 500, "pattern": "regex" }
              }
            ]
          }
        ]
      }
    `;
  }
};
```

**Auto-Registration:**
```javascript
// server/services/template-loader.js
import fs from 'fs';
import path from 'path';

class TemplateLoader {
  static loadAllTemplates(registry) {
    const templateDir = path.join(process.cwd(), 'server', 'templates');
    
    try {
      const files = fs.readdirSync(templateDir);
      const templateFiles = files.filter(file => file.endsWith('.js') && file !== 'index.js');
      
      templateFiles.forEach(file => {
        try {
          const templateModule = require(path.join(templateDir, file));
          registry.registerTemplate(templateModule.default || templateModule);
        } catch (error) {
          console.error(`❌ Failed to load template ${file}:`, error.message);
        }
      });
      
      console.log(`🚀 Loaded ${templateFiles.length} templates`);
    } catch (error) {
      console.error('❌ Failed to load template directory:', error.message);
    }
  }
}

export default TemplateLoader;
```

**Updated Template Generation Service:**
```javascript
// server/services/template-generation-service.js
import TemplateRegistry from './template-registry.js';
import TemplateLoader from './template-loader.js';

class TemplateGenerationService {
  constructor() {
    this.registry = TemplateRegistry;
    
    // Load all templates on initialization
    TemplateLoader.loadAllTemplates(this.registry);
    
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.model = "gpt-4o-mini";
    this.temperature = 0.3;
    this.maxTokens = 2000;
  }

  async generateTemplate(templateType, customizations = {}) {
    console.log(`[TemplateGeneration] Generating template type: ${templateType}`);

    // Dynamic template lookup
    if (!this.registry.validateTemplateType(templateType)) {
      throw new Error(`Template type '${templateType}' not found`);
    }

    const prompt = this.registry.getTemplatePrompt(templateType, customizations);
    return this.generateFromPrompt(prompt, templateType, customizations);
  }

  getAvailableTemplateTypes() {
    return this.registry.getAvailableTemplates();
  }
}

export default new TemplateGenerationService();
```

### 2. Configuration-Driven Templates

**JSON Configuration:**
```json
// server/config/templates.json
{
  "templates": {
    "safety-policy": {
      "name": "Safety Policy",
      "description": "Comprehensive safety policy template",
      "category": "safety",
      "version": "1.0.0",
      "prompt": "server/prompts/safety-policy.txt",
      "validation": {
        "requiredFields": ["policy_statement", "scope"],
        "maxSections": 10
      },
      "ui": {
        "icon": "🛡️",
        "color": "red",
        "priority": 1
      }
    },
    "risk-assessment": {
      "name": "Risk Assessment",
      "description": "Detailed risk assessment and mitigation",
      "category": "safety",
      "version": "1.0.0",
      "prompt": "server/prompts/risk-assessment.txt",
      "validation": {
        "requiredFields": ["hazard_identification"],
        "maxSections": 15
      },
      "ui": {
        "icon": "⚠️",
        "color": "orange",
        "priority": 2
      }
    }
  },
  "categories": {
    "safety": {
      "name": "Safety & Compliance",
      "description": "Safety policies and compliance templates",
      "icon": "🛡️"
    },
    "project": {
      "name": "Project Management",
      "description": "Project planning and management templates",
      "icon": "📋"
    }
  }
}
```

### 3. Database-Driven Templates

**Database Schema:**
```sql
-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  version VARCHAR(20) DEFAULT '1.0.0',
  prompt_template TEXT NOT NULL,
  validation_config JSONB,
  ui_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template versions table
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  version VARCHAR(20) NOT NULL,
  prompt_template TEXT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Dynamic Template Service:**
```javascript
// server/services/database-template-service.js
class DatabaseTemplateService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async getAvailableTemplates() {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('category, priority');
    
    if (error) throw error;
    return data;
  }

  async getTemplate(type) {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  }

  async addTemplate(templateConfig) {
    const { data, error } = await this.supabase
      .from('templates')
      .insert(templateConfig)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async updateTemplate(type, updates) {
    const { data, error } = await this.supabase
      .from('templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('type', type)
      .select();
    
    if (error) throw error;
    return data[0];
  }
}
```

### 4. Plugin Architecture

**Plugin Interface:**
```javascript
// server/plugins/template-plugin-interface.js
class TemplatePlugin {
  constructor() {
    this.templates = [];
  }

  // Must be implemented by plugins
  getTemplates() {
    throw new Error('getTemplates() must be implemented');
  }

  // Optional lifecycle hooks
  async onLoad() {
    // Plugin initialization
  }

  async onUnload() {
    // Cleanup when plugin is unloaded
  }

  // Validation
  validateTemplateConfig(config) {
    const required = ['type', 'name', 'prompt'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    return true;
  }
}
```

**Example Plugin:**
```javascript
// server/plugins/construction-templates.js
import TemplatePlugin from './template-plugin-interface.js';

class ConstructionTemplates extends TemplatePlugin {
  constructor() {
    super();
    this.templates = [
      {
        type: 'structural-drawing',
        name: 'Structural Drawing Review',
        description: 'Review checklist for structural engineering drawings',
        prompt: this.getStructuralDrawingPrompt(),
        category: 'engineering',
        icon: '🏗️'
      },
      {
        type: 'material-specification',
        name: 'Material Specification',
        description: 'Detailed material specification template',
        prompt: this.getMaterialSpecPrompt(),
        category: 'engineering',
        icon: '🔧'
      }
    ];
  }

  getTemplates() {
    return this.templates;
  }

  getStructuralDrawingPrompt() {
    return `
      Generate a structural drawing review template for construction projects.
      
      Requirements:
      - Create sections for structural analysis, load calculations, material compliance
      - Include reviewer information and approval workflow
      - Add safety factor validation
      - Include standards compliance checklist
      
      Output must be valid JSON with proper field types and validation.
    `;
  }

  getMaterialSpecPrompt() {
    return `
      Generate a material specification template for construction projects.
      
      Requirements:
      - Create sections for material properties, standards, testing requirements
      - Include supplier qualification fields
      - Add quality control measures
      - Include delivery and storage requirements
      
      Output must be valid JSON with proper field types and validation.
    `;
  }
}

export default ConstructionTemplates;
```

## Frontend Template Management

### Dynamic Template Discovery

**Frontend Template Service:**
```javascript
// client/src/services/templateService.js
class TemplateService {
  constructor() {
    this.templates = [];
    this.categories = {};
  }

  async loadTemplates() {
    try {
      const response = await fetch('/api/templates/available');
      const data = await response.json();
      
      this.templates = data.templates;
      this.categories = data.categories;
      
      // Cache for offline use
      localStorage.setItem('availableTemplates', JSON.stringify({
        templates: this.templates,
        categories: this.categories,
        timestamp: Date.now()
      }));
      
      return data;
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Load from cache if available
      const cached = localStorage.getItem('availableTemplates');
      if (cached) {
        const { templates, categories } = JSON.parse(cached);
        this.templates = templates;
        this.categories = categories;
        return { templates, categories };
      }
      throw error;
    }
  }

  getTemplatesByCategory(category) {
    return this.templates.filter(template => template.category === category);
  }

  getTemplateCategories() {
    return Object.values(this.categories);
  }
}

export default new TemplateService();
```

**Dynamic Template Selector:**
```javascript
// client/src/components/TemplateSelector.jsx
import React, { useState, useEffect } from 'react';
import TemplateService from '../services/templateService';

const TemplateSelector = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      const data = await TemplateService.loadTemplates();
      setTemplates(data.templates);
      setCategories(data.categories);
    };
    
    loadData();
  }, []);

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="template-selector">
      <div className="category-tabs">
        <button 
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          All Templates
        </button>
        {categories.map(category => (
          <button
            key={category.name}
            className={selectedCategory === category.name ? 'active' : ''}
            onClick={() => setSelectedCategory(category.name)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      <div className="template-grid">
        {filteredTemplates.map(template => (
          <div
            key={template.type}
            className="template-card"
            onClick={() => onTemplateSelect(template)}
          >
            <div className="template-icon">{template.icon}</div>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <span className="template-category">{template.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
```

## Template Versioning & Migration

### Version Management
```javascript
// server/services/template-versioning.js
class TemplateVersioning {
  constructor() {
    this.migrations = new Map();
  }

  registerMigration(fromVersion, toVersion, migrationFunction) {
    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, migrationFunction);
  }

  async migrateTemplate(template, targetVersion) {
    const currentVersion = template.version;
    
    if (currentVersion === targetVersion) {
      return template;
    }

    const migrationKey = `${currentVersion}->${targetVersion}`;
    const migration = this.migrations.get(migrationKey);
    
    if (!migration) {
      throw new Error(`No migration path from ${currentVersion} to ${targetVersion}`);
    }

    return await migration(template);
  }

  // Example migration
  registerDefaultMigrations() {
    // Migrate from 1.0.0 to 2.0.0
    this.registerMigration('1.0.0', '2.0.0', async (template) => {
      return {
        ...template,
        version: '2.0.0',
        validation: {
          ...template.validation,
          newField: 'required' // Add new validation rule
        }
      };
    });
  }
}
```

## Monitoring & Analytics

### Template Usage Tracking
```javascript
// server/services/template-analytics.js
class TemplateAnalytics {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async trackTemplateUsage(templateType, userId, metadata = {}) {
    await this.supabase
      .from('template_usage_logs')
      .insert({
        template_type: templateType,
        user_id: userId,
        metadata,
        timestamp: new Date().toISOString()
      });
  }

  async getPopularTemplates(limit = 10) {
    const { data, error } = await this.supabase
      .from('template_usage_logs')
      .select('template_type, count:template_type')
      .group('template_type')
      .order('count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  async getTemplateMetrics(templateType, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('template_usage_logs')
      .select('*')
      .eq('template_type', templateType)
      .gte('timestamp', startDate.toISOString());
    
    if (error) throw error;
    
    return {
      totalUses: data.length,
      uniqueUsers: [...new Set(data.map(d => d.user_id))].length,
      averageGenerationTime: this.calculateAverageTime(data),
      successRate: this.calculateSuccessRate(data)
    };
  }
}
```

## Deployment Strategies

### 1. Hot-Reload Templates
```javascript
// Development: Watch template directory for changes
import chokidar from 'chokidar';

class TemplateHotReloader {
  constructor(registry) {
    this.registry = registry;
    this.watcher = null;
  }

  startWatching() {
    const templateDir = path.join(process.cwd(), 'server', 'templates');
    
    this.watcher = chokidar.watch(templateDir, {
      ignored: /^\./,
      persistent: true
    });

    this.watcher
      .on('add', file => this.reloadTemplate(file))
      .on('change', file => this.reloadTemplate(file))
      .on('unlink', file => this.removeTemplate(file));
  }

  async reloadTemplate(file) {
    try {
      delete require.cache[require.resolve(file)];
      const template = require(file);
      this.registry.registerTemplate(template.default || template);
      console.log(`🔄 Reloaded template: ${template.type}`);
    } catch (error) {
      console.error(`❌ Failed to reload template ${file}:`, error);
    }
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
```

### 2. Gradual Rollout
```javascript
// Production: Feature flags for new templates
class TemplateRolloutManager {
  constructor() {
    this.featureFlags = new Map();
  }

  enableTemplateForPercentage(templateType, percentage) {
    this.featureFlags.set(templateType, {
      enabled: true,
      rolloutPercentage: percentage,
      enabledUsers: new Set()
    });
  }

  isTemplateEnabled(templateType, userId) {
    const flag = this.featureFlags.get(templateType);
    if (!flag || !flag.enabled) return false;

    // Simple hash-based rollout
    const hash = this.hashUserId(userId);
    return hash < flag.rolloutPercentage;
  }

  hashUserId(userId) {
    // Simple hash function for consistent user assignment
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 100;
  }
}
```

## Recommendations by Use Case

### 🚀 **Small Projects (< 10 templates)**
- Use **Dynamic Registration** with file-based templates
- Simple, fast, easy to maintain

### 🏗️ **Medium Projects (10-50 templates)**
- Use **Configuration-Driven** approach
- Better organization, easier to edit

### 🏢 **Large Projects (50+ templates)**
- Use **Database-Driven** approach
- Full analytics, versioning, A/B testing
- Admin interface for template management

### 🔧 **Enterprise Projects**
- Use **Plugin Architecture**
- Team-based development, marketplace model
- Advanced analytics and monitoring

## Implementation Priority

1. **Phase 1:** Implement Dynamic Registration (2-3 days)
2. **Phase 2:** Add Template Analytics (1-2 days)
3. **Phase 3:** Database Integration (3-5 days)
4. **Phase 4:** Admin Interface (5-7 days)
5. **Phase 5:** Advanced Features (ongoing)

## Role-Based Access Control Implementation

### Dropdown Management System

**Updated 2025-11-24:** Comprehensive role-based filtering has been implemented for Discipline and Template Type dropdowns across all template management modals.

#### Implementation Overview
- **CREATE NEW TEMPLATE Modal:** Role-based discipline filtering using `getUserAssignableDisciplines()`
- **CREATE NEW FORM Modal:** Role-based discipline and form type filtering
- **AI TEMPLATE Modal:** Restricted to user-assignable disciplines
- **Document Upload Modal:** Proper discipline filtering while maintaining form generation capabilities

#### Key Functions
```javascript
// Returns disciplines available to current user (all for governance, limited for others)
getUserAssignableDisciplines()

// Returns template types available for selected discipline, filtered by user role
getTemplateTypeOptions(selectedDiscipline)
```

#### User Roles
- **Governance Users:** Full access to all disciplines (Civil Engineering, Procurement, HSSE Safety, Governance)
- **Discipline Users:** Limited to assigned discipline (typically Governance/01300)

#### Modal-Specific Behavior
- **Template modals:** Restricted by user role and discipline assignment
- **Document upload/generation:** Allows access to necessary disciplines for form creation
- **Build/Development modals:** Hardcoded to appropriate disciplines based on functionality

See **[0910_DROPDOWN_MANAGEMENT.md](../user-interface/0910_DROPDOWN_MANAGEMENT.md)** for complete dropdown management system documentation.

## Related Documentation

### 📋 Parent Governance System
- **[1300_01300_GOVERNANCE.md](../1300_01300_GOVERNANCE.md)** - Governance page technical guide and template management system overview
- **[1300_UNIFIED_TEMPLATES_IMPLEMENTATION_PLAN.md](../1300_UNIFIED_TEMPLATES_IMPLEMENTATION_PLAN.md)** - Complete unified templates system architecture and database-driven configuration
- **[0910_DROPDOWN_MANAGEMENT.md](../user-interface/0910_DROPDOWN_MANAGEMENT.md)** - Role-based dropdown management system

### 🏗️ Template System Components
- **[1300_TEMPLATE_GENERATION_IMPLEMENTATION_PLAN.md](../1300_TEMPLATE_GENERATION_IMPLEMENTATION_PLAN.md)** - Template generation planning and roadmap
- **[1300_TEMPLATE_GENERATION_ASYNC_SOLUTION_FINAL.md](../1300_TEMPLATE_GENERATION_ASYNC_SOLUTION_FINAL.md)** - Async processing implementation
- **[1300_DATABASE_DRIVEN_TEMPLATE_COMPLETION_SUMMARY.md](../1300_DATABASE_DRIVEN_TEMPLATE_COMPLETION_SUMMARY.md)** - Database integration details

### 🔧 Development Procedures
- **[1300_HTML_TEMPLATE_GENERATION_PROCEDURE.md](../1300_HTML_TEMPLATE_GENERATION_PROCEDURE.md)** - Template generation procedures
- **[1300_TEMPLATE_GENERATION_ERROR_RESOLUTION_SUMMARY.md](../1300_TEMPLATE_GENERATION_ERROR_RESOLUTION_SUMMARY.md)** - Error handling and resolution patterns

This scalable approach will handle template growth seamlessly as your application evolves! 🎯
