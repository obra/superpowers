#!/bin/bash
# test-endpoints.sh - Hybrid endpoint testing
# Auto-detecta puertos desde docker-compose.yml o usa ports.conf

set -e

OUTPUT_JSON=false
VERBOSE=false

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            OUTPUT_JSON=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: test-endpoints.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --json      Output JSON format"
            echo "  --verbose   Show detailed output"
            echo "  --help      Show this help"
            echo ""
            echo "Detection order:"
            echo "  1. ports.conf (manual override)"
            echo "  2. docker-compose.yml (auto)"
            echo "  3. appsettings*.json (auto)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Funcion para testing de un endpoint
test_endpoint() {
    local name=$1
    local port=$2
    local path=${3:-"/health"}
    
    local start_time=$(date +%s%3N)
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" --connect-timeout 5 "http://localhost:$port$path" 2>/dev/null) || response=""
    
    local end_time=$(date +%s%3N)
    local elapsed=$((end_time - start_time))
    
    if [[ -z "$response" ]]; then
        echo "FAIL"
        return 1
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    
    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "204" ]]; then
        echo "OK"
        return 0
    else
        echo "FAIL (HTTP $http_code)"
        return 1
    fi
}

# Detectar puertos automaticamente
detect_ports() {
    local ports=()
    
    # 1. Check ports.conf (manual override)
    if [[ -f "ports.conf" ]]; then
        if $VERBOSE; then echo "Using ports.conf..."; fi
        while IFS=: read -r name port; do
            # Skip comments
            [[ "$name" =~ ^# ]] && continue
            [[ -z "$name" ]] && continue
            ports+=("$name:$port")
        done < ports.conf
        echo "${ports[@]}"
        return
    fi
    
    # 2. Check docker-compose.yml
    if [[ -f "docker-compose.yml" ]] || [[ -f "docker-compose.yaml" ]]; then
        local compose_file="docker-compose.yml"
        [[ -f "docker-compose.yaml" ]] && compose_file="docker-compose.yaml"
        
        if $VERBOSE; then echo "Scanning $compose_file..."; fi
        
        # Extraer puertos de services
        local services=$(grep -A 50 "services:" "$compose_file" | grep -E "^\s+[a-z-]+:" | head -20)
        
        while IFS= read -r service; do
            service_name=$(echo "$service" | sed 's/://' | xargs)
            
            # Buscar ports en este servicio
            local port_line=$(grep -A 30 "^\s*$service_name:" "$compose_file" | grep -A 5 "ports:" | head -6 | tail -n 1 | sed 's/.*- "\(.*\):.*"/\1/' | xargs)
            
            if [[ -n "$port_line" ]]; then
                ports+=("$service_name:$port_line")
            fi
        done <<< "$services"
        
        if [[ ${#ports[@]} -gt 0 ]]; then
            echo "${ports[@]}"
            return
        fi
    fi
    
    # 3. Check appsettings*.json
    if $VERBOSE; then echo "Scanning appsettings..."; fi
    for json_file in appsettings*.json; do
        if [[ -f "$json_file" ]]; then
            # Extraer puertos desde Kestrel:Urls o similar
            local urls=$(grep -o '"Url": *"[^"]*"' "$json_file" 2>/dev/null | head -5)
            if [[ -n "$urls" ]]; then
                local port=$(echo "$urls" | head -1 | grep -o '[0-9]\+' | head -1)
                if [[ -n "$port" ]]; then
                    ports+=("api:$port")
                fi
            fi
        fi
    done
    
    echo "${ports[@]}"
}

# Main
echo "Testing Microservices Endpoints..."
echo ""

# Detectar servicios
detected_ports=$(detect_ports)
declare -a services=()

if [[ -z "$detected_ports" ]]; then
    echo "No services detected."
    echo ""
    echo "To configure manually, create ports.conf:"
    echo "  # service:port format"
    echo "  identity:5001"
    echo "  catalog:5002"
    echo "  order:5003"
    exit 1
fi

# Parse detected ports
IFS=' ' read -ra services <<< "$detected_ports"

if $OUTPUT_JSON; then
    echo "{"
    echo '  "services": ['
    
    first=true
    for entry in "${services[@]}"; do
        IFS=':' read -r name port <<< "$entry"
        
        start_time=$(date +%s%3N)
        result=$(curl -s -w "%{http_code}" --connect-timeout 5 "http://localhost:$port/health" 2>/dev/null)
        end_time=$(date +%s%3N)
        elapsed=$((end_time - start_time))
        
        http_code="${result: -3}"
        body="${result:0:${#result}-3}"
        
        if [[ "$http_code" == "200" ]] || [[ "$http_code" == "204" ]]; then
            status="ok"
        else
            status="fail"
        fi
        
        if $first; then
            first=false
        else
            echo ","
        fi
        
        echo -n "    {\"name\": \"$name\", \"port\": $port, \"status\": \"$status\", \"ms\": $elapsed}"
    done
    
    echo ""
    echo '  ],'
    echo "  \"summary\": {\"total\": ${#services[@]}, \"passed\": $passed, \"failed\": $failed}"
    echo "}"
else
    # Output simple
    passed=0
    failed=0
    
    for entry in "${services[@]}"; do
        IFS=':' read -r name port <<< "$entry"
        
        if $VERBOSE; then
            echo -n "Testing $name (localhost:$port/health)... "
        else
            echo -n "$name: "
        fi
        
        start_time=$(date +%s%3N)
        result=$(curl -s -w "%{http_code}" --connect-timeout 5 "http://localhost:$port/health" 2>/dev/null)
        end_time=$(date +%s%3N)
        elapsed=$((end_time - start_time))
        
        http_code="${result: -3}"
        
        if [[ "$http_code" == "200" ]] || [[ "$http_code" == "204" ]]; then
            echo -e "${GREEN}OK${NC} (${elapsed}ms)"
            ((passed++))
        else
            echo -e "${RED}FAIL${NC} (HTTP $http_code, ${elapsed}ms)"
            ((failed++))
        fi
    done
    
    echo ""
    echo "Summary: $passed passed, $failed failed"
    
    if [[ $failed -gt 0 ]]; then
        exit 1
    fi
fi