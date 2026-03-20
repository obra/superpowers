#!/bin/bash
# 01900 Procurement Phase 5: Deployment Scripts
# Version: 1.2
# Date: 2026-03-17
# Status: Phase 5 - Deployment & Monitoring

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/01900_PHASE5_DEPLOYMENT_CONFIG.yaml"
LOG_FILE="$SCRIPT_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Load configuration
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error "Configuration file not found: $CONFIG_FILE"
    fi
    
    # Parse YAML configuration
    eval "$(python3 -c "
import yaml
import sys

with open('$CONFIG_FILE', 'r') as f:
    config = yaml.safe_load(f)

def flatten_dict(d, parent_key='', sep='_'):
    items = []
    for k, v in d.items():
        new_key = f'{parent_key}{sep}{k}' if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

flat_config = flatten_dict(config)
for key, value in flat_config.items():
    if isinstance(value, str):
        print(f'{key}=\"{value}\"')
    else:
        print(f'{key}={value}')
")"
    
    log "Configuration loaded successfully"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
    
    # Check required tools
    local required_tools=("docker" "docker-compose" "kubectl" "helm" "aws" "psql" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "Required tool not found: $tool"
        fi
    done
    
    # Check environment variables
    local required_vars=("SUPABASE_URL" "SUPABASE_KEY" "DATABASE_URL" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable not set: $var"
        fi
    done
    
    # Check disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 10485760 ]]; then  # 10GB in KB
        error "Insufficient disk space. At least 10GB required."
    fi
    
    # Check memory
    local available_memory=$(free -m | awk 'NR==2 {print $7}')
    if [[ $available_memory -lt 4096 ]]; then  # 4GB
        error "Insufficient memory. At least 4GB required."
    fi
    
    success "Pre-deployment checks passed"
}

# Database migration
database_migration() {
    log "Starting database migration..."
    
    # Create backup
    log "Creating database backup..."
    local backup_file="procurement_backup_$(date +%Y%m%d_%H%M%S).sql"
    PGPASSWORD="$DATABASE_PASSWORD" pg_dump -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" > "$backup_file"
    
    if [[ $? -ne 0 ]]; then
        error "Database backup failed"
    fi
    
    success "Database backup created: $backup_file"
    
    # Run migration scripts
    log "Running migration scripts..."
    
    # Add VFS tables
    PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" << EOF
-- Add VFS tables
CREATE TABLE IF NOT EXISTS procurement_vfs_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) REFERENCES procurement_orders(id),
    file_path TEXT NOT NULL,
    file_type VARCHAR(10),
    content_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procurement_vfs_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50),
    agent_id VARCHAR(100),
    file_path TEXT,
    operation VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Add jurisdiction column
ALTER TABLE procurement_orders 
ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(10) DEFAULT 'ZA';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vfs_files_order_id ON procurement_vfs_files(order_id);
CREATE INDEX IF NOT EXISTS idx_vfs_files_path ON procurement_vfs_files(file_path);
CREATE INDEX IF NOT EXISTS idx_vfs_access_log_order ON procurement_vfs_access_log(order_id);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_jurisdiction ON procurement_orders(jurisdiction);

-- Update existing records
UPDATE procurement_orders 
SET jurisdiction = 'ZA' 
WHERE jurisdiction IS NULL;
EOF
    
    if [[ $? -ne 0 ]]; then
        error "Database migration failed"
    fi
    
    success "Database migration completed"
}

# Application deployment
application_deployment() {
    log "Starting application deployment..."
    
    # Build application
    log "Building application..."
    cd "$PROJECT_ROOT"
    
    # Build backend
    log "Building backend..."
    docker build -t procurement-backend:latest -f Dockerfile.backend .
    
    # Build frontend
    log "Building frontend..."
    cd client
    npm ci
    npm run build
    cd ..
    
    # Build agents
    log "Building agents..."
    docker build -t procurement-agents:latest -f Dockerfile.agents .
    
    success "Application build completed"
    
    # Deploy to Kubernetes
    log "Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace procurement --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy backend
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/backend-service.yaml
    
    # Deploy agents
    kubectl apply -f k8s/agents-deployment.yaml
    kubectl apply -f k8s/agents-service.yaml
    
    # Deploy frontend
    kubectl apply -f k8s/frontend-deployment.yaml
    kubectl apply -f k8s/frontend-service.yaml
    
    # Wait for deployments to be ready
    log "Waiting for deployments to be ready..."
    kubectl rollout status deployment/procurement-backend -n procurement --timeout=300s
    kubectl rollout status deployment/procurement-agents -n procurement --timeout=300s
    kubectl rollout status deployment/procurement-frontend -n procurement --timeout=300s
    
    success "Application deployment completed"
}

# Agent deployment
agent_deployment() {
    log "Starting agent deployment..."
    
    # Deploy agent instances
    local agent_instances=("procurement-agent-1" "procurement-agent-2" "procurement-agent-3")
    
    for instance in "${agent_instances[@]}"; do
        log "Deploying agent instance: $instance"
        
        # Get instance configuration
        local host=$(yq e ".agent_deployment.instances[] | select(.name == \"$instance\") | .host" "$CONFIG_FILE")
        local port=$(yq e ".agent_deployment.instances[] | select(.name == \"$instance\") | .port" "$CONFIG_FILE")
        
        # Deploy via SSH
        ssh "$host" "mkdir -p /opt/procurement-agent"
        scp -r "$PROJECT_ROOT/deep_agents/" "$host:/opt/procurement-agent/"
        scp "$PROJECT_ROOT/agent_config.yaml" "$host:/opt/procurement-agent/"
        
        # Create systemd service
        ssh "$host" "cat > /etc/systemd/system/procurement-agent.service << EOF
[Unit]
Description=Procurement Agent Service
After=network.target

[Service]
Type=simple
User=procurement
WorkingDirectory=/opt/procurement-agent
ExecStart=/usr/bin/python3 -m deep_agents.agents.pages.01900_procurement.agent_server --port $port
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF"
        
        # Start service
        ssh "$host" "systemctl daemon-reload && systemctl enable procurement-agent && systemctl start procurement-agent"
        
        success "Agent instance $instance deployed successfully"
    done
    
    success "Agent deployment completed"
}

