# OpenVPN Dashboard API Documentation

## Overview

This API provides management capabilities for OpenVPN Community Edition server, including user management, server configuration, and connection monitoring. The API is built with Elysia framework and runs on port 3000.

**Base URL:** `http://localhost:3000`

## Authentication

All API endpoints (except `/health` and `/`) require authentication via API key.

**Method:** API Key in header  
**Header:** `x-api-key`  
**Value:** `your-secure-api-key`

### Authentication Error Response
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

## Global Error Handling

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "The requested resource does not exist"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Public Endpoints

### Health Check
**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-31T12:00:00.000Z"
}
```

### Root Endpoint
**GET** `/`

Returns API information and welcome message.

**Response:**
```json
{
  "message": "Welcome to OpenVPN Dashboard API",
  "documentation": "Visit /api-docs for API documentation",
  "version": "1.0.0"
}
```

## OpenVPN API Endpoints

All OpenVPN endpoints are prefixed with `/api/openvpn` and require authentication.

### User Management

#### Get Connected Users
**GET** `/api/openvpn/users/connected`

Returns list of currently connected VPN users.

**Success Response (200):**
```json
{
  "users": [
    {
      "username": "john_doe",
      "ipAddress": "10.8.0.2",
      "bytesReceived": 1024000,
      "bytesSent": 512000,
      "connectedSince": "2025-07-31T10:30:00.000Z"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "error": "Failed to get connected users: {error details}",
  "status": 500
}
```

#### Get User Status
**GET** `/api/openvpn/users/:username`

Returns detailed status information for a specific user.

**Path Parameters:**
- `username` (string, required) - The username to query

**Success Response (200):**
```json
{
  "username": "john_doe",
  "enabled": true,
  "locked": false,
  "lastLogin": "2025-07-31T10:30:00.000Z",
  "connected": true,
  "properties": {
    "ipAddress": "10.8.0.2",
    "bytesReceived": 1024000,
    "bytesSent": 512000,
    "connectedSince": "2025-07-31T10:30:00.000Z"
  },
  "hasCertificate": true,
  "certificateExpiry": "2026-07-31T00:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Failed to get status for user {username}: {error details}",
  "status": 404
}
```

#### Create User
**POST** `/api/openvpn/users`

Creates a new VPN user with credentials and certificate.

**Request Body:**
```json
{
  "username": "new_user",
  "password": "secure_password"
}
```

**Success Response (200):**
```json
{
  "username": "new_user",
  "success": true,
  "message": "User new_user created successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Failed to create user {username}: {error details}",
  "status": 400
}
```

#### Delete User
**DELETE** `/api/openvpn/users/:username`

Deletes a VPN user and revokes their certificate.

**Path Parameters:**
- `username` (string, required) - The username to delete

**Success Response (200):**
```json
{
  "success": true,
  "message": "User {username} deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Failed to delete user {username}: {error details}",
  "status": 404
}
```

#### Reset User Password
**PUT** `/api/openvpn/users/:username/password`

Resets the password for an existing user.

**Path Parameters:**
- `username` (string, required) - The username to update

**Request Body:**
```json
{
  "password": "new_secure_password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password for user {username} reset successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Failed to reset password for user {username}: {error details}",
  "status": 400
}
```

#### Set User Status
**PUT** `/api/openvpn/users/:username/status`

Enable or disable a VPN user account.

**Path Parameters:**
- `username` (string, required) - The username to update

**Request Body:**
```json
{
  "enabled": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User {username} enabled successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Failed to set status for user {username}: {error details}",
  "status": 400
}
```

#### Get User Profile
**GET** `/api/openvpn/users/:username/profile`

Returns the OpenVPN client configuration file (.ovpn) for a user.

**Path Parameters:**
- `username` (string, required) - The username to get profile for

**Success Response (200):**
```json
{
  "profile": "client\ndev tun\nproto udp\nremote your-server.com 1194\n..."
}
```

**Error Response (404):**
```json
{
  "error": "Failed to get profile for user {username}: {error details}",
  "status": 404
}
```

### Server Management

#### Get Server Status
**GET** `/api/openvpn/server/status`

Returns OpenVPN server status and statistics.

**Success Response (200) - Server Running:**
```json
{
  "status": "running",
  "connectedUsers": 5,
  "totalUsers": 25,
  "recentConnections": 12,
  "uptime": "86400",
  "version": "OpenVPN 2.5.8",
  "load": {
    "1min": 0.5,
    "5min": 0.3,
    "15min": 0.2
  }
}
```

**Success Response (200) - Server Stopped:**
```json
{
  "status": "stopped",
  "connectedUsers": 0,
  "uptime": "0",
  "version": "OpenVPN 2.5.8"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to get server status: {error details}",
  "status": 500
}
```

#### Restart Server
**POST** `/api/openvpn/server/restart`

Restarts the OpenVPN service.

**Success Response (200):**
```json
{
  "success": true,
  "message": "OpenVPN service restarted"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to restart OpenVPN service: {error details}",
  "status": 500
}
```

#### Get Server Configuration
**GET** `/api/openvpn/server/config`

Returns the current OpenVPN server configuration.

**Success Response (200):**
```json
{
  "port": "1194",
  "proto": "udp",
  "dev": "tun",
  "server": "10.8.0.0 255.255.255.0",
  "push": ["redirect-gateway def1 bypass-dhcp", "dhcp-option DNS 8.8.8.8"],
  "keepalive": "10 120",
  "cipher": "AES-256-GCM",
  "user": "nobody",
  "group": "nogroup"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to get server configuration: {error details}",
  "status": 500
}
```

#### Update Server Configuration
**PUT** `/api/openvpn/server/config`

Updates the OpenVPN server configuration.

**Request Body:**
```json
{
  "config": {
    "port": "1194",
    "proto": "udp",
    "cipher": "AES-256-GCM",
    "custom_setting": "value"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server configuration updated"
}
```

**Error Response (400):**
```json
{
  "error": "Failed to update server configuration: {error details}",
  "status": 400
}
```

## Data Models

### User Object
```typescript
interface VPNUser {
  id: number;
  username: string;
  password: string;
  enabled: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  last_login?: string; // ISO 8601
}
```

### Certificate Object
```typescript
interface Certificate {
  id: number;
  user_id: number;
  certificate_data: string;
  private_key: string;
  created_at: string; // ISO 8601
  expires_at?: string; // ISO 8601
  revoked: boolean;
  revoked_at?: string; // ISO 8601
}
```

### Connection Log Object
```typescript
interface ConnectionLog {
  id: number;
  user_id: number;
  connected_at: string; // ISO 8601
  disconnected_at?: string; // ISO 8601
  ip_address?: string;
  bytes_sent: number;
  bytes_received: number;
}
```

### Server Config Object
```typescript
interface ServerConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string; // ISO 8601
}
```

## Client SDK Examples

### JavaScript/TypeScript Client Example

```typescript
class OpenVPNClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // User management
  async getConnectedUsers() {
    return this.request('/api/openvpn/users/connected');
  }

  async getUserStatus(username: string) {
    return this.request(`/api/openvpn/users/${username}`);
  }

  async createUser(username: string, password: string) {
    return this.request('/api/openvpn/users', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async deleteUser(username: string) {
    return this.request(`/api/openvpn/users/${username}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(username: string, password: string) {
    return this.request(`/api/openvpn/users/${username}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  async setUserStatus(username: string, enabled: boolean) {
    return this.request(`/api/openvpn/users/${username}/status`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async getUserProfile(username: string) {
    return this.request(`/api/openvpn/users/${username}/profile`);
  }

  // Server management
  async getServerStatus() {
    return this.request('/api/openvpn/server/status');
  }

  async restartServer() {
    return this.request('/api/openvpn/server/restart', {
      method: 'POST',
    });
  }

  async getServerConfig() {
    return this.request('/api/openvpn/server/config');
  }

  async updateServerConfig(config: Record<string, any>) {
    return this.request('/api/openvpn/server/config', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }
}

// Usage example
const client = new OpenVPNClient('http://localhost:3000', 'your-secure-api-key');

// Get server status
const serverStatus = await client.getServerStatus();
console.log('Server status:', serverStatus);

// Create a new user
const newUser = await client.createUser('testuser', 'securepassword');
console.log('User created:', newUser);

// Get connected users
const connectedUsers = await client.getConnectedUsers();
console.log('Connected users:', connectedUsers);
```

### Python Client Example

```python
import requests
import json
from typing import Dict, Any, Optional

class OpenVPNClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }

    def _request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            json=data if data else None
        )
        
        if not response.ok:
            error_data = response.json()
            raise Exception(error_data.get('message', 'API request failed'))
        
        return response.json()

    # User management
    def get_connected_users(self) -> Dict[str, Any]:
        return self._request('/api/openvpn/users/connected')

    def get_user_status(self, username: str) -> Dict[str, Any]:
        return self._request(f'/api/openvpn/users/{username}')

    def create_user(self, username: str, password: str) -> Dict[str, Any]:
        return self._request('/api/openvpn/users', 'POST', {
            'username': username,
            'password': password
        })

    def delete_user(self, username: str) -> Dict[str, Any]:
        return self._request(f'/api/openvpn/users/{username}', 'DELETE')

    def reset_user_password(self, username: str, password: str) -> Dict[str, Any]:
        return self._request(f'/api/openvpn/users/{username}/password', 'PUT', {
            'password': password
        })

    def set_user_status(self, username: str, enabled: bool) -> Dict[str, Any]:
        return self._request(f'/api/openvpn/users/{username}/status', 'PUT', {
            'enabled': enabled
        })

    def get_user_profile(self, username: str) -> Dict[str, Any]:
        return self._request(f'/api/openvpn/users/{username}/profile')

    # Server management
    def get_server_status(self) -> Dict[str, Any]:
        return self._request('/api/openvpn/server/status')

    def restart_server(self) -> Dict[str, Any]:
        return self._request('/api/openvpn/server/restart', 'POST')

    def get_server_config(self) -> Dict[str, Any]:
        return self._request('/api/openvpn/server/config')

    def update_server_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('/api/openvpn/server/config', 'PUT', {
            'config': config
        })

# Usage example
if __name__ == "__main__":
    client = OpenVPNClient('http://localhost:3000', 'your-secure-api-key')
    
    # Get server status
    server_status = client.get_server_status()
    print('Server status:', server_status)
    
    # Create a new user
    new_user = client.create_user('testuser', 'securepassword')
    print('User created:', new_user)
    
    # Get connected users
    connected_users = client.get_connected_users()
    print('Connected users:', connected_users)
```

## Rate Limiting and Best Practices

1. **Authentication**: Always include the `x-api-key` header with your API key
2. **Error Handling**: Implement proper error handling for all API calls
3. **Timeouts**: Set appropriate request timeouts for your client
4. **Retries**: Implement retry logic for failed requests with exponential backoff
5. **Logging**: Log API requests and responses for debugging purposes

## Environment Variables

The API requires the following environment variables to be configured:

- `DATABASE_URL` - PostgreSQL connection string
- `OPENVPN_CONFIG_DIR` - OpenVPN configuration directory path
- `OPENVPN_STATUS_LOG` - Path to OpenVPN status log file
- `EASYRSA_PATH` - Path to EasyRSA installation
- `OPENVPN_MANAGEMENT_SOCKET` - OpenVPN management interface socket

## Database Schema

The API uses PostgreSQL with the following tables:

- **vpn_users** - User accounts and authentication
- **certificates** - PKI certificates and keys for each user
- **connection_logs** - Historical connection tracking
- **server_config** - OpenVPN server configuration parameters

Refer to `/src/db/schema.ts` for the complete database schema definition.