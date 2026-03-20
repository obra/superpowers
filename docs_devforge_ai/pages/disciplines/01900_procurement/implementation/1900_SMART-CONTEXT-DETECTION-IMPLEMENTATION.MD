# 0750 Smart Context Detection Implementation

## Overview
**Smart Context Detection** enables the Construct AI spreadsheet system to dynamically adapt its user interface based on user roles, current page context, and data patterns. This creates a personalized, discipline-specific experience that shows relevant functions and templates based on the user's specific construction management domain.

**Business Value**: Transforms generic spreadsheet functionality into powerful, role-optimized productivity tools that reduce learning curves and accelerate workflows for procurement, finance, engineering, and safety teams.

---

## 🎯 Smart Context Detection Architecture

### **Context Detection Hierarchy**
The system uses a three-tiered detection approach for maximum accuracy:

#### **1. Role-Based Context (Primary)**
- **User Metadata**: Department, role, and permission-based detection
- **Page Location**: Current module/page determines primary context
- **Project Assignment**: Active projects influence secondary functions

#### **2. Data Pattern Context (Secondary)**
- **Column Headers**: Analysis of spreadsheet headers (Vendor → Procurement, Budget → Finance)
- **Data Types**: Recognition of numerical patterns (percentages → Financial analysis)
- **Formula Usage**: Automatically detected calculation patterns trigger relevant functions

#### **3. Workflow Context (Tertiary)**
- **Recent Actions**: "Importing supplier data" triggers procurement ribbon
- **Template Usage**: Opening a "Cost Analysis Template" activates financial functions
- **Collaborator Activity**: Team context influences available collaboration features

---

## 👥 Discipline-Specific Context Mapping

### **Primary Context Detection Rules**

#### **Page-Based Context Detection**
```javascript
const getPageBasedContext = (pathname) => {
  const contextMap = {
    // Procurement Module
    '/01900-procurement': 'procurement',
    '/01901-purchase-orders': 'procurement',
    '/supplier-directory': 'procurement',

    // Finance Module
    '/01200-finance': 'finance',
    '/budget-management': 'finance',
    '/financial-reporting': 'finance',

    // Engineering Modules
    '/00850-civil-engineering': 'civil_engineering',
    '/00860-electrical-engineering': 'electrical_engineering',
    '/00870-mechanical-engineering': 'mechanical_engineering',

    // Construction Management
    '/02000-project-controls': 'project_management',
    '/02025-quantity-surveying': 'quantity_surveying',

    // Safety & Compliance
    '/02400-safety': 'safety',
    '/compliance-monitoring': 'safety'
  };

  return contextMap[pathname] || 'general';
};
```

#### **Data Pattern Recognition**
```javascript
const analyzeSpreadsheetData = (spreadsheetData) => {
  const patterns = {
    procurement: ['vendor', 'supplier', 'purchase', 'cost', 'contract'],
    finance: ['budget', 'forecast', 'revenue', 'expense', 'margin'],
    engineering: ['material', 'specification', 'load', 'capacity', 'design'],
    safety: ['incident', 'hazard', 'compliance', 'audit', 'training']
  };

  const content = JSON.stringify(spreadsheetData).toLowerCase();
  const scores = {};

  Object.entries(patterns).forEach(([context, keywords]) => {
    const matches = keywords.filter(keyword => content.includes(keyword)).length;
    scores[context] = matches / keywords.length;
  });

  return Object.entries(scores)
    .filter(([, score]) => score > 0.3)
    .sort(([, a], [, b]) => b - a)
    .map(([context]) => context);
};
```

#### **Hybrid Context Resolution**
```javascript
const resolveContext = (pageContext, dataContext, userContext) => {
  // Page context has highest priority (where user is working)
  if (pageContext !== 'general') return pageContext;

  // Data context for spreadsheets opened outside primary modules
  if (dataContext.length > 0) return dataContext[0];

  // Fallback to user role/department
  return userContext || 'epcm_general';
};
```

### **Development Mode Context Defaults**

#### **Default Organization in Dev Mode**
When authentication is bypassed in development (`NODE_ENV=development` or `BYPASS_AUTH=true`), the system defaults to EPCM (Engineering Procurement Construction Management) organization context:

