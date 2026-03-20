# 01900 Procurement Workflow Technical Specifications

**Version:** 1.2
**Date:** 2026-03-16
**Status:** Active with Virtual Filesystem Integration

## Overview

The 01900 Procurement Workflow Technical Specifications provide detailed technical requirements, data structures, and implementation guidelines for the procurement workflow system with virtual filesystem integration.

## System Architecture

### Core Components
- **Virtual Filesystem Backend**: Supabase-based storage abstraction layer
- **Agent Framework**: Multi-agent system with messaging capabilities
- **Compliance Engine**: Jurisdiction-aware regulatory validation system
- **Approval System**: Governance-driven approval routing with HITL integration

### Technology Stack
- **Backend**: Python 3.9+ with async/await support
- **Database**: Supabase (PostgreSQL 14+) with real-time capabilities
- **Storage**: Supabase Storage for virtual filesystem operations
- **AI Framework**: Custom agent framework with MessagingMixin
- **Frontend**: React 18+ with real-time WebSocket updates

## Data Structures

### Virtual Filesystem Structure
```
/procurement/{order_id}/
├── /templates/                    # Reusable templates and rules
│   ├── procurement_plan.yaml     # Standard timelines and workflows
│   ├── compliance_rules.json     # Jurisdiction-specific compliance requirements
│   ├── inventory_catalog.json    # SKU data with ERP integration
│   ├── delivery_terms.docx       # Incoterms and logistics templates
│   └── shipping_schedule.csv     # Carrier and routing data
├── /references/                  # Order-specific supplier references
│   ├── selected_suppliers.json   # Cached supplier cards for this order
│   ├── supplier_search_cache.json # Cached search results
│   └── vendor_master.csv         # Supplier qualification criteria
├── /working/                     # Agent workspace for modifications
│   ├── selected_vendors.json     # User-selected vendors for RFQ
│   ├── compliance_report.json    # Validation results
│   ├── risk_assessment.yaml      # Dynamic risk analysis
│   └── rfq_draft.docx           # Working draft of RFQ
├── /outputs/                     # Final deliverables
│   ├── rfq_appendix_a.docx       # Generated with supplier data
│   ├── procurement_plan.pdf      # Adapted with real timelines
│   └── compliance_certificate.pdf # Automated validation report
└── /memories/                    # Learning framework persistence
    ├── negotiation_history.json  # Historical negotiation patterns
    ├── pricing_patterns.md       # Learned pricing trends
    └── supplier_performance.json # Supplier performance tracking
```

### Supplier Card Structure
```json
{
  "supplier_id": "STEELCO_001",
  "company_name": "SteelCo ZA",
  "contact_info": {
    "email": "procurement@steelco.co.za",
    "phone": "+27-21-555-0123",
    "address": "15 Steel Road, Johannesburg, ZA"
  },
  "certifications": {
    "cidb_grade": "GR8",
    "iso_9001": true,
    "iso_14001": true,
    "bbee_level": "Level 2",
    "sars_vat_registered": true
  },
  "products_services": [
    {
      "sku": "STEEL-BEAM-10M",
      "description": "Structural steel beams, 10m length",
      "unit_price_zar": 12500.00,
      "lead_time_days": 14,
      "moq": 10,
      "stock_level": 500,
      "last_updated": "2026-03-15"
    }
  ],
  "logistics": {
    "incoterms_supported": ["DAP", "DDP", "FOB"],
    "preferred_carriers": ["Transnet", "Spoornet"],
    "delivery_zones": ["Gauteng", "Western Cape", "KwaZulu-Natal"],
    "customs_clearance": true
  },
  "performance_history": {
    "on_time_delivery_rate": 0.96,
    "quality_complaints": 2,
    "total_orders": 450,
    "average_order_value_zar": 250000.00,
    "last_order_date": "2026-02-28"
  },
  "risk_profile": {
    "financial_stability": "A",
    "supply_chain_risk": "Low",
    "geopolitical_exposure": "None",
    "currency_risk": "Medium"
  },
  "metadata": {
    "created_date": "2025-01-15",
    "last_audit_date": "2026-01-30",
    "approved_by": "Procurement Director",
    "next_review_date": "2026-07-15"
  }
}
```

### Compliance Rules Structure
```json
{
  "jurisdiction": "ZA",
  "compliance_frameworks": {
    "ZA": {
      "cidb_requirements": {
        "structural_steel": "GR8",
        "concrete_work": "GR7",
        "electrical": "GR6"
      },
      "sars_vat_rules": {
        "vat_threshold_zar": 15000,
        "import_vat_rate": 0.15,
        "export_vat_refund": true
      },
      "iso_standards": {
        "iso_9001_required": true,
        "iso_14001_required": false,
        "iso_42001_ai_risk": true
      },
      "bbee_requirements": {
        "minimum_level": "Level 4",
        "preferred_level": "Level 1"
      }
    },
    "FI": {
      "eu_ai_act": {
        "high_risk_systems": true,
        "transparency_requirements": true,
        "data_governance": true
      },
      "nis2_directive": {
        "critical_infrastructure": true,
        "incident_reporting": "24_hours",
        "supply_chain_security": true
      },
      "iso_standards": {
        "iso_27001_required": true,
        "iso_42001_ai_risk": true
      }
    }
  }
}
```

