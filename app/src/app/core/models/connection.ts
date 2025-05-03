export interface Connection {
  id: string;
  userId: string;
  ipAddress: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  bytesReceived: number;
  bytesSent: number;
  status: 'active' | 'disconnected';
  duration?: number; // in seconds
  deviceInfo?: string;
}
