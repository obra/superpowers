# 1300_01802_MAINTENANCE_MANAGEMENT_PAGE.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.3 (2025-09-01): Added comprehensive component documentation
- v1.2 (2025-09-01): Enhanced UI/UX specifications
- v1.1 (2025-09-01): Added database architecture details
- v1.0 (2025-09-01): Initial release with maintenance system documentation

## Overview

The Maintenance Management Page provides comprehensive asset management, preventive maintenance scheduling, work order tracking, and equipment lifecycle management for construction operations. It follows the established ConstructAI Simple Page Implementation patterns without background images.

## URL
`http://localhost:3000/01802-maintenance-management`

## Key Features

### 📊 **Asset Dashboard**
- **Equipment Count**: Active assets with status breakdown (Operational/Under Maintenance/Breakdown/Others)
- **Maintenance Metrics**: Upcoming vs overdue maintenance schedules
- **Work Order Statistics**: Open, in-progress, completed work orders
- **Cost Analysis**: Maintenance cost trends and budget utilization
- **Asset Utilization**: Equipment uptime and productivity metrics

### 📋 **Asset Management**
- **Comprehensive Equipment Registry**: Complete asset database with specifications
- **Status Tracking**: Real-time operational status monitoring
- **Location Management**: Site, warehouse, yard, and facility tracking
- **Asset Classification**: Heavy machinery, tools, vehicles, safety equipment
- **Lifecycle Management**: Acquisition, operation, maintenance, disposal tracking

### 🔧 **Work Order System**
- **Priority-Based Tasks**: Critical, High, Medium, Low priority classifications
- **Status Workflow**: Open → Assigned → In Progress → Completed → Closed
- **Technician Assignment**: Workforce scheduling and task allocation
- **Progress Tracking**: Time logging and completion percentage
- **Quality Assurance**: Inspection checklists and acceptance criteria

### 🛠️ **Preventive Maintenance**
- **Scheduled Maintenance**: Time-based and usage-based preventive schedules
- **Predictive Indicators**: Condition monitoring and failure prediction
- **Compliance Tracking**: Regulatory and warranty requirement management
- **Calendar Integration**: Maintenance planning and resource scheduling
- **Cost Optimization**: Condition-based vs time-based maintenance decisions

## Database Schema

### Asset Management Schema
```sql
-- Equipment and asset table
CREATE TABLE IF NOT EXISTS equipment_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code VARCHAR(50) UNIQUE NOT NULL,

  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- Heavy Machinery, Vehicles, Tools, Equipment, Safety Gear
  subcategory VARCHAR(100),

  -- Specifications
  manufacturer VARCHAR(255),
  model_number VARCHAR(100),
  serial_number VARCHAR(100),
  manufacture_year VARCHAR(4),
  specifications JSONB,

  -- Operational details
  status VARCHAR(50) DEFAULT 'operational',
  operational_status VARCHAR(50) DEFAULT 'available',
  location VARCHAR(255),
  department VARCHAR(50),

  -- Maintenance tracking
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_interval_days INTEGER,
  operating_hours DECIMAL(10,2) DEFAULT 0,
  last_service_hours DECIMAL(10,2),

  -- Acquisition and financial
  purchase_date DATE,
  purchase_cost DECIMAL(12,2),
  residual_value DECIMAL(12,2),
  depreciation_method VARCHAR(50),
  warranty_expiry DATE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  active BOOLEAN DEFAULT true,

  -- Foreign keys
  vendor_supplier_id UUID REFERENCES vendors(id),
  responsible_technician_id UUID REFERENCES technicians(id),

  -- Spatial and configuration
  asset_qr_barcode VARCHAR(100),
  building_floor_room VARCHAR(100),
  maintenance_instructions TEXT,
  safety_requirements TEXT
);

-- Indexes for optimal performance
CREATE INDEX idx_equipment_category ON equipment_assets(category);
CREATE INDEX idx_equipment_status ON equipment_assets(status);
CREATE INDEX idx_equipment_maintenance_date ON equipment_assets(next_maintenance_date);
CREATE INDEX idx_equipment_location ON equipment_assets(location);
```

