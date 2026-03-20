# Procurement Workflow Agent Prompts Inventory & Developer Tools Implementation

**Document Version:** 1.1
**Date:** December 2025
**Purpose:** Comprehensive inventory of all AI agent prompts required for the procurement workflow rationalization plan, including missing developer modal implementation details

## 📚 Cross-References & Use Cases

### **Reference Documents**
- **[0002_AGENT_CENTRIC_WORKFLOW_PAGE_IMPLEMENTATION_PROCEDURE.md](../../procedures/0002_AGENT_CENTRIC_WORKFLOW_PAGE_IMPLEMENTATION_PROCEDURE.md)**: Primary implementation procedure that incorporates this inventory's patterns for agent-centric workflow pages
- **[appendix_d_training_materials_modifications.md](appendix_d_training_materials_modifications.md)**: Reference implementation following the 4-phase structure and using 24+ agent prompts from this inventory
- **[0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md](../../procedures/0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md)**: General workflow patterns (specialized for AI agent orchestration using this inventory)
- **[0000_PAGE_IMPLEMENTATION_PROCEDURE.md](../../procedures/0000_PAGE_IMPLEMENTATION_PROCEDURE.md)**: Basic page structure (enhanced for agent-centric features)

### **Use Case: Comprehensive Agent Prompt Inventory & Developer Tools**
This document serves as the **master inventory** for implementing complex AI-powered workflow systems requiring:

- **24+ AI Agent Prompts**: Complete prompt lifecycle management from analysis to generation
- **8-Interface Developer Testing Modal**: Advanced testing framework with prompt testing, unit testing, integration testing, performance testing, UI testing, security testing, test data generation, and collaborative debugging
- **Magic Wand AI Enhancement**: One-click prompt optimization with A/B testing and confidence scoring
- **Enterprise Integration Patterns**: Gantt charts, HITL workflows, sequence management, My Tasks dashboard
- **Production-Ready Features**: Monitoring, alerting, rollback procedures, and continuous optimization

**Implementation Pattern**: Use this inventory when building any sophisticated workflow system that requires extensive AI agent integration. The 24 prompts and developer tools outlined here provide the complete blueprint for agent-centric automation with human oversight.

## Executive Summary

This document inventories **24 AI agent prompts** required to implement the full procurement workflow rationalization vision. The prompts are categorized into **Analysis & Processing** (12 prompts), **Document Generation** (10 prompts), and **Workflow Integration** (4 prompts).

**Critical Findings:**
- Only 12 of 24 prompts currently exist in the system
- **12 document generation prompts are missing**, representing the core gap between workflow vision and implemented capabilities
- **Developer modal for rapid prompt iteration** was planned but never implemented - detailed implementation specifications included below

## 🚨 CRITICAL MISSING COMPONENT: Developer Modal Implementation

### Overview
The procurement workflow rationalization plan included a comprehensive **developer-only modal for rapid agent prompt testing and iteration**, but this critical development tool was never implemented. This section provides the complete implementation specifications that were described in the original plans.

### Purpose & Value Proposition
- **Rapid Iteration Cycles**: Edit prompts directly on pages where they're used
- **Immediate Testing Feedback**: Test prompt changes instantly without navigation
- **Context-Aware Development**: See how prompts perform in their actual usage environment
- **Accelerated AI Development**: Reduce development time for agent prompt optimization
- **Quality Assurance**: Comprehensive testing framework for prompt validation

### Technical Architecture

#### Modal Components Structure
```
DeveloperPromptModal/
├── DeveloperPromptModal.jsx              # Main modal component
├── DeveloperPromptTrigger.jsx            # Floating trigger button
├── PromptEditorInterface.jsx             # Monaco editor integration
├── PromptTestingInterface.jsx            # Real-time testing panel
├── PerformanceAnalyticsPanel.jsx         # Metrics and analytics
└── CollaborativeDebuggingPanel.jsx       # Team debugging features
```

#### Core Features Implementation

##### 1. Developer-Only Visibility System
```javascript
// Security implementation for developer modal
const DeveloperModalSecurity = {
  // Check developer access
  hasDeveloperAccess: (user) => {
    return user?.roles?.includes('developer') ||
           user?.email?.endsWith('@constructai.com') ||
           process.env.NODE_ENV === 'development';
  },

  // Audit logging for prompt changes
  logPromptChange: async (userId, promptId, action, details) => {
    await auditLogger.log({
      action: `developer_prompt_${action}`,
      user_id: userId,
      prompt_id: promptId,
      details,
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    });
  },

  // Version control for prompt changes
  createPromptVersion: async (promptId, newContent, userId) => {
    const version = await promptVersioningService.createVersion({
      prompt_id: promptId,
      content: newContent,
      created_by: userId,
      version_type: 'developer_edit',
      environment: process.env.NODE_ENV
    });

    return version;
  }
};
```

##### 2. Page-Specific Prompt Mapping
```javascript
// Prompt mapping for developer modal access
const PAGE_PROMPT_MAPPING = {
  // Procurement pages
  '01900': {
    prompts: ['procurement_analyzer_v1', 'procurement_validator_v1', 'procurement_scheduler_v1'],
    modalTitle: 'Procurement Agent Prompts',
    testContext: 'Sample procurement document text...'
  },

  // Document ordering management
  'document-ordering-management': {
    prompts: ['discipline_analyzer_v1', 'sequence_optimizer_v1'],
    modalTitle: 'Document Ordering Prompts',
    testContext: 'Sample document structure...'
  },

  // Gantt chart page
  'gantt-chart': {
    prompts: ['gantt_processor_v1', 'schedule_analyzer_v1'],
    modalTitle: 'Gantt Chart Prompts',
    testContext: 'Sample schedule data...'
  },

  // AI analysis pages
  '02050': {
    prompts: ['coding_assistant_v1', 'template_generator_v1'],
    modalTitle: 'AI Assistant Prompts',
    testContext: 'Sample code or template request...'
  }
};
```

