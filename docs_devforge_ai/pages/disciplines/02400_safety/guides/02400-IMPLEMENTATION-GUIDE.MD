# 1300_02400 Implementation Guide

## Overview

This document consolidates all implementation-related documentation for the HSE (02400) system, including contractor vetting, questionnaire generation, and technical architecture. It provides comprehensive guidance for developers, administrators, and stakeholders implementing or maintaining the HSE system components.

## Status
- [x] Consolidated from 9 implementation files
- [x] Technical details preserved
- [x] Cross-references updated
- [ ] Implementation verification pending

## Version History
- v1.0 (2025-12-11): Initial consolidation from fragmented implementation docs

## Table of Contents

### 1. System Architecture
### 2. Database Implementation
### 3. Frontend Components
### 4. Backend Services
### 5. Security Implementation
### 6. Testing Strategy
### 7. Deployment Procedures
### 8. Troubleshooting Guide
### 9. Future Enhancements

---

## 1. System Architecture

### Core Components Overview
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Client-Side Architecture
```
client/src/pages/02400-safety/
├── 02400-contractor-vetting/
│   ├── index.js                          # Entry point
│   ├── components/
│   │   ├── 02400-contractor-vetting-page.js  # Main component
│   │   └── css/
│   │       └── 02400-contractor-vetting.css  # Styling
│   └── README.md                         # Documentation
```

#### Server-Side Architecture
```
server/
├── services/
│   ├── template-generation-service.js    # Questionnaire generation
│   ├── questionnaire-template-service.cjs # Template population
│   └── questionnaire-config-service.cjs   # Configuration management
├── routes/
│   └── accordion-sections-routes.js      # Navigation integration
└── src/
    └── routes/
        └── process-routes.js             # Document processing
```

#### Database Architecture
```
Database Tables:
├── contractor_vetting                    # Main vetting records
├── contractor_vetting_sections          # Section tracking
├── a_02400_contractor_vetting_documents # Document metadata
├── contractor_evaluation_results        # Evaluation results
├── contractor_vetting_chat_messages     # Chat history
└── prompts                              # AI prompt storage
```

### Integration Points
**Source**: CONTRACTOR_VETTING_GUIDE.md

#### Document Processing Integration (Page 01300)
- **Upload Modal**: `01300-document-upload-modal.js`
- **Processing Route**: `/api/process` endpoint
- **Service Integration**: ExcelLoaderService + LangChain
- **Output Storage**: `contractor_evaluation_results` table

#### Navigation Integration
- **Accordion Routes**: `server/src/routes/accordion-sections-routes.js`
- **Client Routes**: `client/src/App.js`
- **Menu Structure**: Safety section with vetting submenu

---

## 2. Database Implementation

### Schema Design
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Core Tables Structure

**contractor_vetting**
```sql
CREATE TABLE contractor_vetting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  status TEXT DEFAULT 'draft',
  overall_score DECIMAL(5,2),
  recommendation TEXT,
  created_by UUID REFERENCES user_management(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**contractor_vetting_sections**
```sql
CREATE TABLE contractor_vetting_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vetting_id UUID REFERENCES contractor_vetting(id),
  section_name TEXT NOT NULL,
  section_order INTEGER,
  score DECIMAL(5,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Document Management Tables
**Source**: VETTING_UUID_MIGRATION_GUIDE.md

**a_02400_contractor_vetting_documents**
```sql
CREATE TABLE a_02400_contractor_vetting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vetting_id UUID REFERENCES contractor_vetting(id),
  section_id UUID REFERENCES contractor_vetting_sections(id),
  document_name TEXT NOT NULL,
  document_type TEXT,
  file_path TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES user_management(id),
  upload_date TIMESTAMP DEFAULT NOW(),
  ai_analysis_result JSONB,
  status TEXT DEFAULT 'uploaded'
);
```

### Security Implementation
**Source**: CONTRACTOR_VETTING_RLS_TESTING_GUIDE.md

#### Row Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE contractor_vetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_vetting_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE a_02400_contractor_vetting_documents ENABLE ROW LEVEL SECURITY;

-- Organization-based access policy
CREATE POLICY "organization_access" ON contractor_vetting
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM user_organization_access
    WHERE user_id = auth.uid()
  )
);
```

#### Storage Security
```sql
-- Storage bucket policies
CREATE POLICY "vetting_documents_access" ON storage.objects
FOR ALL USING (
  bucket_id = 'contractor-vetting' AND
  auth.role() = 'authenticated'
);
```

### Migration Strategy
**Source**: CONTRACTOR_VETTING_UUID_MIGRATION_GUIDE.md

#### UUID Migration Process
1. **Backup existing data**
2. **Create new UUID-based tables**
3. **Migrate data with proper foreign key relationships**
4. **Update application code to use UUIDs**
5. **Test all relationships and constraints**
6. **Deploy with zero downtime**

#### Data Migration Script
```sql
-- Migrate existing integer IDs to UUIDs
INSERT INTO contractor_vetting_new (id, contractor_name, ...)
SELECT gen_random_uuid(), contractor_name, ...
FROM contractor_vetting_old;

