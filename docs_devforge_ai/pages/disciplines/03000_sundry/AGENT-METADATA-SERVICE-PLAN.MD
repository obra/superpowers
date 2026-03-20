# General Data Agent as Metadata Service & Debugging Tool

## Overview

The General Data Agent is not just for end-user queries - it serves as a **centralized metadata service** that can be leveraged by:
1. **Other agents** (for context and guidance)
2. **Code generators** (for understanding system structure)
3. **Debugging tools** (for analyzing existing and new code)
4. **Development workflows** (for validation and verification)

## Use Case 1: Metadata Service for Other Agents

### How Discipline Agents Can Use It

When generating or executing discipline-specific agents, they can query the General Data Agent for:

#### 1.1 Organization Context
```javascript
import { generalDataAgent } from './services/agents/general-data-agent.js';

// Discipline agent needs to know about organization structure
async function getOrganizationContext(organizationId) {
  const orgInfo = await generalDataAgent.getOrganizationInfo(organizationId);
  
  return {
    name: orgInfo.name,
    sector: orgInfo.sector,
    totalPages: orgInfo.totalPages,
    disciplinePages: orgInfo.disciplinePages.length,
    nonDisciplinePages: orgInfo.nonDisciplinePages.length,
    availablePageTypes: [...new Set(orgInfo.disciplinePages.map(p => p.page_type))]
  };
}

// Example: Procurement Agent getting EPCM context
const epcmContext = await getOrganizationContext('epcm');
// Returns: { name: 'Organisations - EPCM', sector: 'Engineering Procurement Construction Management', ... }
```

#### 1.2 Page Type Validation
```javascript
// Validate if a page type exists before creating a discipline agent
async function validatePageType(pageType) {
  const pageTypes = await generalDataAgent.getPageTypes();
  const typeExists = pageTypes.some(pt => pt.type === pageType);
  
  if (!typeExists) {
    throw new Error(`Invalid page type: ${pageType}. Available types: ${pageTypes.map(pt => pt.type).join(', ')}`);
  }
  
  return true;
}

// Example: Validate before creating a discipline agent
await validatePageType('discipline_pages'); // ✅ Valid
// await validatePageType('invalid_type'); // ❌ Throws error
```

#### 1.3 Page Discovery for Training Data
```javascript
// Find relevant pages for discipline agent training
async function discoverRelevantPages(disciplineName) {
  const allPages = await generalDataAgent.searchPages(disciplineName);
  
  // Filter to discipline pages only
  const disciplinePages = allPages.results.filter(p => 
    p.page_type === 'discipline_pages'
  );
  
  return {
    count: disciplinePages.length,
    pages: disciplinePages.map(p => ({
      name: p.page_name,
      slug: p.page_slug,
      prefix: p.page_prefix,
      organization: p.organization
    }))
  };
}

// Example: Find all "procurement" related pages
const procurementPages = await discoverRelevantPages('procurement');
// Returns: { count: 10, pages: [...] }
```

### 1.4 Cross-Agent Communication Protocol
```javascript
// Standard protocol for agents to request metadata from General Data Agent
class AgentMetadataRequest {
  constructor(agentId, requestType, parameters) {
    this.agentId = agentId;
    this.requestType = requestType; // 'organization', 'page_type', 'search', 'validation'
    this.parameters = parameters;
    this.timestamp = new Date().toISOString();
  }
}

class AgentMetadataResponse {
  constructor(request, data, status = 'success') {
    this.request = request;
    this.data = data;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }
}

// Example: Discipline agent requesting metadata
async function requestMetadata(requestType, parameters) {
  const request = new AgentMetadataRequest(
    'procurement-agent-v1',
    requestType,
    parameters
  );
  
  let data;
  switch (requestType) {
    case 'organization':
      data = await generalDataAgent.getOrganizationInfo(parameters.organizationId);
      break;
    case 'page_type':
      data = await generalDataAgent.getPageTypes();
      break;
    case 'search':
      data = await generalDataAgent.searchPages(parameters.query);
      break;
    case 'validation':
      data = await validatePageType(parameters.pageType);
      break;
  }
  
  return new AgentMetadataResponse(request, data);
}

// Usage
const orgResponse = await requestMetadata('organization', { organizationId: 'epcm' });
console.log(orgResponse.data); // Organization info
```

## Use Case 2: Debugging Tool

