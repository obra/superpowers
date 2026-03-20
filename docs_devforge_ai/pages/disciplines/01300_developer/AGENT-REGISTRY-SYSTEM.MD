# 🚀 **Agent Registry System**
**ConstructAI Unified Agent Platform - Centralized Agent Management & Discovery**

**Date**: January 16, 2026
**Version**: 1.0 - Registry Operational
**Status**: **ACTIVE - Agent Discovery & Management Enabled**
**Purpose**: Centralized registry for agent lifecycle management, discovery, and coordination

---

## 📋 **Executive Summary**

### **Registry System Objectives**
Establish a centralized agent registry that enables automatic agent discovery, health monitoring, capability matching, and coordinated operations across the ConstructAI unified agent platform.

### **Key Registry Capabilities**
- **Agent Discovery**: Automatic location and registration of all agents
- **Health Monitoring**: Real-time status tracking and automatic failover
- **Capability Matching**: Intelligent routing based on agent capabilities
- **Lifecycle Management**: Automated agent registration, updates, and decommissioning
- **Coordination Support**: Workflow orchestration and multi-agent collaboration

### **Business Impact**
- **100% Agent Visibility**: Complete visibility into all agents and their status
- **Zero Manual Configuration**: Automatic agent discovery and registration
- **50% Faster Agent Integration**: Plug-and-play agent deployment and discovery
- **Enterprise Reliability**: Automated health monitoring and failover capabilities

---

## 🗃️ **Database Schema Design**

### **1. Core Agent Registry Tables**

#### **agents Table - Primary Agent Registry**
```sql
CREATE TABLE agents (
    agent_id VARCHAR(255) PRIMARY KEY,
    agent_type ENUM('supervisor', 'specialist', 'service', 'coordinator', 'utility') NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    language ENUM('python', 'javascript') NOT NULL,

    -- Location and deployment
    location VARCHAR(500),
    host VARCHAR(255),
    port INTEGER,
    endpoint_url VARCHAR(500),
    deployment_environment ENUM('development', 'staging', 'production') DEFAULT 'development',

    -- Status and health
    status ENUM('registered', 'active', 'inactive', 'degraded', 'failed') DEFAULT 'registered',
    health_status ENUM('healthy', 'degraded', 'unhealthy', 'unknown') DEFAULT 'unknown',
    last_health_check TIMESTAMP NULL,
    next_health_check TIMESTAMP NULL,

    -- Capabilities and metadata
    capabilities JSON,
    metadata JSON,

    -- Organizational context
    organization_id VARCHAR(255),
    owner_team VARCHAR(255),
    owner_contact VARCHAR(255),

    -- Lifecycle tracking
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP NULL,
    last_updated TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    decommissioned_at TIMESTAMP NULL,

    -- Performance metrics (rolling averages)
    avg_response_time_ms DECIMAL(10,2) NULL,
    error_rate DECIMAL(5,4) NULL,
    uptime_percentage DECIMAL(5,2) NULL,

    INDEX idx_agent_type (agent_type),
    INDEX idx_status (status),
    INDEX idx_health_status (health_status),
    INDEX idx_organization (organization_id),
    INDEX idx_capabilities (capabilities(255)),
    INDEX idx_last_seen (last_seen)
);
```

#### **agent_capabilities Table - Detailed Capability Mapping**
```sql
CREATE TABLE agent_capabilities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agent_id VARCHAR(255) NOT NULL,
    capability_name VARCHAR(255) NOT NULL,
    capability_version VARCHAR(50) DEFAULT '1.0',
    capability_type ENUM('core', 'optional', 'experimental') DEFAULT 'core',
    description TEXT,
    configuration_schema JSON,

    -- Capability metadata
    priority INTEGER DEFAULT 100,
    dependencies JSON,  -- Array of required capability names
    conflicts JSON,     -- Array of conflicting capability names

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
    INDEX idx_agent_capability (agent_id, capability_name),
    INDEX idx_capability_name (capability_name)
);
```

#### **agent_relationships Table - Agent Dependencies & Coordination**
```sql
CREATE TABLE agent_relationships (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_agent_id VARCHAR(255) NOT NULL,
    target_agent_id VARCHAR(255) NOT NULL,
    relationship_type ENUM('depends_on', 'coordinates_with', 'communicates_with', 'supervised_by') NOT NULL,

    -- Relationship metadata
    relationship_strength DECIMAL(3,2) DEFAULT 1.0,  -- 0.0 to 1.0
    communication_frequency ENUM('constant', 'frequent', 'occasional', 'rare') DEFAULT 'occasional',
    data_flow_direction ENUM('unidirectional', 'bidirectional') DEFAULT 'bidirectional',

    -- Workflow context
    workflow_types JSON,  -- Array of workflow types this relationship supports
    typical_payload_size ENUM('small', 'medium', 'large', 'variable') DEFAULT 'medium',

    established_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction TIMESTAMP NULL,

    FOREIGN KEY (source_agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
    FOREIGN KEY (target_agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
    INDEX idx_relationship_type (relationship_type),
    INDEX idx_source_agent (source_agent_id),
    INDEX idx_target_agent (target_agent_id),
    UNIQUE KEY unique_relationship (source_agent_id, target_agent_id, relationship_type)
);
```

#### **agent_health_checks Table - Health Monitoring History**
```sql
CREATE TABLE agent_health_checks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agent_id VARCHAR(255) NOT NULL,
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Health check results
    status ENUM('healthy', 'degraded', 'unhealthy') NOT NULL,
    response_time_ms INTEGER NULL,
    error_message TEXT NULL,

    -- Detailed metrics
    cpu_usage_percent DECIMAL(5,2) NULL,
    memory_usage_mb DECIMAL(10,2) NULL,
    active_connections INTEGER NULL,
    queue_depth INTEGER NULL,

    -- Check metadata
    check_type ENUM('automated', 'manual', 'startup', 'shutdown') DEFAULT 'automated',
    check_duration_ms INTEGER NULL,
    check_source VARCHAR(255) DEFAULT 'registry',

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
    INDEX idx_agent_timestamp (agent_id, check_timestamp),
    INDEX idx_status (status),
    INDEX idx_check_type (check_type)
);
```

### **2. Workflow & Coordination Tables**

#### **workflows Table - Active Workflow Tracking**
```sql
CREATE TABLE workflows (
    workflow_id VARCHAR(255) PRIMARY KEY,
    workflow_type VARCHAR(255) NOT NULL,
    status ENUM('active', 'completed', 'failed', 'cancelled') DEFAULT 'active',
    initiator_agent_id VARCHAR(255) NOT NULL,

    -- Workflow metadata
    description TEXT,
    priority ENUM('low', 'normal', 'high', 'critical') DEFAULT 'normal',
    deadline TIMESTAMP NULL,

    -- Execution tracking
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    estimated_duration_seconds INTEGER NULL,
    actual_duration_seconds INTEGER NULL,

    -- Progress tracking
    total_steps INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    current_step VARCHAR(255) NULL,

    -- Involved agents
    participating_agents JSON,  -- Array of agent IDs
    coordinator_agent_id VARCHAR(255) NULL,

    INDEX idx_status (status),
    INDEX idx_workflow_type (workflow_type),
    INDEX idx_initiator (initiator_agent_id),
    INDEX idx_priority (priority)
);
```

