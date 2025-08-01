#!/bin/bash

# OpenVPN Client Certificate Creation Script
# Usage: ./create-client.sh CLIENT_NAME

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a client name"
    echo "Usage: $0 CLIENT_NAME"
    exit 1
fi

CLIENT_NAME=$1
OVPN_DATA="openvpn-data"

echo "🔐 Creating client certificate for: $CLIENT_NAME"

# Generate client certificate without password
docker run -v $OVPN_DATA:/etc/openvpn --rm -it kylemanna/openvpn easyrsa build-client-full $CLIENT_NAME nopass

# Retrieve client configuration
echo "📄 Generating client configuration file..."
docker run -v $OVPN_DATA:/etc/openvpn --rm kylemanna/openvpn ovpn_getclient $CLIENT_NAME > $CLIENT_NAME.ovpn

echo "✅ Client certificate created successfully!"
echo "📁 Configuration file: $CLIENT_NAME.ovpn"
echo ""
echo "You can now distribute this .ovpn file to the client for OpenVPN connection."