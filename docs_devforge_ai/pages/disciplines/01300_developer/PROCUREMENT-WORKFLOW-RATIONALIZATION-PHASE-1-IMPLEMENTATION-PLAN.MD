# Procurement Workflow Rationalization - Phase 1 Implementation Plan

## Executive Summary

**Phase 1 Focus**: Core Infrastructure & Technical Team Setup (Weeks 1-3)

This detailed implementation plan expands on the Phase 1 roadmap from the Procurement Workflow Rationalization Plan, providing specific technical tasks, dependencies, success criteria, and risk mitigation strategies for establishing the foundational infrastructure required for the rationalized procurement workflow.

**Key Deliverables**:
- Technical team discipline configuration with complete team definition
- Gantt chart component for Appendix C delivery schedules
- Restructured Appendix D technical training assignment system
- Template variation pre-selection enhancement

**Success Criteria**:
- Technical disciplines (00800-00872, 00300, 03000, 01000) properly configured and routable
- Gantt chart component rendering procurement schedules with dependency management
- Technical training assignments routed to appropriate engineering disciplines
- Single template variation selection enforced throughout procurement workflow

---

## 1. Technical Team Discipline Configuration

### 1.1 Discipline Code Expansion & Validation

#### Objective
Expand the discipline system to include complete technical team definition and implement routing logic for technical appendices.

#### Technical Tasks

**1.1.1 Database Schema Updates**
```sql
-- Add technical team discipline codes to disciplines table
INSERT INTO disciplines (code, name, category, description, is_technical) VALUES
('00300', 'Construction Management', 'technical', 'Construction project management and coordination', true),
('03000', 'Landscaping', 'technical', 'Landscaping design and implementation', true),
('01000', 'Environmental', 'technical', 'Environmental assessment and compliance', true)
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  is_technical = EXCLUDED.is_technical,
  description = EXCLUDED.description;

-- Create technical_discipline_mappings table for team coordination
CREATE TABLE IF NOT EXISTS technical_discipline_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_code TEXT NOT NULL REFERENCES disciplines(code),
  team_role TEXT CHECK (team_role IN ('lead', 'support', 'coordination', 'review')),
  appendix_responsibility TEXT CHECK (appendix_responsibility IN ('A', 'B', 'C', 'D', 'E', 'F')),
  expertise_level TEXT CHECK (expertise_level IN ('primary', 'secondary', 'consulting')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(discipline_code, appendix_responsibility)
);

-- Insert technical team mappings
INSERT INTO technical_discipline_mappings (discipline_code, team_role, appendix_responsibility, expertise_level) VALUES
-- Design disciplines (00800-00872) - Primary technical team
('00800', 'lead', 'A', 'primary'), ('00800', 'lead', 'D', 'primary'), ('00800', 'lead', 'F', 'primary'),
('00825', 'support', 'A', 'primary'), ('00825', 'support', 'D', 'primary'), ('00825', 'support', 'F', 'primary'),
('00835', 'support', 'A', 'primary'), ('00835', 'support', 'D', 'primary'), ('00835', 'support', 'F', 'primary'),
('00850', 'lead', 'A', 'primary'), ('00850', 'lead', 'D', 'primary'), ('00850', 'lead', 'F', 'primary'),
('00860', 'support', 'A', 'primary'), ('00860', 'support', 'D', 'primary'), ('00860', 'support', 'F', 'primary'),
('00870', 'support', 'A', 'primary'), ('00870', 'support', 'D', 'primary'), ('00870', 'support', 'F', 'primary'),
('00872', 'lead', 'A', 'primary'), ('00872', 'lead', 'D', 'primary'), ('00872', 'lead', 'F', 'primary'),

-- Construction Management (00300) - Coordination
('00300', 'coordination', 'C', 'primary'), ('00300', 'coordination', 'E', 'secondary'),

-- Landscaping (03000) - Specialized technical
('03000', 'support', 'A', 'secondary'), ('03000', 'support', 'D', 'secondary'),

-- Environmental (01000) - Compliance and assessment
('01000', 'review', 'B', 'secondary'), ('01000', 'review', 'E', 'secondary'), ('01000', 'review', 'F', 'secondary');
```

**1.1.2 Backend Service Implementation**
```javascript
// server/src/services/technicalDisciplineService.js
class TechnicalDisciplineService {
  // Get complete technical team for procurement order
  async getTechnicalTeamForOrder(orderId) {
    const order = await this.getProcurementOrder(orderId);
    const technicalDisciplines = await this.getTechnicalDisciplines();

    return this.assignTechnicalTeam(order, technicalDisciplines);
  }

  // Route appendices to technical disciplines
  async routeAppendixToTechnicalTeam(appendixCode, orderId) {
    const mappings = await db('technical_discipline_mappings')
      .where('appendix_responsibility', appendixCode)
      .orderBy('expertise_level');

    const order = await this.getProcurementOrder(orderId);
    return this.assignTechnicalResponsibilities(mappings, order);
  }

  // Validate technical team completeness
  async validateTechnicalTeamCompleteness(orderId) {
    const team = await this.getTechnicalTeamForOrder(orderId);
    const requiredAppendices = await this.getRequiredAppendices(orderId);

    return this.checkTeamCoverage(team, requiredAppendices);
  }
}
```

**1.1.3 Frontend Integration**
```javascript
// client/src/components/procurement/TechnicalTeamSelector.js
const TechnicalTeamSelector = ({ orderId, onTeamUpdate }) => {
  const [technicalTeam, setTechnicalTeam] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    loadTechnicalTeam();
  }, [orderId]);

  const loadTechnicalTeam = async () => {
    try {
      const team = await procurementApi.getTechnicalTeam(orderId);
      setTechnicalTeam(team);
      validateTeam(team);
    } catch (error) {
      setValidationErrors([error.message]);
    }
  };

  const validateTeam = async (team) => {
    const validation = await procurementApi.validateTechnicalTeam(orderId, team);
    setValidationErrors(validation.errors || []);
  };

  return (
    <div className="technical-team-selector">
      <h3>Technical Team Assignment</h3>
      {technicalTeam.map(discipline => (
        <TechnicalDisciplineCard
          key={discipline.code}
          discipline={discipline}
          onUpdate={handleDisciplineUpdate}
        />
      ))}
      {validationErrors.length > 0 && (
        <ValidationErrors errors={validationErrors} />
      )}
    </div>
  );
};
```

