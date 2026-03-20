# 01900 Procurement Workflow Architecture

**Version:** 1.2
**Date:** 2026-03-16
**Status:** Active with Virtual Filesystem Integration

## Executive Summary

The 01900 Procurement Workflow Architecture implements a sophisticated multi-agent system with virtual filesystem integration, enabling persistent context retention, jurisdiction-aware compliance validation, and intelligent supplier data management. This architecture transforms procurement operations from template-based generation to data-driven intelligence.

## System Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   React UI   │  │  Chatbot   │  │  Dashboard  │  │  Mobile App │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  REST API │ WebSocket │ GraphQL │ Authentication │ Rate Limiting       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Procurement │ Agent │ Compliance │ Approval │ VFS │ Notification      │
│  Controller  │ Frame │ Engine     │ System   │     │ Service           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Supabase │ Virtual │ Supplier │ Compliance │ Audit │ Cache            │
│  Database │ Filesys │ Database │ Rules      │ Logs  │ Layer            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Supabase │ Cloud │ Monitoring │ Security │ Backup │ Load              │
│  Storage  │ Infra │ & Logging  │ & Auth   │ System │ Balancer          │
└─────────────────────────────────────────────────────────────────────────┘

Now let me create a comprehensive architecture document.</think><write_to_file>
<path>docs/disciplines/01900_procurement/workflow_docs/01900_PROCUREMENT_SYSTEM_ARCHITECTURE.md</path>
<content># 01900 Procurement System Architecture

**Version:** 1.2
**Date:** 2026-03-17
**Status:** Active with Virtual Filesystem Integration

## Executive Summary

The 01900 Procurement System Architecture provides a comprehensive, scalable, and secure framework for automated procurement operations. The system integrates AI agents with virtual filesystem supporting documents, enabling data-driven intelligence, jurisdiction-aware compliance validation, and governance-driven approval workflows.

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Web Interface │ Mobile App │ API Clients │ Chatbot │ Dashboard         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  REST API │ WebSocket │ GraphQL │ Authentication │ Rate Limiting       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Procurement │ Agent │ Compliance │ Approval │ VFS │ Notification      │
│  Controller  │ Frame │ Engine     │ System   │     │ Service           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Supabase │ Virtual │ Supplier │ Compliance │ Audit │ Cache            │
│  Database │ Filesys │ Database │ Rules      │ Logs  │ Layer            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Supabase │ Virtual │ Monitoring │ Security │ Backup │ CDN             │
│  Cloud    │ Storage │ & Logging  │ Layer    │ System │                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Architecture Components

### 1. Client Layer

#### Web Interface
- **Technology**: React 18+ with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **UI Framework**: Material-UI with custom theme
- **Real-Time Updates**: WebSocket integration for live updates
- **Responsive Design**: Mobile-first responsive design

#### Mobile Application
- **Technology**: React Native with Expo
- **Platform Support**: iOS and Android
- **Offline Capability**: Local data caching with sync
- **Push Notifications**: Real-time notification delivery

#### API Clients
- **REST API**: Standard HTTP/HTTPS endpoints
- **GraphQL**: Flexible query language for complex data
- **WebSocket**: Real-time bidirectional communication
- **Authentication**: JWT token-based authentication

#### Chatbot Interface
- **Technology**: Custom AI chatbot with NLP capabilities
- **Integration**: Direct integration with procurement workflow
- **Real-Time Updates**: Live progress streaming
- **Multi-Modal**: Text, voice, and visual interactions

### 2. API Gateway Layer

#### REST API
- **Framework**: FastAPI with async/await support
- **Authentication**: JWT token validation with Supabase Auth
- **Rate Limiting**: Configurable rate limiting per user/IP
- **CORS**: Cross-origin resource sharing configuration
- **Documentation**: Auto-generated OpenAPI/Swagger documentation

#### WebSocket Server
- **Technology**: WebSocket server for real-time communication
- **Connection Management**: Automatic reconnection and heartbeat
- **Message Protocol**: JSON-based message protocol
- **Broadcasting**: Multi-user broadcasting capabilities

#### GraphQL Endpoint
- **Technology**: GraphQL with Strawberry framework
- **Schema**: Auto-generated schema from data models
- **Resolvers**: Efficient data fetching with DataLoader
- **Subscriptions**: Real-time data subscriptions

#### Authentication & Authorization
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Session Management**: Secure session handling
- **Multi-Factor Authentication**: Optional MFA support

### 3. Application Layer

#### Procurement Controller
- **Function**: Main orchestration of procurement workflows
- **Components**: Order creation, validation, routing, and tracking
- **Integration**: Agent framework, compliance engine, approval system
- **State Management**: Persistent state across workflow steps