### 2.1 Code Structure Analysis
```javascript
// Analyze code against system structure
import { generalDataAgent } from './services/agents/general-data-agent.js';

async function analyzeCodeAgainstSystemStructure(code, filePath) {
  const issues = [];
  const suggestions = [];
  
  // Check if file references valid page types
  const pageTypes = await generalDataAgent.getPageTypes();
  const validPageTypes = pageTypes.map(pt => pt.type);
  
  // Extract page type references from code
  const pageTypeRegex = /page_type['":\s]+['"]([^'"]+)['"]/g;
  const matches = [...code.matchAll(pageTypeRegex)];
  
  matches.forEach(match => {
    const pageType = match[1];
    if (!validPageTypes.includes(pageType)) {
      issues.push({
        type: 'INVALID_PAGE_TYPE',
        location: `${filePath}:${match.index}`,
        pageType: pageType,
        validOptions: validPageTypes
      });
    }
  });
  
  // Check if organization references are valid
  const organizations = await generalDataAgent.getOrganizations();
  const validOrgs = organizations.map(o => o.id);
  
  const orgRegex = /organization['":\s]+['"]([^'"]+)['"]/g;
  const orgMatches = [...code.matchAll(orgRegex)];
  
  orgMatches.forEach(match => {
    const orgId = match[1];
    if (!validOrgs.includes(orgId)) {
      issues.push({
        type: 'INVALID_ORGANIZATION',
        location: `${filePath}:${match.index}`,
        organizationId: orgId,
        validOptions: validOrgs
      });
    }
  });
  
  // Generate suggestions
  if (issues.length === 0) {
    suggestions.push('✅ Code structure matches system architecture');
  } else {
    suggestions.push('⚠️  Code structure has validation issues');
  }
  
  return {
    issues,
    suggestions,
    summary: {
      totalIssues: issues.length,
      byType: issues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {})
    }
  };
}

// Example usage
const code = `
const pageConfig = {
  page_type: "discipline_pages",
  organization: "epcm",
  sector: "Engineering Procurement Construction Management"
};
`;

const analysis = await analyzeCodeAgainstSystemStructure(code, 'src/config.js');
console.log(analysis);
// Output:
// {
//   issues: [],
//   suggestions: ['✅ Code structure matches system architecture'],
//   summary: { totalIssues: 0, byType: {} }
// }
```

### 2.2 Database Schema Validation
```javascript
// Validate database schema against system structure
async function validateDatabaseSchema(schema) {
  const issues = [];
  const warnings = [];
  
  // Get all valid page types and organizations
  const [pageTypes, organizations] = await Promise.all([
    generalDataAgent.getPageTypes(),
    generalDataAgent.getOrganizations()
  ]);
  
  // Validate table names
  schema.tables.forEach(table => {
    // Check if table follows naming convention
    const namingConvention = /^(discipline|data_management|document_processing|landing)_(pages|data)$/i;
    if (!namingConvention.test(table.name)) {
      warnings.push({
        type: 'NAMING_CONVENTION',
        table: table.name,
        suggestion: `Consider prefixing with page type (e.g., discipline_${table.name})`
      });
    }
    
    // Validate referenced organization
    if (table.organization) {
      const orgExists = organizations.some(org => org.id === table.organization);
      if (!orgExists) {
        issues.push({
          type: 'INVALID_ORGANIZATION_REFERENCE',
          table: table.name,
          organization: table.organization,
          validOptions: organizations.map(o => o.id)
        });
      }
    }
    
    // Validate page type
    if (table.page_type) {
      const typeExists = pageTypes.some(pt => pt.type === table.page_type);
      if (!typeExists) {
        issues.push({
          type: 'INVALID_PAGE_TYPE_REFERENCE',
          table: table.name,
          pageType: table.page_type,
          validOptions: pageTypes.map(pt => pt.type)
        });
      }
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    summary: {
      tables: schema.tables.length,
      validTables: schema.tables.length - issues.length,
      issuesByType: issues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {})
    }
  };
}

// Example usage
const schema = {
  tables: [
    { name: 'discipline_procurement', organization: 'epcm', page_type: 'discipline_pages' },
    { name: 'procurement_data', organization: 'invalid_org', page_type: 'data_management' }
  ]
};

const validation = await validateDatabaseSchema(schema);
console.log(validation);
// Output:
// {
//   valid: false,
//   issues: [
//     {
//       type: 'INVALID_ORGANIZATION_REFERENCE',
//       table: 'procurement_data',
//       organization: 'invalid_org',
//       validOptions: ['contractors', 'epcm', 'judicial', 'shared']
//     }
//   ],
//   warnings: [...],
//   summary: { ... }
// }
```

