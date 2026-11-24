import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Connection,
  ProviderKind,
  Secret,
  StoredConnection,
} from "../core/types.ts";

type StoreFile = {
  version: 1;
  connections: StoredConnection[];
};

const EMPTY: StoreFile = { version: 1, connections: [] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const normalizeFile = (value: unknown): StoreFile => {
  if (!isRecord(value) || !Array.isArray(value.connections)) return { ...EMPTY };
  const connections = value.connections.filter((entry): entry is StoredConnection => {
    if (!isRecord(entry)) return false;
    return (
      typeof entry.id === "string" &&
      typeof entry.kind === "string" &&
      typeof entry.label === "string" &&
      typeof entry.createdAt === "string" &&
      isRecord(entry.secret)
    );
  });
  return { version: 1, connections };
};

const toPublic = (entry: StoredConnection): Connection => {
  const { secret: _secret, accountId: _accountId, ...connection } = entry;
  return connection;
};

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "provider";

const isNamedKind = (kind: ProviderKind): boolean => kind !== "custom";

export class CredentialStore {
  private readonly file: string;
  private data: StoreFile = { ...EMPTY };

  constructor(private readonly dataDir: string) {
    this.file = path.join(dataDir, "connections.json");
  }

  async load(): Promise<void> {
    try {
      this.data = normalizeFile(JSON.parse(await readFile(this.file, "utf8")));
    } catch {
      this.data = { ...EMPTY };
    }
  }

  private async save(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const temp = `${this.file}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    await rename(temp, this.file);
  }

  list(): Connection[] {
    return this.data.connections.map(toPublic);
  }

  entries(): StoredConnection[] {
    return [...this.data.connections];
  }

  get(id: string): StoredConnection | undefined {
    return this.data.connections.find((entry) => entry.id === id);
  }

  async upsert(input: {
    id?: string;
    kind: ProviderKind;
    label: string;
    endpoint?: string;
    apiKey?: string;
    accessToken?: string;
    accountId?: string;
  }): Promise<Connection> {
    const existing = input.id ? this.get(input.id) : undefined;
    if (isNamedKind(input.kind)) {
      const clash = this.data.connections.find(
        (entry) => entry.kind === input.kind && entry.id !== existing?.id,
      );
      if (clash) throw new Error(`A ${input.kind} connection already exists.`);
    } else {
      const clash = this.data.connections.find(
        (entry) =>
          entry.kind === "custom" &&
          entry.id !== existing?.id &&
          entry.label.toLowerCase() === input.label.toLowerCase(),
      );
      if (clash) throw new Error("A custom provider with this label already exists.");
    }

    const now = new Date().toISOString();
    const id =
      existing?.id ??
      (isNamedKind(input.kind)
        ? input.kind
        : `custom-${slug(input.label)}${this.data.connections.some((entry) => entry.id === `custom-${slug(input.label)}`) ? `-${Date.now().toString(36)}` : ""}`);

    const secret: Secret = {
      ...(existing?.secret.apiKey && !input.apiKey ? { apiKey: existing.secret.apiKey } : {}),
      ...(input.apiKey ? { apiKey: input.apiKey } : {}),
      ...(existing?.secret.accessToken && !input.accessToken ? { accessToken: existing.secret.accessToken } : {}),
      ...(input.accessToken ? { accessToken: input.accessToken } : {}),
      ...(input.accountId ? { accountId: input.accountId } : {}),
    };
    if (input.kind === "codex" && !secret.accessToken && existing?.secret.accessToken) {
      secret.accessToken = existing.secret.accessToken;
    }
    if (input.kind === "codex" && !secret.accountId && existing?.secret.accountId) {
      secret.accountId = existing.secret.accountId;
    }

    const connection: StoredConnection = {
      id,
      kind: input.kind,
      label: input.label,
      ...(input.endpoint ? { endpoint: input.endpoint } : existing?.endpoint ? { endpoint: existing.endpoint } : {}),
      ...(secret.accountId ? { accountId: secret.accountId } : {}),
      createdAt: existing?.createdAt ?? now,
      secret,
    };

    this.data.connections = existing
      ? this.data.connections.map((entry) => (entry.id === id ? connection : entry))
      : [...this.data.connections, connection];
    await this.save();
    return toPublic(connection);
  }

  async remove(id: string): Promise<boolean> {
    const before = this.data.connections.length;
    this.data.connections = this.data.connections.filter((entry) => entry.id !== id);
    if (this.data.connections.length === before) return false;
    await this.save();
    return true;
  }

  async setTestResult(id: string, result: Connection["lastTestResult"]): Promise<void> {
    const entry = this.get(id);
    if (!entry) return;
    entry.lastTestAt = new Date().toISOString();
    entry.lastTestResult = result;
    await this.save();
  }
}

export { toPublic };
