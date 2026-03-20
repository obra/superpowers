# 09 - Appendix F: Packing and Marking Specification

## Overview

Appendix F contains packing and marking specifications for all items in the procurement order. It defines packaging requirements, labeling standards, and handling instructions.

## Document Structure

### Packing Requirements

| Requirement | Description |
|-------------|-------------|
| Container Type | New, clean, dry, suitable for product |
| Pallet Standard | Standard size, heat-treated (ISPM 15) |
| Securing | Shrink-wrap and strapping as required |
| Protection | Appropriate cushioning and void fill |

### Packing Standards Checklist

| # | Standard | Status |
|---|----------|--------|
| 1 | Products in original, unopened containers | ☑️ Required |
| 2 | Containers sealed and leak-proof | ☑️ Required |
| 3 | Suitable for sea/air/road transport | ☑️ Required |
| 4 | Protection against moisture, heat, contamination | ☑️ Required |
| 5 | Compatible with product specifications | ☑️ Required |
| 6 | Compliant with international shipping regulations | ☑️ Required |

### Marking Requirements Table

| Marking Element | Description | Required |
|-----------------|-------------|----------|
| Product Name | Full product name as per specification | ✓ Yes |
| Product Code/SKU | Manufacturer's product code | ✓ Yes |
| Quantity | Net weight or volume | ✓ Yes |
| Batch/Lot Number | For traceability | ✓ Yes |
| Manufacturing Date | Date of production | ✓ Yes |
| Expiry Date | If applicable | ✓ Yes |
| Handling Instructions | Storage and handling requirements | ✓ Yes |
| Hazard Warnings | GHS hazard pictograms if applicable | ✓ Yes |
| Destination | Delivery address | ✓ Yes |
| Order Reference | PO number: [order_number] | ✓ Yes |

## Data Source Mapping

### From Chat Conversation

```javascript
// Packing data from extracted fields
const packingData = {
  orderNumber: extractedData.createdOrder?.order_number,
  destination: extractedData.destination_country?.name,
  items: extractedData.items.map(item => ({
    name: item.productName,
    code: item.sku || 'TBD',
    quantity: item.quantity,
    unit: item.unit,
    handlingRequirements: item.handling || 'Standard handling'
  }))
};
```

### Outer Packaging Requirements

```javascript
const packagingSpecs = {
  containers: 'New, clean, dry, suitable for product type',
  pallets: 'Standard size, heat-treated (ISPM 15 compliant)',
  securing: 'Shrink-wrap and strapping as required',
  protection: 'Appropriate cushioning and void fill'
};
```

## Agent Integration

### Compliance Validation Agent
- Validates packaging compliance requirements
- Checks hazardous materials packaging
- Verifies ISPM 15 requirements

### Quality Assurance Agent
- Validates packaging specifications
- Checks marking completeness
- Verifies handling instructions

## Country-Specific Requirements

### Guinea
- French language markings
- CDC-compliant packaging
- Import documentation on packages

### South Africa
- English markings
- SABS packaging standards
- Local content labels

### International
- Multi-language support
- GHS hazard labeling
- UN packaging codes for hazardous materials

## Hazardous Materials Packaging

### GHS Labeling Requirements
- Product identifier
- Signal word (Danger/Warning)
- Hazard statements
- Precautionary statements
- Supplier identification
- GHS pictograms

### UN Packaging Codes
- UN specification mark
- Packaging group (I, II, III)
- Solid/liquid designation
- Year of manufacture

## Export Options

### PDF Export
- Packing specification sheet
- Marking templates
- Handling instruction cards

### Label Generation
- Barcode labels
- Shipping labels
- Hazard labels

## Related Documents

- **SOW Section 8**: Packaging and Marking
- **Appendix B**: SDS for handling instructions
- **Appendix E**: Shipping documentation