# @construct-ai/error-tracking SDK Usage Guide

*Complete SDK Documentation - Enterprise Error Monitoring for Applications*

---

## 📋 **SDK Overview**

The **@construct-ai/error-tracking** SDK provides comprehensive enterprise-grade error tracking and monitoring for web applications. Built as part of the Phase 4.2 Real-Time Processing Pipeline, it offers zero-config error capture, intelligent categorization, AI-powered alerting, and GDPR-compliant data handling.

## 🎯 **Key Features**

- 🚀 **Zero-Configuration Setup** - Automatic error capture out-of-the-box
- 🧠 **AI-Powered Categorization** - Intelligent error classification and correlation
- ⚡ **Real-Time Multi-Channel Alerts** - Slack, Email, SMS, and On-call notifications
- 🏢 **Enterprise Compliance** - PII sanitization, GDPR/HIPAA support
- 🔍 **Error Similarity Matching** - Cryptographic fingerprinting for pattern detection
- 📱 **Framework Agnostic** - React, Vue, Angular, Vanilla JS support
- 🔧 **TypeScript Ready** - Full type definitions included
- 📦 **Production Optimized** - Tiny bundle size (< 10KB gzipped)

## 📦 **Installation & Setup**

### **NPM Installation**
```bash
# Global installation
npm install @construct-ai/error-tracking

# Yarn
yarn add @construct-ai/error-tracking

# PNPM
pnpm add @construct-ai/error-tracking
```

### **Basic Configuration**
```javascript
import { ErrorTracker } from '@construct-ai/error-tracking';

// Minimal setup for automatic error capture
const tracker = new ErrorTracker({
  apiUrl: 'https://your-api.com/api/errors',
  environment: 'production'
});

// That's it - automatic error capturing is now active!
```

### **Complete Configuration**
```javascript
const tracker = new ErrorTracker({
  // Required
  apiUrl: 'https://your-api.com/api/errors',

  // Environment & metadata
  environment: 'production',
  release: '1.2.3',
  apiKey: 'your-api-key',

  // Auto-capture settings (all enabled by default)
  enableUnhandledError: true,      // window.onerror events
  enableUnhandledRejection: true,  // Promise rejections
  enableNetworkError: true,        // HTTP failures
  enablePerformance: false,        // Performance monitoring

  // Batching & timing
  batchSize: 10,                   // Errors per batch
  flushInterval: 30000,           // Send every 30 seconds

  // Privacy & compliance
  sanitizeFields: ['password', 'token', 'secret'],
  enablePII: true,

  // Advanced callbacks
  beforeSend: (error, context) => {
    // Filter or modify errors before sending
    if (error.message?.includes('development')) {
      return null; // Don't send dev errors
    }
    return error;
  }
});
```

## 🎛️ **Framework Integrations**

### **React Applications**

#### **Standard React Setup**
```jsx
import { ErrorTracker } from '@construct-ai/error-tracking';

function App() {
  const [tracker] = useState(() => new ErrorTracker({
    apiUrl: process.env.REACT_APP_ERROR_API,
    environment: process.env.NODE_ENV,
    enablePerformance: true
  }));

  return <MyApp />;
}

export default App;
```

#### **React Provider Pattern**
```jsx
import { ErrorTrackerProvider, useErrorTracker } from '@construct-ai/error-tracking';

function App() {
  return (
    <ErrorTrackerProvider config={trackerConfig}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <MyApp />
      </ErrorBoundary>
    </ErrorTrackerProvider>
  );
}

// In components
function CheckoutButton() {
  const tracker = useErrorTracker();

  const handlePayment = async () => {
    try {
      await processPayment();
    } catch (error) {
      // Automatic capture via global handlers, OR
      tracker.capture(error, {
        tags: { feature: 'payment', step: 'checkout' },
        extra: { cartTotal: 99.99 }
      });
    }
  };

  return <button onClick={handlePayment}>Pay $99.99</button>;
}
```

#### **React Error Boundaries**
```jsx
import { ErrorBoundary, useErrorTracker } from '@construct-ai/error-tracking';

function ErrorBoundary({ children }) {
  const tracker = useErrorTracker();

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h2>Something went wrong!</h2>
          {/* Error already captured automatically */}
          <button onClick={resetError}>Try again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### **Vue.js Applications**

#### **Vue 3 Composition API**
```javascript
import { ErrorTracker } from '@construct-ai/error-tracking';
import { createApp } from 'vue';

const app = createApp(App);
const tracker = new ErrorTracker({
  apiUrl: import.meta.env.VITE_ERROR_API,
  environment: import.meta.env.MODE,
  vue: {
    app,
    router: app.config.globalProperties.$router
  }
});