#### Success Criteria
- [ ] All technical disciplines (00800-00872, 00300, 03000, 01000) configured in database
- [ ] Technical discipline mappings table populated with correct relationships
- [ ] Backend service returns complete technical team for procurement orders
- [ ] Frontend displays technical team with validation
- [ ] Appendix routing assigns A, D, F to appropriate technical disciplines

#### Dependencies
- Database schema migration framework
- Existing discipline management system
- Procurement order data structure

#### Risk Mitigation
- **Data Migration**: Test migration scripts on staging environment first
- **Backward Compatibility**: Ensure existing discipline queries continue to work
- **Performance**: Add database indexes for technical discipline lookups

---

## 2. Gantt Chart Component for Appendix C

### 📋 **UI Design Reference**
**Complete UI specifications available in:** `/docs/temporary/GANTT_CHART_UI_DESIGN.md`

This comprehensive document includes:
- Universal multi-discipline timeline visualization
- Agent-friendly chatbot integration
- Interactive features and responsive design
- Accessibility features and export options
- Performance optimizations and data management

### 2.1 Gantt Library Selection & Integration

#### Objective
Implement a comprehensive Gantt chart component for procurement delivery schedule management with advanced timeline visualization and dependency management.

#### Technical Tasks

**2.1.1 Library Evaluation & Selection**
```javascript
// Evaluation criteria for Gantt libraries
const ganttLibraries = {
  'react-gantt-timeline': {
    pros: ['React-native', 'Lightweight', 'Customizable'],
    cons: ['Limited enterprise features', 'Smaller community'],
    score: 7.5
  },
  'dhtmlx-gantt': {
    pros: ['Enterprise-ready', 'Rich features', 'Active development'],
    cons: ['Commercial license', 'Larger bundle size'],
    score: 9.0
  },
  'gantt-task-react': {
    pros: ['Modern React', 'TypeScript support', 'MIT license'],
    cons: ['Newer library', 'Fewer advanced features'],
    score: 8.0
  }
};

// Selected: dhtmlx-gantt for enterprise features and comprehensive functionality
```

**2.1.2 Component Architecture**
```javascript
// client/src/components/gantt/DeliveryScheduleGantt.js
import { Gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

class DeliveryScheduleGantt extends Component {
  constructor(props) {
    super(props);
    this.ganttContainer = React.createRef();
    this.gantt = null;
  }

  componentDidMount() {
    this.initializeGantt();
    this.loadProcurementSchedule();
  }

  initializeGantt() {
    this.gantt = Gantt.getGanttInstance();
    this.gantt.init(this.ganttContainer.current);

    // Configure procurement-specific settings
    this.configureGanttSettings();
    this.setupEventHandlers();
  }

  configureGanttSettings() {
    this.gantt.config.xml_date = '%Y-%m-%d %H:%i';
    this.gantt.config.scale_unit = 'month';
    this.gantt.config.date_scale = '%F %Y';
    this.gantt.config.subscales = [{ unit: 'week', step: 1, date: '%W' }];

    // Procurement-specific configurations
    this.gantt.config.drag_move = true;
    this.gantt.config.drag_progress = true;
    this.gantt.config.drag_resize = true;
    this.gantt.config.auto_scheduling = true;
  }

  async loadProcurementSchedule() {
    const scheduleData = await procurementApi.getDeliverySchedule(this.props.orderId);
    const ganttData = this.transformToGanttFormat(scheduleData);
    this.gantt.parse(ganttData);
  }

  transformToGanttFormat(procurementData) {
    return {
      data: procurementData.milestones.map(milestone => ({
        id: milestone.id,
        text: milestone.name,
        start_date: milestone.startDate,
        end_date: milestone.endDate,
        progress: milestone.progress,
        parent: milestone.parentId,
        type: milestone.type || 'task'
      })),
      links: procurementData.dependencies.map(dep => ({
        id: dep.id,
        source: dep.sourceId,
        target: dep.targetId,
        type: dep.type
      }))
    };
  }

  setupEventHandlers() {
    // Auto-save changes
    this.gantt.attachEvent('onAfterTaskUpdate', this.handleTaskUpdate);
    this.gantt.attachEvent('onAfterLinkAdd', this.handleLinkAdd);
    this.gantt.attachEvent('onAfterLinkDelete', this.handleLinkDelete);
  }

  async handleTaskUpdate(id, task) {
    await procurementApi.updateMilestone(id, {
      startDate: task.start_date,
      endDate: task.end_date,
      progress: task.progress
    });
  }

  render() {
    return (
      <div className="delivery-schedule-gantt">
        <div className="gantt-toolbar">
          <GanttToolbar onExport={this.handleExport} onImport={this.handleImport} />
        </div>
        <div ref={this.ganttContainer} className="gantt-container" />
        <div className="gantt-legend">
          <GanttLegend />
        </div>
      </div>
    );
  }
}
```

**2.1.3 Data Transformation Service**
```javascript
// server/src/services/ganttDataTransformationService.js
class GanttDataTransformationService {
  // Transform procurement delivery schedule to Gantt format
  transformProcurementToGantt(procurementOrder) {
    const { deliverySchedule, dependencies } = procurementOrder;

    return {
      data: deliverySchedule.map(item => ({
        id: item.id,
        text: item.milestoneName,
        start_date: this.formatDate(item.startDate),
        end_date: this.formatDate(item.endDate),
        progress: item.progress || 0,
        type: this.determineTaskType(item),
        parent: item.parentMilestoneId,
        color: this.getStatusColor(item.status),
        procurement_context: {
          appendix_c_reference: item.appendixCReference,
          supplier_responsibility: item.supplierId,
          technical_requirements: item.technicalRequirements
        }
      })),
      links: dependencies.map(dep => ({
        id: dep.id,
        source: dep.predecessorId,
        target: dep.successorId,
        type: this.mapDependencyType(dep.type)
      }))
    };
  }

  // Transform Gantt changes back to procurement format
  transformGanttToProcurement(ganttData, orderId) {
    return {
      orderId,
      milestones: ganttData.data.map(task => ({
        id: task.id,
        milestoneName: task.text,
        startDate: this.parseDate(task.start_date),
        endDate: this.parseDate(task.end_date),
        progress: task.progress,
        status: this.calculateStatus(task),
        appendixCReference: task.procurement_context?.appendix_c_reference
      })),
      dependencies: ganttData.links.map(link => ({
        id: link.id,
        predecessorId: link.source,
        successorId: link.target,
        type: this.mapLinkType(link.type)
      }))
    };
  }

  // Critical path analysis for procurement schedules
  calculateCriticalPath(scheduleData) {
    // Implement critical path method for delivery schedules
    const tasks = scheduleData.data;
    const links = scheduleData.links;

    // Forward pass - calculate earliest start/finish
    tasks.forEach(task => {
      const predecessors = links.filter(l => l.target === task.id);
      if (predecessors.length === 0) {
        task.earliestStart = task.start_date;
        task.earliestFinish = task.end_date;
      } else {
        const maxPredecessorFinish = Math.max(...predecessors.map(p =>
          tasks.find(t => t.id === p.source).earliestFinish
        ));
        task.earliestStart = maxPredecessorFinish;
        task.earliestFinish = new Date(task.earliestStart.getTime() + task.duration);
      }
    });

    // Backward pass - calculate latest start/finish
    // ... critical path calculation logic

    return {
      criticalPath: tasks.filter(t => t.isCritical),
      projectDuration: Math.max(...tasks.map(t => t.earliestFinish)),
      slackTasks: tasks.filter(t => t.slack > 0)
    };
  }
}
```

