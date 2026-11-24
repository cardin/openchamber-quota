import http from "node:http";
import os from "node:os";
import path from "node:path";
import { loadConfig, saveConfig } from "./config.ts";
import { CredentialStore } from "./credentials.ts";
import { Scheduler } from "./scheduler.ts";
import { SnapshotService } from "./snapshot.ts";
import { handleRequest } from "./routes.ts";
import { loadCaBundle } from "./tls.ts";

const port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
const token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? "";
const dataDir =
  process.env.OPENCHAMBER_SERVICE_DATA_DIR ?? path.join(os.homedir(), ".openchamber-quota");

if (!port || !token) {
  console.error("OPENCHAMBER_SERVICE_PORT and OPENCHAMBER_SERVICE_TOKEN are required");
  process.exit(1);
}

const config = await loadConfig(dataDir);
const store = new CredentialStore(dataDir);
await store.load();
const snapshot = new SnapshotService({
  store,
  scheduler: new Scheduler(),
  dataDir,
  caBundle: await loadCaBundle(config.caBundlePath).catch(() => undefined),
});
await snapshot.loadCache();

const server = http.createServer((request, response) => {
  const chunks: Buffer[] = [];
  let size = 0;
  request.on("data", (chunk: Buffer) => {
    size += chunk.length;
    if (size > 65_536) {
      response.writeHead(413, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: { code: "bad_request", message: "Body is too large." } }));
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on("end", async () => {
    if (response.writableEnded) return;
    try {
      const result = await handleRequest(
        {
          store,
          snapshot,
          token,
          dataDir,
          config,
          saveConfig: async (next) => {
            await saveConfig(dataDir, next);
            config.caBundlePath = next.caBundlePath;
            snapshot.setCaBundle(await loadCaBundle(next.caBundlePath).catch(() => undefined));
          },
        },
        {
          method: request.method ?? "GET",
          path: request.url ?? "/",
          headers: request.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        },
      );
      response.writeHead(result.status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(result.body));
    } catch {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: { code: "provider_error", message: "Internal service error." } }));
    }
  });
});

server.listen(port, "127.0.0.1");
