# Prompt Sync Script - Deployment Pipeline Integration Guide

## Overview

This document provides comprehensive instructions for integrating the prompt synchronization script (`sync-prompts-to-database.js`) into your CI/CD deployment pipeline. The sync script ensures that prompt updates are automatically propagated to the database during deployments.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Pipeline                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Build Stage                                                  │
│    └─> npm install                                              │
│    └─> npm run build                                            │
│    └─> Run sync script (optional: --action=test)               │
│    └─> Run hot-reload tests (optional)                         │
│    └─> Docker build                                             │
│    └─> Security scanning                                        │
│    └─> Artifact upload                                          │
├─────────────────────────────────────────────────────────────────┤
│ 2. Deploy Stage (Staging)                                       │
│    └─> Deploy to staging environment                            │
│    └─> Run sync script with --action=sync                      │
│    └─> Verify database connectivity                             │
│    └─> Run hot-reload tests                                     │
│    └─> Smoke tests                                              │
├─────────────────────────────────────────────────────────────────┤
│ 3. Deploy Stage (Production)                                    │
│    └─> Manual approval gate                                     │
│    └─> Backup existing prompts                                  │
│    └─> Deploy to production                                     │
│    └─> Run sync script with --action=backup                    │
│    └─> Run sync script with --action=sync                      │
│    └─> Run hot-reload tests                                     │
│    └─> Health check & monitoring                                │
│    └─> Rollback if needed                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Environment Requirements

1. **Node.js**: Version 18.x or higher
2. **Supabase**: Active project with `prompts` table
3. **Environment Variables**: Configured in deployment environment
4. **Access Rights**: CI/CD runner needs database write permissions

### Required Environment Variables

```bash
# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# API Configuration
PROMPT_API_BASE_URL=http://localhost:3060
PROMPT_HOT_RELOAD=true

# Sync Configuration
PROMPT_SYNC_AUTO=true
PROMPT_SYNC_BACKUP_BEFORE_SYNC=true
```

## CI/CD Integration Examples

### GitHub Actions

Create `.github/workflows/deploy-sync.yml`:

```yaml
name: Deploy with Prompt Sync

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Test sync script (dry run)
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/sync-prompts-to-database.js --action=test
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    
    - name: Run hot-reload tests
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        npm install
        node scripts/test-hot-reload.js
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        PROMPT_API_BASE_URL: http://localhost:3060
    
    - name: Run unit tests
      run: npm test
    
    - name: Security scan
      run: npm audit
    
    - name: Build Docker image
      run: docker build -t myapp:${{ github.sha }} .
    
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push myapp:${{ github.sha }}

  deploy-staging:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Deploy to staging
      run: |
        # Your deployment commands here
        echo "Deploying to staging..."
    
    - name: Sync prompts to database
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/sync-prompts-to-database.js --action=sync
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    
    - name: Verify sync
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/sync-prompts-to-database.js --action=test
    
    - name: Run hot-reload tests
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/test-hot-reload.js
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        PROMPT_API_BASE_URL: http://staging.yourapp.com:3060
    
    - name: Smoke tests
      run: |
        # Your smoke test commands
        curl -f http://staging.yourapp.com/api/health || exit 1

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Manual approval gate
      uses: trstringer/manual-approval@v1
      with:
        secret: ${{ secrets.GITHUB_TOKEN }}
        approvers: ${{ secrets.APPROVERS }}
    
    - name: Backup existing prompts
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/sync-prompts-to-database.js --action=backup
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    
    - name: Deploy to production
      run: |
        # Your production deployment commands
        echo "Deploying to production..."
    
    - name: Sync prompts to database
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/sync-prompts-to-database.js --action=sync
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    
    - name: Verify sync
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/sync-prompts-to-database.js --action=test
    
    - name: Run hot-reload tests
      run: |
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/test-hot-reload.js
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        PROMPT_API_BASE_URL: http://yourapp.com:3060
    
    - name: Health check
      run: |
        # Wait for deployment to stabilize
        sleep 30
        curl -f http://yourapp.com/api/health || exit 1
        curl -f http://yourapp.com/api/prompts/hot-reload/status || exit 1
    
    - name: Notify deployment status
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - deploy
  - sync
  - verify

variables:
  SUPABASE_URL: $SUPABASE_URL
  SUPABASE_SERVICE_KEY: $SUPABASE_SERVICE_KEY

cache:
  paths:
    - node_modules/

build:
  stage: build
  image: node:18-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test-sync:
  stage: test
  image: node:18-alpine
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - npm ci
    - node scripts/sync-prompts-to-database.js --action=test
  only:
    - merge_requests
    - main

test-hot-reload:
  stage: test
  image: node:18-alpine
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - npm ci
    - node scripts/test-hot-reload.js
  variables:
    PROMPT_API_BASE_URL: http://localhost:3060
  only:
    - merge_requests
    - main

deploy-staging:
  stage: deploy
  image: alpine/k8s:latest
  script:
    - kubectl apply -f k8s/staging/
    - kubectl rollout status deployment/yourapp -n staging
  environment:
    name: staging
  only:
    - main

sync-staging:
  stage: sync
  image: node:18-alpine
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - npm ci
    - node scripts/sync-prompts-to-database.js --action=backup
    - node scripts/sync-prompts-to-database.js --action=sync
    - node scripts/sync-prompts-to-database.js --action=test
  environment:
    name: staging
  only:
    - main

verify-staging:
  stage: verify
  image: alpine/curl:latest
  script:
    - sleep 30
    - curl -f http://staging.yourapp.com/api/health
    - curl -f http://staging.yourapp.com/api/prompts/hot-reload/status
  environment:
    name: staging
  only:
    - main

deploy-production:
  stage: deploy
  image: alpine/k8s:latest
  script:
    - kubectl apply -f k8s/production/
    - kubectl rollout status deployment/yourapp -n production
  environment:
    name: production
  when: manual
  only:
    - main

sync-production:
  stage: sync
  image: node:18-alpine
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - npm ci
    - node scripts/sync-prompts-to-database.js --action=backup
    - node scripts/sync-prompts-to-database.js --action=sync
    - node scripts/sync-prompts-to-database.js --action=test
  environment:
    name: production
  when: manual
  only:
    - main

verify-production:
  stage: verify
  image: alpine/curl:latest
  script:
    - sleep 60
    - curl -f http://yourapp.com/api/health
    - curl -f http://yourapp.com/api/prompts/hot-reload/status
  environment:
    name: production
  when: manual
  only:
    - main

rollback:
  stage: verify
  image: node:18-alpine
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - node scripts/sync-prompts-to-database.js --action=restore
  environment:
    name: production
  when: manual
  only:
    - main
  allow_failure: true
```

