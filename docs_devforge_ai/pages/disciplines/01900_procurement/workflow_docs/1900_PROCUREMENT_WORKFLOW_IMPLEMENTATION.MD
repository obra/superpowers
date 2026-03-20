# 01900 Procurement Workflow Implementation Guide

**Version:** 1.2
**Date:** 2026-03-16
**Status:** Active with Virtual Filesystem Integration

## Overview

The 01900 Procurement Workflow Implementation Guide provides technical implementation details for the procurement workflow system, including virtual filesystem integration, agent framework, and compliance validation.

## Implementation Architecture

### Core Components
- **Virtual Filesystem Backend**: Supabase-based storage for supplier data and compliance rules
- **Agent Framework**: Multi-agent system for workflow automation
- **Compliance Engine**: Jurisdiction-aware regulatory validation
- **Approval System**: Governance-driven approval routing

### Technology Stack
- **Backend**: Python with async/await support
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Storage**: Supabase Storage for virtual filesystem
- **AI Framework**: Custom agent framework with messaging capabilities
- **Frontend**: React with real-time updates

## Phase 1: Core Infrastructure

### 1.1 Virtual Filesystem Backend
**File**: `vfs_procurement_filesystem.py`

```python
class ProcurementVirtualFilesystem:
    def __init__(self, order_id: str):
        self.order_id = order_id
        self.base_path = f"/procurement/{order_id}"
        self.supabase = SupabaseClient()

    async def read_file(self, path: str) -> str:
        """Read file from virtual filesystem"""
        full_path = f"{self.base_path}/{path}"
        return await self.supabase.storage.from_("procurement-vfs").download(full_path)

    async def write_file(self, path: str, content: str) -> bool:
        """Write file to virtual filesystem"""
        full_path = f"{self.base_path}/{path}"
        return await self.supabase.storage.from_("procurement-vfs").upload(full_path, content)

    async def grep_search(self, path: str, pattern: str) -> List[str]:
        """Search files using regex patterns"""
        files = await self.list_directory(path)
        results = []
        for file in files:
            content = await self.read_file(f"{path}/{file}")
            if re.search(pattern, content):
                results.append(file)
        return results
```

### 1.2 Supplier Card Generator
**File**: `supplier_card_generator.py`

```python
class SupplierCardGenerator:
    async def generate_supplier_cards(self, order_id: str) -> List[SupplierCard]:
        """Generate individual JSON cards from supplier tables"""
        suppliers = await self.query_suppliers_table()

        cards = []
        for supplier in suppliers:
            card = await self.create_supplier_card(supplier)
            await self.write_card_to_vfs(order_id, card)
            cards.append(card)

        return cards

    async def create_supplier_card(self, supplier_data: dict) -> SupplierCard:
        """Transform database record to structured card"""
        return {
            "supplier_id": supplier_data["id"],
            "company_name": supplier_data["name"],
            "certifications": {
                "cidb_grade": supplier_data.get("cidb_rating"),
                "iso_9001": supplier_data.get("iso_9001_certified", False),
                "bbee_level": supplier_data.get("bbee_level"),
                "sars_vat_registered": supplier_data.get("vat_registered", True)
            },
            "products_services": await self.get_supplier_products(supplier_data["id"]),
            "performance_history": await self.calculate_performance_metrics(supplier_data["id"]),
            "logistics": {
                "incoterms_supported": supplier_data.get("incoterms_supported", []),
                "delivery_zones": supplier_data.get("delivery_zones", []),
                "customs_clearance": supplier_data.get("customs_clearance", False)
            }
        }
```

### 1.3 Compliance Rule Manager
**File**: `compliance_rule_manager.py`

```python
class ComplianceRuleManager:
    async def get_compliance_rules(self, organization_id: str) -> dict:
        """Load jurisdiction-specific compliance rules"""
        org_location = await self.get_organization_jurisdiction(organization_id)
        rules = await self.load_rules_for_jurisdiction(org_location)

        return {
            "jurisdiction": org_location,
            "rules": rules,
            "last_updated": await self.get_rules_last_updated(org_location)
        }

    async def validate_supplier_compliance(
        self, supplier_card: dict, organization_id: str
    ) -> ComplianceReport:
        """Validate supplier against organization's jurisdiction rules"""
        rules = await self.get_compliance_rules(organization_id)

        violations = []
        warnings = []

        if rules["jurisdiction"] == "ZA":
            violations.extend(self.check_cidb_compliance(supplier_card, rules))
            violations.extend(self.check_sars_compliance(supplier_card, rules))
            violations.extend(self.check_bbbe_compliance(supplier_card, rules))

        elif rules["jurisdiction"] == "FI":
            violations.extend(self.check_eu_ai_compliance(supplier_card, rules))
            violations.extend(self.check_nis2_compliance(supplier_card, rules))

        return {
            "jurisdiction": rules["jurisdiction"],
            "compliant": len(violations) == 0,
            "violations": violations,
            "warnings": warnings,
            "validation_timestamp": datetime.now().isoformat()
        }
```

