# Unused Ports Hardening Guide

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | `0001_UNUSED_PORTS_HARDENING_GUIDE` |
| **Version** | 1.0 |
| **Classification** | Security Procedure |
| **Created** | 2026-02-06 |
| **Related Document** | `0000_ENTERPRISE_PORT_SECURITY_ASSESSMENT.md` |

---

## Overview

This guide provides specific recommendations for handling network ports and services that are not actively required for production operations. Unused ports represent an unnecessary attack surface and should be disabled or removed.

---

## 🔴 Critical: Ports to Disable Immediately

### Debug/Administration Ports (Non-Production Only)

| Port | Service | Current Status | Action |
|------|---------|----------------|--------|
| **5050** | pgAdmin | Exposed in Docker | ❌ Remove from production |
| **8082** | Redis Commander | Exposed in Docker | ❌ Remove from production |
| **9001** | MinIO Console | Exposed in Docker | ❌ Remove or restrict |
| **3001** | React Dev Server | Development only | ❌ Never in production |

### Database Ports (Internal Only)

| Port | Service | Current Status | Action |
|------|---------|----------------|--------|
| **5432** | PostgreSQL | Mapped to host | ❌ Remove port mapping |
| **6379** | Redis | Mapped to host | ❌ Remove port mapping |
| **9000** | MinIO S3 | Mapped to host | ⚠️ Evaluate necessity |

---

## ✅ Recommended Actions

### 1. Create Production-Only Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Main application only
  documenso:
    image: documenso/documenso:latest
    ports:
      - "8080:3000"  # Only expose main app
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379  # Internal only
      - MINIO_URL=minio:9000          # Internal only
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Internal services - NO PORT MAPPING
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - documenso-postgres:/var/lib/postgresql/data
    networks:
      - backend
    # NO ports section - internal only
    command: >
      postgres
      -c ssl=on
      -c ssl_cert_file=/etc/ssl/certs/server.crt
      -c ssl_key_file=/etc/ssl/private/server.key
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    # NO ports section - internal only
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - documenso-redis:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    # NO console port (9001) - use CLI only
    command: server /data
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    volumes:
      - documenso-minio:/data
    networks:
      - backend
    # NO ports section - internal only
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Debug services removed from production
  # pgadmin: REMOVED
  # redis-commander: REMOVED

volumes:
  documenso-postgres:
  documenso-redis:
  documenso-minio:

networks:
  backend:
    driver: bridge
    internal: true  # No external access
```

### 2. Create Development-Only Compose with Profiles

Update `docker-compose.documenso.yml`:

```yaml
version: '3.8'
services:
  documenso:
    # ... main service config ...
    
  postgres:
    # ... database config ...
    ports:
      - "127.0.0.1:5432:5432"  # Localhost only, not 0.0.0.0

  redis:
    # ... redis config ...
    ports:
      - "127.0.0.1:6379:6379"  # Localhost only

  minio:
    # ... minio config ...
    ports:
      - "127.0.0.1:9000:9000"  # Localhost only
      # Console port removed or profiled

  # Debug services - only with --profile debug
  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "127.0.0.1:5050:80"  # Localhost only
    environment:
      - PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL}
      - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD}
    profiles:
      - debug  # Only started with: docker-compose --profile debug up
    networks:
      - documenso-network

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - "127.0.0.1:8082:8081"  # Localhost only
    environment:
      - REDIS_HOSTS=local:redis:6379
    profiles:
      - debug
    networks:
      - documenso-network
```

### 3. Firewall Configuration

#### Linux (iptables/ufw)

```bash
#!/bin/bash
# disable_unused_ports.sh

echo "🔒 Disabling unused ports..."

# Block debug ports
sudo ufw deny 5050/tcp    # pgAdmin
sudo ufw deny 8082/tcp    # Redis Commander
sudo ufw deny 9001/tcp    # MinIO Console

# Block database ports from external access
sudo ufw deny 5432/tcp    # PostgreSQL
sudo ufw deny 6379/tcp    # Redis
sudo ufw deny 9000/tcp    # MinIO (if not needed externally)

# Allow only necessary ports
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 3060/tcp   # Main app (if needed)
sudo ufw allow 8080/tcp   # Documenso (if needed)

sudo ufw enable
sudo ufw status verbose
```

#### Cloud Security Groups (AWS/Azure/GCP)

```bash
# AWS CLI example
aws ec2 revoke-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0

