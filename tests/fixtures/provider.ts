import type { Snapshot } from "../../src/core/types.ts";

export const NOW = Date.parse("2026-11-23T12:00:00Z");
export const RESET = "2026-11-24T00:00:00Z";

export const fixtureSnapshot = (): Snapshot => ({
  version: 1,
  generatedAt: new Date(NOW).toISOString(),
  providers: [
    {
      connectionId: "fixture",
      kind: "custom",
      label: "Fixture",
      state: "ok",
      fetchedAt: new Date(NOW).toISOString(),
      refreshing: false,
      windows: [
        { id: "daily", label: "Daily", remainingPercent: 25, resetAt: RESET, durationSeconds: 86_400 },
        { id: "zero", label: "Zero", remainingPercent: 0, resetAt: RESET, durationSeconds: 86_400 },
        { id: "broken", label: "Broken", remainingPercent: 40, resetAt: "not-a-date" },
      ],
      caps: [{ id: "monthly", label: "Monthly spend", used: 12.5, limit: 50, unit: "USD" }],
      balances: [{ id: "credit", label: "Credit", value: 25, unit: "USD" }],
    },
    {
      connectionId: "broken",
      kind: "tavily",
      label: "Broken provider",
      state: "error",
      windows: [],
      caps: [],
      balances: [],
      refreshing: false,
      error: { code: "auth", message: "Provider rejected the key." },
    },
  ],
});

export const customPayload = {
  version: 1,
  windows: [
    { id: "daily", label: "Daily", remainingPercent: 25, resetAt: RESET, durationSeconds: 86_400 },
  ],
  caps: [{ id: "monthly", label: "Monthly", used: 12.5, limit: 50, unit: "USD" }],
  balances: [{ id: "credit", label: "Credit", value: 25, unit: "USD" }],
};
