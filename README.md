# Quota Display for OpenChamber

See how much quota you have left, how fast you are using it, and when it resets without leaving your session.

<img src="docs/assets/quotas-panel.png" width="360" alt="The Quotas section in OpenChamber's Work Status panel">

## Why use it

- Keep Tavily, OpenRouter, and OpenCode Go quotas in one compact Work Status section.
- See remaining or used quota, the even-use benchmark, reset times, caps, and balances.
- Spot trouble early with warning and danger colours.
- Choose the providers and windows you care about, and hide rows you do not need.
- Keys stay in the extension's local service; the plugin does not read OpenChamber's credential store.

## Install

Requires OpenChamber 2.8.0 or later on web or desktop. VS Code does not load extensions.

1. Open **Settings → Extensions → Add extension**.
2. Select this folder or a ZIP of it.
3. Approve the local service.
4. Open **Work Status** beside the chat. The **Quotas** section is there; use **Choose sections** if it is hidden.

## Configure

Open **Quota settings** from the sidebar's **Pages** section.

1. Add a provider and paste its API key. Use the eye button in the key field to check what you pasted, then **Test** the connection.
2. Choose the providers and windows to show. A new provider appears automatically; a new window type stays off until you enable it.
3. Pick **Remaining** (default) or **Used**, set the danger cutoff, and choose relative or absolute reset times.

Codex, Zen, and custom provider setup are hidden in this release while OAuth or a live endpoint is verified. Existing connections remain supported.

## Supported providers

| Provider | Sign-in | What you get |
| --- | --- | --- |
| Tavily | API key | Plan, key, and PAYG limits, plus PAYG balance |
| OpenRouter | API key | Credit limit and monthly spend |
| OpenCode Go | API key | 5-hour, weekly, and monthly windows |

Tavily, OpenRouter, and OpenCode Go are verified with live keys. Codex, Zen, and custom adapters remain, but their setup is hidden until OAuth or a live endpoint can be verified.

## Notes

- **Quotas** is display-only. Refresh it from the section header; it also refreshes while visible and after a window resets.
- The extension runs a small local service for provider requests and credentials. It never returns raw keys to the panel.
- Full requirements, design, interfaces, and test notes are in [`docs/README.md`](docs/README.md).

## Development

Building and testing from source requires Bun 1.4 or later.

```bash
bun install
bun run typecheck
bun test
bun run test:a11y
bun run build
```
