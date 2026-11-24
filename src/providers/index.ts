import type { Adapter } from "./types.ts";
import type { ProviderKind } from "../core/types.ts";
import { customAdapter } from "./custom.ts";
import { codexAdapter } from "./codex.ts";
import { openCodeGoAdapter } from "./opencode-go.ts";
import { openCodeZenAdapter } from "./opencode-zen.ts";
import { openRouterAdapter } from "./openrouter.ts";
import { tavilyAdapter } from "./tavily.ts";

export const ADAPTERS: Record<ProviderKind, Adapter> = {
  custom: customAdapter,
  codex: codexAdapter,
  "opencode-go": openCodeGoAdapter,
  "opencode-zen": openCodeZenAdapter,
  openrouter: openRouterAdapter,
  tavily: tavilyAdapter,
};
