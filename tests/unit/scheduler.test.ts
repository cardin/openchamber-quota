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

  test("reset clears state", () => {
    const scheduler = new Scheduler();
    expect(scheduler.begin("a", 60_000, 1000)).toBe(true);
    scheduler.finish("a");
    scheduler.reset("a");
    expect(scheduler.begin("a", 60_000, 2000)).toBe(true);
  });
});
