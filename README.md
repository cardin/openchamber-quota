# OpenChamber Quota Display

A Work Status section for OpenChamber that shows quota remaining or used, the even-use benchmark, reset times, caps, and balances.

## How it works

- **Section** (`src/section/`): a `contributes.statusSection` entry. It renders the snapshot and stores only display preferences in instance-scoped `host.storage`.
- **Service** (`src/service/`): a local process started by OpenChamber. It owns provider credentials, fetches quota APIs, enforces minimum intervals, and returns a secret-free snapshot. The section calls it through `host.serviceRequest`.
- **No OpenChamber changes.** The plugin never reads OpenChamber's credential store.

## Providers

Custom providers, Tavily (plan, key, and PAYG limits reset monthly), OpenRouter, OpenCode Go, OpenAI / Codex, and OpenCode Zen. OpenAI / Codex imports `~/.codex/auth.json` on user action; the others use a key entered in the section.

## Build and install

```bash
bun install
bun run build
```

Install this folder from **Settings → Extensions → Install from folder**, then open **Work Status**. The **Quotas** section appears there, not in the right rail.

## Configuration

Open **Quota settings** from the sidebar's **Pages** section. The Pages entry is the supported configuration surface in OpenChamber 2.8.0.

- Add or remove providers and test a connection. Use the eye button inside the key field to reveal a pasted key; it stays masked by default.
- View non-resetting balances such as Tavily PAYG usage, with a per-provider option to hide them.
- Choose which providers and windows appear in the panel.
- Under **Display → Show quota as**, choose **Remaining** (default) or **Used** for windows and caps.
- Set the danger cutoff and relative/absolute reset time.

Provider requests use HTTPS with the system trust store.

The Work Status section is display-only. Its header has a single refresh icon.

## Development

```bash
bun run typecheck
bun test
bun run build
```

Contracts and the data model are in `specs/001-session-panel-quota/`.

## Known gaps

- Host checks are manual; the section mounts and renders live provider data in OpenChamber.
- Live provider checks are manual; Tavily, OpenRouter, and OpenCode Go are verified. See the quickstart.
- Custom-endpoint, Zen API-key, and OpenAI / Codex token checks need real-account verification.
- The service stores credentials in a `0600` file on POSIX and the user ACL on Windows; no encryption in this release.
