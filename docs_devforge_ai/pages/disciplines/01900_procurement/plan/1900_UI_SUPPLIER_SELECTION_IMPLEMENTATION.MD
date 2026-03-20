# UI Supplier Selection Implementation Plan

**Date:** 2026-03-17
**Status:** Proposed Enhancement
**Impact:** UI Changes Required

## Current Flow vs Proposed Flow

### Current Flow (Backend-Only)
```
User Selection → Group → Category → Item → Create Order
                                      ↓
                               Agent Processing
                               - Supplier lookup from VFS
                               - Compliance validation
                               - Field population
```

### Proposed Flow (UI + Backend Integration)
```
User Selection → Group → Category → Item → Supplier Selection → Create Order
                                      ↓                            ↓
                               Agent Processing                   VFS Integration
                               - Validate supplier selection     - Load supplier cards
                               - Enhanced compliance check       - Real-time data
                               - Smart field population          - Supplier validation
```

## Implementation Requirements

### 1. Database Schema Changes

#### Add Level 4 to Procurement Categories
```sql
-- Add level4 fields to procurement_categories table
ALTER TABLE procurement_categories ADD COLUMN level4_code VARCHAR(10);
ALTER TABLE procurement_categories ADD COLUMN level4_name VARCHAR(255);
ALTER TABLE procurement_categories ADD COLUMN level4_name_fr VARCHAR(255);

-- Insert "Goods" as level 4 category
INSERT INTO procurement_categories (
    level1_code, level1_name,
    level2_code, level2_name,
    level3_code, level3_name,
    level4_code, level4_name,
    is_active, display_order
) VALUES (
    'A', 'Energy and Fluid',
    'A00', 'Water',
    'A0001', 'Industrial water',
    'GOODS', 'Goods',
    true, 1
);
```

#### Add Supplier Selection to Procurement Orders
```sql
-- Add supplier selection fields to procurement_orders
ALTER TABLE procurement_orders ADD COLUMN selected_supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE procurement_orders ADD COLUMN supplier_selection_method VARCHAR(50); -- 'user_selected', 'agent_recommended'
ALTER TABLE procurement_orders ADD COLUMN supplier_qualification_score DECIMAL(3,2);
ALTER TABLE procurement_orders ADD COLUMN supplier_compliance_status JSONB;
```

### 2. UI Component Updates

#### Enhanced Create Procurement Order Modal

**File:** `client/src/pages/01900-procurement/components/CreateProcurementOrderModal.jsx`

**Current Structure:**
```jsx
// Current: Basic item selection
<GroupSelector />
<CategorySelector />
<ItemSelector />
<OrderDetailsForm />
```

**Proposed Structure:**
```jsx
// Enhanced: Item + Supplier selection
<GroupSelector />
<CategorySelector />
<ItemSelector />
<SupplierSelector />        // NEW COMPONENT
<OrderDetailsForm />
```

#### New SupplierSelector Component

**File:** `client/src/components/procurement/SupplierSelector.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const SupplierSelector = ({ selectedItem, onSupplierSelect }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    if (selectedItem) {
      loadQualifiedSuppliers(selectedItem);
    }
  }, [selectedItem]);

  const loadQualifiedSuppliers = async (item) => {
    setLoading(true);
    try {
      // Query suppliers who can provide this item
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          supplier_id,
          suppliers (
            id,
            company_name,
            certifications,
            performance_history
          )
        `)
        .eq('sku', item.sku);

      if (error) throw error;

      // Enhance with VFS compliance data
      const enhancedSuppliers = await Promise.all(
        data.map(async (supplier) => {
          const complianceData = await loadSupplierCompliance(supplier.supplier_id);
          return {
            ...supplier,
            compliance_score: complianceData.score,
            certifications: complianceData.certifications,
            risk_level: complianceData.risk_level
          };
        })
      );

      setSuppliers(enhancedSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierCompliance = async (supplierId) => {
    // Load from VFS supplier cards
    try {
      const response = await fetch(`/api/vfs/suppliers/${supplierId}`);
      return await response.json();
    } catch (error) {
      // Fallback to basic supplier data
      return { score: 0.5, certifications: [], risk_level: 'unknown' };
    }
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    onSupplierSelect({
      supplier_id: supplier.supplier_id,
      supplier_name: supplier.suppliers.company_name,
      compliance_score: supplier.compliance_score,
      certifications: supplier.certifications
    });
  };

  return (
    <div className="supplier-selector">
      <h4>Select Supplier</h4>

      {loading && <div>Loading qualified suppliers...</div>}

      <div className="supplier-grid">
        {suppliers.map((supplier) => (
          <SupplierCard
            key={supplier.supplier_id}
            supplier={supplier}
            selected={selectedSupplier?.supplier_id === supplier.supplier_id}
            onSelect={() => handleSupplierSelect(supplier)}
          />
        ))}
      </div>

      {suppliers.length === 0 && !loading && (
        <div className="no-suppliers">
          No qualified suppliers found. Agent will recommend alternatives.
        </div>
      )}
    </div>
  );
};

