import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";

export type ServiceConfig = {
  caBundlePath?: string;
};

const CONFIG_FILE = "config.json";

export const loadConfig = async (dataDir: string): Promise<ServiceConfig> => {
  try {
    const raw = await readFile(path.join(dataDir, CONFIG_FILE), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const value = parsed as { caBundlePath?: unknown };
    return typeof value.caBundlePath === "string" && value.caBundlePath.trim()
      ? { caBundlePath: value.caBundlePath.trim() }
      : {};
  } catch {
    return {};
  }
};

export const saveConfig = async (dataDir: string, config: ServiceConfig): Promise<void> => {
  await mkdir(dataDir, { recursive: true });
  const file = path.join(dataDir, CONFIG_FILE);
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify({ version: 1, ...config }, null, 2), { mode: 0o600 });
  await rename(temp, file);
};
