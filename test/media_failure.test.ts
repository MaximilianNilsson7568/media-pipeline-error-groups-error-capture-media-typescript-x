import assert from "node:assert/strict";
import test from "node:test";
import { exceptionForMediaFailure } from "../src/media_pipeline.js";

const baseFailure = {
  assetId: "asset_842",
  creatorId: "creator_17",
  jobId: "job_1",
  errorName: "CodecError",
  errorMessage: "decode failed",
  stack: "CodecError: decode failed"
} as const;

test("retries of one asset stage share a group while delivery stays separate", () => {
  const first = exceptionForMediaFailure({ ...baseFailure, stage: "processing" });
  const retry = exceptionForMediaFailure({ ...baseFailure, jobId: "job_2", stage: "processing" });
  const delivery = exceptionForMediaFailure({ ...baseFailure, stage: "creator_delivery" });

  assert.deepEqual(first.fingerprint, retry.fingerprint);
  assert.notDeepEqual(first.fingerprint, delivery.fingerprint);
  assert.deepEqual(first.fingerprint, ["media-pipeline", "asset_842", "processing"]);
});
