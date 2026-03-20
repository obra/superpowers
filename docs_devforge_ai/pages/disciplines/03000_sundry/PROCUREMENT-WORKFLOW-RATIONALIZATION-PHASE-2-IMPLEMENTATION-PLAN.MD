# Procurement Workflow Rationalization - Phase 2 Implementation Plan

## Executive Summary

**Phase 2 Focus**: Automated Section Population & Appendix Integration + Agent-Friendly Task Distribution & HITL Integration (Weeks 5-10)

This detailed implementation plan expands on the Phase 2 roadmap from the Procurement Workflow Rationalization Plan, providing specific technical tasks, dependencies, success criteria, and risk mitigation strategies for implementing automated section population, advanced Gantt chart integration, HITL workflows, and agent orchestration systems.

**Key Deliverables**:
- Automated SOW section population from Document Ordering Management
- Advanced Gantt chart integration with enterprise scheduling systems
- Agent orchestration system with capability detection and immediate task assignment
- HITL workflows for AI completions requiring human validation *(Note: HITL is not confined to complex appendices only, but applies to any AI-generated content requiring human review based on confidence thresholds, regulatory requirements, stakeholder preferences, or content complexity across all appendices A-F and general procurement documents)*
- Sequence management with intelligent processing order optimization
- Performance monitoring setup for all new services

