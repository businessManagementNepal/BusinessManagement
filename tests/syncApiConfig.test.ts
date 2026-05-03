import {
  buildApiUrl,
  createApiConfig,
  resolveApiBaseUrl,
} from "@/shared/network/apiConfig";
import { describe, expect, it } from "vitest";

describe("sync api config", () => {
  it("normalizes a base URL without a trailing slash", () => {
    expect(
      resolveApiBaseUrl({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
    ).toBe("https://api.elekha.app");
  });

  it("normalizes a base URL with a trailing slash", () => {
    expect(
      resolveApiBaseUrl({
        apiBaseUrl: "https://api.elekha.app/",
        mode: "production",
      }),
    ).toBe("https://api.elekha.app");
  });

  it("does not create a double /api/v1 segment", () => {
    const apiConfig = createApiConfig({
      apiBaseUrl: "https://api.elekha.app",
      mode: "production",
    });

    expect(apiConfig.buildUrl("/api/v1/sync/push")).toBe(
      "https://api.elekha.app/api/v1/sync/push",
    );
  });

  it("fails safely when the production base URL is missing", () => {
    expect(() =>
      resolveApiBaseUrl({
        apiBaseUrl: "",
        mode: "production",
      }),
    ).toThrow("EXPO_PUBLIC_API_BASE_URL is required in production.");
  });

  it("builds the final sync push URL from the origin-only base URL", () => {
    expect(
      buildApiUrl("https://api.elekha.app/", "/api/v1/sync/push"),
    ).toBe("https://api.elekha.app/api/v1/sync/push");
  });
});