const SupplierCard = ({ supplier, selected, onSelect }) => {
  const getComplianceColor = (score) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  };

  return (
    <div
      className={`supplier-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="supplier-header">
        <h5>{supplier.suppliers.company_name}</h5>
        <div className={`compliance-badge ${getComplianceColor(supplier.compliance_score)}`}>
          {Math.round(supplier.compliance_score * 100)}% Compliant
        </div>
      </div>

      <div className="supplier-details">
        <div className="certifications">
          {supplier.certifications?.slice(0, 3).map(cert => (
            <span key={cert} className="cert-badge">{cert}</span>
          ))}
        </div>

        <div className="performance">
          <span>Risk Level: {supplier.risk_level}</span>
        </div>
      </div>
    </div>
  );
};

export default SupplierSelector;
```

### 3. API Enhancements

#### New Supplier Lookup Endpoint

**File:** `server/routes/procurement.js`

```javascript
// GET /api/procurement/suppliers/:itemId
app.get('/api/procurement/suppliers/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('procurement_categories')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // Find qualified suppliers
    const { data: supplierProducts, error: spError } = await supabase
      .from('supplier_products')
      .select(`
        supplier_id,
        unit_price_zar,
        lead_time_days,
        moq,
        suppliers (
          id,
          company_name,
          certifications,
          bbbe_level,
          iso_9001_certified
        )
      `)
      .eq('sku', item.level3_code); // Match by SKU/category code

    if (spError) throw spError;

    // Enhance with VFS compliance data
    const enhancedSuppliers = await Promise.all(
      supplierProducts.map(async (sp) => {
        const vfsData = await loadVfsSupplierData(sp.supplier_id);
        return {
          ...sp,
          compliance_score: calculateComplianceScore(sp.suppliers, vfsData),
          risk_assessment: vfsData?.risk_profile || 'unknown'
        };
      })
    );

    res.json({
      item: item,
      suppliers: enhancedSuppliers.sort((a, b) => b.compliance_score - a.compliance_score)
    });

  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to load suppliers' });
  }
});

// Helper function to load VFS supplier data
async function loadVfsSupplierData(supplierId) {
  try {
    // Load from VFS supplier cards
    const vfsPath = `/procurement/cards/${supplierId}.json`;
    const response = await fetch(`${process.env.VFS_BASE_URL}${vfsPath}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn(`VFS data not available for supplier ${supplierId}:`, error);
  }
  return null;
}