##### 3. Enhanced Developer Testing Modal Architecture
```javascript
// Comprehensive Developer Testing Modal - Multi-Function Testing Hub
const EnhancedDeveloperTestingModal = {
  features: {
    developerOnlyVisibility: 'Only visible when user has developer role',
    multiFunctionTesting: 'Prompt testing + Code testing + Performance analysis',
    pageSpecificContext: 'Shows relevant tests and prompts for current page',
    realTimeExecution: 'Run tests instantly without leaving the page',
    comprehensiveReporting: 'Detailed results with actionable insights',
    collaborativeDebugging: 'Share test results and debugging sessions'
  },

  modalComponents: {
    testSelector: {
      // Multi-category test selection
      categories: ['Prompts', 'Unit Tests', 'Integration Tests', 'Performance', 'API', 'UI', 'Security'],
      pageSpecificTests: await getPageRelevantTests(currentPageId),
      onSelect: (testType) => switchTestInterface(testType)
    },

    // PROMPT TESTING INTERFACE (existing)
    promptInterface: {
      promptSelector: {
        options: await getPagePrompts(currentPageId),
        onSelect: (promptId) => loadPromptForEditing(promptId)
      },

      promptEditor: createMonacoEditor({
        language: 'text',
        theme: 'vs-dark',
        minimap: { enabled: false },
        wordWrap: 'on'
      }),

      promptValidator: validatePromptSyntax,
      autoSave: debounce(savePromptChanges, 1000),

      testInterface: {
        testInput: createTestInputField(),
        testButton: {
          onClick: async () => {
            const result = await testPromptWithInput(testInput.value);
            displayTestResults(result);
          }
        },
        resultsPanel: displayTestResults
      }
    },

    // UNIT TESTING INTERFACE (new)
    unitTestInterface: {
      testDiscovery: {
        // Auto-discover unit tests for current page/component
        discoverTests: async () => {
          const componentPath = getCurrentComponentPath();
          return await discoverUnitTests(componentPath);
        }
      },

      testRunner: {
        runTests: async (testFiles) => {
          const results = await runJestTests(testFiles);
          return formatTestResults(results);
        },

        watchMode: {
          enabled: true,
          onFileChange: (changedFile) => autoRunRelatedTests(changedFile)
        }
      },

      coverageAnalysis: {
        generateCoverage: async (testFiles) => {
          const coverage = await generateCoverageReport(testFiles);
          return visualizeCoverage(coverage);
        },

        coverageThresholds: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      }
    },

    // INTEGRATION TESTING INTERFACE (new)
    integrationTestInterface: {
      workflowTester: {
        // Test complete procurement workflows
        testWorkflow: async (workflowType) => {
          const testScenario = createWorkflowTestScenario(workflowType);
          const results = await executeWorkflowTest(testScenario);
          return analyzeWorkflowResults(results);
        },

        availableWorkflows: [
          'procurement_order_creation',
          'document_sequence_processing',
          'agent_orchestration_flow',
          'hitl_task_creation'
        ]
      },

      apiTester: {
        // Test API endpoints relevant to current page
        discoverEndpoints: async () => {
          const pageContext = getCurrentPageContext();
          return await discoverRelevantAPIs(pageContext);
        },

        endpointTester: {
          runTests: async (endpoints) => {
            const results = await testAPIEndpoints(endpoints);
            return formatAPIResults(results);
          },

          loadTesting: {
            concurrentUsers: [1, 5, 10, 25, 50],
            runLoadTest: async (endpoint, users, duration) => {
              return await executeLoadTest(endpoint, users, duration);
            }
          }
        }
      },

      databaseTester: {
        // Test database operations and queries
        queryValidator: {
          validateQueries: async (component) => {
            const queries = extractQueriesFromComponent(component);
            return await validateDatabaseQueries(queries);
          }
        },

        performanceAnalyzer: {
          analyzeQueryPerformance: async (queries) => {
            const analysis = await benchmarkQueries(queries);
            return generatePerformanceReport(analysis);
          }
        }
      }
    },

    // PERFORMANCE TESTING INTERFACE (new)
    performanceTestInterface: {
      benchmarkRunner: {
        // Performance benchmarks for current page/component
        runBenchmarks: async () => {
          const component = getCurrentComponent();
          const benchmarks = await runPerformanceBenchmarks(component);
          return analyzeBenchmarkResults(benchmarks);
        },

        metrics: {
          renderTime: 'Component render performance',
          memoryUsage: 'Memory consumption patterns',
          interactionLatency: 'User interaction response times',
          bundleSize: 'JavaScript bundle impact'
        }
      },

      profiler: {
        // Real-time performance profiling
        startProfiling: () => {
          performance.mark('test-start');
          // Enable React DevTools profiling if available
        },

        stopProfiling: async () => {
          performance.mark('test-end');
          performance.measure('test-duration', 'test-start', 'test-end');

          const measurements = performance.getEntriesByType('measure');
          return analyzePerformanceMeasurements(measurements);
        }
      }
    },

    // UI TESTING INTERFACE (new)
    uiTestInterface: {
      accessibilityTester: {
        runAudit: async () => {
          const component = getCurrentComponent();
          const results = await runAccessibilityAudit(component);
          return formatAccessibilityReport(results);
        },

        standards: ['WCAG_2_1_AA', 'Section_508'],
        automatedFixes: generateAccessibilityFixes
      },

      visualRegressionTester: {
        captureBaseline: async () => {
          const screenshot = await captureComponentScreenshot();
          return saveVisualBaseline(screenshot);
        },

        runComparison: async () => {
          const currentScreenshot = await captureComponentScreenshot();
          const baseline = await loadVisualBaseline();
          return compareScreenshots(currentScreenshot, baseline);
        }
      },

      responsiveTester: {
        viewportProfiles: {
          mobile: { width: 375, height: 667 },
          tablet: { width: 768, height: 1024 },
          desktop: { width: 1920, height: 1080 }
        },

        testResponsiveness: async (component) => {
          const results = {};
          for (const [device, viewport] of Object.entries(viewportProfiles)) {
            results[device] = await testComponentInViewport(component, viewport);
          }
          return results;
        }
      }
    },

    // SECURITY TESTING INTERFACE (new)
    securityTestInterface: {
      vulnerabilityScanner: {
        scanComponent: async (component) => {
          const vulnerabilities = await runSecurityScan(component);
          return formatSecurityReport(vulnerabilities);
        },

        scanTypes: ['XSS', 'CSRF', 'Injection', 'Auth_Bypass', 'Data_Exposure'],
        severityLevels: ['Critical', 'High', 'Medium', 'Low', 'Info']
      },

      dependencyChecker: {
        checkVulnerabilities: async () => {
          const dependencies = await getComponentDependencies();
          const vulnerabilities = await checkDependencyVulnerabilities(dependencies);
          return formatDependencyReport(vulnerabilities);
        },

        outdatedPackages: async () => {
          const packages = await getPackageVersions();
          return identifyOutdatedPackages(packages);
        }
      },

      dataPrivacyTester: {
        checkDataHandling: async (component) => {
          const dataFlows = analyzeDataFlows(component);
          return validateDataPrivacyCompliance(dataFlows);
        },

        gdprCompliance: checkGDPRCompliance,
        dataRetention: validateDataRetentionPolicies
      }
    },

    // TEST DATA GENERATION INTERFACE (new)
    testDataInterface: {
      endToEndTestData: {
        // Generate complete test dataset for procurement workflow
        generateCompleteTestData: async () => {
          // Step 1: Discover procurement-related tables and schemas
          const procurementTables = await discoverProcurementTables();

          // Step 2: Generate test data respecting relationships
          const testData = await generateRelationalTestData(procurementTables);

          // Step 3: Populate database with referential integrity
          return await populateTestDatabase(testData);
        },

        // Table Discovery & Schema Analysis
        tableDiscovery: {
          // Automatically discover procurement workflow tables
          discoverProcurementTables: async () => {
            const allTables = await getDatabaseSchema();

            // Identify procurement-related tables by naming patterns and relationships
            const procurementTables = allTables.filter(table =>
              isProcurementRelated(table.name, table.relationships)
            );

            // Analyze table schemas and relationships
            return await analyzeTableSchemas(procurementTables);
          },

          // Schema analysis for data generation
          analyzeTableSchemas: async (tables) => {
            const schemaAnalysis = {};

            for (const table of tables) {
              schemaAnalysis[table.name] = {
                columns: await getTableColumns(table.name),
                primaryKey: await getPrimaryKey(table.name),
                foreignKeys: await getForeignKeys(table.name),
                indexes: await getTableIndexes(table.name),
                constraints: await getTableConstraints(table.name)
              };
            }

            return schemaAnalysis;
          }
        },

        // Relationship-Aware Data Generation
        relationalDataGeneration: {
          // Generate data respecting foreign key relationships
          generateRelationalTestData: async (procurementTables) => {
            const testData = {};

            // Generate data in dependency order (parents before children)
            const dependencyOrder = calculateDependencyOrder(procurementTables);

            for (const tableName of dependencyOrder) {
              const tableSchema = procurementTables[tableName];
              testData[tableName] = await generateTableData(tableSchema);
            }

            return testData;
          },

          // Calculate insertion order based on foreign key dependencies
          calculateDependencyOrder: (tables) => {
            const graph = buildDependencyGraph(tables);
            return topologicalSort(graph); // Parents before children
          },

          // Generate realistic data for specific table types
          generateTableData: async (tableSchema) => {
            const dataGenerator = getDataGeneratorForTable(tableSchema.name);

            return await dataGenerator.generate({
              schema: tableSchema,
              recordCount: calculateOptimalRecordCount(tableSchema),
              relationships: tableSchema.foreignKeys
            });
          }
        },

        // Procurement Table Identification Logic
        procurementTableIdentification: {
          // Naming pattern recognition
          namingPatterns: [
            /^procurement_/,           // procurement_orders, procurement_templates
            /^document_ordering/,      // document_ordering tables
            /^agent_/,                 // agent-related tables
            /^sequence_/,              // sequence management tables
            /_disciplines?$/,          // discipline-related tables
            /_templates?$/,            // template-related tables
            /^hitl_/,                  // HITL-related tables
            /^gantt_/,                 // Gantt chart tables
            /^audit_/,                 // audit trail tables
            /^notification_/           // notification tables
          ],

          // Relationship-based identification
          relationshipPatterns: {
            procurementOrders: {
              references: ['disciplines', 'templates', 'users'],
              referencedBy: ['agent_tasks', 'hitl_tasks', 'notifications']
            },

            agentPrompts: {
              references: ['users', 'organizations'],
              referencedBy: ['agent_performance', 'prompt_versions']
            },

            disciplineAssignments: {
              references: ['procurement_orders', 'disciplines', 'users'],
              referencedBy: ['agent_tasks', 'sequence_configurations']
            }
          },

          // Content-based identification
          contentPatterns: {
            procurementColumns: [
              'procurement_type', 'order_value', 'supplier_name',
              'delivery_date', 'contract_terms', 'compliance_requirements'
            ],

            agentColumns: [
              'agent_id', 'capability_score', 'task_assignment',
              'performance_metrics', 'response_time'
            ],

            disciplineColumns: [
              'discipline_code', 'discipline_name', 'expertise_level',
              'assignment_role', 'collaboration_rules'
            ]
          }
        },

        // Test Data Templates with Schema Awareness
        testDataTemplates: {
          simpleProcurement: {
            description: 'Basic procurement order with single discipline',
            targetTables: [
              'procurement_orders',
              'procurement_order_disciplines',
              'users',
              'agent_tasks'
            ],
            recordCounts: {
              procurement_orders: 1,
              procurement_order_disciplines: 1,
              users: 2,
              agent_tasks: 3
            },
            complexity: 'low'
          },

          complexProcurement: {
            description: 'Multi-discipline procurement with full workflow',
            targetTables: [
              'procurement_orders',
              'procurement_order_disciplines',
              'procurement_templates',
              'agent_tasks',
              'hitl_tasks',
              'sequence_configurations',
              'notifications',
              'audit_trail'
            ],
            recordCounts: {
              procurement_orders: 1,
              procurement_order_disciplines: 6,
              procurement_templates: 1,
              agent_tasks: 15,
              hitl_tasks: 3,
              sequence_configurations: 1,
              notifications: 8,
              audit_trail: 25
            },
            complexity: 'high'
          },

          equipmentProcurement: {
            description: 'Equipment-focused procurement with technical requirements',
            targetTables: [
              'procurement_orders',
              'procurement_order_disciplines',
              'procurement_templates',
              'technical_requirements',
              'training_assignments',
              'compliance_checks',
              'agent_tasks',
              'hitl_tasks'
            ],
            recordCounts: {
              procurement_orders: 1,
              procurement_order_disciplines: 5,
              procurement_templates: 1,
              technical_requirements: 8,
              training_assignments: 4,
              compliance_checks: 6,
              agent_tasks: 12,
              hitl_tasks: 4
            },
            complexity: 'medium'
          }
        },

        // Custom test data generation with schema validation
        customTestData: {
          // Dynamic table discovery based on user selection
          dynamicTableSelection: {
            procurementCore: ['procurement_orders', 'procurement_templates'],
            agentSystem: ['agent_prompts', 'agent_performance', 'agent_tasks'],
            disciplineManagement: ['disciplines', 'procurement_order_disciplines'],
            workflowOrchestration: ['sequence_configurations', 'hitl_tasks', 'notifications'],
            auditCompliance: ['audit_trail', 'compliance_checks']
          },

          // Schema-aware parameter configuration
          schemaAwareParameters: {
            orderParameters: {
              // Dynamically discovered from procurement_orders table
              table: 'procurement_orders',
              configurableColumns: ['order_value', 'procurement_type', 'urgency_level'],
              valueRanges: await getColumnValueRanges('procurement_orders'),
              validationRules: await getColumnConstraints('procurement_orders')
            },

            documentParameters: {
              // Based on document processing tables
              supportedFormats: await getSupportedDocumentFormats(),
              sizeLimits: await getDocumentSizeLimits(),
              processingCapabilities: await getDocumentSizeLimits()
            },

            userParameters: {
              // Based on user and organization tables
              roleOptions: await getUserRoles(),
              organizationOptions: await getOrganizations(),
              permissionMatrix: await getRolePermissions()
            }
          }
        }
      },

      workflowSimulation: {
        // End-to-end workflow simulation
        simulateCompleteWorkflow: async (testDataId) => {
          const simulation = await createWorkflowSimulation(testDataId);
          return await executeWorkflowSimulation(simulation);
        },

        // Real-time workflow monitoring
        monitorWorkflowExecution: {
          progressTracking: 'Real-time workflow step completion',
          bottleneckIdentification: 'Identify workflow slowdowns',
          errorDetection: 'Catch and report workflow failures',
          performanceMetrics: 'Track execution times and resource usage'
        },

        // Workflow result validation
        validateWorkflowResults: {
          expectedOutcomes: 'Verify workflow completes with expected results',
          dataIntegrity: 'Check all data transformations and relationships',
          stakeholderNotifications: 'Verify all required notifications sent',
          auditTrail: 'Ensure complete workflow audit trail'
        }
      }
    },

    // COLLABORATIVE DEBUGGING INTERFACE (new)
    collaborationInterface: {
      sessionSharing: {
        createDebugSession: async () => {
          const sessionId = generateSessionId();
          const currentState = captureCurrentTestState();
          return await saveDebugSession(sessionId, currentState);
        },

        shareSession: async (sessionId, collaborators) => {
          const shareLink = generateShareLink(sessionId);
          await notifyCollaborators(collaborators, shareLink);
          return shareLink;
        }
      },

      resultExport: {
        exportResults: async (testResults, format = 'json') => {
          const formattedResults = formatTestResults(testResults, format);
          return downloadFile(formattedResults, `test-results-${Date.now()}.${format}`);
        },

        supportedFormats: ['json', 'xml', 'html', 'pdf', 'csv']
      },

      testDataExport: {
        exportTestDataset: async (testDataId, format = 'json') => {
          const testData = await retrieveTestDataset(testDataId);
          return downloadFile(testData, `test-dataset-${testDataId}-${Date.now()}.${format}`);
        },

        exportWorkflowSimulation: async (simulationId, format = 'json') => {
          const simulation = await retrieveWorkflowSimulation(simulationId);
          return downloadFile(simulation, `workflow-simulation-${simulationId}-${Date.now()}.${format}`);
        }
      }
    },

    // RESULTS & ANALYTICS PANEL (enhanced)
    resultsPanel: {
      realTimeMetrics: {
        executionTime: 'Current test execution time',
        passRate: 'Test success percentage',
        coverage: 'Code coverage percentage',
        performance: 'Performance benchmark results'
      },

      historicalComparison: {
        compareWithBaseline: async (currentResults) => {
          const baseline = await loadBaselineResults();
          return compareResults(currentResults, baseline);
        },

        trendAnalysis: async (results) => {
          const historicalData = await loadHistoricalResults();
          return analyzeTrends(results, historicalData);
        }
      },

      actionableInsights: {
        generateRecommendations: async (results) => {
          const analysis = await analyzeTestResults(results);
          return generateImprovementRecommendations(analysis);
        },

        automatedFixes: {
          identifyFixableIssues: async (results) => {
            return findAutomatedFixes(results);
          },

          applyFixes: async (fixes) => {
            return await applyAutomatedFixes(fixes);
          }
        }
      }
    }
  },

  activationTriggers: {
    keyboardShortcut: 'Ctrl+Shift+P (Prompt Editor) | Ctrl+Shift+T (Test Hub)',
    menuItem: 'Developer Menu → Testing Hub',
    contextMenu: 'Right-click on any element → Test Component',
    errorTrigger: 'Automatic popup on test failures or performance issues',
    hotkeyCombos: {
      'Ctrl+Shift+U': 'Unit Tests',
      'Ctrl+Shift+I': 'Integration Tests',
      'Ctrl+Shift+R': 'Performance Tests',
      'Ctrl+Shift+A': 'Accessibility Tests'
    }
  },

  advancedFeatures: {
    aiPoweredTesting: {
      testGeneration: 'AI generates additional test cases based on component analysis',
      issuePrediction: 'Predict potential issues before they occur',
      optimizationSuggestions: 'AI suggests performance and code improvements'
    },

    continuousTesting: {
      watchMode: 'Automatically run tests on file changes',
      ciCdIntegration: 'Sync with CI/CD pipeline results',
      deploymentGates: 'Block deployments if test criteria not met'
    },

    customizationFramework: {
      customTests: 'Add organization-specific test suites',
      pluginArchitecture: 'Extend with custom testing plugins',
      configurationProfiles: 'Different test configurations for different environments'
    }
  }
};
```

