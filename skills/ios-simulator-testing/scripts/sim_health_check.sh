#!/usr/bin/env bash
#
# iOS Simulator Testing Environment Health Check
#
# Verifies that all required tools and dependencies are properly installed
# and configured for iOS simulator testing.
#
# Usage: bash scripts/sim_health_check.sh [--help]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check flags
SHOW_HELP=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --help|-h)
            SHOW_HELP=true
            shift
            ;;
    esac
done

if [ "$SHOW_HELP" = true ]; then
    cat <<EOF
iOS Simulator Testing - Environment Health Check

Verifies that your environment is properly configured for iOS simulator testing.

Usage: bash scripts/sim_health_check.sh [options]

Options:
  --help, -h    Show this help message

This script checks for:
  - Xcode Command Line Tools installation
  - iOS Simulator availability
  - IDB (iOS Development Bridge) installation
  - Available simulator devices
  - Python 3 installation (for scripts)

Exit codes:
  0 - All checks passed
  1 - One or more checks failed (see output for details)
EOF
    exit 0
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  iOS Simulator Testing - Environment Health Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to print check status
check_passed() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_failed() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: macOS
echo -e "${BLUE}[1/8]${NC} Checking operating system..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS_VERSION=$(sw_vers -productVersion)
    check_passed "macOS detected (version $OS_VERSION)"
else
    check_failed "Not running on macOS (detected: $OSTYPE)"
    echo "       iOS Simulator testing requires macOS"
fi
echo ""

# Check 2: Xcode Command Line Tools
echo -e "${BLUE}[2/8]${NC} Checking Xcode Command Line Tools..."
if command -v xcrun &> /dev/null; then
    XCODE_PATH=$(xcode-select -p 2>/dev/null || echo "not found")
    if [ "$XCODE_PATH" != "not found" ]; then
        XCODE_VERSION=$(xcodebuild -version 2>/dev/null | head -n 1 || echo "Unknown")
        check_passed "Xcode Command Line Tools installed"
        echo "       Path: $XCODE_PATH"
        echo "       Version: $XCODE_VERSION"
    else
        check_failed "Xcode Command Line Tools path not set"
        echo "       Run: xcode-select --install"
    fi
else
    check_failed "xcrun command not found"
    echo "       Install Xcode Command Line Tools: xcode-select --install"
fi
echo ""

# Check 3: simctl availability
echo -e "${BLUE}[3/8]${NC} Checking simctl (Simulator Control)..."
if command -v xcrun &> /dev/null && xcrun simctl help &> /dev/null; then
    check_passed "simctl is available"
else
    check_failed "simctl not available"
    echo "       simctl comes with Xcode Command Line Tools"
fi
echo ""

# Check 4: IDB installation
echo -e "${BLUE}[4/8]${NC} Checking IDB (iOS Development Bridge)..."
if command -v idb &> /dev/null; then
    IDB_PATH=$(which idb)
    IDB_VERSION=$(idb --version 2>/dev/null || echo "Unknown")
    check_passed "IDB is installed"
    echo "       Path: $IDB_PATH"
    echo "       Version: $IDB_VERSION"
else
    check_warning "IDB not found in PATH"
    echo "       IDB is optional but provides advanced UI automation"
    echo "       Install: https://fbidb.io/docs/installation"
    echo "       Recommended: brew tap facebook/fb && brew install idb-companion"
fi
echo ""

# Check 5: Python 3 installation
echo -e "${BLUE}[5/8]${NC} Checking Python 3..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    check_passed "Python 3 is installed (version $PYTHON_VERSION)"
else
    check_failed "Python 3 not found"
    echo "       Python 3 is required for testing scripts"
    echo "       Install: brew install python3"
fi
echo ""

# Check 6: Available simulators
echo -e "${BLUE}[6/8]${NC} Checking available iOS Simulators..."
if command -v xcrun &> /dev/null; then
    SIMULATOR_COUNT=$(xcrun simctl list devices available 2>/dev/null | grep -c "iPhone\|iPad" || echo "0")

    if [ "$SIMULATOR_COUNT" -gt 0 ]; then
        check_passed "Found $SIMULATOR_COUNT available simulator(s)"

        # Show first 5 simulators
        echo ""
        echo "       Available simulators (showing up to 5):"
        xcrun simctl list devices available 2>/dev/null | grep "iPhone\|iPad" | head -5 | while read -r line; do
            echo "       - $line"
        done
    else
        check_warning "No simulators found"
        echo "       Create simulators via Xcode or simctl"
        echo "       Example: xcrun simctl create 'iPhone 15' 'iPhone 15'"
    fi
else
    check_failed "Cannot check simulators (simctl not available)"
fi
echo ""

# Check 7: Booted simulators
echo -e "${BLUE}[7/8]${NC} Checking booted simulators..."
if command -v xcrun &> /dev/null; then
    BOOTED_SIMS=$(xcrun simctl list devices booted 2>/dev/null | grep -c "iPhone\|iPad" || echo "0")

    if [ "$BOOTED_SIMS" -gt 0 ]; then
        check_passed "$BOOTED_SIMS simulator(s) currently booted"

        echo ""
        echo "       Booted simulators:"
        xcrun simctl list devices booted 2>/dev/null | grep "iPhone\|iPad" | while read -r line; do
            echo "       - $line"
        done
    else
        check_warning "No simulators currently booted"
        echo "       Boot a simulator to begin testing"
        echo "       Example: xcrun simctl boot <device-udid>"
        echo "       Or: open -a Simulator"
    fi
else
    check_failed "Cannot check booted simulators (simctl not available)"
fi
echo ""

# Check 8: Required Python packages (optional check)
echo -e "${BLUE}[8/8]${NC} Checking Python packages..."
if command -v python3 &> /dev/null; then
    MISSING_PACKAGES=()

    # Check for PIL/Pillow (for visual_diff.py)
    if python3 -c "import PIL" 2>/dev/null; then
        check_passed "Pillow (PIL) installed - visual diff available"
    else
        MISSING_PACKAGES+=("pillow")
        check_warning "Pillow (PIL) not installed - visual diff won't work"
    fi

    if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
        echo ""
        echo "       Install missing packages:"
        echo "       pip3 install ${MISSING_PACKAGES[*]}"
    fi
else
    check_warning "Cannot check Python packages (Python 3 not available)"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
if [ "$CHECKS_FAILED" -gt 0 ]; then
    echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"
    echo ""
    echo -e "${YELLOW}Action required:${NC} Fix the failed checks above before testing"
    exit 1
else
    echo ""
    echo -e "${GREEN}✓ Environment is ready for iOS simulator testing${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Boot a simulator: open -a Simulator"
    echo "  2. Launch your app: xcrun simctl launch booted <bundle-id>"
    echo "  3. Run accessibility audit: python scripts/accessibility_audit.py"
    exit 0
fi