### 2.3 API Endpoint Validation
```javascript
// Validate API endpoints against system structure
async function validateApiEndpoints(endpoints) {
  const validationResults = [];
  
  const [organizations, pageTypes] = await Promise.all([
    generalDataAgent.getOrganizations(),
    generalDataAgent.getPageTypes()
  ]);
  
  endpoints.forEach(endpoint => {
    const issues = [];
    const warnings = [];
    
    // Validate path parameters
    if (endpoint.path.includes(':organizationId')) {
      const pathMatch = endpoint.path.match(/:organizationId=(\w+)/);
      if (pathMatch) {
        const orgId = pathMatch[1];
        const orgExists = organizations.some(org => org.id === orgId);
        if (!orgExists) {
          issues.push({
            type: 'INVALID_PATH_PARAMETER',
            parameter: 'organizationId',
            value: orgId,
            validOptions: organizations.map(o => o.id)
          });
        }
      }
    }
    
    if (endpoint.path.includes(':pageType')) {
      const pathMatch = endpoint.path.match(/:pageType=(\w+)/);
      if (pathMatch) {
        const pageType = pathMatch[1];
        const typeExists = pageTypes.some(pt => pt.type === pageType);
        if (!typeExists) {
          issues.push({
            type: 'INVALID_PATH_PARAMETER',
            parameter: 'pageType',
            value: pageType,
            validOptions: pageTypes.map(pt => pt.type)
          });
        }
      }
    }
    
    // Validate query parameters
    if (endpoint.queryParams) {
      endpoint.queryParams.forEach(param => {
        if (param.name === 'organization') {
          const orgExists = organizations.some(org => 
            org.id === param.value || org.name.toLowerCase().includes(param.value.toLowerCase())
          );
          if (!orgExists) {
            issues.push({
              type: 'INVALID_QUERY_PARAMETER',
              parameter: 'organization',
              value: param.value,
              validOptions: organizations.map(o => o.id)
            });
          }
        }
      });
    }
    
    validationResults.push({
      endpoint: endpoint.path,
      method: endpoint.method,
      issues,
      warnings,
      valid: issues.length === 0
    });
  });
  
  return validationResults;
}

// Example usage
const endpoints = [
  {
    path: '/api/pages/:organizationId=epcm',
    method: 'GET',
    queryParams: []
  },
  {
    path: '/api/pages/search',
    method: 'GET',
    queryParams: [
      { name: 'organization', value: 'invalid_org' }
    ]
  }
];

const endpointValidation = await validateApiEndpoints(endpoints);
console.log(endpointValidation);
// Output shows which endpoints are valid and which have issues
```

## Use Case 3: Code Generation Assistance

### 3.1 Generate Agent Templates
```javascript
// Generate agent templates based on system structure
async function generateAgentTemplate(agentType, discipline) {
  const [organizations, pageTypes] = await Promise.all([
    generalDataAgent.getOrganizations(),
    generalDataAgent.getPageTypes()
  ]);
  
  // Find relevant pages for this discipline
  const searchResults = await generalDataAgent.searchPages(discipline);
  const relevantPages = searchResults.results.filter(p => 
    p.page_type === 'discipline_pages'
  );
  
  // Generate template code
  const template = `
/**
 * ${discipline} Agent
 * 
 * Generated: ${new Date().toISOString()}
 * Based on: ${relevantPages.length} relevant pages in system
 */

import { generalDataAgent } from '../general-data-agent.js';

class ${discipline.replace(/[^a-zA-Z0-9]/g, '')}Agent {
  constructor() {
    this.name = '${discipline} Agent';
    this.description = 'Specialized agent for ${discipline} domain';
    this.discipline = '${discipline.toLowerCase()}';
    
    // Get system context
    this.context = {
      organizations: ${JSON.stringify(organizations.map(o => ({ id: o.id, name: o.name })), null, 2)},
      pageTypes: ${JSON.stringify(pageTypes.map(pt => ({ type: pt.type, name: pt.name })), null, 2)},
      relevantPages: ${JSON.stringify(relevantPages.map(p => ({ name: p.page_name, slug: p.page_slug, organization: p.organization })), null, 2)}
    };
    
    // Cache for frequently accessed data
    this.cache = new Map();
  }
  
