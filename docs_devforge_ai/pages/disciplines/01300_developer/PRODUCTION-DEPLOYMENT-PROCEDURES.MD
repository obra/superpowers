# 🚀 **Production Deployment Procedures**
**ConstructAI Agent Architecture Consolidation - Production Deployment**

**Date**: January 15, 2026
**Version**: 1.0
**Status**: **DEPLOYMENT READY**
**Purpose**: Comprehensive production deployment procedures for unified agent platform

---

## 📋 Executive Summary

This document provides detailed procedures for deploying the unified agent platform to production environments. The deployment procedures ensure consistent, reliable, and secure rollout across all environments with comprehensive rollback capabilities.

### Deployment Scope
- **Target Systems**: Unified agent platform with all components
- **Environments**: Development, Staging, Production
- **Deployment Method**: Blue-green deployment with feature flags
- **Rollback Time**: < 15 minutes for complete rollback
- **Downtime**: Zero planned downtime

### Success Criteria
- ✅ All components deploy successfully
- ✅ System health checks pass
- ✅ Performance meets SLAs
- ✅ Monitoring and alerting operational
- ✅ Rollback procedures validated

---

## 🏗️ **Deployment Architecture**

### **Blue-Green Deployment Strategy**

#### **Architecture Overview**
```
Load Balancer
├── Blue Environment (Current Production)
│   ├── Legacy Agent System
│   ├── Old Communication Layer
│   └── Legacy Registry
│
└── Green Environment (New System)
    ├── Unified Agent Framework
    ├── New Communication Layer
    └── New Agent Registry
```

#### **Traffic Migration Strategy**
```
Phase 1: 0% New System (All traffic to Blue)
Phase 2: 10% New System (Canary deployment)
Phase 3: 50% New System (Load testing)
Phase 4: 100% New System (Full cutover)
Phase 5: Blue Environment (Rollback ready)
```

### **Component Deployment Order**

#### **Foundation Layer (Deploy First)**
1. **Infrastructure Components**
   - Network configuration
   - Security groups and policies
   - Load balancers and DNS
   - Monitoring infrastructure

2. **Data Layer**
   - Database schema deployment
   - Data migration scripts
   - Backup validation
   - Connection string updates

3. **Platform Layer**
   - Agent registry service
   - Communication infrastructure
   - Configuration management
   - Monitoring and logging

#### **Application Layer (Deploy Second)**
4. **Core Framework**
   - Python unified framework
   - JavaScript unified framework
   - Plugin system
   - Factory services

5. **Agent Layer (Deploy Last)**
   - Supervisor agents
   - Specialist agents
   - Service agents
   - Coordinator agents

---

## 📋 **Pre-Deployment Checklist**

### **Infrastructure Preparation**
- [ ] Production servers provisioned and configured
- [ ] Network security groups updated
- [ ] Load balancer configuration validated
- [ ] DNS records prepared for cutover
- [ ] SSL certificates installed and validated
- [ ] Database connections tested
- [ ] Backup systems operational

### **Application Preparation**
- [ ] Code deployed to staging environment
- [ ] Integration tests passed
- [ ] Performance benchmarks met
- [ ] Security scanning completed
- [ ] Configuration files validated
- [ ] Environment variables configured

### **Operational Preparation**
- [ ] Monitoring dashboards configured
- [ ] Alerting rules activated
- [ ] On-call team notified
- [ ] Rollback procedures documented
- [ ] Communication plan executed
- [ ] Go/no-go checklist completed

### **Team Preparation**
- [ ] Deployment team assembled
- [ ] Roles and responsibilities assigned
- [ ] Communication channels established
- [ ] Escalation procedures documented
- [ ] Post-deployment support scheduled

---

## 🚀 **Deployment Procedures**

### **Phase 1: Infrastructure Deployment**

#### **Step 1.1: Environment Setup**
```bash
#!/bin/bash
# deploy_infrastructure.sh

# Create production namespace
kubectl create namespace constructai-agents-prod

# Deploy network policies
kubectl apply -f infrastructure/network-policies.yaml

# Deploy persistent volumes
kubectl apply -f infrastructure/persistent-volumes.yaml

# Deploy configmaps and secrets
kubectl apply -f infrastructure/configmaps/
kubectl apply -f infrastructure/secrets/

# Verify infrastructure
kubectl get pods -n constructai-agents-prod
kubectl get services -n constructai-agents-prod
```

