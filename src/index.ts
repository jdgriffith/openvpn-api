import { Elysia, t } from "elysia";
import { openvpnController } from "./controllers/openvpnController";
import { authMiddleware } from "./middleware/authMiddleware";

const app = new Elysia()
  // Apply authentication middleware to protect our API
  .use(authMiddleware)

  // Use OpenVPN controller
  .use(openvpnController)

  // Add a health check endpoint
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

  // Root endpoint
  .get("/", () => ({
    message: "Welcome to OpenVPN Dashboard API",
    documentation: "Visit /api-docs for API documentation",
    version: "1.0.0",
  }))

  // Error handling
  .onError(({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: "Not Found",
        message: "The requested resource does not exist",
      };
    }

    console.error(`Error: ${error.message}`);
    set.status = 500;
    return {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    };
  })

  // Start the server
  .listen(3000);

console.log(
  `🦊 OpenVPN Dashboard API is running at ${app.server?.hostname}:${app.server?.port}`
);