**Success Criteria**:
- SOW sections auto-populate from pre-configured Document Ordering Management templates *(Note: This requires tight integration between Document Ordering Management (https://construct-ai.onrender.com/#/document-ordering-management?discipline=01900) for template type creation and Templates & Forms Management (https://construct-ai.onrender.com/#/templates-forms-management?discipline=01900) for actual template upload/generation. The workflow must ensure template types are created first, then templates are uploaded/generated, with automatic linking between the two systems)*

#### UI Implementation: Template Type to Template Linking Workflow

**Step 1: Template Type Creation in Document Ordering Management**
```javascript
// UI Flow: Document Ordering Management Interface
const DocumentOrderingInterface = ({ discipline }) => {
  const [templateTypes, setTemplateTypes] = useState([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState(null);

  const createTemplateType = async (typeData) => {
    // Create template type with metadata for linking
    const templateType = await api.createTemplateType({
      ...typeData,
      discipline,
      linkingKey: generateLinkingKey(), // Unique key for cross-system linking
      status: 'template_needed', // Indicates template upload required
      createdAt: new Date(),
      createdBy: currentUser.id
    });

    // Update UI to show linking status
    setTemplateTypes(prev => [...prev, templateType]);
  };

  return (
    <div className="document-ordering-interface">
      <div className="template-types-section">
        <h3>Document Template Types</h3>
        {templateTypes.map(type => (
          <TemplateTypeCard
            key={type.id}
            templateType={type}
            linkingStatus={type.status} // Shows if template is linked
            onEdit={() => editTemplateType(type)}
          />
        ))}

        <button onClick={() => showCreateModal()}>
          Create New Template Type
        </button>
      </div>

      <div className="linking-notifications">
        {templateTypes
          .filter(type => type.status === 'template_needed')
          .map(type => (
            <LinkingNotification
              key={type.id}
              templateType={type}
              targetUrl={`/templates-forms-management?discipline=${discipline}&link=${type.linkingKey}`}
              message="Template upload required - click to navigate to Templates & Forms Management"
            />
          ))
        }
      </div>
    </div>
  );
};
```

**Step 2: Template Upload with Automatic Linking in Templates & Forms Management**
```javascript
// UI Flow: Templates & Forms Management Interface
const TemplatesFormsInterface = ({ discipline, linkingKey }) => {
  const [templates, setTemplates] = useState([]);
  const [pendingLinks, setPendingLinks] = useState([]);

  useEffect(() => {
    if (linkingKey) {
      loadPendingTemplateLinks(linkingKey);
    }
  }, [linkingKey]);

  const loadPendingTemplateLinks = async (key) => {
    // Query Document Ordering Management for pending links
    const pending = await api.getPendingTemplateLinks(discipline, key);
    setPendingLinks(pending);
  };

  const uploadTemplateWithLinking = async (file, templateTypeId) => {
    // Upload template file
    const template = await api.uploadTemplate({
      file,
      discipline,
      uploadedBy: currentUser.id,
      uploadedAt: new Date()
    });

    // Automatically link to template type
    await api.linkTemplateToType({
      templateId: template.id,
      templateTypeId,
      linkingKey: generateLinkingKey(),
      linkedAt: new Date(),
      linkedBy: currentUser.id
    });

    // Update Document Ordering Management status
    await api.updateTemplateTypeStatus(templateTypeId, 'linked');

    // Refresh UI
    setTemplates(prev => [...prev, template]);
    setPendingLinks(prev => prev.filter(link => link.templateTypeId !== templateTypeId));
  };

  return (
    <div className="templates-forms-interface">
      {/* Pending Links Section */}
      {pendingLinks.length > 0 && (
        <div className="pending-links-alert">
          <h4>⚠️ Pending Template Links</h4>
          <p>The following template types need templates uploaded:</p>
          {pendingLinks.map(link => (
            <PendingLinkCard
              key={link.templateTypeId}
              link={link}
              onUpload={(file) => uploadTemplateWithLinking(file, link.templateTypeId)}
            />
          ))}
        </div>
      )}

      {/* Template Upload Section */}
      <div className="template-upload-section">
        <h3>Upload New Templates</h3>
        <FileUpload
          onUpload={handleTemplateUpload}
          acceptedTypes={['.docx', '.pdf', '.xlsx']}
          maxSize="10MB"
        />

        {/* Auto-linking options */}
        <div className="linking-options">
          <label>
            <input
              type="checkbox"
              checked={autoLinkEnabled}
              onChange={(e) => setAutoLinkEnabled(e.target.checked)}
            />
            Automatically link to pending template types
          </label>
        </div>
      </div>

      {/* Linked Templates Display */}
      <div className="linked-templates-section">
        <h3>Linked Templates</h3>
        {templates
          .filter(template => template.linkedTypeId)
          .map(template => (
            <LinkedTemplateCard
              key={template.id}
              template={template}
              linkedType={templateTypes.find(type => type.id === template.linkedTypeId)}
            />
          ))
        }
      </div>
    </div>
  );
};
```

**Step 3: SOW Generation with Template Resolution**
```javascript
// UI Flow: SOW Generation Interface with Template Resolution
const SOWGenerationInterface = ({ orderId }) => {
  const [templateResolution, setTemplateResolution] = useState({});
  const [missingTemplates, setMissingTemplates] = useState([]);

  const resolveTemplatesForOrder = async () => {
    // Get required template types from Document Ordering Management
    const requiredTypes = await documentOrderingApi.getRequiredTemplateTypes(orderId);

    // Check which templates are available and linked
    const resolution = {};
    const missing = [];

    for (const type of requiredTypes) {
      const linkedTemplate = await templateApi.getLinkedTemplate(type.id);

      if (linkedTemplate) {
        resolution[type.id] = {
          status: 'available',
          template: linkedTemplate,
          templateType: type
        };
      } else {
        resolution[type.id] = {
          status: 'missing',
          templateType: type
        };
        missing.push(type);
      }
    }

    setTemplateResolution(resolution);
    setMissingTemplates(missing);

    return Object.values(resolution).every(r => r.status === 'available');
  };

  const generateSOWWithTemplates = async () => {
    const templatesReady = await resolveTemplatesForOrder();

    if (!templatesReady) {
      // Show template resolution required modal
      showTemplateResolutionModal(missingTemplates);
      return;
    }

    // Proceed with SOW generation using resolved templates
    await sowGenerationApi.generateSOW(orderId, templateResolution);
  };

  return (
    <div className="sow-generation-interface">
      {/* Template Resolution Status */}
      <div className="template-resolution-section">
        <h3>Template Resolution Status</h3>
        <TemplateResolutionStatus
          resolution={templateResolution}
          onResolveMissing={() => showTemplateResolutionModal(missingTemplates)}
        />
      </div>

      {/* SOW Generation Controls */}
      <div className="generation-controls">
        <button
          onClick={generateSOWWithTemplates}
          disabled={missingTemplates.length > 0}
          className="btn btn-primary"
        >
          {missingTemplates.length > 0
            ? `Resolve ${missingTemplates.length} Missing Templates`
            : 'Generate SOW'
          }
        </button>
      </div>

      {/* Template Resolution Modal */}
      <TemplateResolutionModal
        missingTemplates={missingTemplates}
        onNavigateToTemplates={() => navigateToTemplatesForms(missingTemplates)}
        onCreateTemplates={() => showCreateTemplateWizard(missingTemplates)}
      />
    </div>
  );
};
```

**Cross-System Integration Architecture**
```javascript
// Backend: Template Linking Service
class TemplateLinkingService {
  constructor() {
    this.linkingCache = new Map();
    this.syncIntervals = new Map();
  }

  // Establish bidirectional linking between systems
  async establishTemplateLink(templateTypeId, templateId, linkingKey) {
    // Create link record in both systems
    await Promise.all([
      documentOrderingApi.createTemplateLink(templateTypeId, {
        linkedTemplateId: templateId,
        linkingKey,
        linkedAt: new Date()
      }),
      templateApi.createTemplateLink(templateId, {
        linkedTypeId: templateTypeId,
        linkingKey,
        linkedAt: new Date()
      })
    ]);

    // Update status in both systems
    await this.updateLinkingStatus(templateTypeId, templateId, 'linked');

    // Cache the link for fast resolution
    this.linkingCache.set(linkingKey, {
      templateTypeId,
      templateId,
      linkedAt: new Date()
    });
  }

  // Resolve template for SOW generation
  async resolveTemplateForSOW(templateTypeId, orderId) {
    // Check cache first
    const cachedLink = Array.from(this.linkingCache.values())
      .find(link => link.templateTypeId === templateTypeId);

    if (cachedLink) {
      return await templateApi.getTemplate(cachedLink.templateId);
    }

    // Fallback to database lookup
    const link = await databaseApi.findTemplateLink(templateTypeId);
    if (link) {
      return await templateApi.getTemplate(link.templateId);
    }

    // Template not linked
    throw new Error(`No template linked to template type ${templateTypeId}`);
  }

  // Real-time sync between systems
  startLinkingSynchronization() {
    // Sync every 30 seconds
    const syncInterval = setInterval(async () => {
      await this.synchronizeLinkingStatus();
    }, 30 * 1000);

    this.syncIntervals.set('linking_sync', syncInterval);
  }

  // Ensure both systems have consistent linking status
  async synchronizeLinkingStatus() {
    const [orderingLinks, templateLinks] = await Promise.all([
      documentOrderingApi.getAllTemplateLinks(),
      templateApi.getAllTemplateLinks()
    ]);

    // Find inconsistencies and resolve them
    const inconsistencies = this.findLinkingInconsistencies(orderingLinks, templateLinks);

    for (const inconsistency of inconsistencies) {
      await this.resolveLinkingInconsistency(inconsistency);
    }
  }
}
```

**User Experience Flow**
1. **Document Ordering Management**: User creates template type → System shows "template needed" status with navigation link
2. **Templates & Forms Management**: User uploads template → System automatically detects pending links and offers auto-linking
3. **SOW Generation**: System resolves all required templates → If missing, shows clear resolution path
4. **Real-time Updates**: Both systems stay synchronized with linking status changes

**Error Handling & Validation**
```javascript
// Validation rules for template linking
const templateLinkingValidation = {
  // Ensure template type exists before linking
  validateTemplateTypeExists: async (templateTypeId) => {
    const exists = await documentOrderingApi.templateTypeExists(templateTypeId);
    if (!exists) {
      throw new Error('Template type not found in Document Ordering Management');
    }
  },

  // Validate template file compatibility
  validateTemplateCompatibility: (file, templateType) => {
    const allowedTypes = templateType.allowedFileTypes || ['.docx', '.pdf'];
    const maxSize = templateType.maxFileSize || 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(path.extname(file.name))) {
      throw new Error(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
    }
  },

  // Check for duplicate links
  validateUniqueLinking: async (templateTypeId, templateId) => {
    const existingLink = await databaseApi.findExistingLink(templateTypeId, templateId);
    if (existingLink) {
      throw new Error('Template is already linked to this template type');
    }
  }
};
```

This UI implementation ensures seamless workflow progression from template type creation to template upload, with automatic linking, real-time status updates, and clear user guidance throughout the process.
- Gantt charts sync bidirectionally with procurement schedules and enterprise systems *(Note: While gantt charts are not currently implemented elsewhere in the enterprise, this Phase 2 implementation anticipates this requirement and provides the foundation for future enterprise-wide gantt integration)*
- Agents immediately assign tasks upon capability detection with <30 second response time
- HITL tasks created automatically for AI completions requiring human validation
- Sequence processing optimized for procurement workflow efficiency
- Performance monitoring provides real-time metrics and automated alerts

---

## 1. Automated Section Population & Document Ordering Integration

### 1.1 Intelligent SOW Section Auto-Population

#### Objective
Eliminate manual section ordering by automatically populating SOW sections from Document Ordering Management configurations, ensuring consistent application of pre-configured templates across all procurement orders.

#### Technical Tasks

**1.1.1 Document Ordering Management Integration Service**
```javascript
// server/src/services/documentOrderingIntegrationService.js
class DocumentOrderingIntegrationService {
  // Get sections for procurement order based on template variation
  async getSectionsForProcurementOrder(orderId) {
    const order = await procurementService.getOrder(orderId);

    if (!order.templateVariation) {
      throw new Error('Template variation must be selected for section population');
    }

    // Get sections from Document Ordering Management
    const sections = await documentOrderingService.getSectionsForTemplate(
      order.discipline,
      null, // No contract type filter for procurement
      order.templateVariation
    );

    // Apply procurement-specific customizations
    return this.customizeSectionsForProcurement(sections, order);
  }

  // Customize sections for procurement context
  customizeSectionsForProcurement(sections, order) {
    return sections.map(section => ({
      ...section,
      procurementContext: {
        orderId: order.id,
        templateVariation: order.templateVariation,
        disciplineAssignments: order.disciplineAssignments,
        appendicesRequired: this.determineRequiredAppendices(order)
      },
      autoPopulationRules: this.getAutoPopulationRules(section, order)
    }));
  }

  // Determine which appendices are required based on order characteristics
  determineRequiredAppendices(order) {
    const appendices = ['A']; // Product specifications always required

    // Appendix B: Safety Data Sheets for hazardous materials
    if (order.containsHazardousMaterials || order.equipmentInvolved) {
      appendices.push('B');
    }

    // Appendix C: Delivery schedules for complex orders
    if (order.deliveryScheduleRequired || order.multipleMilestones) {
      appendices.push('C');
    }

    // Appendix D: Training for equipment/materials
    if (order.equipmentInvolved || order.materialTrainingRequired) {
      appendices.push('D');
    }

    // Appendix E: Logistics for international/complex shipping
    if (order.internationalShipping || order.complexLogistics) {
      appendices.push('E');
    }

    // Appendix F: Standards compliance for regulated materials
    if (order.regulatedMaterials || order.qualityStandardsRequired) {
      appendices.push('F');
    }

    return appendices;
  }

  // Get auto-population rules for each section
  getAutoPopulationRules(section, order) {
    const rules = {
      dataSources: [],
      validationRules: [],
      formattingRules: []
    };

    // Define data sources based on section type
    switch (section.sectionType) {
      case 'specifications':
        rules.dataSources = ['procurement_order.equipment_specs', 'supplier_catalog'];
        rules.validationRules = ['specs_completeness', 'supplier_confirmation'];
        break;

      case 'safety':
        rules.dataSources = ['safety_data_sheets', 'hazard_analysis'];
        rules.validationRules = ['sds_completeness', 'regulatory_compliance'];
        break;

      case 'delivery':
        rules.dataSources = ['delivery_schedule', 'supplier_lead_times'];
        rules.validationRules = ['schedule_realism', 'dependency_validation'];
        break;

      case 'training':
        rules.dataSources = ['equipment_manual', 'training_curriculum'];
        rules.validationRules = ['training_completeness', 'certification_requirements'];
        break;
    }

    return rules;
  }
}
```

**1.1.2 SOW Generation Enhancement**
```javascript
// server/src/services/sowGenerationService.js (enhanced)
class SOWGenerationService {
  constructor() {
    this.documentOrderingIntegration = new DocumentOrderingIntegrationService();
    this.sectionPopulationEngine = new SectionPopulationEngine();
  }

  // Generate SOW with auto-populated sections
  async generateSOW(orderId) {
    const order = await procurementService.getOrder(orderId);

    // Get pre-configured sections from Document Ordering Management
    const sections = await this.documentOrderingIntegration.getSectionsForProcurementOrder(orderId);

    // Auto-populate sections based on rules
    const populatedSections = await this.autoPopulateSections(sections, order);

    // Apply template-specific formatting
    const formattedSOW = await this.applyTemplateFormatting(populatedSections, order.templateVariation);

    return {
      orderId,
      templateVariation: order.templateVariation,
      sections: formattedSOW,
      metadata: {
        autoPopulated: true,
        populatedAt: new Date(),
        appendicesIncluded: sections.filter(s => s.isAppendix).map(s => s.appendixCode)
      }
    };
  }

  // Auto-populate sections based on defined rules
  async autoPopulateSections(sections, order) {
    const populatedSections = [];

    for (const section of sections) {
      const populatedSection = await this.sectionPopulationEngine.populateSection(
        section,
        order
      );
      populatedSections.push(populatedSection);
    }

    return populatedSections;
  }

  // Apply template variation formatting
  async applyTemplateFormatting(sections, templateVariation) {
    const formattingRules = await this.getTemplateFormattingRules(templateVariation);

    return sections.map(section => ({
      ...section,
      formatting: {
        ...section.formatting,
        ...formattingRules
      }
    }));
  }
}

// Section Population Engine
class SectionPopulationEngine {
  // Populate individual section content
  async populateSection(section, order) {
    const { dataSources, validationRules } = section.autoPopulationRules;

    // Gather data from multiple sources
    const sectionData = await this.gatherSectionData(dataSources, order);

    // Generate content using AI or templates
    const content = await this.generateSectionContent(section, sectionData, order);

    // Apply validation rules
    const validationResults = await this.validateSectionContent(content, validationRules);

    return {
      ...section,
      content,
      validationResults,
      populated: true,
      confidence: this.calculatePopulationConfidence(validationResults)
    };
  }

  // Gather data from configured sources
  async gatherSectionData(dataSources, order) {
    const data = {};

    for (const source of dataSources) {
      const sourceData = await this.fetchDataFromSource(source, order);
      Object.assign(data, sourceData);
    }

    return data;
  }

  // Generate section content
  async generateSectionContent(section, data, order) {
    // Use AI generation for complex sections
    if (section.complexity === 'high') {
      return await aiService.generateSectionContent(section, data, order);
    }

    // Use template-based generation for standard sections
    return await templateService.populateSectionTemplate(section, data);
  }
}
```

**1.1.3 Frontend SOW Generation Interface**
```javascript
// client/src/components/procurement/SOWGenerationInterface.js
const SOWGenerationInterface = ({ orderId }) => {
  const [sowData, setSowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [populationStatus, setPopulationStatus] = useState({});

  useEffect(() => {
    loadSOWData();
  }, [orderId]);

  const loadSOWData = async () => {
    setLoading(true);
    try {
      const data = await procurementApi.generateSOW(orderId);
      setSowData(data);
      setPopulationStatus(this.analyzePopulationStatus(data.sections));
    } catch (error) {
      console.error('Failed to generate SOW:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePopulationStatus = (sections) => {
    const status = {
      totalSections: sections.length,
      autoPopulated: sections.filter(s => s.populated).length,
      needsReview: sections.filter(s => s.validationResults?.warnings?.length > 0).length,
      completed: 0
    };

    status.completed = status.autoPopulated - status.needsReview;
    return status;
  };

  const handleSectionEdit = async (sectionId, content) => {
    await procurementApi.updateSOWSection(orderId, sectionId, content);
    await loadSOWData(); // Refresh data
  };

  if (loading) {
    return <div>Loading SOW...</div>;
  }

  return (
    <div className="sow-generation-interface">
      <div className="population-summary">
        <h3>SOW Generation Status</h3>
        <div className="status-metrics">
          <span>Total Sections: {populationStatus.totalSections}</span>
          <span>Auto-Populated: {populationStatus.autoPopulated}</span>
          <span>Needs Review: {populationStatus.needsReview}</span>
          <span>Ready: {populationStatus.completed}</span>
        </div>
      </div>

      <div className="sections-list">
        {sowData?.sections.map(section => (
          <SOWSection
            key={section.id}
            section={section}
            onEdit={handleSectionEdit}
          />
        ))}
      </div>

      <div className="actions">
        <button
          onClick={() => procurementApi.finalizeSOW(orderId)}
          disabled={populationStatus.needsReview > 0}
        >
          Finalize SOW
        </button>
      </div>
    </div>
  );
};

// Individual SOW section component
const SOWSection = ({ section, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(section.content);

  const handleSave = () => {
    onEdit(section.id, content);
    setEditing(false);
  };

  return (
    <div className={`sow-section ${section.populated ? 'populated' : 'manual'}`}>
      <div className="section-header">
        <h4>{section.title}</h4>
        <div className="section-meta">
          <span className={`population-status ${section.populated ? 'auto' : 'manual'}`}>
            {section.populated ? 'Auto-Populated' : 'Manual Entry'}
          </span>
          {section.confidence && (
            <span className="confidence">Confidence: {section.confidence}%</span>
          )}
        </div>
      </div>

      <div className="section-content">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
          />
        ) : (
          <div className="content-display">
            {content || 'No content generated yet'}
          </div>
        )}
      </div>

      {section.validationResults?.warnings?.length > 0 && (
        <div className="validation-warnings">
          <h5>Review Required:</h5>
          <ul>
            {section.validationResults.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="section-actions">
        {editing ? (
          <>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>
    </div>
  );
};
```

#### Success Criteria
- [ ] SOW sections auto-populate from Document Ordering Management configurations
- [ ] Template variations apply consistent formatting and structure
- [ ] Section population rules respect data source availability and validation requirements
- [ ] Frontend displays population status and allows manual overrides
- [ ] Appendices automatically included based on order characteristics
- [ ] Validation warnings highlight sections needing human review

#### Dependencies
- Document Ordering Management system with template variations
- AI content generation service for complex sections
- Template service for standard section population
- Procurement order data with sufficient detail for auto-population

#### Risk Mitigation
- **Data Quality**: Implement fallback to manual entry if auto-population fails
- **Validation Gaps**: Comprehensive validation rules prevent invalid content
- **Performance**: Background processing for large SOW generations
- **User Training**: Clear indicators for auto-populated vs manual content

---

## 2. Advanced Gantt Chart Integration & Enterprise Synchronization

### 2.1 Enterprise Gantt Integration Architecture

#### Objective
Implement bidirectional synchronization between procurement Gantt charts and enterprise scheduling systems (Primavera P6, MS Project, Asta Powerproject) with conflict resolution and real-time updates.

#### Technical Tasks

**2.1.1 Gantt Synchronization Service**
```javascript
// server/src/services/ganttSynchronizationService.js
class GanttSynchronizationService {
  constructor() {
    this.externalSystems = {
      primavera: new PrimaveraIntegrationService(),
      msproject: new MSProjectIntegrationService(),
      asta: new AstaIntegrationService()
    };
  }

  // Bidirectional sync with enterprise systems
  async synchronizeGanttChart(orderId, externalSystem, externalProjectId) {
    const procurementSchedule = await procurementService.getDeliverySchedule(orderId);

    // Export to external format
    const externalFormat = await this.exportToExternalFormat(
      procurementSchedule,
      externalSystem
    );

    // Push to external system
    const syncResult = await this.externalSystems[externalSystem].pushSchedule(
      externalProjectId,
      externalFormat
    );

    // Handle conflicts and updates
    const conflicts = await this.detectConflicts(orderId, syncResult);
    if (conflicts.length > 0) {
      await this.resolveConflicts(orderId, conflicts, syncResult);
    }

    // Pull latest from external system
    const latestExternal = await this.externalSystems[externalSystem].pullSchedule(
      externalProjectId
    );

    // Update procurement schedule
    await this.updateProcurementSchedule(orderId, latestExternal);

    return {
      syncStatus: 'completed',
      conflictsResolved: conflicts.length,
      lastSync: new Date(),
      nextSync: this.calculateNextSync()
    };
  }

  // Export procurement schedule to external formats
  async exportToExternalFormat(schedule, targetSystem) {
    const transformers = {
      primavera: this.transformToPrimavera,
      msproject: this.transformToMSProject,
      asta: this.transformToAsta
    };

    return await transformers[targetSystem](schedule);
  }

  // Transform to Primavera P6 format
  async transformToPrimavera(schedule) {
    return {
      activities: schedule.milestones.map(milestone => ({
        activity_id: milestone.id,
        activity_name: milestone.name,
        start_date: milestone.startDate,
        finish_date: milestone.endDate,
        percent_complete: milestone.progress,
        wbs_code: milestone.wbsCode,
        procurement_reference: milestone.procurementOrderId
      })),
      relationships: schedule.dependencies.map(dep => ({
        predecessor: dep.predecessorId,
        successor: dep.successorId,
        type: this.mapDependencyType(dep.type, 'primavera'),
        lag: dep.lag || 0
      })),
      resources: await this.getResourceAssignments(schedule)
    };
  }

  // Conflict detection and resolution
  async detectConflicts(orderId, externalUpdate) {
    const procurementSchedule = await procurementService.getDeliverySchedule(orderId);
    const conflicts = [];

    // Compare milestones
    for (const externalMilestone of externalUpdate.activities) {
      const procurementMilestone = procurementSchedule.milestones.find(
        m => m.id === externalMilestone.activity_id
      );

      if (procurementMilestone) {
        const conflicts = this.compareMilestones(procurementMilestone, externalMilestone);
        if (conflicts.length > 0) {
          conflicts.push({
            type: 'milestone',
            id: externalMilestone.activity_id,
            procurement: procurementMilestone,
            external: externalMilestone,
            conflicts
          });
        }
      }
    }

    return conflicts;
  }

  // Intelligent conflict resolution
  async resolveConflicts(orderId, conflicts, resolutionStrategy = 'auto') {
    const resolutions = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, resolutionStrategy);
      resolutions.push(resolution);

      // Apply resolution
      await this.applyConflictResolution(orderId, conflict, resolution);
    }

    // Log resolutions for audit
    await this.logConflictResolutions(orderId, resolutions);

    return resolutions;
  }

  // Resolve individual conflict
  async resolveConflict(conflict, strategy) {
    switch (strategy) {
      case 'procurement_wins':
        return { winner: 'procurement', reason: 'Procurement schedule takes precedence' };

      case 'external_wins':
        return { winner: 'external', reason: 'Enterprise system is authoritative' };

      case 'auto':
      default:
        return await this.intelligentConflictResolution(conflict);
    }
  }

  // AI-powered conflict resolution
  async intelligentConflictResolution(conflict) {
    const context = {
      conflict,
      procurementPriority: await this.getProcurementPriority(conflict.id),
      externalImpact: await this.getExternalImpact(conflict),
      scheduleCriticality: await this.getScheduleCriticality(conflict)
    };

    // Use AI to determine best resolution
    const resolution = await aiService.resolveScheduleConflict(context);

    return {
      winner: resolution.recommendedWinner,
      reason: resolution.explanation,
      confidence: resolution.confidence
    };
  }
}
```

**2.1.2 Real-Time Synchronization Engine**
```javascript
// server/src/services/realTimeSyncEngine.js
class RealTimeSyncEngine {
  constructor() {
    this.syncIntervals = new Map();
    this.webSocketConnections = new Map();
  }

  // Start real-time sync for procurement order
  async startRealTimeSync(orderId, externalSystem, externalProjectId) {
    // Stop existing sync if running
    await this.stopRealTimeSync(orderId);

    // Setup WebSocket connection for real-time updates
    const wsConnection = await this.setupWebSocketConnection(externalSystem, externalProjectId);

    // Setup sync interval (every 5 minutes by default)
    const syncInterval = setInterval(async () => {
      try {
        await ganttSyncService.synchronizeGanttChart(orderId, externalSystem, externalProjectId);
      } catch (error) {
        console.error(`Sync failed for order ${orderId}:`, error);
        await this.handleSyncError(orderId, error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Store sync state
    this.syncIntervals.set(orderId, syncInterval);
    this.webSocketConnections.set(orderId, wsConnection);

    // Initial sync
    await ganttSyncService.synchronizeGanttChart(orderId, externalSystem, externalProjectId);

    return {
      status: 'active',
      syncInterval: '5 minutes',
      websocket: 'connected',
      lastSync: new Date()
    };
  }

  // Setup WebSocket connection for real-time updates
  async setupWebSocketConnection(externalSystem, externalProjectId) {
    const systemConfigs = {
      primavera: { url: process.env.PRIMAVERA_WS_URL, apiKey: process.env.PRIMAVERA_API_KEY },
      msproject: { url: process.env.MSPROJECT_WS_URL, apiKey: process.env.MSPROJECT_API_KEY },
      asta: { url: process.env.ASTA_WS_URL, apiKey: process.env.ASTA_API_KEY }
    };

    const config = systemConfigs[externalSystem];
    if (!config) {
      throw new Error(`WebSocket configuration not found for ${externalSystem}`);
    }

    const connection = new WebSocket(`${config.url}/projects/${externalProjectId}`);

    connection.onopen = () => {
      console.log(`WebSocket connected for ${externalSystem} project ${externalProjectId}`);
    };

    connection.onmessage = async (event) => {
      const update = JSON.parse(event.data);
      await this.handleRealTimeUpdate(externalSystem, externalProjectId, update);
    };

    connection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    connection.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return connection;
  }

  // Handle real-time updates from external systems
  async handleRealTimeUpdate(externalSystem, externalProjectId, update) {
    // Find procurement order linked to this external project
    const orderId = await this.findOrderByExternalProject(externalSystem, externalProjectId);

    if (orderId) {
      // Apply real-time update
      await ganttSyncService.applyRealTimeUpdate(orderId, update);

      // Notify connected clients
      await this.notifyClients(orderId, update);
    }
  }

  // Stop real-time sync
  async stopRealTimeSync(orderId) {
    const interval = this.syncIntervals.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(orderId);
    }

    const connection = this.webSocketConnections.get(orderId);
    if (connection) {
      connection.close();
      this.webSocketConnections.delete(orderId);
    }
  }

  // Get sync status for order
  getSyncStatus(orderId) {
    const hasInterval = this.syncIntervals.has(orderId);
    const hasConnection = this.webSocketConnections.has(orderId);

    return {
      active: hasInterval && hasConnection,
      syncInterval: hasInterval,
      realTimeUpdates: hasConnection,
      lastChecked: new Date()
    };
  }
}
```

**2.1.3 Enhanced Gantt Chart Frontend**
```javascript
// client/src/components/gantt/EnterpriseGanttChart.js
class EnterpriseGanttChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      syncStatus: 'disconnected',
      externalSystems: [],
      conflicts: [],
      realTimeEnabled: false
    };
  }

  componentDidMount() {
    this.initializeGantt();
    this.loadExternalSystems();
    this.checkSyncStatus();
  }

  async loadExternalSystems() {
    const systems = await ganttApi.getAvailableExternalSystems();
    this.setState({ externalSystems: systems });
  }

  async checkSyncStatus() {
    const status = await ganttApi.getSyncStatus(this.props.orderId);
    this.setState({
      syncStatus: status.active ? 'active' : 'inactive',
      realTimeEnabled: status.realTimeUpdates
    });
  }

  async setupEnterpriseSync(externalSystem, projectId) {
    try {
      await ganttApi.setupEnterpriseSync(this.props.orderId, externalSystem, projectId);
      await this.checkSyncStatus();

      // Start real-time sync if available
      if (this.state.externalSystems.find(s => s.id === externalSystem).realTimeSupport) {
        await this.enableRealTimeSync();
      }
    } catch (error) {
      console.error('Failed to setup enterprise sync:', error);
    }
  }

  async enableRealTimeSync() {
    await ganttApi.enableRealTimeSync(this.props.orderId);
    this.setState({ realTimeEnabled: true });
  }

  async handleSyncNow() {
    await ganttApi.synchronizeNow(this.props.orderId);
    await this.checkSyncStatus();
  }

  async handleConflicts() {
    const conflicts = await ganttApi.getConflicts(this.props.orderId);
    this.setState({ conflicts });

    if (conflicts.length > 0) {
      // Show conflict resolution dialog
      this.showConflictResolutionDialog(conflicts);
    }
  }

  render() {
    const { syncStatus, externalSystems, conflicts, realTimeEnabled } = this.state;

    return (
      <div className="enterprise-gantt-chart">
        <div className="gantt-toolbar">
          <div className="sync-controls">
            <div className="sync-status">
              <span className={`status-indicator ${syncStatus}`}></span>
              Sync: {syncStatus}
              {realTimeEnabled && <span className="real-time-badge">Real-time</span>}
            </div>

            <div className="sync-actions">
              <button onClick={this.handleSyncNow}>Sync Now</button>
              <button onClick={this.handleConflicts}>
                Conflicts ({conflicts.length})
              </button>
            </div>
          </div>

          <div className="enterprise-integration">
            <select onChange={(e) => this.setSelectedSystem(e.target.value)}>
              <option value="">Select External System...</option>
              {externalSystems.map(system => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="External Project ID"
              onChange={(e) => this.setExternalProjectId(e.target.value)}
            />
            <button onClick={() => this.setupEnterpriseSync(
              this.state.selectedSystem,
              this.state.externalProjectId
            )}>
              Setup Sync
            </button>
          </div>
        </div>

        <div ref={this.ganttContainer} className="gantt-container" />

        <ConflictResolutionDialog
          conflicts={conflicts}
          onResolve={this.handleConflictResolution}
          visible={conflicts.length > 0}
        />
      </div>
    );
  }
}
```

#### Success Criteria
- [ ] Bidirectional sync with Primavera P6, MS Project, and Asta Powerproject
- [ ] Real-time updates via WebSocket connections
- [ ] Intelligent conflict resolution with AI assistance
- [ ] Export/import in multiple enterprise formats
- [ ] Frontend shows sync status and conflict indicators
- [ ] Audit trail of all synchronization activities

#### Dependencies
- External system APIs and credentials
- WebSocket infrastructure for real-time updates
- Conflict resolution AI service
- Enterprise system integration libraries

#### Risk Mitigation
- **API Changes**: Version-aware API handling with fallbacks
- **Connection Failures**: Offline mode with automatic reconnection
- **Data Conflicts**: Comprehensive conflict detection and resolution strategies
- **Performance**: Background processing for large schedule synchronizations

---

## 3. Agent Orchestration System & Immediate Task Assignment

### 3.1 Agent Capability Detection & Orchestration

#### Objective
Implement real-time agent capability detection with immediate task assignment upon agent availability, enabling autonomous workflow progression without manual intervention.

#### Technical Tasks

**3.1.1 Agent Capability Monitor**
```javascript
// server/src/services/agentCapabilityMonitor.js
class AgentCapabilityMonitor {
  constructor() {
    this.capabilityCache = new Map();
    this.monitoringIntervals = new Map();
    this.capabilityWebSockets = new Map();
  }

  // Start monitoring agent capabilities
  async startCapabilityMonitoring() {
    // Monitor all active agents
    const agents = await agentService.getAllActiveAgents();

    for (const agent of agents) {
      await this.startAgentMonitoring(agent.id);
    }
  }

  // Start monitoring individual agent
  async startAgentMonitoring(agentId) {
    // Stop existing monitoring
    await this.stopAgentMonitoring(agentId);

    const agent = await agentService.getAgent(agentId);

    // Setup real-time capability monitoring
    const wsConnection = await this.setupCapabilityWebSocket(agent);
    this.capabilityWebSockets.set(agentId, wsConnection);

    // Setup periodic capability checks (every 30 seconds)
    const monitoringInterval = setInterval(async () => {
      await this.checkAgentCapability(agentId);
    }, 30 * 1000);

    this.monitoringIntervals.set(agentId, monitoringInterval);

    // Initial capability check
    await this.checkAgentCapability(agentId);
  }

  // Setup WebSocket for real-time capability updates
  async setupCapabilityWebSocket(agent) {
    const wsUrl = `${process.env.AGENT_WS_URL}/agents/${agent.id}/capability`;

    const connection = new WebSocket(wsUrl, [], {
      headers: {
        'Authorization': `Bearer ${process.env.AGENT_API_KEY}`,
        'Agent-Version': agent.version
      }
    });

    connection.onopen = () => {
      console.log(`Capability monitoring started for agent ${agent.id}`);
    };

    connection.onmessage = async (event) => {
      const capabilityUpdate = JSON.parse(event.data);
      await this.handleCapabilityUpdate(agent.id, capabilityUpdate);
    };

    connection.onclose = () => {
      console.log(`Capability monitoring stopped for agent ${agent.id}`);
      // Attempt reconnection after delay
      setTimeout(() => this.startAgentMonitoring(agent.id), 5000);
    };

    connection.onerror = (error) => {
      console.error(`Capability monitoring error for agent ${agent.id}:`, error);
    };

    return connection;
  }

  // Check agent capability
  async checkAgentCapability(agentId) {
    try {
      const agent = await agentService.getAgent(agentId);
      const capability = await this.assessAgentCapability(agent);

      // Update capability cache
      this.capabilityCache.set(agentId, {
        ...capability,
        lastChecked: new Date(),
        agent
      });

      // Trigger task assignment if capable
      if (capability.ready) {
        await this.triggerTaskAssignment(agentId, capability);
      }

    } catch (error) {
      console.error(`Capability check failed for agent ${agentId}:`, error);
      await this.handleCapabilityCheckError(agentId, error);
    }
  }

  // Assess agent capability
  async assessAgentCapability(agent) {
    const capability = {
      ready: false,
      availableCapacity: 0,
      currentWorkload: 0,
      specializations: [],
      performance: {},
      constraints: []
    };

    // Check agent status
    const status = await agentService.getAgentStatus(agent.id);
    if (status.state !== 'active') {
      capability.constraints.push('Agent not active');
      return capability;
    }

    // Check resource availability
    const resources = await agentService.getAgentResources(agent.id);
    capability.availableCapacity = resources.availableCapacity;
    capability.currentWorkload = resources.currentWorkload;

    // Check specializations and skills
    capability.specializations = agent.specializations || [];

    // Check performance metrics
    capability.performance = await this.getAgentPerformanceMetrics(agent.id);

    // Assess overall readiness
    capability.ready = this.determineReadiness(capability);

    return capability;
  }

  // Determine if agent is ready for task assignment
  determineReadiness(capability) {
    // Must have available capacity
    if (capability.availableCapacity <= 0) return false;

    // Must not be overloaded (workload < 90%)
    if (capability.currentWorkload > 0.9) return false;

    // Must have acceptable performance (success rate > 80%)
    if (capability.performance.successRate < 0.8) return false;

    // Must not have blocking constraints
    if (capability.constraints.some(c => c.includes('blocking'))) return false;

    return true;
  }

  // Trigger task assignment for capable agent
  async triggerTaskAssignment(agentId, capability) {
    // Find pending tasks that match agent capabilities
    const pendingTasks = await taskService.getPendingTasksForAgent(agentId, capability);

    for (const task of pendingTasks) {
      // Check if agent can handle this specific task
      if (await this.canAgentHandleTask(agentId, task, capability)) {
        // Assign task immediately
        await taskDispatcher.assignTaskToAgent(task.id, agentId);

        // Update capability cache
        capability.availableCapacity -= task.estimatedEffort;
        this.capabilityCache.set(agentId, capability);

        // Log assignment
        await this.logTaskAssignment(task.id, agentId, 'immediate');

        // Break after first assignment to avoid overloading
        break;
      }
    }
  }

  // Handle capability updates from WebSocket
  async handleCapabilityUpdate(agentId, update) {
    // Update capability cache
    const currentCapability = this.capabilityCache.get(agentId) || {};
    const updatedCapability = {
      ...currentCapability,
      ...update,
      lastUpdated: new Date()
    };

    this.capabilityCache.set(agentId, updatedCapability);

    // Trigger task assignment if newly capable
    if (update.ready && !currentCapability.ready) {
      await this.triggerTaskAssignment(agentId, updatedCapability);
    }
  }

  // Get agent capability status
  getAgentCapability(agentId) {
    return this.capabilityCache.get(agentId) || {
      ready: false,
      lastChecked: null
    };
  }

  // Stop monitoring agent
  async stopAgentMonitoring(agentId) {
    const interval = this.monitoringIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(agentId);
    }

    const connection = this.capabilityWebSockets.get(agentId);
    if (connection) {
      connection.close();
      this.capabilityWebSockets.delete(agentId);
    }
  }
}
```

**3.1.2 Task Dispatcher with Immediate Assignment**
```javascript
// server/src/services/taskDispatcher.js
class TaskDispatcher {
  constructor() {
    this.assignmentQueue = [];
    this.dispatchingActive = true;
  }

  // Assign task to specific agent immediately
  async assignTaskToAgent(taskId, agentId) {
    const task = await taskService.getTask(taskId);
    const agent = await agentService.getAgent(agentId);

    // Validate assignment
    const validation = await this.validateTaskAssignment(task, agent);
    if (!validation.valid) {
      throw new Error(`Invalid assignment: ${validation.reason}`);
    }

    // Create assignment record
    const assignment = await taskService.createTaskAssignment({
      taskId,
      agentId,
      assignedAt: new Date(),
      assignmentType: 'immediate',
      priority: task.priority,
      estimatedDuration: await this.estimateTaskDuration(task, agent)
    });

    // Update task status
    await taskService.updateTaskStatus(taskId, 'assigned', {
      assignedTo: agentId,
      assignedAt: new Date()
    });

    // Notify agent
    await this.notifyAgentOfAssignment(agentId, assignment);

    // Start task monitoring
    await taskMonitor.startTaskMonitoring(taskId, agentId);

    return assignment;
  }

  // Find optimal agent for task
  async findOptimalAgentForTask(taskId) {
    const task = await taskService.getTask(taskId);
    const capableAgents = await this.findCapableAgentsForTask(task);

    if (capableAgents.length === 0) {
      return null; // No capable agents available
    }

    // Rank agents by suitability
    const rankedAgents = await this.rankAgentsForTask(capableAgents, task);

    return rankedAgents[0]; // Return best match
  }

  // Find all capable agents for task
  async findCapableAgentsForTask(task) {
    const agents = await agentService.getAllActiveAgents();
    const capableAgents = [];

    for (const agent of agents) {
      const capability = agentCapabilityMonitor.getAgentCapability(agent.id);

      if (capability.ready && await this.canAgentHandleTask(agent.id, task, capability)) {
        capableAgents.push({
          agent,
          capability,
          suitability: await this.calculateAgentSuitability(agent, task, capability)
        });
      }
    }

    return capableAgents;
  }

  // Check if agent can handle specific task
  async canAgentHandleTask(agentId, task, capability) {
    // Check basic capability
    if (!capability.ready) return false;

    // Check specializations match
    const taskRequirements = task.requiredSpecializations || [];
    const agentSpecializations = capability.specializations || [];

    const hasRequiredSpecializations = taskRequirements.every(req =>
      agentSpecializations.some(spec => spec.skill === req.skill && spec.level >= req.level)
    );

    if (!hasRequiredSpecializations) return false;

    // Check capacity
    const estimatedEffort = await this.estimateTaskEffort(task, agentId);
    if (estimatedEffort > capability.availableCapacity) return false;

    // Check agent constraints
    if (capability.constraints.some(c => this.constraintBlocksTask(c, task))) return false;

    return true;
  }

  // Rank agents by suitability for task
  async rankAgentsForTask(agents, task) {
    const ranked = await Promise.all(agents.map(async (agentData) => {
      const { agent, capability } = agentData;

      const score = await this.calculateSuitabilityScore(agent, task, capability);

      return {
        agent,
        capability,
        score,
        reasons: await this.getRankingReasons(agent, task, capability)
      };
    }));

    // Sort by score (highest first)
    return ranked.sort((a, b) => b.score - a.score);
  }

  // Calculate suitability score
  async calculateSuitabilityScore(agent, task, capability) {
    let score = 0;

    // Specialization match (40% weight)
    const specializationMatch = await this.calculateSpecializationMatch(agent, task);
    score += specializationMatch * 0.4;

    // Performance history (30% weight)
    const performanceScore = capability.performance.successRate || 0.5;
    score += performanceScore * 0.3;

    // Current workload (20% weight)
    const workloadFactor = Math.max(0, 1 - capability.currentWorkload);
    score += workloadFactor * 0.2;

    // Availability bonus (10% weight)
    const availabilityBonus = capability.availableCapacity > 0.5 ? 0.1 : 0;
    score += availabilityBonus;

    return Math.min(1, score); // Cap at 1.0
  }

  // Estimate task duration for agent
  async estimateTaskDuration(task, agent) {
    const baseDuration = task.estimatedDuration || 60; // 60 minutes default
    const agentEfficiency = await this.getAgentEfficiency(agent.id, task.type);

    return baseDuration / agentEfficiency;
  }

  // Notify agent of assignment
  async notifyAgentOfAssignment(agentId, assignment) {
    const agent = await agentService.getAgent(agentId);

    // Send notification through agent's preferred channel
    if (agent.notificationPreferences?.websocket) {
      await this.sendWebSocketNotification(agentId, assignment);
    }

    if (agent.notificationPreferences?.email) {
      await this.sendEmailNotification(agent, assignment);
    }

    // Update agent's task queue
    await agentService.updateAgentQueue(agentId, assignment);
  }

  // Validate task assignment
  async validateTaskAssignment(task, agent) {
    const validation = {
      valid: true,
      reason: null
    };

    // Check task status
    if (task.status !== 'pending') {
      validation.valid = false;
      validation.reason = `Task is not pending (status: ${task.status})`;
    }

    // Check agent status
    if (agent.status !== 'active') {
      validation.valid = false;
      validation.reason = `Agent is not active (status: ${agent.status})`;
    }

    // Check assignment conflicts
    const existingAssignment = await taskService.getActiveAssignmentForAgent(agent.id);
    if (existingAssignment) {
      validation.valid = false;
      validation.reason = 'Agent already has active assignment';
    }

    return validation;
  }
}
```

**3.1.3 Agent Orchestration Dashboard**
```javascript
// client/src/components/agent/AgentOrchestrationDashboard.js
const AgentOrchestrationDashboard = ({ orderId }) => {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [orchestrationStatus, setOrchestrationStatus] = useState({});

  useEffect(() => {
    loadOrchestrationData();
    setupRealTimeUpdates();
  }, [orderId]);

  const loadOrchestrationData = async () => {
    const [agentsData, tasksData, statusData] = await Promise.all([
      agentApi.getAgentsForOrder(orderId),
      taskApi.getTasksForOrder(orderId),
      orchestrationApi.getOrchestrationStatus(orderId)
    ]);

    setAgents(agentsData);
    setTasks(tasksData);
    setOrchestrationStatus(statusData);
  };

  const setupRealTimeUpdates = () => {
    // Setup WebSocket for real-time orchestration updates
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/orchestration/${orderId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleRealTimeUpdate(update);
    };

    return () => ws.close();
  };

  const handleRealTimeUpdate = (update) => {
    switch (update.type) {
      case 'agent_capability_changed':
        updateAgentCapability(update.agentId, update.capability);
        break;
      case 'task_assigned':
        updateTaskAssignment(update.taskId, update.agentId);
        break;
      case 'task_completed':
        updateTaskStatus(update.taskId, 'completed');
        break;
    }
  };

  const updateAgentCapability = (agentId, capability) => {
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === agentId ? { ...agent, capability } : agent
      )
    );
  };

  const updateTaskAssignment = (taskId, agentId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, assignedTo: agentId, status: 'assigned' } : task
      )
    );
  };

  const updateTaskStatus = (taskId, status) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      )
    );
  };

  const handleManualAssignment = async (taskId, agentId) => {
    await orchestrationApi.assignTaskManually(taskId, agentId);
    await loadOrchestrationData();
  };

  return (
    <div className="agent-orchestration-dashboard">
      <div className="dashboard-header">
        <h2>Agent Orchestration - Order {orderId}</h2>
        <div className="orchestration-metrics">
          <span>Active Agents: {orchestrationStatus.activeAgents}</span>
          <span>Pending Tasks: {orchestrationStatus.pendingTasks}</span>
          <span>Completed Tasks: {orchestrationStatus.completedTasks}</span>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="agents-panel">
          <h3>Agent Capabilities</h3>
          {agents.map(agent => (
            <AgentCapabilityCard
              key={agent.id}
              agent={agent}
              onCapabilityChange={updateAgentCapability}
            />
          ))}
        </div>

        <div className="tasks-panel">
          <h3>Task Assignments</h3>
          {tasks.map(task => (
            <TaskAssignmentCard
              key={task.id}
              task={task}
              agents={agents}
              onManualAssign={handleManualAssignment}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Agent capability card component
const AgentCapabilityCard = ({ agent, onCapabilityChange }) => {
  const getCapabilityColor = (capability) => {
    if (capability.ready) return 'green';
    if (capability.availableCapacity > 0) return 'yellow';
    return 'red';
  };

  return (
    <div className={`agent-capability-card ${getCapabilityColor(agent.capability)}`}>
      <div className="agent-info">
        <h4>{agent.name}</h4>
        <span className="agent-type">{agent.type}</span>
      </div>

      <div className="capability-metrics">
        <div>Capacity: {agent.capability.availableCapacity}%</div>
        <div>Workload: {agent.capability.currentWorkload}%</div>
        <div>Success Rate: {agent.capability.performance.successRate}%</div>
      </div>

      <div className="specializations">
        {agent.capability.specializations.map(spec => (
          <span key={spec.skill} className="specialization-tag">
            {spec.skill} ({spec.level})
          </span>
        ))}
      </div>

      <div className="capability-status">
        <span className={`status-indicator ${agent.capability.ready ? 'ready' : 'busy'}`}>
          {agent.capability.ready ? 'Ready' : 'Busy'}
        </span>
        {agent.capability.lastChecked && (
          <span className="last-checked">
            Last checked: {new Date(agent.capability.lastChecked).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

// Task assignment card component
const TaskAssignmentCard = ({ task, agents, onManualAssign }) => {
  const [selectedAgent, setSelectedAgent] = useState('');

  const handleAssign = () => {
    if (selectedAgent) {
      onManualAssign(task.id, selectedAgent);
    }
  };

  return (
    <div className={`task-assignment-card ${task.status}`}>
      <div className="task-info">
        <h4>{task.name}</h4>
        <span className="task-type">{task.type}</span>
        <span className="task-priority priority-{task.priority}">{task.priority}</span>
      </div>

      <div className="assignment-status">
        {task.assignedTo ? (
          <div className="assigned-info">
            <span>Assigned to: {agents.find(a => a.id === task.assignedTo)?.name}</span>
            <span>Status: {task.status}</span>
          </div>
        ) : (
          <div className="assignment-controls">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Select Agent...</option>
              {agents.filter(a => a.capability.ready).map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} (Capacity: {agent.capability.availableCapacity}%)
                </option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={!selectedAgent}>
              Assign Manually
            </button>
          </div>
        )}
      </div>

      <div className="task-timing">
        <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
        {task.assignedAt && (
          <span>Assigned: {new Date(task.assignedAt).toLocaleString()}</span>
        )}
        {task.estimatedDuration && (
          <span>Estimated: {task.estimatedDuration} minutes</span>
        )}
      </div>
    </div>
  );
};

export default AgentOrchestrationDashboard;
```

#### Success Criteria
- [ ] Real-time agent capability monitoring with WebSocket connections
- [ ] Immediate task assignment upon agent availability (<30 seconds)
- [ ] Intelligent agent ranking based on specialization and performance
- [ ] Manual override capability for complex assignments
- [ ] Comprehensive orchestration dashboard with real-time updates
- [ ] Task validation and conflict prevention

#### Dependencies
- WebSocket infrastructure for real-time capability monitoring
- Agent management system with capability tracking
- Task management system with assignment tracking
- Performance monitoring for agent metrics

#### Risk Mitigation
- **Connection Failures**: Automatic reconnection with exponential backoff
- **Agent Overload**: Capacity-based assignment limits and monitoring
- **Assignment Conflicts**: Validation and conflict detection before assignment
- **Performance Impact**: Background processing and rate limiting for monitoring

---

## 4. HITL Integration & Task Creation Automation

### 4.1 Completion-Triggered HITL Workflow

#### Objective
Automatically create Human-in-the-Loop tasks immediately upon AI agent completion, with intelligent reviewer assignment and context preservation for complex procurement documents.

#### Technical Tasks

**4.1.1 HITL Manager Service**
```javascript
// server/src/services/hitlManager.js
class HITLManager {
  constructor() {
    this.hitlQueue = new Map();
    this.reviewerAssignmentEngine = new HITLReviewerAssignmentEngine();
    this.contextPreservationService = new HITLContextPreservationService();
  }

  // Create HITL task upon agent completion
  async createHITLTaskUponCompletion(agentTaskId, completionResult) {
    const agentTask = await taskService.getAgentTask(agentTaskId);

    // Determine if HITL is required
    const hitlRequired = await this.assessHITLRequirement(agentTask, completionResult);

    if (!hitlRequired.required) {
      // Auto-approve and continue workflow
      await this.autoApproveAndContinue(agentTask, completionResult);
      return;
    }

    // Create HITL task
    const hitlTask = await this.createHITLTask(agentTask, completionResult, hitlRequired);

    // Assign reviewer
    const reviewer = await this.reviewerAssignmentEngine.assignReviewer(hitlTask);
    await this.assignHITLTask(hitlTask.id, reviewer.id);

    // Preserve context
    await this.contextPreservationService.preserveContext(hitlTask.id, {
      agentTask,
      completionResult,
      hitlReason: hitlRequired.reason
    });

    // Notify reviewer
    await this.notifyReviewer(reviewer, hitlTask);

    return hitlTask;
  }

  // Assess if HITL is required
  async assessHITLRequirement(agentTask, completionResult) {
    const assessment = {
      required: false,
      reason: null,
      priority: 'normal',
      estimatedReviewTime: 15 // minutes
    };

    // Check confidence threshold
    if (completionResult.confidence < 0.8) {
      assessment.required = true;
      assessment.reason = 'Low AI confidence';
      assessment.priority = 'high';
    }

    // Check content complexity
    const complexity = await this.assessContentComplexity(completionResult);
    if (complexity.score > 0.7) {
      assessment.required = true;
      assessment.reason = 'High content complexity';
      assessment.estimatedReviewTime = 30;
    }

    // Check regulatory requirements
    if (await this.hasRegulatoryRequirements(agentTask)) {
      assessment.required = true;
      assessment.reason = 'Regulatory compliance review required';
      assessment.priority = 'critical';
      assessment.estimatedReviewTime = 45;
    }

    // Check stakeholder preferences
    if (await this.requiresStakeholderReview(agentTask)) {
      assessment.required = true;
      assessment.reason = 'Stakeholder review requested';
    }

    return assessment;
  }

  // Create HITL task
  async createHITLTask(agentTask, completionResult, hitlAssessment) {
    const hitlTask = {
      id: generateUUID(),
      type: 'hitl_review',
      title: `Review: ${agentTask.title}`,
      description: `Human review required for ${agentTask.type} task`,
      priority: hitlAssessment.priority,
      status: 'pending',
      createdAt: new Date(),
      dueDate: this.calculateDueDate(hitlAssessment),
      estimatedDuration: hitlAssessment.estimatedReviewTime,
      originalTaskId: agentTask.id,
      completionResult: completionResult,
      hitlReason: hitlAssessment.reason,
      reviewType: this.determineReviewType(agentTask, completionResult)
    };

    await taskService.createHITLTask(hitlTask);
    return hitlTask;
  }

  // Determine review type
  determineReviewType(agentTask, completionResult) {
    // Appendix-specific review types
    if (agentTask.type.includes('appendix')) {
      const appendixCode = agentTask.type.split('_')[1];

      switch (appendixCode) {
        case 'B': return 'safety_data_sheet_review';
        case 'C': return 'delivery_schedule_review';
        case 'D': return 'training_assignment_review';
        case 'F': return 'standards_compliance_review';
        default: return 'appendix_content_review';
      }
    }

    // General content review
    if (completionResult.contentType === 'technical') {
      return 'technical_content_review';
    }

    if (completionResult.contentType === 'compliance') {
      return 'compliance_review';
    }

    return 'general_content_review';
  }

  // Calculate due date based on priority
  calculateDueDate(assessment) {
    const now = new Date();
    const priorityMultipliers = {
      critical: 2,  // 2 hours
      high: 8,      // 8 hours
      normal: 24,   // 24 hours
      low: 72       // 72 hours
    };

    const hours = priorityMultipliers[assessment.priority] || 24;
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  // Assign HITL task to reviewer
  async assignHITLTask(hitlTaskId, reviewerId) {
    await taskService.assignHITLTask(hitlTaskId, reviewerId, {
      assignedAt: new Date(),
      assignmentType: 'automated'
    });

    // Update task status
    await taskService.updateHITLTaskStatus(hitlTaskId, 'assigned');
  }

  // Notify reviewer
  async notifyReviewer(reviewer, hitlTask) {
    const notification = {
      type: 'hitl_task_assigned',
      title: 'HITL Review Required',
      message: `You have been assigned to review: ${hitlTask.title}`,
      recipient: reviewer.id,
      priority: hitlTask.priority,
      actionUrl: `/hitl/review/${hitlTask.id}`,
      metadata: {
        taskId: hitlTask.id,
        dueDate: hitlTask.dueDate,
        estimatedDuration: hitlTask.estimatedDuration
      }
    };

    await notificationService.sendNotification(notification);
  }

  // Auto-approve and continue workflow
  async autoApproveAndContinue(agentTask, completionResult) {
    // Mark agent task as completed
    await taskService.updateAgentTaskStatus(agentTask.id, 'completed');

    // Log auto-approval
    await auditService.logAutoApproval({
      taskId: agentTask.id,
      reason: 'HITL not required',
      confidence: completionResult.confidence,
      timestamp: new Date()
    });

    // Continue workflow
    await workflowService.continueWorkflow(agentTask.workflowId, {
      agentTaskId: agentTask.id,
      autoApproved: true
    });
  }
}
```

**4.1.2 HITL Reviewer Assignment Engine**
```javascript
// server/src/services/hitlReviewerAssignmentEngine.js
class HITLReviewerAssignmentEngine {
  // Assign optimal reviewer for HITL task
  async assignReviewer(hitlTask) {
    const candidates = await this.findCandidateReviewers(hitlTask);

    if (candidates.length === 0) {
      throw new Error('No suitable reviewers available for HITL task');
    }

    // Rank candidates
    const rankedCandidates = await this.rankReviewers(candidates, hitlTask);

    // Return best candidate
    return rankedCandidates[0];
  }

  // Find candidate reviewers
  async findCandidateReviewers(hitlTask) {
    const candidates = [];

    // Get users with appropriate roles and permissions
    const users = await userService.getUsersWithRoles(['reviewer', 'approver']);

    for (const user of users) {
      // Check if user can review this type of content
      if (await this.canUserReviewTask(user, hitlTask)) {
        // Get user expertise and availability
        const expertise = await this.getUserExpertise(user, hitlTask);
        const availability = await this.getUserAvailability(user);

        candidates.push({
          user,
          expertise,
          availability,
          suitability: this.calculateSuitability(expertise, availability)
        });
      }
    }

    return candidates;
  }

  // Check if user can review specific task
  async canUserReviewTask(user, hitlTask) {
    // Check permissions
    const permissions = await permissionService.getUserPermissions(user.id);
    if (!permissions.canReviewHITL) return false;

    // Check expertise requirements
    const requiredExpertise = this.getRequiredExpertise(hitlTask);
    const userExpertise = await expertiseService.getUserExpertise(user.id);

    return this.hasRequiredExpertise(userExpertise, requiredExpertise);
  }

  // Get required expertise for task
  getRequiredExpertise(hitlTask) {
    const expertiseMap = {
      safety_data_sheet_review: ['safety', 'regulatory_compliance'],
      delivery_schedule_review: ['project_management', 'logistics'],
      training_assignment_review: ['hr', 'technical_training'],
      standards_compliance_review: ['quality_assurance', 'regulatory_compliance'],
      technical_content_review: ['engineering', 'technical_writing'],
      compliance_review: ['legal', 'regulatory_compliance']
    };

    return expertiseMap[hitlTask.reviewType] || ['general_review'];
  }

  // Get user expertise level
  async getUserExpertise(user, hitlTask) {
    const expertise = await expertiseService.getUserExpertise(user.id);
    const requiredSkills = this.getRequiredExpertise(hitlTask);

    const relevantExpertise = expertise.filter(e =>
      requiredSkills.includes(e.skill)
    );

    return {
      skills: relevantExpertise,
      averageLevel: relevantExpertise.reduce((sum, e) => sum + e.level, 0) / relevantExpertise.length,
      hasAllRequired: requiredSkills.every(skill =>
        relevantExpertise.some(e => e.skill === skill && e.level >= 3)
      )
    };
  }

  // Get user availability
  async getUserAvailability(user) {
    const workload = await workloadService.getUserWorkload(user.id);
    const schedule = await scheduleService.getUserSchedule(user.id);

    return {
      currentWorkload: workload.percentage,
      availableHours: schedule.availableHoursToday,
      nextAvailable: schedule.nextAvailableTime,
      timeZone: user.timeZone
    };
  }

  // Calculate reviewer suitability
  calculateSuitability(expertise, availability) {
    let score = 0;

    // Expertise (50% weight)
    if (expertise.hasAllRequired) score += 0.5;
    score += (expertise.averageLevel / 5) * 0.3; // Max 3 points for level 5

    // Availability (30% weight)
    const availabilityScore = Math.max(0, 1 - availability.currentWorkload);
    score += availabilityScore * 0.3;

    // Response time (20% weight)
    const responseTimeScore = Math.min(1, availability.availableHours / 8); // 8 hours = full day
    score += responseTimeScore * 0.2;

    return Math.min(1, score);
  }

  // Rank reviewers by suitability
  async rankReviewers(candidates, hitlTask) {
    const ranked = candidates.map(candidate => ({
      ...candidate,
      finalScore: candidate.suitability,
      rankingReasons: this.getRankingReasons(candidate)
    }));

    // Sort by score (highest first)
    ranked.sort((a, b) => b.finalScore - a.finalScore);

    return ranked;
  }

  // Get ranking reasons for transparency
  getRankingReasons(candidate) {
    const reasons = [];

    if (candidate.expertise.hasAllRequired) {
      reasons.push('Has all required expertise');
    }

    if (candidate.availability.currentWorkload < 0.7) {
      reasons.push('Available capacity');
    }

    if (candidate.availability.availableHours > 4) {
      reasons.push('Good availability today');
    }

    return reasons;
  }
}
```

**4.1.3 HITL Review Interface**
```javascript
// client/src/components/hitl/HITLReviewInterface.js
const HITLReviewInterface = ({ hitlTaskId }) => {
  const [hitlTask, setHitlTask] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewDecision, setReviewDecision] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHITLTask();
  }, [hitlTaskId]);

  const loadHITLTask = async () => {
    const task = await hitlApi.getHITLTask(hitlTaskId);
    setHitlTask(task);
    setLoading(false);
  };

  const submitReview = async () => {
    if (!reviewDecision) return;

    await hitlApi.submitReview(hitlTaskId, {
      decision: reviewDecision,
      comments: reviewComments,
      reviewedAt: new Date(),
      reviewerId: currentUser.id
    });

    // Navigate back to dashboard
    navigate('/hitl/dashboard');
  };

  if (loading) {
    return <div>Loading HITL task...</div>;
  }

  return (
    <div className="hitl-review-interface">
      <div className="review-header">
        <h2>HITL Review: {hitlTask.title}</h2>
        <div className="task-meta">
          <span className={`priority ${hitlTask.priority}`}>
            {hitlTask.priority} Priority
          </span>
          <span className="due-date">
            Due: {new Date(hitlTask.dueDate).toLocaleString()}
          </span>
          <span className="estimated-time">
            Estimated: {hitlTask.estimatedDuration} minutes
          </span>
        </div>
      </div>

      <div className="review-reason">
        <h3>Review Required</h3>
        <p>{hitlTask.hitlReason}</p>
      </div>

      <div className="original-content">
        <h3>AI-Generated Content</h3>
        <div className="content-preview">
          {hitlTask.completionResult.content}
        </div>
        <div className="confidence-indicator">
          AI Confidence: {Math.round(hitlTask.completionResult.confidence * 100)}%
        </div>
      </div>

      <div className="context-information">
        <h3>Context Information</h3>
        <div className="context-details">
          <p><strong>Original Task:</strong> {hitlTask.originalTask?.title}</p>
          <p><strong>Content Type:</strong> {hitlTask.completionResult.contentType}</p>
          <p><strong>Processing Time:</strong> {hitlTask.completionResult.processingTime}ms</p>
        </div>
      </div>

      <div className="review-actions">
        <h3>Your Review</h3>

        <div className="decision-options">
          <label>
            <input
              type="radio"
              value="approve"
              checked={reviewDecision === 'approve'}
              onChange={(e) => setReviewDecision(e.target.value)}
            />
            Approve - Content is acceptable
          </label>

          <label>
            <input
              type="radio"
              value="minor_revisions"
              checked={reviewDecision === 'minor_revisions'}
              onChange={(e) => setReviewDecision(e.target.value)}
            />
            Minor Revisions - Small changes needed
          </label>

          <label>
            <input
              type="radio"
              value="major_revisions"
              checked={reviewDecision === 'major_revisions'}
              onChange={(e) => setReviewDecision(e.target.value)}
            />
            Major Revisions - Significant changes required
          </label>

          <label>
            <input
              type="radio"
              value="reject"
              checked={reviewDecision === 'reject'}
              onChange={(e) => setReviewDecision(e.target.value)}
            />
            Reject - Content needs complete rework
          </label>
        </div>

        <div className="comments-section">
          <label htmlFor="review-comments">Review Comments</label>
          <textarea
            id="review-comments"
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder="Provide detailed feedback for the AI agent..."
            rows={6}
          />
        </div>

        <div className="action-buttons">
          <button
            onClick={submitReview}
            disabled={!reviewDecision}
            className="btn btn-primary"
          >
            Submit Review
          </button>

          <button
            onClick={() => navigate('/hitl/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default HITLReviewInterface;
```

#### Success Criteria
- [ ] HITL tasks created automatically upon AI completion requiring human review
- [ ] Intelligent reviewer assignment based on expertise and availability
- [ ] Context preservation across AI-to-human handoff
- [ ] Comprehensive review interface with decision options and feedback
- [ ] Automatic workflow continuation upon review completion
- [ ] Audit trail of all HITL interventions

#### Dependencies
- Agent task completion detection system
- User expertise and availability tracking
- Notification system for reviewer assignment
- Task management system with HITL task types

#### Risk Mitigation
- **Reviewer Availability**: Escalation procedures for unassigned tasks
- **Review Quality**: Training and guidelines for reviewers
- **Response Time**: SLA monitoring with automatic escalations
- **Context Loss**: Comprehensive context preservation and recovery

---

## 5. Performance Monitoring Setup for New Services

### 5.1 Comprehensive Monitoring Architecture

#### Objective
Implement comprehensive performance monitoring for all new Phase 2 services with real-time metrics, automated alerts, and performance optimization recommendations.

#### Technical Tasks

**5.1.1 Performance Monitoring Service**
```javascript
// server/src/services/performanceMonitoringService.js
class PerformanceMonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = this.loadDefaultThresholds();
  }

  // Start monitoring for a service
  async startServiceMonitoring(serviceName, config) {
    const monitoringConfig = {
      serviceName,
      metrics: config.metrics || this.getDefaultMetrics(serviceName),
      intervals: config.intervals || { health: 30000, performance: 60000 }, // 30s, 60s
      thresholds: config.thresholds || this.thresholds[serviceName],
      enabled: true
    };

    // Start health monitoring
    this.startHealthMonitoring(monitoringConfig);

    // Start performance monitoring
    this.startPerformanceMonitoring(monitoringConfig);

    // Store configuration
    this.metrics.set(serviceName, monitoringConfig);
  }

  // Start health monitoring
  startHealthMonitoring(config) {
    const interval = setInterval(async () => {
      try {
        const health = await this.checkServiceHealth(config.serviceName);

        // Check health thresholds
        if (!health.healthy) {
          await this.triggerHealthAlert(config.serviceName, health);
        }

        // Store health metrics
        await this.storeHealthMetrics(config.serviceName, health);

      } catch (error) {
        console.error(`Health check failed for ${config.serviceName}:`, error);
        await this.triggerHealthAlert(config.serviceName, { healthy: false, error });
      }
    }, config.intervals.health);

    this.monitoringIntervals.set(`${config.serviceName}_health`, interval);
  }

  // Start performance monitoring
  startPerformanceMonitoring(config) {
    const interval = setInterval(async () => {
      try {
        const performance = await this.collectPerformanceMetrics(config.serviceName, config.metrics);

        // Check performance thresholds
        const violations = this.checkThresholdViolations(performance, config.thresholds);
        if (violations.length > 0) {
          await this.triggerPerformanceAlert(config.serviceName, violations);
        }

        // Store performance metrics
        await this.storePerformanceMetrics(config.serviceName, performance);

        // Generate optimization recommendations
        const recommendations = await this.generateOptimizationRecommendations(config.serviceName, performance);
        if (recommendations.length > 0) {
          await this.storeOptimizationRecommendations(config.serviceName, recommendations);
        }

      } catch (error) {
        console.error(`Performance monitoring failed for ${config.serviceName}:`, error);
      }
    }, config.intervals.performance);

    this.monitoringIntervals.set(`${config.serviceName}_performance`, interval);
  }

  // Check service health
  async checkServiceHealth(serviceName) {
    const healthChecks = {
      agentOrchestrationService: async () => {
        const agents = await agentService.getAllActiveAgents();
        return {
          healthy: agents.length > 0,
          agentCount: agents.length,
          timestamp: new Date()
        };
      },

      ganttSynchronizationService: async () => {
        const syncStatus = await ganttSyncService.getOverallSyncStatus();
        return {
          healthy: syncStatus.overallHealth === 'healthy',
          activeSyncs: syncStatus.activeSyncs,
          failedSyncs: syncStatus.failedSyncs,
          timestamp: new Date()
        };
      },

      hitlManager: async () => {
        const queueStatus = await hitlService.getQueueStatus();
        return {
          healthy: queueStatus.backlog < 100, // Less than 100 pending reviews
          pendingReviews: queueStatus.pending,
          avgResponseTime: queueStatus.avgResponseTime,
          timestamp: new Date()
        };
      }
    };

    const healthCheck = healthChecks[serviceName];
    if (healthCheck) {
      return await healthCheck();
    }

    // Generic health check
    return {
      healthy: true,
      service: serviceName,
      timestamp: new Date()
    };
  }

  // Collect performance metrics
  async collectPerformanceMetrics(serviceName, metrics) {
    const collectedMetrics = {};

    for (const metric of metrics) {
      try {
        const value = await this.collectMetric(serviceName, metric);
        collectedMetrics[metric] = value;
      } catch (error) {
        console.error(`Failed to collect metric ${metric} for ${serviceName}:`, error);
        collectedMetrics[metric] = null;
      }
    }

    return {
      ...collectedMetrics,
      timestamp: new Date(),
      serviceName
    };
  }

  // Collect specific metric
  async collectMetric(serviceName, metricName) {
    const metricCollectors = {
      // Agent orchestration metrics
      agentCapabilityDetectionTime: async () => {
        const start = Date.now();
        await agentCapabilityMonitor.checkAgentCapability('test-agent');
        return Date.now() - start;
      },

      taskAssignmentTime: async () => {
        const start = Date.now();
        // Simulate task assignment
        await taskDispatcher.assignTaskToAgent('test-task', 'test-agent');
        return Date.now() - start;
      },

      // Gantt sync metrics
      ganttSyncTime: async () => {
        const start = Date.now();
        await ganttSyncService.synchronizeGanttChart('test-order', 'primavera', 'test-project');
        return Date.now() - start;
      },

      // HITL metrics
      hitlCreationTime: async () => {
        const start = Date.now();
        await hitlManager.createHITLTaskUponCompletion('test-task', { confidence: 0.5 });
        return Date.now() - start;
      },

      reviewerAssignmentTime: async () => {
        const start = Date.now();
        await hitlReviewerEngine.assignReviewer({ type: 'test' });
        return Date.now() - start;
      }
    };

    const collector = metricCollectors[metricName];
    if (collector) {
      return await collector();
    }

    throw new Error(`Unknown metric: ${metricName}`);
  }

  // Check threshold violations
  checkThresholdViolations(performance, thresholds) {
    const violations = [];

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const value = performance[metric];

      if (value !== null && value !== undefined) {
        if (threshold.max && value > threshold.max) {
          violations.push({
            metric,
            value,
            threshold: threshold.max,
            type: 'max',
            severity: threshold.severity || 'warning'
          });
        }

        if (threshold.min && value < threshold.min) {
          violations.push({
            metric,
            value,
            threshold: threshold.min,
            type: 'min',
            severity: threshold.severity || 'warning'
          });
        }
      }
    }

    return violations;
  }

  // Trigger health alert
  async triggerHealthAlert(serviceName, health) {
    const alert = {
      type: 'health',
      service: serviceName,
      severity: 'critical',
      message: `${serviceName} is unhealthy`,
      details: health,
      timestamp: new Date()
    };

    await this.sendAlert(alert);
  }

  // Trigger performance alert
  async triggerPerformanceAlert(serviceName, violations) {
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const warningViolations = violations.filter(v => v.severity === 'warning');

    if (criticalViolations.length > 0) {
      const alert = {
        type: 'performance',
        service: serviceName,
        severity: 'critical',
        message: `${serviceName} has critical performance violations`,
        details: { violations: criticalViolations },
        timestamp: new Date()
      };

      await this.sendAlert(alert);
    }

    if (warningViolations.length > 0) {
      const alert = {
        type: 'performance',
        service: serviceName,
        severity: 'warning',
        message: `${serviceName} has performance warnings`,
        details: { violations: warningViolations },
        timestamp: new Date()
      };

      await this.sendAlert(alert);
    }
  }

  // Send alert through notification system
  async sendAlert(alert) {
    // Store alert
    await alertService.storeAlert(alert);

    // Send notifications based on severity
    if (alert.severity === 'critical') {
      await notificationService.sendCriticalAlert(alert);
    } else if (alert.severity === 'warning') {
      await notificationService.sendWarningAlert(alert);
    }

    // Check for alert escalation
    await this.checkAlertEscalation(alert);
  }

  // Check for alert escalation (repeated alerts)
  async checkAlertEscalation(alert) {
    const recentAlerts = await alertService.getRecentAlerts(alert.service, alert.type, 3600000); // 1 hour

    if (recentAlerts.length >= 3) {
      // Escalate to higher priority
      const escalatedAlert = {
        ...alert,
        severity: 'critical',
        message: `ESCALATED: ${alert.message} (${recentAlerts.length} occurrences in last hour)`
      };

      await notificationService.sendEscalatedAlert(escalatedAlert);
    }
  }

  // Generate optimization recommendations
  async generateOptimizationRecommendations(serviceName, performance) {
    const recommendations = [];

    // Agent orchestration recommendations
    if (serviceName === 'agentOrchestrationService') {
      if (performance.agentCapabilityDetectionTime > 5000) {
        recommendations.push({
          type: 'optimization',
          priority: 'high',
          message: 'Agent capability detection is slow. Consider caching or optimizing database queries.',
          suggestedAction: 'Add Redis caching for agent capabilities'
        });
      }

      if (performance.taskAssignmentTime > 2000) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          message: 'Task assignment is taking too long. Review agent matching algorithm.',
          suggestedAction: 'Implement faster agent ranking algorithm'
        });
      }
    }

    // Gantt sync recommendations
    if (serviceName === 'ganttSynchronizationService') {
      if (performance.ganttSyncTime > 30000) {
        recommendations.push({
          type: 'optimization',
          priority: 'high',
          message: 'Gantt synchronization is slow. Consider batch processing or async operations.',
          suggestedAction: 'Implement background sync processing'
        });
      }
    }

    // HITL recommendations
    if (serviceName === 'hitlManager') {
      if (performance.hitlCreationTime > 1000) {
        recommendations.push({
          type: 'optimization',
          priority: 'low',
          message: 'HITL creation time could be improved. Consider pre-computing reviewer assignments.',
          suggestedAction: 'Cache reviewer suitability scores'
        });
      }
    }

    return recommendations;
  }

  // Store metrics in time-series database
  async storeHealthMetrics(serviceName, health) {
    await metricsStorage.store('health', {
      service: serviceName,
      ...health,
      timestamp: new Date()
    });
  }

  async storePerformanceMetrics(serviceName, performance) {
    await metricsStorage.store('performance', {
      service: serviceName,
      ...performance
    });
  }

  async storeOptimizationRecommendations(serviceName, recommendations) {
    for (const recommendation of recommendations) {
      await metricsStorage.store('recommendations', {
        service: serviceName,
        ...recommendation,
        timestamp: new Date()
      });
    }
  }

  // Get default thresholds
  loadDefaultThresholds() {
    return {
      agentOrchestrationService: {
        agentCapabilityDetectionTime: { max: 5000, severity: 'warning' },
        taskAssignmentTime: { max: 2000, severity: 'warning' }
      },
      ganttSynchronizationService: {
        ganttSyncTime: { max: 30000, severity: 'critical' }
      },
      hitlManager: {
        hitlCreationTime: { max: 1000, severity: 'warning' },
        reviewerAssignmentTime: { max: 5000, severity: 'warning' }
      }
    };
  }

  // Get default metrics for service
  getDefaultMetrics(serviceName) {
    const defaultMetrics = {
      agentOrchestrationService: [
        'agentCapabilityDetectionTime',
        'taskAssignmentTime'
      ],
      ganttSynchronizationService: [
        'ganttSyncTime'
      ],
      hitlManager: [
        'hitlCreationTime',
        'reviewerAssignmentTime'
      ]
    };

    return defaultMetrics[serviceName] || [];
  }

  // Stop monitoring
  stopServiceMonitoring(serviceName) {
    const intervals = [
      `${serviceName}_health`,
      `${serviceName}_performance`
    ];

    intervals.forEach(intervalKey => {
      const interval = this.monitoringIntervals.get(intervalKey);
      if (interval) {
        clearInterval(interval);
        this.monitoringIntervals.delete(intervalKey);
      }
    });
  }
}
```

**5.1.2 Monitoring Dashboard**
```javascript
// client/src/components/monitoring/PerformanceMonitoringDashboard.js
const PerformanceMonitoringDashboard = () => {
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    loadMonitoringData();
    setupRealTimeUpdates();
  }, [timeRange]);

  const loadMonitoringData = async () => {
    const [servicesData, alertsData, recommendationsData] = await Promise.all([
      monitoringApi.getServicesStatus(),
      monitoringApi.getActiveAlerts(),
      monitoringApi.getOptimizationRecommendations()
    ]);

    setServices(servicesData);
    setAlerts(alertsData);
    setRecommendations(recommendationsData);
  };

  const setupRealTimeUpdates = () => {
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/monitoring`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleRealTimeUpdate(update);
    };

    return () => ws.close();
  };

  const handleRealTimeUpdate = (update) => {
    switch (update.type) {
      case 'service_status_changed':
        updateServiceStatus(update.serviceId, update.status);
        break;
      case 'alert_triggered':
        addAlert(update.alert);
        break;
      case 'recommendation_generated':
        addRecommendation(update.recommendation);
        break;
    }
  };

  const updateServiceStatus = (serviceId, status) => {
    setServices(prevServices =>
      prevServices.map(service =>
        service.id === serviceId ? { ...service, ...status } : service
      )
    );
  };

  const addAlert = (alert) => {
    setAlerts(prevAlerts => [alert, ...prevAlerts].slice(0, 50)); // Keep last 50
  };

  const addRecommendation = (recommendation) => {
    setRecommendations(prevRecommendations =>
      [recommendation, ...prevRecommendations].slice(0, 20)
    );
  };

  const resolveAlert = async (alertId) => {
    await monitoringApi.resolveAlert(alertId);
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  };

  const implementRecommendation = async (recommendationId) => {
    await monitoringApi.implementRecommendation(recommendationId);
    setRecommendations(prevRecommendations =>
      prevRecommendations.filter(rec => rec.id !== recommendationId)
    );
  };

  return (
    <div className="performance-monitoring-dashboard">
      <div className="dashboard-header">
        <h2>Performance Monitoring Dashboard</h2>
        <div className="time-range-selector">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Services Status Overview */}
        <div className="services-overview">
          <h3>Services Status</h3>
          <div className="services-grid">
            {services.map(service => (
              <ServiceStatusCard
                key={service.id}
                service={service}
                onViewDetails={() => viewServiceDetails(service.id)}
              />
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="alerts-section">
          <h3>Active Alerts ({alerts.length})</h3>
          <div className="alerts-list">
            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={() => resolveAlert(alert.id)}
              />
            ))}
          </div>
        </div>

        {/* Optimization Recommendations */}
        <div className="recommendations-section">
          <h3>Optimization Recommendations ({recommendations.length})</h3>
          <div className="recommendations-list">
            {recommendations.map(recommendation => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onImplement={() => implementRecommendation(recommendation.id)}
              />
            ))}
          </div>
        </div>

        {/* Performance Charts */}
        <div className="performance-charts">
          <h3>Performance Metrics</h3>
          <PerformanceCharts services={services} timeRange={timeRange} />
        </div>
      </div>
    </div>
  );
};