- **Organization Name**: `Organisations - EPCM`
- **Organization UUID**: `90cd635a-380f-4586-a3b7-a09103b6df94`
- **Access Scope**: 78+ pages across all construction disciplines
- **Business Domains**: Procurement, Finance, Engineering, Safety, Construction, Health & Safety, etc.

#### **Dev Mode Context Priority**
```javascript
const resolveDevModeContext = () => {
  return {
    primaryOrganization: 'Organisations - EPCM',
    organizationId: '90cd635a-380f-4586-a3b7-a09103b6df94',
    defaultContext: 'epcm_general',
    availableDisciplines: [
      'procurement', 'finance', 'civil_engineering',
      'electrical_engineering', 'mechanical_engineering',
      'safety', 'construction_management'
    ]
  };
};
```

#### **Development Default Context Implications**

**For EPCM Organization Context**:
- **Ribbon Configuration**: Engineering-focused toolsets with procurement, finance, and safety tools
- **HTML Export Theme**: Professional engineering documentation styling (blue/gray palette)
- **Smart Templates**: Construction management, bidding, procurement analysis, safety compliance templates
- **Function Access**: Full 65+ function library including NPV/IRR, SUMPRODUCT, NETWORKDAYS, etc.

---

## 🎨 Discipline-Specific Ribbon Configurations

### **Dynamic Ribbon Generation**

#### **Procurement Ribbon Builder**
```javascript
const buildProcurementRibbon = () => ({
  tabs: ['home', 'formulas', 'analysis', 'procurement', 'templates'],

  procurement: {
    title: 'Procurement Tools',
    categories: [
      'Vendor Analysis', 'Cost Management', 'Contract Tracking'
    ]
  },

  quickFunctions: [
    'SUMPRODUCT', 'VLOOKUP', 'NPV', 'IRR', 'NETWORKDAYS'
  ],

  smartTemplates: [
    'Supplier Evaluation Matrix',
    'Cost Benefit Analysis',
    'Vendor Comparison Report'
  ]
});
```

#### **Finance Ribbon Builder**
```javascript
const buildFinanceRibbon = () => ({
  tabs: ['home', 'formulas', 'financial', 'budgeting', 'analysis'],

  financial: {
    title: 'Financial Functions',
    categories: [
      'Investment Analysis', 'Cash Flow', 'Financial Planning'
    ]
  },

  quickFunctions: [
    'NPV', 'IRR', 'PMT', 'FV', 'XNPV', 'XIRR', 'CORREL'
  ],

  smartTemplates: [
    'Cash Flow Projection',
    'Budget Variance Analysis',
    'Investment Appraisal'
  ]
});
```

#### **Engineering Ribbon Builder**
```javascript
const buildEngineeringRibbon = (discipline) => ({
  tabs: ['home', 'formulas', 'calculations', 'analysis', 'standards'],

  calculations: {
    title: `${discipline} Calculations`,
    categories: [
      'Unit Conversions', 'Load Analysis', 'Material Calculations'
    ]
  },

  quickFunctions: [
    'CONVERT', 'SQRT', 'POWER', 'COS', 'SIN', 'TAN'
  ],

  disciplineTemplates: {
    civil: ['Structural Analysis', 'Quantity Takeoff', 'Earthworks Calculation'],
    electrical: ['Load Calculation', 'Cable Sizing', 'Power Distribution'],
    mechanical: ['Pipe Sizing', 'Pump Calculation', 'HVAC Analysis']
  }[discipline] || []
});
```

### **Context-Aware Function Discovery**

#### **Function Relevance Scoring**
```javascript
const scoreFunctionRelevance = (functionName, context) => {
  const relevanceMatrix = {
    procurement: {
      SUMPRODUCT: 0.9, VLOOKUP: 0.8, NPV: 0.7, IRR: 0.7,
      NETWORKDAYS: 0.6, DATEDIF: 0.6
    },
    finance: {
      NPV: 0.9, IRR: 0.9, PMT: 0.8, FV: 0.8, CORREL: 0.7,
      STDEV: 0.6, AVERAGE: 0.6
    },
    engineering: {
      CONVERT: 0.8, SQRT: 0.7, POWER: 0.7, COS: 0.6, SIN: 0.6,
      ROUND: 0.6, ABS: 0.5
    }
  };

  return relevanceMatrix[context]?.[functionName] || 0.1;
};
```