// Global injection
app.provide('errorTracker', tracker);

// In components
export default {
  name: 'PaymentForm',
  inject: ['errorTracker'],
  methods: {
    async submitPayment() {
      try {
        await this.processPayment();
      } catch (error) {
        this.errorTracker.capture(error, {
          component: 'PaymentForm',
          action: 'submit'
        });
      }
    }
  }
};
```

#### **Vue 3 Options API**
```javascript
import { ErrorTracker } from 'vue-error-tracker';

export default {
  data() {
    return {
      tracker: new ErrorTracker({
        apiUrl: process.env.VUE_APP_ERROR_API || '/api/errors',
        environment: process.env.NODE_ENV
      })
    };
  },
  methods: {
    handleError(error) {
      this.tracker.capture(error, {
        component: this.$options.name,
        route: this.$route.path
      });
    }
  }
};
```

### **Angular Applications**
```typescript
import { ErrorHandler } from '@angular/core';
import { ErrorTracker } from '@construct-ai/error-tracking';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private tracker: ErrorTracker;

  constructor() {
    this.tracker = new ErrorTracker({
      apiUrl: environment.errorApiUrl,
      environment: environment.production ? 'production' : 'development'
    });
  }

  handleError(error: any): void {
    // Angular's global error handler automatically captures unhandled errors
    // Additional custom error capture:
    this.tracker.capture(error.rejection || error, {
      framework: 'Angular',
      version: environment.appVersion
    });
  }
}

