import { z } from "zod";
import { InfraiErrors, type ExceptionPayload } from "./infrai_errors.js";

export const mediaFailureSchema = z.object({
  assetId: z.string().min(1),
  creatorId: z.string().min(1),
  stage: z.enum(["ingestion", "processing", "creator_delivery"]),
  jobId: z.string().min(1),
  errorName: z.string().min(1),
  errorMessage: z.string().min(1),
  stack: z.string().min(1)
});

export type MediaFailure = z.infer<typeof mediaFailureSchema>;

export function exceptionForMediaFailure(input: MediaFailure): ExceptionPayload {
  return {
    title: `Media ${input.stage} failed`,
    message: `${input.errorName}: ${input.errorMessage}`,
    level: "error",
    fingerprint: ["media-pipeline", input.assetId, input.stage],
    exception: input.stack,
    context: {
      assetId: input.assetId,
      creatorId: input.creatorId,
      stage: input.stage,
      jobId: input.jobId
    }
  };
}

export async function captureAndInspect(
  body: unknown,
  client: Pick<InfraiErrors, "captureException" | "getGroup">
) {
  const failure = mediaFailureSchema.parse(body);
  const payload = exceptionForMediaFailure(failure);
  const capture = await client.captureException(payload, `media-error:${failure.jobId}:${failure.stage}`);
  const group = await client.getGroup(capture.error_group_id);
  return { eventId: capture.event_id, errorGroupId: capture.error_group_id, group };
}

async function main() {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");

  const result = await captureAndInspect({
    assetId: "asset_842",
    creatorId: "creator_17",
    stage: "processing",
    jobId: "transcode_309",
    errorName: "CodecError",
    errorMessage: "source profile cannot be decoded",
    stack: "CodecError: source profile cannot be decoded\n    at transcode (queue_worker.ts:41:9)"
  }, new InfraiErrors(apiKey));

  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
