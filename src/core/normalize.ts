import type { Balance, Cap, DisplaySelection, QuotaWindow } from "./types.ts";

export const capOrBalance = (input: {
  id: string;
  label: string;
  used: number;
  limit?: number | null;
  unit: string;
}): Cap | Balance =>
  typeof input.limit === "number" && input.limit > 0
    ? { id: input.id, label: input.label, used: input.used, limit: input.limit, unit: input.unit }
    : { id: input.id, label: input.label, value: input.used, unit: input.unit };

export const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, value));

export const capRemaining = (cap: Cap): number =>
  Math.max(0, cap.limit - cap.used);

export const visibleBalances = (balances: Balance[]): Balance[] =>
  balances.filter(
    (balance) => balance.id !== "key-used" && balance.label !== "Key credits used",
  );

export const capRemainingPercent = (cap: Cap): number =>
  cap.limit > 0 ? clampPercent((capRemaining(cap) / cap.limit) * 100) : 0;

export const benchmarkPercent = (
  window: Pick<QuotaWindow, "resetAt" | "durationSeconds">,
  nowMs: number,
): number | null => {
  if (!window.resetAt) return null;
  const reset = Date.parse(window.resetAt);
  const duration = window.durationSeconds;
  if (!Number.isFinite(reset) || !duration || duration <= 0) return null;
  const remaining = reset - nowMs;
  return clampPercent((remaining / (duration * 1000)) * 100);
};

export const isWindowExpired = (
  window: Pick<QuotaWindow, "resetAt">,
  nowMs: number,
): boolean => {
  if (!window.resetAt) return false;
  const reset = Date.parse(window.resetAt);
  return Number.isFinite(reset) && nowMs >= reset;
};

export const formatRelative = (iso: string, nowMs: number): string => {
  const target = Date.parse(iso);
  if (!Number.isFinite(target)) return "unknown";
  const diff = target - nowMs;
  if (diff <= 0) return "now";
  const minutes = Math.ceil(diff / 60_000);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `in ${hours}h ${rest}m` : `in ${hours}h`;
  const days = Math.floor(hours / 24);
  const hourRest = hours % 24;
  return hourRest ? `in ${days}d ${hourRest}h` : `in ${days}d`;
};

export const formatRelativeShort = (iso: string, nowMs: number): string => {
  const target = Date.parse(iso);
  if (!Number.isFinite(target)) return "unknown";
  const diff = target - nowMs;
  if (diff <= 0) return "now";
  const minutes = Math.ceil(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours}h ${rest}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const hourRest = hours % 24;
  return hourRest ? `${days}d ${hourRest}h` : `${days}d`;
};

const calendarDay = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

export const formatResetShort = (
  iso: string,
  mode: DisplaySelection["resetTime"],
  nowMs: number,
): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  if (mode === "relative") return formatRelativeShort(iso, nowMs);

  const distance = date.getTime() - nowMs;
  if (distance >= 0 && distance < 86_400_000) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const dayDifference = Math.round(
    (calendarDay(date) - calendarDay(new Date(nowMs))) / 86_400_000,
  );
  if (dayDifference === 0) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  if (dayDifference > 0 && dayDifference < 7) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatReset = (
  iso: string,
  mode: DisplaySelection["resetTime"],
  nowMs: number,
): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  if (mode === "relative") return formatRelative(iso, nowMs);
  return date.toLocaleString();
};

export const formatAmount = (value: number, unit: string): string => {
  if (unit === "USD") {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return `${value} ${unit}`;
};

/** Compact age of a sampled reading; never invents a future value. */
export const formatAge = (iso: string | undefined, nowMs: number): string => {
  if (!iso) return "unknown";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "unknown";
  const seconds = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const selectedProviderIds = (selection: DisplaySelection, available: string[]): string[] => {
  if (!selection.saved) return available;
  return available.filter((id) => selection.providers.includes(id));
};

export const selectedWindowIds = (
  selection: DisplaySelection,
  providerId: string,
  available: string[],
): string[] => {
  if (!selection.saved) return available;
  const chosen = selection.windows[providerId] ?? [];
  return available.filter((id) => chosen.includes(id));
};
