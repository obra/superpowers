#!/bin/bash
# DevKit DotNet Setup - WSL Compatible
# Instala dependencias necesarias para el DevKit

set -e

echo "================================================"
echo "  DevKit DotNet Setup"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar WSL
is_wsl() {
    if grep -qi "microsoft" /proc/version 2>/dev/null; then
        return 0
    fi
    return 1
}

# Detectar SO
detect_os() {
    if is_wsl; then
        echo "WSL detected"
        PKG_MANAGER="sudo apt-get"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macOS detected"
        PKG_MANAGER="brew"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Linux detected"
        PKG_MANAGER="sudo apt-get"
    else
        echo "Unknown OS"
        PKG_MANAGER=""
    fi
}

# Verificar prerrequisitos
echo "Verificando prerrequisitos..."

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 no encontrado${NC}"
    echo "Instala Python 3.9+: https://www.python.org/downloads/"
    exit 1
fi
echo -e "${GREEN}OK${NC} Python $(python3 --version | awk '{print $2}')"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no encontrado${NC}"
    echo "Instala Node.js 18+: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}OK${NC} Node.js $(node --version)"

if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git no encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}OK${NC} Git $(git --version | awk '{print $3}')"

echo ""
echo "================================================"
echo ""

# Instalar deps de Vision
echo -e "${YELLOW}Instalando Vision Processing deps...${NC}"
pip3 install --break-system-packages \
    opencv-python-headless>=4.8.0 \
    Pillow>=10.0.0 \
    pytesseract>=0.3.10 \
    numpy>=1.24.0 \
    -q
echo -e "${GREEN}OK${NC} Python deps de Vision instalados"

# Instalar Tesseract
if ! command -v tesseract &> /dev/null; then
    echo -e "${YELLOW}Instalando Tesseract OCR...${NC}"
    detect_os
    if [[ -n "$PKG_MANAGER" ]]; then
        $PKG_MANAGER update -qq && $PKG_MANAGER install -y tesseract-ocr -qq
    fi
fi

if command -v tesseract &> /dev/null; then
    echo -e "${GREEN}OK${NC} Tesseract OCR"
else
    echo -e "${YELLOW}Warning: Tesseract no instalado automaticamente${NC}"
fi

echo ""
echo "================================================"
echo ""

# Instalar deps de RAG
echo -e "${YELLOW}Instalando RAG Document Processing deps...${NC}"
pip3 install --break-system-packages \
    PyMuPDF>=1.23.0 \
    openpyxl>=3.1.0 \
    python-docx>=1.1.0 \
    requests>=2.31.0 \
    -q
echo -e "${GREEN}OK${NC} Python deps de RAG instalados"

echo ""
echo "================================================"
echo ""

# Verificar .NET
if command -v dotnet &> /dev/null; then
    echo -e "${GREEN}OK${NC} .NET SDK $(dotnet --version | awk '{print $1}')"
else
    echo -e "${YELLOW}Warning: .NET SDK no encontrado${NC}"
    echo "Instala .NET 10: https://dotnet.microsoft.com/download/dotnet/10.0"
fi

# Verificar Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}OK${NC} Docker"
else
    echo -e "${YELLOW}Warning: Docker no encontrado (opcional)${NC}"
fi

# Verificar Dapr
if command -v dapr &> /dev/null; then
    echo -e "${GREEN}OK${NC} Dapr CLI"
else
    echo -e "${YELLOW}Warning: Dapr CLI no encontrado (opcional para microservicios)${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}DevKit DotNet listo!${NC}"
echo ""
echo "Proximos pasos:"
echo "  1. cp .opencode/.env.example .opencode/.env"
echo "  2. Editar .env si es necesario"
echo "  3. opencode"
echo ""