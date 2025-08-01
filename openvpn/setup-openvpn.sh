#!/bin/bash

# OpenVPN Setup Script for Docker Compose
# This script builds and starts the OpenVPN container with automatic initialization

set -e

echo "🔧 Setting up OpenVPN with Docker Compose..."

# Configuration variables
SERVER_IP="${1:-localhost}"
if [ "$SERVER_IP" = "localhost" ]; then
    echo "⚠️  Warning: Using localhost as server URL. For production, run:"
    echo "   $0 YOUR_PUBLIC_IP_OR_DOMAIN"
    echo ""
fi

# Update server URL in docker-compose.yml
echo "📝 Configuring server URL: $SERVER_IP"
sed -i.bak "s|OVPN_SERVER_URL=udp://localhost|OVPN_SERVER_URL=udp://$SERVER_IP|g" docker-compose.yml

# Build and start containers
echo "🏗️  Building OpenVPN container..."
docker-compose build openvpn

echo "🚀 Starting OpenVPN service..."
docker-compose up -d openvpn

# Wait for initialization
echo "⏳ Waiting for OpenVPN initialization..."
sleep 10

# Check if OpenVPN is running
if docker-compose ps openvpn | grep -q "Up"; then
    echo "✅ OpenVPN container is running!"
    
    # Show container logs
    echo "📋 Recent logs:"
    docker-compose logs --tail=20 openvpn
    
    echo ""
    echo "🎉 OpenVPN setup complete!"
    echo ""
    echo "📊 Service Status:"
    echo "  - OpenVPN Server: Running on port 1194/udp"
    echo "  - Management Interface: Running on port 7505/tcp"
    echo "  - Server URL: udp://$SERVER_IP"
    echo ""
    echo "🔑 To create client certificates:"
    echo "  ./create-client.sh CLIENT_NAME"
    echo ""
    echo "🐳 To view logs:"
    echo "  docker-compose logs -f openvpn"
    echo ""
    echo "🛑 To stop:"
    echo "  docker-compose down"
else
    echo "❌ Failed to start OpenVPN container"
    echo "📋 Logs:"
    docker-compose logs openvpn
    exit 1
fi