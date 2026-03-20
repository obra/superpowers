# 06 - Appendix C: Delivery Schedule

## Overview

Appendix C contains the delivery schedule and milestones for the procurement order. It defines key dates, delivery requirements, and tracking information.

## Document Structure

### Delivery Timeline Table

| Milestone | Target Date | Status | Notes |
|-----------|-------------|--------|-------|
| Contract Award | [Date] | ⏳ Pending | Order #[order_number] |
| Initial Delivery | [Timeline] | ⏳ Pending | First shipment |
| Final Delivery | Per agreement | ⏳ Pending | Complete order fulfillment |
| Training Completion | Per agreement | ⏳ Pending | If applicable |

### Delivery Requirements Section

| Field | Data Source | Example |
|-------|-------------|---------|
| Destination | `destination_country.name` | Guinea |
| Incoterm | Static | DAP (Delivered at Place) |
| Timeline | `timeline.timeframe` | Standard (2-4 weeks) |
| CDC Required | `cdc_required` | Yes - Guinea customs |

## Data Source Mapping

### From Chat Conversation

```javascript
// Timeline selection in Step 16
const timelineOptions = {
  1: { value: "Urgent", timeframe: "1-2 weeks" },
  2: { value: "Standard", timeframe: "2-4 weeks" },
  3: { value: "This month", timeframe: "Within 30 days" },
  4: { value: "This quarter", timeframe: "Within 90 days" }
};

// Extracted data
const deliveryData = {
  timeline: timelineOptions[userSelection],
  destination: extractedData.destination_country,
  cdc_required: extractedData.cdc_required
};
```

### Milestone Calculation

```javascript
// Calculate milestone dates based on timeline
const calculateMilestones = (orderDate, timeline) => {
  const baseDate = new Date(orderDate);
  
  return {
    contractAward: addDays(baseDate, 2),
    manufacturing: addDays(baseDate, getTimelineDays(timeline)),
    shipping: addDays(baseDate, getTimelineDays(timeline) + 7),
    delivery: addDays(baseDate, getTimelineDays(timeline) + 14),
    installation: addDays(baseDate, getTimelineDays(timeline) + 21)
  };
};
```

## Agent Integration

### Assignment Agent
- Calculates milestone dates
- Assigns delivery responsibilities
- Routes for approval scheduling

### Compliance Validation Agent
- Validates CDC timeline requirements
- Checks customs clearance lead times
- Flags expedited delivery risks

## Country-Specific Requirements

### Guinea (CDC Required)
- Additional 5-7 days for customs clearance
- CDC documentation must be complete before shipping
- Importer NIF verification required

### South Africa (Local)
- Standard delivery timelines
- No customs delays
- Local supplier coordination

### International
- Incoterm-specific responsibilities
- Export documentation timeline
- Freight forwarding coordination

## Export Options

### PDF Export
- Gantt chart visualization
- Milestone timeline
- Delivery checklist

### Calendar Integration
- iCal/Outlook export
- Milestone reminders
- Delivery tracking links

## Related Documents

- **SOW Section 10**: Timeline and Milestones
- **Appendix E**: Logistics documentation
- **Appendix F**: Packaging for delivery