### Jenkins Pipeline

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    environment {
        SUPABASE_URL = credentials('supabase-url')
        SUPABASE_SERVICE_KEY = credentials('supabase-service-key')
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
                stash includes: 'dist/', name: 'build-artifacts'
            }
        }
        
        stage('Test Sync Script') {
            steps {
                sh '''
                    cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
                    npm ci
                    node scripts/sync-prompts-to-database.js --action=test
                '''
            }
        }
        
        stage('Test Hot-Reload') {
            steps {
                sh '''
                    cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
                    npm ci
                    node scripts/test-hot-reload.js
                '''
                env.PROMPT_API_BASE_URL = 'http://localhost:3060'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                unstash 'build-artifacts'
                sh 'kubectl apply -f k8s/staging/'
                sh 'kubectl rollout status deployment/yourapp -n staging'
            }
        }
        
        stage('Sync Staging') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
                    node scripts/sync-prompts-to-database.js --action=backup
                    node scripts/sync-prompts-to-database.js --action=sync
                    node scripts/sync-prompts-to-database.js --action=test
                '''
            }
        }
        
        stage('Verify Staging') {
            when {
                branch 'main'
            }
            steps {
                sh 'sleep 30'
                sh 'curl -f http://staging.yourapp.com/api/health'
                sh 'curl -f http://staging.yourapp.com/api/prompts/hot-reload/status'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message 'Deploy to production?'
                ok 'Yes, deploy!'
            }
            steps {
                unstash 'build-artifacts'
                sh 'kubectl apply -f k8s/production/'
                sh 'kubectl rollout status deployment/yourapp -n production'
            }
        }
        
        stage('Sync Production') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
                    node scripts/sync-prompts-to-database.js --action=backup
                    node scripts/sync-prompts-to-database.js --action=sync
                    node scripts/sync-prompts-to-database.js --action=test
                '''
            }
        }
        
        stage('Verify Production') {
            when {
                branch 'main'
            }
            steps {
                sh 'sleep 60'
                sh 'curl -f http://yourapp.com/api/health'
                sh 'curl -f http://yourapp.com/api/prompts/hot-reload/status'
            }
        }
        
        stage('Notify') {
            steps {
                emailext (
                    subject: "Deployment Status: ${currentBuild.currentResult}",
                    body: """
                        Deployment completed with status: ${currentBuild.currentResult}
                        
                        Pipeline: ${env.JOB_NAME}
                        Build: ${env.BUILD_NUMBER}
                        Commit: ${env.GIT_COMMIT}
                        
                        Staging: http://staging.yourapp.com
                        Production: http://yourapp.com
                        
                        Check logs for details.
                    """,
                    to: 'devops@yourcompany.com'
                )
            }
        }
    }
    
    post {
        failure {
            emailext (
                subject: "Deployment Failed: ${env.JOB_NAME}",
                body: "Deployment failed. Check Jenkins logs for details.",
                to: 'devops@yourcompany.com'
            )
        }
        
        success {
            emailext (
                subject: "Deployment Successful: ${env.JOB_NAME}",
                body: "Deployment completed successfully.",
                to: 'devops@yourcompany.com'
            )
        }
        
        always {
            cleanWs()
        }
    }
}
```

### GitLab CI (Simplified Version)

Create `.gitlab-ci.yml` (minimal):

```yaml
variables:
  SUPABASE_URL: $SUPABASE_URL
  SUPABASE_SERVICE_KEY: $SUPABASE_SERVICE_KEY

