# Data Model: Session Panel Quota Display

All data is scoped to one OpenChamber instance. Secrets never appear in a snapshot or in `host.storage`.

## Provider connection

One configured provider account.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Stable kebab-case; unique. For custom providers, generated from the label and kept across edits. |
| `kind` | enum | `custom`, `codex`, `opencode-go`, `openrouter`, `tavily`, `opencode-zen`. |
| `label` | string | 1–60 characters; shown in the selector and section header. |
| `endpoint` | string? | Custom only. Absolute HTTPS URL; no credentials, query, or fragment. |
| `credential` | secret | API key, bearer token, or imported Codex token. Stored only by the service. |
| `accountId` | string? | Codex account id; never shown. |
| `createdAt` | ISO string | Set once. |
| `lastTestAt` | ISO string? | Last connection test. |
| `lastTestResult` | `ok` / `auth` / `network` / `bad_response` | Sanitized; no upstream body. |

Each named provider kind has one active connection in the first release; custom providers may have multiple. Multiple accounts per named provider are out of scope.

## Provider snapshot

The section's view of one provider after the latest attempt.

| Field | Type | Rules |
| --- | --- | --- |
| `connectionId` | string | References the connection. |
| `kind` | enum | Same as the connection. |
| `label` | string | Copied from the connection. |
| `state` | enum | `ok`, `error`, `unconfigured`, `loading`. |
| `windows` | QuotaWindow[] | May be empty. |
| `caps` | Cap[] | May be empty. |
| `balances` | Balance[] | May be empty. |
| `fetchedAt` | ISO string? | When the displayed data was fetched. Absent when no successful fetch exists. |
| `refreshing` | boolean | One request in flight. |
| `error` | QuotaError? | Present only for `error`. |

A provider with no windows, caps, or balances after a successful response is `ok` with empty arrays; the section shows its provider-specific empty message.

## Quota window

A resetting allocation. `id` identifies the window **type** and survives resets.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Stable within the provider, for example `five-hour` or `monthly`. |
| `label` | string | 1–40 characters. |
| `remainingPercent` | number? | 0–100 after clamping. Below 0 is shown as 0; overflow is not added to another window. Required unless `error` is present. |
| `resetAt` | ISO string? | Invalid or absent means the window shows its window error when `error` is present. Required unless `error` is present. |
| `durationSeconds` | number? | Full window duration. Required for the even-use benchmark. Time-remaining values are not accepted. |
| `used` | Amount? | Optional raw values for detail text. |
| `limit` | Amount? | Optional raw values for detail text. |
| `error` | QuotaError? | When present, the row shows this error instead of a bar. A malformed window can therefore carry an error without hiding healthy windows. |

The benchmark is `(resetAt - now) / durationSeconds * 100`, clamped to 0–100. It is present only when `durationSeconds` is known and positive. At `resetAt`, the window becomes loading, not a stale bar.

Tavily's `plan`, `key`, and `paygo` windows use `used` and `limit` so each row shows the remaining raw value alongside the monthly reset. A PAYG value without a limit remains a non-resetting balance.

## Cap

A non-resetting limit with a known maximum.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Stable. |
| `label` | string | 1–40 characters. |
| `used` | number | 0 or greater. |
| `limit` | number | Greater than 0. |
| `unit` | string | `USD`, `credits`, `requests`, or a custom short unit. |

Caps have no reset and no benchmark. `remaining = limit - used` drives the bar and the displayed value. A missing limit means the value is a balance, not a cap.

## Balance

A non-resetting amount.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Stable. |
| `label` | string | 1–40 characters. |
| `value` | number | May be negative for debt. |
| `unit` | string | Same as cap units. |

Balances are text, not bars. Tavily's key-usage counter is intentionally hidden; its PAYG usage is shown.

## Snapshot

The service response.

```json
{
  "version": 1,
  "generatedAt": "2026-11-23T12:00:00Z",
  "providers": []
}
```

`providers` is ordered by connection creation. The snapshot contains no secrets, endpoints, account IDs, or raw upstream bodies.

## Display selection

Stored in instance-scoped `host.storage` under `quota.display.v1`.

| Field | Type | Rules |
| --- | --- | --- |
| `saved` | boolean | `false` until the user changes a selection. |
| `providers` | string[] | Connection ids. Unknown ids are ignored on read but retained. |
| `windows` | Record<string, string[]> | Connection id → window ids. New window types stay hidden until enabled; a newly added provider is enabled with its current windows. |
| `hiddenBalances` | string[] | Connection ids whose non-reporting balances are hidden from the panel. The settings checkbox is checked by default; unchecking adds the provider here. |
| `cutoffPercent` | number | 0–100; default 10. Strictly below triggers danger. |
| `resetTime` | `relative` / `absolute` | Default `relative`. Absolute shows time only within 24 hours, weekday and time within 7 days, and date only at 7+ days. |
| `quotaDisplay` | `remaining` / `used` | Default `remaining`, including for older stored records. Presentation only; does not change provider or window selection. |
| `tavilyMonthlyWindowsMigrated` | boolean? | Stored marker; `true` after migration or when saving with the current format. |

First use shows every provider with a connection and every window it reports. After `saved: true`, only selected items are shown, including an explicitly empty selection. A newly added provider is enabled automatically with its current windows. Removing a provider hides it but keeps its selection so a returning provider restores its previous windows. In a record without the migration marker, an enabled Tavily provider with no window list is migrated to `plan`, `key`, and `paygo`. Existing lists, including empty and plan-only lists, are preserved.

## Service storage

`OPENCHAMBER_SERVICE_DATA_DIR`:

- `connections.json` — connection metadata and secrets. The file is written atomically with `0600` on POSIX; on Windows it lives under the user profile and inherits the user's ACL. No encryption in the first release; the risk is documented.
- `cache.json` — last successful normalized snapshot, used only to render the next mount; never shown as fresh.
- Writes are atomic; no secrets in logs or error messages.

## Error classes

`not_configured`, `auth`, `rate_limited` (with `retryAt`), `timeout`, `network`, `bad_response`, `provider_error`.

A window-level error replaces one window bar and keeps the provider's healthy windows visible. A provider-level error replaces all of that provider's bars and keeps healthy providers visible. A rate-limited provider shows the retry time and does not auto-retry before it. A custom-format validation failure remains a provider-level `bad_response`; a named provider that reports an incomplete window carries a window-level error instead.

## State transitions

- `unconfigured → loading → ok | error`
- `ok → refreshing → ok | error`
- `error → refreshing → ok | error`
- `ok → expired window → loading → ok | error`
- `any → unconfigured` when the connection is removed
