export interface Profile {
  id: string;
  name: string;
  description?: string;
  server: string;
  port: number;
  protocol: 'udp' | 'tcp';
  cipher: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  maxConnections?: number;
  dnsServers?: string[];
}
