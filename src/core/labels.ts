import type { ProviderKind } from "./types.ts";

export const PROVIDER_LABELS: Record<ProviderKind, string> = {
  custom: "Custom provider",
  codex: "OpenAI / Codex",
  "opencode-go": "OpenCode Go",
  "opencode-zen": "OpenCode Zen",
  openrouter: "OpenRouter",
  tavily: "Tavily",
};

export const providerLabel = (kind: string): string =>
  PROVIDER_LABELS[kind as ProviderKind] ?? kind;
