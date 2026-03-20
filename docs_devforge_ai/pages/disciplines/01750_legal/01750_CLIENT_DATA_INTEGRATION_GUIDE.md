# Logistics Tracking System - Client Data Integration Guide

## Overview

This guide provides detailed instructions for collecting the necessary data and credentials required to integrate your logistics tracking system with real shipping data. The system supports integration with vessel tracking APIs (like VesselFinder) and container tracking services from various shipping lines.

## 1. API Credentials and Access Information

### VesselFinder API Integration
**Required Information:**
- **API Key**: Your VesselFinder API key (typically 32-character alphanumeric)
- **Account ID**: Your VesselFinder account identifier
- **Base URL**: API endpoint (usually `https://api.vesselfinder.com`)
- **Rate Limits**: Document your account's rate limits (requests per minute/hour)

**Example Format:**
```
API_PROVIDER: VESSELFINDER
API_KEY: abc123def456ghi789jkl012mno345pqr
BASE_URL: https://api.vesselfinder.com
RATE_LIMIT_PER_MINUTE: 60
```

### Container Tracking API Integration
**Multiple providers may be used:**
- **Shipping Line APIs**: Each shipping line may have different credentials
- **Container Tracking Services**: Third-party tracking platforms
- **Custom Tracking Systems**: Client's proprietary tracking systems

**Required Information per Provider:**
- API Key or Token
- Account/Client ID
- Username/Password (if required)
- Base URL for API endpoints
- Supported container number formats

## 2. Vessel Data Requirements

### Core Vessel Identification
- **IMO Number**: 7-digit unique identifier (e.g., `9234567`)
- **MMSI Number**: 9-digit Maritime Mobile Service Identity (e.g., `123456789`)
- **Vessel Name**: Full official vessel name
- **Call Sign**: Radio call sign (if available)

### Vessel Specifications
- **Vessel Type**: Container ship, bulk carrier, tanker, etc.
- **Flag Country**: Country of registry
- **Gross Tonnage**: Total vessel weight capacity
- **Deadweight Tonnage**: Cargo weight capacity
- **Length Overall**: Vessel length in meters
- **Beam**: Vessel width in meters

### Position and Status Data
- **Current Latitude/Longitude**: Decimal degrees (e.g., `-25.7685`, `28.3264`)
- **Speed**: Current speed in knots
- **Course**: Current heading in degrees
- **Status**: Current operational status
- **Destination**: Next port of call
- **ETA**: Estimated Time of Arrival at destination

## 3. Container Tracking Data

### Container Identification
- **Container Number**: Standard ISO container number (e.g., `TOLU1234567`)
- **Container Type**: Dry, reefer, flat rack, open top, etc.
- **Container Size**: 20ft, 40ft, 45ft, etc.
- **ISO Code**: Standard container type code (e.g., `22G1`, `45R1`)

### Cargo Information
- **Cargo Description**: Brief description of contents
- **Cargo Weight**: Weight in kilograms or metric tons
- **Cargo Value**: Commercial value with currency
- **Tare Weight**: Empty container weight
- **Max Payload**: Maximum cargo weight capacity

### Shipping Details
- **Booking Reference**: Carrier booking number
- **Bill of Lading**: Master or house B/L number
- **Shipper Name**: Company shipping the goods
- **Consignee Name**: Company receiving the goods
- **Notify Party**: Party to be notified of arrival

### Route Information
- **Port of Loading**: UN/LOCODE of origin port (e.g., `CNSHG` for Shanghai)
- **Port of Discharge**: UN/LOCODE of destination port (e.g., `ZADUR` for Durban)
- **Final Destination**: Inland destination if applicable
- **Estimated Arrival**: Expected arrival date/time
- **Actual Arrival**: Confirmed arrival date/time

## 4. Shipment Data Structure

### Shipment Identification
- **Shipment Number**: Unique internal reference number
- **Shipment Name**: Descriptive shipment name
- **Shipment Type**: IMPORT, EXPORT, or TRANSSHIPMENT

### Commercial Information
- **Total Value**: Overall shipment value with currency
- **Incoterms**: International Commercial Terms (FOB, CIF, CFR, etc.)
- **Payment Terms**: Credit terms (30 Days, 60 Days, etc.)
- **Insurance Reference**: Insurance policy number

### Parties Information
- **Shipper Details**: Full name and address
- **Consignee Details**: Full name and address
- **Freight Forwarder**: Forwarding agent details
- **Notify Party**: Notification contact details

### Timeline Data
- **Booking Date**: Date shipment was booked
- **Planned Departure**: Scheduled departure date
- **Actual Departure**: Confirmed departure date
- **Planned Arrival**: Scheduled arrival date
- **Actual Arrival**: Confirmed arrival date

## 5. Port and Terminal Reference Data