## Phase 2: Agent Integration

### 2.1 Enhanced Agents
**Files**: `01900_compliance_validation_agent.py`, `01900_requirement_extraction_agent.py`, etc.

```python
class ProcurementAgent(BaseAgent):
    def __init__(self, config: dict):
        super().__init__(config)
        self.vfs = ProcurementVirtualFilesystem(config["order_id"])

    async def read_supplier_card(self, supplier_id: str) -> dict:
        """Read individual supplier card"""
        card_path = f"references/cards/{supplier_id}.json"
        content = await self.vfs.read_file(card_path)
        return json.loads(content)

    async def search_suppliers(self, criteria: dict) -> List[dict]:
        """Search suppliers using grep operations"""
        results = []

        if criteria.get("cidb_grade"):
            cidb_results = await self.vfs.grep_search(
                "references/cards/*.json",
                f'"cidb_grade": "{criteria["cidb_grade"]}"'
            )
            results.extend(cidb_results)

        return results

    async def validate_compliance(self, supplier_id: str) -> ComplianceReport:
        """Validate supplier against compliance rules"""
        supplier_card = await self.read_supplier_card(supplier_id)
        compliance_rules = await self.read_compliance_rules()

        return self.check_compliance(supplier_card, compliance_rules)
```

### 2.2 Updated Agent Prompts
**Integration**: Virtual filesystem references in agent prompts

```
You are a compliance validation agent. For supplier qualification:

1. Read compliance_rules.json from /templates/
2. For each potential supplier, read their card from /references/cards/{supplier_id}.json
3. Validate against CIDB requirements, SARS VAT rules, and ISO standards
4. Flag any compliance violations
5. Generate compliance_report.json in /working/

Example validation:
- CIDB GR8 required for structural steel → Check supplier's "certifications.cidb_grade"
- VAT compliance → Verify "certifications.sars_vat_registered": true
- ISO 42001 → Check AI risk management certification
```

## Phase 3: Workflow Integration

### 3.1 HITL Coordinator Enhancement
**File**: `01900_procurement_hitl_coordinator.py`

```python
class ProcurementHITLCoordinator(MessagingMixin):
    async def coordinate(self, input_data: dict) -> dict:
        session_id = input_data.get("session_id", str(uuid.uuid4()))
        order_id = input_data["procurement_data"]["id"]

        # Phase 0: Seed virtual filesystem
        await self.seed_virtual_filesystem(order_id)

        # Existing workflow continues...
        # Agents now have access to supplier cards and compliance rules

    async def seed_virtual_filesystem(self, order_id: str):
        """Initialize virtual filesystem for order"""
        vfs = ProcurementVirtualFilesystem(order_id)

        # Generate supplier cards
        card_generator = SupplierCardGenerator()
        await card_generator.generate_supplier_cards(order_id)

        # Copy templates
        await self.copy_templates_to_vfs(order_id)

        # Create working directories
        await vfs.write_file("working/selected_vendors.json", "[]")
        await vfs.write_file("working/compliance_report.json", "{}")
```

### 3.2 Parallel Appendices Orchestrator
**File**: `parallel_appendices_orchestrator.py`

```python
class ParallelAppendicesOrchestrator:
    async def orchestrate_appendix_generation(self, order_id: str, appendices: List[str]):
        """Orchestrate parallel appendix generation with supplier data"""
        vfs = ProcurementVirtualFilesystem(order_id)

        # Read supplier data for context
        supplier_data = await vfs.read_file("references/selected_suppliers.json")

        # Generate appendices in parallel
        tasks = []
        for appendix in appendices:
            task = self.generate_appendix_with_supplier_data(appendix, supplier_data)
            tasks.append(task)

        results = await asyncio.gather(*tasks)

        # Write results to VFS
        for appendix, result in zip(appendices, results):
            await vfs.write_file(f"outputs/{appendix}.docx", result)

        return results
```

## Database Schema

### Virtual Filesystem Tables
```sql
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
    operation VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### Supplier Data Extensions
```sql
-- Add jurisdiction column to procurement_orders
ALTER TABLE procurement_orders ADD COLUMN jurisdiction VARCHAR(10);

-- Ensure supplier certification fields exist
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cidb_rating VARCHAR(10);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS iso_9001_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bbee_level VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vat_registered BOOLEAN DEFAULT TRUE;
```

## API Endpoints

### Virtual Filesystem Operations
```python
# Read file from VFS
@app.get("/api/vfs/{order_id}/read")
async def read_vfs_file(order_id: str, path: str):
    vfs = ProcurementVirtualFilesystem(order_id)
    content = await vfs.read_file(path)
    return {"content": content}

