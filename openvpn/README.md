# OpenVPN Container Setup

This directory contains all the necessary files to build and deploy a fully configured OpenVPN server using Docker. The setup is based on the popular `kylemanna/openvpn` Docker image with additional customizations for integration with the OpenVPN API project.

## Overview

The OpenVPN container provides:
- **Pre-configured PKI (Certificate Authority)** - CA and DH parameters are generated during build for faster startup
- **Management Interface** - Enables API integration for connection management
- **Status Logging** - Real-time connection monitoring
- **Flexible Configuration** - Environment variable-based setup
- **Security Hardened** - Modern ciphers and authentication methods

## Files Description

| File | Purpose |
|------|---------|
| `Dockerfile.openvpn` | Docker image definition with pre-built PKI |
| `docker-entrypoint.sh` | Container startup script |
| `openvpn-init.sh` | OpenVPN configuration initialization |
| `openvpn-setup.sh` | Host-side setup script for initial deployment |
| `setup-openvpn.sh` | Alternative setup script |
| `create-client.sh` | Client certificate generation script |

## Quick Start

### 1. Build the OpenVPN Container

```bash
# From the openvpn directory
docker build -f Dockerfile.openvpn -t openvpn-api .
```

### 2. Configure Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Server Configuration
OVPN_SERVER_URL="udp://your-server-ip"    # Replace with your public IP/domain
OVPN_NETWORK="192.168.255.0/24"           # VPN network subnet
OVPN_DNS="8.8.8.8,8.8.4.4"              # DNS servers for clients

# Security Configuration  
OVPN_CIPHER="AES-256-GCM"                 # Encryption cipher
OVPN_AUTH="SHA256"                        # Authentication digest
OVPN_TLS_CIPHER="TLS-ECDHE-RSA-WITH-AES-256-GCM-SHA384"

# Optional Configuration
OVPN_ROUTES=""                            # Additional routes to push
OVPN_NAT="true"                          # Enable NAT for internet access
OVPN_COMP_LZO="false"                    # LZO compression (deprecated)
```

### 3. Deploy with Docker Compose

Update your `docker-compose.yml` to reference the new OpenVPN location:

```yaml
services:
  openvpn:
    build:
      context: ./openvpn
      dockerfile: Dockerfile.openvpn
    container_name: openvpn-server
    ports:
      - "1194:1194/udp"    # OpenVPN port
      - "7505:7505/tcp"    # Management interface
    volumes:
      - openvpn-data:/etc/openvpn
    environment:
      - OVPN_SERVER_URL=${OVPN_SERVER_URL}
      - OVPN_NETWORK=${OVPN_NETWORK}
      - OVPN_DNS=${OVPN_DNS}
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun
    restart: unless-stopped

volumes:
  openvpn-data:
```

### 4. Start the Services

```bash
# From project root
docker-compose up -d openvpn
```

## Client Management

### Create a New Client Certificate

```bash
# From the openvpn directory
./create-client.sh client-name
```

This generates a `client-name.ovpn` file that can be imported into any OpenVPN client.

### Revoke a Client Certificate

```bash
docker run -v openvpn-data:/etc/openvpn --rm -it kylemanna/openvpn easyrsa revoke client-name
docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn easyrsa gen-crl
```

## Management Interface

The OpenVPN server exposes a management interface on port 7505 that allows the API to:
- Monitor active connections
- Disconnect specific clients
- Retrieve real-time status information

### Management Commands

Connect to the management interface:
```bash
telnet localhost 7505
```

Common commands:
- `status` - Show connected clients
- `kill client-name` - Disconnect a specific client
- `log on` - Enable real-time log output
- `help` - Show all available commands

## Configuration Details

### Network Architecture

- **VPN Network**: `192.168.255.0/24` (configurable)
- **OpenVPN Port**: `1194/udp`
- **Management Port**: `7505/tcp`
- **Status Log**: `/etc/openvpn/openvpn-status.log`

### Security Features

- **Encryption**: AES-256-GCM (AEAD cipher)
- **Authentication**: SHA-256 HMAC
- **TLS**: ECDHE-RSA with AES-256-GCM
- **Key Size**: 2048-bit RSA keys
- **Certificate Validity**: 10 years (configurable)

### PKI (Public Key Infrastructure)

The container uses EasyRSA 3.x for certificate management:
- CA certificate and private key are generated during build
- DH parameters (2048-bit) are pre-computed
- Server certificate is automatically created
- Client certificates are generated on-demand

## Integration with OpenVPN API

The OpenVPN container is designed to integrate seamlessly with the Node.js/Elysia API:

1. **Status Monitoring**: API reads `/etc/openvpn/openvpn-status.log`
2. **Connection Management**: API connects to management interface on port 7505
3. **Certificate Management**: API can execute EasyRSA commands via Docker
4. **Client Configuration**: API generates `.ovpn` files for distribution

## Troubleshooting

### Container Won't Start

1. Check if TUN device is available:
   ```bash
   ls -la /dev/net/tun
   ```

2. Verify Docker has NET_ADMIN capability:
   ```bash
   docker run --rm --cap-add NET_ADMIN alpine ip link
   ```

### Clients Can't Connect

1. Verify server URL in client configuration matches your public IP
2. Check firewall rules allow UDP port 1194
3. Ensure NAT/port forwarding is configured on router

### Management Interface Issues

1. Check if port 7505 is accessible:
   ```bash
   telnet localhost 7505
   ```

2. Verify management interface configuration in `openvpn.conf`:
   ```
   management 0.0.0.0 7505
   ```

### Log Analysis

Check container logs:
```bash
docker logs openvpn-server
```

Monitor OpenVPN status:
```bash
docker exec openvpn-server cat /etc/openvpn/openvpn-status.log
```

## Security Considerations

1. **Change Default PKI Values**: Update the certificate subject information in `Dockerfile.openvpn`
2. **Secure Management Interface**: Consider restricting access to localhost only in production
3. **Certificate Expiry**: Monitor certificate expiration dates and renew as needed
4. **Regular Updates**: Keep the base `kylemanna/openvpn` image updated
5. **Firewall Rules**: Limit access to management port (7505) to authorized systems only

## Performance Tuning

For high-traffic deployments:

1. **Increase Worker Processes**: Add `--workers 2` to OpenVPN configuration
2. **Optimize Cipher**: Consider ChaCha20-Poly1305 for better performance on some systems
3. **Adjust Buffer Sizes**: Fine-tune `--sndbuf` and `--rcvbuf` parameters
4. **Monitor Resources**: Use `docker stats` to monitor container resource usage

## Backup and Recovery

### Backup PKI Data

```bash
docker run -v openvpn-data:/etc/openvpn --rm alpine tar czf - /etc/openvpn/pki > openvpn-pki-backup.tar.gz
```

### Restore PKI Data

```bash
docker run -v openvpn-data:/etc/openvpn --rm -i alpine tar xzf - < openvpn-pki-backup.tar.gz
```

## Advanced Configuration

### Custom OpenVPN Configuration

To add custom OpenVPN directives, modify the `openvpn-init.sh` script or mount a custom configuration file:

```bash
echo "custom-directive value" >> /etc/openvpn/openvpn.conf
```

### Multi-Protocol Support

To support both UDP and TCP:

```yaml
services:
  openvpn-udp:
    # UDP configuration (port 1194)
  openvpn-tcp:
    # TCP configuration (port 443)
```

## Support

For issues specific to this OpenVPN setup, check:
1. Container logs: `docker logs openvpn-server`
2. OpenVPN status: `/etc/openvpn/openvpn-status.log`
3. Management interface: `telnet localhost 7505`

For general OpenVPN questions, refer to:
- [OpenVPN Documentation](https://openvpn.net/community-resources/)
- [kylemanna/openvpn GitHub](https://github.com/kylemanna/docker-openvpn)