#### Agent Framework
- **Architecture**: Multi-agent system with specialized agents
- **Communication**: MessagingMixin for inter-agent communication
- **Coordination**: Central coordinator for workflow orchestration
- **Persistence**: Agent state persistence across operations

**Agent Types**:
- **Template Analysis Agent**: Analyzes templates and requirements
- **Requirements Extraction Agent**: Extracts structured requirements
- **Compliance Validation Agent**: Validates regulatory compliance
- **Field Population Agent**: Auto-populates form fields
- **Quality Assurance Agent**: Validates content accuracy
- **Final Review Agent**: Performs final quality checks
- **Assignment Agent**: Distributes tasks to specialists

#### Compliance Engine
- **Jurisdiction Detection**: Automatic organization location detection
- **Rule Management**: Jurisdiction-specific compliance rules
- **Validation**: Real-time compliance validation
- **Reporting**: Comprehensive compliance reporting

**Supported Jurisdictions**:
- **South Africa (ZA)**: CIDB, SARS VAT, B-BBEE requirements
- **Finland (FI)**: EU AI Act, NIS2 directive, ISO standards
- **United Kingdom (UK)**: Post-Brexit regulations, UK GDPR
- **European Union (EU)**: EU regulations, GDPR, industry standards

#### Approval System
- **Governance Framework**: Limits of authority-based approval routing
- **Risk Assessment**: Dynamic risk-based approval requirements
- **HITL Integration**: Human-in-the-loop for high-value orders
- **Escalation**: Automatic escalation for overdue approvals

#### Virtual Filesystem (VFS)
- **Backend**: Supabase Storage with abstraction layer
- **Operations**: Read, write, grep, list, delete operations
- **Caching**: Intelligent caching for performance optimization
- **Security**: Role-based access control for file operations

#### Notification Service
- **Channels**: Email, SMS, push notifications, in-app alerts
- **Templates**: Customizable notification templates
- **Scheduling**: Scheduled and immediate notification delivery
- **Tracking**: Delivery tracking and confirmation

### 4. Data Layer

#### Supabase Database
- **Technology**: PostgreSQL 14+ with real-time capabilities
- **Tables**: procurement_orders, suppliers, vfs_files, audit_logs
- **Indexing**: Optimized indexes for performance
- **Backup**: Automated backup and recovery

#### Virtual Filesystem Storage
- **Backend**: Supabase Storage with bucket organization
- **Structure**: Hierarchical directory structure per order
- **Metadata**: File metadata and access logging
- **Versioning**: File versioning and change tracking

#### Supplier Database
- **Data Structure**: Comprehensive supplier information
- **Certifications**: CIDB, ISO, B-BBEE certification tracking
- **Performance**: Historical performance metrics
- **Products**: Product catalog with pricing and specifications

#### Compliance Rules Database
- **Jurisdiction-Specific**: Rules organized by jurisdiction
- **Dynamic Updates**: Real-time rule updates and changes
- **Validation**: Rule validation and consistency checking
- **Audit Trail**: Complete audit trail for rule changes

#### Audit Logging
- **Comprehensive Logging**: All system operations logged
- **User Tracking**: User action tracking and attribution
- **Compliance**: Regulatory compliance logging requirements
- **Retention**: Configurable log retention policies

#### Cache Layer
- **Technology**: Redis for high-performance caching
- **Strategy**: Multi-level caching strategy
- **Invalidation**: Intelligent cache invalidation
- **Persistence**: Optional cache persistence

### 5. Infrastructure Layer

#### Supabase Cloud
- **Database**: Managed PostgreSQL database
- **Authentication**: Built-in authentication service
- **Storage**: Object storage for files and documents
- **Real-Time**: Real-time database subscriptions

#### Virtual Storage
- **Type**: Object storage for virtual filesystem
- **Redundancy**: Data redundancy and backup
- **Access Control**: Fine-grained access control
- **Monitoring**: Storage usage monitoring and alerts

#### Monitoring & Logging
- **Metrics**: System performance metrics
- **Logging**: Comprehensive system logging
- **Alerting**: Automated alerting for issues
- **Dashboards**: Real-time monitoring dashboards

#### Security Layer
- **Encryption**: Data encryption at rest and in transit
- **Access Control**: Role-based access control
- **Audit**: Security audit logging
- **Compliance**: Security compliance monitoring

#### Backup System
- **Automated Backup**: Regular automated backups
- **Recovery**: Point-in-time recovery capabilities
- **Testing**: Regular backup testing and validation
- **Retention**: Configurable backup retention policies

