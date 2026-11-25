# Custom provider format: `openchamber-quota-v1`

A custom provider is a user-supplied HTTPS endpoint returning one JSON document. The service calls it with:

```http
GET <endpoint>
Authorization: Bearer <api key>
Accept: application/json
```

Requirements:

- HTTPS only; no redirects; no credentials in the URL; no query or fragment.
- Response `Content-Type: application/json`, at most 64 KiB, within 10 seconds.
- HTTP 200 only. `401`/`403` → `auth`; `429` → `rate_limited` with `Retry-After`; other statuses → `provider_error`.
- Unknown fields are ignored. Unknown `version` values fail with `bad_response`.
- At least one window, cap, or balance must be present.

## Shape

```json
{
  "version": 1,
  "windows": [
    {
      "id": "daily",
      "label": "Daily",
      "remainingPercent": 42,
      "resetAt": "2026-11-24T00:00:00Z",
      "durationSeconds": 86400
    }
  ],
  "caps": [
    { "id": "monthly-spend", "label": "Monthly spend", "used": 12.5, "limit": 50, "unit": "USD" }
  ],
  "balances": [
    { "id": "credit", "label": "Credit", "value": 25, "unit": "USD" }
  ]
}
```

- `windows[]`: resetting allocations. `id` is stable across resets. `remainingPercent` is 0–100. `resetAt` is an ISO timestamp. `durationSeconds` is the **full** window duration; omit it when unknown, which omits the benchmark.
- `caps[]`: non-resetting limits with `used >= 0` and `limit > 0`. The section displays the remaining value, `limit - used`, against `limit`.
- `balances[]`: non-resetting values; may be negative.
- `unit`: `USD`, `credits`, `requests`, or a short custom label.

## Limits

- At most 20 windows, 20 caps, and 20 balances.
- `id` and `label` are 1–80 and 1–40 characters.
- No scripts, field mappings, custom headers, or endpoint discovery. The canonical schema is [custom-provider-v1.schema.json](../../../docs/contracts/custom-provider-v1.schema.json).
- The API key is sent only to the configured origin.
