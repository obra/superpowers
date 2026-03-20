# Render Multi‑Instance Strategy with render.yaml

This document describes the simplest, repeatable way to run multiple instances (prod, staging, and optional customer-specific instances) of this app on Render using a single codebase, standardized build/start commands, and a render.yaml file for declarative setup.

## Goals

- One codebase, multiple instances
- Consistent build/start across environments
- Easy to add more instances later
- Keep secrets per instance in Render
- Support both single multi-tenant instance (subdomain-based) and separate services per customer

---

## Standard Build/Start Commands

All instances should use the same commands so the client is built and the server serves the SPA:

Build Command:
```
npm ci
npm --prefix client ci
npm --prefix client run build
```

Start Command:
```
cd server && npm start
```

Notes:
- The client webpack build outputs to `client/dist2` (as per client/config/webpack.config.cjs).
- The server (server/app.js) serves `client/dist2` statically and includes an SPA fallback so `/` and client routes work.
- The server binds to `process.env.PORT` (Render sets this automatically).

---

## render.yaml Template

Create a `render.yaml` at the repo root. Example with two web services (prod and staging). You can add customer instances similarly.

```yaml
services:
  - type: web
    name: construct-ai-prod
    env: node
    branch: main
    buildCommand: |
      npm ci
      npm --prefix client ci
      npm --prefix client run build
    startCommand: cd server && npm start
    autoDeploy: true
    plan: free
    region: oregon
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: FLOWISE_API_ENDPOINT
        sync: false
      - key: FLOWISE_API_KEY
        sync: false
      - key: FLOW_ID
        sync: false
      - key: POSTGRES_HOST
        sync: false

  - type: web
    name: construct-ai-staging
    env: node
    branch: develop
    buildCommand: |
      npm ci
      npm --prefix client ci
      npm --prefix client run build
    startCommand: cd server && npm start
    autoDeploy: true
    plan: free
    region: oregon
    envVars:
      - key: NODE_ENV
        value: staging
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: FLOWISE_API_ENDPOINT
        sync: false
      - key: FLOWISE_API_KEY
        sync: false
      - key: FLOW_ID
        sync: false
      - key: POSTGRES_HOST
        sync: false
```

How to use:
1) Commit this file to the branch Render uses to create services (or create them manually then link to this YAML).
2) For each service listed, Render will create or update a Web Service when you click "New +" → "Blueprint" in the Render dashboard and point to your repo branch with this render.yaml.
3) After creation, go to each service’s Environment tab and set the `sync: false` variables securely.

Adding more instances (e.g., per customer):
- Copy one of the service blocks and change:
  - `name` (e.g., `construct-ai-customer1`)
  - `branch` (optional; can stay on main)
  - Set customer-specific env vars:
    - Either use default `SUPABASE_URL` and `SUPABASE_ANON_KEY`
    - Or add namespaced variants (e.g., `SUPABASE_URL_CUSTOMER1`) and update server behavior accordingly if you want strict isolation.
- Optionally attach a custom domain per instance (Render dashboard → "Custom Domains").

---

## Multi‑Tenant vs Per‑Customer Services

You have two patterns:

A) Single Multi‑Tenant Instance (subdomain-based)
- Run one production service.
- Use wildcard subdomain `*.construct-ai.yourdomain.com` mapped to the service.
- Your existing `getCustomerId()` and `getCustomerConfig()` can select per-customer config based on subdomain.
- Pros: Fewer services, easier ops.
- Cons: Shared resources; careful testing for tenant isolation; heavier single service.

B) Separate Services Per Customer
- Create one Render service per customer via additional blocks in `render.yaml`.
- Each gets its own env vars, optional custom domain.
- Pros: Isolation, separate scaling, less blast radius.
- Cons: More services to manage.

Recommended:
- Start with separate services per environment (prod/staging) using the YAML above.
- Add per-customer services only where isolation is required.

---

## Environment Variables Checklist

