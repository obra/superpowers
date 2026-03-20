# 🚀 Multi-Customer Render Deployment Architecture Guide

## Overview

This guide documents the **multi-customer SaaS deployment architecture** for Construct AI on Render.com. Each customer receives the same codebase but runs **two separate web services** for complete isolation and scalability.

---

## 📐 Architecture Overview

### **Deployment Model**

```
┌─────────────────────────────────────────────────────────────┐
│                     Per Customer Deployment                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1 GitHub Repository (customer-specific fork/branch)         │
│           ↓                                                   │
│  ┌───────────────────────────┐  ┌────────────────────────┐  │
│  │  Service 1: Main App      │  │  Service 2: LangExtract│  │
│  │  (Node.js/React)          │  │  (Python/FastAPI)      │  │
│  │                           │  │                        │  │
│  │  Port: 3060              │  │  Port: 8000           │  │
│  │  Root: /                  │  │  Root: /deep-agents/  │  │
│  │  Runtime: Node 18+        │  │  Runtime: Python 3.11+ │  │
│  └───────────────────────────┘  └────────────────────────┘  │
│           ↓                                ↓                 │
│  https://customer-app.         https://customer-lang       │
│         onrender.com                  extract.onrender.com  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **Key Architecture Principles**

1. **One Repository Per Customer**: Each customer gets their own GitHub repo (fork or branch)
2. **Two Services Per Customer**:
   - **Main Application**: Node.js backend + React frontend
   - **LangExtract API**: Python microservice for document extraction
3. **Service Isolation**: Each service runs independently with its own resources
4. **Shared Codebase**: All customers use the same base codebase (different branches/forks)
5. **Independent Scaling**: Each service can scale independently based on load

---

## 🏗️ Deployment Architecture

### **Service 1: Main Application (Node.js/React)**

| Component          | Value                          |
| ------------------ | ------------------------------ |
| **Type**           | Web Service                    |
| **Runtime**        | Node 18+                       |
| **Root Directory** | `/` (repository root)          |
| **Build Command**  | `npm install && npm run build` |
| **Start Command**  | `npm start`                    |
| **Port**           | 3060                           |
| **Health Check**   | `/health`                      |

**Responsibilities:**

- React frontend UI
- Node.js/Express backend API
- Database operations (Supabase)
- Business logic
- User authentication
- File uploads

### **Service 2: LangExtract API (Python/FastAPI)**

| Component          | Value                             |
| ------------------ | --------------------------------- |
| **Type**           | Web Service                       |
| **Runtime**        | Python 3.11+                      |
| **Root Directory** | `/deep-agents`                    |
| **Build Command**  | `pip install -r requirements.txt` |
| **Start Command**  | `python3 langextract_server.py`   |
| **Port**           | 8000                              |
| **Health Check**   | `/health`                         |

**Responsibilities:**

- Document text extraction
- Entity recognition (names, dates, organizations)
- Contract term extraction
- Risk indicator analysis
- Structured data extraction from unstructured documents

---

## 📋 Pre-Deployment Checklist

### **Repository Setup**

- [ ] GitHub repository created for customer
- [ ] Repository forked/branched from main codebase
- [ ] Customer-specific configuration added
- [ ] Environment variables prepared
- [ ] Database (Supabase) provisioned for customer
- [ ] API keys obtained (Gemini, OpenAI, etc.)

### **Render Account Setup**

- [ ] Render.com account created
- [ ] Payment method configured (if using paid plans)
- [ ] Team access configured (if needed)
- [ ] GitHub integration connected

---

## 🚀 Step-by-Step Deployment

## Step 1: Deploy Main Application Service

### 1.1 Create Web Service on Render

1. Log in to **Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** → Select **"Web Service"**
3. Connect your GitHub repository

### 1.2 Configure Main App Service

**Basic Settings:**

- **Name**: `customer-name-app` (e.g., `acme-corp-app`)
- **Region**: Choose closest to customer location
- **Branch**: `main` (or customer-specific branch)
- **Root Directory**: _Leave blank_ (uses repository root)
- **Runtime**: **Node**
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

**Instance Settings:**

- **Plan**:
  - **Free**: Development/testing (sleeps after 15 min inactivity)
  - **Starter ($7/month)**: Small production (512 MB RAM, always on)
  - **Standard ($25/month)**: Production (2 GB RAM, better performance)

**Advanced Settings:**

- **Health Check Path**: `/health`
- **Auto-Deploy**: Yes (enable automatic deployments on git push)

### 1.3 Configure Main App Environment Variables

Add these environment variables in Render dashboard:

#### **Database (Supabase)**

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

#### **Authentication**

```bash
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-here
```

#### **Application Configuration**

```bash
NODE_ENV=production
PORT=3060
API_BASE_URL=https://customer-name-app.onrender.com
FRONTEND_URL=https://customer-name-app.onrender.com
```

#### **LangExtract Integration** (Set after deploying Service 2)

```bash
LANGEXTRACT_API_URL=https://customer-name-langextract.onrender.com
```

#### **OpenAI API** (Optional - for main app AI features)

```bash
OPENAI_API_KEY=your-openai-api-key
```

#### **Email/Notifications** (Optional)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password
```

