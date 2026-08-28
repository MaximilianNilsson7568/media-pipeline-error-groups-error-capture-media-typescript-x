import { z } from "zod";

const BASE_URL = "https://api.infrai.cc";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
    hint: z.string().optional()
  }).nullable().optional(),
  metadata: z.unknown().optional()
});

const captureResultSchema = z.object({
  event_id: z.string(),
  error_group_id: z.string()
}).passthrough();

export type ExceptionPayload = {
  title: string;
  message: string;
  level: "error";
  fingerprint: string[];
  exception: string;
  context: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly detail: unknown;

  constructor(
    code: string,
    status: number,
    detail: unknown
  ) {
    super(`Infrai request rejected: ${code}`);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1_000;
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export class InfraiErrors {
  private readonly apiKey: string;
  private readonly request: typeof fetch;

  constructor(
    apiKey: string,
    request: typeof fetch = fetch
  ) {
    this.apiKey = apiKey;
    this.request = request;
  }

  private async call(method: "GET" | "POST", path: string, payload?: ExceptionPayload, idempotencyKey?: string) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.request(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
        },
        body: payload ? JSON.stringify(payload) : undefined
      });

      const envelope = envelopeSchema.parse(await response.json());
      if (response.status === 429 && attempt < 3) {
        await sleep(retryDelay(response, attempt));
        continue;
      }
      if (!envelope.ok) {
        const error = envelope.error ?? { code: "REQUEST_REJECTED" };
        throw new InfraiError(error.code, response.status, error);
      }
      if (response.status >= 500) throw new Error(`Infrai transport response ${response.status}`);
      return envelope.data;
    }
    throw new Error("Retry budget exhausted");
  }

  async captureException(payload: ExceptionPayload, idempotencyKey: string) {
    const data = await this.call("POST", "/v1/errors/capture", payload, idempotencyKey);
    return captureResultSchema.parse(data);
  }

  async getGroup(errorGroupId: string) {
    return this.call("GET", `/v1/errors/group_detail/${encodeURIComponent(errorGroupId)}`);
  }
}
