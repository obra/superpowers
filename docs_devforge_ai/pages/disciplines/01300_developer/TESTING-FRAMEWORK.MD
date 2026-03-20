# ConstructAI Testing Framework

## Overview

This document formalizes the testing process for ConstructAI, ensuring scalable, maintainable, and comprehensive test coverage while preserving existing UI functionality.

## Testing Principles

1. **No UI Regression** - All tests must preserve existing UI functionality
2. **Discipline-Based Organization** - Tests organized by discipline code (01900, 02400, etc.)
3. **ES Module Compliance** - All new tests use ES module syntax
4. **Separation of Concerns** - Unit, Integration, and E2E tests are clearly separated

## Test Directory Structure

```
/server/src/tests/                    # PRIMARY TEST LOCATION
├── README.md                         # Test documentation
├── 01900_procurement/                # Procurement discipline tests
│   ├── README.md
│   ├── document-compilation.test.js  # Document compilation tests
│   ├── handoff-events.test.js        # Handoff event tests
│   └── order-creation.test.js        # Order creation tests
├── 02400_safety/                     # Safety discipline tests
│   ├── README.md
│   └── vector-isolation-integration.test.js
├── integration/                      # Integration tests
├── unit/                             # Unit tests
├── fixtures/                         # Test fixtures
└── *.test.js                         # Root-level tests

/test/                                # LEGACY: Test infrastructure
├── fixtures/                         # Shared fixtures
├── test-data/                        # Test data files
├── test-results/                     # Test output
└── utils/                            # Test utilities

/scripts/test-runners/                # Test runner scripts (NOT Jest tests)
└── 149 test scripts                  # Ad-hoc test/debug scripts
```

## Test Categories

### 1. Unit Tests
- Test individual functions and modules
- No external dependencies
- Fast execution (< 100ms per test)
- Located in `/server/src/tests/unit/`

### 2. Integration Tests
- Test API endpoints
- Database interactions (Supabase)
- May require test database connection
- Located in `/server/src/tests/integration/`

### 3. E2E Tests
- Full workflow tests
- Multiple components
- May be skipped if database not available
- Located in `/server/src/tests/{discipline}/`

### 4. UI Tests
- Test UI components without breaking existing functionality
- Use jsdom environment
- Located in `/test/` (legacy) or `/server/src/tests/`

## Running Tests

```bash
# All server tests (recommended)
cd server && npm test

# Specific test patterns
npm run test:procurement   # Procurement tests
npm run test:handoff       # Handoff event tests
npm run test:documents     # Document compilation tests

# With coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Writing New Tests

### Template for New Tests

```javascript
/**
 * Test Description
 * 
 * @jest-environment node
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeAll(() => {
    // Setup
  });

  afterAll(() => {
    // Cleanup
  });

  describe('Sub-feature', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = doSomething(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Discipline Test | `{discipline}_{feature}.test.js` | `01900_order_creation.test.js` |
| Unit Test | `{module}.unit.test.js` | `supabaseClient.unit.test.js` |
| Integration Test | `{feature}.integration.test.js` | `api-routes.integration.test.js` |
| E2E Test | `{workflow}.e2e.test.js` | `procurement-workflow.e2e.test.js` |

## Test Coverage Requirements

### Minimum Coverage by Category

| Category | Minimum Coverage |
|----------|------------------|
| Critical Paths | 90% |
| API Routes | 80% |
| Business Logic | 75% |
| UI Components | 60% |

### Coverage Commands

```bash
# Generate coverage report
cd server && npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## UI Testing Guidelines

### Preserving Existing UI

1. **Snapshot Testing** - Use for UI components
   ```javascript
   expect(component).toMatchSnapshot();
   ```

2. **Visual Regression** - Compare before/after screenshots

3. **Accessibility Testing** - Ensure a11y compliance
   ```javascript
   import { axe } from 'jest-axe';
   expect(await axe(container)).toHaveNoViolations();
   ```

### UI Test Template

```javascript
/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Component from './Component';

describe('Component', () => {
  test('renders without crashing', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<Component />);
    
    await user.click(screen.getByRole('button'));
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Database Testing

### Test Database Setup

1. Use separate test database or schema
2. Clean up test data after each test
3. Use transactions for rollback

```javascript
describe('Database Tests', () => {
  let supabase;

  beforeAll(async () => {
    supabase = createTestClient();
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('test_table').delete().eq('test', true);
  });

  beforeEach(async () => {
    // Reset test state
  });
});
```

## Mocking Guidelines

### External Services

```javascript
// Mock Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({ data: [], error: null }))
      }))
    }))
  }
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() => ({ choices: [{ message: { content: 'test' } }] }))
      }
    }
  }))
}));
```

## CI/CD Integration

### GitHub Actions

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
          node-version: '22'
      - run: npm ci
      - run: cd server && npm test
      - run: npm run test:coverage
```

## Test Data Management

### Fixtures Location
- `/server/src/tests/fixtures/` - Server test fixtures
- `/test/fixtures/` - Shared fixtures
- `/test/test-data/` - Test data files

### Creating Test Data

```javascript
// fixtures/procurementOrder.js
export const mockProcurementOrder = {
  id: 'test-order-001',
  order_number: 'PO-2026-TEST-001',
  title: 'Test Order',
  items: [
    { description: 'Item 1', quantity: 1, rate: 100, amount: 100 }
  ],
  template_name: 'standard_po',
  template_type: 'purchase_order',
  metadata: { extraction_confidence: 0.95 }
};
```

## Troubleshooting

### Common Issues

1. **ES Module Errors**
   - Use `import` instead of `require`
   - Add `.cjs` extension for CommonJS files
   - Import from `@jest/globals`

2. **Jest Configuration Issues**
   - Check `server/jest.config.js`
   - Ensure `testEnvironment` is set correctly
   - Verify `transformIgnorePatterns`

3. **Database Connection Issues**
   - Check `.env.dev` for credentials
   - Verify Supabase URL and keys
   - Use test database when possible

## Related Documentation

- [Workflow Optimization Guide](../deep-agents/docs/0000_WORKFLOW_OPTIMIZATION_GUIDE.md)
- [Procurement Testing Guide](../docs/workflows/01900_PROCUREMENT_COMPREHENSIVE_WORKFLOW/01900_TESTING_GUIDE_HANDOFF_SYSTEM.md)
- [File Naming Standards](../docs/standards/0002_FILE_NAMING_STANDARDS.md)