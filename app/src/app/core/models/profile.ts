export interface Profile {
  id: string;
  name: string;
  description?: string;
  server: string;
  port: number;
  protocol: 'udp' | 'tcp';
  cipher: string;
  ca?: string;
  cert?: string;
  key?: string;
  tlsAuth?: string;
  compLzo?: boolean;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  maxConnections?: number;
  dnsServers?: string[];
}
