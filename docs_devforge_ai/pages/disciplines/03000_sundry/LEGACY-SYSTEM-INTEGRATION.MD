# Legacy System Integration Guide

**Document ID:** 1300_LEGACY_SYSTEM_INTEGRATION  
**Version:** 1.0  
**Last Updated:** August 29, 2025  
**Status:** Implementation Ready

## Overview

This guide addresses integration strategies for clients with existing legacy systems, including ERP platforms, financial management systems, and approval workflows. Our solutions provide flexible integration patterns to accommodate various legacy environments while ensuring data integrity and business continuity.

## Common Legacy Systems

### Financial Management Systems
- **SAP ECC/S4HANA** - Enterprise Resource Planning
- **Oracle ERP Cloud/E-Business Suite** - Financial modules
- **Microsoft Dynamics 365** - Finance and Operations
- **NetSuite** - Cloud ERP platform
- **QuickBooks Enterprise** - SMB accounting
- **Sage Intacct** - Financial management
- **Workday Financial Management** - HR/Finance platform

### Approval/Workflow Systems
- **SharePoint Workflows** - Document approval processes
- **DocuSign** - E-signature and approval routing
- **Nintex** - Workflow automation platform
- **K2 Workflows** - Business process management
- **Custom .NET/Java Applications** - Bespoke approval systems
- **ServiceNow** - IT service management workflows

## Integration Strategies

### 1. Hybrid Operation Mode

Allow both systems to operate simultaneously during transition periods.

#### Implementation Approach
```sql
-- Add legacy system tracking to petty cash
ALTER TABLE petty_cash_requests ADD COLUMN IF NOT EXISTS
    legacy_system_id VARCHAR(100),
    legacy_sync_status VARCHAR(20) DEFAULT 'pending',
    legacy_last_sync TIMESTAMPTZ,
    is_legacy_originated BOOLEAN DEFAULT FALSE;

-- Add legacy system tracking to approval instances  
ALTER TABLE approval_instances ADD COLUMN IF NOT EXISTS
    legacy_workflow_id VARCHAR(100),
    legacy_system_name VARCHAR(50),
    legacy_sync_status VARCHAR(20) DEFAULT 'pending',
    legacy_last_sync TIMESTAMPTZ,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional'; -- 'inbound', 'outbound', 'bidirectional'
```

#### Configuration Options
- **Parallel Processing**: Both systems handle new requests
- **Legacy Read-Only**: Legacy system becomes reporting-only
- **Selective Migration**: Migrate specific departments/processes gradually
- **Emergency Fallback**: Ability to revert to legacy system if needed

### 2. Data Migration Strategies

#### A. Big Bang Migration
- **Timeline**: Single cutover weekend
- **Risk**: High - all systems change simultaneously
- **Benefits**: Clean break, no hybrid complexity
- **Recommended for**: Small organizations, simple workflows

#### B. Phased Migration
- **Timeline**: 3-6 months with department-by-department rollout
- **Risk**: Medium - managed transition complexity
- **Benefits**: Reduced risk, user training in phases
- **Recommended for**: Medium to large organizations

#### C. Trickle Migration
- **Timeline**: 6-12 months with gradual data sync
- **Risk**: Low - extensive overlap period
- **Benefits**: Minimal disruption, extensive testing period
- **Recommended for**: Mission-critical systems, risk-averse organizations

### 3. API Integration Patterns

#### RESTful API Bridge
```javascript
// Example legacy system integration service
class LegacyIntegrationService {
    constructor(legacySystemConfig) {
        this.legacyAPI = new LegacyAPIClient(legacySystemConfig);
        this.syncInterval = 300000; // 5 minutes
    }

    async syncPettyCashRequests() {
        // Pull new requests from legacy system
        const legacyRequests = await this.legacyAPI.getPettyCashRequests({
            since: this.lastSyncTimestamp,
            status: 'new'
        });

        for (const request of legacyRequests) {
            await this.createPettyCashRequest({
                ...request,
                legacy_system_id: request.id,
                legacy_sync_status: 'synced',
                is_legacy_originated: true
            });
        }

        // Push approved requests back to legacy
        const approvedRequests = await this.getApprovedRequests({
            legacy_sync_status: 'pending'
        });

        for (const request of approvedRequests) {
            await this.legacyAPI.updateRequestStatus(
                request.legacy_system_id,
                'approved'
            );
            
            await this.updateSyncStatus(request.id, 'synced');
        }
    }

    async syncApprovalWorkflows() {
        // Similar bidirectional sync for approval workflows
        // Handle workflow state translation between systems
    }
}
```