// In app.module.ts
providers: [
  {
    provide: ErrorHandler,
    useClass: GlobalErrorHandler
  }
]
```

### **Vanilla JavaScript**
```javascript
// After DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const tracker = new ErrorTracker({
    apiUrl: '/api/errors',
    environment: window.location.hostname.includes('localhost')
      ? 'development'
      : 'production'
  });

  // Manual error capture
  window.addCustomError = (error, context) => {
    tracker.capture(error, {
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  // Performance monitoring
  tracker.setContext('app', {
    version: '1.2.3',
    loadedAt: new Date().toISOString()
  });
});
```

## 🔧 **SDK API Reference**

### **Core Methods**

#### **`new ErrorTracker(config)`**
Creates a new error tracker instance.

**Parameters:**
- `config` (object) - Configuration object (see Configuration section)
- `return` (ErrorTracker) - Tracker instance

#### **`tracker.capture(error, options)`**
Manually captures an error with additional context.

```javascript
tracker.capture(new Error('Something went wrong'), {
  // Optional enhancement
  tags: { feature: 'login', step: 'authentication' },
  extra: { userId: user.id, timestamp: Date.now() },
  level: 'error' // critical | high | medium | low
});
```

#### **`tracker.setUser(user)`**
Sets user context for all subsequent errors.

```javascript
tracker.setUser({
  id: 'user123',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'admin'
});
```

#### **`tracker.setTags(tags)`**
Sets global tags for all errors.

```javascript
tracker.setTags({
  version: '2.1.0',
  environment: 'production',
  region: 'us-east-1'
});
```

#### **`tracker.addBreadcrumb(message, level, data)`**
Adds breadcrumb context for debugging.

```javascript
tracker.addBreadcrumb('User initiated payment', 'info', {
  amount: 99.95,
  paymentMethod: 'credit_card'
});
```

#### **`tracker.setContext(key, value)`**
Sets arbitrary context data.

```javascript
tracker.setContext('session', {
  duration: 15, // minutes
  pagesViewed: 5,
  lastActivity: new Date().toISOString()
});
```

### **Configuration Options**

#### **Core Configuration**
```typescript
interface ErrorTrackerConfig {
  // Required
  apiUrl: string;                    // API endpoint URL

  // Environment
  environment?: string;              // 'development' | 'production'
  release?: string;                  // Application version
  apiKey?: string;                   // Authentication key

  // Auto-capture (all default to true except performance)
  enableUnhandledError?: boolean;    // window.onerror
  enableUnhandledRejection?: boolean; // Promise rejections
  enableNetworkError?: boolean;      // HTTP failures
  enablePerformance?: boolean;       // Performance monitoring

  // Batching
  batchSize?: number;                // Errors per batch (default: 10)
  flushInterval?: number;            // Milliseconds (default: 30000)

  // Privacy
  sanitizeFields?: string[];         // Additional fields to sanitize
  enablePII?: boolean;               // Enable PII detection

  // Framework-specific
  react?: ReactConfig;
  vue?: VueConfig;
  angular?: AngularConfig;

  // Callbacks
  beforeSend?: (error, context) => Error | null;
  onError?: (error) => void;
}
```

## 🔒 **Security & Compliance**

### **PII Automatic Sanitization**

The SDK automatically detects and masks sensitive data:

```javascript
// Original data in error context
const userData = {
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  ssn: '123-45-6789',
  token: 'sk_abc123def456',
  password: 'secret123'
};

// Automatically sanitized to:
const sanitized = {
  email: '[EMAIL]',
  phone: '[PHONE]',
  ssn: '[SSN]',
  token: '[TOKEN]',
  password: '*'.repeat('secret123'.length) // *********
};
```

### **Custom Sanitizers**

```javascript
const tracker = new ErrorTracker({
  apiUrl: '...',
  sanitizeFields: ['companyId', 'internalCode', 'confidential'],

  customSanitizer: (key, value) => {
    if (key === 'privateData') {
      return '[COMPANY_PRIVATE]';
    }
    if (typeof value === 'object' && value.sensitive) {
      return '[SENSITIVE_OBJECT]';
    }
    return value;
  }
});
```

### **GDPR Compliance**

```javascript
const tracker = new ErrorTracker({
  apiUrl: '...',
  enablePII: true,

  beforeSend: (error, context) => {
    // Check user consent before sending
    if (!userHasConsented()) {
      return null; // Don't send error
    }

    // Remove additional sensitive data
    delete error.context.internalUserId;
    delete error.context.financialData;

    return error;
  }
});
```

## 🌐 **Error Enrichment**

Errors are automatically enriched with contextual data:

### **Browser Context**
- User Agent, URL, referrer
- Viewport dimensions, screen size
- Browser and OS information

### **Performance Data**
- Page load times, DOM ready
- Memory usage, JavaScript heap
- Network connection type and speed

### **Application Context**
- Error timestamp and sequence
- Call stack traces (sanitized)
- Previous breadcrumbs
- Custom context and tags

### **Framework Context**
```javascript
// React
{
  componentStack: 'App > CheckoutForm > PaymentButton',
  hookStates: { counter: 5 },
  props: { amount: 99.95 }
}

// Vue
{
  componentName: 'CheckoutForm',
  route: '/checkout',
  vueVersion: '3.2.0'
}

// Angular
{
  componentName: 'PaymentComponent',
  ngZoneState: 'stable',
  changeDetection: 'Default'
}
```

## 📊 **Error Types & Handling**

### **Automatic Capture Types**

#### **JavaScript Errors**
```javascript
// Syntax errors, reference errors, type errors
undefinedVariable.someMethod(); // ReferenceError
null.someProperty;              // TypeError
const x = ;                     // SyntaxError
```

#### **Promise Rejections**
```javascript
fetch('/api/data')
  .then(response => {
    if (!response.ok) throw new Error('API failed');
  })
  .catch(error => {
    // Automatically captured
    console.error(error);
  });

// OR

async function loadData() {
  try {
    const data = await fetch('/api/data');
  } catch (error) {
    // Also automatically captured
    throw error;
  }
}
```

#### **Network Errors**
```javascript
// HTTP errors (4xx, 5xx)
fetch('/api/user/profile')
  .then(response => {
    if (response.status === 404) {
      throw new Error('User not found');
    }
  });

// Slow requests (configurable threshold)
const slowRequest = await fetch('/api/large-export');
// Configured threshold: >10s triggers performance error
```

#### **Resource Loading Errors**
```html
<!-- These automatically trigger resource errors -->
<img src="missing-image.jpg" onerror="/* captured */" />
<script src="broken-script.js" onerror="/* captured */"></script>
<link href="missing-css.css" onerror="/* captured */" />
```

### **Manual Error Capture**

#### **Custom Errors**
```javascript
import { CustomError } from './errors';

class BusinessLogicError extends CustomError {
  constructor(message, code, context) {
    super(message);
    this.name = 'BusinessLogicError';
    this.code = code;
    this.context = context;
  }
}

// SDK automatically detects custom error types
throw new BusinessLogicError(
  'Invalid payment amount',
  'PAYMENT_001',
  { orderId: '12345', amount: 0 }
);
```

#### **Exception Handling**
```javascript
function processPayment(amount, userId) {
  try {
    validateAmount(amount);
    chargeUser(amount, userId);
    updateDatabase(amount, userId);

  } catch (error) {
    // Don't just log - capture for analysis
    tracker.capture(error, {
      tags: { operation: 'payment', userId },
      extra: { amount, timestamp: new Date() }
    });

    // Then handle the error
    notifyUser('Payment failed');
  }
}
```

## 🎯 **Best Practices**

### **Configuration for Production**

```javascript
const isProduction = process.env.NODE_ENV === 'production';

const tracker = new ErrorTracker({
  apiUrl: process.env.ERROR_TRACKING_API_URL,

  // Production optimizations
  environment: 'production',
  batchSize: 50,
  flushInterval: 15000, // 15 seconds

  // Compliance
  enablePII: true,
  sanitizeFields: ['apiKey', 'sessionToken', 'privateId'],

  // Error filtering
  beforeSend: (error) => {
    // Don't send development/test errors
    if (error.message?.includes('test')) return null;
    if (error.tags?.includes('development')) return null;

    return error;
  }
});
```

### **User Context Management**
```javascript
class UserManager {
  static setUser(user) {
    tracker.setUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionType: user.plan
    });
  }

  static setCompany(company) {
    tracker.setContext('company', {
      id: company.id,
      name: company.name,
      industry: company.industry,
      size: company.employeeCount
    });
  }
}