#### **Step 1.2: Database Deployment**
```bash
#!/bin/bash
# deploy_database.sh

# Deploy PostgreSQL cluster
helm install constructai-db bitnami/postgresql \
  --namespace constructai-agents-prod \
  --values infrastructure/database/values-prod.yaml

# Wait for database readiness
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/name=postgresql \
  -n constructai-agents-prod \
  --timeout=300s

# Run schema migrations
kubectl apply -f database/migrations/
kubectl wait --for=condition=complete job \
  -l job-name=db-migration \
  -n constructai-agents-prod

# Validate database connectivity
kubectl run db-test --image=postgres:13 \
  --restart=Never \
  --rm \
  -i \
  -- psql -h constructai-db -U constructai -d constructai_agents
```

#### **Step 1.3: Monitoring Infrastructure**
```bash
#!/bin/bash
# deploy_monitoring.sh

# Deploy Prometheus
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --values monitoring/prometheus-values.yaml

# Deploy Grafana
helm install grafana grafana/grafana \
  --namespace monitoring \
  --values monitoring/grafana-values.yaml

# Deploy ELK stack for logging
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --values logging/elasticsearch-values.yaml

# Configure alerting
kubectl apply -f monitoring/alertmanager-config.yaml
```

### **Phase 2: Platform Deployment**

#### **Step 2.1: Agent Registry Deployment**
```bash
#!/bin/bash
# deploy_registry.sh

# Build and push registry image
docker build -t constructai/agent-registry:latest .
docker push constructai/agent-registry:latest

# Deploy registry service
kubectl apply -f agents/registry/deployment.yaml
kubectl apply -f agents/registry/service.yaml
kubectl apply -f agents/registry/ingress.yaml

# Wait for registry readiness
kubectl wait --for=condition=ready pod \
  -l app=agent-registry \
  -n constructai-agents-prod \
  --timeout=300s

# Validate registry health
curl -f http://registry.constructai.com/health
```

#### **Step 2.2: Communication Layer Deployment**
```bash
#!/bin/bash
# deploy_communication.sh

# Deploy HTTP communication service
kubectl apply -f agents/communication/http-deployment.yaml

# Deploy WebSocket service
kubectl apply -f agents/communication/websocket-deployment.yaml

# Deploy message queue (Redis/NATS)
helm install nats bitnami/nats \
  --namespace constructai-agents-prod \
  --values communication/nats-values.yaml

# Configure load balancer
kubectl apply -f infrastructure/load-balancer.yaml
```

#### **Step 2.3: Configuration Management**
```bash
#!/bin/bash
# deploy_configuration.sh

# Deploy configuration service
kubectl apply -f agents/core/config-deployment.yaml

# Create production configuration
kubectl create configmap agent-config \
  --from-file=config/production.yaml \
  -n constructai-agents-prod

# Set production environment variables
kubectl create secret generic agent-secrets \
  --from-literal=registry-url=https://registry.constructai.com \
  --from-literal=db-password=$DB_PASSWORD \
  -n constructai-agents-prod
```

### **Phase 3: Application Deployment**

#### **Step 3.1: Core Framework Deployment**
```bash
#!/bin/bash
# deploy_framework.sh

# Deploy Python framework
kubectl apply -f agents/core/python-deployment.yaml

# Deploy JavaScript framework
kubectl apply -f agents/core/javascript-deployment.yaml

# Deploy plugin system
kubectl apply -f agents/core/plugin-deployment.yaml

# Deploy factory service
kubectl apply -f agents/core/factory-deployment.yaml
```

#### **Step 3.2: Agent Deployment (Canary)**
```bash
#!/bin/bash
# deploy_agents_canary.sh

# Deploy 10% of agents for canary testing
kubectl apply -f agents/types/supervisors/correspondence-supervisor.yaml
kubectl apply -f agents/types/specialists/civil-engineering.yaml

# Configure canary traffic (10% to new system)
kubectl apply -f infrastructure/canary-routing.yaml

# Monitor canary performance
watch -n 30 kubectl get pods -n constructai-agents-prod
```

#### **Step 3.3: Full Agent Deployment**
```bash
#!/bin/bash
# deploy_agents_full.sh

# Deploy all remaining agents
kubectl apply -f agents/types/supervisors/
kubectl apply -f agents/types/specialists/
kubectl apply -f agents/types/services/
kubectl apply -f agents/types/coordinators/

# Wait for all agents to be ready
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/name=agent \
  -n constructai-agents-prod \
  --timeout=600s
```

### **Phase 4: Traffic Migration**

