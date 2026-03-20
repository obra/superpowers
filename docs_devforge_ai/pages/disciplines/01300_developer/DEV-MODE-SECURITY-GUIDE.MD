# Development Mode Security Guide

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | `0002_DEV_MODE_SECURITY_GUIDE` |
| **Version** | 1.0 |
| **Classification** | Development Security |
| **Created** | 2026-02-06 |
| **Environment** | Development (Pre-Production Testing) |
| **Related Documents** | `0000_ENTERPRISE_PORT_SECURITY_ASSESSMENT.md`, `0001_UNUSED_PORTS_HARDENING_GUIDE.md` |

---

## Overview

This guide is specifically for teams in **development mode** preparing for production testing. While development requires certain conveniences, you should **incrementally implement** security measures so you're production-ready.

### Current Phase: DEV → PROD TESTING

**Status:** Development environment with production testing upcoming  
**Goal:** Maintain dev convenience while ensuring production readiness  
**Priority:** Fix critical issues now, implement full hardening for prod

---

## 🟢 Development Mode: What's OK (For Now)

### Ports That Can Stay Open in Dev

| Port | Service | Dev Status | Prod Status | Notes |
|------|---------|------------|-------------|-------|
| **3060** | Main App | ✅ Keep | ✅ Keep | Primary development port |
| **3001** | React Dev Server | ✅ Keep | ❌ Remove | Hot reload, dev tools |
| **5432** | PostgreSQL | ⚠️ Localhost | ❌ Internal | Use `127.0.0.1:5432` not `0.0.0.0` |
| **6379** | Redis | ⚠️ Localhost | ❌ Internal | Use `127.0.0.1:6379` not `0.0.0.0` |
| **5050** | pgAdmin | ✅ Keep | ❌ Remove | Helpful for dev debugging |
| **8082** | Redis Commander | ✅ Keep | ❌ Remove | Helpful for dev debugging |
| **9000/9001** | MinIO | ⚠️ Localhost | ❌ Internal | Use `127.0.0.1` binding |
| **8000** | LangExtract | ✅ Keep | ❌ Internal | Dev service |
| **3006** | Agent Service | ✅ Keep | ⚠️ Internal | Dev testing |

### Development Conveniences (Remove Before Prod)

```javascript
// OK FOR DEV - Remove before production:
contentSecurityPolicy: false,  // Disabled for React dev tools
cors: true,                   // Open for local testing
dev_mode bypass in auth,      // For testing without login
console.log() statements,      // Debugging
localhost port mappings        // For direct access
```

---

## 🟡 Pre-Production: Security Checklist

### Critical Fixes (Do These BEFORE Production Testing)

#### 1. Fix Hardcoded Secrets (10 minutes)

**Current Issue:**
```yaml
# docker-compose.documenso.yml
environment:
  - NEXTAUTH_SECRET=f4b7a9c2d3e8f1a6b5c9d2e5f8a3b9c1d6e2f4a7b8c3d9e5a1b6c2f8d3e9a5c7
  - MINIO_ROOT_PASSWORD=documenso_password
```

**Fix for Dev:**
```yaml
environment:
  - NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-dev-secret-do-not-use-in-prod}
  - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-devpassword}
```

Create `.env.local` (already gitignored):
```bash
NEXTAUTH_SECRET=$(openssl rand -hex 32)
MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)
```

**Why:** Even in dev, hardcoded secrets get committed to git accidentally.

---

#### 2. Bind to Localhost Only (5 minutes)

**Current Issue:**
```yaml
ports:
  - "5432:5432"  # Exposed to all interfaces
```

**Fix:**
```yaml
ports:
  - "127.0.0.1:5432:5432"  # Localhost only
```

**Services to Update:**
- PostgreSQL (5432)
- Redis (6379)
- MinIO (9000, 9001)

**Verify:**
```bash
# Should show 127.0.0.1, NOT 0.0.0.0
sudo lsof -i :5432
sudo lsof -i :6379
```

---

#### 3. Add Basic CSP (15 minutes)

**Current:**
```javascript
helmet({
  contentSecurityPolicy: false,
})
```