stages:
  - build
  - test
  - deploy-staging
  - sync-staging
  - deploy-production
  - sync-production

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build

test-sync:
  stage: test
  image: node:18
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - node scripts/sync-prompts-to-database.js --action=test

test-hot-reload:
  stage: test
  image: node:18
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - node scripts/test-hot-reload.js

deploy-staging:
  stage: deploy-staging
  image: alpine/k8s:latest
  script:
    - kubectl apply -f k8s/staging/
  environment:
    name: staging
  only:
    - main

sync-staging:
  stage: sync-staging
  image: node:18
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - node scripts/sync-prompts-to-database.js --action=backup
    - node scripts/sync-prompts-to-database.js --action=sync
    - node scripts/sync-prompts-to-database.js --action=test
  environment:
    name: staging
  only:
    - main

deploy-production:
  stage: deploy-production
  image: alpine/k8s:latest
  script:
    - kubectl apply -f k8s/production/
  environment:
    name: production
  when: manual
  only:
    - main

sync-production:
  stage: sync-production
  image: node:18
  script:
    - cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    - node scripts/sync-prompts-to-database.js --action=backup
    - node scripts/sync-prompts-to-database.js --action=sync
    - node scripts/sync-prompts-to-database.js --action=test
  environment:
    name: production
  when: manual
  only:
    - main
```

## Deployment Strategies

### Strategy 1: Blue-Green Deployment

```yaml
# Blue-Green with sync
stages:
  - build
  - deploy-blue
  - sync-blue
  - verify-blue
  - switch-to-green
  - sync-green
  - verify-green
  - cleanup
```

### Strategy 2: Canary Deployment

```yaml
# Canary with sync
stages:
  - build
  - deploy-canary
  - sync-canary
  - verify-canary
  - manual-approval
  - deploy-full
  - sync-full
  - verify-full
```

### Strategy 3: Rolling Update

```yaml
# Rolling update with sync
stages:
  - build
  - deploy
  - sync
  - verify
  - cleanup-old
```

## Rollback Procedures

### Automated Rollback

```yaml
rollback:
  stage: rollback
  script:
    - |
      if [ "${AUTO_ROLLBACK}" = "true" ]; then
        echo "Initiating automatic rollback..."
        kubectl rollout undo deployment/yourapp -n production
        cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
        node scripts/sync-prompts-to-database.js --action=restore
        curl -f http://yourapp.com/api/health || exit 1
      fi
  when: on_failure
```

### Manual Rollback

```bash
# Step 1: Restore backup
cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
node scripts/sync-prompts-to-database.js --action=restore

# Step 2: Rollback deployment
kubectl rollout undo deployment/yourapp -n production

# Step 3: Verify
sleep 30
curl -f http://yourapp.com/api/health
curl -f http://yourapp.com/api/prompts/hot-reload/status

# Step 4: Notify
# Send notification to team
```

### Emergency Rollback

```bash
#!/bin/bash
# emergency-rollback.sh

set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# 1. Stop traffic
echo "1. Stopping traffic..."
kubectl scale deployment/yourapp --replicas=0 -n production

