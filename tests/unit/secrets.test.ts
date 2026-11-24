import { describe, expect, test } from "bun:test";
import { fixtureSnapshot } from "../fixtures/provider.ts";
import { toPublic } from "../../src/service/credentials.ts";

describe("secrets", () => {
  test("snapshots and public connections never contain secrets", () => {
    const snapshot = fixtureSnapshot();
    const text = JSON.stringify(snapshot);
    expect(text).not.toContain("secret");
    expect(text).not.toContain("apiKey");
    expect(text).not.toContain("accessToken");

    const pub = toPublic({
      id: "tavily",
      kind: "tavily",
      label: "Tavily",
      createdAt: "2026-11-23T12:00:00Z",
      secret: { apiKey: "tvly-secret" },
    });
    expect(JSON.stringify(pub)).not.toContain("tvly-secret");
    expect(pub).not.toHaveProperty("secret");
  });
});
