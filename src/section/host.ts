import type { HostClient } from "@openchamber/sdk";

export type ServiceCall = (input: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
}) => Promise<{ status: number; body: unknown }>;

export const serviceCall = (host: Pick<HostClient, "serviceRequest">): ServiceCall =>
  async (input) => {
    const response = await host.serviceRequest({
      method: input.method,
      path: input.path,
      ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
    });
    let body: unknown = response.body;
    if (typeof response.body === "string") {
      try {
        body = JSON.parse(response.body);
      } catch {
        body = null;
      }
    }
    return { status: response.status, body };
  };