#### **Dynamic Quick Access Toolbar**
```javascript
const getContextualToolbar = (context, recentFunctions) => {
  const contextFunctions = getTopFunctionsForContext(context, 8);
  const recentFunctions = recentFunctions.slice(0, 4);
  const combined = [...new Set([...contextFunctions, ...recentFunctions])];

  return combined.slice(0, 12); // Max toolbar items
};
```

---

## 🔄 Real-Time Context Updates

### **Event-Driven Context Changes**

#### **Page Navigation Context Updates**
```javascript
const handlePageChange = (newPathname) => {
  const newContext = getPageBasedContext(newPathname);

  if (newContext !== currentContext) {
    updateRibbonConfiguration(newContext);
    updateAvailableFunctions(newContext);
    updateTemplateSuggestions(newContext);
    updateQuickAccessToolbar(newContext);
  }
};
```

#### **Spreadsheet Data Context Updates**
```javascript
const handleDataChange = (spreadsheetData) => {
  const dataContexts = analyzeSpreadsheetData(spreadsheetData);
  const resolvedContext = resolveContext(currentPageContext, dataContexts, userContext);

  if (resolvedContext !== currentContext) {
    // Smooth transition with user confirmation
    showContextTransitionDialog(resolvedContext);
  }
};

// Debounced for performance
const debouncedDataAnalysis = debounce(handleDataChange, 1000);
```

#### **User Action Context Learning**
```javascript
const learnFromUserActions = (action, context) => {
  // Track user preferences
  contextLearning[context] = {
    ...contextLearning[context],
    [action]: (contextLearning[context]?.[action] || 0) + 1
  };

  // Adapt interface based on learned preferences
  if (contextLearning[context][action] > 3) {
    promoteFunctionToQuickAccess(action);
  }
};
```

---

## 🎯 Smart Template Suggestions

### **Context-Aware Template Engine**

#### **Template Relevance Scoring**
```javascript
const scoreTemplateRelevance = (template, context, userData) => {
  let score = 0;

  // Discipline relevance (0.4 weight)
  if (template.disciplines.includes(context)) score += 0.4;

  // User role relevance (0.3 weight)
  if (userData.role && template.roles.includes(userData.role)) score += 0.3;

  // Project type relevance (0.2 weight)
  if (userData.currentProject?.type) {
    if (template.projectTypes.includes(userData.currentProject.type)) score += 0.2;
  }

  // Usage frequency (0.1 weight)
  const usageScore = (template.usageCount || 0) / 100; // Normalize
  score += Math.min(usageScore, 0.1);

  return Math.min(score, 1.0);
};
```

#### **Dynamic Template Loading**
```javascript
const loadContextualTemplates = async (context) => {
  const availableTemplates = getTemplatesForContext(context);

  return availableTemplates
    .map(template => ({
      ...template,
      relevanceScore: scoreTemplateRelevance(template, currentData, userHistory)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6); // Top 6 most relevant
};
```

---

## 🎨 User Experience Enhancements

### **Context Transition Indicators**

#### **Smooth Context Switching**
```javascript
const showContextTransitionDialog = (newContext) => {
  const contextInfo = CONTEXT_DEFINITIONS[newContext];

  showDialog({
    title: `Switch to ${contextInfo.friendlyName} Mode?`,
    content: `We've detected you're working on ${contextInfo.description}. Would you like to switch to ${contextInfo.friendlyName} functions and templates?`,
    confirmText: `Switch to ${contextInfo.friendlyName}`,
    cancelText: 'Keep Current Mode',
    onConfirm: () => applyContext(newContext, 'user_confirmed'),
    onCancel: () => rememberUserPreference('dismiss_context_switch', newContext)
  });
};
```

#### **Context Awareness Indicators**
```javascript
const ContextIndicator = ({ currentContext, contextConfidence }) => {
  const contextInfo = CONTEXT_DEFINITIONS[currentContext];

  return (
    <div className="context-indicator">
      <div className="context-badge">
        <span className="context-icon">{contextInfo.icon}</span>
        <span className="context-name">{contextInfo.friendlyName}</span>
        <span className="confidence-indicator">
          {contextConfidence > 0.8 ? '●●●' : contextConfidence > 0.6 ? '●●○' : '●○○'}
        </span>
      </div>
      <button
        className="context-switcher"
        onClick={() => showContextSelector()}
      >
        Change Context
      </button>
    </div>
  );
};
```

