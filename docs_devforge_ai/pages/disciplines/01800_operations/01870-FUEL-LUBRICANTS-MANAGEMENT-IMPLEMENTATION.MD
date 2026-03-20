# 1300_01870_FUEL_LUBRICANTS_MANAGEMENT_PAGE.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.2 (2025-09-01): Updated with complete setup tutorials and database integration details
- v1.1 (2025-09-01): Added setup scripts and deployment instructions
- v1.0 (2025-09-01): Initial version

## Overview

The Fuel & Lubricants Management Page is a comprehensive inventory management system that provides end-to-end fuel and lubricant tracking, management, and reporting capabilities for construction and operations equipment.

## URL
`http://localhost:3000/01870-fuel-lubricants-management`

## Key Features

### 📊 **Dashboard Cards**
- **Total Equipment**: Equipment count with active status breakdown
- **Fuel Types**: Unique fuel type count with usage statistics
- **Low Stock Alerts**: Items below minimum stock level
- **Monthly Consumption**: Average fuel consumption trending
- **Maintenance Schedule**: Upcoming maintenance notifications
- **Supplier Performance**: Supplier reliability metrics

### 🔍 **Advanced Search & Filtering**
- **Text Search**: Product name, equipment type, supplier search
- **Category Filtering**: Fuel types, lubricant grades, consumable types
- **Status Filtering**: Active, discontinued, low stock status
- **Equipment Association**: Filter by assigned equipment
- **Date Range**: Last updated, manufactured date filtering
- **Stock Level**: Min/max stock quantity filtering

### 🏗️ **Equipment Integration**
- **Real-time Equipment Linking**: Equipment-populated from CSV data
- **Maintenance Coordination**: Equipment service schedule alerts
- **Usage Tracking**: Operating hours and consumption patterns
- **Performance Monitoring**: Equipment performance vs. fuel efficiency

### 📋 **Table Management**
- **Interactive Data Table**: Sortable, filterable, exportable
- **Bulk Operations**: Multi-select actions (approve, reject, reorder)
- **Status Management**: Active, maintenance, discontinued status
- **Approval Workflows**: Request-approval-rejection cycling
- **Stock Level Monitoring**: Real-time low stock alerts
- **Supplier Information**: Contact details, performance ratings

### 🤖 **Custom Chatbot**
- **Fuel Analysis AI**: Technical fuel/lubricant recommendations
- **Stock Prediction**: Automated reorder point calculations
- **Equipment Expert**: Maintenance and usage optimization advice
- **Supplier Intelligence**: Performance analysis and trend insights

## Database Schema

### Core Tables

#### `fuel_lubricants` Table
```sql
CREATE TABLE fuel_lubricants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Basic information
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  product_code VARCHAR(100) UNIQUE,

  -- Equipment relationship
  equipment_id UUID REFERENCES operations_equipment(id),

  -- Inventory management
  current_stock_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_stock_level DECIMAL(10,2) DEFAULT 0,
  maximum_stock_level DECIMAL(10,2) DEFAULT 1000,
  unit_of_measure VARCHAR(50) DEFAULT 'liters',

  -- Supplier information
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(255),
  purchase_price DECIMAL(10,2),
  reorder_quantity DECIMAL(10,2),

  -- Technical specifications
  specifications JSONB, -- Viscosity, flash point, etc.
  approval_status VARCHAR(50) DEFAULT 'pending',
  expiry_date DATE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  -- Flags
  active BOOLEAN DEFAULT true,
  requires_msd BOOLEAN DEFAULT false -- Material Safety Data Sheet
);
```

#### `operations_equipment` Table
```sql
CREATE TABLE operations_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic equipment information
  name VARCHAR(255) NOT NULL,
  equipment_code VARCHAR(100) UNIQUE,
  type VARCHAR(100) NOT NULL,
  subtype VARCHAR(100),
  specifications JSONB,

  -- Operational details
  status VARCHAR(50) DEFAULT 'active',
  operating_hours DECIMAL(10,2) DEFAULT 0,

  -- Fuel/Lubricants tracking
  fuel_type VARCHAR(100),
  lubricant_type VARCHAR(100),
  usage_frequency VARCHAR(100),

  -- Maintenance tracking
  next_maintenance_date DATE,
  maintenance_cycle_days INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);
```

### Reporting Views