  /**
   * Validate input against system structure
   */
  async validateInput(input) {
    const issues = [];
    
    // Validate organization
    if (input.organization) {
      const orgExists = this.context.organizations.some(org => 
        org.id === input.organization || org.name.toLowerCase().includes(input.organization.toLowerCase())
      );
      if (!orgExists) {
        issues.push(\`Invalid organization: \${input.organization}\`);
      }
    }
    
    // Validate page type
    if (input.pageType) {
      const typeExists = this.context.pageTypes.some(pt => pt.type === input.pageType);
      if (!typeExists) {
        issues.push(\`Invalid page type: \${input.pageType}\`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Process ${discipline} query
   */
  async processQuery(query) {
    // Use General Data Agent for metadata
    const metadata = await generalDataAgent.answerGeneralQuestion(
      \`What pages exist for \${this.discipline} in the system?\`
    );
    
    // Process query based on metadata
    return {
      agent: this.name,
      query,
      metadata: metadata.details,
      response: \`Processing \${query} in \${this.discipline} context...\`
    };
  }
  
  /**
   * Get agent metadata
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      discipline: this.discipline,
      systemContext: this.context,
      capabilities: [
        'Process discipline-specific queries',
        'Validate against system structure',
        'Use General Data Agent for metadata'
      ]
    };
  }
}

// Export singleton
export const ${discipline.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}Agent = new ${discipline.replace(/[^a-zA-Z0-9]/g, '')}Agent();
export default ${discipline.replace(/[^a-zA-Z0-9]/g, '')}Agent;
`;

  return template;
}

// Example: Generate Procurement Agent template
const procurementTemplate = await generateAgentTemplate('javascript', 'procurement');
console.log(procurementTemplate);
// Generates a complete agent template with system context
```

### 3.2 Generate Integration Code
```javascript
// Generate integration code between agents
async function generateIntegrationCode(sourceAgent, targetAgent) {
  const [sourceOrgs, targetOrgs] = await Promise.all([
    generalDataAgent.getOrganizationInfo(sourceAgent.organization),
    generalDataAgent.getOrganizationInfo(targetAgent.organization)
  ]);
  
  const code = `
/**
 * Integration between ${sourceAgent.name} and ${targetAgent.name}
 * 
 * Generated integration code
 */

import { ${sourceAgent.name} } from './${sourceAgent.name}.js';
import { ${targetAgent.name} } from './${targetAgent.name}.js';
import { generalDataAgent } from '../general-data-agent.js';

class ${sourceAgent.name}${targetAgent.name}Integration {
  constructor() {
    this.source = ${sourceAgent.name};
    this.target = ${targetAgent.name};
    this.metadata = {
      sourceOrganization: ${JSON.stringify(sourceOrgs, null, 2)},
      targetOrganization: ${JSON.stringify(targetOrgs, null, 2)}
    };
  }
  
  /**
   * Cross-agent query with metadata validation
   */
  async crossAgentQuery(sourceQuery, targetQuery) {
    // Get metadata from both agents
    const sourceMetadata = await this.source.getMetadata();
    const targetMetadata = await this.target.getMetadata();
    
    // Validate against system structure
    const systemValidation = await generalDataAgent.answerGeneralQuestion(
      \`Are ${sourceAgent.name} and ${targetAgent.name} compatible?\`
    );
    
    // Execute cross-agent query
    const sourceResult = await this.source.processQuery(sourceQuery);
    const targetResult = await this.target.processQuery(targetQuery);
    
    return {
      integration: '${sourceAgent.name} ↔ ${targetAgent.name}',
      validation: systemValidation,
      results: {
        source: sourceResult,
        target: targetResult
      },
      metadata: {
        source: sourceMetadata,
        target: targetMetadata,
        system: this.metadata
      }
    };
  }
  
  /**
   * Data transfer with validation
   */
  async transferData(sourceData, targetConfig) {
    // Validate source data against source organization
    const sourceValidation = await generalDataAgent.getOrganizationInfo(
      sourceAgent.organization
    );
    
    // Validate target configuration
    const targetValidation = await generalDataAgent.getOrganizationInfo(
      targetAgent.organization
    );
    
    // Check if data transfer is valid
    const isValid = sourceValidation.sector === targetValidation.sector || 
                    sourceValidation.sector === 'Shared' ||
                    targetValidation.sector === 'Shared';
    
    if (!isValid) {
      throw new Error(\`Cannot transfer data from \${sourceValidation.sector} to \${targetValidation.sector}\`);
    }
    
    return {
      success: true,
      source: sourceValidation,
      target: targetValidation,
      data: sourceData,
      config: targetConfig
    };
  }
}

export const ${sourceAgent.name}${targetAgent.name}Integration = new ${sourceAgent.name}${targetAgent.name}Integration();
`;

  return code;
}
```

## Use Case 4: Testing & Validation

### 4.1 Test Data Generation
```javascript
// Generate test data based on system structure
async function generateTestData(scenario) {
  const [organizations, pageTypes] = await Promise.all([
    generalDataAgent.getOrganizations(),
    generalDataAgent.getPageTypes()
  ]);
  
  const testData = {
    scenario,
    timestamp: new Date().toISOString(),
    data: []
  };
  
  // Generate organization-based test data
  organizations.forEach(org => {
    testData.data.push({
      type: 'organization_test',
      organization: org.id,
      name: org.name,
      sector: org.sector,
      expectedPageCount: org.pageCounts.discipline + org.pageCounts.nonDiscipline,
      testCases: [
        {
          name: 'Organization exists',
          input: { organizationId: org.id },
          expected: { valid: true }
        },
        {
          name: 'Organization name matches',
          input: { organizationName: org.name },
          expected: { valid: true, organizationId: org.id }
        }
      ]
    });
  });
  
  // Generate page type test data
  pageTypes.forEach(pt => {
    testData.data.push({
      type: 'page_type_test',
      pageType: pt.type,
      name: pt.name,
      total: pt.total,
      testCases: [
        {
          name: 'Page type exists',
          input: { pageType: pt.type },
          expected: { valid: true }
        },
        {
          name: 'Page type has examples',
          input: { pageType: pt.type },
          expected: { examples: pt.examples }
        }
      ]
    });
  });
  
  // Generate search test data
  const searchTests = [
    { query: 'procurement', expectedMinResults: 1 },
    { query: 'safety', expectedMinResults: 1 },
    { query: 'engineering', expectedMinResults: 1 }
  ];
  
  for (const test of searchTests) {
    const results = await generalDataAgent.searchPages(test.query);
    testData.data.push({
      type: 'search_test',
      query: test.query,
      expectedMinResults: test.expectedMinResults,
      actualResults: results.total,
      passed: results.total >= test.expectedMinResults
    });
  }
  
  return testData;
}

// Example usage
const testScenarios = [
  'unit_testing',
  'integration_testing',
  'performance_testing'
];

const testData = await generateTestData('unit_testing');
console.log(testData);
```

### 4.2 Contract Testing
```javascript
// Test contracts between agents
async function testAgentContracts(agent1, agent2, contract) {
  const validationResults = [];
  
  // Get system structure
  const systemInfo = await generalDataAgent.getSystemOverview();
  
  // Test contract clauses
  for (const clause of contract.clauses) {
    let result = {
      clause: clause.description,
      status: 'pending',
      details: {}
    };
    
    try {
      switch (clause.type) {
        case 'data_structure':
          // Validate data structure against system
          const isValid = await validateDataStructure(
            clause.dataStructure,
            clause.expectedOrganizations || [],
            clause.expectedPageTypes || []
          );
          result.status = isValid ? 'passed' : 'failed';
          result.details = { validation: isValid };
          break;
          
        case 'api_compatibility':
          // Test API compatibility
          const apiValid = await testApiCompatibility(
            clause.endpoint,
            clause.method,
            clause.expectedResponse
          );
          result.status = apiValid ? 'passed' : 'failed';
          result.details = { apiValid };
          break;
          
        case 'metadata_consistency':
          // Check metadata consistency
          const metadataValid = await checkMetadataConsistency(
            agent1,
            agent2,
            clause.fields
          );
          result.status = metadataValid ? 'passed' : 'failed';
          result.details = { metadataValid };
          break;
      }
    } catch (error) {
      result.status = 'error';
      result.details = { error: error.message };
    }
    
    validationResults.push(result);
  }
  
  // Generate contract test report
  const report = {
    agents: [agent1.name, agent2.name],
    contract: contract.name,
    totalClauses: contract.clauses.length,
    passed: validationResults.filter(r => r.status === 'passed').length,
    failed: validationResults.filter(r => r.status === 'failed').length,
    errors: validationResults.filter(r => r.status === 'error').length,
    systemInfo,
    details: validationResults
  };
  
  return report;
}

// Example contract
const procurementContract = {
  name: 'Procurement Agent Contract',
  clauses: [
    {
      type: 'data_structure',
      description: 'Procurement data must reference valid organizations',
      dataStructure: { organization: 'epcm', page_type: 'discipline_pages' },
      expectedOrganizations: ['epcm'],
      expectedPageTypes: ['discipline_pages']
    },
    {
      type: 'api_compatibility',
      description: 'Search endpoint must return valid page types',
      endpoint: '/api/pages/search',
      method: 'GET',
      expectedResponse: { pages: 'array', page_type: 'string' }
    }
  ]
};
```

## Integration Points

### 1. Agent Factory Integration
```javascript
// Enhanced agent factory using General Data Agent
import { generalDataAgent } from './general-data-agent.js';

class AgentFactory {
  static async createAgent(agentConfig) {
    // Validate agent configuration against system
    const validation = await this.validateAgentConfig(agentConfig);
    
    if (!validation.valid) {
      throw new Error(`Invalid agent configuration: ${validation.issues.join(', ')}`);
    }
    
    // Get system context
    const systemContext = await generalDataAgent.getSystemOverview();
    
    // Generate agent
    const agent = {
      ...agentConfig,
      context: {
        system: systemContext,
        organizations: await generalDataAgent.getOrganizations(),
        pageTypes: await generalDataAgent.getPageTypes()
      },
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0',
        systemVersion: '2026-01-29'
      }
    };
    
    return agent;
  }
  
  static async validateAgentConfig(config) {
    const issues = [];
    
    // Validate against system structure
    const [organizations, pageTypes] = await Promise.all([
      generalDataAgent.getOrganizations(),
      generalDataAgent.getPageTypes()
    ]);
    
    if (config.organization && !organizations.some(org => org.id === config.organization)) {
      issues.push(`Invalid organization: ${config.organization}`);
    }
    
    if (config.pageType && !pageTypes.some(pt => pt.type === config.pageType)) {
      issues.push(`Invalid page type: ${config.pageType}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Usage
const procurementAgent = await AgentFactory.createAgent({
  name: 'Procurement Agent',
  type: 'javascript',
  organization: 'epcm',
  pageType: 'discipline_pages'
});
```

### 2. Development Workflow Integration
```javascript
// CLI tool for development workflows
import { generalDataAgent } from './general-data-agent.js';
import readline from 'readline';

class DevelopmentWorkflow {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  async start() {
    console.log('🔧 Development Workflow Assistant');
    console.log('=================================\n');
    
    await this.showMainMenu();
  }
  
  async showMainMenu() {
    const options = [
      '1. Validate new agent configuration',
      '2. Generate test data for agent',
      '3. Analyze code structure',
      '4. Check system compatibility',
      '5. Exit'
    ];
    
    console.log(options.join('\n'));
    
    this.rl.question('\nSelect option: ', async (answer) => {
      switch (answer) {
        case '1':
          await this.validateAgent();
          break;
        case '2':
          await this.generateTestData();
          break;
        case '3':
          await this.analyzeCode();
          break;
        case '4':
          await this.checkCompatibility();
          break;
        case '5':
          this.rl.close();
          return;
        default:
          console.log('Invalid option\n');
          await this.showMainMenu();
      }
    });
  }
  
  async validateAgent() {
    this.rl.question('Enter organization ID: ', async (orgId) => {
      const orgInfo = await generalDataAgent.getOrganizationInfo(orgId);
      
      if (!orgInfo) {
        console.log(`❌ Organization "${orgId}" not found\n`);
        await this.showMainMenu();
        return;
      }
      
      console.log(`✅ Organization found: ${orgInfo.name}`);
      console.log(`   Sector: ${orgInfo.sector}`);
      console.log(`   Total pages: ${orgInfo.totalPages}`);
      console.log(`   Discipline pages: ${orgInfo.disciplinePages.length}`);
      console.log(`   Non-discipline pages: ${orgInfo.nonDisciplinePages.length}\n`);
      
      await this.showMainMenu();
    });
  }
  
  async generateTestData() {
    const testData = await generateTestData('development');
    console.log('✅ Test data generated:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');
    await this.showMainMenu();
  }
  
  async analyzeCode() {
    this.rl.question('Enter file path: ', async (filePath) => {
      try {
        const fs = require('fs');
        const code = fs.readFileSync(filePath, 'utf8');
        
        const analysis = await analyzeCodeAgainstSystemStructure(code, filePath);
        
        console.log('📊 Code Analysis Results:');
        console.log(`   Issues: ${analysis.issues.length}`);
        console.log(`   Suggestions: ${analysis.suggestions.length}`);
        
        if (analysis.issues.length > 0) {
          console.log('\n   Issues found:');
          analysis.issues.forEach(issue => {
            console.log(`   - ${issue.type}: ${issue.location}`);
            if (issue.validOptions) {
              console.log(`     Valid options: ${issue.validOptions.join(', ')}`);
            }
          });
        }
        
        console.log('\n');
      } catch (error) {
        console.log(`❌ Error reading file: ${error.message}\n`);
      }
      
      await this.showMainMenu();
    });
  }
  
  async checkCompatibility() {
    this.rl.question('Enter first agent organization: ', async (org1) => {
      this.rl.question('Enter second agent organization: ', async (org2) => {
        const [info1, info2] = await Promise.all([
          generalDataAgent.getOrganizationInfo(org1),
          generalDataAgent.getOrganizationInfo(org2)
        ]);
        
        if (!info1 || !info2) {
          console.log('❌ One or both organizations not found\n');
          await this.showMainMenu();
          return;
        }
        
        const compatible = info1.sector === info2.sector || 
                          info1.sector === 'Shared' || 
                          info2.sector === 'Shared';
        
        console.log(`\n🔍 Compatibility Check:`);
        console.log(`   Organization 1: ${info1.name} (${info1.sector})`);
        console.log(`   Organization 2: ${info2.name} (${info2.sector})`);
        console.log(`   Compatible: ${compatible ? '✅ Yes' : '❌ No'}`);
        
        if (!compatible) {
          console.log(`   Reason: Different sectors (${info1.sector} ≠ ${info2.sector})`);
        }
        
        console.log('\n');
        await this.showMainMenu();
      });
    });
  }
}

// Usage
const workflow = new DevelopmentWorkflow();
workflow.start();
```

## Deployment Strategy

### Phase 1: Core Metadata Service (Week 1)
- Deploy General Data Agent as standalone service
- Create API endpoints for metadata queries
- Document API for other agents

### Phase 2: Agent Integration (Week 2)
- Integrate with existing agents
- Add metadata validation to agent creation
- Create agent registry with metadata

### Phase 3: Debugging Tools (Week 3)
- Create CLI debugging tool
- Add code analysis capabilities
- Integrate with development workflows

### Phase 4: Advanced Features (Week 4)
- Add real-time monitoring
- Create dashboard for metadata
- Add automated validation

## Success Metrics

### Metadata Service Metrics
- **Query Success Rate:** > 99%
- **Response Time:** < 100ms (cached), < 500ms (uncached)
- **Availability:** 99.9% uptime
- **API Consistency:** 100% contract compliance

### Debugging Tool Metrics
- **Issue Detection Rate:** > 90% of structural issues
- **False Positive Rate:** < 5%
- **Developer Satisfaction:** > 4.5/5 rating
- **Time Saved:** > 40% reduction in debugging time

### Agent Integration Metrics
- **Integration Success:** 100% of agents using metadata
- **Error Reduction:** > 60% reduction in configuration errors
- **Development Speed:** > 30% faster agent development
- **Code Quality:** > 80% improvement in code consistency

## Budget Estimate

| Component | Hours | Rate | Cost |
|-----------|-------|------|------|
| Core Metadata Service | 16 | $100 | $1,600 |
| API Endpoints | 8 | $100 | $800 |
| Debugging Tools | 24 | $100 | $2,400 |
| CLI Integration | 16 | $100 | $1,600 |
| Testing & Documentation | 16 | $100 | $1,600 |
| **Total** | **80** | **$100** | **$8,000** |

**Total Project Cost:** $8,000 (4 weeks)

---

## Conclusion

The General Data Agent serves as a **centralized metadata service** that:
1. **Assists other agents** with system context and validation
2. **Enables debugging** of existing and new code
3. **Generates code templates** based on system structure
4. **Provides testing utilities** for validation
5. **Integrates into workflows** for development efficiency

This transforms the General Data Agent from a simple Q&A tool into a **foundational infrastructure component** for the entire agent ecosystem.