**2.1.4 Backend Integration**
```javascript
// server/src/controllers/ganttController.js
class GanttController {
  // Get delivery schedule for Gantt chart
  async getDeliverySchedule(req, res) {
    try {
      const { orderId } = req.params;
      const schedule = await procurementService.getDeliverySchedule(orderId);
      const ganttData = await ganttTransformationService.transformProcurementToGantt(schedule);

      res.json(ganttData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update milestone from Gantt chart
  async updateMilestone(req, res) {
    try {
      const { milestoneId } = req.params;
      const updateData = req.body;

      const updated = await procurementService.updateMilestone(milestoneId, updateData);
      await this.notifyStakeholders(updated);

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Export Gantt data to external systems
  async exportGanttData(req, res) {
    try {
      const { orderId, format } = req.params;
      const schedule = await procurementService.getDeliverySchedule(orderId);

      const exportData = await ganttExportService.export(schedule, format);
      res.setHeader('Content-Disposition', `attachment; filename="schedule.${format}"`);
      res.send(exportData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

#### Success Criteria
- [ ] Gantt chart library integrated and rendering procurement schedules
- [ ] Timeline visualization shows delivery milestones with proper scaling
- [ ] Dependency management allows predecessor/successor relationships
- [ ] Critical path analysis highlights schedule bottlenecks
- [ ] Resource allocation tracks supplier and equipment availability
- [ ] Progress tracking updates milestone completion status
- [ ] Export functionality supports MS Project, Primavera, and Excel formats

#### Dependencies
- React frontend framework
- Gantt chart library (dhtmlx-gantt recommended)
- Procurement order data with delivery schedules
- Real-time update mechanisms

#### Risk Mitigation
- **Library Licensing**: Ensure commercial license availability and cost approval
- **Performance**: Implement virtual scrolling for large schedules
- **Browser Compatibility**: Test across supported browsers and devices
- **Data Synchronization**: Implement conflict resolution for concurrent edits

---

## 3. Appendix Processing with HITL Integration

### 3.1 Agent-HITL-Human Collaboration for Appendix Processing

**Overview**: AI agents handle initial content generation for appendices, followed by Human-in-the-Loop (HITL) review and approval with integrated chatbot collaboration for iterative refinement.

#### **Appendix B Safety Data Sheets - HITL Workflow**

**Phase 1: AI Agent Processing**
- Procurement order assigns Appendix B to Safety discipline
- AI agent receives task via MyTasksDashboard
- Agent analyzes procurement order requirements and generates initial SDS content
- Agent populates 16-section SDS structure with available data
- Agent flags areas requiring human expertise (hazard identification, PPE requirements)

**Phase 2: HITL Task Creation**
- Upon AI completion, system creates HITL task for safety team
- Task assigned to safety officer via MyTasksDashboard
- Task includes AI-generated content and flagged areas needing review

**Phase 3: Human-AI Collaborative Review**
- Safety officer accesses dedicated appendix review interface
- Interface shows AI-generated content with confidence scores
- Integrated chatbot allows safety officer to:
  - Ask AI agent questions about content generation
  - Request revisions to specific SDS sections
  - Get explanations for AI recommendations
  - Validate compliance with regulatory requirements

**Phase 4: Iterative Refinement**
- Safety officer can chat with AI agent to refine content:
  - "Update Section 2 with specific hazard identification for this equipment"
  - "Add PPE requirements for electrical work"
  - "Verify compliance with local safety regulations"
- AI agent processes feedback and regenerates content
- Process continues until safety officer approves

**Phase 5: Final Approval & Integration**
- Safety officer marks appendix complete
- Approved content integrates into final procurement document
- Status updates trigger compilation workflow

#### **Appendix B: Dedicated SDS Review Interface - REQUIRED**

**Why Dedicated UI is Required:**
- SDS are complex 16-section regulatory documents with specific formatting requirements
- Safety compliance validation requires specialized tools and checklists
- AI agent assistance needed for hazard identification, PPE requirements, and regulatory compliance
- Safety officers need interactive validation tools for different jurisdictions and standards

```
┌─ Appendix B: Safety Data Sheets ──────────────────────────────────────────────┐
│ AI Agent: Safety Compliance Assistant                                        │
│ Status: Awaiting Human Review (Iteration 2/3)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 📋 SDS Content Preview                                                      │
│ ┌─ Section 1: Identification ──────────────────────────────────────────────┐ │
│ │ Product: Caterpillar 320 Excavator                                      │ │
│ │ AI Confidence: 95% ✓                                                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Section 2: Hazard Identification ───────────────────────────────────────┐ │
│ │ ⚠️ NEEDS REVIEW: AI flagged for human validation                        │ │
│ │ Hazards: Mechanical, Electrical, Noise, Vibration                       │ │
│ │ AI Confidence: 78% ⚠️                                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🛡️ Safety Compliance Tools                                                │
│ ├─ Regulatory Standards: OSHA 1910.1200, GHS, REACH                      │
│ ├─ Jurisdiction Check: [South Africa] [USA] [EU] [Global]                 │
│ ├─ Hazard Classification: Physical, Health, Environmental                  │
│ └─ PPE Requirements Validation                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ 💬 Chat with AI Agent                                                      │
│ ├─ You: "Add specific PPE requirements for electrical work"               │
│ ├─ 🤖 Agent: "Added Section 8 PPE requirements for electrical hazards..."  │
│ ├─ You: "Verify compliance with OSHA standards"                           │
│ └─ 🤖 Agent: "Content updated to meet OSHA 1910.132 requirements..."       │
├──────────────────────────────────────────────────────────────────────────────┤
│ [🔄 Request Revision] [✅ Approve Content] [📋 View Full SDS] [💾 Save Draft] │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### **Appendix E: Logistics Documentation Interface - OPTIONAL**

