# 1300_01700_MASTER_GUIDE.md - Logistics Tracking & Management System

## Status
- [x] Initial implementation
- [x] Tech review completed
- [x] Approved for use
- [x] Audit completed

## Version History
- v2.0 (2025-08-30): Complete logistics tracking system with vessel/container API integration
- v1.0 (2025-08-27): Initial logistics page structure

## Overview
Comprehensive logistics management and tracking system integrating shipment management, vessel tracking, container monitoring, and alert systems with real-time API integration capabilities.

## Page Structure
**File Location:** `client/src/pages/01700-logistics`
```javascript
export default function LogisticsTrackingPage() {
  return (
    <PageLayout>
      <LogisticsDashboard />
      <ShipmentsManagement />
      <VesselsTracking />
      <ContainersMonitoring />
      <AlertsSystem />
    </PageLayout>
  );
}
```

## Key Features

### Shipment Management
- Complete CRUD operations for logistics shipments
- Status tracking (Planning, Booked, In Transit, Delivered, Cancelled)
- Priority levels (Low, Normal, High, Urgent)
- Financial tracking with currency support
- Container count integration

### Vessel Tracking
- Real-time vessel position tracking via VesselFinder API
- IMO/MMSI number integration
- Status monitoring (Under way, Moored, Anchored, etc.)
- ETA and destination tracking
- Map integration for position visualization

### Container Monitoring
- Container number tracking and status management
- Route management (Port of Loading → Port of Discharge)
- Cargo description and weight tracking
- Integration with shipment systems

### Alert System
- Multi-level alert severity (Low, Medium, High, Critical)
- Alert types (Delay, Weather, Security, Customs, etc.)
- Status management (Active, Acknowledged, Resolved)
- Integration with shipments, vessels, and containers

## API Integration
- **VesselFinder API**: Real-time vessel positioning and status
- **Container Tracking APIs**: Integration with major shipping lines
- **Port Data APIs**: Comprehensive port information and schedules

## Database Schema
**File Location:** `sql/01700_logistics_tracking_schema.sql`
- `logistics_shipments` - Core shipment data with financial tracking
- `vessels` - Vessel information and real-time positioning
- `containers` - Container tracking and status management
- `logistics_alerts` - Alert system with severity levels
- `ports` - Port information and code standardization

## Implementation
```bash
# Load database schema
psql -f sql/01700_logistics_tracking_schema.sql

# Load sample data for testing
psql -f sql/mock_logistics_data_guinea.sql
psql -f sql/mock_scope_of_work_data.sql  # Procurement scope testing data

# Build and deploy
./build_and_serve.sh
```

## Related Documentation
- [1300_01700_CLIENT_DATA_INTEGRATION_GUIDE.md](1300_01700_CLIENT_DATA_INTEGRATION_GUIDE.md) - Comprehensive client integration requirements
- [1300_01700_MVP_QUICK_START_GUIDE.md](1300_01700_MVP_QUICK_START_GUIDE.md) - MVP deployment quick start guide
- [1300_01700_ADVANCED_INTEGRATION_GUIDE.md](1300_01700_ADVANCED_INTEGRATION_GUIDE.md) - Advanced enterprise integration guide
- [0600_SUPPLY_CHAIN_MANAGEMENT.md](../docs/0600_SUPPLY_CHAIN_MANAGEMENT.md)
- [0800_TRANSPORTATION_MANAGEMENT.md](../docs/0800_TRANSPORTATION_MANAGEMENT.md)

## Status
- [x] Core logistics dashboard implemented
- [x] Shipment management system complete
- [x] Vessel tracking with API integration
- [x] Container monitoring system
- [x] Alert management system
- [x] Database schema and sample data
- [x] Comprehensive documentation
- [x] Production deployment ready

## Technical Specifications
- **React Components**: Modern responsive design with Bootstrap
- **API Integration**: VesselFinder API with proper credential handling
- **Database**: Supabase integration with proper RLS policies
- **State Management**: React hooks with proper error handling
- **Modals**: Detailed view modals for all logistics entities
- **Search & Filter**: Advanced filtering across all data types

## Version History
- v2.0 (2025-08-30): Complete logistics tracking system with API integration
- v1.0 (2025-08-27): Initial logistics page structure
