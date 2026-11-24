import { readFile } from "node:fs/promises";

export const loadCaBundle = async (path: string | undefined): Promise<string | undefined> => {
  if (!path) return undefined;
  return readFile(path, "utf8");
};