**Evaluation: Could Use Existing Systems**
- Logistics documentation is typically simpler than SDS
- Could leverage existing document management interfaces
- Might not require specialized AI agent assistance
- Could be handled through general procurement document workflow

**Option 1: Dedicated Interface (If Complex Logistics Required)**
```
┌─ Appendix E: Logistics Documentation ──────────────────────────────────────┐
│ AI Agent: Logistics Compliance Assistant                                  │
│ Status: Awaiting Review (Simple Logistics)                               │
├───────────────────────────────────────────────────────────────────────────┤
│ 📦 Logistics Requirements Preview                                        │
│ ├─ Transport Mode: Road Freight → Sea Freight                           │
│ ├─ Customs Documentation: Commercial Invoice, Packing List              │
│ ├─ Insurance Requirements: Full cargo coverage                          │
│ ├─ Special Handling: Hazardous materials protocols                      │
│ └─ Delivery Timeline: Port arrival → Customs clearance → Final delivery │
├───────────────────────────────────────────────────────────────────────────┤
│ 🚛 Logistics Compliance Tools                                           │
│ ├─ Incoterms Validation: FOB, CIF, DDP                                  │
│ ├─ Customs Requirements: By destination country                         │
│ ├─ Insurance Coverage Check                                             │
│ └─ Route Optimization Suggestions                                       │
├───────────────────────────────────────────────────────────────────────────┤
│ [✅ Approve Logistics] [📋 View Full Documentation] [💾 Save Changes]     │
└───────────────────────────────────────────────────────────────────────────┘
```

**Option 2: Leverage Existing Procurement Interface (Recommended)**
- Use the general procurement document contribution interface
- No specialized AI agent needed for logistics
- Simple approval workflow without complex HITL iterations
- Integrate logistics requirements into main procurement document flow

**Recommendation: Skip dedicated UI for Appendix E**
- Logistics documentation is typically straightforward
- Can be handled through existing document contribution workflows
- Does not require specialized safety compliance tools like SDS
- Avoids unnecessary interface complexity

#### **Cross-Discipline Appendix Processing**

**Engineering Team (Appendix A - Technical Specifications):**
- AI agent generates technical specifications from equipment data
- Engineering team reviews via **Technical Documents interface** (`/technical-documents`)
- HITL review process using existing technical document management system
- Collaborative chat for specification refinement and compliance validation
- Final approval integrates specs into procurement package

**Procurement Team (Appendix C - Delivery Schedules):**
- AI agent creates initial timeline based on order requirements and generates Gantt chart data
- Procurement team reviews via **Gantt Chart interface** (Appendix C HITL workflow)
- Timeline adjustments and supplier coordination through interactive Gantt editing
- Final schedule approval and integration into procurement document

**Quality Team (Appendix F - Standards Compliance):**
- AI agent analyzes compliance requirements
- Quality team validates standards application
- Chat-based clarification of compliance interpretations
- Final compliance certification

### 3.2 Technical Training Assignment Restructure

#### Objective
Restructure Appendix D training assignments to route equipment/material training to technical disciplines instead of general HR, with specialized curriculum building and certification tracking.

#### Technical Tasks

**3.1.1 Database Schema for Technical Training**
```sql
-- Enhanced training assignments table
CREATE TABLE IF NOT EXISTS technical_training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_order_id UUID NOT NULL REFERENCES procurement_orders(id),
  appendix_d_reference TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  training_category TEXT CHECK (training_category IN ('equipment', 'material', 'safety', 'operational')),
  assigned_discipline TEXT NOT NULL REFERENCES disciplines(code),
  trainer_user_id UUID REFERENCES users(id),
  trainee_requirements JSONB NOT NULL DEFAULT '{}',
  curriculum_structure JSONB NOT NULL DEFAULT '{}',
  certification_requirements JSONB NOT NULL DEFAULT '{}',
  status TEXT CHECK (status IN ('assigned', 'in_progress', 'completed', 'certified')) DEFAULT 'assigned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training curriculum templates
CREATE TABLE IF NOT EXISTS training_curriculum_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_category TEXT NOT NULL,
  curriculum_name TEXT NOT NULL,
  modules JSONB NOT NULL DEFAULT '[]',
  duration_hours INTEGER NOT NULL,
  certification_type TEXT,
  required_disciplines JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(equipment_category, curriculum_name)
);

-- Insert equipment-specific training curricula
INSERT INTO training_curriculum_templates (equipment_category, curriculum_name, modules, duration_hours, certification_type, required_disciplines) VALUES
('heavy_equipment', 'Excavator Operation & Maintenance',
  '[{"name": "Equipment Overview", "duration": 2}, {"name": "Safety Procedures", "duration": 4}, {"name": "Operation Fundamentals", "duration": 8}, {"name": "Maintenance Procedures", "duration": 6}, {"name": "Emergency Protocols", "duration": 2}]',
  22, 'CPCS Certified', '["00800", "00850", "00872"]'
),
('lifting_equipment', 'Crane Operation & Safety',
  '[{"name": "Load Calculations", "duration": 4}, {"name": "Rigging Fundamentals", "duration": 6}, {"name": "Safety Standards", "duration": 4}, {"name": "Emergency Procedures", "duration": 2}]',
  16, 'LOLER Certified', '["00835", "00860", "02400"]'
),
('material_handling', 'Forklift & Telehandler Training',
  '[{"name": "Equipment Familiarization", "duration": 2}, {"name": "Load Handling", "duration": 4}, {"name": "Site Navigation", "duration": 4}, {"name": "Maintenance Awareness", "duration": 2}]',
  12, 'ITSSAR Certified', '["00825", "00300"]'
);
```

