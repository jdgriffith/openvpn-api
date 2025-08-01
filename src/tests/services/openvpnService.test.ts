import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { OpenVPNService } from "../../services/openvpnService";
import { mockExecResponses } from "../mocks/childProcessMock";

// Mock child_process
const mockExec = mock((command: string, callback: any) => {
  const response = mockExecResponses[command] || {
    stdout: "",
    stderr: `Error: Command not found: ${command}`,
  };

  process.nextTick(() => {
    if (response.stderr) {
      callback(new Error(response.stderr), {
        stdout: "",
        stderr: response.stderr,
      });
    } else {
      callback(null, { stdout: response.stdout, stderr: response.stderr });
    }
  });

  return {
    stdout: { on: () => {} },
    stderr: { on: () => {} },
  };
});

mock.module("child_process", () => ({
  exec: mockExec,
}));

describe("OpenVPNService", () => {
  let openvpnService: OpenVPNService;

  beforeEach(() => {
    openvpnService = new OpenVPNService();
  });

  afterEach(() => {
    mockExec.mockClear();
  });

  describe("getConnectedUsers", () => {
    it("should return connected users", async () => {
      const users = await openvpnService.getConnectedUsers();
      expect(users).toEqual({ users: [] });
    });
  });

  describe("getUserStatus", () => {
    it("should return user status", async () => {
      const status = await openvpnService.getUserStatus("user1");
      expect(status).toEqual({
        username: "user1",
        type: "user_connect",
        prop_autologin: "true",
        prop_superuser: "false",
        prop_deny: "false",
      });
    });

    it("should throw an error if user doesn't exist", async () => {
      let error: Error | null = null;
      try {
        await openvpnService.getUserStatus("nonexistentuser");
      } catch (err) {
        error = err as Error;
      }
      expect(error).not.toBeNull();
      expect(error?.message).toContain("Failed to get status for user");
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const result = await openvpnService.createUser("testuser", "password");
      expect(result).toEqual({ success: true });
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      const result = await openvpnService.deleteUser("user1");
      expect(result).toEqual({ success: true });
    });
  });

  describe("resetUserPassword", () => {
    it("should reset user password", async () => {
      const result = await openvpnService.resetUserPassword(
        "user1",
        "newpassword"
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("setUserStatus", () => {
    it("should enable a user", async () => {
      const result = await openvpnService.setUserStatus("user1", true);
      expect(result).toEqual({ success: true, enabled: true });
    });

    it("should disable a user", async () => {
      const result = await openvpnService.setUserStatus("user1", false);
      expect(result).toEqual({ success: true, enabled: false });
    });
  });

  describe("getServerStatus", () => {
    it("should return server status", async () => {
      const status = await openvpnService.getServerStatus();
      expect(status).toEqual({
        status: "running",
        connectedUsers: 2,
        uptime: "5 days, 3 hours, 42 minutes",
        version: "2.8.7",
      });
    });
  });

  describe("restartService", () => {
    it("should restart the service", async () => {
      const result = await openvpnService.restartService();
      expect(result).toEqual({
        success: true,
        message: "Service restarted",
      });
    });
  });

  describe("getUserProfile", () => {
    it("should return user profile", async () => {
      const profile = await openvpnService.getUserProfile("user1");
      expect(profile).toEqual({
        profile: "client\ndev tun\nproto udp\nremote vpn.example.com 1194",
      });
    });
  });

  describe("getServerConfig", () => {
    it("should return server config", async () => {
      const config = await openvpnService.getServerConfig();
      expect(config).toEqual({
        "vpn.server.port": "1194",
        "vpn.server.protocol": "udp",
      });
    });
  });

  describe("updateServerConfig", () => {
    it("should update server config", async () => {
      const result = await openvpnService.updateServerConfig({
        "vpn.server.port": "1195",
      });
      expect(result).toEqual({
        success: true,
        message: "Configuration updated",
      });
    });
  });
});
