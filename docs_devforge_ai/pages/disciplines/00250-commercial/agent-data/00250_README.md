# Commercial Discipline - OpenClaw Agent Workspace

## System Overview

The Commercial discipline handles procurement, contract management, market intelligence, and pricing strategies within the ConstructAI platform. This workspace contains all documentation and specifications needed for OpenClaw agents to effectively manage commercial operations.

## High-Level Architecture

- **Frontend**: React-based commercial dashboard with modal-driven workflows
- **Backend**: Supabase integration for contract and procurement data
- **AI Integration**: ChatbotBase for commercial analysis and recommendations
- **Key Features**: Contract reviews, pricing strategies, market intelligence, correspondence management

## Tech Stack

- **Frontend**: React, CSS Modules, EPCM design system
- **Backend**: Supabase (PostgreSQL), Row Level Security
- **AI**: OpenClaw agents with Lossless Claw memory management
- **Deployment**: Cloud-based with edge computing capabilities

## How Agents Should Navigate This Repo

1. **Entry Point**: Start with this README.md for system overview
2. **Architecture**: Read ARCHITECTURE.md for system design understanding
3. **Agents**: Review AGENTS.md for AI workforce responsibilities
4. **Tasks**: Check TASKS.md for current work queue
5. **Standards**: Follow CODING_STANDARDS.md for implementation consistency

## Key Constraints

- **Security**: All commercial data must comply with contract confidentiality requirements
- **Performance**: Real-time pricing analysis requires sub-500ms response times
- **Compliance**: POPIA and procurement regulations must be enforced
- **Integration**: Seamless cross-discipline sharing with engineering and finance teams

## Navigation Structure

```
agent-data/
├── README.md (this file)
├── ARCHITECTURE.md (system blueprint)
├── AGENTS.md (AI workforce definition)
├── PRODUCT_SPEC.md (commercial features)
├── ROADMAP.md (execution phases)
├── CODING_STANDARDS.md (consistency rules)
├── API_SPEC.md (contract endpoints)
├── DATABASE_SCHEMA.md (data layer)
├── SECURITY.md (guardrails)
├── TESTING.md (quality enforcement)
├── TASKS.md (work queue)
├── PROMPTS.md (agent thinking patterns)
├── ERROR_HANDLING.md (failure management)
├── DEPLOYMENT.md (shipping strategy)
├── UI_UX_GUIDELINES.md (design system)
├── DATA_PIPELINES.md (ETL flows)
├── INTEGRATIONS.md (third-party services)
└── GLOSSARY.md (domain terms)