**3.1.2 Technical Training Assignment Service**
```javascript
// server/src/services/technicalTrainingService.js
class TechnicalTrainingService {
  // Assign technical training to appropriate disciplines
  async assignTechnicalTraining(orderId, equipmentDetails) {
    const assignments = [];

    for (const equipment of equipmentDetails) {
      const curriculum = await this.getTrainingCurriculum(equipment.category);
      const assignedDiscipline = await this.determineTrainingDiscipline(equipment, curriculum);

      const assignment = {
        procurement_order_id: orderId,
        equipment_type: equipment.type,
        training_category: this.categorizeTraining(equipment),
        assigned_discipline: assignedDiscipline,
        curriculum_structure: curriculum,
        trainee_requirements: this.defineTraineeRequirements(equipment),
        certification_requirements: curriculum.certification_type
      };

      assignments.push(assignment);
    }

    return await this.saveTrainingAssignments(assignments);
  }

  // Determine appropriate technical discipline for training
  async determineTrainingDiscipline(equipment, curriculum) {
    // Primary: Equipment-specific engineering disciplines
    const equipmentDisciplines = {
      'excavator': ['00850'], // Civil Engineering
      'crane': ['00835'], // Structural Engineering
      'forklift': ['00825'], // Mechanical Engineering
      'pump': ['00860'], // Mechanical Systems
      'generator': ['00872'] // Electrical Systems
    };

    const primaryDisciplines = equipmentDisciplines[equipment.type] || ['00800']; // General Engineering fallback

    // Find available users in primary disciplines
    for (const disciplineCode of primaryDisciplines) {
      const availableUsers = await this.getAvailableTrainers(disciplineCode, curriculum);
      if (availableUsers.length > 0) {
        return disciplineCode; // Return first available discipline
      }
    }

    // Fallback to construction management for practical training
    return '00300';
  }

  // Get training curriculum for equipment category
  async getTrainingCurriculum(equipmentCategory) {
    const curriculum = await db('training_curriculum_templates')
      .where('equipment_category', equipmentCategory)
      .first();

    if (!curriculum) {
      // Generate dynamic curriculum for unknown equipment
      return this.generateDynamicCurriculum(equipmentCategory);
    }

    return curriculum;
  }

  // Categorize training type based on equipment
  categorizeTraining(equipment) {
    if (equipment.powerSource === 'electric' || equipment.hasElectronics) {
      return 'equipment'; // Technical equipment training
    }
    if (equipment.handlingHazardous) {
      return 'safety'; // Safety-focused training
    }
    if (equipment.requiresSiteSpecific) {
      return 'operational'; // Site-specific operational training
    }
    return 'material'; // General material handling
  }

  // Define trainee requirements
  defineTraineeRequirements(equipment) {
    const requirements = {
      prerequisites: [],
      experience_level: 'basic',
      certification_required: false
    };

    // Add equipment-specific requirements
    if (equipment.weight > 5000) {
      requirements.prerequisites.push('Heavy equipment license');
      requirements.experience_level = 'intermediate';
    }

    if (equipment.hazardousMaterials) {
      requirements.prerequisites.push('Hazardous materials handling certification');
      requirements.certification_required = true;
    }

    return requirements;
  }

  // Get available trainers for discipline
  async getAvailableTrainers(disciplineCode, curriculum) {
    const users = await db('users')
      .join('user_discipline_assignments', 'users.id', 'user_discipline_assignments.user_id')
      .where('user_discipline_assignments.discipline_code', disciplineCode)
      .where('users.is_active', true)
      .select('users.id', 'users.name', 'users.email');

    // Filter users with training qualifications
    return await this.filterQualifiedTrainers(users, curriculum);
  }
}
```

**3.1.3 Training Assignment Frontend**
```javascript
// client/src/components/procurement/TechnicalTrainingAssignment.js
const TechnicalTrainingAssignment = ({ orderId, equipmentList }) => {
  const [assignments, setAssignments] = useState([]);
  const [curricula, setCurricula] = useState({});

  useEffect(() => {
    loadTrainingAssignments();
  }, [orderId, equipmentList]);

  const loadTrainingAssignments = async () => {
    const trainingData = await procurementApi.getTechnicalTrainingAssignments(orderId);
    setAssignments(trainingData.assignments);
    setCurricula(trainingData.curricula);
  };

  const assignTraining = async (equipmentId, disciplineCode) => {
    await procurementApi.assignTechnicalTraining(orderId, equipmentId, disciplineCode);
    await loadTrainingAssignments(); // Refresh assignments
  };

  return (
    <div className="technical-training-assignment">
      <h3>Appendix D: Technical Training Assignments</h3>

      {equipmentList.map(equipment => (
        <EquipmentTrainingCard
          key={equipment.id}
          equipment={equipment}
          assignment={assignments.find(a => a.equipment_id === equipment.id)}
          curriculum={curricula[equipment.category]}
          onAssign={(discipline) => assignTraining(equipment.id, discipline)}
        />
      ))}

      <TrainingSummary assignments={assignments} />
    </div>
  );
};

// Equipment-specific training card
const EquipmentTrainingCard = ({ equipment, assignment, curriculum, onAssign }) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState('');

  const handleAssign = () => {
    if (selectedDiscipline) {
      onAssign(selectedDiscipline);
    }
  };

  return (
    <div className="equipment-training-card">
      <div className="equipment-info">
        <h4>{equipment.name} ({equipment.type})</h4>
        <p>Category: {equipment.category}</p>
        <p>Training Hours: {curriculum?.duration_hours || 'TBD'}</p>
      </div>

      {assignment ? (
        <div className="assignment-info">
          <p>Assigned to: {assignment.discipline_name}</p>
          <p>Trainer: {assignment.trainer_name || 'TBD'}</p>
          <p>Status: {assignment.status}</p>
        </div>
      ) : (
        <div className="assignment-form">
          <DisciplineSelector
            value={selectedDiscipline}
            onChange={setSelectedDiscipline}
            technicalOnly={true}
          />
          <button onClick={handleAssign} disabled={!selectedDiscipline}>
            Assign Technical Training
          </button>
        </div>
      )}

      {curriculum && (
        <TrainingCurriculum curriculum={curriculum} />
      )}
    </div>
  );
};
```

#### Success Criteria
- [ ] Database schema supports technical training assignments with curriculum tracking
- [ ] Training assignments route to technical disciplines (00800-00872, 00300) instead of HR
- [ ] Equipment-specific curricula defined for common procurement categories
- [ ] Certification tracking integrated with training completion
- [ ] Frontend displays training assignments by technical discipline
- [ ] Competency verification linked to training completion

#### Dependencies
- Equipment/material specification data from procurement orders
- User discipline assignment system
- Certification tracking system (if exists)

#### Risk Mitigation
- **Training Expertise**: Validate that assigned disciplines have training qualifications
- **Curriculum Accuracy**: Implement review process for generated curricula
- **Certification Compliance**: Ensure certification requirements meet regulatory standards
- **Scalability**: Design for varying equipment types and training complexity

