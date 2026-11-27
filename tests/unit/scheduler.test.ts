import { describe, expect, test } from "bun:test";
import { Scheduler } from "../../src/service/scheduler.ts";

describe("scheduler", () => {
  test("one in-flight request and a minimum interval", () => {
    const scheduler = new Scheduler();
    expect(scheduler.begin("a", 60_000, 1000)).toBe(true);
    expect(scheduler.begin("a", 60_000, 2000)).toBe(false);
    scheduler.finish("a");
    expect(scheduler.begin("a", 60_000, 30_000)).toBe(false);
    expect(scheduler.begin("a", 60_000, 61_000)).toBe(true);
  });

  test("honors a retry time", () => {
    const scheduler = new Scheduler();
    expect(scheduler.begin("a", 0, 1000)).toBe(true);
    scheduler.finish("a", 10_000);
    expect(scheduler.begin("a", 0, 5000)).toBe(false);
    expect(scheduler.begin("a", 0, 10_001)).toBe(true);
  });

  test("reports the next allowed attempt", () => {
    const scheduler = new Scheduler();
    expect(scheduler.nextAllowedAt("a", 60_000, 1_000)).toBe(1_000);
    expect(scheduler.begin("a", 60_000, 1_000)).toBe(true);
    scheduler.finish("a", 90_000);
    expect(scheduler.nextAllowedAt("a", 60_000, 1_000)).toBe(90_000);
    expect(scheduler.nextAllowedAt("a", 60_000, 95_000)).toBe(95_000);
  });

  test("manual refresh bypasses the poll wait but keeps the 30-second floor", () => {
    const scheduler = new Scheduler();
    expect(scheduler.begin("a", 300_000, 1_000)).toBe(true);
    scheduler.finish("a");
    expect(scheduler.begin("a", 300_000, 20_000)).toBe(false);
    expect(scheduler.begin("a", 300_000, 31_000, { manual: true })).toBe(true);
    scheduler.finish("a");
    expect(scheduler.begin("a", 300_000, 32_000, { manual: true })).toBe(false);
    expect(scheduler.begin("a", 300_000, 61_000, { manual: true })).toBe(true);
  });

  test("manual refresh still honors a retry time", () => {
    const scheduler = new Scheduler();
    expect(scheduler.begin("a", 300_000, 1_000)).toBe(true);
    scheduler.finish("a", 90_000, true);
    expect(scheduler.begin("a", 300_000, 91_000, { manual: true })).toBe(true);
    expect(scheduler.begin("a", 300_000, 92_000, { manual: true })).toBe(false);
  });

  test("repeated failures extend the poll wait up to fifteen minutes", () => {
    const scheduler = new Scheduler();
    let now = 1_000;
    for (let failure = 1; failure <= 5; failure++) {
      expect(scheduler.begin("a", 300_000, now)).toBe(true);
      scheduler.finish("a", undefined, true);
      const expected = Math.max(300_000, Math.min(900_000, 60_000 * 2 ** (failure - 1)));
      expect(scheduler.nextAllowedAt("a", 300_000, now)).toBe(now + expected);
      now += expected + 1;
    }
  });

  test("manual refresh cannot bypass failure backoff", () => {
    const scheduler = new Scheduler();
    const now = 100_000;
    expect(scheduler.begin("custom", 300_000, now)).toBe(true);
    scheduler.finish("custom", undefined, true);
    expect(scheduler.begin("custom", 300_000, now + 30_000, { manual: true })).toBe(false);
    expect(scheduler.begin("custom", 300_000, now + 60_000, { manual: true })).toBe(true);
  });

  test("reset clears state", () => {
    const scheduler = new Scheduler();
    expect(scheduler.begin("a", 60_000, 1000)).toBe(true);
    scheduler.finish("a");
    scheduler.reset("a");
    expect(scheduler.begin("a", 60_000, 2000)).toBe(true);
  });
});
