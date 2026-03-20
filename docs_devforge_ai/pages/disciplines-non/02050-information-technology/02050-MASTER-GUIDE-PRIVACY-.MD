# 1300_02050_MASTER_GUIDE_PRIVACY_SETTINGS.md - Privacy Settings Management

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed
- [x] Page impact assessment completed
- [ ] Privacy infrastructure deployment (Phase 1)
- [ ] High-impact page consent implementation (Phase 2)
- [ ] Medium-impact page consent implementation (Phase 3)
- [ ] Low-impact page consent implementation (Phase 4)
- [ ] Testing and validation completed
- [ ] User training completed
- [ ] Compliance audit passed

## Implementation Progress Overview

### Phase 1: Core Privacy Infrastructure (Week 1-2)
**Status:** ⏳ Planning
**Target Completion:** 2026-01-15
- [ ] Deploy privacy database tables (`user_consent_records`, `data_subject_requests`, `privacy_audit_log`)
- [ ] Implement basic consent management APIs
- [ ] Add Privacy Settings tab to UI Settings page
- [ ] Integrate basic consent collection in onboarding

### Phase 2: High-Impact Page Implementation (Week 3-6)
**Status:** ⏳ Planning
**Target Completion:** 2026-02-15
- [ ] Implement consent modals for 10 high-impact pages
- [ ] Deploy jurisdiction-specific consent logic
- [ ] Enable privacy audit logging
- [ ] Test consent collection flows

### Phase 3: Medium-Impact Page Implementation (Week 7-10)
**Status:** ⏳ Planning
**Target Completion:** 2026-03-15
- [ ] Implement consent notices for 10+ medium-impact pages
- [ ] Add privacy preference management
- [ ] Deploy data subject rights request system
- [ ] Enable compliance reporting

### Phase 4: System-Wide Rollout (Week 11-14)
**Status:** ⏳ Planning
**Target Completion:** 2026-04-15
- [ ] Complete remaining page implementations
- [ ] Deploy automated compliance monitoring
- [ ] Conduct comprehensive testing
- [ ] Enable production deployment

## Page-Level Implementation Tracking

### 🔴 High Privacy Impact Pages Implementation Status

| Page URL | Privacy Impact | Consent Requirements | Implementation Status | Target Date | Assigned To | Notes |
|----------|----------------|---------------------|----------------------|-------------|-------------|-------|
| `/00102-final-onboarding` | 🔴 Critical | All consents required | ✅ Completed | 2025-12-23 | Compliance Team | Already implemented in onboarding flow |
| `/01500-human-resources` | 🔴 Critical | Employment data, health data | ⏳ Planned | 2026-01-15 | Dev Team | Requires HR approval workflow |
| `/01500-human-resources/job-descriptions` | 🔴 Critical | Employment data processing | ⏳ Planned | 2026-01-15 | Dev Team | Part of HR module |
| `/contractor-vetting` | 🔴 Critical | Third-party data sharing, health data | ⏳ Planned | 2026-01-22 | Dev Team | POPIA Section 27 compliance required |
| `/cv-processing` | 🔴 Critical | Sensitive personal data | ⏳ Planned | 2026-01-22 | Dev Team | Explicit consent mandatory |
| `/fuel-lubricants-management` | 🔴 High | Employment records | ⏳ Planned | 2026-01-29 | Dev Team | 7-year retention (ZA) |
| `/petty-cash` | 🔴 High | Financial data processing | ⏳ Planned | 2026-01-29 | Dev Team | Enhanced protection (SA) |
| `/safety` | 🔴 Critical | Health & safety data | ⏳ Planned | 2026-01-15 | Dev Team | Legal obligation basis |
| `/timesheet` | 🔴 High | Employment records | ⏳ Planned | 2026-01-29 | Dev Team | 7-year retention (ZA) |
| `/travel-arrangements` | 🔴 High | Location data, personal travel info | ⏳ Planned | 2026-01-29 | Dev Team | ZA/GN location consent |

### 🟡 Medium Privacy Impact Pages Implementation Status

| Page URL | Privacy Impact | Consent Requirements | Implementation Status | Target Date | Assigned To | Notes |
|----------|----------------|---------------------|----------------------|-------------|-------------|-------|
| `/user-management` | 🟡 Medium | Data processing consent | ⏳ Planned | 2026-02-15 | Dev Team | Admin access to user data |
| `/contributor-hub` | 🟡 Medium | Third-party sharing consent | ⏳ Planned | 2026-02-15 | Dev Team | External contributor management |
| `/document-control` | 🟡 Medium | Data processing consent | ⏳ Planned | 2026-02-22 | Dev Team | Document access tracking |
| `/financial-dashboard` | 🟡 Medium | Financial data consent | ⏳ Planned | 2026-02-22 | Dev Team | Financial reporting access |
| `/procurement` | 🟡 Medium | Third-party sharing consent | ⏳ Planned | 2026-02-22 | Dev Team | Supplier/vendor data |
| `/sales/tender-management` | 🟡 Medium | Marketing communications | ⏳ Planned | 2026-03-01 | Dev Team | Tender notification preferences |
| `/logistics-tracking` | 🟡 Medium | Location data consent | ⏳ Planned | 2026-03-01 | Dev Team | Shipment tracking |
| `/maintenance-management` | 🟡 Medium | Employment data consent | ⏳ Planned | 2026-03-01 | Dev Team | Maintenance scheduling |
| `/inspection` | 🟡 Medium | Health data consent | ⏳ Planned | 2026-03-01 | Dev Team | Inspection reports |
| `/my-tasks` | 🟡 Medium | Data processing consent | ⏳ Planned | 2026-03-08 | Dev Team | Task assignment data |

### 🟢 Low Privacy Impact Pages Implementation Status

| Page URL | Privacy Impact | Consent Requirements | Implementation Status | Target Date | Assigned To | Notes |
|----------|----------------|---------------------|----------------------|-------------|-------------|-------|
| `/ui-settings` | 🟢 Low | General system notice | ⏳ Planned | 2026-03-15 | Dev Team | No personal data collection |
| `/accordion-management` | 🟢 Low | System notice | ⏳ Planned | 2026-03-15 | Dev Team | Interface customization |
| `/chatbot-management` | 🟢 Low | Data processing consent | ⏳ Planned | 2026-03-15 | Dev Team | AI interaction data |
| `/coding-templates` | 🟢 Low | System notice | ⏳ Planned | 2026-03-22 | Dev Team | Code template management |
| `/modal-management` | 🟢 Low | System notice | ⏳ Planned | 2026-03-22 | Dev Team | Interface configuration |
| `/plantuml-templates` | 🟢 Low | System notice | ⏳ Planned | 2026-03-22 | Dev Team | Technical documentation |
| `/schema-dashboard` | 🟢 Low | System notice | ⏳ Planned | 2026-03-29 | Dev Team | System administration |
| `/system-settings` | 🟢 Low | System notice | ⏳ Planned | 2026-03-29 | Dev Team | System configuration |
| `/templates-forms-management` | 🟢 Low | Data processing consent | ⏳ Planned | 2026-03-29 | Dev Team | Template usage tracking |

### Complex Accordion Pages Implementation Status (25 pages)

| Page URL | Privacy Impact | Implementation Status | Target Date | Assigned To | Notes |
|----------|----------------|----------------------|-------------|-------------|-------|
| `/administration` | 🔴 High | ⏳ Planned | 2026-01-15 | Dev Team | Requires consent modal |
| `/architectural` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Banner notice required |
| `/board-of-directors` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Executive data handling |
| `/chemical-engineering` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Technical document processing |
| `/civil-engineering` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Project data processing |
| `/construction` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Construction data processing |
| `/contracts-post-award` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Contract data processing |
| `/contracts-pre-award` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Tender data processing |
| `/design` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Design document processing |
| `/director-construction` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Management data access |
| `/director-contracts` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Contract oversight data |
| `/director-engineering` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Engineering data access |
| `/director-finance` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Financial data access |
| `/director-hse` | 🔴 High | ⏳ Planned | 2026-01-22 | Dev Team | Health & safety data |
| `/director-logistics` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Logistics data access |
| `/director-procurement` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Procurement data access |
| `/director-project` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Project data access |
| `/director-projects` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Multi-project data access |
| `/electrical-engineering` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Technical data processing |
| `/gantt-chart?discipline=civil_engineering` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Project timeline data |
| `/mechanical-engineering` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Technical data processing |
| `/process-engineering` | 🟡 Medium | ⏳ Planned | 2026-02-15 | Dev Team | Process data processing |