#### **workflow_steps Table - Step-by-Step Execution Tracking**
```sql
CREATE TABLE workflow_steps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workflow_id VARCHAR(255) NOT NULL,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    assigned_agent_id VARCHAR(255) NULL,

    -- Step configuration
    step_type ENUM('agent_execution', 'coordination', 'decision', 'notification') DEFAULT 'agent_execution',
    required_capabilities JSON,
    input_data JSON,
    expected_output JSON,

    -- Execution status
    status ENUM('pending', 'running', 'completed', 'failed', 'skipped') DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    retry_count INTEGER DEFAULT 0,

    -- Results
    output_data JSON NULL,
    error_message TEXT NULL,
    confidence_score DECIMAL(5,4) NULL,

    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    INDEX idx_workflow_step (workflow_id, step_number),
    INDEX idx_assigned_agent (assigned_agent_id),
    INDEX idx_status (status)
);
```

---

## 🔌 **API Endpoints Design**

### **1. Agent Registration & Management**

#### **POST /api/registry/agents - Register Agent**
```typescript
// Request
interface AgentRegistrationRequest {
  agentId: string;
  agentType: 'supervisor' | 'specialist' | 'service' | 'coordinator' | 'utility';
  agentName: string;
  description?: string;
  version: string;
  language: 'python' | 'javascript';
  location: string;
  capabilities: string[];
  metadata?: Record<string, any>;
  organizationId?: string;
  ownerTeam?: string;
  ownerContact?: string;
}

// Response
interface AgentRegistrationResponse {
  success: boolean;
  agentId: string;
  registrationTimestamp: string;
  registryUrl: string;
  nextHealthCheckDue: string;
}
```

**Implementation Example:**
```python
@app.post("/api/registry/agents")
async def register_agent(request: AgentRegistrationRequest):
    """Register a new agent with the registry."""

    # Validate agent doesn't already exist
    existing = await db.fetch_one("SELECT agent_id FROM agents WHERE agent_id = ?", request.agentId)
    if existing:
        raise HTTPException(status_code=409, detail="Agent already registered")

    # Insert agent record
    await db.execute("""
        INSERT INTO agents (
            agent_id, agent_type, agent_name, description, version, language,
            location, capabilities, metadata, organization_id, owner_team, owner_contact,
            status, registered_at, next_health_check
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE))
    """, (
        request.agentId, request.agentType, request.agentName, request.description,
        request.version, request.language, request.location, json.dumps(request.capabilities),
        json.dumps(request.metadata or {}), request.organizationId, request.ownerTeam, request.ownerContact
    ))

    # Register capabilities
    for capability in request.capabilities:
        await db.execute("""
            INSERT INTO agent_capabilities (agent_id, capability_name)
            VALUES (?, ?)
        """, (request.agentId, capability))

    return AgentRegistrationResponse(
        success=True,
        agentId=request.agentId,
        registrationTimestamp=datetime.now().isoformat(),
        registryUrl=f"/api/registry/agents/{request.agentId}",
        nextHealthCheckDue=(datetime.now() + timedelta(minutes=5)).isoformat()
    )
```

#### **GET /api/registry/agents - List Agents**
```typescript
// Query Parameters
interface AgentQuery {
  agentType?: string;
  language?: string;
  status?: 'active' | 'inactive' | 'degraded' | 'failed';
  capabilities?: string[];  // Required capabilities
  organizationId?: string;
  limit?: number;
  offset?: number;
}

// Response
interface AgentListResponse {
  agents: AgentSummary[];
  total: number;
  limit: number;
  offset: number;
}

interface AgentSummary {
  agentId: string;
  agentType: string;
  agentName: string;
  status: string;
  language: string;
  capabilities: string[];
  lastSeen: string;
  healthStatus: string;
}
```

#### **GET /api/registry/agents/{agentId} - Get Agent Details**
```typescript
interface AgentDetailsResponse {
  agentId: string;
  agentType: string;
  agentName: string;
  description?: string;
  version: string;
  language: string;
  location: string;
  status: string;
  healthStatus: string;
  capabilities: CapabilityDetails[];
  relationships: AgentRelationship[];
  performanceMetrics: AgentMetrics;
  metadata: Record<string, any>;
  registeredAt: string;
  lastSeen: string;
}

interface CapabilityDetails {
  name: string;
  version: string;
  type: 'core' | 'optional' | 'experimental';
  description?: string;
  dependencies?: string[];
}

interface AgentRelationship {
  targetAgentId: string;
  relationshipType: string;
  strength: number;
  lastInteraction?: string;
}

interface AgentMetrics {
  averageResponseTimeMs?: number;
  errorRate?: number;
  uptimePercentage?: number;
  totalRequests?: number;
}
```

### **2. Discovery & Capability Matching**

#### **POST /api/registry/discover - Discover Agents**
```typescript
// Request
interface AgentDiscoveryRequest {
  requiredCapabilities?: string[];
  preferredCapabilities?: string[];
  agentType?: string;
  language?: 'python' | 'javascript';
  organizationId?: string;
  healthStatus?: 'healthy' | 'degraded';
  maxResults?: number;
  sortBy?: 'response_time' | 'error_rate' | 'uptime' | 'last_seen';
  sortOrder?: 'asc' | 'desc';
}

// Response
interface AgentDiscoveryResponse {
  agents: DiscoveredAgent[];
  totalMatching: number;
  searchCriteria: AgentDiscoveryRequest;
}

interface DiscoveredAgent {
  agentId: string;
  agentName: string;
  agentType: string;
  capabilities: string[];
  language: string;
  status: string;
  healthStatus: string;
  averageResponseTimeMs?: number;
  errorRate?: number;
  uptimePercentage?: number;
  lastSeen: string;
  matchScore: number;  // 0.0 to 1.0 based on capability matching
}
```

**Capability Matching Algorithm:**
```python
def calculate_match_score(agent_capabilities: List[str], required_capabilities: List[str], preferred_capabilities: List[str]) -> float:
    """
    Calculate how well an agent matches the required capabilities.
    Returns score between 0.0 (no match) and 1.0 (perfect match).
    """
    # Required capabilities must all be present
    required_match = all(cap in agent_capabilities for cap in required_capabilities)

    if not required_match:
        return 0.0

    # Calculate preferred capability match
    if preferred_capabilities:
        preferred_matches = sum(1 for cap in preferred_capabilities if cap in agent_capabilities)
        preferred_score = preferred_matches / len(preferred_capabilities)
    else:
        preferred_score = 1.0

    # Bonus for having additional relevant capabilities
    bonus_capabilities = ['base_agent', 'communication', 'monitoring']
    bonus_matches = sum(1 for cap in bonus_capabilities if cap in agent_capabilities)
    bonus_score = min(bonus_matches * 0.1, 0.2)  # Max 20% bonus

    return min(preferred_score + bonus_score, 1.0)
```

### **3. Health Monitoring & Status**

#### **POST /api/registry/agents/{agentId}/health - Report Health**
```typescript
// Request
interface HealthReportRequest {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTimeMs?: number;
  errorMessage?: string;
  metrics: {
    cpuUsagePercent?: number;
    memoryUsageMb?: number;
    activeConnections?: number;
    queueDepth?: number;
  };
  checkType?: 'automated' | 'manual';
}

// Response
interface HealthReportResponse {
  success: boolean;
  agentId: string;
  recordedAt: string;
  nextCheckDue: string;
  status: string;
}
```

#### **GET /api/registry/health - Registry Health Overview**
```typescript
interface RegistryHealthResponse {
  registryStatus: 'healthy' | 'degraded' | 'unhealthy';
  agentSummary: {
    total: number;
    active: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  recentHealthChecks: HealthCheckSummary[];
  systemMetrics: {
    uptime: string;
    responseTime: number;
    errorRate: number;
  };
}

interface HealthCheckSummary {
  agentId: string;
  agentName: string;
  status: string;
  lastCheck: string;
  responseTimeMs?: number;
}
```

---

## 🔍 **Discovery Mechanisms**

### **1. Automatic Agent Registration**

