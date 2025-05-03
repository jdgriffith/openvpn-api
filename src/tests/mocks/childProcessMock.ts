export const mockExecResponses: Record<
  string,
  { stdout: string; stderr: string }
> = {
  // Connected users mock
  "sacli GetUserlogin": {
    stdout: JSON.stringify({
      user1: { connected_since: "2023-05-01 10:00:00", ip_address: "10.0.0.2" },
      user2: { connected_since: "2023-05-01 11:30:00", ip_address: "10.0.0.3" },
    }),
    stderr: "",
  },
  // User properties mock
  "sacli UserPropGet --user=user1": {
    stdout: JSON.stringify({
      username: "user1",
      type: "user_connect",
      prop_autologin: "true",
      prop_superuser: "false",
      prop_deny: "false",
    }),
    stderr: "",
  },
  // User creation mock
  "sacli --user=testuser --pass=password --lock=0 UserPropPut": {
    stdout: JSON.stringify({ success: true }),
    stderr: "",
  },
  // User deletion mock
  "sacli --user=user1 UserDelete": {
    stdout: JSON.stringify({ success: true }),
    stderr: "",
  },
  // Reset password mock
  "sacli --user=user1 --new_pass=newpassword SetLocalPassword": {
    stdout: JSON.stringify({ success: true }),
    stderr: "",
  },
  // Enable user mock
  "sacli --user=user1 --lock=0 UserPropPut": {
    stdout: JSON.stringify({ success: true, enabled: true }),
    stderr: "",
  },
  // Disable user mock
  "sacli --user=user1 --lock=1 UserPropPut": {
    stdout: JSON.stringify({ success: true, enabled: false }),
    stderr: "",
  },
  // Server status mock
  "sacli VPNStatus": {
    stdout: JSON.stringify({
      status: "running",
      connectedUsers: 2,
      uptime: "5 days, 3 hours, 42 minutes",
      version: "2.8.7",
    }),
    stderr: "",
  },
  // Restart service mock
  "sacli start": {
    stdout: "Service restarted successfully",
    stderr: "",
  },
  // User profile mock
  "sacli --user=user1 GetUserlogin": {
    stdout:
      "client\ndev tun\nproto udp\nremote vpn.example.com 1194\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nca ca.crt\ncert user1.crt\nkey user1.key\nverb 3",
    stderr: "",
  },
  // Get server config mock
  "sacli ConfigQuery": {
    stdout: JSON.stringify({
      "vpn.server.port": "1194",
      "vpn.server.protocol": "udp",
      "vpn.client.routing": "nat",
      "vpn.daemon.enable": "true",
    }),
    stderr: "",
  },
  // Update server config mock
  "sacli --key=vpn.server.port --value=1195 ConfigPut": {
    stdout: JSON.stringify({ success: true }),
    stderr: "",
  },
};

// Mock execution function that will replace the real 'exec' function
export const mockExec = (command: string) => {
  return new Promise((resolve, reject) => {
    const response = mockExecResponses[command] || {
      stdout: "",
      stderr: `Error: Command not found: ${command}`,
    };

    if (response.stderr) {
      reject(new Error(response.stderr));
    } else {
      resolve({ stdout: response.stdout, stderr: response.stderr });
    }
  });
};
