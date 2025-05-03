export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  role?: string;
}
