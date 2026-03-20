# 08 - Appendix E: Logistics Documents Specification

## Overview

Appendix E contains the complete logistics documentation requirements for the procurement order. It specifies all shipping documents, customs requirements, and transportation specifications.

## Document Structure

### Required Shipping Documents Table

| Document | Description | Required | Status |
|----------|-------------|----------|--------|
| Commercial Invoice | Detailed invoice with product descriptions, quantities, values | ✓ Yes | ⏳ Pending |
| Packing List | Itemized list of all packages with weights and dimensions | ✓ Yes | ⏳ Pending |
| Bill of Lading / Air Waybill | Transport document issued by carrier | ✓ Yes | ⏳ Pending |
| Certificate of Origin | Document certifying country of manufacture | ✓ Yes | ⏳ Pending |
| Product Specifications | Technical data sheets for all products | ✓ Yes | ⏳ Pending |
| Safety Data Sheets (SDS) | Safety documentation for hazardous materials | ✓ Yes | ⏳ Pending |

### Country-Specific Documents

#### Guinea (CDC Required)

| Document | Description | Required | Status |
|----------|-------------|----------|--------|
| CDC (Customs Declaration) | Déclaration en Détail en Douane for Guinea | ✓ Yes | ⏳ Pending |
| Importer NIF | Numéro d'Identification Fiscale | ✓ Yes | ✓ Provided |
| DDI | Demande Déscriptive d'Importation (if required) | Conditional | ⏳ Pending |

## Data Source Mapping

### From Chat Conversation

```javascript
// Logistics data from extracted fields
const logisticsData = {
  destination: extractedData.destination_country?.name,
  incoterm: 'DAP',
  importer: {
    nif: extractedData.importer_nif?.value,
    address: extractedData.importer_address?.value
  },
  cdc_required: extractedData.cdc_required,
  items: extractedData.items
};
```

### Conditional Document Requirements

```javascript
// CDC documents for Guinea
{extractedData.cdc_required && (
  <>
    <tr>
      <td>CDC (Customs Declaration)</td>
      <td>Déclaration en Détail en Douane for Guinea</td>
      <td>✓ Yes</td>
      <td><span className="status pending">⏳ Pending</span></td>
    </tr>
    <tr>
      <td>Importer NIF</td>
      <td>Numéro d'Identification Fiscale</td>
      <td>✓ Yes</td>
      <td><span className="status complete">✓ {extractedData.importer_nif}</span></td>
    </tr>
  </>
)}
```

## Agent Integration

### Compliance Validation Agent
- Validates document requirements by country
- Checks CDC documentation completeness
- Verifies importer details

### Field Population Agent
- Populates document templates
- Generates commercial invoice data
- Creates packing list from items

## Document Generation

### Commercial Invoice
```javascript
const generateCommercialInvoice = (extractedData) => ({
  invoiceNumber: `INV-${extractedData.createdOrder.order_number}`,
  date: new Date().toISOString(),
  seller: {
    name: "Company Name",
    address: "Company Address"
  },
  buyer: {
    name: "Buyer Name",
    address: extractedData.importer_address?.value
  },
  items: extractedData.items.map(item => ({
    description: item.productName,
    quantity: item.quantity,
    unitPrice: item.rate,
    total: item.amount
  })),
  total: extractedData.estimated_value?.value,
  currency: "ZAR",
  incoterm: "DAP",
  destination: extractedData.destination_country?.name
});
```

### Packing List
```javascript
const generatePackingList = (extractedData) => ({
  orderNumber: extractedData.createdOrder?.order_number,
  packages: extractedData.items.map((item, idx) => ({
    packageNumber: idx + 1,
    contents: item.productName,
    weight: item.weight || 'TBD',
    dimensions: item.dimensions || 'TBD'
  })),
  totalPackages: extractedData.items.length,
  totalWeight: 'TBD'
});
```

## Country-Specific Requirements

### Guinea
- French language documents required
- CDC must be submitted before arrival
- NIF verification mandatory
- Additional 5-7 days for customs

### South Africa
- English documents accepted
- SABS certification for certain products
- Local content documentation
- Standard customs procedures

### International
- Multi-language support
- Incoterm-specific documents
- Export documentation
- Freight forwarding coordination

## Export Options

### PDF Export
- Individual documents
- Combined document package
- Customs-ready formatting

### Electronic Submission
- Customs portal integration
- Document verification
- Tracking and status

## Related Documents

- **SOW Section 7**: Logistics and Transportation
- **Appendix B**: SDS for hazardous materials
- **Appendix F**: Packaging specifications