# Write file to VFS
@app.post("/api/vfs/{order_id}/write")
async def write_vfs_file(order_id: str, path: str, content: str):
    vfs = ProcurementVirtualFilesystem(order_id)
    success = await vfs.write_file(path, content)
    return {"success": success}

# Search files in VFS
@app.get("/api/vfs/{order_id}/search")
async def search_vfs_files(order_id: str, path: str, pattern: str):
    vfs = ProcurementVirtualFilesystem(order_id)
    results = await vfs.grep_search(path, pattern)
    return {"results": results}
```

### Supplier Card Operations
```python
# Generate supplier cards
@app.post("/api/suppliers/{order_id}/generate")
async def generate_supplier_cards(order_id: str):
    generator = SupplierCardGenerator()
    cards = await generator.generate_supplier_cards(order_id)
    return {"cards": cards}

# Get supplier card
@app.get("/api/suppliers/{order_id}/{supplier_id}")
async def get_supplier_card(order_id: str, supplier_id: str):
    vfs = ProcurementVirtualFilesystem(order_id)
    card = await vfs.read_file(f"references/cards/{supplier_id}.json")
    return {"card": json.loads(card)}
```

## Configuration

### Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Virtual Filesystem Configuration
VFS_BUCKET_NAME=procurement-vfs
VFS_BASE_PATH=/procurement

# Compliance Configuration
COMPLIANCE_RULES_PATH=/templates/compliance_rules.json
JURISDICTION_DETECTION_ENABLED=true

# Agent Configuration
AGENT_TIMEOUT_SECONDS=30
AGENT_RETRY_ATTEMPTS=3
```

### Agent Configuration
```python
AGENT_CONFIG = {
    "procurement_agent": {
        "timeout": 30,
        "retry_attempts": 3,
        "vfs_enabled": True,
        "compliance_validation": True
    },
    "compliance_agent": {
        "timeout": 45,
        "retry_attempts": 2,
        "jurisdiction_aware": True,
        "supplier_validation": True
    }
}
```

## Testing

### Unit Tests
```python
class TestVirtualFilesystem:
    async def test_read_file(self):
        vfs = ProcurementVirtualFilesystem("TEST_ORDER_001")
        content = await vfs.read_file("templates/compliance_rules.json")
        assert content is not None

    async def test_write_file(self):
        vfs = ProcurementVirtualFilesystem("TEST_ORDER_001")
        success = await vfs.write_file("working/test.json", '{"test": true}')
        assert success is True

class TestSupplierCardGenerator:
    async def test_generate_cards(self):
        generator = SupplierCardGenerator()
        cards = await generator.generate_supplier_cards("TEST_ORDER_001")
        assert len(cards) > 0
        assert "supplier_id" in cards[0]
```

### Integration Tests
```python
class TestProcurementWorkflow:
    async def test_full_workflow_with_vfs(self):
        coordinator = ProcurementHITLCoordinator()

        result = await coordinator.coordinate({
            "procurement_data": {
                "id": "TEST_ORDER_001",
                "items": [{"sku": "STEEL-BEAM-10M", "quantity": 50}]
            }
        })

        vfs = ProcurementVirtualFilesystem("TEST_ORDER_001")
        compliance_report = await vfs.read_file("working/compliance_report.json")
        assert json.loads(compliance_report)
```

## Deployment

### Database Migration
```bash
# Run VFS table migrations
psql -d your_database -f sql/create_procurement_vfs_tables.sql

# Add jurisdiction column
psql -d your_database -f sql/add_jurisdiction_column.sql
```

### Storage Setup
```bash
# Create Supabase storage bucket
supabase storage create procurement-vfs

# Set bucket policies
supabase storage update procurement-vfs --public false
```

### Agent Deployment
```bash
# Deploy enhanced agents
python deploy_agents.py --environment production

# Verify agent deployment
python verify_agents.py --check vfs_integration
```

## Monitoring

### Performance Metrics
- **VFS Operations**: < 100ms read/write operations
- **Supplier Search**: < 500ms grep operations across 50+ cards
- **Card Generation**: < 30 seconds for full supplier database
- **Memory Usage**: < 50MB additional RAM per active order

### Health Checks
```python
async def check_vfs_health():
    vfs = ProcurementVirtualFilesystem("HEALTH_CHECK")
    try:
        await vfs.read_file("templates/compliance_rules.json")
        return {"status": "healthy", "vfs_accessible": True}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

## Related Documentation

- [Technical Specifications](./01900_PROCUREMENT_WORKFLOW_TECHNICAL_SPEC.md)
- [User Guide](./01900_PROCUREMENT_WORKFLOW_USER_GUIDE.md)
- [Testing Plan](../testing/01900_PROCUREMENT_ORDER_WORKFLOW_TESTING_PLAN.md)
- [Virtual Filesystem Implementation Plan](../01900_virtual_filesystem_supporting_documents_implementation_plan.md)