#### **Step 4.1: Gradual Traffic Migration**
```bash
#!/bin/bash
# migrate_traffic.sh

# Phase 1: 25% traffic to new system
kubectl apply -f infrastructure/traffic-split-25.yaml
sleep 300  # Monitor for 5 minutes

# Phase 2: 50% traffic to new system
kubectl apply -f infrastructure/traffic-split-50.yaml
sleep 300  # Monitor for 5 minutes

# Phase 3: 75% traffic to new system
kubectl apply -f infrastructure/traffic-split-75.yaml
sleep 300  # Monitor for 5 minutes

# Phase 4: 100% traffic to new system
kubectl apply -f infrastructure/traffic-split-100.yaml
```

#### **Step 4.2: DNS Cutover**
```bash
#!/bin/bash
# dns_cutover.sh

# Update DNS records
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dns/cutover-batch.json

# Wait for DNS propagation
sleep 300

# Validate DNS resolution
nslookup api.constructai.com
dig api.constructai.com
```

#### **Step 4.3: Legacy System Shutdown**
```bash
#!/bin/bash
# shutdown_legacy.sh

# Scale down legacy deployments
kubectl scale deployment legacy-agents --replicas=0 -n legacy-system

# Stop legacy services
kubectl delete -f legacy/deployments/

# Archive legacy data (if needed)
# This would be handled by data migration team
```

### **Phase 5: Post-Deployment Validation**

#### **Step 5.1: Health Checks**
```bash
#!/bin/bash
# validate_deployment.sh

# Check all services are running
kubectl get pods -n constructai-agents-prod

# Validate service health
curl -f http://api.constructai.com/health
curl -f http://registry.constructai.com/health

# Check agent registration
curl -f http://registry.constructai.com/agents | jq '.agents | length'

# Validate cross-agent communication
# This would run integration tests
```

#### **Step 5.2: Performance Validation**
```bash
#!/bin/bash
# performance_validation.sh

# Run load tests
artillery run tests/load/agent-communication.yml

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://api.constructai.com/agents

# Validate monitoring data
curl -f http://prometheus.constructai.com/api/v1/query?query=agent_response_time
```

#### **Step 5.3: Functional Testing**
```bash
#!/bin/bash
# functional_testing.sh

# Run end-to-end tests
npm test -- --testPathPattern=e2e
python -m pytest tests/e2e/

# Validate business workflows
# Test procurement workflow
# Test correspondence processing
# Test specialist coordination
```

---

## 🔄 **Rollback Procedures**

### **Immediate Rollback (< 5 minutes)**

#### **Traffic Rollback**
```bash
#!/bin/bash
# emergency_rollback.sh

# Immediate traffic rollback to legacy system
kubectl apply -f infrastructure/traffic-split-0.yaml

# Scale down new system (keep running for investigation)
kubectl scale deployment -l system=unified --replicas=0 -n constructai-agents-prod

# Alert team
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-type: application/json' \
  --data '{"text":"🚨 Emergency rollback initiated"}'
```

### **Gradual Rollback (15-30 minutes)**

#### **Component Rollback**
```bash
#!/bin/bash
# gradual_rollback.sh

# Phase 1: Scale back traffic gradually
kubectl apply -f infrastructure/traffic-split-75.yaml
sleep 300

kubectl apply -f infrastructure/traffic-split-50.yaml
sleep 300

kubectl apply -f infrastructure/traffic-split-25.yaml
sleep 300

kubectl apply -f infrastructure/traffic-split-0.yaml

# Phase 2: Restore legacy system
kubectl scale deployment legacy-agents --replicas=3 -n legacy-system

# Phase 3: Cleanup new system (keep for analysis)
# kubectl delete namespace constructai-agents-prod
```

### **Data Rollback**

#### **Configuration Rollback**
```bash
#!/bin/bash
# config_rollback.sh

# Restore previous configuration
kubectl apply -f backup/config-backup.yaml

# Reset environment variables
kubectl delete secret agent-secrets -n constructai-agents-prod
kubectl apply -f backup/secrets-backup.yaml
```

#### **Database Rollback**
```bash
#!/bin/bash
# database_rollback.sh

# Restore from backup
pg_restore -h $DB_HOST -U $DB_USER -d constructai_agents backup/pre_migration.dump

# Revert schema changes
psql -h $DB_HOST -U $DB_USER -d constructai_agents -f migrations/rollback.sql
```

---

## 📊 **Monitoring & Alerting**

### **Deployment Monitoring Dashboard**

