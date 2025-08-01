#!/bin/bash

# OpenVPN Container Setup Script
# This script initializes the kylemanna/openvpn container with proper configuration

set -e

# Configuration variables
OVPN_DATA="openvpn-data"
SERVER_URL="udp://localhost"  # Change this to your server's public IP/domain

echo "🔧 Setting up OpenVPN container..."

# Step 1: Create Docker volume (if it doesn't exist)
echo "📁 Creating Docker volume: $OVPN_DATA"
docker volume create --name $OVPN_DATA 2>/dev/null || echo "Volume $OVPN_DATA already exists"

# Step 2: Generate OpenVPN configuration
echo "⚙️  Generating OpenVPN configuration..."
docker run -v $OVPN_DATA:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u $SERVER_URL

# Step 3: Initialize PKI (Certificate Authority)
echo "🔐 Initializing PKI (you will be prompted for a passphrase)..."
docker run -v $OVPN_DATA:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki

echo "✅ OpenVPN container initialization complete!"
echo ""
echo "Next steps:"
echo "1. Update SERVER_URL in this script to your server's public IP/domain"
echo "2. Run: docker-compose up -d"
echo "3. Create client certificates using: ./create-client.sh CLIENT_NAME"