### Work Order Management Schema
```sql
-- Work orders table
CREATE TABLE work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_number VARCHAR(50) UNIQUE NOT NULL,

  -- Work order details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
  type VARCHAR(50) DEFAULT 'preventive', -- preventive, corrective, breakdown, inspection

  -- Equipment and location
  equipment_asset_id UUID REFERENCES equipment_assets(id),
  location VARCHAR(255),

  -- Status and timing
  status VARCHAR(20) DEFAULT 'open', -- open, assigned, in_progress, on_hold, completed, closed
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE,
  scheduled_start_date TIMESTAMP WITH TIME ZONE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Assignment and resources
  assigned_technician_id UUID REFERENCES technicians(id),
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),

  -- Cost and labor
  estimated_labor_hours DECIMAL(6,2),
  actual_labor_hours DECIMAL(6,2),
  labor_cost DECIMAL(10,2),
  material_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  -- Documentation
  failure_description TEXT,
  corrective_action TEXT,
  preventive_measures TEXT,
  parts_used JSONB,

  -- Asset impact
  downtime_hours DECIMAL(6,2),
  asset_condition_before VARCHAR(50), -- excellent, good, fair, poor, critical
  asset_condition_after VARCHAR(50),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Work order indexes
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_equipment ON work_orders(equipment_asset_id);
CREATE INDEX idx_work_orders_deadline ON work_orders(deadline);
CREATE INDEX idx_work_orders_technician ON work_orders(assigned_technician_id);
```

### Preventive Maintenance Schema
```sql
-- Preventive maintenance schedule
CREATE TABLE preventive_maintenance_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_asset_id UUID REFERENCES equipment_assets(id),

  -- Schedule details
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT,
  frequency_days INTEGER NOT NULL,
  frequency_hours DECIMAL(10,2),

  -- Scheduling
  last_performed_date DATE,
  next_scheduled_date DATE,
  advance_notice_days INTEGER DEFAULT 7,

  -- Execution parameters
  estimated_duration_hours DECIMAL(4,2),
  required_skills JSONB,
  required_parts TEXT,
  safety_requirements TEXT,
  special_instructions TEXT,

  -- Status and compliance
  status VARCHAR(20) DEFAULT 'active',
  is_compliant BOOLEAN DEFAULT true,

  -- Cost estimates
  labor_cost_estimate DECIMAL(8,2),
  material_cost_estimate DECIMAL(8,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Compliance tracking
CREATE TABLE maintenance_compliance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES equipment_assets(id),
  schedule_id UUID REFERENCES preventive_maintenance_schedule(id),
  due_date DATE NOT NULL,
  actual_date DATE,

  -- Compliance details
  compliance_status VARCHAR(20) DEFAULT 'pending',
  days_overdue INTEGER DEFAULT 0,
  reason_for_delay TEXT,

  -- Work order reference
  work_order_id UUID REFERENCES work_orders(id),

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Status

### ✅ **Completed Features**

#### Frontend Components
- ✅ Main maintenance management page with orange (#FFA500) theme
- ✅ Multi-tab interface (Assets, Work Orders, Preventative, Reports)
- ✅ Comprehensive asset registry with specifications
- ✅ Interactive work order management system
- ✅ Calendar-based maintenance scheduling

#### AI Integration
- ✅ **Maintenance Prediction Engine**: ML-powered failure prediction
- ✅ **Optimisation Advisor**: Cost-benefit analysis for maintenance strategies
- ✅ **Smart Scheduling**: Resource optimisation and technician assignment
- ✅ **Failure Analysis**: Root cause detection and preventive measures

#### Database Integration
- ✅ Equipment asset lifecycle management
- ✅ Work order tracking and cost management
- ✅ Preventive maintenance automation
- ✅ Compliance tracking and reporting

## Component Architecture

### React Component Structure
```javascript
📁 client/src/pages/01800-operations/components/
├── 🚀 01800-maintenance-management-page.js         # Main page
├── 📋 Assets/
│   ├── 01800-asset-registry.js                     # Asset listing
│   ├── 01800-asset-details.js                      # Asset information
│   └── 01800-asset-scheduling.js                   # Maintenance scheduling
├── 🔧 WorkOrders/
│   ├── 01800-work-order-list.js                    # Work order list
│   ├── 01800-work-order-create.js                  # Create new work order
│   └── 01800-work-order-progress.js                # Progress tracking
├── 🛠️ Preventative/
│   ├── 01800-preventive-calendar.js                # Maintenance calendar
│   ├── 01800-preventive-schedule.js                # Schedule management
│   └── 01800-compliance-monitoring.js             # Compliance tracking
├── 🤖 Agents/
│   ├── 01800-maintenance-agent.js                  # AI maintenance agent
│   └── 01800-predictive-maintenance.js             # Failure prediction
└── 🎨 CSS/
    └── 01800-maintenance-management.css           # Styling (orange theme)