-- Update foreign key references
UPDATE contractor_vetting_sections_new
SET vetting_id = v.id
FROM contractor_vetting_new v
WHERE contractor_vetting_sections_new.old_vetting_id = v.old_id;
```

---

## 3. Frontend Components

### Main Component Structure
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### ContractorVettingPage Component
```jsx
function ContractorVettingPage() {
  const [activeTab, setActiveTab] = useState('details');
  const [vettingData, setVettingData] = useState({});
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'details', label: 'Contractor Details' },
    { id: 'financial', label: 'Financial Information' },
    { id: 'licensing', label: 'Licensing & Certifications' },
    { id: 'performance', label: 'Past Performance' },
    { id: 'safety', label: 'Health & Safety' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'employees', label: 'Employee Details' },
    { id: 'prequal', label: 'Pre-Qualification' },
    { id: 'agreements', label: 'Agreements & Contracts' }
  ];

  return (
    <div className="contractor-vetting-container">
      <Tabs activeKey={activeTab} onSelect={setActiveTab}>
        {tabs.map(tab => (
          <Tab key={tab.id} eventKey={tab.id} title={tab.label}>
            <VettingSection
              sectionId={tab.id}
              data={vettingData[tab.id]}
              onUpdate={(data) => updateSection(tab.id, data)}
            />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
```

### Document Upload Integration
**Source**: CONTRACTOR_VETTING_GUIDE.md

#### File Upload Component
```jsx
function DocumentUpload({ sectionId, vettingId, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (fileList) => {
    setUploading(true);
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sectionId', sectionId);
        formData.append('vettingId', vettingId);

        await fetch('/api/upload-vetting-document', {
          method: 'POST',
          body: formData
        });
      }
      onUploadComplete();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.png"
        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
        disabled={uploading}
      />
      {uploading && <div>Uploading...</div>}
    </div>
  );
}
```

---

## 4. Backend Services

### Template Generation Service
**Source**: Current implementation

#### Service Architecture
```javascript
class TemplateGenerationService {
  async generateHSSEQuestionnaireHTML(customPrompt, customizations = {}) {
    // Use QuestionnaireTemplateService for reliable generation
    const QuestionnaireTemplateService = require('./questionnaire-template-service.cjs');
    const templateService = new QuestionnaireTemplateService();

    const configId = customizations.configId || 'hsse-v1';
    const result = await templateService.generateFromConfig(configId);

    return result;
  }
}
```

### Questionnaire Template Service
**Source**: questionnaire-template-service.cjs

#### Template Population Logic
```javascript
class QuestionnaireTemplateService {
  async generateFromConfig(configId) {
    // 1. Load configuration
    const config = await this.configService.loadConfig(configId);

    // 2. Load HTML template
    const templateHTML = await this.loadTemplate();

    // 3. Populate template sections
    const populatedHTML = this.populateTemplate(templateHTML, config);

    return {
      title: config.title,
      html: populatedHTML,
      config,
      metadata: { configId, generatedAt: new Date().toISOString() }
    };
  }
}
```

### Configuration Management
**Source**: questionnaire-config-service.cjs

#### Configuration CRUD Operations
```javascript
class QuestionnaireConfigService {
  async loadConfig(configId) {
    const configPath = path.join(this.configsDir, `${configId}.json`);
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  }

  async saveConfig(configId, config) {
    const configPath = path.join(this.configsDir, `${configId}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return true;
  }
}
```

---

## 5. Security Implementation

### Authentication Integration
**Source**: CONTRACTOR_VETTING_RLS_TESTING_GUIDE.md

#### User Access Control
```javascript
// Organization-based access control
const checkUserAccess = async (userId, organizationId) => {
  const { data, error } = await supabase
    .from('user_organization_access')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    throw new Error('Access denied: User not authorized for this organization');
  }

  return true;
};
```

### Data Encryption
**Source**: CONTRACTOR_VETTING_RLS_TESTING_GUIDE.md

#### Sensitive Data Handling
```javascript
// Encrypt sensitive contractor data
const encryptContractorData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('contractor-data'));

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};
```

### Audit Logging
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Activity Tracking
```javascript
// Log all vetting activities
const logVettingActivity = async (vettingId, userId, action, details) => {
  await supabase
    .from('audit_log')
    .insert({
      table_name: 'contractor_vetting',
      record_id: vettingId,
      user_id: userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip_address: getClientIP(),
      user_agent: getUserAgent()
    });
};
```

---

## 6. Testing Strategy

### Unit Testing
**Source**: CONTRACTOR_VETTING_E2E_TEST_PLAN.md

#### Component Testing
```javascript
describe('ContractorVettingPage', () => {
  it('should load contractor details', async () => {
    render(<ContractorVettingPage />);
    expect(screen.getByText('Contractor Details')).toBeInTheDocument();
  });

  it('should handle document upload', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload Document');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Upload successful')).toBeInTheDocument();
    });
  });
});
```

### Integration Testing
**Source**: CONTRACTOR_VETTING_E2E_TEST_PLAN.md

#### End-to-End Workflows
```javascript
describe('Contractor Vetting Workflow', () => {
  it('should complete full vetting process', async () => {
    // 1. Create new contractor vetting
    const vettingId = await createContractorVetting({
      name: 'Test Contractor',
      organizationId: testOrgId
    });

    // 2. Upload required documents
    await uploadDocument(vettingId, 'financial', testFinancialDoc);
    await uploadDocument(vettingId, 'safety', testSafetyDoc);

    // 3. Complete all sections
    await completeVettingSection(vettingId, 'details', testDetails);
    await completeVettingSection(vettingId, 'financial', testFinancial);

    // 4. Generate evaluation
    const evaluation = await generateEvaluation(vettingId);
    expect(evaluation.score).toBeGreaterThan(0);
    expect(evaluation.recommendation).toBeDefined();
  });
});
```

### Performance Testing
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Load Testing
```javascript
describe('Performance Tests', () => {
  it('should handle multiple concurrent users', async () => {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        createContractorVetting({
          name: `Concurrent User ${i}`,
          organizationId: testOrgId
        })
      );
    }

    const results = await Promise.all(promises);
    expect(results.length).toBe(50);
    results.forEach(result => {
      expect(result.id).toBeDefined();
    });
  });
});
```

---

## 7. Deployment Procedures

### Database Deployment
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Schema Deployment
```bash
# Deploy database schema
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/create-contractor-vetting-tables.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/create-contractor-vetting-documents.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sql/create-contractor-vetting-storage.sql

# Verify deployment
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM contractor_vetting;"
```

### Application Deployment
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Build and Deploy
```bash
# Build client application
cd client
npm run build
cd ..

# Deploy server
pm2 restart ecosystem.config.js

# Verify deployment
curl -f https://your-domain.com/02400-safety/contractor-vetting
```

### Configuration Deployment
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Environment Setup
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Configure storage buckets
supabase storage create-bucket contractor-vetting --public=false
```

---

## 8. Troubleshooting Guide

### Common Issues
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Document Upload Failures
```javascript
// Check file size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_FILE_SIZE) {
  throw new Error('File size exceeds limit');
}

// Check file type
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('File type not allowed');
}
```

#### Database Connection Issues
```javascript
// Test database connectivity
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('contractor_vetting')
      .select('count')
      .limit(1);

    if (error) throw error;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

#### Permission Errors
```javascript
// Check user permissions
const checkPermissions = async (userId, organizationId) => {
  const { data, error } = await supabase
    .from('user_organization_access')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (error || !data.length) {
    throw new Error('Insufficient permissions');
  }

  return data[0];
};
```

### Performance Issues
**Source**: CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md

#### Query Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_contractor_vetting_organization
ON contractor_vetting(organization_id);

CREATE INDEX idx_contractor_vetting_status
ON contractor_vetting(status);

CREATE INDEX idx_vetting_documents_vetting_id
ON a_02400_contractor_vetting_documents(vetting_id);
```

#### Caching Strategy
```javascript
// Implement result caching
const cache = new Map();

const getCachedResult = async (key, fetchFunction) => {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await fetchFunction();
  cache.set(key, result);

  // Expire cache after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);

  return result;
};
```

---

## 9. Future Enhancements

### Advanced AI Integration
**Source**: CONTRACTOR_VETTING_MULTI_DISCIPLINE_SYSTEM.md

#### Automated Document Analysis
```javascript
// Enhanced AI analysis
const analyzeDocument = async (documentId, content) => {
  const analysis = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Analyze this contractor document and extract key information...'
      },
      {
        role: 'user',
        content: content
      }
    ]
  });

  return {
    compliance_score: analysis.compliance_score,
    risk_factors: analysis.risk_factors,
    recommendations: analysis.recommendations
  };
};
```

### Multi-Discipline Expansion
**Source**: CONTRACTOR_VETTING_MULTI_DISCIPLINE_SYSTEM_PART2.md

#### Discipline-Specific Templates
```javascript
const disciplineTemplates = {
  safety: 'hsse-v1',
  procurement: 'procurement-v1',
  finance: 'finance-v1',
  legal: 'legal-v1'
};

const getTemplateForDiscipline = (discipline) => {
  return disciplineTemplates[discipline] || 'generic-v1';
};
```

### Advanced Reporting
**Source**: CONTRACTOR_VETTING_WORKFLOW_STATUS.md

#### Analytics Dashboard
```javascript
// Generate comprehensive reports
const generateVettingReport = async (organizationId, dateRange) => {
  const vettings = await supabase
    .from('contractor_vetting')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  return {
    totalVettings: vettings.length,
    averageScore: calculateAverageScore(vettings),
    passRate: calculatePassRate(vettings),
    topIssues: identifyTopIssues(vettings),
    trends: analyzeTrends(vettings)
  };
};
```

---

## Implementation Checklist

### Database Setup
- [x] Core tables created
- [x] RLS policies implemented
- [x] Indexes optimized
- [x] Sample data loaded

### Frontend Implementation
- [x] Main component developed
- [x] Document upload integrated
- [x] Scoring system implemented
- [x] Responsive design applied

### Backend Services
- [x] Template generation service updated
- [x] Questionnaire population system implemented
- [x] Configuration management added
- [x] API endpoints secured

### Testing & Quality Assurance
- [x] Unit tests written
- [x] Integration tests completed
- [x] Performance benchmarks met
- [x] Security audit passed

### Documentation & Training
- [x] Implementation guide created
- [x] User documentation updated
- [x] Training materials prepared
- [x] Support procedures documented

---

## Related Documentation

- [1300_02400_HSE_MASTER_GUIDE.md](1300_02400_HSE_MASTER_GUIDE.md) - Main HSE system guide
- [1300_02400_CONTRACTOR_VETTING_GUIDE.md](1300_02400_CONTRACTOR_VETTING_GUIDE.md) - User guide
- [1300_02400_HSE_CONTENT_REFERENCE.md](1300_02400_HSE_CONTENT_REFERENCE.md) - HSE content reference

---

## Source Files Consolidated

This implementation guide consolidates content from the following archived files:
- `1300_02400_CONTRACTOR_VETTING_IMPLEMENTATION_SUMMARY.md`
- `1300_02400_CONTRACTOR_VETTING_IMPLEMENTATION_PLAN.md`
- `1300_02400_CONTRACTOR_VETTING_E2E_TEST_PLAN.md`
- `1300_02400_CONTRACTOR_VETTING_RLS_TESTING_GUIDE.md`
- `1300_02400_CONTRACTOR_VETTING_UUID_MIGRATION_GUIDE.md`
- `1300_02400_CONTRACTOR_VETTING_WORKFLOW_STATUS.md`
- `1300_02400_CONTRACTOR_VETTING_MULTI_DISCIPLINE_SYSTEM.md`
- `1300_02400_CONTRACTOR_VETTING_MULTI_DISCIPLINE_SYSTEM_PART2.md`
- `1300_02400_CONTRACTOR_SAFETY_VETTING_IMPLEMENTATION_PLAN.md`

All technical implementation details have been preserved and organized for improved developer access and maintenance.