##### 4. Page Integration Pattern
```javascript
// Integration pattern for existing pages
const EnhancedPageComponent = (OriginalComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        showPromptModal: false,
        currentPrompts: [],
        testResults: null
      };
    }

    componentDidMount() {
      // Load prompts for this page
      this.loadPagePrompts();

      // Setup keyboard shortcut
      this.setupKeyboardShortcut();
    }

    // Check if user is developer
    isDeveloper = () => {
      return this.props.user?.roles?.includes('developer') ||
             process.env.NODE_ENV === 'development';
    };

    // Load prompts applicable to this page
    loadPagePrompts = async () => {
      if (!this.isDeveloper()) return;

      const pageId = this.getCurrentPageId();
      const prompts = await agentPromptService.getPagePrompts(pageId);
      this.setState({ currentPrompts: prompts });
    };

    // Render developer modal trigger
    renderDeveloperControls = () => {
      if (!this.isDeveloper()) return null;

      return (
        <DeveloperPromptTrigger
          onClick={() => this.setState({ showPromptModal: true })}
          promptCount={this.state.currentPrompts.length}
        />
      );
    };

    render() {
      return (
        <>
          <OriginalComponent {...this.props} />
          {this.renderDeveloperControls()}

          {this.state.showPromptModal && (
            <DeveloperPromptModal
              pageId={this.getCurrentPageId()}
              prompts={this.state.currentPrompts}
              onClose={() => this.setState({ showPromptModal: false })}
              onPromptUpdate={this.handlePromptUpdate}
            />
          )}
        </>
      );
    }
  };
};
```

