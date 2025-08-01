#!/bin/bash

# Docker Entrypoint for OpenVPN Container
# This script initializes OpenVPN if needed and starts the service

set -e

echo "🚀 Starting OpenVPN container..."

# Run initialization script
/usr/local/bin/openvpn-init.sh

# If first argument is ovpn_run, execute the original entrypoint
if [ "$1" = "ovpn_run" ]; then
    echo "🌐 Starting OpenVPN server..."
    exec ovpn_run
fi

# If first argument is a command that exists, execute it
if command -v "$1" >/dev/null 2>&1; then
    exec "$@"
fi

# Otherwise, execute the original Docker entrypoint
exec "$@"