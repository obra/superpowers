# Logistics Tracking System - MVP Quick Start Guide

## Overview

This guide provides the minimum data requirements to get your logistics tracking system operational quickly. Focus on these essential elements for your MVP deployment.

## 1. Essential API Credentials

### Minimum Required APIs
**VesselFinder API (for vessel tracking):**
- API Key: 32-character alphanumeric key
- Base URL: `https://api.vesselfinder.com`

**Container Tracking (simplified approach):**
- For MVP, you can manually input container data
- Later integrate with specific shipping line APIs

**Example Credential Format:**
```
VESSELFINDER_API_KEY=your_32_char_key_here
VESSELFINDER_BASE_URL=https://api.vesselfinder.com
```

## 2. Core Shipment Data (Minimum Fields)

### Essential Shipment Information
- **Shipment Number**: Unique identifier (e.g., "SH-2025-001")
- **Shipment Name**: Brief description (e.g., "Guinea Mining Equipment")
- **Origin Port**: Port code (e.g., "CNSHG" for Shanghai)
- **Destination Port**: Port code (e.g., "GUFNA" for Fria, Guinea)
- **Planned Departure Date**: YYYY-MM-DD format
- **Planned Arrival Date**: YYYY-MM-DD format
- **Shipper Name**: Company shipping goods
- **Consignee Name**: Company receiving goods

### Sample Shipment Data:
```csv
shipment_number,shipment_name,origin_port,destination_port,planned_departure_date,planned_arrival_date,shipper_name,consignee_name
SH-2025-001,"Guinea Mining Equipment","CNSHG","GUFNA","2025-09-01","2025-09-20","Shanghai Industrial Co.","Guinea Mining Ltd."
SH-2025-002,"Construction Materials","FRLEH","GUFNA","2025-09-05","2025-09-25","Le Havre Construction","Guinea Infrastructure"
```

## 3. Basic Container Information

### Minimum Container Data
- **Container Number**: Standard ISO format (e.g., "TOLU1234567")
- **Container Size**: "20ft" or "40ft"
- **Cargo Description**: Brief description
- **Booking Reference**: Carrier booking number (if available)

### Sample Container Data:
```csv
container_number,container_size,cargo_description,booking_reference,shipment_number
TOLU1234567,40ft,"Mining Equipment","BOOK-2025-001",SH-2025-001
CMAU7654321,20ft,"Spare Parts","BOOK-2025-001",SH-2025-001
```

## 4. Critical Port Data

### Essential Ports (Minimum Set)
Provide port codes for your key routes:

**Format Required:**
- **Port Code**: 5-character UN/LOCODE
- **Port Name**: Full name
- **Country**: Country name

### Sample Port Data:
```csv
port_code,port_name,country_name
CNSHG,Shanghai,China
GUFNA,Fria,Guinea
FRLEH,Le Havre,France
ZADUR,Durban,South Africa
SGSIN,Singapore,Singapore
```

## 5. Basic Vessel Information (Optional for MVP)

For basic vessel tracking, you'll need:
- **IMO Number**: 7-digit number (e.g., "9234567")
- **Vessel Name**: Full official name
- **Current Position**: Latitude/Longitude (can be updated via API)

## 6. Quick Setup Process

### Step 1: API Credentials
1. Get your VesselFinder API key
2. Test basic connectivity
3. Store in system configuration

### Step 2: Load Port Data
1. Create CSV with essential ports
2. Import into `ports` table
3. Verify port codes are correct

### Step 3: Create Sample Shipments
1. Use the shipment CSV template above
2. Import into `logistics_shipments` table
3. Link to containers using `shipment_containers` table

### Step 4: Basic Testing
1. Verify shipments appear in the UI
2. Check that "Add Shipment" form works
3. Confirm search and filter functionality

## 7. MVP Data Validation Checklist

### Quick Check Items:
- [ ] VesselFinder API key works and returns data
- [ ] Port codes are valid UN/LOCODE format
- [ ] Shipment numbers are unique
- [ ] Container numbers follow ISO standards
- [ ] Dates are in YYYY-MM-DD format
- [ ] All required fields are populated

## 8. Common MVP Issues and Quick Fixes

### API Connection Issues
- Verify API key hasn't expired
- Check internet connectivity
- Confirm base URL is correct

### Data Import Problems
- Check CSV file encoding (use UTF-8)
- Verify column headers match exactly
- Ensure dates are in correct format

### UI Display Issues
- Clear browser cache and refresh
- Check browser console for errors
- Verify all required fields are filled

## Getting Started

1. **Collect API credentials** from VesselFinder
2. **Prepare port data** using the sample format
3. **Create sample shipments** with basic information
4. **Test the system** with the validation checklist
5. **Iterate** based on user feedback

This MVP approach gets you operational quickly. You can add advanced features like detailed cargo tracking, comprehensive alerts, and full API integrations as your system matures.

---

*For advanced integration features, see `docs/logistics-advanced-integration.md`*
