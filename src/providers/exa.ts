import type { Adapter } from "./types.ts";
import { asArray, asNumber, asRecord } from "./parse.ts";
import { HttpError } from "../core/http-error.ts";
import { PROVIDER_MIN_INTERVAL_MS } from "../core/bridge.ts";
import type { Balance } from "../core/types.ts";

/**
 * Exa's normal API key has no per-key usage endpoint. The Team Management
 * credit balance is available to a team service key; a regular search key is
 * reported as an authentication error instead of inventing a balance.
 */
export const exaAdapter: Adapter = {
  kind: "exa",
  minIntervalMs: PROVIDER_MIN_INTERVAL_MS,
  fetch: async (connection, context) => {
    const apiKey = connection.secret.apiKey;
    if (!apiKey) throw new HttpError("not_configured", "Sign in to Exa in OpenCode.");
    const response = await context.requestJson("https://admin-api.exa.ai/team-management/credits", {
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
        "User-Agent": "OpenChamber quota display",
      },
      timeoutMs: 10_000,
      deadlineAt: context.deadlineAt,
      signal: context.signal,
    }).catch((error: unknown) => {
      if (error instanceof HttpError && error.code === "auth") {
        throw new HttpError(
          "auth",
          "Exa needs a Team Management service key in OpenCode to read credits.",
        );
      }
      throw error;
    });
    const body = asRecord(response.body) ?? {};
    const credits = asNumber(body.credits_usd);
    if (credits === null) {
      throw new HttpError("bad_response", "Exa returned no credit balance.");
    }
    const balances: Balance[] = [
      { id: "credits", label: "Credits", value: credits, unit: "USD" },
    ];
    const expiring = asArray(body.expiring_credits);
    expiring.forEach((entry, index) => {
      const record = asRecord(entry);
      const amount = asNumber(record?.amount_usd);
      if (amount === null || amount <= 0) return;
      balances.push({
        id: `expiring-${index}`,
        label: "Expiring credits",
        value: amount,
        unit: "USD",
      });
    });
    return { windows: [], caps: [], balances };
  },
};