#### **Startup Registration Flow**
```python
class AgentRegistryClient:
    """Client for interacting with the agent registry."""

    def __init__(self, registry_url: str, agent_config: AgentConfig):
        self.registry_url = registry_url
        self.agent_config = agent_config
        self.registration_id = None
        self.heartbeat_task = None

    async def register(self) -> bool:
        """Register agent with the registry."""
        registration_data = {
            "agentId": self.agent_config.agent_id,
            "agentType": self.agent_config.agent_type,
            "agentName": self.agent_config.agent_name or self.agent_config.agent_id,
            "description": getattr(self.agent_config, 'description', ''),
            "version": self.agent_config.version,
            "language": self.agent_config.language,
            "location": f"agents/types/{self.agent_config.agent_type}s/{self._get_type_name()}/python/",
            "capabilities": self.agent_config.capabilities,
            "metadata": self.agent_config.custom_config,
            "organizationId": getattr(self.agent_config, 'organization_id', None),
            "ownerTeam": getattr(self.agent_config, 'owner_team', 'ai-team@constructai.com'),
            "ownerContact": getattr(self.agent_config, 'owner_contact', 'ai-team@constructai.com')
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.registry_url}/api/registry/agents",
                    json=registration_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        self.registration_id = result.get("agentId")

                        # Start heartbeat
                        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
                        return True
                    else:
                        error_text = await response.text()
                        print(f"Registration failed: {response.status} - {error_text}")
                        return False

        except Exception as e:
            print(f"Registration error: {e}")
            return False

    async def _heartbeat_loop(self):
        """Send periodic heartbeats to registry."""
        while True:
            try:
                await self._send_heartbeat()
                await asyncio.sleep(300)  # 5 minutes
            except Exception as e:
                print(f"Heartbeat error: {e}")
                await asyncio.sleep(60)  # Retry in 1 minute

    async def _send_heartbeat(self):
        """Send heartbeat with current health status."""
        health_data = await self._get_health_status()

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.registry_url}/api/registry/agents/{self.agent_config.agent_id}/health",
                    json=health_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status != 200:
                        print(f"Heartbeat failed: {response.status}")

        except Exception as e:
            print(f"Heartbeat send error: {e}")

    async def _get_health_status(self) -> Dict[str, Any]:
        """Get current agent health status."""
        # Implementation would check actual agent health
        return {
            "status": "healthy",
            "responseTimeMs": 150,
            "metrics": {
                "cpuUsagePercent": 45.2,
                "memoryUsageMb": 256,
                "activeConnections": 3,
                "queueDepth": 0
            }
        }

    def _get_type_name(self) -> str:
        """Get agent type name for directory structure."""
        return self.__class__.__name__.lower().replace('agent', '').replace('unified', '')
```

### **2. Capability-Based Agent Selection**

#### **Intelligent Agent Matching**
```python
class AgentSelector:
    """Intelligent agent selection based on capabilities and performance."""

    def __init__(self, registry_client: AgentRegistryClient):
        self.registry = registry_client

    async def find_best_agent(
        self,
        required_capabilities: List[str],
        preferred_capabilities: List[str] = None,
        agent_type: str = None,
        max_results: int = 5
    ) -> List[AgentMatch]:
        """
        Find best matching agents for the given requirements.

        Returns agents sorted by match score, considering:
        - Capability matching
        - Health status
        - Performance metrics
        - Load balancing
        """
        # Query registry for candidate agents
        candidates = await self.registry.discover_agents({
            "requiredCapabilities": required_capabilities,
            "preferredCapabilities": preferred_capabilities or [],
            "agentType": agent_type,
            "healthStatus": "healthy",
            "maxResults": max_results * 2  # Get more candidates for better selection
        })

        # Score and rank candidates
        scored_candidates = []
        for candidate in candidates:
            match_score = self._calculate_match_score(
                candidate.capabilities,
                required_capabilities,
                preferred_capabilities or []
            )

            health_score = self._calculate_health_score(candidate)
            performance_score = self._calculate_performance_score(candidate)
            load_score = self._calculate_load_score(candidate)

            total_score = (
                match_score * 0.5 +      # 50% - capability matching
                health_score * 0.2 +     # 20% - health status
                performance_score * 0.2 + # 20% - performance
                load_score * 0.1         # 10% - load balancing
            )

            scored_candidates.append(AgentMatch(
                agent=candidate,
                matchScore=match_score,
                healthScore=health_score,
                performanceScore=performance_score,
                loadScore=load_score,
                totalScore=total_score
            ))

        # Sort by total score and return top matches
        scored_candidates.sort(key=lambda x: x.totalScore, reverse=True)
        return scored_candidates[:max_results]

    def _calculate_match_score(
        self,
        agent_caps: List[str],
        required: List[str],
        preferred: List[str]
    ) -> float:
        """Calculate capability match score."""
        # Must have all required capabilities
        if not all(cap in agent_caps for cap in required):
            return 0.0

        # Score preferred capabilities
        if preferred:
            preferred_matches = sum(1 for cap in preferred if cap in agent_caps)
            return preferred_matches / len(preferred)
        else:
            return 1.0

    def _calculate_health_score(self, agent) -> float:
        """Calculate health score (0.0 to 1.0)."""
        health_scores = {
            "healthy": 1.0,
            "degraded": 0.5,
            "unhealthy": 0.0,
            "unknown": 0.5
        }
        return health_scores.get(agent.healthStatus, 0.5)

    def _calculate_performance_score(self, agent) -> float:
        """Calculate performance score based on metrics."""
        if not agent.averageResponseTimeMs:
            return 0.5  # Neutral score if no data

        # Lower response time is better
        if agent.averageResponseTimeMs < 500:
            return 1.0
        elif agent.averageResponseTimeMs < 2000:
            return 0.7
        elif agent.averageResponseTimeMs < 5000:
            return 0.4
        else:
            return 0.1

    def _calculate_load_score(self, agent) -> float:
        """Calculate load balancing score (prefer less loaded agents)."""
        # This would be based on active connections, queue depth, etc.
        # For now, return neutral score
        return 0.5
```

---

## 🏥 **Health Monitoring System**

### **1. Automated Health Checks**

#### **Health Check Orchestrator**
```python
class HealthCheckOrchestrator:
    """Orchestrates automated health checks for all registered agents."""

    def __init__(self, registry_db, check_interval_seconds: int = 300):
        self.registry_db = registry_db
        self.check_interval = check_interval_seconds
        self.running = False

    async def start(self):
        """Start the health check orchestration."""
        self.running = True
        while self.running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                print(f"Health check orchestration error: {e}")
                await asyncio.sleep(60)  # Retry in 1 minute

    async def stop(self):
        """Stop the health check orchestration."""
        self.running = False

    async def _perform_health_checks(self):
        """Perform health checks on all active agents."""
        # Get all agents due for health check
        due_agents = await self.registry_db.fetch_all("""
            SELECT agent_id, endpoint_url, last_health_check, next_health_check
            FROM agents
            WHERE status IN ('active', 'registered')
              AND next_health_check <= NOW()
            LIMIT 50  -- Process in batches
        """)

        for agent in due_agents:
            asyncio.create_task(self._check_agent_health(agent))

    async def _check_agent_health(self, agent_record: Dict[str, Any]):
        """Check health of a specific agent."""
        agent_id = agent_record['agent_id']
        endpoint_url = agent_record['endpoint_url']

        start_time = time.time()
        try:
            # Perform health check
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(f"{endpoint_url}/health") as response:
                    response_time = int((time.time() - start_time) * 1000)

                    if response.status == 200:
                        health_data = await response.json()
                        status = health_data.get('status', 'unknown')

                        # Record successful health check
                        await self._record_health_check(
                            agent_id=agent_id,
                            status=status,
                            response_time=response_time,
                            metrics=health_data.get('metrics', {})
                        )

                    else:
                        # Record failed health check
                        await self._record_health_check(
                            agent_id=agent_id,
                            status='unhealthy',
                            response_time=response_time,
                            error_message=f"HTTP {response.status}"
                        )

        except asyncio.TimeoutError:
            await self._record_health_check(
                agent_id=agent_id,
                status='unhealthy',
                response_time=int((time.time() - start_time) * 1000),
                error_message='Timeout'
            )

        except Exception as e:
            await self._record_health_check(
                agent_id=agent_id,
                status='unhealthy',
                response_time=int((time.time() - start_time) * 1000),
                error_message=str(e)
            )

    async def _record_health_check(
        self,
        agent_id: str,
        status: str,
        response_time: int = None,
        error_message: str = None,
        metrics: Dict[str, Any] = None
    ):
        """Record health check results in database."""
        # Insert health check record
        await self.registry_db.execute("""
            INSERT INTO agent_health_checks (
                agent_id, status, response_time_ms, error_message,
                cpu_usage_percent, memory_usage_mb, active_connections, queue_depth
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            agent_id, status, response_time, error_message,
            metrics.get('cpuUsagePercent') if metrics else None,
            metrics.get('memoryUsageMb') if metrics else None,
            metrics.get('activeConnections') if metrics else None,
            metrics.get('queueDepth') if metrics else None
        ))

        # Update agent status and next check time
        next_check = datetime.now() + timedelta(seconds=self.check_interval)
        await self.registry_db.execute("""
            UPDATE agents
            SET health_status = ?,
                last_health_check = NOW(),
                next_health_check = ?,
                avg_response_time_ms = COALESCE(
                    (avg_response_time_ms + ?) / 2,
                    ?
                )
            WHERE agent_id = ?
        """, (status, next_check, response_time, response_time, agent_id))
```