##### 5. Complete Modal Implementation
```javascript
// Complete modal implementation
const DeveloperPromptModal = ({ pageId, prompts, onClose, onPromptUpdate }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[0]);
  const [editedContent, setEditedContent] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load prompt content when selected
  useEffect(() => {
    if (selectedPrompt) {
      setEditedContent(selectedPrompt.content);
      // Load test context for this page
      setTestInput(PAGE_PROMPT_MAPPING[pageId]?.testContext || '');
    }
  }, [selectedPrompt, pageId]);

  // Auto-save functionality
  const autoSave = useCallback(
    debounce(async (content) => {
      try {
        await agentPromptService.updatePrompt(selectedPrompt.id, { content });
        onPromptUpdate(selectedPrompt.id, content);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 1000),
    [selectedPrompt, onPromptUpdate]
  );

  // Test prompt functionality
  const testPrompt = async () => {
    setIsTesting(true);
    try {
      const result = await agentPromptService.testPrompt(
        selectedPrompt.id,
        testInput,
        { pageContext: pageId }
      );
      setTestResults(result);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal
      title={`Developer Prompt Editor - ${PAGE_PROMPT_MAPPING[pageId]?.modalTitle}`}
      onClose={onClose}
      size="large"
    >
      {/* Prompt Selector */}
      <div className="prompt-selector">
        <select
          value={selectedPrompt?.id}
          onChange={(e) => setSelectedPrompt(
            prompts.find(p => p.id === e.target.value)
          )}
        >
          {prompts.map(prompt => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name} (v{prompt.agent_version})
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Editor */}
      <div className="prompt-editor">
        <MonacoEditor
          height="300px"
          language="text"
          theme="vs-dark"
          value={editedContent}
          onChange={(value) => {
            setEditedContent(value);
            autoSave(value);
          }}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false
          }}
        />
      </div>

      {/* Test Interface */}
      <div className="test-interface">
        <textarea
          placeholder="Enter test input..."
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          rows={4}
        />

        <button
          onClick={testPrompt}
          disabled={isTesting}
          className="test-button"
        >
          {isTesting ? 'Testing...' : 'Test Prompt'}
        </button>

        {testResults && (
          <div className="test-results">
            <h4>Test Results:</h4>
            <pre>{JSON.stringify(testResults, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <div>Execution Time: {selectedPrompt?.performance_metrics?.avg_processing_time}ms</div>
        <div>Success Rate: {selectedPrompt?.performance_metrics?.success_rate}%</div>
        <div>Token Usage: {selectedPrompt?.performance_metrics?.avg_token_usage}</div>
      </div>
    </Modal>
  );
};
```

