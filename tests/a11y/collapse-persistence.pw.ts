import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { SettingsService } from "../../src/service/settings.ts";
import { bridgeProviderFixture } from "../fixtures/bridge.ts";

const origin = "https://quota.persistence.test";
const snapshot = {
  version: 1,
  generatedAt: new Date().toISOString(),
  providers: [bridgeProviderFixture(3), bridgeProviderFixture(4)],
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
          surface: "status", connection: { connected: false, account: "" }, settings: {}, item: null,
          features: { statusControls: true },
        } });
      } else if (req.type === "service-request") {
        const { path, method, body } = req.payload;
        const response = await fetch(path, { method, body });
        reply({ type: "result", id: req.id, ok: true, payload: {
          status: response.status, body: await response.text(),
        } });
      } else if (req.id) {
        reply({ type: "result", id: req.id, ok: true });
      }
    });
  </script>
  <iframe title="Quotas" src="/section" sandbox="allow-scripts" width="420" height="350"></iframe>`;

test("providers retain their individual collapse state when Quotas reopens", async ({ context }) => {
  const sectionBundle = execFileSync("bun", [
    "build", "src/section/main.ts", "--target", "browser", "--format", "iife",
  ], { encoding: "utf8", timeout: 5_000 });
  const dir = await mkdtemp(path.join(tmpdir(), "quota-collapse-"));
  let settings = new SettingsService(dir);
  let injectConcurrentEdit = true;
  let conflictObserved = false;

  try {
    await context.route(`${origin}/**`, async (route) => {
      const request = route.request();
      switch (new URL(request.url()).pathname) {
        case "/":
          return route.fulfill({ contentType: "text/html", body: hostPage });
        case "/section":
          return route.fulfill({
            contentType: "text/html",
            body: '<!doctype html><div id="root"></div><script src="/section.js"></script>',
          });
        case "/section.js":
          return route.fulfill({ contentType: "text/javascript", body: sectionBundle });
        case "/snapshot":
          return route.fulfill({ json: snapshot });
        case "/refresh":
          return route.fulfill({ status: 202, json: { accepted: true } });
        case "/settings":
          if (request.method() !== "PATCH") return route.fulfill({ json: settings.get() });
          if (injectConcurrentEdit) {
            injectConcurrentEdit = false;
            await settings.patch({ expectedRevision: settings.get().revision, changes: { cutoffPercent: 25 } });
          }
          const result = await settings.patch(request.postDataJSON());
          if (result.status === 409) conflictObserved = true;
          return route.fulfill({ status: result.status, json: result.status === 400 ? {} : result.envelope });
        default:
          return route.fulfill({ status: 404 });
      }
    });

    const open = async () => {
      const page = await context.newPage();
      await page.goto(origin);
      const quotas = page.frameLocator('iframe[title="Quotas"]');
      return {
        page,
        tavily: quotas.locator('button[data-provider="bridge-tavily"]'),
        openai: quotas.locator('button[data-provider="bridge-codex"]'),
      };
    };

    const first = await open();
    await expect(first.tavily).toHaveAttribute("aria-expanded", "true");
    const saved = first.page.waitForResponse((response) =>
      response.url() === `${origin}/settings` &&
      response.request().method() === "PATCH" && response.status() === 200);
    await first.tavily.click();
    await saved;
    expect(conflictObserved).toBe(true);
    await expect(first.tavily).toHaveAttribute("aria-expanded", "false");
    await expect(first.openai).toHaveAttribute("aria-expanded", "true");
    await first.page.close();

    settings = new SettingsService(dir);
    await settings.load();
    const reopened = await open();
    await expect(reopened.tavily).toHaveAttribute("aria-expanded", "false");
    await expect(reopened.openai).toHaveAttribute("aria-expanded", "true");
    expect(settings.get().selection.cutoffPercent).toBe(25);

    const expanded = reopened.page.waitForResponse((response) =>
      response.url() === `${origin}/settings` &&
      response.request().method() === "PATCH" && response.status() === 200);
    await reopened.tavily.click();
    await expanded;
    await reopened.page.close();

    settings = new SettingsService(dir);
    await settings.load();
    const last = await open();
    await expect(last.tavily).toHaveAttribute("aria-expanded", "true");
    await last.page.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