#### Content Delivery Network (CDN)
- **Static Assets**: CDN for static asset delivery
- **Global Distribution**: Global content distribution
- **Caching**: Intelligent caching strategies
- **Performance**: Optimized content delivery performance

## Data Architecture

### Database Schema

#### Core Tables
```sql
-- Procurement orders
CREATE TABLE procurement_orders (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    estimated_value DECIMAL(15,2),
    supplier_id VARCHAR(50),
    jurisdiction VARCHAR(10),
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cidb_rating VARCHAR(10),
    iso_9001_certified BOOLEAN,
    bbee_level VARCHAR(20),
    vat_registered BOOLEAN
);

-- Virtual filesystem metadata
CREATE TABLE procurement_vfs_files (
    id UUID PRIMARY KEY,
    order_id VARCHAR(50),
    file_path TEXT NOT NULL,
    file_type VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Virtual Filesystem Structure

```
/procurement/{order_id}/
├── /templates/          # Reusable templates and rules
├── /references/         # Order-specific supplier data
├── /working/            # Agent workspace
├── /outputs/            # Final deliverables
└── /memories/           # Learning framework persistence
```

## Security Architecture

### Authentication & Authorization
- **Multi-Factor Authentication**: Optional MFA for enhanced security
- **Role-Based Access Control**: Granular permissions based on user roles
- **Session Management**: Secure session handling with automatic timeout
- **API Security**: JWT token validation for all API endpoints

### Data Protection
- **Encryption**: AES-256 encryption for sensitive data
- **Data Privacy**: GDPR/POPIA compliance for personal data
- **Audit Logging**: Complete audit trail for all operations
- **Backup Security**: Encrypted backups with secure storage

### Network Security
- **HTTPS**: All communications encrypted with TLS/SSL
- **Firewall**: Network firewall protection
- **DDoS Protection**: Distributed denial-of-service protection
- **Intrusion Detection**: Automated intrusion detection system

## Performance Architecture

### Scalability
- **Horizontal Scaling**: Support for multiple application instances
- **Database Scaling**: Read replicas and connection pooling
- **Storage Scaling**: Unlimited virtual filesystem storage
- **Agent Scaling**: Multiple agent instances for parallel processing

### Caching Strategy
- **Multi-Level Caching**: Database, application, and CDN caching
- **Cache Invalidation**: Intelligent cache invalidation strategies
- **Performance Monitoring**: Real-time performance monitoring
- **Optimization**: Continuous performance optimization

### Resource Management
- **Load Balancing**: Automatic load balancing across instances
- **Resource Allocation**: Dynamic resource allocation based on demand
- **Memory Management**: Efficient memory usage and garbage collection
- **Connection Pooling**: Database connection pooling for performance

## Integration Architecture

### External System Integration
- **Supplier Systems**: API integration with supplier databases
- **Compliance Services**: Integration with regulatory compliance services
- **Document Management**: Integration with document storage systems
- **Notification Systems**: Integration with email and SMS services

### Internal System Integration
- **Agent Framework**: Seamless integration between AI agents
- **Compliance Engine**: Real-time compliance validation integration
- **Approval System**: Governance-driven approval workflow integration
- **Virtual Filesystem**: Persistent storage integration for all operations

## Monitoring & Analytics

### System Monitoring
- **Performance Metrics**: Real-time system performance tracking
- **Error Tracking**: Comprehensive error logging and alerting
- **Resource Usage**: System resource usage monitoring
- **Health Checks**: Automated system health monitoring

### Business Analytics
- **Procurement Metrics**: Procurement cycle time and efficiency metrics
- **Compliance Metrics**: Compliance validation success rates
- **User Metrics**: User engagement and satisfaction metrics
- **Financial Metrics**: Cost savings and efficiency improvements

## Deployment Architecture

### Cloud Infrastructure
- **Platform**: Supabase Cloud with global distribution
- **Redundancy**: Multi-region redundancy for high availability
- **Backup**: Automated backup with point-in-time recovery
- **Monitoring**: Comprehensive monitoring and alerting

### Application Deployment
- **Containerization**: Docker containerization for consistent deployment
- **Orchestration**: Kubernetes orchestration for scalability
- **CI/CD**: Continuous integration and deployment pipeline
- **Rollback**: Automated rollback capabilities for issues

## Related Documentation

- [Implementation Guide](./01900_PROCUREMENT_WORKFLOW_IMPLEMENTATION.md)
- [Technical Specifications](./01900_PROCUREMENT_WORKFLOW_TECHNICAL_SPEC.md)
- [User Guide](./01900_PROCUREMENT_WORKFLOW_USER_GUIDE.md)
- [Testing Plan](../testing/01900_PROCUREMENT_ORDER_WORKFLOW_TESTING_PLAN.md)