#### **Key Metrics to Monitor**
```yaml
# monitoring/dashboard-config.yaml
dashboard:
  title: "Agent Platform Deployment"

panels:
  - title: "Agent Health Status"
    query: "sum(agent_health_status) by (agent_type)"
    type: "gauge"

  - title: "Response Time"
    query: "histogram_quantile(0.95, sum(rate(agent_request_duration_bucket[5m])) by (le))"
    type: "graph"

  - title: "Error Rate"
    query: "sum(rate(agent_requests_total{status=~\"5..\"}[5m])) / sum(rate(agent_requests_total[5m])) * 100"
    type: "singlestat"

  - title: "Active Agents"
    query: "sum(agent_active_instances)"
    type: "singlestat"
```

#### **Alert Rules**
```yaml
# monitoring/alert-rules.yaml
groups:
  - name: agent_deployment
    rules:
      - alert: HighErrorRate
        expr: sum(rate(agent_requests_total{status=~\"5..\"}[5m])) / sum(rate(agent_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: AgentUnhealthy
        expr: agent_health_status == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Agent unhealthy"
          description: "Agent {{ $labels.agent_id }} is unhealthy"
```

### **Real-time Monitoring Commands**

#### **Deployment Progress**
```bash
# Monitor deployment progress
watch -n 10 'kubectl get pods -n constructai-agents-prod | grep -v Running'

# Check service endpoints
kubectl get endpoints -n constructai-agents-prod

# Monitor resource usage
kubectl top pods -n constructai-agents-prod
```

#### **Traffic Migration**
```bash
# Monitor traffic distribution
curl -s http://load-balancer/stats | jq '.backends'

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://api.constructai.com/health

# Monitor error rates
kubectl logs -f deployment/agent-gateway -n constructai-agents-prod | grep ERROR
```

---

## 🧪 **Testing Procedures**

### **Smoke Tests**

#### **Post-Deployment Smoke Test**
```bash
#!/bin/bash
# smoke_test.sh

# Test basic connectivity
curl -f http://api.constructai.com/health || exit 1

# Test agent registry
curl -f http://registry.constructai.com/agents | jq -e '.agents' || exit 1

# Test agent creation
AGENT_ID=$(curl -X POST http://factory.constructai.com/agents \
  -H "Content-Type: application/json" \
  -d '{"agent_type": "supervisor", "config": {}}' | jq -r '.agent_id')

# Test agent communication
curl -f "http://api.constructai.com/agents/${AGENT_ID}/status" || exit 1

echo "✅ Smoke tests passed"
```

### **Load Testing**

#### **Gradual Load Increase**
```yaml
# tests/load/agent-platform.yml
config:
  target: 'http://api.constructai.com'
  phases:
    - duration: 60
      arrivalRate: 1
    - duration: 120
      arrivalRate: 5
    - duration: 180
      arrivalRate: 10
    - duration: 300
      arrivalRate: 20

scenarios:
  - name: 'Agent Communication'
    weight: 60
    flow:
      - post:
          url: '/agents/{{ agent_id }}/communicate'
          json:
            target_agent: '{{ target_agent }}'
            message: 'Hello from load test'

  - name: 'Agent Status Check'
    weight: 40
    flow:
      - get:
          url: '/agents/{{ agent_id }}/status'
```

### **Integration Testing**

#### **Cross-Component Testing**
```python
# tests/integration/deployment_test.py
import pytest
import requests
from agents.core.python.factory import agent_factory

class TestDeploymentIntegration:
    def test_agent_creation_and_communication(self):
        """Test end-to-end agent functionality post-deployment."""

        # Create agent via factory
        agent_id = "test_supervisor"
        agent = agent_factory.create_agent(agent_id)
        assert agent is not None

        # Test agent status
        response = requests.get(f"http://api.constructai.com/agents/{agent_id}/status")
        assert response.status_code == 200
        status = response.json()
        assert status['current_state'] == 'running'

        # Test cross-agent communication
        message = {
            "target_agent": "test_specialist",
            "message": {"action": "process", "data": "test"}
        }
        response = requests.post(
            f"http://api.constructai.com/agents/{agent_id}/communicate",
            json=message
        )
        assert response.status_code == 200

    def test_registry_integration(self):
        """Test agent registry functionality."""

        # Check agent registration
        response = requests.get("http://registry.constructai.com/agents")
        assert response.status_code == 200
        agents = response.json()
        assert len(agents['agents']) > 0

        # Verify agent metadata
        agent_info = requests.get("http://registry.constructai.com/agents/test_supervisor")
        assert agent_info.status_code == 200
```

---

## 📞 **Communication Plan**

### **Deployment Communication Timeline**

#### **T-48 Hours: Pre-Deployment Notification**
- Stakeholder notification
- Team readiness confirmation
- Environment preparation status

#### **T-24 Hours: Final Preparation**
- Deployment team briefing
- Go/no-go checklist review
- Stakeholder final confirmation

