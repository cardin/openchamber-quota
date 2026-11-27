import { BRIDGE_PROVIDERS } from "../../src/core/bridge.ts";
import type { BridgeSnapshot, ProviderSnapshot } from "../../src/core/types.ts";
import { NOW, RESET } from "./provider.ts";

export const bridgeProviderFixture = (
  index: number,
  state: ProviderSnapshot["state"] = "ok",
): ProviderSnapshot => {
  const row = BRIDGE_PROVIDERS[index];
  if (state !== "ok") {
    return {
      connectionId: row.connectionId,
      kind: row.kind,
      label: row.label,
      state,
      windows: [],
      caps: [],
      balances: [],
      refreshing: false,
      error: {
        code: state === "unconfigured" ? "not_configured" : "auth",
        message:
          state === "unconfigured"
            ? `Sign in to ${row.label} in OpenCode, then refresh.`
            : `${row.label} rejected the credential.`,
      },
    };
  }
  if (row.id === "tavily") {
    return {
      connectionId: row.connectionId,
      kind: row.kind,
      label: row.label,
      state: "ok",
      windows: [
        {
          id: "plan",
          label: "Credits",
          remainingPercent: 80,
          resetAt: RESET,
          durationSeconds: 30 * 86_400,
        },
      ],
      caps: [],
      balances: [{ id: "paygo-used", label: "Pay-as-you-go used", value: 0, unit: "units" }],
      fetchedAt: new Date(NOW).toISOString(),
      refreshing: false,
    };
  }
  if (row.id === "exa") {
    return {
      connectionId: row.connectionId,
      kind: row.kind,
      label: row.label,
      state: "ok",
      windows: [],
      caps: [],
      balances: [{ id: "credits", label: "Credits", value: 42.5, unit: "USD" }],
      fetchedAt: new Date(NOW).toISOString(),
      refreshing: false,
    };
  }
  return {
    connectionId: row.connectionId,
    kind: row.kind,
    label: row.label,
    state: "ok",
    windows: [
      {
        id: "primary",
        label: index === 3 ? "5h" : "Primary",
        remainingPercent: 40 + index * 10,
        resetAt: RESET,
        durationSeconds: 18_000,
      },
    ],
    caps: index === 2 ? [{ id: "budget", label: "Budget", used: 2, limit: 10, unit: "USD" }] : [],
    balances: index === 0 ? [{ id: "monthly-spend", label: "Monthly spend", value: 12, unit: "USD" }] : [],
    fetchedAt: new Date(NOW).toISOString(),
    refreshing: false,
  };
};

export const bridgeProviders = (): ProviderSnapshot[] =>
  BRIDGE_PROVIDERS.map((_, index) => bridgeProviderFixture(index));

export const bridgeSnapshotFixture = (
  serverId: string,
  requestId: string | null = null,
  providers: ProviderSnapshot[] = bridgeProviders(),
): BridgeSnapshot => ({
  version: 1,
  serverId,
  requestId,
  generatedAt: new Date(NOW + 5_000).toISOString(),
  providers,
});