Set per instance in Render:
- SUPABASE_URL, SUPABASE_ANON_KEY
- FLOWISE_API_ENDPOINT, FLOWISE_API_KEY, FLOW_ID
- POSTGRES_HOST
- Optional customer-specific keys (if using namespaced config)
- You typically do NOT need to set `PORT` on Render (it injects this automatically).

Server-side sanity logs (already present in server/src/index.js) display whether critical envs are SET/MISSING on startup.

---

## Deploy Flow

1) Push changes to the branch(s) your services track (main for prod, develop for staging).
2) Render auto-deploys (autoDeploy: true) or click Manual Deploy.
3) Verify:
   - `/` serves the SPA.
   - `/index.html` returns 200.
   - `/health` returns `{"status":"healthy"}`.
   - A known API under `/api/...` responds.

---

## Troubleshooting

- "Cannot GET /" or "Cannot GET /index.html"
  - Confirm the Build Command ran the client build and webpack produced files under `client/dist2`.
  - Confirm `express.static` is mounted after `const app = express();` and SPA fallback is present.
- API 404 when navigating the SPA:
  - Ensure SPA fallback is after API routes (so it doesn’t shadow `/api`).

## Deployment Control and Access Management

### Environment Segregation Strategy

#### Client-Specific Instances
- [ ] **Instance Isolation**
  - Create separate Render services for each client
  - Use client-specific environment variables
  - Implement client data isolation in Supabase

- [ ] **Access Control**
  - Grant access only to authorized team members per client
  - Use Render's team and organization features for access control
  - Implement client-specific deployment keys

#### Deployment Gates and Approvals

```yaml
# Enhanced render.yaml with deployment controls
services:
  - type: web
    name: construct-ai-prod
    env: node
    branch: main
    buildCommand: |
      npm ci
      npm --prefix client ci
      npm --prefix client run build
    startCommand: cd server && npm start
    autoDeploy: false  # Manual approval required for production
    plan: starter
    region: oregon
    envVars:
      - key: NODE_ENV
        value: production
      - key: GITHUB_DEPLOYMENT_WEBHOOK_SECRET
        sync: false
      - key: DEPLOYMENT_APPROVAL_REQUIRED
        value: "true"

  - type: web
    name: client-acme-prod
    env: node
    branch: client/acme
    buildCommand: |
      npm ci
      npm --prefix client ci
      npm --prefix client run build
    startCommand: cd server && npm start
    autoDeploy: false  # Client admin approval
    plan: starter
    region: oregon
    envVars:
      - key: CLIENT_ID
        value: acme
      - key: NODE_ENV
        value: production
      - key: SUPABASE_CLIENT_SCHEMA
        value: acme_prod
```

### GitHub Integration for Controlled Deployments

#### Webhook-Based Deployments
- [ ] **GitHub Webhook Configuration**
  - Set up webhooks on protected branches
  - Require GitHub Actions approval before deployment
  - Validate deployment payload integrity

- [ ] **Deployment Automation with Safeguards**

```yaml
# GitHub Actions workflow for controlled deployments
name: Controlled Render Deployment

on:
  push:
    branches: [main, 'client/*']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'

jobs:
  validate-and-deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Validate Branch Protection
        run: |
          # Check if branch is protected and has required reviews
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            if [[ "${{ github.event.pull_request.merged }}" != "true" ]]; then
              echo "Production deployments must come from approved PRs"
              exit 1
            fi
          fi

      - name: Security Scan
        uses: github/super-linter@v5

      - name: Build Application
        run: |
          npm ci
          npm --prefix client ci
          npm --prefix client run build

      - name: Deploy to Render
        if: success()
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -H "Content-Type: application/json" \
            https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys \
            --data '{"branch": "${{ github.ref_name }}"}'
```

#### Environment-Specific Configurations

##### Production Environment Controls
- Manual deployment only
- Require security scan approval
- Two-person approval rule
- Rollback capability maintained