### Implementation Roadmap

#### Phase 1: Core Modal Infrastructure (2-3 weeks)
1. **Create Modal Components**
   - DeveloperPromptModal.jsx - Main modal with tabbed interface
   - DeveloperPromptTrigger.jsx - Floating action button
   - PromptEditorInterface.jsx - Monaco editor wrapper

2. **Security & Access Control**
   - Implement developer-only visibility logic
   - Add role-based permissions for prompt editing
   - Create audit logging for prompt changes

3. **Page Integration**
   - Add modal triggers to procurement pages (01900)
   - Implement keyboard shortcuts (Ctrl+Shift+P)
   - Create page-specific prompt loading

#### Phase 2: Testing Framework (2-3 weeks)
1. **Prompt Testing Interface**
   - Real-time prompt execution and result display
   - Performance metrics integration
   - Error handling and validation

2. **Multi-Function Testing Hub**
   - Unit test discovery and execution
   - Integration test workflows
   - Performance benchmarking tools

3. **UI/UX Testing Tools**
   - Accessibility auditing
   - Visual regression testing
   - Responsive design validation

#### Phase 3: Advanced Features (2-3 weeks)
1. **Collaborative Debugging**
   - Session sharing and collaborative editing
   - Result export and reporting
   - Team notification system

2. **AI-Powered Enhancements**
   - Automated test case generation
   - Issue prediction and prevention
   - Performance optimization suggestions

3. **Enterprise Integration**
   - CI/CD pipeline integration
   - Deployment gate validation
   - Organization-specific customization

### Success Metrics
- **Developer Adoption**: 100% of developers use modal for prompt iteration
- **Iteration Speed**: 5x faster prompt development cycles
- **Quality Improvement**: 50% reduction in prompt-related bugs
- **Testing Coverage**: 95% of prompts tested before deployment

### Business Impact
- **Accelerated AI Development**: Faster deployment of AI features
- **Improved Quality**: Better-tested prompts and AI capabilities
- **Enhanced Productivity**: Streamlined development workflows
- **Reduced Costs**: Fewer production issues from untested prompts

**Status: PLANNED BUT NOT IMPLEMENTED** - This comprehensive developer modal represents a critical missing component that would significantly enhance the procurement workflow development experience.

---

## 🤖 ANALYSIS & PROCESSING PROMPTS (12/24 Total)

### 1. procurement_analyzer_v1
**Category:** Procurement Workflow Agents  
**Pages Used:** ["01900", "02050"]  
**Workflow Stage:** Phase 1 - Order Creation  

**Functionality:**
- Analyzes uploaded procurement documents for structure and content
- Identifies document types (PO/WO/SO specifications)
- Extracts key procurement metadata (value, timeline, requirements)
- Validates document completeness before processing

**Integration Points:**
- Triggered during document upload in CreateOrderModal
- Feeds data to discipline assignment algorithms
- Provides context for template variation selection

**Success Criteria:**
- 95% accuracy in document type identification
- Extraction of 100% of required procurement metadata
- Processing time < 30 seconds for standard documents

### 2. procurement_scheduler_v1
**Category:** Procurement Workflow Agents  
**Pages Used:** ["01900", "00800"]  
**Workflow Stage:** Phase 1 - Order Creation  

**Functionality:**
- Extracts delivery schedules and timelines from procurement documents
- Identifies critical milestones and dependencies
- Converts unstructured schedule data into structured format
- Validates schedule completeness and logic

**Integration Points:**
- Provides data for Gantt chart initialization
- Feeds timeline data to procurement order records
- Triggers schedule validation workflows

**Success Criteria:**
- 90% accuracy in timeline extraction
- Identification of 95% of schedule dependencies
- Integration with project management systems

### 3. procurement_validator_v1
**Category:** Procurement Workflow Agents  
**Pages Used:** ["01900", "01300"]  
**Workflow Stage:** Phase 2 - SOW Generation  

**Functionality:**
- Validates procurement document compliance against standards
- Checks for completeness of required sections
- Identifies inconsistencies or missing information
- Provides compliance scoring and recommendations

**Integration Points:**
- Integrated with approval matrix system (01300)
- Triggers HITL review for non-compliant documents
- Provides validation feedback to document creators

**Success Criteria:**
- 98% accuracy in compliance detection
- Clear error messages for all validation failures
- Integration with organizational compliance frameworks

### 4. procurement_orchestrator_v1
**Category:** Procurement Workflow Agents  
**Pages Used:** ["01900", "00800-00872"]  
**Workflow Stage:** Phase 3 - Collaborative Development  

**Functionality:**
- Coordinates multi-discipline procurement workflows
- Manages inter-discipline communication and handoffs
- Optimizes task assignment based on agent capabilities
- Monitors workflow progress and identifies bottlenecks

**Integration Points:**
- Central coordinator for all procurement agents
- Interfaces with agent capability monitoring system
- Provides real-time status to MyTasksDashboard

**Success Criteria:**
- 100% successful task coordination across disciplines
- Real-time workflow status updates
- Automated bottleneck detection and resolution

### 5. appendix_extractor_v1
**Category:** Document Processing Agents  
**Pages Used:** ["01900"]  
**Workflow Stage:** Phase 3 - Appendix Development  

**Functionality:**
- Extracts structured data from procurement appendices A-F
- Identifies appendix types and required content sections
- Converts unstructured appendix content into form fields
- Validates appendix completeness against templates

**Integration Points:**
- Processes content for all 6 procurement appendices
- Feeds data to appendix-specific UI components
- Triggers validation workflows for each appendix type

**Success Criteria:**
- 95% accuracy in appendix type identification
- Extraction of 90%+ of structured data from appendices
- Proper mapping to procurement order records

### 6. gantt_processor_v1
**Category:** Document Processing Agents  
**Pages Used:** ["01900", "02050"]  
**Workflow Stage:** Phase 3 - Appendix C Development  

**Functionality:**
- Processes delivery schedule data for Gantt visualization
- Converts timeline information into Gantt chart format
- Identifies dependencies and critical paths
- Optimizes schedule layout for project management tools

**Integration Points:**
- Powers the dedicated Gantt Chart UI for Appendix C
- Integrates with Primavera P6, MS Project, and Asta Powerproject
- Synchronizes with procurement order timelines

**Success Criteria:**
- 100% compatibility with major project management tools
- Real-time sync with procurement order updates
- Accurate dependency and critical path identification

### 7. quality_validator_v1
**Category:** Document Processing Agents  
**Pages Used:** ["01900", "02200"]  
**Workflow Stage:** Phase 4 - Finalization  