### 1.4 Deploy Main App

1. Click **"Create Web Service"**
2. Wait for build to complete (~3-5 minutes)
3. Once deployed, note your service URL: `https://customer-name-app.onrender.com`
4. Test the deployment: Visit the health endpoint

```bash
curl https://customer-name-app.onrender.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "ConstructAI",
  "environment": "production",
  "timestamp": "2026-09-01T12:30:00Z"
}
```

---

## Step 2: Deploy LangExtract API Service

### 2.1 Create LangExtract Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect the **same GitHub repository** as Service 1
3. Configure LangExtract service

### 2.2 Configure LangExtract Service

⚠️ **CRITICAL FIX**: If you get error `can't open file '/opt/render/project/src/deep-agents/langextract_server.py'`:
- **Leave Root Directory BLANK**
- Use `cd deep-agents &&` in both commands below

**Basic Settings:**

- **Name**: `customer-name-langextract` (e.g., `acme-corp-langextract`)
- **Region**: **Same as main app** (reduces latency)
- **Branch**: `main` (or customer-specific branch)
- **Root Directory**: **Leave BLANK** (or try `deep-agents` if blank doesn't work)
- **Runtime**: **Python 3**
- **Build Command**:
  ```bash
  cd deep-agents && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  cd deep-agents && python3 langextract_server.py
  ```

**Instance Settings:**

- **Plan**:
  - **Free**: Development/testing (sleeps after 15 min inactivity)
  - **Starter ($7/month)**: Production (always on, recommended)
  - **Standard ($25/month)**: High-volume document processing

**Advanced Settings:**

- **Health Check Path**: `/health`
- **Auto-Deploy**: Yes

### 2.3 Configure LangExtract Environment Variables

Add these environment variables:

#### **Required: Gemini API Key**

```bash
LANGEXTRACT_API_KEY=your-gemini-api-key-here
```

**Get your key from**: https://aistudio.google.com/apikey

#### **Optional: OpenAI API Key**

```bash
OPENAI_API_KEY=your-openai-api-key
```

(Only needed if using OpenAI instead of Gemini)

#### **CORS Configuration** (Optional - auto-configured)

```bash
ALLOWED_ORIGINS=https://customer-name-app.onrender.com,http://localhost:3060
```

### 2.4 Deploy LangExtract Service

1. Click **"Create Web Service"**
2. Wait for build to complete (~2-3 minutes)
3. Once deployed, note your service URL: `https://customer-name-langextract.onrender.com`
4. Test the deployment:

```bash
# Health check
curl https://customer-name-langextract.onrender.com/health

# Test extraction
curl -X POST https://customer-name-langextract.onrender.com/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Contract ABC123 dated 15 January 2025 for ZAR 1,000,000. Contact: john@example.com",
    "document_type": "correspondence",
    "task_id": "test-123"
  }'
```

Expected health check response:

```json
{
  "status": "healthy",
  "langextract_installed": true,
  "service": "LangExtract API",
  "version": "1.0.0"
}
```

---

## Step 3: Connect Services

### 3.1 Update Main App with LangExtract URL

1. Go to **Main App** service in Render dashboard
2. Navigate to **"Environment"** tab
3. Add/update environment variable:
   ```bash
   LANGEXTRACT_API_URL=https://customer-name-langextract.onrender.com
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy the main app

### 3.2 Verify Integration

1. Wait for main app to redeploy (~2-3 minutes)
2. Log into your application frontend
3. Navigate to **HITL Review** page (`/01300-hitl-review`)
4. Open a task with a document
5. Check the **"LangExtract Structured Data"** section
6. Should display extracted entities, dates, organizations, etc.

---

## 🔧 Environment Variables Reference

### **Complete Environment Variables List**

#### **Main Application Service**

<details>
<summary><strong>Click to expand Main App environment variables</strong></summary>

```bash
# Database & Supabase
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-key

# Application
NODE_ENV=production
PORT=3060
API_BASE_URL=https://customer-name-app.onrender.com
FRONTEND_URL=https://customer-name-app.onrender.com

# LangExtract Integration
LANGEXTRACT_API_URL=https://customer-name-langextract.onrender.com

# AI Services (Optional)
OPENAI_API_KEY=sk-...

# Email/SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASSWORD=your-app-specific-password

# Storage (Optional - if using external storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Monitoring (Optional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=info

# Feature Flags (Optional)
ENABLE_LANGEXTRACT=true
ENABLE_ANALYTICS=true
ENABLE_DEBUG_MODE=false
```

</details>

#### **LangExtract API Service**

<details>
<summary><strong>Click to expand LangExtract API environment variables</strong></summary>

```bash
# Required: Gemini API Key
LANGEXTRACT_API_KEY=your-gemini-api-key-from-google-ai-studio

# Optional: OpenAI API Key (if supporting OpenAI)
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: CORS Configuration (auto-configured by server)
ALLOWED_ORIGINS=https://customer-name-app.onrender.com,http://localhost:3060

# Optional: Server Configuration
PORT=8000
LOG_LEVEL=info
```

</details>

---

## 🔄 Deployment Workflow for Multiple Customers

### **Workflow Overview**

```mermaid
graph TD
    A[Base Repository] --> B[Customer 1 Fork/Branch]
    A --> C[Customer 2 Fork/Branch]
    A --> D[Customer N Fork/Branch]

    B --> B1[Service 1: Main App]
    B --> B2[Service 2: LangExtract]

    C --> C1[Service 1: Main App]
    C --> C2[Service 2: LangExtract]

    D --> D1[Service 1: Main App]
    D --> D2[Service 2: LangExtract]

    B1 --> DB1[(Customer 1 Database)]
    C1 --> DB2[(Customer 2 Database)]
    D1 --> DB3[(Customer N Database)]
```

### **Steps for Each New Customer**

1. **Repository Setup**

   - Fork main repository or create customer branch
   - Configure customer-specific settings
   - Update customer branding (if applicable)

2. **Database Provisioning**

   - Create new Supabase project for customer
   - Run database migrations
   - Configure Row Level Security (RLS)

3. **Service Deployment**

   - Deploy Main App (Service 1)
   - Deploy LangExtract API (Service 2)
   - Configure environment variables

4. **Integration & Testing**

   - Connect services via environment variables
   - Test all functionality
   - Verify HITL workflows with LangExtract

5. **Go Live**
   - Configure custom domain (optional)
   - Enable monitoring/alerts
   - Provide customer with credentials

---

## 📊 Cost Estimation per Customer

### **Render Service Costs**

| Plan            | Service 1 (Main App) | Service 2 (LangExtract) | Total/Month |
| --------------- | -------------------- | ----------------------- | ----------- |
| **Free**        | $0                   | $0                      | **$0**      |
| **Development** | $7 (Starter)         | Free                    | **$7**      |
| **Production**  | $7 (Starter)         | $7 (Starter)            | **$14**     |
| **High-Volume** | $25 (Standard)       | $7 (Starter)            | **$32**     |
| **Enterprise**  | $25 (Standard)       | $25 (Standard)          | **$50**     |

### **External Service Costs**

| Service        | Tier          | Cost/Month | Notes                            |
| -------------- | ------------- | ---------- | -------------------------------- |
| **Supabase**   | Free          | $0         | Up to 500MB database             |
| **Supabase**   | Pro           | $25        | 8GB database, better performance |
| **Gemini API** | Free          | $0         | 60 requests/min, unlimited       |
| **Gemini API** | Paid          | ~$5-50     | Pay-per-use, $0.00035/1K chars   |
| **OpenAI API** | Pay-as-you-go | ~$10-100   | $0.01/1K tokens input            |

### **Recommended Configuration by Customer Size**

| Customer Size               | Render Plan    | Total Est. Cost |
| --------------------------- | -------------- | --------------- |
| **Small (< 10 users)**      | Free tier      | $0-25/month     |
| **Medium (10-50 users)**    | Starter tier   | $40-60/month    |
| **Large (50-200 users)**    | Standard tier  | $80-150/month   |
| **Enterprise (200+ users)** | Standard+ tier | $150-300/month  |

---

## 🔒 Security Considerations

### **Service Isolation**

- ✅ Each customer has separate Supabase database
- ✅ Each customer has separate Render services
- ✅ Row Level Security (RLS) enforced at database level
- ✅ API authentication required for all endpoints
- ✅ CORS configured to only allow customer domains

### **API Key Management**

- ✅ API keys stored securely in Render environment variables
- ✅ Never commit API keys to Git repository
- ✅ Rotate API keys regularly (quarterly recommended)
- ✅ Use different API keys per customer (if possible)

### **Data Privacy**

- ✅ Each customer's data isolated in separate database
- ✅ No data sharing between customers
- ✅ HTTPS enforced on all connections
- ✅ Database encryption at rest (Supabase default)

---

## 🔍 Monitoring & Health Checks

### **Service Health Monitoring**

Both services expose health check endpoints:

**Main App Health Check:**

```bash
curl https://customer-name-app.onrender.com/health
```

**LangExtract Health Check:**

```bash
curl https://customer-name-langextract.onrender.com/health
```

### **Setting Up Monitoring**

1. **Render Built-in Monitoring**

   - Automatic uptime monitoring
   - View logs in Render dashboard
   - Receive email alerts on service failures

2. **External Monitoring (Recommended)**

   - **UptimeRobot**: Free uptime monitoring (https://uptimerobot.com)
   - **Pingdom**: Advanced monitoring and analytics
   - **Datadog**: Comprehensive APM solution

3. **Configure UptimeRobot (Free)**
   - Sign up at https://uptimerobot.com
   - Add monitor for Main App: `https://customer-name-app.onrender.com/health`
   - Add monitor for LangExtract: `https://customer-name-langextract.onrender.com/health`
   - Set check interval: Every 5 minutes
   - Configure alert contacts (email, Slack, SMS)

### **Handling Free Tier Sleep**

If using Free tier (sleeps after 15 min inactivity):

**Option 1: Ping Service (Keep Awake)**

- Use UptimeRobot to ping every 14 minutes
- Keeps service awake during business hours
- Configure monitoring intervals strategically

**Option 2: Upgrade to Paid Plan**

- Starter plan ($7/month) never sleeps
- Recommended for production use
- Better performance and reliability

---

## 🛠️ Troubleshooting

### **Common Issues**

<details>
<summary><strong>Issue: Main app shows "Failed to fetch" from LangExtract</strong></summary>

**Symptoms:**

- HITL modal shows "LangExtract service is currently unavailable"
- Browser console shows CORS errors or network failures

**Solutions:**

1. Verify `LANGEXTRACT_API_URL` is set in Main App environment variables
2. Check LangExtract service is running (visit health endpoint)
3. Verify CORS is configured correctly in `langextract_server.py`
4. If using Free tier, service may be sleeping (first request takes 30-60 seconds)
5. Check Render logs for both services

</details>

<details>
<summary><strong>Issue: LangExtract returns "LANGEXTRACT_API_KEY not found"</strong></summary>

**Symptoms:**

- LangExtract API returns 500 error
- Logs show: "Gemini API Key: ❌ Not loaded"

**Solutions:**

1. Go to LangExtract service in Render dashboard
2. Add environment variable: `LANGEXTRACT_API_KEY=your-gemini-key`
3. Get Gemini key from: https://aistudio.google.com/apikey
4. Save changes and redeploy
5. Verify with health check endpoint

</details>

<details>
<summary><strong>Issue: Service won't start / Build fails</strong></summary>

**Symptoms:**

- Render shows "Build failed" or "Deploy failed"
- Service status is "Failed"

**Solutions:**

**For Main App:**

1. Check `package.json` has correct start script
2. Verify Node version in `.nvmrc` file
3. Check build logs for dependency errors
4. Ensure all required environment variables are set

**For LangExtract:**

1. Verify Root Directory is set to `deep-agents`
2. Check `requirements.txt` exists in `deep-agents/` folder
3. Verify Python version (needs 3.11+)
4. Check build logs for dependency installation errors

</details>

<details>
<summary><strong>Issue: Database connection fails</strong></summary>

**Symptoms:**

- Main app shows "Database connection error"
- Health check fails

**Solutions:**

1. Verify `DATABASE_URL` and Supabase variables are correct
2. Check Supabase project is active
3. Verify database has been migrated (run migrations)
4. Check Supabase connection limits (free tier has limits)
5. Test database connection manually

</details>

<details>
<summary><strong>Issue: Cold start takes too long (Free tier)</strong></summary>

**Symptoms:**

- First request after inactivity takes 30-60 seconds
- Users experience timeouts

**Solutions:**

1. **Upgrade to Paid Plan** ($7/month Starter - recommended)
2. **Use Ping Service**: Configure UptimeRobot to ping every 14 minutes
3. **Accept cold starts**: Inform users that first request may be slow
4. **Implement retry logic**: Add automatic retries in frontend

</details>

---

## 📚 Additional Resources

### **Render Documentation**

- Render Docs: https://render.com/docs
- Web Services Guide: https://render.com/docs/web-services
- Environment Variables: https://render.com/docs/environment-variables
- Deploy Hooks: https://render.com/docs/deploy-hooks

### **LangExtract Documentation**

- **Detailed LangExtract Setup**: `deep-agents/RENDER_DEPLOYMENT_GUIDE.md`
- **LangExtract Server README**: `deep-agents/LANGEXTRACT_README.md`
- **Integration Procedures**: `docs/procedures/00435_LANGEXTRACT_INTEGRATION_PROCEDURE.md`
- **Workflow User Guide**: `docs/workflows/00435_WORKFLOW_CORRESPONDENCE_AGENT_ORCHESTRATION/00435_CORRESPONDENCE_WORKFLOW_USER_GUIDE.md`

### **API Documentation**

- Gemini API: https://ai.google.dev/docs
- Get Gemini API Key: https://aistudio.google.com/apikey
- OpenAI API: https://platform.openai.com/docs
- Supabase: https://supabase.com/docs

---

## 🎯 Quick Reference

### **Service URLs Template**

```
Main Application:     https://[customer-name]-app.onrender.com
LangExtract API:      https://[customer-name]-langextract.onrender.com
Health Check (Main):  https://[customer-name]-app.onrender.com/health
Health Check (Lang):  https://[customer-name]-langextract.onrender.com/health
```

### **Essential Commands**

```bash
# Test Main App Health
curl https://customer-name-app.onrender.com/health

# Test LangExtract Health
curl https://customer-name-langextract.onrender.com/health

# Test LangExtract Extraction
curl -X POST https://customer-name-langextract.onrender.com/extract \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test document", "document_type": "correspondence"}'

# View Render Logs
# Go to: https://dashboard.render.com → Select Service → Logs tab

# Manual Redeploy
# Go to: https://dashboard.render.com → Select Service → Manual Deploy
```

### **Critical Environment Variables**

| Service     | Variable              | Required | Example                                     |
| ----------- | --------------------- | -------- | ------------------------------------------- |
| Main App    | `SUPABASE_URL`        | ✅ Yes   | `https://xxxxx.supabase.co`                 |
| Main App    | `SUPABASE_ANON_KEY`   | ✅ Yes   | `eyJhbGciOiJIUzI1...`                       |
| Main App    | `LANGEXTRACT_API_URL` | ✅ Yes   | `https://customer-langextract.onrender.com` |
| LangExtract | `LANGEXTRACT_API_KEY` | ✅ Yes   | Your Gemini API key                         |

---

## ✅ Deployment Checklist

### **Pre-Deployment**

- [ ] GitHub repository created/forked
- [ ] Supabase database provisioned
- [ ] Gemini API key obtained
- [ ] Customer-specific configuration prepared
- [ ] Environment variables documented

### **Service 1: Main App Deployment**

- [ ] Web service created on Render
- [ ] Root directory set to `/` (blank)
- [ ] Build command configured
- [ ] Start command configured
- [ ] All environment variables added
- [ ] Service deployed successfully
- [ ] Health check passes

### **Service 2: LangExtract Deployment**

- [ ] Web service created on Render
- [ ] Root directory set to `deep-agents`
- [ ] Build command configured
- [ ] Start command configured
- [ ] `LANGEXTRACT_API_KEY` added
- [ ] Service deployed successfully
- [ ] Health check passes

### **Integration**

- [ ] `LANGEXTRACT_API_URL` added to Main App
- [ ] Main App redeployed
- [ ] Both services communicating
- [ ] HITL modal shows LangExtract data
- [ ] End-to-end testing completed

### **Post-Deployment**

- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/alerts set up
- [ ] Documentation provided to customer
- [ ] Support contacts established
- [ ] Backup procedures documented

---

## 🎉 Deployment Complete!

Your multi-customer Construct AI deployment is now live on Render with:

- ✅ **2 services per customer** (Main App + LangExtract API)
- ✅ **Isolated databases** for each customer
- ✅ **Scalable architecture** ready for growth
- ✅ **Intelligent document extraction** via LangExtract
- ✅ **Production monitoring** and health checks

**Next Steps:**

1. Test all functionality thoroughly
2. Configure custom domains (optional)
3. Set up monitoring alerts
4. Document customer-specific settings
5. Train customer team on the system

For detailed LangExtract configuration, see: `deep-agents/RENDER_DEPLOYMENT_GUIDE.md`

---

**Last Updated**: 2026-09-01
**Version**: 1.0.0
**Maintained By**: Construct AI DevOps Team