# 2. Restore backup
echo "2. Restoring backup..."
cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
node scripts/sync-prompts-to-database.js --action=restore

# 3. Deploy previous version
echo "3. Deploying previous version..."
kubectl rollout undo deployment/yourapp -n production
kubectl rollout status deployment/yourapp -n production

# 4. Restore traffic
echo "4. Restoring traffic..."
kubectl scale deployment/yourapp --replicas=3 -n production

# 5. Verify
echo "5. Verifying..."
sleep 30
curl -f http://yourapp.com/api/health
curl -f http://yourapp.com/api/prompts/hot-reload/status

echo "✅ Rollback completed successfully"
```

## Monitoring and Observability

### Health Checks

```yaml
# Kubernetes readiness/liveness probes
readinessProbe:
  httpGet:
    path: /api/health
    port: 3060
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /api/health
    port: 3060
  initialDelaySeconds: 60
  periodSeconds: 20
  timeoutSeconds: 5
  failureThreshold: 3
```

### Metrics Collection

```yaml
# Prometheus metrics endpoint
apiVersion: v1
kind: Service
metadata:
  name: yourapp-metrics
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"
spec:
  ports:
  - port: 9090
    targetPort: 9090
  selector:
    app: yourapp
```

### Logging

```yaml
# Fluentd/ELK configuration
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
          - name: FLUENT_ELASTICSEARCH_HOST
            value: "elasticsearch"
          - name: FLUENT_ELASTICSEARCH_PORT
            value: "9200"
```

## Testing Checklist

### Pre-Deployment Testing

```bash
# 1. Test sync script in isolation
cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
node scripts/sync-prompts-to-database.js --action=test

# 2. Test sync script with actual data
node scripts/sync-prompts-to-database.js --action=test --verbose

# 3. Test hot-reload functionality
node scripts/test-hot-reload.js

# 4. Test rollback
node scripts/sync-prompts-to-database.js --action=backup
node scripts/sync-prompts-to-database.js --action=sync
node scripts/sync-prompts-to-database.js --action=restore

# 5. Test with different configurations
PROMPT_SYNC_AUTO=false node scripts/sync-prompts-to-database.js --action=test
```

### Post-Deployment Testing

```bash
# 1. Verify database connectivity
curl -f http://yourapp.com/api/health

# 2. Verify prompt endpoints
curl -f http://yourapp.com/api/prompts

# 3. Verify hot-reload status
curl -f http://yourapp.com/api/prompts/hot-reload/status

# 4. Test prompt loading
curl -f http://yourapp.com/api/prompts/key/procurement_input_extraction

# 5. Test cache clearing
curl -X POST http://yourapp.com/api/prompts/cache/clear

# 6. Test reload
curl -X POST http://yourapp.com/api/prompts/reload \
  -H "Content-Type: application/json" \
  -d '{"promptKey": "procurement_input_extraction", "version": "active"}'
```

## Environment Variables Configuration

### Development

```bash
# .env.dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-dev-service-key

PROMPT_API_BASE_URL=http://localhost:3060
PROMPT_HOT_RELOAD=true

PROMPT_SYNC_AUTO=false
PROMPT_SYNC_BACKUP_BEFORE_SYNC=true
```

### Staging

```bash
# .env.staging
SUPABASE_URL=https://your-project-staging.supabase.co
SUPABASE_SERVICE_KEY=your-staging-service-key

PROMPT_API_BASE_URL=http://staging.yourapp.com:3060
PROMPT_HOT_RELOAD=true

PROMPT_SYNC_AUTO=true
PROMPT_SYNC_BACKUP_BEFORE_SYNC=true
```

### Production

```bash
# .env.production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-production-service-key

PROMPT_API_BASE_URL=http://yourapp.com:3060
PROMPT_HOT_RELOAD=true

PROMPT_SYNC_AUTO=true
PROMPT_SYNC_BACKUP_BEFORE_SYNC=true
PROMPT_SYNC_BACKUP_RETENTION_DAYS=7
```

## Common Issues and Solutions

### Issue 1: Sync Script Times Out

**Problem**: Sync script times out during deployment

**Solution**:
```bash
# Increase timeout
export SYNC_TIMEOUT=300000  # 5 minutes

# Run in background with nohup
nohup node scripts/sync-prompts-to-database.js --action=sync > sync.log 2>&1 &

