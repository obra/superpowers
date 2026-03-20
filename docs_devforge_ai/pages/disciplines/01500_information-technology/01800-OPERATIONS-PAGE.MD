# 1300_01800_OPERATIONS_PAGE.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.3 (2025-09-01): Added state management details and routing information
- v1.2 (2025-09-01): Enhanced component structure documentation
- v1.1 (2025-09-01): Added setup instructions and dependencies
- v1.0 (2025-09-01): Initial release with operations overview documentation

## Overview

The Operations Page (`01800-operations-page.js`) serves as the primary dashboard and navigation hub for the Operations domain within the ConstructAI application. It follows the established pattern from the existing `0102-administration` page structure while providing specialized operations-themed functionality.

## URL
`http://localhost:3000/01800-operations`

## Purpose

The Operations Page acts as:
1. **Navigation Hub**: Primary entry point for operations-related activities
2. **State Manager**: Controls application state across operations modules
3. **Theme Controller**: Manages operations-specific theming and UI configuration
4. **Profile Manager**: Handles user authentication and session management

## Page Structure

### State Architecture
```javascript
const [
  currentState,      // Active state: 'agents', 'upserts', or 'workspace'
  isButtonContainerVisible, // UI visibility control
  isSettingsInitialized     // Settings initialization status
] = useState(null);
```

### Navigation States
- **Agents State**: Access to AI-powered operational assistants
- **Upserts State**: Data management and import/export operations
- **Workspace State**: Main operational workspace and tools

## Component Properties

### Core Configuration
```javascript
const PAGE_CONFIG = {
  id: '01800-operations',
  name: 'Operations Page',
  theme: 'operations',
  templateType: 'bespoke', // Not using standard templates
  backgroundImage: 'operations-background.png',
  navigation: 'state-buttons'
};
```

### Settings Integration
```javascript
// Mandatory settings manager integration for all operations pages
useEffect(() => {
  const initSettings = async () => {
    if (!settingsManager) {
      setIsSettingsInitialized(true);
      return;
    }

    await settingsManager.initialize();
    setIsSettingsInitialized(true);
  };
  initSettings();
}, []);
```

## Navigation System

### State Button Navigation
The page uses a button-based navigation system with three primary states:

#### Agents Button
```javascript
// Access to AI-powered operational assistants
currentState === 'agents' ? (
  <>
    {/* AI-powered operational assistants */}
    <button onClick={() => handleModalClick('agentAction1')}>
      Agent Action 1
    </button>
    <button onClick={() => handleModalClick('agentAction2')}>
      Agent Action 2
    </button>
  </>
)
```

#### Upserts Button
```javascript
// Data management and Excel integration
currentState === 'upserts' ? (
  <>
    {/* Import/export operations */}
    <button onClick={() => handleModalClick('upsertAction1')}>
      Upsert Action 1
    </button>
    <button onClick={() => handleModalClick('upsertAction2')}>
      Upsert Action 2
    </button>
  </>
)
```

#### Workspace Button
```javascript
// Main operational workspace
currentState === 'workspace' ? (
  <>
    {/* Workspace operations */}
    <button onClick={() => handleModalClick('workspaceAction1')}>
      Workspace Action 1
    </button>
  </>
)
```

## UI/UX Design

### Background Integration
```css
/* Operations-themed background with theme image */
.operations-page {
  background-image: url(${backgroundImagePath});
  background-position: center bottom;
  min-height: 100vh;
}
```

### Navigation Styling
```css
/* State button styling */
.state-button {
  background: linear-gradient(135deg, #0880ff, #0486b2);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.state-button.active {
  background: linear-gradient(135deg, #055ab2, #03668a);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
```

### Animations
```javascript
// Button container visibility animation
useEffect(() => {
  setIsButtonContainerVisible(false);
  const timer = setTimeout(() => {
    setIsButtonContainerVisible(true);
  }, 100);
  return () => clearTimeout(timer);
}, [currentState]);
```

## Related Pages