## API Specifications

### Virtual Filesystem API
```python
class ProcurementVirtualFilesystem:
    async def read_file(self, path: str) -> str:
        """Read file from virtual filesystem"""
        pass

    async def write_file(self, path: str, content: str) -> bool:
        """Write file to virtual filesystem"""
        pass

    async def grep_search(self, path: str, pattern: str) -> List[str]:
        """Search files using regex patterns"""
        pass

    async def list_directory(self, path: str) -> List[str]:
        """List directory contents"""
        pass

    async def delete_file(self, path: str) -> bool:
        """Delete file from virtual filesystem"""
        pass
```

### Supplier Card Generator API
```python
class SupplierCardGenerator:
    async def generate_supplier_cards(self, order_id: str) -> List[SupplierCard]:
        """Generate individual JSON cards from supplier tables"""
        pass

    async def create_supplier_card(self, supplier_data: dict) -> SupplierCard:
        """Transform database record to structured card"""
        pass

    async def update_supplier_card(self, supplier_id: str, updates: dict) -> bool:
        """Update existing supplier card"""
        pass

    async def validate_supplier_card(self, card: dict) -> ValidationResult:
        """Validate supplier card structure and data"""
        pass
```

### Compliance Rule Manager API
```python
class ComplianceRuleManager:
    async def get_compliance_rules(self, organization_id: str) -> dict:
        """Load jurisdiction-specific compliance rules"""
        pass

    async def validate_supplier_compliance(
        self, supplier_card: dict, organization_id: str
    ) -> ComplianceReport:
        """Validate supplier against organization's jurisdiction rules"""
        pass

    async def update_compliance_rules(self, jurisdiction: str, rules: dict) -> bool:
        """Update compliance rules for jurisdiction"""
        pass

    async def get_jurisdiction_requirements(self, jurisdiction: str) -> dict:
        """Get specific requirements for jurisdiction"""
        pass
```

## Agent Specifications

### Base Agent Class
```python
class ProcurementAgent(BaseAgent):
    def __init__(self, config: dict):
        super().__init__(config)
        self.vfs = ProcurementVirtualFilesystem(config["order_id"])
        self.compliance_manager = ComplianceRuleManager()
        self.supplier_generator = SupplierCardGenerator()

    async def read_supplier_card(self, supplier_id: str) -> dict:
        """Read individual supplier card"""
        pass

    async def search_suppliers(self, criteria: dict) -> List[dict]:
        """Search suppliers using grep operations"""
        pass

    async def validate_compliance(self, supplier_id: str) -> ComplianceReport:
        """Validate supplier against compliance rules"""
        pass

    async def generate_document(self, template: str, data: dict) -> str:
        """Generate document using template and data"""
        pass
```

### Agent Communication Protocol
```python
class MessagingMixin:
    async def send_message(self, recipient: str, message: dict) -> bool:
        """Send message to another agent"""
        pass

    async def receive_message(self) -> dict:
        """Receive message from another agent"""
        pass

    async def broadcast_message(self, message: dict) -> bool:
        """Broadcast message to all agents"""
        pass

    async def request_response(self, recipient: str, request: dict) -> dict:
        """Send request and wait for response"""
        pass
```

## Database Schema

### Core Tables
```sql
-- Procurement orders table
CREATE TABLE procurement_orders (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_type VARCHAR(20) NOT NULL, -- PO, WO, SO
    estimated_value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    supplier_id VARCHAR(50),
    project_id VARCHAR(50),
    jurisdiction VARCHAR(10),
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    cidb_rating VARCHAR(10),
    iso_9001_certified BOOLEAN DEFAULT FALSE,
    bbee_level VARCHAR(20),
    vat_registered BOOLEAN DEFAULT TRUE,
    incoterms_supported JSONB,
    delivery_zones JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Virtual filesystem metadata
CREATE TABLE procurement_vfs_files (
    id UUID PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES procurement_orders(id),
    file_path TEXT NOT NULL,
    file_type VARCHAR(10),
    content_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- File access audit log
CREATE TABLE procurement_vfs_access_log (
    id UUID PRIMARY KEY,
    order_id VARCHAR(50),
    agent_id VARCHAR(100),
    file_path TEXT,
    operation VARCHAR(20), -- read, write, grep, list
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_procurement_orders_status ON procurement_orders(status);
CREATE INDEX idx_procurement_orders_supplier ON procurement_orders(supplier_id);
CREATE INDEX idx_procurement_orders_jurisdiction ON procurement_orders(jurisdiction);
CREATE INDEX idx_suppliers_cidb_rating ON suppliers(cidb_rating);
CREATE INDEX idx_suppliers_bbee_level ON suppliers(bbee_level);
CREATE INDEX idx_vfs_files_order_id ON procurement_vfs_files(order_id);
CREATE INDEX idx_vfs_files_path ON procurement_vfs_files(file_path);
```

