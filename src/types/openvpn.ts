export interface OpenVPNUser {
  username: string;
  enabled: boolean;
  locked: boolean;
  lastLogin?: string;
  properties?: Record<string, any>;
}

export interface OpenVPNServerStatus {
  status: "running" | "stopped";
  connectedUsers: number;
  uptime: string;
  version: string;
  load?: {
    "1min": number;
    "5min": number;
    "15min": number;
  };
}

export interface OpenVPNServerConfig {
  [key: string]: any;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export type ServerStatus = {
  status: "running" | "stopped" | "error";
  version?: string;
  uptime?: string;
  connectedClients?: number;
  load?: {
    cpu: number;
    memory: number;
  };
};

export type ServerConfig = {
  [key: string]: any;
};

export type UserProfile = {
  profile: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
};