#### Message Queue Integration
```javascript
// Example with Redis/AWS SQS for async processing
class MessageQueueIntegration {
    async handleLegacyApprovalUpdate(message) {
        const { legacyWorkflowId, status, approver, timestamp } = message;
        
        // Find corresponding approval instance
        const instance = await ApprovalInstance.findOne({
            legacy_workflow_id: legacyWorkflowId
        });

        if (instance) {
            await this.updateApprovalStep(instance.id, {
                status: this.translateStatus(status),
                approver_user_id: await this.mapLegacyUser(approver),
                decision_date: timestamp
            });
        }
    }

    translateStatus(legacyStatus) {
        const statusMap = {
            'APPROVED': 'approved',
            'REJECTED': 'rejected',
            'PENDING': 'pending',
            'IN_REVIEW': 'in_progress'
        };
        return statusMap[legacyStatus] || 'pending';
    }
}
```

### 4. Database Integration Options

#### A. Database Views/Linked Tables
```sql
-- Create views that combine legacy and new data
CREATE VIEW unified_petty_cash_view AS
SELECT 
    id,
    request_date,
    amount,
    purpose,
    status,
    'new_system' as source_system
FROM petty_cash_requests
WHERE is_legacy_originated = FALSE

UNION ALL

SELECT
    legacy_system_id as id,
    request_date,
    amount,
    description as purpose,
    CASE legacy_status
        WHEN 'APP' THEN 'approved'
        WHEN 'REJ' THEN 'rejected'
        ELSE 'pending'
    END as status,
    'legacy_system' as source_system
FROM legacy_petty_cash_table;
```

#### B. ETL Processes
```sql
-- Example ETL procedure for daily sync
CREATE OR REPLACE FUNCTION sync_legacy_data()
RETURNS void AS $$
BEGIN
    -- Extract new records from legacy
    INSERT INTO petty_cash_requests (
        legacy_system_id,
        amount,
        purpose,
        requested_by_name,
        status,
        is_legacy_originated,
        legacy_sync_status
    )
    SELECT 
        l.id,
        l.amount,
        l.description,
        l.requestor_name,
        CASE l.status
            WHEN 'APP' THEN 'approved'
            WHEN 'REJ' THEN 'rejected'
            ELSE 'pending'
        END,
        TRUE,
        'synced'
    FROM legacy_petty_cash_table l
    LEFT JOIN petty_cash_requests p ON p.legacy_system_id = l.id
    WHERE p.id IS NULL
      AND l.created_date >= CURRENT_DATE - INTERVAL '1 day';

    -- Update modified records
    UPDATE petty_cash_requests SET
        status = CASE legacy_table.status
            WHEN 'APP' THEN 'approved'
            WHEN 'REJ' THEN 'rejected'
            ELSE 'pending'
        END,
        legacy_last_sync = NOW()
    FROM legacy_petty_cash_table legacy_table
    WHERE petty_cash_requests.legacy_system_id = legacy_table.id
      AND legacy_table.modified_date >= CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;
```

### 5. User Authentication Integration

#### Single Sign-On (SSO)
```javascript
// Example SAML/OAuth integration
class LegacyAuthIntegration {
    async authenticateUser(legacyToken) {
        // Validate token against legacy system
        const legacyUser = await this.legacyAPI.validateToken(legacyToken);
        
        if (legacyUser) {
            // Find or create user in new system
            let user = await User.findOne({ 
                legacy_user_id: legacyUser.id 
            });
            
            if (!user) {
                user = await User.create({
                    email: legacyUser.email,
                    name: legacyUser.full_name,
                    legacy_user_id: legacyUser.id,
                    roles: this.mapLegacyRoles(legacyUser.roles)
                });
            }
            
            return user;
        }
        
        throw new Error('Invalid legacy authentication');
    }

    mapLegacyRoles(legacyRoles) {
        const roleMapping = {
            'PROC_MGR': 'procurement_manager',
            'FIN_DIR': 'finance_director',
            'SAFETY_OFF': 'safety_officer',
            'HSE_MGR': 'hse_manager'
        };
        
        return legacyRoles.map(role => roleMapping[role] || 'user');
    }
}
```

### 6. Reporting and Analytics Integration