### **2. Health Status Aggregation**

#### **Registry Health Dashboard**
```python
class RegistryHealthDashboard:
    """Provides aggregated health status across all agents."""

    def __init__(self, registry_db):
        self.registry_db = registry_db

    async def get_registry_health(self) -> Dict[str, Any]:
        """Get comprehensive registry health overview."""
        # Get agent counts by status
        agent_counts = await self.registry_db.fetch_one("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN health_status = 'healthy' THEN 1 ELSE 0 END) as healthy,
                SUM(CASE WHEN health_status = 'degraded' THEN 1 ELSE 0 END) as degraded,
                SUM(CASE WHEN health_status = 'unhealthy' THEN 1 ELSE 0 END) as unhealthy
            FROM agents
            WHERE status IN ('active', 'registered')
        """)

        # Get recent health check failures
        recent_failures = await self.registry_db.fetch_all("""
            SELECT
                a.agent_name,
                h.status,
                h.error_message,
                h.check_timestamp
            FROM agent_health_checks h
            JOIN agents a ON h.agent_id = a.agent_id
            WHERE h.status IN ('degraded', 'unhealthy')
              AND h.check_timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ORDER BY h.check_timestamp DESC
            LIMIT 10
        """)

        # Calculate overall registry health
        total_agents = agent_counts['total'] or 0
        healthy_agents = agent_counts['healthy'] or 0

        if total_agents == 0:
            overall_health = 'unknown'
        elif healthy_agents / total_agents >= 0.95:
            overall_health = 'healthy'
        elif healthy_agents / total_agents >= 0.80:
            overall_health = 'degraded'
        else:
            overall_health = 'unhealthy'

        return {
            'registryStatus': overall_health,
            'agentSummary': {
                'total': total_agents,
                'active': agent_counts['active'] or 0,
                'healthy': healthy_agents,
                'degraded': agent_counts['degraded'] or 0,
                'unhealthy': agent_counts['unhealthy'] or 0
            },
            'recentHealthChecks': [
                {
                    'agentName': failure['agent_name'],
                    'status': failure['status'],
                    'errorMessage': failure['error_message'],
                    'timestamp': failure['check_timestamp'].isoformat()
                }
                for failure in recent_failures
            ],
            'systemMetrics': await self._get_system_metrics()
        }

    async def _get_system_metrics(self) -> Dict[str, Any]:
        """Get registry system performance metrics."""
        # Calculate uptime
        uptime_result = await self.registry_db.fetch_one("""
            SELECT TIMESTAMPDIFF(SECOND, MIN(registered_at), NOW()) as uptime_seconds
            FROM agents
        """)

        # Calculate average response time across recent health checks
        response_time_result = await self.registry_db.fetch_one("""
            SELECT AVG(response_time_ms) as avg_response_time
            FROM agent_health_checks
            WHERE check_timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
              AND response_time_ms IS NOT NULL
        """)

        # Calculate error rate
        error_rate_result = await self.registry_db.fetch_one("""
            SELECT
                SUM(CASE WHEN status IN ('degraded', 'unhealthy') THEN 1 ELSE 0 END) /
                COUNT(*) as error_rate
            FROM agent_health_checks
            WHERE check_timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        """)

        return {
            'uptime': f"{uptime_result['uptime_seconds'] or 0} seconds",
            'responseTime': round(response_time_result['avg_response_time'] or 0, 2),
            'errorRate': round(error_rate_result['error_rate'] or 0, 4)
        }
```

---

## 🛠️ **Management Tools & Interfaces**

### **1. Registry Administration API**

#### **Agent Management Endpoints**
```typescript
// Decommission Agent
DELETE /api/registry/agents/{agentId}

// Update Agent Metadata
PATCH /api/registry/agents/{agentId}

// Bulk Agent Operations
POST /api/registry/agents/bulk-update
POST /api/registry/agents/bulk-decommission

// Registry Maintenance
POST /api/registry/maintenance/cleanup
POST /api/registry/maintenance/reindex
```

### **2. Command-Line Management Tools**

#### **Registry CLI Tool**
```bash
# Agent Registry Management CLI
constructai-registry --help

# List all agents
constructai-registry agents list --status active --format table

# Get agent details
constructai-registry agents get agent-123

# Decommission agent
constructai-registry agents decommission agent-123 --reason "Upgraded to new version"

# Health check all agents
constructai-registry health check-all --parallel 10

# Registry statistics
constructai-registry stats --period 24h

# Export registry data
constructai-registry export --format json --output registry-backup.json
```