### Linked Operations Pages
1. **`01801-stock-management`** - Stock Management System
2. **`01802-maintenance-management`** - Maintenance Management System
3. **`01870-fuel-lubricants-management`** - Fuel & Lubricants Management

### Routing Integration
```javascript
// React Router configuration (App.js)
<Route path="/operations" element={<OperationsPageComponent />} />
<Route path="/operations/stock-management" element={<StockManagementPage />} />
<Route path="/operations/maintenance-management" element={<MaintenanceManagementPage />} />
<Route path="/operations/fuel-lubricants" element={<FuelLubricantsManagementPage />} />
```

## Dependencies

### Core Dependencies
```json
{
  "react": "^18.0.0",
  "@modules/accordion": "^2.0.0",
  "@common/js/ui": "^1.0.0"
}
```

### Settings Dependencies
```javascript
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
```

## Accordion Integration

### Mandatory Accordion Setup
```javascript
// Required for all pages in the system
{isSettingsInitialized ? (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
) : (
  <p>Loading Accordion...</p>
)}
```

### Page Registration
```javascript
// Page name must be registered for accordion system
window.pageName = "01800-operations";
// Cleanup on component unmount
return () => {
  window.pageName = null;
};
```

## Authentication Integration

### Logout Button (Mandatory)
```javascript
<button
  id="logout-button"
  onClick={handleLogout}
  className="logout-button-floating"
>
  <svg className="logout-icon">
    {/* Logout SVG icon */}
  </svg>
</button>
```

### Logout Handler
```javascript
const handleLogout = () => {
  if (window.handleLogout) {
    window.handleLogout();
  } else {
    console.error("Global handleLogout function not found.");
  }
};
```

## Error Handling

### Settings Initialization Errors
```javascript
const initSettings = async () => {
  try {
    await settingsManager.initialize();
    setIsSettingsInitialized(true);
  } catch (error) {
    console.error("[OperationsPage] Settings initialization failed:", error);
    // Graceful fallback - page still functions without settings
    setIsSettingsInitialized(true);
  }
};
```

### Modal and Navigation Errors
```javascript
const handleModalClick = (modalTarget) => {
  console.log(`[OperationsPage] Opening modal: ${modalTarget}`);
  // Add modal opening logic when modules are implemented
};
```

## Configuration Requirements

### Theme Image Setup
- **File**: `public/assets/01800.png`
- **Usage**: Background image for operations dashboard
- **Fallback**: Default if image not found

### State Management Setup
```javascript
// Ensure proper cleanup of global state
const cleanup = () => {
  window.pageName = null;
  // Additional cleanup if needed
};

return cleanup;
```

## Testing Guidelines

### Unit Tests
```javascript
import OperationsPage from './01800-operations-page.js';

describe('Operations Page Tests', () => {
  test('should initialize settings on mount', async () => {
    render(<OperationsPage />);
    expect(await screen.findByText('Loading Accordion...')).toBeInTheDocument();
  });

  test('should handle state changes correctly', () => {
    render(<OperationsPage />);
    fireEvent.click(screen.getByText('Agents'));
    expect(screen.getByText('Agent Action 1')).toBeInTheDocument();
  });
});
```

### Integration Tests
- Accordion system integration
- Settings manager functionality
- Navigation state persistence
- Error handling scenarios

## Performance Considerations

### Lazy Loading
```javascript
// Lazy load related operations pages
const StockManagementPage = lazy(() => import('./01801-stock-management-page'));
const MaintenanceManagementPage = lazy(() => import('./01802-maintenance-management-page'));
const FuelLubricantsManagementPage = lazy(() => import('./01870-fuel-lubricants-management-page'));

<Suspense fallback={<Spinner />}>
  <Routes>
    <Route path="/stock-management" element={<StockManagementPage />} />
    <Route path="/maintenance-management" element={<MaintenanceManagementPage />} />
    <Route path="/fuel-lubricants" element={<FuelLubricantsManagementPage />} />
  </Routes>
</Suspense>
```