---

## 🔧 Technical Implementation

### **Context State Management**

#### **Centralized Context Store**
```javascript
const contextStore = {
  currentContext: 'general',
  contextHistory: [],
  userPreferences: {},
  contextConfidence: 0,

  // Context detection methods
  detectFromPage: (pathname) => { /* implementation */ },
  detectFromData: (data) => { /* implementation */ },
  detectFromUser: (user) => { /* implementation */ },

  // Context management
  setContext: (newContext, source) => {
    this.currentContext = newContext;
    this.contextHistory.push({ context: newContext, source, timestamp: Date.now() });

    // Notify subscribers
    contextSubscribers.forEach(callback => callback(newContext));
  },

  getContextualConfiguration: () => {
    return DISCIPLINE_CONFIGURATIONS[this.currentContext] || GENERAL_CONFIG;
  }
};
```

#### **React Hook Integration**
```javascript
const useSpreadsheetContext = () => {
  const [context, setContext] = useState(contextStore.currentContext);

  useEffect(() => {
    const unsubscribe = contextStore.subscribe(setContext);
    return unsubscribe;
  }, []);

  return {
    currentContext,
    setContext: (newContext) => contextStore.setContext(newContext, 'user_action'),
    contextConfiguration: contextStore.getContextualConfiguration()
  };
};
```

---

## 📊 Performance Optimization

### **Lazy Loading Context Configurations**
```javascript
const loadContextConfiguration = async (context) => {
  // Lazy load context-specific configurations
  if (!loadedConfigurations[context]) {
    const config = await import(`./contexts/${context}.config.js`);
    loadedConfigurations[context] = config.default;
  }

  return loadedConfigurations[context];
};
```

### **Configuration Caching**
```javascript
const contextCache = new Map();

const getCachedContextConfig = async (context) => {
  if (!contextCache.has(context)) {
    const config = await loadContextConfiguration(context);
    contextCache.set(context, config);
  }

  return contextCache.get(context);
};
```

---

## 📚 Related Documentation

### **Core UI Framework**
- **[0750_SPREADSHEET_HTML_EXPORT_IMPLEMENTATION.md](./0750_SPREADSHEET_HTML_EXPORT_IMPLEMENTATION.md)** - **NEW** - Complete HTML export functionality for spreadsheets
- **[0750_UI_MASTER_GUIDE.md](../../user-interface/0750_UI_MASTER_GUIDE.md)** - Complete user interface system guide
- **[0750_CONTEXT_AWARE_INTERFACE_IMPLEMENTATION.md](../0750_CONTEXT_AWARE_INTERFACE_IMPLEMENTATION.md)** - Detailed context-aware UI implementation

### **Functional Integration**
- **[1300_PAGES_DISCIPLINES_MASTER_GUIDE.md](../../../pages-disciplines/1300_PAGES_DISCIPLINES_MASTER_GUIDE.md)** - Discipline-specific page implementations
- **[0200_UNIVER_SPREADSHEET_INTEGRATION.md](../../../external-services/0200_UNIVER_SPREADSHEET_INTEGRATION.md)** - Spreadsheet system integration

---

## 🏷️ Version History

### **v1.1.0 (2025-11-20)**
- Comprehensive context detection hierarchy implementation
- Discipline-specific ribbon configuration system
- Real-time context update mechanisms
- Smart template suggestion engine with relevance scoring
- Performance optimization and caching strategies

### **v1.2.0 (2025-11-20)**
- Added user experience transition indicators
- Implemented smooth context switching dialogs
- Created confidence-based context indicators
- Enhanced technical implementation patterns

### **v1.0.0 (2025-11-15)**
- Core context detection architecture
- Basic discipline mapping and configurations
- Foundation for context-aware interface adaptations
- Performance optimization groundwork

---

## Status
- [x] Initial draft completed
- [x] Technical review completed
- [x] Implementation planned
- [ ] Unit tests created
- [ ] Integration tests completed
- [ ] Performance benchmarks achieved

This smart context detection implementation transforms the spreadsheet experience from a generic tool into a powerful, discipline-specific productivity platform that adapts intelligently to each user's construction management domain.