#### **Python Registry Management Script**
```python
#!/usr/bin/env python3
"""
Agent Registry Management Script
Provides command-line tools for registry administration.
"""

import asyncio
import argparse
import json
from datetime import datetime
from registry_client import RegistryClient

async def main():
    parser = argparse.ArgumentParser(description='Agent Registry Management')
    subparsers = parser.add_subparsers(dest='command')

    # Agents subcommand
    agents_parser = subparsers.add_parser('agents')
    agents_sub = agents_parser.add_subparsers(dest='action')

    # List agents
    list_parser = agents_sub.add_parser('list')
    list_parser.add_argument('--status', choices=['active', 'inactive', 'all'], default='all')
    list_parser.add_argument('--format', choices=['table', 'json'], default='table')

    # Get agent
    get_parser = agents_sub.add_parser('get')
    get_parser.add_argument('agent_id', help='Agent ID to retrieve')

    # Decommission agent
    decommission_parser = agents_sub.add_parser('decommission')
    decommission_parser.add_argument('agent_id', help='Agent ID to decommission')
    decommission_parser.add_argument('--reason', help='Reason for decommissioning')

    # Health subcommand
    health_parser = subparsers.add_parser('health')
    health_sub = health_parser.add_subparsers(dest='action')

    check_parser = health_sub.add_parser('check-all')
    check_parser.add_argument('--parallel', type=int, default=5, help='Number of parallel checks')

    # Parse arguments
    args = parser.parse_args()

    # Initialize registry client
    registry = RegistryClient("http://localhost:3001")

    if args.command == 'agents':
        if args.action == 'list':
            agents = await registry.list_agents(status=args.status if args.status != 'all' else None)

            if args.format == 'table':
                print(f"{'Agent ID':<30} {'Name':<25} {'Type':<12} {'Status':<10} {'Health':<10}")
                print("-" * 100)
                for agent in agents:
                    print(f"{agent['agentId']:<30} {agent['agentName']:<25} {agent['agentType']:<12} {agent['status']:<10} {agent['healthStatus']:<10}")
            else:
                print(json.dumps(agents, indent=2))

        elif args.action == 'get':
            agent = await registry.get_agent(args.agent_id)
            print(json.dumps(agent, indent=2))

        elif args.action == 'decommission':
            success = await registry.decommission_agent(args.agent_id, args.reason)
            if success:
                print(f"Successfully decommissioned agent {args.agent_id}")
            else:
                print(f"Failed to decommission agent {args.agent_id}")

    elif args.command == 'health':
        if args.action == 'check-all':
            results = await registry.check_all_health(parallel=args.parallel)
            healthy = sum(1 for r in results if r['status'] == 'healthy')
            total = len(results)
            print(f"Health check complete: {healthy}/{total} agents healthy")

            # Show unhealthy agents
            unhealthy = [r for r in results if r['status'] != 'healthy']
            if unhealthy:
                print("\nUnhealthy agents:")
                for agent in unhealthy:
                    print(f"  {agent['agentId']}: {agent['status']} - {agent.get('error', 'Unknown error')}")

if __name__ == '__main__':
    asyncio.run(main())
```

---

## 📊 **Performance & Scaling Considerations**

### **1. Database Optimization**

#### **Indexing Strategy**
```sql
-- Primary performance indexes
CREATE INDEX idx_agents_status_health ON agents (status, health_status);
CREATE INDEX idx_agents_capabilities ON agents (capabilities(255));
CREATE INDEX idx_agents_last_seen ON agents (last_seen);

-- Health check performance
CREATE INDEX idx_health_checks_agent_time ON agent_health_checks (agent_id, check_timestamp);
CREATE INDEX idx_health_checks_status ON agent_health_checks (status);

-- Relationship queries
CREATE INDEX idx_relationships_source ON agent_relationships (source_agent_id, relationship_type);
CREATE INDEX idx_relationships_target ON agent_relationships (target_agent_id, relationship_type);

-- Workflow performance
CREATE INDEX idx_workflows_status_priority ON workflows (status, priority);
CREATE INDEX idx_workflow_steps_workflow_status ON workflow_steps (workflow_id, status);
```

#### **Partitioning Strategy**
```sql
-- Partition health checks by month for better performance
ALTER TABLE agent_health_checks
PARTITION BY RANGE (YEAR(check_timestamp)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### **2. Caching Strategy**

#### **Multi-Level Caching**
```typescript
class RegistryCache {
  private memoryCache: Map<string, CacheEntry>;
  private redisClient: Redis;
  private ttlSeconds: number = 300; // 5 minutes

  async get(key: string): Promise<any> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check Redis cache
    const redisData = await this.redisClient.get(key);
    if (redisData) {
      const parsed = JSON.parse(redisData);
      // Update memory cache
      this.memoryCache.set(key, { data: parsed, timestamp: Date.now() });
      return parsed;
    }

    return null;
  }

  async set(key: string, data: any): Promise<void> {
    const entry = { data, timestamp: Date.now() };

    // Set in memory cache
    this.memoryCache.set(key, entry);

    // Set in Redis with TTL
    await this.redisClient.setex(key, this.ttlSeconds, JSON.stringify(data));
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttlSeconds * 1000;
  }
}
```

### **3. Load Balancing & Failover**

#### **Agent Load Balancer**
```typescript
class AgentLoadBalancer {
  private agents: Map<string, AgentInstance[]> = new Map();

  registerAgent(capability: string, agent: AgentInstance): void {
    if (!this.agents.has(capability)) {
      this.agents.set(capability, []);
    }
    this.agents.get(capability)!.push(agent);
  }

  selectAgent(capability: string, strategy: 'round-robin' | 'least-loaded' | 'random' = 'least-loaded'): AgentInstance | null {
    const candidates = this.agents.get(capability);
    if (!candidates || candidates.length === 0) {
      return null;
    }

    // Filter to healthy agents only
    const healthyAgents = candidates.filter(agent => agent.healthStatus === 'healthy');

    if (healthyAgents.length === 0) {
      return null;
    }

    switch (strategy) {
      case 'round-robin':
        return this.selectRoundRobin(healthyAgents, capability);

      case 'least-loaded':
        return this.selectLeastLoaded(healthyAgents);

      case 'random':
        return healthyAgents[Math.floor(Math.random() * healthyAgents.length)];

      default:
        return healthyAgents[0];
    }
  }

  private selectRoundRobin(agents: AgentInstance[], capability: string): AgentInstance {
    const key = `rr_${capability}`;
    const currentIndex = this.roundRobinIndex.get(key) || 0;
    const selected = agents[currentIndex % agents.length];
    this.roundRobinIndex.set(key, currentIndex + 1);
    return selected;
  }

