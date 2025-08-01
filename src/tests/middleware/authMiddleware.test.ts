import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { authMiddleware } from "../../middleware/authMiddleware";

describe("Auth Middleware", () => {
  let app: Elysia;

  // Create a test app that uses the auth middleware and adds a simple
  // endpoint that will only be accessible if the middleware allows it
  beforeAll(() => {
    app = authMiddleware.get("/secured", () => ({ message: "Authenticated" }));
  });

  describe("Authentication", () => {
    it("should allow requests with valid API key", async () => {
      const response = await app.handle(
        new Request("http://localhost/secured", {
          headers: { "x-api-key": "your-secure-api-key" },
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveProperty("message", "Authenticated");
    });

    it("should reject requests with invalid API key", async () => {
      const response = await app.handle(
        new Request("http://localhost/secured", {
          headers: { "x-api-key": "invalid-api-key" },
        })
      );

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body).toHaveProperty("error", "Unauthorized");
      expect(body).toHaveProperty("message", "Invalid or missing API key");
    });

    it("should reject requests with missing API key", async () => {
      const response = await app.handle(
        new Request("http://localhost/secured")
      );

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body).toHaveProperty("error", "Unauthorized");
      expect(body).toHaveProperty("message", "Invalid or missing API key");
    });
  });
});