// Service status card component
const ServiceStatusCard = ({ service, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className={`service-status-card ${getStatusColor(service.status)}`}>
      <div className="service-header">
        <h4>{service.name}</h4>
        <span className="status-badge">{service.status}</span>
      </div>

      <div className="service-metrics">
        <div className="metric">
          <span className="label">Response Time</span>
          <span className="value">{service.avgResponseTime}ms</span>
        </div>
        <div className="metric">
          <span className="label">Throughput</span>
          <span className="value">{service.requestsPerMinute}/min</span>
        </div>
        <div className="metric">
          <span className="label">Error Rate</span>
          <span className="value">{service.errorRate}%</span>
        </div>
      </div>

      <div className="service-actions">
        <button onClick={onViewDetails} className="btn btn-sm btn-outline">
          View Details
        </button>
      </div>
    </div>
  );
};

// Alert card component
const AlertCard = ({ alert, onResolve }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className={`alert-card ${getSeverityColor(alert.severity)}`}>
      <div className="alert-header">
        <span className="alert-type">{alert.type}</span>
        <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
      </div>

      <div className="alert-content">
        <h4>{alert.message}</h4>
        <div className="alert-details">
          <strong>Service:</strong> {alert.service}<br />
          <strong>Details:</strong> {JSON.stringify(alert.details)}
        </div>
      </div>

      <div className="alert-actions">
        <button onClick={onResolve} className="btn btn-sm btn-primary">
          Resolve
        </button>
      </div>
    </div>
  );
};

