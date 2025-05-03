import { describe, it, expect, jest, beforeAll, afterEach } from "bun:test";
import { Elysia } from "elysia";
import { openvpnController } from "../../controllers/openvpnController";
import { OpenVPNService } from "../../services/openvpnService";

// Mock the OpenVPNService
jest.mock("../../services/openvpnService", () => {
  return {
    OpenVPNService: jest.fn().mockImplementation(() => ({
      getConnectedUsers: jest.fn().mockResolvedValue({
        user1: {
          connected_since: "2023-05-01 10:00:00",
          ip_address: "10.0.0.2",
        },
        user2: {
          connected_since: "2023-05-01 11:30:00",
          ip_address: "10.0.0.3",
        },
      }),
      getUserStatus: jest.fn().mockImplementation((username) => {
        if (username === "user1") {
          return Promise.resolve({
            username: "user1",
            type: "user_connect",
            prop_autologin: "true",
            prop_superuser: "false",
            prop_deny: "false",
          });
        }
        return Promise.reject(
          new Error(`Failed to get status for user ${username}`)
        );
      }),
      createUser: jest.fn().mockResolvedValue({ success: true }),
      deleteUser: jest.fn().mockImplementation((username) => {
        if (username === "user1") {
          return Promise.resolve({ success: true });
        }
        return Promise.reject(new Error(`Failed to delete user ${username}`));
      }),
      resetUserPassword: jest.fn().mockResolvedValue({ success: true }),
      setUserStatus: jest.fn().mockImplementation((username, enabled) => {
        return Promise.resolve({ success: true, enabled });
      }),
      getServerStatus: jest.fn().mockResolvedValue({
        status: "running",
        connectedUsers: 2,
        uptime: "5 days, 3 hours, 42 minutes",
        version: "2.8.7",
      }),
      restartService: jest.fn().mockResolvedValue({
        success: true,
        message: "Service restarted",
      }),
      getUserProfile: jest.fn().mockImplementation((username) => {
        if (username === "user1") {
          return Promise.resolve({
            profile: "client\ndev tun\nproto udp\nremote vpn.example.com 1194",
          });
        }
        return Promise.reject(
          new Error(`Failed to get profile for user ${username}`)
        );
      }),
      getServerConfig: jest.fn().mockResolvedValue({
        "vpn.server.port": "1194",
        "vpn.server.protocol": "udp",
      }),
      updateServerConfig: jest.fn().mockResolvedValue({
        success: true,
        message: "Configuration updated",
      }),
    })),
  };
});

describe("OpenVPN Controller", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(openvpnController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/openvpn/users/connected", () => {
    it("should return connected users", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/connected")
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("user1");
      expect(body).toHaveProperty("user2");
    });
  });

  describe("GET /api/openvpn/users/:username", () => {
    it("should return user status for an existing user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/user1")
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("username", "user1");
    });

    it("should return 404 for a non-existing user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/nonexistentuser")
      );

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("status", 404);
    });
  });

  describe("POST /api/openvpn/users", () => {
    it("should create a new user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "newuser",
            password: "password123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
    });
  });

  describe("DELETE /api/openvpn/users/:username", () => {
    it("should delete an existing user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/user1", {
          method: "DELETE",
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
    });

    it("should return 404 for a non-existing user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/nonexistentuser", {
          method: "DELETE",
        })
      );

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("status", 404);
    });
  });

  describe("PUT /api/openvpn/users/:username/password", () => {
    it("should reset user password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/user1/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: "newpassword123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
    });
  });

  describe("PUT /api/openvpn/users/:username/status", () => {
    it("should enable a user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/user1/status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: true,
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("enabled", true);
    });

    it("should disable a user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/user1/status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: false,
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("enabled", false);
    });
  });

  describe("GET /api/openvpn/server/status", () => {
    it("should return server status", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/server/status")
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("status", "running");
      expect(body).toHaveProperty("connectedUsers", 2);
    });
  });

  describe("POST /api/openvpn/server/restart", () => {
    it("should restart the server", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/server/restart", {
          method: "POST",
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("message", "Service restarted");
    });
  });

  describe("GET /api/openvpn/users/:username/profile", () => {
    it("should return user profile", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/user1/profile")
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("profile");
    });
  });

  describe("GET /api/openvpn/server/config", () => {
    it("should return server configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/server/config")
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("vpn.server.port", "1194");
    });
  });

  describe("PUT /api/openvpn/server/config", () => {
    it("should update server configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/server/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              "vpn.server.port": "1195",
            },
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("message", "Configuration updated");
    });
  });
});
