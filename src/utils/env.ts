import "dotenv/config";

// Environment variable configuration
export const env = {
  // Database
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://vpnadmin:vpnsecurepass@localhost:5432/vpn_dashboard",

  // OpenVPN
  OPENVPN_CONFIG_DIR: process.env.OPENVPN_CONFIG_DIR || "/etc/openvpn",
  OPENVPN_STATUS_LOG:
    process.env.OPENVPN_STATUS_LOG || "/var/log/openvpn/status.log",
  OPENVPN_MANAGEMENT_SOCKET:
    process.env.OPENVPN_MANAGEMENT_SOCKET || "/var/run/openvpn/management.sock",
  EASYRSA_PATH: process.env.EASYRSA_PATH || "/usr/share/easy-rsa",

  // Server
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Security
  JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
  SESSION_SECRET: process.env.SESSION_SECRET || "change-me-in-production",
};