### Port Codes (UN/LOCODE Format)
**Required Information:**
- **Port Code**: 5-character UN/LOCODE (e.g., `ZADUR` for Durban)
- **Port Name**: Full official port name
- **Country Code**: 2-letter ISO country code
- **Country Name**: Full country name
- **Latitude/Longitude**: Port coordinates
- **Time Zone**: Standard time zone identifier

### Sample Port Data Structure:
```
PORT_CODE: ZADUR
PORT_NAME: Durban
COUNTRY_CODE: ZA
COUNTRY_NAME: South Africa
LATITUDE: -29.858680
LONGITUDE: 31.021840
TIME_ZONE: Africa/Johannesburg
```

## 6. Client Configuration and Security

### Organization Context
- **Company ID**: Internal company identifier
- **Organisation ID**: Business unit or division identifier
- **Project ID**: Specific project or campaign identifier

### User Access Control
- **User Roles**: Administrator, Operator, Viewer, etc.
- **Permission Levels**: Read, Write, Delete access levels
- **Authentication Method**: SSO, API tokens, username/password

### Data Security Requirements
- **Encryption Standards**: Required encryption for data transmission
- **Data Retention**: How long to keep tracking data
- **Compliance Requirements**: GDPR, local regulations, etc.

## 7. Data Integration Process

### Step 1: API Credential Setup
1. Collect all API credentials from the client
2. Test connectivity to each API endpoint
3. Document rate limits and usage quotas
4. Set up credential storage in `logistics_api_credentials` table

### Step 2: Port Data Import
1. Provide client with port code reference list
2. Collect any additional ports not in standard database
3. Import port data into `ports` table
4. Validate coordinates and time zones

### Step 3: Initial Shipment Data Load
1. Collect existing shipment data in CSV format
2. Map client fields to system fields
3. Validate data quality and completeness
4. Import into `logistics_shipments` table

### Step 4: Container and Vessel Linking
1. Link containers to shipments using `shipment_containers` table
2. Associate vessels with containers where applicable
3. Set up real-time tracking data feeds
4. Configure alert triggers and notifications

## 8. Data Validation Checklist

### Required Fields Validation
- [ ] All API credentials provided and tested
- [ ] Vessel IMO/MMSI numbers are valid
- [ ] Container numbers follow ISO standards
- [ ] Port codes use UN/LOCODE format
- [ ] Currency codes are ISO 4217 compliant
- [ ] Date formats are ISO 8601 (YYYY-MM-DD)

### Data Quality Checks
- [ ] No duplicate vessel/container numbers
- [ ] All required fields populated
- [ ] Coordinates within valid ranges
- [ ] Dates are logical (departure before arrival)
- [ ] Currency values are positive numbers

## 9. Testing and Validation

### API Integration Testing
1. Test vessel position updates
2. Verify container tracking data flow
3. Check alert generation and notification
4. Validate rate limit handling

### Data Integrity Testing
1. Verify shipment-container relationships
2. Check vessel-container associations
3. Test search and filter functionality
4. Validate dashboard statistics

### Performance Testing
1. Load test with sample data volumes
2. Check response times for API calls
3. Validate database query performance
4. Test concurrent user access

## 10. Ongoing Maintenance

### Data Refresh Requirements
- **Vessel Data**: Real-time updates every 15-30 minutes
- **Container Tracking**: Updates every 1-4 hours depending on provider
- **Shipment Status**: Daily updates for active shipments
- **Port Information**: Quarterly updates for changes

### Monitoring and Alerts
- **API Health**: Monitor API connectivity and response times
- **Data Quality**: Alert on missing or invalid data
- **Rate Limits**: Monitor API usage against limits
- **System Performance**: Track database and application performance

## 11. Troubleshooting Common Issues

### API Connection Problems
- Verify API key validity and permissions
- Check rate limit usage and reset times
- Confirm base URLs and endpoint paths
- Validate SSL certificates and network connectivity

### Data Mapping Issues
- Check field mappings between client and system data
- Verify data format conversions (dates, numbers, etc.)
- Validate container and vessel number formats
- Confirm currency and unit conversions

### Performance Issues
- Review database query performance
- Check API response times and timeouts
- Monitor system resource usage
- Optimize data loading and caching strategies

## 12. Support and Documentation

### Client Contact Information
- **Primary Technical Contact**: Name, email, phone
- **Secondary Contact**: Backup contact information
- **Support Hours**: Available support window
- **Escalation Process**: Issue escalation procedures

### Documentation Requirements
- **API Documentation**: Links to provider API docs
- **Data Dictionary**: Field definitions and formats
- **Process Documentation**: Business process workflows
- **Training Materials**: User guides and tutorials

---

*This guide ensures comprehensive data collection for full operational integration of the logistics tracking system with real client shipping data.*
