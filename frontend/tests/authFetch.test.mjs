import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Mock minimal browser environment
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockStorage();
globalThis.sessionStorage = new MockStorage();
globalThis.document = {
  cookie: "",
};
globalThis.window = {
  location: { pathname: "/dashboard", href: "/dashboard" },
  dispatchEvent: () => {},
};

// Import authFetch dynamically after mocking globals
const { authFetch, setAccessToken, getAccessToken, clearAccessToken } = await import("../src/services/authFetch.js");

describe("authFetch and Token Refresh Logic", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    clearAccessToken();
    globalThis.window.location.href = "/dashboard";
    globalThis.window.location.pathname = "/dashboard";
  });

  test("1. Expired token (401) triggers silent refresh and retries successfully (200)", async () => {
    let refreshCalls = 0;
    let endpointCalls = 0;

    setAccessToken("expired_access_token");

    globalThis.fetch = async (url, options) => {
      if (url.includes("/api/refresh-token")) {
        refreshCalls++;
        return {
          ok: true,
          status: 200,
          json: async () => ({ token: "brand_new_token", user: { id: "u1", role: "Student" } }),
        };
      }

      if (url.includes("/api/students/profile")) {
        endpointCalls++;
        const authHeader = options?.headers?.Authorization;
        if (authHeader === "Bearer expired_access_token") {
          return { ok: false, status: 401, json: async () => ({ message: "Unauthorized" }) };
        }
        if (authHeader === "Bearer brand_new_token") {
          return { ok: true, status: 200, json: async () => ({ id: "u1", name: "Bondhon" }) };
        }
      }

      return { ok: false, status: 404 };
    };

    const res = await authFetch("http://localhost:5001/api/students/profile");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(refreshCalls, 1, "Expected exactly 1 refresh call");
    assert.strictEqual(endpointCalls, 2, "Expected 2 endpoint calls (1st failed 401, 2nd retried 200)");
    assert.strictEqual(getAccessToken(), "brand_new_token", "Memory access token must be updated");
  });

  test("2. 5 parallel 401 requests trigger exactly 1 single-flight /api/refresh-token call", async () => {
    let refreshCalls = 0;
    setAccessToken("expired_token");

    globalThis.fetch = async (url, options) => {
      if (url.includes("/api/refresh-token")) {
        refreshCalls++;
        // Simulate real network delay to test concurrency single-flight mutex
        await new Promise((r) => setTimeout(r, 40));
        return {
          ok: true,
          status: 200,
          json: async () => ({ token: "fresh_single_flight_token" }),
        };
      }

      const authHeader = options?.headers?.Authorization;
      if (authHeader === "Bearer expired_token") {
        return { ok: false, status: 401 };
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    };

    // Fire 5 simultaneous requests concurrently
    const promises = [
      authFetch("http://localhost:5001/api/data-1"),
      authFetch("http://localhost:5001/api/data-2"),
      authFetch("http://localhost:5001/api/data-3"),
      authFetch("http://localhost:5001/api/data-4"),
      authFetch("http://localhost:5001/api/data-5"),
    ];

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 5);
    results.forEach((r) => assert.strictEqual(r.status, 200));
    assert.strictEqual(refreshCalls, 1, "Single-flight mutex must ensure EXACTLY 1 refresh-token network call");
  });

  test("3. Refresh failure clears session and redirects to /login?reason=session_expired", async () => {
    setAccessToken("expired_token");
    globalThis.localStorage.setItem("auth_user", JSON.stringify({ id: "u1" }));

    globalThis.fetch = async (url) => {
      if (url.includes("/api/refresh-token")) {
        return { ok: false, status: 401, json: async () => ({ message: "Session expired" }) };
      }
      return { ok: false, status: 401 };
    };

    let errorThrown = false;
    try {
      await authFetch("http://localhost:5001/api/protected");
    } catch (e) {
      errorThrown = true;
      assert.strictEqual(e.message, "session_expired");
    }

    assert.strictEqual(errorThrown, true);
    assert.strictEqual(getAccessToken(), null, "Memory token must be cleared");
    assert.strictEqual(globalThis.localStorage.getItem("auth_user"), null, "auth_user must be removed");
    assert.strictEqual(
      globalThis.window.location.href,
      "/login?reason=session_expired",
      "Must redirect to login with reason=session_expired"
    );
  });
});