---

## 5. Developer Modal Integration for Agent Prompt Testing

### 5.1 Developer Testing Modal Implementation

#### Objective
Add developer-only modal for rapid agent prompt testing and iteration on new pages, enabling fast debugging and optimization cycles during development.

#### Technical Tasks

**5.1.1 Enhanced Developer Testing Modal Component**
```javascript
// client/src/components/developer/DeveloperPromptTestingModal.js
import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

const DeveloperPromptTestingModal = ({
  isOpen,
  onClose,
  pageId,
  availablePrompts,
  onPromptUpdate
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  // Load page-specific test context
  useEffect(() => {
    if (pageId && isOpen) {
      loadPageTestContext(pageId);
    }
  }, [pageId, isOpen]);

  const loadPageTestContext = async (pageId) => {
    const context = await developerApi.getPageTestContext(pageId);
    setTestInput(context.sampleInput || '');
  };

  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    setEditedContent(prompt.content);
    loadPromptPerformance(prompt.id);
  };

  const loadPromptPerformance = async (promptId) => {
    const performance = await developerApi.getPromptPerformance(promptId);
    setPerformanceData(performance);
  };

  const testPrompt = async () => {
    if (!selectedPrompt || !testInput.trim()) return;

    setIsTesting(true);
    try {
      const result = await developerApi.testPrompt({
        promptId: selectedPrompt.id,
        input: testInput,
        context: { pageId, timestamp: new Date() }
      });
      setTestResults(result);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const savePrompt = async () => {
    if (!selectedPrompt) return;

    try {
      await developerApi.updatePrompt(selectedPrompt.id, {
        content: editedContent,
        version: selectedPrompt.version + 1
      });
      onPromptUpdate(selectedPrompt.id, editedContent);
      // Show success notification
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="developer-modal-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="developer-modal-content" style={{
        background: '#1e1e1e',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '1200px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        color: 'white'
      }}>
        {/* Modal Header */}
        <div className="modal-header" style={{
          padding: '16px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3>Developer Prompt Testing - {pageId}</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer'
          }}>×</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px',
          padding: '20px',
          overflow: 'hidden'
        }}>
          {/* Left Panel - Prompt Selection & Info */}
          <div className="left-panel">
            <div style={{ marginBottom: '20px' }}>
              <h4>Prompt Selection</h4>
              <select
                value={selectedPrompt?.id || ''}
                onChange={(e) => {
                  const prompt = availablePrompts.find(p => p.id === e.target.value);
                  if (prompt) handlePromptSelect(prompt);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#2d2d2d',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white'
                }}
              >
                <option value="">Select Prompt...</option>
                {availablePrompts.map(prompt => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.name} (v{prompt.agent_version})
                  </option>
                ))}
              </select>
            </div>

            {performanceData && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Performance Metrics</h4>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  <div>Success Rate: {performanceData.successRate}%</div>
                  <div>Avg Response: {performanceData.avgResponseTime}ms</div>
                  <div>Total Tests: {performanceData.totalTests}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Editor & Testing */}
          <div className="right-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Prompt Editor */}
            <div className="editor-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4>Prompt Editor</h4>
                <button onClick={savePrompt} className="btn btn-sm btn-success">
                  Save Changes
                </button>
              </div>
              <MonacoEditor
                height="300px"
                language="text"
                theme="vs-dark"
                value={editedContent}
                onChange={setEditedContent}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on'
                }}
              />
            </div>

            {/* Test Interface */}
            <div className="test-section">
              <h4>Test Interface</h4>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Enter test input for prompt..."
                style={{
                  width: '100%',
                  height: '80px',
                  background: '#2d2d2d',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  padding: '8px',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={testPrompt}
                disabled={isTesting || !selectedPrompt}
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                {isTesting ? 'Testing...' : 'Test Prompt'}
              </button>
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="results-section">
                <h4>Test Results</h4>
                <pre style={{
                  background: '#2d2d2d',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  padding: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '12px',
                  color: '#e0e0e0'
                }}>
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPromptTestingModal;
```

**5.1.2 Page Integration Pattern**
```javascript
// Integration pattern for new pages (SDS Review, Gantt Chart, etc.)
const EnhancedPageComponent = (OriginalComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        showDevModal: false,
        availablePrompts: [],
        isDeveloper: false
      };
    }

    componentDidMount() {
      this.checkDeveloperAccess();
      this.loadPagePrompts();
      this.setupKeyboardShortcut();
    }

    checkDeveloperAccess = () => {
      const isDeveloper = this.props.user?.roles?.includes('developer') ||
                         process.env.NODE_ENV === 'development';
      this.setState({ isDeveloper });
    };

    loadPagePrompts = async () => {
      if (!this.state.isDeveloper) return;

      const pageId = this.getCurrentPageId();
      const prompts = await developerApi.getPagePrompts(pageId);
      this.setState({ availablePrompts: prompts });
    };

    setupKeyboardShortcut = () => {
      if (!this.state.isDeveloper) return;

      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          e.preventDefault();
          this.setState({ showDevModal: true });
        }
      });
    };

    handlePromptUpdate = (promptId, newContent) => {
      // Update local prompt cache
      this.setState(prevState => ({
        availablePrompts: prevState.availablePrompts.map(prompt =>
          prompt.id === promptId ? { ...prompt, content: newContent } : prompt
        )
      }));
    };

    render() {
      const { showDevModal, availablePrompts, isDeveloper } = this.state;

      return (
        <>
          <OriginalComponent {...this.props} />

          {/* Developer trigger button (only for developers) */}
          {isDeveloper && (
            <button
              className="developer-trigger-btn"
              onClick={() => this.setState({ showDevModal: true })}
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '20px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: 1000
              }}
              title="Developer Prompt Testing (Ctrl+Shift+P)"
            >
              🧪
            </button>
          )}

          {/* Developer Modal */}
          {showDevModal && (
            <DeveloperPromptTestingModal
              isOpen={showDevModal}
              onClose={() => this.setState({ showDevModal: false })}
              pageId={this.getCurrentPageId()}
              availablePrompts={availablePrompts}
              onPromptUpdate={this.handlePromptUpdate}
            />
          )}
        </>
      );
    }
  };
};
```

