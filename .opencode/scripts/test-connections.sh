#!/bin/bash
# test-connections.sh - Verifica conexiones a servicios externos
# SQL Server, Redis, Dapr, Docker

set -e

OUTPUT_FORMAT="simple"

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            OUTPUT_FORMAT="json"
            shift
            ;;
        --help)
            echo "Usage: test-connections.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --json      Output JSON format"
            echo "  --help      Show this help"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Tests individuales
test_sqlserver() {
    local host="${1:-localhost}"
    local port="${2:-1433}"
    local user="${3:-sa}"
    local pass="${4:-YourPassword}"
    
    if command -v sqlcmd &> /dev/null; then
        if sqlcmd -S "$host,$port" -U "$user" -P "$pass" -Q "SELECT 1" -b &> /dev/null; then
            echo "OK"
            return 0
        fi
    fi
    
    # Fallback: usar PowerShell para SQL Server
    if command -v powershell &> /dev/null; then
        if powershell -Command "Test-NetConnection -ComputerName '$host' -Port $port -WarningAction SilentlyContinue | Test-Connection -Quiet" 2>/dev/null; then
            echo "OK (TCP connection)"
            return 0
        fi
    fi
    
    # Fallback: curl a cualquier endpoint sql
    if nc -z "$host" "$port" 2>/dev/null; then
        echo "OK (port open)"
        return 0
    fi
    
    echo "FAIL"
    return 1
}

test_redis() {
    local host="${1:-localhost}"
    local port="${2:-6379}"
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "$host" -p "$port" ping 2>/dev/null | grep -q "PONG"; then
            echo "OK"
            return 0
        fi
    fi
    
    # Fallback: nc
    if nc -z "$host" "$port" 2>/dev/null; then
        echo "OK (port open)"
        return 0
    fi
    
    echo "FAIL"
    return 1
}

test_dapr() {
    if command -v dapr &> /dev/null; then
        local daprd_running=$(dapr list 2>/dev/null | grep -c "dapr" || echo "0")
        if [[ "$daprd_running" -gt 0 ]]; then
            echo "OK ($daprd_running sidecars)"
            return 0
        fi
    fi
    
    # Dapr no instalado o no corriendo
    echo "FAIL (not running)"
    return 1
}

test_docker() {
    if command -v docker &> /dev/null; then
        if docker ps &> /dev/null; then
            local container_count=$(docker ps -q 2>/dev/null | wc -l)
            echo "OK ($container_count containers)"
            return 0
        fi
    fi
    
    echo "FAIL"
    return 1
}

test_docker_compose() {
    if [[ -f "docker-compose.yml" ]] || [[ -f "docker-compose.yaml" ]]; then
        if command -v docker-compose &> /dev/null; then
            local running=$(docker-compose ps 2>/dev/null | grep -c "Up" || echo "0")
            echo "OK ($running services)"
            return 0
        elif command -v docker &> /dev/null; then
            local compose_version=$(docker compose version 2>/dev/null | head -1 || echo "")
            if [[ -n "$compose_version" ]]; then
                echo "OK (docker compose available)"
                return 0
            fi
        fi
    fi
    
    echo "FAIL (no compose file)"
    return 1
}

test_dapr_sidecar() {
    local port="${1:-3500}"
    
    if nc -z localhost "$port" 2>/dev/null; then
        local health=$(curl -s "http://localhost:$port/v1/health" 2>/dev/null || echo "")
        if [[ "$health" == "{\"ok\":true}" ]] || [[ "$health" == "OK" ]]; then
            echo "OK"
            return 0
        fi
        echo "OK (port open)"
        return 0
    fi
    
    echo "FAIL"
    return 1
}

# Main
echo "Testing External Connections..."
echo ""

if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    echo "{"
    echo '  "connections": ['
    
    # SQL Server
    sql_result=$(test_sqlserver)
    echo -n '    {"name": "sqlserver", "status": "'$sql_result'"}'
    
    # Redis
    redis_result=$(test_redis)
    echo ','
    echo -n '    {"name": "redis", "status": "'$redis_result'"}'
    
    # Dapr
    dapr_result=$(test_dapr)
    echo ','
    echo -n '    {"name": "dapr", "status": "'$dapr_result'"}'
    
    # Docker
    docker_result=$(test_docker)
    echo ','
    echo -n '    {"name": "docker", "status": "'$docker_result'"}'
    
    echo ''
    echo '  ]'
    echo "}"
else
    # Simple format
    echo -e "SQL_SERVER: $(test_sqlserver)"
    echo -e "REDIS: $(test_redis)"
    echo -e "DAPR: $(test_dapr)"
    echo -e "DOCKER: $(test_docker)"
    
    echo ""
    echo "Dapr sidecars:"
    echo -e "  sidecar-3500: $(test_dapr_sidecar 3500)"
fi