**Dev-Safe Version:**
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Dev needs eval
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL, "http://localhost:*"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
})
```

**Test:** Open browser console - no CSP errors should appear.

---

## 🔴 Production Testing: Must-Haves

Before you switch to production mode, these MUST be fixed:

### Pre-Production Testing Checklist

- [ ] **Secrets externalized** - No hardcoded passwords
- [ ] **Localhost binding** - Database ports not on 0.0.0.0
- [ ] **CSP enabled** - Even if permissive
- [ ] **CORS restricted** - Allow only specific origins
- [ ] **Debug tools removed** - pgAdmin, Redis Commander stopped
- [ ] **Rate limiting** - On authentication endpoints
- [ ] **JWT secrets** - Strong, rotated, no fallbacks
- [ ] **Dev mode bypass** - Completely removed from auth code

---

## 📋 Environment-Specific Configurations

### Development (Current)

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    ports:
      - "3060:3060"
    environment:
      - NODE_ENV=development
      
  postgres:
    ports:
      - "127.0.0.1:5432:5432"  # Localhost only
      
  redis:
    ports:
      - "127.0.0.1:6379:6379"  # Localhost only
      
  # Debug tools OK for dev
  pgadmin:
    profiles: ["debug"]
    ports:
      - "127.0.0.1:5050:80"
```

### Production Testing (Next Phase)

```yaml
# docker-compose.prod-test.yml
version: '3.8'
services:
  app:
    ports:
      - "3060:3060"
    environment:
      - NODE_ENV=production
      
  postgres:
    # NO ports - internal network only
    networks:
      - backend
      
  redis:
    # NO ports - internal network only
    command: redis-server --requirepass ${REDIS_PASSWORD}
    
  # NO pgadmin
  # NO redis-commander
```

---

## 🔄 Transition Checklist: Dev → Prod Testing

### Week 1: Preparation (Current)

- [ ] Document all current open ports
- [ ] Create `.env.local` with generated secrets
- [ ] Change port bindings to `127.0.0.1`
- [ ] Test application still works
- [ ] Add basic CSP (permissive for dev)

### Week 2: Hardening

- [ ] Restrict CORS to specific origins
- [ ] Add rate limiting
- [ ] Enable security headers
- [ ] Remove console.log statements
- [ ] Test with production build

### Week 3: Production Testing

- [ ] Stop all debug services
- [ ] Remove debug port mappings
- [ ] Verify only 3060/8080 are exposed
- [ ] Run security scan
- [ ] Penetration test

### Week 4: Launch

- [ ] Final security audit
- [ ] Deploy to production
- [ ] Monitor for issues

---

## 🛠️ Quick Dev Commands

### Check Current Port Exposure

```bash
# See all listening ports
sudo lsof -i -P -n | grep LISTEN

# See Docker port mappings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Check if port is exposed to internet
nmap -p 5432 your-public-ip  # Should be filtered/closed
```

### Secure Dev Mode Quickly

```bash
#!/bin/bash
# secure-dev-mode.sh

echo "🔒 Securing dev environment..."

# 1. Generate secrets if not exist
if [ ! -f .env.local ]; then
  echo "Generating secrets..."
  cat > .env.local << EOF
NEXTAUTH_SECRET=$(openssl rand -hex 32)
MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
DB_PASSWORD=$(openssl rand -hex 16)
EOF
  echo "✅ Created .env.local"
fi

# 2. Update docker-compose to use localhost
echo "Updating port bindings to localhost..."
sed -i 's/- "5432:5432"/- "127.0.0.1:5432:5432"/g' docker-compose*.yml
sed -i 's/- "6379:6379"/- "127.0.0.1:6379:6379"/g' docker-compose*.yml
sed -i 's/- "9000:9000"/- "127.0.0.1:9000:9000"/g' docker-compose*.yml
sed -i 's/- "9001:9001"/- "127.0.0.1:9001:9001"/g' docker-compose*.yml

echo "✅ Dev environment secured"
echo "⚠️  Restart Docker: docker-compose down && docker-compose up"
```

---

## ⚠️ Common Dev → Prod Mistakes

| Mistake | Impact | Prevention |
|---------|--------|------------|
| Forget to remove debug ports | Data breach | Use separate compose files |
| Commit secrets to git | Credential leak | Use .env files, check git status |
| Leave dev mode bypass | Unauthorized access | Code review checklist |
| Disable CSP for dev | XSS vulnerability | Use permissive CSP, not disabled |
| Open CORS for testing | CSRF attacks | Set specific origins early |

---

## 📞 Support

If you encounter issues during the transition:

1. **Check port conflicts:** `lsof -i :3060`
2. **Verify env vars:** `docker-compose config`
3. **Test connectivity:** `curl http://localhost:3060/health`
4. **Review logs:** `docker-compose logs -f`

---

## Summary

### Current (Dev Mode)
✅ Keep convenience ports open  
✅ Use localhost binding  
⚠️ Fix hardcoded secrets  
⚠️ Add basic CSP  

### Before Production Testing
❌ Remove debug services  
❌ Close all ports except 3060/8080  
❌ Remove dev mode bypasses  
✅ Full security hardening  

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-06 | AI Security Assessment | Dev mode specific guidance |

---

**Current Status:** 🟢 **Development Mode - Pre-Production Prep**

**Target:** 🟡 **Production Testing in 2-4 weeks**