#### Unified Reporting Views
```sql
-- Create comprehensive reporting views
CREATE VIEW unified_approval_metrics AS
WITH legacy_metrics AS (
    SELECT 
        'legacy' as system_type,
        department,
        COUNT(*) as total_requests,
        AVG(EXTRACT(days FROM approval_date - request_date)) as avg_approval_days,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
    FROM legacy_approval_requests
    WHERE request_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY department
),
new_system_metrics AS (
    SELECT 
        'new' as system_type,
        ai.metadata->>'department' as department,
        COUNT(*) as total_requests,
        AVG(EXTRACT(days FROM ai.completed_at - ai.initiated_at)) as avg_approval_days,
        COUNT(CASE WHEN ai.status = 'approved' THEN 1 END) as approved_count
    FROM approval_instances ai
    WHERE ai.initiated_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY ai.metadata->>'department'
)
SELECT * FROM legacy_metrics
UNION ALL
SELECT * FROM new_system_metrics;
```

### 7. Migration Planning Templates

#### Pre-Migration Checklist
- [ ] **Data Audit**: Complete inventory of legacy system data
- [ ] **User Mapping**: Map legacy users to new system roles
- [ ] **Workflow Analysis**: Document current approval processes
- [ ] **Integration Testing**: Validate API connections and data sync
- [ ] **Backup Strategies**: Full legacy system backup procedures
- [ ] **Rollback Plan**: Detailed procedure to revert if needed
- [ ] **Training Schedule**: User training on new system
- [ ] **Go-Live Support**: 24/7 support team during cutover

#### Migration Timeline Template
```
Phase 1: Discovery & Planning (Weeks 1-4)
- Legacy system analysis
- Integration architecture design
- User role mapping
- Training material development

Phase 2: Development & Testing (Weeks 5-12)  
- API integration development
- Data migration scripts
- User acceptance testing
- Performance testing

Phase 3: Pilot Deployment (Weeks 13-16)
- Single department pilot
- User feedback collection
- Issue resolution
- Process refinement

Phase 4: Full Deployment (Weeks 17-20)
- Phased rollout to all departments
- Data cutover execution
- Legacy system decommissioning
- Post-implementation support
```

### 8. Risk Mitigation Strategies

#### Data Integrity Protection
```sql
-- Add data validation triggers
CREATE OR REPLACE FUNCTION validate_legacy_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent duplicate entries from sync issues
    IF EXISTS (
        SELECT 1 FROM petty_cash_requests 
        WHERE legacy_system_id = NEW.legacy_system_id 
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Duplicate legacy system ID: %', NEW.legacy_system_id;
    END IF;
    
    -- Validate amount consistency
    IF NEW.is_legacy_originated AND NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount from legacy system: %', NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER petty_cash_legacy_validation
    BEFORE INSERT OR UPDATE ON petty_cash_requests
    FOR EACH ROW EXECUTE FUNCTION validate_legacy_sync();
```

#### Business Continuity Measures
- **Parallel System Operation**: Both systems active during transition
- **Real-time Data Sync**: Immediate synchronization of critical data
- **Automated Failover**: Switch to legacy system if new system fails
- **Data Reconciliation**: Daily validation between systems
- **User Access Continuity**: SSO integration maintains user sessions

## Implementation Recommendations

### For Small Organizations (< 50 users)
- **Strategy**: Big Bang Migration
- **Timeline**: 4-6 weeks
- **Integration**: Simple API bridge
- **Risk**: Medium - manageable with proper planning

### For Medium Organizations (50-500 users)
- **Strategy**: Phased Migration by Department
- **Timeline**: 3-6 months  
- **Integration**: Message queue + API integration
- **Risk**: Low - controlled rollout reduces impact

### For Large Organizations (500+ users)
- **Strategy**: Trickle Migration with Hybrid Operation
- **Timeline**: 6-12 months
- **Integration**: Full ETL pipeline + Real-time sync
- **Risk**: Very Low - extensive parallel operation period

## Support and Documentation

### Migration Support Services
- **Pre-migration Assessment**: Current system analysis
- **Integration Development**: Custom API and sync solutions  
- **Data Migration Services**: Automated and manual data transfer
- **User Training**: Comprehensive training programs
- **Go-Live Support**: 24/7 support during transition
- **Post-Migration Optimization**: Performance tuning and improvements

### Documentation Deliverables
- **System Architecture Diagrams**: Integration topology
- **API Documentation**: Detailed integration specifications
- **User Migration Guides**: Step-by-step user instructions
- **Technical Runbooks**: System administration procedures
- **Troubleshooting Guides**: Common issues and solutions

## Conclusion

Legacy system integration requires careful planning and flexible implementation strategies. Our modular approach allows organizations to choose the integration pattern that best fits their risk tolerance, timeline constraints, and technical capabilities. The key to successful legacy integration is maintaining business continuity while providing a smooth transition path to modern approval and financial management systems.

For specific legacy system integration requirements, contact our technical team for customized integration planning and implementation support.
