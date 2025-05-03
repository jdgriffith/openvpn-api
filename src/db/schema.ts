import { pgTable, serial, text, boolean, timestamp, varchar } from "drizzle-orm/pg-core";

// Users table to store OpenVPN user information
export const vpnUsers = pgTable("vpn_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  last_login: timestamp("last_login"),
});

// Client certificates table to store certificate information for each user
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => vpnUsers.id).notNull(),
  certificate_data: text("certificate_data").notNull(),
  private_key: text("private_key").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  revoked: boolean("revoked").notNull().default(false),
  revoked_at: timestamp("revoked_at"),
});

// Connection logs to track user connection history
export const connectionLogs = pgTable("connection_logs", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => vpnUsers.id).notNull(),
  connected_at: timestamp("connected_at").defaultNow(),
  disconnected_at: timestamp("disconnected_at"),
  ip_address: varchar("ip_address", { length: 45 }),
  bytes_sent: serial("bytes_sent").default(0),
  bytes_received: serial("bytes_received").default(0),
});

// Server configuration table to store OpenVPN server settings
export const serverConfig = pgTable("server_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updated_at: timestamp("updated_at").defaultNow(),
});