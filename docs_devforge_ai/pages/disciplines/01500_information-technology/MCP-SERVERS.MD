# MCP Servers Documentation

This document provides comprehensive documentation for Model Context Protocol (MCP) servers in the Construct.AI system.

## Overview

MCP servers extend the system's capabilities by providing additional tools and resources through a standardized protocol. These servers can integrate with external APIs and services while maintaining a consistent interface.

## Server Structure and Registration

MCP servers are integrated into the system by defining them in `src/mcp-servers.js` and then initializing them in `server/app.cjs`.

### 1. Defining MCP Servers (`src/mcp-servers.js`)

This file acts as a central registry for all MCP server instances. Each server is imported and instantiated here.

**Example: `src/mcp-servers.js`**
```javascript
import { N8nMcpServer } from 'n8n-mcp-server';
// Import other MCP servers as needed

export const mcpServers = [
  new N8nMcpServer(),
  // Add other MCP server instances here
];
```

### 2. Initializing MCP Servers (`server/src/mcp-server-loader.js`)

This module is responsible for iterating through the defined MCP servers and connecting them to the main application server.

**Example: `server/src/mcp-server-loader.js`**
```javascript
import { mcpServers } from '../../src/mcp-servers.js';

export function initializeMcpServers(server) {
  mcpServers.forEach(mcpServer => {
    mcpServer.connect(server);
  });
}
```

### 3. Loading MCP Servers into the Application (`server/app.cjs`)

The main server application (`server/app.cjs`) imports the `initializeMcpServers` function and calls it during its startup phase to ensure all defined MCP servers are connected and their tools/resources are available.

**Example: Relevant changes in `server/app.cjs`**
```javascript
// Import the initializer
const { initializeMcpServers } = require('./src/mcp-server-loader.js');

// ... existing app setup ...

// In the server startup block (e.g., within app.listen callback)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // ... existing console logs ...

    // Initialize MCP servers
    initializeMcpServers(app);
  });
}
```

## Implementation Examples

### URL to PDF Server

The URL to PDF server provides capabilities to convert web pages to PDF documents using Chrome through Puppeteer. It demonstrates integration with system browsers and PDF generation:

```typescript
// Tool definition
{
  name: 'convert_url_to_pdf',
  description: 'Convert a webpage URL to PDF',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL of the webpage to convert',
      },
      waitForSelector: {
        type: 'string',
        description: 'Optional CSS selector to wait for before generating PDF',
      },
      format: {
        type: 'string',
        enum: ['A4', 'Letter', 'Legal'],
        default: 'A4',
        description: 'PDF page format',
      },
      timeout: {
        type: 'number',
        default: 30000,
        description: 'Maximum time to wait in milliseconds',
      }
    },
    required: ['url'],
  },
}
```

Key implementation features:

- System Chrome integration using puppeteer-core
- Configurable page formats and margins
- Custom element wait support
- Temporary file management
- Base64 PDF encoding
- Error handling for browser operations

Example usage:

```typescript
<use_mcp_tool>
<server_name>url-to-pdf</server_name>
<tool_name>convert_url_to_pdf</tool_name>
<arguments>
{
  "url": "https://example.com",
  "format": "A4",
  "waitForSelector": "#content",
  "timeout": 30000
}
</arguments>
</use_mcp_tool>
```

### Organization All Server

The Organization All Server provides database management capabilities specifically for the "Organisations - All" functionality. It enables adding organizations to sectors and managing cross-organizational filtering:

```typescript
// Tool definition
{
  name: 'add_organization_to_sector',
  description: 'Adds an organization to a sector',
  inputSchema: {
    type: 'object',
    properties: {
      organizationName: {
        type: 'string',
        description: 'Name of the organization',
      },
      sectorId: {
        type: 'string',
        description: 'ID of the sector',
      },
      isTemplate: {
        type: 'boolean',
        description: 'Whether the organization is a template',
      },
    },
    required: ['organizationName', 'sectorId'],
  },
}
```

Key implementation features:

- **Supabase Integration**: Direct database operations using Supabase client
- **Organization Management**: Create new organizations or use existing ones
- **Sector Validation**: Verifies sector existence before creating associations
- **Template Support**: Handles template organization creation
- **Error Handling**: Comprehensive error handling for database operations

**Server Location**: `/Users/alistairtennant/Documents/Cline/MCP/org-all-server/`

**Configuration**:
```json
// VSCode settings.json
"roo-cline.mcpServers": {
  "org-all-server": {
    "command": "node",
    "args": ["/Users/alistairtennant/Documents/Cline/MCP/org-all-server/build/index.js"]
  }
}
```

**Environment Variables**:
```bash
SUPABASE_URL=https://mseizswoiwyewsidknta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Example usage:

```typescript
<use_mcp_tool>
<server_name>org-all-server</server_name>
<tool_name>add_organization_to_sector</tool_name>
<arguments>
{
  "organizationName": "Organisations - All",
  "sectorId": "02477804-5d5b-416f-9068-33db504807b9",
  "isTemplate": true
}
</arguments>
</use_mcp_tool>
```

**Build Process**:
```bash
cd /Users/alistairtennant/Documents/Cline/MCP/org-all-server
npm install
npm run build
```

### Fetch Server

[Rest of the existing documentation...]