#### `v_equipment_fuel_usage` - Equipment with Fuel Data
```sql
CREATE OR REPLACE VIEW v_equipment_fuel_usage AS
SELECT
  e.id,
  e.name,
  e.type,
  e.equipment_code,
  e.status,
  e.operating_hours,
  COUNT(fl.id) as fuel_lubricants_count,
  STRING_AGG(fl.name || ' (' || fl.category || ')', '; ') as fuel_lubricant_types,
  AVG(fl.purchase_price) as avg_fuel_lubricant_cost,
  e.next_maintenance_date,
  e.maintenance_cycle_days
FROM operations_equipment e
LEFT JOIN fuel_lubricants fl ON e.id = fl.equipment_id
WHERE e.active = true
GROUP BY e.id, e.name, e.type, e.equipment_code, e.status, e.operating_hours, e.next_maintenance_date, e.maintenance_cycle_days
ORDER BY e.name;
```

#### `v_equipment_low_stock` - Stock Level Alerts
```sql
CREATE OR REPLACE VIEW v_equipment_low_stock AS
SELECT
  e.id,
  e.name,
  e.type,
  e.location,
  fl.name as fuel_lubricant_name,
  fl.category,
  fl.current_stock_quantity,
  fl.minimum_stock_level,
  fl.unit_of_measure,
  (fl.current_stock_quantity - fl.minimum_stock_level) as deficit,
  fl.supplier_name
FROM operations_equipment e
JOIN fuel_lubricants fl ON e.id = fl.equipment_id
WHERE e.active = true
  AND fl.active = true
  AND fl.current_stock_quantity <= fl.minimum_stock_level
ORDER BY deficit ASC;
```

## Implementation Status