# Frontend deployment
frontend_deployment() {
    log "Starting frontend deployment..."
    
    # Build frontend
    log "Building frontend..."
    cd "$PROJECT_ROOT/client"
    npm ci
    npm run build
    
    # Deploy to CDN
    log "Deploying to CDN..."
    aws s3 sync dist/ s3://procurement-frontend-prod/ --delete
    
    # Invalidate CDN cache
    log "Invalidating CDN cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CDN_DISTRIBUTION_ID" \
        --paths "/*"
    
    success "Frontend deployment completed"
}

# Monitoring setup
monitoring_setup() {
    log "Setting up monitoring..."
    
    # Deploy Prometheus
    log "Deploying Prometheus..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values monitoring/prometheus-values.yaml
    
    # Deploy Grafana
    log "Deploying Grafana..."
    helm install grafana grafana/grafana \
        --namespace monitoring \
        --values monitoring/grafana-values.yaml
    
    # Deploy AlertManager
    log "Deploying AlertManager..."
    kubectl apply -f monitoring/alertmanager-config.yaml
    
    # Wait for monitoring to be ready
    log "Waiting for monitoring to be ready..."
    kubectl rollout status deployment/prometheus-kube-prometheus-prometheus -n monitoring --timeout=300s
    kubectl rollout status deployment/grafana -n monitoring --timeout=300s
    
    success "Monitoring setup completed"
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Check application health
    log "Checking application health..."
    local health_url="http://procurement-backend.procurement.svc.cluster.local:8080/health"
    
    if curl -f "$health_url" > /dev/null 2>&1; then
        success "Application health check passed"
    else
        error "Application health check failed"
    fi
    
    # Check database connectivity
    log "Checking database connectivity..."
    if PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database connectivity check passed"
    else
        error "Database connectivity check failed"
    fi
    
    # Check agent connectivity
    log "Checking agent connectivity..."
    local agent_instances=("procurement-agent-1" "procurement-agent-2" "procurement-agent-3")
    
    for instance in "${agent_instances[@]}"; do
        local host=$(yq e ".agent_deployment.instances[] | select(.name == \"$instance\") | .host" "$CONFIG_FILE")
        local port=$(yq e ".agent_deployment.instances[] | select(.name == \"$instance\") | .port" "$CONFIG_FILE")
        
        if ssh "$host" "curl -f http://localhost:$port/health" > /dev/null 2>&1; then
            success "Agent $instance health check passed"
        else
            error "Agent $instance health check failed"
        fi
    done
    
    # Check monitoring
    log "Checking monitoring..."
    if kubectl get pods -n monitoring | grep -q "Running"; then
        success "Monitoring health check passed"
    else
        error "Monitoring health check failed"
    fi
    
    success "Post-deployment verification completed"
}

# Rollback function
rollback() {
    log "Starting rollback procedure..."
    
    # Rollback database
    log "Rolling back database..."
    local backup_file=$(ls -t procurement_backup_*.sql | head -1)
    
    if [[ -f "$backup_file" ]]; then
        PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" < "$backup_file"
        success "Database rollback completed"
    else
        error "No backup file found for rollback"
    fi
    
    # Rollback application
    log "Rolling back application..."
    kubectl rollout undo deployment/procurement-backend -n procurement
    kubectl rollout undo deployment/procurement-agents -n procurement
    kubectl rollout undo deployment/procurement-frontend -n procurement
    
    # Wait for rollback to complete
    kubectl rollout status deployment/procurement-backend -n procurement --timeout=300s
    kubectl rollout status deployment/procurement-agents -n procurement --timeout=300s
    kubectl rollout status deployment/procurement-frontend -n procurement --timeout=300s
    
    success "Rollback completed"
}

# Main deployment function
main_deployment() {
    log "Starting 01900 Procurement Phase 5 Deployment"
    log "=============================================="
    
    # Load configuration
    load_config
    
    # Run pre-deployment checks
    pre_deployment_checks
    
    # Run database migration
    database_migration
    
    # Deploy application
    application_deployment
    
    # Deploy agents
    agent_deployment
    
    # Deploy frontend
    frontend_deployment
    
    # Setup monitoring
    monitoring_setup
    
    # Run post-deployment verification
    post_deployment_verification
    
    success "01900 Procurement Phase 5 Deployment completed successfully!"
    log "=============================================="
}

# Parse command line arguments
case "${1:-}" in
    "deploy")
        main_deployment
        ;;
    "rollback")
        rollback
        ;;
    "verify")
        post_deployment_verification
        ;;
    "monitoring")
        monitoring_setup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [deploy|rollback|verify|monitoring|help]"
        echo ""
        echo "Commands:"
        echo "  deploy      - Run full deployment"
        echo "  rollback    - Rollback to previous version"
        echo "  verify      - Run post-deployment verification"
        echo "  monitoring  - Setup monitoring only"
        echo "  help        - Show this help message"
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|verify|monitoring|help]"
        exit 1
        ;;
esac