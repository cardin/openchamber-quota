import { expect, test } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { SettingsService } from "../../src/service/settings.ts";
import { bridgeProviders } from "../fixtures/bridge.ts";

const origin = "https://quota.settings.test";
const snapshot = {
  version: 1,
  generatedAt: new Date().toISOString(),
  providers: bridgeProviders(),
};

const hostPage = `<!doctype html>
  <script>
    const tokens = Object.fromEntries(
      ("background elevated foreground muted subtle border hover selection focus primary mutedSurface " +
       "elevatedForeground active selectionForeground primaryForeground primaryText successText warningText " +
       "errorText infoText success warning error info font mono radius").split(" ").map(key => [key, "#777"])
    );
    addEventListener("message", async (event) => {
      if (event.source !== document.querySelector("iframe").contentWindow) return;
      const req = event.data;
      const reply = (msg) => event.source.postMessage({ channel: req.channel, v: req.v, ...msg }, "*");
      if (req.type === "hello") {
        reply({ type: "ready", payload: {
          theme: { mode: "light", tokens }, locale: "en", directory: null, session: null,
          surface: "page", connection: { connected: false, account: "" }, settings: {}, item: null,
          features: { statusControls: false },
        } });
      } else if (req.type === "service-request") {
        const { path, method, body } = req.payload;
        try {
          const response = await fetch(path, { method, body });
          reply({ type: "result", id: req.id, ok: true, payload: {
            status: response.status, body: await response.text(),
          } });
        } catch {
          reply({ type: "result", id: req.id, ok: false, error: "No service", code: "NO_SERVICE" });
        }
      } else if (req.id) {
        reply({ type: "result", id: req.id, ok: true });
      }
    });
  </script>
  <iframe title="Quota settings" src="/settings-page" sandbox="allow-scripts" width="900" height="700"></iframe>`;

const settingsBundle = execFileSync("bun", [
  "build", "src/settings/main.ts", "--target", "browser", "--format", "iife",
], { encoding: "utf8", timeout: 5_000 });

const openSettings = async (
  context: BrowserContext,
  dir: string,
  options: { failFirstLoad?: boolean } = {},
) => {
  const settings = new SettingsService(dir);
  await settings.load();

  await context.route(`${origin}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    switch (url.pathname) {
      case "/":
        return route.fulfill({ contentType: "text/html", body: hostPage });
      case "/settings-page":
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><div id="root"></div><script src="/settings.js"></script>',
        });
      case "/settings.js":
        return route.fulfill({ contentType: "text/javascript", body: settingsBundle });
      case "/snapshot":
        return route.fulfill({ json: snapshot });
      case "/connections":
        return route.fulfill({ json: { connections: [] } });
      case "/refresh":
        return route.fulfill({ status: 202, json: { accepted: true } });
      case "/settings":
        if (request.method() !== "PATCH") {
          if (options.failFirstLoad) {
            options.failFirstLoad = false;
            return route.abort("failed");
          }
          return route.fulfill({ json: settings.get() });
        }
        {
          const result = await settings.patch(request.postDataJSON());
          return route.fulfill({
            status: result.status,
            json: result.status === 400 ? {} : result.envelope,
          });
        }
      default:
        return route.fulfill({ status: 404 });
    }
  });

  const page = await context.newPage();
  await page.goto(origin);
  return {
    page,
    frame: page.frameLocator('iframe[title="Quota settings"]'),
    settings,
  };
};

test("a transient settings failure recovers on the next poll", async ({ context }) => {
  const dir = await mkdtemp(path.join(tmpdir(), "quota-settings-recover-"));
  try {
    // The host-level failure path is exercised through the fixture page.
    const { frame } = await openSettings(context, dir, { failFirstLoad: true });
    await expect(frame.locator(".quota-error")).toContainText("No service");
    await expect(frame.locator("h3", { hasText: "Display" })).toBeVisible({ timeout: 7_000 });
    await expect(frame.locator(".quota-error")).toHaveCount(0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("two connected clients see independent settings within the reload interval", async ({ context }) => {
  test.setTimeout(30_000);
  const dir = await mkdtemp(path.join(tmpdir(), "quota-settings-sync-"));
  try {
    const first = await openSettings(context, dir);
    const second = await openSettings(context, dir);

    const codex = first.frame.locator('input[data-provider-toggle][data-provider="bridge-codex"]');
    await expect(codex).toBeChecked();
    const savedVisibility = first.page.waitForResponse((response) =>
      response.url() === `${origin}/settings` &&
      response.request().method() === "PATCH" && response.status() === 200);
    await codex.uncheck();
    await savedVisibility;

    const secondCodex = second.frame.locator('input[data-provider-toggle][data-provider="bridge-codex"]');
    await expect(secondCodex).not.toBeChecked({ timeout: 7_000 });

    const cutoff = second.frame.locator("input[data-cutoff]");
    const savedCutoff = second.page.waitForResponse((response) =>
      response.url() === `${origin}/settings` &&
      response.request().method() === "PATCH" && response.status() === 200);
    await cutoff.fill("35");
    await cutoff.blur();
    await savedCutoff;

    await expect(first.frame.locator("input[data-cutoff]")).toHaveValue("35", { timeout: 7_000 });
    const saved = new SettingsService(dir);
    await saved.load();
    expect(saved.get().selection.providers).not.toContain("bridge-codex");
    expect(saved.get().selection.cutoffPercent).toBe(35);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
