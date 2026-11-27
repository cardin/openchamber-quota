import http from "node:http";
import os from "node:os";
import path from "node:path";
import { serverIdFor } from "../core/bridge-path.ts";
import { BridgeService } from "./bridge.ts";
import { BridgeDescriptorWriter } from "./bridge-descriptor.ts";
import { CredentialStore } from "./credentials.ts";
import { Scheduler } from "./scheduler.ts";
import { SettingsService } from "./settings.ts";
import { SnapshotService } from "./snapshot.ts";
import { handleRequest } from "./routes.ts";

const port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
const token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? "";
const dataDir = path.resolve(
  process.env.OPENCHAMBER_SERVICE_DATA_DIR ?? path.join(os.homedir(), ".openchamber-quota"),
);

if (!port || !token) {
  console.error("OPENCHAMBER_SERVICE_PORT and OPENCHAMBER_SERVICE_TOKEN are required");
  process.exit(1);
}

const serverId = serverIdFor(dataDir);
const store = new CredentialStore(dataDir);
await store.load();
const settings = new SettingsService(dataDir);
await settings.load();
const bridge = new BridgeService({ serverId });
const snapshot = new SnapshotService({
  store,
  scheduler: new Scheduler(),
  dataDir,
  bridge,
  settings,
});
await snapshot.loadCache();
snapshot.start();
const descriptor = new BridgeDescriptorWriter(serverId, port);

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
          settings,
          token,
          bridgeToken: descriptor.descriptor().token,
          dataDir,
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

let closing = false;
const shutdown = async (): Promise<void> => {
  if (closing) return;
  closing = true;
  snapshot.stop();
  await descriptor.cleanup();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1_000).unref?.();
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
process.once("exit", () => {
  // Synchronous best effort; the async path above normally removes it first.
  void descriptor.cleanup();
});

server.listen(port, "127.0.0.1", () => {
  void descriptor.publish().catch(() => {
    console.error("Could not publish the OpenCode bridge descriptor.");
  });
});
