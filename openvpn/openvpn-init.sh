#!/bin/bash

# OpenVPN Initialization Script
# This script handles all secondary setup steps for the OpenVPN container

set -e

OVPN_DATA="/etc/openvpn"
SERVER_URL="${OVPN_SERVER_URL:-udp://localhost}"
NETWORK="${OVPN_NETWORK:-192.168.255.0/24}"
DNS_SERVERS="${OVPN_DNS:-8.8.8.8,8.8.4.4}"

echo "🔧 Initializing OpenVPN server..."

# Check if already initialized
if [ -f "$OVPN_DATA/openvpn.conf" ] && [ -f "$OVPN_DATA/pki/ca.crt" ]; then
    echo "✅ OpenVPN already initialized. Skipping setup."
    exit 0
fi

echo "📁 Setting up OpenVPN configuration..."

# Generate OpenVPN configuration with runtime environment variables
ovpn_genconfig -u "$SERVER_URL" \
    -n "$DNS_SERVERS" \
    -s "$NETWORK" \
    ${OVPN_ROUTES:+-r "$OVPN_ROUTES"} \
    ${OVPN_NAT:+-N} \
    -C "$OVPN_CIPHER" \
    -a "$OVPN_AUTH" \
    -T "$OVPN_TLS_CIPHER" \
    ${OVPN_COMP_LZO:+-z}

# Add management interface configuration
echo "management 0.0.0.0 7505" >> "$OVPN_DATA/openvpn.conf"
echo "management-client-auth" >> "$OVPN_DATA/openvpn.conf"

# Add status log configuration
echo "status /etc/openvpn/openvpn-status.log 10" >> "$OVPN_DATA/openvpn.conf"
echo "status-version 2" >> "$OVPN_DATA/openvpn.conf"

# Add client config directory
echo "client-config-dir /etc/openvpn/ccd" >> "$OVPN_DATA/openvpn.conf"

# Check if PKI was pre-generated during build or needs runtime initialization
if [ ! -f "$OVPN_DATA/pki/ca.crt" ]; then
    echo "🔐 PKI not found - initializing at runtime (this should be rare)..."
    
    # Set default values for non-interactive PKI initialization
    export EASYRSA_BATCH="1"
    export EASYRSA_REQ_CN="OpenVPN-CA"
    export EASYRSA_REQ_COUNTRY="US"
    export EASYRSA_REQ_PROVINCE="CA"
    export EASYRSA_REQ_CITY="San Francisco"
    export EASYRSA_REQ_ORG="OpenVPN"
    export EASYRSA_REQ_EMAIL="admin@openvpn.local"
    export EASYRSA_REQ_OU="IT"
    export EASYRSA_KEY_SIZE="2048"
    export EASYRSA_CA_EXPIRE="3650"
    export EASYRSA_CERT_EXPIRE="3650"
    
    # Initialize PKI without prompts (fallback - should be pre-generated in Dockerfile)
    ovpn_initpki nopass
    
    echo "✅ PKI initialized successfully"
else
    echo "✅ Using pre-generated PKI from container build"
fi

# Set proper permissions
chown -R root:root "$OVPN_DATA"
chmod -R 600 "$OVPN_DATA/pki/private"

echo "✅ OpenVPN initialization complete!"
echo "📊 Configuration summary:"
echo "  - Server URL: $SERVER_URL"
echo "  - Network: $NETWORK" 
echo "  - DNS Servers: $DNS_SERVERS"
echo "  - Cipher: $OVPN_CIPHER"
echo "  - Auth: $OVPN_AUTH"
echo "  - Management Interface: 0.0.0.0:7505"