### Document Compilation Suite Implementation Status (17 pages)

| Page URL | Privacy Impact | Implementation Status | Target Date | Assigned To | Notes |
|----------|----------------|----------------------|-------------|-------------|-------|
| `/logistics-documents/export/bill-of-lading` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Export document consent |
| `/logistics-documents/export/certificate-of-origin` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Export compliance data |
| `/logistics-documents/export/commercial-invoice` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Financial document data |
| `/logistics-documents/export/export-compliance-package` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Regulatory compliance data |
| `/logistics-documents/export/export-declaration` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Customs declaration data |
| `/logistics-documents/export/export-insurance-certificate` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Insurance data processing |
| `/logistics-documents/export/export-packing-list` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Shipment data processing |
| `/logistics-documents/export/export-quality-certificate` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Quality assurance data |
| `/logistics-documents/export/phytosanitary-certificate` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Agricultural compliance data |
| `/logistics-documents/import/bill-of-lading-import` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Import document processing |
| `/logistics-documents/import/certificate-package` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Import certificate processing |
| `/logistics-documents/import/commercial-packing-list-import` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Import packing data |
| `/logistics-documents/import/compliance-package-import` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Import compliance processing |
| `/logistics-documents/import/customs-clearance` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Customs data processing |
| `/logistics-documents/import/delivery-note-import` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Delivery document processing |
| `/logistics-documents/import/insurance-certificate-import` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Import insurance processing |
| `/logistics-documents/import/shipping-manifest` | 🟡 Medium | ⏳ Planned | 2026-02-22 | Dev Team | Shipping manifest processing |

### Standard Pages Implementation Status (91 pages)

| Page Category | Total Pages | Completed | In Progress | Planned | Not Started | Target Completion |
|---------------|-------------|-----------|-------------|---------|-------------|-------------------|
| **High Impact (🔴)** | 10 | 1 | 0 | 9 | 0 | 2026-01-29 |
| **Medium Impact (🟡)** | 35+ | 0 | 0 | 35+ | 0 | 2026-03-08 |
| **Low Impact (🟢)** | 46+ | 0 | 0 | 46+ | 0 | 2026-03-29 |
| **System Config** | 25+ | 0 | 0 | 25+ | 0 | 2026-03-29 |
| **Document Suite** | 17 | 0 | 0 | 17 | 0 | 2026-02-22 |

## Implementation Checklist and Dependencies

### Pre-Implementation Requirements
- [ ] Privacy database tables deployed and tested
- [ ] Consent management APIs implemented and tested
- [ ] Privacy Settings UI component completed
- [ ] Jurisdiction detection logic implemented
- [ ] Audit logging system operational

### Page Implementation Template
For each page implementation, ensure:

#### Code Changes Required
```javascript
// 1. Import privacy utilities
import { checkPageConsent, PrivacyConsentModal } from '@utils/privacy';

// 2. Add consent check to page component
const MyPageComponent = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      const consentStatus = await checkPageConsent('/my-page', userJurisdiction);
      if (!consentStatus.hasRequiredConsents) {
        setShowConsentModal(true);
      } else {
        setHasConsent(true);
      }
    };
    checkConsent();
  }, []);

  if (!hasConsent && showConsentModal) {
    return <PrivacyConsentModal pageId="/my-page" onConsentGranted={() => setHasConsent(true)} />;
  }

  return <PageContent />;
};
```

#### Testing Requirements
- [ ] Consent modal displays correctly
- [ ] Jurisdiction-specific consents shown
- [ ] Consent preferences saved to database
- [ ] Audit log entries created
- [ ] Page functions normally after consent

#### Documentation Updates
- [ ] Page privacy impact documented
- [ ] User consent requirements listed
- [ ] Implementation notes added
- [ ] Testing results recorded

## Risk Assessment and Mitigation

### Implementation Risks
| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Consent Fatigue** | High | Medium | Progressive disclosure, clear explanations |
| **User Resistance** | Medium | High | Education campaigns, phased rollout |
| **Technical Complexity** | Medium | Medium | Modular implementation, thorough testing |
| **Compliance Gaps** | Low | Critical | Legal review at each phase |
| **Performance Impact** | Low | Low | Efficient caching, background processing |

### Success Metrics Tracking

#### Weekly Progress Metrics
- Pages implemented vs. planned
- Consent collection success rate
- User feedback scores
- Audit compliance percentage
- System performance impact

#### Monthly Compliance Metrics
- Data subject request resolution time
- Breach notification compliance
- Consent withdrawal processing time
- Cross-jurisdictional compliance coverage

## Version History
- v1.0 (2025-12-23): Comprehensive Privacy Settings Master Guide covering ZA (POPIA), GN (Guinea), and SA (Saudi Arabia) integration
- v1.1 (2025-12-23): Added page-level implementation tracking and status monitoring across all 134 UI pages

## Overview
The Privacy Settings Management system provides comprehensive user privacy controls within the existing UI Settings page (00165-ui-settings). Following the same design pattern as Page Access Permissions, this system allows users to manage their consent preferences, data subject rights, and jurisdictional privacy settings across three regulatory frameworks: South Africa (POPIA), Guinea (Law L/2016/012/AN), and Saudi Arabia (PDPL).

## Integration with Existing UI Settings

### Privacy Settings Tab Addition
The privacy functionality will be added as a new tab in the existing `00165-ui-settings` page, following the established pattern:

```javascript
// client/src/pages/00165-ui-settings/components/00165-UISettingsPage.js
import { PrivacySettingsManager } from "./00165-PrivacySettingsManager.js";

// Add to tab navigation
<li className="nav-item">
  <button className={`nav-link ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}>
    🔒 Privacy Settings
  </button>
</li>