// App startup
UserManager.setUser(authenticatedUser);
UserManager.setCompany(userCompany);
```

### **Breadcrumb Navigation**
```javascript
class NavigationTracker {
  static startPageView(pageName, data = {}) {
    tracker.addBreadcrumb(
      `Page viewed: ${pageName}`,
      'info',
      { ...data, timestamp: Date.now() }
    );
  }

  static trackAction(actionName, data = {}) {
    tracker.addBreadcrumb(
      `Action: ${actionName}`,
      'info',
      { ...data, timestamp: Date.now() }
    );
  }

  static trackFormStart(formName) {
    tracker.addBreadcrumb(
      `Form started: ${formName}`,
      'info',
      { formStartTime: Date.now() }
    );
  }
}

// Usage in components
useEffect(() => {
  NavigationTracker.startPageView('Checkout', { step: 'shipping' });
}, []);

const handleSubmit = () => {
  NavigationTracker.trackAction('Submit payment', { amount: total });
  // Process payment...
};
```

### **Performance Monitoring**
```javascript
// Enable performance tracking
const tracker = new ErrorTracker({
  enablePerformance: true,
  performanceThresholds: {
    pageLoad: 3000,        // 3 seconds
    interaction: 100,      // 100ms
    networkRequest: 2000,  // 2 seconds
    memoryUsage: 50        // 50% heap usage
  }
});

// Performance errors are automatically reported
// Slow pages, delayed interactions, high memory usage
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Errors Not Being Captured**
```javascript
// Check configuration
const tracker = new ErrorTracker({
  apiUrl: 'https://your-api.com/api/errors',
  environment: 'production',
  debug: true // Enable debug logging
});

// Check if tracker is initialized
console.log(tracker.isActive); // Should be true

// Test manual capture
tracker.capture(new Error('Test error'), {
  tags: ['test', 'manual']
});
```

#### **CORS Errors**
```javascript
// Server-side CORS headers required
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers',
    'Origin, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
```

#### **Performance Issues**
```javascript
// Optimize batching for high-traffic apps
const tracker = new ErrorTracker({
  batchSize: 20,
  flushInterval: 10000, // 10 seconds

  // Throttle automatic captures
  throttle: {
    maxEvents: 1000,
    timeWindow: 60000 // 1 minute
  }
});
```

### **Debug Mode**

```javascript
const tracker = new ErrorTracker({
  debug: true, // Enable detailed logging

  onError: (error) => {
    console.log('Error tracking failed:', error);
  },

  logger: customLogger
});
```

## 📚 **Related Documentation**

- **[Enterprise Error Monitoring Master Guide](../../error-tracking/1300_ERROR_TRACKING_SYSTEM_MASTER_GUIDE.md)** - Complete system architecture and API reference
- **[Package Publication Guide](../../docs/0200_SYSTEM_ARCHITECTURE.md)** - Publishing and distribution
- **[Support and Troubleshooting](../../docs/0900_ERROR_TRACKING_SDK_USAGE_GUIDE.md)** - Additional examples and best practices

---

*This SDK is part of the Enterprise Error Monitoring & Tracking Platform. For server-side implementation details, see the [master guide](../../docs/error-tracking/1300_ERROR_TRACKING_SYSTEM_MASTER_GUIDE.md).*

## 📞 **Support**

Need help? Check:
1. SDK documentation above
2. [Master system guide](../../docs/error-tracking/1300_ERROR_TRACKING_SYSTEM_MASTER_GUIDE.md)
3. Repository issues for known bugs
4. Create a new issue for feature requests

---

*Last updated: October 18, 2025 - SDK Version 1.0.0*