aws ec2 revoke-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 6379 \
    --cidr 0.0.0.0/0
```

### 4. Port Scanning and Verification

```bash
#!/bin/bash
# scan_ports.sh

echo "🔍 Scanning for open ports..."

# Check listening ports
echo "=== Listening Ports ==="
sudo lsof -i -P -n | grep LISTEN | grep -v "127.0.0.1"

# Check Docker port mappings
echo "=== Docker Port Mappings ==="
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Nmap scan (if available)
if command -v nmap &> /dev/null; then
    echo "=== Nmap Scan (localhost) ==="
    sudo nmap -sT -O localhost | grep -E "(PORT|STATE|SERVICE)"
fi

# Check for specific vulnerable ports
echo "=== Checking for Exposed Database Ports ==="
for port in 5432 6379 3306 27017 9200; do
    if nc -zv localhost $port 2>/dev/null; then
        echo "⚠️  Port $port is OPEN"
    else
        echo "✅ Port $port is CLOSED"
    fi
done
```

### 5. Systemd Socket Protection (Linux)

Create `/etc/systemd/system/disable-unused-ports.service`:

```ini
[Unit]
Description=Disable unused network ports
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/disable_unused_ports.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

### 6. Docker Daemon Security

Configure `/etc/docker/daemon.json`:

```json
{
  "iptables": true,
  "ip-forward": false,
  "userland-proxy": false,
  "live-restore": true,
  "no-new-privileges": true,
  "selinux-enabled": true,
  "apparmor-default": "docker-default",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

---

## 📋 Port Usage Decision Matrix

| Port | Service | Production | Development | CI/CD | Action |
|------|---------|------------|-------------|-------|--------|
| 3060 | Main App | ✅ Required | ✅ Required | ✅ Required | Keep, secure |
| 8080 | Documenso | ✅ Required | ✅ Required | ❌ Not needed | Keep prod/dev only |
| 3001 | React Dev | ❌ Never | ✅ Required | ❌ Never | Dev only, localhost |
| 5432 | PostgreSQL | ❌ Internal | ✅ Localhost | ❌ Internal | Remove external mapping |
| 6379 | Redis | ❌ Internal | ✅ Localhost | ❌ Internal | Remove external mapping |
| 9000 | MinIO | ❌ Internal | ✅ Localhost | ❌ Internal | Remove external mapping |
| 5050 | pgAdmin | ❌ Never | ⚠️ Profile | ❌ Never | Debug profile only |
| 8082 | Redis Cmd | ❌ Never | ⚠️ Profile | ❌ Never | Debug profile only |
| 9001 | MinIO UI | ❌ Never | ⚠️ Profile | ❌ Never | Remove or profile |
| 3006 | Agent Svc | ✅ Internal | ✅ Internal | ✅ Internal | Internal network only |
| 8000 | LangExtract | ✅ Internal | ✅ Internal | ❌ Not needed | Internal network only |

---

## 🚀 Implementation Checklist

### Immediate (Today)
- [ ] Stop all debug services (pgAdmin, Redis Commander)
- [ ] Remove port mappings for PostgreSQL, Redis, MinIO
- [ ] Verify no ports exposed on 0.0.0.0 except 3060/8080

### Short Term (This Week)
- [ ] Create `docker-compose.prod.yml` with minimal services
- [ ] Configure firewall rules to block unused ports
- [ ] Add port scanning to CI/CD pipeline
- [ ] Document which ports are required for each environment

### Long Term (This Month)
- [ ] Implement network policies (Kubernetes/Docker)
- [ ] Set up continuous port monitoring
- [ ] Create automated alerts for unauthorized port exposure
- [ ] Conduct quarterly port audits

---

## 🔍 Verification Commands

```bash
# Check what's listening on all interfaces
sudo ss -tlnp | grep -v "127.0.0.1"

# Check Docker network exposure
docker network inspect bridge --format '{{json .Containers}}' | jq

# Verify firewall rules
sudo iptables -L -n | grep -E "(DROP|REJECT)"

# Test from external host
nmap -p 1-10000 your-server-ip
```

---

## 📞 Escalation

If you discover unexpected open ports:
1. **Immediately** block the port via firewall
2. **Investigate** which service opened it
3. **Document** the finding
4. **Report** to security team

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-06 | AI Security Assessment | Initial guide for unused port hardening |

---

**Document Status:** 🔴 **REQUIRES IMMEDIATE ACTION**

**Next Review:** 2026-03-06
