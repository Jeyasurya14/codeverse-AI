#!/bin/bash

# CodeVerse Production Setup Script
# This script helps set up production environment variables

set -e

echo "🚀 CodeVerse Production Setup"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
fi

# Check if logged in to EAS
echo -e "${YELLOW}Checking EAS login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Please login:${NC}"
    eas login
fi

echo ""
echo -e "${GREEN}✅ EAS CLI ready${NC}"
echo ""

# Production API URL
PROD_API_URL="https://codeverse-api-429f.onrender.com"

echo "Setting production environment variables..."
echo ""

# Set EXPO_PUBLIC_API_URL
echo -e "${YELLOW}Setting EXPO_PUBLIC_API_URL...${NC}"
eas env:create --name EXPO_PUBLIC_API_URL \
    --value "$PROD_API_URL" \
    --environment production \
    --visibility plaintext \
    --force

# Set OAuth Client IDs (optional)
read -p "Do you want to set OAuth Client IDs? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setting Google Client ID...${NC}"
    eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID \
        --value "436868027669-k90ua4c64llls5bk0pmqlimd8d9sdt4g.apps.googleusercontent.com" \
        --environment production \
        --visibility plaintext \
        --force
    
    echo -e "${YELLOW}Setting GitHub Client ID...${NC}"
    eas env:create --name EXPO_PUBLIC_GITHUB_CLIENT_ID \
        --value "Ov23li12lOljFCToSg2E" \
        --environment production \
        --visibility plaintext \
        --force
fi

echo ""
echo -e "${GREEN}✅ Production environment variables set!${NC}"
echo ""
echo "Verify with: eas env:list"
echo ""
echo "Next steps:"
echo "  1. Build production: eas build --platform android --profile production"
echo "  2. Test the build"
echo "  3. Submit to Play Store"
