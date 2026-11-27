# Documentation

- [Requirements](REQUIREMENTS.md) — behaviour and acceptance criteria.
- [Design](DESIGN.md) — surfaces, components, and provider flow.
- [Interfaces](INTERFACES.md) — service routes, storage, and schemas.
- [Decisions](ADR.md) — architecture decision records.
- [Test plan](TESTPLAN.md) — automated coverage, accessibility checks, and gaps.
- [Contracts](contracts/README.md) — canonical JSON Schemas.
- [Backlog](BACKLOG.md) — deferred provider work and verification gaps.

The Session Panel quota feature closed on 2026-11-25. Its decisions remain in [ADR.md](ADR.md); deferred provider work and remaining verification are in the [backlog](BACKLOG.md). The OpenCode credential handoff is implemented and automated-tested, with live baseline checks still open; see the [test plan](TESTPLAN.md).

## Build and test

Requires Bun 1.4 or later and Chrome for the browser tests.

```bash
bun install
bun run typecheck
bun test
bun run test:a11y
bun run build
```

The build writes the section, settings, service, and self-contained OpenCode plugin bundles. The plugin uses only runtime built-ins, not installed packages or `node:https`.
