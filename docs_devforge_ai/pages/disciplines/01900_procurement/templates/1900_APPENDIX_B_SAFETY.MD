# 05 - Appendix B: Safety Data Sheets (SDS)

## Overview

Appendix B contains Safety Data Sheet (SDS) requirements for all applicable products in the procurement order. This is particularly relevant for lubricants, oils, chemicals, and hazardous materials.

## Document Structure

### SDS Requirements Checklist

The 16-point SDS checklist based on GHS (Globally Harmonized System):

| # | Section | Description |
|---|---------|-------------|
| 1 | Product Identification | Product name, manufacturer, emergency contacts |
| 2 | Hazard Identification | GHS classification, signal words, hazard statements |
| 3 | Composition/Ingredients | Chemical composition, CAS numbers, concentrations |
| 4 | First-Aid Measures | Inhalation, skin contact, eye contact, ingestion |
| 5 | Fire-Fighting Measures | Extinguishing media, special hazards, protective equipment |
| 6 | Accidental Release Measures | Personal precautions, environmental precautions, cleanup |
| 7 | Handling and Storage | Safe handling practices, storage conditions |
| 8 | Exposure Controls/PPE | OELs, engineering controls, personal protection |
| 9 | Physical/Chemical Properties | Appearance, odor, pH, flash point, etc. |
| 10 | Stability and Reactivity | Chemical stability, incompatible materials |
| 11 | Toxicological Information | Health effects, routes of exposure, symptoms |
| 12 | Ecological Information | Environmental impact, persistence, bioaccumulation |
| 13 | Disposal Considerations | Waste disposal methods, regulations |
| 14 | Transport Information | UN number, shipping name, hazard class, packing group |
| 15 | Regulatory Information | Safety, health, environmental regulations |
| 16 | Other Information | Revision date, disclaimer, references |

### Products Requiring SDS Table

| Product | Specification | SDS Status | Action |
|---------|---------------|------------|--------|
| Engine Oil 15W-40 | API CI-4/SL | ⏳ Pending | Request SDS |
| Hydraulic Oil ISO 46 | ISO VG 46 | ⏳ Pending | Request SDS |
| Grease Lithium EP2 | NLGI Grade 2 | ⏳ Pending | Request SDS |

## Data Source Mapping

### From Chat Conversation

```javascript
// SDS requirements auto-detected for materials
const sdsRequired = items.filter(item => 
  item.category?.toLowerCase().includes('lubricant') ||
  item.category?.toLowerCase().includes('oil') ||
  item.category?.toLowerCase().includes('chemical') ||
  item.category?.toLowerCase().includes('hazardous')
);
```

### Conditional Display

```javascript
// Only show SDS tab if applicable products exist
{extractedData.items?.some(item => requiresSDS(item)) && (
  <button onClick={() => setCurrentState('appendix_b')}>
    ⚠️ B - Safety Data Sheets
  </button>
)}
```

## Agent Integration

### Compliance Validation Agent
- Identifies products requiring SDS
- Validates SDS availability
- Flags missing SDS documentation

### Quality Assurance Agent
- Verifies SDS completeness
- Checks GHS compliance
- Validates hazard classifications

## Country-Specific Requirements

### Guinea (CDC + SDS)
- French language SDS required
- GHS compliant labeling
- Customs clearance documentation

### South Africa
- SABS approved SDS
- Occupational Health and Safety Act compliance
- Environmental management requirements

### International
- GHS compliant SDS
- Multi-language support
- Transport regulations (IMDG, IATA)

## Export Options

### PDF Export
- Individual SDS per product
- Combined SDS appendix
- GHS compliant formatting

### Integration
- Link to supplier SDS portal
- Automatic SDS request generation
- Compliance tracking system

## Related Documents

- **SOW Section 6**: Safety and Compliance references
- **Appendix E**: Transport documentation for hazardous materials
- **Appendix F**: Packaging and marking for hazardous materials