```

### Core State Management

#### Asset State Management
```javascript
const [assetState, setAssetState] = useState({
  // Filter and search state
  searchTerm: '',
  categoryFilter: 'all',
  statusFilter: 'all',
  locationFilter: 'all',
  lastUpdated: null,

  // Asset data
  assets: [],
  selectedAsset: null,
  assetCount: 0,
  loadingStates: {
    assets: false,
    filters: false
  },

  // Modal states
  showAssetModal: false,
  showMaintenanceModal: false,
  showWorkOrderModal: false,
  editingMode: 'view'
});

useEffect(() => {
  loadAssets();
  loadDashboardStats();
}, []);

useEffect(() => {
  // Apply filters when search or filter criteria change
  applyFilters();
}, [assetState.searchTerm, assetState.categoryFilter, assetState.statusFilter, assetState.locationFilter]);

// Computed values for optimisation
const filteredAssets = useMemo(() => {
  return assetState.assets.filter(asset => {
    const searchMatch = asset.name.toLowerCase().includes(assetState.searchTerm.toLowerCase());
    const categoryMatch = assetState.categoryFilter === 'all' || asset.category === assetState.categoryFilter;
    const statusMatch = assetState.statusFilter === 'all' || asset.status === assetState.statusFilter;
    const locationMatch = assetState.locationFilter === 'all' || asset.location === assetState.locationFilter;

    return searchMatch && categoryMatch && statusMatch && locationMatch;
  });
}, [assetState.assets, assetState.searchTerm, assetState.categoryFilter, assetState.statusFilter, assetState.locationFilter]);
```

#### Work Order Management Logic
```javascript
const [workOrderState, setWorkOrderState] = useState({
  workOrders: [],
  filteredOrders: [],
  selectedOrders: [],
  statistics: {
    active: 0,
    overdue: 0,
    completed: 0,
    totalCost: 0
  }
});

// Bulk operations for work orders
const handleBulkStatusUpdate = async (newStatus) => {
  if (workOrderState.selectedOrders.length === 0) return;

  try {
    const updates = workOrderState.selectedOrders.map(orderId => ({
      id: orderId,
      status: newStatus,
      updated_at: new Date().toISOString()
    }));

    await Promise.all(updates.map(update =>
      maintenanceService.updateWorkOrder(update.id, update)
    ));

    loadWorkOrders();
    setWorkOrderState(prev => ({ ...prev, selectedOrders: [] }));
  } catch (error) {
    console.error('[MaintenanceManager] Bulk update failed:', error);
  }
};
```

### Maintenance Prediction Engine

#### Predictive Maintenance Algorithm
```javascript
class PredictiveMaintenanceEngine {
  async predictFailures(equipmentId) {
    const historicalData = await this.getHistoricalData(equipmentId);
    const operationalData = await this.getOperationalData(equipmentId);

    const riskAssessment = this.calculateRisk(historicalData, operationalData);
    const expectedFailure = this.predictFailureDate(historicalData);
    const recommendedActions = this.generateRecommendations(histinctData);

    return {
      riskLevel: riskAssessment.level,
      riskScore: riskAssessment.score,
      expectedFailureDate: expectedFailure.date,
      confidenceLevel: expectedFailure.confidence,
      recommendedActions: recommendedActions,
      urgencyClassification: this.calculateUrgency(riskAssessment)
    };
  }

  calculateRisk(historicalFailures, operationalMetrics) {
    // Multiple factor risk calculation
    const failureFrequency = historicalFailures.frequency;
    const operationalAge = operationalMetrics.age;
    const maintenanceCompliance = operationalMetrics.complianceScore;
    const usageIntensity = operationalMetrics.usagePatterns;

    // Weighted risk scoring algorithm
    const weightedScore = (
      failureFrequency * 0.3 +
      operationalAge * 0.25 +
      (1 - maintenanceCompliance) * 0.25 +
      usageIntensity * 0.2
    );

    return {
      level: this.classifyRiskLevel(weightedScore),
      score: weightedScore
    };
  }