**Functionality:**
- Validates overall document quality and completeness
- Checks consistency across all appendices and main documents
- Performs final compliance and formatting checks
- Provides quality scoring and improvement recommendations

**Integration Points:**
- Final quality gate before document assembly
- Integrated with approval workflows
- Provides quality metrics for continuous improvement

**Success Criteria:**
- 99% detection of quality issues
- Comprehensive quality scoring system
- Integration with organizational quality standards

### 8. technical_reviewer_v1
**Category:** HITL Review Agents  
**Pages Used:** ["00800-00872", "01900"]  
**Workflow Stage:** Phase 3 - Technical Review  

**Functionality:**
- Reviews technical specifications and requirements
- Validates engineering content accuracy
- Identifies technical inconsistencies or gaps
- Provides technical approval recommendations

**Integration Points:**
- Assigned to technical disciplines (00800-00872)
- Participates in multi-discipline review workflows
- Provides technical expertise for procurement decisions

**Success Criteria:**
- 95% accuracy in technical issue identification
- Clear technical feedback for document improvements
- Integration with engineering discipline workflows

### 9. compliance_reviewer_v1
**Category:** HITL Review Agents  
**Pages Used:** ["01300", "01750", "01900"]  
**Workflow Stage:** Phase 3 - Compliance Review  

**Functionality:**
- Reviews regulatory compliance and legal requirements
- Validates adherence to industry standards
- Identifies compliance risks and mitigation needs
- Provides legal and regulatory approval recommendations

**Integration Points:**
- Assigned to legal (01750) and governance (01300) disciplines
- Integrated with approval matrix system
- Provides compliance validation for procurement processes

**Success Criteria:**
- 100% compliance with applicable regulations
- Clear identification of compliance risks
- Integration with organizational compliance frameworks

### 10. schedule_reviewer_v1
**Category:** HITL Review Agents  
**Pages Used:** ["01900", "02000", "00300"]  
**Workflow Stage:** Phase 3 - Schedule Review  

**Functionality:**
- Reviews delivery schedules and critical paths
- Validates schedule realism and feasibility
- Identifies schedule risks and dependencies
- Provides scheduling expertise and recommendations

**Integration Points:**
- Assigned to project controls (02000) and construction (00300) disciplines
- Integrated with Gantt chart functionality
- Provides schedule validation for procurement timelines

**Success Criteria:**
- 90% accuracy in schedule risk identification
- Realistic schedule validation and optimization
- Integration with project scheduling systems

---

## 📝 DOCUMENT GENERATION PROMPTS (10/24 Total) - MISSING FROM SYSTEM

### 11. sow_generator_v1
**Category:** Core Procurement Documents  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 2 - SOW Generation  

**Functionality:**
- Generates complete Scope of Work documents from procurement requirements
- Creates structured SOW content with standard sections
- Incorporates technical specifications and requirements
- Ensures compliance with organizational SOW standards

**Integration Points:**
- Core component of SOW generation workflow
- Uses pre-selected template variations from Document Ordering Management
- Feeds content to collaborative editing interfaces

**Success Criteria:**
- Generation of 100% complete SOW documents
- Compliance with organizational SOW standards
- Integration with procurement order data

### 12. technical_specs_generator_v1
**Category:** Core Procurement Documents  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 2 - Technical Specifications  

**Functionality:**
- Generates technical specifications for procurement items
- Creates detailed product/service requirements
- Incorporates engineering and quality standards
- Ensures technical completeness and accuracy

**Integration Points:**
- Powers Appendix A generation workflow
- Integrates with engineering discipline inputs
- Provides foundation for supplier bidding

**Success Criteria:**
- 95% technically accurate specifications
- Compliance with industry technical standards
- Clear and unambiguous requirement statements

### 13. logistics_docs_generator_v1
**Category:** Core Procurement Documents  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 3 - Logistics Planning  

**Functionality:**
- Generates logistics and transportation documentation
- Creates shipping, customs, and delivery specifications
- Incorporates international trade requirements
- Ensures compliance with transportation regulations

**Integration Points:**
- Powers Appendix E generation workflow
- Integrates with procurement order shipping requirements
- Coordinates with supplier logistics capabilities

**Success Criteria:**
- 100% compliance with international shipping regulations
- Complete documentation package generation
- Integration with logistics management systems

### 14. contract_generator_v1
**Category:** Core Procurement Documents  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 4 - Contract Finalization  

**Functionality:**
- Generates complete procurement contracts
- Incorporates terms, conditions, and legal requirements
- Ensures compliance with organizational contract standards
- Creates legally binding procurement agreements

**Integration Points:**
- Final contract assembly from procurement workflow
- Integrates with approval matrix system (01300)
- Provides foundation for contract execution

**Success Criteria:**
- 100% legally compliant contract generation
- Incorporation of all negotiated terms and conditions
- Integration with electronic signature systems

### 15. appendix_a_generator_v1
**Category:** Appendix-Specific Generation  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 3 - Appendix A Development  

**Functionality:**
- Generates Appendix A - Product Specifications
- Creates detailed product requirement specifications
- Incorporates technical and quality requirements
- Ensures supplier bidding clarity

**Integration Points:**
- Assigned to technical disciplines (00800-00872)
- Integrated with product specification workflows
- Provides foundation for supplier technical proposals

**Success Criteria:**
- 95% complete and accurate product specifications
- Clear technical requirements for suppliers
- Integration with procurement order requirements

### 16. appendix_b_generator_v1
**Category:** Appendix-Specific Generation  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 3 - Appendix B Development  

**Functionality:**
- Generates Appendix B - Safety Data Sheets (SDS)
- Creates 16-section SDS documents
- Incorporates hazard identification and safety requirements
- Ensures compliance with safety regulations

**Integration Points:**
- Assigned to safety discipline (02400)
- Integrated with safety data management systems
- Provides comprehensive safety documentation

**Success Criteria:**
- 100% compliance with 16-section SDS requirements
- Accurate hazard identification and safety data
- Integration with organizational safety standards

### 17. appendix_c_generator_v1
**Category:** Appendix-Specific Generation  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 3 - Appendix C Development  

**Functionality:**
- Generates Appendix C - Delivery Schedules
- Creates detailed timeline and milestone specifications
- Incorporates dependencies and critical paths
- Ensures realistic delivery expectations

**Integration Points:**
- Powers Gantt chart initialization
- Integrated with project scheduling systems
- Provides foundation for delivery management

**Success Criteria:**
- 90% realistic and achievable delivery schedules
- Clear milestone definitions and dependencies
- Integration with procurement order timelines

### 18. appendix_d_generator_v1
**Category:** Appendix-Specific Generation  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 3 - Appendix D Development  

**Functionality:**
- Generates Appendix D - Technical Training Materials
- Creates equipment/material training documentation
- Incorporates safety and operational training requirements
- Ensures comprehensive training coverage

**Integration Points:**
- Assigned to technical disciplines (00800-00872)
- Integrated with training management systems
- Provides foundation for operator training programs

**Success Criteria:**
- 95% comprehensive training material coverage
- Clear training objectives and procedures
- Integration with organizational training standards

