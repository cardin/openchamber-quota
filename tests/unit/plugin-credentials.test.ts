import { describe, expect, test } from "bun:test";
import {
  credentialToConnection,
  resolveSelectedCredentials,
} from "../../src/opencode-plugin/credentials.ts";
import { BRIDGE_ROWS } from "../../src/core/bridge.ts";
import type { OpenCodeCredential } from "../../src/opencode-plugin/credentials.ts";
import { NOW } from "../fixtures/provider.ts";

const row = (id: "openrouter" | "opencode-go" | "opencode" | "openai") => BRIDGE_ROWS.get(id)!;

describe("plugin credentials", () => {
  test("maps API keys and OAuth tokens into ephemeral pseudo-connections", () => {
    const api = credentialToConnection(row("openrouter"), {
      type: "api",
      key: "sk-or",
      refresh: "never-copy",
      expires: 123,
    });
    expect(api).toMatchObject({
      ok: true,
      credentialType: "api",
      connection: {
        id: "bridge-openrouter",
        kind: "openrouter",
        label: "OpenRouter",
        secret: { apiKey: "sk-or" },
      },
    });
    expect(api.ok && Object.keys(api.connection.secret)).toEqual(["apiKey"]);
    expect(JSON.stringify(api)).not.toContain("never-copy");

    const oauth = credentialToConnection(row("openai"), {
      type: "oauth",
      access: "access-1",
      refresh: "refresh-1",
      expires: 999,
      accountId: "acct-1",
    });
    expect(oauth).toMatchObject({
      ok: true,
      credentialType: "oauth",
      connection: { secret: { accessToken: "access-1", accountId: "acct-1" } },
    });
    expect(JSON.stringify(oauth)).not.toContain("refresh-1");
    expect(JSON.stringify(oauth)).not.toContain("999");
  });

  test("Zen prefers orgID over accountId; Codex uses accountId", () => {
    const zen = credentialToConnection(row("opencode"), {
      type: "oauth",
      access: "token",
      orgID: "org-1",
      accountId: "acct-1",
    });
    expect(zen.ok && zen.connection.secret.accountId).toBe("org-1");

    const zenFallback = credentialToConnection(row("opencode"), {
      type: "key",
      key: "key",
      accountId: "acct-2",
    });
    expect(zenFallback.ok && zenFallback.connection.secret.accountId).toBe("acct-2");

    const codex = credentialToConnection(row("openai"), {
      type: "oauth",
      access: "token",
      accountId: "acct-3",
    });
    expect(codex.ok && codex.connection.secret.accountId).toBe("acct-3");
  });

  test("reads identifier metadata when the credential exposes it there", () => {
    const zen = credentialToConnection(row("opencode"), {
      type: "oauth",
      access: "token",
      metadata: { orgID: "org-meta", accountId: "acct-meta" },
    });
    expect(zen.ok && zen.connection.secret.accountId).toBe("org-meta");

    const codex = credentialToConnection(row("openai"), {
      type: "oauth",
      access: "token",
      metadata: { accountId: "acct-meta" },
    });
    expect(codex.ok && codex.connection.secret.accountId).toBe("acct-meta");

    const codexClaim = credentialToConnection(row("openai"), {
      type: "oauth",
      access: "token",
      metadata: { chatgpt_account_id: "acct-claim" },
    });
    expect(codexClaim.ok && codexClaim.connection.secret.accountId).toBe("acct-claim");
  });

  test("reads the ChatGPT account id from the OpenAI access token claim", () => {
    const payload = {
      "https://api.openai.com/auth": {
        chatgpt_account_id: "acct-from-jwt",
        chatgpt_user_id: "user-from-jwt",
      },
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const access = `header.${encoded}.signature`;
    const result = credentialToConnection(row("openai"), {
      type: "oauth",
      access,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.connection.secret.accountId).toBe("acct-from-jwt");
    expect(Object.keys(result.connection.secret).sort()).toEqual(["accessToken", "accountId"]);
  });

  test("an API-key-only Codex account is explicitly unsupported", () => {
    const result = credentialToConnection(row("openai"), { type: "api", key: "sk-only" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.state).toBe("unconfigured");
    expect(result.message).toContain("API key cannot read ChatGPT quota");
  });

  test("missing or unusable credentials are not configured, not errors", () => {
    expect(credentialToConnection(row("openrouter"), {})).toMatchObject({
      ok: false,
      state: "unconfigured",
    });
    expect(credentialToConnection(row("openai"), { type: "oauth", access: "token" })).toMatchObject({
      ok: false,
      state: "unconfigured",
    });
  });

  test("resolves only the six declared ids and never other integrations", async () => {
    const calls: string[] = [];
    const credentials: Record<string, OpenCodeCredential> = {
      openrouter: { type: "api", key: "sk" },
      "opencode-go": { type: "api", key: "go" },
      opencode: { type: "oauth", access: "zen", orgID: "org" },
      openai: { type: "oauth", access: "codex", accountId: "acct" },
      tavily: { type: "api", key: "tvly" },
      exa: { type: "api", key: "exa" },
      anthropic: { type: "api", key: "sentinel-anthropic" },
    };
    const outcomes = await resolveSelectedCredentials({
      connection: {
        active: async (id: string) => {
          calls.push(id);
          return credentials[id] ? { type: "credential", id, label: id } : undefined;
        },
        resolve: async (connection) => {
          const id = (connection as { id: string }).id;
          return credentials[id];
        },
      },
    });
    expect(calls).toEqual(["openrouter", "opencode-go", "opencode", "openai", "tavily", "exa"]);
    expect(outcomes.size).toBe(6);
    expect(outcomes.get("openai")).toMatchObject({
      ok: true,
      connection: { secret: { accessToken: "codex", accountId: "acct" } },
    });
    expect(outcomes.get("tavily")).toMatchObject({
      ok: true,
      connection: { secret: { apiKey: "tvly" } },
    });
    expect(outcomes.get("exa")).toMatchObject({
      ok: true,
      connection: { secret: { apiKey: "exa" } },
    });
    expect(JSON.stringify([...outcomes])).not.toContain("sentinel-anthropic");
  });

  test("reads Tavily and Exa environment credentials from OpenCode", async () => {
    const previousTavily = process.env.TAVILY_API_KEY;
    const previousExa = process.env.EXA_API_KEY;
    process.env.TAVILY_API_KEY = "tvly-env";
    process.env.EXA_API_KEY = "exa-env";
    try {
      const outcomes = await resolveSelectedCredentials({
        connection: {
          active: async (id) =>
            id === "tavily" ? { type: "env", name: "TAVILY_API_KEY" } : undefined,
          resolve: async () => undefined,
        },
      });
      expect(outcomes.get("tavily")).toMatchObject({
        ok: true,
        connection: { secret: { apiKey: "tvly-env" } },
      });
      expect(outcomes.get("exa")).toMatchObject({
        ok: true,
        connection: { secret: { apiKey: "exa-env" } },
      });
    } finally {
      if (previousTavily === undefined) delete process.env.TAVILY_API_KEY;
      else process.env.TAVILY_API_KEY = previousTavily;
      if (previousExa === undefined) delete process.env.EXA_API_KEY;
      else process.env.EXA_API_KEY = previousExa;
    }
  });

  test("source errors are sanitized and do not include raw tokens", async () => {
    const outcomes = await resolveSelectedCredentials({
      connection: {
        active: async (id) =>
          id === "openai" ? { type: "credential", id, label: id } : undefined,
        resolve: async () => {
          throw new Error("Bearer sentinel-token-1234567890");
        },
      },
    });
    const openai = outcomes.get("openai");
    expect(openai?.ok).toBe(false);
    expect(JSON.stringify(openai)).not.toContain("sentinel-token");
    expect(JSON.stringify(openai)).toContain("could not read the OpenAI credential");
  });
});
