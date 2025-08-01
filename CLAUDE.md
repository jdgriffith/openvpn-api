# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a dual-architecture project consisting of:
1. **Backend API**: Node.js/Bun + Elysia web framework for OpenVPN management 
2. **Frontend**: Angular 19 application for the dashboard UI

The backend provides RESTful API endpoints to manage OpenVPN Community Edition users, certificates, and server configuration through a PostgreSQL database and direct system integration.

## Development Commands

### Backend API (Root Level)
- `bun run dev` - Start development server with hot reload
- `bun test` - Run all tests
- `bun test --watch` - Run tests in watch mode
- `bun run db:migrate` - Generate database migrations
- `bun run db:push` - Apply migrations to database

### Frontend App (app/ directory)
- `cd app && npm run start` - Start Angular development server
- `cd app && npm run build` - Build for production
- `cd app && npm run test` - Run Angular tests
- `cd app && npm run watch` - Build in watch mode

### Docker Environment
- `docker-compose up -d` - Start PostgreSQL and OpenVPN containers
- `docker-compose down` - Stop all containers

## Architecture & Key Components

### Backend Structure
- **Framework**: Elysia (lightweight TypeScript web framework)
- **Database**: PostgreSQL 17 with Drizzle ORM
- **Authentication**: API key middleware (`src/middleware/authMiddleware.ts`)
- **Core Service**: `OpenVPNService` class handles all VPN operations
- **System Integration**: Direct shell commands to OpenVPN and EasyRSA

### Data Models (src/db/schema.ts)
- `vpnUsers` - VPN user accounts and status
- `certificates` - PKI certificates and keys for each user
- `connectionLogs` - Historical connection tracking
- `serverConfig` - OpenVPN server configuration parameters

### API Architecture
- **Controller**: `src/controllers/openvpnController.ts` - REST endpoints
- **Service Layer**: `src/services/openvpnService.ts` - Business logic and OpenVPN integration
- **Database Layer**: Drizzle ORM with PostgreSQL
- **System Layer**: Direct OpenVPN/EasyRSA command execution

### Frontend Structure (Angular 19)
- **Modular Architecture**: Feature modules (users, profiles, connections)
- **Components**: List/detail pattern for each entity type
- **Services**: HTTP client services for API communication
- **Routing**: Module-based routing with lazy loading

## Environment Configuration

The application expects these environment variables (configured in `src/utils/env.ts`):
- `DATABASE_URL` - PostgreSQL connection string
- `OPENVPN_CONFIG_DIR` - OpenVPN configuration directory path
- `OPENVPN_STATUS_LOG` - Path to OpenVPN status log file
- `EASYRSA_PATH` - Path to EasyRSA installation
- `OPENVPN_MANAGEMENT_SOCKET` - OpenVPN management interface socket

## Key Integration Points

### OpenVPN Integration
- Parses status logs for real-time connection data
- Executes EasyRSA commands for certificate management
- Uses management interface for killing connections
- Generates client configuration files (.ovpn)

### Database Operations
- User CRUD operations with certificate lifecycle management
- Connection logging and history tracking
- Server configuration storage and synchronization
- Certificate revocation and expiry management

## Testing Strategy

Tests are located in `src/tests/` with structure mirroring source:
- Controller tests mock the service layer
- Service tests mock child process execution and file system operations
- Middleware tests verify authentication logic
- Uses Bun's native test runner with mocking utilities

## Security Considerations

- API key authentication protects all endpoints
- Certificate management through EasyRSA PKI
- Database stores hashed passwords (implementation needed)
- File system operations are path-validated
- Shell command execution uses parameterized inputs