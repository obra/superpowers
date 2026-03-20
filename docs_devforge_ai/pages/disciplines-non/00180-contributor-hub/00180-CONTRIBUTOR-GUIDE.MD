Cross-Reference: See 1300_00180_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md for detailed Hub UI flows.

# Contributor Guide

## Overview
This consolidated guide covers all aspects of contributor setup, access, and workflows using our new fork-based architecture.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Hub Setup](#hub-setup)  
3. [Access Management](#access-management)
4. [VS Code Integration](#vs-code-integration)
5. [Task Management](#task-management)
6. [Bookmarking](#bookmarking)
7. [Security & Isolation](#security--isolation)

## Getting Started

### Prerequisites
- GitHub account with verified email
- Git installed locally
- Node.js 18+ installed
- VS Code (recommended)

### New Fork-Based Architecture
Our system now uses **personal forks** for complete code isolation:

```
Main Repository (Protected)
├── construct_ai (core team only)
└── Your Personal Fork
    ├── construct_ai-contributor-[your-username]
    └── task-specific branches
```

### Initial Setup
1. **Register**: Use the Contributor Hub to register
2. **Fork Creation**: System automatically creates your personal fork
3. **Invitation**: Accept GitHub invitation to your fork
4. **Clone**: Clone your personal fork locally

## Hub Setup

### Accessing Your Contributor Hub
```bash
# Method 1: Direct browser
http://localhost:3060/00180-contributor-hub

# Method 2: Quick access script
./contributor-hub-quick-access.command

# Method 3: VS Code integration
code client/src/pages/00180-contributor-hub/00180-enhanced-contributor-hub-page.js
```

### Your Personal Dashboard
The Contributor Hub now shows:
- **Your Fork**: Direct link to your personal repository
- **Active Tasks**: Branches assigned to you
- **Code Preview**: Only relevant code sections
- **Progress Tracking**: Task completion status

## Access Management

### Repository Access Levels
- **Main Repository**: No direct access (protected)
- **Your Fork**: Full access to assigned branches only
- **Other Forks**: No access (completely isolated)

### Branch Structure
Each task creates an isolated branch:
```
your-fork/
├── main (read-only, synced from upstream)
├── contrib-[username]-[org-name]-00102-administration-[task-description]
├── contrib-[username]-[org-name]-00435-contracts-post-award-[task-description]
└── contrib-[username]-[org-name]-00180-contributor-hub-[task-description]
```

### Security Features
- **File Filtering**: Only assigned page files visible
- **Dependency Masking**: Core dependencies provided as modules
- **API Abstraction**: Use predefined interfaces only
- **Audit Trail**: All changes tracked

## VS Code Integration

### Workspace Setup
1. **Clone Your Fork**:
   ```bash
   git clone https://github.com/Construct-AI-contributors/construct_ai-contributor-[your-username]
   cd construct_ai-contributor-[your-username]
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Open in VS Code**:
   ```bash
   code .
   ```

### VS Code Extensions (Auto-installed)
- GitHub Pull Requests
- GitLens
- ESLint
- Prettier

## Task Management

### Creating a New Task
1. **Via Contributor Hub**:
   - Select your contributor profile
   - Choose page and agent type
   - Click "Create Task Branch"
   - System creates isolated branch in your fork

2. **Via API**:
   ```bash
   curl -X POST http://localhost:3060/api/contributors/assignments/modal \
     -H "Content-Type: application/json" \
     -d '{
       "contributorId": "your-id",
       "modalName": "AdministrationModal",
       "modalType": "agent",
       "pagePrefix": "00102",
       "pageName": "administration"
     }'
   ```

### Development Workflow
1. **Checkout Task Branch**:
   ```bash
   git checkout contrib-[username]-[org-name]-00102-administration-[task-description]
   ```

2. **View Assigned Files**:
   - Only relevant page files are visible
   - Core dependencies are provided as compiled modules
   - Templates and examples are included

3. **Development**:
   - Work on assigned components
   - Use provided templates and interfaces
   - Cannot access other contributors' code

4. **Testing**:
   ```bash
   npm run dev
   # Test at http://localhost:3001/00435-contracts-post-award
   ```

### Submitting Work
1. **Push to Your Fork**:
   ```bash
   git add .
   git commit -m "Add AdministrationModal component"
   git push origin contrib-[username]-[org-name]-00102-administration-[task-description]
   ```

2. **Create Pull Request**:
   - Via GitHub web interface
   - Via Contributor Hub "Submit Task" button
   - Automated PR creation available

## Bookmarking

### Quick Access URLs
- **Your Fork**: `https://github.com/Construct-AI-contributors/construct_ai-contributor-[username]`
- **Contributor Hub**: `http://localhost:3060/00180-contributor-hub`
- **Task Board**: `http://localhost:3060/00180-contributor-hub#tasks`

### VS Code Workspace
Save workspace configuration for quick access:
```json
{
  "folders": [
    {
      "name": "My Contributor Fork",
      "path": "./construct_ai-contributor-[username]"
    }
  ],
  "settings": {
    "git.enabled": true,
    "git.path": "/usr/bin/git"
  }
}
```

## Security & Isolation

### What You Can See
- Your assigned page components
- Relevant documentation
- Template files and examples
- Test data and fixtures

### What You Cannot See
- Core business logic
- Sensitive algorithms
- Other contributors' work
- Production API keys
- Database schemas

### Code Isolation Examples
```javascript
// ✅ Available to contributors
import { useModal } from '@components/modal/hooks/00170-useModal'
import { ModalTemplate } from '@templates/modal-template'

// ❌ Not available (hidden from contributors)
import { coreAlgorithm } from '@core/sensitive-logic'
import { productionKeys } from '@config/secrets'
```

### Security Monitoring
- All commits are scanned for sensitive data
- Branch access is logged and monitored
- Code review is mandatory for all submissions
- IP protection measures are in place

## Troubleshooting

### Common Issues

#### "Repository not found"
- Ensure you've accepted the GitHub invitation
- Check you're accessing your personal fork, not the main repo

#### "Permission denied"
- Verify you're working in your assigned branch
- Check branch protection rules haven't changed

#### "Missing dependencies"
- Run `npm install` in your fork directory
- Core dependencies should be pre-installed

### Getting Help
- **Contributor Support**: Use the "Help" button in Contributor Hub
- **Technical Issues**: Check the troubleshooting guide
- **Security Questions**: Contact the core team

## Version History
- v2.0 (2025-07-22): Updated for fork-based architecture
- v1.0 (2025-07-16): Initial consolidated guide