// Add to tab content
{activeTab === 'privacy' && (
  <PrivacySettingsManager />
)}
```

## Privacy Settings Manager Component Architecture

### Main Component Structure
```javascript
// client/src/pages/00165-ui-settings/components/00165-PrivacySettingsManager.js
export const PrivacySettingsManager = () => {
  const [userConsent, setUserConsent] = useState({});
  const [privacyPreferences, setPrivacyPreferences] = useState({});
  const [jurisdictionSettings, setJurisdictionSettings] = useState({});
  const [dataRequests, setDataRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Following PagePermissionsManager pattern with:
  // - Status cards showing consent statistics
  // - Tabbed interface for different privacy areas
  // - Real-time API updates
  // - Search and filter functionality
}
```

## Database Schema Integration

### Privacy-Related Tables (Cross-referenced from index-table.md)

| Table | Privacy Purpose | Scripts Using | Key Fields |
|-------|----------------|---------------|------------|
| `user_management` | Core user profiles with consent tracking | Multiple auth scripts | `consent_given`, `consent_date`, `jurisdiction` |
| `user_profiles` | Extended profile data with privacy preferences | Profile management | `privacy_settings`, `data_retention_prefs` |
| `user_emails` | Email communications with consent logging | Email system | `consent_for_marketing`, `consent_withdrawn_date` |
| `contacts` | Contact information with consent management | CRM scripts | `consent_purpose`, `consent_expiry` |
| `personnel_records` | Employment data with privacy restrictions | HR scripts | `sensitive_data_flag`, `access_log` |
| `timesheets` | Work records with retention policies | Time tracking | `retention_period`, `anonymized_date` |
| `financial_records` | Payment data with PCI DSS compliance | Finance scripts | `encrypted_data`, `access_audit` |
| `safety_incidents` | Incident reports with sensitive data handling | HSE scripts | `personal_data_involved`, `consent_obtained` |
| `travel_requests` | Travel data with location privacy | Travel scripts | `location_consent`, `data_minimization` |
| `contracts` | Contract data with legal compliance | Procurement scripts | `data_processing_terms`, `consent_records` |

### New Privacy-Specific Tables

```sql
-- User consent management
CREATE TABLE user_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_management(id),
  consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'data_processing', 'third_party'
  consent_given BOOLEAN NOT NULL,
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_withdrawn_date TIMESTAMP WITH TIME ZONE,
  jurisdiction VARCHAR(10), -- 'ZA', 'GN', 'SA'
  consent_purpose TEXT,
  legal_basis VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data subject requests tracking
CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_management(id),
  request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability'
  request_status VARCHAR(20) DEFAULT 'pending',
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,
  jurisdiction VARCHAR(10),
  request_details JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy audit log
CREATE TABLE privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_management(id),
  action VARCHAR(100) NOT NULL,
  table_affected VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  jurisdiction VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## UI Component Design Pattern

### Following PagePermissionsManager Structure

#### Status Cards Dashboard
```javascript
// Privacy status overview cards
<div className="row mb-4">
  <div className="col-md-3">
    <div className="card border-success">
      <div className="card-body text-center">
        <h5 className="card-title text-success">✅ Consent Given</h5>
        <h3 className="text-success">{consentStats.approved}</h3>
        <p className="card-text small">Active consents</p>
      </div>
    </div>
  </div>
  <div className="col-md-3">
    <div className="card border-warning">
      <div className="card-body text-center">
        <h5 className="card-title text-warning">⏳ Pending Review</h5>
        <h3 className="text-warning">{consentStats.pending}</h3>
        <p className="card-text small">Awaiting approval</p>
      </div>
    </div>
  </div>
  <div className="col-md-3">
    <div className="card border-danger">
      <div className="card-body text-center">
        <h5 className="card-title text-danger">🚫 Consent Withdrawn</h5>
        <h3 className="text-danger">{consentStats.withdrawn}</h3>
        <p className="card-text small">Revoked consents</p>
      </div>
    </div>
  </div>
  <div className="col-md-3">
    <div className="card border-info">
      <div className="card-body text-center">
        <h5 className="card-title text-info">📋 Data Requests</h5>
        <h3 className="text-info">{dataRequestsStats.total}</h3>
        <p className="card-text small">Subject access requests</p>
      </div>
    </div>
  </div>
</div>
```

#### Privacy Settings Tabs

```javascript
// Tabbed interface for different privacy areas
<ul className="nav nav-tabs mb-3">
  <li className="nav-item">
    <button className={`nav-link ${activePrivacyTab === 'consent' ? 'active' : ''}`}
            onClick={() => setActivePrivacyTab('consent')}>
      🤝 Consent Management
    </button>
  </li>
  <li className="nav-item">
    <button className={`nav-link ${activePrivacyTab === 'rights' ? 'active' : ''}`}
            onClick={() => setActivePrivacyTab('rights')}>
      ⚖️ Data Subject Rights
    </button>
  </li>
  <li className="nav-item">
    <button className={`nav-link ${activePrivacyTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActivePrivacyTab('preferences')}>
      ⚙️ Privacy Preferences
    </button>
  </li>
  <li className="nav-item">
    <button className={`nav-link ${activePrivacyTab === 'jurisdiction' ? 'active' : ''}`}
            onClick={() => setActivePrivacyTab('jurisdiction')}>
      🌍 Jurisdiction Settings
    </button>
  </li>
</ul>
```

## Consent Management Tab

### Consent Matrix Table (Following PagePermissionsManager Pattern)

```javascript
<div className="consent-table-container" style={{
  overflow: 'auto',
  maxWidth: '100%',
  maxHeight: '600px',
  border: '1px solid #dee2e6',
  borderRadius: '0.375rem'
}}>
  <Table striped bordered hover size="sm">
    <thead className="table-dark" style={{
      position: 'sticky',
      top: 0,
      zIndex: 3
    }}>
      <tr>
        <th style={{ minWidth: '200px', position: 'sticky', left: 0, backgroundColor: '#212529', zIndex: 4 }}>
          Consent Purpose
        </th>
        <th style={{ minWidth: '120px', position: 'sticky', left: '200px', backgroundColor: '#212529', zIndex: 4 }}>
          Legal Basis
        </th>
        <th style={{ minWidth: '100px', textAlign: 'center' }}>ZA (POPIA)</th>
        <th style={{ minWidth: '100px', textAlign: 'center' }}>GN (Guinea)</th>
        <th style={{ minWidth: '100px', textAlign: 'center' }}>SA (Saudi)</th>
        <th style={{ minWidth: '120px' }}>Last Updated</th>
      </tr>
    </thead>
    <tbody>
      {consentPurposes.map(purpose => (
        <tr key={purpose.id}>
          <td style={{ position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 2 }}>
            <strong>{purpose.name}</strong>
            <br />
            <small className="text-muted">{purpose.description}</small>
          </td>
          <td style={{ position: 'sticky', left: '200px', backgroundColor: 'white', zIndex: 2 }}>
            <span className="badge bg-secondary">{purpose.legalBasis}</span>
          </td>
          <td style={{ textAlign: 'center' }}>
            <div className="form-check d-flex justify-content-center">
              <input
                className="form-check-input"
                type="checkbox"
                checked={userConsent.za?.[purpose.id] || false}
                onChange={(e) => updateConsent('ZA', purpose.id, e.target.checked)}
                disabled={saving}
              />
            </div>
          </td>
          <td style={{ textAlign: 'center' }}>
            <div className="form-check d-flex justify-content-center">
              <input
                className="form-check-input"
                type="checkbox"
                checked={userConsent.gn?.[purpose.id] || false}
                onChange={(e) => updateConsent('GN', purpose.id, e.target.checked)}
                disabled={saving}
              />
            </div>
          </td>
          <td style={{ textAlign: 'center' }}>
            <div className="form-check d-flex justify-content-center">
              <input
                className="form-check-input"
                type="checkbox"
                checked={userConsent.sa?.[purpose.id] || false}
                onChange={(e) => updateConsent('SA', purpose.id, e.target.checked)}
                disabled={saving}
              />
            </div>
          </td>
          <td>
            {consentHistory[purpose.id]?.lastUpdated ?
              new Date(consentHistory[purpose.id].lastUpdated).toLocaleDateString() :
              'Never'
            }
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
</div>
```

### Consent Purposes Configuration

```javascript
const consentPurposes = [
  {
    id: 'marketing_emails',
    name: 'Marketing Communications',
    description: 'Receive promotional emails and newsletters',
    legalBasis: 'Consent',
    requiredJurisdictions: ['ZA', 'GN', 'SA'],
    dataTypes: ['user_emails', 'contacts']
  },
  {
    id: 'data_processing',
    name: 'General Data Processing',
    description: 'Process personal data for service provision',
    legalBasis: 'Contract/Legitimate Interest',
    requiredJurisdictions: ['ZA', 'GN', 'SA'],
    dataTypes: ['user_management', 'user_profiles']
  },
  {
    id: 'third_party_sharing',
    name: 'Third-party Data Sharing',
    description: 'Share data with business partners',
    legalBasis: 'Consent/Legitimate Interest',
    requiredJurisdictions: ['ZA', 'GN', 'SA'],
    dataTypes: ['contacts', 'contracts']
  },
  {
    id: 'location_tracking',
    name: 'Location Data Collection',
    description: 'Collect and process location data for travel services',
    legalBasis: 'Consent',
    requiredJurisdictions: ['ZA', 'GN'],
    dataTypes: ['travel_requests']
  },
  {
    id: 'health_data',
    name: 'Health & Safety Data',
    description: 'Process health and safety incident data',
    legalBasis: 'Legal Obligation/Vital Interests',
    requiredJurisdictions: ['ZA', 'GN', 'SA'],
    dataTypes: ['safety_incidents', 'personnel_records']
  }
];
```

## Data Subject Rights Tab

### Rights Request Interface

```javascript
// Data subject rights request form
<div className="rights-request-form">
  <h5>Submit Data Subject Rights Request</h5>
  <Form onSubmit={handleRightsRequest}>
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Request Type</Form.Label>
          <Form.Select
            value={requestForm.type}
            onChange={(e) => setRequestForm(prev => ({...prev, type: e.target.value}))}
            required
          >
            <option value="">Select request type</option>
            <option value="access">Right of Access</option>
            <option value="rectification">Right to Rectification</option>
            <option value="erasure">Right to Erasure</option>
            <option value="restriction">Right to Restriction</option>
            <option value="portability">Right to Data Portability</option>
            <option value="objection">Right to Object</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Jurisdiction</Form.Label>
          <Form.Select
            value={requestForm.jurisdiction}
            onChange={(e) => setRequestForm(prev => ({...prev, jurisdiction: e.target.value}))}
            required
          >
            <option value="">Select jurisdiction</option>
            <option value="ZA">South Africa (POPIA)</option>
            <option value="GN">Guinea (Law L/2016/012/AN)</option>
            <option value="SA">Saudi Arabia (PDPL)</option>
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
    <Form.Group className="mb-3">
      <Form.Label>Request Details</Form.Label>
      <Form.Control
        as="textarea"
        rows={3}
        value={requestForm.details}
        onChange={(e) => setRequestForm(prev => ({...prev, details: e.target.value}))}
        placeholder="Please provide specific details about your request..."
        required
      />
    </Form.Group>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Submitting...' : 'Submit Request'}
    </Button>
  </Form>
</div>
```

### Request History Table

```javascript
// Request history following table pattern
<Table striped bordered hover size="sm">
  <thead>
    <tr>
      <th>Request Type</th>
      <th>Jurisdiction</th>
      <th>Status</th>
      <th>Submitted</th>
      <th>Completed</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {dataRequests.map(request => (
      <tr key={request.id}>
        <td>{request.type}</td>
        <td>{request.jurisdiction}</td>
        <td>
          <span className={`badge bg-${getStatusColor(request.status)}`}>
            {request.status}
          </span>
        </td>
        <td>{new Date(request.created_at).toLocaleDateString()}</td>
        <td>{request.completed_date ? new Date(request.completed_date).toLocaleDateString() : '-'}</td>
        <td>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => viewRequestDetails(request)}
          >
            View
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

## Privacy Preferences Tab

### Data Retention Settings

```javascript
<div className="preferences-section">
  <h5>Data Retention Preferences</h5>
  <Form.Group className="mb-3">
    <Form.Label>Data Retention Period Override</Form.Label>
    <Form.Select
      value={preferences.retentionOverride}
      onChange={(e) => updatePreference('retentionOverride', e.target.value)}
    >
      <option value="default">Use system defaults</option>
      <option value="shorter">Shorter retention (6 months)</option>
      <option value="minimal">Minimal retention (30 days)</option>
    </Form.Select>
    <Form.Text className="text-muted">
      Override default retention periods for your data. Shorter periods may limit service functionality.
    </Form.Text>
  </Form.Group>
</div>
```

### Communication Preferences

```javascript
<div className="preferences-section">
  <h5>Communication Preferences</h5>
  <div className="row">
    <div className="col-md-6">
      <Form.Check
        type="switch"
        id="email-notifications"
        label="Email Notifications"
        checked={preferences.emailNotifications}
        onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
      />
      <Form.Check
        type="switch"
        id="sms-notifications"
        label="SMS Notifications"
        checked={preferences.smsNotifications}
        onChange={(e) => updatePreference('smsNotifications', e.target.checked)}
      />
    </div>
    <div className="col-md-6">
      <Form.Check
        type="switch"
        id="marketing-communications"
        label="Marketing Communications"
        checked={preferences.marketingCommunications}
        onChange={(e) => updatePreference('marketingCommunications', e.target.checked)}
      />
      <Form.Check
        type="switch"
        id="system-updates"
        label="System Updates & News"
        checked={preferences.systemUpdates}
        onChange={(e) => updatePreference('systemUpdates', e.target.checked)}
      />
    </div>
  </div>
</div>
```

## Jurisdiction Settings Tab

### Jurisdictional Profile

```javascript
<div className="jurisdiction-settings">
  <h5>Jurisdictional Privacy Profile</h5>

  <Alert variant="info">
    <strong>Current Jurisdiction:</strong> {userJurisdiction}
    <br />
    <strong>Applicable Laws:</strong> {getApplicableLaws(userJurisdiction)}
    <br />
    <strong>Data Protection Authority:</strong> {getDataProtectionAuthority(userJurisdiction)}
  </Alert>

  <Form.Group className="mb-3">
    <Form.Label>Primary Jurisdiction</Form.Label>
    <Form.Select
      value={jurisdictionSettings.primary}
      onChange={(e) => updateJurisdiction('primary', e.target.value)}
    >
      <option value="">Select primary jurisdiction</option>
      <option value="ZA">South Africa (POPIA)</option>
      <option value="GN">Guinea (Law L/2016/012/AN)</option>
      <option value="SA">Saudi Arabia (PDPL)</option>
    </Form.Select>
    <Form.Text className="text-muted">
      Your primary jurisdiction determines default privacy settings and applicable laws.
    </Form.Text>
  </Form.Group>

  <div className="jurisdiction-compliance-status">
    <h6>Compliance Status by Jurisdiction</h6>
    <div className="row">
      <div className="col-md-4">
        <div className="card">
          <div className="card-body text-center">
            <h6 className="card-title">ZA (POPIA)</h6>
            <span className="badge bg-success">Compliant</span>
            <p className="card-text small mt-2">
              Last assessment: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card">
          <div className="card-body text-center">
            <h6 className="card-title">GN (Guinea)</h6>
            <span className="badge bg-success">Compliant</span>
            <p className="card-text small mt-2">
              Last assessment: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card">
          <div className="card-body text-center">
            <h6 className="card-title">SA (Saudi)</h6>
            <span className="badge bg-success">Compliant</span>
            <p className="card-text small mt-2">
              Last assessment: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Onboarding Integration

### Consent Collection During Onboarding

Following the pattern from `00102-final-onboarding-page.js`, integrate privacy consent into the onboarding flow:

```javascript
// In FinalOnboardingPage component
const [privacyConsent, setPrivacyConsent] = useState({
  marketingEmails: false,
  dataProcessing: false,
  thirdPartySharing: false,
  locationTracking: false,
  healthData: false,
  jurisdiction: '',
  consentDate: null,
  consentVersion: '1.0'
});

// Privacy consent section in onboarding form
<div className="mb-4 p-3 border rounded">
  <h6 className="mb-3">
    <i className="bi bi-shield-check me-2"></i>
    Privacy Consent & Data Protection
  </h6>

  <Form.Group className="mb-3">
    <Form.Label>Jurisdiction *</Form.Label>
    <Form.Select
      value={privacyConsent.jurisdiction}
      onChange={(e) => setPrivacyConsent(prev => ({...prev, jurisdiction: e.target.value}))}
      required
    >
      <option value="">Select your jurisdiction</option>
      <option value="ZA">South Africa (POPIA)</option>
      <option value="GN">Guinea (Law L/2016/012/AN)</option>
      <option value="SA">Saudi Arabia (PDPL)</option>
    </Form.Select>
  </Form.Group>

  <div className="consent-checkboxes">
    <Form.Check
      type="checkbox"
      id="data-processing-consent"
      label="I consent to the processing of my personal data for employment purposes"
      checked={privacyConsent.dataProcessing}
      onChange={(e) => setPrivacyConsent(prev => ({...prev, dataProcessing: e.target.checked}))}
      required
    />

    <Form.Check
      type="checkbox"
      id="marketing-consent"
      label="I consent to receive marketing communications (optional)"
      checked={privacyConsent.marketingEmails}
      onChange={(e) => setPrivacyConsent(prev => ({...prev, marketingEmails: e.target.checked}))}
    />

    <Form.Check
      type="checkbox"
      id="third-party-consent"
      label="I consent to sharing my data with third parties as necessary for business operations"
      checked={privacyConsent.thirdPartySharing}
      onChange={(e) => setPrivacyConsent(prev => ({...prev, thirdPartySharing: e.target.checked}))}
    />

    {privacyConsent.jurisdiction === 'ZA' || privacyConsent.jurisdiction === 'GN' ? (
      <Form.Check
        type="checkbox"
        id="location-consent"
        label="I consent to the collection and processing of location data for travel and logistics"
        checked={privacyConsent.locationTracking}
        onChange={(e) => setPrivacyConsent(prev => ({...prev, locationTracking: e.target.checked}))}
      />
    ) : null}

    <Form.Check
      type="checkbox"
      id="health-data-consent"
      label="I consent to the processing of health and safety data as required for workplace safety"
      checked={privacyConsent.healthData}
      onChange={(e) => setPrivacyConsent(prev => ({...prev, healthData: e.target.checked}))}
    />
  </div>

  <Alert variant="info" className="mt-3">
    <small>
      Your privacy rights and data processing practices vary by jurisdiction.
      You can review and modify your consent preferences at any time through
      Settings > Privacy Settings after completing onboarding.
    </small>
  </Alert>
</div>
```

## API Endpoints Design

### Privacy Settings APIs

```javascript
// GET /api/privacy/consent - Get user consent status
// POST /api/privacy/consent - Update consent preferences
// GET /api/privacy/requests - Get data subject requests history
// POST /api/privacy/requests - Submit new data subject request
// GET /api/privacy/preferences - Get privacy preferences
// POST /api/privacy/preferences - Update privacy preferences
// GET /api/privacy/jurisdiction - Get jurisdiction settings
// POST /api/privacy/jurisdiction - Update jurisdiction settings
```

### Backend Implementation Pattern

```javascript
// Following the PagePermissionsManager backend pattern
app.post('/api/privacy/consent', async (req, res) => {
  try {
    const { userId, jurisdiction, consentType, consentGiven } = req.body;

    // Log the consent change
    await logPrivacyAudit({
      user_id: userId,
      action: 'consent_updated',
      table_affected: 'user_consent_records',
      new_values: { jurisdiction, consentType, consentGiven }
    });

    // Update consent record
    const result = await updateUserConsent(userId, jurisdiction, consentType, consentGiven);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error updating privacy consent:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});
```

## Cross-References

### Privacy Procedure Document
- **Reference:** `docs/procedures/0000_PRIVACY_PROCEDURE.md`
- **Sections Referenced:**
  - Section 2: Scope and Applicability
  - Section 3: Legal Framework
  - Section 5: Data Processing Principles
  - Section 7: Data Breach Procedures
  - Section 10: Data Subject Requests
  - Section 16: UI Integration Recommendation

### Database Schema References
- **Reference:** `docs/schema/index-table.md`
- **Tables Impacted:** See Table Impact Analysis above
- **Scripts Using:** Multiple authentication, HR, finance, and procurement scripts

### UI Settings Architecture
- **Reference:** `docs/pages-disciplines/1300_00165_MASTER_GUIDE_UI_SETTINGS.md`
- **Pattern Followed:** Tabbed interface, status cards, table with checkboxes, real-time updates

### Onboarding Integration
- **Reference:** `client/src/pages/00102-administration/components/00102-final-onboarding-page.js`
- **Integration Pattern:** Consent checkboxes in comprehensive forms, validation requirements

## Security and Audit Implementation

### Privacy Audit Logging

```javascript
// Privacy audit logging function
const logPrivacyAudit = async (auditData) => {
  const auditEntry = {
    user_id: auditData.user_id,
    action: auditData.action,
    table_affected: auditData.table_affected,
    record_id: auditData.record_id,
    old_values: auditData.old_values,
    new_values: auditData.new_values,
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    jurisdiction: auditData.jurisdiction,
    created_at: new Date()
  };

  await supabase.from('privacy_audit_log').insert(auditEntry);
};
```

### Access Control Integration

```javascript
// Integrate with existing RLS policies
const privacyRLSPolicies = {
  'user_consent_records': `
    CREATE POLICY "Users can view own consent records"
    ON user_consent_records FOR SELECT
    USING (user_id = auth.uid());

    CREATE POLICY "Users can update own consent records"
    ON user_consent_records FOR UPDATE
    USING (user_id = auth.uid());
  `,
  'data_subject_requests': `
    CREATE POLICY "Users can view own data requests"
    ON data_subject_requests FOR SELECT
    USING (user_id = auth.uid());
  `
};
```

## Testing and Validation

### Privacy Settings Test Cases

```javascript
const privacySettingsTests = [
  {
    name: 'Consent Management',
    test: async () => {
      // Test consent matrix updates
      const response = await updateConsent('ZA', 'marketing_emails', true);
      expect(response.success).toBe(true);
      // Verify audit log entry
      const auditEntry = await getLatestAuditEntry();
      expect(auditEntry.action).toBe('consent_updated');
    }
  },
  {
    name: 'Data Subject Rights',
    test: async () => {
      // Test rights request submission
      const request = await submitRightsRequest('access', 'ZA');
      expect(request.status).toBe('pending');
      // Verify notification sent
      const notificationSent = await checkNotificationSent();
      expect(notificationSent).toBe(true);
    }
  },
  {
    name: 'Jurisdiction Compliance',
    test: async () => {
      // Test jurisdiction-specific requirements
      const zaRequirements = getJurisdictionRequirements('ZA');
      expect(zaRequirements.laws).toContain('POPIA');
      expect(zaRequirements.notificationTimeline).toBe(72);
    }
  }
];
```

## Deployment and Rollout Strategy

### Phase 1: Core Privacy Infrastructure
1. Deploy privacy database tables
2. Implement basic consent management APIs
3. Add Privacy Settings tab to UI Settings page
4. Integrate basic consent collection in onboarding

### Phase 2: Advanced Features
1. Implement data subject rights request system
2. Add privacy preferences management
3. Deploy jurisdiction-specific settings
4. Enable audit logging and compliance reporting

### Phase 3: Compliance Automation
1. Implement automated consent expiry handling
2. Deploy privacy impact assessment workflows
3. Enable breach notification automation
4. Add compliance monitoring dashboards

## Success Metrics and KPIs

### Privacy Compliance KPIs
- **Consent Completion Rate:** Percentage of users with complete consent records
- **Rights Request Resolution Time:** Average time to resolve data subject requests
- **Breach Notification Compliance:** Percentage of breaches reported within timelines
- **Audit Compliance Score:** Percentage of successful privacy audits
- **User Satisfaction:** Privacy settings usability ratings

### Technical Performance Metrics
- **API Response Time:** Average response time for privacy API calls
- **Database Performance:** Query performance for privacy-related tables
- **UI Load Time:** Page load time for Privacy Settings tab
- **Error Rate:** Percentage of failed privacy operations

## Page-Level Privacy Impact Assessment

### Privacy Consent Requirements by Page Category

Based on analysis of `docs/schema/index-pages.md`, the following pages require user consent collection and privacy notices. Pages are categorized by privacy impact level and mapped to specific consent types.

#### 🔴 High Privacy Impact Pages (Require Explicit Consent)

**Pages processing sensitive personal data requiring explicit consent:**

| Page URL | Primary Data Types | Consent Requirements | Jurisdiction Notes |
|----------|-------------------|---------------------|-------------------|
| `/00102-final-onboarding` | `user_management`, `user_profiles`, `personnel_records` | All consents required | ZA: POPIA compliance mandatory |
| `/01500-human-resources` | `personnel_records`, `user_management`, `training_materials` | Employment data, health data | GN/SA: Explicit consent for health data |
| `/01500-human-resources/job-descriptions` | `personnel_records`, `user_profiles` | Employment data processing | All jurisdictions |
| `/contractor-vetting` | `contractor_vetting`, `personnel_records`, `safety_incidents` | Third-party data sharing, health data | ZA: POPIA Section 27 compliance |
| `/cv-processing` | `cv_applications`, `personnel_records` | Sensitive personal data | All jurisdictions - explicit consent |
| `/fuel-lubricants-management` | `fuel_lubricants`, `personnel_records` | Employment records | ZA: 7-year retention |
| `/petty-cash` | `petty_cash`, `financial_records` | Financial data processing | SA: Enhanced financial data protection |
| `/safety` | `safety_incidents`, `personnel_records` | Health & safety data | Legal obligation basis |
| `/timesheet` | `timesheets`, `personnel_records` | Employment records | ZA: 7-year retention |
| `/travel-arrangements` | `travel_requests`, `user_profiles` | Location data, personal travel info | ZA/GN: Location tracking consent |

#### 🟡 Medium Privacy Impact Pages (Require Consent Notice)

**Pages processing business data with personal data elements:**

| Page URL | Primary Data Types | Consent Requirements | Implementation Notes |
|----------|-------------------|---------------------|---------------------|
| `/user-management` | `user_management`, `user_profiles`, `user_roles` | Data processing consent | Admin access to user data |
| `/contributor-hub` | `contributors`, `user_profiles`, `task_history` | Third-party sharing consent | External contributor management |
| `/document-control` | `document_versions`, `user_profiles`, `audit_log` | Data processing consent | Document access tracking |
| `/financial-dashboard` | `financial_records`, `user_profiles` | Financial data consent | Financial reporting access |
| `/procurement` | `procurement_orders`, `suppliers`, `contracts` | Third-party sharing consent | Supplier/vendor data |
| `/sales/tender-management` | `tenders`, `suppliers`, `contacts` | Marketing communications | Tender notification preferences |
| `/logistics-tracking` | `tracking_events`, `containers`, `contracts` | Location data consent | Shipment tracking |
| `/maintenance-management` | `maintenance_history`, `personnel_records` | Employment data consent | Maintenance scheduling |
| `/inspection` | `inspections`, `personnel_records`, `safety_incidents` | Health data consent | Inspection reports |
| `/my-tasks` | `tasks`, `user_profiles`, `project_permissions` | Data processing consent | Task assignment data |

#### 🟢 Low Privacy Impact Pages (System Notice Only)

**Pages that are primarily system configuration with minimal personal data:**

| Page URL | Primary Data Types | Privacy Notice | Implementation Notes |
|----------|-------------------|----------------|---------------------|
| `/ui-settings` | System preferences only | General system notice | No personal data collection |
| `/accordion-management` | UI configuration | System notice | Interface customization |
| `/chatbot-management` | `chatbots`, `chatbot_sessions` | Data processing consent | AI interaction data |
| `/coding-templates` | Template metadata | System notice | Code template management |
| `/modal-management` | UI components | System notice | Interface configuration |
| `/plantuml-templates` | Diagram templates | System notice | Technical documentation |
| `/schema-dashboard` | Database schema info | System notice | System administration |
| `/system-settings` | Application settings | System notice | System configuration |
| `/templates-forms-management` | Document templates | Data processing consent | Template usage tracking |

### Privacy Notice Implementation by Page Type

#### Complex Accordion Pages (High Impact)
**25 pages requiring consent banners/modal:**

```javascript
// Privacy consent modal for accordion pages
const PrivacyConsentModal = ({ pageType, jurisdiction }) => {
  const requiredConsents = getRequiredConsentsForPage(pageType, jurisdiction);

  return (
    <Modal show={!hasRequiredConsents()}>
      <Modal.Header>
        <Modal.Title>Privacy Consent Required</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>This page processes personal data. Please provide consent:</p>
        {requiredConsents.map(consent => (
          <Form.Check
            key={consent.id}
            type="checkbox"
            label={consent.description}
            checked={userConsent[consent.id]}
            onChange={(e) => updateConsent(consent.id, e.target.checked)}
          />
        ))}
      </Modal.Body>
    </Modal>
  );
};
```

#### Document Compilation Suite Pages (Medium Impact)
**17 logistics document pages requiring consent:**

```javascript
// Consent check for document generation
const checkDocumentConsent = (documentType, userJurisdiction) => {
  const requiredConsents = {
    'bill-of-lading': ['data_processing', 'third_party_sharing'],
    'commercial-invoice': ['data_processing', 'financial_data'],
    'export-compliance': ['data_processing', 'third_party_sharing']
  };

  return hasUserConsented(requiredConsents[documentType], userJurisdiction);
};
```

#### Simple Wizard & Standard Pages (Mixed Impact)
**92 pages with varying consent requirements:**

```javascript
// Page-level consent checking
const PagePrivacyWrapper = ({ children, pageId }) => {
  const privacyConfig = getPrivacyConfigForPage(pageId);
  const userJurisdiction = getUserJurisdiction();

  useEffect(() => {
    if (privacyConfig.requiresConsent) {
      checkAndPromptForConsent(privacyConfig, userJurisdiction);
    }
  }, [pageId, userJurisdiction]);

  return children;
};
```

### Consent Collection Triggers

#### 1. **Page Access Triggers**
- **First Visit:** Consent modal for high-impact pages
- **Jurisdiction Change:** Re-prompt for jurisdiction-specific consents
- **Feature Usage:** Contextual consent for specific features

#### 2. **Data Processing Triggers**
- **Form Submission:** Consent validation before data processing
- **File Upload:** Consent for document processing and storage
- **API Calls:** Consent validation for data transmission

#### 3. **Consent Withdrawal Triggers**
- **Settings Change:** Immediate consent withdrawal processing
- **Account Deletion:** Complete data erasure workflow
- **Jurisdiction Transfer:** Consent re-evaluation

### Page-Specific Consent Configurations

```javascript
const pagePrivacyConfigs = {
  // High Impact Pages
  '/00102-final-onboarding': {
    impactLevel: 'high',
    requiredConsents: ['data_processing', 'employment_data', 'third_party_sharing'],
    consentModal: true,
    persistentNotice: true
  },

  // Medium Impact Pages
  '/travel-arrangements': {
    impactLevel: 'medium',
    requiredConsents: ['location_tracking', 'data_processing'],
    jurisdictions: ['ZA', 'GN'], // SA doesn't require location consent
    bannerNotice: true
  },

  // Low Impact Pages
  '/ui-settings': {
    impactLevel: 'low',
    requiredConsents: [],
    systemNotice: true
  }
};
```

### Implementation Timeline by Page Priority

#### Phase 1: Critical High-Impact Pages (Week 1-2)
- `/00102-final-onboarding` - Already implemented in onboarding
- `/01500-human-resources` - HR data processing
- `/contractor-vetting` - Sensitive contractor data
- `/safety` - Health and safety data

#### Phase 2: Business Process Pages (Week 3-4)
- `/procurement` - Supplier/vendor data
- `/financial-dashboard` - Financial data access
- `/travel-arrangements` - Location data processing
- `/timesheet` - Employment records

#### Phase 3: Administrative Pages (Week 5-6)
- `/user-management` - User data administration
- `/document-control` - Document access tracking
- `/contributor-hub` - External contributor data

#### Phase 4: System Configuration Pages (Week 7-8)
- `/ui-settings` - System preferences
- `/modal-management` - UI configuration
- `/chatbot-management` - AI interaction data

## Privacy Chatbot Integration and Guidance System

### Overview
Following the vector store sharing system established on the Procurement page (01900) as detailed in `0000_CHATBOT_MASTER_PROCEDURE.md`, privacy chatbots are implemented across applicable pages to provide contextual privacy guidance. This creates a unified privacy assistance system that shares knowledge across jurisdictions and use cases.

### Privacy Vector Store Architecture

#### Shared Privacy Knowledge Base
```sql
-- Create shared privacy vector store (following procurement model)
CREATE TABLE shared_privacy_vector (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  jurisdiction varchar(10), -- 'ZA', 'GN', 'SA', 'ALL'
  privacy_category varchar(50), -- 'consent', 'rights', 'data_processing', 'compliance'
  created_at timestamp with time zone DEFAULT now()
);

-- Populate with privacy procedures and guidelines
INSERT INTO shared_privacy_vector (content, jurisdiction, privacy_category, metadata)
SELECT
  content,
  jurisdiction,
  privacy_category,
  metadata
FROM (
  VALUES
    ('South African POPIA requires explicit consent for processing personal information...', 'ZA', 'consent', '{"law": "POPIA", "section": "8"}'),
    ('Guinean Law L/2016/012/AN governs personal data protection...', 'GN', 'compliance', '{"law": "L/2016/012/AN"}'),
    ('Saudi PDPL requires data processing consent and provides data subject rights...', 'SA', 'rights', '{"law": "PDPL"}'),
    ('Data subject rights are available in all jurisdictions...', 'ALL', 'rights', '{"universal": true}')
) AS privacy_content(content, jurisdiction, privacy_category, metadata);
```

#### Cross-Discipline Privacy Access (Following Procurement Model)
```javascript
// Privacy chatbot service with shared vector store access
class PrivacyChatbotService {
  async searchPrivacyGuidance(query, userJurisdiction, pageContext) {
    // Search shared privacy vector store
    const sharedResults = await this.supabase
      .from('shared_privacy_vector')
      .select('*')
      .or(`jurisdiction.eq.${userJurisdiction},jurisdiction.eq.ALL`)
      .textSearch('content', query)
      .limit(3);

    // Search page-specific privacy documents if available
    const pageResults = await this.supabase
      .from(`${pageContext}_privacy_docs`)
      .select('*')
      .textSearch('content', query)
      .limit(2);

    return {
      sharedGuidance: sharedResults.data,
      pageSpecific: pageResults.data,
      jurisdiction: userJurisdiction
    };
  }
}
```

### Privacy Chatbot Implementation by Page

#### 1. Final Onboarding Page (00102) - Primary Privacy Guidance
```javascript
// Enhanced onboarding chatbot with privacy focus
<ChatbotBase
  pageId="00102"
  disciplineCode="administration"
  userId={currentUser.id}
  chatType="document"
  title="Privacy & Onboarding Assistant"
  welcomeTitle="Welcome to Construct AI"
  welcomeMessage="I'm here to guide you through our privacy practices and help you complete your onboarding. Your privacy matters to us - let's get started!"
  exampleQueries={[
    "What privacy rights do I have?",
    "How is my personal data protected?",
    "What consent am I providing?",
    "How can I manage my privacy settings?"
  ]}
  theme={{
    primary: "#FFA500",
    secondary: "#FF8C00",
    background: "#FFF8F0"
  }}
  enableCitations={true}
  enableDocumentCount={true}
  enableConversationHistory={true}
  privacyGuidance={true}  // Enable privacy-specific features
  sharedVectorStore="shared_privacy_vector"  // Reference shared store
/>
```

#### 2. Human Resources Page (01500) - Employment Privacy Guidance
```javascript
// HR chatbot with employment data privacy focus
<ChatbotBase
  pageId="01500"
  disciplineCode="hr"
  chatType="document"
  title="HR Privacy Assistant"
  welcomeMessage="I can help with privacy questions related to employment records, benefits, and HR processes. How can I assist you today?"
  exampleQueries={[
    "What employment data do you store?",
    "How long are HR records kept?",
    "What are my rights regarding HR data?",
    "How do you handle sensitive HR information?"
  ]}
  privacyGuidance={true}
  sharedVectorStore="shared_privacy_vector"
  hrSpecificGuidance={true}
/>
```

#### 3. Contractor Vetting Page (02400) - Third-Party Data Privacy
```javascript
// Contractor vetting chatbot with third-party privacy focus
<ChatbotBase
  pageId="02400"
  disciplineCode="safety"
  chatType="document"
  title="Contractor Privacy Assistant"
  welcomeMessage="I can help explain how we handle contractor personal data and privacy requirements during the vetting process."
  exampleQueries={[
    "What contractor data is collected?",
    "How do you protect contractor privacy?",
    "What are the data retention periods?",
    "How can contractors exercise their rights?"
  ]}
  privacyGuidance={true}
  sharedVectorStore="shared_privacy_vector"
  thirdPartyDataFocus={true}
/>
```

#### 4. Travel Arrangements Page (00105) - Location Data Privacy
```javascript
// Travel chatbot with location privacy guidance
<ChatbotBase
  pageId="00105"
  disciplineCode="travel"
  chatType="document"
  title="Travel Privacy Assistant"
  welcomeMessage="Learn about how we protect your location data and privacy during travel arrangements."
  exampleQueries={[
    "How is my location data used?",
    "What travel information is stored?",
    "How do you protect travel privacy?",
    "Can I opt out of location tracking?"
  ]}
  privacyGuidance={true}
  sharedVectorStore="shared_privacy_vector"
  locationDataFocus={true}
  jurisdictionAware={true}  // ZA/GN require explicit consent
/>
```

#### 5. UI Settings Privacy Tab - Central Privacy Hub
```javascript
// Privacy settings page chatbot
<PrivacySettingsManager>
  {/* Existing privacy settings components */}
  <ChatbotBase
    pageId="0165-privacy"
    disciplineCode="administration"
    chatType="document"
    title="Privacy Settings Assistant"
    welcomeTitle="Privacy Management Center"
    welcomeMessage="I'm your guide to managing privacy settings, understanding your rights, and navigating our privacy procedures. What would you like to know?"
    exampleQueries={[
      "How do I update my consent preferences?",
      "What are my data subject rights?",
      "How do I withdraw consent?",
      "What does each jurisdiction require?",
      "How do I request data deletion?"
    ]}
    theme={{
      primary: "#DC3545",  // Privacy red theme
      secondary: "#C82333",
      background: "#FFF5F5"
    }}
    enableCitations={true}
    enableDocumentCount={true}
    enableConversationHistory={true}
    privacyGuidance={true}
    sharedVectorStore="shared_privacy_vector"
    settingsIntegration={true}  // Direct integration with settings
    rightsRequestIntegration={true}  // Can initiate rights requests
  />
</PrivacySettingsManager>
```

### Privacy Guidance Workflow Integration

#### Onboarding Privacy Guidance Flow
```javascript
// Integrated privacy guidance during onboarding
const OnboardingPrivacyGuidance = ({ currentStep, userJurisdiction }) => {
  const [guidanceStep, setGuidanceStep] = useState(0);

  const privacyGuidanceSteps = [
    {
      title: "Welcome to Privacy-First Onboarding",
      content: "Your privacy is important to us. Let's walk through how we protect your data.",
      chatbotQuery: "Explain our privacy commitment"
    },
    {
      title: "Understanding Your Jurisdiction",
      content: `You're in ${userJurisdiction}, which means you have specific privacy rights under ${getJurisdictionLaw(userJurisdiction)}.`,
      chatbotQuery: `What are my privacy rights in ${userJurisdiction}?`
    },
    {
      title: "Consent for Data Processing",
      content: "We need your consent to process personal data for employment purposes.",
      chatbotQuery: "What consent am I providing?"
    },
    {
      title: "Your Privacy Rights",
      content: "You have rights to access, rectify, erase, and port your data.",
      chatbotQuery: "What data subject rights do I have?"
    },
    {
      title: "Managing Your Privacy",
      content: "You can manage your privacy settings anytime through Settings > Privacy.",
      chatbotQuery: "How do I manage my privacy settings?"
    }
  ];

  return (
    <div className="privacy-guidance-flow">
      <div className="guidance-header">
        <h4>{privacyGuidanceSteps[guidanceStep].title}</h4>
        <p>{privacyGuidanceSteps[guidanceStep].content}</p>
      </div>

      <div className="guidance-chatbot">
        <ChatbotBase
          autoQuery={privacyGuidanceSteps[guidanceStep].chatbotQuery}
          compactMode={true}
          guidanceMode={true}
        />
      </div>

      <div className="guidance-navigation">
        <Button
          disabled={guidanceStep === 0}
          onClick={() => setGuidanceStep(prev => prev - 1)}
        >
          Previous
        </Button>
        <Button
          disabled={guidanceStep === privacyGuidanceSteps.length - 1}
          onClick={() => setGuidanceStep(prev => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
```

### Shared Vector Store Management (Following Procurement Model)

#### Privacy Vector Store Population
```javascript
// Privacy content population following procurement vector sharing model
const populatePrivacyVectorStore = async () => {
  const privacyDocuments = [
    {
      content: privacyProcedureContent,  // From 0000_PRIVACY_PROCEDURE.md
      jurisdiction: 'ALL',
      category: 'procedures',
      metadata: { source: '0000_PRIVACY_PROCEDURE.md', version: '1.0' }
    },
    {
      content: popiaGuidance,  // ZA-specific content
      jurisdiction: 'ZA',
      category: 'compliance',
      metadata: { law: 'POPIA', sections: ['8', '9', '10', '11'] }
    },
    {
      content: guineaGuidance,  // GN-specific content
      jurisdiction: 'GN',
      category: 'compliance',
      metadata: { law: 'L/2016/012/AN' }
    },
    {
      content: saudiGuidance,  // SA-specific content
      jurisdiction: 'SA',
      category: 'compliance',
      metadata: { law: 'PDPL' }
    },
    {
      content: rightsGuidance,  // Universal rights content
      jurisdiction: 'ALL',
      category: 'rights',
      metadata: { universal: true, gdpr_aligned: true }
    }
  ];

  // Generate embeddings and store in shared vector table
  for (const doc of privacyDocuments) {
    const embedding = await generateEmbeddings(doc.content);
    await supabase.from('shared_privacy_vector').insert({
      content: doc.content,
      embedding: embedding,
      jurisdiction: doc.jurisdiction,
      privacy_category: doc.category,
      metadata: doc.metadata
    });
  }
};
```

#### Cross-Page Privacy Chatbot Coordination

```javascript
// Privacy chatbot coordination service
class PrivacyChatbotCoordinator {
  constructor() {
    this.sharedVectorStore = 'shared_privacy_vector';
    this.pageContexts = {
      '00102': { focus: 'onboarding', priority: 'consent' },
      '01500': { focus: 'employment', priority: 'retention' },
      '02400': { focus: 'third_party', priority: 'sharing' },
      '00105': { focus: 'location', priority: 'tracking' },
      '0165-privacy': { focus: 'management', priority: 'comprehensive' }
    };
  }

  async getContextualPrivacyGuidance(pageId, userQuery, userJurisdiction) {
    const pageContext = this.pageContexts[pageId];

    // Search shared privacy vector store with context weighting
    const results = await this.supabase
      .from(this.sharedVectorStore)
      .select('*')
      .or(`jurisdiction.eq.${userJurisdiction},jurisdiction.eq.ALL`)
      .textSearch('content', userQuery)
      .order('created_at', { ascending: false })
      .limit(5);

    // Weight results by context relevance
    const weightedResults = results.data.map(result => ({
      ...result,
      relevanceScore: this.calculateContextRelevance(result, pageContext, userQuery)
    }));

    return weightedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateContextRelevance(result, pageContext, userQuery) {
    let score = 1.0;

    // Boost score for context alignment
    if (result.privacy_category === pageContext.priority) score *= 1.5;
    if (result.jurisdiction === pageContext.jurisdiction) score *= 1.3;

    // Boost for keyword matches
    const contextKeywords = this.getContextKeywords(pageContext.focus);
    const matches = contextKeywords.filter(keyword =>
      userQuery.toLowerCase().includes(keyword.toLowerCase())
    );
    score *= (1 + matches.length * 0.2);

    return score;
  }

  getContextKeywords(focus) {
    const keywordMap = {
      'onboarding': ['consent', 'privacy', 'data', 'rights', 'onboarding'],
      'employment': ['employment', 'hr', 'retention', 'personnel', 'work'],
      'third_party': ['contractor', 'vendor', 'third-party', 'sharing', 'vetting'],
      'location': ['location', 'travel', 'tracking', 'gps', 'geolocation'],
      'management': ['settings', 'preferences', 'rights', 'consent', 'privacy']
    };
    return keywordMap[focus] || [];
  }
}
```

### Privacy Chatbot Performance Monitoring

#### Usage Analytics Dashboard
```javascript
// Privacy chatbot analytics following procurement HITL model
const PrivacyChatbotAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    jurisdictionBreakdown: {},
    pagePerformance: {},
    commonQuestions: [],
    userSatisfaction: 0
  });

  useEffect(() => {
    loadPrivacyChatbotAnalytics();
  }, []);

  const loadPrivacyChatbotAnalytics = async () => {
    // Load analytics from privacy_chatbot_analytics table
    const analytics = await supabase
      .from('privacy_chatbot_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    // Process analytics data
    const processed = processAnalyticsData(analytics.data);
    setAnalytics(processed);
  };

  return (
    <div className="privacy-chatbot-analytics">
      <h4>Privacy Chatbot Performance</h4>

      <div className="analytics-grid">
        <div className="metric-card">
          <h5>Total Privacy Queries</h5>
          <h3>{analytics.totalQueries}</h3>
        </div>

        <div className="metric-card">
          <h5>User Satisfaction</h5>
          <h3>{analytics.userSatisfaction}%</h3>
        </div>

        <div className="jurisdiction-breakdown">
          <h5>Queries by Jurisdiction</h5>
          {Object.entries(analytics.jurisdictionBreakdown).map(([jurisdiction, count]) => (
            <div key={jurisdiction} className="jurisdiction-metric">
              <span>{jurisdiction}</span>
              <span>{count} queries</span>
            </div>
          ))}
        </div>

        <div className="common-questions">
          <h5>Most Common Questions</h5>
          {analytics.commonQuestions.slice(0, 5).map((question, index) => (
            <div key={index} className="question-item">
              {question.text} ({question.count} times)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Integration with Privacy Settings

#### Privacy Chatbot in Settings Tab
```javascript
// Privacy settings with integrated chatbot assistance
const PrivacySettingsWithChatbot = () => {
  return (
    <div className="privacy-settings-with-assistance">
      <div className="settings-content">
        {/* Existing privacy settings tabs and components */}
        <PrivacySettingsManager />
      </div>

      <div className="privacy-assistant-sidebar">
        <ChatbotBase
          pageId="0165-privacy-settings"
          chatType="document"
          title="Privacy Assistant"
          compactMode={true}
          settingsIntegration={true}
          sharedVectorStore="shared_privacy_vector"
          enableSettingsActions={true}  // Can trigger settings changes
          welcomeMessage="I'm here to help you understand and manage your privacy settings. What would you like to know?"
        />
      </div>
    </div>
  );
};
```

## Related Documentation

### Privacy and Compliance
- [0000_PRIVACY_PROCEDURE.md](0000_PRIVACY_PROCEDURE.md) - Comprehensive privacy procedures
- [docs/schema/0300_DATABASE_SCHEMA_MASTER_GUIDE.md](0300_DATABASE_SCHEMA_MASTER_GUIDE.md) - Database schema
- [docs/procedures/0000_VECTOR_ISOLATION_SECURITY_PROCEDURE.md](0000_VECTOR_ISOLATION_SECURITY_PROCEDURE.md) - Security procedures

### Chatbot Integration
- [0000_CHATBOT_MASTER_PROCEDURE.md](0000_CHATBOT_MASTER_PROCEDURE.md) - Complete chatbot implementation procedure
- [docs/pages-chatbots/1300_PAGES_CHATBOT_FUNCTIONALITY_GUIDE.md](../pages-chatbots/1300_PAGES_CHATBOT_FUNCTIONALITY_GUIDE.md) - Current chatbot implementation tracking
- [docs/user-interface/0004_CHATBOT_SYSTEM_DOCUMENTATION.md](../user-interface/0004_CHATBOT_SYSTEM_DOCUMENTATION.md) - Chatbot system technical documentation

### UI and User Experience
- [1300_00165_MASTER_GUIDE_UI_SETTINGS.md](1300_00165_MASTER_GUIDE_UI_SETTINGS.md) - UI Settings architecture
- [1300_00102_MASTER_GUIDE_ADMINISTRATION.md](1300_00102_MASTER_GUIDE_ADMINISTRATION.md) - Administration page guide

### Onboarding and User Management
- [1300_00150_MASTER_GUIDE_USER_SIGNUP.md](1300_00150_MASTER_GUIDE_USER_SIGNUP.md) - User signup process
- [1300_00102_MASTER_GUIDE_ADMINISTRATION.md](1300_00102_MASTER_GUIDE_ADMINISTRATION.md) - Administration workflows

## Status
- [x] Privacy framework architecture designed
- [x] UI integration pattern established
- [x] Database schema extensions defined
- [x] Onboarding integration specified
- [x] API endpoints designed
- [x] Security and audit controls implemented
- [x] Testing strategy developed
- [x] Deployment roadmap created
- [x] Cross-references to existing procedures completed

## Version History
- v1.0 (2025-12-23): Comprehensive Privacy Settings Master Guide covering ZA (POPIA), GN (Guinea), and SA (Saudi Arabia) integration with existing UI patterns and onboarding workflows