// Recommendation card component
const RecommendationCard = ({ recommendation, onImplement }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className={`recommendation-card ${getPriorityColor(recommendation.priority)}`}>
      <div className="recommendation-header">
        <span className="priority-badge">{recommendation.priority}</span>
        <span className="type-badge">{recommendation.type}</span>
      </div>

      <div className="recommendation-content">
        <h4>{recommendation.message}</h4>
        <div className="suggested-action">
          <strong>Suggested Action:</strong> {recommendation.suggestedAction}
        </div>
      </div>

      <div className="recommendation-actions">
        <button onClick={onImplement} className="btn btn-sm btn-success">
          Implement
        </button>
        <button className="btn btn-sm btn-outline">
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitoringDashboard;
```

#### Success Criteria
- [ ] Real-time monitoring of all Phase 2 services with health checks
- [ ] Automated alerts for performance violations and service degradation
- [ ] Comprehensive metrics collection for response times, throughput, and error rates
- [ ] AI-powered optimization recommendations based on performance data
- [ ] Interactive dashboard with real-time updates and alert management
- [ ] Escalation procedures for critical alerts and repeated issues

#### Dependencies
- Metrics storage system (time-series database)
- Notification system for alerts
- WebSocket infrastructure for real-time updates
- Alert management and escalation system

#### Risk Mitigation
- **Monitoring Overhead**: Sampling and aggregation to minimize performance impact
- **Alert Fatigue**: Intelligent alert filtering and correlation
- **Data Volume**: Efficient storage and retention policies for metrics
- **False Positives**: Machine learning-based alert validation

---

## Phase 2 Implementation Timeline

### Week 5: Automated Section Population Foundation
- **Days 22-24**: Document Ordering Management integration service
- **Days 25-26**: SOW generation enhancement with auto-population
- **Days 27-28**: Frontend SOW interface updates

### Week 6: Advanced Gantt Integration
- **Days 29-31**: Gantt synchronization service with enterprise systems
- **Days 32-33**: Real-time sync engine and conflict resolution
- **Days 34-35**: Enhanced frontend with enterprise integration

### Week 7: Agent Orchestration Implementation
- **Days 36-38**: Agent capability monitor and real-time detection
- **Days 39-40**: Task dispatcher with immediate assignment logic
- **Days 41-42**: Orchestration dashboard development

### Week 8: HITL Integration
- **Days 43-45**: HITL manager with completion-triggered task creation
- **Days 46-47**: Reviewer assignment engine with expertise matching
- **Days 48-49**: HITL review interface and workflow integration

### Week 9: Performance Monitoring Setup
- **Days 50-52**: Performance monitoring service implementation
- **Days 53-54**: Monitoring dashboard with real-time updates
- **Days 55-56**: Alert system and optimization recommendations

### Week 10: Integration & Optimization
- **Days 57-59**: Full system integration testing
- **Days 60-61**: Performance optimization and monitoring
- **Days 62-63**: User acceptance testing and final adjustments

### Phase 2 Deliverables Checklist
- [ ] Automated SOW section population from Document Ordering Management
- [ ] Advanced Gantt integration with enterprise systems
- [ ] Agent orchestration with immediate task assignment
- [ ] HITL workflow integration with intelligent reviewer assignment
- [ ] Performance monitoring dashboard with automated alerts
- [ ] All services integrated with existing procurement workflow
- [ ] Comprehensive testing completed with performance benchmarks
- [ ] Documentation updated and training materials prepared
- [ ] Production deployment ready with monitoring and rollback procedures

### Quality Assurance Gates
- **Integration Testing**: All Phase 2 components working together
- **Performance Testing**: Services meeting response time and throughput requirements
- **Load Testing**: System handling expected concurrent users and tasks
- **Security Testing**: All new services passing security reviews
- **User Experience Testing**: Intuitive interfaces with comprehensive error handling

### Rollback Plan
- **Feature Flags**: All Phase 2 features behind feature flags for instant rollback
- **Service Isolation**: Services designed to fail gracefully if dependencies unavailable
- **Data Backup**: Comprehensive backup procedures for all new data structures
- **Gradual Rollout**: Phased deployment allowing for issues to be addressed incrementally

This detailed Phase 2 implementation plan provides the technical specifications, code examples, success criteria, and risk mitigation strategies needed to successfully implement automated section population, advanced Gantt integration, agent orchestration, HITL workflows, and comprehensive performance monitoring for the rationalized procurement workflow.

## 4. Sequence Management with Intelligent Processing Order

### 4.1 Sequence Intelligence Engine

#### Objective
Implement intelligent sequence management that automatically determines optimal document processing order based on dependencies, complexity, and stakeholder requirements, with real-time adjustments and learning capabilities.

#### Technical Tasks

**4.1.1 Sequence Intelligence Engine**
```javascript
// server/src/services/sequenceIntelligenceEngine.js
class SequenceIntelligenceEngine {
  constructor() {
    this.dependencyGraph = new Map();
    this.processingHistory = new Map();
    this.learningModel = new SequenceLearningModel();
  }

  // Determine optimal sequence for procurement order
  async determineOptimalSequence(orderId) {
    const order = await procurementService.getOrder(orderId);
    const requiredDocuments = this.identifyRequiredDocuments(order);

    // Build dependency graph
    const dependencyGraph = await this.buildDependencyGraph(requiredDocuments, order);

    // Calculate optimal processing order
    const optimalSequence = await this.calculateOptimalSequence(dependencyGraph, order);

    // Apply learning adjustments
    const learnedSequence = await this.applyLearningAdjustments(optimalSequence, order);

    // Validate sequence feasibility
    const validatedSequence = await this.validateSequenceFeasibility(learnedSequence, order);

    return {
      sequence: validatedSequence,
      reasoning: await this.generateSequenceReasoning(validatedSequence, dependencyGraph),
      confidence: this.calculateSequenceConfidence(validatedSequence),
      alternatives: await this.generateAlternativeSequences(dependencyGraph, order)
    };
  }

  // Identify required documents based on order characteristics
  identifyRequiredDocuments(order) {
    const documents = ['SOW']; // Statement of Work always required

    // Add appendices based on order analysis
    if (this.requiresTechnicalSpecs(order)) documents.push('Appendix A');
    if (this.requiresSafetyDataSheets(order)) documents.push('Appendix B');
    if (this.requiresDeliverySchedule(order)) documents.push('Appendix C');
    if (this.requiresTraining(order)) documents.push('Appendix D');
    if (this.requiresLogistics(order)) documents.push('Appendix E');
    if (this.requiresCompliance(order)) documents.push('Appendix F');

    return documents;
  }

  // Build dependency graph for documents
  async buildDependencyGraph(documents, order) {
    const graph = new Map();

    for (const document of documents) {
      const dependencies = await this.identifyDependencies(document, order);
      const dependents = await this.identifyDependents(document, order);

      graph.set(document, {
        dependencies,
        dependents,
        estimatedEffort: await this.estimateProcessingEffort(document, order),
        priority: this.calculateDocumentPriority(document, order),
        complexity: await this.assessDocumentComplexity(document, order)
      });
    }

    return graph;
  }

  // Identify document dependencies
  async identifyDependencies(document, order) {
    const dependencyRules = {
      'Appendix A': [], // Technical specs can be processed independently
      'Appendix B': ['Appendix A'], // Safety sheets depend on technical specs
      'Appendix C': [], // Delivery schedules can be processed in parallel
      'Appendix D': ['Appendix A', 'Appendix B'], // Training depends on specs and safety
      'Appendix E': ['Appendix C'], // Logistics depends on delivery schedule
      'Appendix F': ['Appendix A', 'Appendix B'], // Compliance depends on specs and safety
      'SOW': [] // SOW can be processed in parallel but often depends on appendices
    };

    const baseDependencies = dependencyRules[document] || [];

    // Add dynamic dependencies based on order characteristics
    const dynamicDependencies = await this.identifyDynamicDependencies(document, order);

    return [...baseDependencies, ...dynamicDependencies];
  }

  // Calculate optimal processing sequence using topological sort with prioritization
  async calculateOptimalSequence(dependencyGraph, order) {
    const sequence = [];
    const processed = new Set();
    const inProgress = new Set();

    // Priority queue for documents ready to process
    const readyQueue = this.initializeReadyQueue(dependencyGraph);

    while (readyQueue.length > 0 || inProgress.size > 0) {
      // Process completed documents and update ready queue
      await this.processCompletedDocuments(inProgress, processed, dependencyGraph, readyQueue);

      // Select next document to process
      if (readyQueue.length > 0) {
        const nextDocument = this.selectNextDocument(readyQueue, order);
        sequence.push(nextDocument);
        inProgress.add(nextDocument);
        readyQueue.splice(readyQueue.indexOf(nextDocument), 1);
      }

      // Simulate processing time (in real implementation, this would be actual processing)
      await this.simulateProcessingTime(order);
    }

    return sequence;
  }

  // Apply learning adjustments based on historical performance
  async applyLearningAdjustments(sequence, order) {
    const historicalPerformance = await this.getHistoricalSequencePerformance(order.type);

    if (!historicalPerformance || historicalPerformance.length < 5) {
      return sequence; // Not enough data for learning
    }

    // Identify successful patterns
    const successfulPatterns = this.identifySuccessfulPatterns(historicalPerformance);

    // Adjust sequence based on learning
    const adjustedSequence = await this.learningModel.adjustSequence(
      sequence,
      successfulPatterns,
      order
    );

    return adjustedSequence;
  }

  // Validate sequence feasibility
  async validateSequenceFeasibility(sequence, order) {
    const validation = {
      feasible: true,
      issues: [],
      adjustments: []
    };

    // Check resource availability
    const resourceCheck = await this.checkResourceAvailability(sequence, order);
    if (!resourceCheck.available) {
      validation.issues.push('Insufficient resources for proposed sequence');
      validation.adjustments.push('Consider parallel processing or resource allocation');
    }

    // Check time constraints
    const timeCheck = await this.checkTimeConstraints(sequence, order);
    if (!timeCheck.feasible) {
      validation.issues.push('Sequence exceeds time constraints');
      validation.adjustments.push('Consider expedited processing or dependency relaxation');
    }

    // Check stakeholder availability
    const stakeholderCheck = await this.checkStakeholderAvailability(sequence, order);
    if (!stakeholderCheck.available) {
      validation.issues.push('Key stakeholders not available for required reviews');
      validation.adjustments.push('Adjust sequence to accommodate stakeholder schedules');
    }

    if (validation.issues.length > 0) {
      // Apply automatic adjustments
      const adjustedSequence = await this.applyAutomaticAdjustments(sequence, validation);
      return adjustedSequence;
    }

    return sequence;
  }

  // Generate reasoning for sequence decisions
  async generateSequenceReasoning(sequence, dependencyGraph) {
    const reasoning = [];

    for (let i = 0; i < sequence.length; i++) {
      const document = sequence[i];
      const node = dependencyGraph.get(document);

      const documentReasoning = {
        document,
        position: i + 1,
        reasoning: []
      };

      // Dependency reasoning
      if (node.dependencies.length > 0) {
        documentReasoning.reasoning.push(
          `Depends on: ${node.dependencies.join(', ')}`
        );
      }

      // Priority reasoning
      if (node.priority > 7) {
        documentReasoning.reasoning.push(
          `High priority (${node.priority}/10) due to business criticality`
        );
      }

      // Resource reasoning
      if (node.estimatedEffort > 8) {
        documentReasoning.reasoning.push(
          `High effort requirement (${node.estimatedEffort} hours)`
        );
      }

      // Learning reasoning
      const learningInsights = await this.getLearningInsights(document, sequence);
      if (learningInsights) {
        documentReasoning.reasoning.push(learningInsights);
      }

      reasoning.push(documentReasoning);
    }

    return reasoning;
  }

  // Calculate sequence confidence score
  calculateSequenceConfidence(sequence) {
    let totalConfidence = 0;
    let factorCount = 0;

    // Dependency satisfaction confidence
    const dependencyConfidence = this.calculateDependencyConfidence(sequence);
    totalConfidence += dependencyConfidence * 0.4;
    factorCount++;

    // Historical performance confidence
    const historicalConfidence = this.calculateHistoricalConfidence(sequence);
    totalConfidence += historicalConfidence * 0.3;
    factorCount++;

    // Resource availability confidence
    const resourceConfidence = this.calculateResourceConfidence(sequence);
    totalConfidence += resourceConfidence * 0.2;
    factorCount++;

    // Stakeholder availability confidence
    const stakeholderConfidence = this.calculateStakeholderConfidence(sequence);
    totalConfidence += stakeholderConfidence * 0.1;
    factorCount++;

    return totalConfidence / factorCount;
  }

  // Generate alternative sequences for comparison
  async generateAlternativeSequences(dependencyGraph, order) {
    const alternatives = [];

    // Generate 3 alternative sequences with different optimization criteria
    const optimizationStrategies = [
      { name: 'time_optimized', weight: 'speed' },
      { name: 'resource_optimized', weight: 'efficiency' },
      { name: 'quality_optimized', weight: 'accuracy' }
    ];

    for (const strategy of optimizationStrategies) {
      const alternativeSequence = await this.calculateOptimalSequence(
        dependencyGraph,
        order,
        strategy
      );

      alternatives.push({
        strategy: strategy.name,
        sequence: alternativeSequence,
        metrics: await this.calculateSequenceMetrics(alternativeSequence, strategy.weight)
      });
    }

    return alternatives;
  }

  // Execute sequence with real-time monitoring
  async executeSequence(orderId, sequence) {
    const execution = {
      orderId,
      sequence,
      status: 'running',
      startTime: new Date(),
      progress: [],
      currentStep: 0
    };

    // Store execution record
    const executionId = await sequenceService.createSequenceExecution(execution);

    // Execute each step in sequence
    for (let i = 0; i < sequence.length; i++) {
      const document = sequence[i];

      try {
        // Update current step
        await sequenceService.updateExecutionStep(executionId, i);

        // Execute document processing
        const result = await this.executeDocumentProcessing(document, orderId);

        // Record progress
        await sequenceService.recordExecutionProgress(executionId, {
          step: i,
          document,
          status: 'completed',
          result,
          timestamp: new Date()
        });

      } catch (error) {
        // Record failure
        await sequenceService.recordExecutionProgress(executionId, {
          step: i,
          document,
          status: 'failed',
          error: error.message,
          timestamp: new Date()
        });

        // Handle failure (retry, skip, or fail sequence)
        await this.handleSequenceFailure(executionId, error, sequence, i);
        break;
      }
    }

    // Complete execution
    await sequenceService.completeSequenceExecution(executionId);

    return executionId;
  }

  // Execute document processing
  async executeDocumentProcessing(document, orderId) {
    // Route to appropriate processing service based on document type
    const processingServices = {
      'SOW': sowGenerationService,
      'Appendix A': appendixAService,
      'Appendix B': appendixBService,
      'Appendix C': appendixCService,
      'Appendix D': appendixDService,
      'Appendix E': appendixEService,
      'Appendix F': appendixFService
    };

    const service = processingServices[document];
    if (!service) {
      throw new Error(`No processing service available for ${document}`);
    }

    return await service.processDocument(orderId);
  }
}
```

**4.1.2 Sequence Management Frontend**
```javascript
// client/src/components/sequence/SequenceManagementInterface.js
const SequenceManagementInterface = ({ orderId }) => {
  const [sequence, setSequence] = useState(null);
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSequenceData();
    setupRealTimeUpdates();
  }, [orderId]);

  const loadSequenceData = async () => {
    const sequenceData = await sequenceApi.getSequenceForOrder(orderId);
    setSequence(sequenceData);

    const executionData = await sequenceApi.getSequenceExecution(orderId);
    setExecution(executionData);

    setLoading(false);
  };

  const setupRealTimeUpdates = () => {
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/sequences/${orderId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleRealTimeUpdate(update);
    };

    return () => ws.close();
  };

  const handleRealTimeUpdate = (update) => {
    switch (update.type) {
      case 'sequence_progress':
        updateExecutionProgress(update.progress);
        break;
      case 'step_completed':
        updateStepStatus(update.stepId, 'completed');
        break;
      case 'step_failed':
        updateStepStatus(update.stepId, 'failed', update.error);
        break;
    }
  };

  const updateExecutionProgress = (progress) => {
    setExecution(prevExecution => ({
      ...prevExecution,
      progress,
      currentStep: progress.currentStep
    }));
  };

  const updateStepStatus = (stepId, status, error = null) => {
    setSequence(prevSequence => ({
      ...prevSequence,
      executionStatus: {
        ...prevSequence.executionStatus,
        [stepId]: { status, error, timestamp: new Date() }
      }
    }));
  };

  const executeSequence = async () => {
    await sequenceApi.executeSequence(orderId, sequence.sequence);
    await loadSequenceData();
  };

  const adjustSequence = async (newSequence) => {
    await sequenceApi.updateSequence(orderId, newSequence);
    await loadSequenceData();
  };

  const pauseSequence = async () => {
    await sequenceApi.pauseSequence(orderId);
  };

  const resumeSequence = async () => {
    await sequenceApi.resumeSequence(orderId);
  };

  if (loading) {
    return <div>Loading sequence data...</div>;
  }

  return (
    <div className="sequence-management-interface">
      <div className="sequence-header">
        <h2>Document Processing Sequence</h2>
        <div className="sequence-info">
          <span>Confidence: {Math.round(sequence.confidence * 100)}%</span>
          <span>Status: {execution?.status || 'Not Started'}</span>
        </div>
      </div>

      {/* Sequence Reasoning */}
      <div className="sequence-reasoning">
        <h3>Sequence Reasoning</h3>
        <div className="reasoning-list">
          {sequence.reasoning.map((reason, index) => (
            <div key={index} className="reasoning-item">
              <strong>{reason.position}. {reason.document}:</strong>
              <ul>
                {reason.reasoning.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Sequence Visualization */}
      <div className="sequence-visualization">
        <h3>Processing Sequence</h3>
        <SequenceFlowchart
          sequence={sequence.sequence}
          executionStatus={sequence.executionStatus}
          onReorder={adjustSequence}
        />
      </div>

      {/* Alternative Sequences */}
      <div className="alternative-sequences">
        <h3>Alternative Sequences</h3>
        {sequence.alternatives.map((alt, index) => (
          <AlternativeSequenceCard
            key={index}
            alternative={alt}
            onApply={() => adjustSequence(alt.sequence)}
          />
        ))}
      </div>

      {/* Execution Controls */}
      <div className="execution-controls">
        {!execution && (
          <button onClick={executeSequence} className="btn btn-primary">
            Start Sequence Execution
          </button>
        )}

        {execution && execution.status === 'running' && (
          <button onClick={pauseSequence} className="btn btn-warning">
            Pause Execution
          </button>
        )}

        {execution && execution.status === 'paused' && (
          <button onClick={resumeSequence} className="btn btn-success">
            Resume Execution
          </button>
        )}
      </div>

      {/* Execution Progress */}
      {execution && (
        <div className="execution-progress">
          <h3>Execution Progress</h3>
          <ProgressTracker
            execution={execution}
            sequence={sequence}
          />
        </div>
      )}
    </div>
  );
};

// Sequence flowchart component
const SequenceFlowchart = ({ sequence, executionStatus, onReorder }) => {
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem && draggedItem.index !== dropIndex) {
      const newSequence = [...sequence];
      const [removed] = newSequence.splice(draggedItem.index, 1);
      newSequence.splice(dropIndex, 0, removed);
      onReorder(newSequence);
    }
    setDraggedItem(null);
  };

  return (
    <div className="sequence-flowchart">
      {sequence.map((document, index) => {
        const status = executionStatus?.[index]?.status || 'pending';
        const isCompleted = status === 'completed';
        const hasError = status === 'failed';

        return (
          <div
            key={document}
            className={`sequence-step ${status} ${draggedItem?.index === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, document, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="step-content">
              <div className="step-number">{index + 1}</div>
              <div className="step-title">{document}</div>
              <div className={`step-status ${status}`}>
                {isCompleted && <CheckIcon />}
                {hasError && <ErrorIcon />}
                {!isCompleted && !hasError && <ClockIcon />}
              </div>
            </div>

            {index < sequence.length - 1 && (
              <div className="step-connector">
                <ArrowIcon />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Alternative sequence card component
const AlternativeSequenceCard = ({ alternative, onApply }) => {
  return (
    <div className="alternative-sequence-card">
      <div className="alternative-header">
        <h4>{alternative.strategy.replace('_', ' ').toUpperCase()}</h4>
        <div className="alternative-metrics">
          {Object.entries(alternative.metrics).map(([key, value]) => (
            <span key={key} className="metric">
              {key}: {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
          ))}
        </div>
      </div>

      <div className="alternative-sequence">
        {alternative.sequence.map((doc, index) => (
          <span key={doc} className="sequence-item">
            {index + 1}. {doc}
          </span>
        ))}
      </div>

      <div className="alternative-actions">
        <button onClick={onApply} className="btn btn-sm btn-outline">
          Apply This Sequence
        </button>
      </div>
    </div>
  );
};

export default SequenceManagementInterface;
```

#### Success Criteria
- [ ] Intelligent sequence determination based on dependencies and order characteristics
- [ ] Learning algorithm that improves sequences based on historical performance
- [ ] Real-time sequence execution with progress tracking and error handling
- [ ] Interactive frontend allowing sequence visualization and manual adjustments
- [ ] Alternative sequence generation with comparative metrics
- [ ] Comprehensive reasoning provided for sequence decisions

#### Dependencies
- Procurement order data with sufficient detail for sequence determination
- Historical performance data for learning algorithms
- Real-time processing capabilities for sequence execution
- Resource and stakeholder availability information

#### Risk Mitigation
- **Dependency Complexity**: Clear visualization and validation of sequence dependencies
- **Learning Accuracy**: Human oversight and validation of AI-generated sequences
- **Execution Reliability**: Comprehensive error handling and recovery mechanisms
- **Performance Impact**: Efficient algorithms and caching for sequence calculations

---

## Phase 2 Implementation Timeline

### Week 5: Automated Section Population Foundation
- **Days 22-24**: Document Ordering Management integration service
- **Days 25-26**: SOW generation enhancement with auto-population
- **Days 27-28**: Frontend SOW interface updates

### Week 6: Advanced Gantt Integration
- **Days 29-31**: Gantt synchronization service with enterprise systems
- **Days 32-33**: Real-time sync engine and conflict resolution
- **Days 34-35**: Enhanced frontend with enterprise integration

### Week 7: Agent Orchestration Implementation
- **Days 36-38**: Agent capability monitor and real-time detection
- **Days 39-40**: Task dispatcher with immediate assignment logic
- **Days 41-42**: Orchestration dashboard development

### Week 8: HITL Integration
- **Days 43-45**: HITL manager with completion-triggered task creation
- **Days 46-47**: Reviewer assignment engine with expertise matching
- **Days 48-49**: HITL review interface and workflow integration

### Week 9: Sequence Management & Performance Monitoring
- **Days 50-52**: Sequence intelligence engine and learning algorithms
- **Days 53-54**: Sequence management frontend with visualization
- **Days 55-56**: Performance monitoring service implementation

### Week 10: Integration & Optimization
- **Days 57-59**: Full system integration testing
- **Days 60-61**: Performance optimization and monitoring
- **Days 62-63**: User acceptance testing and final adjustments

### Phase 2 Deliverables Checklist
- [ ] Automated SOW section population from Document Ordering Management
- [ ] Advanced Gantt integration with enterprise systems
- [ ] Agent orchestration with immediate task assignment
- [ ] HITL workflow integration with intelligent reviewer assignment
- [ ] Sequence management with intelligent processing order
- [ ] Performance monitoring dashboard with automated alerts
- [ ] All services integrated with existing procurement workflow
- [ ] Comprehensive testing completed with performance benchmarks
- [ ] Documentation updated and training materials prepared
- [ ] Production deployment ready with monitoring and rollback procedures

This detailed Phase 2 implementation plan provides the technical specifications, code examples, success criteria, and risk mitigation strategies needed to successfully implement automated section population, advanced Gantt integration, agent orchestration, HITL workflows, sequence management, and comprehensive performance monitoring for the rationalized procurement workflow.

## 5. Accordion Navigation Integration & User Experience

### 5.1 Appendix Interface Navigation Updates

#### **Objective**
Update accordion navigation to include dedicated appendix interfaces following established naming conventions and alphabetical ordering standards.

#### **Technical Implementation**

**Accordion Navigation Updates** (Following `docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md`):

```javascript
// server/src/routes/accordion-sections-routes.js - Procurement Section Update
{
  id: 'accordion-button-01900',
  title: 'Procurement',
  display_order: 1900,
  sector: 'global',
  links: [
    // ✅ MANDATORY: Section title first (per 0975_ACCORDION_MASTER_GUIDE.md)
    { title: 'Procurement', url: '/procurement' },

    // ✅ ALPHABETICAL ORDERING: Appendix A comes first (A before C)
    { title: 'Appendix A: Product Specifications', url: '/product-specifications' },

    // Appendix C comes after Appendix A (A before C alphabetically)
    { title: 'Appendix C: Delivery Schedules', url: '/procurement/gantt-chart' },

    // Continue alphabetical ordering (C before D, E, M, P, S, T)
    { title: 'Contractor Vetting', url: '/contractor-vetting' },
    { title: 'Document Ordering Management', url: '/document-ordering-management?discipline=01900' },
    { title: 'Documents', url: '/all-documents' },
    { title: 'Email Management', url: '/email-management' },
    { title: 'My Tasks Dashboard', url: '/my-tasks' },
    { title: 'Purchase/Service/Work Orders', url: '/purchase-orders', icon: 'briefcase' },
    { title: 'Scope of Work Generation', url: '/scope-of-work' },
    { title: 'Supplier Directory', url: '/supplier-directory' },
    { title: 'Template & Form Management', url: '/templates-forms-management?discipline=01900' }
  ],
  subsections: {}
}

**5.1 Appendix Interface Navigation Updates**

#### **Objective**
Update accordion navigation to include dedicated appendix interfaces following established naming conventions and alphabetical ordering standards.

#### **Technical Implementation**

**Accordion Navigation Updates** (Following `docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md`):

```javascript
// server/src/routes/accordion-sections-routes.js - Procurement Section Update
{
  id: 'accordion-button-01900',
  title: 'Procurement',
  display_order: 1900,
  sector: 'global',
  links: [
    // ✅ MANDATORY: Section title first (per 0975_ACCORDION_MASTER_GUIDE.md)
    { title: 'Procurement', url: '/procurement' },

    // ✅ ALPHABETICAL ORDERING: Appendix A comes first (A before C)
    { title: 'Appendix A: Product Specifications', url: '/product-specifications' },

    // Appendix C comes after Appendix A (A before C alphabetically)
    { title: 'Appendix C: Delivery Schedules', url: '/procurement/gantt-chart' },

    // Continue alphabetical ordering (C before D, E, M, P, S, T)
    { title: 'Contractor Vetting', url: '/contractor-vetting' },
    { title: 'Document Ordering Management', url: '/document-ordering-management?discipline=01900' },
    { title: 'Documents', url: '/all-documents' },
    { title: 'Email Management', url: '/email-management' },
    { title: 'My Tasks Dashboard', url: '/my-tasks' },
    { title: 'Purchase/Service/Work Orders', url: '/purchase-orders', icon: 'briefcase' },
    { title: 'Scope of Work Generation', url: '/scope-of-work' },
    { title: 'Supplier Directory', url: '/supplier-directory' },
    { title: 'Template & Form Management', url: '/templates-forms-management?discipline=01900' }
  ],
  subsections: {}
}

// Safety Section Update (Consistent Appendix Naming)
{
  id: 'accordion-button-02400',
  title: 'Safety',
  display_order: 2400,
  sector: 'global',
  links: [
    { title: 'Safety', url: '/safety' },
    { title: 'Contractor Vetting', url: '/contractor-vetting' },
    { title: 'Appendix B: Safety Data Sheets', url: '/appendix-b-sds-review' }, // ✅ Consistent naming
    { title: 'Documents', url: '/all-documents' },
    { title: 'Email Management', url: '/email-management' },
    { title: 'Inspections', url: '/inspections' },
    { title: 'My Tasks Dashboard', url: '/my-tasks' },
    { title: 'Template & Form Management', url: '/templates-forms-management?discipline=02400' }
  ],
  subsections: {}
}
```

**Source Documentation References**:
- **Navigation Standards**: `docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md` (Section 3.2: Link Ordering Standards)
- **Naming Conventions**: `docs/0000_DOCUMENTATION_MASTER_GUIDE.md` (Section: Documentation Organization Structure)
- **Alphabetical Ordering**: `docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md` (MANDATORY Link Ordering Standards)

#### **Success Criteria**
- [ ] Procurement section includes "Appendix A: Product Specifications" link in correct alphabetical position
- [ ] Safety section uses consistent "Appendix B: Safety Data Sheets" naming
- [ ] All appendix links follow "Appendix X: Description" format for consistency
- [ ] Links are ordered alphabetically after main section title per 0975 standards
- [ ] Navigation updates deployed to both server template and client fallback

#### **Dependencies**
- Accordion system (`client/src/modules/accordion/00200-accordion-component.js`)
- Server template (`server/src/routes/accordion-sections-routes.js`)
- Client fallback (`client/src/common/js/config/00200-ui-display-mappings.js`)

#### **Risk Mitigation**
- **3-Tier Fallback**: Update all three accordion sources (server, client fallback, emergency)
- **Testing**: Verify alphabetical ordering in development and production environments
- **User Training**: Clear communication about new appendix interface locations
```

**Source Documentation References**:
- **Navigation Standards**: `docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md` (Section 3.2: Link Ordering Standards)
- **Naming Conventions**: `docs/0000_DOCUMENTATION_MASTER_GUIDE.md` (Section: Documentation Organization Structure)
- **Alphabetical Ordering**: `docs/user-interface/0975_ACCORDION_MASTER_GUIDE.md` (MANDATORY Link Ordering Standards)

#### **Success Criteria**
- [ ] Procurement section includes "Appendix A: Product Specifications" link in correct alphabetical position
- [ ] Safety section uses consistent "Appendix B: Safety Data Sheets" naming
- [ ] All appendix links follow "Appendix X: Description" format for consistency
- [ ] Links are ordered alphabetically after main section title per 0975 standards
- [ ] Navigation updates deployed to both server template and client fallback

#### **Dependencies**
- Accordion system (`client/src/modules/accordion/00200-accordion-component.js`)
- Server template (`server/src/routes/accordion-sections-routes.js`)
- Client fallback (`client/src/common/js/config/00200-ui-display-mappings.js`)

#### **Risk Mitigation**
- **3-Tier Fallback**: Update all three accordion sources (server, client fallback, emergency)
- **Testing**: Verify alphabetical ordering in development and production environments
- **User Training**: Clear communication about new appendix interface locations

---

## 6. Phase 2 Success Metrics & Validation Framework

### 6.1 Comprehensive Success Metrics

#### Workflow Efficiency Metrics
- **Sequence Optimization**: 40% reduction in document processing time through intelligent sequencing
- **Agent Assignment Speed**: 95% of tasks assigned within 30 seconds of agent availability
- **HITL Creation Accuracy**: 98% of AI completions correctly triggering appropriate HITL tasks
- **Gantt Sync Reliability**: 99% successful bidirectional synchronization with enterprise systems

#### Quality Assurance Metrics
- **Section Population Accuracy**: 95% of SOW sections auto-populated correctly without manual intervention
- **HITL Review Quality**: 90% of HITL reviews completed within SLA with satisfactory outcomes
- **Sequence Success Rate**: 95% of intelligent sequences completed without manual adjustments
- **Conflict Resolution**: 85% of Gantt synchronization conflicts resolved automatically

#### Performance Metrics
- **Response Time**: All Phase 2 services maintaining <2 second average response time
- **Throughput**: System handling 2x current procurement order volume without performance degradation
- **Uptime**: 99.9% availability for all Phase 2 services
- **Error Rate**: <1% error rate across all automated processes

#### User Experience Metrics
- **Task Visibility**: 100% of procurement tasks visible in real-time dashboards
- **HITL Efficiency**: 60% reduction in time from AI completion to human review completion
- **Sequence Transparency**: Users able to understand and adjust 90% of sequence decisions
- **Gantt Usability**: 80% of users successfully completing Gantt operations without assistance

#### Business Impact Metrics
- **Cycle Time Reduction**: 50% reduction in overall procurement document processing time
- **Error Reduction**: 75% reduction in post-processing document corrections
- **Compliance Rate**: 100% adherence to configured document ordering and sequences
- **Stakeholder Satisfaction**: >4.8/5 satisfaction rating for procurement workflow efficiency

### 6.2 Validation Framework

#### Automated Testing Suite
```javascript
// Comprehensive Phase 2 testing framework
const Phase2ValidationSuite = {
  // Workflow integration tests
  workflowIntegrationTests: {
    completeProcurementWorkflow: {
      description: 'End-to-end procurement workflow with all Phase 2 features',
      steps: [
        'Create procurement order with sequence selection',
        'Verify automated section population in SOW',
        'Monitor agent capability detection and task assignment',
        'Validate HITL task creation upon AI completion',
        'Test Gantt chart synchronization with enterprise systems',
        'Confirm sequence completion with proper document ordering'
      ],
      expectedDuration: '< 10 minutes',
      successCriteria: 'All Phase 2 features execute successfully without errors'
    },

    multiDisciplineCollaboration: {
      description: 'Complex procurement requiring multiple disciplines and appendices',
      steps: [
        'Create order requiring 6 appendices (A-F)',
        'Verify intelligent sequence determination',
        'Monitor cross-discipline agent assignments',
        'Validate parallel processing of independent documents',
        'Test HITL workflows for technical and compliance reviews',
        'Confirm final document assembly with correct ordering'
      ],
      expectedDuration: '< 15 minutes',
      successCriteria: 'All disciplines engaged with proper sequencing and reviews'
    }
  },

  // Performance validation tests
  performanceValidationTests: {
    loadTesting: {
      description: 'System performance under load with Phase 2 features enabled',
      scenarios: {
        concurrentOrders: '50 simultaneous procurement orders',
        agentOverload: '100 concurrent agent capability checks',
        hitlQueue: '200 pending HITL tasks',
        ganttSync: '20 simultaneous enterprise system synchronizations'
      },
      successCriteria: 'All performance benchmarks met with <10% degradation'
    },

    stressTesting: {
      description: 'System stability under extreme conditions',
      scenarios: {
        networkFailure: 'Simulate network outages during synchronization',
        agentFailure: 'Test system response to agent unavailability',
        dataCorruption: 'Validate data integrity during concurrent operations',
        peakLoad: '3x normal load for extended periods'
      },
      successCriteria: 'System maintains stability and data integrity'
    }
  },

  // Quality assurance tests
  qualityAssuranceTests: {
    accuracyTesting: {
      description: 'Validation of AI and automation accuracy',
      metrics: {
        sectionPopulationAccuracy: '>95% correct auto-population',
        sequenceOptimizationAccuracy: '>90% optimal sequences generated',
        agentAssignmentAccuracy: '>95% appropriate agent assignments',
        hitlTriggerAccuracy: '>98% correct HITL task creation'
      },
      successCriteria: 'All accuracy metrics exceeded with statistical significance'
    },

    complianceTesting: {
      description: 'Regulatory and business rule compliance',
      checks: {
        documentOrderingCompliance: '100% adherence to configured ordering',
        dataPrivacyCompliance: 'All PII handled according to regulations',
        auditTrailCompleteness: '100% of actions properly logged',
        securityValidation: 'All services pass security penetration testing'
      },
      successCriteria: 'Zero compliance violations or security vulnerabilities'
    }
  }
};
```

#### Implementation Validation Dashboard
```javascript
// Real-time implementation validation dashboard
const ImplementationValidationDashboard = () => {
  const [validationResults, setValidationResults] = useState({});
  const [testStatus, setTestStatus] = useState('idle');

  useEffect(() => {
    loadValidationResults();
    setupValidationMonitoring();
  }, []);

  const loadValidationResults = async () => {
    const results = await validationApi.getAllValidationResults();
    setValidationResults(results);
  };

  const setupValidationMonitoring = () => {
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/validation`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleValidationUpdate(update);
    };

    return () => ws.close();
  };

  const handleValidationUpdate = (update) => {
    setValidationResults(prevResults => ({
      ...prevResults,
      [update.testId]: update.result
    }));

    if (update.result.status === 'failed') {
      // Trigger alert for failed validations
      alertService.notifyValidationFailure(update);
    }
  };

  const runValidationSuite = async (suiteName) => {
    setTestStatus('running');
    try {
      const results = await validationApi.runValidationSuite(suiteName);
      setValidationResults(prevResults => ({
        ...prevResults,
        ...results
      }));
    } finally {
      setTestStatus('idle');
    }
  };

  const getOverallHealth = () => {
    const results = Object.values(validationResults);
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return {
      score: total > 0 ? (passed / total) * 100 : 0,
      passed,
      failed,
      total
    };
  };

  const health = getOverallHealth();

  return (
    <div className="implementation-validation-dashboard">
      <div className="dashboard-header">
        <h2>Phase 2 Implementation Validation</h2>
        <div className="health-summary">
          <div className="health-score">
            <span className="score">{health.score.toFixed(1)}%</span>
            <span className="label">Overall Health</span>
          </div>
          <div className="health-breakdown">
            <span className="passed">{health.passed} Passed</span>
            <span className="failed">{health.failed} Failed</span>
            <span className="total">{health.total} Total</span>
          </div>
        </div>
      </div>

      <div className="validation-controls">
        <button
          onClick={() => runValidationSuite('workflowIntegration')}
          disabled={testStatus === 'running'}
          className="btn btn-primary"
        >
          {testStatus === 'running' ? 'Running Tests...' : 'Run Full Validation Suite'}
        </button>

        <button
          onClick={() => runValidationSuite('performance')}
          className="btn btn-secondary"
        >
          Performance Tests
        </button>

        <button
          onClick={() => runValidationSuite('quality')}
          className="btn btn-secondary"
        >
          Quality Assurance Tests
        </button>
      </div>

      <div className="validation-results">
        <div className="results-grid">
          {Object.entries(validationResults).map(([testId, result]) => (
            <ValidationResultCard
              key={testId}
              testId={testId}
              result={result}
              onRerun={() => runValidationSuite(testId)}
            />
          ))}
        </div>
      </div>

      <div className="validation-trends">
        <h3>Validation Trends</h3>
        <ValidationTrendsChart results={validationResults} />
      </div>
    </div>
  );
};

// Validation result card component
const ValidationResultCard = ({ testId, result, onRerun }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className={`validation-result-card ${getStatusColor(result.status)}`}>
      <div className="card-header">
        <h4>{testId.replace(/([A-Z])/g, ' $1').toLowerCase()}</h4>
        <span className={`status-badge ${result.status}`}>
          {result.status}
        </span>
      </div>

      <div className="card-content">
        <div className="metrics">
          {result.metrics && Object.entries(result.metrics).map(([key, value]) => (
            <div key={key} className="metric">
              <span className="label">{key}:</span>
              <span className="value">{value}</span>
            </div>
          ))}
        </div>

        {result.error && (
          <div className="error-details">
            <strong>Error:</strong> {result.error}
          </div>
        )}

        <div className="execution-info">
          <span>Last Run: {new Date(result.timestamp).toLocaleString()}</span>
          <span>Duration: {result.duration}ms</span>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={onRerun} className="btn btn-sm btn-outline">
          Re-run Test
        </button>
      </div>
    </div>
  );
};

export default ImplementationValidationDashboard;
```

#### Continuous Validation Framework
```javascript
// Continuous validation and monitoring system
const ContinuousValidationFramework = {
  // Automated regression testing
  regressionTesting: {
    schedule: 'Every 4 hours during development, daily in production',
    scope: 'All Phase 2 features and critical integration points',
    failureResponse: 'Immediate alert to development team with rollback option',
    successTracking: 'Historical performance tracking and trend analysis'
  },

  // Performance benchmarking
  performanceBenchmarking: {
    baseline: 'Established during Phase 2 development completion',
    monitoring: 'Continuous performance tracking against baselines',
    alerting: 'Automatic alerts when performance degrades >10%',
    optimization: 'Automated optimization recommendations based on trends'
  },

  // Quality gate enforcement
  qualityGates: {
    codeReview: 'All changes require senior developer approval',
    testing: 'Unit test coverage >80%, integration tests passing',
    security: 'Automated security scanning with zero critical vulnerabilities',
    performance: 'Performance benchmarks must be maintained or improved',
    documentation: 'All APIs and major functions must be documented'
  },

  // Production readiness checks
  productionReadiness: {
    checklist: [
      'All validation tests passing with >95% success rate',
      'Performance benchmarks met or exceeded',
      'Security assessment completed with no critical issues',
      'Rollback procedures documented and tested',
      'Monitoring and alerting configured',
      'User training materials completed',
      'Support team trained on new features',
      'Data migration scripts validated',
      'Feature flags configured for controlled rollout'
    ],
    signoff: 'Required from development lead, QA lead, and product owner'
  }
};
```

### 6.3 Risk Assessment & Mitigation Strategy

#### Critical Risks
1. **System Integration Complexity**
   - **Risk**: Phase 2 features may have unexpected interactions with existing systems
   - **Mitigation**: Comprehensive integration testing, feature flags, phased rollout
   - **Contingency**: Ability to disable individual features without affecting others

2. **Performance Degradation**
   - **Risk**: New automated processes may impact system performance
   - **Mitigation**: Performance monitoring, optimization, load testing
   - **Contingency**: Automated scaling, caching strategies, request throttling

3. **Data Integrity Issues**
   - **Risk**: Automated processes may create data inconsistencies
   - **Mitigation**: Comprehensive validation, transaction management, audit trails
   - **Contingency**: Data validation scripts, backup procedures, recovery processes

#### High Risks
1. **Agent Orchestration Failures**
   - **Risk**: Agent assignment failures could halt procurement workflows
   - **Mitigation**: Fallback assignment procedures, manual override capabilities
   - **Contingency**: Supervisor notification, manual task assignment interface

2. **HITL Process Bottlenecks**
   - **Risk**: Human review backlog could delay procurement processes
   - **Mitigation**: SLA monitoring, automatic escalation, workload balancing
   - **Contingency**: Emergency procedures for urgent reviews, additional reviewer capacity

#### Medium Risks
1. **Gantt Synchronization Issues**
   - **Risk**: Enterprise system sync failures could cause data inconsistencies
   - **Mitigation**: Conflict resolution algorithms, manual sync capabilities
   - **Contingency**: Offline mode, data reconciliation procedures

2. **Sequence Optimization Errors**
   - **Risk**: Poor sequence decisions could increase processing time
   - **Mitigation**: Human override capabilities, sequence validation, learning algorithms
   - **Contingency**: Manual sequence adjustment, alternative sequence suggestions

### 6.4 Deployment & Rollback Strategy

#### Phased Deployment Plan
```javascript
// Phase 2 deployment strategy
const Phase2DeploymentStrategy = {
  // Pre-deployment preparation
  preparation: {
    environment: 'Full staging environment with production data copy',
    testing: 'Complete validation suite execution',
    approval: 'Sign-off from development, QA, product, and operations teams',
    communication: 'Stakeholder notification and training completion'
  },

  // Phase 1: Limited rollout (Days 1-2)
  limitedRollout: {
    scope: '20% of procurement orders, internal users only',
    features: 'All Phase 2 features enabled but monitored closely',
    monitoring: 'Real-time performance and error monitoring',
    criteria: 'No critical issues, performance within 5% of baseline',
    rollbackTime: '< 15 minutes'
  },

  // Phase 2: Gradual expansion (Days 3-5)
  gradualExpansion: {
    scope: '50% of procurement orders, select external users',
    monitoring: 'Enhanced monitoring with automated alerts',
    criteria: 'User feedback positive, no major performance issues',
    rollbackTime: '< 30 minutes'
  },

  // Phase 3: Full deployment (Days 6-7)
  fullDeployment: {
    scope: '100% of procurement orders, all users',
    monitoring: 'Production monitoring with escalation procedures',
    support: 'Enhanced support team availability',
    criteria: 'Stable operation for 48 hours, positive user feedback'
  },

  // Post-deployment monitoring
  postDeployment: {
    monitoring: '30 days of enhanced monitoring and support',
    optimization: 'Performance tuning based on production usage',
    feedback: 'User feedback collection and feature adjustments',
    stabilization: 'Bug fixes and stability improvements'
  }
};
```

#### Rollback Procedures
```javascript
// Comprehensive rollback strategy
const RollbackProcedures = {
  // Feature-level rollback
  featureRollback: {
    procedure: 'Disable individual features via feature flags',
    impact: 'Minimal - only affected workflows impacted',
    time: '< 5 minutes',
    validation: 'Automated tests confirm feature disablement'
  },

  // Service-level rollback
  serviceRollback: {
    procedure: 'Redirect traffic to previous service version',
    impact: 'Service-specific workflows affected',
    time: '< 15 minutes',
    validation: 'Service health checks and integration tests'
  },

  // Full system rollback
  fullSystemRollback: {
    procedure: 'Deploy previous release version',
    impact: 'All Phase 2 features disabled',
    time: '< 60 minutes',
    validation: 'Complete validation suite execution'
  },

  // Data rollback procedures
  dataRollback: {
    database: 'Restore from backup if data corruption detected',
    cache: 'Clear all caches and rebuild from source',
    external: 'Reconcile with external systems if sync issues',
    audit: 'Complete audit trail maintained during rollback'
  },

  // Communication procedures
  communication: {
    internal: 'Immediate notification to development and operations teams',
    external: 'User communication for service disruptions',
    stakeholders: 'Regular updates during rollback execution',
    resolution: 'Post-mortem and resolution communication'
  }
};
```

This comprehensive Phase 2 implementation plan, success metrics, validation framework, and deployment strategy ensures the successful delivery of advanced procurement workflow automation with minimal risk and maximum business value. The plan provides clear technical specifications, implementation guidance, and quality assurance procedures for all Phase 2 deliverables.<attempt_completion>
<result>I've created a comprehensive detailed Phase 2 implementation plan based on the main procurement workflow rationalization plan. The plan covers:

## Key Phase 2 Components Implemented:

### 1. **Automated Section Population & Document Ordering Integration**
- Intelligent SOW section auto-population from Document Ordering Management
- SOW generation enhancement with auto-populated sections
- Frontend SOW interface with population status and manual overrides

### 2. **Advanced Gantt Chart Integration & Enterprise Synchronization**
- Gantt synchronization service with enterprise systems (Primavera P6, MS Project, Asta)
- Real-time sync engine with conflict resolution and WebSocket connections
- Enhanced frontend with enterprise integration controls

### 3. **Agent Orchestration System & Immediate Task Assignment**
- Agent capability monitor with real-time WebSocket monitoring
- Task dispatcher with immediate assignment logic and intelligent ranking
- Agent orchestration dashboard with real-time updates

### 4. **HITL Integration & Task Creation Automation**
- HITL manager with completion-triggered task creation
- Reviewer assignment engine with expertise matching
- HITL review interface with context preservation

### 5. **Sequence Management with Intelligent Processing Order**
- Sequence intelligence engine with dependency analysis and learning
- Sequence management frontend with visualization and manual adjustments
- Real-time execution monitoring and progress tracking

### 6. **Performance Monitoring Setup for New Services**
- Comprehensive performance monitoring service with automated alerts
- Monitoring dashboard with real-time metrics and optimization recommendations
- Automated threshold violation detection and escalation

## Additional Features:

### 7. **Success Metrics & Validation Framework**
- Comprehensive success metrics covering efficiency, quality, performance, UX, and business impact
- Automated testing suite with workflow integration, performance, and quality assurance tests
- Implementation validation dashboard with real-time monitoring

### 8. **Risk Assessment & Deployment Strategy**
- Detailed risk assessment with mitigation strategies for all risk levels
- Phased deployment plan with rollback procedures
- Continuous validation framework with quality gates

The plan includes detailed technical specifications with code examples, success criteria, dependencies, risk mitigation strategies, and comprehensive implementation timelines. It ensures the Phase 2 features integrate seamlessly with existing procurement workflows while providing advanced automation, intelligence, and monitoring capabilities.

All deliverables are designed to work together to achieve the Phase 2 goals of Gantt charts, HITL, sequence management, and performance monitoring while maintaining backward compatibility and system stability.</result>
</attempt_completion>