### ✅ **Completed Features**
1. **Frontend Components**
   - ✅ Main management page with orange (#FFA500) theme
   - ✅ Dashboard cards with statistics
   - ✅ Search and filtering functionality
   - ✅ Interactive data table
   - ✅ Form modals with black text on white background
   - ✅ Accordion menu integration
   - ✅ Routing configuration

2. **Chatbot Integration**
   - ✅ Custom fuel/lubricants analysis chatbot
   - ✅ Equipment maintenance recommendations
   - ✅ Stock level optimization advice
   - ✅ Supplier performance analysis

3. **Database Integration**
   - ✅ Supabase database setup scripts
   - ✅ Foreign key relationships
   - ✅ Row Level Security (RLS) policies
   - ✅ Performance indexing
   - ✅ Trigger functions for timestamp updates

4. **Equipment Integration**
   - ✅ CSV data import (CAT 320 Excavator, Komatsu D375 Dozer)
   - ✅ Equipment reference relationships
   - ✅ Maintenance schedule tracking
   - ✅ Operating hours monitoring

### 📋 **Setup Instructions**

#### Database Setup
```bash
# 1. Ensure fuel_lubricants table exists
psql -h your-host -d your-db -U your-user < create-fuel-lubricants-table.sql

# 2. Run the automated setup script
node setup-fuel-lubricants-tables.cjs

# Alternative: Run step-by-step
psql -h your-host -d your-db -U your-user < create-equipment-minimal.sql
```

#### Equipment Data (Sample)
The system includes sample equipment data from CSV imports:

| Equipment | Type | Specifications | Status |
|-----------|------|----------------|--------|
| **CAT 320 Excavator** | Heavy Machinery | 150kW, 20t, 1.2m³ bucket | Active |
| **Komatsu D375 Dozer** | Earth Moving | 450HP, 10m³ blade | Active |

### 🚀 **Page Structure**

```javascript
// Route Configuration (client/src/App.js)
<Route path="/fuel-lubricants-management" element={<FuelLubricantsManagement />} />

// Component Structure
📁 client/src/pages/01800-operations/components/
├── 🚀 01800-fuel-lubricants-management-page.js       # Main page
├── 📊 Dashboard/
│   ├── 01800-dashboard-cards.js                     # Statistics cards
│   ├── 01800-search-controls.js                     # Search/filter controls
│   └── 01800-equipment-selector.js                  # Equipment dropdown
├── 📋 Table/
│   ├── 01800-fuel-lubricants-table.js              # Data table component
│   └── 01800-stock-indicators.js                   # Stock level indicators
├── 🔧 Modals/
│   ├── 01800-add-fuel-modal.js                     # Add/edit modal
│   ├── 01800-approval-modal.js                     # Approval workflow
│   └── 01800-equipment-modal.js                    # Equipment association
├── 🤖 Chatbot/
│   ├── 01870-fuel-lubricants-chatbot.js           # Custom chatbot
│   └── 01870-fuel-analysis-service.js             # Analysis logic
└── 🎨 CSS/
    └── 01870-fuel-lubricants-management.css       # Styling (orange theme)
```

## UI Design & Accessibility

### Color Scheme
- **Primary Interactive**: `#FFA500` (Orange)
- **Text**: `#000000` (Black)
- **Background**: `#FFFFFF` (White)
- **Hover States**: `#E69500` (Dark Orange)
- **Focus States**: `#E69500` with black outline

### Accessibility Compliance
- ✅ WCAG 2.0 AA compliance
- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ High contrast mode support
- ✅ Color-blind friendly design

## API Endpoints

### Database Routes (`/api/fuel-lubricants`)
```javascript
GET    /api/fuel-lubricants          // List all fuel/lubricants
POST   /api/fuel-lubricants          // Create new fuel/lubricant
GET    /api/fuel-lubricants/:id      // Get specific fuel/lubricant
PUT    /api/fuel-lubricants/:id      // Update fuel/lubricant
DELETE /api/fuel-lubricants/:id      // Remove fuel/lubricant

GET    /api/fuel-lubricants/search   // Search with filters
GET    /api/fuel-lubricants/dashboard-stats // Dashboard statistics
```

### Equipment Association
```javascript
GET    /api/equipment/fuel-usage     // Equipment fuel consumption
GET    /api/equipment/maintenance-schedule // Maintenance notifications
POST   /api/equipment/:id/assign-fuel // Assign fuel to equipment
```

## Testing & Validation

### ✅ **Test Cases**
1. **Database Integration**
   - ✅ Foreign key constraint validation
   - ✅ Row level security enforcement
   - ✅ Trigger function execution

2. **Frontend Functionality**
   - ✅ Orange button functionality
   - ✅ Search and filter operations
   - ✅ Modal form validation
   - ✅ Equipment selection dropdown

3. **Chatbot Integration**
   - ✅ Fuel analysis recommendations
   - ✅ Stock prediction accuracy
   - ✅ Equipment expert responses

### 📊 **Performance Benchmarks**
- **Initial Load**: < 3 seconds
- **Search Response**: < 500ms
- **Table Filtering**: < 200ms
- **Modal Loading**: < 1 second

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: Unable to connect to PostgreSQL database
```
**Solution:**
- Verify Supabase credentials in `.env` file
- Check network connectivity
- Confirm database is accessible

#### 2. Foreign Key Constraint Errors
```
Error: Insert violates foreign key constraint
```
**Solution:**
- Ensure equipment records exist before creating fuel relationships
- Use the provided setup scripts in proper order

#### 3. CSS Styling Issues
```
Issue: Orange buttons not displaying correctly
```
**Solution:**
- Confirm CSS variables are loaded
- Check for override conflicts
- Verify HTML class assignments

## Dependencies & Requirements

### Frontend Dependencies
```json
{
  "react": "^18.0.0",
  "supabase": "^1.0.0",
  "bootstrap": "^5.0.0",
  "react-router-dom": "^6.0.0",
  "react-bootstrap": "^2.0.0",
  "@fortawesome/react-fontawesome": "^0.1.0"
}
```

### Database Requirements
- **PostgreSQL**: 12.0+ or **Supabase**
- **Row Level Security**: Enabled for multi-tenant support
- **Extensions**: uuid-ossp, pg_trgm (for text search)

### Server Requirements
- **Node.js**: 16.0+
- **Express.js**: 4.0+
- **JWT**: Authentication middleware
- **CORS**: Cross-origin support

## Future Enhancements

### 🗓️ **Planned Features**
1. **Real-time Inventory** - Live stock level updates
2. **Barcode Scanning** - Mobile-friendly data entry
3. **Predictive Ordering** - AI-driven reorder automation
4. **Integration APIs** - Third-party supplier interfaces
5. **Advanced Reporting** - Custom dashboard builder

### 📊 **Analytics Enhancements**
1. **Consumption Forecasting** - Predict fuel usage patterns
2. **Cost Optimization** - Minimize ordering costs
3. **Equipment Efficiency** - Track performance metrics
4. **Supplier Relations** - Automated supplier scoring

## Version History
- v1.2 (2025-09-01): Added comprehensive database setup instructions and troubleshooting guide
- v1.1 (2025-09-01): Added setup scripts and deployment instructions
- v1.0 (2025-09-01): Initial release with full UI, database integration, and chatbot

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed
