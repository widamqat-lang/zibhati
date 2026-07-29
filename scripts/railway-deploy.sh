#!/bin/bash
# ============================================
# Railway Deployment Script
# ============================================
# This script helps deploy the monorepo to Railway

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  مواشي البحرين - Railway Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check for Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Check if logged in
echo -e "${YELLOW}Checking Railway login status...${NC}"
if ! railway status &> /dev/null; then
    echo -e "${RED}Please login to Railway first:${NC}"
    echo "  railway login"
    exit 1
fi

# Menu
echo ""
echo "Choose deployment option:"
echo "  1) Deploy API Server"
echo "  2) Deploy Frontend"
echo "  3) Deploy Both (separate projects)"
echo "  4) Open Railway Dashboard"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}Deploying API Server...${NC}"
        cd artifacts/api-server
        railway up
        echo -e "${GREEN}API Server deployed!${NC}"
        ;;
    2)
        echo -e "${GREEN}Deploying Frontend...${NC}"
        cd artifacts/mawashi-bahrain
        railway up
        echo -e "${GREEN}Frontend deployed!${NC}"
        ;;
    3)
        echo -e "${GREEN}Deploying API Server...${NC}"
        cd artifacts/api-server
        railway up
        
        echo -e "${GREEN}Deploying Frontend...${NC}"
        cd ../mawashi-bahrain
        railway up
        
        echo -e "${GREEN}Both services deployed!${NC}"
        ;;
    4)
        echo -e "${GREEN}Opening Railway Dashboard...${NC}"
        railway open
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