### 19. appendix_e_generator_v1
**Category:** Appendix-Specific Generation  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 3 - Appendix E Development  

**Functionality:**
- Generates Appendix E - Logistics Documents Specification
- Creates transportation and documentation requirements
- Incorporates customs and regulatory requirements
- Ensures complete logistics documentation

**Integration Points:**
- Assigned to logistics and procurement disciplines
- Integrated with supply chain management systems
- Provides foundation for logistics coordination

**Success Criteria:**
- 100% compliance with logistics regulations
- Complete documentation requirement specifications
- Integration with transportation management systems

### 20. appendix_f_generator_v1
**Category:** Appendix-Specific Generation  
**Status:** ❌ MISSING FROM SYSTEM  
**Workflow Stage:** Phase 3 - Appendix F Development  

**Functionality:**
- Generates Appendix F - Packing and Marking Specification
- Creates packaging and labeling requirements
- Incorporates preservation and protection standards
- Ensures proper material handling procedures

**Integration Points:**
- Assigned to quality and technical disciplines
- Integrated with packaging management systems
- Provides foundation for material preservation

**Success Criteria:**
- 95% complete packaging specification coverage
- Compliance with industry packaging standards
- Clear marking and preservation requirements

---

## 🔄 WORKFLOW INTEGRATION PROMPTS (4/24 Total)

### 21. sequence_optimizer_v1
**Category:** Sequence Management  
**Workflow Stage:** All Phases - Optimization  

**Functionality:**
- Optimizes document processing sequences for efficiency
- Learns from successful workflow patterns
- Predicts optimal processing order for new orders
- Continuously improves sequence intelligence

**Integration Points:**
- Powers the intelligent sequence management system
- Integrates with agent capability monitoring
- Provides real-time sequence optimization

**Success Criteria:**
- 20% improvement in average processing time
- 95% optimal sequence predictions
- Continuous learning from workflow outcomes

### 22. task_dispatcher_v1
**Category:** Task Management  
**Workflow Stage:** All Phases - Distribution  

**Functionality:**
- Dispatches tasks to appropriate agents based on capabilities
- Manages workload balancing across agent pool
- Handles task reassignment for failed or overloaded agents
- Optimizes task completion through intelligent routing

**Integration Points:**
- Core component of agent orchestration system
- Integrates with MyTasksDashboard
- Provides real-time task status and updates

**Success Criteria:**
- 100% successful task assignments
- Optimal workload distribution
- Real-time task status updates

### 23. content_validator_v1
**Category:** Quality Assurance  
**Workflow Stage:** Phase 4 - Quality Assurance  

**Functionality:**
- Validates quality of AI-generated content
- Checks consistency across all generated documents
- Identifies content gaps or inconsistencies
- Provides quality scoring and improvement recommendations

**Integration Points:**
- Final quality gate for all generated content
- Integrated with HITL review workflows
- Provides quality metrics for continuous improvement

**Success Criteria:**
- 95% detection of content quality issues
- Comprehensive quality scoring system
- Integration with organizational quality standards

### 24. consistency_checker_v1
**Category:** Quality Assurance  
**Workflow Stage:** Phase 4 - Final Validation  

**Functionality:**
- Checks consistency across all procurement documents
- Validates cross-references between appendices and main documents
- Identifies conflicting information or requirements
- Ensures document package coherence

**Integration Points:**
- Final validation before document assembly
- Integrated with document compilation system
- Provides consistency reports for review

**Success Criteria:**
- 98% detection of consistency issues
- Clear identification of conflicting information
- Integration with document assembly workflows

---

## 📊 IMPLEMENTATION STATUS SUMMARY

### Current System State
- **✅ Analysis & Processing:** 12/12 prompts documented (but may not be fully implemented)
- **❌ Document Generation:** 0/10 prompts exist in system
- **⚠️ Workflow Integration:** 2/4 prompts partially implemented
- **📈 Total Coverage:** 14/24 prompts (58%)

### Critical Implementation Gaps
1. **Complete absence of document generation capabilities**
2. **Missing core procurement document creation prompts**
3. **No appendix-specific content generation prompts**
4. **Limited workflow integration prompt coverage**

### Priority Implementation Order
1. **High Priority:** sow_generator_v1, technical_specs_generator_v1, contract_generator_v1
2. **Medium Priority:** Appendix generators (A-F), logistics_docs_generator_v1
3. **Low Priority:** Enhanced workflow integration prompts

### Success Metrics
- **Document Generation Coverage:** 0% → 100% (10 new prompts needed)
- **Workflow Integration:** 50% → 100% (2 additional prompts needed)
- **End-to-End Automation:** 50% → 100% (complete AI-powered workflow)

---

## 🔧 DEVELOPMENT REQUIREMENTS

### Prompt Management System Extensions Needed
1. **Generation Prompt Category:** New prompt type for content creation
2. **Template Integration:** Links to document templates and structures
3. **Validation Frameworks:** Quality assurance for generated content
4. **Multi-Discipline Coordination:** Cross-discipline content generation

### Infrastructure Requirements
1. **Enhanced AI Models:** Content generation capabilities beyond analysis
2. **Template Libraries:** Structured document templates for generation
3. **Quality Validation:** Automated checking of generated content
4. **Version Control:** Tracking of generated document versions

### Testing & Validation Framework
1. **Generation Accuracy Testing:** Validation of generated content quality
2. **Template Compliance:** Verification against organizational standards
3. **Cross-Document Consistency:** Validation of document package coherence
4. **Performance Benchmarking:** Generation speed and resource usage metrics

---

## 🎯 CONCLUSION

This comprehensive inventory reveals that while the procurement workflow rationalization plan provides an excellent vision for AI-powered procurement automation, significant development work remains to implement the **12 missing document generation prompts**. The current system excels at document analysis and processing but lacks the core capability to generate procurement documents, which is essential for achieving the workflow's automation goals.

**Next Steps:**
1. Prioritize development of core document generation prompts
2. Extend prompt management system for generation capabilities
3. Implement comprehensive testing and validation frameworks
4. Develop template libraries and quality assurance systems


#### 🪄 Magic Wand Prompt Enhancement Feature

##### Overview
The **Magic Wand** is an AI-powered prompt optimization feature that provides **one-click intelligent prompt improvements**. This feature uses advanced prompt engineering techniques to analyze, enhance, and optimize prompts automatically, dramatically accelerating AI development workflows.

##### Core Functionality