#### **T-4 Hours: Deployment Window**
- Team mobilization
- Monitoring team activation
- Stakeholder standby notification

#### **T-1 Hour: Final Go/No-Go**
- Final system checks
- Weather report (if applicable)
- Executive approval

#### **Deployment Start**
- Real-time status updates
- Issue alerts and resolution
- Progress milestones

#### **Deployment Complete**
- Success confirmation
- Performance report
- Next steps communication

### **Status Communication**

#### **Status Dashboard**
```bash
# Real-time deployment status
#!/bin/bash
while true; do
  clear
  echo "🚀 ConstructAI Agent Platform Deployment"
  echo "========================================"
  date
  echo ""

  echo "Infrastructure Status:"
  kubectl get nodes
  echo ""

  echo "Service Status:"
  kubectl get pods -n constructai-agents-prod --no-headers | awk '{print $1, $3}' | column -t
  echo ""

  echo "Traffic Distribution:"
  curl -s http://load-balancer/stats | jq '.traffic_split'
  echo ""

  echo "Key Metrics:"
  echo "Active Agents: $(kubectl get pods -n constructai-agents-prod --no-headers | wc -l)"
  echo "Error Rate: $(curl -s http://prometheus.constructai.com/api/v1/query?query=agent_error_rate | jq -r '.data.result[0].value[1]')%"
  echo "Response Time: $(curl -s http://prometheus.constructai.com/api/v1/query?query=agent_response_time_avg | jq -r '.data.result[0].value[1]')ms"

  sleep 30
done
```

#### **Automated Alerts**
```yaml
# alerting/deployment-alerts.yaml
alerts:
  - name: DeploymentStarted
    condition: deployment_status == "started"
    message: "🚀 Agent platform deployment has begun"
    channels: [slack, email]

  - name: DeploymentCompleted
    condition: deployment_status == "completed"
    message: "✅ Agent platform deployment completed successfully"
    channels: [slack, email, sms]

  - name: DeploymentFailed
    condition: deployment_status == "failed"
    message: "🚨 Agent platform deployment has failed - rollback initiated"
    channels: [slack, email, sms, pager]

  - name: HighErrorRate
    condition: error_rate > 5%
    message: "⚠️ High error rate detected during deployment"
    channels: [slack, pager]
```

---

## 🎯 **Success Metrics**

### **Deployment Success Criteria**

#### **Technical Success**
- [ ] All pods in Running state
- [ ] All services responding to health checks
- [ ] Agent registry populated with expected agents
- [ ] Cross-agent communication functional
- [ ] Monitoring data flowing correctly

#### **Performance Success**
- [ ] Response times within SLA (< 200ms average)
- [ ] Error rate below threshold (< 1%)
- [ ] Resource usage within limits
- [ ] Scalability targets met

#### **Business Success**
- [ ] All existing functionality preserved
- [ ] New features operational
- [ ] User experience maintained
- [ ] Business processes uninterrupted

### **Post-Deployment Validation**

#### **24-Hour Monitoring Period**
- Continuous performance monitoring
- Error rate tracking
- User experience validation
- Business metric monitoring

#### **48-Hour Stabilization Period**
- Performance optimization
- Configuration tuning
- Issue resolution
- Documentation updates

#### **1-Week Optimization Period**
- Performance benchmarking
- Scalability testing
- Feature validation
- Team training completion

---

## 📋 **Deployment Checklist**

### **Pre-Deployment Verification**
- [ ] Infrastructure provisioned and configured
- [ ] Application code deployed to staging
- [ ] Integration tests passing
- [ ] Security scans completed
- [ ] Performance benchmarks established
- [ ] Rollback procedures tested
- [ ] Team training completed

### **Deployment Execution**
- [ ] Infrastructure deployment completed
- [ ] Database migration successful
- [ ] Platform services operational
- [ ] Application deployment successful
- [ ] Traffic migration completed
- [ ] Legacy system shutdown clean

### **Post-Deployment Validation**
- [ ] Health checks passing
- [ ] Performance within SLA
- [ ] Error rates acceptable
- [ ] Monitoring operational
- [ ] Alerting configured
- [ ] Documentation updated

### **Go-Live Readiness**
- [ ] Business stakeholders notified
- [ ] Support team briefed
- [ ] Runbooks distributed
- [ ] Escalation procedures documented
- [ ] Success metrics validated

---

*This Production Deployment Procedures document provides the comprehensive roadmap for safely and successfully deploying the unified agent platform to production. The procedures emphasize safety, monitoring, and rapid rollback capabilities to ensure business continuity throughout the deployment process.*