  async optimizeScheduling(assetId) {
    const predictiveData = await this.predictFailures(assetId);
    const availableResources = await this.getAvailableResources();
    const maintenanceHistory = await this.getMaintenanceHistory(assetId);

    return this.generateOptimalSchedule({
      predictedFailure: predictiveData.expectedFailureDate,
      riskLevel: predictiveData.riskLevel,
      resources: availableResources,
      history: maintenanceHistory
    });
  }
}
```

#### Maintenance Cost Optimisation
```javascript
const MaintenanceCostOptimiser = {
  async analyseCosts(equipmentId) {
    const historicalCosts = await maintenanceService.getCostHistory(equipmentId);
    const predictiveCosts = await this.calculatePredictiveCosts(historicalCosts);
    const optimisationRecommendations = this.generateCostSavings(historicalCosts, predictiveCosts);

    return {
      currentCostTrend: this.calculateCostTrend(historicalCosts),
      predictedNextYearCost: predictiveCosts.total,
      savingsOpportunities: optimisationRecommendations,
      returnOnInvestment: this.calculateROI(optimisationRecommendations)
    };
  },

  generateCostSavings(historicalCosts, predictedCosts) {
    const recommendations = [];

    // Condition-based maintenance vs. time-based
    if (predictedCosts.conditionBased < predictedCosts.timeBased) {
      recommendations.push({
        type: 'condition_monitoring',
        description: 'Implement IoT condition monitoring',
        estSavings: predictedCosts.timeBased - predictedCosts.conditionBased,
        implementationCost: 5000,
        paybackPeriod: Math.ceil(5000 / ((predictedCosts.timeBased - predictedCosts.conditionBased) / 12))
      });
    }

    // Proactive maintenance scheduling
    recommendations.push(this.analyseProactiveScheduling(historicalCosts));

    return recommendations;
  }
};
```

### User Interface Design

#### Dashboard Layout
```jsx
<div className="maintenance-dashboard">
  {/* Key Metrics Row */}
  <div className="metrics-row">
    <MetricCard
      title="Active Assets"
      value={counts.activeAssets}
      trend={trends.assetGrowth}
      icon="tools"
      color="#FFA500"
    />
    <MetricCard
      title="Open Work Orders"
      value={counts.openWorkOrders}
      trend={trends.workOrderFlow}
      icon="clipboard-list"
      color="#FF6B35"
    />
    <MetricCard
      title="Maintenance Due"
      value={counts.dueMaintenance}
      trend={trends.maintenanceSchedule}
      icon="calendar-alt"
      color="#28A745"
    />
    <MetricCard
      title="Cost Efficiency"
      value={`${efficiencyScore}%`}
      trend={trends.costEfficiency}
      icon="piggy-bank"
      color="#6F42C1"
    />
  </div>

  {/* Charts Row */}
  <div className="charts-row">
    <ChartCard
      title="Asset Status Distribution"
      data={assetStatusData}
      type="pie"
      colors={themeColors}
    />
    <ChartCard
      title="Maintenance Cost Trends"
      data={costTrendData}
      type="line"
      span={8}
    />
  </div>

  {/* Quick Actions */}
  <div className="quick-actions">
    <ActionButton
      icon="plus"
      title="New Work Order"
      onClick={() => showModal('workOrder')}
      variant="primary"
        />
    <ActionButton
      icon="calendar-plus"
      title="Schedule Maintenance"
      onClick={() => showModal('maintenance')}
      variant="success"
        />
    <ActionButton
      icon="chart-bar"
      title="Generate Report"
      onClick={() => generateReport()}
      variant="info"
        />
  </div>
