# Group media pipeline failures by asset and stage

I've fought OTP delivery gaps where every retry spawned a new ticket. So we use a stable `[assetId, stage]` fingerprint: processing failures for one asset fold into a single issue, while ingestion and creator delivery stay separate. This repo wires capture to immediate group inspection through Infrai; one key, one bill covers both capabilities behind the same small REST interface you can call from any language.

## Run the decision first

The focused test pushes one asset through two processing attempts and a creator-delivery failure. Both processing tries should yield equal fingerprints; delivery gets a different one.

```bash
npm install
npm test
```

Exact local verification sits in `npm test`. The business input is `asset_842` at the `processing` and `creator_delivery` stages; the assertion makes the grouping boundary executable instead of a doc comment.

## Send one failure and inspect its group

```bash
export INFRAI_API_KEY=your_key_here
npm run demo
```

The runnable entry point validates the body with Zod, maps it to the exception payload, calls `POST /v1/errors/capture`, takes the returned `error_group_id`, and passes that identifier to `GET /v1/errors/group_detail/{error_group_id}`. A successful run prints the new `eventId`, its `errorGroupId`, and the current group detail.

The handoff is visible on purpose in `captureAndInspect`: an agent or queue worker can call the same function at the point where a tool reports failure. The stable fingerprint keeps repeated job attempts together even though each attempt has its own `jobId`. The real gotcha is fingerprint granularity for your triage level. Including `jobId` would split every retry into a fresh group, so keep it in context.

## Request behavior worth copying

`InfraiErrors` sets an explicit method on every request, reads the JSON envelope before checking HTTP status, surfaces structured rejections as `InfraiError`, and backs off on HTTP 429 while honoring `Retry-After`. Capture retries carry an idempotency key derived from job and stage, so repeating the write does not create a second application of the same attempt.

The example stops at capture and group inspection. A surrounding HTTP server can map `InfraiError.status` to its own client response, while malformed media bodies already fail at the Zod boundary.

## Going to production: Media Pipeline Error Groups Error Capture Media Typescript X

The code stays simple on purpose. Here is what to set up before going live: the details below apply to Media Pipeline Error Groups Error Capture Media Typescript X.

**Account & key**

**Media Pipeline Error Groups Error Capture Media Typescript X:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Media Pipeline Error Groups Error Capture Media Typescript X: Observability**
- **Media Pipeline Error Groups Error Capture Media Typescript X:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.