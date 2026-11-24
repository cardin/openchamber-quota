import { describe, expect, test } from "bun:test";
import { assertAdapterResult } from "../../src/providers/validate.ts";
import { customPayload, RESET } from "../fixtures/provider.ts";

describe("adapter result validation", () => {
  test("accepts a valid result and a window error", () => {
    expect(() => assertAdapterResult(customPayload)).not.toThrow();
    expect(() =>
      assertAdapterResult({
        windows: [
          {
            id: "weekly",
            label: "7d",
            error: { code: "bad_response", message: "Usage unavailable." },
          },
        ],
        caps: [],
        balances: [],
      }),
    ).not.toThrow();
  });

  test("rejects an out-of-range or incomplete window", () => {
    expect(() =>
      assertAdapterResult({
        windows: [
          {
            id: "daily",
            label: "Daily",
            remainingPercent: 101,
            resetAt: RESET,
          },
        ],
        caps: [],
        balances: [],
      }),
    ).toThrow("invalid quota data");
    expect(() =>
      assertAdapterResult({
        windows: [{ id: "daily", label: "Daily" }],
        caps: [],
        balances: [],
      }),
    ).toThrow("invalid quota data");
  });
});