## Performance Requirements

### Response Time Requirements
- **VFS Read Operations**: < 100ms for files < 1MB
- **VFS Write Operations**: < 200ms for files < 1MB
- **Supplier Search**: < 500ms for grep operations across 50+ cards
- **Compliance Validation**: < 1000ms for complete validation
- **Document Generation**: < 5000ms for standard documents

### Throughput Requirements
- **Concurrent Orders**: Support 100+ concurrent procurement orders
- **Agent Processing**: Support 50+ concurrent agent operations
- **VFS Operations**: Support 1000+ VFS operations per minute
- **Database Queries**: Support 500+ queries per second

### Scalability Requirements
- **Horizontal Scaling**: Support for multiple agent instances
- **Database Scaling**: Support for read replicas and connection pooling
- **Storage Scaling**: Support for unlimited VFS storage
- **Memory Usage**: < 50MB additional RAM per active order

## Security Requirements

### Authentication & Authorization
- **User Authentication**: Supabase Auth integration
- **Role-Based Access**: Procurement officer, manager, executive roles
- **API Security**: JWT token validation for all API endpoints
- **Data Encryption**: AES-256 encryption for sensitive data

### Data Protection
- **Data Privacy**: GDPR/POPIA compliance for supplier data
- **Audit Logging**: Complete audit trail for all operations
- **Data Retention**: Configurable data retention policies
- **Backup & Recovery**: Automated backup and disaster recovery

### Compliance Security
- **Jurisdiction Validation**: Real-time jurisdiction compliance checking
- **Supplier Verification**: Automated supplier certification validation
- **Regulatory Updates**: Automated regulatory change detection
- **Audit Trail**: Complete audit trail for compliance validation

## Integration Requirements

### Database Integration
- **Supabase Integration**: Real-time database operations
- **Connection Pooling**: Efficient database connection management
- **Transaction Management**: ACID compliance for critical operations
- **Data Validation**: Database-level validation for data integrity

### External System Integration
- **Supplier Systems**: API integration with supplier databases
- **Compliance Services**: Integration with regulatory compliance services
- **Document Management**: Integration with document storage systems
- **Notification Systems**: Integration with email and SMS services

### Agent Framework Integration
- **Messaging Protocol**: Standardized inter-agent communication
- **State Management**: Persistent agent state across operations
- **Error Handling**: Comprehensive error handling and recovery
- **Performance Monitoring**: Real-time agent performance monitoring

## Testing Requirements

### Unit Testing
- **Code Coverage**: Minimum 80% code coverage
- **Test Isolation**: Independent test execution
- **Mock Services**: Mock external dependencies for testing
- **Performance Testing**: Load testing for critical operations

### Integration Testing
- **End-to-End Testing**: Complete workflow testing
- **Agent Integration**: Multi-agent interaction testing
- **VFS Integration**: Virtual filesystem operation testing
- **Compliance Integration**: Regulatory compliance testing

### Performance Testing
- **Load Testing**: System performance under load
- **Stress Testing**: System behavior under stress
- **Scalability Testing**: Horizontal scaling validation
- **Memory Testing**: Memory usage and leak detection

## Deployment Requirements

### Environment Configuration
```bash
# Production Environment
NODE_ENV=production
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key
VFS_BUCKET_NAME=procurement-vfs-prod
COMPLIANCE_RULES_PATH=/templates/compliance_rules.json
AGENT_TIMEOUT_SECONDS=30
AGENT_RETRY_ATTEMPTS=3
```

### Database Migration
```sql
-- Production migration script
-- Run during maintenance window
BEGIN;
-- Add jurisdiction column
ALTER TABLE procurement_orders ADD COLUMN jurisdiction VARCHAR(10);
-- Create VFS tables
CREATE TABLE procurement_vfs_files (...);
CREATE TABLE procurement_vfs_access_log (...);
-- Create indexes
CREATE INDEX idx_procurement_orders_jurisdiction ON procurement_orders(jurisdiction);
COMMIT;
```

### Monitoring & Alerting
- **Health Checks**: Automated system health monitoring
- **Performance Metrics**: Real-time performance tracking
- **Error Tracking**: Comprehensive error logging and alerting
- **Capacity Planning**: Automated capacity monitoring and planning

## Related Documentation

- [Implementation Guide](./01900_PROCUREMENT_WORKFLOW_IMPLEMENTATION.md)
- [User Guide](./01900_PROCUREMENT_WORKFLOW_USER_GUIDE.md)
- [Testing Plan](../testing/01900_PROCUREMENT_ORDER_WORKFLOW_TESTING_PLAN.md)
- [Virtual Filesystem Implementation Plan](../01900_virtual_filesystem_supporting_documents_implementation_plan.md)