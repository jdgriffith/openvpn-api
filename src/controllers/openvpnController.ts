import { Elysia, t } from "elysia";
import { OpenVPNService } from "../services/openvpnService";

const openvpnService = new OpenVPNService();

export const openvpnController = new Elysia({ prefix: "/api/openvpn" })
  // Get all connected users
  .get("/users/connected", async () => {
    try {
      return await openvpnService.getConnectedUsers();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })

  // Get user status
  .get(
    "/users/:username",
    { params: t.Object({ username: t.String() }) },
    async ({ params: { username } }) => {
      try {
        return await openvpnService.getUserStatus(username);
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    }
  )

  // Create a new user
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
        return await openvpnService.createUser(username, password);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  )

  // Delete a user
  .delete(
    "/users/:username",
    { params: t.Object({ username: t.String() }) },
    async ({ params: { username } }) => {
      try {
        return await openvpnService.deleteUser(username);
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    }
  )

  // Reset user password
  .put(
    "/users/:username/password",
    {
      params: t.Object({ username: t.String() }),
      body: t.Object({ password: t.String() }),
    },
    async ({ params: { username }, body: { password } }) => {
      try {
        return await openvpnService.resetUserPassword(username, password);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  )

  // Enable/disable a user
  .put(
    "/users/:username/status",
    {
      params: t.Object({ username: t.String() }),
      body: t.Object({ enabled: t.Boolean() }),
    },
    async ({ params: { username }, body: { enabled } }) => {
      try {
        return await openvpnService.setUserStatus(username, enabled);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  )

  // Get server status
  .get("/server/status", async () => {
    try {
      return await openvpnService.getServerStatus();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })

  // Restart OpenVPN service
  .post("/server/restart", async () => {
    try {
      return await openvpnService.restartService();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })

  // Get user configuration profile
  .get(
    "/users/:username/profile",
    { params: t.Object({ username: t.String() }) },
    async ({ params: { username } }) => {
      try {
        return await openvpnService.getUserProfile(username);
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    }
  )

  // Get server configuration
  .get("/server/config", async () => {
    try {
      return await openvpnService.getServerConfig();
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  })

  // Update server configuration
  .put(
    "/server/config",
    {
      body: t.Object({
        config: t.Record(t.String(), t.Any()),
      }),
    },
    async ({ body: { config } }) => {
      try {
        return await openvpnService.updateServerConfig(config);
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    }
  );