  private selectLeastLoaded(agents: AgentInstance[]): AgentInstance {
    return agents.reduce((least, current) =>
      (current.loadFactor < least.loadFactor) ? current : least
    );
  }
}
```

---

## 📋 **Registered Agents**

### IT Specialist Swarm Agents

Located in `/deep-agents/deep_agents/agents/shared/it_specialists/`

| Agent ID | Name | Type | File | Capabilities | Status |
|----------|------|------|------|--------------|--------|
| `base_it_specialist` | Base IT Specialist | Base | `0000_base_it_specialist.py` | base_agent, communication, monitoring | ✅ Active |
| `agent_generator` | Agent Generator | Specialist | `0010_agent_generator.py` | create_agents, deploy_agents, template_customization, modal_generation, page_management, agent_templating | ✅ Active |
| `agent_manager` | Agent Manager | Specialist | `0020_agent_manager.py` | monitor_agents, start_agents, stop_agents, scale_agents, health_checks, performance_tracking, lifecycle_management | ✅ Active |
| `agent_enhancer` | Agent Enhancer | Specialist | `0030_agent_enhancer.py` | optimize_performance, auto_scaling, parameter_tuning, resource_allocation, system_optimization, performance_analysis | ✅ Active |
| `agent_validator` | Agent Validator | Specialist | `0040_agent_validator.py` | quality_assurance, security_validation, compliance_checking, error_detection, quality_metrics, code_analysis | ✅ Active |
| `simulation_coordinator` | Simulation Coordinator | Specialist | `0050_simulation_coordinator.py` | orchestrate_testing, simulate_workflows, validate_quality, performance_benchmarking, error_scenario_testing, three_level_testing | ✅ Active |
| `it_specialist_orchestrator` | IT Specialist Orchestrator | Supervisor | `0060_it_specialist_orchestrator.py` | task_routing, swarm_coordination, performance_monitoring, tool_access_coordination, comprehensive_reporting | ✅ Active |
| `knowledge_sync_specialist` | Knowledge Sync Specialist | Specialist | `0070_knowledge_sync_specialist.py` | knowledge_synchronization, data_consistency, schema_parsing | ✅ Active |
| `workflow_orchestration_tester` | Workflow Orchestration Tester | Specialist | `0070_workflow_orchestration_tester.py` | workflow_testing, orchestration_validation, test_execution | ✅ Active |
| `workflow_debug_analyst` | Workflow Debug Analyst | Specialist | `0080_workflow_debug_analyst.py` | debug_analysis, error_tracing, diagnostic_reporting | ✅ Active |
| `configuration_validator` | Configuration Validator | Specialist | `0090_configuration_validator.py` | config_validation, schema_validation, settings_verification | ✅ Active |
| `page_builder` | Page Builder Agent | Specialist | `0100_page_builder.py` | page_creation, page_scaffolding, component_generation | ✅ Active |
| `page_testing_verification` | Page Testing Verification | Specialist | `0110_page_testing_verification.py` | page_testing, verification, quality_assurance | ✅ Active |
| `activate_learning_system` | Activate Learning System | Utility | `0120_activate_learning_system.py` | learning_activation, system_initialization | ✅ Active |
| `collaborative_learning` | Collaborative Learning | Utility | `0130_collaborative_learning.py` | collaborative_learning, knowledge_sharing | ✅ Active |
| `continuous_improvement` | Continuous Improvement | Utility | `0140_continuous_improvement.py` | process_improvement, optimization_feedback | ✅ Active |
| `hitl_integration` | HITL Integration | Utility | `0150_hitl_integration.py` | human_in_the_loop, task_coordination, review_management | ✅ Active |
| `knowledge_store` | Knowledge Store | Utility | `0160_knowledge_store.py` | knowledge_persistence, data_storage, retrieval | ✅ Active |
| `learning_enhancement` | Learning Enhancement | Utility | `0170_learning_enhancement.py` | learning_optimization, skill_enhancement | ✅ Active |
| `learning_simulator_integration` | Learning Simulator Integration | Utility | `0180_learning_simulator_integration.py` | simulator_integration, training_coordination | ✅ Active |
| `mcp_client` | MCP Client | Utility | `0190_mcp_client.py` | mcp_protocol, client_operations, service_communication | ✅ Active |

### Discipline IT Specialists

Located in `/deep-agents/deep_agents/agents/shared/discipline_it_specialists/`

| Agent ID | Name | Type | File | Capabilities | Status |
|----------|------|------|------|--------------|--------|
| `base_discipline_it_specialist` | Base Discipline IT Specialist | Base | `0000_base_discipline_it_specialist.py` | base_agent, discipline_specialization, pattern_recognition | ✅ Active |
| `construction_it_specialist` | Construction IT Specialist | Specialist | `00300_construction_it_specialist.py` | construction_patterns, build_management, discipline_specialization | ✅ Active |
| `contracts_it_specialist` | Contracts IT Specialist | Specialist | `00400_contracts_it_specialist.py` | contract_patterns, agreement_management, legal_compliance | ✅ Active |
| `contracts_pre_award_it_specialist` | Contracts Pre-Award IT Specialist | Specialist | `00425_contracts_pre_award_it_specialist.py` | pre_award_patterns, tender_management, bid_processing | ✅ Active |
| `contracts_post_award_it_specialist` | Contracts Post-Award IT Specialist | Specialist | `00435_contracts_post_award_it_specialist.py` | post_award_patterns, contract_execution, compliance_monitoring | ✅ Active |
| `design_it_specialist` | Design IT Specialist | Specialist | `00800_design_it_specialist.py` | design_patterns, cad_integration, design_management | ✅ Active |
| `architectural_it_specialist` | Architectural IT Specialist | Specialist | `00825_architectural_it_specialist.py` | architectural_patterns, blueprint_management, design_coordination | ✅ Active |
| `chemical_engineering_it_specialist` | Chemical Engineering IT Specialist | Specialist | `00835_chemical_engineering_it_specialist.py` | chemical_patterns, process_design, safety_compliance | ✅ Active |
| `civil_engineering_it_specialist` | Civil Engineering IT Specialist | Specialist | `00850_civil_engineering_it_specialist.py` | civil_patterns, structural_analysis, infrastructure_management | ✅ Active |
| `geotechnical_engineering_it_specialist` | Geotechnical Engineering IT Specialist | Specialist | `00855_geotechnical_engineering_it_specialist.py` | geotechnical_patterns, soil_analysis, foundation_design | ✅ Active |
| `electrical_engineering_it_specialist` | Electrical Engineering IT Specialist | Specialist | `00860_electrical_engineering_it_specialist.py` | electrical_patterns, power_systems, circuit_design | ✅ Active |
| `mechanical_engineering_it_specialist` | Mechanical Engineering IT Specialist | Specialist | `00870_mechanical_engineering_it_specialist.py` | mechanical_patterns, hvac_systems, machinery_design | ✅ Active |
| `process_engineering_it_specialist` | Process Engineering IT Specialist | Specialist | `00871_process_engineering_it_specialist.py` | process_patterns, workflow_optimization, system_design | ✅ Active |
| `developer_it_specialist` | Developer IT Specialist | Specialist | `00872_developer_it_specialist.py` | development_patterns, code_generation, technical_solutions | ✅ Active |
| `directors_it_specialist` | Directors IT Specialist | Specialist | `00876_directors_it_specialist.py` | director_patterns, executive_management, board_operations | ✅ Active |
| `sundry_it_specialist` | Sundry IT Specialist | Specialist | `00877_sundry_it_specialist.py` | sundry_patterns, miscellaneous_operations, general_support | ✅ Active |
| `board_of_directors_it_specialist` | Board of Directors IT Specialist | Specialist | `00880_board_of_directors_it_specialist.py` | board_patterns, governance_support, executive_coordination | ✅ Active |
| `director_construction_it_specialist` | Director Construction IT Specialist | Specialist | `00882_director_construction_it_specialist.py` | construction_director_patterns, project_oversight, build_management | ✅ Active |
| `director_contracts_it_specialist` | Director Contracts IT Specialist | Specialist | `00883_director_contracts_it_specialist.py` | contracts_director_patterns, agreement_oversight, legal_management | ✅ Active |
| `director_engineering_it_specialist` | Director Engineering IT Specialist | Specialist | `00884_director_engineering_it_specialist.py` | engineering_director_patterns, technical_oversight, design_management | ✅ Active |
| `director_hse_it_specialist` | Director HSE IT Specialist | Specialist | `00885_director_hse_it_specialist.py` | hse_director_patterns, safety_oversight, compliance_management | ✅ Active |
| `director_logistics_it_specialist` | Director Logistics IT Specialist | Specialist | `00886_director_logistics_it_specialist.py` | logistics_director_patterns, supply_oversight, distribution_management | ✅ Active |
| `director_procurement_it_specialist` | Director Procurement IT Specialist | Specialist | `00888_director_procurement_it_specialist.py` | procurement_director_patterns, sourcing_oversight, vendor_management | ✅ Active |
| `director_finance_it_specialist` | Director Finance IT Specialist | Specialist | `00889_director_finance_it_specialist.py` | finance_director_patterns, financial_oversight, budget_management | ✅ Active |
| `director_projects_it_specialist` | Director Projects IT Specialist | Specialist | `00890_director_projects_it_specialist.py` | projects_director_patterns, portfolio_oversight, project_coordination | ✅ Active |
| `director_project_it_specialist` | Director Project IT Specialist | Specialist | `00895_director_project_it_specialist.py` | project_director_patterns, single_project_oversight, execution_management | ✅ Active |
| `environmental_it_specialist` | Environmental IT Specialist | Specialist | `01000_environmental_it_specialist.py` | environmental_patterns, impact_assessment, sustainability_management | ✅ Active |
| `ethics_it_specialist` | Ethics IT Specialist | Specialist | `01100_ethics_it_specialist.py` | ethics_patterns, compliance_monitoring, policy_adherence | ✅ Active |
| `finance_it_specialist` | Finance IT Specialist | Specialist | `01200_finance_it_specialist.py` | finance_patterns, financial_management, accounting_integration | ✅ Active |
| `governance_it_specialist` | Governance IT Specialist | Specialist | `01300_governance_it_specialist.py` | governance_patterns, policy_management, oversight_coordination | ✅ Active |
| `health_it_specialist` | Health IT Specialist | Specialist | `01400_health_it_specialist.py` | health_patterns, medical_compliance, wellness_management | ✅ Active |
| `human_resources_it_specialist` | Human Resources IT Specialist | Specialist | `01500_human_resources_it_specialist.py` | hr_patterns, personnel_management, recruitment_support | ✅ Active |
| `local_content_it_specialist` | Local Content IT Specialist | Specialist | `01600_local_content_it_specialist.py` | local_content_patterns, compliance_tracking, community_engagement | ✅ Active |
| `logistics_it_specialist` | Logistics IT Specialist | Specialist | `01700_logistics_it_specialist.py` | logistics_patterns, supply_chain_management, distribution_coordination | ✅ Active |
| `legal_it_specialist` | Legal IT Specialist | Specialist | `01750_legal_it_specialist.py` | legal_patterns, contract_review, compliance_management | ✅ Active |
| `operations_it_specialist` | Operations IT Specialist | Specialist | `01800_operations_it_specialist.py` | operations_patterns, process_management, operational_efficiency | ✅ Active |
| `other_parties_it_specialist` | Other Parties IT Specialist | Specialist | `01850_other_parties_it_specialist.py` | third_party_patterns, stakeholder_management, external_coordination | ✅ Active |
| `procurement_it_specialist` | Procurement IT Specialist | Specialist | `01900_procurement_it_specialist.py` | procurement_patterns, sourcing_management, vendor_coordination | ✅ Active |
| `project_controls_it_specialist` | Project Controls IT Specialist | Specialist | `02000_project_controls_it_specialist.py` | project_control_patterns, schedule_management, cost_control | ✅ Active |
| `quantity_surveying_it_specialist` | Quantity Surveying IT Specialist | Specialist | `02025_quantity_surveying_it_specialist.py` | qs_patterns, cost_estimation, measurement_management | ✅ Active |
| `scheduling_it_specialist` | Scheduling IT Specialist | Specialist | `02035_scheduling_it_specialist.py` | scheduling_patterns, timeline_management, resource_planning | ✅ Active |
| `inspection_it_specialist` | Inspection IT Specialist | Specialist | `02075_inspection_it_specialist.py` | inspection_patterns, quality_verification, compliance_checking | ✅ Active |
| `public_relations_it_specialist` | Public Relations IT Specialist | Specialist | `02100_public_relations_it_specialist.py` | pr_patterns, communication_management, media_coordination | ✅ Active |
| `quality_assurance_it_specialist` | Quality Assurance IT Specialist | Specialist | `02200_quality_assurance_it_specialist.py` | qa_patterns, quality_management, standard_compliance | ✅ Active |
| `quality_control_it_specialist` | Quality Control IT Specialist | Specialist | `02250_quality_control_it_specialist.py` | qc_patterns, inspection_management, defect_tracking | ✅ Active |
| `safety_it_specialist` | Safety IT Specialist | Specialist | `02400_safety_it_specialist.py` | safety_patterns, hazard_management, incident_prevention | ✅ Active |
| `security_it_specialist` | Security IT Specialist | Specialist | `02500_security_it_specialist.py` | security_patterns, access_control, threat_management | ✅ Active |
| `landscaping_it_specialist` | Landscaping IT Specialist | Specialist | `03000_landscaping_it_specialist.py` | landscaping_patterns, grounds_management, environmental_design | ✅ Active |

### Governance & Security Agents

Located in `/deep-agents/deep_agents/agents/shared/governance/`

| Agent ID | Name | Type | File | Capabilities | Status |
|----------|------|------|------|--------------|--------|
| `base_governance_agent` | Base Governance Agent | Base | `0000_base_governance_agent.py` | base_agent, governance_framework, policy_management | ✅ Active |
| `security_agent_orchestrator` | Security Agent Orchestrator | Orchestrator | `0000_security_agent_orchestrator.py` | security_coordination, threat_management, incident_response | ✅ Active |
| `governance_swarm_orchestrator` | Governance Swarm Orchestrator | Orchestrator | `0001_governance_swarm_orchestrator.py` | swarm_coordination, governance_oversight, policy_enforcement | ✅ Active |
| `multi_instance_security_orchestrator` | Multi-Instance Security Orchestrator | Orchestrator | `0010_multi_instance_security_orchestrator.py` | multi_instance_security, cross_tenant_protection, isolation_management | ✅ Active |
| `security_agent` | Security Agent | Specialist | `0010_security_agent.py` | security_monitoring, threat_detection, vulnerability_assessment | ✅ Active |
| `safety_agent` | Safety Agent | Specialist | `0020_safety_agent.py` | safety_monitoring, hazard_detection, incident_response | ✅ Active |
| `security_analyzer_agent` | Security Analyzer Agent | Specialist | `0020_security_analyzer_agent.py` | security_analysis, risk_assessment, threat_intelligence | ✅ Active |
| `base_security_agent` | Base Security Agent | Base | `0030_base_security_agent.py` | base_agent, security_operations, protection_framework | ✅ Active |
| `privacy_agent` | Privacy Agent | Specialist | `0030_privacy_agent.py` | privacy_protection, data_governance, compliance_monitoring | ✅ Active |
| `approval_manager_agent` | Approval Manager Agent | Specialist | `0040_approval_manager_agent.py` | approval_workflows, authorization_management, decision_tracking | ✅ Active |
| `reliability_agent` | Reliability Agent | Specialist | `0040_reliability_agent.py` | reliability_monitoring, system_stability, performance_assurance | ✅ Active |
| `accountability_agent` | Accountability Agent | Specialist | `0050_accountability_agent.py` | accountability_tracking, audit_management, responsibility_mapping | ✅ Active |
| `policy_deployer_agent` | Policy Deployer Agent | Specialist | `0050_policy_deployer_agent.py` | policy_deployment, configuration_management, rollout_coordination | ✅ Active |
| `policy_generator_agent` | Policy Generator Agent | Specialist | `0060_policy_generator_agent.py` | policy_creation, rule_generation, compliance_framework | ✅ Active |
| `societal_agent` | Societal Agent | Specialist | `0060_societal_agent.py` | societal_impact, ethical_compliance, stakeholder_management | ✅ Active |
| `eu_ai_act_agent` | EU AI Act Agent | Specialist | `0070_eu_ai_act_agent.py` | eu_compliance, ai_regulation, legal_adherence | ✅ Active |
| `third_party_risk_agent` | Third Party Risk Agent | Specialist | `0080_third_party_risk_agent.py` | vendor_risk, third_party_assessment, supply_chain_security | ✅ Active |
| `management_review_agent` | Management Review Agent | Specialist | `0090_management_review_agent.py` | management_oversight, review_coordination, executive_reporting | ✅ Active |
| `incident_response_agent` | Incident Response Agent | Specialist | `0100_incident_response_agent.py` | incident_management, crisis_response, recovery_coordination | ✅ Active |
| `supply_chain_security_agent` | Supply Chain Security Agent | Specialist | `0110_supply_chain_security_agent.py` | supply_chain_protection, vendor_security, logistics_security | ✅ Active |

### Orchestrators

Located in `/deep-agents/deep_agents/agents/shared/orchestrators/`

| Agent ID | Name | Type | File | Capabilities | Status |
|----------|------|------|------|--------------|--------|
| `multi_instance_orchestrator` | Multi-Instance Orchestrator | Orchestrator | `0000_multi_instance_orchestrator.py` | multi_instance_coordination, tenant_management, resource_allocation | ✅ Active |
| `workflow_orchestrator` | Workflow Orchestrator | Orchestrator | `0010_workflow_orchestrator.py` | workflow_management, task_coordination, process_automation | ✅ Active |

### Builder Agents

Located in `/deep-agents/deep_agents/agents/shared/builders/`

| Agent ID | Name | Type | File | Capabilities | Status |
|----------|------|------|------|--------------|--------|
| `discipline_builder_agent` | Discipline Builder Agent | Builder | `0000_discipline_builder_agent.py` | discipline_creation, pattern_generation, template_building | ✅ Active |

### Engineering Specialist Agents

Located in `/deep-agents/deep_agents/agents/shared/specialist_agents/engineering/`

| Agent ID | Name | Type | File | Capabilities | Status |
|----------|------|------|------|--------------|--------|
| `structural_engineering_specialist_agent` | Structural Engineering Specialist Agent | Specialist | `00825_structural_engineering_specialist_agent.py` | structural_analysis, load_calculations, design_verification | ✅ Active |
| `civil_engineering_specialist_agent` | Civil Engineering Specialist Agent | Specialist | `00850_civil_engineering_specialist_agent.py` | civil_design, infrastructure_planning, construction_coordination | ✅ Active |
| `geotechnical_engineering_specialist_agent` | Geotechnical Engineering Specialist Agent | Specialist | `00855_geotechnical_engineering_specialist_agent.py` | geotechnical_analysis, foundation_design, soil_mechanics | ✅ Active |
| `electrical_engineering_specialist_agent` | Electrical Engineering Specialist Agent | Specialist | `00860_electrical_engineering_specialist_agent.py` | electrical_design, power_distribution, system_integration | ✅ Active |
| `mechanical_engineering_specialist_agent` | Mechanical Engineering Specialist Agent | Specialist | `00870_mechanical_engineering_specialist_agent.py` | mechanical_design, hvac_systems, thermal_analysis | ✅ Active |
| `process_engineering_specialist_agent` | Process Engineering Specialist Agent | Specialist | `00871_process_engineering_specialist_agent.py` | process_design, optimization, workflow_engineering | ✅ Active |
| `environmental_engineering_specialist_agent` | Environmental Engineering Specialist Agent | Specialist | `01000_environmental_engineering_specialist_agent.py` | environmental_design, impact_assessment, sustainability | ✅ Active |
| `chemical_engineering_specialist_agent` | Chemical Engineering Specialist Agent | Specialist | `01900_chemical_engineering_specialist_agent.py` | chemical_processes, reactor_design, safety_analysis | ✅ Active |
| `technical_routing_specialist_agent` | Technical Routing Specialist Agent | Specialist | `01900_technical_routing_specialist_agent.py` | technical_coordination, routing_optimization, resource_allocation | ✅ Active |

### Core Framework Components

Located in `/deep-agents/deep_agents/core/`

| Component ID | Name | File | Purpose | Status |
|--------------|------|------|---------|--------|
| `accuracy_enhancement_tools` | Accuracy Enhancement Tools | `accuracy_enhancement_tools.py` | Tools for improving agent accuracy and performance | ✅ Active |
| `agent_config` | Agent Configuration | `agent_config.py` | Centralized agent configuration management | ✅ Active |
| `agent_loader` | Agent Loader | `agent_loader.py` | Dynamic agent loading and initialization | ✅ Active |
| `agent_plugin` | Agent Plugin System | `agent_plugin.py` | Plugin architecture for extensibility | ✅ Active |
| `agent_registry` | Agent Registry Core | `agent_registry.py` | Core registry functionality for agent management | ✅ Active |
| `c_caching_system` | Caching System | `c_caching_system.py` | High-performance caching for agent operations | ✅ Active |
| `c_deep_agents_core_framework` | Deep Agents Core Framework | `c_deep_agents_core_framework.py` | Foundation framework for all agents | ✅ Active |
| `c_deep_agents_state_management` | State Management | `c_deep_agents_state_management.py` | Agent state persistence and management | ✅ Active |
| `c_deep_agents_sub_agent_framework` | Sub-Agent Framework | `c_deep_agents_sub_agent_framework.py` | Framework for sub-agent coordination | ✅ Active |
| `c_deep_agents_supervisor_framework` | Supervisor Framework | `c_deep_agents_supervisor_framework.py` | Framework for supervisor agent operations | ✅ Active |
| `c_feature_flags` | Feature Flags | `c_feature_flags.py` | Dynamic feature flag management | ✅ Active |
| `security_data_models` | Security Data Models | `security_data_models.py` | Data models for security operations | ✅ Active |
| `supervisor_factory` | Supervisor Factory | `supervisor_factory.py` | Factory for creating supervisor instances | ✅ Active |
| `workflow_accuracy_integration` | Workflow Accuracy Integration | `workflow_accuracy_integration.py` | Integration for workflow accuracy tracking | ✅ Active |

### Testing Utilities

Located in `/deep-agents/deep_agents/agents/shared/it_specialists/testing/`

| Component | File | Purpose |
|-----------|------|---------|
| Base Workflow Tester | `base_workflow_tester.py` | Foundation for workflow testing |
| Test Data Generator | `test_data_generator.py` | Generate test datasets |
| Workflow Assertions | `workflow_assertions.py` | Assertion library for workflows |
| Workflow Report Generator | `workflow_report_generator.py` | Generate test reports |

### Page Services

Located in `/deep-agents/deep_agents/services/`

100+ page-specific pattern services (00100_home_patterns.py through 30165_tax_patterns.py) covering all application pages and disciplines. These services provide page-specific pattern recognition and code generation capabilities for the entire application suite.

### Page-Specific Agents

Located in `/deep-agents/deep_agents/agents/pages/`

| Page Directory | Agent Files | Purpose |
|----------------|-------------|---------|
| `00435-contracts_post_award/` | `a_contracts_hitl_coordinator.py`, `specialist_model_loader.py` | Contracts Post-Award page agents |
| `00825-architectural/` | Page-specific agents | Architectural discipline agents |
| `00850-civil-engineering/` | Page-specific agents | Civil engineering discipline agents |
| `01900-procurement/` | Page-specific agents | Procurement page agents |
| `02025_quantity_surveying/` | Page-specific agents | Quantity surveying agents |
| `02400-contractor_vetting/` | Page-specific agents | Contractor vetting agents |
| `drawing_analysis/` | Drawing analysis agents | Drawing processing and analysis |

---

**Agent Registry Summary:**
- **IT Specialist Swarm**: 21 agents
- **Discipline IT Specialists**: 49 agents
- **Governance & Security**: 20 agents
- **Orchestrators**: 2 agents
- **Builders**: 1 agent
- **Engineering Specialists**: 9 agents
- **Core Framework Components**: 14 components
- **Page Services**: 100+ services
- **Page-Specific Agents**: 7 page directories

**Total Registered Agents & Components: 216+**

---

## ✅ **Implementation Roadmap**

### **Phase 1: Core Registry (Week 1)**
- ✅ Database schema implementation
- ✅ Basic registration API
- ✅ Agent discovery endpoints
- ✅ Health check framework

### **Phase 2: Advanced Features (Week 2)**
- ✅ Capability-based matching
- ✅ Relationship tracking
- ✅ Workflow coordination
- ✅ Performance monitoring

### **Phase 3: Production Readiness (Week 3)**
- ✅ Load balancing and failover
- ✅ Comprehensive health monitoring
- ✅ Administrative tools and APIs
- ✅ Performance optimization and caching

### **Phase 4: Agent Expansion (Complete)**
- ✅ IT Specialist Swarm (21 agents)
- ✅ Page Pattern Services (100+ services)
- ✅ Testing Utilities (4 components)
- ✅ File naming standardization
- ✅ README documentation for all folders

---

*This Agent Registry System provides the centralized infrastructure for agent lifecycle management, discovery, and coordination across the ConstructAI unified agent platform. The system enables seamless agent integration with automatic health monitoring, intelligent capability matching, and robust performance management.*

**Last Updated**: 2026-02-10
