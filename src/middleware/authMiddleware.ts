import { Elysia } from "elysia";

// Simple API key authentication middleware
export const authMiddleware = new Elysia()
  .derive(({ headers }) => {
    // In a real application, you would verify this against a database or environment variable
    // and use a more secure authentication method like JWT
    const apiKey = headers["x-api-key"];
    const isAuthenticated = apiKey === "your-secure-api-key";

    return {
      isAuthenticated,
      user: isAuthenticated ? { id: "admin", role: "admin" } : null,
    };
  })
  .guard({
    beforeHandle: ({ isAuthenticated, set }) => {
      if (!isAuthenticated) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "Invalid or missing API key",
        };
      }
    },
  });