##### Client Environment Controls
- Client admin approval required
- Client-specific data validation
- Client notification on deployment
- Separate monitoring and alerts

#### Rollback Strategy

```bash
# Rollback script for emergency recovery
#!/bin/bash
SERVICE_ID=$1
ROLLBACK_COMMIT=$2

curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  https://api.render.com/v1/services/$SERVICE_ID/deploys \
  --data "{\"commit\": \"$ROLLBACK_COMMIT\", \"rollback\": true}"
```

### Supabase Integration Security

#### Tenant Isolation
- [ ] **Client-Specific Database Access**
  - Use Supabase RLS policies for client data isolation
  - Implement client schema separation
  - Restrict API access by client context

- [ ] **Migration Safety**
  - Test migrations on staging before production
  - Implement migration rollback procedures
  - Maintain database backup integrity

```sql
-- Client-specific RLS policy example
CREATE POLICY "client_data_isolation"
ON client_documents FOR ALL
USING (
  client_id = current_setting('app.client_id')::uuid
);
```

#### Audit Logging Integration

```javascript
// Deployment audit logging
async function logDeployment(deploymentData) {
  await supabase
    .from('deployment_audits')
    .insert([{
      service_id: deploymentData.serviceId,
      client_id: deploymentData.clientId,
      branch: deploymentData.branch,
      commit_sha: deploymentData.commitSha,
      initiator: deploymentData.userId,
      status: 'initiated',
      timestamp: new Date().toISOString()
    }]);
}
```

---

## Enhanced Instance Management

### Client Onboarding Process

1. **Repository Setup**
   - Create client-specific branch (`client/{client-name}`)
   - Set up CODEOWNERS for client approval requirements
   - Configure branch protection rules

2. **Render Service Creation**
   - Duplicate `render.yaml` template
   - Set client-specific environment variables
   - Grant access to client team members

3. **Database Setup**
   - Create client schema in Supabase
   - Set up RLS policies for data isolation
   - Configure client-specific API endpoints

4. **Security Configuration**
   - Set up client-specific secrets
   - Configure monitoring and alerting
   - Establish backup procedures

### Monitoring and Alerting

#### Service Health Monitoring
```yaml
notifications:
  - type: email
    emails:
      - devops@construct-ai-primary.com
      - client-admin@client.com
    when:
      - deploy_failed
      - service_crashed
```

#### Deployment Tracking
- Log all deployment attempts
- Track deployment duration and success rates
- Alert on deployment failures or anomalies
- Maintain deployment history for auditing

---

## FAQ

Q: Do I need Docker?
- No. You can ignore the Python Dockerfile in this repo. Render’s Node environment with the above Build/Start commands is sufficient.

Q: How do I add a new customer instance quickly?
- Duplicate a service block in `render.yaml`, change its `name`, set env vars, and create via Render Blueprint. Optionally assign a custom domain.

Q: Can each instance use a different branch?
- Yes; set the `branch` field per service (e.g., `main` for prod, `develop` for staging, customer-specific branches if needed).

Q: How do I ensure deployment safety for client instances?
- Use branch protection rules specific to client branches, require client admin approval, and implement client data isolation in Supabase.

Q: What happens if a deployment fails?
- Render maintains the previous working deployment. Use the rollback API or manual redeploy to recover.

---

## Integration with Security Controls

This strategy integrates with:
- [GitHub Security Assessment](../0000_GITHUB_SECURITY_ASSESSMENT_REPORT.md) - Branch protection and CODEOWNERS
- [Supabase Integration](../0500_SUPABASE.md) - Client data isolation and RLS policies
- [Contributor Access Guide](../0000_CONTRIBUTOR_SETUP_COMPLETE.md) - Team-based access control

## Summary

- Use `render.yaml` to define prod/staging (+optional customer services).
- Standardize Build/Start commands to guarantee the client is built and served.
- Keep secrets in Render’s environment for each service.
- Choose multi-tenant or per-customer deployment based on isolation needs.