# Or use a process manager
pm2 start scripts/sync-prompts-to-database.js -- --action=sync
```

### Issue 2: Database Connection Fails

**Problem**: CI/CD runner cannot connect to database

**Solution**:
1. Check IP whitelist in Supabase
2. Verify service key permissions
3. Use SSH tunnel if needed:
   ```bash
   ssh -L 5432:localhost:5432 user@bastion-host
   export SUPABASE_URL=localhost:5432
   ```

### Issue 3: Sync Script Overwrites New Prompts

**Problem**: New prompts added manually get overwritten

**Solution**:
```bash
# Use backup before sync
node scripts/sync-prompts-to-database.js --action=backup

# Or use restore if needed
node scripts/sync-prompts-to-database.js --action=restore
```

### Issue 4: Hot-Reload Tests Fail

**Problem**: Hot-reload tests fail in pipeline

**Solution**:
1. Ensure API server is running
2. Check environment variables
3. Verify database has prompts:
   ```bash
   node scripts/sync-prompts-to-database.js --action=test
   node scripts/test-hot-reload.js
   ```

### Issue 5: Permissions Issues

**Problem**: CI/CD runner lacks database write permissions

**Solution**:
1. Grant service role access to prompts table
2. Use custom database role with minimal permissions
3. Check RLS policies:
   ```sql
   ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
   CREATE POLICY service_role_access ON prompts FOR ALL USING (auth.uid() IS NULL);
   ```

## Security Best Practices

### 1. Secrets Management

```bash
# Use environment secrets
# GitHub Actions
SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

# GitLab CI
SUPABASE_SERVICE_KEY: $SUPABASE_SERVICE_KEY

# Jenkins
withCredentials([string(credentialsId: 'supabase-service-key', variable: 'SUPABASE_SERVICE_KEY')])

# Kubernetes Secrets
apiVersion: v1
kind: Secret
metadata:
  name: supabase-secret
type: Opaque
data:
  service-key: <base64-encoded-key>
```

### 2. Least Privilege Access

```sql
-- Create dedicated database role
CREATE ROLE prompt_sync_role WITH LOGIN PASSWORD 'strong-password';

-- Grant minimal permissions
GRANT SELECT, INSERT, UPDATE ON prompts TO prompt_sync_role;
GRANT SELECT ON prompt_versions TO prompt_sync_role;

-- Revoke unnecessary permissions
REVOKE DELETE ON prompts FROM prompt_sync_role;
REVOKE ALL ON other_tables FROM prompt_sync_role;
```

### 3. Audit Logging

```sql
-- Enable audit logging
ALTER TABLE prompts SET (log_autovacuum_min_duration = 0);

-- Create audit table
CREATE TABLE prompt_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  prompt_id UUID,
  old_value JSONB,
  new_value JSONB,
  performed_by TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO prompt_audit (operation, prompt_id, new_value, performed_by)
    VALUES ('INSERT', NEW.id, row_to_json(NEW), current_user);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO prompt_audit (operation, prompt_id, old_value, new_value, performed_by)
    VALUES ('UPDATE', OLD.id, row_to_json(OLD), row_to_json(NEW), current_user);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO prompt_audit (operation, prompt_id, old_value, performed_by)
    VALUES ('DELETE', OLD.id, row_to_json(OLD), current_user);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON prompts
FOR EACH ROW EXECUTE FUNCTION log_prompt_changes();
```

### 4. Network Security

```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-prompts-access
spec:
  podSelector:
    matchLabels:
      app: yourapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: production
    ports:
    - protocol: TCP
      port: 3060
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
    ports:
    - protocol: TCP
      port: 443  # HTTPS only
    - protocol: TCP
      port: 5432 # PostgreSQL
```

## Performance Optimization

### 1. Batch Operations

```javascript
// Modified sync script for large datasets
const BATCH_SIZE = 100;

async function syncBatch(files, options) {
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(file => syncFile(file, options))
    );
    console.log(`Processed batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(files.length/BATCH_SIZE)}`);
  }
}
```

### 2. Parallel Processing

```javascript
// Use worker threads for parallel processing
const { Worker } = require('worker_threads');

