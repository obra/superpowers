etc# Testing Guide: Discipline Handoff System

## Overview

This guide covers testing strategies for the three-discipline handoff architecture (01900 → CDC → 01700).

## Test Files Created

- `server/src/tests/handoff-events.test.js` - Integration tests for handoff events

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- server/src/tests/handoff-events.test.js

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests only
npm test -- --testPathPattern="handoff-events"
```

## Testing Strategy

### 1. Unit Tests (Service Layer)

Test individual service methods in isolation:

```javascript
// Test CDC validation
describe('CDC Submission Service', () => {
  test('should validate CDC submission data', () => {
    const validData = {
      orderId: 'test-order-123',
      destination_country: 'GN',
      importer_nif: '123456789',
      importer_rccm: 'RCCM-12345'
    };
    
    const validation = cdcSubmissionService.validateSubmissionData(validData);
    expect(validation.valid).toBe(true);
  });
});
```

### 2. Integration Tests (API Layer)

Test API endpoints with mock requests:

```javascript
// Test webhook endpoint
describe('POST /api/webhooks/logistics/order-signed', () => {
  test('should accept valid order_signed webhook', async () => {
    const response = await request(app)
      .post('/api/webhooks/logistics/order-signed')
      .send({
        event_type: 'order_signed',
        payload: { order_id: '123', order_number: 'PO-001' }
      });
    
    expect(response.status).toBe(200);
  });
});
```

### 3. End-to-End Tests (Full Workflow)

Test the complete handoff flow:

```javascript
describe('End-to-End Workflow', () => {
  test('should complete full handoff workflow', async () => {
    // 1. Create procurement order
    // 2. Approve order (triggers handoff)
    // 3. Verify CDC submission created
    // 4. Verify logistics workflow initiated
  });
});
```

## Manual Testing Procedures

### Test 1: Database Trigger Verification

```sql
-- Check if trigger exists
SELECT tgname, proname 
FROM pg_trigger t 
JOIN pg_proc p ON t.tgfoid = p.oid 
WHERE tgrelid = 'procurement_orders'::regclass;

-- Test trigger by updating order status
UPDATE procurement_orders 
SET status = 'signed' 
WHERE id = 'test-order-id';

-- Verify event was created
SELECT * FROM discipline_handoff_events 
WHERE event_type = 'order_signed' 
ORDER BY created_at DESC LIMIT 1;
```

### Test 2: Webhook Endpoint Testing

```bash
# Test health endpoint
curl http://localhost:3060/api/webhooks/health

# Test order-signed webhook
curl -X POST http://localhost:3060/api/webhooks/logistics/order-signed \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "order_signed",
    "source_discipline": "01900",
    "target_discipline": "01700",
    "payload": {
      "order_id": "test-123",
      "order_number": "PO-2026-001",
      "supplier_name": "Test Supplier",
      "supplier_country": "CN",
      "delivery_location": "Conakry, Guinea",
      "order_value": 50000,
      "currency": "USD"
    }
  }'

# Test CDC submission endpoint
curl -X POST http://localhost:3060/api/cdc/submission \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-123",
    "destination_country": "GN",
    "importer_nif": "123456789",
    "importer_rccm": "RCCM-12345",
    "customs_office": "CKY"
  }'
```

### Test 3: Event Bus Testing

```javascript
// In Node.js REPL or test file
import eventBus from './server/src/services/event-bus.js';

// Subscribe to test event
eventBus.subscribe('test_event', (event) => {
  console.log('Received event:', event);
});

// Publish test event
await eventBus.publish('test_event', { test: 'data' }, {
  sourceDiscipline: '01900',
  targetDiscipline: '01700'
});
```

## Test Scenarios

### Scenario 1: Order Approval Handoff

1. Create procurement order in database
2. Update order status to 'signed'
3. Verify `discipline_handoff_events` record created
4. Verify event payload contains correct order data

### Scenario 2: CDC Submission Flow

1. Create CDC submission via API
2. Verify submission stored in database
3. Submit to customs via API
4. Verify status updated to 'submitted'
5. Verify customs reference generated

### Scenario 3: DDI Threshold Check

1. Create order below DDI threshold (< $1,250)
2. Verify DDI not required
3. Create order above DDI threshold (> $1,250)
4. Verify DDI required flag set

### Scenario 4: Error Handling

1. Submit invalid CDC data
2. Verify validation errors returned
3. Submit duplicate CDC submission
4. Verify conflict error returned

## Test Data Setup

### Create Test Order

```sql
INSERT INTO procurement_orders (
  id, order_number, supplier_name, supplier_country,
  delivery_location, total_value, currency, status
) VALUES (
  'test-order-001',
  'PO-TEST-001',
  'Test Supplier',
  'CN',
  'Conakry, Guinea',
  50000,
  'USD',
  'pending'
);
```

### Create Test CDC Submission

```sql
INSERT INTO cdc_submissions (
  procurement_order_id, destination_country,
  importer_nif, importer_rccm, customs_office,
  submission_status
) VALUES (
  'test-order-001',
  'GN',
  '123456789',
  'RCCM-TEST-001',
  'CKY',
  'draft'
);
```

## Performance Testing

### Load Test Webhooks

```bash
# Using Apache Bench
ab -n 100 -c 10 -p webhook-payload.json -T application/json \
  http://localhost:3060/api/webhooks/logistics/order-signed

# Using curl in loop
for i in {1..10}; do
  curl -X POST http://localhost:3060/api/webhooks/logistics/order-signed \
    -H "Content-Type: application/json" \
    -d @webhook-payload.json &
done
wait
```

## Monitoring During Tests

### Check Event Queue

```sql
SELECT 
  event_type,
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM discipline_handoff_events
GROUP BY event_type, status
ORDER BY event_type, status;
```

### Check Failed Events

```sql
SELECT * FROM discipline_handoff_events 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Check CDC Submissions

```sql
SELECT 
  submission_status,
  COUNT(*) as count
FROM cdc_submissions
GROUP BY submission_status;
```

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Test Coverage Goals

- **Event Bus**: 90% coverage
- **Handoff Events Service**: 85% coverage
- **CDC Submission Service**: 85% coverage
- **Webhook Routes**: 80% coverage
- **CDC Routes**: 80% coverage

## Troubleshooting

### Tests Failing Due to Database Connection

1. Verify `.env` file has correct Supabase credentials
2. Check network connectivity to Supabase
3. Verify database tables exist

### Tests Failing Due to Missing Dependencies

```bash
npm install --legacy-peer-deps
```

### Tests Timing Out

Increase Jest timeout in test file:

```javascript
jest.setTimeout(30000); // 30 seconds
```

## Next Steps

1. Run the test suite: `npm test`
2. Review test coverage report
3. Add additional test cases for edge scenarios
4. Set up CI/CD pipeline integration
5. Monitor test results in production