### Memory Management
- Clean up event listeners on unmount
- Dispose of settings manager resources
- Clear global state variables

## Implementation Details

### 1300_01801 Stock Management Implementation

# 1300_01801_STOCK_MANAGEMENT_PAGE.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.3 (2025-09-01): Added chatbot and agent integration details
- v1.2 (2025-09-01): Enhanced component structure documentation
- v1.1 (2025-09-01): Added database and API integration
- v1.0 (2025-09-01): Initial release with full feature documentation

## Overview

The Stock Management Page is a comprehensive inventory management system designed specifically for construction operations and materials. It provides real-time tracking, reporting, and analytics for all stockpiles, materials, and construction supplies.

## URL
`http://localhost:3000/01801-stock-management`

## Key Features

### 📊 **Dashboard Cards**
- **Total Inventory Value**: Real-time calculation of all stock value
- **Total Item Count**: Active inventory count with category breakdown
- **Low Stock Alerts**: Items below minimum threshold (configurable)
- **Critical Stock Alerts**: Items below critical threshold requiring immediate action
- **Value Trends**: Daily/weekly stock value fluctuations
- **Category Distribution**: Pie chart showing stock by category

### 🔍 **Advanced Inventory Management**
- **Real-time Stock Tracking**: Current quantity, minimums, and maximums
- **Location Management**: Warehouse, yard, and site storage locations
- **Supplier Integration**: Vendor information and performance tracking
- **Category Organization**: Lubricants, materials, equipment, tools, safety gear
- **Stock Alerts**: Automated notifications for low/critical stock levels

### 📋 **Interactive Data Table**
- **Multi-select Operations**: Bulk delete, status updates, and exports
- **Search & Filtering**: Real-time text search by name, category, supplier
- **Sort & Pagination**: Custom sorting by any column with pagination
- **Stock Level Indicators**: Color-coded stock status (optimal/low/critical)
- **Quick Actions**: Inline edit, delete, and approve buttons

### 🤖 **AI-Powered Stock Agent**
- **Stock Level Predictions**: Automatic reorder point calculations
- **Supplier Performance Analysis**: Vendor reliability and delivery tracking
- **Inventory Optimization**: Demand forecasting and stock recommendations
- **Cost Analysis**: ROI calculations and efficiency recommendations

### 📈 **Reporting & Analytics**
- **Stock Level Reports**: Current inventory status by categories
- **Financial Reports**: Inventory value, cost analysis, and trends
- **Movement History**: Stock movements, additions, and consumption logs
- **Supplier Reports**: Vendor performance and cost comparisons
- **Visual Charts**: Trend lines and category distribution graphics

## Database Schema

### Standard Stock Table Structure
```sql
CREATE TABLE IF NOT EXISTS operations_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  product_code VARCHAR(100),
  description TEXT,

  -- Inventory management
  current_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_level DECIMAL(10,2) DEFAULT 0,
  maximum_level DECIMAL(10,2) DEFAULT 10000,
  unit_of_measure VARCHAR(50) DEFAULT 'each',
  unit_cost DECIMAL(10,2) DEFAULT 0,

  -- Location and supplier
  location VARCHAR(255),
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(255),
  supplier_id UUID,

  -- Status and tracking
  stock_status VARCHAR(50) DEFAULT 'optimal', -- optimal, low, critical, out_of_stock
  last_restocked_date DATE,
  last_counted_date DATE,
  reorder_point DECIMAL(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  -- Flags
  active BOOLEAN DEFAULT true,
  requires_inspection BOOLEAN DEFAULT false,
  is_perishable BOOLEAN DEFAULT false,

  -- Foreign key relationships
  category_id UUID REFERENCES stock_categories(id),
  location_id UUID REFERENCES stock_locations(id)
);
```

