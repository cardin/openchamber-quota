import { describe, expect, test } from "bun:test";
import {
  benchmarkPercent,
  capRemainingPercent,
  clampPercent,
  formatRelative,
  formatResetShort,
  isWindowExpired,
} from "../../src/core/normalize.ts";
import { NOW, RESET } from "../fixtures/provider.ts";

describe("normalize", () => {
  test("benchmark is 50% halfway through", () => {
    expect(benchmarkPercent({ resetAt: RESET, durationSeconds: 86_400 }, NOW)).toBe(50);
  });

  test("benchmark is 0 at reset and 100 at start", () => {
    expect(benchmarkPercent({ resetAt: RESET, durationSeconds: 86_400 }, Date.parse(RESET))).toBe(0);
    expect(
      benchmarkPercent({ resetAt: RESET, durationSeconds: 86_400 }, Date.parse(RESET) - 86_400_000),
    ).toBe(100);
  });

  test("benchmark is omitted without a full duration", () => {
    expect(benchmarkPercent({ resetAt: RESET }, NOW)).toBeNull();
    expect(benchmarkPercent({ resetAt: RESET, durationSeconds: 0 }, NOW)).toBeNull();
  });

  test("clamps percentages and cap ratios", () => {
    expect(clampPercent(-2)).toBe(0);
    expect(clampPercent(102)).toBe(100);
    expect(capRemainingPercent({ id: "c", label: "C", used: 25, limit: 50, unit: "USD" })).toBe(50);
    expect(capRemainingPercent({ id: "c", label: "C", used: 75, limit: 50, unit: "USD" })).toBe(0);
  });

  test("absolute reset time changes format with distance", () => {
    const now = new Date(2026, 10, 24, 12, 0).getTime();
    const sameDay = new Date(2026, 10, 24, 19, 24).toISOString();
    const within24Hours = new Date(2026, 10, 25, 8, 0).toISOString();
    const tomorrowOver24Hours = new Date(2026, 10, 25, 13, 0).toISOString();
    const withinWeek = new Date(2026, 10, 30, 8, 0).toISOString();
    const oneWeek = new Date(2026, 11, 1, 12, 0).toISOString();
    const far = new Date(2026, 11, 5, 17, 49).toISOString();

    expect(formatResetShort(sameDay, "absolute", now)).toBe(
      new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
        new Date(sameDay),
      ),
    );
    const timeOnly = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const weekdayAndTime = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    expect(formatResetShort(within24Hours, "absolute", now)).toBe(
      timeOnly.format(new Date(within24Hours)),
    );
    expect(formatResetShort(tomorrowOver24Hours, "absolute", now)).toBe(
      weekdayAndTime.format(new Date(tomorrowOver24Hours)),
    );
    expect(formatResetShort(withinWeek, "absolute", now)).toBe(
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(withinWeek)),
    );
    const dateOnly = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });
    expect(formatResetShort(oneWeek, "absolute", now)).toBe(dateOnly.format(new Date(oneWeek)));
    expect(formatResetShort(far, "absolute", now)).toBe(dateOnly.format(new Date(far)));
  });

  test("expired windows and relative time", () => {
    expect(isWindowExpired({ resetAt: RESET }, NOW)).toBe(false);
    expect(isWindowExpired({ resetAt: RESET }, Date.parse(RESET))).toBe(true);
    expect(formatRelative(RESET, NOW)).toBe("in 12h");
  });
});