###### 1. AI-Powered Prompt Analysis
```javascript
// Magic Wand Prompt Analysis Engine
const MagicWandAnalyzer = {
  analyzePrompt: async (promptContent, context) => {
    // Multi-dimensional prompt analysis
    const analysis = await Promise.all([
      analyzePromptStructure(promptContent),
      analyzePromptClarity(promptContent),
      analyzePromptSpecificity(promptContent),
      analyzePromptEfficiency(promptContent),
      analyzeDomainAlignment(promptContent, context.domain),
      analyzePerformancePatterns(promptContent, context.history)
    ]);

    return {
      score: calculateOverallScore(analysis),
      issues: extractIssues(analysis),
      opportunities: identifyImprovements(analysis),
      confidence: calculateConfidenceLevel(analysis)
    };
  },

  // Prompt structure analysis
  analyzePromptStructure: (content) => {
    return {
      hasClearInstructions: checkInstructionClarity(content),
      hasContextSetting: checkContextPresence(content),
      hasExamples: checkExampleInclusion(content),
      hasConstraints: checkConstraintSpecification(content),
      hasOutputFormat: checkOutputFormat(content)
    };
  },

  // Domain-specific analysis
  analyzeDomainAlignment: (content, domain) => {
    const domainPatterns = getDomainPatterns(domain); // procurement, technical, compliance, etc.
    return {
      alignmentScore: calculateDomainAlignment(content, domainPatterns),
      missingElements: identifyMissingDomainElements(content, domainPatterns),
      domainSpecificSuggestions: generateDomainSuggestions(content, domain)
    };
  }
};
```

###### 2. One-Click Enhancement Engine
```javascript
// One-Click Prompt Enhancement
const MagicWandEnhancer = {
  enhancePrompt: async (originalPrompt, analysis, enhancementLevel = "balanced") => {
    // Enhancement strategies based on confidence and impact
    const enhancementStrategies = {
      conservative: {
        // Safe improvements with high confidence
        confidenceThreshold: 0.8,
        maxChanges: 3,
        riskLevel: "low"
      },
      balanced: {
        // Moderate improvements balancing safety and impact
        confidenceThreshold: 0.6,
        maxChanges: 5,
        riskLevel: "medium"
      },
      aggressive: {
        // Maximum improvements for experienced users
        confidenceThreshold: 0.4,
        maxChanges: 8,
        riskLevel: "high"
      }
    };

    const strategy = enhancementStrategies[enhancementLevel];

    // Apply enhancements in priority order
    const enhancements = await generateEnhancements(originalPrompt, analysis, strategy);

    return {
      enhancedPrompt: applyEnhancements(originalPrompt, enhancements),
      appliedChanges: enhancements,
      confidenceScore: calculateEnhancementConfidence(enhancements),
      improvementEstimate: estimatePerformanceImprovement(enhancements),
      rollbackPlan: createRollbackPlan(originalPrompt, enhancements)
    };
  },

  // Generate specific enhancements
  generateEnhancements: async (prompt, analysis, strategy) => {
    const enhancements = [];

    // Priority 1: Fix critical issues
    if (analysis.issues.critical.length > 0) {
      enhancements.push(...generateCriticalFixes(analysis.issues.critical));
    }

    // Priority 2: Apply proven patterns
    if (analysis.opportunities.patterns.length > 0) {
      enhancements.push(...applyProvenPatterns(analysis.opportunities.patterns, strategy));
    }

    // Priority 3: Optimize for domain
    if (analysis.opportunities.domainSpecific.length > 0) {
      enhancements.push(...applyDomainOptimizations(analysis.opportunities.domainSpecific));
    }

    // Priority 4: Performance improvements
    if (analysis.opportunities.performance.length > 0) {
      enhancements.push(...applyPerformanceOptimizations(analysis.opportunities.performance));
    }

    return enhancements.slice(0, strategy.maxChanges);
  }
};
```

###### 3. A/B Testing Framework
```javascript
// Automatic A/B Test Generation for Prompt Optimization
const PromptABTester = {
  generateVariations: async (originalPrompt, enhancement) => {
    // Generate multiple prompt variations for testing
    const variations = await Promise.all([
      createConservativeVariation(originalPrompt, enhancement),
      createModerateVariation(originalPrompt, enhancement),
      createAggressiveVariation(originalPrompt, enhancement),
      createHybridVariation(originalPrompt, enhancement)
    ]);

    return {
      variations,
      testScenarios: generateTestScenarios(variations),
      evaluationMetrics: defineEvaluationMetrics(),
      statisticalSignificance: calculateRequiredSampleSize()
    };
  },

  // Automated test execution
  executeABTest: async (variations, testScenarios) => {
    const results = [];

    for (const scenario of testScenarios) {
      for (const variation of variations) {
        const result = await runTestScenario(variation, scenario);
        results.push({
          variationId: variation.id,
          scenarioId: scenario.id,
          metrics: result.metrics,
          timestamp: new Date(),
          confidence: result.confidence
        });
      }
    }

    return {
      winner: determineWinningVariation(results),
      statisticalSignificance: calculateStatisticalSignificance(results),
      performanceImprovement: calculateImprovement(results),
      recommendations: generateRecommendations(results)
    };
  }
};
```

##### User Interface Design

###### Magic Wand Button
```jsx
// Magic Wand Enhancement Button Component
const MagicWandButton = ({ promptId, currentPrompt, onEnhancement }) => {
  const [enhancementLevel, setEnhancementLevel] = useState("balanced");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState(null);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      // Step 1: Analyze current prompt
      const analysis = await MagicWandAnalyzer.analyzePrompt(currentPrompt);

      // Step 2: Generate enhancement
      const enhancement = await MagicWandEnhancer.enhancePrompt(
        currentPrompt,
        analysis,
        enhancementLevel
      );

      // Step 3: Show results with confidence scoring
      setEnhancementResult({
        original: currentPrompt,
        enhanced: enhancement.enhancedPrompt,
        changes: enhancement.appliedChanges,
        confidence: enhancement.confidenceScore,
        improvement: enhancement.improvementEstimate
      });

      onEnhancement(enhancement.enhancedPrompt);
    } catch (error) {
      console.error("Enhancement failed:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="magic-wand-container">
      <button
        className="magic-wand-button"
        onClick={handleEnhance}
        disabled={isEnhancing}
        title="AI-powered prompt enhancement"
      >
        {isEnhancing ? (
          <Spinner size="small" />
        ) : (
          <MagicWandIcon />
        )}
        Magic Wand
      </button>

      <select
        value={enhancementLevel}
        onChange={(e) => setEnhancementLevel(e.target.value)}
      >
        <option value="conservative">Conservative</option>
        <option value="balanced">Balanced</option>
        <option value="aggressive">Aggressive</option>
      </select>

      {enhancementResult && (
        <EnhancementResultsModal
          result={enhancementResult}
          onApply={() => onEnhancement(enhancementResult.enhanced)}
          onDiscard={() => setEnhancementResult(null)}
        />
      )}
    </div>
  );
};
```

##### Success Metrics
- **Enhancement Accuracy**: 85% of AI-suggested improvements increase prompt performance
- **Developer Adoption**: 95% of developers use Magic Wand for prompt optimization
- **Time Savings**: 70% reduction in manual prompt optimization time
- **Quality Improvement**: 60% average improvement in prompt performance metrics

##### Business Impact
- **Accelerated Development**: 10x faster prompt iteration and optimization cycles
- **Improved AI Quality**: Higher-performing prompts across all procurement workflows
- **Reduced Costs**: Less time spent on manual prompt engineering
- **Competitive Advantage**: Superior AI capabilities through optimized prompts

**Status: PROPOSED ENHANCEMENT** - The Magic Wand feature represents the next evolution of the developer modal, transforming it from a testing tool into an AI-powered optimization platform.