### Reporting Views
```sql
-- Active inventory summary view
CREATE OR REPLACE VIEW v_stock_active_inventory AS
SELECT
  s.id,
  s.name,
  s.category,
  s.current_quantity,
  s.minimum_level,
  s.maximum_level,
  s.unit_cost,
  s.supplier_name,
  s.location,
  s.stock_status,
  (s.current_quantity * s.unit_cost) as total_value,
  ROUND(s.current_quantity * 100.0 / s.maximum_level, 2) as utilization_percent,
  s.last_restocked_date
FROM operations_stock s
WHERE s.active = true
ORDER BY s.category, s.name;

-- Low stock alerts view
CREATE OR REPLACE VIEW v_stock_low_alerts AS
SELECT
  s.id,
  s.name,
  s.category,
  s.current_quantity,
  s.minimum_level,
  s.reorder_point,
  s.supplier_name,
  s.location,
  (s.minimum_level - s.current_quantity) as deficit,
  CASE
    WHEN s.current_quantity <= 0 THEN 'OUT_OF_STOCK'
    WHEN s.current_quantity <= s.minimum_level * 0.5 THEN 'CRITICAL'
    WHEN s.current_quantity <= s.minimum_level THEN 'LOW'
    ELSE 'WARNING'
  END as urgency_level,
  s.last_restocked_date
FROM operations_stock s
WHERE s.active = true
  AND s.current_quantity <= s.minimum_level
ORDER BY deficit DESC;

-- Financial summary view
CREATE OR REPLACE VIEW v_stock_financial_summary AS
SELECT
  category,
  COUNT(*) as item_count,
  SUM(current_quantity * unit_cost) as category_value,
  SUM(current_quantity) as total_units,
  AVG(unit_cost) as avg_unit_cost,
  MIN(unit_cost) as min_unit_cost,
  MAX(unit_cost) as max_unit_cost
FROM operations_stock
WHERE active = true
GROUP BY category
ORDER BY category_value DESC;
```

## Implementation Status

### ✅ **Completed Features**
1. **Frontend Components**
   - ✅ Main stock management page with orange theme (#FFA500)
   - ✅ Interactive dashboard cards with real-time statistics
   - ✅ Advanced search and filtering capabilities
   - ✅ Sortable, paginated data table with bulk operations
   - ✅ CRUD modals with black text accessibility
   - ✅ Tabbed interface (Inventory, Reports, Analytics)
   - ✅ Accordion integration and routing

2. **Agent Integration**
   - ✅ StockManagementAgent for AI-powered insights
   - ✅ Automated stock level predictions
   - ✅ Supplier performance analysis
   - ✅ Report generation and optimization

3. **Chatbot Integration**
   - ✅ Stock-specific knowledge base
   - ✅ Critical stock level alerts
   - ✅ Inventory optimization recommendations
   - ✅ Cost analysis and forecasting

## Sample Stock Data

| Item | Category | Quantity | Unit Cost | Value | Status |
|------|----------|----------|-----------|--------|--------|
| **Engine Oil 10W-40** | Lubricants | 150 | $25.00 | $3,750 | Optimal |
| **Steel Rebar 12mm** | Materials | 500 | $8.50 | $4,250 | Optimal |
| **Safety Helmets** | Safety | 75 | $25.00 | $1,875 | Warning |
| **Excavator Tyres** | Tyres | 18 | $500.00 | $9,000 | Critical |

## Component Architecture

### React Component Structure
```javascript
📁 client/src/pages/01800-operations/components/
├── 🚀 01800-stock-management-page.js         # Main page component
├── 📊 Dashboard/
│   ├── 01800-stock-dashboard-cards.js       # Statistics cards
│   └── 01800-stock-analytics.js            # Analytics charts
├── 📋 Table/
│   ├── 01800-stock-table.js               # Main data table
│   ├── 01800-stock-row-actions.js         # Row action buttons
│   └── 01800-stock-bulk-actions.js        # Bulk operations
├── 🔧 Modals/
│   ├── 01800-stock-management-modal.js    # Add/edit modal
│   ├── 01800-stock-import-modal.js        # Import wizard
│   └── 01800-stock-bulk-edit-modal.js     # Bulk edit modal
├── 🤖 Agents/
│   ├── 01800-stock-management-agent.js    # AI stock agent
│   └── 01800-stock-optimizer.js           # Optimization logic
├── 📨 Chatbot/
│   ├── 01800-stock-chatbot.js            # Stock chatbot
│   └── 01800-stock-chatbot-config.js     # Chatbot prompts
└── 🎨 CSS/
    └── 01800-stock-management.css         # Styling (orange theme)
```

### Core Functionalities

#### 1. **Stock Status System**
```javascript
const StockStatus = {
  OPTIMAL: { color: '#28a745', label: 'Optimal' },
  WARNING: { color: '#ffc107', label: 'Warning' },
  CRITICAL: { color: '#dc3545', label: 'Critical' },
  OUT_OF_STOCK: { color: '#db3340', label: 'Out of Stock' }
};

const getStockStatus = (current, min, max) => {
  const utilization = current / max;
  if (current <= 0) return StockStatus.OUT_OF_STOCK;
  if (current <= min) return StockStatus.CRITICAL;
  if (utilization >= 0.8) return StockStatus.WARNING;
  return StockStatus.OPTIMAL;
};
```

#### 2. **Search & Filtering Logic**
```javascript
const filteredStock = useMemo(() => {
  return stockData.filter(item => {
    // Text search across multiple fields
    const searchMatch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filters
    const categoryMatch = selectedCategories.length === 0 ||
      selectedCategories.includes(item.category);

    // Status filters
    const statusMatch = selectedStatuses.length === 0 ||
      selectedStatuses.includes(item.stock_status);

    // Location filters
    const locationMatch = selectedLocations.length === 0 ||
      selectedLocations.includes(item.location);

    // Stock level filters
    const stockMatch = minStock === null || maxStock === null ||
      (item.current_quantity >= minStock && item.current_quantity <= maxStock);

    return searchMatch && categoryMatch && statusMatch &&
           locationMatch && stockMatch;
  });
}, [stockData, searchTerm, selectedCategories, selectedStatuses,
    selectedLocations, minStock, maxStock]);
```

#### 3. **Bulk Operations Handler**
```javascript
const handleBulkOperations = useCallback(async (operation, selectedIds) => {
  try {
    setLoading(true);

    switch (operation) {
      case 'delete':
        await Promise.all(selectedIds.map(id =>
          stockService.deleteStock(id)
        ));
        break;

      case 'status_update':
        await stockService.bulkUpdateStatus(selectedIds, newStatus);
        break;

      case 'reorder':
        await stockService.generateReorderReport(selectedIds);
        break;

      case 'export':
        await stockService.exportToCSV(selectedIds);
        break;
    }

    // Refresh data
    loadStockData();

    // Clear selection
    setSelectedItems([]);

    showSuccessToast(`${operation} completed for ${selectedIds.length} items`);

  } catch (error) {
    showErrorToast(`Failed to ${operation}: ${error.message}`);
  } finally {
    setLoading(false);
  }
}, [selectedItems]);
```

## UI Design & Styling

### Color Scheme
- **Primary Actions**: `#FFA500` (Orange) with white hover effect
- **Success/State**: Green for optimal, yellow for warning, red for critical
- **Text/Borders**: Black for accessibility compliance
- **Background**: Pure white for maximum contrast
- **Progress Bars**: Gradient from orange to red for stock levels

### Responsive Design
```css
/* Mobile responsive design */
@media (max-width: 768px) {
  .stock-card {
    margin-bottom: 15px;
  }

  .stock-table {
    font-size: 0.875rem;
  }

  .bulk-actions {
    flex-direction: column;
  }
}

/* Tablet optimization */
@media (min-width: 769px) and (max-width: 1024px) {
  .stock-dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## API Integration

### Stock Service API
```javascript
// Service endpoints for stock operations
export const stockService = {
  // CRUD Operations
  getStock: (filters) =>
    api.get('/api/stock', { params: filters }),
  createStock: (data) =>
    api.post('/api/stock', data),
  updateStock: (id, data) =>
    api.put(`/api/stock/${id}`, data),
  deleteStock: (id) =>
    api.delete(`/api/stock/${id}`),

  // Bulk Operations
  bulkDelete: (ids) =>
    api.delete('/api/stock/bulk', { data: { ids } }),
  bulkUpdate: (ids, updates) =>
    api.patch('/api/stock/bulk', { ids, updates }),

  // Reports
  stockReport: (type, filters) =>
    api.post('/api/reports/stock', { type, filters }),
  stockValueReport: (period) =>
    api.get('/api/reports/stock-value', { params: { period } }),

  // AI Features
  stockPrediction: (data) =>
    ai.post('/api/stock/predict', data),
  optimization: (constraints) =>
    ai.post('/api/stock/optimize', constraints)
};
```

## AI Agent Integration

### Stock Management Agent
The StockManagementAgent provides AI-powered insights:

#### Smart Stock Predictions
```javascript
class StockManagementAgent extends BaseAgent {
  async predictStockNeeds(itemId) {
    const historicalData = await this.getHistoricalStockData(itemId);
    const trends = this.analyzeTrends(historicalData);
    const seasonality = this.detectSeasons(historicalData);

    return {
      predictedConsumption: this.calculateConsumption(seasonality),
      recommendedReorderPoint: this.optimizeReorderPoint(trends),
      optimalStockLevel: this.calculateOptimalStock(trends),
      costSavings: this.estimateSavings(seasonality)
    };
  }

  async optimizeSupplierSelection(itemId) {
    const suppliers = await this.getSupplierData(itemId);
    const performance = this.analyzeSupplierPerformance(suppliers);
    const reliability = this.calculateReliability(suppliers);

    return {
      recommendedSupplier: performance.bestSupplier,
      costBenefitAnalysis: this.costBenefit(suppliers),
      riskAssessment: this.riskAssessment(suppliers),
      alternativeOptions: suppliers.filter(s => s.risk < 50)
    };
  }
}
```

#### Stock Analysis Prompt Templates
```javascript
const STOCK_ANALYSIS_PROMPTS = {
  stockOptimization: `
    Analyze {itemName} stock levels based on:
    - Current quantity: {currentQty}
    - Historical usage: {historicalUsage}
    - Supplier lead times: {leadTime}
    - Seasonal patterns: {seasonalFactors}
    Provide optimization recommendations for stock management.
  `,

  supplierAnalysis: `
    Evaluate supplier performance for {supplierName}:
    - Delivery reliability: {reliabilityPercentage}%
    - Average lead time: {avgLeadTime} days
    - Cost history: {costTrends}
    - Quality ratings: {qualityScore}/10
    Recommend improvements and alternatives.
  `,

  costOptimization: `
    Analyze cost optimization opportunities for {itemCategory}:
    - Current suppliers and pricing
    - Market pricing trends
    - Usage patterns
    - Alternative sourcing options
    Provide detailed cost reduction recommendations.
  `
};
```

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. **Stock Data Not Loading**
**Symptom**: Page loads but stock table is empty
```
Error: Stock data failed to load
```
**Solutions:**
- Check network connectivity to API
- Verify database connection in environment
- Review API logs for authentication issues
- Ensure stock table exists and has data

#### 2. **Bulk Operations Failing**
**Symptom**: Bulk delete/update buttons not working
```
Error: Bulk operation failed
```
**Solutions:**
- Verify user permissions for bulk operations
- Check selected items array integrity
- Review API payload formatting
- Ensure consistent transaction handling

#### 3. **Search Not Working Properly**
**Symptom**: Search filter returns incorrect results
```
Issue: Search results don't match query
```
**Solutions:**
- Verify search term sanitization
- Check filter application logic
- Review ElasticSearch or database query
- Ensure index optimization for text search

#### 4. **Chatbot Not Responding**
**Symptom**: Stock chatbot shows "connecting..." indefinitely
```
Issue: Chatbot service unavailable
```
**Solutions:**
- Verify chatbot service endpoint
- Check authentication for AI agent
- Review network connectivity
- Confirm chatbot configuration

#### 5. **Report Generation Failing**
**Symptom**: Generate report button throws error
```
Error: Report generation failed
```
**Solutions:**
- Verify user's export permissions
- Check database query optimization
- Ensure sufficient memory for large datasets
- Review PDF/XLSX library dependencies

## Performance Optimization

### Database Performance
- **Composite Indexes**: Created on category, status, location combinations
- **Partitioning**: Implemented for large historical stock data
- **Query Optimization**: Added covering indexes for common queries
- **Materialized Views**: Pre-calculated complex aggregations

### Frontend Performance
```javascript
// Memoization for complex calculations
const computedValues = useMemo(() => {
  return {
    totalValue: calculateTotalValue(stockData),
    lowStockCount: countLowStock(stockData),
    valueByCategory: groupByCategory(stockData),
    trendsData: calculateTrends(stockData)
  };
}, [stockData]);

// Debounced search to prevent excessive re-renders
const debouncedSearch = useDebounce(searchValue, 300);

// Virtual scrolling for large datasets
const virtualizedItems = useVirtual({
  size: filteredData.length,
  parentRef,
  estimateSize: useCallback(() => 60, [])
});
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] Database migration scripts tested
- [ ] Stock data backup created
- [ ] API endpoints documented
- [ ] Authentication tokens configured
- [ ] AI agent prompts validated
- [ ] Performance benchmarks established

### Post-Deployment
- [ ] Stock data integrity verified
- [ ] Search functionality tested
- [ ] Bulk operations validated
- [ ] Report generation confirmed
- [ ] Chatbot responses tested
- [ ] Mobile responsiveness verified

## Integration Points

### External Systems
- **SCM Systems**: Integration with supply chain management
- **ERP Systems**: Purchase order synchronization
- **IoT Sensors**: Real-time inventory monitoring
- **Barcode Systems**: Automated stock updates
- **POS Systems**: Seamless stock tracking

### Data Synchronization
- **Real-time Sync**: Live updates with warehouse systems
- **Batch Processing**: Scheduled data bulk updates
- **Conflict Resolution**: Automated duplicate handling
- **Audit Trails**: Complete change tracking

## Future Enhancements

### Planned Features
1. **IoT Integration**: Real-time sensor monitoring for stock levels
2. **Barcode Scanning**: Mobile app integration for physical inventory
3. **Predictive Ordering**: AI-driven automatic reorder recommendations
4. **Blockchain Tracking**: Immutable inventory movement records
5. **AR Visualization**: Augmented reality for warehouse navigation

### Analytics Improvements
1. **Advanced Forecasting**: Machine learning consumption patterns
2. **Demand Planning**: Seasonal and trend-based predictions
3. **Cost Analysis**: Detail profitability analysis by item/cateogry
4. **Supplier Intelligence**: AI-powered supplier analysis dashboard

## Version History
- v1.3 (2025-09-01): Added AI agent and chatbot integration documentation
- v1.2 (2025-09-01): Enhanced database architecture and API documentation
- v1.1 (2025-09-01): Added component structure and UI design details
- v1.0 (2025-09-01): Initial release with comprehensive stock management documentation

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

### 1300_01802 Maintenance Management Implementation

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

  //

## Future Enhancements

### Planned Features
1. **Advanced Theming**: Custom operations-specific themes
2. **Dashboard Widgets**: Configurable dashboard components
3. **Real-time Notifications**: Live operational status updates
4. **Integration Hub**: API connection management interface

### Architecture Improvements
- Component-based modular design
- Advanced state management patterns
- Enhanced error boundary implementation
- Automated testing coverage expansion

## Version History
- v1.3 (2025-09-01): Added state management and routing details
- v1.2 (2025-09-01): Enhanced performance and testing documentation
- v1.1 (2025-09-01): Added dependencies and error handling
- v1.0 (2025-09-01): Initial release with operations page documentation

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [x] Audit completed