async function parallelSync(files) {
  const workerCount = require('os').cpus().length;
  const chunkSize = Math.ceil(files.length / workerCount);
  
  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    const chunk = files.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length > 0) {
      workers.push(new Promise((resolve, reject) => {
        const worker = new Worker('./sync-worker.js', {
          workerData: chunk
        });
        worker.on('message', resolve);
        worker.on('error', reject);
      }));
    }
  }
  
  await Promise.all(workers);
}
```

### 3. Caching Strategy

```javascript
// Cache metadata to avoid redundant API calls
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedMetadata(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchMetadata(key);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

## Cost Optimization

### 1. Use Spot Instances for Testing

```yaml
# GitHub Actions with spot instances
runs-on: [self-hosted, spot]
env:
  SPOT_INSTANCE: true
```

### 2. Schedule Sync During Off-Peak

```bash
# Cron job for nightly sync
0 2 * * * /usr/bin/node /path/to/sync-prompts-to-database.js --action=sync
```

### 3. Optimize Database Queries

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_prompts_key ON prompts(key);
CREATE INDEX idx_prompts_type ON prompts(type);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_created ON prompts(created_at);
```

## Disaster Recovery

### 1. Backup Strategy

```bash
#!/bin/bash
# backup-prompts.sh

BACKUP_DIR="/backups/prompts"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/prompts_backup_$DATE.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
pg_dump -h db-host -U postgres -d yourdb -t prompts > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" s3://your-backup-bucket/prompts/

# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### 2. Recovery Procedure

```bash
#!/bin/bash
# recover-prompts.sh

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

# Download backup
aws s3 cp s3://your-backup-bucket/prompts/"$BACKUP_FILE" /tmp/

# Decompress
gunzip /tmp/"$BACKUP_FILE"

# Restore database
psql -h db-host -U postgres -d yourdb -f /tmp/"${BACKUP_FILE%.gz}"

# Verify
psql -h db-host -U postgres -d yourdb -c "SELECT COUNT(*) FROM prompts;"

echo "Recovery completed"
```

### 3. Regular Testing

```bash
# Monthly disaster recovery test
#!/bin/bash
# monthly-dr-test.sh

echo "Starting monthly DR test..."

# 1. Take backup
./backup-prompts.sh

# 2. Restore to test database
./recover-prompts.sh $(ls -t /backups/prompts/*.sql.gz | head -1)

# 3. Run sync script against test DB
SUPABASE_URL=test-db-url node scripts/sync-prompts-to-database.js --action=test

# 4. Run hot-reload tests
SUPABASE_URL=test-db-url node scripts/test-hot-reload.js

# 5. Cleanup
# Drop test database

echo "DR test completed successfully"
```

## Compliance and Audit

### 1. Change Tracking

```javascript
// Enhanced sync script with audit trail
async function syncWithAudit(file, options) {
  const startTime = Date.now();
  const result = await syncFile(file, options);
  const endTime = Date.now();
  
  await logToAuditTable({
    file: file.path,
    operation: options.action,
    startTime,
    endTime,
    duration: endTime - startTime,
    status: result.success ? 'SUCCESS' : 'FAILED',
    error: result.error,
    performedBy: process.env.USER || 'system'
  });
  
  return result;
}
```

### 2. Compliance Reports

```sql
-- Monthly compliance report
SELECT 
  DATE_TRUNC('month', performed_at) as month,
  operation,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failure_count,
  AVG(duration) as avg_duration
FROM prompt_audit
WHERE performed_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', performed_at), operation
ORDER BY month DESC, operation;
```

### 3. Access Logs

```sql
-- User access to prompts
SELECT 
  performed_by,
  performed_at,
  operation,
  prompt_id
FROM prompt_audit
WHERE performed_at >= NOW() - INTERVAL '30 days'
ORDER BY performed_at DESC;
```

## Conclusion

### Key Takeaways

1. **Always backup before syncing** in production
2. **Test thoroughly** in staging before production deployment
3. **Monitor sync operations** with proper logging
4. **Have rollback procedures** ready and tested
5. **Secure credentials** using environment secrets
6. **Audit all changes** for compliance

### Next Steps

1. **Setup CI/CD pipeline** using one of the examples above
2. **Configure environment variables** for each environment
3. **Test the entire pipeline** in a non-production environment
4. **Set up monitoring and alerting** for sync operations
5. **Document your specific deployment process** for your team

### Support

For additional support:
- Check the [main procedure document](0000_PROMPT_HOT_RELOAD_PROCEDURE.md)
- Review the [synchronization procedure](0000_PROMPT_SYNCHRONIZATION_PROCEDURE.md)
- Contact your DevOps team

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-27  
**Author**: DevOps Team  
**Status**: Production Ready