# 1300_01801 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_01801 group.

## Files in this Group

- [1300_01801_STOCK_MANAGEMENT_IMPLEMENTATION.md](1300_01801_STOCK_MANAGEMENT_IMPLEMENTATION.md)
- [1300_01801_MASTER_GUIDE_UNKNOWN.md](1300_01801_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_01801_MASTER_GUIDE_UNKNOWN.md

# 1300_01801 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_01801 group.

## Files in this Group

- [1300_01801_STOCK_MANAGEMENT_IMPLEMENTATION.md](1300_01801_STOCK_MANAGEMENT_IMPLEMENTATION.md)
- [1300_01801_MASTER_GUIDE_UNKNOWN.md](1300_01801_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_01801_STOCK_MANAGEMENT_IMPLEMENTATION.md

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


---



---

### 1300_01801_STOCK_MANAGEMENT_IMPLEMENTATION.md

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


---