</div>
```

#### Work Order Detail Modal
```jsx
<Modal show={showWorkOrderModal} onHide={handleCloseModal} size="lg" className="modal-black-text">
  <Modal.Header closeButton>
    <Modal.Title className="d-flex align-items-center">
      <div className={`priority-indicator priority-${workOrder.priority}`} />
      {workOrder.title}
      <Badge bg={priorityColors[workOrder.priority]} className="ms-2">
        {workOrder.priority}
      </Badge>
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <Row>
      <Col md={8}>
        <div className="work-order-details">
          <h6>Description</h6>
          <p>{workOrder.description}</p>

          <h6>Equipment</h6>
          <div className="equipment-info">
            <strong>{workOrder.equipmentName}</strong>
            <br />
            <small>S/N: {workOrder.serialNumber}</small>
          </div>

          <h6>Service Requirements</h6>
          <div className="requirements-list">
            {workOrder.requirements.map((req, index) => (
              <div key={index} className="requirement-item">
                <i className="fas fa-tools me-2" />
                {req}
              </div>
            ))}
          </div>

          {workOrder.parts?.length > 0 && (
            <>
              <h6>Required Parts</h6>
              <div className="parts-list">
                {workOrder.parts.map((part, index) => (
                  <div key={index} className="part-item">
                    <span>{part.name}</span>
                    <Badge bg="secondary">{part.quantity} needed</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Col>

      <Col md={4}>
        <div className="work-order-sidebar">
          <Card>
            <Card.Header>Timeline</Card.Header>
            <Card.Body className="p-0">
              <Timeline items={workOrder.timeline || []} />
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>Resources</Card.Header>
            <Card.Body>
              <div className="assigned-technician">
                <i className="fas fa-user me-2" />
                {workOrder.technicianName || 'Not assigned'}
              </div>
              <div className="estimated-hours mt-2">
                <i className="fas fa-clock me-2" />
                {workOrder.estimatedHours} hours estimated
              </div>
            </Card.Body>
          </Card>
        </div>
      </Col>
    </Row>
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={handleCloseModal}>
      Close
    </Button>
    {canEdit && (
      <Button variant="primary" onClick={() => handleEdit(workOrder.id)}>
        Edit Work Order
      </Button>
    )}
  </Modal.Footer>
</Modal>
```

## Performance & Optimisation

### Database Optimisation
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_asset_status_location ON equipment_assets(status, location);
CREATE INDEX idx_work_order_status_deadline ON work_orders(status, deadline);
CREATE INDEX idx_maintenance_schedule_equipment ON preventive_maintenance_schedule(equipment_asset_id, next_scheduled_date);

-- Materialised view for dashboard metrics
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
  (SELECT COUNT(*) FROM equipment_assets WHERE active = true) as active_assets,
  (SELECT COUNT(*) FROM equipment_assets WHERE status = 'operational') as operational_assets,
  (SELECT COUNT(*) FROM work_orders WHERE status NOT IN ('completed', 'closed')) as open_work_orders,
  (SELECT SUM(total_cost) FROM work_orders WHERE completed_at >= CURRENT_MONTH) as monthly_cost,
  (SELECT COUNT(*) FROM preventive_maintenance_schedule WHERE next_scheduled_date <= CURRENT_DATE + INTERVAL '7 days') as due_maintenance
WITH NO DATA;

-- Refresh function
CREATE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_metrics;
END;
$$ LANGUAGE plpgsql;
```

### React Optimisation Patterns
```javascript
// Component memoisation
const AssetCard = memo(({ asset, onEdit, onDelete }) => {
  return (
    <Card className="asset-card">
      <Card.Body>
        <Card.Title>{asset.name}</Card.Title>
        <Card.Subtitle>{asset.assetCode}</Card.Subtitle>
        <AssetStatusBadge status={asset.status} />
        <AssetActions onEdit={onEdit} onDelete={onDelete} asset={asset} />
      </Card.Body>
    </Card>
  );
});

// Lazy loading for heavy components
const CalendarView = lazy(() => import('./CalendarView'));

const MaintenanceScheduler = () => {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowCalendar(true)}>Show Calendar</Button>
      {showCalendar && (
        <Suspense fallback={<Spinner animation="border" />}>
          <CalendarView />
        </Suspense>
      )}
    </div>
  );
};

// Virtual scrolling for large asset lists
const AssetList = ({ assets }) => {
  const { models, actions, trace } = useGL({ config });

  return (
    <div style={{ height: '400px', overflow: 'auto' }}>
      {virtualizedAssets.map(virtualAsset => (
        <div
          key={virtualAsset.index}
          style={{
            height: virtualAsset.size,
            transform: `translateY(${virtualAsset.start}px)`
          }}
        >
          <AssetCard
            asset={assets[virtualAsset.index]}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  );
};
```

## AI Integration & Analytics

### Maintenance Prediction Engine
The system integrates advanced AI algorithms for predictive maintenance:

#### Failure Prediction Algorithm
```javascript
class MaintenancePredictionEngine {
  constructor() {
    this.machineLearningModel = new PredictiveModel({
      algorithm: 'random_forest',
      features: [
        'operating_hours',
        'vibration_levels',
        'temperature_readings',
        'oil_pressure',
        'maintenance_history',
        'usage_intensity',
        'environmental_factors'
      ]
    });
  }

  async predictAssetFailure(assetId) {
    const dataset = await this.buildTrainingData(assetId);
    const prediction = await this.machineLearningModel.predict(dataset);

    return {
      probability: prediction.probability,
      predictedFailureDate: prediction.estimatedDate,
      confidence: prediction.confidence,
      recommendedAction: this.generateRecommendation(prediction),
      preventionCost: this.calculatePreventionCost(prediction)
    };
  }

  async optimiseMaintenanceSchedule(assetId) {
    const currentSchedule = await this.getCurrentSchedule(assetId);
    const predictions = await this.predictAssetFailure(assetId);
    const resources = await this.getAvailableResources();

    const optimalSchedule = this.optimizeSchedule({
      currentSchedule,
      predictions,
      resources,
      constraints: {
        budgetLimit: 50000,
        resourceAvailability: 80,
        riskTolerance: 'medium'
      }
    });

    return optimalSchedule;
  }
}
```

#### Natural Language Processing for Maintenance Requests
```javascript
class MaintenanceNLPProcessor {
  async processMaintenanceRequest(text) {
    // Tokenisation and analysis
    const tokens = await this.tokenize(text);
    const entities = await this.extractEntities(tokens);

    // Intent classification
    const intent = await this.classifyIntent(tokens);

    // Generate structured work order
    const workOrder = {
      title: this.generateTitle(entities, intent),
      description: this.enhanceDescription(text, entities),
      priority: this.determinePriority(entities, intent),
      suggestedParts: this.suggestParts(entities),
      estimatedHours: this.estimateTime(entities, intent),
      recommendedAction: this.recommendAction(entities, intent)
    };

    return workOrder;
  }

  // Example: "The excavator engine is making strange noises when idling"
  // Output: {
  //   title: "Engine Noise - CAT 320 Excavator",
  //   priority: "high",
  //   suggestedParts: ["air filter", "spark plugs"],
  //   estimatedHours: 2.5
  // }
}
```

## API Integration

### Maintenance Service Endpoints
```javascript
// Equipment management endpoints
export const equipmentService = {
  getEquipments: (filters) =>
    api.get('/api/maintenance/equipment', { params: filters }),
  createEquipment: (data) =>
    api.post('/api/maintenance/equipment', data),
  updateEquipment: (id, data) =>
    api.put(`/api/maintenance/equipment/${id}`, data),
  decommissionEquipment: (id) =>
    api.patch(`/api/maintenance/equipment/${id}/decommission`),

  // Work order management
  getWorkOrders: (filters) =>
    api.get('/api/maintenance/work-orders', { params: filters }),
  createWorkOrder: (data) =>
    api.post('/api/maintenance/work-orders', data),
  updateWorkOrder: (id, data) =>
    api.put(`/api/maintenance/work-orders/${id}`, data),
  assignWorkOrder: (id, technicianId) =>
    api.patch(`/api/maintenance/work-orders/${id}/assign`, { technicianId }),

  // Predictive maintenance
  getPredictions: (assetId) =>
    api.get(`/api/maintenance/prediction/${assetId}`),
  generateSchedule: (assetId, constraints) =>
    api.post(`/api/maintenance/schedule/generate`, { assetId, constraints }),
  analyseCosts: (timeframe) =>
    api.get('/api/maintenance/costs/analysis', { params: timeframe }),

  // Reporting and analytics
  getDashboardStats: () =>
    api.get('/api/maintenance/dashboard/stats'),
  generateReport: (type, filters) =>
    api.post('/api/maintenance/reports/generate', { type, filters }),
  exportData: (filters) =>
    api.post('/api/maintenance/export', filters),
};

// Advanced analytics endpoints
const analyticsService = {
  predictiveAnalysis: (assetId) =>
    api.post('/api/analytics/predictive-maintenance', { assetId }),
  costOptimization: (portfolio) =>
    api.post('/api/analytics/cost-optimization', { portfolio }),
  reliabilityAnalysis: (assetType) =>
    api.post('/api/analytics/reliability', { assetType })
};
```

## Integration with Existing Systems

### SCADA/DCS Systems Integration
```javascript
class SCADAIntegrator {
  constructor(connectionString) {
    this.client = new OPCClient(connectionString);
    this.dataPoints = {
      vibration: 'VIBRATION.READING',
      temperature: 'TEMPERATURE.READING',
      pressure: 'PRESSURE.READING',
      powerConsumption: 'POWER.CONSUMPTION'
    };
  }

  async startRealTimeMonitoring(assetId) {
    // Connect to SCADA system
    await this.client.connect();

    // Subscribe to real-time data streams
    for (const [sensorType, tagPath] of Object.entries(this.dataPoints)) {
      await this.client.subscribe(tagPath, (value) => {
        this.handleSensorReading(assetId, sensorType, value);
      });
    }

    console.log(`[SCADA] Monitoring started for asset ${assetId}`);
  }

  async handleSensorReading(assetId, sensorType, value) {
    // Store reading in database
    await sensorDataService.recordReading({
      assetId,
      sensorType,
      value,
      timestamp: new Date()
    });

    // Check against thresholds
    const threshold = await this.getSensorThreshold(assetId, sensorType);

    if (this.isThresholdExceeded(value, threshold)) {
      await this.createAlert(assetId, sensorType, value, threshold);
      await maintenanceAgent.analysisiseAnomaly(assetId, sensorType, value);
    }
  }
}
```

### IoT Sensor Integration
```javascript
const iotSensorManager = {
  async setupIoTSensors(assetId) {
    // Retrieve IoT sensor configuration for asset
    const sensorConfig = await assetService.getSensorConfiguration(assetId);

    // Configure each sensor type
    for (const sensor of sensorConfig.sensors) {
      switch (sensor.type) {
        case 'vibration':
          await this.setupVibrationSensor(sensor.id, sensor.thresholds);
          break;
        case 'temperature':
          await this.setupTemperatureSensor(sensor.id, sensor.thresholds);
          break;
        case 'pressure':
          await this.setupPressureSensor(sensor.id, sensor.thresholds);
          break;
        case 'flow':
          await this.setupFlowSensor(sensor.id, sensor.thresholds);
          break;
      }
    }

    // Establish data pipeline
    await this.createIoTDataPipeline(assetId, sensorConfig);
  },

  async setupVibrationSensor(sensorId, thresholds) {
    const client = new IoTClient(sensorId);

    await client.registerCallback('vibration', async (reading) => {
      // Normalise reading
      const rmsValue = this.calculateRMS(reading.data);

      // Compare against thresholds
      if (rmsValue > thresholds.critical) {
        await alertService.createCriticalAlert({
          assetId: sensorId.split('.')[0],
          type: 'vibration',
          severity: 'critical',
          value: rmsValue,
          threshold: thresholds.critical
        });
      } else if (rmsValue > thresholds.warning) {
        await alertService.createWarningAlert({
          assetId: sensorId.split('.')[0],
          type: 'vibration',
          severity: 'warning',
          value: rmsValue,
          threshold: thresholds.warning
        });
      }

      // Store reading for analysis
      await vibrationDataService.storeReading({
        sensorId,
        reading: rmsValue,
        timestamp: new Date(),
        assetId: sensorId.split('.')[0]
      });
    });
  }
};
```

## Production Deployment

### Pre-Deployment Checklist
- [ ] Equipment asset data migrated and validated
- [ ] Historical maintenance records imported
- [ ] Technicians and user roles configured
- [ ] IoT sensor integrations tested
- [ ] AI models trained and validated
- [ ] Mobile app compatibility verified

### Post-Deployment Validation
- [ ] Dashboard metrics display correctly
- [ ] Real-time asset monitoring functional
- [ ] Work order creation and assignment working
- [ ] Predictive maintenance alerts triggered
- [ ] Automated reporting tasks scheduled
- [ ] Integration with existing systems verified

### System Monitoring
- [ ] Response times for API endpoints <500ms
- [ ] Real-time data processing latency <2 seconds
- [ ] AI prediction accuracy >85%
- [ ] System uptime >99.9%
- [ ] Data backup and recovery procedures tested

## Version History
- v1.3 (2025-09-01): Added comprehensive AI integration and IoT documentation
- v1.2 (2025-09-01): Enhanced database schema and indexing specifications
- v1.1 (2025-09-01): Added performance optimisation patterns
- v1.0 (2025-09-01): Initial release with full maintenance management documentation

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed
