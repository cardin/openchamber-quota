# Contracts

Canonical JSON Schemas for the quota extension:

- [quota-snapshot.schema.json](quota-snapshot.schema.json) — the service snapshot returned by `GET /snapshot`.
- [custom-provider-v1.schema.json](custom-provider-v1.schema.json) — the `openchamber-quota-v1` custom-provider document.

The service validates snapshots against the snapshot schema at runtime. Contract tests load both schemas. The custom adapter uses a separate parser; see the [backlog](../BACKLOG.md) for the conformance gap. Prose endpoint and storage rules are in [INTERFACES.md](../INTERFACES.md).