**5.1.3 API Integration**
```javascript
// server/src/controllers/developerController.js
class DeveloperController {
  // Get prompts for a specific page
  async getPagePrompts(req, res) {
    try {
      const { pageId } = req.params;
      const userId = req.user.id;

      // Verify developer access
      const isDeveloper = await this.checkDeveloperAccess(userId);
      if (!isDeveloper) {
        return res.status(403).json({ error: 'Developer access required' });
      }

      // Get page-specific prompts
      const prompts = await promptService.getPromptsByPage(pageId);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Test prompt with input
  async testPrompt(req, res) {
    try {
      const { promptId, input, context } = req.body;

      // Execute prompt test
      const result = await agentService.testPrompt(promptId, input, context);

      // Log test for analytics
      await this.logPromptTest(promptId, result, context);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update prompt content
  async updatePrompt(req, res) {
    try {
      const { promptId } = req.params;
      const { content, version } = req.body;

      const updatedPrompt = await promptService.updatePrompt(promptId, {
        content,
        version,
        updatedBy: req.user.id,
        updatedAt: new Date()
      });

      // Create version snapshot
      await promptService.createPromptVersion(promptId, updatedPrompt);

      res.json(updatedPrompt);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get prompt performance metrics
  async getPromptPerformance(req, res) {
    try {
      const { promptId } = req.params;
      const performance = await analyticsService.getPromptPerformance(promptId);
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

#### Success Criteria
- [ ] Developer modal appears only for users with developer role
- [ ] Ctrl+Shift+P keyboard shortcut opens modal
- [ ] Page-specific prompts load correctly
- [ ] Real-time prompt editing with Monaco editor
- [ ] Live prompt testing with results display
- [ ] Performance metrics display for each prompt
- [ ] Changes save with version control
- [ ] Modal integrates seamlessly with existing pages

#### Dependencies
- Monaco editor for code editing
- Existing prompt management system
- Developer role authentication
- Analytics service for performance metrics

#### Risk Mitigation
- **Security**: Developer role verification prevents unauthorized access
- **Performance**: Modal loads only for developers, lazy-loaded components
- **Data Integrity**: Version control prevents prompt corruption
- **User Experience**: Non-intrusive floating button, keyboard shortcuts

---

## Phase 1 Implementation Timeline

### Week 1: Infrastructure Foundation
- **Days 1-2**: Technical team discipline configuration (database schema, mappings)
- **Days 3-5**: Gantt chart library evaluation and basic integration

### Week 2: Core Component Development
- **Days 6-8**: Complete Gantt chart component with data transformation
- **Days 9-10**: Technical training database schema and basic assignment logic

### Week 3: Integration & Enhancement
- **Days 11-13**: Template variation pre-selection in CreateOrderModal
- **Days 14-15**: Integration testing and bug fixes

### Phase 1 Deliverables Checklist
- [ ] Technical discipline configuration complete
- [ ] Gantt chart component functional with procurement data
- [ ] Appendix D training routed to technical disciplines
- [ ] Template variation pre-selection enforced
- [ ] Developer modal integration for agent prompt testing
- [ ] All components integrated with existing procurement workflow
- [ ] Unit tests written and passing
- [ ] Integration tests completed
- [ ] Documentation updated
- [ ] User acceptance testing completed

### Quality Assurance Gates
- **Code Review**: All changes reviewed by senior developers
- **Security Review**: Database changes and new components security-reviewed
- **Performance Testing**: Components tested under load
- **Browser Testing**: Cross-browser compatibility verified
- **Accessibility Testing**: WCAG compliance checked

### Rollback Plan
- **Feature Flags**: All new features behind feature flags for instant disable
- **Database**: Migration scripts include rollback procedures
- **Code**: Git tags at phase start for emergency reversion
- **Data**: Backup procedures for procurement data before changes

This detailed Phase 1 implementation plan provides the technical specifications, code examples, success criteria, and risk mitigation strategies needed to successfully establish the core infrastructure for the rationalized procurement workflow.

## 4. Template Variation Pre-Selection Enhancement

### 4.1 Single Template Selection Architecture

#### Objective
Eliminate redundant template variation selection by enforcing single selection during order creation and auto-applying throughout the workflow.

#### Technical Tasks

**4.1.1 Database Schema Updates**
```sql
-- Add template variation persistence to procurement orders
ALTER TABLE procurement_orders
ADD COLUMN template_variation TEXT CHECK (template_variation IN ('standard', 'compliance', 'technical')),
ADD COLUMN template_selected_at TIMESTAMPTZ,
ADD COLUMN template_selected_by UUID REFERENCES users(id);

-- Add constraint to ensure template variation is required
ALTER TABLE procurement_orders
ADD CONSTRAINT template_variation_required
CHECK (template_variation IS NOT NULL);

-- Create index for template-based queries
CREATE INDEX idx_procurement_orders_template_variation
ON procurement_orders(template_variation);
```

**4.1.2 Enhanced CreateOrderModal**
```javascript
// client/src/pages/01900-procurement/components/CreateOrderModal.js (enhanced)
class CreateOrderModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderData: {
        templateVariation: '', // Now required field
        disciplineAssignments: [],
        // ... other fields
      },
      templateOptions: [],
      validationErrors: {}
    };
  }

  componentDidMount() {
    this.loadTemplateOptions();
  }

  async loadTemplateOptions() {
    const options = await procurementApi.getTemplateVariations();
    this.setState({ templateOptions: options });
  }

  // Intelligent template variation suggestion
  suggestTemplateVariation(orderData) {
    if (orderData.value > 250000 || orderData.requiresCompliance) {
      return 'compliance';
    }
    if (orderData.equipmentInvolved || orderData.technicalComplexity === 'high') {
      return 'technical';
    }
    return 'standard';
  }

  handleTemplateVariationChange(variation) {
    this.setState(prevState => ({
      orderData: {
        ...prevState.orderData,
        templateVariation: variation
      }
    }));

    // Auto-assign disciplines based on template variation
    this.autoAssignDisciplines(variation);
  }

  async autoAssignDisciplines(templateVariation) {
    const disciplines = await procurementApi.getDisciplinesForTemplate(templateVariation);
    this.setState(prevState => ({
      orderData: {
        ...prevState.orderData,
        disciplineAssignments: disciplines
      }
    }));
  }

  async handleSubmit() {
    // Validate template variation selection
    if (!this.state.orderData.templateVariation) {
      this.setState({
        validationErrors: {
          templateVariation: 'Template variation selection is required'
        }
      });
      return;
    }

    // Create order with template variation
    const orderData = {
      ...this.state.orderData,
      templateSelectedAt: new Date(),
      templateSelectedBy: this.props.currentUser.id
    };

    await procurementApi.createOrder(orderData);
    this.props.onOrderCreated();
  }

  render() {
    const { orderData, templateOptions, validationErrors } = this.state;

    return (
      <Modal>
        <h2>Create Procurement Order</h2>

        {/* Template Variation Selection - Now Required */}
        <div className="form-group">
          <label>Template Variation *</label>
          <select
            value={orderData.templateVariation}
            onChange={(e) => this.handleTemplateVariationChange(e.target.value)}
            required
          >
            <option value="">Select Template Variation</option>
            {templateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
          {validationErrors.templateVariation && (
            <span className="error">{validationErrors.templateVariation}</span>
          )}
        </div>

        {/* Discipline Assignments - Auto-populated */}
        <DisciplineAssignmentSection
          assignments={orderData.disciplineAssignments}
          templateVariation={orderData.templateVariation}
          readOnly={false} // Allow limited overrides
        />

        {/* Rest of form */}
        <div className="form-actions">
          <button onClick={this.handleSubmit} disabled={!orderData.templateVariation}>
            Create Order
          </button>
        </div>
      </Modal>
    );
  }
}
```

**4.1.3 SOW Generation Integration**
```javascript
// server/src/services/sowGenerationService.js (enhanced)
class SOWGenerationService {
  // Generate SOW using pre-selected template variation
  async generateSOW(orderId) {
    const order = await procurementService.getOrder(orderId);

    if (!order.templateVariation) {
      throw new Error('Template variation must be selected before SOW generation');
    }

    // Get sections from Document Ordering Management based on template variation
    const sections = await documentOrderingService.getSectionsForTemplate(
      order.discipline,
      order.templateVariation
    );

    // Generate SOW content using selected template variation
    const sowContent = await this.generateContent(order, sections, order.templateVariation);

    return sowContent;
  }

