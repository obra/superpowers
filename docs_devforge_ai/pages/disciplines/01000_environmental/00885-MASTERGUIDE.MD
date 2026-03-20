# 1300_00885_MASTER_GUIDE.md - Director HSE Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Director HSE Guide

## Overview
Health, Safety, and Environment department leadership and compliance oversight.

## Page Structure
**File Location:** `client/src/pages/00885-dir-hse`
```javascript
export default function DirHSEPage() {
  return (
    <LeadershipLayout>
      <SafetyOversight />
      <HealthManagement />
      <EnvironmentalCompliance />
      <IncidentReporting />
    </LeadershipLayout>
  );
}
```

## Requirements
1. Use 00885-series director components (00885-00885)
2. Implement safety oversight system
3. Support health management workflows
4. Maintain environmental compliance tools

## Implementation
```bash
node scripts/leadership/setup-hse.js --director-config
```

## Related Documentation
- [3500_HSE_LEADERSHIP.md](../docs/3500_HSE_LEADERSHIP.md)
- [3600_SAFETY_COMPLIANCE.md](../docs/3600_SAFETY_COMPLIANCE.md)

## Status
- [x] Core HSE leadership framework
- [ ] Safety oversight
- [ ] Health management
- [ ] Environmental compliance

## Version History
- v1.0 (2025-08-27): Initial director HSE structure
