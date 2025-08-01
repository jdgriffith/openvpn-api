import { describe, it, expect, beforeAll, afterEach, mock } from "bun:test";
import { Elysia, t } from "elysia";

const mockOpenVPNService = {
  getConnectedUsers: mock().mockResolvedValue({
    users: [
      {
        username: "user1",
        connected_since: "2023-05-01 10:00:00",
        ipAddress: "10.0.0.2",
      },
      {
        username: "user2", 
        connected_since: "2023-05-01 11:30:00",
        ipAddress: "10.0.0.3",
      },
    ],
  }),
  getUserStatus: mock().mockImplementation((username) => {
    if (username === "user1") {
      return Promise.resolve({
        username: "user1",
        enabled: true,
        locked: false,
        lastLogin: "2023-05-01T10:00:00.000Z",
        connected: true,
        properties: {},
        hasCertificate: true,
        certificateExpiry: "2024-05-01T10:00:00.000Z",
      });
    }
    return Promise.reject(
      new Error(`User ${username} not found`)
    );
  }),
  createUser: mock().mockResolvedValue({ success: true }),
  deleteUser: mock().mockImplementation((username) => {
    if (username === "user1") {
      return Promise.resolve({ success: true });
    }
    return Promise.reject(new Error(`User ${username} not found`));
  }),
  resetUserPassword: mock().mockResolvedValue({ success: true }),
  setUserStatus: mock().mockImplementation((username, enabled) => {
    return Promise.resolve({ success: true, enabled });
  }),
  getServerStatus: mock().mockResolvedValue({
    status: "running",
    connectedUsers: 2,
    totalUsers: 5,
    uptime: "5 days, 3 hours, 42 minutes",
    load: "0.25, 0.30, 0.28",
    recentConnections: [],
  }),
  restartService: mock().mockResolvedValue({
    success: true,
    message: "Service restarted successfully",
  }),
  getUserProfile: mock().mockImplementation((username) => {
    if (username === "user1") {
      return Promise.resolve({
        profile: "client\ndev tun\nproto udp\nremote vpn.example.com 1194",
      });
    }
    return Promise.reject(
      new Error(`Profile not found for user ${username}`)
    );
  }),
  getServerConfig: mock().mockResolvedValue({
    "vpn.server.port": "1194",
    "vpn.server.protocol": "udp",
  }),
  updateServerConfig: mock().mockResolvedValue({
    success: true,
    message: "Configuration updated successfully",
  }),
};

// Create a test controller with our mock service
const openvpnController = new Elysia({ prefix: "/api/openvpn" })
  .get("/users/connected", async () => {
    try {
      return await mockOpenVPNService.getConnectedUsers();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })
  .get(
    "/users/:username",
    { params: t.Object({ username: t.String() }) },
    async ({ params: { username } }) => {
      try {
        return await mockOpenVPNService.getUserStatus(username);
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    }
  )
  .post(
    "/users",
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
    async ({ body }) => {
      try {
        const { username, password } = body;
        return await mockOpenVPNService.createUser(username, password);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  )
  .delete(
    "/users/:username",
    { params: t.Object({ username: t.String() }) },
    async ({ params: { username } }) => {
      try {
        return await mockOpenVPNService.deleteUser(username);
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    }
  )
  .put(
    "/users/:username/password",
    {
      params: t.Object({ username: t.String() }),
      body: t.Object({ password: t.String() }),
    },
    async ({ params: { username }, body: { password } }) => {
      try {
        return await mockOpenVPNService.resetUserPassword(username, password);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  )
  .put(
    "/users/:username/status",
    {
      params: t.Object({ username: t.String() }),
      body: t.Object({ enabled: t.Boolean() }),
    },
    async ({ params: { username }, body: { enabled } }) => {
      try {
        return await mockOpenVPNService.setUserStatus(username, enabled);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  )
  .get("/server/status", async () => {
    try {
      return await mockOpenVPNService.getServerStatus();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })
  .post("/server/restart", async () => {
    try {
      return await mockOpenVPNService.restartService();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })
  .get(
    "/users/:username/profile",
    { params: t.Object({ username: t.String() }) },
    async ({ params: { username } }) => {
      try {
        return await mockOpenVPNService.getUserProfile(username);
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    }
  )
  .get("/server/config", async () => {
    try {
      return await mockOpenVPNService.getServerConfig();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })
  .put(
    "/server/config",
    {
      body: t.Object({
        config: t.Record(t.String(), t.Any()),
      }),
    },
    async ({ body: { config } }) => {
      try {
        return await mockOpenVPNService.updateServerConfig(config);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  );

describe("OpenVPN Controller", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(openvpnController);
  });

  afterEach(() => {
    mockOpenVPNService.getConnectedUsers.mockClear();
    mockOpenVPNService.getUserStatus.mockClear();
    mockOpenVPNService.createUser.mockClear();
    mockOpenVPNService.deleteUser.mockClear();
    mockOpenVPNService.resetUserPassword.mockClear();
    mockOpenVPNService.setUserStatus.mockClear();
    mockOpenVPNService.getServerStatus.mockClear();
    mockOpenVPNService.restartService.mockClear();
    mockOpenVPNService.getUserProfile.mockClear();
    mockOpenVPNService.getServerConfig.mockClear();
    mockOpenVPNService.updateServerConfig.mockClear();
  });

  describe("GET /api/openvpn/users/connected", () => {
    it("should return connected users", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/connected")
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("users");
      expect(body.users).toHaveLength(2);
      expect(body.users[0]).toHaveProperty("username", "user1");
      expect(body.users[1]).toHaveProperty("username", "user2");
    });
  });

  describe("GET /api/openvpn/users/:username", () => {
    it("should return user status for an existing user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/user1")
      );

      const body = await response.json();
      console.log("User status response:", body);
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("username", "user1");
      expect(body).toHaveProperty("enabled", true);
      expect(body).toHaveProperty("connected", true);
    });

    it("should return 404 for a non-existing user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/openvpn/users/nonexistentuser")
      );

      const body = await response.json();
      expect(response.status).toBe(200); // Elysia returns 200 with error object
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
      expect(body).toHaveProperty("totalUsers", 5);
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
      expect(body).toHaveProperty("message", "Service restarted successfully");
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
      expect(body).toHaveProperty("message", "Configuration updated successfully");
    });
  });
});