// Calculate compliance score
function calculateComplianceScore(supplier, vfsData) {
  let score = 0;

  // ISO 9001 certification
  if (supplier.iso_9001_certified) score += 0.3;

  // B-BBEE level
  const bbbeLevel = supplier.bbbe_level;
  if (bbbeLevel === 'Level 1') score += 0.3;
  else if (bbbeLevel === 'Level 2') score += 0.25;
  else if (bbbeLevel === 'Level 3') score += 0.2;
  else if (bbbeLevel === 'Level 4') score += 0.15;

  // VFS risk assessment
  if (vfsData?.risk_profile?.financial_stability === 'A') score += 0.2;
  else if (vfsData?.risk_profile?.financial_stability === 'B') score += 0.15;

  return Math.min(score, 1.0);
}
```

### 4. Order Creation Flow Update

#### Enhanced Order Creation

**File:** `client/src/pages/01900-procurement/components/CreateProcurementOrderModal.jsx`

```jsx
const CreateProcurementOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const [step, setStep] = useState(1); // 1: Item Selection, 2: Supplier Selection, 3: Order Details
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setStep(2); // Move to supplier selection
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setStep(3); // Move to order details
  };

  const handleOrderSubmit = async () => {
    const orderData = {
      item_id: selectedItem.id,
      supplier_id: selectedSupplier.supplier_id,
      supplier_selection_method: 'user_selected',
      supplier_qualification_score: selectedSupplier.compliance_score,
      supplier_compliance_status: selectedSupplier.certifications,
      ...orderDetails
    };

    // Submit order with supplier details
    await createProcurementOrder(orderData);
    onOrderCreated();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        Create Procurement Order
        <StepIndicator currentStep={step} totalSteps={3} />
      </ModalHeader>

      <ModalBody>
        {step === 1 && (
          <ItemSelectionStep onItemSelect={handleItemSelect} />
        )}

        {step === 2 && (
          <SupplierSelectionStep
            selectedItem={selectedItem}
            onSupplierSelect={handleSupplierSelect}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <OrderDetailsStep
            selectedItem={selectedItem}
            selectedSupplier={selectedSupplier}
            orderDetails={orderDetails}
            onDetailsChange={setOrderDetails}
            onSubmit={handleOrderSubmit}
            onBack={() => setStep(2)}
          />
        )}
      </ModalBody>
    </Modal>
  );
};
```

### 5. Benefits of UI Supplier Selection

#### User Experience Improvements
- **Transparency**: Users see available suppliers before order creation
- **Control**: Users can override agent recommendations if needed
- **Validation**: Real-time compliance checking during selection
- **Education**: Users learn about supplier qualifications and certifications

#### Business Process Improvements
- **Faster Processing**: Pre-validated suppliers reduce agent processing time
- **Better Compliance**: User sees compliance status during selection
- **Audit Trail**: Clear record of user supplier selection decisions
- **Quality Assurance**: Users can select preferred suppliers based on criteria

#### Technical Benefits
- **Reduced Agent Load**: Pre-selection reduces agent validation work
- **Better Data Quality**: User validation of supplier selection
- **Enhanced VFS Usage**: UI directly leverages VFS supplier data
- **Improved Performance**: Cached supplier data for faster loading

## Implementation Timeline

### Phase 1: Backend Preparation (1 week)
- ✅ Add level 4 "Goods" category to procurement_categories
- ✅ Extend procurement_orders table with supplier fields
- ✅ Create supplier lookup API endpoint
- ✅ Test VFS supplier data integration

### Phase 2: UI Development (2 weeks)
- ✅ Create SupplierSelector component
- ✅ Update CreateProcurementOrderModal with multi-step flow
- ✅ Add supplier selection validation
- ✅ Implement responsive design

### Phase 3: Integration & Testing (1 week)
- ✅ Integrate with existing order creation flow
- ✅ Test end-to-end supplier selection process
- ✅ Validate VFS data loading and caching
- ✅ Performance testing with large supplier datasets

### Phase 4: Deployment & Training (1 week)
- ✅ Deploy to staging environment
- ✅ User acceptance testing
- ✅ Training materials for supplier selection
- ✅ Go-live with monitoring

## Success Metrics

- **User Adoption**: 95% of orders include supplier selection
- **Processing Time**: 30% reduction in order processing time
- **Compliance Rate**: 99% of selected suppliers meet compliance requirements
- **User Satisfaction**: 4.5/5 rating for supplier selection experience

## Risk Mitigation

- **Fallback Support**: If VFS data unavailable, show basic supplier list
- **Performance Optimization**: Implement supplier data caching
- **Progressive Enhancement**: Supplier selection is optional, orders can still be created without it
- **Training**: Comprehensive user training on supplier selection criteria

This enhancement transforms the procurement process from agent-driven to user-assisted supplier selection while maintaining the powerful backend VFS intelligence.