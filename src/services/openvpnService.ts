import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { OpenVPNUser, OpenVPNServerStatus } from "../types/openvpn";
import { db, schema } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { env } from "../utils/env";

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);
const readdirAsync = promisify(fs.readdir);

/**
 * Service to interact with OpenVPN Community Edition using PostgreSQL for user management
 */
export class OpenVPNService {
  // Paths configured from environment variables
  private readonly configDir = env.OPENVPN_CONFIG_DIR;
  private readonly statusLogPath = env.OPENVPN_STATUS_LOG;
  private readonly easyRsaPath = env.EASYRSA_PATH;
  private readonly clientConfigDir = path.join(env.OPENVPN_CONFIG_DIR, "client-configs");
  private readonly managementSocket = env.OPENVPN_MANAGEMENT_SOCKET;

  constructor() {
    // Ensure necessary directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      const dirs = [this.clientConfigDir];
      for (const dir of dirs) {
        try {
          await accessAsync(dir);
        } catch (error) {
          await mkdirAsync(dir, { recursive: true });
        }
      }
    } catch (error) {
      console.error(`Failed to create necessary directories: ${error.message}`);
    }
  }

  /**
   * Parse the OpenVPN status log to get connected users
   */
  private async parseStatusLog(): Promise<any> {
    try {
      const data = await readFileAsync(this.statusLogPath, 'utf8');
      const lines = data.split('\n');

      const clients = [];
      let clientSection = false;

      for (const line of lines) {
        if (line.startsWith("ROUTING TABLE")) {
          clientSection = false;
        }

        if (clientSection && line.trim().length > 0) {
          const [clientName, ipAddress, bytesReceived, bytesSent, connectedSince] = line.split(',');
          clients.push({
            username: clientName,
            ipAddress,
            bytesReceived: parseInt(bytesReceived, 10),
            bytesSent: parseInt(bytesSent, 10),
            connectedSince: new Date(parseInt(connectedSince, 10) * 1000).toISOString()
          });
        }

        if (line.startsWith("CLIENT LIST")) {
          clientSection = true;
        }
      }

      return clients;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // Status log not found, no clients connected
      }
      throw new Error(`Failed to parse status log: ${error.message}`);
    }
  }

  /**
   * Get connected users
   */
  async getConnectedUsers(): Promise<any> {
    try {
      const clients = await this.parseStatusLog();

      // For each connected client, update the last login time in the database
      for (const client of clients) {
        const user = await db.query.vpnUsers.findFirst({
          where: eq(schema.vpnUsers.username, client.username)
        });

        if (user) {
          await db.update(schema.vpnUsers)
            .set({ last_login: new Date(client.connectedSince) })
            .where(eq(schema.vpnUsers.username, client.username));

          // Also log the connection in the connection logs
          await db.insert(schema.connectionLogs).values({
            user_id: user.id,
            connected_at: new Date(client.connectedSince),
            ip_address: client.ipAddress,
            bytes_sent: client.bytesSent,
            bytes_received: client.bytesReceived
          });
        }
      }

      return { users: clients };
    } catch (error) {
      throw new Error(`Failed to get connected users: ${error.message}`);
    }
  }

  /**
   * Get user status
   */
  async getUserStatus(username: string): Promise<any> {
    try {
      // Get user from database
      const user = await db.query.vpnUsers.findFirst({
        where: eq(schema.vpnUsers.username, username)
      });

      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Check if user is currently connected
      const connectedUsers = await this.parseStatusLog();
      const userConnected = connectedUsers.find(u => u.username === username);

      // Get certificate information
      const certificate = await db.query.certificates.findFirst({
        where: and(
          eq(schema.certificates.user_id, user.id),
          eq(schema.certificates.revoked, false)
        )
      });

      return {
        username,
        enabled: user.enabled,
        locked: !user.enabled,
        lastLogin: user.last_login?.toISOString(),
        connected: !!userConnected,
        properties: userConnected || {},
        hasCertificate: !!certificate,
        certificateExpiry: certificate?.expires_at?.toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get status for user ${username}: ${error.message}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(username: string, password: string): Promise<any> {
    try {
      // Verify username doesn't contain special characters
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new Error("Username can only contain letters, numbers, underscores, and hyphens");
      }

      // Check if user already exists in the database
      const existingUser = await db.query.vpnUsers.findFirst({
        where: eq(schema.vpnUsers.username, username)
      });

      if (existingUser) {
        throw new Error(`User ${username} already exists`);
      }

      // Generate client certificate and key
      const { clientCert, clientKey } = await this.generateCertificateAndKey(username);

      // Insert user into the database
      const [newUser] = await db.insert(schema.vpnUsers).values({
        username,
        password, // In production, you should hash this
        enabled: true
      }).returning();

      // Store the certificate in the database
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + 3); // 3 years validity

      await db.insert(schema.certificates).values({
        user_id: newUser.id,
        certificate_data: clientCert,
        private_key: clientKey,
        created_at: now,
        expires_at: expiryDate
      });

      // Generate client config file
      await this.generateClientConfig(username);

      return { username, success: true, message: `User ${username} created successfully` };
    } catch (error) {
      throw new Error(`Failed to create user ${username}: ${error.message}`);
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(username: string): Promise<any> {
    try {
      // Find user in database
      const user = await db.query.vpnUsers.findFirst({
        where: eq(schema.vpnUsers.username, username)
      });

      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Mark certificates as revoked
      await db.update(schema.certificates)
        .set({ revoked: true, revoked_at: new Date() })
        .where(eq(schema.certificates.user_id, user.id));

      // Delete user from database
      await db.delete(schema.vpnUsers).where(eq(schema.vpnUsers.username, username));

      // Revoke user certificate in OpenVPN
      await execAsync(`cd ${this.easyRsaPath} && ./easyrsa revoke ${username}`);
      await execAsync(`cd ${this.easyRsaPath} && ./easyrsa gen-crl`);

      // Delete client config
      const clientConfigPath = path.join(this.clientConfigDir, `${username}.ovpn`);
      try {
        await promisify(fs.unlink)(clientConfigPath);
      } catch (error) {
        console.error(`Failed to delete client config: ${error.message}`);
      }

      // Kill any active connections for this user
      try {
        await execAsync(`echo 'kill ${username}' | nc -U ${this.managementSocket}`);
      } catch (error) {
        console.warn(`Failed to kill connection for ${username}: ${error.message}`);
      }

      return { success: true, message: `User ${username} deleted successfully` };
    } catch (error) {
      throw new Error(`Failed to delete user ${username}: ${error.message}`);
    }
  }

  /**
   * Reset user password
   */
  async resetUserPassword(username: string, password: string): Promise<any> {
    try {
      // Check if user exists in database
      const user = await db.query.vpnUsers.findFirst({
        where: eq(schema.vpnUsers.username, username)
      });

      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Update user password in database
      await db.update(schema.vpnUsers)
        .set({
          password, // In production, you should hash this
          updated_at: new Date()
        })
        .where(eq(schema.vpnUsers.username, username));

      return { success: true, message: `Password for user ${username} reset successfully` };
    } catch (error) {
      throw new Error(`Failed to reset password for user ${username}: ${error.message}`);
    }
  }

  /**
   * Enable/disable a user
   */
  async setUserStatus(username: string, enabled: boolean): Promise<any> {
    try {
      // Find user in database
      const user = await db.query.vpnUsers.findFirst({
        where: eq(schema.vpnUsers.username, username)
      });

      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Update user enabled status in database
      await db.update(schema.vpnUsers)
        .set({
          enabled,
          updated_at: new Date()
        })
        .where(eq(schema.vpnUsers.username, username));

      // If disabling, kill active connections
      if (!enabled) {
        try {
          await execAsync(`echo 'kill ${username}' | nc -U ${this.managementSocket}`);
        } catch (error) {
          console.warn(`Failed to kill connection for ${username}: ${error.message}`);
        }
      }

      return { success: true, message: `User ${username} ${enabled ? 'enabled' : 'disabled'} successfully` };
    } catch (error) {
      throw new Error(`Failed to set status for user ${username}: ${error.message}`);
    }
  }

  /**
   * Get server status
   */
  async getServerStatus(): Promise<OpenVPNServerStatus> {
    try {
      // Check if OpenVPN is running
      const { stdout } = await execAsync('systemctl is-active openvpn');
      const isRunning = stdout.trim() === 'active';

      if (!isRunning) {
        return {
          status: 'stopped',
          connectedUsers: 0,
          uptime: '0',
          version: await this.getOpenVPNVersion()
        };
      }

      // Get uptime
      const { stdout: uptimeOutput } = await execAsync('systemctl show openvpn --property=ActiveState,ActiveEnterTimestamp');
      const uptimeLines = uptimeOutput.split('\n');
      const activeEnterTimestampLine = uptimeLines.find(line => line.startsWith('ActiveEnterTimestamp='));

      let uptime = '0';
      if (activeEnterTimestampLine) {
        const timestampStr = activeEnterTimestampLine.split('=')[1];
        const startTime = new Date(timestampStr);
        const uptimeMs = Date.now() - startTime.getTime();
        const uptimeSec = Math.floor(uptimeMs / 1000);
        uptime = `${uptimeSec}`;
      }

      // Get connected users count
      const clients = await this.parseStatusLog();

      // Get system load
      const { stdout: loadOutput } = await execAsync('cat /proc/loadavg');
      const loadParts = loadOutput.split(' ');

      // Get total registered users
      const totalUsers = await db.select({
        count: sql<number>`count(*)`
      }).from(schema.vpnUsers);

      // Get recent connections
      const recentConnections = await db.select()
        .from(schema.connectionLogs)
        .orderBy(desc(schema.connectionLogs.connected_at))
        .limit(10);

      return {
        status: 'running',
        connectedUsers: clients.length,
        totalUsers: totalUsers[0].count,
        recentConnections: recentConnections.length,
        uptime,
        version: await this.getOpenVPNVersion(),
        load: {
          '1min': parseFloat(loadParts[0]),
          '5min': parseFloat(loadParts[1]),
          '15min': parseFloat(loadParts[2]),
        }
      };
    } catch (error) {
      throw new Error(`Failed to get server status: ${error.message}`);
    }
  }

  /**
   * Restart OpenVPN service
   */
  async restartService(): Promise<any> {
    try {
      await execAsync('systemctl restart openvpn');
      return { success: true, message: "OpenVPN service restarted" };
    } catch (error) {
      throw new Error(`Failed to restart OpenVPN service: ${error.message}`);
    }
  }

  /**
   * Get user configuration profile
   */
  async getUserProfile(username: string): Promise<any> {
    try {
      // Check if user exists in database
      const user = await db.query.vpnUsers.findFirst({
        where: eq(schema.vpnUsers.username, username)
      });

      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Check if client config exists
      const clientConfigPath = path.join(this.clientConfigDir, `${username}.ovpn`);
      try {
        await accessAsync(clientConfigPath);
      } catch (error) {
        // If client config doesn't exist, generate it
        await this.generateClientConfig(username);
      }

      const profileData = await readFileAsync(clientConfigPath, 'utf8');
      return { profile: profileData };
    } catch (error) {
      throw new Error(`Failed to get profile for user ${username}: ${error.message}`);
    }
  }

  /**
   * Get server configuration
   */
  async getServerConfig(): Promise<any> {
    try {
      // First check if we have config in the database
      const dbConfig = await db.select().from(schema.serverConfig);

      if (dbConfig.length > 0) {
        // Convert to key-value object
        const config = dbConfig.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        return config;
      }

      // If not in DB, read from file and populate DB
      const serverConfigPath = path.join(this.configDir, 'server.conf');
      const serverConfig = await readFileAsync(serverConfigPath, 'utf8');

      // Parse config into key-value pairs
      const config = {};
      const lines = serverConfig.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes(' ')) {
          const [key, ...valueParts] = trimmedLine.split(' ');
          config[key] = valueParts.join(' ');

          // Add to database
          await db.insert(schema.serverConfig).values({
            key,
            value: valueParts.join(' '),
            description: `Imported from ${serverConfigPath}`
          });
        } else if (trimmedLine && !trimmedLine.startsWith('#')) {
          config[trimmedLine] = true;

          // Add to database
          await db.insert(schema.serverConfig).values({
            key: trimmedLine,
            value: "true",
            description: `Imported from ${serverConfigPath}`
          });
        }
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to get server configuration: ${error.message}`);
    }
  }

  /**
   * Update server configuration
   */
  async updateServerConfig(config: Record<string, any>): Promise<any> {
    try {
      // Update configuration in database
      for (const [key, value] of Object.entries(config)) {
        // Check if config exists
        const existingConfig = await db.query.serverConfig.findFirst({
          where: eq(schema.serverConfig.key, key)
        });

        if (existingConfig) {
          await db.update(schema.serverConfig)
            .set({
              value: value === true ? "true" : value === false ? "false" : String(value),
              updated_at: new Date()
            })
            .where(eq(schema.serverConfig.key, key));
        } else {
          await db.insert(schema.serverConfig).values({
            key,
            value: value === true ? "true" : value === false ? "false" : String(value),
            description: "Added via dashboard"
          });
        }
      }

      // Also update the physical server.conf file
      const serverConfigPath = path.join(this.configDir, 'server.conf');

      // Get all config from database
      const dbConfig = await db.select().from(schema.serverConfig);

      // Build the config file content
      let configContent = "# OpenVPN server configuration\n";
      configContent += "# Generated by VPN Dashboard\n\n";

      for (const item of dbConfig) {
        if (item.value === "true") {
          configContent += `${item.key}\n`;
        } else if (item.value === "false") {
          configContent += `# ${item.key} (disabled)\n`;
        } else {
          configContent += `${item.key} ${item.value}\n`;
        }
      }

      // Write updated config
      await writeFileAsync(serverConfigPath, configContent);

      return { success: true, message: "Server configuration updated" };
    } catch (error) {
      throw new Error(`Failed to update server configuration: ${error.message}`);
    }
  }

  /**
   * Generate client certificate and key
   */
  private async generateCertificateAndKey(username: string): Promise<{ clientCert: string, clientKey: string }> {
    try {
      // Generate client certificate and key
      await execAsync(`cd ${this.easyRsaPath} && ./easyrsa build-client-full ${username} nopass`);

      // Read client certificate
      const clientCert = await readFileAsync(
        path.join(this.easyRsaPath, 'pki', 'issued', `${username}.crt`),
        'utf8'
      );

      // Read client key
      const clientKey = await readFileAsync(
        path.join(this.easyRsaPath, 'pki', 'private', `${username}.key`),
        'utf8'
      );

      return { clientCert, clientKey };
    } catch (error) {
      throw new Error(`Failed to generate certificate and key for ${username}: ${error.message}`);
    }
  }

  /**
   * Generate a client configuration file
   */
  private async generateClientConfig(username: string): Promise<void> {
    try {
      // Get user from database to verify it exists
      const user = await db.query.vpnUsers.findFirst({
        where: eq(schema.vpnUsers.username, username)
      });

      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Get certificate for this user
      const certificate = await db.query.certificates.findFirst({
        where: and(
          eq(schema.certificates.user_id, user.id),
          eq(schema.certificates.revoked, false)
        )
      });

      if (!certificate) {
        throw new Error(`No valid certificate found for user ${username}`);
      }

      const clientTemplate = path.join(this.configDir, 'client-template.txt');
      const clientConfig = path.join(this.clientConfigDir, `${username}.ovpn`);

      // Read client template
      let template;
      try {
        template = await readFileAsync(clientTemplate, 'utf8');
      } catch (error) {
        template = `client
dev tun
proto udp
remote SERVER_ADDRESS 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
auth SHA256
key-direction 1
verb 3`;
      }

      // Replace placeholder with actual server address
      // In production, this should be retrieved from environment variables or configuration
      const serverConfig = await db.query.serverConfig.findFirst({
        where: eq(schema.serverConfig.key, "server_address")
      });

      const serverAddress = serverConfig?.value || "your.server.address";
      template = template.replace(/SERVER_ADDRESS/g, serverAddress);

      // Read CA certificate
      const caCert = await readFileAsync(path.join(this.easyRsaPath, 'pki', 'ca.crt'), 'utf8');

      // Get client cert and key from database
      const clientCert = certificate.certificate_data;
      const clientKey = certificate.private_key;

      // Read TLS auth key
      const tlsAuthKey = await readFileAsync(path.join(this.configDir, 'ta.key'), 'utf8');

      // Combine into single .ovpn file
      const config = `${template}

<ca>
${caCert}
</ca>

<cert>
${clientCert}
</cert>

<key>
${clientKey}
</key>

<tls-auth>
${tlsAuthKey}
</tls-auth>`;

      await writeFileAsync(clientConfig, config);
    } catch (error) {
      throw new Error(`Failed to generate client config for ${username}: ${error.message}`);
    }
  }

  /**
   * Get OpenVPN version
   */
  private async getOpenVPNVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('openvpn --version');
      const versionMatch = stdout.match(/OpenVPN\s+(\d+\.\d+\.\d+)/);
      return versionMatch ? 'unknown' : versionMatch[1];
    } catch (error) {
      return 'unknown';
    }
  }
}