  // Remove redundant template selection from SOW generation
  async generateContent(order, sections, templateVariation) {
    const content = {
      sections: [],
      metadata: {
        templateVariation,
        selectedAt: order.templateSelectedAt,
        selectedBy: order.templateSelectedBy
      }
    };

    // Apply template-specific formatting and content
    for (const section of sections) {
      const sectionContent = await this.generateSectionContent(
        section,
        order,
        templateVariation
      );
      content.sections.push(sectionContent);
    }

    return content;
  }

  // Generate section content based on template variation
  async generateSectionContent(section, order, templateVariation) {
    const templateConfig = await this.getTemplateConfiguration(templateVariation);

    return {
      ...section,
      content: await this.applyTemplateFormatting(section.content, templateConfig),
      formatting: templateConfig.formatting,
      compliance: templateConfig.compliance
    };
  }
}
```

**4.1.4 Backend Validation & Enforcement**
```javascript
// server/src/middleware/templateVariationMiddleware.js
const templateVariationMiddleware = {
  // Enforce template variation selection
  enforceTemplateSelection: (req, res, next) => {
    if (req.method === 'POST' && req.path.includes('/orders')) {
      const { templateVariation } = req.body;

      if (!templateVariation) {
        return res.status(400).json({
          error: 'Template variation selection is required',
          code: 'TEMPLATE_VARIATION_REQUIRED'
        });
      }

      // Validate template variation value
      const validVariations = ['standard', 'compliance', 'technical'];
      if (!validVariations.includes(templateVariation)) {
        return res.status(400).json({
          error: 'Invalid template variation',
          code: 'INVALID_TEMPLATE_VARIATION'
        });
      }
    }

    next();
  },

  // Prevent template variation changes after order creation
  preventTemplateChanges: async (req, res, next) => {
    if (req.method === 'PUT' && req.path.includes('/orders/')) {
      const orderId = req.params.id;
      const order = await procurementService.getOrder(orderId);

      if (order.status !== 'draft') {
        const { templateVariation } = req.body;
        if (templateVariation && templateVariation !== order.templateVariation) {
          return res.status(400).json({
            error: 'Template variation cannot be changed after order creation',
            code: 'TEMPLATE_VARIATION_LOCKED'
          });
        }
      }
    }

    next();
  }
};
```

#### Success Criteria
- [ ] Database schema enforces template variation requirement
- [ ] CreateOrderModal requires template variation selection
- [ ] Template variation auto-assigns disciplines from Document Ordering Management
- [ ] SOW generation uses pre-selected template variation automatically
- [ ] Middleware prevents template variation changes after order creation
- [ ] Template variation persisted with audit trail (who, when)

#### Dependencies
- Document Ordering Management system
- Existing procurement order creation workflow
- Discipline assignment system

#### Risk Mitigation
- **Breaking Changes**: Implement feature flags for gradual rollout
- **Data Migration**: Ensure existing orders without template variations are handled
- **User Training**: Provide clear guidance on template variation selection
- **Validation**: Comprehensive validation prevents invalid template selections

---

## Phase 1 Implementation Timeline

### Week 1: Infrastructure Foundation
- **Days 1-2**: Technical team discipline configuration (database schema, mappings)
- **Days 3-5**: Gantt chart library evaluation and basic integration

### Week 2: Core Component Development
- **Days 6-8**: Complete Gantt chart component with data transformation
- **Days 9-10**: Technical training database schema and basic assignment logic

### Week 3: Integration & Enhancement
- **Days 11-13**: Template variation pre-selection in CreateOrderModal
- **Days 14-15**: Integration testing and bug fixes

### Phase 1 Deliverables Checklist
- [ ] Technical discipline configuration complete
- [ ] Gantt chart component functional with procurement data
- [ ] Appendix D training routed to technical disciplines
- [ ] Template variation pre-selection enforced
- [ ] All components integrated with existing procurement workflow
- [ ] Unit tests written and passing
- [ ] Integration tests completed
- [ ] Documentation updated
- [ ] User acceptance testing completed

### Quality Assurance Gates
- **Code Review**: All changes reviewed by senior developers
- **Security Review**: Database changes and new components security-reviewed
- **Performance Testing**: Components tested under load
- **Browser Testing**: Cross-browser compatibility verified
- **Accessibility Testing**: WCAG compliance checked

### Rollback Plan
- **Feature Flags**: All new features behind feature flags for instant disable
- **Database**: Migration scripts include rollback procedures
- **Code**: Git tags at phase start for emergency reversion
- **Data**: Backup procedures for procurement data before changes

This detailed Phase 1 implementation plan provides the technical specifications, code examples, success criteria, and risk mitigation strategies needed to successfully establish the core infrastructure for the rationalized procurement workflow.
